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
const SW_BUILD = "RwHeader@cms1"
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

// ===== RwHeader =====
interface HeaderProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  links: string; ctaLabel: string; ctaLink: string; menuLabel: string; closeLabel: string; contactLabel: string; followLabel: string; timeLabel: string; style?: CSSProperties
}
// ---- THE SIGNAL BAR: the site header. A 0px frame in the Site Layout that portals a fixed bar to <body> (the root stays transform-free, so the drawer's
// fixed box is the viewport). Top of page = transparent, exactly the hero nav. After 40px = a floating glass pill. A GROUND PROBE reads the first opaque
// background under the bar (elementsFromPoint) → light ground = ink type + chalk glass. Scroll down hides it, scroll up brings it back.
// < 1100px: a burger (two lines → ✕) opens a full-screen night drawer that SPREADS OUT OF THE BURGER like a ping (circle clip), with signal rings behind. ----
const HdMark = ({ s = 30 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 32 32" aria-hidden className="rwhd-mark"><circle cx="16" cy="16" r="15" fill="var(--rw-brass)" /><circle cx="16" cy="16" r="3.4" fill="var(--rw-ink)" /><path d="M10.2 21.8a8.2 8.2 0 0 1 0-11.6M21.8 10.2a8.2 8.2 0 0 1 0 11.6" fill="none" stroke="var(--rw-ink)" strokeWidth="2.4" strokeLinecap="round" /></svg>)
const hdNorm = (p: string) => { const s = String(p || "").split(/[?#]/)[0].replace(/\/+$/, ""); return s || "/" }
const hdActive = (path: string, h: string) => { const a = hdNorm(path), b = hdNorm(h); if (!/^\//.test(b) || b === "/") return a === b && b !== "/" ? true : false; return a === b || a.startsWith(b + "/") }
// luminance of a computed rgb()/rgba() colour; null when it is (mostly) transparent
const hdLum = (v: string): number | null => { const m = String(v || "").match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?/); if (!m) return null; let a = m[4] === undefined ? 1 : parseFloat(m[4]); if (m[4] && m[4].endsWith("%")) a /= 100; if (a < 0.5) return null; const [r, g, b] = [m[1], m[2], m[3]].map((x) => { const c = parseFloat(x) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
export default function RwHeader(props: HeaderProps) {
  const { links = "Services:/services, Work:/work, Pricing:/pricing, About:/about, Blog:/blog", ctaLabel = "Book a call", ctaLink = "", menuLabel = "Menu", closeLabel = "Close",
    contactLabel = "Say hello", followLabel = "Follow", timeLabel = "Local time", bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill(); const site = useSite()
  const root = useRef<HTMLDivElement>(null); const top = useRef<HTMLElement>(null); const drw = useRef<HTMLDivElement>(null); const burger = useRef<HTMLButtonElement>(null)
  const { w } = useSize(root, bpHint)
  const [vw, setVw] = useState(0); useEffect(() => { if (!live) return; const f = () => setVw(window.innerWidth); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f) }, [live])
  const W = vw || w; const compact = W < 1100, phone = W < 810, tight = W < 370
  const ready = useStage(live); const inn = (live && ready) || still || rm
  const [host, setHost] = useState<HTMLElement | null>(null); useEffect(() => { if (live && !still) setHost(document.body) }, [live, still])
  const [open, setOpen] = useState(false); const openR = useRef(false); openR.current = open
  const [path, setPath] = useState(""); const [now, setNow] = useState("")
  const L = linkList(links); const book = pick(ctaLink, site.book || "/contact"); const socials = linkList(site.socials)
  useMagnet(top as any, live)
  // path (re-read on client-side navigation) + local time
  useEffect(() => { if (!live) return; const rd = () => { const p = window.location.pathname; setPath((x) => (x === p ? x : p)) }; rd(); const id = window.setInterval(rd, 400); window.addEventListener("popstate", rd); return () => { window.clearInterval(id); window.removeEventListener("popstate", rd) } }, [live])
  useEffect(() => { if (!live) return; const f = () => { try { setNow(new Intl.DateTimeFormat("en-US", { timeZone: site.tz || "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())) } catch (e) {} }; f(); const id = window.setInterval(f, 15000); return () => window.clearInterval(id) }, [live, site.tz])
  // scroll state + ground probe (reads first, then class writes only on change)
  useEffect(() => {
    if (!live || still || !host) return; const el = top.current; if (!el) return
    let y = 0, lastY = window.scrollY, hid = false, glass = false, lt = false, lastProbe = -1e9, probeY = -1e9, want = { glass: false, hid: false, lt: false }
    const probe = () => { const bar = el.querySelector(".rwhd-bar") as HTMLElement | null; const r = bar ? bar.getBoundingClientRect() : null; const yy = 40; void r; let lum: number | null = null
      for (const x of [window.innerWidth * 0.5, window.innerWidth * 0.12]) { const list = document.elementsFromPoint(x, yy) as HTMLElement[]; for (const e of list) { if (el.contains(e) || (drw.current && drw.current.contains(e))) continue; const tg = e.tagName; if (tg === "IMG" || tg === "CANVAS" || tg === "VIDEO" || tg === "PICTURE" || tg === "IFRAME") { lum = 0.1; break } const l = hdLum(getComputedStyle(e).backgroundColor); if (l !== null) { lum = l; break } } if (lum !== null) break }
      if (lum === null) lum = hdLum(getComputedStyle(document.body).backgroundColor) ?? 1
      return lum > 0.45 }
    const read = (t: number) => { y = window.scrollY
      if (Math.abs(y - lastY) > 6) { if (y > lastY && y > 140) want.hid = true; else if (y < lastY) want.hid = false; lastY = y }
      if (openR.current || el.matches(":focus-within")) want.hid = false
      want.glass = y > 40
      if (t - lastProbe > 220 || Math.abs(y - probeY) > 90) { lastProbe = t; probeY = y; want.lt = openR.current ? false : probe() } }
    const off = onTick(() => { if (want.glass !== glass) { glass = want.glass; el.classList.toggle("is-glass", glass) } if (want.hid !== hid) { hid = want.hid; el.classList.toggle("is-hid", hid) } if (want.lt !== lt) { lt = want.lt; el.classList.toggle("is-lt", lt); el.classList.toggle("rw-lt", lt) } }, read)
    return () => off()
  }, [live, still, host])
  // drawer: burger origin for the circle, scroll lock, focus trap, Esc
  const setOrigin = () => { const d = drw.current, b = burger.current; if (!d || !b) return; const r = b.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; d.style.setProperty("--bx", `${Math.round(x)}px`); d.style.setProperty("--by", `${Math.round(y)}px`); d.style.setProperty("--br", `${Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))) + 20}px`) }
  const toggle = (v?: boolean) => { setOrigin(); setOpen((o) => (v === undefined ? !o : v)) }
  useEffect(() => {
    if (!live || !open) return; const html = document.documentElement; const wv = window as any; const prev = html.style.overflow; html.style.overflow = "hidden"; try { wv.__ltLenis && wv.__ltLenis.stop && wv.__ltLenis.stop() } catch (e) {}
    const t = window.setTimeout(() => { const f = drw.current?.querySelector<HTMLElement>(".rwhd-dl a"); f && f.focus({ preventScroll: true }) }, 60)
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); setOpen(false); burger.current && burger.current.focus(); return } if (e.key !== "Tab") return
      const f = [burger.current, ...Array.from(drw.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") || [])].filter(Boolean) as HTMLElement[]; if (!f.length) return
      const i = f.indexOf(document.activeElement as HTMLElement); if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus() } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus() } }
    document.addEventListener("keydown", key)
    return () => { window.clearTimeout(t); document.removeEventListener("keydown", key); html.style.overflow = prev; try { wv.__ltLenis && wv.__ltLenis.start && wv.__ltLenis.start() } catch (e) {} }
  }, [live, open])
  useEffect(() => { if (open && !compact) setOpen(false) }, [compact, open])
  const close = () => setOpen(false)
  const bar = (
    <div className={`rw rwhd${compact ? " is-cmp" : ""}${phone ? " is-ph" : ""}${open ? " is-open" : ""}${still ? " is-still" : ""}${inn ? " is-in" : ""}`} style={{ ...cssVars(c), ...B, ...(props.style || {}) }}>
      <header ref={top as any} className={`rwhd-top${still ? " is-glass" : ""}`}>
        <div className="rwhd-bar">
          <a className="rwhd-logo" href="/" aria-label={`${site.name} home`} style={rise(inn, 60, -10)} onClick={close}><HdMark /><span style={D}>{site.name}</span></a>
          {!compact && L.length > 0 && <nav className="rwhd-nav" aria-label="Main" style={rise(inn, 140, -10)}><ul className="rwhd-lk">{L.map((l, i) => <li key={i}><a href={l.h} aria-current={hdActive(path, l.h) ? "page" : undefined}>{l.l}</a></li>)}</ul></nav>}
          <div className="rwhd-act" style={rise(inn, 220, -10)}>
            {!tight && <Btn href={book} label={ctaLabel} kind="quiet" className="rwhd-cta" icon="cal" onClick={close} />}
            {compact && <button ref={burger} type="button" className="rwhd-bg" aria-expanded={open} aria-controls="rwhd-drawer" aria-label={open ? "Close menu" : "Open menu"} onClick={() => toggle()}><span className="rwhd-bg-l" aria-hidden><i /><i /></span><span className="rwhd-bg-t" style={M} aria-hidden>{open ? closeLabel : menuLabel}</span></button>}
          </div>
        </div>
      </header>
      {compact && (
        <div ref={drw} id="rwhd-drawer" className="rw-dark rwhd-drw" role="dialog" aria-modal="true" aria-label={menuLabel} aria-hidden={!open}>
          <div className="rwhd-rw" aria-hidden><div className="rwhd-rings"><i /><i /><i /><i /><b /><b /></div></div>
          <div className="rwhd-dr-in">
            <nav aria-label="Menu"><ul className="rwhd-dl">{[{ l: "Home", h: "/" }, ...L].map((l, i) => { const act = l.h === "/" ? hdNorm(path) === "/" : hdActive(path, l.h); return (
              <li key={i} style={{ ["--i" as any]: i }}><a href={l.h} aria-current={act ? "page" : undefined} onClick={close} tabIndex={open ? 0 : -1}><span className="rwhd-dl-n" style={M} aria-hidden>{act ? <i className="rwhd-dl-p"><b /><b /></i> : String(i + 1).padStart(2, "0")}</span><span className="rwhd-dl-m"><span className="rwhd-dl-t" style={D}>{l.l}</span></span><span className="rwhd-dl-a" aria-hidden><IcoArrow s={22} /></span></a></li>) })}</ul></nav>
            <div className="rwhd-dr-ft">
              <div className="rwhd-dr-cta"><Btn href={book} label={ctaLabel} kind="solid" icon="cal" onClick={close} /></div>
              <div className="rwhd-dr-info" style={M}>
                {(site.email || site.phone) && <div><p className="rwhd-dr-k">{contactLabel}</p>{site.email && <a href={`mailto:${site.email}`} tabIndex={open ? 0 : -1}>{site.email}</a>}{site.phone && <a href={`tel:${cleanTel(site.phone)}`} tabIndex={open ? 0 : -1}>{site.phone}</a>}</div>}
                {socials.length > 0 && <div><p className="rwhd-dr-k">{followLabel}</p><ul className="rwhd-soc">{socials.map((s, j) => <li key={j}><a href={s.h} target="_blank" rel="noopener" tabIndex={open ? 0 : -1}>{s.l}</a></li>)}</ul></div>}
                <div><p className="rwhd-dr-k">{timeLabel}</p><p className="rwhd-time"><i className="rwhd-live" aria-hidden />{site.city ? `${site.city} · ` : ""}{now || "--:--"}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  return (
    <div ref={root} className="rwhd-root" data-rwhd="">
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_HD + siteFontCss(props) }} />
      {host ? createPortal(bar, host) : bar}
    </div>
  )
}
const CSS_HD = `
.rwhd-root{position:relative;width:100%;height:0}
.rwhd{position:relative;z-index:1000;height:0;color:var(--rw-cloud);--pad:clamp(20px,3.2vw,48px)}
.rwhd-top{position:fixed;z-index:1000;left:0;right:0;top:0;pointer-events:none}
.rwhd.is-still .rwhd-top{position:absolute}
.rwhd-bar{position:relative;display:flex;align-items:center;gap:28px;max-width:${MAXW};margin:0 auto;padding:22px var(--pad) 0;isolation:isolate;pointer-events:none;transition:translate .6s cubic-bezier(.2,.8,.2,1),padding .5s cubic-bezier(.2,.8,.2,1)}
.rwhd-bar>*{pointer-events:auto}
/* glass pill: fades in after 40px; a floating capsule around the bar */
.rwhd-bar::before{content:"";position:absolute;z-index:-1;left:calc(var(--pad) - 12px);right:calc(var(--pad) - 12px);top:8px;height:60px;border-radius:999px;background:color-mix(in srgb,var(--rw-night) 70%,transparent);-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 10%,transparent),0 18px 40px -26px rgba(0,0,0,.55);opacity:0;scale:.985 .9;transition:opacity .45s ease,scale .6s cubic-bezier(.2,.8,.2,1),background .45s,box-shadow .45s;pointer-events:none}
.rwhd-top.is-glass .rwhd-bar{padding-top:16px} .rwhd-top.is-glass .rwhd-bar::before{opacity:1;scale:1}
.rwhd-top.is-hid .rwhd-bar{translate:0 -150%}
.rwhd-logo{display:inline-flex;align-items:center;gap:10px;text-decoration:none;font-size:21px;letter-spacing:-.03em;font-weight:700;color:var(--rw-cloud);transition:color .4s}
.rwhd-mark{flex:none;transition:rotate .8s cubic-bezier(.34,1.56,.64,1)} .rwhd-logo:hover .rwhd-mark{rotate:180deg}
.rwhd-nav{margin:0 auto}
.rwhd-lk{display:flex;gap:4px;list-style:none;margin:0;padding:5px;border-radius:999px;background:color-mix(in srgb,var(--rw-night) 38%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 14%,transparent);transition:background .45s,box-shadow .45s}
.rwhd-lk a{position:relative;display:block;padding:9px 16px;border-radius:999px;font-size:14px;text-decoration:none;color:color-mix(in srgb,var(--rw-cloud) 86%,transparent);transition:background .3s,color .3s}
.rwhd-lk a:hover{background:var(--rw-cloud);color:var(--rw-ink)}
.rwhd-lk a::after{content:"";position:absolute;left:50%;bottom:3px;width:5px;height:5px;border-radius:50%;background:var(--rw-brass);translate:-50% 0;scale:0;transition:scale .45s cubic-bezier(.34,1.56,.64,1),background .25s}
.rwhd-lk a[aria-current="page"]{color:var(--rw-cloud)} .rwhd-lk a[aria-current="page"]::after{scale:1} .rwhd-lk a:hover::after{background:#FF3E88}
.rwhd-top.is-glass .rwhd-lk{background:color-mix(in srgb,var(--rw-cloud) 6%,transparent)}
.rwhd-act{display:flex;align-items:center;gap:10px;margin-left:auto}
.rwhd-cta{--ring:var(--rw-night)} .rwhd .rwhd-bar .rw-btn.rw-quiet{min-height:44px}
/* burger */
.rwhd-bg{display:inline-flex;align-items:center;gap:10px;height:44px;padding:0 16px 0 14px;border:0;border-radius:999px;cursor:pointer;color:var(--rw-cloud);background:color-mix(in srgb,var(--rw-night) 38%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 18%,transparent);font:inherit;transition:background .35s,color .35s,box-shadow .35s}
.rwhd-bg-l{position:relative;width:18px;height:12px;flex:none} .rwhd-bg-l i{position:absolute;left:0;width:100%;height:2px;border-radius:2px;background:currentColor;transition:top .45s cubic-bezier(.7,0,.2,1),rotate .45s cubic-bezier(.7,0,.2,1) .05s,width .45s} .rwhd-bg-l i:first-child{top:1px} .rwhd-bg-l i:last-child{top:9px;width:70%}
.rwhd-bg-t{font-size:11px;letter-spacing:.12em;text-transform:uppercase}
.rwhd-bg:hover .rwhd-bg-l i:last-child{width:100%}
.rwhd.is-open .rwhd-bg-l i{top:5px;width:100%} .rwhd.is-open .rwhd-bg-l i:first-child{rotate:45deg} .rwhd.is-open .rwhd-bg-l i:last-child{rotate:-45deg}
.rwhd.is-open .rwhd-bg{background:var(--rw-brass);color:var(--rw-ink);box-shadow:none}
/* light ground (probe) */
.rwhd-top.is-lt .rwhd-logo{color:var(--rw-ink)}
.rwhd-top.is-lt .rwhd-lk{background:color-mix(in srgb,var(--rw-ink) 5%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 12%,transparent)}
.rwhd-top.is-lt .rwhd-lk a{color:color-mix(in srgb,var(--rw-ink) 82%,transparent)} .rwhd-top.is-lt .rwhd-lk a[aria-current="page"]{color:var(--rw-ink)}
.rwhd-top.is-lt .rwhd-lk a:hover{background:var(--rw-ink);color:var(--rw-bone)}
.rwhd-top.is-lt .rwhd-lk a::after{box-shadow:0 0 0 1.5px var(--rw-ink)}
.rwhd-top.is-lt .rwhd-bar::before{background:color-mix(in srgb,var(--rw-bone) 84%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 9%,transparent),0 18px 40px -28px rgba(0,0,0,.35)}
.rwhd-top.is-lt.is-glass .rwhd-lk{background:color-mix(in srgb,var(--rw-ink) 4%,transparent)}
.rwhd-top.is-lt .rwhd-cta{--ring:var(--rw-bone)}
.rwhd-top.is-lt .rwhd-bg{color:var(--rw-ink);background:color-mix(in srgb,var(--rw-bone) 60%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 16%,transparent)}
.rwhd-top.is-lt :focus-visible{outline-color:var(--rw-ink)!important}
.rwhd-top:not(.is-lt) :where(a[href],button):focus-visible{outline-color:var(--rw-cloud)!important;box-shadow:0 0 0 2px var(--rw-night)!important}
.rwhd.is-open .rwhd-top .rwhd-logo{color:var(--rw-cloud)} .rwhd.is-open .rwhd-top .rwhd-bar::before{opacity:0}
/* drawer: spreads out of the burger like a ping */
.rwhd-drw{position:fixed;z-index:999;inset:0;background:var(--rw-night);color:var(--rw-cloud);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;clip-path:circle(0px at var(--bx,calc(100% - 40px)) var(--by,44px));visibility:hidden;transition:clip-path .7s cubic-bezier(.7,0,.2,1),visibility 0s linear .7s}
.rwhd.is-open .rwhd-drw{clip-path:circle(var(--br,160vmax) at var(--bx,calc(100% - 40px)) var(--by,44px));visibility:visible;transition:clip-path .85s cubic-bezier(.7,0,.2,1),visibility 0s}
.rwhd-rw{position:absolute;inset:0;overflow:hidden;pointer-events:none} .rwhd-rings{position:absolute;left:var(--bx,calc(100% - 40px));top:var(--by,44px);width:0;height:0;pointer-events:none}
.rwhd-rings i,.rwhd-rings b{position:absolute;left:0;top:0;border-radius:50%;translate:-50% -50%}
.rwhd-rings i{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 7%,transparent)} .rwhd-rings i:nth-child(1){width:44vmax;height:44vmax} .rwhd-rings i:nth-child(2){width:84vmax;height:84vmax} .rwhd-rings i:nth-child(3){width:124vmax;height:124vmax} .rwhd-rings i:nth-child(4){width:164vmax;height:164vmax}
.rwhd-rings b{width:164vmax;height:164vmax;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--rw-brass) 55%,transparent);scale:0;opacity:0}
.rwhd.is-open .rwhd-rings b{animation:rwhd-wave 4.8s cubic-bezier(.2,.6,.3,1) .5s infinite} .rwhd.is-open .rwhd-rings b:last-child{animation-delay:2.9s}
@keyframes rwhd-wave{0%{scale:.02;opacity:1}100%{scale:1;opacity:0}}
.rwhd-dr-in{position:relative;display:flex;flex-direction:column;justify-content:space-between;gap:40px;min-height:100%;padding:112px var(--pad) 36px}
.rwhd-dl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.rwhd-dl li{border-bottom:1px solid color-mix(in srgb,var(--rw-cloud) 12%,transparent)} .rwhd-dl li:first-child{border-top:1px solid color-mix(in srgb,var(--rw-cloud) 12%,transparent)}
.rwhd-dl a{position:relative;display:flex;align-items:center;gap:18px;padding:14px 0;text-decoration:none;color:var(--rw-cloud)}
.rwhd-dl-n{position:relative;display:grid;place-items:center;width:34px;flex:none;font-size:11px;letter-spacing:.1em;color:color-mix(in srgb,var(--rw-cloud) 50%,transparent);opacity:0;transition:opacity .5s ease calc(.3s + var(--i)*.06s)}
.rwhd-dl-m{display:block;overflow:hidden;padding:.06em 0 .12em;margin:-.06em 0 -.12em;flex:1}
.rwhd-dl-t{display:inline-block;font-size:clamp(40px,8.4vw,76px);line-height:1;letter-spacing:-.045em;font-weight:var(--rw-font-dw,700);translate:0 110%;transition:translate .9s cubic-bezier(.2,.85,.15,1) calc(.22s + var(--i)*.06s),color .3s}
.rwhd.is-open .rwhd-dl-t{translate:0 0} .rwhd.is-open .rwhd-dl-n{opacity:1}
.rwhd:not(.is-open) .rwhd-dl-t,.rwhd:not(.is-open) .rwhd-dl-n{transition-delay:0s;transition-duration:.3s}
.rwhd-dl-a{display:grid;place-items:center;width:48px;height:48px;flex:none;border-radius:50%;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 20%,transparent);opacity:0;translate:-10px 0;transition:opacity .3s,translate .45s cubic-bezier(.2,.8,.2,1),background .3s,color .3s}
.rwhd-dl a:hover .rwhd-dl-a,.rwhd-dl a:focus-visible .rwhd-dl-a{opacity:1;translate:0 0;background:var(--rw-brass);color:var(--rw-ink);box-shadow:none}
.rwhd-dl a:hover .rwhd-dl-t{color:var(--rw-brass)}
.rwhd-dl a[aria-current="page"] .rwhd-dl-t{color:var(--rw-brass)}
.rwhd-dl-p{position:relative;display:block;width:12px;height:12px;border-radius:50%;background:var(--rw-brass)} .rwhd-dl-p b{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 1.5px var(--rw-brass);animation:rwhd-ring 2s cubic-bezier(.2,.6,.3,1) infinite} .rwhd-dl-p b+b{animation-delay:1s}
@keyframes rwhd-ring{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(4.2)}}
.rwhd-dr-ft{display:flex;flex-direction:column;gap:28px;opacity:0;translate:0 16px;transition:opacity .6s ease,translate .8s cubic-bezier(.2,.8,.2,1)}
.rwhd.is-open .rwhd-dr-ft{opacity:1;translate:0 0;transition-delay:.55s}
.rwhd-dr-cta .rw-btn{--ring:var(--rw-night)} .rwhd-dr-cta .rw-btn.rw-solid{--face:var(--rw-brass);--fg:var(--rw-ink);--fill:var(--rw-cloud);--fg2:var(--rw-ink);--chip:var(--rw-ink);--chipfg:var(--rw-brass);--chip2:var(--rw-ink);--chipfg2:var(--rw-cloud)}
.rwhd-dr-info{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;font-size:13px}
.rwhd-dr-info>div{display:flex;flex-direction:column;gap:6px;min-width:0} .rwhd-dr-info a{color:var(--rw-cloud);text-decoration:none;overflow-wrap:anywhere} .rwhd-dr-info a:hover{color:var(--rw-brass)}
.rwhd-dr-k{margin:0 0 4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:color-mix(in srgb,var(--rw-cloud) 55%,transparent)}
.rwhd-soc{display:flex;flex-wrap:wrap;gap:6px 14px;list-style:none;margin:0;padding:0}
.rwhd-time{display:flex;align-items:center;gap:8px;margin:0}
.rwhd-live{width:7px;height:7px;flex:none;border-radius:50%;background:var(--rw-brass);animation:rwhd-live 1.6s infinite} @keyframes rwhd-live{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--rw-brass) 70%,transparent)}100%{box-shadow:0 0 0 10px transparent}}
/* tablet / phone */
.rwhd.is-cmp .rwhd-bar{gap:12px}
.rwhd.is-ph{--pad:16px} .rwhd.is-ph .rwhd-bar{padding-top:14px} .rwhd.is-ph .rwhd-top.is-glass .rwhd-bar{padding-top:14px} .rwhd.is-ph .rwhd-bar::before{top:6px;left:calc(var(--pad) - 9px);right:calc(var(--pad) - 9px);height:60px}
.rwhd.is-ph .rwhd-logo{font-size:19px} .rwhd.is-ph .rwhd-bg{width:44px;padding:0;justify-content:center} .rwhd.is-ph .rwhd-bg-t{display:none}
.rwhd.is-ph .rwhd-dr-in{padding-top:96px;gap:32px} .rwhd.is-ph .rwhd-dl a{gap:12px;padding:12px 0} .rwhd.is-ph .rwhd-dl-n{width:22px} .rwhd.is-ph .rwhd-dl-a{width:40px;height:40px}
.rwhd.is-ph .rwhd-dr-info{grid-template-columns:1fr 1fr} .rwhd.is-ph .rwhd-dr-info>div:first-child{grid-column:1/-1}
.rwhd.is-ph .rwhd-dr-cta .rw-btn{width:100%}
@media (max-width:1240px){.rwhd-lk a{padding:9px 11px}}
@media (max-width:360px){.rwhd .rwhd-logo{font-size:18px} .rwhd .rwhd-dl-t{font-size:36px} .rwhd .rwhd-dr-info{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.rwhd-drw{clip-path:none!important} .rwhd:not(.is-open) .rwhd-drw{opacity:0} .rwhd.is-open .rwhd-drw{opacity:1}}
`
addPropertyControls(RwHeader, {
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  links: { type: ControlType.String, title: "Links", description: "Label:/path, … (the link of the page you are on gets a lime dot)", displayTextArea: true, defaultValue: "Services:/services, Work:/work, Pricing:/pricing, About:/about, Blog:/blog" },
  ctaLabel: { type: ControlType.String, title: "Button", defaultValue: "Book a call" },
  ctaLink: { type: ControlType.Link, title: "Button link", description: "Empty = Booking Link on the Site CMS row" },
  menuLabel: { type: ControlType.String, title: "Menu label", defaultValue: "Menu" },
  closeLabel: { type: ControlType.String, title: "Close label", defaultValue: "Close" },
  contactLabel: { type: ControlType.String, title: "Contact label", defaultValue: "Say hello" },
  followLabel: { type: ControlType.String, title: "Socials label", defaultValue: "Follow" },
  timeLabel: { type: ControlType.String, title: "Time label", defaultValue: "Local time" },
})
