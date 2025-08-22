// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";

type User = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  paypalSubscriptionId?: string;
};

type Tiktoker = {
  id: string;
  handle: string;
  name?: string;
  avatarUrl?: string;
  country?: string;
  niches: string[];
  followers: number;
  engagementRate: number;
};

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Explorador de tiktokers
  const [tiktokers, setTiktokers] = useState<Tiktoker[]>([]);
  const [filters, setFilters] = useState({
    country: "",
    niche: "",
    minFollowers: "",
    maxFollowers: "",
    sortBy: "followers",
  });
  const [loadingTiktokers, setLoadingTiktokers] = useState(false);

  // ============================
  // USER MANAGEMENT
  // ============================
  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://tiktokfinder.onrender.com/auth/me", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok && data.user) setUser(data.user);
      else setUser(null);
    } catch (err) {
      console.error("Error fetching user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // ============================
  // SUBSCRIPTION
  // ============================
  const handleBuyEarlyAccess = async () => {
    if (!user?.id) return alert("No estás autenticado correctamente.");

    setWorking(true);
    try {
      const res = await fetch("https://tiktokfinder.onrender.com/paypal/create-subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (res.ok && data.approveLink) window.location.href = data.approveLink;
      else alert("Error iniciando pago. Revisa la consola del servidor.");
    } catch (err) {
      console.error("Error al crear suscripción:", err);
      alert("Error al crear suscripción. Revisa la consola del servidor.");
    } finally {
      setWorking(false);
    }
  };

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

        if (res.ok && data.success) alert("¡Suscripción activada! Ahora tienes acceso completo.");
        else alert("Tu suscripción aún está pendiente o falló. Revisa tu cuenta de PayPal.");
        window.history.replaceState({}, "", "/dashboard");
      } catch (err) {
        console.error("Error checando suscripción:", err);
        alert("Error verificando suscripción. Revisa la consola del servidor.");
      } finally {
        setCheckingSubscription(false);
      }
    };

    doCheck();
  }, [user, checkingSubscription]);

  const handleCancelSubscription = async () => {
    if (!user?.paypalSubscriptionId) return;
    const confirmed = window.confirm(
      "¿Seguro deseas cancelar tu suscripción? Esto te devolverá al plan FREE."
    );
    if (!confirmed) return;

    setCanceling(true);

    setUser((prev) => (prev ? { ...prev, role: "FREE" } : prev));

    try {
      const res = await fetch("https://tiktokfinder.onrender.com/paypal/cancel-subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: user.paypalSubscriptionId, userId: user.id }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        alert("Solicitud de cancelación enviada. Tu rol fue actualizado a FREE inmediatamente.");
      } else {
        console.error("Cancel subscription error:", data);
        await fetchUser();
      }
    } catch (err) {
      console.error("Error canceling subscription:", err);
      await fetchUser();
    } finally {
      setCanceling(false);
    }
  };

  // ============================
  // TIKTOKERS FETCH
  // ============================
  const fetchTiktokers = async () => {
    setLoadingTiktokers(true);
    try {
      const params = new URLSearchParams(filters as any).toString();
      const res = await fetch(`https://tiktokfinder.onrender.com/tiktokers?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) setTiktokers(data.results);
    } catch (err) {
      console.error("Error fetching tiktokers:", err);
    } finally {
      setLoadingTiktokers(false);
    }
  };

  useEffect(() => {
    if (user?.role === "PAID") fetchTiktokers();
  }, [user, filters]);

  // ============================
  // UI
  // ============================
  if (loading) return <p className="p-10">Loading...</p>;
  if (!user) return <p className="p-10">You must be logged in to see this page.</p>;

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
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Welcome {user.name}, full dashboard unlocked 🎉</h1>
        <button
          className="px-6 py-3 bg-red-600 text-white rounded-xl disabled:opacity-60"
          onClick={handleCancelSubscription}
          disabled={canceling}
        >
          {canceling ? "Cancelando..." : "Cancelar suscripción"}
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <input
          type="text"
          placeholder="País"
          className="border rounded-lg px-3 py-2"
          value={filters.country}
          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
        />
        <input
          type="text"
          placeholder="Nicho"
          className="border rounded-lg px-3 py-2"
          value={filters.niche}
          onChange={(e) => setFilters({ ...filters, niche: e.target.value })}
        />
        <input
          type="number"
          placeholder="Min followers"
          className="border rounded-lg px-3 py-2"
          value={filters.minFollowers}
          onChange={(e) => setFilters({ ...filters, minFollowers: e.target.value })}
        />
        <input
          type="number"
          placeholder="Max followers"
          className="border rounded-lg px-3 py-2"
          value={filters.maxFollowers}
          onChange={(e) => setFilters({ ...filters, maxFollowers: e.target.value })}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
        >
          <option value="followers">Ordenar por Followers</option>
          <option value="engagement">Ordenar por Engagement</option>
        </select>
      </div>

      {/* Resultados */}
      {loadingTiktokers ? (
        <p>Cargando tiktokers...</p>
      ) : (
        <div className="overflow-x-auto">
          {/* Desktop table */}
          <table className="hidden md:table w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Avatar</th>
                <th className="p-3">Handle</th>
                <th className="p-3">Country</th>
                <th className="p-3">Niches</th>
                <th className="p-3">Followers</th>
                <th className="p-3">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {tiktokers.map((tk) => (
                <tr key={tk.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <img src={tk.avatarUrl || ""} alt="" className="w-10 h-10 rounded-full" />
                  </td>
                  <td className="p-3">@{tk.handle}</td>
                  <td className="p-3">{tk.country}</td>
                  <td className="p-3">{tk.niches.join(", ")}</td>
                  <td className="p-3">{tk.followers.toLocaleString()}</td>
                  <td className="p-3">{(tk.engagementRate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {tiktokers.map((tk) => (
              <div
                key={tk.id}
                className="p-4 border rounded-lg shadow flex items-center gap-4"
              >
                <img src={tk.avatarUrl || ""} alt="" className="w-12 h-12 rounded-full" />
                <div>
                  <p className="font-bold">@{tk.handle}</p>
                  <p className="text-sm text-gray-500">{tk.country}</p>
                  <p className="text-sm">Followers: {tk.followers.toLocaleString()}</p>
                  <p className="text-sm">Engagement: {(tk.engagementRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
