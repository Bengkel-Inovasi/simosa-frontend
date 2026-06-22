"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Cpu, Shield, ShieldAlert, Edit2, Trash2, Check, X, AlertCircle } from "lucide-react";
import { Node } from "@/types";

export default function NodesManagementPage() {
  const { token, isAuthenticated } = useAuth();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [editingMac, setEditingMac] = useState<string | null>(null);
  const [editAlias, setEditAlias] = useState("");

  const fetchNodes = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/nodes`)
      .then((res) => res.json())
      .then((data) => setNodes(data || []))
      .catch((err) => console.error("Error fetching nodes:", err));
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const handleRegisterNode = async (mac: string, aliasName: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/nodes/${mac}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alias: aliasName, is_registered: true }),
      });

      if (res.ok) {
        fetchNodes();
      }
    } catch (err) {
      console.error("Error registering node:", err);
    }
  };

  const handleUnregisterNode = async (mac: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus status registrasi node ini?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/nodes/${mac}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alias: "", is_registered: false }),
      });

      if (res.ok) {
        fetchNodes();
      }
    } catch (err) {
      console.error("Error unregistering node:", err);
    }
  };

  const handleSaveAlias = async (mac: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/nodes/${mac}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alias: editAlias, is_registered: true }),
      });

      if (res.ok) {
        setEditingMac(null);
        fetchNodes();
      }
    } catch (err) {
      console.error("Error saving alias:", err);
    }
  };

  const unregisteredNodes = nodes.filter((n) => !n.is_registered);
  const registeredNodes = nodes.filter((n) => n.is_registered);

  return (
    <div className="space-y-8 animate-fade-in text-[#222c21]">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#3d483b] flex items-center gap-3">
          Kelola Node Sensor
          <Cpu className="h-8 w-8 text-[#708269]" />
        </h1>
        <p className="text-[#556351] mt-1 text-sm">
          Registrasikan node baru yang terdeteksi, berikan alias (nama nama khusus), dan kelola status node.
        </p>
      </div>

      {!isAuthenticated && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start space-x-3 text-amber-800 text-xs">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <span className="font-bold">Akses Terbatas:</span> Anda dapat melihat status node, tetapi Anda harus login sebagai admin untuk mendaftarkan node baru atau mengubah nama alias.
          </div>
        </div>
      )}

      {/* Grid: Unregistered and Registered Nodes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Unregistered Nodes Section */}
        <div className="glass-card p-6 rounded-3xl border border-[#e3e8e2] bg-white space-y-6">
          <div className="flex items-center justify-between border-b border-[#e3e8e2] pb-4">
            <h2 className="text-xl font-bold text-[#3d483b] flex items-center gap-2">
              <ShieldAlert className="text-amber-500 h-5 w-5" />
              Node Baru Terdeteksi ({unregisteredNodes.length})
            </h2>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Belum Terdaftar
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {unregisteredNodes.map((node) => (
              <div
                key={node.mac_address}
                className="p-4 rounded-2xl bg-[#f8faf7] border border-[#e3e8e2] flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-[#4a5845] bg-[#eaeae6] px-2 py-0.5 rounded border border-[#dbe3da] font-semibold">
                      MAC: {node.mac_address}
                    </span>
                  </div>
                  <p className="text-xs text-[#556351] font-semibold">
                    Lokasi: {node.latitude.toFixed(6)}, {node.longitude.toFixed(6)}
                  </p>
                  <p className="text-[10px] text-[#7b8d77]">
                    Terdeteksi pada: {new Date(node.registered_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  {isAuthenticated ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <input
                        id={`alias-input-${node.mac_address}`}
                        placeholder="Masukkan Nama Alias"
                        type="text"
                        className="rounded-xl border border-[#dbe3da] bg-white px-3 py-1.5 text-xs text-[#222c21] focus:border-[#708269] focus:outline-none w-36"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(
                            `alias-input-${node.mac_address}`
                          ) as HTMLInputElement;
                          handleRegisterNode(node.mac_address, input.value || node.mac_address);
                        }}
                        className="inline-flex items-center text-xs text-white font-bold bg-[#708269] hover:bg-[#5c6b57] px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm shadow-[#708269]/10"
                      >
                        <Shield className="h-3.5 w-3.5 mr-1" /> Daftarkan
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-[#7b8d77] italic">Login untuk mendaftarkan</span>
                  )}
                </div>
              </div>
            ))}
            {unregisteredNodes.length === 0 && (
              <p className="text-xs text-[#7b8d77] italic text-center py-8">
                Tidak ada node baru yang belum terdaftar.
              </p>
            )}
          </div>
        </div>

        {/* Registered Nodes Section */}
        <div className="glass-card p-6 rounded-3xl border border-[#e3e8e2] bg-white space-y-6">
          <div className="flex items-center justify-between border-b border-[#e3e8e2] pb-4">
            <h2 className="text-xl font-bold text-[#3d483b] flex items-center gap-2">
              <Shield className="text-[#708269] h-5 w-5" />
              Node Terdaftar ({registeredNodes.length})
            </h2>
            <span className="text-[10px] font-bold text-[#4a5845] bg-[#d1d9cd] px-2.5 py-1 rounded-full border border-[#a3b19b]">
              Aktif
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {registeredNodes.map((node) => (
              <div
                key={node.mac_address}
                className="p-4 rounded-2xl bg-[#f8faf7] border border-[#e3e8e2] flex items-center justify-between gap-4 hover:border-[#708269]/20 transition-colors shadow-sm"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    {editingMac === node.mac_address ? (
                      <div className="flex items-center gap-1.5 bg-white border border-[#dbe3da] rounded px-1.5 py-0.5">
                        <input
                          type="text"
                          value={editAlias}
                          onChange={(e) => setEditAlias(e.target.value)}
                          className="bg-transparent text-[#222c21] text-xs font-semibold focus:outline-none w-32"
                        />
                        <button
                          onClick={() => handleSaveAlias(node.mac_address)}
                          className="text-green-600 hover:text-green-500"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingMac(null)}
                          className="text-rose-600 hover:text-rose-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#3d483b] text-sm">{node.alias}</span>
                        {isAuthenticated && (
                          <button
                            onClick={() => {
                              setEditingMac(node.mac_address);
                              setEditAlias(node.alias);
                            }}
                            className="text-[#7b8d77] hover:text-[#4a5845] transition"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#7b8d77] block">MAC: {node.mac_address}</span>
                  <p className="text-[10px] text-[#556351] font-semibold">
                    Posisi: {node.latitude.toFixed(6)}, {node.longitude.toFixed(6)}
                  </p>
                </div>

                {isAuthenticated && (
                  <button
                    onClick={() => handleUnregisterNode(node.mac_address)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-700 transition cursor-pointer"
                    title="Batalkan Registrasi"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {registeredNodes.length === 0 && (
              <p className="text-xs text-[#7b8d77] italic text-center py-8">
                Belum ada node yang terdaftar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
