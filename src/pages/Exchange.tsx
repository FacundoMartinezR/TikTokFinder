// IMPORTANTE: este archivo debe ser el que Invoca /auth/exchange
import { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE || "https://tiktokfinder.onrender.com";

export default function Exchange() {
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (!code) {
          setStatus("error");
          setTimeout(() => (window.location.href = "/"), 1300);
          return;
        }

        // 1) POST exchange — CREDENTIALS INCLUDE es crítico
        const res = await fetch(`${API_BASE}/auth/exchange`, {
          method: "POST",
          credentials: "include",            // <- aquí
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          console.error("Exchange failed", res.status, await res.text().catch(() => ""));
          setStatus("error");
          setTimeout(() => (window.location.href = "/"), 1400);
          return;
        }

        // 2) Espera explícita breve para que el navegador procese Set-Cookie (muy raro,
        //    pero ayuda en navegadores que a veces tardan lo justo a persistir cookie)
        await res.text().catch(() => "");
        // opcional: pequeño delay (50-150ms) para asegurarnos
        await new Promise(r => setTimeout(r, 120));

        // 3) Ahora redirigir al dashboard (desde tu dominio)
        setStatus("ok");
        window.location.replace("/dashboard");
      } catch (err) {
        console.error("Exchange error", err);
        setStatus("error");
        setTimeout(() => (window.location.href = "/"), 1400);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>{status === "working" ? "Finalizando..." : status === "ok" ? "Listo!" : "Error..."}</div>
    </div>
  );
}