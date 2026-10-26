import numpy as np

class BounceDetector:
    def __init__(self, window_size=7):
        self.window_size = window_size
        self.history = [] # list of dicts: {'x': x, 'y': y, 't': t}

    def add_point(self, x, y, vx, vy, ax, ay, t):
        """Add a tracked state point to history and check if a bounce occurred."""
        point = {'x': x, 'y': y, 't': t}
        self.history.append(point)
        if len(self.history) > self.window_size:
            self.history.pop(0)

        return self.detect_bounce()

    def detect_bounce(self):
        """
        Detects a bounce by analyzing local differences in the window history.
        """
        if len(self.history) < 6:
            return False, None

        # 1. Compute velocity as the first-order difference
        for i in range(1, len(self.history)):
            self.history[i]['vx_diff'] = self.history[i]['x'] - self.history[i-1]['x']
            self.history[i]['vy_diff'] = self.history[i]['y'] - self.history[i-1]['y']

        # Let's inspect the middle transition point.
        mid_idx = len(self.history) // 2 # usually 3
        
        # We check average vy_diff before and after the middle transition point (mid_idx)
        vy_before = [self.history[i]['vy_diff'] for i in range(1, mid_idx)]
        vy_after = [self.history[i]['vy_diff'] for i in range(mid_idx, len(self.history))]
        
        avg_vy_before = np.mean(vy_before)
        avg_vy_after = np.mean(vy_after)
        
        # Check for velocity flip. The difference should be opposite in sign
        sign_flip = (avg_vy_before > 0.2 and avg_vy_after < -0.2) or (avg_vy_before < -0.2 and avg_vy_after > 0.2)
        
        # Check if the magnitude of the velocity change is substantial (indicating a bounce impulse)
        vel_change = abs(avg_vy_before - avg_vy_after)
        is_bounce_impulse = vel_change > 2.0 # Significant jump in pixels/frame

        # Print diagnostics for debugging
        t_mid = self.history[mid_idx]['t']
        print(f"Frame t={t_mid:.3f}: sign_flip={sign_flip}, vel_change={vel_change:.2f} (before={avg_vy_before:.2f}, after={avg_vy_after:.2f})")

        if sign_flip and is_bounce_impulse:
            # We refine the bounce location using curve fitting
            bounce_point = self.refine_bounce_point(mid_idx)
            return True, bounce_point
            
        return False, None

    def refine_bounce_point(self, mid_idx):
        """
        Fits lines to the incoming trajectory and outgoing trajectory
        and intersects them to find the sub-frame bounce coordinates.
        """
        # Incoming points (before bounce, indices up to mid_idx)
        pts_in = self.history[:mid_idx+1]
        # Outgoing points (after bounce, indices from mid_idx+1 onwards)
        pts_out = self.history[mid_idx+1:]

        # Fit linear equations x = m*t + c and y = m*t + c for incoming and outgoing
        t_in = np.array([pt['t'] for pt in pts_in])
        x_in = np.array([pt['x'] for pt in pts_in])
        y_in = np.array([pt['y'] for pt in pts_in])

        t_out = np.array([pt['t'] for pt in pts_out])
        x_out = np.array([pt['x'] for pt in pts_out])
        y_out = np.array([pt['y'] for pt in pts_out])

        # Quadratic fit for y (arc) and linear for x (constant lateral speed)
        py_in = np.polyfit(t_in, y_in, 2)
        py_out = np.polyfit(t_out, y_out, 2)
        
        px_in = np.polyfit(t_in, x_in, 1)
        px_out = np.polyfit(t_out, x_out, 1)

        # Solve py_in(t) = py_out(t) -> a*t^2 + b*t + c = 0
        a = py_in[0] - py_out[0]
        b = py_in[1] - py_out[1]
        c = py_in[2] - py_out[2]
        
        t_bounce = self.history[mid_idx]['t'] # Default fallback
        
        if abs(a) > 1e-5:
            discriminant = b**2 - 4*a*c
            if discriminant >= 0:
                roots = np.roots([a, b, c])
                t_mid = self.history[mid_idx]['t']
                closest_root = min(roots, key=lambda r: abs(r - t_mid))
                # Verify root is within reasonable bounds
                if self.history[0]['t'] <= closest_root <= self.history[-1]['t']:
                    t_bounce = closest_root
        
        # Interpolate coordinates
        x_bounce = np.polyval(px_in, t_bounce) if t_bounce <= self.history[mid_idx]['t'] else np.polyval(px_out, t_bounce)
        y_bounce = np.polyval(py_in, t_bounce) if t_bounce <= self.history[mid_idx]['t'] else np.polyval(py_out, t_bounce)

        return {
            'x': float(x_bounce),
            'y': float(y_bounce),
            't': float(t_bounce),
            'frame_index': self.history[mid_idx]['t']
        }
