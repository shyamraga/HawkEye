import unittest
import numpy as np
from court_calibration import CourtCalibration, check_in_out
from ball_tracking import KalmanFilter2DAcc
from bounce_detector import BounceDetector

class TestTennisAlgorithms(unittest.TestCase):
    
    def setUp(self):
        # Setup standard singles corners in world coordinates (m)
        self.world_corners = [
            [1.37, 0.0],     # Top-Left Singles
            [9.60, 0.0],     # Top-Right Singles
            [1.37, 23.77],   # Bottom-Left Singles
            [9.60, 23.77]    # Bottom-Right Singles
        ]
        # Simulated camera perspective corners (pixels)
        self.image_corners = [
            [-457.3, 1026.7],
            [1737.3, 1026.7],
            [517.0, 434.7],
            [763.0, 434.7]
        ]
        self.calib = CourtCalibration()
        self.calib.compute_homography(self.image_corners, self.world_corners)

    def test_court_calibration(self):
        """Test if homography maps image corners back to world coordinates correctly."""
        for i, img_pt in enumerate(self.image_corners):
            world_pt = self.calib.image_to_world(img_pt[0], img_pt[1])
            np.testing.assert_almost_equal(world_pt[0], self.world_corners[i][0], decimal=1)
            np.testing.assert_almost_equal(world_pt[1], self.world_corners[i][1], decimal=1)

    def test_reverse_mapping(self):
        """Test if reverse mapping (world to image) works."""
        for i, world_pt in enumerate(self.world_corners):
            img_pt = self.calib.world_to_image(world_pt[0], world_pt[1])
            np.testing.assert_almost_equal(img_pt[0], self.image_corners[i][0], decimal=0)
            np.testing.assert_almost_equal(img_pt[1], self.image_corners[i][1], decimal=0)

    def test_in_out_rules(self):
        """Test tennis rule boundary checks for IN, line-touching, and OUT."""
        # Baseline is at Y = 23.77. Singles sideline is at X = 1.37.
        
        # 1. Clear IN (middle of the court)
        decision, dist = check_in_out(5.0, 12.0)
        self.assertEqual(decision, "IN")
        
        # 2. Clear OUT (far long)
        decision, dist = check_in_out(5.0, 24.50) # 24.5m is > 23.77m + 0.033m
        self.assertEqual(decision, "OUT")
        
        # 3. Touch the baseline (overlap: lands at 23.79m, which is outside by 2cm, but ball radius is 3.3cm)
        decision, dist = check_in_out(5.0, 23.79)
        self.assertEqual(decision, "IN")
        self.assertLessEqual(dist, 3.3)
        
        # 4. Lands exactly outside by 3.4cm (offset = 0.1cm OUT)
        decision, dist = check_in_out(5.0, 23.77 + 0.034)
        self.assertEqual(decision, "OUT")
        np.testing.assert_almost_equal(dist, 0.1, decimal=2) # 0.1 cm OUT

    def test_kalman_filter_constant_velocity(self):
        """Test that the Kalman Filter converges to tracking a straight line trajectory."""
        dt = 1.0/60.0
        tracker = KalmanFilter2DAcc(dt=dt, process_noise=1.5, measurement_noise=0.5)
        tracker.initialize(100.0, 100.0)
        
        # Simulate moving at constant velocity vx = 60 px/s, vy = 60 px/s (1 px/frame)
        x_true, y_true = 100.0, 100.0
        for _ in range(30):
            x_true += 1.0
            y_true += 1.0
            tracker.predict()
            u, v = tracker.update(x_true + np.random.normal(0, 0.5), y_true + np.random.normal(0, 0.5))
            
        # Filter should be tracking very close to the true coordinates
        self.assertLess(abs(tracker.x[0, 0] - x_true), 2.0)
        self.assertLess(abs(tracker.x[1, 0] - y_true), 2.0)

    def test_bounce_detection(self):
        """Test that a trajectory deflection triggers a bounce exactly at inflection."""
        dt = 1.0/60.0
        detector = BounceDetector(window_size=7)
        
        # Simulate a vertical trajectory (falling, bouncing, and rising)
        # falling: y increases (e.g. from 100 to 125, +2 pixels per frame)
        # bouncing: y decreases (e.g. from 125 to 110, -3 pixels per frame)
        traj_y = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 125, 122, 119, 116, 113, 110]
        traj_x = [200 + i for i in range(len(traj_y))]
        
        bounce_detected = False
        bounce_info = None
        
        for i in range(len(traj_y)):
            t = i * dt
            # Feed positions into detector
            is_bounce, info = detector.add_point(traj_x[i], traj_y[i], 0.0, 0.0, 0.0, 0.0, t)
            if is_bounce:
                bounce_detected = True
                bounce_info = info
                break
                
        self.assertTrue(bounce_detected)
        # Bounce should have occurred around frame 13 (Y = 126, the peak deflection)
        self.assertEqual(bounce_info['frame_index'], 13 * dt)

if __name__ == '__main__':
    unittest.main()
