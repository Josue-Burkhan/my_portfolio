"use client";

import { ArrowDownRight, ArrowUpRight, ChevronDown, Plus } from "lucide-react";
import { createTimeline, type Timeline } from "animejs";
import { useCallback, useEffect, useRef, useState } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { SceneStage } from "@/components/three/scene-stage";
import { CursorTextParticles } from "@/components/ui/cursor-text-particles";
import { siteConfig } from "@/config/site";
import {
  experience,
  projects,
  skillGroups,
  techStack,
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
  section: HTMLElement;
  timeline: Timeline;
};

export function ImmersivePortfolio() {
  const [selectedProject, setSelectedProject] =
    useState<PortfolioProject | null>(null);
  const [looping, setLooping] = useState(false);
  const loopingRef = useRef(false);
  const closeProject = useCallback(() => setSelectedProject(null), []);

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
      timelines.push({ inner, section, timeline });
    });

    const unsubscribe = subscribeExperienceScroll((scroll) => {
      document.documentElement.dataset.activeChapter = scroll.activeId;
      const homeOverlayOpacity = Math.max(
        0,
        1 - window.scrollY / (window.innerHeight * 0.72),
      );
      document.documentElement.style.setProperty(
        "--home-overlay-opacity",
        homeOverlayOpacity.toFixed(3),
      );
      document.documentElement.dataset.homeOverlay =
        homeOverlayOpacity <= 0.001 ? "hidden" : "visible";
      timelines.forEach(({ inner, section, timeline }) => {
        const viewportHeight = window.innerHeight;
        const distanceFromSet = window.scrollY - section.offsetTop;
        const shouldPin =
          distanceFromSet >= -viewportHeight * 0.37 &&
          distanceFromSet <= viewportHeight * 0.86;
        let progress: number;

        inner.toggleAttribute("data-chapter-pinned", shouldPin);

        if (scroll.reducedMotion) {
          progress =
            distanceFromSet >= -viewportHeight * 0.05 &&
            distanceFromSet < section.offsetHeight
              ? 1
              : 0;
        } else if (distanceFromSet < 0) {
          progress = 1 - Math.min(1, -distanceFromSet / (viewportHeight * 0.34));
        } else if (distanceFromSet <= viewportHeight * 0.52) {
          progress = 1;
        } else {
          progress =
            1 -
            Math.min(
              1,
              (distanceFromSet - viewportHeight * 0.52) /
                (viewportHeight * 0.34),
            );
        }

        timeline.seek(timeline.duration * progress, true);
      });
    });

    return () => {
      unsubscribe();
      stopController();
      timelines.forEach(({ timeline }) => timeline.revert());
      timelines.forEach(({ inner }) =>
        inner.removeAttribute("data-chapter-pinned"),
      );
      document.documentElement.classList.remove("experience-enhanced");
      document.documentElement.style.removeProperty("--home-overlay-opacity");
      delete document.documentElement.dataset.homeOverlay;
      delete document.documentElement.dataset.activeChapter;
    };
  }, []);

  useEffect(() => {
    const timers: number[] = [];
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
      if (!direction || loopingRef.current) return;

      loopingRef.current = true;
      setLooping(true);
      document.documentElement.classList.add("experience-looping");
      document.documentElement.dataset.loopDirection = direction;

      timers.push(
        window.setTimeout(() => {
          const previousBehavior = document.documentElement.style.scrollBehavior;
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
      timers.forEach(window.clearTimeout);
      document.documentElement.classList.remove("experience-looping");
      delete document.documentElement.dataset.loopDirection;
    };
  }, []);

  return (
    <div className="immersive-site">
      <SceneStage />
      <SiteHeader />
      <CursorTextParticles />
      <div
        aria-hidden="true"
        className={`loop-reset ${looping ? "loop-reset-active" : ""}`}
      />

      <main className="experience-content">
        <section className="chapter chapter-home" data-chapter="home" id="home">
          <div className="site-container chapter-inner">
            <div className="hero-copy">
              <div className="section-marker mb-10" data-reveal>
                <span>01</span>
                <span className="h-px w-14 bg-[var(--line-strong)]" />
              </div>
              <p className="eyebrow mb-5" data-reveal>
                Software designer <span>·</span> Full-stack developer
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
                I build expressive web products, reliable backend systems and
                immersive 3D experiences with a focus on design, performance and
                thoughtful details.
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
              <div
                className="tech-strip"
                aria-label="Core technology stack"
                data-reveal
              >
                {techStack.map((technology, index) => (
                  <span className="flex items-center gap-x-4" key={technology}>
                    {technology}
                    {index < techStack.length - 1 ? (
                      <i aria-hidden="true">/</i>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>

            <div className="availability" data-reveal>
              <span className="availability-dot">
                <i />
              </span>
              <p>
                Available for select projects
                <span>Let&apos;s build something exceptional.</span>
              </p>
            </div>
            <a
              className="scroll-cue"
              href="#about"
              aria-label="Continue to about"
            >
              <span>Scroll to enter</span>
              <ChevronDown size={17} />
            </a>
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
                I connect visual thinking with technical precision.
              </h2>
              <p className="chapter-lead" data-reveal>
                Building work that feels clear, considered and a little
                unexpected.
              </p>
              <div className="chapter-copy" data-reveal>
                <p>
                  I&apos;m Josue, a multidisciplinary developer focused on the
                  space where product design, engineering and interactive media
                  meet.
                </p>
                <p>
                  My process moves from systems and strategy to interfaces and
                  motion, keeping every experience fast, accessible and
                  maintainable.
                </p>
              </div>
              <p className="location-line" data-reveal>
                Based in Lima · Working worldwide
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
                        {project.discipline} · {project.year}
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
              <p className="mock-note" data-reveal>
                Mock case studies · Content ready to replace
              </p>
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
                <span>Capabilities</span>
              </div>
              <h2 data-particle-text data-reveal>
                A broad toolkit, organized around outcomes.
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
                A practice built across product, code and motion.
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

        <div className="camera-transition" aria-hidden="true" />

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
                Open to collaborations, digital products and ambitious
                interactive experiences.
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
