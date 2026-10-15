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
  site: [{"slug": "site", "f1": "Reachwise", "f2": "Digital marketing agency", "f3": "SEO, social media and paid ads that bring the right people to your door.", "f4": "hello@reachwise.agency", "f5": "+1 (212) 555-0186", "f6": "/contact", "f7": "New York", "f8": "America/New_York", "f9": "4.9", "f10": "126", "f11": "Instagram:https://instagram.com,TikTok:https://tiktok.com,LinkedIn:https://linkedin.com,X:https://x.com", "f12": "Now booking Q4 · 3 spots left", "f13": "140+", "n1": "1"}],
  posts: [{"slug": "local-seo-2026", "f1": "Local SEO in 2026: what still moves the map pack", "f2": "SEO", "f3": "Sep 18, 2026", "f4": "7 min", "f5": "Reviews, pages and links: the three things that still decide who shows up first near you.", "f6": "Local search still comes down to three things...", "img": "https://framerusercontent.com/images/pHOBF7LHy4BbDr36flWPxPYRixo.webp", "n1": "1"}, {"slug": "reels-that-sell", "f1": "Reels that sell: the 3-second rule we use for every client", "f2": "Social media", "f3": "Sep 04, 2026", "f4": "5 min", "f5": "Why the first three seconds decide whether anyone sees the other twenty-seven.", "f6": "Every reel we make starts with one question...", "img": "https://framerusercontent.com/images/87wKn5rFSjsCMUA9My0OUYJ4dM.webp", "n1": "2"}, {"slug": "roas-is-not-profit", "f1": "ROAS is not profit: how we report paid ads", "f2": "Paid ads", "f3": "Aug 21, 2026", "f4": "6 min", "f5": "A 6× return can still lose money. Here is the number we report instead.", "f6": "Return on ad spend is the number everyone quotes...", "img": "https://framerusercontent.com/images/NtmyAnUBIcfQXkgdgwQGB2dIVY.webp", "n1": "3"}, {"slug": "content-calendar", "f1": "The one-page content calendar we give every client", "f2": "Content", "f3": "Aug 07, 2026", "f4": "4 min", "f5": "A plan your team will actually follow, with a template you can copy.", "f6": "Most content calendars die in week two...", "img": "https://framerusercontent.com/images/5NYoUMxcMZ7W73IVonEHOzeu5ls.webp", "n1": "4"}, {"slug": "landing-pages", "f1": "Five landing page fixes that doubled conversions", "f2": "Web design", "f3": "Jul 24, 2026", "f4": "6 min", "f5": "Small changes to headlines, forms and proof that paid for themselves in a week.", "f6": "Before you spend more on ads...", "img": "https://framerusercontent.com/images/2JG0A1F7J2tdiUI5Y6YXMfSc.webp", "n1": "5"}, {"slug": "agency-or-in-house", "f1": "Agency or in-house? An honest comparison", "f2": "Strategy", "f3": "Jul 10, 2026", "f4": "8 min", "f5": "What it really costs to hire a marketing team, and when an agency makes more sense.", "f6": "It depends on three numbers...", "img": "https://framerusercontent.com/images/P2vtvmpcIxWwVrN78FW1tzLdNs.webp", "n1": "6"}]
}
const SW_BUILD = "RwBlogList@cms1"
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

