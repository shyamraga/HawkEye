import numpy as np
from court_calibration import CourtCalibration, check_in_out
from ball_tracking import KalmanFilter2DAcc
from bounce_detector import BounceDetector

def simulate_3d_trajectory(dt=1.0/60.0, shot_type="rally"):
    """
    Simulates a 3D tennis shot trajectory.
    Returns:
        t_array, world_xyz
    """
    # Camera settings: positioned behind the baseline (Y = -3.0m), centered (X = 5.485m), height = 2.5m
    cam_pos = np.array([5.485, -3.0, 2.5])
    
    # Initial state of ball:
    # Starts from near the server side (Y = 1.0m, X = 4.0m, Z = 1.2m)
    # Shoots towards far baseline (Y = 22.5m)
    pos = np.array([3.5, 1.0, 1.2]) # X, Y, Z (world coordinates)
    
    # Velocity (m/s)
    # Let's target a landing point near the far baseline (Y_target = 22.0m, X_target = 8.5m)
    # Flight time approx 0.8 seconds
    vel = np.array([5.5, 26.5, 3.2]) 
    
    gravity = -9.81
    air_resistance = -0.15 # drag coeff
    restitution = 0.72 # tennis ball bounce restitution
    
    t = 0.0
    trajectory = []
    has_bounced = False
    
    # Run simulation for 1.5 seconds
    for step in range(90):
        # Record state
        trajectory.append((t, pos.copy(), vel.copy()))
        
        # Physics update
        acc = np.array([0.0, 0.0, gravity]) + air_resistance * vel
        
        # Apply Euler integration
        pos += vel * dt + 0.5 * acc * dt**2
        vel += acc * dt
        
        # Ground bounce check (Z = 0)
        if pos[2] <= 0.0 and not has_bounced:
            # Sub-step interpolation to hit exactly Z = 0
            t_impact = t + (0.0 - (pos[2] - vel[2] * dt)) / vel[2]
            pos[2] = 0.0
            vel[2] = -vel[2] * restitution # Reflect velocity in Z
            vel[0] *= 0.8 # friction loses
            vel[1] *= 0.8 # friction loses
            has_bounced = True
            
        t += dt
        
    return trajectory

def project_3d_to_camera(world_pos, cam_pos, fx=800.0, fy=800.0, cx=640.0, cy=360.0):
    """
    Projects a 3D world point (X, Y, Z) to 2D image coordinates (u, v)
    using a pinhole camera projection matrix.
    """
    X, Y, Z = world_pos
    # Translate relative to camera
    Xc = X - cam_pos[0]
    Yc = Z - cam_pos[2] # Z in world is height, which maps to vertical camera coordinate
    Zc = Y - cam_pos[1] # Y in world is depth along court, which is camera depth
    
    # Project
    u = cx + (Xc / Zc) * fx
    v = cy - (Yc / Zc) * fy
    return u, v

