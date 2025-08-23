// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";

type User = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  paypalSubscriptionId?: string | null;
};

type Tiktoker = {
  id: string;
  handle: string;
  name?: string;
  avatarUrl?: string;
  profileUrl?: string | null;
  country?: string;
  niches: string[];
  followers: number;
  engagementRate: number;
  avgViews?: number | null;
};

const API_BASE = "https://tiktokfinder.onrender.com"; // ajusta si corresponde

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
    sortBy: "followers"
  });
  const [loadingTiktokers, setLoadingTiktokers] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 25;

  // total / paginación
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // ============================
  // USER
  // ============================
  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
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
      const res = await fetch(`${API_BASE}/paypal/create-subscription`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok && data.approveLink) window.location.href = data.approveLink;
      else {
        console.error("create-subscription error:", data);
        alert("Error iniciando pago. Revisa la consola del servidor.");
      }
    } catch (err) {
      console.error("Error al crear suscripción:", err);
      alert("Error al crear suscripción. Revisa la consola del servidor.");
    } finally {
      setWorking(false);
    }
  };

  // check-subscription on return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionId = params.get("subscription_id") || params.get("subscriptionId");
    if (!subscriptionId || !user?.id || checkingSubscription) return;

    const doCheck = async () => {
      setCheckingSubscription(true);
      try {
        const res = await fetch(`${API_BASE}/paypal/check-subscription`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, subscriptionId })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, checkingSubscription]);

  const handleCancelSubscription = async () => {
    if (!user?.paypalSubscriptionId) return;
    const confirmed = window.confirm("¿Seguro deseas cancelar tu suscripción? Esto te devolverá al plan FREE.");
    if (!confirmed) return;

    setCanceling(true);
    // actualizar UI inmediatamente a FREE (solicitud al backend sigue)
    setUser(prev => (prev ? { ...prev, role: "FREE", paypalSubscriptionId: null } : prev));

    try {
      const res = await fetch(`${API_BASE}/paypal/cancel-subscription`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: user.paypalSubscriptionId, userId: user.id })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        alert("Solicitud de cancelación enviada. Tu rol fue actualizado a FREE inmediatamente.");
        // refrescar user para consistencia eventual
        await fetchUser();
      } else {
        console.error("Cancel subscription error:", data);
        alert("No se pudo cancelar. Refrescando datos...");
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
  const fetchTiktokers = async (requestedPage = page) => {
    setLoadingTiktokers(true);
    try {
      const params = new URLSearchParams({
        country: filters.country || "",
        niche: filters.niche || "",
        minFollowers: filters.minFollowers || "",
        maxFollowers: filters.maxFollowers || "",
        sortBy: filters.sortBy || "followers",
        page: String(requestedPage),
        perPage: String(perPage)
      }).toString();

      const res = await fetch(`${API_BASE}/api/tiktokers?${params}`, { credentials: "include" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt}`);
      }
      const data = await res.json();

      const serverTotal = Number(data.total ?? 0);
      setTotal(serverTotal);

      // Ajustar si la página solicitada es > totalPages
      const pages = Math.max(1, Math.ceil(serverTotal / perPage));
      if (serverTotal > 0 && requestedPage > pages) {
        setPage(pages);
        return;
      }

      if (data.ok) {
        // Mapear defensivo por si faltan campos
        const mapped = (data.results || []).map((d: any) => ({
          id: d.id,
          handle: d.handle || (d.username ?? ""),
          name: d.name ?? "",
          avatarUrl: d.avatarUrl ?? "",
          profileUrl: d.profileUrl ?? null,
          country: d.country ?? "",
          niches: Array.isArray(d.niches) ? d.niches : [],
          followers: Number(d.followers || 0),
          engagementRate: Number(d.engagementRate || 0),
          avgViews: d.avgViews ? Number(d.avgViews) : null
        }));
        setTiktokers(mapped);
      } else {
        setTiktokers([]);
      }
    } catch (err) {
      console.error("Error fetching tiktokers:", err);
      setTiktokers([]);
      setTotal(0);
    } finally {
      setLoadingTiktokers(false);
    }
  };

  // recupera tiktokers si es PAID
  useEffect(() => {
    if (user?.role === "PAID") {
      fetchTiktokers(page);
    } else {
      setTiktokers([]);
      setTotal(0);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters, page]);

  // ============================
  // UI
  // ============================
  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6">You must be logged in to see this page.</p>;

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
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={() => {
              setPage(1);
              setFilters({ country: "", niche: "", minFollowers: "", maxFollowers: "", sortBy: "followers" });
            }}
          >
            Reset filters
          </button>
          <button
            className="px-6 py-3 bg-red-600 text-white rounded-xl disabled:opacity-60"
            onClick={handleCancelSubscription}
            disabled={canceling}
          >
            {canceling ? "Cancelando..." : "Cancelar suscripción"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <input
          type="text"
          placeholder="País"
          className="border rounded-lg px-3 py-2"
          value={filters.country}
          onChange={(e) => { setPage(1); setFilters({ ...filters, country: e.target.value }); }}
        />
        <input
          type="text"
          placeholder="Nicho"
          className="border rounded-lg px-3 py-2"
          value={filters.niche}
          onChange={(e) => { setPage(1); setFilters({ ...filters, niche: e.target.value }); }}
        />
        <input
          type="number"
          placeholder="Min followers"
          className="border rounded-lg px-3 py-2"
          value={filters.minFollowers}
          onChange={(e) => { setPage(1); setFilters({ ...filters, minFollowers: e.target.value }); }}
        />
        <input
          type="number"
          placeholder="Max followers"
          className="border rounded-lg px-3 py-2"
          value={filters.maxFollowers}
          onChange={(e) => { setPage(1); setFilters({ ...filters, maxFollowers: e.target.value }); }}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={filters.sortBy}
          onChange={(e) => { setPage(1); setFilters({ ...filters, sortBy: e.target.value }); }}
        >
          <option value="followers">Ordenar por Followers</option>
          <option value="engagement">Ordenar por Engagement</option>
        </select>
      </div>

      {/* Results */}
      {loadingTiktokers ? (
        <p>Cargando tiktokers...</p>
      ) : (
        <>
          <div className="mb-3 text-sm text-gray-600">
            Mostrando {tiktokers.length} de {total} resultados — página {page} / {totalPages}
          </div>

          {tiktokers.length === 0 ? (
            <p>No se encontraron tiktokers con esos filtros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="hidden md:table w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3">Avatar</th>
                    <th className="p-3">Handle</th>
                    <th className="p-3">Country</th>
                    <th className="p-3">Niches</th>
                    <th className="p-3">Followers</th>
                    <th className="p-3">Avg Views</th>
                    <th className="p-3">Engagement</th>
                    <th className="p-3">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {tiktokers.map((tk) => (
                    <tr key={tk.id} className="border-b hover:bg-gray-50">
                      <td className="p-3"><img src={tk.avatarUrl || ""} alt="" className="w-10 h-10 rounded-full" /></td>
                      <td className="p-3">{'@' + (tk.handle || "").replace(/^@+/, "")}</td>
                      <td className="p-3">{tk.country || "—"}</td>
                      <td className="p-3">{(tk.niches && tk.niches.length) ? tk.niches.join(", ") : "—"}</td>
                      <td className="p-3">{tk.followers.toLocaleString()}</td>
                      <td className="p-3">{tk.avgViews ? Number(tk.avgViews).toLocaleString() : "—"}</td>
                      <td className="p-3">{(Number(tk.engagementRate || 0) * 100).toFixed(1)}%</td>
                      <td className="p-3">
                        {tk.profileUrl ? (
                          <button className="px-3 py-1 border rounded text-sm" onClick={() => window.open(tk.profileUrl ?? "", "_blank", "noopener")}>
                            Abrir perfil
                          </button>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {tiktokers.map((tk) => (
                  <div key={tk.id} className="p-4 border rounded-lg shadow flex items-center gap-4">
                    <img src={tk.avatarUrl || ""} alt="" className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <p className="font-bold">{'@' + (tk.handle || "").replace(/^@+/, "")}</p>
                      <p className="text-sm text-gray-500">{tk.country || "—"}</p>
                      <p className="text-sm">Followers: {tk.followers.toLocaleString()}</p>
                      <p className="text-sm">Avg views: {tk.avgViews ? Number(tk.avgViews).toLocaleString() : "—"}</p>
                      <p className="text-sm">Engagement: {(Number(tk.engagementRate || 0) * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      {tk.profileUrl ? (
                        <button className="px-3 py-1 border rounded text-sm" onClick={() => window.open(tk.profileUrl ?? "", "_blank", "noopener")}>
                          Perfil
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* pagination controls - siempre visibles */}
          <div className="mt-4 flex gap-2 items-center">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </button>

            <span>Page {page} / {totalPages}</span>

            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={total === 0 || page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
