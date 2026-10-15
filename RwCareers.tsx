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
const SW_BUILD = "RwCareers@cms1"
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

// ===== RwCareers =====
interface CareersProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  rolesEyebrow: string; rolesHeading: string; rolesSub: string; roles: string; hiringLabel: string; applyLabel: string; emptyRoles: string; openLabel: string; openLink: string
  perksEyebrow: string; perksHeading: string; perks: string
  processEyebrow: string; processHeading: string; process: string; style?: CSSProperties
}
// ---- THE OPENINGS (/careers): open roles as signal lines, perks as cards that flip in, and a 4-step hiring strip.
// Scroll mechanic: every role row has a lime SIGNAL that travels along its bottom wire as the row rises through the viewport (per-row progress);
// when it reaches the end the row LIGHTS (department pill + Apply go lime, the node pings, title to full ink). Perk cards flip in with a stagger when the grid enters. ----
const CA_ICO: string[] = [
  "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 12h17M12 3c2.6 2.5 3.9 5.5 3.9 9s-1.3 6.5-3.9 9c-2.6-2.5-3.9-5.5-3.9-9S9.4 5.5 12 3z",
  "M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
  "M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5zM4 5.5v15M20 5.5v15",
  "M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10zM12 10.5v4M10 12.5h4",
  "M3.5 18.5h17M5 18.5V11h14v7.5M8 11V7.5h8V11M8 18.5v2M16 18.5v2",
  "M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12zM14.5 2.8A8.5 8.5 0 0 1 21.2 9.5h-6.7z",
]
const CaIco = ({ i }: { i: number }) => (<svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={CA_ICO[i % CA_ICO.length]} /></svg>)
const caPairs = (s: string) => listOf(s).map((x) => { const i = x.indexOf(":"); return i < 0 ? { t: x, b: "" } : { t: x.slice(0, i).trim(), b: x.slice(i + 1).trim() } })
export default function RwCareers(props: CareersProps) {
  const { rolesEyebrow = "(01) Open roles", rolesHeading = "We're hiring|*specialists*.", rolesSub = "", roles = "Senior SEO Strategist:SEO:Remote (US):Full-time;Social Media Producer:Social:New York:Full-time;Paid Ads Specialist:Paid ads:Remote (US):Full-time",
    hiringLabel = "open roles", applyLabel = "Apply", emptyRoles = "No open roles right now. We still read every open application.", openLabel = "Don't see your role? Send an open application", openLink = "",
    perksEyebrow = "(02) Perks", perksHeading = "Good people.|*Real* perks.", perks = "Remote-first:Work from anywhere in US time zones;4-day summer weeks:June to August;$2k learning budget:Courses, books, conferences;Health + dental:100% covered for you;Home office:$1,000 setup;Profit share:Everyone gets a slice",
    processEyebrow = "(03) How we hire", processHeading = "Four steps,|about *ten* days.", process = "Apply:Send your CV and two pieces of work you're proud of.;Intro call:30 minutes with the lead of the team you'd join.;Paid test task:A real brief, paid at our day rate, done in your own time.;Offer:A written offer, usually within ten days of applying.", bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill(); const site = useSite()
  const Dh: CSSProperties = { ...D, fontWeight: props.customFonts ? D.fontWeight : ("var(--rw-font-dw, 700)" as any) }
  const root = useRef<HTMLElement>(null); const perkRef = useRef<HTMLDivElement>(null); const procRef = useRef<HTMLDivElement>(null)
  const { w } = useSize(root, bpHint); const phone = w < 810, tab = w >= 810 && w < 1100
  useMagnet(root, live)
  const on = useOn(root, live, rm); const pOn = useOn(perkRef, live, rm, 0.2); const sOn = useOn(procRef, live, rm, 0.3)
  const RL = listOf(roles).map((x) => { const p = x.split(":").map((y) => y.trim()); return { t: p[0] || "", d: p[1] || "", l: p[2] || "", k: p[3] || "" } }).filter((r) => r.t)
  const PK = caPairs(perks), PR = caPairs(process)
  const settled = still || rm || !live
  const mail = (subj: string) => `mailto:${site.email || ""}?subject=${encodeURIComponent(subj)}`
  // ---- the signal wires: per-row progress (reads first, writes after); lit flag written only when it flips ----
  useEffect(() => { if (!live || rm || !root.current) return; const el = root.current; let vis = true, items: HTMLElement[] = [], tops: number[] = [], vh = 1
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting }, { rootMargin: "20% 0px 20% 0px" }); io.observe(el)
    const last = new WeakMap<HTMLElement, number>()
    const read = () => { if (!vis) return; items = Array.from(el.querySelectorAll<HTMLElement>(".rwca-role")); vh = window.innerHeight || 1; tops = items.map((n) => n.getBoundingClientRect().top) }
    const off = onTick(() => { if (!vis) return; items.forEach((n, i) => { const raw = clamp01((vh * (phone ? 0.92 : 0.88) - tops[i]) / (vh * (phone ? 0.42 : 0.36))); const p = last.get(n); const u = p === undefined ? raw : p + (raw - p) * 0.2; const uu = Math.abs(raw - u) < 0.008 ? raw : u
      if (p !== undefined && Math.abs(p - uu) < 0.0015) return; last.set(n, uu); n.style.setProperty("--u", uu.toFixed(3)); const lit = uu > 0.985; if (lit !== n.hasAttribute("data-lit")) n.toggleAttribute("data-lit", lit) }) }, read)
    return () => { off(); io.disconnect() } }, [live, rm, phone, RL.length])
  return (
    <section ref={root as any} className={`rw rw-sec rwca${phone ? " is-ph" : tab ? " is-tab" : ""}${on ? " is-on" : ""}${settled ? " is-set" : ""}`} style={{ ...cssVars(c), ...B, ...(props.style || {}) }}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_MOTION + CSS_CAREERS + siteFontCss(props) }} />
      <div className="rw-wrap">
        {/* ---- open roles ---- */}
        <div className="rwca-roles">
          <div className="rwca-hd">
            <div className="rwca-hl">
              <Eyebrow text={rolesEyebrow} on={on} M={M} />
              <Head text={rolesHeading} on={on} D={Dh} size="clamp(40px,4.6vw,68px)" lh={0.95} delay={120} />
            </div>
            <div className="rwca-hr" style={rise(on, 360)}>
              {rolesSub && <p className="rwca-sub">{rolesSub}</p>}
              {RL.length > 0 && hiringLabel && <span className="rwca-count" style={M}><b style={Dh}>{RL.length}</b>{hiringLabel}<i aria-hidden /></span>}
            </div>
          </div>
          {RL.length === 0 ? <p className="rwca-empty">{emptyRoles}</p> : (
            <ul className="rwca-list">
              {RL.map((r, i) => (
                <li key={r.t + i} className="rwca-role" style={rise(on, 200 + i * 90, 18)}>
                  <a className="rwca-ra" href={mail(`Application – ${r.t}`)} aria-label={`${applyLabel}: ${r.t}${r.l ? ", " + r.l : ""}${r.k ? ", " + r.k : ""}`}>
                    <span className="rwca-node" aria-hidden><i /></span>
                    {r.d && <span className="rwca-dept" style={M}>{r.d}</span>}
                    <span className="rwca-t" style={Dh}>{r.t}</span>
                    <span className="rwca-loc" style={M}>{r.l && <span><svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>{r.l}</span>}{r.k && <span>{r.k}</span>}</span>
                    <span className="rwca-apply" style={M}><span className="rwca-al">{applyLabel}</span><span className="rwca-aa"><IcoArrow s={15} /></span></span>
                  </a>
                  <span className="rwca-wire" aria-hidden><i className="rwca-beam" /><i className="rwca-head" /></span>
                </li>))}
            </ul>)}
          {openLabel && <a className="rwca-open" href={openLink || mail("Open application")} style={rise(on, 520, 14)}><span className="rwca-open-d" aria-hidden /><span>{openLabel}</span><IcoArrow s={15} /></a>}
        </div>
        {/* ---- perks ---- */}
        {PK.length > 0 && (
          <div ref={perkRef} className={`rwca-perks${pOn ? " is-on" : ""}`}>
            <div className="rwca-hd rwca-hd2">
              <div className="rwca-hl">
                <Eyebrow text={perksEyebrow} on={pOn} M={M} />
                <Head text={perksHeading} on={pOn} D={Dh} size="clamp(40px,4.6vw,68px)" lh={0.95} delay={100} />
              </div>
            </div>
            <div className="rwca-pg">
              {PK.map((p, i) => (
                <div key={p.t + i} className="rwca-perk" style={{ transitionDelay: `${(phone ? i * 70 : (i % 3) * 110 + Math.floor(i / 3) * 170) + 150}ms` }}>
                  <div className="rwca-pk-top"><span className="rwca-ico"><CaIco i={i} /><i aria-hidden /></span><span className="rwca-pn" style={M}>{String(i + 1).padStart(2, "0")}</span></div>
                  <h3 className="rwca-pt" style={Dh}>{p.t}</h3>
                  {p.b && <p className="rwca-pb">{p.b}</p>}
                </div>))}
            </div>
          </div>)}
        {/* ---- hiring process ---- */}
        {PR.length > 0 && (
          <div ref={procRef} className={`rwca-proc${sOn ? " is-on" : ""}`}>
            <div className="rwca-hd rwca-hd2">
              <div className="rwca-hl">
                <Eyebrow text={processEyebrow} on={sOn} M={M} />
                <Head text={processHeading} on={sOn} D={Dh} size="clamp(40px,4.6vw,68px)" lh={0.95} delay={100} />
              </div>
            </div>
            <ol className={`rwca-steps rwca-s${Math.min(PR.length, 6)}`}>
              {PR.map((s, i) => (
                <li key={s.t + i} className="rwca-step" style={{ transitionDelay: `${200 + i * 140}ms` }}>
                  <span className="rwca-sn" style={M}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="rwca-st" style={Dh}>{s.t}</h3>
                  {s.b && <p className="rwca-sb">{s.b}</p>}
                </li>))}
            </ol>
          </div>)}
      </div>
    </section>
  )
}
const CSS_CAREERS = `
.rwca{background:var(--rw-bone);color:var(--rw-ink);padding:clamp(96px,10vw,150px) 0}
.rwca .rw-it{position:relative;color:var(--rw-ink);font-weight:inherit;padding:0 .06em;isolation:isolate}
.rwca .rw-it::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:.1em;bottom:.02em;border-radius:.14em;background:var(--rw-brass);transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.7,0,.2,1) .7s}
.rwca .rw-hd.is-on .rw-it::before{transform:none}
.rwca-hd{display:flex;align-items:flex-end;justify-content:space-between;gap:40px;margin-bottom:clamp(36px,4vw,60px)}
.rwca-hl{display:flex;flex-direction:column;gap:22px}
.rwca-hr{display:flex;flex-direction:column;align-items:flex-end;gap:18px;max-width:380px;text-align:right}
.rwca-sub{margin:0;font-size:17px;line-height:1.5;color:var(--rw-mut)}
.rwca-count{position:relative;display:inline-flex;align-items:center;gap:10px;padding:6px 16px 6px 6px;border-radius:999px;background:var(--rw-cloud);font-size:12px;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 14px 30px -18px rgba(0,0,0,.4)}
.rwca-count b{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--rw-brass);font-size:14px;letter-spacing:0}
.rwca-count>i{position:absolute;right:-3px;top:-3px;width:10px;height:10px;border-radius:50%;background:#FF3E88;box-shadow:0 0 0 2px var(--rw-bone)}
.rwca-empty{margin:0;padding:40px 0;border-top:1px solid var(--rw-fog);border-bottom:1px solid var(--rw-fog);font-size:18px;color:var(--rw-mut)}
.rwca-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--rw-fog)}
.rwca-role{--u:1;position:relative}
.rwca:not(.is-set) .rwca-role{--u:0}
.rwca-ra{position:relative;display:grid;grid-template-columns:28px 130px minmax(0,1fr) auto auto;align-items:center;gap:24px;min-height:120px;padding:26px 16px 26px 4px;text-decoration:none;color:inherit;border-radius:18px;transition:background .4s}
.rwca-ra::before{content:"";position:absolute;inset:6px -12px;border-radius:18px;background:color-mix(in srgb,var(--rw-ink) 4.5%,transparent);opacity:0;transition:opacity .4s;z-index:-1}
.rwca-ra:hover::before{opacity:1}
.rwca-node{position:relative;display:grid;place-items:center;width:28px;height:28px}
.rwca-node::before{content:"";width:9px;height:9px;border-radius:50%;background:color-mix(in srgb,var(--rw-ink) 22%,transparent);transition:background .4s,scale .5s cubic-bezier(.34,1.56,.64,1)}
.rwca-node i{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);opacity:0}
.rwca-role[data-lit] .rwca-node::before,.rwca.is-set .rwca-role .rwca-node::before{background:var(--rw-brass);scale:1.35;box-shadow:0 0 0 1.5px var(--rw-ink)}
.rwca-role[data-lit] .rwca-node i{animation:rw-pingr 1.4s cubic-bezier(.2,.6,.3,1) 2}
.rwca-dept{justify-self:start;padding:7px 13px;border-radius:999px;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 20%,transparent);transition:background .5s,box-shadow .5s}
.rwca-role[data-lit] .rwca-dept,.rwca.is-set .rwca-role .rwca-dept{background:var(--rw-brass);box-shadow:none}
.rwca-t{font-size:clamp(26px,2.4vw,38px);line-height:1.05;letter-spacing:-.04em;opacity:calc(.38 + var(--u)*.62)}
.rwca-loc{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--rw-mut);justify-content:flex-end}
.rwca-loc>span{display:inline-flex;align-items:center;gap:6px} .rwca-loc svg{width:14px;height:14px}
.rwca-apply{display:inline-flex;align-items:center;gap:10px;min-height:48px;padding:0 6px 0 20px;border-radius:999px;background:var(--rw-ink);color:var(--rw-bone);font-size:12px;letter-spacing:.1em;text-transform:uppercase;transition:background .5s,color .5s}
.rwca-aa{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:color-mix(in srgb,var(--rw-bone) 14%,transparent);transition:background .4s,rotate .5s cubic-bezier(.7,0,.2,1);rotate:-45deg}
.rwca-role[data-lit] .rwca-apply,.rwca.is-set .rwca-role .rwca-apply{background:var(--rw-brass);color:var(--rw-ink)} .rwca-role[data-lit] .rwca-aa,.rwca.is-set .rwca-role .rwca-aa{background:var(--rw-ink);color:var(--rw-brass)}
.rwca-ra:hover .rwca-aa{rotate:0deg} .rwca-ra:hover .rwca-apply{background:var(--rw-ink);color:var(--rw-bone)} .rwca-ra:hover .rwca-apply .rwca-aa{background:var(--rw-brass);color:var(--rw-ink)}
.rwca-wire{position:absolute;left:0;right:0;bottom:-1px;height:1px;background:var(--rw-fog);pointer-events:none}
.rwca-beam{position:absolute;left:0;top:-.5px;height:2px;width:100%;background:linear-gradient(90deg,color-mix(in srgb,var(--rw-brass) 20%,transparent),var(--rw-brass));transform-origin:0 50%;transform:scaleX(var(--u));border-radius:2px}
.rwca-head{position:absolute;left:0;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--rw-brass);box-shadow:0 0 0 4px color-mix(in srgb,var(--rw-brass) 30%,transparent),0 0 18px 4px color-mix(in srgb,var(--rw-brass) 60%,transparent);translate:calc(var(--u)*100cqw) 0;opacity:clamp(0,min(calc(var(--u)*40),calc((1 - var(--u))*40)),1)}
.rwca-wire{container-type:inline-size}
.rwca-open{display:inline-flex;align-items:center;gap:12px;margin-top:28px;min-height:44px;font-size:16px;font-weight:600;text-decoration:none;color:var(--rw-ink)}
.rwca-open svg{flex:none;transition:translate .45s cubic-bezier(.7,0,.2,1)} .rwca-open:hover svg{translate:5px 0}
.rwca-open{background:linear-gradient(var(--rw-ink),var(--rw-ink)) 0 calc(100% - 8px)/0% 1.5px no-repeat;transition:background-size .6s cubic-bezier(.7,0,.2,1)} .rwca-open:hover{background-size:100% 1.5px}
.rwca-open-d{width:8px;height:8px;border-radius:50%;background:#FF3E88;animation:rw-blink 1.4s ease-in-out infinite}
.rwca-perks{margin-top:clamp(110px,11vw,170px)}
.rwca-hd2{margin-bottom:clamp(32px,3.6vw,52px)}
.rwca-pg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(14px,1.4vw,22px);perspective:1400px}
.rwca-perk{position:relative;display:flex;flex-direction:column;gap:12px;min-height:250px;padding:clamp(24px,2.2vw,32px);border-radius:22px;background:var(--rw-cloud);box-shadow:inset 0 0 0 1px var(--rw-fog);transform-origin:50% 0;transform:rotateX(-78deg) translateY(10px);opacity:0;transition:transform 1.1s cubic-bezier(.2,.85,.25,1),opacity .6s ease,box-shadow .4s,translate .5s cubic-bezier(.34,1.56,.64,1);backface-visibility:hidden}
.rwca-perks.is-on .rwca-perk,.rwca.is-set .rwca-perk{transform:none;opacity:1}
.rwca-perk:hover{translate:0 -6px;box-shadow:inset 0 0 0 1px var(--rw-fog),0 26px 50px -30px rgba(0,0,0,.35)}
.rwca-pk-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:auto;padding-bottom:28px}
.rwca-ico{position:relative;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:var(--rw-brass);color:var(--rw-ink)}
.rwca-ico svg{width:24px;height:24px}
.rwca-ico i{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);opacity:0}
.rwca-perk:hover .rwca-ico i{animation:rw-pingr 1.2s cubic-bezier(.2,.6,.3,1) 2}
.rwca-pn{font-size:12px;letter-spacing:.1em;color:var(--rw-mut)}
.rwca-pt{margin:0;font-size:clamp(24px,2vw,30px);line-height:1.05;letter-spacing:-.04em}
.rwca-pb{margin:0;font-size:16px;line-height:1.5;color:var(--rw-mut)}
.rwca-proc{margin-top:clamp(110px,11vw,170px)}
.rwca-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(20px,2.4vw,40px);position:relative}
.rwca-s1{grid-template-columns:1fr} .rwca-s2{grid-template-columns:repeat(2,minmax(0,1fr))} .rwca-s3{grid-template-columns:repeat(3,minmax(0,1fr))} .rwca-s5{grid-template-columns:repeat(5,minmax(0,1fr))} .rwca-s6{grid-template-columns:repeat(6,minmax(0,1fr))}
.rwca-step{position:relative;display:flex;flex-direction:column;gap:12px;padding-top:30px;border-top:1px solid color-mix(in srgb,var(--rw-ink) 18%,transparent);opacity:0;translate:0 18px;transition:opacity .8s ease,translate 1s cubic-bezier(.2,.8,.2,1)}
.rwca-step::before{content:"";position:absolute;left:0;top:-1px;height:2px;width:100%;background:var(--rw-ink);transform:scaleX(0);transform-origin:0 50%;transition:transform 1s cubic-bezier(.7,0,.2,1);transition-delay:inherit}
.rwca-step::after{content:"";position:absolute;left:0;top:-6px;width:11px;height:11px;border-radius:50%;background:var(--rw-bone);box-shadow:inset 0 0 0 2px var(--rw-ink);transition:background .4s}
.rwca-proc.is-on .rwca-step,.rwca.is-set .rwca-step{opacity:1;translate:0 0} .rwca-proc.is-on .rwca-step::before,.rwca.is-set .rwca-step::before{transform:scaleX(1)}
.rwca-step:hover::after{background:var(--rw-brass)}
.rwca-step:last-child::after{background:var(--rw-brass);box-shadow:inset 0 0 0 2px var(--rw-ink),0 0 0 5px color-mix(in srgb,var(--rw-brass) 35%,transparent)}
.rwca-sn{font-size:12px;letter-spacing:.1em;color:var(--rw-mut)}
.rwca-st{margin:0;font-size:clamp(24px,2vw,30px);line-height:1.05;letter-spacing:-.04em}
.rwca-sb{margin:0;font-size:16px;line-height:1.5;color:var(--rw-mut);max-width:32ch}
.rwca.is-tab .rwca-ra{grid-template-columns:28px minmax(0,1fr) auto;grid-template-areas:"n d a" "n t a" "n l a";row-gap:10px;column-gap:20px}
.rwca.is-tab .rwca-node{grid-area:n;align-self:start;margin-top:4px} .rwca.is-tab .rwca-dept{grid-area:d} .rwca.is-tab .rwca-t{grid-area:t} .rwca.is-tab .rwca-loc{grid-area:l;justify-content:flex-start} .rwca.is-tab .rwca-apply{grid-area:a}
.rwca.is-tab .rwca-pg{grid-template-columns:repeat(2,minmax(0,1fr))}
.rwca.is-tab .rwca-steps{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:44px}
.rwca.is-ph .rwca-hd{flex-direction:column;align-items:flex-start;gap:22px} .rwca.is-ph .rwca-hr{align-items:flex-start;text-align:left}
.rwca.is-ph .rwca-ra{grid-template-columns:22px minmax(0,1fr);grid-template-areas:"n d" "n t" "n l" "n a";row-gap:12px;column-gap:14px;padding:24px 0 26px}
.rwca.is-ph .rwca-ra::before{inset:4px -10px}
.rwca.is-ph .rwca-node{grid-area:n;align-self:start;width:22px;height:22px;margin-top:4px} .rwca.is-ph .rwca-dept{grid-area:d} .rwca.is-ph .rwca-t{grid-area:t;font-size:27px} .rwca.is-ph .rwca-loc{grid-area:l;justify-content:flex-start} .rwca.is-ph .rwca-apply{grid-area:a;justify-self:start;margin-top:4px}
.rwca.is-ph .rwca-pg{grid-template-columns:1fr}
.rwca.is-ph .rwca-perk{min-height:0}
.rwca.is-ph .rwca-steps{grid-template-columns:1fr;row-gap:32px}
.rwca.is-ph .rwca-open{font-size:15px;line-height:1.35}
@media (prefers-reduced-motion:reduce){.rwca-role{--u:1!important} .rwca-perk,.rwca-step{transform:none!important;opacity:1!important;translate:0 0!important} .rwca-step::before{transform:scaleX(1)!important} .rwca-open-d{animation:none}}`
addPropertyControls(RwCareers, {
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  rolesEyebrow: { type: ControlType.String, title: "Roles label", defaultValue: "(01) Open roles" },
  rolesHeading: { type: ControlType.String, title: "Roles title", description: "| = line break, *words* = lime marker", defaultValue: "We're hiring|*specialists*.", displayTextArea: true },
  rolesSub: { type: ControlType.String, title: "Roles text", defaultValue: "Small senior teams, real budgets, clients who stay for years. If you like numbers as much as ideas, you'll fit right in.", displayTextArea: true },
  roles: { type: ControlType.String, title: "Roles", description: "Title:Department:Location:Type; … (Apply opens an email to the Site email)", displayTextArea: true, defaultValue: "Senior SEO Strategist:SEO:Remote (US):Full-time;Social Media Producer:Social:New York:Full-time;Paid Ads Specialist:Paid ads:Remote (US):Full-time" },
  hiringLabel: { type: ControlType.String, title: "Count label", description: "Empty hides the count chip", defaultValue: "open roles" },
  applyLabel: { type: ControlType.String, title: "Apply label", defaultValue: "Apply" },
  emptyRoles: { type: ControlType.String, title: "No roles text", defaultValue: "No open roles right now. We still read every open application." },
  openLabel: { type: ControlType.String, title: "Open application", description: "Empty hides it", defaultValue: "Don't see your role? Send an open application" },
  openLink: { type: ControlType.Link, title: "Open app. link", description: "Empty = email to the Site email" },
  perksEyebrow: { type: ControlType.String, title: "Perks label", defaultValue: "(02) Perks" },
  perksHeading: { type: ControlType.String, title: "Perks title", description: "| = line break, *words* = lime marker", defaultValue: "Good people.|*Real* perks.", displayTextArea: true },
  perks: { type: ControlType.String, title: "Perks", description: "Title:Text; … (empty hides the block)", displayTextArea: true, defaultValue: "Remote-first:Work from anywhere in US time zones;4-day summer weeks:June to August;$2k learning budget:Courses, books, conferences;Health + dental:100% covered for you;Home office:$1,000 setup;Profit share:Everyone gets a slice" },
  processEyebrow: { type: ControlType.String, title: "Process label", defaultValue: "(03) How we hire" },
  processHeading: { type: ControlType.String, title: "Process title", description: "| = line break, *words* = lime marker", defaultValue: "Four steps,|about *ten* days.", displayTextArea: true },
  process: { type: ControlType.String, title: "Process", description: "Step:Text; … (empty hides the block)", displayTextArea: true, defaultValue: "Apply:Send your CV and two pieces of work you're proud of.;Intro call:30 minutes with the lead of the team you'd join.;Paid test task:A real brief, paid at our day rate, done in your own time.;Offer:A written offer, usually within ten days of applying." },
})
