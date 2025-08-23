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
  bio?: string;
  avgViews?: number;
  avgLikes?: number;
  avgComments?: number;
  verified?: boolean;
  contact?: string;
  priceEst?: number;
  profileUrl?: string;
};

const API_BASE = "https://tiktokfinder.onrender.com"; // ajusta si corresponde

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [canceling, setCanceling] = useState(false);

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

  useEffect(() => { fetchUser(); }, []);

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
      else { console.error("create-subscription error:", data); alert("Error iniciando pago."); }
    } catch (err) { console.error(err); alert("Error al crear suscripción."); }
    finally { setWorking(false); }
  };

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
        else alert("Suscripción pendiente o fallida. Revisa PayPal.");
        window.history.replaceState({}, "", "/dashboard");
      } catch (err) { console.error(err); alert("Error verificando suscripción."); }
      finally { setCheckingSubscription(false); }
    };
    doCheck();
  }, [user, checkingSubscription]);

  const handleCancelSubscription = async () => {
    if (!user?.paypalSubscriptionId) return;
    if (!window.confirm("¿Seguro deseas cancelar tu suscripción?")) return;

    setCanceling(true);
    setUser(prev => (prev ? { ...prev, role: "FREE" } : prev));

    try {
      const res = await fetch(`${API_BASE}/paypal/cancel-subscription`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: user.paypalSubscriptionId, userId: user.id })
      });
      const data = await res.json();
      if (res.ok && data.ok) alert("Suscripción cancelada, rol actualizado a FREE.");
      else { console.error("Cancel subscription error:", data); await fetchUser(); }
    } catch (err) { console.error(err); await fetchUser(); }
    finally { setCanceling(false); }
  };

  // ============================
  // TIKTOKERS FETCH
  // ============================
  const fetchTiktokers = async () => {
    setLoadingTiktokers(true);
    try {
      const params = new URLSearchParams({
        country: filters.country || "",
        niche: filters.niche || "",
        minFollowers: filters.minFollowers || "",
        maxFollowers: filters.maxFollowers || "",
        sortBy: filters.sortBy || "followers",
        page: String(page),
        perPage: String(perPage)
      }).toString();

      const res = await fetch(`${API_BASE}/api/tiktokers?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTiktokers(data.ok ? data.results.map((d: any) => ({
        ...d,
        handle: d.handle || d.username || d.id,
        niches: d.niches && d.niches.length ? d.niches : (d.niche ? [d.niche] : (d.categories ?? []))
      })) : []);
    } catch (err) { console.error(err); setTiktokers([]); }
    finally { setLoadingTiktokers(false); }
  };

  useEffect(() => { if (user?.role === "PAID") fetchTiktokers(); }, [user, filters, page]);

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Welcome {user.name}, full dashboard unlocked 🎉</h1>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={() => { setPage(1); setFilters({ ...filters, country: "", niche: "", minFollowers: "", maxFollowers: "" }); }}
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
        <input type="text" placeholder="País" className="border rounded-lg px-3 py-2"
          value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })} />
        <input type="text" placeholder="Nicho" className="border rounded-lg px-3 py-2"
          value={filters.niche} onChange={(e) => setFilters({ ...filters, niche: e.target.value })} />
        <input type="number" placeholder="Min followers" className="border rounded-lg px-3 py-2"
          value={filters.minFollowers} onChange={(e) => setFilters({ ...filters, minFollowers: e.target.value })} />
        <input type="number" placeholder="Max followers" className="border rounded-lg px-3 py-2"
          value={filters.maxFollowers} onChange={(e) => setFilters({ ...filters, maxFollowers: e.target.value })} />
        <select className="border rounded-lg px-3 py-2" value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}>
          <option value="followers">Ordenar por Followers</option>
          <option value="engagement">Ordenar por Engagement</option>
        </select>
      </div>

      {/* Results */}
      {loadingTiktokers ? <p>Cargando tiktokers...</p> :
        (tiktokers.length === 0 ? <p>No se encontraron tiktokers con esos filtros.</p> :
          <div className="overflow-x-auto">
            <table className="hidden md:table w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Avatar</th>
                  <th className="p-3">Handle</th>
                  <th className="p-3">Country</th>
                  <th className="p-3">Niches</th>
                  <th className="p-3">Followers</th>
                  <th className="p-3">Engagement</th>
                  <th className="p-3">Bio</th>
                  <th className="p-3">Avg Views</th>
                  <th className="p-3">Profile</th>
                </tr>
              </thead>
              <tbody>
                {tiktokers.map((tk) => (
                  <tr key={tk.id} className="border-b hover:bg-gray-50">
                    <td className="p-3"><img src={tk.avatarUrl || ""} alt="" className="w-10 h-10 rounded-full" /></td>
                    <td className="p-3">{tk.handle}</td>
                    <td className="p-3">{tk.country}</td>
                    <td className="p-3">{tk.niches.join(", ")}</td>
                    <td className="p-3">{tk.followers.toLocaleString()}</td>
                    <td className="p-3">{(tk.engagementRate * 100).toFixed(1)}%</td>
                    <td className="p-3">{tk.bio || "-"}</td>
                    <td className="p-3">{tk.avgViews?.toLocaleString() || "-"}</td>
                    <td className="p-3">
                      {tk.profileUrl && (
                        <button
                          className="px-2 py-1 bg-blue-600 text-white rounded"
                          onClick={() => window.open(tk.profileUrl, "_blank")}
                        >
                          Go
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {tiktokers.map((tk) => (
                <div key={tk.id} className="p-4 border rounded-lg shadow flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <img src={tk.avatarUrl || ""} alt="" className="w-12 h-12 rounded-full" />
                    <div>
                      <p className="font-bold">{tk.handle}</p>
                      <p className="text-sm text-gray-500">{tk.country}</p>
                    </div>
                  </div>
                  <p className="text-sm"><strong>Niches:</strong> {tk.niches.join(", ")}</p>
                  <p className="text-sm"><strong>Followers:</strong> {tk.followers.toLocaleString()}</p>
                  <p className="text-sm"><strong>Engagement:</strong> {(tk.engagementRate * 100).toFixed(1)}%</p>
                  <p className="text-sm"><strong>Bio:</strong> {tk.bio || "-"}</p>
                  <p className="text-sm"><strong>Avg Views:</strong> {tk.avgViews?.toLocaleString() || "-"}</p>
                  {tk.profileUrl && (
                    <button
                      className="px-2 py-1 bg-blue-600 text-white rounded w-full"
                      onClick={() => window.open(tk.profileUrl, "_blank")}
                    >
                      Go to profile
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex gap-2 items-center">
              <button className="px-3 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p-1))}>Prev</button>
              <span>Page {page}</span>
              <button className="px-3 py-1 border rounded" onClick={() => setPage(p => p+1)}>Next</button>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default Dashboard;
