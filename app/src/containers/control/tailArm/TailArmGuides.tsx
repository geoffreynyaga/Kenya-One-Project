/*
 * The reading behind the sheet, opened from the help buttons.
 *
 * Both books are drawn rather than quoted: the definitions here are all
 * geometric — which two points the arm runs between, and which length the
 * volume coefficient divides by — and a sentence describing a distance is
 * harder to check than a picture of it.
 */

/** Raymer's Fig. 6.2 redrawn: what the two arms and the two volumes measure. */
export function TailVolumeDiagram() {
  return (
    <svg
      aria-label="Plan and side view showing the horizontal and vertical tail arms measured from the wing quarter chord"
      className="my-4 w-full"
      role="img"
      viewBox="0 0 460 300"
    >
      {/* Plan view. */}
      <line stroke="currentColor" strokeDasharray="5 4" x1="20" x2="440" y1="80" y2="80" />
      <path
        d="M40 80 Q60 44 150 52 L360 66 Q400 72 400 80 Q400 88 360 94 L150 108 Q60 116 40 80Z"
        fill="none"
        stroke="currentColor"
      />
      {/* Wing. */}
      <path d="M150 80 L200 80 L230 150 L205 150Z" fill="none" stroke="currentColor" />
      <circle cx="185" cy="80" r="2.5" />
      {/* Tailplane. */}
      <path d="M330 80 L360 80 L375 122 L352 122Z" fill="none" stroke="currentColor" />
      <circle cx="348" cy="80" r="2.5" />

      <path d="M185 40 v34 M348 40 v34 M185 46 H348" stroke="currentColor" />
      <path d="M191 42 l-6 4 6 4 M342 42 l6 4 -6 4" fill="none" stroke="currentColor" />
      <text fontSize="12" textAnchor="middle" x="266" y="36">L_HT</text>

      {/* Side view. */}
      <line stroke="currentColor" strokeDasharray="5 4" x1="20" x2="440" y1="230" y2="230" />
      <path
        d="M40 230 Q56 200 130 202 L370 214 Q400 220 400 230 Q400 238 370 240 L130 244 Q56 246 40 230Z"
        fill="none"
        stroke="currentColor"
      />
      {/* Fin. */}
      <path d="M340 214 L372 176 L396 176 L396 216Z" fill="none" stroke="currentColor" />
      <circle cx="366" cy="196" r="2.5" />
      <circle cx="185" cy="230" r="2.5" />
      <path d="M185 260 v-24 M366 260 v-56 M185 254 H366" stroke="currentColor" />
      <path d="M191 250 l-6 4 6 4 M360 250 l6 4 -6 4" fill="none" stroke="currentColor" />
      <text fontSize="12" textAnchor="middle" x="276" y="276">L_VT</text>
      <text fontSize="11" textAnchor="middle" x="185" y="296">wing c/4</text>
      <text fontSize="11" textAnchor="middle" x="380" y="296">tail c/4</text>
    </svg>
  );
}

export function TailArmGuide() {
  return (
    <>
      <p>
        The tail arm is the distance from the quarter chord of the wing’s mean
        geometric chord to the quarter chord of the tail’s. The horizontal and
        vertical arms are measured separately, because the two surfaces rarely
        sit at the same station.
      </p>
      <TailVolumeDiagram />
      <h3>Why it cannot simply be made long</h3>
      <p>
        Tail effectiveness is the area times the arm, so the same tail volume
        can be had from a small tail far back or a large tail close in. Moving
        it back costs fuselage: the tail cone’s wetted area grows with the arm
        while the tail’s own falls. The total passes through a minimum, and
        Gudmundsson’s three methods solve for it.
      </p>
      <h3>What the volume coefficients mean</h3>
      <p>
        V_HT = L_HT·S_HT ⁄ (c_REF·S_REF) and V_VT = L_VT·S_VT ⁄ (b_REF·S_REF).
        The horizontal divides by the mean chord and the vertical by the span,
        because pitch is a longitudinal problem and yaw a lateral one. Starting
        values by class come from Gudmundsson’s Table 11-4, which reproduces
        Raymer’s Table 6.4.
      </p>
      <h3>Which method to take</h3>
      <ol>
        <li>
          Raymer’s fraction is the quickest sanity check and needs only the
          fuselage length. Use it to see whether an optimised arm is plausible.
        </li>
        <li>
          Method 1 or 2 when one surface clearly drives the design — a short
          coupled aeroplane with a large fin, say.
        </li>
        <li>
          Method 3 for a conventional tail, where both surfaces sit at nearly
          the same station.
        </li>
      </ol>
      <h3>Limits</h3>
      <p>
        All of it assumes the fuselage aft of the wing is a frustum and the
        tails are constant-chord surfaces, and none of it accounts for the
        wetted area removed at the junctures. It is a starting geometry, not a
        stability result: nothing here says the aeroplane will handle well.
      </p>
      <p>
        Raymer, <em>Aircraft Design: A Conceptual Approach</em>, ch. 6.
        Gudmundsson, <em>General Aviation Aircraft Design</em>, §11.4–11.5.
      </p>
    </>
  );
}

export function TailVolumeGuide() {
  return (
    <>
      <p>
        The tail volume coefficient is a non-dimensional measure of how much
        tail the aeroplane has. It fixes the product of area and arm, not
        either one on its own.
      </p>
      <TailVolumeDiagram />
      <h3>Choosing one</h3>
      <ol>
        <li>
          Start from the value for this class in Table 11-4 — it is a
          conservative average of aircraft that fly.
        </li>
        <li>
          Compare it against aircraft close to your design. Gudmundsson’s Table
          11-5 tabulates measured volumes and taper ratios for a long list.
        </li>
        <li>
          Adjust for configuration: Raymer reduces the coefficient by 10–15% for
          an all-moving tail, and about 5% for each surface of a T-tail.
        </li>
      </ol>
      <h3>What it is not</h3>
      <p>
        A tail volume does not establish stability. It reproduces the tails of
        aeroplanes that turned out acceptable. Gudmundsson’s Eq. (11-35) relates
        V_HT to the stick-fixed neutral point for a wing-and-tail system with no
        fuselage, and notes the fuselage moves that point 0.10–0.15 forward.
      </p>
    </>
  );
}
