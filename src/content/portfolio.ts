export const techStack = [
  "TypeScript",
  "React & Next.js",
  "Flutter & Dart",
  "C++ & Kotlin",
  "Firebase",
  "PostgreSQL",
];

export const projects = [
  {
    index: "01",
    slug: "wild-canvas",
    url: "https://play.google.com/store/apps/details?id=com.wildfantasy.canvas",
    linkLabel: "View on Google Play",
    name: "Wild Canvas",
    discipline: "2D/3D creative application",
    status: "In production",
    description:
      "A creative application for drawing in 2D, shaping 3D models and painting directly on their surfaces.",
    challenge:
      "Bring drawing and 3D creation into a cohesive mobile workflow, with responsive tools and control over geometry, brushes and materials.",
    solution:
      "Built the product independently, combining a Flutter interface with native graphics and geometry tools. Sketch-based modeling, surface painting and undo/redo support a continuous creative workflow.",
    role: "Sole creator · Product design and development",
    technologies: ["Flutter", "Dart", "C++", "Kotlin", "Firebase"],
    gallery: ["2D drawing", "Sketch-based 3D modeling", "Surface painting"],
    accent: "#ff6500",
  },
  {
    index: "02",
    slug: "wild-fantasy",
    url: "https://wild-fantasy.com/",
    linkLabel: "Visit Wild Fantasy",
    name: "Wild Fantasy",
    discipline: "Full-stack reading platform",
    status: "In production",
    description:
      "A platform for readers and authors to explore, publish and support light novels, manga and serialized fiction.",
    challenge:
      "Connect reading and publishing in one product, supporting content discovery, chapter reading, author workflows and monetization.",
    solution:
      "Designed and developed the product independently, bringing together responsive reading interfaces, author publishing tools, authentication, database workflows and PayPal tips and subscriptions.",
    role: "Sole creator · Product design and full-stack development",
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Supabase",
      "PostgreSQL",
      "PayPal",
    ],
    gallery: [
      "Reading and discovery",
      "Author publishing tools",
      "Tips and subscriptions",
    ],
    accent: "#91a9ae",
  },
  {
    index: "03",
    slug: "tricks-and-triggers",
    url: null,
    linkLabel: null,
    name: "Tricks & Triggers",
    discipline: "Game development · Team lead",
    status: "In development",
    description:
      "A 2D pixel-art game mixing a chaotic kitchen, conveyor-belt action and shooting mechanics.",
    challenge:
      "Turn an unconventional cooking-and-shooting concept into readable, responsive gameplay while coordinating development across a team.",
    solution:
      "Leading the project and contributing to development alongside other developers. The current C++ build combines a layered interactive lobby, timed rounds, moving dishes, animated characters and shader-driven effects.",
    role: "Project lead · Collaborative development",
    technologies: ["C++20", "SDL3 GPU", "CMake", "Shaders", "Python"],
    gallery: [
      "Interactive kitchen lobby",
      "Conveyor-belt gameplay",
      "Visual effects",
    ],
    accent: "#e3ad62",
  },
];

export type PortfolioProject = (typeof projects)[number];

export const skillGroups = [
  {
    title: "Web & mobile",
    items: [
      "JavaScript · TypeScript · HTML/CSS",
      "React · Next.js · Vue.js",
      "Node.js · PHP · WordPress",
      "Flutter · Dart · Kotlin",
      "C# · .NET / Blazor",
      "REST APIs · OAuth · Stripe · PayPal",
    ],
  },
  {
    title: "Systems, graphics & AI",
    items: [
      "C++ · Rust · Python",
      "SDL3 GPU · CMake",
      "2D/3D drawing & mesh tools",
      "Shaders & native rendering",
      "LLM APIs & chatbot integration",
      "Local-model integration",
    ],
  },
  {
    title: "Data & delivery",
    items: [
      "PostgreSQL · MySQL · SQLite",
      "MongoDB · Supabase",
      "Firebase Auth & cloud storage",
      "Git · GitHub · Docker",
      "Vercel · Render · Firebase Hosting",
      "Testing · Code review · Team leadership",
    ],
  },
];

export const experience = [
  {
    period: "Ongoing",
    role: "Independent Developer & Project Lead",
    company: "Own products · Freelance · Collaborations",
    summary:
      "Own product delivery from requirements and architecture to implementation and production support. Lead development with other developers on Tricks & Triggers and contribute to collaborations including Honey Dates.",
  },
  {
    period: "Ended Oct. 2026",
    role: "Family History Data Entry Specialist",
    company: "Springboard · Remote · Four months",
    summary:
      "Processed and verified historical records in a remote, English-speaking team, meeting data-quality and production requirements.",
  },
];
