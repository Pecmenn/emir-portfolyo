import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { reducedMotion } from '../lib/scroll';

// Ana sayfanın 3B kutusu: oyunlardaki objelerin gerçek 3B modelleri (Blender'da üretildi, bkz. tools/blender/objeler.py)
// ortada bir yığın oluşturur. Objeler merkeze çekilir, birbirine çarpar; fare yaklaşınca itilir, tıklayınca dağılıp yeniden
// toplanır. Fizik basit küre çarpışmasıdır; kutu ekrandan çıkınca ya da sekme gizlenince çizim durur.

type Kind = { file: string; size: number; count: number; fit?: number };

// size: objenin göreli boyu; fit: çarpışma küresinin görsel boya oranı (uzun objelerde küçük tutulur ki boşluk kalmasın)
const KINDS: Kind[] = [
  { file: 'altin', size: 1.0, count: 6 },
  { file: 'altin-x2', size: 0.95, count: 2 },
  { file: 'yildiz', size: 0.95, count: 3 },
  { file: 'plaj-topu', size: 1.05, count: 3 },
  { file: 'ordek', size: 1.1, count: 3 },
  { file: 'roket', size: 1.25, count: 3, fit: 0.72 },
  { file: 'tac', size: 1.0, count: 2 },
  { file: 'kaykay', size: 1.55, count: 3, fit: 0.62 },
  { file: 'tavsan', size: 1.1, count: 2 },
  { file: 'panda', size: 1.1, count: 2 },
  { file: 'domuz', size: 1.05, count: 2 },
  { file: 'tup', size: 1.15, count: 3, fit: 0.7 },
  { file: 'kup-baykus', size: 1.0, count: 3 },
];

type Body = {
  obj: THREE.Object3D;
  r: number;
  p: THREE.Vector3;
  v: THREE.Vector3;
  w: THREE.Vector3;
};

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const axis = new THREE.Vector3();
const dq = new THREE.Quaternion();

