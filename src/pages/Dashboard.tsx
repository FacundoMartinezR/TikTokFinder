"use client"

// src/pages/Dashboard.tsx
import { useEffect, useState } from "react"
import {
  Search,
  Filter,
  Users,
  TrendingUp,
  Globe,
  Eye,
  Heart,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "lucide-react"

type User = {
  id: string
  name?: string
  email?: string
  role?: string
  paypalSubscriptionId?: string | null
}

type Tiktoker = {
  id: string
  handle: string
  name?: string
  avatarUrl?: string
  profileUrl?: string | null
  country?: string
  niches: string[]
  followers: number
  engagementRate: number
  avgViews?: number | null
}

const API_BASE = "https://tiktokfinder.onrender.com" // ajusta si corresponde

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(false)
  const [canceling, setCanceling] = useState(false)

  // Explorador de tiktokers
  const [tiktokers, setTiktokers] = useState<Tiktoker[]>([])
  const [filters, setFilters] = useState({
    country: "",
    niche: "",
    minFollowers: "",
    maxFollowers: "",
    sortBy: "followers",
  })
  const [loadingTiktokers, setLoadingTiktokers] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 25

  // total / paginación
  const [total, setTotal] = useState(0)
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  // ============================
  // USER
  // ============================
  const fetchUser = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      const data = await res.json()
      if (data.ok && data.user) setUser(data.user)
      else setUser(null)
    } catch (err) {
      console.error("Error fetching user:", err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  // ============================
  // SUBSCRIPTION
  // ============================
  const handleBuyEarlyAccess = async () => {
    if (!user?.id) return alert("No estás autenticado correctamente.")
    setWorking(true)
    try {
      const res = await fetch(`${API_BASE}/paypal/create-subscription`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (res.ok && data.approveLink) window.location.href = data.approveLink
      else {
        console.error("create-subscription error:", data)
        alert("Error iniciando pago. Revisa la consola del servidor.")
      }
    } catch (err) {
      console.error("Error al crear suscripción:", err)
      alert("Error al crear suscripción. Revisa la consola del servidor.")
    } finally {
      setWorking(false)
    }
  }

  // check-subscription on return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const subscriptionId = params.get("subscription_id") || params.get("subscriptionId")
    if (!subscriptionId || !user?.id || checkingSubscription) return

    const doCheck = async () => {
      setCheckingSubscription(true)
      try {
        const res = await fetch(`${API_BASE}/paypal/check-subscription`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, subscriptionId }),
        })
        const data = await res.json()
        if (res.ok && data.success) alert("¡Suscripción activada! Ahora tienes acceso completo.")
        else alert("Tu suscripción aún está pendiente o falló. Revisa tu cuenta de PayPal.")
        window.history.replaceState({}, "", "/dashboard")
      } catch (err) {
        console.error("Error checando suscripción:", err)
        alert("Error verificando suscripción. Revisa la consola del servidor.")
      } finally {
        setCheckingSubscription(false)
      }
    }
    doCheck()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, checkingSubscription])

  const handleCancelSubscription = async () => {
    if (!user?.paypalSubscriptionId) return
    const confirmed = window.confirm("¿Seguro deseas cancelar tu suscripción? Esto te devolverá al plan FREE.")
    if (!confirmed) return

    setCanceling(true)
    // actualizar UI inmediatamente a FREE (solicitud al backend sigue)
    setUser((prev) => (prev ? { ...prev, role: "FREE", paypalSubscriptionId: null } : prev))

    try {
      const res = await fetch(`${API_BASE}/paypal/cancel-subscription`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: user.paypalSubscriptionId, userId: user.id }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        alert("Solicitud de cancelación enviada. Tu rol fue actualizado a FREE inmediatamente.")
        // refrescar user para consistencia eventual
        await fetchUser()
      } else {
        console.error("Cancel subscription error:", data)
        alert("No se pudo cancelar. Refrescando datos...")
        await fetchUser()
      }
    } catch (err) {
      console.error("Error canceling subscription:", err)
      await fetchUser()
    } finally {
      setCanceling(false)
    }
  }

  // ============================
  // TIKTOKERS FETCH
  // ============================
  const fetchTiktokers = async (requestedPage = page) => {
    setLoadingTiktokers(true)
    try {
      const params = new URLSearchParams({
        country: filters.country || "",
        niche: filters.niche || "",
        minFollowers: filters.minFollowers || "",
        maxFollowers: filters.maxFollowers || "",
        sortBy: filters.sortBy || "followers",
        page: String(requestedPage),
        perPage: String(perPage),
      }).toString()

      const res = await fetch(`${API_BASE}/api/tiktokers?${params}`, { credentials: "include" })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`HTTP ${res.status} - ${txt}`)
      }
      const data = await res.json()

      const serverTotal = Number(data.total ?? 0)
      setTotal(serverTotal)

      // Ajustar si la página solicitada es > totalPages
      const pages = Math.max(1, Math.ceil(serverTotal / perPage))
      if (serverTotal > 0 && requestedPage > pages) {
        setPage(pages)
        return
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
          avgViews: d.avgViews ? Number(d.avgViews) : null,
        }))
        setTiktokers(mapped)
      } else {
        setTiktokers([])
      }
    } catch (err) {
      console.error("Error fetching tiktokers:", err)
      setTiktokers([])
      setTotal(0)
    } finally {
      setLoadingTiktokers(false)
    }
  }

  // recupera tiktokers si es PAID
  useEffect(() => {
    if (user?.role === "PAID") {
      fetchTiktokers(page)
    } else {
      setTiktokers([])
      setTotal(0)
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters, page])

  // ============================
  // UI
  // ============================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Requerido</h2>
            <p className="text-gray-600">Debes iniciar sesión para acceder al dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  if (user.role === "FREE") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-12 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Desbloquea el Poder Completo</h1>
              <p className="text-orange-100 text-lg max-w-2xl mx-auto">
                Accede a nuestra base de datos completa de microinfluencers de TikTok y encuentra los creadores
                perfectos para tu marca.
              </p>
            </div>

            {/* Features */}
            <div className="px-8 py-12">
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Búsqueda Avanzada</h3>
                  <p className="text-gray-600 text-sm">Filtra por país, nicho, seguidores y engagement rate</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Base de Datos Completa</h3>
                  <p className="text-gray-600 text-sm">Miles de microinfluencers verificados y actualizados</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Métricas Detalladas</h3>
                  <p className="text-gray-600 text-sm">Engagement rate, vistas promedio y estadísticas clave</p>
                </div>
              </div>

              <div className="text-center">
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  onClick={handleBuyEarlyAccess}
                  disabled={working}
                >
                  {working ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Procesando...
                    </span>
                  ) : (
                    "Obtener Acceso Completo"
                  )}
                </button>
                <p className="text-gray-500 text-sm mt-4">Acceso inmediato • Cancela cuando quieras</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">¡Bienvenido, {user.name}! 🎉</h1>
              <p className="text-gray-600">
                Dashboard completo desbloqueado - Explora nuestra base de datos de influencers
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
                onClick={() => {
                  setPage(1)
                  setFilters({ country: "", niche: "", minFollowers: "", maxFollowers: "", sortBy: "followers" })
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Limpiar Filtros
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCancelSubscription}
                disabled={canceling}
              >
                {canceling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Cancelando...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    Cancelar Suscripción
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros de Búsqueda</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="País"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                value={filters.country}
                onChange={(e) => {
                  setPage(1)
                  setFilters({ ...filters, country: e.target.value })
                }}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nicho"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                value={filters.niche}
                onChange={(e) => {
                  setPage(1)
                  setFilters({ ...filters, niche: e.target.value })
                }}
              />
            </div>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                placeholder="Min seguidores"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                value={filters.minFollowers}
                onChange={(e) => {
                  setPage(1)
                  setFilters({ ...filters, minFollowers: e.target.value })
                }}
              />
            </div>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                placeholder="Max seguidores"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                value={filters.maxFollowers}
                onChange={(e) => {
                  setPage(1)
                  setFilters({ ...filters, maxFollowers: e.target.value })
                }}
              />
            </div>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 bg-white"
              value={filters.sortBy}
              onChange={(e) => {
                setPage(1)
                setFilters({ ...filters, sortBy: e.target.value })
              }}
            >
              <option value="followers">Ordenar por Seguidores</option>
              <option value="engagement">Ordenar por Engagement</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loadingTiktokers ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Cargando influencers...</p>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-gray-900">
                      {tiktokers.length} de {total.toLocaleString()} resultados
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Página {page} de {totalPages}
                  </span>
                </div>
              </div>

              {tiktokers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron resultados</h3>
                  <p className="text-gray-600">Intenta ajustar tus filtros de búsqueda</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Influencer
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            País
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Nichos
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Seguidores
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Vistas Prom.
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Engagement
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Perfil
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {tiktokers.map((tk) => (
                          <tr key={tk.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={tk.avatarUrl || "/placeholder.svg?height=40&width=40"}
                                  alt={tk.handle}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                />
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    @{(tk.handle || "").replace(/^@+/, "")}
                                  </div>
                                  {tk.name && <div className="text-sm text-gray-500">{tk.name}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
                                <Globe className="w-3 h-3" />
                                {tk.country || "—"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {tk.niches && tk.niches.length ? (
                                  tk.niches.slice(0, 2).map((niche, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md"
                                    >
                                      {niche}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400 text-sm">—</span>
                                )}
                                {tk.niches && tk.niches.length > 2 && (
                                  <span className="text-xs text-gray-500">+{tk.niches.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 font-semibold text-gray-900">
                                <Users className="w-4 h-4 text-gray-400" />
                                {tk.followers.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-gray-700">
                                <Eye className="w-4 h-4 text-gray-400" />
                                {tk.avgViews ? Number(tk.avgViews).toLocaleString() : "—"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4 text-red-400" />
                                <span className="font-semibold text-gray-900">
                                  {(Number(tk.engagementRate || 0) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {tk.profileUrl ? (
                                <button
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-md transition-colors duration-200"
                                  onClick={() => window.open(tk.profileUrl ?? "", "_blank", "noopener")}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Ver Perfil
                                </button>
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden divide-y divide-gray-200">
                    {tiktokers.map((tk) => (
                      <div key={tk.id} className="p-6">
                        <div className="flex items-start gap-4">
                          <img
                            src={tk.avatarUrl || "/placeholder.svg?height=48&width=48"}
                            alt={tk.handle}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  @{(tk.handle || "").replace(/^@+/, "")}
                                </h3>
                                {tk.name && <p className="text-gray-600 text-sm">{tk.name}</p>}
                              </div>
                              {tk.profileUrl && (
                                <button
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-md transition-colors duration-200 flex-shrink-0"
                                  onClick={() => window.open(tk.profileUrl ?? "", "_blank", "noopener")}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Ver
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-semibold text-gray-900">
                                  {tk.followers.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-semibold text-gray-900">
                                  {(Number(tk.engagementRate || 0) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                  {tk.avgViews ? Number(tk.avgViews).toLocaleString() : "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{tk.country || "—"}</span>
                              </div>
                            </div>

                            {tk.niches && tk.niches.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {tk.niches.slice(0, 3).map((niche, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md"
                                  >
                                    {niche}
                                  </span>
                                ))}
                                {tk.niches.length > 3 && (
                                  <span className="text-xs text-gray-500 px-2 py-1">+{tk.niches.length - 3} más</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pagination */}
              {total > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Mostrando {(page - 1) * perPage + 1} - {Math.min(page * perPage, total)} de{" "}
                      {total.toLocaleString()} resultados
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </button>

                      <span className="px-3 py-2 text-sm font-medium text-gray-700">
                        {page} de {totalPages}
                      </span>

                      <button
                        className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={total === 0 || page >= totalPages}
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
