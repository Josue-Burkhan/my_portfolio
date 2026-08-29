export const techStack = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Three.js",
  "PostgreSQL",
];

export const projects = [
  {
    index: "01",
    slug: "conquest",
    name: "Conquest",
    discipline: "Product design & full-stack",
    year: "2026",
    description:
      "A strategic platform that turns complex spatial data into clear decisions.",
    challenge:
      "Turn a dense operational workflow and large geospatial datasets into an interface that remains immediate and understandable.",
    solution:
      "A modular command surface, deliberate information hierarchy and realtime map interactions that reveal complexity only when it is useful.",
    technologies: ["Next.js", "PostgreSQL", "MapLibre", "Three.js"],
    gallery: ["Systems map", "Command center", "Spatial intelligence"],
    accent: "#ff6500",
  },
  {
    index: "02",
    slug: "nexus-archive",
    name: "Nexus Archive",
    discipline: "Creative development",
    year: "2025",
    description:
      "An editorial digital archive shaped around exploration, motion and memory.",
    challenge:
      "Make a large cultural collection feel explorable without reducing it to conventional search results and static grids.",
    solution:
      "A spatial index with editorial pathways, responsive typography and transitions that preserve the visitor's sense of place.",
    technologies: ["React", "TypeScript", "WebGL", "Motion systems"],
    gallery: ["Archive index", "Editorial pathway", "Object detail"],
    accent: "#91a9ae",
  },
  {
    index: "03",
    slug: "forma-01",
    name: "Forma / 01",
    discipline: "WebGL experience",
    year: "2025",
    description:
      "A realtime 3D study where type, material and sound respond to the visitor.",
    challenge:
      "Create an expressive realtime piece that feels alive while remaining performant and understandable on everyday devices.",
    solution:
      "A compact procedural world driven by input, sound and a restrained material system with adaptive rendering quality.",
    technologies: ["Three.js", "R3F", "Anime.js", "Web Audio"],
    gallery: ["Material study", "Reactive type", "Sound field"],
    accent: "#e3ad62",
  },
];

export type PortfolioProject = (typeof projects)[number];

export const skillGroups = [
  {
    title: "Design",
    items: [
      "Product strategy",
      "UI systems",
      "Creative direction",
      "Prototyping",
    ],
  },
  {
    title: "Engineering",
    items: [
      "Frontend architecture",
      "Backend systems",
      "APIs & data",
      "Performance",
    ],
  },
  {
    title: "Interactive",
    items: [
      "Three.js & WebGL",
      "Motion systems",
      "3D experiences",
      "Generative visuals",
    ],
  },
];

export const experience = [
  {
    period: "2025 — Now",
    role: "Independent Creative Developer",
    company: "Selected collaborations",
    summary:
      "Designing and building thoughtful products for teams working across technology and culture.",
  },
  {
    period: "2023 — 2025",
    role: "Full-stack Developer",
    company: "Digital product studio",
    summary:
      "Led interface engineering and backend integrations for scalable web platforms.",
  },
  {
    period: "2021 — 2023",
    role: "Frontend Developer",
    company: "Creative technology practice",
    summary:
      "Created responsive websites, motion systems and interactive prototypes for global launches.",
  },
];
