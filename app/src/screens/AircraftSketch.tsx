interface AircraftSketchProps {
  type: string;
  className?: string;
}

const centreline = (x1 = 20, x2 = 144) => (
  <path
    d={`M${x1} 50H${x2}`}
    stroke="#c9c4ba"
    strokeWidth=".8"
    strokeDasharray="6 4"
  />
);

function Planform({ type }: AircraftSketchProps) {
  switch (type) {
    case "SailPlane_Unpowered":
      return (
        <>
          <path d="M26 50 L56 46 L60 6 L66 6 L68 46 L118 46 L120 36 L126 36 L128 46 L136 48 L136 52 L128 54 L126 64 L120 64 L118 54 L68 54 L66 94 L60 94 L56 54 Z" />
          {centreline(22, 142)}
        </>
      );
    case "SailPlane_Powered":
      return (
        <>
          <path d="M28 50 L56 45 L60 10 L66 10 L68 45 L118 45 L120 36 L126 36 L128 45 L136 47 L136 53 L128 55 L126 64 L120 64 L118 55 L68 55 L66 90 L60 90 L56 55 Z" />
          <path d="M22 34V66" />
          <circle cx="24" cy="50" r="2.4" fill="#14171a" stroke="none" />
          {centreline(18, 142)}
        </>
      );
    case "Homebuilt_Metal_or_Wood":
      return (
        <>
          <path d="M32 50 L54 44 L54 20 L74 20 L74 44 L112 44 L112 34 L126 34 L126 44 L132 46 L132 54 L126 56 L126 66 L112 66 L112 56 L74 56 L74 80 L54 80 L54 56 Z" />
          <path d="M26 30V70" />
          <circle cx="28" cy="50" r="2.6" fill="#14171a" stroke="none" />
          {centreline(22, 138)}
        </>
      );
    case "Homebuilt_Composite":
      return (
        <>
          <path d="M28 50 L62 45 L76 20 L88 20 L82 45 L116 45 L126 37 L134 37 L128 45 L138 47 L138 53 L128 55 L134 63 L126 63 L116 55 L82 55 L88 80 L76 80 L62 55 Z" />
          <path d="M46 46 L38 33 L48 31 L54 45" />
          <path d="M46 54 L38 67 L48 69 L54 55" />
          {centreline(22, 144)}
        </>
      );
    case "GA_Single":
      return (
        <>
          <path d="M30 50 L52 43 L56 16 L74 16 L78 43 L110 43 L112 32 L128 32 L130 43 L136 46 L136 54 L130 57 L128 68 L112 68 L110 57 L78 57 L74 84 L56 84 L52 57 Z" />
          <path d="M24 30V70" />
          <circle cx="26" cy="50" r="2.8" fill="#14171a" stroke="none" />
          {centreline(20, 142)}
        </>
      );
    case "GA_Twin":
      return (
        <>
          <path d="M28 50 L50 42 L56 14 L74 14 L80 42 L108 42 L112 32 L128 32 L130 42 L138 45 L138 55 L130 58 L128 68 L112 68 L108 58 L80 58 L74 86 L56 86 L50 58 Z" />
          <path d="M44 22H68V30H44Z" />
          <path d="M44 78H68V70H44Z" />
          <path d="M42 18V34M42 82V66" />
          {centreline(20, 144)}
        </>
      );
    case "Agricultural":
      return (
        <>
          <path d="M30 50 L50 41 L50 16 L84 16 L84 41 L112 41 L112 32 L128 32 L128 41 L134 45 L134 55 L128 59 L128 68 L112 68 L112 59 L84 59 L84 84 L50 84 L50 59 Z" />
          <path d="M88 18V82" strokeWidth=".9" strokeDasharray="4 3" />
          <path d="M24 28V72" />
          <circle cx="26" cy="50" r="3" fill="#14171a" stroke="none" />
          {centreline(20, 140)}
        </>
      );
    case "Twin_Turboprop":
      return (
        <>
          <path d="M28 50 L54 42 L60 12 L78 12 L82 42 L114 42 L120 30 L136 30 L138 42 L144 45 L144 55 L138 58 L136 70 L120 70 L114 58 L82 58 L78 88 L60 88 L54 58 Z" />
          <path d="M46 18H72V26H46Z" />
          <path d="M46 82H72V74H46Z" />
          <path d="M44 14V30M44 86V70" />
          {centreline(22, 150)}
        </>
      );
    case "Flying_Boat":
      return (
        <>
          <path d="M24 50 L52 40 L56 14 L74 14 L76 40 L114 40 L120 30 L132 30 L134 40 L140 44 L140 56 L134 60 L132 70 L120 70 L114 60 L76 60 L74 86 L56 86 L52 60 Z" />
          <ellipse cx="64" cy="24" rx="7" ry="3.2" />
          <ellipse cx="64" cy="76" rx="7" ry="3.2" />
          <path d="M64 24V40M64 76V60M80 40V60" strokeWidth=".9" />
          {centreline(20, 146)}
        </>
      );
    case "Jet_Trainer":
      return (
        <>
          <path d="M24 50 L60 44 L84 22 L94 22 L80 44 L110 44 L124 35 L132 35 L120 44 L136 46 L136 54 L120 56 L132 65 L124 65 L110 56 L80 56 L94 78 L84 78 L60 56 Z" />
          <path d="M52 44 L52 39 L62 41M52 56 L52 61 L62 59" />
          {centreline(20, 144)}
        </>
      );
    case "Jet_Fighter":
      return (
        <>
          <path d="M20 50 L50 43 L94 18 L104 18 L96 43 L104 43 L116 34 L124 34 L112 43 L130 46 L130 54 L112 57 L124 66 L116 66 L104 57 L96 57 L104 82 L94 82 L50 57 Z" />
          <path d="M42 44 L36 32 L46 30 L52 43M42 56 L36 68 L46 70 L52 57" />
          {centreline(16, 138)}
        </>
      );
    case "Military_cargo_or_bomber":
      return (
        <>
          <path d="M22 50 L50 39 L84 8 L98 8 L72 39 L110 39 L130 26 L140 26 L122 39 L146 44 L146 56 L122 61 L140 74 L130 74 L110 61 L72 61 L98 92 L84 92 L50 61 Z" />
          <path d="M58 24H70V32H58ZM72 12H84V20H72ZM58 76H70V68H58ZM72 88H84V80H72Z" />
          {centreline(18, 152)}
        </>
      );
    case "Jet_Transport":
      return (
        <>
          <path d="M22 50 L54 41 L88 12 L100 12 L76 41 L114 41 L132 28 L142 28 L126 41 L146 45 L146 55 L126 59 L142 72 L132 72 L114 59 L76 59 L100 88 L88 88 L54 59 Z" />
          <path d="M62 26H74V34H62ZM62 74H74V66H62Z" />
          {centreline(18, 152)}
        </>
      );
    case "UAV_Tac_Recce_or_UCAV":
      return (
        <>
          <path d="M30 50 L48 44 L96 20 L124 32 L112 50 L124 68 L96 80 L48 56 Z" />
          <ellipse cx="46" cy="50" rx="9" ry="5" />
          <path d="M70 34 L78 44 L78 56 L70 66" strokeWidth=".9" />
          {centreline(24, 132)}
        </>
      );
    case "UAV_High_Altitude":
      return (
        <>
          <path d="M30 50 L54 45 L58 4 L66 4 L68 45 L118 45 L138 32 L144 32 L128 46 L132 48 L132 52 L128 54 L144 68 L138 68 L118 55 L68 55 L66 96 L58 96 L54 55 Z" />
          <ellipse cx="36" cy="50" rx="9" ry="5.5" />
          {centreline(24, 150)}
        </>
      );
    case "UAV_Small":
      return (
        <>
          <path d="M74 30H120M74 70H120" />
          <path d="M116 26H124V74H116Z" />
          <path d="M46 50 L58 43 L60 24 L70 24 L72 43 L86 43 L92 47 L92 53 L86 57 L72 57 L70 76 L60 76 L58 57 Z" />
          <path d="M96 38V62" />
          {centreline(40, 132)}
        </>
      );
    default:
      return null;
  }
}

export default function AircraftSketch({
  type,
  className = "block h-[88px] w-full",
}: AircraftSketchProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 100"
      className={className}
      fill="#ffffff"
      stroke="#14171a"
      strokeWidth="1.2"
      strokeLinejoin="round"
    >
      <Planform type={type} />
    </svg>
  );
}
