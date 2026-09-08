export function CruisePowerGuide() {
  return <>
    <p>Cruise power fraction is the shaft power you plan to use in cruise divided by the total installed rated shaft power. Enter a fraction: 60% is entered as 0.60.</p>
    <svg aria-label="Illustrative power setting: 60 percent used and 40 percent of rated power remaining" className="my-5 w-full" role="img" viewBox="0 0 440 100">
      <rect x="10" y="30" width="420" height="28" fill="none" stroke="currentColor" />
      <rect x="10" y="30" width="252" height="28" fill="#ef4329" />
      <text x="10" y="20" fontSize="12">Illustration: 60% of rated power</text>
      <text x="10" y="80" fontSize="12">0</text><text x="245" y="80" fontSize="12">0.60</text><text x="404" y="80" fontSize="12">1.00</text>
    </svg>
    <h3>Choose a setting</h3>
    <ol>
      <li>Identify the selected engine and its installed rating in Sref &amp; Power.</li>
      <li>Use that engine’s operating manual and the applicable aircraft performance data to find a cruise setting for your altitude and mission. Check continuous-power and operating limits.</li>
      <li>Convert the required shaft power to a fraction of installed rated power. Check that this shaft power is available at your altitude.</li>
    </ol>
    <h3>Worked conversion — illustration only</h3>
    <p>If installed rated power is 200 hp and the chosen cruise condition requires 120 hp, the entry is 120 ÷ 200 = 0.60. These are invented round numbers to explain the units, not a recommended setting.</p>
    <h3>How this calculation uses it</h3>
    <p>Cruise shaft power = fraction × installed rated power. Propeller efficiency is applied separately. This fraction is not throttle position or propeller efficiency. A percentage quoted relative to power available at altitude needs conversion before entry.</p>
    <h3>Source and limits</h3>
    <p>Lycoming’s operating guidance directs power-setting choices to the applicable engine manual and aircraft POH/AFM. It does not establish one cruise fraction for every engine or aircraft.</p>
    <a href="https://www.lycoming.com/content/leaning-lycoming-engines" target="_blank" rel="noreferrer">Lycoming — Leaning Lycoming Engines</a>
    <p className="mt-4">If the engine or operating condition is undecided, leave this input unresolved.</p>
  </>;
}

export function CgGuide({ aft = false }: { aft?: boolean }) {
  return <>
    <p>The {aft ? "aft" : "forward"} CG is the {aft ? "rearmost" : "frontmost"} centre-of-gravity position you intend to evaluate. Express its distance aft of the leading edge of the mean aerodynamic chord (MAC) as a fraction of that chord’s length.</p>
    <svg aria-label="Mean aerodynamic chord from leading edge at zero to trailing edge at one, with an illustrative CG at 0.30" className="my-5 w-full" role="img" viewBox="0 0 440 140">
      <path d="M20 70 Q100 10 420 70 Q110 100 20 70Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M20 70H420 M20 100V115 M420 100V115 M20 108H420" fill="none" stroke="currentColor" />
      <circle cx="140" cy="70" r="5" fill="#ef4329" /><path d="M140 25V64" stroke="#ef4329" />
      <text x="100" y="18" fontSize="12">Example CG: 0.30</text>
      <text x="20" y="132" fontSize="12">Leading edge: 0</text><text x="325" y="132" fontSize="12">Trailing edge: 1</text>
    </svg>
    <h3>Find a defensible position</h3>
    <ol>
      <li>Evaluate loading cases: occupants, payload, fuel and equipment positions. Identify the forward and aft CG positions across those cases.</li>
      <li>Use the same reference datum for CG station and leading-edge-of-MAC station. Subtract the latter from the former, then divide by MAC length.</li>
      <li>Check the proposed envelope against stability, trim and control capability. Loading cases alone do not establish allowable CG limits.</li>
    </ol>
    <h3>Worked conversion — illustration only</h3>
    <p>A CG 0.60 m aft of the MAC leading edge with a 2.00 m MAC is at 0.60 ÷ 2.00 = 0.30, or 30% MAC. Enter 0.30, not 30. This illustrates a position, not a safe CG limit.</p>
    <h3>For a new design</h3>
    <p>Use a similar aircraft only as context: its loading, tail layout and control authority may differ. Keep this input unresolved until you can justify the study position. The current cruise page accepts forward and aft study positions; it does not establish an approved envelope.</p>
    <h3>Source</h3>
    <p>FAA Weight &amp; Balance Handbook, FAA-H-8083-1B, explains expressing CG relative to MAC. The forward position must precede the aft position in this study.</p>
    <a href="https://www.faa.gov/sites/faa.gov/files/2023-09/Weight_Balance_Handbook.pdf" target="_blank" rel="noreferrer">FAA — Weight &amp; Balance Handbook</a>
  </>;
}
