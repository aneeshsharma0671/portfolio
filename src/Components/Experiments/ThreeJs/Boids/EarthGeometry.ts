import * as THREE from "three";

export function createLowPolyEarthGeometry(
  radius: number = 2,
  detail: number = 4,
): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  return geometry;
}

export function createGradientTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Create gradient: from purple-blue at top to lighter blue at bottom
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#6b5bdb");
  gradient.addColorStop(0.5, "#8b7fe8");
  gradient.addColorStop(1, "#a8b5f0");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
