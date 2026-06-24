"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Node } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { Radio, Edit2, Check, Shield } from "lucide-react";

// Fix Leaflet marker icons issues
const registeredIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const unregisteredIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MonitoringMap() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const { token, isAuthenticated } = useAuth();
  const { notification } = useSocket();
  
  // States for editing node alias on map popup
  const [editingMac, setEditingMac] = useState<string | null>(null);
  const [tempAlias, setTempAlias] = useState("");

  const fetchNodes = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/nodes`)
      .then((res) => res.json())
      .then((data) => setNodes(data || []))
      .catch((err) => console.error("Error fetching nodes for map:", err));
  };

  useEffect(() => {
    fetchNodes();
  }, [notification]);

  const handleUpdateAlias = async (mac: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/nodes/${mac}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alias: tempAlias, is_registered: true }),
      });

      if (res.ok) {
        setEditingMac(null);
        fetchNodes();
      }
    } catch (err) {
      console.error("Failed to update node alias on map:", err);
    }
  };

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden border border-[#e3e8e2] shadow-2xl bg-white relative">
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-card px-4 py-3 rounded-2xl border border-[#e3e8e2] bg-white space-y-2 text-xs shadow-md">
        <h4 className="font-bold text-[#3d483b] border-b border-slate-100 pb-1.5 mb-1.5 uppercase tracking-wider text-[10px]">Status Node</h4>
        <div className="flex items-center space-x-2">
          <span className="h-3 w-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
          <span className="text-[#556351] font-semibold">Terdaftar (Registered)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="h-3 w-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50"></span>
          <span className="text-[#556351] font-semibold">Baru Terdeteksi (Unregistered)</span>
        </div>
      </div>

      <MapContainer
        center={[-0.7893, 113.9213]} // Center on Central Kalimantan (Palm Oil Area)
        zoom={6}
        className="h-full w-full"
        style={{ background: "#f8faf7" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {nodes.map((node) => (
          <Marker
            key={node.mac_address}
            position={[node.latitude, node.longitude]}
            icon={node.is_registered ? registeredIcon : unregisteredIcon}
          >
            <Popup className="custom-popup">
              <div className="p-2 space-y-3 min-w-[200px] text-slate-800 bg-white">
                <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                  <div>
                    {editingMac === node.mac_address ? (
                      <div className="flex items-center bg-slate-50 border border-slate-300 rounded px-1 py-0.5 mt-1">
                        <input
                          type="text"
                          value={tempAlias}
                          onChange={(e) => setTempAlias(e.target.value)}
                          className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none w-28 px-1"
                          placeholder="Edit Alias"
                        />
                        <button
                          onClick={() => handleUpdateAlias(node.mac_address)}
                          className="p-1 text-[#708269] hover:text-[#5c6b57]"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-extrabold text-sm text-[#3d483b] flex items-center gap-1.5">
                        {node.alias || node.mac_address}
                        {isAuthenticated && (
                          <button
                            onClick={() => {
                              setEditingMac(node.mac_address);
                              setTempAlias(node.alias || "");
                            }}
                            className="p-0.5 text-slate-400 hover:text-[#708269] transition"
                            title="Edit Alias"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}
                      </h3>
                    )}
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{node.mac_address}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Status:</span>
                    <span className={`font-bold ${node.is_registered ? "text-green-600" : "text-amber-600"}`}>
                      {node.is_registered ? "Terdaftar" : "Belum Terdaftar"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Latitude:</span>
                    <span className="font-mono text-slate-700">{node.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Longitude:</span>
                    <span className="font-mono text-slate-700">{node.longitude.toFixed(6)}</span>
                  </div>
                </div>

                {!node.is_registered && (
                  <div className="rounded bg-amber-50 border border-amber-200 p-2 flex items-center space-x-1.5 shadow-sm">
                    <Radio className="h-3.5 w-3.5 text-amber-500 animate-pulse flex-shrink-0" />
                    <span className="text-[10px] font-bold text-amber-800">Node Baru Terdeteksi</span>
                  </div>
                )}

                {isAuthenticated && !node.is_registered && (
                  <button
                    onClick={() => {
                      setTempAlias(node.alias || node.mac_address);
                      handleUpdateAlias(node.mac_address);
                    }}
                    className="w-full mt-2 bg-[#708269] hover:bg-[#5c6b57] text-white font-bold text-xs py-1.5 px-3 rounded transition flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-[#708269]/10"
                  >
                    <Shield className="h-3.5 w-3.5" /> Daftarkan Node
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
