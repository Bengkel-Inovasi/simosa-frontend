"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, Sprout, LogIn, LogOut, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Monitoring", href: "/monitoring", icon: Map },
  { name: "Rekap Panen", href: "/harvest", icon: Sprout },
  { name: "Kelola Node", href: "/nodes", icon: Cpu },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col border-r border-[#dbe3da] bg-[#f0f3ef]">
      <div className="flex h-20 items-center border-b border-[#dbe3da] px-6 justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-[#708269] flex items-center justify-center shadow-md shadow-[#708269]/20">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-[#5c6b57] to-[#3d483b] bg-clip-text text-transparent">
            SiMoSa
          </span>
        </div>
        {isAuthenticated && (
          <span className="inline-flex items-center rounded-full bg-[#d1d9cd] px-2 py-0.5 text-xs font-semibold text-[#4a5845] border border-[#a3b19b]">
            Admin
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-[#708269]/10 text-[#4a5845] border-l-2 border-[#708269]"
                  : "text-[#556351] hover:bg-[#e4eae2] hover:text-[#3d483b]"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200",
                  isActive ? "text-[#708269]" : "text-[#7b8d77] group-hover:text-[#4a5845]"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#dbe3da] p-4">
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-500/10 hover:text-rose-800 transition-all duration-200 border border-transparent hover:border-rose-200/50"
          >
            <LogOut className="mr-3 h-5 w-5 text-rose-600" />
            Keluar Admin
          </button>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold text-[#556351] hover:bg-[#e4eae2] hover:text-[#3d483b] transition-all duration-200"
          >
            <LogIn className="mr-3 h-5 w-5 text-[#7b8d77]" />
            Login Admin
          </Link>
        )}
      </div>
    </div>
  );
}
