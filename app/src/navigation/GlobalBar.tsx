/*
 * File: app/src/navigation/GlobalBar.tsx
 * Project: KENYA ONE PROJECT
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

import { Link, useLocation } from "react-router-dom";

import { GROUPS, groupOf } from "./sheets";

/*
 * Placeholder until a project model and an authenticated user are available.
 * The name matches the brand this navbar has always carried; revision, units
 * and initials have no source yet and are the only invented values on screen.
 */
const PROJECT = {
  name: "SWIFT UAS",
  revision: "REV B",
  units: "IMPERIAL",
  initials: "GN",
};

/**
 * Global bar — project, discipline groups, units, revision. Groups without
 * sheets are shown but not reachable.
 */
export default function GlobalBar() {
  const { pathname } = useLocation();
  const inProject =
    pathname.startsWith("/projects/") && pathname !== "/projects/create";
  const project = pathname.split("/").slice(0, 3).join("/");
  const current = groupOf(pathname);

  return (
    <div className="flex h-[52px] flex-none items-center justify-between bg-ink px-6 font-sans">
      <div className="flex items-center gap-7">
        <Link
          to="/"
          className="flex items-center gap-3 text-panel no-underline"
        >
          <span className="h-3 w-3 rotate-45 border-[1.5px] border-accent" />
          <span className="text-value font-semibold tracking-tab">
            KENYA ONE
          </span>
        </Link>

        <div className="flex gap-5 font-mono text-note">
          {GROUPS.map((group) => {
            const reachable = group.live && inProject && group.path !== null;
            const active = reachable && group.id === current;
            let className = "text-ink-faint";
            if (active)
              className = "border-b-2 border-accent pb-[5px] text-panel";
            else if (reachable)
              className = "pb-[5px] text-panel/70 hover:text-panel";

            if (!reachable) {
              return (
                <span className={className} key={group.id}>
                  {group.label}
                </span>
              );
            }

            return (
              <Link
                className={`${className} no-underline`}
                key={group.id}
                to={`${project}${group.path}`}
              >
                {group.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-[18px] font-mono text-meta text-ink-faint">
        <span>
          {PROJECT.name} · {PROJECT.revision}
        </span>
        <span>UNITS {PROJECT.units}</span>
        <span className="flex h-[26px] w-[26px] items-center justify-center border border-white/25 text-panel">
          {PROJECT.initials}
        </span>
      </div>
    </div>
  );
}
