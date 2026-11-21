import RemoteImg from "./RemoteImg";

/** Machine photo filling its card frame. */
export default function MachineStage({ src, alt, className = "" }: { src: string; alt: string; className?: string; cutout?: boolean }) {
  return (
    <span className={`stage ${className}`}>
      <RemoteImg src={src} alt={alt} />
    </span>
  );
}
