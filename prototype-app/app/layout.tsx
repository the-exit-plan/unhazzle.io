import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DeploymentProvider } from "@/lib/context/DeploymentContext";
import DemoBanner from "./DemoBanner";

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
          <DemoBanner />
          <div className="pt-12">
            {children}
          </div>
        </DeploymentProvider>
      </body>
    </html>
  );
}
