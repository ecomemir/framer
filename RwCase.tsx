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
  reviews: [{"slug": "r1", "f1": "Dr. Hannah Lee", "f2": "Owner", "f3": "Northside Dental", "f4": "We went from four new patients a week to four a day. They report every number and explain what they changed.", "f5": "+826% organic visits", "f6": "5", "img": "https://framerusercontent.com/images/YqwmM7lRs3vsXpr2grgwzyJ62LE.webp", "n1": "1"}, {"slug": "r2", "f1": "Marcus Bell", "f2": "Co-founder", "f3": "Kinfolk Coffee", "f4": "Our reels finally look like us. The team shoots, edits and posts, and we just approve.", "f5": "96k followers", "f6": "5", "img": "https://framerusercontent.com/images/YYdQD4OSWKjNOGVWs9tCxMobw8I.webp", "n1": "2"}, {"slug": "r3", "f1": "Priya Nair", "f2": "Growth lead", "f3": "Fitloop", "f4": "The first agency that talks about our margins, not clicks. Ads paid back in eleven days.", "f5": "6.2× ROAS", "f6": "5", "img": "https://framerusercontent.com/images/RqmMNLZRFBKyGJxcMWBx21DI85Q.webp", "n1": "3"}, {"slug": "r4", "f1": "Tom Alvarez", "f2": "Broker", "f3": "Haven Realty", "f4": "Seller leads every week from our own site. We stopped buying leads from portals.", "f5": "122 leads/mo", "f6": "5", "img": "https://framerusercontent.com/images/gv5mT4bQ8T1n4dyt3U0G2Gfwldw.webp", "n1": "4"}, {"slug": "r5", "f1": "Elena Rossi", "f2": "Founder", "f3": "Lumen Skin", "f4": "They built the brand and the launch. We sold out twice in the first month.", "f5": "$142k launch week", "f6": "5", "img": "https://framerusercontent.com/images/FkGV79fUruxxZYYaCa5EOB8RME.webp", "n1": "5"}, {"slug": "r6", "f1": "David Kim", "f2": "Partner", "f3": "Orbit Legal", "f4": "Clients now mention our LinkedIn posts in the first call. That never happened before.", "f5": "57 consults/mo", "f6": "5", "img": "https://framerusercontent.com/images/x1XkAfPNF95aDnEhP091G8c03KY.webp", "n1": "6"}],
  work: [{"slug": "northside-dental", "f1": "Northside Dental", "f2": "From page 4 to the top 3 for “dentist near me”", "f3": "Dental clinic", "f4": "SEO;Content", "f5": "Organic visits a month", "f6": "4,200", "f7": "38,900", "f8": "", "f9": "2025", "f10": "A local SEO rebuild: 60 location pages, 180 reviews and a content plan for every treatment.", "img": "https://framerusercontent.com/images/iQ0lX69C3YgeRjqffxWadnnAmnc.webp", "n1": "1"}, {"slug": "kinfolk-coffee", "f1": "Kinfolk Coffee", "f2": "A coffee brand people film for us", "f3": "Food & drink", "f4": "Social media;Content", "f5": "Instagram followers", "f6": "8,100", "f7": "96,400", "f8": "", "f9": "2025", "f10": "Three reels a week shot in the roasteries turned a local brand into a national one.", "img": "https://framerusercontent.com/images/myjp4zr3op66cJhewFtasNpY5I.webp", "n1": "2"}, {"slug": "fitloop", "f1": "Fitloop", "f2": "Paid ads that pay for themselves in 11 days", "f3": "Fitness app", "f4": "Paid ads", "f5": "Return on ad spend", "f6": "1.4", "f7": "6.2", "f8": "×", "f9": "2025", "f10": "We rebuilt the Meta account around creative testing and cut the cost per trial by 58%.", "img": "https://framerusercontent.com/images/hd4rblq8DW7sPIt8FWcRq1HdmQ0.webp", "n1": "3"}, {"slug": "haven-realty", "f1": "Haven Realty", "f2": "A pipeline of sellers, not just clicks", "f3": "Real estate", "f4": "Paid ads;Web design", "f5": "Seller leads a month", "f6": "14", "f7": "122", "f8": "", "f9": "2024", "f10": "A new site with valuation landing pages and Google campaigns for every neighbourhood.", "img": "https://framerusercontent.com/images/zEqvjQAlVPs2PE6oz2TsexQ8TA.webp", "n1": "4"}, {"slug": "lumen-skin", "f1": "Lumen Skin", "f2": "A skincare launch that sold out twice", "f3": "Beauty", "f4": "Social media;Branding", "f5": "Launch-week revenue", "f6": "$18k", "f7": "$142k", "f8": "", "f9": "2024", "f10": "Brand, creators and a TikTok launch plan built in six weeks.", "img": "https://framerusercontent.com/images/QSuLrUGcfrrneXqjDG4ZKyC91Gk.webp", "n1": "5"}, {"slug": "orbit-legal", "f1": "Orbit Legal", "f2": "Thought leadership that books consultations", "f3": "Law firm", "f4": "Content;SEO", "f5": "Consultations a month", "f6": "9", "f7": "57", "f8": "", "f9": "2024", "f10": "Weekly LinkedIn posts and long-form guides that rank and get shared by clients.", "img": "https://framerusercontent.com/images/csWXqRpXZMLSqxx74oKZj5QkJw.webp", "n1": "6"}]
}
const SW_BUILD = "RwCase@cms1"
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

