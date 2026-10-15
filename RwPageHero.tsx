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
const SW_BUILD = "RwPageHero@cms1"
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

// ===== RwPageHero =====
interface PageHeroProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  ground: string; object: string; eyebrow: string; title: string; lead: string
  primary: string; primaryLink: string; secondary: string; secondaryLink: string; meta: string; scrollCue: string
  chips: string; centerLabel: string
  chartLabel: string; chartKpi: string; chartSub: string; chartStats: string; chartPop: string; chartPoints: string
  query: string; ourTitle: string; ourDomain: string; others: string; searchPop: string
  style?: CSSProperties
}
// ---- THE SIGNAL CARD: inner-page hero. Copy left (eyebrow, h1 with the lime marker, lead, CTA pair), a signature OBJECT right:
// pulse = a small reach scope (rings emit from a dot, people-dots light as each ring passes, three notification chips orbit) ·
// chart = a client report card (line draws, KPI counts, a lead pops) · search = a results page where the query types itself and OUR result climbs to #1.
// Scroll: as the hero leaves, the object lifts + scales, the title drifts slower (depth). Pointer tilts the object in 3D. ----
const PH_DOTS: [number, number][] = Array.from({ length: 56 }, (_, i) => { const a = i * 2.39996 + ((i * 37) % 11) * 0.05; const r = 0.07 + 0.39 * Math.sqrt((i + 3) / 59) + (((i * 53) % 7) - 3) * 0.006; return [0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r] as [number, number] }).filter(([x, y]) => Math.hypot(x - 0.5, y - 0.5) > 0.1)
const phCount = (txt: string, p: number) => { const m = String(txt).match(/^([^\d]*)([\d.,]+)(.*)$/); if (!m) return txt; const n = parseFloat(m[2].replace(/,/g, "")); if (!isFinite(n)) return txt; const dec = (m[2].split(".")[1] || "").length; const v = n * p; return `${m[1]}${dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")}${m[3]}` }
export default function RwPageHero(props: PageHeroProps) {
  const { ground = "chalk", object = "pulse", eyebrow = "(Services) What we do", title = "Growth on|*every* channel.", lead = "SEO, social media, paid ads, content, web design and branding. One team, one monthly retainer and one report in plain numbers.",
    primary = "Book a call", primaryLink = "", secondary = "See pricing", secondaryLink = "/pricing", meta = "SEO;Social media;Paid ads;Content;Web design;Branding", scrollCue = "Scroll",
    chips = "❤|1.2k likes on one reel;★|New 5-star review;#1|“dentist near me”", centerLabel = "Your brand",
    chartLabel = "Organic traffic · last 12 months", chartKpi = "+212%", chartSub = "vs. the year before", chartStats = "Leads:2,940;CTR:4.8%;ROAS:6.2×", chartPop = "New lead · Haven Realty", chartPoints = "12,18,16,24,22,31,36,34,45,52,61,74",
    query = "marketing agency near me", ourTitle = "", ourDomain = "", others = "Top 10 marketing agencies of 2026 — a ranked list;Marketing agency pricing: what to expect;How to choose a digital agency", searchPop = "+318 clicks this week", bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill(); const site = useSite()
  const root = useRef<HTMLElement>(null); const obj = useRef<HTMLDivElement>(null)
  const { w } = useSize(root, bpHint); const phone = w < 810, tab = w >= 810 && w < 1100
  const on = useOn(root, live, rm, 0.05); useMagnet(root, live)
  const dark = ground === "dark"; const K = ["pulse", "chart", "search", "none"].includes(object) ? object : "pulse"
  const book = pick(primaryLink, site.book || "/contact")
  const M_ = listOf(meta)
  // exit progress (0 at rest → 1 when the hero has scrolled away) + pointer tilt, one shared tick
  useEffect(() => {
    if (!live || rm || !root.current) return; const el = root.current; let top = 0, h = 1, vis = true, ex = -1, tx = 0, ty = 0, cx = 0, cy = 0, last = ""
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting }, { rootMargin: "20% 0px 20% 0px" }); io.observe(el)
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches
    const mv = (e: PointerEvent) => { const o = obj.current; if (!o) return; const r = o.getBoundingClientRect(); tx = clamp01((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1; ty = clamp01((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1 }
    const lv = () => { tx = 0; ty = 0 }
    if (fine) { el.addEventListener("pointermove", mv as any); el.addEventListener("pointerleave", lv) }
    const off = onTick(() => { if (!vis) return; const t = clamp01(-top / Math.max(1, h)); ex = ex < 0 ? t : ex + (t - ex) * 0.2; cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08
      const s = `${ex.toFixed(4)}|${cx.toFixed(3)}|${cy.toFixed(3)}`; if (s === last) return; last = s; el.style.setProperty("--ex", ex.toFixed(4)); el.style.setProperty("--tx", cx.toFixed(3)); el.style.setProperty("--ty", cy.toFixed(3)) },
      () => { if (!vis) return; const r = el.getBoundingClientRect(); top = r.top; h = r.height })
    return () => { off(); io.disconnect(); el.removeEventListener("pointermove", mv as any); el.removeEventListener("pointerleave", lv) }
  }, [live, rm])
  // ---- chart: KPI count-up + a lead that pops every few seconds ----
  const final = still || rm
  const [kp, setKp] = useState(final ? 1 : 0); const [pop, setPop] = useState(final)
  useEffect(() => { if (final) { setKp(1); setPop(true); return } if (!on || K !== "chart") return; let raf = 0; const t0 = performance.now(); const f = (t: number) => { const p = clamp01((t - t0 - 500) / 1800); setKp(1 - Math.pow(1 - p, 3)); if (p < 1) raf = requestAnimationFrame(f) }; raf = requestAnimationFrame(f)
    const t1 = window.setTimeout(() => setPop(true), 2300); const id = window.setInterval(() => { setPop(false); window.setTimeout(() => setPop(true), 700) }, 5200)
    return () => { cancelAnimationFrame(raf); window.clearTimeout(t1); window.clearInterval(id) } }, [on, K, final])
  // ---- search: type → results (ours 3rd) → ours climbs to #1 → hold → loop ----
  const [typed, setTyped] = useState(final ? query.length : 0); const [sph, setSph] = useState(final ? 2 : 0)
  useEffect(() => { if (final) { setTyped(query.length); setSph(2); return } if (!on || K !== "search") return; let tm: number[] = []; let dead = false
    const run = () => { if (dead) return; setSph(0); setTyped(0); let i = 0; const ty = () => { if (dead) return; i++; setTyped(i); if (i < query.length) tm.push(window.setTimeout(ty, 55 + Math.random() * 60)); else { tm.push(window.setTimeout(() => setSph(1), 380)); tm.push(window.setTimeout(() => setSph(2), 1700)); tm.push(window.setTimeout(run, 8200)) } }; tm.push(window.setTimeout(ty, 500)) }
    run(); return () => { dead = true; tm.forEach((x) => window.clearTimeout(x)) } }, [on, K, final, query])
  const CH = listOf(chips).map((x) => { const i = x.indexOf("|"); return i < 0 ? { i: "●", t: x } : { i: x.slice(0, i).trim(), t: x.slice(i + 1).trim() } }).slice(0, 3)
  const PTS = String(chartPoints).split(",").map((x) => parseFloat(x)).filter((x) => isFinite(x)); const pts = PTS.length > 1 ? PTS : [1, 2]
  const mx = Math.max(...pts), mn = Math.min(...pts); const X = (i: number) => 8 + (i / (pts.length - 1)) * 384, Y = (v: number) => 150 - ((v - mn) / Math.max(1e-6, mx - mn)) * 124
  const line = pts.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" "); const area = `${line} L${X(pts.length - 1).toFixed(1)} 170 L${X(0).toFixed(1)} 170 Z`
  const STATS = listOf(chartStats).map((x) => { const i = x.indexOf(":"); return i < 0 ? { k: x, v: "" } : { k: x.slice(0, i).trim(), v: x.slice(i + 1).trim() } })
  const domain = pick(ourDomain, (site.email.split("@")[1] || `${site.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`))
  const oTitle = pick(ourTitle, `${site.name} · ${site.role || "Digital marketing agency"} in ${site.city || "your city"}`)
  const OT = listOf(others).slice(0, 3); const ODOM = ["agencyranker.io", "pricingguide.co", "marketers.hub"]
  // results: [ours, ...others]; slot of each row per phase
  const slotOf = (i: number) => { if (i === 0) return sph >= 2 ? 0 : 2; const k = i - 1; return sph >= 2 ? k + 1 : k < 2 ? k : k + 1 }
  const gid = `rwph-g-${dark ? "d" : "l"}`
  const objEl = K === "none" ? null : (
    <div className="rwph-objw" style={rise(on, 260, 30)}>
      <div ref={obj} className={`rwph-obj rwph-${K}`}>
        {K === "pulse" && (
          <div className="rwph-scope" role="img" aria-label={`Reach: ${CH.map((x) => x.t).join(", ")}`}>
            <svg className="rwph-grid" viewBox="0 0 200 200" aria-hidden>{[0.3, 0.55, 0.8, 1].map((f, i) => <circle key={i} cx="100" cy="100" r={98 * f} />)}<path d="M100 2V198M2 100H198" /></svg>
            {PH_DOTS.map(([x, y], i) => { const d = Math.hypot(x - 0.5, y - 0.5) / 0.5; return <i key={i} className="rwph-pp" style={{ left: `${x * 100}%`, top: `${y * 100}%`, ["--d" as any]: d.toFixed(3) }} aria-hidden /> })}
            <span className="rwph-wave" aria-hidden><b /><b /><b /></span>
            <span className="rwph-core" aria-hidden><svg viewBox="0 0 32 32" width="40" height="40"><circle cx="16" cy="16" r="15" fill="var(--rw-brass)" /><circle cx="16" cy="16" r="3.4" fill="var(--rw-ink)" /><path d="M10.2 21.8a8.2 8.2 0 0 1 0-11.6M21.8 10.2a8.2 8.2 0 0 1 0 11.6" fill="none" stroke="var(--rw-ink)" strokeWidth="2.4" strokeLinecap="round" /></svg></span>
            {centerLabel && <span className="rwph-cl" style={M} aria-hidden>{centerLabel}</span>}
            <div className="rwph-orbit" aria-hidden>{CH.map((ch, i) => (
              <span key={i} className="rwph-oa" style={{ rotate: `${i * 120 + 30}deg` }}><span className="rwph-chip" style={{ rotate: `${-(i * 120 + 30)}deg`, ["--i" as any]: i }}><i className="rwph-chip-p" /><b style={D}>{ch.i}</b><span style={M}>{ch.t}</span></span></span>))}</div>
          </div>)}
        {K === "chart" && (
          <div className="rwph-card">
            <div className="rwph-ch-h" style={M}><span>{chartLabel}</span><span className="rwph-livep"><i />Live</span></div>
            <div className="rwph-kpi"><b style={D}>{phCount(chartKpi, kp)}</b><span style={M}>{chartSub}</span></div>
            <div className="rwph-plot"><svg className={`rwph-svg${on || final ? " is-on" : ""}`} viewBox="0 0 400 176" preserveAspectRatio="none" aria-hidden>
              {[0, 1, 2, 3].map((k) => <line key={k} x1="0" x2="400" y1={26 + k * 44} y2={26 + k * 44} className="rwph-gl" />)}
              <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--rw-brass)" stopOpacity={dark ? 0.42 : 0.6} /><stop offset="1" stopColor="var(--rw-brass)" stopOpacity="0" /></linearGradient></defs><path d={area} className="rwph-area" fill={`url(#${gid})`} /><path d={line} className="rwph-line" pathLength={1} />
            </svg>
            <span className={`rwph-end${on || final ? " is-on" : ""}`} style={{ left: `${(X(pts.length - 1) / 400) * 100}%`, top: `${(Y(pts[pts.length - 1]) / 176) * 100}%` }} aria-hidden><i /></span></div>
            <div className="rwph-stats">{STATS.map((s, i) => <div key={i}><span style={M}>{s.k}</span><b style={D}>{s.v}</b></div>)}</div>
            {chartPop && <span className={`rwph-pop${pop ? " is-up" : ""}`} aria-hidden><i className="rwph-chip-p" /><b style={D}>●</b><span style={M}>{chartPop}</span></span>}
          </div>)}
        {K === "search" && (
          <div className="rwph-card rwph-serp">
            <div className="rwph-q" style={M}><svg viewBox="0 0 24 24" aria-hidden><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.8-4.8" /></svg><span className="rwph-qt">{query.slice(0, typed)}<i className={`rwph-caret${typed >= query.length ? " is-done" : ""}`} /></span></div>
            <p className="rwph-sc" style={M}>{sph ? "About 2,140,000 results" : " "}</p>
            <ol className={`rwph-res${sph ? " is-on" : ""}`} aria-label={`Search results for ${query}`}>
              {[{ d: domain, t: oTitle, us: true }, ...OT.map((t, i) => ({ d: ODOM[i] || "example.com", t, us: false }))].map((r, i) => (
                <li key={i} className={`rwph-r${r.us ? " is-us" : ""}${r.us && sph >= 2 ? " is-top" : ""}`} style={{ ["--s" as any]: slotOf(i), ["--k" as any]: i }}>
                  <span className="rwph-fav" aria-hidden>{r.us ? <svg viewBox="0 0 32 32" width="100%" height="100%"><circle cx="16" cy="16" r="15" fill="var(--rw-brass)" /><circle cx="16" cy="16" r="3.4" fill="var(--rw-ink)" /></svg> : null}</span>
                  <span className="rwph-rt"><span className="rwph-rd" style={M}>{r.d}</span><span className="rwph-rh" style={D}>{r.t}</span><i className="rwph-sk" aria-hidden /></span>
                  {r.us && <span className="rwph-rank" style={M} aria-hidden>#{sph >= 2 ? 1 : 3}</span>}
                </li>))}
            </ol>
            {searchPop && <span className={`rwph-pop${sph >= 2 ? " is-up" : ""}`} aria-hidden><i className="rwph-chip-p" /><b style={D}>↗</b><span style={M}>{searchPop}</span></span>}
          </div>)}
      </div>
    </div>)
  return (
    <section ref={root as any} className={`rw rw-sec rwph${dark ? " rw-dark is-dk" : " is-lt"}${phone ? " is-ph" : tab ? " is-tab" : ""}${on ? " is-on" : ""}${final ? " is-fin" : ""}${K === "none" ? " is-noobj" : ""}`} style={{ ...cssVars(c), ...B, ...(props.style || {}) }}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_MOTION + CSS_PH + siteFontCss(props) }} />
      <div className="rwph-bgf" aria-hidden />
      <div className="rw-wrap rwph-in">
        <div className="rwph-copy">
          <Eyebrow text={eyebrow} on={on} M={M} />
          <Head text={title} on={on} D={D} tag="h1" size={phone ? "clamp(44px,12.4vw,60px)" : tab ? "clamp(52px,7.4vw,76px)" : "clamp(60px,6.4vw,104px)"} lh={0.93} delay={80} step={60} className="rwph-h1" />
          {lead && <p className="rwph-lead" style={rise(on, 420, 16)}>{lead}</p>}
          {(primary || secondary) && <div className="rwph-btns" style={rise(on, 540, 16)}>
            {primary && <Btn href={book} label={primary} kind="solid" icon="cal" />}
            {secondary && <Btn href={secondaryLink || "/"} label={secondary} kind="ghost" />}
          </div>}
        </div>
        {objEl}
      </div>
      {(M_.length > 0 || scrollCue) && <div className="rw-wrap rwph-meta" style={{ ...M, ...rise(on, 700, 10) }}>
        <ul>{M_.map((x, i) => <li key={i}><span>{String(i + 1).padStart(2, "0")}</span>{x}</li>)}</ul>
        {scrollCue && !phone && <p className="rwph-cue"><i aria-hidden />{scrollCue}</p>}
      </div>}
    </section>
  )
}
const CSS_PH = `
.rwph{--ex:0;--tx:0;--ty:0;position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:max(640px,72svh);padding:148px 0 0;background:var(--rw-bone);color:var(--rw-ink);overflow:hidden;isolation:isolate}
.rwph.is-dk{background:var(--rw-night);color:var(--rw-cloud)}
.rwph-bgf{position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(color-mix(in srgb,var(--rw-ink) 12%,transparent) 1px,transparent 1.4px) 0 0/22px 22px;-webkit-mask:radial-gradient(60% 70% at 78% 52%,#000 0,transparent 75%);mask:radial-gradient(60% 70% at 78% 52%,#000 0,transparent 75%)}
.rwph.is-dk .rwph-bgf{background-image:radial-gradient(color-mix(in srgb,var(--rw-cloud) 13%,transparent) 1px,transparent 1.4px)}
.rwph-in{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);align-items:end;gap:clamp(32px,4vw,80px);padding-bottom:clamp(40px,4.4vw,64px)}
.rwph.is-noobj .rwph-in{grid-template-columns:minmax(0,1fr)}
.rwph-copy{display:flex;flex-direction:column;align-items:flex-start;gap:24px;translate:0 calc(var(--ex)*72px);opacity:calc(1 - var(--ex)*1.1)}
.rwph-h1{max-width:12ch;letter-spacing:-.05em;font-weight:var(--rw-font-dw,700)}
.rwph.is-noobj .rwph-h1{max-width:16ch}
.rwph .rw-hd-w.is-accw{padding-left:.1em;padding-right:.1em;margin-left:-.1em;margin-right:-.1em}
.rwph.is-lt .rw-it{position:relative;z-index:0;color:var(--rw-ink);font-weight:inherit;padding:0 .06em}
.rwph.is-lt .rw-it::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:.12em;bottom:.02em;border-radius:.16em;background:var(--rw-brass);transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.7,0,.2,1) var(--pd,.6s)}
.rwph.is-lt .rw-hd.is-on .rw-it::before{transform:none}
.rwph.is-dk .rw-it{color:var(--rw-brass);font-weight:inherit}
.rwph-lead{margin:0;max-width:540px;font-size:18px;line-height:1.5;color:var(--rw-mut)}
.rwph-btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:4px} .rwph.is-dk .rwph-btns .rw-btn{--ring:var(--rw-night)} .rwph.is-dk .rwph-btns .rw-btn.rw-solid{--face:var(--rw-brass);--fg:var(--rw-ink);--fill:var(--rw-cloud);--fg2:var(--rw-ink);--chip:var(--rw-ink);--chipfg:var(--rw-brass);--chip2:var(--rw-ink);--chipfg2:var(--rw-cloud)}
/* object column: lifts + scales as the hero leaves, tilts toward the pointer */
.rwph-objw{display:flex;justify-content:flex-end;perspective:1200px}
.rwph-obj{position:relative;width:min(500px,100%);transform-style:preserve-3d;translate:0 calc(var(--ex)*-90px);scale:calc(1 + var(--ex)*.08);transform:rotateX(calc(var(--ty)*-7deg)) rotateY(calc(var(--tx)*9deg));will-change:transform}
/* meta strip */
.rwph-meta{display:flex;align-items:center;justify-content:space-between;gap:24px;padding-top:18px;padding-bottom:22px;position:relative}
.rwph-meta::before{content:"";position:absolute;left:var(--pad);right:var(--pad);top:0;height:1px;background:var(--rw-fog)} .rwph.is-dk .rwph-meta::before{background:color-mix(in srgb,var(--rw-cloud) 14%,transparent)}
.rwph-meta ul{display:flex;flex-wrap:wrap;gap:6px 22px;list-style:none;margin:0;padding:0;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase}
.rwph-meta li{display:inline-flex;gap:8px;color:var(--rw-ink)} .rwph.is-dk .rwph-meta li{color:var(--rw-cloud)} .rwph-meta li span{color:var(--rw-mut)}
.rwph-cue{display:flex;align-items:center;gap:10px;margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--rw-mut)}
.rwph-cue i{position:relative;width:1.5px;height:22px;overflow:hidden;background:color-mix(in srgb,currentColor 30%,transparent)} .rwph-cue i::after{content:"";position:absolute;left:0;top:0;width:100%;height:50%;background:var(--rw-brass);animation:rwph-cue 1.8s cubic-bezier(.7,0,.2,1) infinite} .rwph.is-lt .rwph-cue i::after{background:var(--rw-ink)}
@keyframes rwph-cue{0%{translate:0 -100%}100%{translate:0 200%}}
/* chips (shared) */
.rwph-chip,.rwph-pop{display:inline-flex;align-items:center;gap:9px;padding:6px 13px 6px 6px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);font-size:12px;white-space:nowrap;box-shadow:0 14px 34px -14px rgba(0,0,0,.45),inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 6%,transparent)}
.rwph-chip b,.rwph-pop b{display:grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:var(--rw-brass);color:var(--rw-ink);font-size:11.5px;font-weight:700}
.rwph-chip-p{position:absolute;right:-3px;top:-3px;width:10px;height:10px;border-radius:50%;background:#FF3E88;box-shadow:0 0 0 2px var(--rw-cloud)}
.rwph-chip,.rwph-pop{position:relative}
/* ---- pulse ---- */
.rwph-scope{position:relative;width:100%;aspect-ratio:1}
.rwph-grid{position:absolute;inset:0;width:100%;height:100%;overflow:visible} .rwph-grid circle,.rwph-grid path{fill:none;stroke:color-mix(in srgb,var(--rw-ink) 16%,transparent);stroke-width:.4} .rwph-grid circle:last-of-type{stroke:color-mix(in srgb,var(--rw-ink) 30%,transparent);stroke-dasharray:1 2}
.rwph.is-dk .rwph-grid circle,.rwph.is-dk .rwph-grid path{stroke:color-mix(in srgb,var(--rw-cloud) 16%,transparent)} .rwph.is-dk .rwph-grid circle:last-of-type{stroke:color-mix(in srgb,var(--rw-cloud) 30%,transparent)}
.rwph-pp{position:absolute;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:color-mix(in srgb,var(--rw-ink) 32%,transparent);animation:rwph-pp 1.4s linear infinite both;animation-delay:calc((var(--d) - .06) / .94 * 4.2s)}
.rwph.is-dk .rwph-pp{background:color-mix(in srgb,var(--rw-cloud) 32%,transparent)}
@keyframes rwph-pp{0%{background:var(--rw-brass);box-shadow:0 0 0 4px color-mix(in srgb,var(--rw-brass) 35%,transparent);scale:1.6}40%{scale:1}70%,100%{box-shadow:0 0 0 0 transparent}}
.rwph.is-lt .rwph-pp{--pk:var(--rw-ink)}
.rwph-wave{position:absolute;inset:0;pointer-events:none} .rwph-wave b{position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 2px var(--rw-brass),0 0 24px -4px color-mix(in srgb,var(--rw-brass) 60%,transparent);scale:0;opacity:0;animation:rwph-wave 4.2s linear infinite} .rwph-wave b:nth-child(2){animation-delay:1.4s} .rwph-wave b:nth-child(3){animation-delay:2.8s}
@keyframes rwph-wave{0%{scale:.06;opacity:1}75%{opacity:.5}100%{scale:1;opacity:0}}
.rwph.is-lt .rwph-wave b{box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--rw-brass) 100%,transparent),inset 0 0 0 3px color-mix(in srgb,var(--rw-ink) 14%,transparent)}
.rwph-core{position:absolute;left:50%;top:50%;translate:-50% -50%;display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:var(--rw-ink);box-shadow:0 20px 40px -18px rgba(0,0,0,.6)} .rwph.is-dk .rwph-core{background:color-mix(in srgb,var(--rw-cloud) 8%,var(--rw-night));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 18%,transparent)}
.rwph-cl{position:absolute;left:50%;top:calc(50% + 44px);translate:-50% 0;padding:4px 9px;border-radius:999px;background:var(--rw-ink);color:var(--rw-cloud);font-size:10px;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
.rwph.is-dk .rwph-cl{background:var(--rw-brass);color:var(--rw-ink)}
.rwph-orbit{position:absolute;inset:14%;animation:rwph-spin 60s linear infinite} .rwph-oa{position:absolute;left:50%;top:0;width:0;height:50%;transform-origin:50% 100%}
.rwph-oa .rwph-chip{position:absolute;left:0;top:0;translate:-50% -50%;animation:rwph-spin 60s linear infinite reverse,rwph-bob 4s ease-in-out infinite;animation-delay:0s,calc(var(--i)*-1.3s)}
@keyframes rwph-spin{to{transform:rotate(360deg)}} @keyframes rwph-bob{50%{margin-top:-6px}}
.rwph.is-fin .rwph-orbit,.rwph.is-fin .rwph-oa .rwph-chip{animation:none} .rwph.is-fin .rwph-wave b{animation:none;opacity:.8} .rwph.is-fin .rwph-wave b:nth-child(1){scale:.34} .rwph.is-fin .rwph-wave b:nth-child(2){scale:.64} .rwph.is-fin .rwph-wave b:nth-child(3){scale:.94;opacity:.35} .rwph.is-fin .rwph-pp{animation:none}
/* ---- card (chart + search) ---- */
.rwph-card{position:relative;padding:22px 22px 20px;border-radius:24px;background:var(--rw-cloud);color:var(--rw-ink);box-shadow:0 40px 80px -40px rgba(0,0,0,.35),inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 7%,transparent)}
.rwph.is-dk .rwph-card{background:var(--rw-pine);color:var(--rw-cloud);box-shadow:0 40px 80px -40px rgba(0,0,0,.8),inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 12%,transparent)}
.rwph-ch-h{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--rw-mut)}
.rwph-livep{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:999px;background:color-mix(in srgb,var(--rw-ink) 6%,transparent);color:var(--rw-ink)} .rwph.is-dk .rwph-livep{background:color-mix(in srgb,var(--rw-cloud) 10%,transparent);color:var(--rw-cloud)}
.rwph-livep i{width:6px;height:6px;border-radius:50%;background:#FF3E88;animation:rw-blink 1.4s ease-in-out infinite}
.rwph-kpi{display:flex;align-items:baseline;gap:12px;margin:18px 0 6px} .rwph-kpi b{font-size:clamp(48px,4.6vw,72px);line-height:.9;letter-spacing:-.05em;font-weight:var(--rw-font-dw,700);font-variant-numeric:tabular-nums} .rwph-kpi span{font-size:11.5px;letter-spacing:.06em;color:var(--rw-mut)}
.rwph-plot{position:relative}
.rwph-svg{display:block;width:100%;height:176px;overflow:visible}
.rwph-gl{stroke:color-mix(in srgb,var(--rw-ink) 9%,transparent);stroke-width:1;vector-effect:non-scaling-stroke;stroke-dasharray:2 4} .rwph.is-dk .rwph-gl{stroke:color-mix(in srgb,var(--rw-cloud) 12%,transparent)}
.rwph-area{opacity:0;transition:opacity 1.2s ease 1.2s} .rwph-svg.is-on .rwph-area{opacity:1}
.rwph-line{fill:none;stroke:var(--rw-ink);stroke-width:2.5;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 2.2s cubic-bezier(.6,0,.2,1) .4s} .rwph.is-dk .rwph-line{stroke:var(--rw-brass)} .rwph-svg.is-on .rwph-line{stroke-dashoffset:0}
.rwph-end{position:absolute;width:0;height:0;opacity:0;transition:opacity .4s ease 2.4s} .rwph-end.is-on{opacity:1}
.rwph-end i{position:absolute;left:-6px;top:-6px;width:12px;height:12px;border-radius:50%;background:var(--rw-brass);box-shadow:0 0 0 3px var(--rw-ink)} .rwph.is-dk .rwph-end i{box-shadow:0 0 0 3px var(--rw-pine)}
.rwph-end i::after{content:"";position:absolute;inset:-3px;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);animation:rwph-ring 1.8s cubic-bezier(.2,.6,.3,1) infinite}
@keyframes rwph-ring{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(3.4)}}
.rwph-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:16px;padding-top:14px;border-top:1px solid var(--rw-fog)} .rwph.is-dk .rwph-stats{border-color:color-mix(in srgb,var(--rw-cloud) 12%,transparent)}
.rwph-stats div{display:flex;flex-direction:column;gap:4px} .rwph-stats span{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--rw-mut)} .rwph-stats b{font-size:22px;letter-spacing:-.03em;font-weight:var(--rw-font-dw,700)}
.rwph-pop{position:absolute;left:-26px;top:-18px;scale:.4;opacity:0;transform-origin:20% 100%;transition:scale .5s cubic-bezier(.34,1.56,.64,1),opacity .35s}
.rwph-pop.is-up{scale:1;opacity:1}
/* search */
.rwph-serp{padding:18px 18px 20px}
.rwph-q{display:flex;align-items:center;gap:10px;height:48px;padding:0 16px;border-radius:999px;background:var(--rw-bone);font-size:14px;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 8%,transparent)} .rwph.is-dk .rwph-q{background:color-mix(in srgb,var(--rw-cloud) 8%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 14%,transparent)}
.rwph-q svg{width:17px;height:17px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;opacity:.7}
.rwph-qt{display:flex;align-items:center;white-space:nowrap;overflow:hidden} .rwph-caret{display:inline-block;width:2px;height:17px;margin-left:2px;background:currentColor;animation:rw-blink 1s steps(1) infinite} .rwph-caret.is-done{animation-duration:1.4s}
.rwph-sc{margin:12px 6px 10px;min-height:1.2em;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--rw-mut)}
.rwph-res{--rh:78px;--gap:8px;position:relative;height:calc(var(--rh)*4 + var(--gap)*3);margin:0;padding:0;list-style:none}
.rwph-r{position:absolute;left:0;right:0;top:0;height:var(--rh);display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:16px;translate:0 calc(var(--s)*(var(--rh) + var(--gap)));opacity:0;transition:translate .9s cubic-bezier(.7,0,.2,1),opacity .5s ease calc(var(--k)*.08s),background .5s,box-shadow .5s}
.rwph-res.is-on .rwph-r{opacity:1}
.rwph-fav{width:24px;height:24px;flex:none;margin-top:2px;border-radius:50%;background:color-mix(in srgb,var(--rw-ink) 10%,transparent);overflow:hidden} .rwph.is-dk .rwph-fav{background:color-mix(in srgb,var(--rw-cloud) 12%,transparent)}
.rwph-rt{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.rwph-rd{font-size:11px;color:var(--rw-mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rwph-rh{font-size:15.5px;line-height:1.2;letter-spacing:-.015em;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rwph-sk{display:block;height:6px;width:78%;margin-top:6px;border-radius:4px;background:color-mix(in srgb,var(--rw-ink) 8%,transparent)} .rwph.is-dk .rwph-sk{background:color-mix(in srgb,var(--rw-cloud) 10%,transparent)}
.rwph-r:not(.is-us){opacity:0} .rwph-res.is-on .rwph-r:not(.is-us){opacity:.82}
.rwph-r.is-us{background:color-mix(in srgb,var(--rw-ink) 4%,transparent);z-index:2} .rwph-r.is-us.is-top{background:var(--rw-bone);box-shadow:inset 0 0 0 1.5px var(--rw-ink)}
.rwph.is-dk .rwph-r.is-us{background:color-mix(in srgb,var(--rw-cloud) 6%,transparent)} .rwph.is-dk .rwph-r.is-us.is-top{background:color-mix(in srgb,var(--rw-brass) 10%,transparent);box-shadow:inset 0 0 0 1.5px var(--rw-brass)}
.rwph-rank{flex:none;align-self:center;padding:5px 9px;border-radius:999px;background:color-mix(in srgb,var(--rw-ink) 8%,transparent);font-size:11.5px;font-weight:600;transition:background .5s,color .5s} .rwph.is-dk .rwph-rank{background:color-mix(in srgb,var(--rw-cloud) 12%,transparent)}
.rwph-r.is-top .rwph-rank{background:var(--rw-brass);color:var(--rw-ink)}
.rwph-serp .rwph-pop{left:auto;right:-18px;top:86px;transform-origin:80% 100%}
/* tablet + phone: object under the copy */
.rwph.is-tab,.rwph.is-ph{min-height:0;padding-top:128px}
.rwph.is-tab .rwph-in{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:32px} .rwph.is-tab .rwph-lead{font-size:16px} .rwph.is-tab .rwph-btns{flex-direction:column;align-items:flex-start}
.rwph.is-tab .rwph-chip{font-size:11px} .rwph.is-tab .rwph-orbit{inset:20%}
.rwph.is-ph .rwph-in{grid-template-columns:minmax(0,1fr);align-items:start;gap:48px}
.rwph.is-ph{padding-top:108px} .rwph.is-ph .rwph-in{gap:40px;padding-bottom:40px} .rwph.is-ph .rwph-copy{gap:20px} .rwph.is-ph .rwph-lead{font-size:16px}
.rwph.is-ph .rwph-btns{flex-direction:column;align-items:stretch;width:100%} .rwph.is-ph .rwph-btns .rw-btn{width:100%}
.rwph.is-ph .rwph-objw{justify-content:center} .rwph.is-ph .rwph-obj{width:min(360px,100%)} .rwph.is-ph .rwph-scope{width:calc(100% - 40px);margin:0 20px}
.rwph.is-ph .rwph-orbit{inset:18%} .rwph.is-ph .rwph-chip{font-size:11px;padding:5px 10px 5px 5px} .rwph.is-ph .rwph-chip b{min-width:22px;height:22px}
.rwph.is-ph .rwph-card{padding:16px} .rwph.is-ph .rwph-svg{height:140px} .rwph.is-ph .rwph-res{--rh:70px} .rwph.is-ph .rwph-rh{font-size:14px} .rwph.is-ph .rwph-pop{left:-6px;top:-22px} .rwph.is-ph .rwph-serp .rwph-pop{left:auto;right:-6px;top:78px}
.rwph.is-ph .rwph-stats b{font-size:18px} .rwph.is-ph .rwph-meta{padding-bottom:18px}
@media (prefers-reduced-motion:reduce){.rwph-orbit,.rwph-oa .rwph-chip,.rwph-pp,.rwph-wave b{animation:none!important} .rwph-copy,.rwph-obj{translate:none!important;scale:1!important;transform:none!important;opacity:1!important}}
`
addPropertyControls(RwPageHero, {
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  ground: { type: ControlType.Enum, title: "Ground", options: ["chalk", "dark"], optionTitles: ["Chalk", "Dark"], defaultValue: "chalk", displaySegmentedControl: true },
  object: { type: ControlType.Enum, title: "Object", options: ["pulse", "chart", "search", "none"], optionTitles: ["Reach pulse", "Report chart", "Search result", "None"], defaultValue: "pulse" },
  eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "(Services) What we do" },
  title: { type: ControlType.String, title: "Title", description: "The page's h1. | = line break, *words* = lime highlight", displayTextArea: true, defaultValue: "Growth on|*every* channel." },
  lead: { type: ControlType.String, title: "Lead", displayTextArea: true, defaultValue: "SEO, social media, paid ads, content, web design and branding. One team, one monthly retainer and one report in plain numbers." },
  primary: { type: ControlType.String, title: "Primary button", description: "Empty = hidden", defaultValue: "Book a call" },
  primaryLink: { type: ControlType.Link, title: "Primary link", description: "Empty = Booking Link on the Site CMS row" },
  secondary: { type: ControlType.String, title: "Second button", description: "Empty = hidden", defaultValue: "See pricing" },
  secondaryLink: { type: ControlType.Link, title: "Second link", defaultValue: "/pricing" },
  meta: { type: ControlType.String, title: "Bottom tags", description: "; list — empty = hidden", defaultValue: "SEO;Social media;Paid ads;Content;Web design;Branding" },
  scrollCue: { type: ControlType.String, title: "Scroll cue", description: "Empty = hidden", defaultValue: "Scroll" },
  chips: { type: ControlType.String, title: "Pulse chips", description: "icon|text; … (3)", displayTextArea: true, defaultValue: "❤|1.2k likes on one reel;★|New 5-star review;#1|“dentist near me”", hidden: (p: any) => p.object !== "pulse" },
  centerLabel: { type: ControlType.String, title: "Centre label", defaultValue: "Your brand", hidden: (p: any) => p.object !== "pulse" },
  chartLabel: { type: ControlType.String, title: "Chart label", defaultValue: "Organic traffic · last 12 months", hidden: (p: any) => p.object !== "chart" },
  chartKpi: { type: ControlType.String, title: "Chart KPI", defaultValue: "+212%", hidden: (p: any) => p.object !== "chart" },
  chartSub: { type: ControlType.String, title: "KPI note", defaultValue: "vs. the year before", hidden: (p: any) => p.object !== "chart" },
  chartPoints: { type: ControlType.String, title: "Chart points", description: "Comma numbers, left → right", defaultValue: "12,18,16,24,22,31,36,34,45,52,61,74", hidden: (p: any) => p.object !== "chart" },
  chartStats: { type: ControlType.String, title: "Chart stats", description: "Label:value; …", defaultValue: "Leads:2,940;CTR:4.8%;ROAS:6.2×", hidden: (p: any) => p.object !== "chart" },
  chartPop: { type: ControlType.String, title: "Chart pop-up", defaultValue: "New lead · Haven Realty", hidden: (p: any) => p.object !== "chart" },
  query: { type: ControlType.String, title: "Search query", defaultValue: "marketing agency near me", hidden: (p: any) => p.object !== "search" },
  ourTitle: { type: ControlType.String, title: "Our result title", description: "Empty = Name · Descriptor in City (Site CMS row)", defaultValue: "", hidden: (p: any) => p.object !== "search" },
  ourDomain: { type: ControlType.String, title: "Our domain", description: "Empty = the domain of the Site email", defaultValue: "", hidden: (p: any) => p.object !== "search" },
  others: { type: ControlType.String, title: "Other results", description: "; list (3)", displayTextArea: true, defaultValue: "Top 10 marketing agencies of 2026 — a ranked list;Marketing agency pricing: what to expect;How to choose a digital agency", hidden: (p: any) => p.object !== "search" },
  searchPop: { type: ControlType.String, title: "Search pop-up", defaultValue: "+318 clicks this week", hidden: (p: any) => p.object !== "search" },
})
