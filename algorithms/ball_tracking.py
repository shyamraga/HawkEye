import numpy as np

class KalmanFilter2DAcc:
    def __init__(self, dt=1.0/60.0, process_noise=0.1, measurement_noise=2.0):
        self.dt = dt
        
        # State vector: [x, y, vx, vy, ax, ay]^T
        self.x = np.zeros((6, 1))
        
        # State covariance matrix
        self.P = np.eye(6) * 100.0
        
        # State transition matrix F
        self.F = np.array([
            [1, 0, dt, 0, 0.5 * dt**2, 0],
            [0, 1, 0, dt, 0, 0.5 * dt**2],
            [0, 0, 1, 0, dt, 0],
            [0, 0, 0, 1, 0, dt],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1]
        ])
        
        # Measurement matrix H (we only measure positions x and y)
        self.H = np.array([
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0]
        ])
        
        # Process noise covariance Q
        q = process_noise
        self.Q = np.eye(6) * q
        
        # Measurement noise covariance R
        r = measurement_noise
        self.R = np.eye(2) * r
        
        self.initialized = False

    def initialize(self, init_x, init_y, init_vx=0.0, init_vy=0.0):
        self.x = np.array([[init_x], [init_y], [init_vx], [init_vy], [0.0], [0.0]], dtype=np.float64)
        self.P = np.eye(6) * 10.0
        self.initialized = True

    def predict(self):
        """Predict the next state based on physical transition model"""
        if not self.initialized:
            return None
        self.x = np.dot(self.F, self.x)
        self.P = np.dot(np.dot(self.F, self.P), self.F.T) + self.Q
        return self.x[0, 0], self.x[1, 0]

    def update(self, z_x, z_y):
        """Update the filter with an observed measurement (z_x, z_y)"""
        if not self.initialized:
            self.initialize(z_x, z_y)
            return z_x, z_y
            
        z = np.array([[z_x], [z_y]], dtype=np.float64)
        
        # Innovation (measurement residual)
        y = z - np.dot(self.H, self.x)
        
        # Innovation covariance
        S = np.dot(np.dot(self.H, self.P), self.H.T) + self.R
        
        # Kalman Gain
        K = np.dot(np.dot(self.P, self.H.T), np.linalg.inv(S))
        
        # Update state estimate
        self.x = self.x + np.dot(K, y)
        
        # Update state covariance
        I = np.eye(6)
        self.P = np.dot(I - np.dot(K, self.H), self.P)
        
        return self.x[0, 0], self.x[1, 0]

    def get_velocity(self):
        """Returns the current velocity estimate (vx, vy)"""
        return self.x[2, 0], self.x[3, 0]

    def get_acceleration(self):
        """Returns the current acceleration estimate (ax, ay)"""
        return self.x[4, 0], self.x[5, 0]
