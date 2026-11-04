import React from 'react';

export const CameraView = ({ children, style }: any) => {
  return React.createElement('View', { style, testID: 'mock-camera-view' }, children);
};

export const useCameraPermissions = () => {
  return [
    { granted: true, canAskAgain: true, status: 'granted' },
    jest.fn().mockResolvedValue({ granted: true }),
  ];
};
