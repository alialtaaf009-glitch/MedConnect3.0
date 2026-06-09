import { useEffect, useRef, useState } from 'react';

// rough country -> [lat, lng] so we can place dots without storing coordinates
const COUNTRY_COORDS = {
  'Pakistan': [30.4, 69.3],
  'United Kingdom': [54.0, -2.0],
  'United States': [39.8, -98.6],
  'India': [22.0, 79.0],
  'Saudi Arabia': [24.0, 45.0],
  'Australia': [-25.0, 133.0],
  'Canada': [56.1, -106.3],
  'Ireland': [53.4, -8.2],
  'United Arab Emirates': [24.0, 54.0],
  'Nigeria': [9.1, 8.7],
  'Egypt': [26.8, 30.8],
  'Bangladesh': [23.7, 90.4],
  'South Africa': [-30.6, 22.9],
};

export default function Globe() {
  const wrapRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    async function init() {
      // 1. load doctors (reuse matches endpoint)
      let docs = [];
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/matches', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const data = await res.json();
        docs = (data.matches || []).map((m) => m.user || m).filter((u) => u && u.country);
      } catch (e) { /* fall through with empty */ }
      if (cancelled) return;
      setCount(docs.length);

      // 2. load three.js from CDN
      if (!window.THREE) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        }).catch(() => { if (!cancelled) setError('Could not load the globe. Check your connection and try again.'); });
      }
      if (cancelled || !window.THREE) { if (!window.THREE) return; }
      const THREE = window.THREE;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const W = wrap.clientWidth, H = wrap.clientHeight;

      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
      cam.position.z = 3.2;
      const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rend.setSize(W, H); rend.setPixelRatio(Math.min(devicePixelRatio, 2));
      wrap.appendChild(rend.domElement);

      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(1, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0x16243f })
      );
      scene.add(globe);
      const wire = new THREE.Mesh(
        new THREE.SphereGeometry(1.004, 26, 26),
        new THREE.MeshBasicMaterial({ color: 0x2b3a72, wireframe: true, transparent: true, opacity: 0.35 })
      );
      scene.add(wire);

      const toXYZ = (lat, lng, r = 1.02) => {
        const phi = (90 - lat) * Math.PI / 180, th = (lng + 180) * Math.PI / 180;
        return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
      };

      // place a dot per doctor (jitter so same-country dots don't fully overlap)
      const dots = [];
      docs.forEach((d) => {
        const base = COUNTRY_COORDS[d.country];
        if (!base) return;
        const lat = base[0] + (Math.random() - 0.5) * 6;
        const lng = base[1] + (Math.random() - 0.5) * 6;
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
        m.position.copy(toXYZ(lat, lng));
        m.userData = d; scene.add(m); dots.push(m);
        const g = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.22 }));
        g.position.copy(m.position); scene.add(g);
      });

      let rotX = 0.3, rotY = 0, vel = 0.0025, down = false, last = { x: 0, y: 0 }, moved = false;
      const el = rend.domElement;
      const start = (x, y) => { down = true; moved = false; last = { x, y }; };
      const move = (x, y) => { if (!down) return; const dx = x - last.x, dy = y - last.y; if (Math.abs(dx) + Math.abs(dy) > 4) moved = true; rotY += dx * 0.005; rotX += dy * 0.005; vel = dx * 0.0008; last = { x, y }; };
      const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
      const pick = (px, py) => {
        const rect = el.getBoundingClientRect();
        mouse.x = ((px - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((py - rect.top) / rect.height) * 2 + 1;
        ray.setFromCamera(mouse, cam);
        const hit = ray.intersectObjects(dots);
        if (hit.length) setSelected(hit[0].object.userData);
      };
      const onDown = (e) => start(e.clientX, e.clientY);
      const onMove = (e) => move(e.clientX, e.clientY);
      const onUp = () => { down = false; };
      const onTS = (e) => start(e.touches[0].clientX, e.touches[0].clientY);
      const onTM = (e) => move(e.touches[0].clientX, e.touches[0].clientY);
      const onTE = (e) => { down = false; if (!moved) pick(e.changedTouches[0].clientX, e.changedTouches[0].clientY); };
      const onClick = (e) => { if (!moved) pick(e.clientX, e.clientY); };
      el.addEventListener('mousedown', onDown); el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseup', onUp); el.addEventListener('click', onClick);
      el.addEventListener('touchstart', onTS, { passive: true });
      el.addEventListener('touchmove', onTM, { passive: true });
      el.addEventListener('touchend', onTE);

      let raf;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!down) { rotY += vel; vel += (0.0025 - vel) * 0.02; }
        scene.rotation.y = rotY; scene.rotation.x = rotX;
        rend.render(scene, cam);
      };
      loop();
      setReady(true);

      const onResize = () => {
        const w = wrap.clientWidth, h = wrap.clientHeight;
        cam.aspect = w / h; cam.updateProjectionMatrix(); rend.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        el.removeEventListener('mousedown', onDown); el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseup', onUp); el.removeEventListener('click', onClick);
        el.removeEventListener('touchstart', onTS); el.removeEventListener('touchmove', onTM); el.removeEventListener('touchend', onTE);
        if (el.parentNode) el.parentNode.removeChild(el);
      };
    }

    init();
    return () => { cancelled = true; cleanup(); };
  }, []);

  const initials = (n) => (n || 'Dr').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100dvh - 76px)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 18px', zIndex: 5, textAlign: 'center', pointerEvents: 'none' }}>
        <h1 className="serif" style={{ fontSize: 20, fontWeight: 700 }}>🌎 Doctors worldwide</h1>
        <p className="sub" style={{ fontSize: 12, marginTop: 2 }}>
          {count > 0 ? `Spin the globe — tap a glowing dot to see a study partner` : 'Spin the globe to explore'}
        </p>
      </div>

      <div ref={wrapRef} style={{ width: '100%', height: '100%' }} />

      {error && <div className="center" style={{ position: 'absolute', inset: 0 }}><p className="sub">{error}</p></div>}
      {!ready && !error && <div className="center" style={{ position: 'absolute', inset: 0 }}><p className="sub">Loading the globe…</p></div>}

      {selected && (
        <div className="card" style={{ position: 'absolute', left: '50%', bottom: 18, transform: 'translateX(-50%)', width: 'min(360px, 92%)', zIndex: 6 }}>
          <button className="link" style={{ position: 'absolute', top: 8, right: 12, fontSize: 18 }} onClick={() => setSelected(null)}>×</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: selected.avatar ? 24 : 15, color: 'var(--forest)', fontWeight: 700 }}>
              {selected.avatar || initials(selected.name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</div>
              <div className="meta">{[selected.exam, selected.country].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
          <p className="sub" style={{ fontSize: 11, marginTop: 12, fontStyle: 'italic' }}>
            Minimal info shown for privacy. Find them in Partners to connect.
          </p>
        </div>
      )}
    </div>
  );
}
