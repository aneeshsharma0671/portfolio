export type BoidConfig = {
  count: number;
  maxSpeed: number;
  maxForce: number;
  separationDistance: number;
  alignmentDistance: number;
  cohesionDistance: number;
  separationWeight: number;
  alignmentWeight: number;
  cohesionWeight: number;
  mouseWeight: number;
  showBoundaries: boolean;
};
