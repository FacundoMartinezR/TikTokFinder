// src/pages/PaypalSuccess.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PaypalSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [msg, setMsg] = useState<string>("Verificando suscripción...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionId = params.get("subscription_id") || params.get("subscriptionId");
    // ba_token y token los deja PayPal, pero nosotros necesitamos subscription_id
    if (!subscriptionId) {
      setMsg("No se encontró subscription_id en la URL.");
      setLoading(false);
      return;
    }

    const check = async () => {
      setLoading(true);
      try {
        // Obtener info de usuario (si tu endpoint auth/me está protegido por cookie)
        const meRes = await fetch("https://tiktokfinder.onrender.com/auth/me", { credentials: "include" });
        const meJson = await meRes.json();
        if (!meJson.ok || !meJson.user?.id) {
          setMsg("No se pudo obtener la sesión del usuario. Inicia sesión de nuevo.");
          setLoading(false);
          return;
        }
        const userId = meJson.user.id;

        // Llamar a /paypal/check-subscription pasando subscriptionId y userId
        const res = await fetch("https://tiktokfinder.onrender.com/paypal/check-subscription", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, subscriptionId }),
        });

        const data = await res.json();
        console.log("check-subscription ->", data);

        if (res.ok && data.success) {
          setMsg("¡Suscripción activada! Redirigiendo al dashboard...");
          // pequeña espera UX
          setTimeout(() => navigate("/dashboard"), 1200);
        } else {
          const status = data.status ?? data.error ?? "desconocido";
          setMsg(`La suscripción no está activa: ${status}. Revisa tu cuenta PayPal.`);
          // opcional: redirigir al dashboard con rol FREE después de 3s
          setTimeout(() => navigate("/dashboard"), 3000);
        }
      } catch (err) {
        console.error("Error en PaypalSuccess:", err);
        setMsg("Error verificando suscripción. Revisa la consola del servidor.");
      } finally {
        setLoading(false);
      }
    };

    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Verificando pago</h2>
        <p className="mb-4">{msg}</p>
        {loading ? <p>Espere...</p> : <button onClick={() => navigate("/dashboard")} className="underline">Ir al dashboard</button>}
      </div>
    </div>
  );
};

export default PaypalSuccess;
