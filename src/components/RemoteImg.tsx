"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

/**
 * Image served from the company's existing website. If it cannot load,
 * a neutral panel with the caption is shown instead of a broken image.
 * Errors that happen before hydration are caught by checking the element on mount.
 */
export default function RemoteImg({ alt, className, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [rest.src]);

  if (failed)
    return (
      <span className={`img-fallback ${className ?? ""}`} role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
        {alt && <span>{alt}</span>}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