export default function ObjectPit({ className, onReady }: { className?: string; onReady?: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current!;
    const small = window.matchMedia('(max-width: 767px)').matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.add(new THREE.HemisphereLight('#ffffff', '#3b2a7a', 0.6));
    const key = new THREE.DirectionalLight('#ffffff', 1.6);
    key.position.set(-4, 6, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#a993ff', 1.2);
    rim.position.set(6, -3, -4);
    scene.add(rim);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const unit = small ? 0.95 : 1.15;
    // Geniş kutuda yığın yatayda daha çok yayılır (bkz. step)
    let pullX = 1.4;

    // Kutunun boyutuna göre kamera uzaklığı: yığın kutunun kısa kenarını biraz taşacak kadar büyük görünür
    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      pullX = camera.aspect > 1.4 ? 1.1 : 2.2;
      const fill = 5.4 * unit;
      const byHeight = fill / (2 * Math.tan(THREE.MathUtils.degToRad(15)));
      camera.position.set(0, 0, camera.aspect < 1 ? byHeight / camera.aspect : byHeight);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const bodies: Body[] = [];
    let disposed = false;
    const loader = new GLTFLoader();
    const kinds = small ? KINDS.map((k) => ({ ...k, count: Math.max(1, Math.round(k.count * 0.7)) })) : KINDS;

    Promise.all(kinds.map((k) => loader.loadAsync(`/models/${k.file}.glb`).then((g) => ({ k, g })))).then((loaded) => {
      if (disposed) return;
      let i = 0;
      for (const { k, g } of loaded) {
        g.scene.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          const m = mesh.material as THREE.MeshStandardMaterial;
          m.envMapIntensity = 1.1;
          if (m.transparent) m.depthWrite = false;
        });
        for (let c = 0; c < k.count; c++, i++) {
          const obj = g.scene.clone(true);
          const s = k.size * unit * (0.92 + Math.random() * 0.16);
          obj.scale.setScalar(s);
          obj.quaternion.setFromEuler(new THREE.Euler(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28));
          // Objeler kutunun dışından, çember üzerinde rastgele yerlerden içeri uçarak gelir
          const a = Math.random() * Math.PI * 2;
          const d = 9 + Math.random() * 5;
          const p = new THREE.Vector3(Math.cos(a) * d, Math.sin(a) * d * 0.7, (Math.random() - 0.5) * 2);
          const v = p.clone().multiplyScalar(-0.9 - Math.random() * 0.6);
          const w = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(6);
          scene.add(obj);
          bodies.push({ obj, r: 0.5 * s * (k.fit ?? 0.9), p, v, w });
        }
      }
      if (reducedMotion) {
        // Hareket azaltıldıysa yığın önceden yerleşir ve tek kare çizilir
        for (const b of bodies) b.p.multiplyScalar(0.25);
        for (let n = 0; n < 600; n++) step(1 / 60);
        sync(0);
        renderer.render(scene, camera);
      }
      onReady?.();
    });

    // ------------------------------------------------------------ fizik

    const mouse = new THREE.Vector3(99, 99, 0);
    const mouseVel = new THREE.Vector3();
    const lastMouse = new THREE.Vector3(99, 99, 0);
    let mouseOn = false;
    const MOUSE_R = 1.15 * unit;

    function step(dt: number) {
      for (const b of bodies) {
        // Merkeze yaylı çekim: yatayda gevşek (yığın kutu boyunca yayılır), derinlikte (z) sert, böylece yığın düz bir katman gibi kalır
        b.v.x -= b.p.x * pullX * dt;
        b.v.y -= b.p.y * 2.6 * dt;
        b.v.z -= b.p.z * 6 * dt;
        b.v.multiplyScalar(Math.exp(-1.7 * dt));
        b.w.multiplyScalar(Math.exp(-1.1 * dt));
        b.p.addScaledVector(b.v, dt);
      }
      for (let it = 0; it < 2; it++) {
        for (let i = 0; i < bodies.length; i++) {
          const a = bodies[i];
          for (let j = i + 1; j < bodies.length; j++) {
            const b = bodies[j];
            tmp.subVectors(b.p, a.p);
            const dist = tmp.length();
            const min = a.r + b.r;
            if (dist >= min || dist === 0) continue;
            tmp.divideScalar(dist);
            const push = (min - dist) * 0.5;
            a.p.addScaledVector(tmp, -push);
            b.p.addScaledVector(tmp, push);
            tmp2.subVectors(b.v, a.v);
            const vn = tmp2.dot(tmp);
            if (vn < 0) {
              const imp = -1.25 * vn * 0.5;
              a.v.addScaledVector(tmp, -imp);
              b.v.addScaledVector(tmp, imp);
              // Teğet yöndeki kayma objeleri döndürür
              tmp2.addScaledVector(tmp, -vn);
              axis.crossVectors(tmp, tmp2).multiplyScalar(0.9);
              a.w.sub(axis);
              b.w.add(axis);
            }
          }
        }
      }
      if (mouseOn) {
        for (const b of bodies) {
          tmp.subVectors(b.p, mouse);
          tmp.z *= 0.35;
          const dist = tmp.length();
          const min = MOUSE_R + b.r;
          if (dist >= min || dist === 0) continue;
          tmp.divideScalar(dist);
          const over = min - dist;
          b.p.addScaledVector(tmp, over * 0.35);
          b.v.addScaledVector(tmp, over * 9);
          b.v.addScaledVector(mouseVel, 0.25);
          axis.crossVectors(tmp, mouseVel).multiplyScalar(0.6);
          b.w.add(axis);
        }
      }
    }

    function sync(dt: number) {
      for (const b of bodies) {
        b.obj.position.copy(b.p);
        const speed = b.w.length();
        if (speed > 1e-4) {
          dq.setFromAxisAngle(axis.copy(b.w).divideScalar(speed), speed * dt);
          b.obj.quaternion.premultiply(dq);
        }
      }
    }

    // ------------------------------------------------------------ fare ve dokunma

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const toWorld = (e: PointerEvent, out: THREE.Vector3) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.ray.intersectPlane(plane, out);
    };
    const onMove = (e: PointerEvent) => {
      if (!toWorld(e, mouse)) return;
      if (!mouseOn) lastMouse.copy(mouse);
      mouseOn = true;
    };
    const onLeave = () => {
      mouseOn = false;
      mouse.set(99, 99, 0);
    };
    // Tıklama ya da dokunma: o noktadan dışa doğru bir patlama, objeler dağılıp geri toplanır
    const onDown = (e: PointerEvent) => {
      const hit = toWorld(e, tmp2.clone());
      if (!hit) return;
      for (const b of bodies) {
        tmp.subVectors(b.p, hit);
        const d = Math.max(tmp.length(), 0.3);
        const f = Math.max(0, 1 - d / (5 * unit)) * 16;
        tmp.normalize();
        tmp.z += (Math.random() - 0.5) * 0.6;
        b.v.addScaledVector(tmp, f);
        b.w.add(tmp2.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(f));
      }
    };
    const el = renderer.domElement;
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointercancel', onLeave);
    el.addEventListener('pointerdown', onDown);

    // ------------------------------------------------------------ döngü

    let visible = true;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let idle = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      if (!bodies.length) return;
      mouseVel.subVectors(mouse, lastMouse).divideScalar(Math.max(dt, 1e-3)).clampLength(0, 30);
      lastMouse.copy(mouse);
      // Fare yokken yığın hafifçe nefes alır; ara ara rastgele bir obje dürtülür
      idle += dt;
      if (!mouseOn && idle > 1.6) {
        idle = 0;
        const b = bodies[(Math.random() * bodies.length) | 0];
        b.w.add(tmp.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(5));
        b.v.add(tmp.set(Math.random() - 0.5, Math.random() - 0.5, 0).multiplyScalar(1.2));
      }
      acc += dt;
      while (acc >= 1 / 120) {
        step(1 / 120);
        acc -= 1 / 120;
      }
      sync(dt);
      renderer.render(scene, camera);
    };
    const start = () => {
      if (raf || reducedMotion) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !document.hidden) start();
      else stop();
    });
    io.observe(host);
    const onVis = () => (document.hidden || !visible ? stop() : start());
    document.addEventListener('visibilitychange', onVis);

    return () => {
      disposed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointercancel', onLeave);
      el.removeEventListener('pointerdown', onDown);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      el.remove();
    };
    // onReady yalnızca ilk yüklemede çağrılır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} className={className} />;
}
