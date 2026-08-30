import { Hint } from "./Hint";

interface FigureExplainerProps {
  body: string;
  cite?: string;
  id: string;
  label: string;
}

export function FigureExplainer({
  body,
  cite,
  id,
  label,
}: FigureExplainerProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
      <span>{label}</span>
      <span className="flex items-center gap-2 text-meta font-normal text-ink-faint">
        EXPLAINER
        <Hint inputId={id} spec={{ body, cite, label }} />
      </span>
    </div>
  );
}
