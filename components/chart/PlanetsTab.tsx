"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Stars, AdaptiveDpr, PerformanceMonitor, Html, Float, OrbitControls,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import type { NatalChart, Placement } from "@/lib/astro/computeChart";
import { kb, GRAHA_GLYPHS, type GrahaId } from "@/lib/kb";
import { composePlanetInterpretation } from "@/lib/interpret";
import { GRAHA_COLORS } from "@/lib/grahaColors";

// ── Visual constants — derived from canonical GRAHA_COLORS ────────────────────

const PALETTE = Object.fromEntries(
  Object.entries(GRAHA_COLORS).map(([k, v]) => [k, { core: v.core, accent: v.accent }])
) as Record<string, { core: string; accent: string }>;

// element → particle motion archetype
const ELEMENT_MOTION: Record<string, { speed: number; turb: number }> = {
  fire:  { speed: 1.0, turb: 1.0 },
  water: { speed: 0.45, turb: 0.4 },
  earth: { speed: 0.5,  turb: 0.3 },
  air:   { speed: 0.6,  turb: 0.7 },
  ether: { speed: 0.55, turb: 0.5 },
};

// Orbit radii per graha — house gives angle, radius gives visual separation
const ORBIT_RADIUS: Record<string, number> = {
  sun: 0, moon: 1.8, mercury: 2.4, venus: 3.0,
  mars: 3.6, rahu: 4.2, ketu: 4.2, jupiter: 5.0, saturn: 5.8,
};

const GRAHA_SIZE: Record<string, number> = {
  sun: 0.34, moon: 0.17, mars: 0.16, mercury: 0.14,
  jupiter: 0.29, venus: 0.17, saturn: 0.26, rahu: 0.14, ketu: 0.14,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlanetData {
  placement: Placement;
  grahaId: GrahaId;
  orbit: number;
  worldPos: THREE.Vector3;
  palette: { core: string; accent: string };
  isShadow: boolean;
  size: number;
  element: string;
  glowColor: string; // dignity-modified accent color
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
}

// ── Dignity-tinted glow color ─────────────────────────────────────────────────

function resolveGlowColor(dignity: string, palette: { core: string }): string {
  if (dignity === "exalted" || dignity === "moolatrikona" || dignity === "own") return "#F0CE7A";
  if (dignity === "debilitated") return "#D98C6A";
  return palette.core;
}

// ── Orbit ring grid ───────────────────────────────────────────────────────────

function OrbitRings({ radii }: { radii: number[] }) {
  return (
    <>
      {radii.map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.007, 2, 128]} />
          <meshBasicMaterial color="#C8A24A" transparent opacity={0.07} />
        </mesh>
      ))}
    </>
  );
}

// ── Physical planet orb ───────────────────────────────────────────────────────

