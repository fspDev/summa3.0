
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const SciFiBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000810, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000810, 0.018);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(0, 8, 0);
    camera.lookAt(0, 0, -30);

    // ── INFINITE GRID ──────────────────────────────────────
    const gridSize = 120;
    const gridDiv = 24;
    const neonColor = new THREE.Color(0x00FFD4);
    const dimColor = new THREE.Color(0x0D4F6B);

    const gridGroup = new THREE.Group();
    gridGroup.position.y = 0;

    for (let i = -gridDiv; i <= gridDiv; i++) {
      const t = i / gridDiv;
      const x = t * gridSize;
      const isMajor = i % 4 === 0;
      const color = isMajor ? neonColor : dimColor;
      const opacity = isMajor ? 0.35 : 0.12;

      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });

      // Z lines (running away from camera)
      const zgeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, 0),
        new THREE.Vector3(x, 0, -gridSize * 2),
      ]);
      gridGroup.add(new THREE.Line(zgeo, mat));

      // X lines (horizontal cross lines)
      const z = t * gridSize * 2;
      const xgeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-gridSize, 0, -z),
        new THREE.Vector3(gridSize, 0, -z),
      ]);
      gridGroup.add(new THREE.Line(xgeo, mat));
    }
    scene.add(gridGroup);

    // ── VERTICAL PILLARS at grid intersections ─────────────
    const pillarGeo = new THREE.BoxGeometry(0.05, 3, 0.05);
    const pillarMat = new THREE.MeshBasicMaterial({ color: 0x0D4F6B, transparent: true, opacity: 0.3 });
    for (let ix = -3; ix <= 3; ix++) {
      for (let iz = 1; iz <= 8; iz++) {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(ix * 10, 1.5, -iz * 15);
        scene.add(pillar);
      }
    }

    // ── STARS / PARTICLES ──────────────────────────────────
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3]     = (Math.random() - 0.5) * 200;
      starPositions[i * 3 + 1] = Math.random() * 60 + 5;
      starPositions[i * 3 + 2] = -(Math.random() * 200);
      starSizes[i] = Math.random() * 2 + 0.5;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    const starMat = new THREE.PointsMaterial({
      color: 0x00FFD4,
      size: 0.4,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── FLOATING WIREFRAME OCTAHEDRONS ────────────────────
    const floaters: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.OctahedronGeometry(Math.random() * 1.5 + 0.5, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00FFD4 : 0x0D4F6B,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 60,
        Math.random() * 20 + 5,
        -(Math.random() * 80 + 10),
      );
      (mesh as any)._speed = Math.random() * 0.005 + 0.002;
      (mesh as any)._offset = Math.random() * Math.PI * 2;
      scene.add(mesh);
      floaters.push(mesh);
    }

    // ── HORIZON LINE ───────────────────────────────────────
    const horizonGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-200, 0.02, -gridSize * 2),
      new THREE.Vector3(200, 0.02, -gridSize * 2),
    ]);
    const horizonMat = new THREE.LineBasicMaterial({ color: 0x00FFD4, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Line(horizonGeo, horizonMat));

    // ── AMBIENT LIGHT ──────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x00FFD4, 0.2));

    // ── RESIZE ─────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    onResize();
    window.addEventListener('resize', onResize);

    // ── ANIMATION LOOP ─────────────────────────────────────
    let time = 0;
    let rafId: number;
    const cellSize = (gridSize * 2) / gridDiv;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      time += 0.003;

      // Move grid forward to simulate flying over
      gridGroup.position.z = (time * cellSize * 3) % cellSize;

      // Subtle camera sway
      camera.position.x = Math.sin(time * 0.15) * 2;
      camera.position.y = 8 + Math.sin(time * 0.1) * 0.5;
      camera.lookAt(Math.sin(time * 0.15) * 0.5, 0, -30);

      // Rotate floaters
      floaters.forEach(f => {
        f.rotation.x += (f as any)._speed;
        f.rotation.y += (f as any)._speed * 0.7;
        f.position.y = (f as any)._baseY ?? (f.position.y) + Math.sin(time + (f as any)._offset) * 0.01;
      });

      // Pulsing star opacity
      starMat.opacity = 0.4 + Math.sin(time * 0.5) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};
