import * as THREE from "three";

export class Boid {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  mesh: THREE.Mesh;
  maxSpeed: number;
  maxForce: number;

  constructor(
    position: THREE.Vector3,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    maxSpeed: number,
    maxForce: number,
  ) {
    this.position = position.clone();
    this.velocity = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    );
    this.velocity.setLength(Math.random() * maxSpeed * 0.5 + maxSpeed * 0.5);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.maxSpeed = maxSpeed;
    this.maxForce = maxForce;

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
  }

  applyForce(force: THREE.Vector3): void {
    this.acceleration.add(force);
  }

  update(): void {
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.multiplyScalar(0);

    // Update mesh position and rotation
    this.mesh.position.copy(this.position);

    // Orient the paper plane to face the direction of movement
    if (this.velocity.length() > 0.01) {
      const lookTarget = new THREE.Vector3()
        .copy(this.position)
        .add(this.velocity);
      this.mesh.lookAt(lookTarget);
    }
  }

  separation(boids: Boid[], distance: number): THREE.Vector3 {
    const steer = new THREE.Vector3(0, 0, 0);
    let count = 0;

    for (const other of boids) {
      const d = this.position.distanceTo(other.position);
      if (other !== this && d > 0 && d < distance) {
        const diff = new THREE.Vector3()
          .subVectors(this.position, other.position)
          .normalize()
          .divideScalar(d);
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.divideScalar(count);
      steer.setLength(this.maxSpeed);
      steer.sub(this.velocity);
      steer.clampLength(0, this.maxForce);
    }

    return steer;
  }

  alignment(boids: Boid[], distance: number): THREE.Vector3 {
    const sum = new THREE.Vector3(0, 0, 0);
    let count = 0;

    for (const other of boids) {
      const d = this.position.distanceTo(other.position);
      if (other !== this && d > 0 && d < distance) {
        sum.add(other.velocity);
        count++;
      }
    }

    if (count > 0) {
      sum.divideScalar(count);
      sum.setLength(this.maxSpeed);
      const steer = sum.sub(this.velocity);
      steer.clampLength(0, this.maxForce);
      return steer;
    }

    return new THREE.Vector3(0, 0, 0);
  }

  cohesion(boids: Boid[], distance: number): THREE.Vector3 {
    const sum = new THREE.Vector3(0, 0, 0);
    let count = 0;

    for (const other of boids) {
      const d = this.position.distanceTo(other.position);
      if (other !== this && d > 0 && d < distance) {
        sum.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      sum.divideScalar(count);
      return this.seek(sum);
    }

    return new THREE.Vector3(0, 0, 0);
  }

  seek(target: THREE.Vector3): THREE.Vector3 {
    const desired = new THREE.Vector3().subVectors(target, this.position);
    desired.setLength(this.maxSpeed);
    const steer = desired.sub(this.velocity);
    steer.clampLength(0, this.maxForce);
    return steer;
  }

  edges(bounds: number): void {
    if (this.position.x > bounds) this.position.x = -bounds;
    if (this.position.x < -bounds) this.position.x = bounds;
    if (this.position.y > bounds) this.position.y = -bounds;
    if (this.position.y < -bounds) this.position.y = bounds;
    if (this.position.z > bounds) this.position.z = -bounds;
    if (this.position.z < -bounds) this.position.z = bounds;
  }
}
