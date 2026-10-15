// ===== REACHWISE shared scaffold (THE REACH: chalk ground, ink type, signal-lime pulses, ping-pink dots, PING buttons) (inlined by mk.py; each Framer code file must be self-contained) =====
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"

const FONTS = "https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&family=Funnel+Sans:ital,wght@0,300..800;1,300..800&family=Geist+Mono:wght@300..600&display=swap"
// Token-safe alpha: Styles-bound colours arrive as var(--token-…) so hex-alpha breaks; color-mix keeps a palette flip working. Never 0% (hue drops) — floor at 0.4%.
const A = (c: string, a: number) => `color-mix(in srgb, ${c} ${Math.max(0.4, Math.round(a * 1000) / 10)}%, transparent)`
const MIX = (a: string, b: string, t: number) => `color-mix(in srgb, ${a} ${Math.round((1 - t) * 100)}%, ${b})`
const srcOf = (v: any, fallback: string) => (v && typeof v === "object" && v.src ? String(v.src).split("?")[0] : typeof v === "string" && v.trim() ? v.trim().split("?")[0] : fallback)
const T = (s: string | undefined, fb: string) => (s && s.trim() ? s.trim() : fb)
// ink or white text on a CMS brand colour (luminance test; the brand colour is data, not a palette token)
const onBrand = (hex: string) => { const m = String(hex || "").replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i); if (!m) return "var(--rw-cloud)"; const [r, g, b] = [m[1], m[2], m[3]].map((x) => { const v = parseInt(x, 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }); const L = 0.2126 * r + 0.7152 * g + 0.0722 * b; return L > 0.2 ? "var(--rw-ink)" : "var(--rw-cloud)" }
const cleanTel = (s: string) => s.replace(/[^\d+]/g, "")
// Premium layout band (measured 09-13): container 1340 @1440 / 1520 @1920, body 16, button label 12–13.
const MAXW = "clamp(1280px, 92vw, 1520px)"
// Responsive delivery: Framer's resizer serves any upload at ?scale-down-to=N (longest side). The query is stripped first so one file never downloads twice.
// Responsive delivery. Framer uploads: the resizer serves ?scale-down-to=N. Unsplash stand-ins: ?w=N. The src is already the smallest width that covers the slot (a 52px avatar never pulls a 1600px photo), so a big image is never decoded for a small box — decode is what stalls scrolling.
const RS_W = [160, 320, 480, 800, 1200, 1600]
const rsTarget = (sizes: string) => { const t = String(sizes || "").trim().split(",").pop() || ""; const px = t.match(/(\d+(?:\.\d+)?)px/); const vw = t.match(/(\d+(?:\.\d+)?)vw/); const want = px ? parseFloat(px[1]) * 2 : vw ? parseFloat(vw[1]) / 100 * 1600 * 1.25 : 1600; return RS_W.find((w) => w >= want) || 1600 }
const RS = (u: string, sizes: string) => { const s = String(u || ""); const b = s.split("?")[0]
  if (/framerusercontent\.com\/images\//.test(s)) { const w = rsTarget(sizes); const d = w <= 512 ? 512 : w <= 1024 ? 1024 : 2048; return { src: `${b}?scale-down-to=${d}`, srcSet: `${b}?scale-down-to=512 512w, ${b}?scale-down-to=1024 1024w, ${b}?scale-down-to=2048 2048w`, sizes } }
  if (/images\.unsplash\.com\//.test(s)) { const w = rsTarget(sizes); const q = (n: number) => `${b}?w=${n}&q=70&fm=jpg&auto=format`; return { src: q(w), srcSet: RS_W.filter((n) => n <= Math.max(w * 2, 480)).map((n) => `${q(n)} ${n}w`).join(", "), sizes } }
  return { src: s } }

// A Framer Font control stores a selector (GF;Family-700), not a CSS family — derive one, reject anything with ';'
const famOf = (f: any): string => { if (!f) return ""; if (typeof f === "string") return f.includes(";") ? "" : f; if (f.fontFamily && !String(f.fontFamily).includes(";")) return String(f.fontFamily); const sel = String(f.fontSelector || ""); if (!sel) return ""; const n = sel.split(";").pop() || ""; return n.replace(/-(regular|italic|bold|\d{3}(italic)?)$/i, "").replace(/-/g, " ") }
const wOf = (f: any, fb: number): number => { if (!f) return fb; if (f.fontWeight) return Number(f.fontWeight) || fb; const m = String(f.fontSelector || "").match(/-(\d{3})/); return m ? Number(m[1]) : fb }
// famCss: Framer's Font `fontFamily` is ALREADY a stack — never wrap it in quotes (one fake family → fallback renders). A bare name gets quoted.
const famCss = (f: any): string => { const fa = famOf(f).replace(/"/g, "'").trim(); if (!fa) return ""; return fa.includes(",") || fa.startsWith("'") ? fa : `'${fa}'` }
const stack = (custom: boolean, f: any, fb: string, tail: string) => { const fam = custom ? famCss(f) : ""; return `${fam ? `${fam}, ` : ""}${fb}, ${tail}` }

function useFonts() { useEffect(() => { if (typeof document === "undefined" || document.getElementById("rw-fonts")) return; const l = document.createElement("link"); l.id = "rw-fonts"; l.rel = "stylesheet"; l.href = FONTS; document.head.appendChild(l) }, []) }
// live = client after hydration and not on the canvas. SSR and the first client render share the same markup.
// TRUE on the Framer canvas AND in its export / thumbnail / screenshot renderers (anything that is not the running preview): no scroll and no hydration there, so every reveal / pinned stage must draw its FINAL state or the editor shows empty blocks.
function useStill() { const isStatic = useIsStaticRenderer(); let t: any = null; try { t = RenderTarget.current() } catch (e) {} return isStatic || (t !== null && t !== RenderTarget.preview) }
function useLive() { const isStatic = useIsStaticRenderer(); const [live, setLive] = useState(false); useEffect(() => { if (!isStatic && RenderTarget.current() !== RenderTarget.canvas && typeof window !== "undefined") setLive(true) }, [isStatic]); return live }
// Width/height of the root + viewport height. SSR starts from the breakpoint hint (Framer renders the Tablet/Phone copies with the same code and no width).
function useSize(root: React.RefObject<HTMLElement | null>, hint?: string) {
  const ov = String(hint || "").toLowerCase(); const [w, setW] = useState(ov === "phone" ? 390 : ov === "tablet" ? 810 : 1440), [vh, setVh] = useState(ov === "phone" ? 844 : ov === "tablet" ? 1080 : 900)
  useLayoutEffect(() => { const el = root.current; if (!el) return; const ro = new ResizeObserver(([e]) => { const x = Math.round((e.borderBoxSize && e.borderBoxSize[0] ? e.borderBoxSize[0].inlineSize : 0) || el.offsetWidth); if (x > 0) setW(x) }); ro.observe(el); const vv = () => setVh(window.innerHeight); vv(); const read = () => { const x = Math.round(el.offsetWidth); if (x > 0) setW(x) }; const t1 = window.setTimeout(read, 150), t2 = window.setTimeout(read, 700), t3 = window.setTimeout(read, 1600); window.addEventListener("resize", vv); window.addEventListener("load", read); return () => { ro.disconnect(); window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); window.removeEventListener("resize", vv); window.removeEventListener("load", read) } }, [])
  return { w, vh }
}
const useReduced = () => { const [rm, setRm] = useState(false); useLayoutEffect(() => { setRm(window.matchMedia("(prefers-reduced-motion: reduce)").matches) }, []); return rm }
type Sub = (t: number) => void
// One shared rAF for every section. Each frame runs ALL reads first (layout reads: getBoundingClientRect, offsetHeight), then ALL writes (CSS vars, transforms).
// Interleaving read → write → read made the browser recalc the whole page's style once per section per frame (layout thrashing: 20+ recalcs a frame).
function onTick(fn: Sub, read?: Sub, pre?: Sub): () => void {
  if (typeof window === "undefined") return () => {}
  const w = window as any
  if (!w.__nuTick) { w.__nuTick = { pre: new Set<Sub>(), subs: new Set<Sub>(), reads: new Set<Sub>(), raf: 0 }; const loop = (t: number) => { const T = w.__nuTick; T.pre.forEach((r: Sub) => r(t)); T.reads.forEach((r: Sub) => r(t)); T.subs.forEach((s: Sub) => s(t)); T.raf = requestAnimationFrame(loop) }; w.__nuTick.raf = requestAnimationFrame(loop) }
  w.__nuTick.subs.add(fn); if (read) w.__nuTick.reads.add(read); if (pre) w.__nuTick.pre.add(pre); return () => { w.__nuTick.subs.delete(fn); if (read) w.__nuTick.reads.delete(read); if (pre) w.__nuTick.pre.delete(pre) }
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeIO = (t: number) => { const x = clamp01(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }

// ---- Palette (8 Styles tokens bound on every instance) ----
type Pal = { bone: string; ink: string; brass: string; pine: string; fog: string; stone: string; cloud: string; night: string }
const DEF: Pal = { bone: "#EEEEE8", ink: "#0D0E10", brass: "#D4FF3A", pine: "#16181B", fog: "#DCDCD3", stone: "#75766F", cloud: "#FFFFFF", night: "#08090A" }
const PINK = "#FF3E88" // notification dots only (a constant, not a token)
const colorsOf = (p: any): Pal => ({ bone: p.bone || DEF.bone, ink: p.ink || DEF.ink, brass: p.brass || DEF.brass, pine: p.pine || DEF.pine, fog: p.fog || DEF.fog, stone: p.stone || DEF.stone, cloud: p.cloud || DEF.cloud, night: p.night || DEF.night })
// a Style-bound colour arrives as var(--token-…, #hex): let the browser resolve it to r,g,b for canvas drawing
const cssRgb = (el: Element | null, col: string, fb: string) => { if (!el || typeof window === "undefined") return fb; const p = document.createElement("i"); p.style.display = "none"; p.style.color = col; el.appendChild(p); const v = getComputedStyle(p).color; p.remove(); const m = v.match(/(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/); return m ? `${Math.round(+m[1])},${Math.round(+m[2])},${Math.round(+m[3])}` : fb }
const cssVars = (c: Pal): any => ({ "--rw-bone": c.bone, "--rw-ink": c.ink, "--rw-brass": c.brass, "--rw-pine": c.pine, "--rw-fog": c.fog, "--rw-stone": c.stone, "--rw-cloud": c.cloud, "--rw-night": c.night })
const COLOR_CONTROLS = {
  bone: { type: ControlType.Color, title: "Paper", defaultValue: DEF.bone },
  ink: { type: ControlType.Color, title: "Ink", defaultValue: DEF.ink },
  brass: { type: ControlType.Color, title: "Accent", defaultValue: DEF.brass },
  pine: { type: ControlType.Color, title: "Deep", defaultValue: DEF.pine },
  fog: { type: ControlType.Color, title: "Line", defaultValue: DEF.fog },
  stone: { type: ControlType.Color, title: "Muted", defaultValue: DEF.stone },
  cloud: { type: ControlType.Color, title: "White", defaultValue: DEF.cloud },
  night: { type: ControlType.Color, title: "Dark", defaultValue: DEF.night },
} as const
// ---- Fonts: Custom Fonts toggle → Font controls; off = Funnel Display / Funnel Sans / Geist Mono ----
const FONT_CONTROLS = {
  customFonts: { type: ControlType.Boolean, title: "Custom Fonts", description: "Off = the site fonts (set once on the Header in the Site Layout). On = different fonts for this section only", defaultValue: false },
  displayFont: { type: ControlType.Font, title: "Display Font", defaultFontType: "sans-serif", hidden: (p: any) => !p.customFonts },
  bodyFont: { type: ControlType.Font, title: "Body Font", defaultFontType: "sans-serif", hidden: (p: any) => !p.customFonts },
  monoFont: { type: ControlType.Font, title: "Mono Font", defaultFontType: "monospace", hidden: (p: any) => !p.customFonts },
} as const
type Fonts = { D: CSSProperties; B: CSSProperties; M: CSSProperties }
const NUMF = "var(--rw-font-m, 'Geist Mono'), ui-monospace, monospace"
// Site-wide fonts: the Header (Site Layout, every page) writes --rw-font-d/b/m (+ weights) on :root when its Custom Fonts is on. A section uses them unless its own Custom Fonts is on.
const siteFontCss = (p: any): string => { if (!p || !p.customFonts) return ""; const v: string[] = []; const put = (k: string, f: any, w: number) => { const fam = famCss(f); if (fam) { v.push(`--rw-font-${k}:${fam}`); v.push(`--rw-font-${k}w:${wOf(f, w)}`) } }; put("d", p.displayFont, 600); put("b", p.bodyFont, 400); put("m", p.monoFont, 400); put("a", p.accentFont, 400); return v.length ? `:root{${v.join(";")}}` : "" }
function fontsOf(p: any): Fonts {
  const on = !!p.customFonts
  const D: CSSProperties = { fontFamily: stack(on, p.displayFont, "var(--rw-font-d, 'Funnel Display')", "Inter, -apple-system, Arial, sans-serif"), fontWeight: on ? wOf(p.displayFont, 600) : ("var(--rw-font-dw, 600)" as any), fontStyle: on && p.displayFont && p.displayFont.fontStyle ? p.displayFont.fontStyle : "normal" }
  const B: CSSProperties = { fontFamily: stack(on, p.bodyFont, "var(--rw-font-b, 'Funnel Sans')", "Inter, system-ui, -apple-system, Arial, sans-serif"), fontWeight: on ? wOf(p.bodyFont, 400) : ("var(--rw-font-bw, 400)" as any) }
  const M: CSSProperties = { fontFamily: stack(on, p.monoFont, "var(--rw-font-m, 'Geist Mono')", "ui-monospace, SFMono-Regular, Menlo, monospace"), fontWeight: on ? wOf(p.monoFont, 400) : ("var(--rw-font-mw, 400)" as any) }
  return { D, B, M }
}
const BP_CONTROL: any = { bpHint: { type: ControlType.Enum, title: "Breakpoint Hint", description: "Set per breakpoint copy so the server render starts at the right width", options: ["auto", "desktop", "tablet", "phone"], optionTitles: ["Auto", "Desktop", "Tablet", "Phone"], defaultValue: "auto", hidden: () => true } }

// ---- Button system: THE PING — a pill. On hover a pink notification dot pops on its right edge with a rolling "+1", a lime ring pings out of the dot, the accent fill sweeps in from the left and the label rolls up. Magnetic on desktop, squish on press. Solid = ink (fill lime), ghost = glass/hairline (fill paper), quiet = small nav pill. ----
const Glyph = ({ k }: { k?: string }) => k === "mail" ? (<svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 6 8-6" /></svg>)
  : k === "cal" ? (<svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>)
  : k === "play" ? (<svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M8 5.5v13l10.5-6.5z" /></svg>)
  : (<svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>)
// In-page CTA jumps ("#download", "/#download"): scroll to the section when it is on this page, otherwise go to it on the home page.
function jumpTo(e: any, href: string) { try { const m = String(href || "").match(/^\/?#([\w-]+)$/); if (!m) return; const el = document.getElementById(m[1]); if (el) { e.preventDefault(); const W = window as any; const L = W.__ltLenis || W.__vcLenis || W.lenis; if (L && L.scrollTo) L.scrollTo(el, { offset: -20 }); else el.scrollIntoView({ behavior: "smooth", block: "start" }); try { history.replaceState(null, "", "#" + m[1]) } catch (x) {} } else if (href.startsWith("#")) { e.preventDefault(); window.location.href = "/" + href } } catch (x) {} }
const Btn = ({ href, label, kind = "solid", arrow = true, style, className, onClick, ariaLabel, cur, icon, sub }: { href: string; label: string; kind?: "solid" | "ghost" | "quiet"; arrow?: boolean; style?: CSSProperties; className?: string; onClick?: any; ariaLabel?: string; cur?: string; icon?: string; sub?: string }) => (
  <a className={`rw-btn rw-${kind}${arrow ? "" : " rw-noarr"}${className ? " " + className : ""}`} data-mag data-cur={cur || "go"} href={href} target={/^https?:\/\//.test(href || "") ? "_blank" : undefined} rel={/^https?:\/\//.test(href || "") ? "noopener" : undefined} onClick={onClick || ((e: any) => jumpTo(e, href))} aria-label={ariaLabel || (sub ? `${sub} ${label}` : undefined)} style={style}><span className="rw-face"><span className="rw-fill" aria-hidden /><span className="rw-lbl"><span className="rw-roll"><span className="rw-l1">{label}</span><span className="rw-l2" aria-hidden>{label}</span></span></span>{arrow && <span className="rw-arr" aria-hidden><span className="rw-a1"><Glyph k={icon} /></span><span className="rw-a2"><Glyph k={icon} /></span></span>}</span><span className="rw-ping" aria-hidden><i className="rw-ping-r" /><b><span>1</span><span>+1</span></b></span></a>)
function useNearFocus(root: React.RefObject<HTMLElement | null>, live: boolean) { useEffect(() => { if (!live || !root.current) return; const el = root.current; const f = (e: FocusEvent) => { const t = e.target as HTMLElement; const sc = t.closest?.('.rw-inring') as HTMLElement | null; if (!sc) return; try { t.scrollIntoView({ block: 'nearest', inline: 'nearest' }) } catch (x) {} }; el.addEventListener('focusin', f); return () => el.removeEventListener('focusin', f) }, [live]) }
function useMagnet(root: React.RefObject<HTMLElement | null>, live: boolean) {
  useEffect(() => {
    if (!live || !root.current || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return
    const r = root.current; const btns = () => Array.from(r.querySelectorAll<HTMLElement>("[data-mag]"))
    const mv = (e: PointerEvent) => { for (const b of btns()) { const rc = b.getBoundingClientRect(); const dx = e.clientX - (rc.left + rc.width / 2), dy = e.clientY - (rc.top + rc.height / 2); const d = Math.hypot(dx, dy); const pull = d < 150 ? (1 - d / 150) * 8 : 0; b.style.setProperty("--mx", `${(dx / (d || 1)) * pull}px`); b.style.setProperty("--my", `${(dy / (d || 1)) * pull}px`) } }
    const lv = () => { for (const b of btns()) { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px") } }
    r.addEventListener("pointermove", mv as any); r.addEventListener("pointerleave", lv)
    return () => { r.removeEventListener("pointermove", mv as any); r.removeEventListener("pointerleave", lv) }
  }, [live])
}
const CSS_BASE = `
:where(.rw){position:relative;z-index:10} .rw,.rw *{box-sizing:border-box;min-width:0} .rw-sr{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important;padding:0!important;margin:-1px!important;border:0!important} :where(.rw) a{color:inherit} html,body{overflow-x:clip}
:where(a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"]),[role="button"]):focus-visible{outline:3px solid var(--rw-ink,#0D0E10)!important;outline-offset:2px!important;box-shadow:0 0 0 2px var(--rw-bone,#EEEEE8)!important} :where(.rw-dark) :where(a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])):focus-visible{outline-color:var(--rw-cloud,#FFFFFF)!important;box-shadow:0 0 0 2px var(--rw-night,#08090A)!important} :where(.rw-inring) :where(a[href],button):focus-visible{outline-offset:-4px!important;box-shadow:none!important} :where(.rw) :is(input:not([type=range]):not([type=checkbox]):not([type=radio]),textarea,select):focus-visible{outline:2px solid currentColor!important;outline-offset:2px!important;box-shadow:none!important} :where(.rw) textarea{resize:none} .rw-inring:focus-visible{outline-offset:-3px!important;box-shadow:none!important} html{scroll-padding-top:96px;scroll-padding-bottom:88px}
.rw-btn{position:relative;display:inline-flex;padding:0;min-height:56px;border-radius:999px;text-decoration:none;cursor:pointer;isolation:isolate;white-space:nowrap;font-size:14px;font-weight:600;letter-spacing:-.005em;border:0;color:var(--fg);transition:color .35s,transform .45s cubic-bezier(.34,1.56,.64,1)}
.rw-face{position:relative;z-index:1;display:inline-flex;align-items:center;gap:14px;width:100%;min-height:inherit;padding:0 10px 0 26px;border-radius:inherit;background:var(--face);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);box-shadow:inset 0 0 0 1px var(--rim);overflow:hidden;isolation:isolate}
.rw-fill{position:absolute;z-index:0;inset:0;background:var(--fill);border-radius:inherit;clip-path:circle(0% at 100% 50%);transition:clip-path .7s cubic-bezier(.7,0,.2,1)} .rw-btn:hover .rw-fill,.rw-btn:focus-visible .rw-fill{clip-path:circle(150% at 100% 50%)}
.rw-lbl{position:relative;z-index:1;display:inline-flex;flex-direction:column;justify-content:center;line-height:1.15}
.rw-roll{display:block;height:1.2em;overflow:hidden;line-height:1.2} .rw-l1,.rw-l2{display:block;transition:translate .5s cubic-bezier(.7,0,.2,1)} .rw-btn:hover .rw-l1,.rw-btn:hover .rw-l2,.rw-btn:focus-visible .rw-l1,.rw-btn:focus-visible .rw-l2{translate:0 -100%}
.rw-arr{position:relative;z-index:1;display:grid;place-items:center;width:38px;height:38px;flex:none;border-radius:50%;background:var(--chip);color:var(--chipfg);overflow:hidden;transition:background .4s,color .4s} .rw-arr>span{grid-area:1/1;display:grid;place-items:center;transition:transform .55s cubic-bezier(.7,0,.2,1)} .rw-arr svg{width:15px;height:15px} .rw-a2{transform:translate(-160%,160%)}
.rw-btn:hover .rw-a1,.rw-btn:focus-visible .rw-a1{transform:translate(160%,-160%)} .rw-btn:hover .rw-a2,.rw-btn:focus-visible .rw-a2{transform:none} .rw-btn:hover .rw-arr,.rw-btn:focus-visible .rw-arr{background:var(--chip2);color:var(--chipfg2)}
.rw-ping{position:absolute;z-index:3;right:-3px;top:-5px;width:22px;height:22px;pointer-events:none} .rw-ping b{position:absolute;inset:0;display:block;border-radius:999px;background:#FF3E88;color:#0D0E10;font:600 10px/22px var(--rw-font-m,'Geist Mono'),ui-monospace,monospace;text-align:center;overflow:hidden;scale:0;transition:scale .45s cubic-bezier(.34,1.56,.64,1),width .4s;box-shadow:0 0 0 2.5px var(--ring,var(--rw-bone))} .rw-ping b span{display:block;height:22px;transition:translate .45s cubic-bezier(.7,0,.2,1) .2s}
.rw-ping-r{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);opacity:0}
.rw-btn:hover .rw-ping b,.rw-btn:focus-visible .rw-ping b{scale:1;transition-delay:.12s} .rw-btn:hover .rw-ping b span,.rw-btn:focus-visible .rw-ping b span{translate:0 -100%} .rw-btn:hover .rw-ping-r,.rw-btn:focus-visible .rw-ping-r{animation:rw-pingr 1.2s cubic-bezier(.2,.6,.3,1) .25s 2}
@keyframes rw-pingr{0%{opacity:.95;transform:scale(1)}100%{opacity:0;transform:scale(3.2)}}
.rw-btn:hover,.rw-btn:focus-visible{color:var(--fg2)}
.rw-btn.rw-noarr .rw-face{padding-right:26px}
.rw-btn.rw-solid{--face:var(--rw-ink);--rim:transparent;--fill:var(--rw-brass);--fg:var(--rw-bone);--fg2:var(--rw-ink);--chip:var(--rw-brass);--chipfg:var(--rw-ink);--chip2:var(--rw-ink);--chipfg2:var(--rw-brass)}
.rw-btn.rw-ghost{--face:color-mix(in srgb,var(--rw-cloud) 14%,transparent);--rim:color-mix(in srgb,var(--rw-cloud) 38%,transparent);--fill:var(--rw-cloud);--fg:var(--rw-cloud);--fg2:var(--rw-ink);--chip:color-mix(in srgb,var(--rw-cloud) 18%,transparent);--chipfg:var(--rw-cloud);--chip2:var(--rw-ink);--chipfg2:var(--rw-cloud)}
.rw-btn.rw-quiet{min-height:44px;font-size:13px;--face:var(--rw-brass);--rim:transparent;--fill:var(--rw-ink);--fg:var(--rw-ink);--fg2:var(--rw-bone);--chip:var(--rw-ink);--chipfg:var(--rw-brass);--chip2:var(--rw-brass);--chipfg2:var(--rw-ink)} .rw-btn.rw-quiet .rw-arr{width:30px;height:30px} .rw-btn.rw-quiet .rw-face{padding-left:18px;gap:10px;padding-right:7px}
/* on dark grounds (not the hero, which keeps its ink pill): solid = lime face */
.rw-dark:not(.rwh) .rw-btn.rw-solid{--face:var(--rw-brass);--fill:var(--rw-cloud);--fg:var(--rw-ink);--fg2:var(--rw-ink);--chip:var(--rw-ink);--chipfg:var(--rw-brass);--chip2:var(--rw-ink);--chipfg2:var(--rw-cloud)}
/* on chalk grounds: ghost = ink hairline */
.rw:not(.rw-dark) .rw-btn.rw-ghost,.rw-lt .rw-btn.rw-ghost{--face:transparent;--rim:color-mix(in srgb,var(--rw-ink) 30%,transparent);--fill:var(--rw-ink);--fg:var(--rw-ink);--fg2:var(--rw-bone);--chip:color-mix(in srgb,var(--rw-ink) 8%,transparent);--chipfg:var(--rw-ink);--chip2:var(--rw-brass);--chipfg2:var(--rw-ink)}
.rw .rw-dark .rw-btn.rw-ghost,.rw:not(.rw-dark) .rw-dark .rw-btn.rw-ghost{--face:color-mix(in srgb,var(--rw-cloud) 14%,transparent);--rim:color-mix(in srgb,var(--rw-cloud) 38%,transparent);--fill:var(--rw-cloud);--fg:var(--rw-cloud);--fg2:var(--rw-ink);--chip:color-mix(in srgb,var(--rw-cloud) 18%,transparent);--chipfg:var(--rw-cloud);--chip2:var(--rw-ink);--chipfg2:var(--rw-cloud)}
@media (max-width:600px),(hover:none){.rw .rw-btn{white-space:normal;text-align:left;line-height:1.25;min-height:56px;max-width:100%} .rw .rw-roll{height:auto} .rw .rw-l2{display:none} .rw .rw-ping{display:none}}
.rw-btn:hover{transform:translate(var(--mx,0px),var(--my,0px))} .rw-btn:active{transform:translate(var(--mx,0px),var(--my,0px)) scale(.97)!important;transition-duration:.12s}
/* TEXT-SAFE accents: lime is a SURFACE colour on chalk (pulses, fills, chips) — accent text on chalk is ink; on night grounds the lime itself reads */
.rw{--rw-acc:var(--rw-ink);--rw-acc-lg:var(--rw-brass);--rw-hl:var(--rw-brass);--rw-mut:color-mix(in srgb,var(--rw-stone) 60%,var(--rw-ink));--rw-acc-d:var(--rw-brass)}
.rw-lt,.rw .rw-lt{--rw-acc:var(--rw-ink);--rw-acc-lg:var(--rw-brass);--rw-hl:var(--rw-brass);--rw-mut:color-mix(in srgb,var(--rw-stone) 60%,var(--rw-ink))}
.rw-dark,.rw.rw-dark{--rw-acc:var(--rw-brass);--rw-acc-lg:var(--rw-brass);--rw-hl:transparent;--rw-mut:color-mix(in srgb,var(--rw-stone) 45%,var(--rw-cloud))}
.rw-port{width:7px;height:7px;flex:none;border-radius:50%;background:#FF3E88;animation:rw-blink 1.4s ease-in-out infinite} @keyframes rw-blink{50%{opacity:.25}}
@media (prefers-reduced-motion:reduce){.rw *,.sth *{animation-duration:.01ms!important;transition-duration:.01ms!important}}`

const IcoArrow = ({ s = 15 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 5l7 7-7 7" /></svg>)
const Stars = ({ v = 5, s = 13 }: { v?: number; s?: number }) => (<span className="rw-stars" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <svg key={i} width={s} height={s} viewBox="0 0 24 24" style={{ opacity: i < Math.round(v) ? 1 : 0.28 }}><path fill="currentColor" d="M12 2.6l2.9 6.1 6.7.9-4.9 4.6 1.2 6.6L12 17.6 6.1 20.8l1.2-6.6L2.4 9.6l6.7-.9z" /></svg>)}</span>)

// ===== REACHWISE motion layer (THE FLOW) (composed by mk.py after _common) =====
// One shared rAF (onTick). Sections write --sp (0 = top edge enters the viewport bottom → 1 = bottom edge leaves the top) and,
// for tall pinned wrappers, --pp (0 = wrapper top hits the viewport top → 1 = wrapper bottom hits the viewport bottom). IO-gated.
const SCRUB_K = 0.18
// Decode a section's photos while it is still a screen and a half away, so the first frame it is on screen never waits for a decode.
function usePre(el: HTMLElement) { try { const io = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; io.disconnect(); el.querySelectorAll("img").forEach((im) => { try { (im as HTMLImageElement).loading = "eager"; (im as HTMLImageElement).decode().catch(() => {}) } catch (e) {} }) }, { rootMargin: "150% 0px 150% 0px" }); io.observe(el) } catch (e) {} }
function focusTo(el: HTMLElement | null, frac: number) { if (!el || typeof window === "undefined") return; if (window.innerWidth < 810) return; const r = el.getBoundingClientRect(); const vh = window.innerHeight; if (r.height <= vh * 1.05) return; const y = r.top + window.scrollY + (r.height - vh) * Math.min(1, Math.max(0, frac)); if (Math.abs(window.scrollY - y) < 8) return; const w = window as any; if (w.__ltLenis) w.__ltLenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y) }
function useScrollVars(ref: React.RefObject<HTMLElement | null>, live: boolean, rm: boolean, cb?: (sp: number, pp: number) => void) {
  useEffect(() => { if (!live || rm || !ref.current) return; const el = ref.current; let vis = true, last = -9, cs = -1, cp = -1, settled = false
    usePre(el)
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting }, { rootMargin: "25% 0px 25% 0px" }); io.observe(el)
    // eased scrub: the values glide toward the true scroll position (K per frame), so wheel steps never jump a pinned scene
    let rt = 0, rh = 0, vh = 1, fresh = false
    const read = () => { if (!vis && settled) { fresh = false; return } const r = el.getBoundingClientRect(); rt = r.top; rh = r.height; vh = window.innerHeight || 1; fresh = true }
    const off = onTick(() => { if (!fresh) return; const sp = clamp01((vh - rt) / (vh + rh)); const pp = rh > vh * 1.05 ? clamp01(-rt / (rh - vh)) : sp
      if (cs < 0) { cs = sp; cp = pp } else { cs += (sp - cs) * SCRUB_K; cp += (pp - cp) * SCRUB_K; if (Math.abs(sp - cs) < 0.0005) cs = sp; if (Math.abs(pp - cp) < 0.0005) cp = pp }
      settled = cs === sp && cp === pp
      if (Math.abs(cs + cp - last) < 0.0003) return; last = cs + cp; el.style.setProperty("--sp", cs.toFixed(4)); el.style.setProperty("--pp", cp.toFixed(4)); if (cb) cb(cs, cp) }, read)
    return () => { off(); io.disconnect() } }, [live, rm])
}
// STAGE — false while the loader or the page-transition cover is on screen (html.rw-hold-*), so first-screen intros play AFTER the cover lifts, never under it. 9 s safety.
function useStage(live: boolean) {
  const [r, setR] = useState(false)
  useEffect(() => { if (!live) return; const h = document.documentElement; const ok = () => !/(^|\s)rw-hold/.test(h.className); if (ok()) { setR(true); return }
    const mo = new MutationObserver(() => { if (ok()) { mo.disconnect(); setR(true) } }); mo.observe(h, { attributes: true, attributeFilter: ["class"] }); const t = window.setTimeout(() => { mo.disconnect(); setR(true) }, 9000)
    return () => { mo.disconnect(); window.clearTimeout(t) } }, [live])
  return r
}
// true once the element has entered the viewport (stays true) — and only once the stage is clear. Reduced motion = true at once.
function useOn(ref: React.RefObject<HTMLElement | null>, live: boolean, rm: boolean, amount = 0.16) {
  const [on, setOn] = useState(false); const still = useStill(); const ready = useStage(live)
  useEffect(() => { if (!live) return; if (rm) { setOn(true); return } if (!ready) return; const el = ref.current; if (!el) return; let off = () => {}
    // keyboard focus: mark the section FIRST and flush styles, so the reveal that follows runs with instant transitions (a transition keeps the timing it started with)
    const fin = (e: Event) => { try { if ((e.target as Element).matches(":focus-visible")) { el.setAttribute("data-kb", ""); void el.offsetWidth } } catch (x) {} setOn(true) }; const fout = (e: any) => { if (!el.contains(e.relatedTarget as Node)) el.removeAttribute("data-kb") }; el.addEventListener("focusin", fin); el.addEventListener("focusout", fout)
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { io.disconnect()
      // IO ignores occlusion: under a curtain (Reveal) wait until about a quarter of it is uncovered
      off = onTick(() => { const rev = el.closest(".rw-rev.is-act") as HTMLElement | null; const rv = rev ? parseFloat(rev.style.getPropertyValue("--rv") || "0") : 1; if (rv > 0.24) { setOn(true); off() } }) } }, { threshold: Math.min(amount, Math.max(0.005, (window.innerHeight * 0.3) / Math.max(1, el.offsetHeight))), rootMargin: "0px 0px -6% 0px" }); io.observe(el); return () => { io.disconnect(); off(); el.removeEventListener("focusin", fin); el.removeEventListener("focusout", fout) } },[live, rm, ready])
  return on || still
}
// CURTAIN REVEAL — the section is pinned BEHIND the one above it and is uncovered as that one lifts away (the footer movement, for any section).
// Wrapper = section + a spacer of T, pulled up by T (page length unchanged); the section is sticky for exactly T of scroll. T = min(section height, 100svh):
// a tall section pins at the top, a short one sits on the bottom edge of the viewport. The section ABOVE needs a higher Layer (z-index).
function Reveal({ on, layer = 9, style, children }: { on: boolean; layer?: number; style?: CSSProperties; children: any }) {
  const live = useLive(); const rm = useReduced(); const wrap = useRef<HTMLDivElement>(null); const inner = useRef<HTMLDivElement>(null); const sp = useRef<HTMLDivElement>(null); const [h, setH] = useState(0)
  const act = on && live && !rm && h > 0
  useEffect(() => { if (!on || !live || rm || !inner.current) return; const el = inner.current; const m = () => setH(el.offsetHeight); m(); const ro = new ResizeObserver(m); ro.observe(el); return () => ro.disconnect() }, [on, live, rm])
  useEffect(() => { if (!act || !wrap.current) return; const el = wrap.current; let vis = true, last = -1
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting }, { rootMargin: "30% 0px 30% 0px" }); io.observe(el)
    let cur = -1, T = 0, vh = 1, top = 0, fresh = false
    const read = () => { if (!vis) { fresh = false; return } T = sp.current ? sp.current.offsetHeight : 0; vh = window.innerHeight; top = el.getBoundingClientRect().top; fresh = true }
    const off = onTick(() => { if (!fresh || !T) return; const rv = clamp01((vh - T - top) / T); if (cur < 0) cur = rv; else { cur += (rv - cur) * SCRUB_K; if (Math.abs(rv - cur) < 0.0005) cur = rv } if (Math.abs(cur - last) < 0.0004) return; last = cur; el.style.setProperty("--rv", cur.toFixed(4)) }, read)
    return () => { off(); io.disconnect() } }, [act])
  return (
    <div ref={wrap} className={`rw-rev${act ? " is-act" : ""}`} style={{ ...(style || {}), ["--h" as any]: `${h}px`, ["--layer" as any]: layer }} onFocusCapture={(e) => { if (!act || !wrap.current) return; const t = e.target as HTMLElement; const w = window as any; const r = wrap.current.getBoundingClientRect(); const T = sp.current ? sp.current.offsetHeight : 0; const y = Math.max(0, Math.min(document.documentElement.scrollHeight - window.innerHeight, r.top + window.scrollY - window.innerHeight + 2 * T)); if (Math.abs(window.scrollY - y) > 4) { if (w.__ltLenis) w.__ltLenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y) } requestAnimationFrame(() => { try { t.scrollIntoView({ block: 'nearest' }) } catch (x) {} }) }}>
      <div ref={inner} className="rw-rev-in">{children}</div><div ref={sp} className="rw-rev-sp" aria-hidden />
    </div>
  )
}
const REVEAL_CONTROLS: any = {
  reveal: { type: ControlType.Boolean, title: "Reveal", description: "Curtain: this section waits behind the one above and is uncovered as that one lifts away", enabledTitle: "Curtain", disabledTitle: "Off", defaultValue: true },
  layer: { type: ControlType.Number, title: "Layer", description: "Stacking order. Must be LOWER than the section above (sections default to 10)", min: 0, max: 20, step: 1, displayStepper: true, defaultValue: 9, hidden: (p: any) => p.reveal === false },
}
const splitWords = (s: string) => String(s || "").replace(/\*([^*]+)\*/g, (_m: string, g: string) => g.trim().split(/\s+/).map((w: string) => { const m = w.match(/^(.*?)([.,!?;:’']*)$/); return m && m[1] ? `*${m[1]}*${m[2]}` : w }).join(" ")).split(/\s+/).filter(Boolean).map((t) => { const m = t.match(/^\*(.+?)\*([.,!?;:’']*)$/); return m ? { t: m[1], tail: m[2], acc: true } : { t: t.replace(/\*/g, ""), tail: "", acc: false } })
const plainOf = (s: string) => String(s || "").replace(/\*/g, "").replace(/\s*\|\s*/g, " ").replace(/\s+/g, " ").trim()
// Heading whose words rise out of masks. "|" forces a line break, *word* = the accent: light-weight coral (deep coral mix on paper).
const Head = ({ text, on, D, tag = "h2", size = "clamp(40px,4.8vw,72px)", lh = .92, delay = 0, step = 55, style, className }: { text: string; on: boolean; D: CSSProperties; tag?: any; size?: string; lh?: number; delay?: number; step?: number; style?: CSSProperties; className?: string }) => {
  const Tag = tag; let k = 0
  return (
    <Tag className={`rw-hd${on ? " is-on" : ""}${className ? " " + className : ""}`} aria-label={plainOf(text)} style={{ ...D, fontSize: size, lineHeight: lh, ...(style || {}) }}>
      {String(text).split("|").map((line, li) => (
        <span key={li} className="rw-hd-l" aria-hidden>{splitWords(line).map((w, i) => { const d = delay + k++ * step; return (<span key={i} className={`rw-hd-w${w.acc ? " is-accw" : ""}`}><span className={`rw-hd-i${w.acc ? " is-acc" : ""}`} style={{ transitionDelay: `${d}ms`, ["--pd" as any]: `${d + 500}ms` }}>{w.acc ? <span className="rw-it">{w.t}{w.tail}<svg className="rw-spark" viewBox="0 0 24 24" aria-hidden><path d="M12 1.5C12.9 8 16 11.1 22.5 12 16 12.9 12.9 16 12 22.5 11.1 16 8 12.9 1.5 12 8 11.1 11.1 8 12 1.5Z" /></svg></span> : <>{w.t}{w.tail}</>}</span> </span>) })}</span>
      ))}
    </Tag>
  )
}
const Eyebrow = ({ text, on, M, delay = 0, style }: { text: string; on: boolean; M: CSSProperties; delay?: number; style?: CSSProperties }) => text ? <p className={`rw-eb${on ? " is-on" : ""}`} style={{ ...M, transitionDelay: `${delay}ms`, ...(style || {}) }}><i aria-hidden />{text}</p> : null
// one-shot rise for copy / rows
const rise = (on: boolean, d = 0, y = 22): CSSProperties => ({ opacity: on ? 1 : 0, translate: on ? "0 0" : `0 ${y}px`, transition: `opacity .9s ease ${d}ms, translate 1s cubic-bezier(.2,.8,.2,1) ${d}ms` })
// Image that UNMASKS through a shape as it enters, settles from a zoom, then drifts with scroll (needs --sp on an ancestor).
const SHAPES: Record<string, [string, string]> = {
  up: ["inset(100% 0 0 0)", "inset(0 0 0 0)"], down: ["inset(0 0 100% 0)", "inset(0 0 0 0)"], left: ["inset(0 100% 0 0)", "inset(0 0 0 0)"], right: ["inset(0 0 0 100%)", "inset(0 0 0 0)"],
  diag: ["polygon(0 100%,0 100%,0 100%,0 100%)", "polygon(0 -160%,260% 100%,0 100%,0 100%)"], iris: ["circle(0% at 50% 55%)", "circle(85% at 50% 55%)"], arch: ["inset(100% 0 0 0 round 999px 999px 0 0)", "inset(0 0 0 0 round 999px 999px 0 0)"], slit: ["inset(0 50% 0 50%)", "inset(0 0 0 0)"],
}
const Um = ({ src, alt = "", on, shape = "up", ratio = "4/5", delay = 0, par = 1, focus = "50% 40%", radius = 4, sizes = "(max-width: 809px) 100vw, 50vw", style, className, eager = false }: { src: string; alt?: string; on: boolean; shape?: string; ratio?: string; delay?: number; par?: number; focus?: string; radius?: number; sizes?: string; style?: CSSProperties; className?: string; eager?: boolean }) => {
  const sh = SHAPES[shape] || SHAPES.up; const im = RS(src, sizes)
  return (
    <div className={`rw-um${on ? " is-on" : ""}${className ? " " + className : ""}`} style={{ aspectRatio: ratio, borderRadius: radius, clipPath: on ? sh[1] : sh[0], WebkitClipPath: on ? sh[1] : sh[0], transitionDelay: `${delay}ms`, ["--par" as any]: par, ...(style || {}) }}>
      <img src={im.src} srcSet={(im as any).srcSet} sizes={(im as any).sizes} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} style={{ objectPosition: focus, transitionDelay: `${delay}ms` }} />
    </div>
  )
}
const CSS_MOTION = `
[data-kb] *,[data-kb] *::before,[data-kb] *::after{transition:none!important}
.rw-sec{position:relative;z-index:10;display:block;width:100%;--sp:.5;--pp:0}
.rw-rev{position:relative;width:100%;--rv:1} .rw-rev-in{position:relative} .rw-rev-sp{height:0}
.rw-rev.is-act{--rv:0;--t:min(var(--h),100vh);--t:min(var(--h),100svh);z-index:var(--layer,9);margin-top:calc(var(--t)*-1)}
.rw-rev.is-act>.rw-rev-in{position:sticky;top:calc(100vh - var(--t));top:calc(100svh - var(--t))} .rw-rev.is-act>.rw-rev-sp{height:var(--t)}
/* the lifting edge throws a shadow on the section beneath, and that section comes out of the dark as it is uncovered */
.rw-rev.is-act>.rw-rev-in::before{content:"";position:absolute;z-index:40;left:0;right:0;top:0;height:120px;translate:0 calc((1 - var(--rv))*var(--t));background:linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,0));opacity:min(1,calc(var(--rv)*(1 - var(--rv))*9));pointer-events:none}
.rw-rev.is-act>.rw-rev-in::after{content:"";position:absolute;z-index:39;left:0;right:0;top:0;height:var(--t);background:#000;opacity:calc((1 - var(--rv))*.16);pointer-events:none}
.rw-wrap{--pad:56px;width:100%;max-width:calc(${MAXW} + var(--pad)*2);margin:0 auto;padding-left:var(--pad);padding-right:var(--pad)}
.rw-eb{display:inline-flex;align-items:center;gap:9px;width:max-content;max-width:100%;margin:0;padding:7px 13px 7px 11px;border-radius:999px;background:color-mix(in srgb,var(--rw-ink) 6%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 12%,transparent);color:var(--rw-ink);font-size:11.5px;font-weight:500;letter-spacing:.06em;opacity:0;translate:0 10px;transition:opacity .8s ease,translate .9s cubic-bezier(.2,.8,.2,1)} .rw-eb.is-on{opacity:1;translate:0 0}
.rw-eb i{display:block;flex:none;order:-1;width:7px;height:7px;border-radius:50%;background:var(--rw-brass)}
.rw-dark .rw-eb{color:var(--rw-cloud);background:color-mix(in srgb,var(--rw-cloud) 9%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 18%,transparent)}
.rw-hd{margin:0;letter-spacing:-.042em;text-wrap:balance;font-weight:var(--rw-font-dw,600)} .rw-hd-l{display:block}
.rw-hd-w{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .04em .12em;margin:0 -.04em -.12em;white-space:pre}
.rw-hd-i{position:relative;display:inline-block;translate:0 108%;transition:translate 1.05s cubic-bezier(.2,.85,.15,1)}
.rw-hd.is-on .rw-hd-i{translate:0 0}
.rw-hd-w.is-accw{overflow:hidden}
.rw-it{position:relative;color:var(--rw-acc);font-weight:300} .rw-dark .rw-it{color:var(--rw-brass)}
.rw-spark{display:none}

.rw-um{position:relative;overflow:hidden;transition:clip-path 1.35s cubic-bezier(.7,0,.2,1);background:color-mix(in srgb,var(--rw-stone) 22%,transparent)}
.rw-um img{position:absolute;left:0;top:-9%;width:100%;height:118%;display:block;object-fit:cover;scale:1.28;translate:0 calc((var(--sp,.5) - .5)*var(--par,1)*-7%);transition:scale 1.9s cubic-bezier(.16,.84,.24,1);user-select:none}
.rw-um.is-on img{scale:1}
/* diagonal cuts: the section hangs over its neighbour and is cut on a slope (clip-path, so the neighbour shows through) */
.rw-cut-t{margin-top:calc(var(--cut,7vw)*-1);clip-path:polygon(0 var(--cut,7vw),100% 0,100% 100%,0 100%);padding-top:var(--cut,7vw)}
.rw-cut-b{margin-bottom:calc(var(--cut,7vw)*-1);padding-bottom:var(--cut,7vw)}
.rw-cut-t.rw-cut-b{clip-path:polygon(0 var(--cut,7vw),100% 0,100% calc(100% - var(--cut,7vw)),0 100%)}
.rw-cut-b:not(.rw-cut-t){clip-path:polygon(0 0,100% 0,100% calc(100% - var(--cut,7vw)),0 100%)}
@media (max-width:1099px){.rw-wrap{--pad:32px}}
@media (max-width:699px){.rw-wrap{--pad:20px}}
@media (prefers-reduced-motion:reduce){.rw-hd-i{translate:0 0!important} .rw-spark{scale:1!important;rotate:0deg!important;animation:none!important} .rw-um{clip-path:none!important} .rw-um img{scale:1!important;translate:0 0!important}}
`


// ===== REACHWISE CMS bridge (composed by mk.py after _reveal). Hidden Collection Lists in the Site Layout render one <span data-rw-row="kind" data-f1…> per CMS item on every page bound to that layout (server render included).
// Sections render the baked SEED (lockstep with cms-seed.json) on the server and on the first client render — no hydration diff — then a layout effect swaps in the live CMS rows before paint.
type CmsRow = Record<string, string>
const SEED: Record<string, CmsRow[]> = {
  site: [{"slug": "site", "f1": "Reachwise", "f2": "Digital marketing agency", "f3": "SEO, social media and paid ads that bring the right people to your door.", "f4": "hello@reachwise.agency", "f5": "+1 (212) 555-0186", "f6": "/contact", "f7": "New York", "f8": "America/New_York", "f9": "4.9", "f10": "126", "f11": "Instagram:https://instagram.com,TikTok:https://tiktok.com,LinkedIn:https://linkedin.com,X:https://x.com", "f12": "Now booking Q4 · 3 spots left", "f13": "140+", "n1": "1"}]
}
const SW_BUILD = "RwAbout@cms1"
// An override control wins only when it holds real text; empty (or a single space) inherits from the CMS.
const pick = (o: any, fb: string) => (o !== undefined && o !== null && String(o).trim() ? String(o).trim() : fb)
const imgOf = (r: CmsRow | undefined, k = "img") => String((r && r[k]) || "").split("?")[0]
// A cleared CMS image draws this quiet placeholder — never a stock photo, and list positions stay aligned with their rows.
const EMPTY_IMG = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500' preserveAspectRatio='xMidYMid slice'><rect width='400' height='500' fill='#D3D8E2'/><rect x='120' y='170' width='160' height='160' rx='8' fill='none' stroke='#AEB6C6' stroke-width='1.5'/><rect x='100' y='150' width='200' height='200' rx='10' fill='none' stroke='#C3CAD8' stroke-width='1' stroke-dasharray='2 6'/></svg>")
const imgOr = (r: CmsRow | undefined, k = "img") => imgOf(r, k) || EMPTY_IMG
const cmsNum = (r: CmsRow | undefined, k: string, fb = 0) => { const v = parseFloat(String((r && r[k]) ?? "")); return isFinite(v) ? v : fb }
const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect
function readCMS(kind: string): CmsRow[] | null {
  if (typeof document === "undefined") return null
  if (!document.querySelector('[data-rw-row="bridge"]')) return null
  const seen = new Set<string>(); const out: CmsRow[] = []
  document.querySelectorAll(`[data-rw-row="${kind}"]`).forEach((el) => { const o: CmsRow = {}; for (const a of Array.from(el.attributes)) if (a.name.startsWith("data-")) o[a.name.slice(5)] = a.value; const key = o.slug || JSON.stringify(o); if (seen.has(key)) return; seen.add(key); out.push(o) })
  return out.sort((a, b) => (parseFloat(a.n1) || 0) - (parseFloat(b.n1) || 0))
}
function useCMS(kind: string, fallback: CmsRow[]): CmsRow[] {
  const [rows, setRows] = useState<CmsRow[]>(fallback); const sig = useRef("")
  useIso(() => { let n = 0, t = 0, ok = 0
    try { const w = window as any; if (!w.__ltCms || typeof w.__ltCms !== "object") w.__ltCms = {}; w.__ltCms[SW_BUILD] = 1 } catch (e) {}
    const pull = () => { const r = readCMS(kind); if (!r) return false; const s = JSON.stringify(r); if (s !== sig.current) { sig.current = s; setRows(r) } return true }
    const mo = new MutationObserver(() => { if (pull()) { ok++; if (ok > 2) mo.disconnect() } }); mo.observe(document.body, { childList: true, subtree: true })
    if (pull()) ok++
    const poll = () => { if (n++ < 30) { pull(); t = window.setTimeout(poll, 150) } }; t = window.setTimeout(poll, 150)
    return () => { mo.disconnect(); window.clearTimeout(t) } }, [kind])
  return rows
}
// The one-row Site collection holds every agency-wide fact (name, contact, booking link, proof numbers). A section's "… Override" control only replaces it on that one section.
function useSite() {
  const r = useCMS("site", SEED.site || []); const s = r[0] || (SEED.site || [])[0] || {}
  const g = (k: string) => String(s[k] ?? "").trim()
  return { name: g("f1") || "Reachwise", role: g("f2"), tagline: g("f3"), email: g("f4"), phone: g("f5"), book: g("f6") || "/contact", city: g("f7"), tz: g("f8") || "America/New_York", rating: g("f9") || "4.9", reviews: g("f10"), socials: g("f11"), announce: g("f12"), clients: g("f13") }
}
const linkList = (s: string) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf(":"); return { l: i < 0 ? x : x.slice(0, i).trim(), h: i < 0 ? "/" : x.slice(i + 1).trim() } })
const listOf = (s: string) => String(s || "").split(";").map((x) => x.trim()).filter(Boolean)

// The row a CMS detail page is about: the bound Slug control wins (server render included), else the last URL segment, else the first row.
function useRow(kind: string, fallback: CmsRow[], slug?: string) {
  const rows = useCMS(kind, fallback); const [path, setPath] = useState("")
  useEffect(() => { try { setPath(decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() || "")) } catch (e) {} }, [])
  const want = String(slug || "").trim() || path; const row = rows.find((r) => r.slug === want) || rows[0] || ({} as CmsRow); return { row, rows }
}
const crumbs = (s: string) => linkList(s)

// Open now? Open Hours = "1-6 07:00-19:00" (weekday numbers, Mon = 1 … Sun = 7) evaluated in the Site Time Zone.
function openState(spec: string, tz: string): { open: boolean; label: string } | null {
  try { const m = String(spec || "").match(/(\d)\s*-\s*(\d)\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/); if (!m) return null
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz || "UTC", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date())
    const g = (t: string) => (parts.find((p) => p.type === t) || { value: "" }).value; const wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(g("weekday")) + 1; const mins = (Number(g("hour")) % 24) * 60 + Number(g("minute"))
    const d1 = Number(m[1]), d2 = Number(m[2]), a = Number(m[3]) * 60 + Number(m[4]), b = Number(m[5]) * 60 + Number(m[6]); const open = wd >= d1 && wd <= d2 && mins >= a && mins < b
    return { open, label: open ? `Open · till ${m[5].padStart(2, "0")}:${m[6]}` : `Closed · opens ${m[3].padStart(2, "0")}:${m[4]}` } } catch (e) { return null }
}

// ===== RwAbout =====
interface AboutProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  eyebrow: string; heading: string; lead: string; facts: string; primary: string; primaryLink: string; secondary: string; secondaryLink: string
  photo1: any; photo2: any; photo3: any; captions: string
  storyEyebrow: string; storyHeading: string; story: string; scrollHint: string
  valuesEyebrow: string; valuesHeading: string; values: string
  hiringLabel: string; hiringCount: string; hiringText: string; hiringLink: string; hiringButton: string; style?: CSSProperties
}
// ---- THE ORIGIN SIGNAL (/about): chalk hero with the page h1 + three studio photos (parallax, notification captions), then a dark band where the
// STORY is a SIGNAL LINE: the section pins and a lime pulse travels along a horizontal signal trace; every year it reaches PINGS (ring, year fills in,
// caption rises) while the trace scrolls past. Phone / reduced motion: the same story as a vertical trace that fills as you read. Then three values
// cards and a careers strip. ----
const AB_P1 = "https://framerusercontent.com/images/Od0sLPh3UNsr4tc9mwj2XeBTyb8.webp"
const AB_P2 = "https://framerusercontent.com/images/6DvH70VZHpvmLKgVBP6M3k7q0A.webp"
const AB_P3 = "https://framerusercontent.com/images/x7HJbXkyp2obobP3ORbr0NqQ0.webp"
const abPairs = (s: string) => listOf(s).map((x) => { const i = x.indexOf(":"); return i < 0 ? { k: x, v: "" } : { k: x.slice(0, i).trim(), v: x.slice(i + 1).trim() } })
// the trace: flat, with a heartbeat blip at every milestone
const abTrace = (xs: number[], W: number) => { let d = "M0,50"; for (const x of xs) d += ` L${x - 30},50 L${x - 18},40 L${x - 9},64 L${x},14 L${x + 9},70 L${x + 18},46 L${x + 26},50`; return d + ` L${W},50` }
const AbIcon = ({ k }: { k: number }) => k === 0 ? (<svg viewBox="0 0 24 24" aria-hidden><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>)
  : k === 1 ? (<svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="3" /><circle cx="4.5" cy="6" r="2" /><circle cx="19.5" cy="6" r="2" /><circle cx="12" cy="21" r="1.6" /><path d="M6.2 7.2l3.4 2.9M17.8 7.2l-3.4 2.9M12 15v4.4" /></svg>)
  : (<svg viewBox="0 0 24 24" aria-hidden><rect x="4" y="10.5" width="16" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.8" /><circle cx="12" cy="15.5" r="1.4" /></svg>)
export default function RwAbout(props: AboutProps) {
  const { eyebrow = "About Reachwise", heading = "We put brands|*in front of people*.", lead = "Reachwise is a digital marketing agency in New York. Since 2016 we have helped 140+ brands get found on search, stopped on social and chosen over the competition — and we report every result in plain numbers.",
    facts = "Founded 2016;38 people;New York + remote", primary = "Book a call", primaryLink = "", secondary = "See our work", secondaryLink = "/work",
    photo1, photo2, photo3, captions = "Monday strategy review;Content sprint · week 32;Client workshop · Lumen Skin",
    storyEyebrow = "(01) Our story", storyHeading = "Ten years of|*reaching people*.", story = "2016:Two people, one laptop in Brooklyn;2018:First 20 clients, all local;2020:Paid ads team joins;2022:38 people, New York + remote;2025:140+ brands grown;2026:Your brand next", scrollHint = "Scroll to follow the signal",
    valuesEyebrow = "(02) How we work", valuesHeading = "Three rules we|*don't break*.", values = "Numbers over opinions:Every decision starts with data from your own accounts, not a hunch or a trend.;One team, every channel:SEO, social, ads and content are planned together, so they all push the same way.;No long contracts:Month to month after the first 90 days. We keep clients by getting results.",
    hiringLabel = "We're hiring", hiringCount = "3 roles", hiringText = "SEO strategist, social media producer, paid ads specialist", hiringLink = "/careers", hiringButton = "See open roles", bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill(); const site = useSite()
  const root = useRef<HTMLElement>(null); const hero = useRef<HTMLDivElement>(null); const band = useRef<HTMLDivElement>(null); const pin = useRef<HTMLDivElement>(null); const track = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null); const vals = useRef<HTMLDivElement>(null)
  const { w } = useSize(root, bpHint); const phone = w < 810, tab = w >= 810 && w < 1100
  const on = useOn(hero, live, rm); const onS = useOn(band, live, rm, 0.05); const onV = useOn(vals, live, rm)
  useMagnet(root, live)
  const final = still || rm || !live
  const pinned = !final && !phone
  const ms = abPairs(story); const n = ms.length
  const vs = abPairs(values).slice(0, 6); const caps = listOf(captions); const fx = listOf(facts)
  const photos = [srcOf(photo1, AB_P1), srcOf(photo2, AB_P2), srcOf(photo3, AB_P3)]
  const book = pick(primaryLink, site.book || "/contact")
  // photo parallax (hero band only)
  useScrollVars(hero, live, rm)
  // ---- the signal: geometry from the width, pp → head position + track shift; reached count → state (changes 6 times per pass) ----
  const W = Math.max(320, w); const pad = Math.round(W * (tab ? 0.2 : 0.16)); const gap = Math.round(Math.max(tab ? 300 : 360, W * (tab ? 0.4 : 0.3))); const trackW = pad * 2 + Math.max(0, n - 1) * gap
  const xs = ms.map((_, i) => pad + i * gap)
  const [hit, setHit] = useState(0); const hitR = useRef(-1)
  const geo = useRef({ W, pad, trackW, xs }); geo.current = { W, pad, trackW, xs }
  useScrollVars(pin, live && pinned, rm, (_sp, pp) => { const g = geo.current; const t = clamp01((pp - 0.05) / 0.86); const tx = g.trackW > g.W ? -t * (g.trackW - g.W) : (g.W - g.trackW) / 2; const hx = g.pad + t * (g.trackW - 2 * g.pad)
    const el = track.current; if (el) { el.style.setProperty("--tx", `${tx.toFixed(1)}px`); el.style.setProperty("--hx", `${hx.toFixed(1)}px`) }
    let k = 0; g.xs.forEach((x) => { if (hx >= x - 2) k++ }); if (k !== hitR.current) { hitR.current = k; setHit(k) } })
  // ---- stacked trace (phone / reduced motion / canvas): fills as you read ----
  const [hitV, setHitV] = useState(0)
  useEffect(() => { const L = list.current; if (!L || pinned) return; if (final) { L.style.setProperty("--fv", "1"); setHitV(n); return }
    let vis = true, fresh = false, top = 0, h = 1, vh = 1, last = -1, lastK = -1, offs: number[] = []
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting }, { rootMargin: "10% 0px 10% 0px" }); io.observe(L)
    const read = () => { if (!vis) { fresh = false; return } const r = L.getBoundingClientRect(); top = r.top; h = r.height; vh = window.innerHeight || 1; offs = Array.from(L.children).map((ch) => (ch as HTMLElement).offsetTop + 24); fresh = true }
    const off = onTick(() => { if (!fresh) return; const f = clamp01((vh * 0.68 - top) / Math.max(1, h)); if (Math.abs(f - last) > 0.001) { last = f; L.style.setProperty("--fv", f.toFixed(4)) } let k = 0; offs.forEach((o) => { if (o <= f * h + 1) k++ }); if (k !== lastK) { lastK = k; setHitV(k) } }, read)
    return () => { off(); io.disconnect() } }, [pinned, final, n])
  const reached = (i: number) => (pinned ? i < hit : i < hitV) || (final && !pinned)
  const cur = pinned ? Math.max(0, hit - 1) : Math.max(0, hitV - 1)
  const pinH = pinned ? `${Math.round(Math.max(2.2, 0.36 * n + 0.6) * 100)}svh` : undefined
  const phW = (i: number) => phone ? "100vw" : i === 0 ? "44vw" : i === 1 ? "32vw" : "26vw"
  return (
    <section ref={root as any} className={`rw rw-sec rwab${phone ? " is-ph" : tab ? " is-tab" : ""}${final ? " is-fin" : ""}${pinned ? " is-pin" : ""}`} style={{ ...cssVars(c), ...B, ...(props.style || {}) }}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_MOTION + CSS_AB + siteFontCss(props) }} />
      {/* chalk: hero + studio photos */}
      <div ref={hero} className={`rwab-hero${on ? " is-on" : ""}`}>
        <div className="rw-wrap">
          <div className="rwab-top">
            <div className="rwab-hl"><Eyebrow text={eyebrow} on={on} M={M} /><Head text={heading} on={on} D={D} tag="h1" size={phone ? "clamp(46px,12.4vw,60px)" : "clamp(60px,7.2vw,124px)"} lh={0.92} delay={120} /></div>
            <div className="rwab-side" style={rise(on, 520, 16)}>
              {lead && <p className="rwab-lead">{lead}</p>}
              {fx.length > 0 && <ul className="rwab-facts" style={M}>{fx.map((f, i) => <li key={i}><i aria-hidden />{f}</li>)}</ul>}
              <div className="rwab-btns">{primary && <Btn href={book} label={primary} kind="solid" icon="cal" />}{secondary && <Btn href={secondaryLink || "/work"} label={secondary} kind="ghost" />}</div>
            </div>
          </div>
          <div className="rwab-photos">
            {photos.map((p, i) => (
              <figure key={i} className={`rwab-ph rwab-ph${i + 1}`} style={{ ["--par" as any]: [0.6, -0.9, 1.3][i] }}>
                <Um src={p} alt={caps[i] || ""} on={on} shape={i === 1 ? "arch" : "up"} ratio={phone ? (i === 0 ? "4/3" : "4/5") : i === 0 ? "5/4" : i === 1 ? "4/5" : "1/1"} delay={300 + i * 140} par={[0.6, 1.1, 0.8][i]} radius={i === 1 ? 999 : 24} sizes={phW(i)} focus={i === 1 ? "55% 40%" : "50% 50%"} className="rwab-um" />
                {caps[i] && <figcaption className="rwab-cap" style={M}><b className="rwab-cap-i" aria-hidden>{["◎", "✎", "✓"][i]}</b>{caps[i]}<i className="rwab-cap-p" aria-hidden /></figcaption>}
              </figure>))}
          </div>
        </div>
      </div>
      {/* dark: the signal line, values, hiring */}
      <div ref={band} className={`rwab-dark rw-dark${onS ? " is-on" : ""}`}>
        {n > 0 && (pinned ? (
          <div ref={pin} className="rwab-pin" style={{ height: pinH }}>
            <div className="rwab-stage">
              <div className="rw-wrap rwab-sh">
                <div className="rwab-shl"><Eyebrow text={storyEyebrow} on={onS} M={M} /><Head text={storyHeading} on={onS} D={D} size="clamp(40px,4.6vw,68px)" lh={0.95} delay={80} /></div>
                <p className="rwab-read" style={M} aria-hidden><span className="rwab-read-y" style={D}>{ms[cur] ? ms[cur].k : ""}</span><span>{String(Math.max(1, hit)).padStart(2, "0")} / {String(n).padStart(2, "0")}</span></p>
              </div>
              <div ref={track} className="rwab-track" style={{ width: trackW, ["--tx" as any]: "0px", ["--hx" as any]: `${pad}px` }}>
                <svg className="rwab-tr rwab-tr-o" width={trackW} height="100" viewBox={`0 0 ${trackW} 100`} aria-hidden><path d={abTrace(xs, trackW)} /></svg>
                <div className="rwab-lit" aria-hidden><svg className="rwab-tr rwab-tr-l" width={trackW} height="100" viewBox={`0 0 ${trackW} 100`}><path d={abTrace(xs, trackW)} /></svg></div>
                <i className="rwab-head" aria-hidden><i /><i /></i>
                <ol className="rwab-ms">
                  {ms.map((m, i) => (
                    <li key={i} className={`rwab-m${reached(i) ? " is-hit" : ""}${i === n - 1 ? " is-last" : ""}`} style={{ left: xs[i] }}>
                      <span className="rwab-yr" style={D}>{m.k}</span>
                      <i className="rwab-dot" aria-hidden><i /></i>
                      {m.v && <span className="rwab-tx">{m.v}</span>}
                    </li>))}
                </ol>
              </div>
              <p className="rwab-hint" style={M} aria-hidden><i />{scrollHint}</p>
            </div>
          </div>
        ) : (
          <div className="rw-wrap rwab-vwrap">
            <div className="rwab-shl"><Eyebrow text={storyEyebrow} on={onS} M={M} /><Head text={storyHeading} on={onS} D={D} size={phone ? "clamp(38px,10.4vw,48px)" : "clamp(40px,4.6vw,68px)"} lh={0.95} delay={80} /></div>
            <ol ref={list} className="rwab-vl" style={{ ["--fv" as any]: final ? 1 : 0 }}>
              {ms.map((m, i) => (
                <li key={i} className={`rwab-vm${reached(i) ? " is-hit" : ""}${i === n - 1 ? " is-last" : ""}`}>
                  <i className="rwab-dot" aria-hidden><i /></i>
                  <span className="rwab-yr" style={D}>{m.k}</span>
                  {m.v && <span className="rwab-tx">{m.v}</span>}
                </li>))}
            </ol>
          </div>
        ))}
        <div ref={vals} className={`rw-wrap rwab-vals${onV ? " is-on" : ""}`}>
          <div className="rwab-vh"><Eyebrow text={valuesEyebrow} on={onV} M={M} /><Head text={valuesHeading} on={onV} D={D} size={phone ? "clamp(38px,10.4vw,48px)" : "clamp(40px,4.6vw,68px)"} lh={0.95} delay={80} /></div>
          {vs.length > 0 && (
            <ul className="rwab-vg">
              {vs.map((v, i) => (
                <li key={i} className="rwab-v" style={rise(onV, 260 + i * 110, 30)}>
                  <span className="rwab-vi" aria-hidden><AbIcon k={i % 3} /><i /></span>
                  <span className="rwab-vn" style={M}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 style={D}>{v.k}</h3>
                  {v.v && <p>{v.v}</p>}
                </li>))}
            </ul>)}
          {hiringLabel && (
            <a className="rwab-hire" href={hiringLink || "/careers"} style={rise(onV, 560, 20)}>
              <span className="rwab-hire-l" style={M}><i className="rw-port" aria-hidden />{hiringLabel}{hiringCount ? ` · ${hiringCount}` : ""}</span>
              {hiringText && <span className="rwab-hire-t" style={D}>{hiringText}</span>}
              <span className="rwab-hire-b" style={M}>{hiringButton}<span className="rwab-hire-a" aria-hidden><IcoArrow s={16} /></span></span>
            </a>)}
        </div>
      </div>
    </section>
  )
}
const CSS_AB = `
.rwab{background:var(--rw-bone);color:var(--rw-ink)}
.rwab .rw-hd{font-weight:var(--rw-font-dw,700);letter-spacing:-.045em}
.rwab-hero .rw-it{color:var(--rw-ink);font-weight:inherit;padding:0 .08em;margin:0 -.04em;isolation:isolate;display:inline-block}
.rwab-hero .rw-it::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:.12em;bottom:.04em;border-radius:.16em;background:var(--rw-brass);transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.7,0,.2,1) .8s}
.rwab-hero .rw-hd.is-on .rw-it::before{transform:none}
.rwab-dark .rw-it{font-weight:inherit;color:var(--rw-brass)}
.rwab .rw-eb i{position:relative} .rwab .rw-eb i::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 1.5px var(--rw-brass);animation:rwab-ping 1.8s cubic-bezier(.2,.6,.3,1) infinite} .rwab-hero .rw-eb i{box-shadow:0 0 0 1px var(--rw-ink)}
@keyframes rwab-ping{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.8)}}
/* hero */
.rwab-hero{padding:clamp(136px,12vw,190px) 0 clamp(80px,8vw,130px);overflow:clip}
.rwab-top{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:40px clamp(40px,5vw,96px);align-items:end}
.rwab-hl{display:flex;flex-direction:column;gap:28px;align-items:flex-start}
.rwab-side{display:flex;flex-direction:column;gap:26px;padding-bottom:8px}
.rwab-lead{margin:0;font-size:18px;line-height:1.55;color:color-mix(in srgb,var(--rw-ink) 80%,transparent);max-width:46ch}
.rwab-facts{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0;font-size:11.5px;letter-spacing:.06em}
.rwab-facts li{display:inline-flex;align-items:center;gap:8px;padding:8px 13px;border-radius:999px;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 18%,transparent)} .rwab-facts i{width:7px;height:7px;border-radius:50%;background:var(--rw-brass);box-shadow:0 0 0 1px var(--rw-ink)}
.rwab-btns{display:flex;flex-wrap:wrap;gap:12px}
.rwab-photos{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr) minmax(0,.8fr);gap:clamp(16px,1.8vw,28px);align-items:start;margin-top:clamp(64px,7vw,110px)}
.rwab-ph{position:relative;margin:0} .rwab-ph2{margin-top:clamp(40px,6vw,96px)} .rwab-ph3{margin-top:clamp(120px,13vw,220px)}
.rwab-um{width:100%;background:var(--rw-fog)}
.rwab-um img{transition:scale 1.9s cubic-bezier(.16,.84,.24,1),filter .8s} .rwab-ph:hover .rwab-um img{scale:1.05}
.rwab-cap{position:absolute;left:14px;bottom:14px;display:inline-flex;align-items:center;gap:9px;max-width:calc(100% - 28px);padding:7px 14px 7px 7px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);font-size:11.5px;letter-spacing:.02em;white-space:nowrap;box-shadow:0 14px 34px -14px rgba(0,0,0,.45);opacity:0;translate:0 14px;scale:.9;transform-origin:0 100%;transition:opacity .6s,translate .8s cubic-bezier(.34,1.56,.64,1),scale .8s cubic-bezier(.34,1.56,.64,1)}
.rwab-ph2 .rwab-cap{left:50%;translate:-50% 14px;transform-origin:50% 100%} .rwab-hero.is-on .rwab-ph2 .rwab-cap{translate:-50% 0}
.rwab-hero.is-on .rwab-cap{opacity:1;translate:0 0;scale:1} .rwab-ph1 .rwab-cap{transition-delay:1.1s} .rwab-ph2 .rwab-cap{transition-delay:1.3s} .rwab-ph3 .rwab-cap{transition-delay:1.5s}
.rwab-cap-i{display:grid;place-items:center;flex:none;width:26px;height:26px;border-radius:50%;background:var(--rw-brass);font-size:12px;font-weight:700;font-family:inherit}
.rwab-cap-p{position:absolute;right:-2px;top:-2px;width:10px;height:10px;border-radius:50%;background:#FF3E88;box-shadow:0 0 0 2px var(--rw-cloud)}
.rwab-ph:hover .rwab-cap{scale:1.06}
/* dark band */
.rwab-dark{position:relative;background:var(--rw-night);color:var(--rw-cloud);border-radius:32px 32px 0 0;padding-bottom:clamp(96px,10vw,160px)}
.rwab-stage{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;display:flex;flex-direction:column}
.rwab-sh{display:flex;justify-content:space-between;align-items:flex-end;gap:40px;padding-top:clamp(96px,11vh,130px)}
.rwab-shl{display:flex;flex-direction:column;gap:24px;align-items:flex-start}
.rwab-read{display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin:0;font-size:11px;letter-spacing:.14em;color:var(--rw-mut)} .rwab-read-y{font-size:clamp(44px,4vw,64px);line-height:.9;letter-spacing:-.05em;color:var(--rw-brass);font-weight:var(--rw-font-dw,700);font-variant-numeric:tabular-nums}
.rwab-track{position:relative;flex:1;min-height:320px;transform:translate3d(var(--tx),0,0);will-change:transform}
.rwab-tr{position:absolute;left:0;top:50%;margin-top:-50px;display:block;overflow:visible} .rwab-tr path{fill:none;stroke-linejoin:round;stroke-linecap:round}
.rwab-tr-o path{stroke:color-mix(in srgb,var(--rw-cloud) 22%,transparent);stroke-width:1.5;stroke-dasharray:3 6}
.rwab-lit{position:absolute;left:0;top:0;bottom:0;width:var(--hx);overflow:hidden} .rwab-tr-l path{stroke:var(--rw-brass);stroke-width:2.5;filter:drop-shadow(0 0 8px color-mix(in srgb,var(--rw-brass) 80%,transparent))}
.rwab-head{position:absolute;left:var(--hx);top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:var(--rw-brass);box-shadow:0 0 0 4px color-mix(in srgb,var(--rw-brass) 25%,transparent),0 0 40px 10px color-mix(in srgb,var(--rw-brass) 45%,transparent)}
.rwab-head i{position:absolute;inset:-10px;border-radius:50%;box-shadow:0 0 0 1.5px var(--rw-brass);animation:rwab-wave 1.9s cubic-bezier(.2,.6,.3,1) infinite} .rwab-head i+i{animation-delay:.95s} @keyframes rwab-wave{0%{opacity:.8;transform:scale(.4)}100%{opacity:0;transform:scale(3.4)}}
.rwab-ms{list-style:none;margin:0;padding:0;position:absolute;inset:0}
.rwab-m{position:absolute;top:0;bottom:0;width:0}
.rwab-m .rwab-yr{position:absolute;bottom:calc(50% + 50px);left:0;translate:-50% 0;font-size:clamp(64px,6.4vw,104px);line-height:.85;letter-spacing:-.06em;font-weight:var(--rw-font-dw,700);white-space:nowrap;color:transparent;-webkit-text-stroke:1.2px color-mix(in srgb,var(--rw-cloud) 32%,transparent);transition:color .6s,-webkit-text-stroke-color .6s,translate .8s cubic-bezier(.2,.8,.2,1)}
.rwab-m.is-hit .rwab-yr{color:var(--rw-cloud);-webkit-text-stroke-color:transparent;translate:-50% -8px} .rwab-m.is-last.is-hit .rwab-yr{color:var(--rw-brass)}
.rwab-dot{position:absolute;display:block;width:16px;height:16px;border-radius:50%;background:var(--rw-night);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--rw-cloud) 40%,transparent);transition:background .4s,box-shadow .4s}
.rwab-m .rwab-dot{left:-8px;top:calc(50% - 8px)}
.rwab-dot i{position:absolute;inset:-2px;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);opacity:0}
.is-hit>.rwab-dot{background:var(--rw-brass);box-shadow:0 0 0 4px var(--rw-night)} .is-hit>.rwab-dot i{animation:rwab-hit 1.4s cubic-bezier(.2,.6,.3,1) 2}
@keyframes rwab-hit{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(5)}}
.rwab-m .rwab-tx{position:absolute;top:calc(50% + 44px);left:0;translate:-50% 12px;width:min(270px,26vw);text-align:center;font-size:17px;line-height:1.4;color:color-mix(in srgb,var(--rw-cloud) 40%,transparent);transition:color .6s,translate .8s cubic-bezier(.2,.8,.2,1)}
.rwab-m.is-hit .rwab-tx{color:var(--rw-cloud);translate:-50% 0}
.rwab-m.is-last .rwab-tx{font-weight:600}
.rwab-hint{display:flex;align-items:center;justify-content:center;gap:10px;margin:0 0 32px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--rw-mut)} .rwab-hint i{width:22px;height:2px;border-radius:2px;background:var(--rw-brass)}
/* stacked trace */
.rwab-vwrap{padding-top:clamp(88px,9vw,140px)}
.rwab-vl{position:relative;list-style:none;margin:clamp(48px,5vw,72px) 0 0;padding:0 0 0 44px;display:flex;flex-direction:column;gap:42px;--fv:0}
.rwab-vl::before,.rwab-vl::after{content:"";position:absolute;left:7px;top:8px;bottom:8px;width:2px;border-radius:2px;background:color-mix(in srgb,var(--rw-cloud) 16%,transparent)} .rwab-vl::after{background:var(--rw-brass);transform-origin:top;transform:scaleY(var(--fv));box-shadow:0 0 12px color-mix(in srgb,var(--rw-brass) 70%,transparent)}
.rwab-vm{position:relative;display:flex;flex-direction:column;gap:8px}
.rwab-vm .rwab-dot{left:-44px;top:10px;z-index:1}
.rwab-vm .rwab-yr{font-size:clamp(48px,6vw,72px);line-height:.9;letter-spacing:-.055em;font-weight:var(--rw-font-dw,700);color:transparent;-webkit-text-stroke:1.2px color-mix(in srgb,var(--rw-cloud) 34%,transparent);transition:color .6s,-webkit-text-stroke-color .6s}
.rwab-vm.is-hit .rwab-yr{color:var(--rw-cloud);-webkit-text-stroke-color:transparent} .rwab-vm.is-last.is-hit .rwab-yr{color:var(--rw-brass)}
.rwab-vm .rwab-tx{font-size:17px;line-height:1.45;color:color-mix(in srgb,var(--rw-cloud) 45%,transparent);transition:color .6s;max-width:34ch} .rwab-vm.is-hit .rwab-tx{color:var(--rw-cloud)}
/* stacked trace on wide screens (reduced motion / canvas): a 3-column grid of milestones */
.rwab:not(.is-ph) .rwab-vl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:56px 40px;padding-left:0} .rwab:not(.is-ph) .rwab-vl::before,.rwab:not(.is-ph) .rwab-vl::after{display:none} .rwab:not(.is-ph) .rwab-vm{padding-top:26px;border-top:1px solid color-mix(in srgb,var(--rw-cloud) 16%,transparent)} .rwab:not(.is-ph) .rwab-vm .rwab-dot{left:0;top:-9px}
/* values */
.rwab-vals{padding-top:clamp(96px,10vw,160px)}
.rwab-vh{display:flex;flex-direction:column;gap:24px;align-items:flex-start;margin-bottom:clamp(40px,4.4vw,64px)}
.rwab-vg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(14px,1.6vw,24px);list-style:none;margin:0;padding:0}
.rwab-v{position:relative;display:flex;flex-direction:column;gap:14px;padding:clamp(24px,2.4vw,36px);border-radius:24px;background:var(--rw-pine);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 9%,transparent);transition:transform .6s cubic-bezier(.34,1.56,.64,1),box-shadow .5s,background .5s}
.rwab-v:hover{transform:translateY(-6px);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-brass) 50%,transparent),0 30px 60px -30px color-mix(in srgb,var(--rw-brass) 35%,transparent)}
.rwab-vi{position:relative;display:grid;place-items:center;width:56px;height:56px;margin-bottom:22px;border-radius:50%;background:var(--rw-brass);color:var(--rw-ink)} .rwab-vi svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.rwab-vi i{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 1.5px var(--rw-brass);opacity:0} .rwab-v:hover .rwab-vi i{animation:rwab-hit 1.3s cubic-bezier(.2,.6,.3,1) 2}
.rwab-vn{position:absolute;right:clamp(24px,2.4vw,36px);top:clamp(24px,2.4vw,36px);font-size:12px;letter-spacing:.1em;color:var(--rw-mut)}
.rwab-v h3{margin:0;font-size:clamp(24px,2.1vw,32px);line-height:1.02;letter-spacing:-.04em;font-weight:var(--rw-font-dw,700)} .rwab-v p{margin:0;font-size:16.5px;line-height:1.55;color:color-mix(in srgb,var(--rw-cloud) 70%,transparent)}
/* keyboard focus reveals a sub-block (useOn marks it data-kb): the reveal is instant, so a tabbed link is never still fading in */
.rwab [data-kb],.rwab [data-kb] *,.rwab [data-kb] *::before,.rwab [data-kb] *::after{transition:none!important}
.rwab-hire{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:20px 32px;margin-top:clamp(48px,5vw,72px);padding:14px 14px 14px 30px;border-radius:999px;background:var(--rw-brass);color:var(--rw-ink);text-decoration:none;transition:background .4s}
.rwab-hire-l{display:inline-flex;align-items:center;gap:10px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
.rwab-hire-t{font-size:clamp(18px,1.6vw,24px);letter-spacing:-.03em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rwab-hire-b{display:inline-flex;align-items:center;gap:14px;padding:8px 8px 8px 20px;border-radius:999px;background:var(--rw-ink);color:var(--rw-cloud);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
.rwab-hire-a{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--rw-brass);color:var(--rw-ink);transition:rotate .5s cubic-bezier(.34,1.56,.64,1)} .rwab-hire:hover .rwab-hire-a{rotate:-45deg}
/* tablet */
.rwab.is-tab .rwab-top{grid-template-columns:1fr;align-items:start} .rwab.is-tab .rwab-vg{grid-template-columns:1fr 1fr} .rwab.is-tab .rwab-hire{grid-template-columns:1fr auto;border-radius:28px} .rwab.is-tab .rwab-hire-t{grid-column:1/-1;grid-row:2;white-space:normal}
/* phone */
.rwab.is-ph .rwab-hero{padding:112px 0 72px}
.rwab.is-ph .rwab-top{grid-template-columns:1fr;gap:28px}
.rwab.is-ph .rwab-lead{font-size:16.5px}
.rwab.is-ph .rwab-btns .rw-btn{width:100%}
.rwab.is-ph .rwab-photos{grid-template-columns:1fr 1fr;gap:12px;margin-top:48px} .rwab.is-ph .rwab-ph1{grid-column:1/-1} .rwab.is-ph .rwab-ph2{margin-top:0} .rwab.is-ph .rwab-ph3{margin-top:48px}
.rwab.is-ph .rwab-cap{font-size:10.5px;padding:5px 10px 5px 5px;left:10px;bottom:10px} .rwab.is-ph .rwab-cap-i{width:22px;height:22px}
.rwab.is-ph .rwab-ph2 .rwab-cap,.rwab.is-ph .rwab-ph3 .rwab-cap{left:8px;right:8px;translate:0 14px;white-space:normal;max-width:none} .rwab.is-ph .rwab-hero.is-on .rwab-ph2 .rwab-cap{translate:0 0}
.rwab.is-ph .rwab-dark{border-radius:24px 24px 0 0;padding-bottom:88px}
.rwab.is-ph .rwab-vg{grid-template-columns:1fr} .rwab.is-ph .rwab-vals{padding-top:88px}
.rwab.is-ph .rwab-hire{grid-template-columns:1fr;border-radius:24px;padding:22px;gap:14px} .rwab.is-ph .rwab-hire-t{white-space:normal} .rwab.is-ph .rwab-hire-b{justify-self:start}
.rwab.is-fin .rwab-cap{transition:none}
@media (prefers-reduced-motion:reduce){.rwab-head i,.rwab-dot i{animation:none!important}}
`
addPropertyControls(RwAbout, {
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "About Reachwise" },
  heading: { type: ControlType.String, title: "Heading", description: "| = line break, *words* = lime marker", displayTextArea: true, defaultValue: "We put brands|*in front of people*." },
  lead: { type: ControlType.String, title: "Lead", displayTextArea: true, defaultValue: "Reachwise is a digital marketing agency in New York. Since 2016 we have helped 140+ brands get found on search, stopped on social and chosen over the competition — and we report every result in plain numbers." },
  facts: { type: ControlType.String, title: "Facts", description: "fact; fact; …", defaultValue: "Founded 2016;38 people;New York + remote" },
  primary: { type: ControlType.String, title: "Primary button", defaultValue: "Book a call" },
  primaryLink: { type: ControlType.Link, title: "Primary link", description: "Empty = Booking Link on the Site CMS row" },
  secondary: { type: ControlType.String, title: "Second button", defaultValue: "See our work" },
  secondaryLink: { type: ControlType.Link, title: "Second link", defaultValue: "/work" },
  photo1: { type: ControlType.ResponsiveImage, title: "Photo 1", description: "Empty = the studio stand-in photo" },
  photo2: { type: ControlType.ResponsiveImage, title: "Photo 2", description: "Empty = the studio stand-in photo" },
  photo3: { type: ControlType.ResponsiveImage, title: "Photo 3", description: "Empty = the studio stand-in photo" },
  captions: { type: ControlType.String, title: "Photo captions", description: "caption; caption; caption", displayTextArea: true, defaultValue: "Monday strategy review;Content sprint · week 32;Client workshop · Lumen Skin" },
  storyEyebrow: { type: ControlType.String, title: "Story eyebrow", defaultValue: "(01) Our story" },
  storyHeading: { type: ControlType.String, title: "Story heading", displayTextArea: true, defaultValue: "Ten years of|*reaching people*." },
  story: { type: ControlType.String, title: "Story", description: "Year:Text; Year:Text; …", displayTextArea: true, defaultValue: "2016:Two people, one laptop in Brooklyn;2018:First 20 clients, all local;2020:Paid ads team joins;2022:38 people, New York + remote;2025:140+ brands grown;2026:Your brand next" },
  scrollHint: { type: ControlType.String, title: "Scroll hint", defaultValue: "Scroll to follow the signal" },
  valuesEyebrow: { type: ControlType.String, title: "Values eyebrow", defaultValue: "(02) How we work" },
  valuesHeading: { type: ControlType.String, title: "Values heading", displayTextArea: true, defaultValue: "Three rules we|*don't break*." },
  values: { type: ControlType.String, title: "Values", description: "Title:Text; Title:Text; …", displayTextArea: true, defaultValue: "Numbers over opinions:Every decision starts with data from your own accounts, not a hunch or a trend.;One team, every channel:SEO, social, ads and content are planned together, so they all push the same way.;No long contracts:Month to month after the first 90 days. We keep clients by getting results." },
  hiringLabel: { type: ControlType.String, title: "Hiring label", description: "Empty = hide the careers strip", defaultValue: "We're hiring" },
  hiringCount: { type: ControlType.String, title: "Hiring count", defaultValue: "3 roles" },
  hiringText: { type: ControlType.String, title: "Hiring text", defaultValue: "SEO strategist, social media producer, paid ads specialist" },
  hiringButton: { type: ControlType.String, title: "Hiring button", defaultValue: "See open roles" },
  hiringLink: { type: ControlType.Link, title: "Hiring link", defaultValue: "/careers" },
})
