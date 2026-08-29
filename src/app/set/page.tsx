import type { Metadata } from "next";

import { ModelSetter } from "@/components/three/model-setter";

export const metadata: Metadata = {
  title: "Camera Set",
  description: "Camera positioning workspace for the Claustre 3D scene.",
};

export default function SetPage() {
  return <ModelSetter />;
}
