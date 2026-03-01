import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockSim — Paper Trading Platform",
  description: "Simulate real stock trading with $25,000 in virtual cash.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="orb orb-green" />
        <div className="orb orb-purple" />
        <div className="orb orb-pink" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}