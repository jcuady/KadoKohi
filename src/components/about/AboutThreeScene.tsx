import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BRAND_RED = 0x9e181d;
const BRAND_CREAM = 0xf1dfba;

/**
 * Lightweight Three.js hero accent — stylized cup group, mouse-reactive.
 * Skipped on mobile and when prefers-reduced-motion.
 */
export default function AboutThreeScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = window.matchMedia('(max-width: 767px)').matches;
    if (reduced || narrow) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
    camera.position.set(0, 0.2, 4.8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const cupMat = new THREE.MeshStandardMaterial({
      color: BRAND_RED,
      metalness: 0.38,
      roughness: 0.42,
    });
    const creamMat = new THREE.MeshStandardMaterial({
      color: BRAND_CREAM,
      metalness: 0.18,
      roughness: 0.55,
    });

    const group = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.72, 1.45, 40), cupMat);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.065, 16, 48), creamMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.72;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.075, 12, 32, Math.PI), cupMat);
    handle.position.set(1.02, 0.05, 0);
    handle.rotation.z = -Math.PI / 2;
    const steam = new THREE.Mesh(new THREE.TorusKnotGeometry(0.22, 0.04, 64, 8, 2, 3), creamMat);
    steam.position.set(0, 1.15, 0);
    group.add(cup, rim, handle, steam);
    scene.add(group);

    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(5, 8, 6);
    const fill = new THREE.DirectionalLight(0xf1dfba, 0.35);
    fill.position.set(-4, 2, 3);
    scene.add(key, fill, new THREE.AmbientLight(0xffffff, 0.25));

    let pointerX = 0;
    let pointerY = 0;
    const onMove = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 0.5;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 0.35;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      group.rotation.y += 0.005;
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, pointerY, 0.06);
      group.rotation.y += pointerX * 0.008;
      steam.rotation.y -= 0.01;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
      renderer.dispose();
      cupMat.dispose();
      creamMat.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 opacity-80 mix-blend-screen"
      aria-hidden
    />
  );
}
