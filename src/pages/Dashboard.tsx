// src/pages/Dashboard.tsx
"use client"

import { useEffect, useState } from "react"
import profileAvatar from "/user.png"
import {
  Search,
  Filter,
  UsersIcon,
  TrendingUp,
  Globe,
  Eye,
  Heart,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  ChevronDown,
  LogOut,
  User,
  Lock,
} from "lucide-react"

type UserType = {
  id: string
  name?: string
  email?: string
  role?: "FREE" | "PAID" | string
  paypalSubscriptionId?: string | null
}

type Tiktoker = {
  id: string
  handle: string
  name?: string
  avatarUrl?: string
  profileUrl?: string | null
  country?: string | null
  niches: string[]
  followers: number
  engagementRate: number
  avgViews?: number | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://tiktokfinder.onrender.com"

// -------------------- Helpers --------------------
const normalizeNiche = (raw?: string | null) => {
  if (!raw) return ""
  const s = String(raw).trim()
  if (!s) return ""
  const lower = s.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}
const normalizeCountry = (raw?: string | null) => {
  if (!raw) return ""
  const s = String(raw).trim()
  if (!s) return ""
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.charAt(0) ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ")
}
const avatarSrcForHandle = (handle: string) => {
  const safeHandle = (handle || "").replace(/^@+/, "")
  return `${API_BASE.replace(/\/$/, "")}/avatars/${safeHandle}.jpeg`
}

// Construye un set balanceado de `limit` items a partir de un pool grande.
// - Agrupa por nicho (primero del array o 'Other')
// - Intenta repartir aproximadamente igual por nicho
function buildBalancedSet(pool: Tiktoker[], limit = 50) {
  // dedupe por handle (mantener first occurrence)
  const seen = new Map<string, Tiktoker>()
  for (const p of pool) {
    const key = (p.handle || "").toLowerCase()
    if (!seen.has(key)) seen.set(key, p)
  }
  const deduped = Array.from(seen.values())

  // bucket por nicheKey (usar primer niche o 'Other')
  const buckets = new Map<string, Tiktoker[]>()
  for (const t of deduped) {
    const primary = (t.niches && t.niches.length > 0 ? t.niches[0] : "Other") || "Other"
    const key = primary.toLowerCase()
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(t)
  }

  const bucketKeys = Array.from(buckets.keys()).sort() // deterministic order
  const nBuckets = bucketKeys.length || 1
  const base = Math.floor(limit / nBuckets)
  let remainder = limit - base * nBuckets

  const result: Tiktoker[] = []

  // First pass: allocate base to each bucket
  for (const k of bucketKeys) {
    const items = buckets.get(k) || []
    const take = Math.min(base, items.length)
    result.push(...items.slice(0, take))
  }

  // Second pass: distribute remainder one by one to buckets with available items
  let bucketIndex = 0
  while (remainder > 0) {
    const key = bucketKeys[bucketIndex % bucketKeys.length]
    const items = buckets.get(key) || []
    // how many already taken from this bucket
    const alreadyTaken = result.filter((r) => {
      const primary = (r.niches && r.niches.length > 0 ? r.niches[0] : "Other") || "Other"
      return primary.toLowerCase() === key
    }).length
    if (alreadyTaken < items.length) {
      result.push(items[alreadyTaken])
      remainder--
    }
    bucketIndex++
    // if made a full cycle and nothing more can be taken, break
    if (bucketIndex > bucketKeys.length * 5) break
  }

  // If still short (some buckets had too few), fill from any remaining pool items
  if (result.length < limit) {
    const already = new Set(result.map((r) => r.handle.toLowerCase()))
    for (const t of deduped) {
      if (result.length >= limit) break
      if (already.has(t.handle.toLowerCase())) continue
      result.push(t)
      already.add(t.handle.toLowerCase())
    }
  }

  // Final trim to limit
  return result.slice(0, limit)
}

// -------------------- Component --------------------
const Dashboard = () => {
  // Auth / user
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setWorking] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  // Tiktokers & filters
  const [tiktokers, setTiktokers] = useState<Tiktoker[]>([])
  // master fixed set for FREE users (50 unique, balanced)
  const [fixedFreeTiktokers, setFixedFreeTiktokers] = useState<Tiktoker[]>([])
  // master lists derived from the fixed set (won't disappear when filtering)
  const [countriesList, setCountriesList] = useState<string[]>([])
  const [nichesList, setNichesList] = useState<string[]>([])

  const [filters, setFilters] = useState({
    country: "", // "" == All
    niche: "", // normalized display value (FirstLetterUpper)
    minFollowers: "",
    maxFollowers: "",
    sortBy: "followers",
  })

  // Pagination / totals (PAID)
  const [page, setPage] = useState(1)
  const perPage = 25
  const [total, setTotal] = useState(0)
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  // -------------------- User fetch --------------------
  const fetchUser = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { method: "GET", credentials: "include" })
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

  // -------------------- Free: build fixed set (50) --------------------
  // Only run once per session/user (if fixedFreeTiktokers empty)
  useEffect(() => {
    if (!user) return
    if (user.role !== "FREE") return
    if (fixedFreeTiktokers.length > 0) return

    const fetchPoolAndBuild = async () => {
      try {
        // Intent: pedir un pool grande (backend puede soportar perPage grande)
        // Si tu backend tiene un endpoint dedicado /api/free-pool o /api/free-tiktokers, úsalo.
        // Aquí intentamos perPage=500; el backend puede ignorar o limitarlo.
        const poolPerPage = 500
        let pool: any[] = []

        // Intentar endpoint genérico de tiktokers con perPage grande
        try {
          const res = await fetch(`${API_BASE}/api/tiktokers?perPage=${poolPerPage}`, { credentials: "include" })
          if (res.ok) {
            const d = await res.json()
            pool = Array.isArray(d.results) ? d.results : []
          } else {
            // fallback a endpoint dedicado free (si existe)
            const r2 = await fetch(`${API_BASE}/api/free-tiktokers?limit=${poolPerPage}`, { credentials: "include" })
            if (r2.ok) {
              const d2 = await r2.json()
              pool = Array.isArray(d2.results) ? d2.results : []
            } else {
              // último recurso: intentar sin params
              const r3 = await fetch(`${API_BASE}/api/tiktokers`, { credentials: "include" })
              if (r3.ok) {
                const d3 = await r3.json()
                pool = Array.isArray(d3.results) ? d3.results : []
              }
            }
          }
        } catch (err) {
          console.warn("Pool fetch failed:", err)
        }

        // Mapear y normalizar pool a Tiktoker[]
        const mappedPool: Tiktoker[] = (pool || []).map((d: any) => ({
          id: d.id,
          handle: d.handle || (d.username ?? "") || "",
          name: d.name ?? "",
          avatarUrl: d.avatarUrl ?? "",
          profileUrl: d.profileUrl ?? null,
          country: normalizeCountry(d.country ?? ""),
          niches: Array.isArray(d.niches)
            ? d.niches.map((n: string) => normalizeNiche(n)).filter(Boolean)
            : d.niche
            ? [normalizeNiche(d.niche)]
            : [],
          followers: Number(d.followers || 0),
          engagementRate: Number(d.engagementRate || 0),
          avgViews: d.avgViews ? Number(d.avgViews) : null,
        })).filter((t) => t.handle) // asegurar handle

        // Si el pool es pequeño, podemos usar lo que haya
        const limit = 50
        const balanced = buildBalancedSet(mappedPool, limit)

        // master lists (from balanced set)
        const countries = Array.from(new Set(balanced.map((b) => (b.country || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
        // dedupe niches case-insensitive & display normalized
        const nicheMap = new Map<string, string>()
        balanced.forEach((b) => {
          (b.niches || []).forEach((n) => {
            const lower = n.toLowerCase()
            nicheMap.set(lower, normalizeNiche(n))
          })
        })
        const niches = Array.from(nicheMap.values()).sort((a, b) => a.localeCompare(b))

        setFixedFreeTiktokers(balanced)
        setTiktokers(balanced)
        setCountriesList(countries)
        setNichesList(niches)
        setTotal(balanced.length)
      } catch (err) {
        console.error("Error building fixed free set:", err)
      }
    }

    fetchPoolAndBuild()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // -------------------- PAID: fetch with server filters / pagination --------------------
  const fetchPaidPage = async (requestedPage = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        country: filters.country || "",
        niche: filters.niche ? filters.niche.toLowerCase() : "",
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
      const mapped = (data.results || []).map((d: any) => ({
        id: d.id,
        handle: d.handle || (d.username ?? ""),
        name: d.name ?? "",
        avatarUrl: d.avatarUrl ?? "",
        profileUrl: d.profileUrl ?? null,
        country: normalizeCountry(d.country ?? ""),
        niches: Array.isArray(d.niches)
          ? d.niches.map((n: string) => normalizeNiche(n)).filter(Boolean)
          : d.niche
          ? [normalizeNiche(d.niche)]
          : [],
        followers: Number(d.followers || 0),
        engagementRate: Number(d.engagementRate || 0),
        avgViews: d.avgViews ? Number(d.avgViews) : null,
      }))
      setTiktokers(mapped)
      setTotal(Number(data.total ?? mapped.length))
      setPage(requestedPage)
    } catch (err) {
      console.error("Error fetching paid page:", err)
      setTiktokers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // -------------------- Apply filters for FREE (client-side) --------------------
  useEffect(() => {
    if (!user) return
    if (user.role !== "FREE") return

    // filters apply only to the fixed set
    let filtered = [...fixedFreeTiktokers]

    if (filters.country) {
      filtered = filtered.filter((tk) => (tk.country || "") === filters.country)
    }
    if (filters.niche) {
      // filters.niche is display normalized (e.g., "Makeup")
      filtered = filtered.filter((tk) => (tk.niches || []).some((n) => n.toLowerCase() === filters.niche.toLowerCase()))
    }
    if (filters.minFollowers) {
      const minF = Number(filters.minFollowers || 0)
      filtered = filtered.filter((tk) => tk.followers >= minF)
    }
    if (filters.maxFollowers) {
      const maxF = Number(filters.maxFollowers || 0)
      filtered = filtered.filter((tk) => tk.followers <= maxF)
    }
    if (filters.sortBy === "engagement") {
      filtered.sort((a, b) => b.engagementRate - a.engagementRate)
    } else {
      filtered.sort((a, b) => b.followers - a.followers)
    }

    setTiktokers(filtered)
    setTotal(filtered.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, fixedFreeTiktokers, user])

  // -------------------- Effect: when user or filters/page change --------------------
  useEffect(() => {
    if (!user) return
    if (user.role === "PAID") {
      fetchPaidPage(page)
    } else if (user.role === "FREE") {
      // FREE handled by previous effects (fixed set + client filters)
    } else {
      setTiktokers([])
      setTotal(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page])

  // -------------------- Subscription handlers (simplified) --------------------
  const handleBuyEarlyAccess = async () => {
    if (!user?.id) return alert("You are not authenticated.")
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
        alert("Error starting payment. Check server logs.")
      }
    } catch (err) {
      console.error("Error creating subscription:", err)
      alert("Error creating subscription. Check server logs.")
    } finally {
      setWorking(false)
    }
  }

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
        if (res.ok && data.success) alert("Subscription activated! You now have full access.")
        else alert("Subscription pending or failed. Check your PayPal account.")
        window.history.replaceState({}, "", "/dashboard")
      } catch (err) {
        console.error("Error checking subscription:", err)
        alert("Error verifying subscription. Check server logs.")
      } finally {
        setCheckingSubscription(false)
      }
    }
    doCheck()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, checkingSubscription])

  const handleCancelSubscription = async () => {
    if (!user?.paypalSubscriptionId) return
    const confirmed = window.confirm("Are you sure you want to cancel your subscription? You will return to the FREE plan.")
    if (!confirmed) return

    setCanceling(true)
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
        alert("Cancellation requested. Your role was updated to FREE.")
        await fetchUser()
      } else {
        console.error("Cancel subscription error:", data)
        alert("Could not cancel. Refreshing data...")
        await fetchUser()
      }
    } catch (err) {
      console.error("Error canceling subscription:", err)
      await fetchUser()
    } finally {
      setCanceling(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      window.location.href = "/"
    } catch (err) {
      console.error("Error logging out:", err)
    }
  }

  // -------------------- UI helpers --------------------
  const avatarSrcFor = (tk: Tiktoker) => {
    if (tk.avatarUrl) return tk.avatarUrl
    return avatarSrcForHandle(tk.handle)
  }

  // Master lists for selects (if PAID we can still show lists derived from current tiktokers)
  // For FREE: use nichesList & countriesList derived from fixed set
  const displayNiches = nichesList
  const displayCountries = countriesList

  // -------------------- Rendering --------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
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
              <UsersIcon className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Required</h2>
            <p className="text-gray-600">You must sign in to access the dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  // Header + common UI
  const header = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {user.role === "FREE" ? `Welcome, ${user.name}!` : `Welcome, ${user.name}!`}
          </h1>
          <p className="text-gray-600">
            {user.role === "FREE"
              ? "Free plan - limited fixed preview (50 results)"
              : "Full dashboard unlocked - explore our influencer database"}
          </p>
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block">{user.name}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {user.role === "PAID" ? (
                <button
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-200"
                  onClick={() => {
                    handleCancelSubscription()
                    setShowProfileDropdown(false)
                  }}
                  disabled={canceling}
                >
                  {canceling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-red-500" />
                      Cancel Subscription
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-200"
                  onClick={() => {
                    handleBuyEarlyAccess()
                    setShowProfileDropdown(false)
                  }}
                >
                  <X className="w-4 h-4 text-green-500" />
                  Upgrade
                </button>
              )}
              <button
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-200"
                onClick={() => {
                  handleLogout()
                  setShowProfileDropdown(false)
                }}
              >
                <LogOut className="w-4 h-4 text-gray-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Filters UI (shared, but FREE uses master lists derived from fixed set)
  const FiltersPanel = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-900">Search Filters</h2>
          {user.role === "FREE" && (
            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md font-medium ml-2">
              LIMITED
            </span>
          )}
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
          onClick={() => {
            setPage(1)
            setFilters({ country: "", niche: "", minFollowers: "", maxFollowers: "", sortBy: "followers" })
            // For FREE we want to keep the fixed set unchanged (filters cleared)
            if (user.role === "FREE") setTiktokers(fixedFreeTiktokers)
          }}
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Clear Filters</span>
          <span className="sm:hidden">Clear</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 bg-white"
            value={filters.country}
            onChange={(e) => {
              setPage(1)
              setFilters({ ...filters, country: e.target.value })
            }}
          >
            <option value="">All</option>
            {displayCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 bg-white"
            value={filters.niche}
            onChange={(e) => {
              setPage(1)
              setFilters({ ...filters, niche: e.target.value })
            }}
          >
            <option value="">All</option>
            {displayNiches.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            placeholder="Min followers"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
            value={filters.minFollowers}
            onChange={(e) => {
              setPage(1)
              setFilters({ ...filters, minFollowers: e.target.value })
            }}
          />
        </div>

        <div className="relative">
          <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            placeholder="Max followers"
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
          <option value="followers">Sort by Followers</option>
          <option value="engagement">Sort by Engagement</option>
        </select>
      </div>
    </div>
  )

  // Results rendering (table + mobile)
  const Results = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      { /* Header */ }
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-gray-900">
              {tiktokers.length} {user.role === "FREE" ? "of 50 fixed results (Free Plan)" : `of ${total.toLocaleString()} results`}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {user.role === "FREE" ? "Fixed preview (filters applied client-side)" : `Page ${page} of ${totalPages}`}
          </span>
        </div>
      </div>

      {tiktokers.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No results</h3>
          <p className="text-gray-600">Try adjusting your search filters</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Influencer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Language / Country</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Niches</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Followers</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Views</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Engagement</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tiktokers.map((tk) => (
                  <tr key={tk.id + tk.handle} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={tk.avatarUrl ? tk.avatarUrl : avatarSrcFor(tk)}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = profileAvatar }}
                          alt={tk.handle}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">@{(tk.handle || "").replace(/^@+/, "")}</div>
                          {tk.name && <div className="text-sm text-gray-500">{tk.name}</div>}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md uppercase">
                        <Globe className="w-3 h-3" />
                        {tk.country || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {tk.niches && tk.niches.length ? (
                          tk.niches.slice(0, 2).map((niche, idx) => (
                            <span key={idx} className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md">{niche}</span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                        {tk.niches && tk.niches.length > 2 && (<span className="text-xs text-gray-500">+{tk.niches.length - 2}</span>)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-semibold text-gray-900">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
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
                        <span className="font-semibold text-gray-900">{Number(tk.engagementRate || 0).toFixed(2)}%</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {tk.profileUrl ? (
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-md transition-colors duration-200"
                          onClick={() => window.open(tk.profileUrl ?? "", "_blank", "noopener")}
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Profile
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
              <div key={tk.id + tk.handle} className="p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={tk.avatarUrl ? tk.avatarUrl : avatarSrcFor(tk)}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = profileAvatar }}
                    alt={tk.handle}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">@{(tk.handle || "").replace(/^@+/, "")}</h3>
                        {tk.name && <p className="text-gray-600 text-sm">{tk.name}</p>}
                      </div>
                      {tk.profileUrl ? (
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-md transition-colors duration-200 flex-shrink-0"
                          onClick={() => window.open(tk.profileUrl ?? "", "_blank", "noopener")}
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </button>
                      ) : (
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-300 text-gray-500 text-sm rounded-md cursor-not-allowed flex-shrink-0"
                          disabled
                        >
                          <Lock className="w-3 h-3" />
                          Locked
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">{tk.followers.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-semibold text-gray-900">{Number(tk.engagementRate || 0).toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{tk.avgViews ? Number(tk.avgViews).toLocaleString() : "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 uppercase">{tk.country || "—"}</span>
                      </div>
                    </div>

                    {tk.niches && tk.niches.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tk.niches.slice(0, 3).map((niche, idx) => (
                          <span key={idx} className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md">{niche}</span>
                        ))}
                        {tk.niches.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">+{tk.niches.length - 3} more</span>
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

      {/* Pagination (only for PAID server-driven results) */}
      {user.role === "PAID" && total > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, total)} of {total.toLocaleString()} results
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="px-3 py-2 text-sm font-medium text-gray-700">{page} of {totalPages}</span>

              <button
                className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={total === 0 || page >= totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {header}
        <div className="mb-6">
          <FiltersPanel />
        </div>
        <Results />
      </div>
    </div>
  )
}

export default Dashboard