function PlanetOrb({ data, focused, hoveredId, onHover, onClick, reduced }: {
  data: PlanetData;
  focused: boolean;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  reduced: boolean;
}) {
  const groupRef  = useRef<THREE.Group>(null!);
  const meshRef   = useRef<THREE.Mesh>(null!);
  const glowRef   = useRef<THREE.Mesh>(null!);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const hovered   = hoveredId === data.grahaId;

  const graha = kb.grahas[data.grahaId];
  const bhava = kb.bhavas[String(data.placement.house)];

  useFrame(({ clock }) => {
    if (!groupRef.current || reduced) return;
    const t = clock.getElapsedTime();
    if (meshRef.current) meshRef.current.rotation.y += 0.005;
    // gentle vertical bob
    groupRef.current.position.y = data.worldPos.y + Math.sin(t * 0.7 + data.orbit) * 0.055;
    // hover scale
    const target = hovered ? 1.3 : 1.0;
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, target, 0.1)
    );
    // glow halo opacity
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, (hovered || focused) ? 0.28 : 0.06, 0.09);
    }
  });

  return (
    <group ref={groupRef} position={data.worldPos}>
      {/* Glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[data.size * 2.2, 16, 16]} />
        <meshBasicMaterial color={data.glowColor} transparent opacity={0.06} side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Planet body */}
      <mesh
        ref={meshRef}
        onPointerDown={(e) => { e.stopPropagation(); dragOrigin.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }; }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(data.grahaId); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = "auto"; }}
        onClick={(e) => { e.stopPropagation(); const dx = e.nativeEvent.clientX - dragOrigin.current.x; const dy = e.nativeEvent.clientY - dragOrigin.current.y; if (Math.hypot(dx, dy) < 5) onClick(data.grahaId); }}
      >
        <sphereGeometry args={[data.size, 32, 32]} />
        <meshPhysicalMaterial
          color={data.glowColor}
          emissive={data.palette.core}
          emissiveIntensity={0.65}
          metalness={0.12}
          roughness={0.42}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Saturn rings */}
      {data.grahaId === "saturn" && (
        <mesh rotation={[Math.PI / 3.2, 0, 0.3]}>
          <torusGeometry args={[data.size * 1.9, data.size * 0.22, 3, 64]} />
          <meshPhysicalMaterial color="#C8A24A" metalness={0.3} roughness={0.6} transparent opacity={0.55} />
        </mesh>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html center position={[0, data.size + 0.32, 0]} style={{ pointerEvents: "none" }}>
          <div style={{
            background: "rgba(10,15,36,0.95)",
            border: `1px solid ${data.palette.core}`,
            borderRadius: 8,
            padding: "5px 12px",
            whiteSpace: "nowrap",
            fontSize: 12,
            color: "#ECE7D7",
            fontFamily: "system-ui",
            textAlign: "center",
          }}>
            <div style={{ color: data.palette.core, fontWeight: 600 }}>
              {GRAHA_GLYPHS[data.grahaId]} {graha?.sanskrit}/{graha?.en}
            </div>
            <div style={{ color: "#8E97B8", fontSize: 11, marginTop: 2 }}>
              House {data.placement.house} · {bhava?.en}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Rahu / Ketu — drifting particle nebula (no body) ─────────────────────────

function ShadowNebula({ data, onHover, onClick }: {
  data: PlanetData;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) {
  const N = 480;
  const groupRef = useRef<THREE.Group>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  const [hovered, setHovered] = useState(false);
  const dragOrigin = useRef({ x: 0, y: 0 });

  const geo = useMemo(() => {
    const pos  = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = Math.pow(Math.random(), 0.6) * 0.72;
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = r * Math.sin(v) * Math.cos(u);
      pos[i*3+1] = r * Math.sin(v) * Math.sin(u) * 0.8;
      pos[i*3+2] = r * Math.cos(v);
      seed[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("seed",     new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  const home = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);

  useEffect(() => () => geo.dispose(), [geo]);

  const swirl = data.grahaId === "rahu" ? 1 : -1;

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t   = clock.getElapsedTime();
    const arr  = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const seeds = pointsRef.current.geometry.attributes.seed.array as Float32Array;
    for (let i = 0; i < N; i++) {
      const ix = i * 3, s = seeds[i];
      const breathe = Math.sin(t * 0.55 + s) * 0.07;
      arr[ix]   = home[ix]   + Math.cos(s + t * 0.18) * breathe;
      arr[ix+1] = home[ix+1] + Math.sin(s + t * 0.25) * breathe;
      arr[ix+2] = home[ix+2] + Math.cos(s * 1.2 + t * 0.14) * breathe;
    }
    pointsRef.current.rotation.y += 0.003 * swirl;
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    // gentle bob
    if (groupRef.current) {
      groupRef.current.position.y = data.worldPos.y + Math.sin(clock.getElapsedTime() * 0.5 + data.orbit) * 0.05;
    }
  });

  const graha = kb.grahas[data.grahaId];
  const bhava = kb.bhavas[String(data.placement.house)];

  return (
    <group
      ref={groupRef}
      position={data.worldPos}
      onPointerDown={(e) => { e.stopPropagation(); dragOrigin.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }; }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(data.grahaId); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = "auto"; }}
      onClick={(e) => { e.stopPropagation(); const dx = e.nativeEvent.clientX - dragOrigin.current.x; const dy = e.nativeEvent.clientY - dragOrigin.current.y; if (Math.hypot(dx, dy) < 5) onClick(data.grahaId); }}
    >
      <points ref={pointsRef} geometry={geo}>
        <pointsMaterial
          color={data.palette.core}
          size={0.055}
          transparent
          opacity={0.82}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {hovered && (
        <Html center position={[0, 0.55, 0]} style={{ pointerEvents: "none" }}>
          <div style={{
            background: "rgba(10,15,36,0.95)",
            border: `1px solid ${data.palette.core}`,
            borderRadius: 8,
            padding: "5px 12px",
            whiteSpace: "nowrap",
            fontSize: 12,
            color: "#ECE7D7",
            fontFamily: "system-ui",
            textAlign: "center",
          }}>
            <div style={{ color: data.palette.core, fontWeight: 600 }}>
              {GRAHA_GLYPHS[data.grahaId]} {graha?.sanskrit}/{graha?.en}
            </div>
            <div style={{ color: "#8E97B8", fontSize: 11, marginTop: 2 }}>
              House {data.placement.house} · {bhava?.en}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Element particle field (shown when a planet is focused) ───────────────────

function ElementParticles({ element, palette }: {
  element: string;
  palette: { accent: string };
}) {
  const N = 260;
  const ref = useRef<THREE.Points>(null!);

  const geo = useMemo(() => {
    const pos  = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const rad = 1.9 + Math.random() * 2.2;
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = rad * Math.sin(v) * Math.cos(u);
      pos[i*3+1] = rad * Math.sin(v) * Math.sin(u);
      pos[i*3+2] = rad * Math.cos(v);
      seed[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("seed",     new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  const home = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  useEffect(() => () => geo.dispose(), [geo]);

  const em = ELEMENT_MOTION[element] ?? { speed: 0.5, turb: 0.5 };

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t    = clock.getElapsedTime();
    const arr  = ref.current.geometry.attributes.position.array as Float32Array;
    const seeds = ref.current.geometry.attributes.seed.array as Float32Array;

    for (let i = 0; i < N; i++) {
      const ix = i * 3, s = seeds[i];
      const hx = home[ix], hy = home[ix+1], hz = home[ix+2];

      if (element === "fire") {
        arr[ix]   = hx + Math.sin(t * 2.0 + s) * 0.06 * em.turb;
        arr[ix+1] = hy + ((t * 0.6 * em.speed + s) % 3.0) - 1.0;
        arr[ix+2] = hz + Math.cos(t * 1.7 + s) * 0.06 * em.turb;
      } else if (element === "water") {
        arr[ix]   = hx + Math.cos(t * 0.4 * em.speed + s) * 0.12;
        arr[ix+1] = hy + Math.sin(t * 0.5 * em.speed + s) * 0.25;
        arr[ix+2] = hz;
      } else if (element === "air") {
        arr[ix]   = hx + Math.sin(t * 0.5 * em.speed + s) * 0.5 * em.turb;
        arr[ix+1] = hy + Math.cos(t * 0.35 * em.speed + s) * 0.1;
        arr[ix+2] = hz;
      } else if (element === "ether") {
        const e = 1 + Math.sin(t * 0.4 * em.speed + s) * 0.18;
        arr[ix] = hx * e; arr[ix+1] = hy * e; arr[ix+2] = hz * e;
      } else { // earth — steady slow orbit
        const c = Math.cos(0.0005 * em.speed), sn = Math.sin(0.0005 * em.speed);
        const nx = hx * c - hz * sn, nz = hx * sn + hz * c;
        arr[ix] = nx; home[ix] = nx;
        arr[ix+1] = hy;
        arr[ix+2] = nz; home[ix+2] = nz;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color={palette.accent}
        size={0.068}
        transparent
        opacity={0.62}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Full orrery scene ─────────────────────────────────────────────────────────

function OrreryScene({ planets, focusedId, onHover, onClick, reduced }: {
  planets: PlanetData[];
  focusedId: string | null;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  reduced: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const handleHover = useCallback((id: string | null) => { setHoveredId(id); onHover(id); }, [onHover]);

  const orbitRadii = useMemo(
    () => [...new Set(planets.filter(p => p.orbit > 0).map(p => p.orbit))].sort((a, b) => a - b),
    [planets]
  );

  const sun = planets.find(p => p.grahaId === "sun");
  const others = planets.filter(p => p.grahaId !== "sun");
  const sunDragOrigin = useRef({ x: 0, y: 0 });

  return (
    <>
      <color attach="background" args={["#07060d"]} />
      <ambientLight intensity={0.035} />
      <pointLight position={[0, 0, 0]} intensity={22} color="#FCD34D" decay={2} distance={22} />
      <directionalLight position={[-6, -2, -5]} intensity={1.6} color="#5530b0" />

      <Stars radius={80} depth={60} count={reduced ? 1400 : 3800} factor={3.2} saturation={0} fade />
      <OrbitControls
        enableRotate
        enablePan={false}
        enableZoom
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        minDistance={4}
        maxDistance={18}
        target={[0, 0, 0]}
      />
      <OrbitRings radii={orbitRadii} />

      {/* Sun at center */}
      {sun && (
        <Float speed={0.7} floatIntensity={0.05} rotationIntensity={0.03}>
          <group>
            <mesh
              onPointerDown={(e) => { e.stopPropagation(); sunDragOrigin.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }; }}
              onPointerOver={(e) => { e.stopPropagation(); handleHover("sun"); document.body.style.cursor = "pointer"; }}
              onPointerOut={() => { handleHover(null); document.body.style.cursor = "auto"; }}
              onClick={(e) => { e.stopPropagation(); const dx = e.nativeEvent.clientX - sunDragOrigin.current.x; const dy = e.nativeEvent.clientY - sunDragOrigin.current.y; if (Math.hypot(dx, dy) < 5) onClick("sun"); }}
            >
              <sphereGeometry args={[sun.size, 32, 32]} />
              <meshStandardMaterial color={sun.glowColor} emissive="#ff5a00" emissiveIntensity={3.5} roughness={0.9} />
            </mesh>
            {/* Corona */}
            <mesh>
              <sphereGeometry args={[sun.size * 1.65, 24, 24]} />
              <meshBasicMaterial color="#FCD34D" transparent opacity={0.11} side={THREE.BackSide} />
            </mesh>
            {/* Element particles when focused */}
            {focusedId === "sun" && (
              <ElementParticles element={sun.element} palette={sun.palette} />
            )}
            {/* Hover tooltip */}
            {hoveredId === "sun" && (
              <Html center position={[0, sun.size + 0.34, 0]} style={{ pointerEvents: "none" }}>
                <div style={{
                  background: "rgba(10,15,36,0.95)", border: "1px solid #ff8a2b",
                  borderRadius: 8, padding: "5px 12px", whiteSpace: "nowrap",
                  fontSize: 12, color: "#ECE7D7", fontFamily: "system-ui", textAlign: "center",
                }}>
                  <div style={{ color: "#ff8a2b", fontWeight: 600 }}>
                    {GRAHA_GLYPHS.sun} {kb.grahas.sun?.sanskrit}/{kb.grahas.sun?.en}
                  </div>
                  <div style={{ color: "#8E97B8", fontSize: 11, marginTop: 2 }}>
                    House {sun.placement.house} · {kb.bhavas[String(sun.placement.house)]?.en}
                  </div>
                </div>
              </Html>
            )}
          </group>
        </Float>
      )}

      {/* All other planets */}
      {others.map(data => (
        <group key={data.grahaId}>
          {data.isShadow
            ? <ShadowNebula data={data} onHover={handleHover} onClick={onClick} />
            : (
              <PlanetOrb
                data={data}
                focused={focusedId === data.grahaId}
                hoveredId={hoveredId}
                onHover={handleHover}
                onClick={onClick}
                reduced={reduced}
              />
            )
          }
          {/* Element particles appear around any focused planet */}
          {focusedId === data.grahaId && (
            <group position={data.worldPos}>
              <ElementParticles element={data.element} palette={data.palette} />
            </group>
          )}
        </group>
      ))}

      {!reduced && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.5} intensity={0.85} radius={0.45} />
          <Vignette eskil={false} offset={0.08} darkness={0.55} />
        </EffectComposer>
      )}
    </>
  );
}

// ── Bhava-chamber reading panel (DOM overlay) ─────────────────────────────────

function ReadingPanel({ data, chart, onBack }: {
  data: PlanetData;
  chart: NatalChart;
  onBack: () => void;
}) {
  const interp = useMemo(
    () => composePlanetInterpretation(data.placement, chart.placements),
    [data.placement, chart.placements]
  );
  const graha = kb.grahas[data.grahaId];
  const bhava = kb.bhavas[String(data.placement.house)];
  const rashi = kb.rashis[data.placement.sign];

  const pillars = [
    { label: "The Planet",  text: interp.pillars.planet },
    { label: "The House",   text: interp.pillars.house },
    { label: "The Sign",    text: interp.pillars.sign },
    { label: "Dignity",     text: interp.pillars.dignity },
    ...(interp.pillars.aspects ? [{ label: "Aspects", text: interp.pillars.aspects }] : []),
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: 0, right: 0,
        width: "clamp(300px, 40%, 420px)",
        height: "100%",
        background: "rgba(7,6,13,0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderLeft: `1px solid ${data.palette.core}38`,
        overflowY: "auto",
        zIndex: 20,
        padding: "22px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 15,
        animation: "chamberIn 0.28s cubic-bezier(0.34,1.36,0.64,1)",
      }}
    >
      <style>{`
        @keyframes chamberIn {
          from { transform: translateX(32px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Back control */}
      <button
        onClick={onBack}
        style={{
          alignSelf: "flex-start",
          background: "none",
          border: "1px solid var(--faint)",
          borderRadius: 6,
          padding: "4px 12px",
          cursor: "pointer",
          color: "var(--muted)",
          fontSize: "0.78rem",
          fontFamily: "var(--font-ui), system-ui",
        }}
      >
        ← Orrery
      </button>

      {/* Glyph + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 54, height: 54,
          borderRadius: "50%",
          border: `1px solid ${data.palette.core}50`,
          background: `${data.palette.core}10`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2rem", color: data.palette.core, flexShrink: 0,
        }}>
          {GRAHA_GLYPHS[data.grahaId]}
        </div>
        <div>
          <h2 style={{
            fontSize: "1.35rem",
            color: "var(--parchment)",
            fontFamily: "var(--font-display), Georgia, serif",
            fontWeight: 600,
            lineHeight: 1.1,
          }}>
            {graha?.sanskrit}
            <span style={{
              fontStyle: "italic", fontWeight: 400,
              fontSize: "0.72em", color: data.palette.core, marginLeft: "0.4em",
            }}>
              {graha?.en}
            </span>
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 3 }}>
            House {data.placement.house} · {bhava?.en} · {rashi?.en}
          </p>
        </div>
      </div>

      {/* Dignity badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span className={`badge ${interp.dignityClass}`}>{interp.dignityLabel}</span>
        {interp.houseClass.map(c => (
          <span key={c} className="badge badge-neutral" style={{ textTransform: "capitalize" }}>{c}</span>
        ))}
        {data.placement.retrograde && (
          <span className="badge" style={{ color: "var(--weak)", borderColor: "var(--weak)" }}>℞ Retrograde</span>
        )}
      </div>

      <div style={{ height: 1, background: `${data.palette.core}22` }} />

      {/* Pillar readings */}
      {pillars.map(({ label, text }) => (
        <div key={label}>
          <p style={{
            fontSize: "0.68rem", textTransform: "uppercase",
            letterSpacing: "0.14em", color: "var(--faint)", marginBottom: 4,
          }}>
            {label}
          </p>
          <p style={{ fontSize: "0.83rem", lineHeight: 1.65, color: "var(--parchment)" }}>
            {text}
          </p>
        </div>
      ))}

      {/* Karaka chips */}
      <div>
        <p style={{
          fontSize: "0.68rem", textTransform: "uppercase",
          letterSpacing: "0.14em", color: "var(--faint)", marginBottom: 6,
        }}>
          Signifies
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {graha?.karaka_of?.slice(0, 6).map(k => (
            <span key={k} style={{
              fontSize: "0.73rem",
              padding: "3px 10px",
              borderRadius: 100,
              background: `${data.palette.core}12`,
              border: `1px solid ${data.palette.core}38`,
              color: data.palette.core,
              textTransform: "capitalize",
            }}>
              {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

interface Props {
  chart: NatalChart;
  chartId: string;
}

export default function PlanetsTab({ chart }: Props) {
  const reduced = useReducedMotion();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [, setHoveredId] = useState<string | null>(null);

  // Build planet data from real chart placements (house → angle; graha → orbit radius)
  const planets = useMemo<PlanetData[]>(() => {
    const houseCount: Record<number, number> = {};
    return chart.placements
      .filter(p => p.body !== "lagna")
      .map(p => {
        const gid = p.body as GrahaId;
        const graha = kb.grahas[gid];
        if (!graha) return null;

        const orbit = ORBIT_RADIUS[gid] ?? 3.0;
        // House 1 at top (−π/2), going clockwise
        const angle = ((p.house - 1) / 12) * Math.PI * 2 - Math.PI / 2;
        // Small y-stagger when multiple planets share a house
        houseCount[p.house] = (houseCount[p.house] ?? 0);
        const yOff = (houseCount[p.house]++ % 2 === 0) ? 0 : 0.28;

        const x = orbit === 0 ? 0 : Math.cos(angle) * orbit;
        const z = orbit === 0 ? 0 : Math.sin(angle) * orbit;
        const pal = PALETTE[gid] ?? { core: "#C8A24A", accent: "#F0CE7A" };

        return {
          placement: p,
          grahaId: gid,
          orbit,
          worldPos: new THREE.Vector3(x, yOff, z),
          palette: pal,
          isShadow: gid === "rahu" || gid === "ketu",
          size: GRAHA_SIZE[gid] ?? 0.18,
          element: graha.element ?? "fire",
          glowColor: resolveGlowColor(p.dignity, pal),
        } satisfies PlanetData;
      })
      .filter(Boolean) as PlanetData[];
  }, [chart.placements]);

  const focusedPlanet = planets.find(p => p.grahaId === focusedId) ?? null;

  const handleClick = useCallback((id: string) => {
    setFocusedId(prev => prev === id ? null : id);
  }, []);
  const handleHover = useCallback((id: string | null) => setHoveredId(id), []);

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 110px)" }}>
      <Canvas
        aria-hidden="true"
        camera={{ position: [0, 4.2, 10.5], fov: 48 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "calc(100vh - 110px)", touchAction: "none" }}
      >
        <AdaptiveDpr pixelated />
        <PerformanceMonitor>
          <OrreryScene
            planets={planets}
            focusedId={focusedId}
            onHover={handleHover}
            onClick={handleClick}
            reduced={reduced}
          />
        </PerformanceMonitor>
      </Canvas>

      {/* Bhava-chamber reading panel */}
      {focusedPlanet && (
        <ReadingPanel
          data={focusedPlanet}
          chart={chart}
          onBack={() => setFocusedId(null)}
        />
      )}

      {/* Hint when nothing is focused */}
      {!focusedId && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            fontSize: "0.76rem",
            color: "rgba(143,151,184,0.55)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Planets placed by your natal houses · tap to open bhava reading
        </div>
      )}
    </div>
  );
}
