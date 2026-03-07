"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type FleetByTruckType = Record<string, { total: number; idle: number; enRouteOrLoaded: number }>;
type Stats = {
  users: { total: number; shippers: number; drivers: number; newLast30d: number };
  loads: { total: number; active: number };
  shipments: { total: number; active: number; delivered: number };
  bids: { total: number; pending: number; accepted: number };
  payments: { total: number; successful: number; totalRevenue: number };
  support: { openTickets: number };
  commandCenter?: {
    liveActiveOrders: number;
    fleet: { totalDrivers: number; online: number; offline: number; byTruckType: FleetByTruckType };
    gmv: number;
    platformTakeRate: number;
    outstandingPayouts: number;
    volumeByCargoCategory: { category: string; count: number; percentage: number }[];
  };
};

function formatCurrency(n: number) {
  if (n >= 1e9) return "₦" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "₦" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "₦" + (n / 1e3).toFixed(1) + "K";
  return "₦" + n.toLocaleString("en-NG");
}

// Mock series for charts (replace with API later)
const TRIP_REVENUE_DATA = [
  { month: "Jan", revenue: 0.5 },
  { month: "Feb", revenue: 0.6 },
  { month: "Mar", revenue: 0.65 },
  { month: "Apr", revenue: 0.75 },
  { month: "May", revenue: 0.85 },
  { month: "Jun", revenue: 0.9 },
  { month: "Jul", revenue: 0.95 },
  { month: "Aug", revenue: 1 },
];

// Revenue split: 70% platform/shipper, 20% driver earnings, 10% service fee
const REVENUE_SPLIT_DATA = [
  { name: "Platform / Shipper", value: 70, color: "#1e3a5f" },
  { name: "Driver Earnings", value: 20, color: "#3b82f6" },
  { name: "Service Fee", value: 10, color: "#10b981" },
];

const TRIPS_COMPLETED_DATA = [
  { month: "Jan", trips: 120 },
  { month: "Feb", trips: 180 },
  { month: "Mar", trips: 420 },
  { month: "Apr", trips: 280 },
  { month: "May", trips: 520 },
  { month: "Jun", trips: 350 },
  { month: "Jul", trips: 400 },
];

const REPORT_HISTORY = [
  { month: "Jan", revenue: "₦180,000", profit: "₦180,000", service: "₦180,000", driverPayout: "₦180,000", trips: 60 },
  { month: "Feb", revenue: "₦180,000", profit: "₦180,000", service: "₦180,000", driverPayout: "₦180,000", trips: 60 },
  { month: "Mar", revenue: "₦180,000", profit: "₦180,000", service: "₦180,000", driverPayout: "₦180,000", trips: 60 },
  { month: "Apr", revenue: "₦180,000", profit: "₦180,000", service: "₦180,000", driverPayout: "₦180,000", trips: 60 },
];

