export const siteConfig = {
  name: "Josue Burkhan",
  initials: "JB",
  descriptor: "Design · Code · 3D",
  email: "hello@josueburkhan.dev",
  navigation: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Projects", href: "#projects" },
    { label: "Skills", href: "#skills" },
    { label: "Experience", href: "#experience" },
    { label: "Contact", href: "#contact" },
  ],
  music: {
    // Add the audio file to public/audio and replace null with its public path.
    src: null as string | null,
    title: "Portfolio ambience",
    chapterVolumes: [0.22, 0.28, 0.34, 0.3, 0.38, 0.46],
  },
} as const;
