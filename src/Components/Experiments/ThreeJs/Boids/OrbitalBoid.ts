import * as THREE from "three";

export class OrbitalBoid {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  mesh: THREE.Mesh;
  orbitRadius: number;
  orbitSpeed: number;
  angle: number;
  inclination: number;

  constructor(
    orbitRadius: number,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    orbitSpeed: number,
  ) {
    this.orbitRadius = orbitRadius;
    this.orbitSpeed = orbitSpeed + (Math.random() - 0.5) * 0.002;
    this.angle = Math.random() * Math.PI * 2;
    this.inclination = Math.random() * Math.PI * 2;

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);

    this.mesh = new THREE.Mesh(geometry, material);
    this.updatePosition();
  }

  private updatePosition(): void {
    // Calculate orbital position
    const x =
      this.orbitRadius * Math.cos(this.angle) * Math.cos(this.inclination);
    const y = this.orbitRadius * Math.sin(this.inclination);
    const z =
      this.orbitRadius * Math.sin(this.angle) * Math.cos(this.inclination);

    this.position.set(x, y, z);
    this.mesh.position.copy(this.position);

    // Make planes face the direction of travel
    const nextAngle = this.angle + this.orbitSpeed;
    const nextX =
      this.orbitRadius * Math.cos(nextAngle) * Math.cos(this.inclination);
    const nextY = this.orbitRadius * Math.sin(this.inclination);
    const nextZ =
      this.orbitRadius * Math.sin(nextAngle) * Math.cos(this.inclination);

    const lookTarget = new THREE.Vector3(nextX, nextY, nextZ);
    this.mesh.lookAt(lookTarget);
  }

  update(): void {
    this.angle += this.orbitSpeed;

    // Normalize angle to prevent floating point issues
    if (this.angle > Math.PI * 2) {
      this.angle -= Math.PI * 2;
    }

    this.updatePosition();
  }
}
