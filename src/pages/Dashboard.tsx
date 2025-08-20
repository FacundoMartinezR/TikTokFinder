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

  // 1) Traer usuario al cargar
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:4000/auth/me", {
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
      console.error("No hay user.id disponible para crear la suscripción");
      alert("No estás autenticado correctamente. Vuelve a iniciar sesión.");
      return;
    }

    setWorking(true);
    console.log("Iniciando create-subscription para userId:", user.id);

    try {
      const res = await fetch("http://localhost:4000/paypal/create-subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      console.log("create-subscription response:", data);

      if (res.ok && data.approveLink) {
        // Redirijo a PayPal
        window.location.href = data.approveLink;
      } else {
        // Mostrar error claro al usuario y en consola
        console.error("No se obtuvo link de aprobación de PayPal", data);
        alert("Error iniciando pago. Revisa la consola del servidor para más detalles.");
      }
    } catch (err) {
      console.error("Error al crear suscripción:", err);
      alert("Error al crear suscripción. Ver consola.");
    } finally {
      setWorking(false);
    }
  };

  // 3) Al volver desde PayPal: leer subscription_id y chequear estado
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionId = params.get("subscription_id") || params.get("subscriptionId"); // variantes
    if (!subscriptionId) return;
    if (!user?.id) {
      // Si aún no cargó el user, esperar a que se cargue (useEffect con dependencia [user] se reejecutará)
      return;
    }

    // evitar doble check
    if (checkingSubscription) return;

    const doCheck = async () => {
      setCheckingSubscription(true);
      console.log("Chequeando suscripción PayPal:", subscriptionId, "para user:", user.id);

      try {
        const res = await fetch("http://localhost:4000/paypal/check-subscription", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, subscriptionId }),
        });

        const data = await res.json();
        console.log("check-subscription response:", data);

        if (res.ok && data.success) {
          // Actualizamos rol localmente para UX inmediata
          setUser((prev) => (prev ? { ...prev, role: "PAID" } : prev));
          alert("¡Suscripción activada! Ahora tienes acceso completo.");
          // limpiar params de URL
          window.history.replaceState({}, "", "/dashboard");
        } else {
          const status = data.status ?? data.error ?? "unknown";
          console.warn("Suscripción no activa:", status);
          alert("Tu suscripción aún está pendiente o falló. Revisa tu cuenta de PayPal.");
        }
      } catch (err) {
        console.error("Error checando suscripción:", err);
        alert("Error verificando suscripción. Ver consola del servidor.");
      } finally {
        setCheckingSubscription(false);
      }
    };

    doCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // se ejecuta cuando user cambia (asegura que user.id exista)

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

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-4">Welcome {user.name}, full dashboard unlocked!</h1>
      {/* contenido premium */}
      <p>Acceso completo activado. 🎉</p>
    </div>
  );
};

export default Dashboard;
