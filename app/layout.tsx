import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SES.Hospedajes — Panel de Gestión",
  description:
    "Gestión automatizada de comunicaciones de hospedaje con el Ministerio del Interior",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-surface-950">{children}</body>
    </html>
  );
}
