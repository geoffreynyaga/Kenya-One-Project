export interface ProjectRecord {
  id: string;
  name: string;
  aircraftType: string;
  createdAt: string;
}

export interface NewProjectRecord {
  name: string;
  aircraftType: string;
}

export function projectSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "untitled-project";
}

export function nextProjectId(name: string, projects: ProjectRecord[]): string {
  const base = projectSlug(name);
  const ids = new Set(projects.map(({ id }) => id));
  if (!ids.has(base)) return base;

  let suffix = 2;
  while (ids.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function aircraftTypeLabel(value: string): string {
  return value.replaceAll("_", " ");
}

/**
 * Unmanned categories are sized by mass fractions (Gundlach ch. 3) rather
 * than by the crewed fuel-fraction methods, so the MTOW route switches on this.
 */
export function isUnmannedType(value: string): boolean {
  return value.startsWith("UAV_");
}
