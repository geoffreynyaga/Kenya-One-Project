"""Build the identity revision sheet. Run: python3 brand/build_sheet.py"""

import base64
import pathlib
import re

HERE = pathlib.Path("brand")


def svg(name, cls):
    """Inline an SVG, recoloured to inherit the page's ink token.

    The mark carries its own <style> block. Inlining it five times would put
    five copies in the document, so it is stripped here and the equivalent
    rules live once in the page stylesheet, scoped to `svg`.
    """
    raw = (HERE / name).read_text()
    raw = raw.replace("#1B2A6B", "currentColor")
    raw = re.sub(r"<style>.*?</style>", "", raw, flags=re.S)
    raw = re.sub(r"<svg ", f'<svg class="{cls}" ', raw, count=1)
    return raw


def img(name):
    data = base64.b64encode((HERE / name).read_bytes()).decode()
    return f"data:image/jpeg;base64,{data}"


def callouts(items):
    rows = "".join(
        f'<li><span class="key">{i}</span><span>{text}</span></li>'
        for i, text in enumerate(items, 1)
    )
    return f'<ol class="redlines">{rows}</ol>'


SWATCHES = [
    ("#16265E", "Ink", "Kept. Already the repo's navy, and it behaves like ink."),
    ("#C7361B", "Redline", "Corrections only. Never inside the mark."),
    ("#FCFDFE", "Ground", "Cool, not cream. Drawings are made on cool paper."),
    ("#EEF2F7", "Panel", "Figure tiles and the title block."),
    ("#CBD6E4", "Rule", "Hairlines, borders, dividers."),
    ("#F7DDDA", "Retired", "The old pink. Reads as stationery, not instruments."),
]


def swatches():
    cells = "".join(
        f'<figure class="sw"><div class="chip" style="background:{hexv}"></div>'
        f'<figcaption><b>{name}</b><code>{hexv}</code><span>{note}</span></figcaption></figure>'
        for hexv, name, note in SWATCHES
    )
    return f'<div class="swatches">{cells}</div>'


