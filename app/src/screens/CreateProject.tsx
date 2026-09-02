import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { Link, useNavigate } from "react-router-dom";

import { aircraftTypeKeys } from "../api/aircraftTypes";
import { getCalculationClient } from "../api/client";
import { createProjectAtom } from "../domain/atoms";
import AircraftSketch from "./AircraftSketch";
import { createProjectSchema } from "./createProjectSchema";

const buttonBase =
  "border px-[26px] py-3 font-mono text-meta font-medium tracking-label transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:border-rule-soft disabled:bg-rule-soft disabled:text-ink-faint";

interface CreationHeaderProps {
  step: 1 | 2;
}

function CreationHeader({ step }: CreationHeaderProps) {
  return (
    <header className="flex h-[42px] flex-none items-stretch border-b border-rule bg-paper">
      <Link
        to="/"
        className="flex items-center gap-[11px] border-r border-rule-mid px-[22px] text-ink no-underline"
      >
        <span className="block h-[9px] w-[9px] bg-accent" />
        <span className="font-mono text-meta font-medium tracking-[.2em]">
          KENYA ONE
        </span>
      </Link>
      <div className="flex items-center border-r border-rule-mid px-[22px] font-mono text-meta tracking-tab text-ink-faint">
        NEW PROJECT
      </div>
      <div className="flex-1" />
      <div className="flex items-center border-l border-rule-mid px-[22px] font-mono text-meta tracking-tab text-ink-faint">
        STEP {String(step).padStart(2, "0")} / 2
      </div>
    </header>
  );
}

interface NameStepProps {
  name: string;
  error: string | null;
  onNameChange: (name: string) => void;
  onContinue: (event: FormEvent<HTMLFormElement>) => void;
}