// ===== RwBlogList =====
interface BlogListProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  eyebrow: string; heading: string; lead: string; stat: string; allLabel: string; featuredLabel: string; readSuffix: string; emptyText: string
  askLabel: string; askTitle: string; askText: string; askButton: string; nlLabel: string; nlHeading: string; nlSub: string; nlPlaceholder: string; nlButton: string; nlEndpoint: string; nlSuccess: string; nlError: string; nlNote: string; style?: CSSProperties
}
// ---- THE INDEX (/blog): h1 + lead, kicker filter chips, one featured story (wide) and the rest in a 3-column grid, then a newsletter band.
// Scroll mechanic: every cover is revealed by a PING — a circle grows from the card's top-left corner (clip-path circle) with a lime ring riding its edge,
// in a wave across the columns (per-card progress from its own position). Switching a filter replays the ping wave on the new set. ----
const blOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || "").trim())
const BlSubmit = ({ label }: { label: string }) => (
  <button type="submit" className="rw-btn rw-solid rwbl-sbtn" data-mag data-cur="go"><span className="rw-face"><span className="rw-fill" aria-hidden /><span className="rw-lbl"><span className="rw-roll"><span className="rw-l1">{label}</span><span className="rw-l2" aria-hidden>{label}</span></span></span><span className="rw-arr" aria-hidden><span className="rw-a1"><Glyph k="mail" /></span><span className="rw-a2"><Glyph k="mail" /></span></span></span><span className="rw-ping" aria-hidden><i className="rw-ping-r" /><b><span>1</span><span>+1</span></b></span></button>)
