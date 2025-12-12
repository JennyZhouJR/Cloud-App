import { Landmark } from '../types';

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const distance = (a: Landmark, b: Landmark) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};

// Calculate angle in degrees between two points
export const calculateAngle = (a: Landmark, b: Landmark) => {
  const deltaY = b.y - a.y;
  const deltaX = b.x - a.x;
  const rad = Math.atan2(deltaY, deltaX);
  return rad * (180 / Math.PI);
};

export const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};
