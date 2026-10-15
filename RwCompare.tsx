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
  plans: [{"slug": "starter", "f1": "Starter", "f2": "1900", "f3": "1700", "f4": "One channel, done properly.", "f5": "One channel (SEO, social or ads);Monthly strategy call;Monthly report;Email support", "f6": "Start with Starter", "f7": "", "n1": "1"}, {"slug": "growth", "f1": "Growth", "f2": "3900", "f3": "3500", "f4": "Two channels working together.", "f5": "Two channels;Weekly check-in;Live dashboard;Content shoots;Slack support", "f6": "Choose Growth", "f7": "yes", "n1": "2"}, {"slug": "scale", "f1": "Scale", "f2": "7500", "f3": "6750", "f4": "The full team on your brand.", "f5": "SEO + social + paid ads;Dedicated strategist;Creative team;Landing pages;Priority support", "f6": "Talk to us", "f7": "", "n1": "3"}]
}
const SW_BUILD = "RwCompare@cms1"
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

// ===== RwCompare =====
interface CompareProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  eyebrow: string; heading: string; note: string; rows: string; featureLabel: string; currency: string; perMonth: string; featuredLabel: string
  yesLabel: string; noLabel: string; buttonLink: string; showButtons: boolean; stickyTop: number; style?: CSSProperties
}
// ---- THE SIGNAL TABLE (/pricing, under the retainers): Starter / Growth / Scale side by side. Plan names + monthly prices come from the Plans CMS,
// the feature rows from one control. Scroll mechanic: each row lights up as it crosses 70% of the viewport — its ✓ circles pop and their ticks draw,
// text values rise in — so the table "fills in" row by row as you read; the plan header row stays sticky; the featured column carries a breathing lime
// glow. Hover a row: it tints and its label slides. Phone: plan tabs (aria-pressed) show one plan at a time against the feature list. ----
type CmRow = { label: string; v: string[] }
const cmParse = (s: string): CmRow[] => String(s || "").split(";").map((x) => x.trim()).filter(Boolean).map((x) => { const p = x.split(":").map((y) => y.trim()); return { label: p[0] || "", v: p.slice(1) } })
const cmMoney = (v: string, cur: string) => { const n = parseFloat(String(v || "").replace(/[^\d.]/g, "")); if (!isFinite(n)) return String(v || ""); return `${cur}${n.toLocaleString("en-US")}` }
const CmVal = ({ v, yes, no, M, D, k }: { v: string; yes: string; no: string; M: CSSProperties; D: CSSProperties; k: number }) => {
  const t = String(v || "").trim()
  if (t === "✓" || /^(yes|true|y)$/i.test(t)) return (<span className="rwcm-yes" style={{ ["--k" as any]: k }}><svg viewBox="0 0 32 32" aria-hidden><circle cx="16" cy="16" r="14" /><path d="M9.5 16.5l4.5 4.5 8.5-9.5" pathLength={1} /></svg><span className="rw-sr">{yes}</span></span>)
  if (!t || t === "—" || t === "-" || t === "–" || /^(no|false|n)$/i.test(t)) return (<span className="rwcm-no" style={{ ["--k" as any]: k }}><i aria-hidden /><span className="rw-sr">{no}</span></span>)
  return <span className="rwcm-tx" style={{ ...D, ["--k" as any]: k }}>{t}</span>
}
export default function RwCompare(props: CompareProps) {
  const { eyebrow = "(09) Compare plans", heading = "Every plan,|*side by side*.", note = "Prices in USD, billed monthly. Ad spend is paid to the platforms directly. Switch plans or cancel with 30 days notice.",
    rows: rowSpec = "Channels:1:2:3;Strategy calls:Monthly:Weekly:Weekly;Live dashboard:—:✓:✓;Content shoots:—:✓:✓;Landing pages:—:—:✓;Dedicated strategist:—:—:✓;Creative team:—:✓:✓;Reporting:Monthly:Weekly:Real-time;Support:Email:Slack:Priority Slack",
    featureLabel = "What you get", currency = "$", perMonth = "/mo", featuredLabel = "Most picked", yesLabel = "Included", noLabel = "Not included", buttonLink = "", showButtons = true, stickyTop = 84, bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill(); const site = useSite()
  const plans = useCMS("plans", SEED.plans || []); const np = plans.length
  const R = cmParse(rowSpec)
  const root = useRef<HTMLElement>(null); const body = useRef<HTMLDivElement>(null)
  const { w } = useSize(root, bpHint); const phone = w < 810, tab = w >= 810 && w < 1100
  const on = useOn(root, live, rm)
  useMagnet(root, live)
  const final = still || rm || !live
  const book = pick(buttonLink, site.book || "/contact")
  const fIdx = plans.findIndex((p) => /^(yes|true|y|1)$/i.test(String(p.f7 || "").trim()))
  const [sel, setSel] = useState(fIdx >= 0 ? fIdx : 0); useEffect(() => { if (sel >= np && np > 0) setSel(0) }, [np])
  // rows that have crossed 70% of the viewport (they stay lit)
  const [lit, setLit] = useState(0); const litR = useRef(-1)
  useEffect(() => {
    if (final || !body.current) return
    const Bd = body.current; let vis = true, tops: number[] = [], vh = 1, tt = 0, stk = false
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting }, { rootMargin: "30% 0px 30% 0px" }); io.observe(Bd)
    const read = () => { if (!vis) return; vh = window.innerHeight || 1; tops = Array.from(Bd.querySelectorAll<HTMLElement>("[data-cmr]")).map((el) => el.getBoundingClientRect().top); tt = Bd.getBoundingClientRect().top }
    const off = onTick(() => { if (!vis) return; let n = 0; for (const t of tops) { if (t < vh * 0.7) n++; else break } if (n > litR.current) { litR.current = n; setLit(n) } const sk = tt < Math.max(0, stickyTop) - 2; if (sk !== stk) { stk = sk; Bd.classList.toggle("is-stuck", sk) } }, read)
    return () => { off(); io.disconnect() }
  }, [final, R.length, phone])
  const nLit = final ? R.length + 1 : lit
  const tabs = useRef<HTMLDivElement>(null)
  const onTabKey = (e: any, i: number) => { let j = -1; if (e.key === "ArrowRight") j = (i + 1) % np; else if (e.key === "ArrowLeft") j = (i - 1 + np) % np; else if (e.key === "Home") j = 0; else if (e.key === "End") j = np - 1; if (j < 0) return; e.preventDefault(); setSel(j); tabs.current?.querySelectorAll<HTMLElement>("button")[j]?.focus() }
  const PlanHead = ({ p, i }: { p: CmsRow; i: number }) => (<>
    {i === fIdx && featuredLabel && <span className="rwcm-feat" style={M}><i />{featuredLabel}</span>}
    <span className="rwcm-pn" style={D}>{p.f1}</span>
    <span className="rwcm-pp" style={M}><b style={D}>{cmMoney(p.f2, currency)}</b>{perMonth}</span>
  </>)
  const btnOf = (p: CmsRow, i: number) => <Btn href={book} label={p.f6 || p.f1} kind={i === fIdx ? "solid" : "ghost"} arrow={!tab} icon="cal" sub={p.f1} className={i === fIdx ? "rwcm-hot" : undefined} />
  return (
    <section ref={root as any} className={`rw rw-sec rw-dark rwcm${phone ? " is-ph" : tab ? " is-tab" : ""}${on ? " is-on" : ""}${final ? " is-fin" : ""}`} style={{ ...cssVars(c), ...B, ["--st" as any]: `${Math.max(0, stickyTop)}px`, ["--np" as any]: Math.max(1, np), ...(props.style || {}) }}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_MOTION + CSS_CM + siteFontCss(props) }} />
      <div className="rw-wrap">
        <header className="rwcm-head">
          <div className="rwcm-hl"><Eyebrow text={eyebrow} on={on} M={M} /><Head text={heading} on={on} D={D} size={phone ? "clamp(40px,11vw,48px)" : "clamp(40px,4.6vw,68px)"} lh={0.95} delay={80} /></div>
          {note && <p className="rwcm-note" style={rise(on, 300, 12)}>{note}</p>}
        </header>
        {np > 0 && !phone && (
          <div ref={body} className="rwcm-tw" style={rise(on, 360, 24)}>
            {fIdx >= 0 && <i className="rwcm-glow" aria-hidden style={{ ["--fi" as any]: fIdx }}><b /></i>}
            <table className="rwcm-t">
              <colgroup><col className="rwcm-c0" />{plans.map((p, i) => <col key={p.slug || i} />)}</colgroup>
              <thead><tr>
                <th scope="col" className="rwcm-th0" style={M}>{featureLabel}</th>
                {plans.map((p, i) => <th key={p.slug || i} scope="col" className={`rwcm-ph${i === fIdx ? " is-f" : ""}`}><span className="rwcm-phi"><PlanHead p={p} i={i} /></span></th>)}
              </tr></thead>
              <tbody>
                {R.map((row, ri) => (
                  <tr key={ri} data-cmr className={ri < nLit ? "is-lit" : ""}>
                    <th scope="row" style={D}><span className="rwcm-rl"><i aria-hidden />{row.label}</span></th>
                    {plans.map((p, i) => <td key={i} className={i === fIdx ? "is-f" : ""}><CmVal v={row.v[i] || ""} yes={yesLabel} no={noLabel} M={M} D={D} k={i} /></td>)}
                  </tr>))}
                {showButtons && (
                  <tr data-cmr className={`rwcm-fr${R.length < nLit ? " is-lit" : ""}`}>
                    <th scope="row"><span className="rw-sr">{featureLabel}</span></th>
                    {plans.map((p, i) => <td key={i} className={i === fIdx ? "is-f" : ""}>{btnOf(p, i)}</td>)}
                  </tr>)}
              </tbody>
            </table>
          </div>)}
        {np > 0 && phone && (
          <div ref={body} className="rwcm-m" style={rise(on, 300, 20)}>
            <div ref={tabs} className="rwcm-tabs" role="group" aria-label={featureLabel}>
              {plans.map((p, i) => <button key={p.slug || i} type="button" aria-pressed={i === sel} className={i === sel ? "is-sel" : ""} onClick={() => setSel(i)} onKeyDown={(e) => onTabKey(e, i)} style={M}>{p.f1}{i === fIdx && <i aria-hidden />}</button>)}
            </div>
            <div key={`h${sel}`} className={`rwcm-mh${sel === fIdx ? " is-f" : ""}`} aria-live="polite"><PlanHead p={plans[sel] || plans[0]} i={sel} /></div>
            <table className="rwcm-t rwcm-t1">
              <thead className="rw-sr"><tr><th scope="col">{featureLabel}</th><th scope="col">{(plans[sel] || plans[0]).f1}</th></tr></thead>
              <tbody key={`b${sel}`}>
                {R.map((row, ri) => (
                  <tr key={ri} data-cmr className={ri < nLit ? "is-lit" : ""}>
                    <th scope="row" style={D}><span className="rwcm-rl"><i aria-hidden />{row.label}</span></th>
                    <td className={sel === fIdx ? "is-f" : ""}><CmVal v={row.v[sel] || ""} yes={yesLabel} no={noLabel} M={M} D={D} k={0} /></td>
                  </tr>))}
              </tbody>
            </table>
            {showButtons && <div className="rwcm-mb">{btnOf(plans[sel] || plans[0], sel)}</div>}
          </div>)}
      </div>
    </section>
  )
}
const CSS_CM = `
.rwcm{background:var(--rw-night);color:var(--rw-cloud);padding:clamp(96px,10vw,160px) 0 clamp(110px,11vw,170px);overflow-x:clip}
.rwcm .rw-hd{font-weight:var(--rw-font-dw,700);letter-spacing:-.045em} .rwcm .rw-it{color:var(--rw-brass);font-weight:inherit}
.rwcm .rw-eb i{position:relative} .rwcm .rw-eb i::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 1.5px var(--rw-brass);animation:rwcm-ping 1.8s cubic-bezier(.2,.6,.3,1) infinite}
@keyframes rwcm-ping{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.8)}}
.rwcm-head{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:end;gap:40px;margin-bottom:clamp(44px,4.6vw,72px)}
.rwcm-hl{display:flex;flex-direction:column;gap:26px;align-items:flex-start}
.rwcm-note{margin:0;justify-self:end;max-width:400px;font-size:16px;line-height:1.55;color:color-mix(in srgb,var(--rw-cloud) 66%,transparent)}
/* ---- table ---- */
.rwcm-tw{position:relative;--c0:31%}
.rwcm-t{position:relative;z-index:1;width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed}
.rwcm-c0{width:var(--c0)}
.rwcm-t th,.rwcm-t td{padding:0;text-align:left;font-weight:inherit;vertical-align:middle}
.rwcm-t thead th{position:sticky;top:var(--st,84px);z-index:3;background:var(--rw-night);border-bottom:1px solid color-mix(in srgb,var(--rw-cloud) 16%,transparent);vertical-align:bottom}
.rwcm-tw:not(.is-stuck) .rwcm-t thead th::before{display:none} .rwcm-t thead th::before{content:"";position:absolute;left:0;right:0;bottom:100%;height:var(--st,84px);background:inherit;box-shadow:inherit;pointer-events:none}
.rwcm-t1 thead th::before{display:none}
.rwcm-th0{padding:0 0 22px!important;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:color-mix(in srgb,var(--rw-cloud) 55%,transparent)}
.rwcm-ph .rwcm-phi{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:26px 24px 22px}
.rwcm-t thead th.is-f{background:color-mix(in srgb,var(--rw-brass) 9%,var(--rw-night));box-shadow:inset 1.5px 0 0 color-mix(in srgb,var(--rw-brass) 70%,transparent),inset -1.5px 0 0 color-mix(in srgb,var(--rw-brass) 70%,transparent)}
.rwcm-feat{display:inline-flex;align-items:center;gap:7px;margin-bottom:6px;padding:5px 10px;border-radius:999px;background:var(--rw-brass);color:var(--rw-ink);font-size:10px;letter-spacing:.1em;text-transform:uppercase} .rwcm-feat i{width:6px;height:6px;border-radius:50%;background:#FF3E88}
.rwcm-pn{font-size:clamp(24px,2.1vw,32px);line-height:1;letter-spacing:-.04em;font-weight:var(--rw-font-dw,700)}
.rwcm-pp{font-size:12px;letter-spacing:.04em;color:color-mix(in srgb,var(--rw-cloud) 60%,transparent)} .rwcm-pp b{font-size:18px;letter-spacing:-.02em;color:var(--rw-cloud);font-weight:500;margin-right:2px}
.rwcm-t tbody th,.rwcm-t tbody td{border-bottom:1px solid color-mix(in srgb,var(--rw-cloud) 10%,transparent);height:72px;transition:background .35s}
.rwcm-t tbody td{padding:0 24px}
.rwcm-rl{position:relative;display:flex;padding-left:4px;align-items:center;gap:14px;font-size:clamp(17px,1.4vw,20px);letter-spacing:-.02em;font-weight:500;color:color-mix(in srgb,var(--rw-cloud) 50%,transparent);transition:color .6s,translate .5s cubic-bezier(.2,.8,.2,1)}
.rwcm-rl i{width:8px;height:8px;flex:none;border-radius:50%;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--rw-cloud) 30%,transparent);transition:background .4s,box-shadow .4s}
tr.is-lit .rwcm-rl{color:var(--rw-cloud)} tr.is-lit .rwcm-rl i{background:var(--rw-brass);box-shadow:0 0 0 3px color-mix(in srgb,var(--rw-brass) 18%,transparent)}
.rwcm-t tbody tr:not(.rwcm-fr):hover th,.rwcm-t tbody tr:not(.rwcm-fr):hover td{background:color-mix(in srgb,var(--rw-cloud) 5%,transparent)} .rwcm-t tbody tr:hover .rwcm-rl{translate:8px 0}
/* values: ✓ circles pop and tick, text rises, — stays muted */
.rwcm-yes{position:relative;display:inline-grid;place-items:center;width:30px;height:30px}
.rwcm-yes svg{width:30px;height:30px;overflow:visible} .rwcm-yes circle{fill:var(--rw-brass);transform-origin:16px 16px;transform:scale(0);transition:transform .55s cubic-bezier(.34,1.56,.64,1) calc(var(--k)*.09s)} .rwcm-yes path{fill:none;stroke:var(--rw-ink);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .5s cubic-bezier(.6,0,.3,1) calc(.25s + var(--k)*.09s)}
tr.is-lit .rwcm-yes circle{transform:none} tr.is-lit .rwcm-yes path{stroke-dashoffset:0}
.rwcm-yes::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);opacity:0}
tr.is-lit .rwcm-yes::after{animation:rwcm-ring 1s cubic-bezier(.2,.6,.3,1) calc(.2s + var(--k)*.09s) 1 backwards}
@keyframes rwcm-ring{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(2.2)}}
.rwcm-no i{display:block;width:16px;height:2px;border-radius:2px;background:color-mix(in srgb,var(--rw-cloud) 26%,transparent)}
.rwcm-tx{display:inline-block;font-size:17px;letter-spacing:-.015em;font-weight:500;opacity:.25;translate:0 8px;transition:opacity .6s calc(var(--k)*.09s),translate .7s cubic-bezier(.2,.8,.2,1) calc(var(--k)*.09s)}
tr.is-lit .rwcm-tx{opacity:1;translate:0 0}
td.is-f .rwcm-tx{color:var(--rw-brass)}
.rwcm-fr th,.rwcm-fr td{border-bottom:0!important;height:auto!important;padding-top:28px!important;padding-bottom:28px!important;vertical-align:top}
.rwcm-fr td{padding-left:16px!important;padding-right:16px!important} .rwcm-fr .rw-btn{width:100%;--ring:var(--rw-night)} .rwcm-fr .rw-face{justify-content:space-between}
.rwcm-fr{opacity:.4;transition:opacity .6s} .rwcm-fr.is-lit{opacity:1}
.rwcm .rw-btn.rwcm-hot{--face:var(--rw-brass);--fg:var(--rw-ink);--fill:var(--rw-cloud);--fg2:var(--rw-ink);--chip:var(--rw-ink);--chipfg:var(--rw-brass);--chip2:var(--rw-ink);--chipfg2:var(--rw-cloud)}
/* the featured column: lime outline + a breathing glow behind it */
.rwcm-glow{position:absolute;z-index:0;top:-14px;bottom:0;left:calc(var(--c0) + (100% - var(--c0)) / var(--np) * var(--fi));width:calc((100% - var(--c0)) / var(--np));border-radius:26px;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--rw-brass) 70%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--rw-brass) 9%,transparent),color-mix(in srgb,var(--rw-brass) 3%,transparent) 60%,color-mix(in srgb,var(--rw-brass) 7%,transparent));pointer-events:none}
.rwcm-glow b{position:absolute;left:50%;top:0;width:150%;height:260px;translate:-50% -40%;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--rw-brass) 30%,transparent),transparent);filter:blur(10px);animation:rwcm-breathe 4.2s ease-in-out infinite}
@keyframes rwcm-breathe{0%,100%{opacity:.55;scale:.9}50%{opacity:1;scale:1.06}}
.rwcm.is-fin .rwcm-glow b{animation:none}
/* tablet */
.rwcm.is-tab .rwcm-head{grid-template-columns:1fr;align-items:start} .rwcm.is-tab .rwcm-note{justify-self:start}
.rwcm.is-tab .rwcm-tw{--c0:28%} .rwcm.is-tab .rwcm-ph .rwcm-phi{padding:22px 14px 18px} .rwcm.is-tab .rwcm-t tbody td{padding:0 14px} .rwcm.is-tab .rwcm-tx{font-size:15px} .rwcm.is-tab .rwcm-rl{font-size:16px;gap:10px}
.rwcm.is-tab .rwcm-fr td{padding-left:8px!important;padding-right:8px!important} .rwcm.is-tab .rwcm-fr .rw-btn{white-space:normal;font-size:13px;line-height:1.2} .rwcm.is-tab .rwcm-fr .rw-face{padding:10px 16px;justify-content:center;text-align:center}
/* phone: tabs */
.rwcm.is-ph{padding:80px 0 96px}
.rwcm.is-ph .rwcm-head{grid-template-columns:1fr;gap:20px;margin-bottom:32px} .rwcm.is-ph .rwcm-note{justify-self:start;font-size:15px}
.rwcm-tabs{position:sticky;top:var(--st,84px);z-index:3;display:grid;grid-template-columns:repeat(var(--np),1fr);gap:4px;padding:5px;border-radius:999px;background:color-mix(in srgb,var(--rw-pine) 92%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 14%,transparent)}
.rwcm-tabs button{all:unset;box-sizing:border-box;position:relative;display:flex;align-items:center;justify-content:center;gap:6px;min-height:46px;padding:0 10px;border-radius:999px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;color:color-mix(in srgb,var(--rw-cloud) 70%,transparent);transition:background .35s,color .35s}
.rwcm-tabs button i{width:6px;height:6px;border-radius:50%;background:#FF3E88}
.rwcm-tabs button.is-sel{background:var(--rw-brass);color:var(--rw-ink)}
.rwcm-tabs button:focus-visible{outline:2px solid var(--rw-cloud)!important;outline-offset:2px!important}
.rwcm-mh{display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin:18px 0 6px;padding:22px;border-radius:22px;background:var(--rw-pine);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 10%,transparent);animation:rwcm-in .5s cubic-bezier(.2,.8,.2,1)}
.rwcm-mh.is-f{box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--rw-brass) 70%,transparent),0 20px 50px -20px color-mix(in srgb,var(--rw-brass) 30%,transparent)}
@keyframes rwcm-in{from{opacity:0;translate:0 10px}}
.rwcm-t1{table-layout:auto} .rwcm-t1 tbody th,.rwcm-t1 tbody td{height:60px} .rwcm-t1 tbody td{padding:0 4px 0 12px;text-align:right;width:44%} .rwcm-t1 .rwcm-rl{font-size:16px;gap:10px} .rwcm-t1 .rwcm-tx{font-size:15px}
.rwcm-t1 .rwcm-no i{margin-left:auto} .rwcm-t1 tbody{animation:rwcm-in .45s cubic-bezier(.2,.8,.2,1)}
.rwcm-mb{margin-top:22px} .rwcm-mb .rw-btn{width:100%;--ring:var(--rw-night)}
@media (prefers-reduced-motion:reduce){.rwcm-glow b{animation:none}}
`
addPropertyControls(RwCompare, {
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "(09) Compare plans" },
  heading: { type: ControlType.String, title: "Heading", description: "| = line break, *word* = lime", defaultValue: "Every plan,|*side by side*." },
  note: { type: ControlType.String, title: "Note", displayTextArea: true, defaultValue: "Prices in USD, billed monthly. Ad spend is paid to the platforms directly. Switch plans or cancel with 30 days notice." },
  rows: { type: ControlType.String, title: "Rows", description: "Feature:Plan 1:Plan 2:Plan 3; … — ✓ = included, — = not included, anything else is shown as text. Plan columns follow the Plans CMS order", displayTextArea: true, defaultValue: "Channels:1:2:3;Strategy calls:Monthly:Weekly:Weekly;Live dashboard:—:✓:✓;Content shoots:—:✓:✓;Landing pages:—:—:✓;Dedicated strategist:—:—:✓;Creative team:—:✓:✓;Reporting:Monthly:Weekly:Real-time;Support:Email:Slack:Priority Slack" },
  featureLabel: { type: ControlType.String, title: "First column", defaultValue: "What you get" },
  currency: { type: ControlType.String, title: "Currency", defaultValue: "$" },
  perMonth: { type: ControlType.String, title: "Per month", defaultValue: "/mo" },
  featuredLabel: { type: ControlType.String, title: "Featured chip", description: "Shown on the plan whose Featured field is yes", defaultValue: "Most picked" },
  yesLabel: { type: ControlType.String, title: "✓ read as", description: "For screen readers", defaultValue: "Included" },
  noLabel: { type: ControlType.String, title: "— read as", description: "For screen readers", defaultValue: "Not included" },
  showButtons: { type: ControlType.Boolean, title: "Plan buttons", defaultValue: true },
  buttonLink: { type: ControlType.Link, title: "Button link", description: "Empty = Booking Link on the Site CMS row" },
  stickyTop: { type: ControlType.Number, title: "Sticky offset", description: "Space kept above the sticky plan row (the site header)", min: 0, max: 200, step: 2, unit: "px", defaultValue: 84 },
})
