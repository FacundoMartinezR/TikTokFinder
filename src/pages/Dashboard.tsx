// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";

type User = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  paypalSubscriptionId?: string;
};

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false); // boton deshabilitado mientras crea subscripción/checkea
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // 1) Traer usuario al cargar
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://tiktokfinder.onrender.com/auth/me", {
          credentials: "include",
        });
        const data = await res.json();
        console.log("fetch /auth/me ->", data);
        if (data.ok && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // 2) Crear suscripción y redirigir a PayPal
  const handleBuyEarlyAccess = async () => {
    if (!user?.id) {
      alert("No estás autenticado correctamente. Vuelve a iniciar sesión.");
      return;
    }

    setWorking(true);
    try {
      const res = await fetch("https://tiktokfinder.onrender.com/paypal/create-subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      console.log("create-subscription response:", data);

      if (res.ok && data.approveLink) {
        window.location.href = data.approveLink;
      } else {
        alert("Error iniciando pago. Revisa la consola del servidor para más detalles.");
      }
    } catch (err) {
      console.error("Error al crear suscripción:", err);
      alert("Error al crear suscripción. Revisa la consola del servidor.");
    } finally {
      setWorking(false);
    }
  };

  // 3) Chequear suscripción después del retorno de PayPal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionId = params.get("subscription_id") || params.get("subscriptionId");
    if (!subscriptionId || !user?.id || checkingSubscription) return;

    const doCheck = async () => {
      setCheckingSubscription(true);
      try {
        const res = await fetch("https://tiktokfinder.onrender.com/paypal/check-subscription", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, subscriptionId }),
        });
        const data = await res.json();
        console.log("check-subscription response:", data);

        if (res.ok && data.success) {
          // solo UX: mostrar mensaje
          alert("¡Suscripción activada! Ahora tienes acceso completo.");
          window.history.replaceState({}, "", "/dashboard");
          // no actualizamos role localmente, el webhook será la fuente de verdad
        } else {
          alert("Tu suscripción aún está pendiente o falló. Revisa tu cuenta de PayPal.");
        }
      } catch (err) {
        console.error("Error checando suscripción:", err);
        alert("Error verificando suscripción. Revisa la consola del servidor.");
      } finally {
        setCheckingSubscription(false);
      }
    };

    doCheck();
  }, [user, checkingSubscription]);

  // 4) Cancelar suscripción
  const handleCancelSubscription = async () => {
    if (!user?.paypalSubscriptionId) return;
    const confirmed = window.confirm("¿Seguro deseas cancelar tu suscripción? Esto te devolverá al plan FREE.");
    if (!confirmed) return;

    setCanceling(true);
    try {
      const res = await fetch("https://tiktokfinder.onrender.com/paypal/cancel-subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: user.paypalSubscriptionId, userId: user.id }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        alert("Solicitud de cancelación enviada. Tu rol será actualizado automáticamente vía webhook.");
      } else {
        console.error("Cancel subscription error:", data);
        alert("No se pudo cancelar la suscripción. Revisa la consola.");
      }
    } catch (err) {
      console.error("Error canceling subscription:", err);
      alert("Error cancelando suscripción. Revisa la consola.");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>You must be logged in to see this page.</p>;

  // UI según rol
  if (user.role === "FREE") {
    return (
      <div className="p-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Limited Dashboard</h1>
        <p>Upgrade to Early Access to see full benefits 🚀</p>
        <button
          className="mt-6 px-8 py-4 bg-primary text-white rounded-xl text-lg disabled:opacity-60"
          onClick={handleBuyEarlyAccess}
          disabled={working}
        >
          {working ? "Processing..." : "Buy Early Access"}
        </button>
        <div className="mt-6 text-sm text-muted-foreground">
          <p>Si ya pagaste y te redirigieron de vuelta, espera unos segundos mientras verificamos tu suscripción.</p>
        </div>
      </div>
    );
  }

  // Usuarios PAID
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-4">Welcome {user.name}, full dashboard unlocked!</h1>
      <p>Acceso completo activado. 🎉</p>

      <button
        className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl disabled:opacity-60"
        onClick={handleCancelSubscription}
        disabled={canceling}
      >
        {canceling ? "Cancelando..." : "Cancelar suscripción"}
      </button>
    </div>
  );
};

export default Dashboard;
