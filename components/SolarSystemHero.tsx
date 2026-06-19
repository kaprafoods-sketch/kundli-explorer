"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Stars, AdaptiveDpr, PerformanceMonitor, Float, Html, Environment, OrbitControls,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { GRAHA_COLORS, type GrahaColorKey } from "@/lib/grahaColors";

// ── Jyotish graha configuration ──────────────────────────────────────────────

const GRAHAS_CONFIG = [
  { id: "sun",     sanskrit: "Surya",   en: "Sun",     glyph: "☉", orbit: 0,   speed: 0,     size: 0.34, rings: false, keywords: "Soul · Vitality · Father" },
  { id: "moon",    sanskrit: "Chandra", en: "Moon",    glyph: "☽", orbit: 1.9, speed: 0.52,  size: 0.17, rings: false, keywords: "Mind · Emotions · Mother" },
  { id: "mercury", sanskrit: "Budha",   en: "Mercury", glyph: "☿", orbit: 1.4, speed: 0.48,  size: 0.14, rings: false, keywords: "Intellect · Speech · Commerce" },
  { id: "venus",   sanskrit: "Shukra",  en: "Venus",   glyph: "♀", orbit: 2.2, speed: 0.42,  size: 0.17, rings: false, keywords: "Beauty · Love · Pleasures" },
  { id: "mars",    sanskrit: "Mangala", en: "Mars",    glyph: "♂", orbit: 3.0, speed: 0.35,  size: 0.16, rings: false, keywords: "Energy · Courage · Conflict" },
  { id: "rahu",    sanskrit: "Rahu",    en: "Rahu",    glyph: "☊", orbit: 3.8, speed: -0.19, size: 0.14, rings: false, keywords: "Desire · Obsession · Foreign" },
  { id: "ketu",    sanskrit: "Ketu",    en: "Ketu",    glyph: "☋", orbit: 3.8, speed: -0.19, size: 0.14, rings: false, keywords: "Liberation · Past life · Moksha" },
  { id: "jupiter", sanskrit: "Guru",    en: "Jupiter", glyph: "♃", orbit: 4.8, speed: 0.18,  size: 0.29, rings: false, keywords: "Wisdom · Expansion · Grace" },
  { id: "saturn",  sanskrit: "Shani",   en: "Saturn",  glyph: "♄", orbit: 6.0, speed: 0.11,  size: 0.26, rings: true,  keywords: "Karma · Discipline · Patience" },
] as const;

const GRAHAS = GRAHAS_CONFIG.map(g => ({
  ...g,
  color:    GRAHA_COLORS[g.id as GrahaColorKey].core,
  emissive: GRAHA_COLORS[g.id as GrahaColorKey].emissive,
}));

type GrahaConfig = typeof GRAHAS[number];

// ── Reduced-motion hook ───────────────────────────────────────────────────────

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ── Orbit ring ────────────────────────────────────────────────────────────────

function OrbitRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.009, 2, 128]} />
      <meshBasicMaterial color="#C8A24A" transparent opacity={0.09} />
    </mesh>
  );
}

// ── Sun ───────────────────────────────────────────────────────────────────────

