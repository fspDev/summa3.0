
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BarDatum {
  day: string;
  hours: number;
  target: number;
}

interface ThreeBarChartProps {
  data: BarDatum[];
  height?: number;
}

export const ThreeBarChart: React.FC<ThreeBarChartProps> = ({ data, height = 260 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cleanupRef = useRef<() => void>();

  useEffect(() => {
    cleanupRef.current?.();
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    // Use canvas parent width for proper sizing
    const w = canvas.parentElement?.clientWidth || 600;
    const h = height;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000810, 30, 80);

    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 200);
    camera.position.set(0, 10, 22);
    camera.lookAt(0, 3, 0);

    const maxH = Math.max(...data.map(d => d.hours), data[0]?.target ?? 4, 1);
    const BAR_MAX = 10;
    const barW = 0.55;
    const gap = 1.1;
    const totalW = (data.length - 1) * gap;
    const startX = -totalW / 2;

    const bars: THREE.Mesh[] = [];

    data.forEach((item, i) => {
      const normH = Math.max((item.hours / maxH) * BAR_MAX, 0.06);
      const met = item.hours >= item.target;

      // Bar body
      const geo = new THREE.BoxGeometry(barW, normH, barW);
      const color = met ? 0x00FFD4 : 0x0A3D52;
      const emissive = met ? 0x00FFD4 : 0x052030;
      const mat = new THREE.MeshPhongMaterial({
        color,
        emissive,
        emissiveIntensity: met ? 0.45 : 0.15,
        transparent: true,
        opacity: met ? 0.92 : 0.75,
        shininess: 80,
      });
      const bar = new THREE.Mesh(geo, mat);
      bar.position.set(startX + i * gap, normH / 2, 0);
      scene.add(bar);
      bars.push(bar);

      // Top cap (glowing edge)
      const capGeo = new THREE.BoxGeometry(barW + 0.05, 0.06, barW + 0.05);
      const capMat = new THREE.MeshBasicMaterial({
        color: met ? 0x00FFD4 : 0x0D4F6B,
        transparent: true,
        opacity: met ? 0.9 : 0.4,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(startX + i * gap, normH + 0.03, 0);
      scene.add(cap);
    });

    // Target line
    const targetNorm = (data[0]?.target / maxH) * BAR_MAX;
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(startX - 0.3, targetNorm, 0),
      new THREE.Vector3(startX + (data.length - 1) * gap + 0.3, targetNorm, 0),
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x00FFD4,
      transparent: true,
      opacity: 0.4,
      dashSize: 0.3,
      gapSize: 0.2,
    });
    const targetLine = new THREE.Line(lineGeo, lineMat);
    targetLine.computeLineDistances();
    scene.add(targetLine);

    // Floor grid
    const floorHelper = new THREE.GridHelper(totalW + 4, data.length, 0x0D4F6B, 0x021528);
    (floorHelper.material as THREE.LineBasicMaterial).transparent = true;
    (floorHelper.material as THREE.LineBasicMaterial).opacity = 0.5;
    floorHelper.position.set(0, 0, 0);
    scene.add(floorHelper);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pt = new THREE.PointLight(0x00FFD4, 3, 40);
    pt.position.set(0, 20, 10);
    scene.add(pt);
    const pt2 = new THREE.PointLight(0x0080FF, 1.5, 30);
    pt2.position.set(-10, 5, 5);
    scene.add(pt2);

    // Animation
    let time = 0;
    let rafId: number;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      time += 0.008;

      // Slow camera orbit
      camera.position.x = Math.sin(time * 0.2) * 4;
      camera.position.y = 10 + Math.sin(time * 0.15) * 1.5;
      camera.lookAt(0, 3, 0);

      // Subtle bar pulse on met bars
      bars.forEach((bar, i) => {
        if (data[i]?.hours >= data[i]?.target) {
          const mat = bar.material as THREE.MeshPhongMaterial;
          mat.emissiveIntensity = 0.3 + Math.sin(time * 1.5 + i) * 0.15;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = canvas.parentElement?.clientWidth || w;
      renderer.setSize(nw, h, false);
      camera.aspect = nw / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    cleanupRef.current = () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };

    return cleanupRef.current;
  }, [data, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
    />
  );
};
