import { ReactNode } from "react";

interface InputSectionProps {
  title: string;
  count: number;
  open: boolean;
  onToggle: (open: boolean) => void;
  /** Rows inside that cannot be used as they stand. */
  unresolved?: number;
  /** Rows inside still carrying a seeded guess. */
  provisional?: number;
  children: ReactNode;
}

/**
 * A band of sheet inputs that collapses, so a long input column stays
 * readable. Collapsed, it says how many rows it is hiding — and, when the
 * caller counts them, how many of those want attention. A closed band that
 * looked identical whether or not it held an unusable entry sent the reader
 * opening every one of them to find out.
 */
export function InputSection({
  title,
  count,
  open,
  onToggle,
  unresolved = 0,
  provisional = 0,
  children,
}: InputSectionProps) {
  const flagged = !open && unresolved + provisional > 0;
  return (
    <details
      className="border-t border-rule-soft first:border-t-0"
      onToggle={(event) => onToggle(event.currentTarget.open)}
      open={open}
    >
      <summary className="group flex cursor-pointer list-none flex-col gap-[5px] px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate">{title}</span>
          <span className="flex shrink-0 items-center gap-[7px]">
            <span className="font-normal text-ink-faint">
              {open ? "" : `+${count}`}
            </span>
            <svg
              aria-hidden="true"
              className={`text-accent transition-transform duration-150 ${
                open ? "rotate-180" : ""
              }`}
              fill="none"
              height="10"
              viewBox="0 0 10 10"
              width="10"
            >
              <path
                d="M1.5 3.5 5 7 8.5 3.5"
                stroke="currentColor"
                strokeLinecap="square"
                strokeWidth="1"
              />
            </svg>
          </span>
        </span>

        {flagged ? (
          <span className="flex items-center gap-[6px] font-normal tracking-band">
            {unresolved > 0 ? (
              <span className="bg-accent px-[4px] py-[1px] text-tag leading-[1.6] text-white">
                {unresolved} TO FIX
              </span>
            ) : null}
            {provisional > 0 ? (
              <span className="border border-dashed border-ink-faint px-[4px] py-[1px] text-tag leading-[1.6] text-ink-faint">
                {provisional} PROVISIONAL
              </span>
            ) : null}
          </span>
        ) : null}
      </summary>
      {children}
    </details>
  );
}
