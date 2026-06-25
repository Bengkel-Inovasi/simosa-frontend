"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Download, Sprout, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { format } from "date-fns";
import { Harvest } from "@/types";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function HarvestPage() {
  const { token, isAuthenticated } = useAuth();
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [yieldKg, setYieldKg] = useState("");
  const [price, setPrice] = useState("");
  const [expenses, setExpenses] = useState<{ name: string; amount: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHarvests = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/harvests`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = (data || []).sort(
          (a: Harvest, b: Harvest) =>
            new Date(a.harvest_date).getTime() - new Date(b.harvest_date).getTime()
        );
        setHarvests(sorted);
      })
      .catch((err) => console.error("Error fetching harvests:", err));
  };

  useEffect(() => {
    fetchHarvests();
  }, []);

  const addExpense = () => {
    setExpenses([...expenses, { name: "", amount: "" }]);
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: "name" | "amount", value: string) => {
    const newExpenses = [...expenses];
    newExpenses[index][field] = value;
    setExpenses(newExpenses);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    setLoading(true);

    const payload = {
      harvest_date: new Date(date).toISOString(),
      yield_kg: parseFloat(yieldKg),
      price_per_kg: parseFloat(price),
      expenses: expenses.map((ex) => ({
        name: ex.name,
        amount: parseFloat(ex.amount) || 0,
      })),
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/harvests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setYieldKg("");
        setPrice("");
        setExpenses([]);
        setDate(format(new Date(), "yyyy-MM-dd"));
        fetchHarvests();
      }
    } catch (err) {
      console.error("Failed to save harvest:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async (harvest: Harvest) => {
    const harvestIndex = harvests.findIndex((h) => h.id === harvest.id);
    const prevHarvest = harvestIndex > 0 ? harvests[harvestIndex - 1] : null;
    
    let startDate = new Date(0).toISOString();
    if (prevHarvest) {
      const pDate = new Date(prevHarvest.harvest_date);
      pDate.setUTCHours(23, 59, 59, 999);
      startDate = pDate.toISOString();
    }

    const hDate = new Date(harvest.harvest_date);
    hDate.setUTCHours(23, 59, 59, 999);
    const endDate = hDate.toISOString();

    const avgRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/harvests/averages?start=${startDate}&end=${endDate}`
    );
    const averages = await avgRes.json();

    const totalExpenses = harvest.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netIncome = harvest.gross_income - totalExpenses;

    const data = [
      {
        "Tanggal Panen": format(new Date(harvest.harvest_date), "dd/MM/yyyy"),
        "Hasil Panen (kg)": harvest.yield_kg,
        "Harga/kg (Rp)": harvest.price_per_kg,
        "Pendapatan Kotor (Rp)": harvest.gross_income,
        "Total Biaya Pengeluaran (Rp)": totalExpenses,
        "Pendapatan Bersih (Rp)": netIncome,
        "Rata-rata pH Tanah": averages.avg_ph?.toFixed(2) || "N/A",
        "Rata-rata Nitrogen (N)": averages.avg_n?.toFixed(2) || "N/A",
        "Rata-rata Fosfor (P)": averages.avg_p?.toFixed(2) || "N/A",
        "Rata-rata Kalium (K)": averages.avg_k?.toFixed(2) || "N/A",
        "Rata-rata Kelembapan Tanah (%)": averages.avg_moisture?.toFixed(2) || "N/A",
        "Rata-rata Suhu Tanah (°C)": averages.avg_temperature?.toFixed(2) || "N/A",
      },
    ];

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `rekap_panen_${format(new Date(harvest.harvest_date), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = harvests.map((h) => ({
    date: format(new Date(h.harvest_date), "dd/MM/yy"),
    Hasil: h.yield_kg,
    Harga: h.price_per_kg,
  }));

  const displayHarvests = [...harvests].reverse();

  return (
    <div className="space-y-8 animate-fade-in text-[#222c21]">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#3d483b] flex items-center gap-3">
          Rekap Panen
          <Sprout className="h-8 w-8 text-[#708269]" />
        </h1>
        <p className="text-[#556351] mt-1 text-sm">
          Simpan hasil panen, kelola pengeluaran operasional, dan unduh data pra-panen lengkap.
        </p>
      </div>

      {/* Harvest Charts (Yield & Price over time) */}
      {harvests.length > 0 && (
        <div className="glass-card p-6 rounded-3xl border border-[#e3e8e2] bg-white space-y-6">
          <h2 className="text-xl font-bold text-[#3d483b] flex items-center gap-2 border-b border-[#e3e8e2] pb-4">
            <TrendingUp className="text-[#708269] h-5 w-5" />
            Grafik Tren Hasil & Harga Panen
          </h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e8e2" opacity={0.6} />
                <XAxis dataKey="date" stroke="#556351" tickLine={false} fontSize={11} />
                <YAxis yAxisId="left" stroke="#708269" tickLine={false} label={{ value: 'Yield (Kg)', angle: -90, position: 'insideLeft', style: { fill: '#708269', fontSize: 11 } }} fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#b59410" tickLine={false} label={{ value: 'Harga (Rp/Kg)', angle: 90, position: 'insideRight', style: { fill: '#b59410', fontSize: 11 } }} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#dbe3da",
                    borderRadius: "16px",
                    color: "#222c21",
                    boxShadow: "0 4px 20px rgba(112, 130, 105, 0.08)"
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="Hasil" name="Hasil Panen (kg)" fill="#708269" radius={[4, 4, 0, 0]} opacity={0.8} barSize={35} />
                <Line yAxisId="right" type="monotone" dataKey="Harga" name="Harga Sawit (Rp/kg)" stroke="#b59410" strokeWidth={3} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1 glass-card p-6 rounded-3xl border border-[#e3e8e2] bg-white flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#3d483b] border-b border-[#e3e8e2] pb-4 mb-6">
              Input Data Panen
            </h2>

            {isAuthenticated ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#556351] uppercase tracking-wider">Tanggal Panen</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-[#7b8d77]" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="block w-full rounded-xl border border-[#dbe3da] bg-slate-50 py-2.5 pl-10 pr-3 text-[#222c21] focus:border-[#708269] focus:outline-none focus:ring-1 focus:ring-[#708269] text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#556351] uppercase tracking-wider">Hasil (kg)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Contoh: 1500"
                      value={yieldKg}
                      onChange={(e) => setYieldKg(e.target.value)}
                      className="block w-full rounded-xl border border-[#dbe3da] bg-slate-50 py-2.5 px-3 text-[#222c21] focus:border-[#708269] focus:outline-none focus:ring-1 focus:ring-[#708269] text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#556351] uppercase tracking-wider">Harga (Rp/kg)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Contoh: 2400"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="block w-full rounded-xl border border-[#dbe3da] bg-slate-50 py-2.5 px-3 text-[#222c21] focus:border-[#708269] focus:outline-none focus:ring-1 focus:ring-[#708269] text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Expenses list */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-t border-[#e3e8e2] pt-3">
                    <span className="text-xs font-bold text-[#3d483b] uppercase">Biaya Tambahan</span>
                    <button
                      type="button"
                      onClick={addExpense}
                      className="inline-flex items-center text-xs text-[#708269] hover:text-[#5c6b57] font-bold border border-[#708269]/20 bg-[#708269]/5 px-2.5 py-1.5 rounded-lg cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Tambah
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {expenses.map((expense, index) => (
                      <div key={index} className="flex gap-2 animate-fade-in">
                        <input
                          placeholder="Nama Transaksi"
                          value={expense.name}
                          onChange={(e) => updateExpense(index, "name", e.target.value)}
                          className="flex-1 rounded-xl border border-[#dbe3da] bg-slate-50 py-2 px-3 text-[#222c21] focus:border-[#708269] focus:outline-none focus:ring-1 focus:ring-[#708269] text-xs"
                          required
                        />
                        <input
                          placeholder="Rp"
                          type="number"
                          value={expense.amount}
                          onChange={(e) => updateExpense(index, "amount", e.target.value)}
                          className="w-24 rounded-xl border border-[#dbe3da] bg-slate-50 py-2 px-3 text-[#222c21] focus:border-[#708269] focus:outline-none focus:ring-1 focus:ring-[#708269] text-xs"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeExpense(index)}
                          className="p-2 text-rose-600 hover:text-rose-500 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {expenses.length === 0 && (
                      <p className="text-[11px] text-[#7b8d77] italic text-center py-2">
                        Tidak ada biaya tambahan
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#708269] to-[#5c6b57] text-white py-2.5 rounded-xl hover:from-[#5c6b57] hover:to-[#4a5845] transition-colors font-bold text-sm cursor-pointer shadow-md shadow-[#708269]/10"
                >
                  {loading ? "Menyimpan..." : "Simpan Data Panen"}
                </button>
              </form>
            ) : (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-center space-y-4">
                <AlertCircle className="h-10 w-10 text-amber-600 mx-auto" />
                <h3 className="text-sm font-bold text-amber-800">Akses Administrator Terbatas</h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Menambahkan, mengubah, atau menghapus data panen kelapa sawit memerlukan otorisasi administrator.
                </p>
                <a
                  href="/login"
                  className="inline-block bg-[#708269] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#5c6b57] transition"
                >
                  Login Admin
                </a>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-[#e3e8e2] bg-white flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#3d483b] border-b border-[#e3e8e2] pb-4 mb-6">
              Riwayat Hasil Panen
            </h2>

            <div className="overflow-x-auto rounded-xl border border-[#e3e8e2] bg-slate-50/50">
              <table className="min-w-full divide-y divide-[#e3e8e2]">
                <thead className="bg-[#f4f7f3]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#556351] uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#556351] uppercase tracking-wider">
                      Hasil (kg)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#556351] uppercase tracking-wider">
                      Kotor (Gross)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#556351] uppercase tracking-wider">
                      Bersih (Net)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#556351] uppercase tracking-wider">
                      Ekspor CSV
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8e2] text-slate-700">
                  {displayHarvests.map((harvest) => {
                    const totalExpenses = harvest.expenses.reduce((acc, curr) => acc + curr.amount, 0);
                    const netIncome = harvest.gross_income - totalExpenses;
                    return (
                      <tr key={harvest.id} className="hover:bg-[#f4f7f3]/40 transition">
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-[#3d483b]">
                          {format(new Date(harvest.harvest_date), "dd/MM/yyyy")}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[#222c21]">
                          {harvest.yield_kg.toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                          Rp {harvest.gross_income.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-[#4a5845]">
                          Rp {netIncome.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs">
                          <button
                            onClick={() => exportCSV(harvest)}
                            className="inline-flex items-center text-[#4a5845] hover:text-[#5c6b57] bg-[#708269]/10 hover:bg-[#708269]/20 px-2.5 py-1.5 rounded-lg border border-[#708269]/20 transition cursor-pointer font-semibold text-[11px]"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" /> Unduh
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {displayHarvests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-[#7b8d77] text-xs italic">
                        Belum ada riwayat panen terdaftar
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
