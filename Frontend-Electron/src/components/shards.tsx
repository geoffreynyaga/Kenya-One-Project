import React from "react";

type ElementProps<T extends keyof React.JSX.IntrinsicElements> =
  Omit<React.JSX.IntrinsicElements[T], "size" | "type"> & {
    active?: boolean;
    block?: boolean;
    fluid?: boolean;
    inline?: boolean;
    navbar?: boolean;
    outline?: boolean;
    pills?: boolean;
    row?: boolean;
    seamless?: boolean;
    size?: string;
    sm?: string | number;
    xs?: string | number;
    lg?: string | number;
    theme?: string;
    type?: string;
    vertical?: boolean;
  };

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

// Vermilion is the only chromatic colour, so the six Bootstrap themes collapse
// onto the graphite scale and the accent. Weight carries the emphasis that hue
// used to: neutral reads as context, wash as noteworthy, solid as the result.
const THEME_BADGE: Record<string, string> = {
  primary: "bg-accent-wash text-accent-dark",
  secondary: "bg-panel text-ink-muted",
  success: "bg-accent-wash text-accent-dark",
  danger: "bg-accent text-paper",
  warning: "bg-accent-wash text-accent-dark",
  info: "bg-panel text-ink-body",
};

const THEME_BUTTON: Record<string, string> = {
  primary: "bg-accent hover:bg-accent-dark text-paper",
  secondary: "bg-panel hover:bg-accent-wash text-ink",
  success: "bg-accent hover:bg-accent-dark text-paper",
  danger: "bg-accent-dark hover:bg-accent text-paper",
  warning: "bg-accent hover:bg-accent-dark text-paper",
  info: "bg-panel hover:bg-accent-wash text-ink-body",
};

export const Badge = ({ className, theme = "primary", ...props }: ElementProps<"span">) => (
  <span
    className={joinClasses(
      "inline-block px-2 py-0.5 font-mono text-meta font-medium",
      THEME_BADGE[theme] ?? THEME_BADGE.primary,
      className
    )}
    {...props}
  />
);

export const Button = ({
  block,
  className,
  outline,
  theme = "primary",
  type,
  ...props
}: ElementProps<"button">) => (
  <button
    className={joinClasses(
      "px-4 py-2 text-body font-medium",
      outline ? "border border-current bg-transparent" : THEME_BUTTON[theme] ?? THEME_BUTTON.primary,
      block && "block w-full",
      className
    )}
    type={(type as "button" | "submit" | "reset" | undefined) ?? "button"}
    {...props}
  />
);

export const Card = ({ className, ...props }: ElementProps<"div">) => (
  <div className={joinClasses("border border-rule-soft bg-field", className)} {...props} />
);

export const CardBody = ({ className, ...props }: ElementProps<"div">) => (
  <div className={joinClasses("p-4", className)} {...props} />
);