HTML = f"""<title>Ostrich Identity, Revision A</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Spectral:ital,wght@0,400;0,600;1,400&display=swap">
<style>
  :root {{
    --ground:#FCFDFE; --panel:#EEF2F7; --ink:#16265E; --muted:#4A5A82;
    --rule:#CBD6E4; --redline:#C7361B; --hair:#DEE6F0;
    --display:'Archivo',system-ui,sans-serif;
    --body:'Spectral',Georgia,serif;
    --mono:'IBM Plex Mono',ui-monospace,monospace;
  }}
  @media (prefers-color-scheme: dark) {{
    :root:not([data-theme="light"]) {{
      --ground:#0C1120; --panel:#151C30; --ink:#D9E2F5; --muted:#8695B8;
      --rule:#26304A; --redline:#FF7355; --hair:#1E2740;
    }}
  }}
  :root[data-theme="dark"] {{
    --ground:#0C1120; --panel:#151C30; --ink:#D9E2F5; --muted:#8695B8;
    --rule:#26304A; --redline:#FF7355; --hair:#1E2740;
  }}

  * {{ box-sizing:border-box; }}
  body {{
    background:var(--ground); color:var(--ink);
    font-family:var(--body); font-size:17px; line-height:1.62;
    -webkit-font-smoothing:antialiased;
  }}
  .sheet {{ max-width:1120px; margin:0 auto; padding:0 24px 80px; }}
  .measure {{ max-width:64ch; }}

  /* ---- title block ---- */
  .block {{
    display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr));
    border:1.5px solid var(--ink); margin:28px 0 0;
  }}
  .block div {{ padding:10px 14px; border-right:1px solid var(--rule); }}
  .block div:last-child {{ border-right:0; }}
  .block dt {{
    font-family:var(--mono); font-size:9.5px; letter-spacing:.16em;
    text-transform:uppercase; color:var(--muted); margin:0 0 3px;
  }}
  .block dd {{ margin:0; font-family:var(--display); font-weight:700; font-size:14px; }}

  h1 {{
    font-family:var(--display); font-weight:800; font-size:clamp(38px,7vw,72px);
    line-height:.98; letter-spacing:-.035em; margin:44px 0 0; text-wrap:balance;
  }}
  .deck {{ font-size:20px; color:var(--muted); margin:18px 0 0; max-width:56ch; text-wrap:balance; }}

  h2 {{
    font-family:var(--mono); font-weight:500; font-size:11px; letter-spacing:.22em;
    text-transform:uppercase; color:var(--muted);
    margin:76px 0 0; padding-bottom:8px; border-bottom:1.5px solid var(--ink);
    display:flex; justify-content:space-between; gap:16px;
  }}
  h3 {{
    font-family:var(--display); font-weight:700; font-size:25px;
    letter-spacing:-.018em; margin:34px 0 10px; text-wrap:balance;
  }}
  p {{ margin:14px 0; }}
  b, strong {{ font-weight:600; }}

  /* ---- figures ---- */
  .fig {{
    background:var(--panel); border:1px solid var(--hair);
    margin:26px 0 0; padding:22px;
  }}
  .fig img {{ display:block; width:100%; height:auto; }}
  .cap {{
    font-family:var(--mono); font-size:10.5px; letter-spacing:.14em;
    text-transform:uppercase; color:var(--muted); margin:0 0 14px;
  }}
  .pair {{ display:grid; gap:26px; grid-template-columns:1fr; align-items:start; }}
  @media (min-width:860px) {{ .pair {{ grid-template-columns:1.15fr .85fr; }} }}

  ol.redlines {{ list-style:none; margin:0; padding:0; counter-reset:none; }}
  ol.redlines li {{ display:flex; gap:12px; padding:11px 0; border-bottom:1px solid var(--hair); font-size:15.5px; line-height:1.5; }}
  ol.redlines li:last-child {{ border-bottom:0; }}
  .key {{
    flex:0 0 22px; height:22px; border-radius:50%;
    border:1.5px solid var(--redline); color:var(--redline);
    font-family:var(--mono); font-size:11px; font-weight:500;
    display:grid; place-items:center; margin-top:2px;
  }}

  /* ---- the mark ---- */
  .markwrap {{ display:grid; gap:32px; grid-template-columns:1fr; align-items:center; }}
  @media (min-width:860px) {{ .markwrap {{ grid-template-columns:auto 1fr; }} }}
  .mark {{ width:min(300px,62vw); height:auto; color:var(--ink); }}
  dl.notes {{ margin:0; }}
  dl.notes div {{ padding:13px 0; border-top:1px solid var(--hair); }}
  dl.notes dt {{ font-family:var(--display); font-weight:700; font-size:16px; letter-spacing:-.01em; }}
  dl.notes dd {{ margin:3px 0 0; font-size:15.5px; color:var(--muted); line-height:1.52; }}

  /* ---- swatches ---- */
  .swatches {{ display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(154px,1fr)); margin:26px 0 0; }}
  .sw {{ margin:0; }}
  .chip {{ height:74px; border:1px solid var(--rule); }}
  .sw figcaption {{ display:flex; flex-direction:column; gap:2px; padding-top:9px; font-size:13.5px; line-height:1.42; }}
  .sw b {{ font-family:var(--display); font-weight:700; font-size:14px; }}
  .sw code {{ font-family:var(--mono); font-size:11px; color:var(--muted); }}
  .sw span {{ color:var(--muted); }}

  /* ---- icon ladder ---- */
  .ladder {{ display:grid; gap:22px; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); margin:26px 0 0; }}
  .tier {{ background:var(--panel); border:1px solid var(--hair); padding:20px; display:flex; flex-direction:column; gap:14px; }}
  .tier .stage {{ display:flex; align-items:flex-end; gap:16px; min-height:76px; color:var(--ink); }}
  .tier h4 {{ font-family:var(--display); font-weight:700; font-size:16px; margin:0; }}
  .tier p {{ margin:0; font-size:14px; color:var(--muted); line-height:1.48; }}
  .px {{ font-family:var(--mono); font-size:9.5px; color:var(--muted); letter-spacing:.1em; }}
  .sizes {{ display:flex; align-items:flex-end; gap:18px; }}
  .sizes figure {{ margin:0; display:flex; flex-direction:column; align-items:center; gap:7px; }}

  .zoom {{ display:flex; gap:20px; align-items:center; flex-wrap:wrap; margin-top:20px; }}
  .zoom img {{ width:132px; height:132px; image-rendering:pixelated; border:1px solid var(--rule); background:#fff; }}

  /* ---- banner ---- */
  .banner {{
    background:var(--panel); border:1px solid var(--hair); margin-top:26px;
    display:flex; align-items:center; gap:clamp(20px,5vw,60px);
    padding:clamp(28px,6vw,58px); flex-wrap:wrap;
  }}
  .banner .mk {{ width:clamp(88px,17vw,140px); height:auto; color:var(--ink); flex:0 0 auto; }}
  .wordmark {{ font-family:var(--display); font-weight:800; font-size:clamp(34px,7vw,60px); letter-spacing:-.04em; line-height:.94; }}
  .sub {{ font-family:var(--mono); font-size:clamp(10px,1.6vw,12px); letter-spacing:.34em; text-transform:uppercase; color:var(--muted); margin-top:12px; }}

  footer {{ margin-top:80px; font-family:var(--mono); font-size:11px; color:var(--muted); letter-spacing:.1em; }}

  /* geometry shared by every inlined copy of the mark */
  svg .hv, svg .md, svg .lt, svg .pin {{
    fill:none; stroke:currentColor; stroke-linejoin:round; stroke-linecap:round;
  }}
  svg .hv {{ stroke-width:2.4; }}
  svg .md {{ stroke-width:1.7; }}
  svg .lt {{ stroke-width:.95; }}
  svg .pin {{ stroke-width:1.2; fill:var(--ground); }}

  .sizes figure:nth-child(1) .mk {{ width:16px; }}
  .sizes figure:nth-child(2) .mk {{ width:24px; }}
  .sizes figure:nth-child(3) .mk {{ width:32px; }}
  .sizes figure:nth-child(4) .mk {{ width:48px; }}
  .tier .stage .mk {{ width:72px; height:auto; }}
</style>

<main class="sheet">

  <dl class="block">
    <div><dt>Project</dt><dd>Kenya One</dd></div>
    <div><dt>Drawing</dt><dd>Visual identity</dd></div>
    <div><dt>Revision</dt><dd>A</dd></div>
    <div><dt>Status</dt><dd>For review</dd></div>
    <div><dt>Date</dt><dd>2026-08-30</dd></div>
  </dl>

  <h1>The ostrich is right.<br>Its packaging is not.</h1>
  <p class="deck">The mascot survives this revision with its concept intact. What gets rebuilt is
  everything that frames it, plus the parts of the bird that were decorative where they should
  have been structural.</p>

  <h2><span>Redlines</span><span>Fig. 1 &ndash; 2</span></h2>

  <h3>The generated identity sheet</h3>
  <div class="pair">
    <div class="fig">
      <p class="cap">Fig. 1 &middot; as supplied</p>
      <img src="{img('ref-sheet.jpg')}" alt="The supplied identity sheet: a navy faceted ostrich on pale pink with the Kenya One wordmark and favicon samples.">
    </div>
    <div>{callouts([
      "Pale pink ground. It reads as stationery. Nothing in aircraft conceptual design asks for it, and it is the single loudest reason the sheet feels wrong.",
      "The vertical fin is a foreign object. A solid wedge parked behind the tail, attached to no structure the bird has. It reads as a black triangle, not a fin.",
      "The dashed runway line is literal. It is there to explain a pose that should carry its own direction. Remove the crutch and fix the pose instead.",
      "The facets follow nothing. They are cut at angles that answer to neither anatomy nor structure, so the mesh reads as noise rather than as an airframe.",
      "The head-and-neck favicon does not survive 16&nbsp;px. The supplied sample at that size is already a smear, which is visible in the sheet's own specimen row.",
      "&ldquo;The new frontier of aircraft design&rdquo; is marketing register. The repo's own voice is plainer than that, and plainer is stronger here.",
    ])}</div>
  </div>

  <h3>The README banner</h3>
  <div class="pair">
    <div class="fig">
      <p class="cap">Fig. 2 &middot; docs/images/banner.png, 1280 &times; 640</p>
      <img src="{img('ref-banner.jpg')}" alt="The current README banner: a small faceted ostrich above the Kenya One wordmark on pale pink.">
    </div>
    <div>{callouts([
      "Same pink, same problem.",
      "The bird is tumbling rather than running. Both legs trail behind the body at similar angles, so the pose has no drive leg and no direction.",
      "The mark floats. It sits on no baseline and bears no optical relationship to the wordmark beneath it.",
      "The subject occupies about a fifth of a 1280 &times; 640 canvas. At README width the bird is smaller than the type that describes it.",
    ])}</div>
  </div>

  <h2><span>The mark</span><span>Rev. A</span></h2>
  <div class="markwrap">
    {svg('ostrich-mark.svg', 'mark')}
    <dl class="notes">
      <div><dt>The facets became structure</dt>
      <dd>Every internal line now runs from a wing vertex out to the body outline, the way
      formers radiate off a spar. The mesh is no longer decorative faceting; it is the
      airframe, and nothing is cut at a random angle.</dd></div>

      <div><dt>The wing is an aerofoil, not a shape</dt>
      <dd>It sits inside the mesh as one facet carrying three ribs, so the aeroplane is
      built into the bird rather than bolted onto it. This is what replaces the stuck-on fin.</dd></div>

      <div><dt>Every joint is a pin</dt>
      <dd>Knees and ankles are hinge circles filled with the ground colour, so the limb
      outline passes behind them. That is the entire mechanised idea, and it costs four circles.</dd></div>

      <div><dt>The neck is a truss boom</dt>
      <dd>Two chords and three braces, which reads as structure at poster size and collapses
      to a clean tapered neck at icon size.</dd></div>

      <div><dt>The pose is a take-off run</dt>
      <dd>One leg extended and driving back, one folded and swung forward. An ostrich cannot
      fly, which is the joke the mark should be making and the old pose was not.</dd></div>
    </dl>
  </div>

  <h2><span>Palette</span><span>Ink, ground, correction</span></h2>
  <p class="measure">Navy is the one thing worth keeping. It is already the repo's colour and it
  behaves like ink, which is what a drawing needs. The pink goes. Its replacement is a cool
  near-white, because drawings are made on cool paper and a warm cream would trade one
  decorative ground for another. The red earns its place by being rare: it marks corrections,
  as on this sheet, and never appears inside the mark itself.</p>
  {swatches()}

  <h2><span>Icons</span><span>Three tiers</span></h2>
  <p class="measure">One drawing cannot serve 512&nbsp;px and 16&nbsp;px. The supplied sheet tried
  to solve the small end by cropping to the head and neck, which is the most fragile part of the
  bird: at 16&nbsp;px a thin neck is a single grey pixel column and the beak disappears entirely.
  The fix is to keep the whole bird and shed detail instead of anatomy.</p>

  <div class="ladder">
    <div class="tier">
      <div class="stage">{svg('ostrich-mark.svg', 'mk')}</div>
      <h4>Full mark</h4>
      <p class="px">512 &middot; 256 &middot; 128 PX</p>
      <p>Mesh, ribs and hinge pins all present. Installer art, splash, about box, README.</p>
    </div>
    <div class="tier">
      <div class="stage">{svg('ostrich-solid.svg', 'mk')}</div>
      <h4>Silhouette</h4>
      <p class="px">64 &middot; 48 &middot; 32 PX</p>
      <p>Same geometry, interior lines dropped, outline lightly fattened so the neck holds.</p>
    </div>
    <div class="tier">
      <div class="stage">{svg('ostrich-glyph.svg', 'mk')}</div>
      <h4>Glyph</h4>
      <p class="px">16 PX</p>
      <p>Fattened harder still. Head, neck, body and legs all survive as distinct forms.</p>
    </div>
  </div>

  <div class="fig">
    <p class="cap">Specimen &middot; glyph rendered at true pixel size, then magnified</p>
    <div class="sizes">
      <figure>{svg('ostrich-glyph.svg', 'mk')}<figcaption class="px">16</figcaption></figure>
      <figure>{svg('ostrich-glyph.svg', 'mk')}<figcaption class="px">24</figcaption></figure>
      <figure>{svg('ostrich-solid.svg', 'mk')}<figcaption class="px">32</figcaption></figure>
      <figure>{svg('ostrich-solid.svg', 'mk')}<figcaption class="px">48</figcaption></figure>
    </div>
    <div class="zoom">
      <img src="{img('zoom-16.jpg')}" alt="The 16 pixel glyph magnified sixteen times, showing each pixel.">
      <p class="px" style="max-width:34ch">Rendered at 16&nbsp;px and magnified 16&times;.<br>Head, neck, body and both legs are still separable.</p>
    </div>
  </div>

  <h2><span>Lockup</span><span>Proposed banner</span></h2>
  <div class="banner">
    {svg('ostrich-mark.svg', 'mk')}
    <div>
      <div class="wordmark">Kenya One</div>
      <div class="sub">Aircraft Design</div>
    </div>
  </div>
  <p class="measure">Horizontal, so the banner stops wasting four fifths of its canvas. The
  wordmark is set in Archivo at 800 with the tracking pulled in, which gives it enough weight to
  stand beside a mark this detailed. The descriptor returns to the plain wording the original
  banner used, in mono, letterspaced, quiet.</p>

  <dl class="block" style="margin-top:56px">
    <div><dt>Files</dt><dd>brand/ostrich-*.svg</dd></div>
    <div><dt>Generator</dt><dd>brand/gen.py</dd></div>
    <div><dt>Next</dt><dd>tauri icon</dd></div>
    <div><dt>Stack position</dt><dd>PR 5</dd></div>
  </dl>
  <footer>KENYA ONE &middot; IDENTITY REVISION A &middot; SHEET 1 OF 1</footer>
</main>
"""


if __name__ == "__main__":
    pathlib.Path("brand/identity-sheet.html").write_text(HTML)
    print("wrote brand/identity-sheet.html")
