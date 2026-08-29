import type { Metadata } from "next";

import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/manrope";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Josue Burkhan — Creative Developer",
    template: "%s — Josue Burkhan",
  },
  description:
    "Portfolio of Josue Burkhan, a creative developer building thoughtful digital products, full-stack systems and immersive 3D experiences.",
  keywords: [
    "Josue Burkhan",
    "creative developer",
    "full-stack developer",
    "Next.js",
    "Three.js",
    "portfolio",
  ],
  authors: [{ name: "Josue Burkhan" }],
  creator: "Josue Burkhan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          as="fetch"
          crossOrigin="anonymous"
          href="/models/claustre.glb"
          rel="preload"
          type="model/gltf-binary"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
