// src/pages/Exchange.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "https://tiktokfinder.onrender.com";

export default function Exchange() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState<string>("Finalizando login...");

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (!code) {
          setStatus("error");
          setMessage("Código de intercambio no encontrado en la URL.");
          // redirigir al home pronto
          setTimeout(() => navigate("/", { replace: true }), 1500);
          return;
        }

        const res = await fetch(`${API_BASE}/auth/exchange`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("Exchange failed:", res.status, txt);
          setStatus("error");
          setMessage("No se pudo finalizar el login. Redirigiendo...");
          setTimeout(() => navigate("/", { replace: true }), 1800);
          return;
        }

        // cookie creada por el backend
        setStatus("ok");
        setMessage("Login completado. Redirigiendo al dashboard...");
        setTimeout(() => navigate("/dashboard", { replace: true }), 700);
      } catch (err) {
        console.error("Exchange error:", err);
        setStatus("error");
        setMessage("Error de red. Redirigiendo...");
        setTimeout(() => navigate("/", { replace: true }), 1500);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-6 bg-white rounded shadow text-center">
        <h2 className="font-semibold mb-2">
          {status === "working" ? "Finalizando inicio de sesión…" : status === "ok" ? "¡Bienvenido!" : "Error"}
        </h2>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