function Sun({ onHover, onClick }: {
  onHover: (id: string | null) => void;
  onClick: (g: GrahaConfig) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const coronaRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const cfg = GRAHAS[0]; // sun

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) meshRef.current.rotation.y = t * 0.15;
    if (coronaRef.current) {
      const pulse = 1 + 0.06 * Math.sin(t * 1.8);
      coronaRef.current.scale.setScalar(pulse);
      (coronaRef.current.material as THREE.MeshBasicMaterial).opacity =
        THREE.MathUtils.lerp(
          (coronaRef.current.material as THREE.MeshBasicMaterial).opacity,
          hovered ? 0.25 : 0.12,
          0.08
        );
    }
  });

  return (
    <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.06}>
      <group>
        {/* Core sphere */}
        <mesh
          ref={meshRef}
          onPointerDown={(e) => { e.stopPropagation(); dragOrigin.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }; }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover("sun"); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = "auto"; }}
          onClick={(e) => { e.stopPropagation(); const dx = e.nativeEvent.clientX - dragOrigin.current.x; const dy = e.nativeEvent.clientY - dragOrigin.current.y; if (Math.hypot(dx, dy) < 5) onClick(cfg); }}
        >
          <sphereGeometry args={[cfg.size, 32, 32]} />
          <meshStandardMaterial
            color={cfg.color}
            emissive={cfg.emissive}
            emissiveIntensity={hovered ? 4.5 : 3.5}
            roughness={0.9}
          />
        </mesh>
        {/* Corona glow */}
        <mesh ref={coronaRef}>
          <sphereGeometry args={[cfg.size * 1.55, 24, 24]} />
          <meshBasicMaterial color="#FCD34D" transparent opacity={0.12} side={THREE.BackSide} />
        </mesh>
        {/* Hover label */}
        {hovered && (
          <Html center position={[0, cfg.size + 0.28, 0]} style={{ pointerEvents: "none" }}>
            <div style={{
              background: "rgba(10,15,36,0.92)",
              border: "1px solid #C8A24A",
              borderRadius: 6, padding: "3px 10px", whiteSpace: "nowrap",
              fontSize: 12, color: "#ECE7D7", fontFamily: "system-ui",
            }}>
              {cfg.sanskrit} / {cfg.en}
            </div>
          </Html>
        )}
      </group>
    </Float>
  );
}

// ── Planet ────────────────────────────────────────────────────────────────────

