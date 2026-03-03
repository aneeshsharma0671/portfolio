"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./ThreeJsScene.module.css";

type SceneObjects = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cube: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  ambientLight: THREE.AmbientLight;
  directionalLight: THREE.DirectionalLight;
};

export default function ThreeJsScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sceneObjectsRef = useRef<SceneObjects | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f172a");

    const initialWidth = container.clientWidth || window.innerWidth;
    const initialHeight = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(
      75,
      initialWidth / initialHeight,
      0.1,
      1000,
    );
    camera.position.z = 2.25;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initialWidth, initialHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: "#38bdf8",
      roughness: 0.4,
      metalness: 0.2,
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const ambientLight = new THREE.AmbientLight("#ffffff", 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight("#ffffff", 1.1);
    directionalLight.position.set(4, 4, 4);
    scene.add(directionalLight);

    sceneObjectsRef.current = {
      renderer,
      scene,
      camera,
      cube,
      ambientLight,
      directionalLight,
    };

    const handleResize = (): void => {
      if (!container || !sceneObjectsRef.current) {
        return;
      }

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const { camera: activeCamera, renderer: activeRenderer } =
        sceneObjectsRef.current;

      activeCamera.aspect = width / height;
      activeCamera.updateProjectionMatrix();
      activeRenderer.setSize(width, height);
      activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    const animate = (): void => {
      const current = sceneObjectsRef.current;
      if (!current) {
        return;
      }

      current.cube.rotation.x += 0.01;
      current.cube.rotation.y += 0.0125;
      current.renderer.render(current.scene, current.camera);
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      const current = sceneObjectsRef.current;
      if (!current) {
        return;
      }

      current.cube.geometry.dispose();
      current.cube.material.dispose();
      current.renderer.dispose();

      if (current.renderer.domElement.parentElement === container) {
        container.removeChild(current.renderer.domElement);
      }

      sceneObjectsRef.current = null;
    };
  }, []);

  return (
    <section className={styles.root}>
      <div className={styles.overlay}>Three.js experiment</div>
      <div ref={containerRef} className={styles.canvasHost} />
    </section>
  );
}
