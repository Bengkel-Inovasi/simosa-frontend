"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sprout, Lock, User, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error("Username atau password salah");
      }

      const data = await res.json();
      login(data.token);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-[#222c21]">
      <div className="w-full max-w-md space-y-8 glass-card p-10 rounded-3xl border border-[#e3e8e2] bg-white shadow-xl">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#708269] shadow-md shadow-[#708269]/20 mb-4">
            <Sprout className="h-9 w-9 text-white" />
          </div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#5c6b57] to-[#3d483b] bg-clip-text text-transparent">
            Login Administrator
          </h2>
          <p className="mt-2 text-center text-sm text-[#556351]">
            Kelola data dan sensor kelapa sawit SiMoSa
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start space-x-3 text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md">
            <div>
              <label className="text-sm font-semibold text-[#3d483b]">Username</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-[#7b8d77]" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-xl border border-[#dbe3da] bg-slate-50 py-3 pl-10 pr-3 text-[#222c21] placeholder-slate-400 focus:border-[#708269] focus:outline-none focus:ring-1 focus:ring-[#708269] text-sm"
                  placeholder="Username admin"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#3d483b]">Password</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-[#7b8d77]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-[#dbe3da] bg-slate-50 py-3 pl-10 pr-3 text-[#222c21] placeholder-slate-400 focus:border-[#708269] focus:outline-none focus:ring-1 focus:ring-[#708269] text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-[#708269] to-[#5c6b57] py-3 px-4 text-sm font-bold text-white hover:from-[#5c6b57] hover:to-[#4a5845] focus:outline-none focus:ring-2 focus:ring-[#708269] focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 cursor-pointer shadow-md shadow-[#708269]/10 hover:shadow-[#708269]/20 disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Masuk Sebagai Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