const REFRESH_INTERVAL_MS = 30_000; // 30 seconds

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [revenueFilter, setRevenueFilter] = useState<"Monthly" | "Quarterly" | "Yearly">("Monthly");

  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    const res = await fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const d = await res.json().catch(() => ({}));
    setStats(d.users !== undefined ? d : null);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await fetchStats();
      if (mounted) setLoading(false);
    })();
    const interval = setInterval(() => {
      fetchStats();
    }, REFRESH_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const s = stats ?? {
    users: { total: 0, shippers: 0, drivers: 0, newLast30d: 0 },
    loads: { total: 0, active: 0 },
    shipments: { total: 0, active: 0, delivered: 0 },
    bids: { total: 0, pending: 0, accepted: 0 },
    payments: { total: 0, successful: 0, totalRevenue: 0 },
    support: { openTickets: 0 },
  };
  const cc = s.commandCenter ?? {
    liveActiveOrders: 0,
    fleet: { totalDrivers: 0, online: 0, offline: 0, byTruckType: {} as FleetByTruckType },
    gmv: 0,
    platformTakeRate: 0,
    outstandingPayouts: 0,
    volumeByCargoCategory: [],
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          {lastUpdated && (
            <p className="text-gray-500 text-xs">Data refreshes every 30s · Last updated {lastUpdated.toLocaleTimeString("en-NG")}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => fetchStats()}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Refresh now
        </button>
      </div>

      {/* Command Center — Real-Time Operations */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-white">
        <h2 className="text-lg font-bold text-white mb-4">The Command Center — Real-Time Operations</h2>
        <p className="text-slate-300 text-sm mb-6">Vital signs of the logistics network. View at a glance to identify immediate bottlenecks.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Live Active Orders</p>
            <p className="mt-1 text-2xl font-bold text-white">{cc.liveActiveOrders}</p>
            <p className="text-slate-400 text-xs mt-0.5">In transit, loading, or unloading</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Fleet online</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{cc.fleet.online}</p>
            <p className="text-slate-400 text-xs mt-0.5">of {cc.fleet.totalDrivers} drivers · {cc.fleet.offline} offline</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">GMV</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(cc.gmv)}</p>
            <p className="text-slate-400 text-xs mt-0.5">Total freight value moved</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Platform take</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{formatCurrency(cc.platformTakeRate)}</p>
            <p className="text-slate-400 text-xs mt-0.5">Revenue after driver payouts</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Outstanding Payouts</p>
            <p className="mt-1 text-2xl font-bold text-blue-300">{formatCurrency(cc.outstandingPayouts)}</p>
            <p className="text-slate-400 text-xs mt-0.5">Pending to drivers</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Open tickets</p>
            <p className="mt-1 text-2xl font-bold text-white">{s.support.openTickets}</p>
          </div>
        </div>

        {/* Fleet by vehicle class */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Live Fleet Status by vehicle class</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(cc.fleet.byTruckType).map(([truckType, data]) => (
              <div key={truckType} className="bg-slate-700/50 rounded-lg p-3">
                <p className="font-medium text-white">{truckType}</p>
                <p className="text-slate-400 text-xs mt-1">Total: {data.total} · Idle: {data.idle} · En route / Loaded: {data.enRouteOrLoaded}</p>
              </div>
            ))}
            {Object.keys(cc.fleet.byTruckType).length === 0 && (
              <p className="text-slate-500 text-sm col-span-full">No fleet data yet</p>
            )}
          </div>
        </div>

        {/* Volume by cargo category */}
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Volume by cargo / truck type</h3>
          <div className="flex flex-wrap gap-3">
            {cc.volumeByCargoCategory.map(({ category, count, percentage }) => (
              <div key={category} className="bg-slate-700/50 rounded-lg px-4 py-2 flex items-center gap-3">
                <span className="font-medium text-white">{category}</span>
                <span className="text-slate-400 text-sm">{percentage}%</span>
                <span className="text-slate-500 text-xs">({count} delivered)</span>
              </div>
            ))}
            {cc.volumeByCargoCategory.length === 0 && (
              <p className="text-slate-500 text-sm">No volume data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Legacy KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total active loads</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{s.loads.active.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Ongoing Trips</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{s.shipments.active.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total revenue (GMV)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(s.payments.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Open Support Tickets</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{s.support.openTickets.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Revenue - line chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Trip Revenue</h3>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {(["Monthly", "Quarterly", "Yearly"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRevenueFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium transition ${
                    revenueFilter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TRIP_REVENUE_DATA} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tickFormatter={(v) => v + "M"} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip formatter={(v) => [typeof v === "number" ? v + "M" : v, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Split - pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue Split</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={REVENUE_SPLIT_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${value}% ${name}`}
                >
                  {REVENUE_SPLIT_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row - Trips Completed bar + Report table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Trips Completed</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TRIPS_COMPLETED_DATA} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="trips" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm overflow-hidden">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Report History Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-medium text-left">
                  <th className="pb-3 pr-4">Month</th>
                  <th className="pb-3 pr-4">Revenue</th>
                  <th className="pb-3 pr-4">Profit</th>
                  <th className="pb-3 pr-4">Service</th>
                  <th className="pb-3 pr-4">Driver Payout</th>
                  <th className="pb-3">Trips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {REPORT_HISTORY.map((row, i) => (
                  <tr key={row.month} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                    <td className="py-3 pr-4 font-medium text-gray-900">{row.month}</td>
                    <td className="py-3 pr-4 text-gray-700">{row.revenue}</td>
                    <td className="py-3 pr-4 text-gray-700">{row.profit}</td>
                    <td className="py-3 pr-4 text-gray-700">{row.service}</td>
                    <td className="py-3 pr-4 text-gray-700">{row.driverPayout}</td>
                    <td className="py-3 text-gray-700">{row.trips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
