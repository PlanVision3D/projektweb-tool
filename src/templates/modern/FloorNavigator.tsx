"use client";
import { useState, useMemo } from "react";
import type { FloorNavigator as Nav, NavZone } from "@/types/content";
import styles from "./modern.module.css";

function centroid(points: { x: number; y: number }[]) {
  const n = points.length || 1;
  return { x: points.reduce((s, p) => s + p.x, 0) / n, y: points.reduce((s, p) => s + p.y, 0) / n };
}

export default function FloorNavigator({ nav }: { nav: Nav }) {
  const byId = useMemo(() => Object.fromEntries(nav.artboards.map((a) => [a.id, a])), [nav]);
  const [currentId, setCurrentId] = useState(nav.rootId);
  const [hover, setHover] = useState<string | null>(null);
  const [fadeKey, setFadeKey] = useState(0);
  const art = byId[currentId] ?? nav.artboards[0];
  const root = byId[nav.rootId];
  if (!art) return null;

  const goto = (id?: string) => { if (!id || !byId[id]) return; setCurrentId(id); setHover(null); setFadeKey((k) => k + 1); };
  const isRoot = currentId === nav.rootId;
  const floorZones = root?.zones.filter((z) => z.points && z.points.length) ?? [];

  return (
    <div className={styles.finderLayout}>
      {/* Seitenleiste der Geschosse */}
      <div className={styles.floorSidebar}>
        <div className={styles.floorSideTitle}>Geschosse</div>
        {floorZones.map((z) => (
          <button
            key={z.id}
            className={`${styles.floorSideBtn} ${currentId === z.target ? styles.activeFloor : ""}`}
            onMouseEnter={() => { if (isRoot) setHover(z.id); }}
            onMouseLeave={() => { if (isRoot) setHover((h) => (h === z.id ? null : h)); }}
            onClick={() => goto(z.target)}
          >
            {z.title} <span className="cnt">›</span>
          </button>
        ))}
      </div>

      {/* Navigator-Bühne */}
      <div className={styles.navWrap}>
        <div className={styles.navBar}>
          <button className={styles.navBack} onClick={() => goto(art.backTarget)} disabled={!art.backTarget}>← Zurück</button>
          <span className={styles.navTitle}>{art.title}</span>
          <span className={styles.navHint}>{isRoot ? "Geschoss wählen" : art.zones.some((z) => z.target) ? "Wohnung wählen" : "Grundriss"}</span>
        </div>
        <div className={styles.navStage} key={fadeKey}>
          <img src={art.image.url} alt={art.title} className={styles.navImage} />
          <svg className={styles.navSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            {art.zones.filter((z) => z.points && z.points.length).map((z: NavZone) => (
              <polygon key={z.id} points={z.points!.map((p) => `${p.x},${p.y}`).join(" ")}
                className={`${styles.navZone} ${hover === z.id ? styles.navZoneHover : ""}`}
                onMouseEnter={() => setHover(z.id)} onMouseLeave={() => setHover((h) => (h === z.id ? null : h))}
                onClick={() => goto(z.target)} />
            ))}
          </svg>
          {art.zones.filter((z) => z.points && z.tooltip).map((z) => {
            const c = centroid(z.points!);
            return <div key={`t-${z.id}`} className={`${styles.navTip} ${hover === z.id ? styles.navTipShow : ""}`} style={{ left: `${c.x}%`, top: `${c.y}%` }}>{z.tooltip}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
