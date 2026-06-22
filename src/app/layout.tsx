import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SiMoSa - Sistem Monitoring Sawit",
  description: "Monitoring data sensor sawit secara real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 h-full`}>
        <AuthProvider>
          <div className="flex h-full overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8 bg-[#f8faf7] text-slate-800">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