export const CardHeader = ({ className, ...props }: ElementProps<"div">) => (
  <div className={joinClasses("border-b border-rule-soft p-4", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: ElementProps<"h5">) => (
  <h5 className={joinClasses("text-value-lg font-semibold text-ink", className)} {...props} />
);

const COL_WIDTHS: Record<string, string> = {
  "1": "w-1/12",
  "2": "w-2/12",
  "3": "w-3/12",
  "4": "w-4/12",
  "5": "w-5/12",
  "6": "w-6/12",
  "7": "w-7/12",
  "8": "w-8/12",
  "9": "w-9/12",
  "10": "w-10/12",
  "11": "w-11/12",
  "12": "w-12/12",
};

export const Col = ({ className, sm, xs, lg, ...props }: ElementProps<"div">) => {
  const size = lg ?? sm ?? xs;
  const widthClass = size !== undefined ? COL_WIDTHS[String(size)] : undefined;
  return (
    <div className={joinClasses("px-2", widthClass ?? "flex-1 min-w-0", className)} {...props} />
  );
};

export const Container = ({ className, fluid, ...props }: ElementProps<"div">) => (
  <div className={joinClasses(fluid ? "w-full px-4" : "mx-auto max-w-6xl px-4", className)} {...props} />
);

export const Form = ({ className, ...props }: ElementProps<"form">) => (
  <form className={joinClasses(className)} {...props} />
);

export const FormGroup = ({ className, ...props }: ElementProps<"div">) => (
  <div className={joinClasses("mb-3", className)} {...props} />
);

export const FormInput = ({ className, size: _size, ...props }: ElementProps<"input">) => (
  <input
    className={joinClasses("w-full border border-rule-mid bg-field px-3 py-1.5 font-mono text-body text-ink", className)}
    {...props}
  />
);

export const FormSelect = ({ className, size: _size, ...props }: ElementProps<"select">) => (
  <select
    className={joinClasses("w-full border border-rule-mid bg-field px-3 py-1.5 font-mono text-body text-ink", className)}
    {...props}
  />
);

export const InputGroup = ({
  className,
  inline: _inline,
  row: _row,
  seamless: _seamless,
  size: _size,
  ...props
}: ElementProps<"div">) => (
  <div className={joinClasses("flex items-center gap-2", className)} {...props} />
);

export const InputGroupAddon = ({ className, type: _type, ...props }: ElementProps<"div">) => (
  <div className={joinClasses("flex items-center", className)} {...props} />
);

export const InputGroupText = ({ className, ...props }: ElementProps<"span">) => (
  <span className={joinClasses("bg-panel px-2 py-1 text-body text-ink-muted", className)} {...props} />
);

export const Nav = ({ className, navbar: _navbar, pills: _pills, vertical, ...props }: ElementProps<"ul">) => (
  <ul className={joinClasses("flex list-none", vertical && "flex-col", className)} {...props} />
);

export const NavItem = ({ className, ...props }: ElementProps<"li">) => (
  <li className={joinClasses(className)} {...props} />
);

export const NavLink = ({ active, className, ...props }: ElementProps<"a">) => (
  <a
    className={joinClasses("block px-3 py-2 text-body", active && "font-semibold text-accent", className)}
    {...props}
  />
);

export const Navbar = ({
  className,
  expand: _expand,
  type: _type,
  ...props
}: ElementProps<"nav"> & { expand?: string }) => (
  <nav className={joinClasses("flex items-center gap-2 p-2", className)} {...props} />
);

export const NavbarBrand = ({ className, ...props }: ElementProps<"a">) => (
  <a className={joinClasses("text-value-lg font-bold text-ink", className)} {...props} />
);

export const NavbarToggler = ({ className, children, type: _type, ...props }: ElementProps<"button">) => (
  <button className={joinClasses("border border-rule-mid p-2", className)} type="button" {...props}>
    {children ?? <span>☰</span>}
  </button>
);

export const Row = ({ className, ...props }: ElementProps<"div">) => (
  <div className={joinClasses("flex flex-wrap", className)} {...props} />
);

type SliderProps = ElementProps<"input"> & {
  connect?: unknown;
  onSlide?: (values: number[]) => void;
  pips?: unknown;
  range?: { min?: number; max?: number };
  start?: number[];
  step?: number;
  tooltips?: boolean;
};

export const Slider = ({
  className,
  connect: _connect,
  onSlide,
  pips: _pips,
  range,
  size: _size,
  start,
  step,
  tooltips: _tooltips,
  type: _type,
  ...props
}: SliderProps) => (
  <input
    className={joinClasses("w-full", className)}
    max={range?.max}
    min={range?.min}
    onChange={(event) => onSlide?.([Number(event.currentTarget.value)])}
    step={step}
    type="range"
    value={start?.[0]}
    {...props}
  />
);

export default {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  Container,
  Form,
  FormGroup,
  FormInput,
  FormSelect,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Nav,
  NavItem,
  NavLink,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  Row,
  Slider,
};
