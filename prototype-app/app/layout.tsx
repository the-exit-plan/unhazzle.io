import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DeploymentProvider } from "@/lib/context/DeploymentContext";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "unhazzle - Infrastructure without the hassle",
  description: "Deploy production-grade infrastructure in minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <DeploymentProvider>
          {/* Demo Mode Banner */}
          <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 px-4 text-center text-sm font-medium z-50 shadow-lg">
            <span className="mr-2">🎬</span>
            <strong>Demo Mode:</strong> Experience unhazzle with a sample e-commerce application
          </div>
          <div className="pt-12">
            {children}
          </div>
        </DeploymentProvider>
      </body>
    </html>
  );
}
