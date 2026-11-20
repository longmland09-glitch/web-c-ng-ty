"use client";

import { useRef, type PointerEvent } from "react";
import RemoteImg from "./RemoteImg";

/**
 * Studio presentation for a machine photo: black backdrop with a back-light,
 * the photo's edges fading into the black, a floor shadow and reflection,
 * and a 3D tilt that follows the pointer (off under reduced motion / touch).
 */
export default function MachineStage({
  src,
  alt,
  className = "",
  cutout = false,
}: {
  src: string;
  alt: string;
  className?: string;
  /** true when src is a transparent, background-removed PNG */
  cutout?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const move = (e: PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(x * 16).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty("--lx", `${50 + x * 40}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--lx", "50%");
  };

  return (
    <span ref={ref} className={`stage ${className}`} data-cutout={cutout || undefined} onPointerMove={move} onPointerLeave={leave}>
      <span className="stage-light" aria-hidden="true" />
      <span className="stage-floor" aria-hidden="true" />
      <span className="stage-object">
        <RemoteImg src={src} alt={alt} />
      </span>
    </span>
  );
}
