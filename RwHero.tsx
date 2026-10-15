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
const SW_BUILD = "RwHero@cms1"
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

// ===== RwHero =====
const IMG: Record<string, string> = {  }
interface HeroProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  photo: any; focusX: number; focusY: number; eyebrow: string; heading: string; subCopy: string
  primary: string; primaryLink: string; secondary: string; secondaryLink: string
  chips: string; services: string; counterLabel: string; counterStart: number; hint: string
  showNav: boolean; navLinks: string; navCta: string; style?: CSSProperties
}
// ---- THE REACH: a crowd seen from above, full-bleed. The visitor's pointer is the signal: rings pulse out of it every ~1.4 s and wherever a ring
// passes, the grey crowd blooms into colour (WebGL). People the ring crosses light up with a notification (likes, followers, a review, a #1 ranking),
// and the REACH counter climbs. A click launches a campaign: one big ring, longer colour, a bigger jump. No pointer (phones, idle) → a signal wanders the plaza. ----
const PHOTO = "https://framerusercontent.com/images/0OweuTthx3Dz38pzze75lZw78M.webp"
const IMG_AR = 2400 / 1340
// people in the photo (0..1 image coords) — the spots a ring can "reach"
const SPOTS: [number, number][] = [[0.31,0.12],[0.275,0.21],[0.41,0.17],[0.47,0.29],[0.54,0.3],[0.62,0.27],[0.75,0.18],[0.905,0.08],[0.935,0.19],[0.295,0.37],[0.255,0.39],[0.465,0.39],[0.625,0.39],[0.72,0.47],[0.805,0.43],[0.93,0.4],[0.07,0.58],[0.235,0.53],[0.56,0.56],[0.95,0.55],[0.315,0.65],[0.535,0.71],[0.61,0.73],[0.705,0.75],[0.89,0.74],[0.185,0.7],[0.35,0.8],[0.455,0.91],[0.635,0.94],[0.095,0.87],[0.94,0.89],[0.4,0.87]]
const Mark = ({ s = 30 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 32 32" aria-hidden className="rwh-mark"><circle cx="16" cy="16" r="15" fill="var(--rw-brass)" /><circle cx="16" cy="16" r="3.4" fill="var(--rw-ink)" /><path d="M10.2 21.8a8.2 8.2 0 0 1 0-11.6M21.8 10.2a8.2 8.2 0 0 1 0 11.6" fill="none" stroke="var(--rw-ink)" strokeWidth="2.4" strokeLinecap="round" /></svg>)
// rolling digits: every digit is a 0–9 column that slides to its value (keyed from the right so a new leading digit doesn't re-roll the rest)
const Roll = ({ text, className }: { text: string; className?: string }) => { const a = String(text).split(""); return (<span className={`rwh-roll${className ? " " + className : ""}`} aria-label={text}>{a.map((ch, i) => /\d/.test(ch) ? (<span key={a.length - i} className="rwh-rd" aria-hidden><span style={{ transform: `translateY(${-Number(ch) * 10}%)` }}>{"0123456789".split("").map((d) => <i key={d}>{d}</i>)}</span></span>) : (<span key={a.length - i} aria-hidden>{ch}</span>))}</span>) }
type Chip = { id: number; x: number; y: number; k: number; up: boolean }
const bigUrl = (u: string, w: number) => { const b = String(u || "").split("?")[0]; if (/framerusercontent\.com\/images\//.test(b)) return `${b}?scale-down-to=${w > 1200 ? 2048 : 1024}`; if (/images\.unsplash\.com\//.test(b)) return `${b}?w=${w}&q=74&fm=jpg&auto=format`; return b }
const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"
const FS = `precision mediump float;
uniform sampler2D uTex;uniform vec2 uView;uniform float uImg;uniform float uZoom;uniform vec2 uFoc;uniform float uTime;uniform vec3 uLime;uniform vec4 uP[8];uniform vec3 uPtr;uniform float uDiag;uniform float uDim;
vec2 cover(vec2 s){float ra=uView.x/uView.y;vec2 uv=s;if(ra>uImg){uv.y=(s.y-.5)*uImg/ra+.5;}else{uv.x=(s.x-.5)*ra/uImg+.5;}return (uv-.5)/uZoom+.5+uFoc;}
void main(){vec2 fc=vec2(gl_FragCoord.x,uView.y-gl_FragCoord.y);vec2 s=fc/uView;vec3 col=texture2D(uTex,clamp(cover(s),.001,.999)).rgb;
float l=dot(col,vec3(.299,.587,.114));vec3 grey=mix(vec3(l)*vec3(.9,.94,1.),vec3(.03,.035,.045),uDim);
float reach=0.;float rim=0.;
for(int i=0;i<8;i++){vec4 P=uP[i];if(P.w<=0.)continue;float age=uTime-P.z;if(age<0.)continue;float R=age*uDiag*(.2+.07*P.w);float d=distance(fc,P.xy);float life=2.4+2.6*P.w;float fade=1.-smoothstep(life*.4,life,age);float band=uDiag*(.008+.006*P.w);
rim+=exp(-pow((d-R)/band,2.))*(1.-smoothstep(0.,life*.75,age));reach=max(reach,(1.-smoothstep(R-band*5.,R+band,d))*fade);}
float sp=(1.-smoothstep(uDiag*.035,uDiag*.12,distance(fc,uPtr.xy)))*uPtr.z;reach=max(reach,sp*.85);
vec3 c=mix(grey,col*mix(1.,.86,uDim),reach);c=mix(c,uLime,clamp(rim,0.,1.)*.62);
float vg=smoothstep(.45,1.,s.y)*.55+(1.-smoothstep(0.,.2,s.y))*.28;c*=1.-vg;
gl_FragColor=vec4(c,1.);}`
export default function RwHero(props: HeroProps) {
  const { photo, focusX = 50, focusY = 50, eyebrow = "", heading = "Get seen by|the *right crowd.*", subCopy = "", primary = "Book a strategy call", primaryLink = "", secondary = "See our work", secondaryLink = "/work",
    chips = "❤|1.2k likes on one reel;+|86 new followers;★|New 5-star review;#1|“dentist near me”;●|12 leads today;↗|CTR up to 4.8%;✓|Call booked · Tue 10:30;◎|+318 profile visits;▶|48k video views;$|ROAS 6.2×", services = "SEO, Social media, Paid ads, Content",
    counterLabel = "People reached for clients this month", counterStart = 1284300, hint = "Move to reach · click to launch a campaign",
    showNav = true, navLinks = "Services:/services, Work:/work, Pricing:/pricing, About:/about, Blog:/blog", navCta = "Book a call", bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill(); const site = useSite()
  const root = useRef<HTMLElement>(null); const cv = useRef<HTMLCanvasElement>(null); const curEl = useRef<HTMLDivElement>(null); const copyEl = useRef<HTMLDivElement>(null)
  const { w, vh } = useSize(root, bpHint)
  const ready = useStage(live); const [inn0, setIn] = useState(false); useEffect(() => { if (!live || !ready) return; const t = window.setTimeout(() => setIn(true), 80); return () => window.clearTimeout(t) }, [live, ready]); const inn = inn0 || still || rm
  useMagnet(root, live)
  const phone = w < 810, tab = w >= 810 && w < 1100
  const src = srcOf(photo, IMG.hero || PHOTO)
  const CH = String(chips).split(";").map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf("|"); return i < 0 ? { i: "●", t: x } : { i: x.slice(0, i).trim(), t: x.slice(i + 1).trim() } })
  const SV = String(services).split(",").map((x) => x.trim()).filter(Boolean)
  const sub = pick(subCopy, site.tagline ? `${site.name} is a digital marketing agency. We run SEO, social media and paid ads that put your brand in front of the people who buy, and we report every result in plain numbers.` : "")
  const ann = pick(eyebrow, site.announce)
  const book = pick(primaryLink, site.book || "/contact")
  const [reach, setReach] = useState(Math.max(0, Math.round(counterStart))); useEffect(() => { setReach(Math.max(0, Math.round(counterStart))) }, [counterStart])
  const [chipList, setChips] = useState<Chip[]>([]); const cid = useRef(0); const acc = useRef(0)
  useEffect(() => { if (!live) return; const id = window.setInterval(() => { if (acc.current > 0) { const v = acc.current; acc.current = 0; setReach((x) => x + v) } }, 1400); return () => window.clearInterval(id) }, [live])
  const [gl, setGl] = useState(false); const [hasCur, setHasCur] = useState(false)
  // ---- the signal engine: WebGL crowd + pulses + reach detection ----
  useEffect(() => {
    if (!live || !root.current || !cv.current) return
    const r = root.current, canvas = cv.current
    const g0 = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false }) as WebGLRenderingContext | null
    if (!g0) return; const g: WebGLRenderingContext = g0
    const sh = (t: number, s: string) => { const o = g.createShader(t)!; g.shaderSource(o, s); g.compileShader(o); return o }
    const pr = g.createProgram()!; g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr)
    if (!g.getProgramParameter(pr, g.LINK_STATUS)) return
    g.useProgram(pr); const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW)
    const loc = g.getAttribLocation(pr, "p"); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0)
    const U = (n: string) => g.getUniformLocation(pr, n)
    const uView = U("uView"), uImg = U("uImg"), uZoom = U("uZoom"), uFoc = U("uFoc"), uTime = U("uTime"), uLime = U("uLime"), uP = U("uP"), uPtr = U("uPtr"), uDiag = U("uDiag"), uDim = U("uDim")
    const lime = cssRgb(r, c.brass, "212,255,58").split(",").map((v) => Number(v) / 255); g.uniform3f(uLime, lime[0], lime[1], lime[2])
    const tex = g.createTexture(); let imgAr = IMG_AR, texOk = false
    const im = new Image(); im.crossOrigin = "anonymous"; im.decoding = "async"
    im.onload = () => { try { g.bindTexture(g.TEXTURE_2D, tex); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE); g.texImage2D(g.TEXTURE_2D, 0, g.RGB, g.RGB, g.UNSIGNED_BYTE, im); imgAr = im.naturalWidth / im.naturalHeight; texOk = true; setGl(true) } catch (e) {} }
    im.src = bigUrl(src, window.innerWidth < 810 ? 1200 : 2000)
    let W = 1, H = 1, dpr = 1, diag = 1, vis = true, t0 = performance.now(), raf = 0, zoom = rm ? 1 : 1.12, sy = 0
    const size = () => { dpr = Math.min(window.devicePixelRatio || 1, 1.6); const a = r.getBoundingClientRect(); W = Math.max(1, a.width); H = Math.max(1, a.height); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); g.viewport(0, 0, canvas.width, canvas.height); diag = Math.hypot(W, H) }
    size(); const ro = new ResizeObserver(size); ro.observe(r)
    // pulses: [x, y, t, strength] in css px, seconds
    const P: number[][] = []; const now = () => (performance.now() - t0) / 1000
    const emit = (x: number, y: number, s: number) => { P.push([x, y, now(), s]); if (P.length > 8) P.shift(); acc.current += Math.round(s * (120 + Math.random() * 380)) }
    // spots on screen (same cover mapping as the shader) + cooldown
    const cool = SPOTS.map(() => -99)
    const spotXY = (hx: number, hy: number, fx: number, fy: number) => { const ra = W / H; let ux = (hx - fx - 0.5) * zoom + 0.5, uy = (hy - fy - 0.5) * zoom + 0.5; if (ra > imgAr) uy = (uy - 0.5) * ra / imgAr + 0.5; else ux = (ux - 0.5) * imgAr / ra + 0.5; return [ux * W, uy * H] }
    let k = Math.floor(Math.random() * 10)
    const reachSpots = (tn: number) => {
      const fx = (focusX - 50) / 100 * 0.3, fy = (focusY - 50) / 100 * 0.3; const cr = copyEl.current?.getBoundingClientRect(), rr = r.getBoundingClientRect()
      for (const p of P) { const age = tn - p[2]; if (age < 0) continue; const R = age * diag * (0.2 + 0.07 * p[3]); if (R > diag) continue
        SPOTS.forEach(([hx, hy], i) => { if (tn - cool[i] < 7) return; const [sx, sy2] = spotXY(hx, hy, fx, fy); if (sx < 90 || sx > W - 110 || sy2 < 190 || sy2 > H - 190) return
          if (cr && sx + rr.left > cr.left - 40 && sx + rr.left < cr.right + 40 && sy2 + rr.top > cr.top - 30 && sy2 + rr.top < cr.bottom + 20) return
          const d = Math.hypot(sx - p[0], sy2 - p[1]); if (Math.abs(d - R) > 14) return
          cool[i] = tn; const id = ++cid.current; const kk = k++ % Math.max(1, CH.length)
          setChips((l) => [...l.filter((x) => x.up).slice(-3), { id, x: Math.round(sx), y: Math.round(sy2), k: kk, up: true }]); acc.current += 40 + Math.round(Math.random() * 260)
          window.setTimeout(() => setChips((l) => l.map((x) => (x.id === id ? { ...x, up: false } : x))), 2600); window.setTimeout(() => setChips((l) => l.filter((x) => x.id !== id)), 3200) }) }
    }
    // pointer = the signal source; idle / touch = a wandering source
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches
    let px = W / 2, py = H * 0.55, tx = px, ty = py, on = 0, onT = 0, lastMove = -99, lastEmit = -99
    const mv = (e: PointerEvent) => { const a = r.getBoundingClientRect(); tx = e.clientX - a.left; ty = e.clientY - a.top; onT = 1; lastMove = now() }
    const lv = () => { onT = 0 }
    const dn = (e: PointerEvent) => { const t = e.target as HTMLElement; if (t.closest?.("a,button,input,nav")) return; const a = r.getBoundingClientRect(); const x = e.clientX - a.left, y = e.clientY - a.top; if (!fine) { tx = px = x; ty = py = y; lastMove = now() } emit(x, y, 1.6); lastEmit = now() }
    if (fine) { r.addEventListener("pointermove", mv as any); r.addEventListener("pointerleave", lv) }
    r.addEventListener("pointerdown", dn as any)
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(frame) }); io.observe(r)
    const PU = new Float32Array(32)
    const intro = rm ? 0 : 1.6
    function frame() {
      raf = 0; if (!vis || document.hidden) return
      const tn = now()
      const a = r.getBoundingClientRect(); sy = clamp01(-a.top / (a.height || 1))
      zoom = rm ? 1 + sy * 0.08 : 1 + 0.12 * Math.pow(1 - clamp01(tn / 2.2), 3) + sy * 0.08
      const idle = !fine || tn - lastMove > 2.6 || onT === 0
      if (idle) { const q = tn * 0.23; tx = W * (0.5 + 0.34 * Math.sin(q * 1.3)); ty = H * (0.5 + 0.28 * Math.sin(q * 0.9 + 1.2)) }
      px += (tx - px) * (idle ? 0.03 : 0.16); py += (ty - py) * (idle ? 0.03 : 0.16); on += ((fine && !idle ? 1 : 0) - on) * 0.08
      if (!rm && tn > intro) { if (tn - lastEmit > (idle ? 1.9 : 1.35)) { emit(px, py, idle ? 0.7 : 0.9); lastEmit = tn } }
      if (tn > intro - 0.2 && P.length === 0 && !rm) { emit(W / 2, H * 0.55, 1.4); lastEmit = tn }
      for (let i = 0; i < 8; i++) { const p = P[i]; PU[i * 4] = p ? p[0] * dpr : 0; PU[i * 4 + 1] = p ? p[1] * dpr : 0; PU[i * 4 + 2] = p ? p[2] : 0; PU[i * 4 + 3] = p ? p[3] : 0 }
      if (texOk) {
        const fx = (focusX - 50) / 100 * 0.3, fy = (focusY - 50) / 100 * 0.3
        g.uniform2f(uView, canvas.width, canvas.height); g.uniform1f(uImg, imgAr); g.uniform1f(uZoom, zoom); g.uniform2f(uFoc, fx, fy); g.uniform1f(uTime, tn); g.uniform4fv(uP, PU); g.uniform3f(uPtr, px * dpr, py * dpr, on); g.uniform1f(uDiag, diag * dpr); g.uniform1f(uDim, 0.42)
        g.drawArrays(g.TRIANGLE_STRIP, 0, 4)
      }
      reachSpots(tn)
      r.style.setProperty("--sy", sy.toFixed(4))
      raf = requestAnimationFrame(frame)
    }
    const vc = () => { if (!document.hidden && vis && !raf) raf = requestAnimationFrame(frame) }; document.addEventListener("visibilitychange", vc)
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); raf = -1 as any; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", vc); r.removeEventListener("pointermove", mv as any); r.removeEventListener("pointerleave", lv); r.removeEventListener("pointerdown", dn as any); try { g.getExtension("WEBGL_lose_context")?.loseContext() } catch (e) {} }
  }, [live, rm, src, focusX, focusY, chips])
  // cursor: a dot + a ring labelled REACH that pings on click, hugs buttons
  useEffect(() => { if (!live || phone || !root.current || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return; const r = root.current; setHasCur(true); let x = -99, y = -99, ax = -99, ay = -99, mode = "", on = false
    const set = (m: string) => { if (m !== mode) { mode = m; if (curEl.current) curEl.current.dataset.m = m } }
    const mv = (e: PointerEvent) => { x = e.clientX; y = e.clientY; on = true; const tg = e.target as HTMLElement; set(tg.closest?.(".rw-btn, nav a, .rwh-tags a") ? "btn" : tg.closest?.(".rwh-copy h1, .rwh-copy p") ? "dot" : "reach") }
    const lv = () => { on = false; set("out") }
    const dn = () => { const cu = curEl.current; if (!cu || mode === "btn") return; cu.classList.remove("is-ping"); void cu.offsetWidth; cu.classList.add("is-ping") }
    r.addEventListener("pointermove", mv as any); r.addEventListener("pointerleave", lv); r.addEventListener("pointerdown", dn)
    const off = onTick(() => { const cu = curEl.current; if (!cu || (!on && ax < -50)) return; ax += (x - ax) * 0.28; ay += (y - ay) * 0.28; cu.style.transform = `translate3d(${ax.toFixed(1)}px,${ay.toFixed(1)}px,0)` })
    return () => { off(); r.removeEventListener("pointermove", mv as any); r.removeEventListener("pointerleave", lv); r.removeEventListener("pointerdown", dn) } }, [live, phone])
  const H = phone ? 0 : Math.round(Math.min(Math.max(vh, 720), 1080))
  const links = linkList(navLinks)
  // canvas / editor / reduced motion: a still frame with three reached people
  const stillChips: Chip[] = [{ id: -1, x: 0, y: 0, k: 0, up: true }, { id: -2, x: 0, y: 0, k: 2, up: true }, { id: -3, x: 0, y: 0, k: 3, up: true }]
  const showChips = still || (rm && !gl) ? stillChips : chipList
  return (
    <section ref={root as any} className={`rw rw-dark rwh${phone ? " is-ph" : tab ? " is-tab" : ""}${inn ? " is-in" : ""}${still ? " is-still" : ""}${rm ? " is-rm" : ""}${gl ? " is-gl" : ""}${hasCur ? " has-cur" : ""}`} style={{ ...cssVars(c), ...B, ["--hh" as any]: H ? `${H}px` : "auto", ...(props.style || {}) }}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_HERO + siteFontCss(props) }} />
      <div className="rwh-bg" aria-hidden>
        <img className="rwh-img" src={bigUrl(src, phone ? 1200 : 2000)} srcSet={/unsplash/.test(src) ? `${bigUrl(src, 1000)} 1000w, ${bigUrl(src, 1600)} 1600w, ${bigUrl(src, 2200)} 2200w` : undefined} sizes="100vw" alt="" loading="eager" decoding="async" fetchPriority="high" style={{ objectPosition: `${focusX}% ${focusY}%` }} />
        <canvas ref={cv} className="rwh-cv" />
        {(still || (rm && !gl)) && <i className="rwh-stillring" />}
        <i className="rwh-shade" />
      </div>
      <div className="rwh-chips" aria-hidden>
        {showChips.map((ch, i) => { const it = CH[ch.k % Math.max(1, CH.length)] || { i: "●", t: "" }; return (
          <span key={ch.id} className={`rwh-chip${ch.up ? " is-up" : ""}`} style={ch.id < 0 ? undefined : { left: ch.x, top: ch.y }} data-s={ch.id < 0 ? String(-ch.id) : undefined}>
            <i className="rwh-chip-p" /><b className="rwh-chip-i" style={D}>{it.i}</b><span style={M}>{it.t}</span>
          </span>) })}
      </div>
      {showNav && (
        <nav className="rwh-nav" aria-label="Main" style={rise(inn, 60, -10)}>
          <a className="rwh-logo" href="/" aria-label={`${site.name} home`}><Mark /><span style={D}>{site.name}</span></a>
          <ul className="rwh-links">{links.map((l, i) => <li key={i}><a href={l.h}>{l.l}</a></li>)}</ul>
          <Btn href={book} label={navCta} kind="quiet" className="rwh-navcta" icon="cal" />
        </nav>
      )}
      {!phone && hint && <p className="rwh-hint" style={{ ...M, ...rise(inn, 900, 8) }}><i className="rwh-hint-r" aria-hidden />{hint}</p>}
      <div className="rwh-in">
        <div ref={copyEl} className="rwh-copy">
          {ann && <p className="rwh-ann" style={{ ...M, ...rise(inn, 180, 12) }}><i className="rw-port" aria-hidden />{ann}</p>}
          <h1 className="rwh-h1" style={D} aria-label={plainOf(heading)}>
            {String(heading).split("|").map((line, li) => { let k = li * 4; return (<span key={li} className="rwh-line" aria-hidden>{splitWords(line).map((wd, i) => (<span key={i} className="rwh-w"><span className={`rwh-wi${wd.acc ? " is-acc" : ""}`} style={{ transitionDelay: `${260 + (k++) * 70}ms` }}>{wd.t}{wd.tail}</span></span>)).reduce((acc: any[], el, i) => (i ? [...acc, " ", el] : [el]), [])}</span>) })}
          </h1>
          {sub && <p className="rwh-sub" style={rise(inn, 640, 16)}>{sub}</p>}
          <div className="rwh-btns" style={rise(inn, 760, 16)}>
            <Btn href={book} label={primary} kind="solid" icon="cal" />
            <Btn href={secondaryLink || "/work"} label={secondary} kind="ghost" />
          </div>
        </div>
      </div>
      <div className="rwh-strip" style={rise(inn, 900, 14)}>
        <div className="rwh-count">
          <p className="rwh-count-l" style={M}><i className="rwh-live" aria-hidden />{counterLabel}</p>
          <p className="rwh-count-n" style={D}><Roll text={reach.toLocaleString("en-US")} /></p>
        </div>
        <ul className="rwh-tags" style={M}>{SV.map((s, i) => <li key={i}><span>{String(i + 1).padStart(2, "0")}</span>{s}</li>)}</ul>
        <p className="rwh-proof" style={M}><span className="rwh-stars" aria-hidden>★★★★★</span><span><b>{site.rating}</b>{site.reviews ? ` · ${site.reviews} client reviews` : ""}</span>{site.clients && <span className="rwh-dim">{site.clients} brands grown</span>}</p>
      </div>
      {hasCur && <div ref={curEl} className="rwh-cur" data-m="out" aria-hidden><i className="rwh-cur-r"><b style={M}>Reach</b></i><i className="rwh-cur-d" /></div>}
    </section>
  )
}
const CSS_HERO = `
.rwh{position:relative;width:100%;height:var(--hh,100svh);min-height:640px;overflow:hidden;background:var(--rw-night);color:var(--rw-cloud);isolation:isolate}
.rwh.has-cur,.rwh.has-cur *{cursor:none!important}
.rwh-bg{position:absolute;inset:0;z-index:0;overflow:hidden;translate:0 calc(var(--sy,0)*14%)}
.rwh-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(1) brightness(.62) contrast(1.05);transform:scale(1.12);transition:transform 2.2s cubic-bezier(.2,.8,.2,1),opacity .6s}
.rwh.is-in .rwh-img{transform:scale(1)} .rwh.is-gl .rwh-img{opacity:0}
.rwh-cv{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .8s} .rwh.is-gl .rwh-cv{opacity:1}
.rwh-shade{position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 46% at 50% 50%,color-mix(in srgb,var(--rw-night) 52%,transparent),transparent 72%),linear-gradient(180deg,color-mix(in srgb,var(--rw-night) 55%,transparent) 0,transparent 18%)}
.rwh-stillring{position:absolute;left:62%;top:44%;width:520px;height:520px;translate:-50% -50%;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass),0 0 60px 6px color-mix(in srgb,var(--rw-brass) 40%,transparent);backdrop-filter:grayscale(0) saturate(1.6) brightness(1.5);-webkit-backdrop-filter:saturate(1.6) brightness(1.5)}
/* nav */
.rwh-nav{position:absolute;z-index:5;left:0;right:0;top:0;display:flex;align-items:center;gap:28px;max-width:${MAXW};margin:0 auto;padding:22px clamp(20px,3.2vw,48px) 0}
.rwh-logo{display:inline-flex;align-items:center;gap:10px;text-decoration:none;font-size:21px;letter-spacing:-.03em;font-weight:700}
.rwh-links{display:flex;gap:4px;list-style:none;margin:0 auto;padding:5px;border-radius:999px;background:color-mix(in srgb,var(--rw-night) 38%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 14%,transparent)}
.rwh-links a{display:block;padding:9px 16px;border-radius:999px;font-size:14px;text-decoration:none;color:color-mix(in srgb,var(--rw-cloud) 86%,transparent);transition:background .3s,color .3s} .rwh-links a:hover{background:var(--rw-cloud);color:var(--rw-ink)}
.rwh-navcta{--ring:var(--rw-night)}
.rwh-hint{position:absolute;z-index:4;right:clamp(20px,3.2vw,48px);top:96px;display:flex;align-items:center;gap:10px;margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:color-mix(in srgb,var(--rw-cloud) 70%,transparent)}
.rwh-hint-r{position:relative;width:14px;height:14px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--rw-brass)} .rwh-hint-r::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 1.5px var(--rw-brass);animation:rwh-ping 1.8s cubic-bezier(.2,.6,.3,1) infinite}
@keyframes rwh-ping{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.8)}}
/* copy, centred */
.rwh-in{position:absolute;z-index:3;inset:0;display:grid;place-items:center;padding:110px clamp(20px,3.2vw,48px) 180px;pointer-events:none}
.rwh-copy{display:flex;flex-direction:column;align-items:center;text-align:center;gap:24px;max-width:1100px;pointer-events:auto}
.rwh-ann{display:inline-flex;align-items:center;gap:10px;margin:0;padding:8px 14px 8px 12px;border-radius:999px;font-size:12px;letter-spacing:.04em;background:color-mix(in srgb,var(--rw-night) 45%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 16%,transparent)}
.rwh-h1{margin:0;font-size:clamp(64px,8.4vw,142px);line-height:.9;letter-spacing:-.055em;font-weight:var(--rw-font-dw,700);text-wrap:balance;text-shadow:0 2px 40px color-mix(in srgb,var(--rw-night) 45%,transparent)}
.rwh-line{display:block}
.rwh-w{display:inline-block;overflow:hidden;padding:0 .02em .1em;margin-bottom:-.1em;vertical-align:top}
.rwh-wi{display:inline-block;transform:translateY(105%);transition:transform 1.1s cubic-bezier(.2,.8,.2,1)} .rwh.is-in .rwh-wi{transform:none}
.rwh-wi.is-acc{position:relative;color:var(--rw-ink);padding:0 .08em;margin:0 -.04em;isolation:isolate;text-shadow:none}
.rwh-wi.is-acc::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:.12em;bottom:.02em;border-radius:.16em;background:var(--rw-brass);transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.7,0,.2,1) .95s} .rwh.is-in .rwh-wi.is-acc::before{transform:none}
.rwh-sub{margin:0;max-width:600px;font-size:18px;line-height:1.5;color:color-mix(in srgb,var(--rw-cloud) 86%,transparent);text-shadow:0 1px 18px color-mix(in srgb,var(--rw-night) 70%,transparent)}
.rwh-btns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:6px} .rwh-btns .rw-btn{--ring:var(--rw-night)}
/* chips */
.rwh-chips{position:absolute;inset:0;z-index:2;pointer-events:none}
.rwh-chip{position:absolute;display:inline-flex;align-items:center;gap:9px;padding:7px 13px 7px 7px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);font-size:12px;white-space:nowrap;box-shadow:0 14px 34px -12px rgba(0,0,0,.6);translate:-50% calc(-100% - 18px);transform-origin:50% 100%;scale:.4;opacity:0;transition:scale .5s cubic-bezier(.34,1.56,.64,1),opacity .35s,translate .6s cubic-bezier(.2,.8,.2,1)}
.rwh-chip.is-up{scale:1;opacity:1} .rwh-chip:not(.is-up){translate:-50% calc(-100% - 40px)}
.rwh-chip::after{content:"";position:absolute;left:50%;bottom:-16px;width:1.5px;height:14px;background:var(--rw-cloud);translate:-50% 0;opacity:.8}
.rwh-chip-i{display:grid;place-items:center;min-width:26px;height:26px;padding:0 6px;border-radius:999px;background:var(--rw-brass);color:var(--rw-ink);font-size:12px;font-weight:700}
.rwh-chip-p{position:absolute;right:-3px;top:-3px;width:10px;height:10px;border-radius:50%;background:#FF3E88;box-shadow:0 0 0 2px var(--rw-cloud)}
.rwh-chip[data-s="1"]{left:22%;top:34%} .rwh-chip[data-s="2"]{left:77%;top:30%} .rwh-chip[data-s="3"]{left:70%;top:72%}
/* bottom strip */
.rwh-strip{position:absolute;z-index:4;left:0;right:0;bottom:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:24px;max-width:${MAXW};margin:0 auto;padding:0 clamp(20px,3.2vw,48px) 36px}
.rwh-count-l{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:color-mix(in srgb,var(--rw-cloud) 72%,transparent)}
.rwh-live{width:7px;height:7px;border-radius:50%;background:var(--rw-brass);box-shadow:0 0 0 0 var(--rw-brass);animation:rwh-live 1.6s infinite} @keyframes rwh-live{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--rw-brass) 70%,transparent)}100%{box-shadow:0 0 0 10px transparent}}
.rwh-count-n{margin:0;font-size:clamp(34px,3.2vw,52px);line-height:1;letter-spacing:-.04em;font-weight:var(--rw-font-dw,700);font-variant-numeric:tabular-nums}
.rwh-roll{display:inline-flex} .rwh-rd{display:inline-block;height:1em;overflow:hidden;clip-path:inset(0);line-height:1;vertical-align:top} .rwh-rd>span{display:flex;flex-direction:column;transition:transform .7s cubic-bezier(.2,.8,.2,1)} .rwh-rd i{display:block;height:1em;font-style:normal}
.rwh-tags{display:flex;gap:6px;list-style:none;margin:0;padding:0;font-size:12px} .rwh-tags li{display:inline-flex;align-items:center;gap:8px;padding:8px 13px;border-radius:999px;background:color-mix(in srgb,var(--rw-night) 45%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 16%,transparent)} .rwh-tags li span{color:var(--rw-brass)}
.rwh-proof{display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin:0;font-size:12px;letter-spacing:.02em;text-align:right} .rwh-stars{color:var(--rw-brass);letter-spacing:.14em} .rwh-proof b{font-weight:600} .rwh-dim{color:color-mix(in srgb,var(--rw-cloud) 66%,transparent)}
/* cursor */
.rwh-cur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;will-change:transform} .rwh-cur-d,.rwh-cur-r{position:absolute;left:0;top:0;translate:-50% -50%;border-radius:50%}
.rwh-cur-d{width:8px;height:8px;background:var(--rw-brass);transition:scale .3s,opacity .3s}
.rwh-cur-r{display:grid;place-items:center;width:74px;height:74px;box-shadow:inset 0 0 0 1.5px var(--rw-brass);transition:width .45s cubic-bezier(.34,1.56,.64,1),height .45s cubic-bezier(.34,1.56,.64,1),background .3s,box-shadow .3s} .rwh-cur-r b{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--rw-brass);font-weight:500;translate:0 22px;transition:opacity .25s}
.rwh-cur[data-m="out"]{opacity:0} .rwh-cur[data-m="dot"] .rwh-cur-r{width:28px;height:28px;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--rw-cloud) 60%,transparent)} .rwh-cur[data-m="dot"] .rwh-cur-r b{opacity:0}
.rwh-cur[data-m="btn"] .rwh-cur-r{width:10px;height:10px;background:var(--rw-brass);box-shadow:none} .rwh-cur[data-m="btn"] .rwh-cur-r b{opacity:0} .rwh-cur[data-m="btn"] .rwh-cur-d{opacity:0}
.rwh-cur.is-ping .rwh-cur-r::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);animation:rwh-ping .9s cubic-bezier(.2,.6,.3,1)}
/* tablet */
.rwh.is-tab .rwh-links{display:none} .rwh.is-tab .rwh-navcta{margin-left:auto} .rwh.is-tab .rwh-h1{font-size:clamp(60px,9vw,92px)} .rwh.is-tab .rwh-strip{grid-template-columns:1fr 1fr} .rwh.is-tab .rwh-tags{display:none}
/* phone */
.rwh.is-ph{height:auto;min-height:100svh;display:flex;flex-direction:column}
.rwh.is-ph .rwh-nav{position:relative;padding:14px 16px 0;gap:12px} .rwh.is-ph .rwh-links{display:none} .rwh.is-ph .rwh-navcta{margin-left:auto} .rwh.is-ph .rwh-logo{font-size:19px}
.rwh.is-ph .rwh-in{position:relative;inset:auto;padding:56px 16px 36px;flex:1}
.rwh.is-ph .rwh-copy{gap:18px} .rwh.is-ph .rwh-h1{font-size:clamp(46px,13.4vw,60px)} .rwh.is-ph .rwh-sub{font-size:16px}
.rwh.is-ph .rwh-btns{flex-direction:column;align-items:stretch;width:100%} .rwh.is-ph .rwh-btns .rw-btn{width:100%}
.rwh.is-ph .rwh-strip{position:relative;grid-template-columns:1fr;gap:16px;padding:0 16px 28px} .rwh.is-ph .rwh-tags{flex-wrap:wrap} .rwh.is-ph .rwh-proof{align-items:flex-start;text-align:left}
.rwh.is-ph .rwh-chip{font-size:11px} .rwh.is-ph .rwh-stillring{width:300px;height:300px}
@media (max-width:1240px){.rwh-links a{padding:9px 11px}}`
addPropertyControls(RwHero, {
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  photo: { type: ControlType.ResponsiveImage, title: "Crowd photo", description: "A crowd seen from above works best" },
  focusX: { type: ControlType.Number, title: "Focus X", min: 0, max: 100, step: 1, unit: "%", defaultValue: 50 },
  focusY: { type: ControlType.Number, title: "Focus Y", min: 0, max: 100, step: 1, unit: "%", defaultValue: 50 },
  eyebrow: { type: ControlType.String, title: "Eyebrow", description: "Empty = the Announcement on the Site CMS row", defaultValue: "" },
  heading: { type: ControlType.String, title: "Heading", description: "| = line break, *words* = lime highlight", defaultValue: "Get seen by|the *right crowd.*", displayTextArea: true },
  subCopy: { type: ControlType.String, title: "Sub copy", defaultValue: "Reachwise is a digital marketing agency. We run SEO, social media and paid ads that put your brand in front of the people who buy, and we report every result in plain numbers.", displayTextArea: true },
  primary: { type: ControlType.String, title: "Primary button", defaultValue: "Book a strategy call" },
  primaryLink: { type: ControlType.Link, title: "Primary link", description: "Empty = Booking Link on the Site CMS row" },
  secondary: { type: ControlType.String, title: "Second button", defaultValue: "See our work" },
  secondaryLink: { type: ControlType.Link, title: "Second link", defaultValue: "/work" },
  chips: { type: ControlType.String, title: "Reach pop-ups", description: "icon|text; icon|text; …", displayTextArea: true, defaultValue: "❤|1.2k likes on one reel;+|86 new followers;★|New 5-star review;#1|“dentist near me”;●|12 leads today;↗|CTR up to 4.8%;✓|Call booked · Tue 10:30;◎|+318 profile visits;▶|48k video views;$|ROAS 6.2×" },
  services: { type: ControlType.String, title: "Service tags", defaultValue: "SEO, Social media, Paid ads, Content" },
  counterLabel: { type: ControlType.String, title: "Counter label", defaultValue: "People reached for clients this month" },
  counterStart: { type: ControlType.Number, title: "Counter start", min: 0, max: 99999999, step: 100, defaultValue: 1284300 },
  hint: { type: ControlType.String, title: "Hint", defaultValue: "Move to reach · click to launch a campaign" },
  showNav: { type: ControlType.Boolean, title: "Show nav", defaultValue: true },
  navLinks: { type: ControlType.String, title: "Nav links", description: "Label:/path, …", defaultValue: "Services:/services, Work:/work, Pricing:/pricing, About:/about, Blog:/blog" },
  navCta: { type: ControlType.String, title: "Nav button", defaultValue: "Book a call" },
})
