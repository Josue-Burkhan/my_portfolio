"use client";

import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { PortfolioProject } from "@/content/portfolio";
import { setExperiencePaused } from "@/lib/experience-scroll";

type ProjectDialogProps = {
  onClose: () => void;
  project: PortfolioProject;
};

export function ProjectDialog({ onClose, project }: ProjectDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    setExperiencePaused(true);
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      setExperiencePaused(false);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      aria-label={`Close ${project.name} case study`}
      className="project-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="presentation"
    >
      <div
        aria-labelledby={`project-${project.slug}-title`}
        aria-modal="true"
        className="project-dialog"
        ref={panelRef}
        role="dialog"
        style={{ "--project-accent": project.accent } as React.CSSProperties}
        tabIndex={-1}
      >
        <div className="project-dialog-head">
          <div>
            <p className="dialog-kicker">
              {project.index} · {project.discipline} · {project.year}
            </p>
            <h2 id={`project-${project.slug}-title`}>{project.name}</h2>
          </div>
          <button
            aria-label="Close project"
            className="dialog-close"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="project-dialog-grid">
          <div className="project-dialog-lead">
            <p>{project.description}</p>
            <button className="dialog-cta" type="button">
              Explore live project
              <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="dialog-copy">
            <section>
              <span>Challenge</span>
              <p>{project.challenge}</p>
            </section>
            <section>
              <span>Response</span>
              <p>{project.solution}</p>
            </section>
            <section>
              <span>Stack</span>
              <ul>
                {project.technologies.map((technology) => (
                  <li key={technology}>{technology}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div
          className="project-gallery"
          aria-label="Project gallery placeholders"
        >
          {project.gallery.map((item, index) => (
            <div key={item}>
              <span>0{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
