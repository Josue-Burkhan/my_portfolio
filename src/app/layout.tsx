import type { Metadata } from "next";

import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/manrope";

import { FirebaseAnalytics } from "@/components/firebase-analytics";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Josue Burkhan — Software Engineer",
    template: "%s — Josue Burkhan",
  },
  description:
    "Josue Burkhan is a software engineer based in Peru, building web platforms, mobile applications and 3D creative tools. Explore Wild Canvas, Wild Fantasy and Tricks & Triggers.",
  keywords: [
    "Josue Burkhan",
    "software engineer",
    "full-stack developer",
    "Next.js",
    "Flutter",
    "C++",
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
      <body>
        <FirebaseAnalytics />
        {children}
      </body>
    </html>
  );
}
