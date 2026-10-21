export const chapterIds = [
  "home",
  "about",
  "projects",
  "skills",
  "experience",
  "contact",
] as const;

export type ChapterId = (typeof chapterIds)[number];

export type ExperienceScrollState = {
  activeIndex: number;
  activeId: ChapterId;
  localProgress: number;
  paused: boolean;
  progress: number;
  reducedMotion: boolean;
  velocity: number;
  visible: boolean;
};

const state: ExperienceScrollState = {
  activeIndex: 0,
  activeId: "home",
  localProgress: 0,
  paused: false,
  progress: 0,
  reducedMotion: false,
  velocity: 0,
  visible: true,
};

const listeners = new Set<(value: ExperienceScrollState) => void>();

let controllerCleanup: (() => void) | null = null;

function easeTransition(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}

export function getExperienceScroll() {
  return state;
}

export function subscribeExperienceScroll(
  listener: (value: ExperienceScrollState) => void,
) {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

export function setExperiencePaused(paused: boolean) {
  state.paused = paused;
  listeners.forEach((listener) => listener(state));
}

export function resetExperienceToStart() {
  state.activeIndex = 0;
  state.activeId = "home";
  state.localProgress = 0;
  state.progress = 0;
  state.velocity = 0;
  listeners.forEach((listener) => listener(state));
}

export function resetExperienceToEnd() {
  const lastIndex = chapterIds.length - 1;
  state.activeIndex = lastIndex;
  state.activeId = chapterIds[lastIndex];
  state.localProgress = 1;
  state.progress = 1;
  state.velocity = 0;
  listeners.forEach((listener) => listener(state));
}

export function startExperienceScrollController() {
  if (typeof window === "undefined") return () => undefined;
  if (controllerCleanup) return controllerCleanup;

  let frame = 0;
  let lastProgress = state.progress;
  let lastTime = performance.now();
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const update = (time: number) => {
    const chapterElements = chapterIds.map((id) =>
      document.getElementById(id),
    );
    const chapterTops = chapterElements.map(
      (element, index) => element?.offsetTop ?? index * window.innerHeight,
    );
    const lastChapterIndex = chapterIds.length - 1;
    let chapterProgress = lastChapterIndex;

    if (window.scrollY <= chapterTops[0]) {
      chapterProgress = 0;
    } else {
      for (let index = 0; index < lastChapterIndex; index += 1) {
        const chapterEnd =
          chapterTops[index] +
          (chapterElements[index]?.offsetHeight ?? window.innerHeight);
        const nextChapterStart = chapterTops[index + 1];
        if (window.scrollY >= nextChapterStart) continue;

        if (window.scrollY <= chapterEnd) {
          const sectionProgress =
            (window.scrollY - chapterTops[index]) /
            Math.max(1, chapterEnd - chapterTops[index]);
          const departureStart = index === 0 ? 0.06 : 0.52;
          const departureShare = index === 0 ? 0.28 : 0.06;
          const departureProgress = Math.max(
            0,
            (sectionProgress - departureStart) / (1 - departureStart),
          );
          chapterProgress =
            index + easeTransition(departureProgress) * departureShare;
          break;
        }

        const transitionProgress =
          (window.scrollY - chapterEnd) /
          Math.max(1, nextChapterStart - chapterEnd);
        const departureShare = index === 0 ? 0.28 : 0.06;
        chapterProgress =
          index +
          departureShare +
          easeTransition(transitionProgress) * (1 - departureShare);
        break;
      }
    }

    const targetProgress = chapterProgress / lastChapterIndex;
    const smoothing = state.reducedMotion ? 1 : 0.2;

    if (!state.paused) {
      const distance = targetProgress - state.progress;
      state.progress =
        Math.abs(distance) < 0.0001
          ? targetProgress
          : state.progress + distance * smoothing;
    }

    const elapsed = Math.max(16, time - lastTime);
    state.velocity = (state.progress - lastProgress) / elapsed;
    lastProgress = state.progress;
    lastTime = time;

    const viewportCenter = window.scrollY + window.innerHeight * 0.5;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    chapterElements.forEach((element, index) => {
      if (!element) return;
      const center = element.offsetTop + element.offsetHeight * 0.5;
      const distance = Math.abs(center - viewportCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const activeElement = chapterElements[nearestIndex];
    const activeTop = activeElement?.offsetTop ?? 0;
    const activeHeight = activeElement?.offsetHeight ?? window.innerHeight;

    state.activeIndex = nearestIndex;
    state.activeId = chapterIds[nearestIndex];
    state.localProgress = Math.min(
      1,
      Math.max(
        0,
        (window.scrollY + window.innerHeight * 0.72 - activeTop) /
          (activeHeight + window.innerHeight * 0.44),
      ),
    );

    listeners.forEach((listener) => listener(state));
    frame = window.requestAnimationFrame(update);
  };

  const updateMotionPreference = () => {
    state.reducedMotion = motionQuery.matches;
  };

  const updateVisibility = () => {
    state.visible = document.visibilityState === "visible";
  };

  updateMotionPreference();
  updateVisibility();
  motionQuery.addEventListener("change", updateMotionPreference);
  document.addEventListener("visibilitychange", updateVisibility);
  frame = window.requestAnimationFrame(update);

  controllerCleanup = () => {
    window.cancelAnimationFrame(frame);
    motionQuery.removeEventListener("change", updateMotionPreference);
    document.removeEventListener("visibilitychange", updateVisibility);
    controllerCleanup = null;
  };

  return controllerCleanup;
}
