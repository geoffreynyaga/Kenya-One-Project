import { ReactNode } from "react";

interface InputSectionProps {
  title: string;
  count: number;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
}

/**
 * A band of sheet inputs that collapses, so a long input column stays
 * readable. Collapsed, it says how many rows it is hiding.
 */
export function InputSection({
  title,
  count,
  open,
  onToggle,
  children,
}: InputSectionProps) {
  return (
    <details
      className="border-t border-rule-soft first:border-t-0"
      onToggle={(event) => onToggle(event.currentTarget.open)}
      open={open}
    >
      <summary className="group flex cursor-pointer list-none items-center justify-between gap-2 px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
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
      </summary>
      {children}
    </details>
  );
}