function Planet({ cfg, initialAngle, reduced, onHover, onClick }: {
  cfg: GrahaConfig;
  initialAngle: number;
  reduced: boolean;
  onHover: (id: string | null) => void;
  onClick: (g: GrahaConfig) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const matRef   = useRef<THREE.MeshPhysicalMaterial>(null!);
  const glowRef  = useRef<THREE.MeshBasicMaterial>(null!);
  const [hovered, setHovered] = useState(false);
  const dragOrigin = useRef({ x: 0, y: 0 });

  // Rahu and Ketu are always opposite — offset Ketu by π
  const angleOffset = cfg.id === "ketu" ? initialAngle + Math.PI : initialAngle;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = reduced ? 0 : clock.getElapsedTime();
    const angle = t * cfg.speed + angleOffset;
    groupRef.current.position.x = Math.cos(angle) * cfg.orbit;
    groupRef.current.position.z = Math.sin(angle) * cfg.orbit;

    const tScale = hovered ? 1.45 : 1;
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, tScale, 0.1)
    );
    if (matRef.current) {
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity, hovered ? 2.8 : 0.8, 0.09
      );
    }
    if (glowRef.current) {
      glowRef.current.opacity = THREE.MathUtils.lerp(
        glowRef.current.opacity, hovered ? 0.2 : 0, 0.09
      );
    }
  });

  return (
    <group ref={groupRef}>
      <mesh
        onPointerDown={(e) => { e.stopPropagation(); dragOrigin.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }; }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(cfg.id); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = "auto"; }}
        onClick={(e) => { e.stopPropagation(); const dx = e.nativeEvent.clientX - dragOrigin.current.x; const dy = e.nativeEvent.clientY - dragOrigin.current.y; if (Math.hypot(dx, dy) < 5) onClick(cfg); }}
      >
        <sphereGeometry args={[cfg.size, 28, 28]} />
        <meshPhysicalMaterial
          ref={matRef}
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={0.8}
          metalness={0.15}
          roughness={0.4}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[cfg.size * 1.9, 16, 16]} />
        <meshBasicMaterial ref={glowRef} color={cfg.emissive} transparent opacity={0} side={THREE.BackSide} />
      </mesh>

      {/* Saturn rings */}
      {cfg.rings && (
        <mesh rotation={[Math.PI / 3.2, 0, 0.3]}>
          <torusGeometry args={[cfg.size * 1.9, cfg.size * 0.22, 3, 64]} />
          <meshPhysicalMaterial
            color="#C8A24A" metalness={0.3} roughness={0.6} transparent opacity={0.55}
          />
        </mesh>
      )}

      {/* Hover label */}
      {hovered && (
        <Html center position={[0, cfg.size + 0.22, 0]} style={{ pointerEvents: "none" }}>
          <div style={{
            background: "rgba(10,15,36,0.92)",
            border: "1px solid #C8A24A",
            borderRadius: 6, padding: "3px 10px", whiteSpace: "nowrap",
            fontSize: 12, color: "#ECE7D7", fontFamily: "system-ui",
          }}>
            {cfg.glyph} {cfg.sanskrit}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Full scene ────────────────────────────────────────────────────────────────

function Scene({ reduced, onHover, onClick }: {
  reduced: boolean;
  onHover: (id: string | null) => void;
  onClick: (g: GrahaConfig) => void;
}) {
  // Stable random initial angles per planet
  const initialAngles = useMemo(
    () => GRAHAS.map((_, i) => (i / GRAHAS.length) * Math.PI * 2 + Math.random() * 0.5),
    []
  );

  return (
    <>
      <color attach="background" args={["#0A0F24"]} />
      <ambientLight intensity={0.04} />
      {/* Sun light (from center) */}
      <pointLight position={[0, 0, 0]} intensity={18} color="#FCD34D" decay={2} distance={18} />
      {/* Rim / mood light */}
      <directionalLight position={[-6, -2, -5]} intensity={1.8} color="#7c5cff" />
      <directionalLight position={[8, 3, 4]} intensity={0.6} color="#C8A24A" />

      <Stars radius={90} depth={60} count={reduced ? 2000 : 5000} factor={3.5} saturation={0} fade />
      <Environment preset="night" />

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
        maxDistance={16}
        target={[0, 0, 0]}
      />

      {/* Orbit rings */}
      {GRAHAS.filter(g => g.orbit > 0).map((g, i) => (
        <OrbitRing key={`ring-${g.id}`} radius={g.orbit} />
      ))}

      {/* Sun */}
      <Sun onHover={onHover} onClick={onClick} />

      {/* Orbiting planets */}
      {GRAHAS.filter(g => g.orbit > 0).map((g, i) => (
        <Planet
          key={g.id}
          cfg={g}
          initialAngle={initialAngles[i + 1] ?? 0}
          reduced={reduced}
          onHover={onHover}
          onClick={onClick}
        />
      ))}

      {reduced ? null : (
        <EffectComposer>
          <Bloom luminanceThreshold={0.55} intensity={0.9} radius={0.45} />
          <Vignette eskil={false} offset={0.08} darkness={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

// ── Planet info card (DOM overlay) ───────────────────────────────────────────

function PlanetCard({ graha, onClose }: { graha: GrahaConfig; onClose: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "12%",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(11,16,36,0.96)",
        border: "1px solid #C8A24A",
        borderRadius: 14,
        padding: "22px 36px",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        textAlign: "center",
        minWidth: 220,
        animation: "cardIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        zIndex: 40,
      }}
    >
      <div style={{ fontSize: "2.8rem", color: "#F0CE7A", lineHeight: 1 }}>{graha.glyph}</div>
      <div style={{
        fontSize: "1.15rem", color: "#ECE7D7", fontFamily: "Georgia,serif",
        marginTop: 8, letterSpacing: "0.03em",
      }}>
        {graha.sanskrit} / {graha.en}
      </div>
      <div style={{
        fontSize: "0.78rem", color: "#8E97B8", marginTop: 6, letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}>
        {graha.keywords}
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute", top: 10, right: 14, background: "none", border: "none",
          color: "#5B648C", fontSize: 18, cursor: "pointer", lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function SolarSystemHero() {
  const reduced = useReducedMotion();
  const [activeGraha, setActiveGraha] = useState<GrahaConfig | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback((g: GrahaConfig) => setActiveGraha(g), []);
  const handleHover = useCallback((id: string | null) => setHoveredId(id), []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>

      <Canvas
        aria-hidden="true"
        camera={{ position: [0, 3.2, 9], fov: 48 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        style={{ display: "block", touchAction: "none" }}
      >
        <AdaptiveDpr pixelated />
        <PerformanceMonitor>
          <Scene reduced={reduced} onHover={handleHover} onClick={handleClick} />
        </PerformanceMonitor>
      </Canvas>

      {/* Planet info card */}
      {activeGraha && (
        <PlanetCard graha={activeGraha} onClose={() => setActiveGraha(null)} />
      )}
    </div>
  );
}
