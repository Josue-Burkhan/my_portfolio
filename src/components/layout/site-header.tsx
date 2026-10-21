"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { siteConfig } from "@/config/site";
import { chapterIds, subscribeExperienceScroll } from "@/lib/experience-scroll";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("home");

  useEffect(() => {
    let current = "home";
    return subscribeExperienceScroll((scroll) => {
      if (scroll.activeId !== current) {
        current = scroll.activeId;
        setActiveSection(current);
      }
    });
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className="site-header absolute inset-x-0 top-0 z-50"
      data-active={activeSection}
      data-index={chapterIds.indexOf(
        activeSection as (typeof chapterIds)[number],
      )}
    >
      <div className="site-container flex h-24 items-center justify-between sm:h-28">
        <a
          className="group flex items-center gap-4"
          href="#home"
          onClick={closeMenu}
        >
          <span className="logo-mark" aria-hidden="true">
            <span>J</span>
            <i />
            <span>B</span>
          </span>
          <span>
            <strong className="block text-[0.77rem] font-medium tracking-[0.3em] text-[var(--ink)] uppercase">
              {siteConfig.name}
            </strong>
            <small className="mt-1.5 block text-[0.55rem] tracking-[0.31em] text-[var(--muted)] uppercase">
              {siteConfig.descriptor}
            </small>
          </span>
        </a>

        <nav
          className="hidden items-center gap-9 xl:flex"
          aria-label="Primary navigation"
        >
          {siteConfig.navigation.map((item) => {
            const sectionId = item.href.slice(1);
            const active = activeSection === sectionId;

            return (
              <a
                className={`nav-link ${active ? "nav-link-active" : ""}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="grid size-11 place-items-center rounded-full border border-[var(--line-strong)] xl:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div
        aria-hidden={!menuOpen}
        className={`mobile-menu fixed inset-0 top-0 z-[-1] xl:hidden ${menuOpen ? "mobile-menu-open" : ""}`}
        id="mobile-navigation"
        inert={!menuOpen}
      >
        <nav
          className="site-container flex flex-col py-5"
          aria-label="Mobile navigation"
        >
          {siteConfig.navigation.map((item, index) => (
            <a
              className="flex items-center justify-between border-b border-[var(--line)] py-4 font-serif text-3xl"
              href={item.href}
              key={item.href}
              onClick={closeMenu}
            >
              {item.label}
              <span className="font-sans text-[0.6rem] text-[var(--muted)]">
                0{index + 1}
              </span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