// ===== RwCase =====
interface CaseProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  slug: string; backLabel: string; backLink: string; caseLabel: string; clientLabel: string; industryLabel: string; yearLabel: string; servicesLabel: string
  beforeLabel: string; afterLabel: string; dragLabel: string; sliderLabel: string; growthLabel: string; chartLabel: string
  challengeTitle: string; challengeText: string; didTitle: string; didFirst: string; didSteps: string; didLast: string; resultTitle: string; resultText: string
  nextLabel: string; ctaTitle: string; ctaText: string; ctaButton: string; ctaLink: string; style?: CSSProperties
}
// ---- THE CASE (/work/:slug): dark top → chalk article. The h1 is the case Title. A full-width BEFORE/AFTER viewer of this case (the RwWork compare
// viewer: the cover twice, greyscale+flat line vs colour+rising line, a draggable divider that scroll slides from 85% → 15% while the AFTER number counts),
// a result strip (Before → After, a line chart that draws, the growth multiple), then the story in three blocks with a READING RAIL (a lime line that fills
// as you read, the block you are in lights up), the client's review if there is one, the next case and the CTA. ----
const csParse = (s: string) => { const m = String(s || "").trim().match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/); if (!m) return null; const raw = m[2]; return { pre: m[1], n: parseFloat(raw.replace(/,/g, "")), dec: (raw.split(".")[1] || "").length, grp: raw.includes(","), suf: m[3] } }
const csFmt = (n: number, dec: number, grp: boolean) => n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: grp || Math.abs(n) >= 10000 })
const csHash = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }
const csRise = (slug: string) => { const h = csHash(slug); const N = 13; const pts: [number, number][] = []
  for (let i = 0; i < N; i++) { const t = i / (N - 1); const base = 276 - Math.pow(t, 1.7) * 236; const wig = i === 0 || i === N - 1 ? 0 : (((h >> (i % 10) * 3) & 7) - 3.5) * 7; pts.push([t * 1000, Math.max(22, Math.min(290, base + wig))]) }
  let d = `M${pts[0][0]},${pts[0][1]}`; for (let i = 1; i < N; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}` } return d }
const csFlat = (slug: string) => { const h = csHash(slug + "b"); let d = "M0,262"; for (let i = 1; i <= 12; i++) { const y = 262 + (((h >> (i % 10) * 3) & 7) - 3.5) * 2.2; d += ` L${(i / 12) * 1000},${y.toFixed(1)}` } return d }
const csPairs = (s: string) => listOf(s).map((x) => { const i = x.indexOf(":"); return i < 0 ? { k: "", v: x } : { k: x.slice(0, i).trim(), v: x.slice(i + 1).trim() } })
const CS_DV0 = 0.85, CS_DV1 = 0.15
export default function RwCase(props: CaseProps) {
  const { slug = "", backLabel = "All case studies", backLink = "/work", caseLabel = "Case study", clientLabel = "Client", industryLabel = "Industry", yearLabel = "Year", servicesLabel = "Services",
    beforeLabel = "Before", afterLabel = "After", dragLabel = "Drag", sliderLabel = "Compare before and after", growthLabel = "Growth", chartLabel = "Month by month · last 12 months",
    challengeTitle = "The challenge", challengeText = "", didTitle = "What we did", didFirst = "", didSteps = "", didLast = "", resultTitle = "The result", resultText = "",
    nextLabel = "Next case", ctaTitle = "Want a before and after like this?", ctaText = "A free 30-minute audit: we look at your site, ads and search, and show you the fastest win.", ctaButton = "Get results like this", ctaLink = "", bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill(); const site = useSite()
  const { row, rows } = useRow("work", SEED.work || [], slug); const reviews = useCMS("reviews", SEED.reviews || [])
  const root = useRef<HTMLElement>(null); const view = useRef<HTMLDivElement>(null); const handle = useRef<HTMLDivElement>(null); const numEl = useRef<HTMLSpanElement>(null); const chip = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLDivElement>(null); const art = useRef<HTMLDivElement>(null); const stripNum = useRef<HTMLElement>(null)
  const { w } = useSize(root, bpHint); const phone = w < 810, tab = w >= 810 && w < 1100
  const on = useOn(root, live, rm); useMagnet(root, live)
  const final = still || rm || !live
  const unit = row.f8 || ""; const Aft = csParse(row.f7), Bef = csParse(row.f6)
  const txtAt = (t: number) => { if (!Aft) return `${row.f7 || ""}${unit}`; const from = Bef ? Bef.n : 0; return `${Aft.pre}${csFmt(from + (Aft.n - from) * t, Aft.dec, Aft.grp)}${Aft.suf}${unit}` }
  const growth = (() => { if (!Aft || !Bef || !Bef.n) return ""; const r = Aft.n / Bef.n; return r >= 2 ? `${r >= 10 ? Math.round(r) : r.toFixed(1)}×` : `+${Math.round((r - 1) * 100)}%` })()
  const idx = Math.max(0, rows.findIndex((r) => r.slug === row.slug)); const nextRow = rows.length > 1 ? rows[(idx + 1) % rows.length] : null
  const svs = listOf(row.f4)
  const low = (s: string) => String(s || "").trim().toLowerCase()
  const review = reviews.find((r) => low(r.f3) && low(r.f3) === low(row.f1))
  const stepMap = csPairs(pick(didSteps, "SEO:A technical audit, then location pages and a keyword map built around the searches that buy.;Content:An editorial plan and long-form pieces written for search and for people, published every week.;Social media:A weekly shoot, three reels a week and a reply routine for comments and DMs.;Paid ads:An account rebuild, weekly creative tests and budget moved to whatever sells.;Web design:Fast landing pages built for one action each, tested and improved every month.;Branding:A brand workshop, a new identity and templates, so every post and ad looks like one company."))
  const first = csPairs(pick(didFirst, "Week 1 · Audit:We studied the site, the ads, the search results and five competitors, and picked the three fastest wins."))[0]
  const last = csPairs(pick(didLast, "Every Monday · Report:One page with the numbers, what we changed and what comes next. No vanity metrics."))[0]
  const steps = [first, ...svs.map((s) => { const m = stepMap.find((x) => low(x.k) === low(s)); return { k: s, v: m ? m.v : `A ${s.toLowerCase()} plan run by a senior specialist, reviewed every week.` } }), last].filter((x) => x && x.v)
  const fill = (s: string) => s.replace(/\{client\}/g, row.f1 || "").replace(/\{before\}/g, `${row.f6 || ""}${unit}`).replace(/\{after\}/g, `${row.f7 || ""}${unit}`).replace(/\{metric\}/g, low(row.f5)).replace(/\{growth\}/g, growth)
  const challenge = pick(challengeText, "They had a good product and happy customers, but the people who were ready to buy could not find them. Budgets went to channels nobody measured, and nobody could say which month paid for itself.")
  const result = fill(pick(resultText, "{client} went from {before} to {after} {metric} — {growth} — and the plan keeps compounding. Every number on this page comes from the client's own dashboard, not ours."))
  const book = pick(ctaLink, site.book || "/contact")
  // ---- viewer engine (from RwWork): scroll → divider, drag / keys → manual ----
  const E = useRef({ mode: "scroll" as "scroll" | "manual", dv: CS_DV0, man: 0.5 })
  const finalR = useRef(final); finalR.current = final
  const putStatic = (v: number) => { const V = view.current; if (!V) return; V.style.setProperty("--dv", v.toFixed(3)); const a = Math.round(v * 100); handle.current?.setAttribute("aria-valuenow", String(a)); handle.current?.setAttribute("aria-valuetext", `${100 - a}% after`) }
  useEffect(() => { const V = view.current; if (!V) return; const e = E.current; e.mode = "scroll"
    if (final) { V.style.setProperty("--dv", "0.5"); V.style.setProperty("--dt", "1"); if (numEl.current) numEl.current.textContent = `${row.f7 || ""}${unit}`; handle.current?.setAttribute("aria-valuenow", "50"); return }
    let top = 0, h = 1, vh = 1, fresh = false, vis = true, lastDv = -1, lastTxt = "", lastAria = -1
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting }, { rootMargin: "10% 0px 10% 0px" }); io.observe(V)
    const read = () => { if (!vis) { fresh = false; return } const r = V.getBoundingClientRect(); top = r.top; h = r.height; vh = window.innerHeight || 1; fresh = true }
    const off = onTick(() => { if (!fresh) return
      const span = Math.max(80, Math.min(vh * 0.76, vh * 0.88 - (vh * 0.7 - h))); const st = clamp01((vh * 0.88 - top) / span)
      const want = e.mode === "manual" ? e.man : CS_DV0 + (CS_DV1 - CS_DV0) * st
      e.dv = e.mode === "manual" || lastDv < 0 ? want : e.dv + (want - e.dv) * 0.2; if (Math.abs(e.dv - want) < 0.0006) e.dv = want
      if (Math.abs(e.dv - lastDv) > 0.0004 || (e.dv === want && e.dv !== lastDv)) { lastDv = e.dv; V.style.setProperty("--dv", e.dv.toFixed(4)); const t = clamp01((CS_DV0 - e.dv) / (CS_DV0 - CS_DV1)); V.style.setProperty("--dt", t.toFixed(4))
        const tx = txtAt(t); if (tx !== lastTxt && numEl.current) { lastTxt = tx; numEl.current.textContent = tx }
        const a = Math.round(e.dv * 100); if (a !== lastAria && handle.current) { lastAria = a; handle.current.setAttribute("aria-valuenow", String(a)); handle.current.setAttribute("aria-valuetext", `${100 - a}% after`) } } }, read)
    return () => { off(); io.disconnect() } }, [final, row.slug, row.f6, row.f7, unit])
  useEffect(() => { const V = view.current; if (!V || !live) return
    let id = -1, x0 = 0, y0 = 0, drag = false, cx = 0, cy = 0, tx = 0, ty = 0, inside = false; const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches
    const setFrom = (x: number) => { const r = V.getBoundingClientRect(); const e = E.current; e.mode = "manual"; e.man = Math.min(0.97, Math.max(0.03, (x - r.left) / r.width)); if (finalR.current) putStatic(e.man) }
    const dn = (ev: PointerEvent) => { if ((ev.target as HTMLElement).closest?.("a")) return; id = ev.pointerId; x0 = ev.clientX; y0 = ev.clientY; drag = ev.pointerType === "mouse" || (ev.target as HTMLElement).closest?.(".rwcs-handle") !== null; if (drag) { try { V.setPointerCapture(id) } catch (x) {} setFrom(ev.clientX); V.classList.add("is-drag") } }
    const mv = (ev: PointerEvent) => { const r = V.getBoundingClientRect(); tx = ev.clientX - r.left; ty = ev.clientY - r.top; if (!inside) { cx = tx; cy = ty } inside = true
      if (ev.pointerId !== id) return; if (!drag && Math.abs(ev.clientX - x0) > 8 && Math.abs(ev.clientX - x0) > Math.abs(ev.clientY - y0)) { drag = true; try { V.setPointerCapture(id) } catch (x) {} V.classList.add("is-drag") } if (drag) setFrom(ev.clientX) }
    const up = () => { id = -1; drag = false; V.classList.remove("is-drag") }; const lv = () => { inside = false }
    V.addEventListener("pointerdown", dn); V.addEventListener("pointermove", mv); V.addEventListener("pointerup", up); V.addEventListener("pointercancel", up); V.addEventListener("pointerleave", lv)
    const off = fine ? onTick(() => { const ch = chip.current; if (!ch || !inside) return; cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22; ch.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)` }) : () => {}
    return () => { off(); V.removeEventListener("pointerdown", dn); V.removeEventListener("pointermove", mv); V.removeEventListener("pointerup", up); V.removeEventListener("pointercancel", up); V.removeEventListener("pointerleave", lv) } }, [live])
  const onKey = (ev: any) => { const e = E.current; const k = ev.key; let v = e.mode === "manual" ? e.man : e.dv
    if (k === "ArrowLeft" || k === "ArrowDown") v -= 0.05; else if (k === "ArrowRight" || k === "ArrowUp") v += 0.05; else if (k === "Home") v = 0.03; else if (k === "End") v = 0.97; else if (k === "PageDown") v -= 0.2; else if (k === "PageUp") v += 0.2; else return
    ev.preventDefault(); e.mode = "manual"; e.man = Math.min(0.97, Math.max(0.03, v)); if (final) putStatic(e.man) }
  // ---- result strip: the chart draws and the After counts once the strip is in view ----
  const [drawn, setDrawn] = useState(false)
  useEffect(() => { const el = strip.current; if (!el || final) return; const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); setDrawn(true) } }, { threshold: 0.4 }); io.observe(el); return () => io.disconnect() }, [final, row.slug])
  useEffect(() => { if (!drawn || final) return; const t0 = performance.now(); const off = onTick((now) => { const t = clamp01((now - t0 - 250) / 1600); const e = 1 - Math.pow(1 - t, 3); if (stripNum.current) { const tx = txtAt(e); if (stripNum.current.textContent !== tx) stripNum.current.textContent = tx } if (t >= 1) off() }); return off }, [drawn, final, row.slug])
  // ---- reading rail: --rp = how far through the article, the block under the reading line is active ----
  const [act, setAct] = useState(0)
  useEffect(() => { const A = art.current; if (!A || final) return; let vis = true, fresh = false, top = 0, h = 1, vh = 1, tops: number[] = [], last = -1, lastA = -1
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting }, { rootMargin: "10% 0px 10% 0px" }); io.observe(A)
    const read = () => { if (!vis) { fresh = false; return } const r = A.getBoundingClientRect(); top = r.top; h = r.height; vh = window.innerHeight || 1; tops = Array.from(A.querySelectorAll<HTMLElement>(".rwcs-blk")).map((b) => b.getBoundingClientRect().top); fresh = true }
    const off = onTick(() => { if (!fresh) return; const p = clamp01((vh * 0.55 - top) / Math.max(1, h - vh * 0.3)); if (Math.abs(p - last) > 0.001) { last = p; A.style.setProperty("--rp", p.toFixed(4)) }
      let a = 0; tops.forEach((t, i) => { if (t < vh * 0.55) a = i }); if (a !== lastA) { lastA = a; setAct(a) } }, read)
    return () => { off(); io.disconnect() } }, [final, row.slug])
  const rise0 = (d: number, y = 18) => rise(on, d, y)
  const img = RS(imgOr(row), phone ? "100vw" : "92vw"); const rp = csRise(row.slug || "x"); const fp = csFlat(row.slug || "x")
  const blocks = [challengeTitle, didTitle, resultTitle]
  const layer = (cls: string, after: boolean) => (
    <div className={`rwcs-lay ${cls}`}>
      <img src={img.src} srcSet={(img as any).srcSet} sizes={(img as any).sizes} alt={after ? `${row.f1 || ""} — ${row.f2 || ""}` : ""} loading="eager" decoding="async" draggable={false} />
      <i className="rwcs-scrim" />
      {after ? (<>
        <svg className="rwcs-ch rwcs-ch-a" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden><defs><linearGradient id="rwcs-g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--rw-brass)" stopOpacity=".42" /><stop offset="1" stopColor="var(--rw-brass)" stopOpacity="0" /></linearGradient></defs><path d={`${rp} L1000,300 L0,300 Z`} fill="url(#rwcs-g)" /><path d={rp} className="rwcs-ln" vectorEffect="non-scaling-stroke" /></svg>
        <div className="rwcs-num rwcs-num-a"><span className="rwcs-pill is-a" style={M}><i />{afterLabel}</span><span className="rwcs-big" style={D}><span ref={numEl}>{final ? `${row.f7 || ""}${unit}` : `${row.f6 || ""}${unit}`}</span></span></div>
      </>) : (<>
        <svg className="rwcs-ch" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden><path d={fp} className="rwcs-fl" vectorEffect="non-scaling-stroke" /></svg>
        <div className="rwcs-num rwcs-num-b"><span className="rwcs-pill" style={M}>{beforeLabel}</span><span className="rwcs-ghost" style={D}>{`${row.f6 || ""}${unit}`}</span></div>
      </>)}
    </div>)
  return (
    <section ref={root as any} className={`rw rw-sec rwcs${phone ? " is-ph" : tab ? " is-tab" : ""}${on ? " is-on" : ""}${final ? " is-fin" : ""}${drawn || final ? " is-drawn" : ""}`} style={{ ...cssVars(c), ...B, ...(props.style || {}) }}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_MOTION + CSS_CS + siteFontCss(props) }} />
      <div className="rwcs-top rw-dark">
        <div className="rw-wrap">
          <nav className="rwcs-crumb" style={{ ...M, ...rise0(40, 10) }} aria-label="Breadcrumb"><a href={backLink || "/work"}><span className="rwcs-crumb-a" aria-hidden><IcoArrow s={13} /></span>{backLabel}</a>{rows.length > 0 && <span>{caseLabel} {String(idx + 1).padStart(2, "0")} / {String(rows.length).padStart(2, "0")}</span>}</nav>
          <div className="rwcs-head">
            <div className="rwcs-hl">
              <Eyebrow text={[row.f1, row.f3].filter(Boolean).join(" · ")} on={on} M={M} delay={80} />
              <Head text={row.f2 || row.f1 || caseLabel} on={on} D={D} tag="h1" size={phone ? "clamp(40px,11vw,52px)" : "clamp(48px,5.4vw,88px)"} lh={0.95} delay={140} step={40} />
            </div>
            <dl className="rwcs-meta" style={rise0(380, 14)}>
              {row.f1 && <div><dt style={M}>{clientLabel}</dt><dd>{row.f1}</dd></div>}
              {row.f3 && <div><dt style={M}>{industryLabel}</dt><dd>{row.f3}</dd></div>}
              {row.f9 && <div><dt style={M}>{yearLabel}</dt><dd>{row.f9}</dd></div>}
              {svs.length > 0 && <div className="rwcs-meta-s"><dt style={M}>{servicesLabel}</dt><dd className="rwcs-svs" style={M}>{svs.map((s, k) => <span key={k}>{s}</span>)}</dd></div>}
            </dl>
          </div>
          <div ref={view} className="rwcs-view" style={{ ...rise0(460, 30), ["--dv" as any]: final ? 0.5 : CS_DV0, ["--dt" as any]: final ? 1 : 0 }}>
            {layer("rwcs-after", true)}
            {layer("rwcs-before", false)}
            <div className="rwcs-vt" style={M}><span className="rwcs-cl"><i className="rw-port" />{row.f1}{row.f9 ? ` · ${row.f9}` : ""}</span><span className="rwcs-ml">{row.f5}</span></div>
            <div className="rwcs-div" aria-hidden><i /></div>
            <div ref={handle} className="rwcs-handle" role="slider" tabIndex={0} aria-label={sliderLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={final ? 50 : Math.round(CS_DV0 * 100)} onKeyDown={onKey}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div ref={chip} className="rwcs-cur" aria-hidden><b style={M}>{dragLabel}</b></div>
          </div>
          {(row.f5 || row.f7) && (
            <div ref={strip} className="rwcs-strip">
              <div className="rwcs-sc">
                <p className="rwcs-lab" style={M}><i />{row.f5}</p>
                <p className="rwcs-ba" style={D}><s>{`${row.f6 || ""}${unit}`}</s><span aria-hidden>→</span><b ref={stripNum as any}>{final ? `${row.f7 || ""}${unit}` : `${row.f6 || ""}${unit}`}</b></p>
              </div>
              <div className="rwcs-sc rwcs-chart">
                <svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden><path d="M0,299 H1000" className="rwcs-base" vectorEffect="non-scaling-stroke" /><path d={rp} pathLength={1} className="rwcs-draw" vectorEffect="non-scaling-stroke" /></svg>
                <p className="rwcs-lab" style={M}>{chartLabel}</p>
              </div>
              {growth && <div className="rwcs-sc rwcs-gr"><p className="rwcs-lab" style={M}>{growthLabel}</p><p className="rwcs-grn" style={D}>{growth}</p></div>}
            </div>)}
        </div>
      </div>
      <div className="rwcs-art">
        <div className="rw-wrap">
          <div ref={art} className="rwcs-grid" style={{ ["--rp" as any]: final ? 1 : 0 }}>
            <aside className="rwcs-rail" aria-hidden><div className="rwcs-rail-in"><i className="rwcs-rail-l"><b /></i><ol style={M}>{blocks.map((t, i) => <li key={i} className={final || i <= act ? "is-on" : ""}><span>{String(i + 1).padStart(2, "0")}</span>{t}</li>)}</ol></div></aside>
            <i className="rwcs-bar" aria-hidden />
            <div className="rwcs-body">
              <article className="rwcs-blk">
                <p className="rwcs-k" style={M}>(01)</p><h2 className="rwcs-h2" style={D}>{challengeTitle}</h2>
                {row.f10 && <p className="rwcs-lead" style={D}>{row.f10}</p>}
                {challenge && <p className="rwcs-p">{challenge}</p>}
              </article>
              <article className="rwcs-blk">
                <p className="rwcs-k" style={M}>(02)</p><h2 className="rwcs-h2" style={D}>{didTitle}</h2>
                <ol className="rwcs-steps">{steps.map((s, i) => <li key={i}><span className="rwcs-tick" aria-hidden><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" /></svg></span><div><b style={D}>{s.k}</b><p>{s.v}</p></div></li>)}</ol>
              </article>
              <article className="rwcs-blk">
                <p className="rwcs-k" style={M}>(03)</p><h2 className="rwcs-h2" style={D}>{resultTitle}</h2>
                {result && <p className="rwcs-p rwcs-p-l">{result}</p>}
                {review && review.f4 && (
                  <figure className="rwcs-quote rw-dark">
                    <blockquote style={D}>“{review.f4}”</blockquote>
                    <figcaption><img {...RS(imgOr(review), "56px")} alt="" loading="lazy" decoding="async" /><span><b>{review.f1}</b><small style={M}>{[review.f2, review.f3].filter(Boolean).join(" · ")}</small></span>{review.f5 && <em style={M}><i />{review.f5}</em>}</figcaption>
                  </figure>)}
              </article>
            </div>
          </div>
          <div className="rwcs-end">
            <div className="rwcs-cta">
              <h2 className="rwcs-cta-h" style={D}>{ctaTitle}</h2>
              {ctaText && <p>{ctaText}</p>}
              {ctaButton && <Btn href={book} label={ctaButton} kind="solid" icon="cal" />}
            </div>
            {nextRow && (
              <a className="rwcs-next rw-dark" href={`/work/${nextRow.slug || ""}`}>
                <span className="rwcs-next-t"><small style={M}>{nextLabel}<IcoArrow s={13} /></small><b style={D}>{nextRow.f2}</b><span style={M}>{nextRow.f1}{nextRow.f5 ? ` · ${nextRow.f5}` : ""}</span><em style={D}>{nextRow.f6}{nextRow.f8} → <strong>{nextRow.f7}{nextRow.f8}</strong></em></span>
                <span className="rwcs-next-i"><img {...RS(imgOr(nextRow), phone ? "100vw" : "30vw")} alt="" loading="lazy" decoding="async" /></span>
              </a>)}
          </div>
        </div>
      </div>
    </section>
  )
}
const CSS_CS = `
.rwcs{background:var(--rw-bone);color:var(--rw-ink);overflow-x:clip}
.rwcs .rw-hd{font-weight:var(--rw-font-dw,700);letter-spacing:-.045em} .rwcs .rw-it{font-weight:inherit;color:var(--rw-brass)}
.rwcs-top{background:var(--rw-night);color:var(--rw-cloud);padding:clamp(120px,11vw,168px) 0 clamp(64px,7vw,110px)}
.rwcs .rw-eb i{position:relative} .rwcs .rw-eb i::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 1.5px var(--rw-brass);animation:rwcs-ping 1.8s cubic-bezier(.2,.6,.3,1) infinite} @keyframes rwcs-ping{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.8)}}
.rwcs-crumb{display:flex;justify-content:space-between;gap:16px;margin-bottom:clamp(36px,4vw,56px);font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--rw-mut)}
.rwcs-crumb a{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:var(--rw-cloud)} .rwcs-crumb-a{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 30%,transparent);rotate:180deg;transition:background .3s,color .3s,translate .4s cubic-bezier(.34,1.56,.64,1)} .rwcs-crumb a:hover .rwcs-crumb-a{background:var(--rw-brass);color:var(--rw-ink);translate:-3px 0}
.rwcs-head{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:40px clamp(40px,5vw,96px);align-items:end;margin-bottom:clamp(40px,4.4vw,64px)}
.rwcs-hl{display:flex;flex-direction:column;gap:24px;align-items:flex-start}
.rwcs-meta{display:grid;grid-template-columns:1fr 1fr;gap:18px 24px;margin:0;padding-bottom:6px}
.rwcs-meta>div{padding-top:14px;border-top:1px solid color-mix(in srgb,var(--rw-cloud) 16%,transparent)} .rwcs-meta-s{grid-column:1/-1}
.rwcs-meta dt{margin-bottom:6px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--rw-mut)} .rwcs-meta dd{margin:0;font-size:17px;font-weight:500}
.rwcs-svs{display:flex;flex-wrap:wrap;gap:6px} .rwcs-svs span{padding:6px 12px;border-radius:999px;font-size:11px;letter-spacing:.06em;background:var(--rw-brass);color:var(--rw-ink)}
/* viewer */
.rwcs-view{position:relative;aspect-ratio:16/8;max-height:80svh;width:100%;border-radius:24px;overflow:hidden;background:var(--rw-pine);touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:ew-resize;isolation:isolate}
.rwcs-lay{position:absolute;inset:0;overflow:hidden} .rwcs-lay img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.rwcs-after img{scale:calc(1.08 - var(--dt)*.08)}
.rwcs-before{clip-path:inset(0 calc((1 - var(--dv))*100%) 0 0)} .rwcs-before img{filter:grayscale(1) brightness(.46) contrast(1.08)}
.rwcs-scrim{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.42),transparent 26%,transparent 46%,rgba(0,0,0,.72))}
.rwcs-ch{position:absolute;left:0;right:0;bottom:0;width:100%;height:58%;overflow:visible;pointer-events:none} .rwcs-ch-a{transform-origin:50% 100%;transform:scaleY(calc(.14 + var(--dt)*.86))}
.rwcs-ln{fill:none;stroke:var(--rw-brass);stroke-width:3;filter:drop-shadow(0 0 10px color-mix(in srgb,var(--rw-brass) 70%,transparent))} .rwcs-fl{fill:none;stroke:color-mix(in srgb,var(--rw-cloud) 55%,transparent);stroke-width:2;stroke-dasharray:6 7}
.rwcs-num{position:absolute;bottom:clamp(22px,3vw,40px);display:flex;flex-direction:column;gap:12px} .rwcs-num-a{right:clamp(22px,3vw,44px);align-items:flex-end} .rwcs-num-b{left:clamp(22px,3vw,44px);bottom:clamp(76px,8vw,118px);align-items:flex-start}
.rwcs-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in srgb,var(--rw-cloud) 80%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 34%,transparent);background:color-mix(in srgb,var(--rw-night) 30%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.rwcs-pill.is-a{background:var(--rw-brass);color:var(--rw-ink);box-shadow:none} .rwcs-pill.is-a i{width:7px;height:7px;border-radius:50%;background:#FF3E88}
.rwcs-big{font-size:clamp(84px,10.4vw,176px);line-height:.84;letter-spacing:-.06em;font-weight:var(--rw-font-dw,700);color:var(--rw-brass);font-variant-numeric:tabular-nums;white-space:nowrap;text-shadow:0 6px 50px rgba(0,0,0,.35)}
.rwcs-ghost{font-size:clamp(44px,4.8vw,80px);line-height:.9;letter-spacing:-.05em;font-weight:var(--rw-font-dw,700);color:transparent;-webkit-text-stroke:1.4px color-mix(in srgb,var(--rw-cloud) 70%,transparent);white-space:nowrap}
.rwcs-vt{position:absolute;z-index:4;left:clamp(16px,2vw,26px);right:clamp(16px,2vw,26px);top:clamp(16px,2vw,24px);display:flex;justify-content:space-between;gap:12px;pointer-events:none;font-size:11.5px;letter-spacing:.06em}
.rwcs-cl{display:inline-flex;align-items:center;gap:9px;padding:8px 14px 8px 12px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);white-space:nowrap}
.rwcs-ml{display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;text-transform:uppercase;letter-spacing:.12em;font-size:10.5px;color:var(--rw-cloud);background:color-mix(in srgb,var(--rw-night) 40%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 22%,transparent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rwcs-div{position:absolute;z-index:3;top:0;bottom:0;left:calc(var(--dv)*100%);width:0;pointer-events:none} .rwcs-div i{position:absolute;top:0;bottom:0;left:-1px;width:2px;background:var(--rw-cloud);box-shadow:0 0 24px 2px color-mix(in srgb,var(--rw-brass) 55%,transparent)}
.rwcs-handle{position:absolute;z-index:5;top:50%;left:calc(var(--dv)*100%);width:64px;height:64px;translate:-50% -50%;display:grid;place-items:center;border-radius:50%;color:var(--rw-cloud);background:color-mix(in srgb,var(--rw-night) 55%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 0 0 2px var(--rw-brass),0 12px 30px -8px rgba(0,0,0,.6);cursor:ew-resize;transition:scale .5s cubic-bezier(.34,1.56,.64,1),background .3s}
.rwcs-handle::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);animation:rwcs-hp 2.2s cubic-bezier(.2,.6,.3,1) infinite} @keyframes rwcs-hp{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.75)}}
.rwcs-handle svg{width:24px;height:24px} .rwcs-view:hover .rwcs-handle,.rwcs-view.is-drag .rwcs-handle,.rwcs-handle:focus-visible{scale:1.22;background:var(--rw-brass);color:var(--rw-ink)}
.rwcs-cur{position:absolute;z-index:6;left:0;top:0;pointer-events:none;opacity:0;transition:opacity .25s} .rwcs-cur b{display:block;translate:18px 18px;padding:7px 12px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);font-size:10.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase}
@media (hover:hover) and (pointer:fine){.rwcs-view:hover .rwcs-cur{opacity:1}}
/* result strip */
.rwcs-strip{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.3fr) minmax(0,.8fr);margin-top:14px;border-radius:24px;background:var(--rw-pine);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 10%,transparent)}
.rwcs-sc{display:flex;flex-direction:column;justify-content:space-between;gap:18px;padding:clamp(22px,2.4vw,34px)} .rwcs-sc+.rwcs-sc{border-left:1px solid color-mix(in srgb,var(--rw-cloud) 10%,transparent)}
.rwcs-lab{display:flex;align-items:center;gap:9px;margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--rw-mut)} .rwcs-lab i{width:7px;height:7px;border-radius:50%;background:var(--rw-brass)}
.rwcs-ba{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 14px;margin:0;font-variant-numeric:tabular-nums} .rwcs-ba s{text-decoration:none;font-size:28px;letter-spacing:-.04em;color:color-mix(in srgb,var(--rw-cloud) 50%,transparent)} .rwcs-ba span{color:color-mix(in srgb,var(--rw-cloud) 40%,transparent);font-size:24px}
.rwcs-ba b{font-size:clamp(48px,4.6vw,72px);line-height:.9;letter-spacing:-.055em;color:var(--rw-brass);font-weight:var(--rw-font-dw,700)}
.rwcs-chart svg{display:block;width:100%;height:92px;overflow:visible} .rwcs-base{stroke:color-mix(in srgb,var(--rw-cloud) 18%,transparent);stroke-width:1} .rwcs-draw{fill:none;stroke:var(--rw-brass);stroke-width:3;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 2s cubic-bezier(.6,0,.2,1) .2s} .rwcs.is-drawn .rwcs-draw{stroke-dashoffset:0}
.rwcs-grn{margin:0;font-size:clamp(48px,4.6vw,72px);line-height:.9;letter-spacing:-.055em;font-weight:var(--rw-font-dw,700)}
/* article (chalk) */
.rwcs-art{padding:clamp(88px,9vw,150px) 0 clamp(96px,10vw,160px)}
.rwcs-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2.4fr);gap:clamp(32px,5vw,96px);--rp:0}
.rwcs-rail{position:relative} .rwcs-rail-in{position:sticky;top:120px;display:flex;gap:22px}
.rwcs-rail-l{position:relative;flex:none;width:2px;height:220px;border-radius:2px;background:var(--rw-fog)} .rwcs-rail-l b{position:absolute;left:0;top:0;width:100%;height:calc(var(--rp)*100%);border-radius:2px;background:var(--rw-ink)} .rwcs-rail-l b::after{content:"";position:absolute;left:50%;bottom:-7px;width:14px;height:14px;translate:-50% 0;border-radius:50%;background:var(--rw-brass);box-shadow:0 0 0 2px var(--rw-ink)}
.rwcs-rail ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:18px;font-size:12px;letter-spacing:.08em;text-transform:uppercase} .rwcs-rail li{display:flex;gap:10px;color:color-mix(in srgb,var(--rw-ink) 40%,transparent);transition:color .4s} .rwcs-rail li span{color:inherit} .rwcs-rail li.is-on{color:var(--rw-ink)}
.rwcs-bar{display:none}
.rwcs-body{display:flex;flex-direction:column;gap:clamp(72px,7vw,120px);max-width:820px}
.rwcs-k{margin:0 0 14px;font-size:12px;letter-spacing:.1em;color:var(--rw-mut)}
.rwcs-h2{margin:0 0 26px;font-size:clamp(34px,3.4vw,52px);line-height:1;letter-spacing:-.045em;font-weight:var(--rw-font-dw,700)}
.rwcs-lead{margin:0 0 22px;font-size:clamp(22px,2vw,30px);line-height:1.25;letter-spacing:-.025em;font-weight:500;text-wrap:pretty}
.rwcs-p{margin:0;font-size:18px;line-height:1.65;color:color-mix(in srgb,var(--rw-ink) 78%,transparent);max-width:62ch} .rwcs-p-l{font-size:clamp(20px,1.6vw,23px);line-height:1.5;color:var(--rw-ink)}
.rwcs-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.rwcs-steps li{display:grid;grid-template-columns:44px minmax(0,1fr);gap:18px;padding:22px 0;border-top:1px solid var(--rw-fog)} .rwcs-steps li:last-child{border-bottom:1px solid var(--rw-fog)}
.rwcs-steps b{display:block;margin-bottom:6px;font-size:22px;letter-spacing:-.03em;font-weight:var(--rw-font-dw,700)} .rwcs-steps p{margin:0;font-size:16.5px;line-height:1.6;color:color-mix(in srgb,var(--rw-ink) 74%,transparent)}
.rwcs-tick{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--rw-brass);color:var(--rw-ink)} .rwcs-tick svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.rwcs-quote{margin:40px 0 0;padding:clamp(28px,3vw,44px);border-radius:24px;background:var(--rw-ink);color:var(--rw-cloud)}
.rwcs-quote blockquote{margin:0 0 28px;font-size:clamp(24px,2.3vw,34px);line-height:1.18;letter-spacing:-.03em;font-weight:600;text-wrap:pretty}
.rwcs-quote figcaption{display:flex;align-items:center;gap:14px;flex-wrap:wrap} .rwcs-quote img{width:52px;height:52px;border-radius:50%;object-fit:cover} .rwcs-quote figcaption>span{display:flex;flex-direction:column;gap:3px} .rwcs-quote b{font-size:16px;font-weight:600} .rwcs-quote small{font-size:11px;letter-spacing:.06em;color:var(--rw-mut)}
.rwcs-quote em{display:inline-flex;align-items:center;gap:8px;margin-left:auto;padding:8px 14px;border-radius:999px;background:var(--rw-brass);color:var(--rw-ink);font-style:normal;font-size:11.5px;letter-spacing:.04em} .rwcs-quote em i{width:7px;height:7px;border-radius:50%;background:#FF3E88}
/* end: CTA + next case */
.rwcs-end{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:clamp(20px,2.4vw,36px);margin-top:clamp(88px,9vw,150px);align-items:stretch}
.rwcs-cta{display:flex;flex-direction:column;align-items:flex-start;gap:20px;padding:clamp(28px,3vw,44px);border-radius:24px;background:var(--rw-brass);color:var(--rw-ink)} .rwcs-cta p{margin:0;font-size:17px;line-height:1.5;max-width:40ch} .rwcs-cta .rw-btn{margin-top:auto;--ring:var(--rw-brass)}
.rwcs-cta-h{margin:0;font-size:clamp(30px,2.8vw,44px);line-height:1;letter-spacing:-.045em;font-weight:var(--rw-font-dw,700);text-wrap:balance}
.rwcs-next{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.9fr);border-radius:24px;overflow:hidden;background:var(--rw-night);color:var(--rw-cloud);text-decoration:none;min-height:340px}
.rwcs-next-t{display:flex;flex-direction:column;gap:14px;padding:clamp(26px,2.6vw,40px)} .rwcs-next-t small{display:inline-flex;align-items:center;gap:10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--rw-brass)} .rwcs-next-t small svg{transition:translate .4s cubic-bezier(.34,1.56,.64,1)} .rwcs-next:hover .rwcs-next-t small svg{translate:5px 0}
.rwcs-next-t b{font-size:clamp(24px,2.2vw,34px);line-height:1.05;letter-spacing:-.04em;font-weight:var(--rw-font-dw,700);text-wrap:balance} .rwcs-next-t>span{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--rw-mut)}
.rwcs-next-t em{margin-top:auto;font-style:normal;font-size:22px;letter-spacing:-.03em;color:color-mix(in srgb,var(--rw-cloud) 55%,transparent)} .rwcs-next-t strong{font-size:40px;color:var(--rw-brass);font-weight:var(--rw-font-dw,700)}
.rwcs-next-i{position:relative;overflow:hidden} .rwcs-next-i img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(1) brightness(.7);transition:filter .7s,scale 1.1s cubic-bezier(.2,.8,.2,1)} .rwcs-next:hover .rwcs-next-i img{filter:none;scale:1.05}
/* tablet */
.rwcs.is-tab .rwcs-head{grid-template-columns:1fr;align-items:start} .rwcs.is-tab .rwcs-view{aspect-ratio:4/3}
.rwcs.is-tab .rwcs-strip{grid-template-columns:1fr 1fr} .rwcs.is-tab .rwcs-chart{grid-column:1/-1;grid-row:2;border-left:0;border-top:1px solid color-mix(in srgb,var(--rw-cloud) 10%,transparent)}
.rwcs.is-tab .rwcs-grid{grid-template-columns:minmax(0,200px) minmax(0,1fr)} .rwcs.is-tab .rwcs-end{grid-template-columns:1fr}
/* phone */
.rwcs.is-ph .rwcs-top{padding:104px 0 64px} .rwcs.is-ph .rwcs-crumb>span{display:none}
.rwcs.is-ph .rwcs-head{grid-template-columns:1fr;gap:28px;margin-bottom:28px}
.rwcs.is-ph .rwcs-view{aspect-ratio:4/5;max-height:none;border-radius:20px} .rwcs.is-ph .rwcs-ch{height:46%} .rwcs.is-ph .rwcs-big{font-size:clamp(56px,17vw,76px)} .rwcs.is-ph .rwcs-ghost{font-size:32px}
.rwcs.is-ph .rwcs-num{bottom:18px;gap:8px} .rwcs.is-ph .rwcs-num-a{right:16px} .rwcs.is-ph .rwcs-num-b{left:16px;bottom:auto;top:66px} .rwcs.is-ph .rwcs-ml{display:none} .rwcs.is-ph .rwcs-handle{width:54px;height:54px}
.rwcs.is-ph .rwcs-strip{grid-template-columns:1fr} .rwcs.is-ph .rwcs-sc+.rwcs-sc{border-left:0;border-top:1px solid color-mix(in srgb,var(--rw-cloud) 10%,transparent)}
.rwcs.is-ph .rwcs-art{padding:72px 0 88px}
.rwcs.is-ph .rwcs-grid{grid-template-columns:1fr;gap:0} .rwcs.is-ph .rwcs-rail{display:none}
.rwcs.is-ph .rwcs-bar{display:block;position:sticky;z-index:5;top:0;height:3px;margin:0 -20px 40px;background:var(--rw-fog)} .rwcs.is-ph .rwcs-bar::after{content:"";position:absolute;inset:0;background:var(--rw-ink);transform-origin:left;transform:scaleX(var(--rp))}
.rwcs.is-ph .rwcs-p{font-size:16.5px} .rwcs.is-ph .rwcs-steps li{grid-template-columns:36px minmax(0,1fr);gap:14px} .rwcs.is-ph .rwcs-steps b{font-size:19px}
.rwcs.is-ph .rwcs-quote em{margin-left:0}
.rwcs.is-ph .rwcs-end{grid-template-columns:1fr;margin-top:80px} .rwcs.is-ph .rwcs-next{grid-template-columns:1fr} .rwcs.is-ph .rwcs-next-i{aspect-ratio:16/10;order:-1}
@media (prefers-reduced-motion:reduce){.rwcs-draw{transition:none}}
`
addPropertyControls(RwCase, {
  slug: { type: ControlType.String, title: "Slug", description: "Bind to the Work item's Slug on the /work/:slug page. Empty = read from the URL", defaultValue: "" },
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  backLabel: { type: ControlType.String, title: "Back link", defaultValue: "All case studies" },
  backLink: { type: ControlType.Link, title: "Back URL", defaultValue: "/work" },
  caseLabel: { type: ControlType.String, title: "Case label", defaultValue: "Case study" },
  clientLabel: { type: ControlType.String, title: "Client label", defaultValue: "Client" },
  industryLabel: { type: ControlType.String, title: "Industry label", defaultValue: "Industry" },
  yearLabel: { type: ControlType.String, title: "Year label", defaultValue: "Year" },
  servicesLabel: { type: ControlType.String, title: "Services label", defaultValue: "Services" },
  beforeLabel: { type: ControlType.String, title: "Before label", defaultValue: "Before" },
  afterLabel: { type: ControlType.String, title: "After label", defaultValue: "After" },
  dragLabel: { type: ControlType.String, title: "Cursor chip", defaultValue: "Drag" },
  sliderLabel: { type: ControlType.String, title: "Slider name", description: "Read out by screen readers", defaultValue: "Compare before and after" },
  growthLabel: { type: ControlType.String, title: "Growth label", defaultValue: "Growth" },
  chartLabel: { type: ControlType.String, title: "Chart label", defaultValue: "Month by month · last 12 months" },
  challengeTitle: { type: ControlType.String, title: "Block 1 title", defaultValue: "The challenge" },
  challengeText: { type: ControlType.String, title: "Block 1 text", description: "Shown under the case Summary. Empty = the default text", displayTextArea: true, defaultValue: "They had a good product and happy customers, but the people who were ready to buy could not find them. Budgets went to channels nobody measured, and nobody could say which month paid for itself." },
  didTitle: { type: ControlType.String, title: "Block 2 title", defaultValue: "What we did" },
  didFirst: { type: ControlType.String, title: "First step", description: "Title:Text", displayTextArea: true, defaultValue: "Week 1 · Audit:We studied the site, the ads, the search results and five competitors, and picked the three fastest wins." },
  didSteps: { type: ControlType.String, title: "Service steps", description: "Service:Text; … — one step per service the case lists", displayTextArea: true, defaultValue: "SEO:A technical audit, then location pages and a keyword map built around the searches that buy.;Content:An editorial plan and long-form pieces written for search and for people, published every week.;Social media:A weekly shoot, three reels a week and a reply routine for comments and DMs.;Paid ads:An account rebuild, weekly creative tests and budget moved to whatever sells.;Web design:Fast landing pages built for one action each, tested and improved every month.;Branding:A brand workshop, a new identity and templates, so every post and ad looks like one company." },
  didLast: { type: ControlType.String, title: "Last step", description: "Title:Text", displayTextArea: true, defaultValue: "Every Monday · Report:One page with the numbers, what we changed and what comes next. No vanity metrics." },
  resultTitle: { type: ControlType.String, title: "Block 3 title", defaultValue: "The result" },
  resultText: { type: ControlType.String, title: "Block 3 text", description: "{client} {before} {after} {metric} {growth} are filled from the case", displayTextArea: true, defaultValue: "{client} went from {before} to {after} {metric} — {growth} — and the plan keeps compounding. Every number on this page comes from the client's own dashboard, not ours." },
  nextLabel: { type: ControlType.String, title: "Next label", defaultValue: "Next case" },
  ctaTitle: { type: ControlType.String, title: "CTA title", defaultValue: "Want a before and after like this?" },
  ctaText: { type: ControlType.String, title: "CTA text", displayTextArea: true, defaultValue: "A free 30-minute audit: we look at your site, ads and search, and show you the fastest win." },
  ctaButton: { type: ControlType.String, title: "CTA button", defaultValue: "Get results like this" },
  ctaLink: { type: ControlType.Link, title: "CTA link", description: "Empty = Booking Link on the Site CMS row" },
})
