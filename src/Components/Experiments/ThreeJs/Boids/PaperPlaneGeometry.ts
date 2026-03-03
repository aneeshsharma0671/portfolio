import * as THREE from "three";

export function createPaperPlaneGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Paper plane vertices (simple origami-style)
  const vertices = new Float32Array([
    // Main body triangle
    0,
    0,
    0.4, // nose
    -0.15,
    0,
    -0.4, // left back
    0.15,
    0,
    -0.4, // right back

    // Left wing
    0,
    0,
    0.4, // nose
    -0.15,
    0,
    -0.4, // left back
    -0.4,
    0.05,
    -0.2, // left wing tip

    // Right wing
    0,
    0,
    0.4, // nose
    0.15,
    0,
    -0.4, // right back
    0.4,
    0.05,
    -0.2, // right wing tip

    // Bottom fold left
    0,
    0,
    0.4,
    -0.15,
    0,
    -0.4,
    -0.4,
    -0.05,
    -0.2,

    // Bottom fold right
    0,
    0,
    0.4,
    0.15,
    0,
    -0.4,
    0.4,
    -0.05,
    -0.2,
  ]);

  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();

  return geometry;
}
