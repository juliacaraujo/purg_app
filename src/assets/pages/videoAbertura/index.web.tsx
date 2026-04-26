import React, { useEffect, useRef, useState } from "react";

type Props = { onConcluido: () => void };

export default function VideoAbertura({ onConcluido }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@keyframes purgFlash{0%{opacity:0}30%{opacity:1}80%{opacity:1}100%{opacity:0}}`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(onConcluido);
    v.onerror = onConcluido;
    v.onended = () => {
      setFlash(true);
      setTimeout(onConcluido, 750);
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "#000", zIndex: 9999 }}>
      <video
        ref={ref}
        src="/abertura.mp4"
        muted
        playsInline
        autoPlay
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#fff",
          opacity: 0,
          animation: flash ? "purgFlash 0.75s ease-out forwards" : "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
