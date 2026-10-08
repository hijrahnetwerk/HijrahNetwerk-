import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Hijrah Netwerk", template: "%s | Hijrah Netwerk" },
  description: "Een netwerk voor emigranten, van oriëntatie tot integratie.",
  metadataBase: new URL("https://hijrah-netwerk.vercel.app"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="nl"><body>{children}</body></html>;
}
