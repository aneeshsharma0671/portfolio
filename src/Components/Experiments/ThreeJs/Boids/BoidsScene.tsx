"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createPaperPlaneGeometry } from "./PaperPlaneGeometry";
import { createLowPolyEarthGeometry } from "./EarthGeometry";
import { OrbitalBoid } from "./OrbitalBoid";
import { OrbitalControls } from "./OrbitalControls";
import { OrbitalBoidConfig } from "./orbitalBoidConfig";
import styles from "./BoidsScene.module.css";

export default function BoidsScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbitalBoidsRef = useRef<OrbitalBoid[]>([]);
  const earthRef = useRef<THREE.Mesh | null>(null);

  const [config, setConfig] = useState<OrbitalBoidConfig>({
    count: 40,
    rotation: true,
    orbitRadiusMin: 5,
    orbitRadiusMax: 12,
    orbitSpeedMin: 0.0005,
    orbitSpeedMax: 0.002,
    planeScale: 1,
    earthRotationSpeed: 0.0005,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup with gradient background
    const scene = new THREE.Scene();
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#4a3a7f");
      gradient.addColorStop(0.5, "#6b5bdb");
      gradient.addColorStop(1, "#8b9fff");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const bgTexture = new THREE.CanvasTexture(canvas);
    scene.background = bgTexture;
    sceneRef.current = scene;

    const initialWidth = container.clientWidth || window.innerWidth;
    const initialHeight = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(
      60,
      initialWidth / initialHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, 25);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initialWidth, initialHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight("#ffffff", 1);
    directionalLight.position.set(8, 8, 8);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight("#4a90ff", 0.5);
    rimLight.position.set(-8, -8, -8);
    scene.add(rimLight);

    // Create low-poly earth
    const earthGeometry = createLowPolyEarthGeometry(2.5, 4);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: "#1a7f9a",
      roughness: 0.6,
      metalness: 0.1,
      emissive: "#0a4a60",
      emissiveIntensity: 0.2,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.castShadow = true;
    earth.receiveShadow = true;
    scene.add(earth);
    earthRef.current = earth;

    // Add subtle rotation animation to earth
    const earthRotationSpeed = config.earthRotationSpeed;

    // Create orbital boids
    const planeGeometry = createPaperPlaneGeometry();
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: "#38bdf8",
      roughness: 0.4,
      metalness: 0.4,
      emissive: "#0ea5e9",
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide,
    });

    const orbitalBoids: OrbitalBoid[] = [];

    for (let i = 0; i < config.count; i++) {
      const orbitRadius =
        config.orbitRadiusMin +
        Math.random() * (config.orbitRadiusMax - config.orbitRadiusMin);
      const orbitSpeed =
        config.orbitSpeedMin +
        Math.random() * (config.orbitSpeedMax - config.orbitSpeedMin);

      const boid = new OrbitalBoid(
        orbitRadius,
        planeGeometry,
        planeMaterial,
        orbitSpeed,
      );
      orbitalBoids.push(boid);
      scene.add(boid.mesh);
    }

    orbitalBoidsRef.current = orbitalBoids;

    // Resize handler
    const handleResize = (): void => {
      if (!container || !camera || !renderer) return;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    const animate = (): void => {
      const boids = orbitalBoidsRef.current;

      // Update orbital boids
      boids.forEach((boid) => {
        boid.update();
      });

      // Rotate earth if enabled
      if (earth && config.rotation) {
        earth.rotation.y += earthRotationSpeed;
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      orbitalBoids.forEach((boid) => {
        scene.remove(boid.mesh);
      });

      if (earth) {
        scene.remove(earth);
        earthGeometry.dispose();
        earthMaterial.dispose();
      }

      planeGeometry.dispose();
      planeMaterial.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [config]);

  return (
    <section className={styles.root}>
      <div className={styles.overlay}>Paper Planes Around Earth</div>
      <OrbitalControls config={config} onConfigChange={setConfig} />
      <div ref={containerRef} className={styles.canvasHost} />
    </section>
  );
}
