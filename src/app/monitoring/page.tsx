"use client";

import dynamic from "next/dynamic";

const MonitoringMap = dynamic(() => import("@/components/map/Map"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center space-y-4 rounded-3xl border border-slate-800">
      <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
      <span className="text-sm text-slate-400 font-medium">Memuat Peta...</span>
    </div>
  )
});

export default function MonitoringPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#3d483b]">
          Peta Monitoring Node
        </h1>
        <p className="text-[#556351] mt-1 text-sm">
          Pantau posisi geografis dan status konektivitas setiap node sensor SiMoSa secara real-time.
        </p>
      </div>
      <div className="flex-1 min-h-[400px]">
        <MonitoringMap />
      </div>
    </div>
  );
}