function NameStep({ name, error, onNameChange, onContinue }: NameStepProps) {
  const validName = createProjectSchema.shape.name.safeParse(name).success;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="grid flex-1 grid-cols-[minmax(20px,1fr)_minmax(0,520px)_minmax(20px,1fr)] items-center">
      <form
        className="col-start-2 py-10"
        noValidate
        onSubmit={onContinue}
      >
        <p className="mb-[14px] font-mono text-label font-medium tracking-[.18em] text-ink-faint">
          SHEET 00 / PROJECT RECORD
        </p>
        <h1 className="mb-2 text-[30px] font-normal leading-[1.15]">
          Name this project
        </h1>
        <p className="mb-[30px] max-w-[420px] text-[13.5px] leading-6 text-ink-muted">
          The project name appears in the title block of every design sheet.
        </p>

        <div className="border border-rule bg-field px-6 pb-5 pt-[22px]">
          <div className="mb-[11px] flex items-baseline justify-between">
            <label
              htmlFor="project-name"
              className="font-mono text-label font-medium tracking-label text-ink-label"
            >
              PROJECT NAME
            </label>
            <span className="flex items-center gap-[7px] font-mono text-label text-ink-faint">
              <span className="w-4 border-b border-dashed border-series-compare" />
              EDITABLE
            </span>
          </div>
          <input
            id="project-name"
            autoComplete="off"
            maxLength={80}
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Kenya One"
            aria-describedby={error ? "project-name-error" : undefined}
            aria-invalid={Boolean(error)}
            className="w-full border-b border-dashed border-series-compare bg-transparent px-0.5 pb-2 text-[22px] leading-[1.3] text-ink outline-none placeholder:text-[#b8bcc2] focus:border-accent"
          />
          {error ? (
            <p
              id="project-name-error"
              className="mt-2 font-mono text-meta text-accent-dark"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <dl className="mt-6 grid grid-cols-2 gap-px bg-rule-cell">
            <div className="bg-paper px-[14px] py-[11px]">
              <dt className="mb-1.5 font-mono text-tag tracking-tab text-ink-faint">
                VERSION
              </dt>
              <dd className="m-0 font-mono text-body text-ink">
                KENYA ONE 2.4
              </dd>
            </div>
            <div className="bg-paper px-[14px] py-[11px]">
              <dt className="mb-1.5 font-mono text-tag tracking-tab text-ink-faint">
                DATE
              </dt>
              <dd className="m-0 font-mono text-body text-ink">{today}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-[26px] flex items-center gap-[18px]">
          <button
            type="submit"
            disabled={!validName}
            className={`${buttonBase} border-accent bg-accent text-white hover:bg-accent-dark`}
          >
            CONTINUE →
          </button>
          {!validName ? (
            <span className="font-mono text-meta text-accent-dark">
              NAME REQUIRED
            </span>
          ) : null}
        </div>
      </form>
    </main>
  );
}

export default function CreateProject() {
  const navigate = useNavigate();
  const saveProject = useSetAtom(createProjectAtom);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const aircraftTypes = useQuery({
    queryKey: aircraftTypeKeys.catalog,
    queryFn: () => getCalculationClient().aircraftTypes(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const continueToCategories = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = createProjectSchema.shape.name.safeParse(name);
    if (!result.success) {
      setNameError(result.error.issues[0]?.message ?? "Enter a project name.");
      return;
    }
    setName(result.data);
    setNameError(null);
    setStep(2);
  };

  const createProject = () => {
    const result = createProjectSchema.safeParse({
      name,
      aircraftType: selectedType ?? "",
    });
    const categoryExists = aircraftTypes.data?.some(
      ({ value }) => value === selectedType
    );

    if (!result.success || !categoryExists) {
      setCategoryError("Select an aircraft category.");
      return;
    }

    const project = saveProject(result.data);
    navigate(`/projects/${project.id}/mtow`);
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-panel bg-draft bg-grid-32">
      <CreationHeader step={step} />

      {step === 1 ? (
        <NameStep
          name={name}
          error={nameError}
          onNameChange={(nextName) => {
            setName(nextName);
            if (nameError) setNameError(null);
          }}
          onContinue={continueToCategories}
        />
      ) : (
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-none flex-col gap-3 px-5 pb-[18px] pt-6 sm:px-[34px] lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div>
              <h1 className="text-[26px] font-normal leading-[1.15]">
                Select an aircraft category
              </h1>
              <p className="mt-2 text-body text-ink-muted">
                This sets the sizing method and the empty-weight model. Unmanned
                categories are sized by fixed weights and mass fractions; every
                other category by the fuel-fraction methods.
              </p>
            </div>
            <div className="flex flex-col gap-2 font-mono text-meta text-ink-faint lg:items-end">
              <span>
                PROJECT · <strong className="font-normal text-ink">{name.toUpperCase()}</strong>
              </span>
              <span>PLAN VIEW · NOT TO SCALE</span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto px-5 pb-[22px] sm:px-[34px]">
            {aircraftTypes.isPending ? (
              <div
                className="border border-rule bg-field p-6 font-mono text-meta tracking-tab text-ink-faint"
                role="status"
              >
                LOADING AIRCRAFT CATEGORIES…
              </div>
            ) : null}
            {aircraftTypes.isError ? (
              <div className="max-w-xl border border-accent bg-field p-6">
                <p className="font-mono text-label font-medium tracking-label text-accent-dark">
                  AIRCRAFT CATEGORIES UNAVAILABLE
                </p>
                <p className="mt-3 text-body text-ink-muted">
                  The supported category catalogue could not be loaded. No
                  project has been created.
                </p>
                <button
                  type="button"
                  className="mt-5 font-mono text-meta font-medium tracking-label text-accent hover:text-accent-dark"
                  onClick={() => aircraftTypes.refetch()}
                >
                  RETRY →
                </button>
              </div>
            ) : null}
            {aircraftTypes.isSuccess ? (
              <div
                role="radiogroup"
                aria-label="Aircraft category"
                className="grid grid-cols-1 content-start gap-[14px] sm:grid-cols-2 min-[1040px]:grid-cols-4"
              >
                {aircraftTypes.data.map((aircraft, index) => {
                  const selected = aircraft.value === selectedType;
                  return (
                    <button
                      key={aircraft.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setSelectedType(aircraft.value);
                        setCategoryError(null);
                      }}
                      className={`group flex min-h-[170px] flex-col border bg-field px-[14px] pb-[13px] pt-3 text-left transition-[border-color,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        selected
                          ? "border-ink shadow-[inset_3px_0_0_#e8452b,0_0_0_1px_#14171a]"
                          : "border-rule hover:border-ink"
                      }`}
                    >
                      <span className="flex items-baseline justify-between">
                        <span className="font-mono text-label font-medium uppercase tracking-tab text-ink-label">
                          {aircraft.group}
                        </span>
                        <span className="font-mono text-[9.5px] text-[#b8bcc2]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </span>
                      <span className="my-2 block border border-rule-hair bg-white px-2">
                        <AircraftSketch type={aircraft.value} />
                      </span>
                      <span className="mt-auto text-body text-ink-body">
                        {aircraft.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <footer className="flex flex-none flex-col gap-4 border-t border-rule bg-paper px-5 py-[14px] sm:flex-row sm:items-center sm:justify-between sm:px-[34px]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="font-mono text-meta font-medium tracking-label text-ink-label hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              ← NAME
            </button>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <span
                className={`font-mono text-meta ${
                  selectedType ? "text-ink-faint" : "text-accent-dark"
                }`}
                role={categoryError ? "alert" : undefined}
              >
                {selectedType
                  ? `CLASS · ${selectedType.replaceAll("_", " ").toUpperCase()}`
                  : categoryError ?? "NO CLASS SELECTED"}
              </span>
              <button
                type="button"
                disabled={!selectedType || !aircraftTypes.data}
                onClick={createProject}
                className={`${buttonBase} border-accent bg-accent text-white hover:bg-accent-dark`}
              >
                CREATE SHEET SET →
              </button>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
}
