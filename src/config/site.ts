export const siteConfig = {
  name: "Josue Burkhan",
  initials: "JB",
  descriptor: "Design · Code · 3D",
  email: "josue-burkhan@gmail.com",
  linkedin: "https://www.linkedin.com/in/josue-burkhan/",
  github: "https://github.com/Josue-Burkhan",
  navigation: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Projects", href: "#projects" },
    { label: "Skills", href: "#skills" },
    { label: "Experience", href: "#experience" },
    { label: "Contact", href: "#contact" },
  ],
  music: {
    src: "/audio/home-audio.mp3" as string | null,
    title: "Portfolio ambience",
    chapterVolumes: [0.22, 0.28, 0.34, 0.3, 0.38, 0.46],
  },
} as const;
