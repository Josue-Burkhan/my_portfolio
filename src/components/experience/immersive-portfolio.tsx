"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { createTimeline, type Timeline } from "animejs";
import { useCallback, useEffect, useRef, useState } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { SceneStage } from "@/components/three/scene-stage";
import { AmbientEmbers } from "@/components/ui/ambient-embers";
import { CursorTextParticles } from "@/components/ui/cursor-text-particles";
import { MusicControl } from "@/components/ui/music-control";
import { siteConfig } from "@/config/site";
import {
  experience,
  projects,
  skillGroups,
  type PortfolioProject,
} from "@/content/portfolio";
import {
  chapterIds,
  resetExperienceToEnd,
  resetExperienceToStart,
  startExperienceScrollController,
  subscribeExperienceScroll,
} from "@/lib/experience-scroll";

type ChapterTimeline = {
  inner: HTMLElement;
  particleTitles: HTMLElement[];
  section: HTMLElement;
  timeline: Timeline;
};

type EntryPhase = "intro" | "entering" | "entered";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ImmersivePortfolio() {
  const [selectedProject, setSelectedProject] =
    useState<PortfolioProject | null>(null);
  const [looping, setLooping] = useState(false);
  const [entryPhase, setEntryPhase] = useState<EntryPhase>("intro");
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext>(null);
  const audioGainRef = useRef<GainNode>(null);
  const loopingRef = useRef(false);
  const entryTimerRef = useRef<number | null>(null);
  const closeProject = useCallback(() => setSelectedProject(null), []);

  const prepareAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioContextRef.current) return;

    const context = new AudioContext();
    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();
    gain.gain.value = siteConfig.music.chapterVolumes[0];
    source.connect(gain).connect(context.destination);
    audioContextRef.current = context;
    audioGainRef.current = gain;
  }, []);

  const startMusic = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !siteConfig.music.src) return;

    prepareAudio();
    try {
      const playRequest = audio.play();
      const resumeRequest = audioContextRef.current?.resume();
      await Promise.all([playRequest, resumeRequest]);
      setIsMusicPlaying(true);
    } catch {
      audio.pause();
      setIsMusicPlaying(false);
    }
  }, [prepareAudio]);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !siteConfig.music.src) return;

    if (!audio.paused) {
      audio.pause();
      setIsMusicPlaying(false);
      return;
    }
    void startMusic();
  }, [startMusic]);

  const enterExperience = useCallback(
    (withAudio: boolean) => {
      if (entryPhase !== "intro") return;
      if (withAudio) void startMusic();
      setEntryPhase("entering");
      entryTimerRef.current = window.setTimeout(
        () => setEntryPhase("entered"),
        1050,
      );
    },
    [entryPhase, startMusic],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (entryPhase !== "entered") {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = previousOverflow;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [entryPhase]);

  useEffect(
    () => () => {
      if (entryTimerRef.current) window.clearTimeout(entryTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    const audio = audioRef.current;
    const unsubscribe = subscribeExperienceScroll((scroll) => {
      const gain = audioGainRef.current;
      const context = audioContextRef.current;
      if (!gain || !context) return;
      const configuredVolume =
        siteConfig.music.chapterVolumes[scroll.activeIndex] ?? 0.25;
      const volume = scroll.visible ? configuredVolume : 0.025;
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setTargetAtTime(volume, context.currentTime, 0.45);
    });

    return () => {
      unsubscribe();
      audio?.pause();
      void audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const stopController = startExperienceScrollController();
    const timelines: ChapterTimeline[] = [];
    document.documentElement.classList.add("experience-enhanced");

    chapterIds.forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;
      const inner = section.querySelector<HTMLElement>(".chapter-inner");
      if (!inner) return;
      const elements = section.querySelectorAll<HTMLElement>("[data-reveal]");
      if (!elements.length) return;
      const card = section.querySelector<HTMLElement>("[data-card]");
      const particleTitles = [
        ...section.querySelectorAll<HTMLElement>("[data-particle-text]"),
      ];

      const timeline = createTimeline({
        autoplay: false,
        defaults: { ease: "out(3)", duration: 720 },
      });

      if (card) {
        timeline.add(
          card,
          {
            clipPath: ["inset(49% 49% 49% 49%)", "inset(0% 0% 0% 0%)"],
            filter: ["blur(24px)", "blur(0px)"],
            opacity: [0, 1],
            duration: 980,
            ease: "out(4)",
          },
          0,
        );
      }

      timeline.add(
        elements,
        {
          filter: ["blur(6px)", "blur(0px)"],
          opacity: [0, 1],
          delay: 0,
        },
        card ? 110 : 0,
      );
      timeline.seek(0, true);
      timelines.push({ inner, particleTitles, section, timeline });
    });

    const unsubscribe = subscribeExperienceScroll((scroll) => {
      document.documentElement.dataset.activeChapter = scroll.activeId;
      const homeOverlayOpacity = Math.max(
        0,
        1 - window.scrollY / (window.innerHeight * 0.3),
      );
      document.documentElement.style.setProperty(
        "--home-overlay-opacity",
        homeOverlayOpacity.toFixed(3),
      );
      document.documentElement.dataset.homeOverlay =
        homeOverlayOpacity <= 0.001 ? "hidden" : "visible";
      timelines.forEach(({ inner, particleTitles, section, timeline }) => {
        const viewportHeight = window.innerHeight;
        const distanceFromSet = window.scrollY - section.offsetTop;
        const shouldPin =
          distanceFromSet >= -viewportHeight * 0.37 &&
          distanceFromSet <= viewportHeight * 0.76;
        let progress: number;

        inner.toggleAttribute("data-chapter-pinned", shouldPin);

        if (scroll.reducedMotion) {
          progress =
            distanceFromSet >= -viewportHeight * 0.05 &&
            distanceFromSet < section.offsetHeight
              ? 1
              : 0;
        } else if (distanceFromSet < 0) {
          progress =
            1 - Math.min(1, -distanceFromSet / (viewportHeight * 0.34));
        } else if (section.id === "home") {
          progress =
            distanceFromSet <= viewportHeight * 0.06
              ? 1
              : 1 -
                Math.min(
                  1,
                  (distanceFromSet - viewportHeight * 0.06) /
                    (viewportHeight * 0.24),
                );
        } else if (distanceFromSet <= viewportHeight * 0.52) {
          progress = 1;
        } else {
          progress =
            1 -
            Math.min(
              1,
              (distanceFromSet - viewportHeight * 0.52) /
                (viewportHeight * 0.22),
            );
        }

        timeline.seek(timeline.duration * progress, true);
        particleTitles.forEach((title) => {
          const ready = progress >= 0.999;
          if (title.hasAttribute("data-particle-ready") !== ready) {
            title.toggleAttribute("data-particle-ready", ready);
          }
        });
      });
    });

    return () => {
      unsubscribe();
      stopController();
      timelines.forEach(({ timeline }) => timeline.revert());
      timelines.forEach(({ inner }) =>
        inner.removeAttribute("data-chapter-pinned"),
      );
      timelines.forEach(({ particleTitles }) =>
        particleTitles.forEach((title) =>
          title.removeAttribute("data-particle-ready"),
        ),
      );
      document.documentElement.classList.remove("experience-enhanced");
      document.documentElement.style.removeProperty("--home-overlay-opacity");
      delete document.documentElement.dataset.homeOverlay;
      delete document.documentElement.dataset.activeChapter;
    };
  }, []);

  useEffect(() => {
    const timers: number[] = [];
    let loopIntent = 0;
    let intentResetTimer = 0;
    const handleWheel = (event: WheelEvent) => {
      const atTop = window.scrollY <= 3;
      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 3;
      const direction =
        event.deltaY > 0 && atBottom
          ? "forward"
          : event.deltaY < 0 && atTop
            ? "backward"
            : null;
      if (!direction || loopingRef.current) {
        loopIntent = 0;
        window.clearTimeout(intentResetTimer);
        return;
      }

      loopIntent += Math.min(80, Math.abs(event.deltaY));
      window.clearTimeout(intentResetTimer);
      intentResetTimer = window.setTimeout(() => {
        loopIntent = 0;
      }, 520);
      if (loopIntent < 240) return;
      loopIntent = 0;

      loopingRef.current = true;
      setLooping(true);
      document.documentElement.classList.add("experience-looping");
      document.documentElement.dataset.loopDirection = direction;

      timers.push(
        window.setTimeout(() => {
          const previousBehavior =
            document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = "auto";
          if (direction === "forward") {
            resetExperienceToStart();
            window.scrollTo(0, 0);
          } else {
            resetExperienceToEnd();
            window.scrollTo(
              0,
              document.documentElement.scrollHeight - window.innerHeight,
            );
          }
          window.requestAnimationFrame(() => {
            document.documentElement.style.scrollBehavior = previousBehavior;
          });
        }, 390),
        window.setTimeout(() => {
          setLooping(false);
          loopingRef.current = false;
          document.documentElement.classList.remove("experience-looping");
          delete document.documentElement.dataset.loopDirection;
        }, 1050),
      );
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.clearTimeout(intentResetTimer);
      timers.forEach(window.clearTimeout);
      document.documentElement.classList.remove("experience-looping");
      delete document.documentElement.dataset.loopDirection;
    };
  }, []);

  useEffect(() => {
    if (entryPhase !== "entered" || looping) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastScrollY = window.scrollY;
    let direction = 0;
    let idleTimer = 0;
    let settleFrame = 0;
    let settling = false;
    let previousScrollBehavior = "";

    const cancelSettle = () => {
      window.clearTimeout(idleTimer);
      if (!settling) return;
      window.cancelAnimationFrame(settleFrame);
      settling = false;
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
      lastScrollY = window.scrollY;
    };

    const settleTo = (targetY: number) => {
      const startY = window.scrollY;
      const distance = targetY - startY;
      if (Math.abs(distance) < 2) return;

      const duration = clamp(420 + Math.abs(distance) * 0.25, 420, 680);
      const startTime = performance.now();
      settling = true;
      previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";

      const step = (time: number) => {
        if (!settling) return;
        const progress = clamp((time - startTime) / duration, 0, 1);
        const eased = progress * progress * (3 - 2 * progress);
        window.scrollTo(0, startY + distance * eased);

        if (progress < 1) {
          settleFrame = window.requestAnimationFrame(step);
          return;
        }

        window.scrollTo(0, targetY);
        settling = false;
        lastScrollY = targetY;
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
      };

      settleFrame = window.requestAnimationFrame(step);
    };

    const finishNearbyChapter = () => {
      if (!direction || settling || loopingRef.current) return;
      const currentY = window.scrollY;
      const threshold = window.innerHeight * 0.38;
      const chapterTops = chapterIds
        .map((id) => document.getElementById(id)?.offsetTop)
        .filter((top): top is number => typeof top === "number");
      let target: number | undefined;

      if (direction > 0) {
        target = chapterTops.find(
          (top) => top > currentY + 2 && top - currentY <= threshold,
        );
      } else {
        for (let index = chapterTops.length - 1; index >= 0; index -= 1) {
          const top = chapterTops[index];
          if (top < currentY - 2 && currentY - top <= threshold) {
            target = top;
            break;
          }
        }
      }

      if (target === undefined) return;
      if (reducedMotion.matches) {
        window.scrollTo(0, target);
        lastScrollY = target;
        return;
      }
      settleTo(target);
    };

    const handleScroll = () => {
      if (settling) return;
      const nextY = window.scrollY;
      const delta = nextY - lastScrollY;
      if (Math.abs(delta) > 0.5) direction = Math.sign(delta);
      lastScrollY = nextY;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(finishNearbyChapter, 135);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", cancelSettle, { passive: true });
    window.addEventListener("touchstart", cancelSettle, { passive: true });
    window.addEventListener("pointerdown", cancelSettle, { passive: true });

    return () => {
      cancelSettle();
      window.clearTimeout(idleTimer);
      window.cancelAnimationFrame(settleFrame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", cancelSettle);
      window.removeEventListener("touchstart", cancelSettle);
      window.removeEventListener("pointerdown", cancelSettle);
    };
  }, [entryPhase, looping]);

  return (
    <div className={`immersive-site experience-${entryPhase}`}>
      <SceneStage modelVisible={entryPhase !== "intro"} />
      {siteConfig.music.src ? (
        <audio
          loop
          onPause={() => setIsMusicPlaying(false)}
          onPlaying={() => setIsMusicPlaying(true)}
          preload="none"
          ref={audioRef}
          src={siteConfig.music.src}
        />
      ) : null}
      <section
        aria-hidden={entryPhase === "entered"}
        className={`prehome prehome-${entryPhase}`}
        inert={entryPhase === "entered"}
      >
        <AmbientEmbers />
        <div className="prehome-identity">
          <p>Creative Dev.</p>
          <h1>{siteConfig.name.toUpperCase()}</h1>
          <span>Design · Code · 3D</span>
        </div>
        <div className="prehome-actions">
          <p>Click to continue</p>
          <div aria-label="Audio preference" role="group">
            <button
              className="prehome-action prehome-action-primary"
              onClick={() => enterExperience(true)}
              type="button"
            >
              <Volume2 aria-hidden="true" size={17} strokeWidth={1.7} />
              <span>With audio</span>
            </button>
            <button
              className="prehome-action prehome-action-secondary"
              onClick={() => enterExperience(false)}
              type="button"
            >
              <VolumeX aria-hidden="true" size={17} strokeWidth={1.7} />
              <span>Without audio</span>
            </button>
          </div>
        </div>
      </section>
      <SiteHeader />
      <div className="fixed-music-control">
        <MusicControl
          configured={Boolean(siteConfig.music.src)}
          isPlaying={isMusicPlaying}
          onToggle={toggleMusic}
          title={siteConfig.music.title}
        />
      </div>
      <CursorTextParticles enabled={entryPhase === "entered"} />
      <div
        aria-hidden="true"
        className={`loop-reset ${looping ? "loop-reset-active" : ""}`}
      />

      <main className="experience-content">
        <section className="chapter chapter-home" data-chapter="home" id="home">
          <div className="site-container chapter-inner">
            <div className="hero-copy">
              <p className="eyebrow mb-5" data-reveal>
                Full-stack software engineer <span>·</span> Technical team lead
              </p>
              <h1
                className="hero-title text-balance"
                data-particle-text
                data-reveal
              >
                Designing digital
                <br />
                experiences with <em>depth.</em>
              </h1>
              <span
                className="mt-7 block h-px w-16 bg-[var(--accent)]"
                data-reveal
              />
              <p className="hero-intro" data-reveal>
                I build web platforms, mobile applications and creative 3D
                tools, taking products from an idea to production with care for
                quality, performance and the people using them.
              </p>
              <div className="hero-actions" data-reveal>
                <a className="button button-primary" href="#projects">
                  View projects
                  <ArrowUpRight
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.5}
                  />
                </a>
                <a className="button button-secondary" href="#contact">
                  Get in touch
                  <Plus aria-hidden="true" size={18} strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="camera-transition" aria-hidden="true" />

        <section
          className="chapter chapter-about"
          data-chapter="about"
          id="about"
        >
          <div className="site-container chapter-inner chapter-align-right">
            <div
              className="chapter-panel chapter-panel-light about-panel"
              data-card
            >
              <div className="chapter-index" data-reveal>
                <span>02</span>
                <i />
                <span>About</span>
              </div>
              <h2 data-particle-text data-reveal>
                I want to understand what happens beneath the interface.
              </h2>
              <div className="chapter-copy" data-reveal>
                <p>
                  I&apos;m Josue. When a tool or an idea catches my attention, I
                  study how it works and experiment until I can build something
                  of my own. That curiosity led me into 3D engines, reverse
                  engineering and AI.
                </p>
                <p>
                  I care about how a product feels as much as how it works:
                  responsive interactions, dependable behavior and details that
                  hold up in everyday use, whether I am building independently
                  or working with a team.
                </p>
                <p>
                  I graduated from BYU–Idaho with a Bachelor of Science in
                  Software Engineering and an Associate of Applied Science in
                  Software Development.
                </p>
              </div>
              <p className="location-line" data-reveal>
                Based in Arequipa, Peru · Open to remote opportunities
              </p>
            </div>
          </div>
        </section>

        <div className="camera-transition" aria-hidden="true" />

        <section
          className="chapter chapter-projects"
          data-chapter="projects"
          id="projects"
        >
          <div className="site-container chapter-inner">
            <div
              className="chapter-panel chapter-panel-dark projects-panel"
              data-card
            >
              <div className="chapter-index" data-reveal>
                <span>03</span>
                <i />
                <span>Selected work</span>
              </div>
              <div className="projects-heading">
                <h2 data-particle-text data-reveal>
                  Projects shaped from idea to interaction.
                </h2>
                <p data-reveal>Select a case study</p>
              </div>
              <div className="project-cards">
                {projects.map((project) => (
                  <button
                    className="project-card"
                    data-reveal
                    key={project.slug}
                    onClick={() => setSelectedProject(project)}
                    style={
                      {
                        "--project-accent": project.accent,
                      } as React.CSSProperties
                    }
                    type="button"
                  >
                    <span className="project-card-index">{project.index}</span>
                    <span className="project-card-body">
                      <strong>{project.name}</strong>
                      <small>
                        {project.discipline} · {project.status}
                      </small>
                      <span>{project.description}</span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      size={19}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="camera-transition" aria-hidden="true" />

        <section
          className="chapter chapter-skills"
          data-chapter="skills"
          id="skills"
        >
          <div className="site-container chapter-inner chapter-align-left">
            <div
              className="chapter-panel chapter-panel-light skills-panel"
              data-card
            >
              <div className="chapter-index" data-reveal>
                <span>04</span>
                <i />
                <span>Technical skills</span>
              </div>
              <h2 data-particle-text data-reveal>
                From web interfaces to native graphics.
              </h2>
              <div className="skill-grid">
                {skillGroups.map((group) => (
                  <div className="skill-group" data-reveal key={group.title}>
                    <p>{group.title}</p>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="camera-transition" aria-hidden="true" />

        <section
          className="chapter chapter-experience"
          data-chapter="experience"
          id="experience"
        >
          <div className="site-container chapter-inner chapter-align-right">
            <div
              className="chapter-panel chapter-panel-glass experience-panel"
              data-card
            >
              <div className="chapter-index" data-reveal>
                <span>05</span>
                <i />
                <span>Experience</span>
              </div>
              <h2 data-particle-text data-reveal>
                Independent work and team experience.
              </h2>
              <div className="experience-list">
                {experience.map((item) => (
                  <article data-reveal key={`${item.company}-${item.period}`}>
                    <time>{item.period}</time>
                    <div>
                      <strong>{item.role}</strong>
                      <span>{item.company}</span>
                    </div>
                    <p>{item.summary}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div
          className="camera-transition camera-transition-contact"
          aria-hidden="true"
        />

        <section
          className="chapter chapter-contact"
          data-chapter="contact"
          id="contact"
        >
          <div className="site-container chapter-inner chapter-contact-inner">
            <div className="contact-card" data-card>
              <div className="chapter-index" data-reveal>
                <span>06</span>
                <i />
                <span>Contact</span>
              </div>
              <p className="contact-title" data-particle-text data-reveal>
                Have an idea?
              </p>
              <a
                className="contact-email"
                data-reveal
                href={`mailto:${siteConfig.email}`}
              >
                {siteConfig.email}
                <ArrowDownRight
                  aria-hidden="true"
                  size={21}
                  strokeWidth={1.5}
                />
              </a>
              <p className="contact-copy" data-reveal>
                Seeking a software engineering role. Also available for select
                freelance projects and collaborations.
              </p>
              <p className="contact-copy" data-reveal>
                <a
                  href={siteConfig.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
                {" · "}
                <a
                  href={siteConfig.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </p>
            </div>
            <footer className="immersive-footer" data-reveal>
              <p>
                © {new Date().getFullYear()} {siteConfig.name}
              </p>
              <p>Designed with intention · Built in realtime</p>
            </footer>
          </div>
        </section>
      </main>

      <nav className="chapter-progress" aria-label="Section navigation">
        {chapterIds.map((id) => (
          <a
            aria-label={`Go to ${id}`}
            data-chapter-dot={id}
            href={`#${id}`}
            key={id}
          >
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </a>
        ))}
      </nav>

      {selectedProject ? (
        <ProjectDialog onClose={closeProject} project={selectedProject} />
      ) : null}
    </div>
  );
}