def main():
    print("==================================================")
    print("TENNIS LINE CALLING SIMULATOR & ACCURACY TESTER")
    print("==================================================\n")
    
    # 1. Setup Court Calibration & Homography
    # We define 4 corner coordinates in the world coordinate system (Singles Court Corners)
    # Top-Left: (1.37, 0.0), Top-Right: (9.60, 0.0)
    # Bottom-Left: (1.37, 23.77), Bottom-Right: (9.60, 23.77)
    world_corners = [
        [1.37, 0.0],     # Top-Left Singles
        [9.60, 0.0],     # Top-Right Singles
        [1.37, 23.77],   # Bottom-Left Singles
        [9.60, 23.77]    # Bottom-Right Singles
    ]
    
    # Project these world corners to the camera image to simulate camera calibration detection
    cam_pos = np.array([5.485, -3.0, 2.5]) # Camera behind baseline, 2.5m high
    image_corners = []
    for corner in world_corners:
        u, v = project_3d_to_camera([corner[0], corner[1], 0.0], cam_pos)
        image_corners.append([u, v])
        
    print("Detected Court Corners in Camera Image (Pixels):")
    for i, corner in enumerate(image_corners):
        print(f"  Corner {i+1}: ({corner[0]:.1f}, {corner[1]:.1f}) -> World ({world_corners[i][0]}, {world_corners[i][1]})")
    
    # Initialize Court Calibration
    calib = CourtCalibration()
    calib.compute_homography(image_corners, world_corners)
    print("\n[OK] Court Calibration Loaded. Homography matrix computed.")
    
    # 2. Simulate 3D Shot Trajectory
    dt = 1.0 / 60.0 # 60 FPS
    sim_traj = simulate_3d_trajectory(dt)
    
    # Find the true bounce point in simulation for comparison
    true_bounce_idx = None
    for i in range(1, len(sim_traj)):
        # True bounce is where velocity Z flipped
        if sim_traj[i][2][2] > 0 and sim_traj[i-1][2][2] < 0:
            true_bounce_idx = i - 1
            break
            
    true_bounce_world = sim_traj[true_bounce_idx][1]
    print(f"\nSimulation True Bounce Point (World): X = {true_bounce_world[0]:.4f}m, Y = {true_bounce_world[1]:.4f}m, Z = 0.00m")
    
    # Check true outcome (Regulation Singles Court: X in [1.37, 9.60], Y in [0.0, 23.77])
    # The baseline of the far court is at Y = 23.77m
    true_decision, true_dist = check_in_out(true_bounce_world[0], true_bounce_world[1], mode="singles", shot_type="rally")
    print(f"True Rule Decision: {true_decision} (Distance to nearest line: {true_dist:.2f} cm)")
    
    # 3. Process through Kalman Filter and Bounce Detector
    tracker = KalmanFilter2DAcc(dt=dt, process_noise=1.5, measurement_noise=0.5)
    detector = BounceDetector(window_size=7)
    
    detected_bounce_img = None
    detected_bounce_t = None
    
    print("\nRunning tracking pipeline on camera frames...")
    
    for i, (t, pos, vel) in enumerate(sim_traj):
        # Project 3D point to 2D image coordinates
        u_true, v_true = project_3d_to_camera(pos, cam_pos)
        
        # Add YOLO detection noise (simulate standard deviation of 1 pixel)
        u_meas = u_true + np.random.normal(0, 1.0)
        v_meas = v_true + np.random.normal(0, 1.0)
        
        # Update Kalman Filter
        if not tracker.initialized:
            tracker.initialize(u_meas, v_meas)
            u_est, v_est = u_meas, v_meas
        else:
            tracker.predict()
            u_est, v_est = tracker.update(u_meas, v_meas)
            
        # Get velocity and acceleration estimates
        vx_est, vy_est = tracker.get_velocity()
        ax_est, ay_est = tracker.get_acceleration()
        
        # Add to Bounce Detector (only after letting Kalman filter settle for 20 frames)
        if i >= 20:
            bounce_found, bounce_info = detector.add_point(u_est, v_est, vx_est, vy_est, ax_est, ay_est, t)
        else:
            bounce_found = False
        
        if bounce_found:
            detected_bounce_img = (bounce_info['x'], bounce_info['y'])
            detected_bounce_t = bounce_info['t']
            print(f"  [!] Bounce detected at t = {detected_bounce_t:.4f}s (Frame {i-3})")
            print(f"  Image Coordinates: u = {detected_bounce_img[0]:.2f} px, v = {detected_bounce_img[1]:.2f} px")
            break
            
    # 4. Map back to world coordinate and make decision
    if detected_bounce_img is not None:
        est_X, est_Y = calib.image_to_world(detected_bounce_img[0], detected_bounce_img[1])
        print(f"\nEstimated Bounce Point (World): X = {est_X:.4f}m, Y = {est_Y:.4f}m")
        
        # Run In/Out Decision
        est_decision, est_dist = check_in_out(est_X, est_Y, mode="singles", shot_type="rally")
        print(f"Estimated Decision: {est_decision} (Distance to nearest line: {est_dist:.2f} cm)")
        
        # Accuracy Metrics
        error_x = (est_X - true_bounce_world[0]) * 1000.0 # mm
        error_y = (est_Y - true_bounce_world[1]) * 1000.0 # mm
        total_error = np.sqrt(error_x**2 + error_y**2)
        
        print("\n==================================================")
        print("PERFORMANCE METRICS:")
        print(f"  X-Axis Error: {error_x:+.1f} mm")
        print(f"  Y-Axis (Depth) Error: {error_y:+.1f} mm")
        print(f"  Total Euclidean Error: {total_error:.1f} mm")
        print(f"  Decision Match: {'SUCCESS' if est_decision == true_decision else 'FAILED'}")
        print("==================================================")
    else:
        print("\n[ERROR] Bounce not detected by tracking engine.")

if __name__ == '__main__':
    main()
