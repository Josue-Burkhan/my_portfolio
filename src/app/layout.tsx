import type { Metadata } from "next";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Portafolio",
    template: "%s | Portafolio",
  },
  description: "Portafolio personal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