export default function RwBlogList(props: BlogListProps) {
  const { eyebrow = "Journal", heading = "Ideas we|*test* first.", lead = "", stat = "▲|2.4k reads this week", allLabel = "All", featuredLabel = "Latest", readSuffix = "read", emptyText = "No articles in this topic yet.", askLabel = "Your turn", askTitle = "Got a tactic you want us to test?", askText = "Send it over. If it works for a client, we write it up here.", askButton = "Send it to us",
    nlLabel = "Newsletter", nlHeading = "One tested idea,|every *Tuesday*.", nlSub = "", nlPlaceholder = "you@company.com", nlButton = "Subscribe", nlEndpoint = "", nlSuccess = "You're in. The first email lands on Tuesday.", nlError = "Enter a valid email address.", nlNote = "4,200+ marketers read it · unsubscribe any time", bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill(); const site = useSite()
  const Dh: CSSProperties = { ...D, fontWeight: props.customFonts ? D.fontWeight : ("var(--rw-font-dw, 700)" as any) }
  const root = useRef<HTMLElement>(null); const { w } = useSize(root, bpHint); const phone = w < 810, tab = w >= 810 && w < 1100
  useMagnet(root, live)
  const on = useOn(root, live, rm)
  const rows = useCMS("posts", SEED.posts || [])
  const kicks: string[] = []; rows.forEach((r) => { const k = String(r.f2 || "").trim(); if (k && !kicks.includes(k)) kicks.push(k) })
  const [f, setF] = useState(""); const fk = f && kicks.includes(f) ? f : ""
  const shown = fk ? rows.filter((r) => String(r.f2 || "").trim() === fk) : rows
  const feat = shown[0]; const rest = shown.slice(1)
  const cols = phone ? 1 : tab ? 2 : 3
  const gap = phone || !rest.length ? 0 : (cols - (rest.length % cols)) % cols
  const settled = still || rm || !live
  // ---- the ping wave: reads every card's top in the read phase, writes --u per card in the write phase ----
  const stamp = useRef(-1e9)
  useEffect(() => { if (!live || rm || !root.current) return; const el = root.current; let vis = true, items: HTMLElement[] = [], tops: number[] = [], vh = 1
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting }, { rootMargin: "20% 0px 20% 0px" }); io.observe(el)
    const last = new WeakMap<HTMLElement, number>()
    const read = () => { if (!vis) return; items = Array.from(el.querySelectorAll<HTMLElement>(".rwbl-card")); vh = window.innerHeight || 1; tops = items.map((n) => n.getBoundingClientRect().top) }
    const off = onTick((t) => { if (!vis) return; items.forEach((n, i) => { const col = Number(n.dataset.col || 0); const s = clamp01((vh * 0.98 - tops[i]) / (vh * 0.52) - col * 0.16); const ft = clamp01((t - stamp.current - i * 110) / 900); const u = easeIO(Math.min(s, ft)); const p = last.get(n); if (p !== undefined && Math.abs(p - u) < 0.002) return; last.set(n, u); n.style.setProperty("--u", u.toFixed(3)) }) }, read)
    return () => { off(); io.disconnect() } }, [live, rm])
  const choose = (k: string) => { if (k === fk) return; stamp.current = typeof performance !== "undefined" ? performance.now() + 60 : 0; setF(k) }
  // ---- newsletter ----
  const [em, setEm] = useState(""); const [st, setSt] = useState<"" | "err" | "busy" | "ok">("")
  const submit = async (e: any) => { e.preventDefault(); if (!blOk(em)) { setSt("err"); return } setSt("busy")
    const ep = String(nlEndpoint || "").trim()
    if (ep) { try { await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em.trim(), source: "blog" }) }) } catch (x) {} }
    setSt("ok") }
  const si = stat.indexOf("|"); const stI = si < 0 ? "▲" : stat.slice(0, si).trim(), stT = si < 0 ? stat : stat.slice(si + 1).trim()
  const card = (r: CmsRow, i: number, big: boolean) => { const col = big ? 0 : (i % cols)
    return (
      <a key={(r.slug || "p") + fk} href={`/blog/${r.slug}`} data-col={col} className={`rwbl-card${big ? " is-feat" : ""}`} style={rise(on, big ? 260 : 120 + (i % cols) * 90, 26)}>
        <div className="rwbl-cov">
          <span className="rwbl-img"><img {...RS(imgOr(r), big ? "(max-width: 809px) 100vw, 60vw" : "(max-width: 809px) 100vw, (max-width: 1099px) 50vw, 30vw")} alt="" loading={big ? "eager" : "lazy"} decoding="async" draggable={false} /></span>
          <i className="rwbl-ring" aria-hidden /><i className="rwbl-src" aria-hidden />
          {big && featuredLabel && <span className="rwbl-flag" style={M}><i aria-hidden />{featuredLabel}</span>}
        </div>
        <div className="rwbl-txt">
          <p className="rwbl-meta" style={M}>{r.f2 && <span className="rwbl-kick">{r.f2}</span>}{r.f3 && <span>{r.f3}</span>}{r.f4 && <span className="rwbl-read">{r.f4} {readSuffix}</span>}</p>
          <h2 className="rwbl-t" style={Dh}><span>{r.f1}</span></h2>
          {r.f5 && <p className="rwbl-ex">{r.f5}</p>}
          <span className="rwbl-go" aria-hidden><IcoArrow s={16} /></span>
        </div>
      </a>) }
  return (
    <section ref={root as any} className={`rw rw-sec rwbl${phone ? " is-ph" : tab ? " is-tab" : ""}${on ? " is-on" : ""}${settled ? " is-set" : ""}`} style={{ ...cssVars(c), ...B, ...(props.style || {}) }}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_MOTION + CSS_BLOGLIST + siteFontCss(props) }} />
      <div className="rw-wrap">
        <header className="rwbl-top">
          <div className="rwbl-hd">
            <Eyebrow text={eyebrow} on={on} M={M} />
            <Head text={heading} on={on} D={Dh} tag="h1" size={phone ? "clamp(48px,13vw,64px)" : "clamp(64px,7.6vw,124px)"} lh={0.9} delay={100} />
          </div>
          <div className="rwbl-side" style={rise(on, 380)}>
            {lead && <p className="rwbl-lead">{lead}</p>}
            {stT && <span className="rwbl-stat" style={M}><b style={Dh}>{stI}</b>{stT}<i aria-hidden /></span>}
          </div>
        </header>
        {kicks.length > 1 && (
          <div className="rwbl-chips" role="group" aria-label="Filter articles by topic" style={rise(on, 460, 14)} onFocus={(e: any) => { const sc = e.currentTarget as HTMLElement; if (sc.scrollWidth > sc.clientWidth + 1) try { (e.target as HTMLElement).scrollIntoView({ block: "nearest", inline: "nearest" }) } catch (x) {} }}>
            {["", ...kicks].map((k) => { const n = k ? rows.filter((r) => String(r.f2 || "").trim() === k).length : rows.length; const act = k === fk
              return <button key={k || "_all"} type="button" className={`rwbl-chip${act ? " is-act" : ""}`} aria-pressed={act} onClick={() => choose(k)} style={M}><i aria-hidden />{k || allLabel}<sup>{n}</sup></button> })}
          </div>)}
        {!feat ? <p className="rwbl-empty" style={M}>{emptyText}</p> : (
          <div className="rwbl-list" aria-live="polite">
            {card(feat, 0, true)}
            {rest.length > 0 && <div className="rwbl-grid">{rest.map((r, i) => card(r, i, false))}
              {gap > 0 && askTitle && (
                <div className="rwbl-ask" style={{ gridColumn: `span ${gap}`, ...rise(on, 320, 26) }}>
                  <span className="rwbl-ask-rings" aria-hidden><i /><i /><i /><b /></span>
                  <p className="rwbl-ask-k" style={M}><i aria-hidden />{askLabel}</p>
                  <p className="rwbl-ask-t" style={Dh}>{askTitle}</p>
                  {askText && <p className="rwbl-ask-x">{askText}</p>}
                  <Btn href={`mailto:${site.email || ""}?subject=${encodeURIComponent(askTitle)}`} label={askButton} kind="ghost" icon="mail" />
                </div>)}
            </div>}
          </div>)}
        <div className="rwbl-nl rw-dark" style={rise(on, 200, 30)}>
          <span className="rwbl-nl-rings" aria-hidden><i /><i /><i /></span>
          <div className="rwbl-nl-l">
            <Eyebrow text={nlLabel} on={on} M={M} />
            <Head text={nlHeading} on={on} D={Dh} size={phone ? "34px" : "clamp(36px,3.6vw,54px)"} lh={0.98} delay={200} />
            {nlSub && <p className="rwbl-nl-sub">{nlSub}</p>}
          </div>
          <div className="rwbl-nl-r">
            {st === "ok" ? (
              <p className="rwbl-ok" role="status" style={M}><b style={Dh}>✓</b>{nlSuccess}<i aria-hidden /><em aria-hidden /></p>
            ) : (
              <form className={`rwbl-form${st === "err" ? " is-err" : ""}`} onSubmit={submit} noValidate>
                <label className="rwbl-lbl" htmlFor="rwbl-email" style={M}>Email</label>
                <div className="rwbl-row">
                  <input id="rwbl-email" type="email" inputMode="email" autoComplete="email" placeholder={nlPlaceholder} value={em} onChange={(e) => { setEm(e.target.value); if (st === "err") setSt("") }} aria-invalid={st === "err"} aria-describedby="rwbl-note" />
                  <BlSubmit label={st === "busy" ? "…" : nlButton} />
                </div>
                <p id="rwbl-note" className="rwbl-note" style={M} role={st === "err" ? "alert" : undefined}>{st === "err" ? nlError : nlNote}</p>
              </form>)}
          </div>
        </div>
      </div>
    </section>
  )
}
const CSS_BLOGLIST = `
.rwbl{background:var(--rw-bone);color:var(--rw-ink);padding:clamp(150px,15vw,210px) 0 clamp(96px,10vw,150px)}
.rwbl .rw-it{position:relative;color:var(--rw-ink);font-weight:inherit;padding:0 .06em;isolation:isolate}
.rwbl .rw-it::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:.1em;bottom:.02em;border-radius:.14em;background:var(--rw-brass);transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.7,0,.2,1) .7s}
.rwbl .rw-hd.is-on .rw-it::before{transform:none}
.rwbl .rw-dark .rw-it{color:var(--rw-brass);padding:0} .rwbl .rw-dark .rw-it::before{display:none}
.rwbl-top{display:flex;align-items:flex-end;justify-content:space-between;gap:48px;margin-bottom:clamp(40px,4.4vw,64px)}
.rwbl-hd{display:flex;flex-direction:column;gap:26px}
.rwbl-side{display:flex;flex-direction:column;align-items:flex-start;gap:22px;max-width:400px;padding-bottom:10px}
.rwbl-lead{margin:0;font-size:18px;line-height:1.5;color:var(--rw-mut)}
.rwbl-stat{position:relative;display:inline-flex;align-items:center;gap:9px;padding:6px 14px 6px 6px;border-radius:999px;background:var(--rw-cloud);font-size:12px;box-shadow:0 14px 30px -18px rgba(0,0,0,.45)}
.rwbl-stat b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--rw-brass);font-size:11px}
.rwbl-stat>i{position:absolute;right:-3px;top:-3px;width:10px;height:10px;border-radius:50%;background:#FF3E88;box-shadow:0 0 0 2px var(--rw-bone)}
.rwbl-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 clamp(28px,3vw,44px);padding-top:26px;border-top:1px solid var(--rw-fog)}
.rwbl-chip{position:relative;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px 0 14px;border:0;border-radius:999px;background:transparent;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 18%,transparent);color:var(--rw-ink);font-size:12px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:background .35s,color .35s,box-shadow .35s}
.rwbl-chip i{width:7px;height:7px;border-radius:50%;background:color-mix(in srgb,var(--rw-ink) 25%,transparent);transition:background .35s}
.rwbl-chip sup{font-size:10px;opacity:.75;vertical-align:super;margin-left:-2px}
.rwbl-chip:hover{background:color-mix(in srgb,var(--rw-ink) 6%,transparent)}
.rwbl-chip.is-act{background:var(--rw-ink);color:var(--rw-bone);box-shadow:none} .rwbl-chip.is-act i{background:var(--rw-brass);box-shadow:0 0 0 0 var(--rw-brass);animation:rwbl-pl 1.8s ease-out infinite}
@keyframes rwbl-pl{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--rw-brass) 80%,transparent)}100%{box-shadow:0 0 0 9px color-mix(in srgb,var(--rw-brass) 0%,transparent)}}
.rwbl-empty{padding:60px 0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--rw-mut)}
.rwbl-card{--u:1;position:relative;display:grid;text-decoration:none;color:inherit;gap:22px}
.rwbl:not(.is-set) .rwbl-card{--u:0}
.rwbl-card.is-feat{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:clamp(28px,3.4vw,56px);align-items:end;padding-bottom:clamp(44px,4.6vw,68px);margin-bottom:clamp(44px,4.6vw,68px);border-bottom:1px solid var(--rw-fog)}
.rwbl-card.is-feat:last-child{border-bottom:0;margin-bottom:0;padding-bottom:0}
.rwbl-cov{position:relative;container-type:inline-size;aspect-ratio:4/3;border-radius:20px;overflow:hidden;isolation:isolate;background:color-mix(in srgb,var(--rw-fog) 70%,var(--rw-bone))}
.rwbl-card.is-feat .rwbl-cov{aspect-ratio:16/9;border-radius:24px}
.rwbl-img{position:absolute;inset:0;clip-path:circle(calc(var(--u)*132cqw) at 0 0);-webkit-clip-path:circle(calc(var(--u)*132cqw) at 0 0)}
.rwbl-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transform:scale(calc(1 + (1 - var(--u))*.16));transform-origin:0 0;transition:scale 1.1s cubic-bezier(.2,.8,.2,1);user-select:none}
.rwbl-card:hover .rwbl-img img{scale:1.06}
.rwbl-ring{position:absolute;z-index:2;left:0;top:0;width:264cqw;aspect-ratio:1;border-radius:50%;box-shadow:inset 0 0 0 2px var(--rw-brass),0 0 24px 2px color-mix(in srgb,var(--rw-brass) 45%,transparent);translate:-50% -50%;transform:scale(var(--u));opacity:clamp(0,min(calc(var(--u)*30),calc((1 - var(--u))*3.2)),1);pointer-events:none}
.rwbl-src{position:absolute;z-index:3;left:18px;top:18px;width:12px;height:12px;border-radius:50%;background:var(--rw-brass);box-shadow:0 0 0 5px color-mix(in srgb,var(--rw-brass) 30%,transparent);opacity:calc(1 - var(--u)*4)}
.rwbl-flag{position:absolute;z-index:4;left:20px;top:20px;display:inline-flex;align-items:center;gap:8px;padding:7px 13px 7px 11px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:clamp(0,calc((var(--u) - .6)*3),1)}
.rwbl-flag i{width:7px;height:7px;border-radius:50%;background:#FF3E88}
.rwbl-txt{position:relative;display:flex;flex-direction:column;gap:12px;padding-right:48px}
.rwbl-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--rw-mut)}
.rwbl-kick{padding:5px 10px;border-radius:999px;background:var(--rw-ink);color:var(--rw-bone)}
.rwbl-read{padding:5px 10px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--rw-fog);transition:background .35s,box-shadow .35s,color .35s}
.rwbl-card:hover .rwbl-read{background:var(--rw-brass);box-shadow:none;color:var(--rw-ink)}
.rwbl-t{margin:0;font-size:clamp(22px,1.8vw,27px);line-height:1.1;letter-spacing:-.035em}
.rwbl-card.is-feat .rwbl-t{font-size:clamp(32px,3.3vw,52px);line-height:1;max-width:16ch}
.rwbl-t span{background:linear-gradient(var(--rw-ink),var(--rw-ink)) 0 96%/0% 2px no-repeat;transition:background-size .7s cubic-bezier(.7,0,.2,1);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.rwbl-card:hover .rwbl-t span{background-size:100% 2px}
.rwbl-ex{margin:0;font-size:16px;line-height:1.5;color:color-mix(in srgb,var(--rw-ink) 70%,var(--rw-bone));max-width:48ch}
.rwbl-card.is-feat .rwbl-ex{font-size:18px}
.rwbl-go{position:absolute;right:0;top:0;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 22%,transparent);rotate:-45deg;transition:background .35s,rotate .5s cubic-bezier(.7,0,.2,1),box-shadow .35s}
.rwbl-card:hover .rwbl-go{background:var(--rw-brass);box-shadow:none;rotate:0deg}
.rwbl-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(48px,4.6vw,72px) clamp(24px,2.4vw,40px)}
.rwbl-ask{position:relative;overflow:hidden;isolation:isolate;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:16px;min-height:360px;padding:clamp(28px,2.6vw,40px);border-radius:20px;background:var(--rw-cloud);box-shadow:inset 0 0 0 1px var(--rw-fog)}
.rwbl-ask-rings{position:absolute;z-index:-1;right:clamp(28px,2.6vw,40px);top:clamp(28px,2.6vw,40px);width:14px;height:14px}
.rwbl-ask-rings b{position:absolute;inset:0;border-radius:50%;background:var(--rw-brass)}
.rwbl-ask-rings i{position:absolute;left:50%;top:50%;width:320px;height:320px;margin:-160px 0 0 -160px;border-radius:50%;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--rw-ink) 16%,transparent);animation:rwbl-rg 4.2s cubic-bezier(.2,.6,.3,1) infinite;opacity:0}
.rwbl-ask-rings i:nth-child(2){animation-delay:1.4s} .rwbl-ask-rings i:nth-child(3){animation-delay:2.8s}
.rwbl-ask-k{display:inline-flex;align-items:center;gap:8px;margin:0 0 auto;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--rw-mut)} .rwbl-ask-k i{width:7px;height:7px;border-radius:50%;background:#FF3E88}
.rwbl-ask-t{margin:0;max-width:17ch;font-size:clamp(28px,2.6vw,40px);line-height:1.02;letter-spacing:-.04em}
.rwbl-ask-x{margin:0;max-width:40ch;font-size:16px;line-height:1.5;color:var(--rw-mut)}
.rwbl-nl{position:relative;overflow:hidden;isolation:isolate;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:48px;align-items:end;margin-top:clamp(88px,9vw,140px);padding:clamp(40px,4.4vw,68px);border-radius:32px;background:var(--rw-ink);color:var(--rw-cloud)}
.rwbl-nl-rings{position:absolute;z-index:-1;right:-140px;top:-140px;width:420px;height:420px;pointer-events:none}
.rwbl-nl-rings i{position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--rw-brass) 55%,transparent);animation:rwbl-rg 4.2s cubic-bezier(.2,.6,.3,1) infinite;opacity:0}
.rwbl-nl-rings i:nth-child(2){animation-delay:1.4s} .rwbl-nl-rings i:nth-child(3){animation-delay:2.8s}
@keyframes rwbl-rg{0%{transform:scale(.15);opacity:.9}100%{transform:scale(1);opacity:0}}
.rwbl-nl-l{display:flex;flex-direction:column;gap:20px}
.rwbl-nl-sub{margin:0;max-width:44ch;font-size:16px;line-height:1.5;color:var(--rw-mut)}
.rwbl-form{display:flex;flex-direction:column;gap:12px}
.rwbl-lbl{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--rw-mut)}
.rwbl-row{display:flex;gap:8px;padding:6px;border-radius:999px;background:color-mix(in srgb,var(--rw-cloud) 8%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 18%,transparent);transition:box-shadow .3s}
.rwbl-row:focus-within{box-shadow:inset 0 0 0 1.5px var(--rw-brass)}
.rwbl-form.is-err .rwbl-row{box-shadow:inset 0 0 0 1.5px #FF3E88}
.rwbl-row input{flex:1;min-width:0;min-height:56px;padding:0 20px;border:0;background:transparent;color:var(--rw-cloud);font:inherit;font-size:16px;outline:none}
.rwbl-row input::placeholder{color:color-mix(in srgb,var(--rw-cloud) 45%,transparent)}
.rwbl .rw-dark .rwbl-row input:focus-visible{outline:none!important;box-shadow:none!important}
.rwbl-sbtn{background:none;font:inherit;font-size:14px;font-weight:600;flex:none}
.rwbl .rwbl-sbtn.rw-solid{--face:var(--rw-brass);--fg:var(--rw-ink);--fill:var(--rw-cloud);--fg2:var(--rw-ink);--chip:var(--rw-ink);--chipfg:var(--rw-brass);--chip2:var(--rw-ink);--chipfg2:var(--rw-cloud);--ring:var(--rw-ink)}
.rwbl-note{margin:0;padding-left:20px;font-size:11.5px;letter-spacing:.06em;color:var(--rw-mut)}
.rwbl-form.is-err .rwbl-note{color:#FF7AAE}
.rwbl-ok{position:relative;display:inline-flex;align-items:center;gap:12px;width:max-content;max-width:100%;margin:0;padding:10px 20px 10px 10px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);font-size:13px;line-height:1.35;animation:rwbl-in .6s cubic-bezier(.34,1.56,.64,1)}
.rwbl-ok b{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:50%;background:var(--rw-brass);font-size:15px}
.rwbl-ok>i{position:absolute;right:-3px;top:-3px;width:12px;height:12px;border-radius:50%;background:#FF3E88;box-shadow:0 0 0 2.5px var(--rw-ink)}
.rwbl-ok em{position:absolute;left:10px;top:50%;width:34px;height:34px;margin-top:-17px;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);animation:rw-pingr 1.3s cubic-bezier(.2,.6,.3,1) .2s 3;opacity:0}
@keyframes rwbl-in{0%{scale:.5;opacity:0}100%{scale:1;opacity:1}}
.rwbl.is-tab .rwbl-top{flex-direction:column;align-items:flex-start;gap:28px}
.rwbl.is-tab .rwbl-card.is-feat{grid-template-columns:1fr;align-items:start}
.rwbl.is-tab .rwbl-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.rwbl.is-tab .rwbl-nl{grid-template-columns:1fr;align-items:start}
.rwbl.is-ph{padding-top:128px}
.rwbl.is-ph .rwbl-top{flex-direction:column;align-items:flex-start;gap:24px}
.rwbl.is-ph .rwbl-lead{font-size:17px}
.rwbl.is-ph .rwbl-chips{flex-wrap:nowrap;overflow-x:auto;margin-left:-20px;margin-right:-20px;padding-left:20px;padding-right:20px;scrollbar-width:none;padding-bottom:6px;margin-bottom:calc(clamp(28px,3vw,44px) - 2px);scroll-padding:0 20px}
.rwbl.is-ph .rwbl-chips::-webkit-scrollbar{display:none} .rwbl.is-ph .rwbl-chip{flex:none}
.rwbl.is-ph .rwbl-card.is-feat{grid-template-columns:1fr;gap:20px;align-items:start}
.rwbl.is-ph .rwbl-card.is-feat .rwbl-cov{aspect-ratio:4/3.2;border-radius:20px}
.rwbl.is-ph .rwbl-card.is-feat .rwbl-t{font-size:30px}
.rwbl.is-ph .rwbl-grid{grid-template-columns:1fr;gap:44px}
.rwbl.is-ph .rwbl-t{font-size:24px}
.rwbl.is-ph .rwbl-nl{grid-template-columns:1fr;gap:28px;padding:32px 22px;border-radius:26px}
.rwbl.is-ph .rwbl-row{flex-direction:column;border-radius:24px;padding:6px}
.rwbl.is-ph .rwbl-sbtn{width:100%} .rwbl.is-ph .rwbl-sbtn .rw-face{justify-content:space-between}
.rwbl.is-ph .rwbl-note{padding-left:6px}
@media (prefers-reduced-motion:reduce){.rwbl-card{--u:1!important} .rwbl-img{clip-path:none!important} .rwbl-nl-rings i,.rwbl-ask-rings i{animation:none;opacity:.25}}`
addPropertyControls(RwBlogList, {
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "Journal" },
  heading: { type: ControlType.String, title: "Heading", description: "| = line break, *words* = lime marker", defaultValue: "Ideas we|*test* first.", displayTextArea: true },
  lead: { type: ControlType.String, title: "Lead", defaultValue: "What we learn running SEO, social and paid campaigns every week, written up in plain words so you can use it too.", displayTextArea: true },
  stat: { type: ControlType.String, title: "Pop-up", description: "icon|text — empty hides it", defaultValue: "▲|2.4k reads this week" },
  allLabel: { type: ControlType.String, title: "All filter", defaultValue: "All" },
  featuredLabel: { type: ControlType.String, title: "Featured tag", description: "Empty hides it", defaultValue: "Latest" },
  readSuffix: { type: ControlType.String, title: "Read label", defaultValue: "read" },
  emptyText: { type: ControlType.String, title: "Empty text", defaultValue: "No articles in this topic yet." },
  askLabel: { type: ControlType.String, title: "Gap card label", defaultValue: "Your turn" },
  askTitle: { type: ControlType.String, title: "Gap card title", description: "Fills the empty grid slots. Empty hides it", defaultValue: "Got a tactic you want us to test?" },
  askText: { type: ControlType.String, title: "Gap card text", defaultValue: "Send it over. If it works for a client, we write it up here.", displayTextArea: true },
  askButton: { type: ControlType.String, title: "Gap card button", defaultValue: "Send it to us" },
  nlLabel: { type: ControlType.String, title: "Newsletter label", defaultValue: "Newsletter" },
  nlHeading: { type: ControlType.String, title: "Newsletter title", description: "| = line break, *words* = lime", defaultValue: "One tested idea,|every *Tuesday*.", displayTextArea: true },
  nlSub: { type: ControlType.String, title: "Newsletter text", defaultValue: "One short email with a tactic we tried for a client that week, the numbers it moved, and how to copy it.", displayTextArea: true },
  nlPlaceholder: { type: ControlType.String, title: "Placeholder", defaultValue: "you@company.com" },
  nlButton: { type: ControlType.String, title: "Subscribe button", defaultValue: "Subscribe" },
  nlEndpoint: { type: ControlType.String, title: "Endpoint", description: "Optional URL that receives a JSON POST {email}. Empty = show the success state only" , defaultValue: "" },
  nlSuccess: { type: ControlType.String, title: "Success text", defaultValue: "You're in. The first email lands on Tuesday." },
  nlError: { type: ControlType.String, title: "Error text", defaultValue: "Enter a valid email address." },
  nlNote: { type: ControlType.String, title: "Note", defaultValue: "4,200+ marketers read it · unsubscribe any time" },
})
