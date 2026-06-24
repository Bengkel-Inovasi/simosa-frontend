"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { SensorReading, Node } from "@/types";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Bell,
  Thermometer,
  Droplets,
  FlaskConical,
  Activity,
  Edit3,
  Check,
  TrendingUp,
  Globe,
  Radio,
  TrendingDown,
} from "lucide-react";

interface NewsArticle {
  title: string;
  link: string;
  source: string;
  pub_date: string;
}

interface CPOData {
  price_myr: number;
  price_idr: number;
  price_tbs: number;
  change_percent: number;
  direction: string;
  last_update: string;
}

export default function Dashboard() {
  const { lastReading, notification, setNotification } = useSocket();
  const { token, isAuthenticated } = useAuth();
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Alias Edit States
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [newAlias, setNewAlias] = useState("");

  // Market & News States
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [cpoData, setCpoData] = useState<CPOData | null>(null);

  // Fetch nodes
  const fetchNodes = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/nodes`)
      .then((res) => res.json())
      .then((data) => {
        setNodes(data);
        if (data.length > 0 && !selectedNode) {
          setSelectedNode(data[0].mac_address);
          setNewAlias(data[0].alias || "");
        }
      });
  };

  useEffect(() => {
    fetchNodes();

    // Fetch News
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/news`)
      .then((res) => res.json())
      .then((data) => setNews(data))
      .catch((err) => console.log("Failed to fetch news", err));

    // Fetch CPO Price
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cpo-price`)
      .then((res) => res.json())
      .then((data) => setCpoData(data))
      .catch((err) => console.log("Failed to fetch CPO price", err));
  }, []);

  // Fetch history when selected node changes
  useEffect(() => {
    if (selectedNode) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/nodes/${selectedNode}/history`)
        .then((res) => res.json())
        .then((data) => setHistory(data.reverse()));

      const currentNode = nodes.find((n) => n.mac_address === selectedNode);
      if (currentNode) {
        setNewAlias(currentNode.alias || "");
      }
    }
  }, [selectedNode, nodes]);

  // Handle incoming real-time socket readings
  useEffect(() => {
    if (lastReading && lastReading.node_mac === selectedNode) {
      setHistory((prev) => {
        const updated = [...prev, lastReading];
        return updated.slice(-50);
      });
    }
  }, [lastReading, selectedNode]);

  // Save alias updates (Admin only)
  const handleSaveAlias = async () => {
    if (!selectedNode) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/nodes/${selectedNode}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alias: newAlias, is_registered: true }),
      });

      if (res.ok) {
        setIsEditingAlias(false);
        fetchNodes();
      }
    } catch (err) {
      console.error("Failed to update alias:", err);
    }
  };

  const activeReading = lastReading && lastReading.node_mac === selectedNode 
    ? lastReading 
    : history[history.length - 1];

  return (
    <div className="space-y-8 animate-fade-in text-[#222c21]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#3d483b] flex items-center gap-3">
            Dashboard Utama
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#708269] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#708269]"></span>
            </span>
          </h1>
          <p className="text-[#556351] mt-1 text-sm">
            Monitor real-time NPK, pH, kelembapan, dan suhu perkebunan kelapa sawit Anda.
          </p>
        </div>

        {/* Node Dropdown Selector */}
        <div className="flex items-center space-x-3">
          <div className="glass-card px-4 py-2.5 rounded-2xl flex items-center space-x-3 bg-white">
            <Radio className="h-5 w-5 text-[#708269] animate-pulse" />
            <select
              value={selectedNode || ""}
              onChange={(e) => setSelectedNode(e.target.value)}
              className="bg-transparent text-[#3d483b] border-0 focus:ring-0 focus:outline-none text-sm font-semibold cursor-pointer"
            >
              {nodes.map((node) => (
                <option key={node.mac_address} value={node.mac_address} className="bg-white text-[#222c21]">
                  {node.alias || node.mac_address}
                </option>
              ))}
            </select>
          </div>

          {/* Admin Alias Editing Form */}
          {isAuthenticated && selectedNode && (
            <div className="flex items-center space-x-2">
              {isEditingAlias ? (
                <div className="flex items-center bg-white border border-[#dbe3da] rounded-xl px-2 py-1.5 shadow-sm">
                  <input
                    type="text"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    className="bg-transparent text-[#222c21] text-xs font-semibold focus:outline-none w-28 px-1"
                    placeholder="Set Alias"
                  />
                  <button
                    onClick={handleSaveAlias}
                    className="p-1 text-[#708269] hover:text-[#5c6b57]"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingAlias(true)}
                  className="p-2.5 rounded-xl bg-white hover:bg-[#e4eae2] text-[#556351] hover:text-[#3d483b] border border-[#dbe3da] transition shadow-sm"
                  title="Edit Alias Node"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Alert Banner */}
      {notification && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between animate-bounce">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-amber-600 mr-3 animate-wiggle" />
            <p className="text-sm font-semibold text-amber-700">{notification}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-amber-700 hover:text-amber-500 font-bold px-2 py-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Real-time Gauge Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <GaugeCard
          title="Keasaman Tanah (pH)"
          value={activeReading?.ph ? activeReading.ph.toFixed(1) : "-"}
          subtitle={
            activeReading?.ph 
              ? (activeReading.ph >= 5.5 && activeReading.ph <= 7.0 ? "Normal (Optimal)" : "Kurang Optimal") 
              : "Menunggu data..."
          }
          color="blue"
          icon={<Activity className="text-blue-500 h-6 w-6" />}
        />
        <GaugeCard
          title="Kelembapan Tanah"
          value={activeReading?.moisture ? `${activeReading.moisture.toFixed(1)}%` : "-"}
          subtitle={
            activeReading?.moisture 
              ? (activeReading.moisture >= 40 && activeReading.moisture <= 75 ? "Optimal" : "Kurang Optimal") 
              : "Menunggu data..."
          }
          color="emerald"
          icon={<Droplets className="text-emerald-500 h-6 w-6" />}
        />
        <GaugeCard
          title="Suhu Tanah"
          value={activeReading?.temperature ? `${activeReading.temperature.toFixed(1)}°C` : "-"}
          subtitle={activeReading?.temperature ? "Normal" : "Menunggu data..."}
          color="rose"
          icon={<Thermometer className="text-rose-500 h-6 w-6" />}
        />
        <GaugeCard
          title="Rasio N/P/K"
          value={activeReading ? `${activeReading.n.toFixed(0)}/${activeReading.p.toFixed(0)}/${activeReading.k.toFixed(0)}` : "-"}
          subtitle="Kandungan Nutrisi (mg/kg)"
          color="amber"
          icon={<FlaskConical className="text-amber-500 h-6 w-6" />}
        />
      </div>

      {/* Grid: Charts and Economic News / CPO Price */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Charts - spans 2 cols */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-[#e3e8e2] space-y-6 bg-white">
          <div className="flex items-center justify-between border-b border-[#e3e8e2] pb-4">
            <h2 className="text-xl font-bold text-[#3d483b] flex items-center gap-2">
              <TrendingUp className="text-[#708269] h-5 w-5" />
              Grafik Sensor Tanah
            </h2>
            <span className="text-xs text-[#556351] bg-[#f4f7f3] px-3 py-1.5 rounded-full border border-[#dbe3da] font-medium">
              Menampilkan 50 data terakhir
            </span>
          </div>

          <div className="h-[380px]">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e8e2" opacity={0.6} />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#556351"
                    tickLine={false}
                    tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                    fontSize={11}
                  />
                  <YAxis stroke="#556351" tickLine={false} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#dbe3da",
                      borderRadius: "16px",
                      color: "#222c21",
                      boxShadow: "0 4px 20px rgba(112, 130, 105, 0.08)"
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area
                    type="monotone"
                    dataKey="ph"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPh)"
                    name="pH Tanah"
                  />
                  <Area
                    type="monotone"
                    dataKey="moisture"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMoisture)"
                    name="Kelembapan (%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="temperature"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTemp)"
                    name="Suhu (°C)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[#7b8d77]">
                Menunggu kiriman data dari sensor...
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: CPO Price Widget & Economic News */}
        <div className="space-y-6 flex flex-col">
          {/* CPO Price Card */}
          <div className="glass-card p-6 rounded-3xl border border-[#e3e8e2] bg-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e3e8e2] pb-3">
              <h2 className="text-md font-bold text-[#3d483b] flex items-center gap-2">
                {cpoData?.direction === "up" ? (
                  <TrendingUp className="text-green-600 h-5 w-5 animate-pulse" />
                ) : (
                  <TrendingDown className="text-rose-600 h-5 w-5 animate-pulse" />
                )}
                Harga CPO & TBS Global
              </h2>
              <span className="text-[9px] text-[#7b8d77] bg-[#f4f7f3] px-2 py-0.5 rounded border border-[#dbe3da] font-mono">
                {cpoData?.last_update ? format(new Date(cpoData.last_update), "dd MMM yyyy") : "Memuat..."}
              </span>
            </div>

            {cpoData ? (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center py-0.5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Bursa Malaysia</span>
                    <span className="text-[10px] text-slate-400 block font-semibold">Crude Palm Oil (MYR/Tonne)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-800">
                      {cpoData.price_myr.toLocaleString()} MYR
                    </span>
                    <span className={`text-[10px] font-bold block ${cpoData.direction === "up" ? "text-green-600" : "text-rose-600"}`}>
                      {cpoData.direction === "up" ? "▲ +" : "▼ -"} {cpoData.change_percent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#3d483b] block">Harga CPO Lokal</span>
                    <span className="text-[10px] text-slate-400 block font-semibold">Estimasi Konversi (IDR/Kg)</span>
                  </div>
                  <span className="text-md font-black text-[#708269]">
                    Rp {Math.round(cpoData.price_idr).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-[#708269]/20 bg-[#f4f7f3] px-3.5 py-3 rounded-2xl border border-[#708269]/10 shadow-inner">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-[#3d483b] block">Estimasi TBS Petani</span>
                    <span className="text-[9px] text-[#7b8d77] block font-bold">Rasio Penjualan 16% (IDR/Kg)</span>
                  </div>
                  <span className="text-lg font-black text-[#4a5845]">
                    Rp {Math.round(cpoData.price_tbs).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-slate-400">
                <div className="animate-spin h-5 w-5 border-2 border-[#708269] border-t-transparent rounded-full mr-2"></div>
                <span className="text-xs font-semibold">Mengambil harga sawit...</span>
              </div>
            )}
          </div>

          {/* Economic News Card */}
          <div className="glass-card p-6 rounded-3xl border border-[#e3e8e2] space-y-4 flex flex-col bg-white shadow-sm flex-1">
            <div className="flex items-center justify-between border-b border-[#e3e8e2] pb-3">
              <h2 className="text-md font-bold text-[#3d483b] flex items-center gap-2">
                <Globe className="text-[#708269] h-5 w-5" />
                Berita Ekonomi & Sawit
              </h2>
              <span className="text-[9px] text-[#708269] bg-[#708269]/10 px-2.5 py-0.5 rounded font-bold border border-[#708269]/20">
                Live Feed
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
              {news.length > 0 ? (
                news.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-xl bg-[#f8faf7] hover:bg-[#f4f7f3] transition border border-[#e3e8e2] hover:border-[#a3b19b] shadow-sm"
                  >
                    <span className="inline-block text-[9px] font-bold text-[#4a5845] bg-[#d1d9cd]/50 px-2 py-0.5 rounded mb-1 border border-[#a3b19b]/30">
                      {item.source}
                    </span>
                    <h3 className="text-xs font-semibold text-[#222c21] hover:text-[#708269] transition line-clamp-2">
                      {item.title}
                    </h3>
                  </a>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-[#7b8d77]">
                  <div className="animate-spin h-4 w-4 border-2 border-[#708269] border-t-transparent rounded-full mb-2"></div>
                  <span className="text-xs font-semibold">Mengambil kabar pasar...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GaugeCard({
  title,
  value,
  subtitle,
  color,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: "blue" | "emerald" | "rose" | "amber";
  icon: React.ReactNode;
}) {
  const borderColors = {
    blue: "hover:border-blue-300",
    emerald: "hover:border-emerald-300",
    rose: "hover:border-rose-300",
    amber: "hover:border-amber-300",
  };

  const bgGlows = {
    blue: "bg-blue-100",
    emerald: "bg-emerald-100",
    rose: "bg-rose-100",
    amber: "bg-amber-100",
  };

  return (
    <div className={`glass-card p-6 rounded-3xl border border-[#e3e8e2] relative overflow-hidden bg-white group ${borderColors[color]}`}>
      <div
        className={`absolute -right-4 -top-4 w-12 h-12 blur-2xl opacity-40 rounded-full transition-all group-hover:scale-150 duration-500 ${bgGlows[color]}`}
      />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-xs font-bold text-[#556351] uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-xl bg-[#f4f7f3]">{icon}</div>
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-extrabold text-[#222c21] tracking-tight">{value}</h3>
        <p className="text-xs text-[#7b8d77] mt-1 font-semibold">{subtitle}</p>
      </div>
    </div>
  );
}
