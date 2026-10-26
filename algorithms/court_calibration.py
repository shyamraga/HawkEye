import numpy as np

# Standard Tennis Court Dimensions (in meters)
# Origin (0,0) is the top-left corner of the doubles court boundary.
COURT_WIDTH_DOUBLES = 10.97
COURT_WIDTH_SINGLES = 8.23
COURT_LENGTH = 23.77
ALLEY_WIDTH = 1.37 # Distance from doubles sideline to singles sideline
NET_Y = 11.89      # Net is exactly halfway
SERVICE_LINE_DIST = 6.4 # Service line is 6.4m from net
SERVICE_LINE_FAR = NET_Y + SERVICE_LINE_DIST # 18.29m
SERVICE_LINE_NEAR = NET_Y - SERVICE_LINE_DIST # 5.49m
CENTER_LINE_X = COURT_WIDTH_DOUBLES / 2.0 # 5.485m

class CourtCalibration:
    def __init__(self):
        self.H = None    # Homography matrix: image -> world
        self.H_inv = None # Homography matrix: world -> image

    def compute_homography(self, src_pts, dst_pts):
        """
        Compute the Homography matrix H using Direct Linear Transform (DLT).
        src_pts: list/array of 4 points in image coordinates [[x1, y1], [x2, y2], ...]
        dst_pts: list/array of 4 points in world coordinates [[X1, Y1], [X2, Y2], ...]
        """
        src = np.array(src_pts, dtype=np.float64)
        dst = np.array(dst_pts, dtype=np.float64)
        
        A = []
        for i in range(4):
            x, y = src[i][0], src[i][1]
            X, Y = dst[i][0], dst[i][1]
            A.append([-x, -y, -1, 0, 0, 0, x * X, y * X, X])
            A.append([0, 0, 0, -x, -y, -1, x * Y, y * Y, Y])
            
        A = np.array(A)
        # SVD solver
        U, S, Vh = np.linalg.svd(A)
        # H is the last row of Vh (or last column of V)
        h = Vh[-1]
        self.H = h.reshape((3, 3))
        self.H /= self.H[2, 2] # Normalize H
        self.H_inv = np.linalg.inv(self.H)
        return self.H

    def image_to_world(self, x, y):
        """Map image point (x, y) to world (X_w, Y_w)"""
        if self.H is None:
            raise ValueError("Homography not computed yet.")
        pt = np.array([x, y, 1.0])
        res = np.dot(self.H, pt)
        return res[0] / res[2], res[1] / res[2]

    def world_to_image(self, X, Y):
        """Map world point (X, Y) to image (x, y)"""
        if self.H_inv is None:
            raise ValueError("Homography not computed yet.")
        pt = np.array([X, Y, 1.0])
        res = np.dot(self.H_inv, pt)
        return int(round(res[0] / res[2])), int(round(res[1] / res[2]))

def get_playable_polygon(mode="singles", shot_type="rally"):
    """
    Returns the bounding polygon points [[xmin, ymin], [xmax, ymax]]
    for the playable area under the specified match mode and shot type.
    """
    # X boundaries
    if mode == "singles":
        x_min, x_max = ALLEY_WIDTH, COURT_WIDTH_DOUBLES - ALLEY_WIDTH
    else: # doubles
        x_min, x_max = 0.0, COURT_WIDTH_DOUBLES

    # Y boundaries depending on shot type
    if shot_type == "rally":
        y_min, y_max = 0.0, COURT_LENGTH
    elif shot_type == "serve_far_deuce":
        # Far side service box, right side from server perspective (which is left side 1.37 to 5.485)
        x_min, x_max = ALLEY_WIDTH, CENTER_LINE_X
        y_min, y_max = NET_Y, SERVICE_LINE_FAR
    elif shot_type == "serve_far_ad":
        # Far side service box, left side from server perspective (which is right side 5.485 to 9.60)
        x_min, x_max = CENTER_LINE_X, COURT_WIDTH_DOUBLES - ALLEY_WIDTH
        y_min, y_max = NET_Y, SERVICE_LINE_FAR
    elif shot_type == "serve_near_deuce":
        x_min, x_max = CENTER_LINE_X, COURT_WIDTH_DOUBLES - ALLEY_WIDTH
        y_min, y_max = SERVICE_LINE_NEAR, NET_Y
    elif shot_type == "serve_near_ad":
        x_min, x_max = ALLEY_WIDTH, CENTER_LINE_X
        y_min, y_max = SERVICE_LINE_NEAR, NET_Y
    else:
        # Fallback to full singles court
        x_min, x_max = ALLEY_WIDTH, COURT_WIDTH_DOUBLES - ALLEY_WIDTH
        y_min, y_max = 0.0, COURT_LENGTH
        
    return x_min, x_max, y_min, y_max

def check_in_out(X, Y, mode="singles", shot_type="rally", ball_radius=0.033):
    """
    Checks if a ball landing center (X, Y) in world coordinates is IN or OUT.
    A ball is IN if it lies inside or within ball_radius of the playable boundary.
    """
    x_min, x_max, y_min, y_max = get_playable_polygon(mode, shot_type)
    
    # Check if inside the polygon
    is_inside = (x_min <= X <= x_max) and (y_min <= Y <= y_max)
    
    if is_inside:
        # Calculate distance to nearest boundary line for statistics
        dx = min(X - x_min, x_max - X)
        dy = min(Y - y_min, y_max - Y)
        dist_to_line = min(dx, dy)
        return "IN", dist_to_line * 100.0 # Return in cm
    
    # If outside, calculate distance to the bounding box
    dx = 0.0
    if X < x_min:
        dx = x_min - X
    elif X > x_max:
        dx = X - x_max
        
    dy = 0.0
    if Y < y_min:
        dy = y_min - Y
    elif Y > y_max:
        dy = Y - y_max
        
    # Total distance to the bounding box
    dist_to_line = np.sqrt(dx**2 + dy**2)
    
    if dist_to_line <= ball_radius:
        # Compressed ball touches the line!
        return "IN", dist_to_line * 100.0 # Return in cm
    else:
        # It's OUT
        offset = dist_to_line - ball_radius
        return "OUT", offset * 100.0 # Return offset in cm
