import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAtomValue, useSetAtom } from "jotai";
import { Link, Route, Routes } from "react-router-dom";

import { aircraftTypeKeys, AircraftType } from "../api/aircraftTypes";
import { getCalculationClient } from "../api/client";
import ProjectDetail from "../containers/projectDetail";
import {
  activateProjectAtom,
  aircraftTypeAtom,
  createProjectAtom,
  projectNameAtom,
  projectsAtom,
} from "../domain/atoms";
import { aircraftTypeLabel, ProjectRecord } from "../domain/projects";
import AircraftSketch from "./AircraftSketch";
import CreateProject from "./CreateProject";

interface ProjectRow extends ProjectRecord {
  classLabel: string;
}

function projectDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "DATE UNAVAILABLE";

  const elapsedMs = Date.now() - date.getTime();
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60_000));
  if (elapsedMinutes < 1) return "JUST NOW";
  if (elapsedMinutes < 60) return `${elapsedMinutes} MIN AGO`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24)
    return `${elapsedHours} ${elapsedHours === 1 ? "HOUR" : "HOURS"} AGO`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7)
    return `${elapsedDays} ${elapsedDays === 1 ? "DAY" : "DAYS"} AGO`;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

function categoryLabel(
  aircraftType: string,
  catalogue: AircraftType[] | undefined
): string {
  const match = catalogue?.find(({ value }) => value === aircraftType);
  if (!match) return aircraftTypeLabel(aircraftType);
  return `${match.group} · ${match.label}`;
}

function ProjectsIndex() {
  const projects = useAtomValue(projectsAtom);
  const projectName = useAtomValue(projectNameAtom);
  const aircraftType = useAtomValue(aircraftTypeAtom);
  const createProject = useSetAtom(createProjectAtom);
  const activateProject = useSetAtom(activateProjectAtom);
  const [filter, setFilter] = useState("");
  const aircraftTypes = useQuery({
    queryKey: aircraftTypeKeys.catalog,
    queryFn: () => getCalculationClient().aircraftTypes(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Recover a project created before the catalogue existed. Both values were
  // already persisted; only their list record was missing.
  useEffect(() => {
    if (projects.length === 0 && projectName.trim()) {
      createProject({ name: projectName, aircraftType });
    }
  }, [aircraftType, createProject, projectName, projects.length]);

  const rows = useMemo<ProjectRow[]>(() => {
    const query = filter.trim().toLowerCase();
    return [...projects]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
      )
      .map((project) => ({
        ...project,
        classLabel: categoryLabel(project.aircraftType, aircraftTypes.data),
      }))
      .filter(
        ({ name, classLabel }) =>
          !query ||
          name.toLowerCase().includes(query) ||
          classLabel.toLowerCase().includes(query)
      );
  }, [aircraftTypes.data, filter, projects]);

  const columns = useMemo<ColumnDef<ProjectRow>[]>(
    () => [
      {
        id: "plan",
        header: "PLAN",
        cell: ({ row }) => (
          <div className="m-2.5 border border-rule-soft bg-paper px-1">
            <AircraftSketch
              type={row.original.aircraftType}
              className="block h-[42px] w-[78px]"
            />
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "PROJECT",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1.5 px-[14px] py-3">
            <Link
              to={`/projects/${row.original.id}/mtow`}
              onClick={() => activateProject(row.original.id)}
              className="w-fit text-ink no-underline hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <h2 className="m-0 text-[15px] font-normal leading-[1.2]">
                {row.original.name}
              </h2>
            </Link>
            <span className="font-mono text-micro text-ink-faint">
              PROJECT RECORD
            </span>
          </div>
        ),
      },
      {
        accessorKey: "classLabel",
        header: "CLASS",
        cell: ({ getValue }) => (
          <span className="block px-[14px] py-3 font-mono text-note text-ink-muted">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "CREATED",
        cell: ({ getValue, row }) => (
          <time
            dateTime={getValue<string>()}
            className={`block px-[14px] py-3 font-mono text-note ${
              row.index === 0 ? "text-accent" : "text-ink-muted"
            }`}
          >
            {projectDate(getValue<string>())}
          </time>
        ),
      },
      {
        id: "open",
        header: "",
        cell: ({ row }) => (
          <Link
            aria-label={`Open ${row.original.name}`}
            to={`/projects/${row.original.id}/mtow`}
            onClick={() => activateProject(row.original.id)}
            className="block px-[14px] py-3 text-right font-mono text-value text-series-compare no-underline hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
          >
            →
          </Link>
        ),
      },
    ],
    [activateProject]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <main className="flex flex-1 flex-col items-center bg-panel bg-draft bg-grid-32 px-5 pb-11 pt-9 sm:px-[34px]">
      <div className="flex w-full max-w-[1080px] flex-col">
        <header className="mb-[22px] flex items-end justify-between gap-6">
          <h1 className="m-0 text-[26px] font-normal leading-[1.15]">Projects</h1>
          <Link
            to="/projects/create"
            className="border border-accent bg-accent px-6 py-3 font-mono text-meta font-medium tracking-label text-white no-underline hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            CREATE PROJECT +
          </Link>
        </header>

        <div className="mb-[18px] flex items-center gap-4 border border-rule bg-field px-4 py-2.5">
          <label
            htmlFor="project-filter"
            className="font-mono text-label tracking-tab text-series-compare"
          >
            FILTER
          </label>
          <input
            id="project-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="project name or class"
            className="min-w-0 flex-1 border-b border-dashed border-[#d5d1c8] bg-transparent px-0.5 pb-1 text-value text-ink outline-none placeholder:text-[#b8bcc2] focus:border-accent"
          />
          <span className="hidden font-mono text-micro text-ink-faint sm:block">
            SORTED BY CREATED
          </span>
        </div>

        <section
          aria-label="Saved projects"
          className="overflow-x-auto border border-rule bg-field"
        >
          <table className="w-full min-w-[760px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[104px]" />
              <col />
              <col className="w-[220px]" />
              <col className="w-[150px]" />
              <col className="w-11" />
            </colgroup>
            <thead className="bg-ink text-panel">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-[14px] py-2 text-left font-mono text-micro font-medium tracking-band"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-rule-soft hover:bg-paper"
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <td
                      key={cell.id}
                      className={index === 0 ? "border-r border-rule-hair" : ""}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center font-mono text-meta tracking-tab text-ink-faint"
                  >
                    {projects.length === 0
                      ? "NO PROJECTS YET"
                      : "NO PROJECTS MATCH THIS FILTER"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <Link
            to="/projects/create"
            className="flex items-center gap-3 px-4 py-[14px] font-mono text-meta font-medium tracking-tab text-ink-faint no-underline hover:bg-paper hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
          >
            <span className="w-20 border-b border-dashed border-[#d5d1c8]" />
            NEW PROJECT
          </Link>
        </section>

        <p className="m-0 px-0.5 pt-[14px] font-mono text-meta text-ink-faint">
          {rows.length} OF {projects.length} SHOWN · STORED LOCALLY
        </p>
      </div>
    </main>
  );
}

function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Routes>
        <Route path="/" element={<ProjectsIndex />} />
        <Route path="/projects/create" element={<CreateProject />} />
        <Route path="/projects/:id/*" element={<ProjectDetail />} />
      </Routes>
    </div>
  );
}

export default LandingPage;
