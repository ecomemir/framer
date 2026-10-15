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

// ===== REACHWISE phone kit (composed by mk.py when a body uses UI_*): ONE device + ten app screens drawn in HTML/SVG, so every phone on the site is the same app, sharp, themeable and editable.
// UI_Phone({ kind, w, time, name, habits, done, tilt, className, style }) — w = device width in px (height = w × 2.06). Put CSS_UI once in the section's <style>.
// kinds: today · planner · focus · insights · sleep · streak · goals · learn · nudge · grow · alarm
const UI_HABITS = ["Morning stretch", "Morning run", "Deep work block", "Read 20 pages"]
const UI_Mark = ({ s = 16 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="10" fill="var(--rw-brass)" /><path d="M9 21.5V12.2c0-1 1.2-1.5 1.9-.8l8.4 8.6c.7.7 1.9.2 1.9-.8v-8.7" fill="none" stroke="var(--rw-ink)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="23.6" cy="8.4" r="2.6" fill="var(--rw-cloud)" /></svg>)
const UI_Ring = ({ v = 0.5, size = 1, label = "", sub = "" }: { v?: number; size?: number; label?: string; sub?: string }) => { const C = 2 * Math.PI * 38; return (<span className="rwp-ring" style={{ ["--rs" as any]: size }}><svg viewBox="0 0 88 88" aria-hidden><circle cx="44" cy="44" r="38" className="rwp-ring-b" /><circle cx="44" cy="44" r="38" className="rwp-ring-f" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - Math.max(0, Math.min(1, v))) }} /></svg>{label && <b>{label}{sub && <small>{sub}</small>}</b>}</span>) }
const UI_Check = ({ on }: { on: boolean }) => (<span className={`rwp-chk${on ? " is-on" : ""}`} aria-hidden><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" pathLength="1" /></svg></span>)
const UI_Tabs = ({ on = 0 }: { on?: number }) => (<div className="rwp-tabs" aria-hidden>{[0, 1, 2, 3].map((k) => <span key={k} className={k === on ? "is-on" : ""}>{k === 0 ? <svg viewBox="0 0 24 24"><path d="M4 11l8-6.5 8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" /></svg> : k === 1 ? <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg> : k === 2 ? <svg viewBox="0 0 24 24"><path d="M12 3.5l1.9 4.9 4.9 1.9-4.9 1.9L12 17.1l-1.9-4.9-4.9-1.9 4.9-1.9z" /></svg> : <svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20.5c1.3-3.6 4-5.3 7.5-5.3s6.2 1.7 7.5 5.3" /></svg>}</span>)}</div>)
function UI_Screen({ kind, name = "Maya", habits = UI_HABITS, done = 1 }: { kind: string; name?: string; habits?: string[]; done?: number }) {
  const H = habits.length ? habits : UI_HABITS; const tot = H.length
  const list = (d: number) => (<ul className="rwp-list">{H.slice(0, 4).map((h, i) => <li key={i} className={i < d ? "is-done" : i === d ? "is-now" : ""}><UI_Check on={i < d} /><span>{h}</span><em>{["07:10", "07:40", "14:00", "21:30"][i] || ""}</em></li>)}</ul>)
  switch (kind) {
    case "planner": return (<div className="rwp-app"><p className="rwp-k">Planner · Thu</p><p className="rwp-h">Your day, planned</p><div className="rwp-cal">{[["08", "Stand-up", 0], ["09", "Run 3 km", 1], ["11", "Design review", 0], ["13", "Walk 10 min", 1], ["15", "Deep work", 1], ["18", "Gym", 0], ["21", "Read", 1]].map(([t, l, a], i) => <div key={i} className={a ? "is-ai" : ""}><em>{t}:00</em><span>{l}</span>{a ? <b>AI</b> : null}</div>)}</div><UI_Tabs on={1} /></div>)
    case "focus": return (<div className="rwp-app rwp-dk"><p className="rwp-k">Focus block</p><div className="rwp-focus"><UI_Ring v={0.64} size={1.9} label="16:02" sub="left" /></div><p className="rwp-c">Notifications held back · 3 waiting</p><div className="rwp-pill">End block</div></div>)
    case "insights": return (<div className="rwp-app"><p className="rwp-k">Insights · September</p><p className="rwp-h">What stuck</p><div className="rwp-bars">{[62, 80, 45, 90, 72, 96, 58, 84, 76, 92, 66, 88].map((v, i) => <i key={i} style={{ height: `${v}%` }} />)}</div><div className="rwp-row"><span>Morning run</span><b>+34%</b></div><div className="rwp-row"><span>Read 20 pages</span><b>+21%</b></div><div className="rwp-row"><span>Water</span><b className="is-dn">−6%</b></div><UI_Tabs on={2} /></div>)
    case "sleep": return (<div className="rwp-app rwp-dk rwp-night"><p className="rwp-k">21:30 · Wind-down</p><p className="rwp-h">Screens down in 30</p><div className="rwp-moon" aria-hidden /><div className="rwp-row"><span>Lights to 30%</span><UI_Check on /></div><div className="rwp-row"><span>Plan tomorrow</span><UI_Check on /></div><div className="rwp-row"><span>Read 20 pages</span><UI_Check on={false} /></div></div>)
    case "streak": return (<div className="rwp-app"><p className="rwp-k">Streaks</p><p className="rwp-big">48<small>days</small></p><div className="rwp-grid">{Array.from({ length: 35 }, (_, i) => <i key={i} className={i % 11 === 7 ? "is-frz" : i < 31 ? "is-on" : ""} />)}</div><div className="rwp-row"><span>Freeze days left</span><b>2</b></div><UI_Tabs on={2} /></div>)
    case "goals": return (<div className="rwp-app"><p className="rwp-k">Step 1 of 3</p><p className="rwp-h">What matters this week?</p><div className="rwp-chips">{["Run more", "Sleep by 11", "Read", "Drink water", "Less phone", "Stretch"].map((c, i) => <span key={i} className={i === 0 || i === 2 || i === 5 ? "is-on" : ""}>{c}</span>)}</div><div className="rwp-pill">Build my plan</div></div>)
    case "learn": return (<div className="rwp-app"><p className="rwp-k">Learning your day</p><p className="rwp-h">You have room at</p><div className="rwp-cal">{[["07", "Free", 1], ["09", "Meetings", 0], ["13", "Free", 1], ["15", "Meetings", 0], ["19", "Free", 1]].map(([t, l, a], i) => <div key={i} className={a ? "is-ai" : ""}><em>{t}:00</em><span>{l}</span>{a ? <b>✓</b> : null}</div>)}</div><div className="rwp-row"><span>Sleep avg</span><b>7h 12m</b></div></div>)
    case "nudge": return (<div className="rwp-app rwp-lock"><p className="rwp-lt">14:52</p><p className="rwp-ld">Thursday 16 October</p><div className="rwp-note"><UI_Mark s={22} /><div><p><b>REACHWISE</b><em>now</em></p><p className="rwp-nt">Your 3pm slump is coming</p><p className="rwp-ns">A 10 minute walk now makes the last two hours lighter.</p></div></div></div>)
    case "grow": return (<div className="rwp-app"><p className="rwp-k">Week 4 review</p><p className="rwp-h">Best week yet</p><div className="rwp-focus"><UI_Ring v={0.86} size={1.5} label="86%" sub="kept" /></div><div className="rwp-row"><span>Longest streak</span><b>21 days</b></div><div className="rwp-row"><span>Try next week</span><b>Water +1</b></div></div>)
    case "alarm": return (<div className="rwp-app rwp-dk rwp-night rwp-lock"><p className="rwp-lt">07:10</p><p className="rwp-ld">Tomorrow · Wake</p><div className="rwp-note"><UI_Mark s={22} /><div><p><b>REACHWISE</b><em>07:10</em></p><p className="rwp-nt">Good morning, {name}</p><p className="rwp-ns">Stretch first. The run is at 07:40, 14° and sunny.</p></div></div><div className="rwp-slide"><i />slide to start your day</div></div>)
    default: return (<div className="rwp-app"><p className="rwp-k">Tue 14 Oct</p><p className="rwp-h">Good morning, {name}</p><div className="rwp-card"><UI_Ring v={done / tot} label={`${done}/${tot}`} sub="today" /><div><p className="rwp-k">Streak</p><p className="rwp-s">13 days</p><div className="rwp-wk">{[.5, .8, .35, .9, .7, 1, Math.max(.15, done / tot)].map((v, i) => <i key={i} style={{ height: `${v * 100}%` }} className={i === 6 ? "is-t" : ""} />)}</div></div></div>{list(done)}<UI_Tabs on={0} /></div>)
  }
}
const UI_Phone = ({ kind = "today", w = 280, time = "09:41", name, habits, done, className, style, children }: { kind?: string; w?: number; time?: string; name?: string; habits?: string[]; done?: number; className?: string; style?: CSSProperties; children?: any }) => (
  <div className={`nup${className ? " " + className : ""}`} style={{ ["--pw" as any]: `${w}px`, ...(style || {}) }} aria-hidden>
    <div className="rwp-dev"><i className="rwp-b1" /><i className="rwp-b2" /><i className="rwp-b3" />
      <div className={`rwp-scr rwp-k-${kind}`}><div className="rwp-isl" /><div className="rwp-st"><span>{time}</span><span className="rwp-sig"><i /><i /><i /><i /><b /></span></div><UI_Screen kind={kind} name={name} habits={habits} done={done} />{children}<i className="rwp-glare" /></div>
    </div>
  </div>)
// markdown for legal pages + posts (## headings, - lists, > quotes, **bold**, [links](/x))
// inline markdown: **bold** and [text](/url)
const UI_Inl = (t: string): any[] => { const out: any[] = []; const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g; let last = 0, m: any, k = 0
  while ((m = re.exec(t))) { if (m.index > last) out.push(t.slice(last, m.index)); out.push(m[1] ? <strong key={k++}>{m[1]}</strong> : <a key={k++} href={m[3]}>{m[2]}</a>); last = re.lastIndex }
  if (last < t.length) out.push(t.slice(last)); return out }
const UI_Md = ({ text, D, className = "" }: { text: string; D: CSSProperties; className?: string }) => {
  const lines = String(text || "").split(/\n+/).map((l) => l.trim()).filter(Boolean); const out: any[] = []; let list: string[] = []
  const flush = () => { if (list.length) { out.push(<ul key={"u" + out.length}>{list.map((x, i) => <li key={i}>{UI_Inl(x)}</li>)}</ul>); list = [] } }
  lines.forEach((l) => { if (l.startsWith("- ")) { list.push(l.slice(2)); return } flush(); if (l.startsWith("## ")) out.push(<h2 key={out.length} style={D}>{l.slice(3)}</h2>); else if (l.startsWith("> ")) out.push(<blockquote key={out.length} style={D}>{UI_Inl(l.slice(2))}</blockquote>); else out.push(<p key={out.length}>{UI_Inl(l)}</p>) }); flush()
  return <div className={`rw-md ${className}`}>{out}</div>
}
const CSS_UI = `
.rw-md{font-size:18px;line-height:1.7;color:color-mix(in srgb,var(--rw-ink) 86%,transparent)} .rw-md h2{margin:1.8em 0 .5em;font-size:clamp(26px,2.4vw,34px);font-weight:600;letter-spacing:-.035em;line-height:1.15;color:var(--rw-ink)} .rw-md h2:first-child{margin-top:0} .rw-md p{margin:0 0 1em} .rw-md a{color:var(--rw-acc);text-underline-offset:3px} .rw-md ul{list-style:none;margin:0 0 1.2em;padding:0;display:flex;flex-direction:column;gap:10px} .rw-md li{position:relative;padding-left:26px} .rw-md li::before{content:"";position:absolute;left:0;top:.5em;width:14px;height:14px;border-radius:50%;background:var(--rw-brass)} .rw-md blockquote{margin:1.4em 0;padding:24px 28px;border-radius:28px;background:var(--rw-ink);color:var(--rw-cloud);font-size:clamp(20px,1.8vw,26px);line-height:1.35;letter-spacing:-.02em;font-weight:600} .rw-dark .rw-md{color:color-mix(in srgb,var(--rw-cloud) 84%,transparent)} .rw-dark .rw-md h2{color:var(--rw-cloud)}
.nup{position:relative;width:var(--pw);height:calc(var(--pw)*2.06);flex:none;font-size:calc(var(--pw)*.043);color:var(--rw-ink);text-align:left}
.rwp-dev{position:absolute;inset:0;border-radius:calc(var(--pw)*.17);padding:calc(var(--pw)*.034);background:linear-gradient(145deg,#3a3d3c,#101211 40%,#1d201f 70%,#4a4d4b);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.14),inset 0 0 0 4px #0b0c0c,0 40px 80px -30px rgba(0,0,0,.6),0 16px 34px -18px rgba(0,0,0,.5)}
.rwp-dev>i{position:absolute;width:3px;border-radius:2px;background:#2b2e2d} .rwp-b1{left:-2px;top:19%;height:5%} .rwp-b2{left:-2px;top:27%;height:9%} .rwp-b3{right:-2px;top:25%;height:13%}
.rwp-scr{--rw-mut:color-mix(in srgb,var(--rw-stone) 60%,var(--rw-ink));position:relative;width:100%;height:100%;overflow:hidden;border-radius:calc(var(--pw)*.14);background:var(--rw-bone);isolation:isolate}
.rwp-isl{position:absolute;z-index:5;left:50%;top:calc(var(--pw)*.034);translate:-50% 0;width:calc(var(--pw)*.33);height:calc(var(--pw)*.1);border-radius:999px;background:#000}
.rwp-st{display:flex;justify-content:space-between;align-items:center;height:calc(var(--pw)*.17);padding:calc(var(--pw)*.04) calc(var(--pw)*.09) 0;font-size:calc(var(--pw)*.045);font-weight:600;font-variant-numeric:tabular-nums}
.rwp-sig{display:inline-flex;align-items:flex-end;gap:1.5px;height:10px} .rwp-sig i{display:block;width:2.5px;background:currentColor;border-radius:1px} .rwp-sig i:nth-child(1){height:35%} .rwp-sig i:nth-child(2){height:55%} .rwp-sig i:nth-child(3){height:75%} .rwp-sig i:nth-child(4){height:100%} .rwp-sig b{display:block;width:18px;height:9px;margin-left:5px;border-radius:3px;box-shadow:inset 0 0 0 1.2px currentColor;background:linear-gradient(90deg,currentColor 0 70%,transparent 70%);background-clip:content-box;padding:2px}
.rwp-app{position:absolute;left:0;right:0;top:calc(var(--pw)*.17);bottom:0;padding:calc(var(--pw)*.035) calc(var(--pw)*.06) 0;display:flex;flex-direction:column;gap:calc(var(--pw)*.035)}
.rwp-app p{margin:0} .rwp-k{font-size:.74em;letter-spacing:.09em;text-transform:uppercase;color:var(--rw-mut,#77736b)} .rwp-h{font-size:1.5em;line-height:1.08;letter-spacing:-.035em;font-weight:600} .rwp-c{text-align:center;font-size:.85em;opacity:.7}
.rwp-dk{color:var(--rw-cloud)} .rwp-scr.rwp-k-focus,.rwp-scr.rwp-k-sleep,.rwp-scr.rwp-k-alarm{background:var(--rw-night);color:var(--rw-cloud)} .rwp-scr.rwp-k-nudge{background:linear-gradient(160deg,#F2B48C,#E9785A 45%,#4B2B3A)} .rwp-scr.rwp-k-nudge .rwp-st{color:#fff}
.rwp-night{background:radial-gradient(90% 50% at 50% 0%,color-mix(in srgb,var(--rw-brass) 30%,transparent),transparent 70%)}
.rwp-card{position:relative;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:calc(var(--pw)*.05);padding:calc(var(--pw)*.045);border-radius:calc(var(--pw)*.07);background:var(--rw-ink);color:var(--rw-cloud)} .rwp-card .rwp-k{color:color-mix(in srgb,var(--rw-cloud) 60%,transparent)} .rwp-s{font-size:1.25em;font-weight:600;letter-spacing:-.03em;margin:.15em 0 .4em!important}
.rwp-ring{position:relative;display:grid;place-items:center;width:calc(var(--pw)*.29*var(--rs,1));height:calc(var(--pw)*.29*var(--rs,1))} .rwp-ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)} .rwp-ring circle{fill:none;stroke-width:9;stroke-linecap:round} .rwp-ring-b{stroke:color-mix(in srgb,currentColor 16%,transparent)} .rwp-ring-f{stroke:var(--rw-brass);transition:stroke-dashoffset 1.2s cubic-bezier(.65,0,.2,1)}
.rwp-ring b{position:relative;display:flex;flex-direction:column;align-items:center;font-size:calc(1.3em*var(--rs,1));font-weight:600;letter-spacing:-.03em;font-variant-numeric:tabular-nums} .rwp-ring small{font-size:.4em;letter-spacing:.1em;text-transform:uppercase;opacity:.6;font-weight:500}
.rwp-wk{display:flex;align-items:flex-end;gap:3px;height:calc(var(--pw)*.08)} .rwp-wk i{flex:1;border-radius:2px;background:color-mix(in srgb,var(--rw-cloud) 26%,transparent)} .rwp-wk i.is-t{background:var(--rw-brass)}
.rwp-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:calc(var(--pw)*.022)} .rwp-list li{display:flex;align-items:center;gap:calc(var(--pw)*.035);padding:calc(var(--pw)*.033) calc(var(--pw)*.04);border-radius:calc(var(--pw)*.05);background:var(--rw-cloud)} .rwp-list li>span:not(.rwp-chk){flex:1;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .rwp-list li em{font-style:normal;font-size:.78em;color:var(--rw-mut)} .rwp-list li.is-now{box-shadow:inset 0 0 0 1.5px var(--rw-brass)} .rwp-list li.is-done span{opacity:.5;text-decoration:line-through}
.rwp-chk{display:grid;place-items:center;width:1.45em;height:1.45em;flex:none;border-radius:50%;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,currentColor 30%,transparent);transition:background .35s,box-shadow .35s} .rwp-chk svg{width:72%;height:72%} .rwp-chk path{fill:none;stroke:var(--rw-ink);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .45s cubic-bezier(.65,0,.35,1) .15s} .rwp-chk.is-on{background:var(--rw-brass);box-shadow:none} .rwp-chk.is-on path{stroke-dashoffset:0}
.rwp-tabs{position:absolute;left:calc(var(--pw)*.05);right:calc(var(--pw)*.05);bottom:calc(var(--pw)*.05);display:flex;justify-content:space-around;padding:calc(var(--pw)*.03);border-radius:999px;background:color-mix(in srgb,var(--rw-cloud) 80%,transparent);box-shadow:0 8px 20px -10px rgba(0,0,0,.3)} .rwp-tabs span{display:grid;place-items:center;width:calc(var(--pw)*.1);height:calc(var(--pw)*.1);border-radius:50%;color:#8a857c} .rwp-tabs span.is-on{background:var(--rw-ink);color:var(--rw-brass)} .rwp-tabs svg{width:55%;height:55%;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.rwp-cal{display:flex;flex-direction:column;gap:calc(var(--pw)*.018)} .rwp-cal div{display:flex;align-items:center;gap:calc(var(--pw)*.035);padding:calc(var(--pw)*.028) calc(var(--pw)*.04);border-radius:calc(var(--pw)*.045);background:var(--rw-cloud);font-weight:600} .rwp-cal em{font-style:normal;font-size:.75em;opacity:.5;font-variant-numeric:tabular-nums;width:3.2em} .rwp-cal span{flex:1} .rwp-cal b{font-size:.62em;letter-spacing:.08em;padding:.3em .6em;border-radius:999px;background:var(--rw-ink);color:var(--rw-brass)} .rwp-cal div.is-ai{background:color-mix(in srgb,var(--rw-brass) 18%,var(--rw-cloud))}
.rwp-focus{display:grid;place-items:center;padding:calc(var(--pw)*.08) 0 calc(var(--pw)*.04)}
.rwp-pill{margin-top:auto;margin-bottom:calc(var(--pw)*.1);align-self:center;padding:.8em 1.6em;border-radius:999px;background:var(--rw-brass);color:var(--rw-ink);font-weight:700}
.rwp-bars{display:flex;align-items:flex-end;gap:4px;height:calc(var(--pw)*.32);padding:calc(var(--pw)*.04);border-radius:calc(var(--pw)*.06);background:var(--rw-ink)} .rwp-bars i{flex:1;border-radius:3px;background:linear-gradient(180deg,var(--rw-brass),color-mix(in srgb,var(--rw-brass) 40%,transparent))}
.rwp-row{display:flex;justify-content:space-between;align-items:center;padding:calc(var(--pw)*.035) calc(var(--pw)*.045);border-radius:calc(var(--pw)*.045);background:var(--rw-cloud);font-weight:600} .rwp-dk .rwp-row{background:color-mix(in srgb,var(--rw-cloud) 9%,transparent)} .rwp-row b{color:var(--rw-acc,#b8502d)} .rwp-dk .rwp-row b{color:var(--rw-brass)} .rwp-row b.is-dn{color:#8a857c}
.rwp-moon{align-self:center;width:calc(var(--pw)*.3);height:calc(var(--pw)*.3);border-radius:50%;box-shadow:inset calc(var(--pw)*-.06) calc(var(--pw)*-.03) 0 0 var(--rw-brass);margin:calc(var(--pw)*.04) 0}
.rwp-big{font-size:3.4em;font-weight:600;letter-spacing:-.05em;line-height:1} .rwp-big small{font-size:.28em;letter-spacing:.02em;margin-left:.3em;opacity:.55}
.rwp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px} .rwp-grid i{aspect-ratio:1;border-radius:4px;background:color-mix(in srgb,var(--rw-ink) 8%,transparent)} .rwp-grid i.is-on{background:var(--rw-brass)} .rwp-grid i.is-frz{background:#9FC3D9}
.rwp-chips{display:flex;flex-wrap:wrap;gap:6px} .rwp-chips span{padding:.55em .9em;border-radius:999px;background:var(--rw-cloud);font-weight:600;font-size:.9em} .rwp-chips span.is-on{background:var(--rw-ink);color:var(--rw-cloud)}
.rwp-lock{align-items:center;text-align:center;color:#fff} .rwp-lt{font-size:3.6em;font-weight:500;letter-spacing:-.04em;line-height:1;margin-top:calc(var(--pw)*.06)!important} .rwp-ld{font-size:.9em;opacity:.85}
.rwp-note{display:flex;gap:10px;align-items:flex-start;width:100%;margin-top:calc(var(--pw)*.12);padding:calc(var(--pw)*.045);border-radius:calc(var(--pw)*.07);background:color-mix(in srgb,#fff 62%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);color:var(--rw-ink);text-align:left} .rwp-note p:first-child{display:flex;justify-content:space-between;font-size:.72em;letter-spacing:.06em;opacity:.7} .rwp-note em{font-style:normal} .rwp-nt{font-weight:700} .rwp-ns{font-size:.88em;line-height:1.35;opacity:.8}
.rwp-slide{position:absolute;left:calc(var(--pw)*.08);right:calc(var(--pw)*.08);bottom:calc(var(--pw)*.12);display:flex;align-items:center;gap:10px;padding:calc(var(--pw)*.025);border-radius:999px;background:color-mix(in srgb,#fff 16%,transparent);font-size:.9em;color:color-mix(in srgb,#fff 80%,transparent)} .rwp-slide i{width:calc(var(--pw)*.12);height:calc(var(--pw)*.12);border-radius:50%;background:var(--rw-brass);flex:none}
.rwp-glare{position:absolute;inset:0;z-index:6;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.18) 45%,transparent 60%);mix-blend-mode:soft-light}`

// ===== REACHWISE CMS bridge (composed by mk.py after _reveal). Hidden Collection Lists in the Site Layout render one <span data-rw-row="kind" data-f1…> per CMS item on every page bound to that layout (server render included).
// Sections render the baked SEED (lockstep with cms-seed.json) on the server and on the first client render — no hydration diff — then a layout effect swaps in the live CMS rows before paint.
type CmsRow = Record<string, string>
const SEED: Record<string, CmsRow[]> = {
  site: [{"slug": "site", "f1": "Reachwise", "f2": "Digital marketing agency", "f3": "SEO, social media and paid ads that bring the right people to your door.", "f4": "hello@reachwise.agency", "f5": "+1 (212) 555-0186", "f6": "/contact", "f7": "New York", "f8": "America/New_York", "f9": "4.9", "f10": "126", "f11": "Instagram:https://instagram.com,TikTok:https://tiktok.com,LinkedIn:https://linkedin.com,X:https://x.com", "f12": "Now booking Q4 · 3 spots left", "f13": "140+", "n1": "1"}],
  posts: [{"slug": "local-seo-2026", "f1": "Local SEO in 2026: what still moves the map pack", "f2": "SEO", "f3": "Sep 18, 2026", "f4": "7 min", "f5": "Reviews, pages and links: the three things that still decide who shows up first near you.", "f6": "Local search still comes down to three things...", "img": "https://framerusercontent.com/images/pHOBF7LHy4BbDr36flWPxPYRixo.webp", "n1": "1"}, {"slug": "reels-that-sell", "f1": "Reels that sell: the 3-second rule we use for every client", "f2": "Social media", "f3": "Sep 04, 2026", "f4": "5 min", "f5": "Why the first three seconds decide whether anyone sees the other twenty-seven.", "f6": "Every reel we make starts with one question...", "img": "https://framerusercontent.com/images/87wKn5rFSjsCMUA9My0OUYJ4dM.webp", "n1": "2"}, {"slug": "roas-is-not-profit", "f1": "ROAS is not profit: how we report paid ads", "f2": "Paid ads", "f3": "Aug 21, 2026", "f4": "6 min", "f5": "A 6× return can still lose money. Here is the number we report instead.", "f6": "Return on ad spend is the number everyone quotes...", "img": "https://framerusercontent.com/images/NtmyAnUBIcfQXkgdgwQGB2dIVY.webp", "n1": "3"}, {"slug": "content-calendar", "f1": "The one-page content calendar we give every client", "f2": "Content", "f3": "Aug 07, 2026", "f4": "4 min", "f5": "A plan your team will actually follow, with a template you can copy.", "f6": "Most content calendars die in week two...", "img": "https://framerusercontent.com/images/5NYoUMxcMZ7W73IVonEHOzeu5ls.webp", "n1": "4"}, {"slug": "landing-pages", "f1": "Five landing page fixes that doubled conversions", "f2": "Web design", "f3": "Jul 24, 2026", "f4": "6 min", "f5": "Small changes to headlines, forms and proof that paid for themselves in a week.", "f6": "Before you spend more on ads...", "img": "https://framerusercontent.com/images/2JG0A1F7J2tdiUI5Y6YXMfSc.webp", "n1": "5"}, {"slug": "agency-or-in-house", "f1": "Agency or in-house? An honest comparison", "f2": "Strategy", "f3": "Jul 10, 2026", "f4": "8 min", "f5": "What it really costs to hire a marketing team, and when an agency makes more sense.", "f6": "It depends on three numbers...", "img": "https://framerusercontent.com/images/P2vtvmpcIxWwVrN78FW1tzLdNs.webp", "n1": "6"}]
}
const SW_BUILD = "RwPost@cms1"
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

// ===== RwPost =====
interface PostProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  slug: string; backLabel: string; backLink: string; byline: string; readSuffix: string; extraBody: string
  shareLabel: string; copyLabel: string; copiedLabel: string; ctaKicker: string; ctaTitle: string; ctaText: string; ctaButton: string; ctaLink: string
  moreEyebrow: string; moreTitle: string; moreButton: string; topLabel: string; style?: CSSProperties
}
// ---- THE ARTICLE (/blog/:slug): a centred editorial header (kicker · date · read, h1, excerpt), a 16:9 cover that irises open and parallaxes,
// the article (row Body + the Extra body control, markdown) with a sticky share rail on the left and a lime in-article CTA card after the 2nd section,
// a READING RING fixed bottom-right (portal) that fills lime as you read — the scroll mechanic — and "More ideas" = 3 other posts. ----
const PO_EXTRA = `## Start with the buyer, not the channel
Most brands pick a channel first ("we need TikTok") and then look for a reason to be there. Flip it. Write down who buys from you, what they type into Google the week before they buy, and which feeds they scroll at night. The right channels fall out of that list.
- Pull your last 20 customers and note how each one found you.
- Search the three phrases they would type and look at who ranks today.
- Check which platforms those buyers actually use, not the ones your team likes.
## Pick one number per channel
Reach, clicks and likes are easy to grow and easy to fake. Every channel should answer to one number that ends in money: calls booked from search, leads from ads, sales from email. Report it every week, in the same place, even when the week was bad.
> If a channel can't be tied to a number that pays the rent, it is a hobby, not a channel.
## Test small, then pour
We never launch a big campaign cold. We run three to five small tests (two headlines, two audiences, one offer) with a fixed budget and a fixed end date. The winner gets more money; the losers get switched off without a meeting.
- Keep each test to one change, so you know what actually worked.
- Give it enough spend to reach at least 1,000 of the right people.
- Write the result down, including the tests that failed.
## Make the website earn the click
Ads and posts only buy attention; the page decides whether that attention becomes a lead. Before you raise any budget, make sure the landing page loads in under two seconds on a phone, says what you do in the first line, shows real proof from real clients, and asks for one thing only.
## Stay consistent for 90 days
Growth online is mostly compound interest. The brands that win keep posting, publishing and optimising every week for months, long after the first rush of ideas is gone. Set a rhythm your team can keep (one article, three posts and one test a week is plenty) and protect it on the calendar like a client meeting.
## What to do this week
- List your buyers' top five search phrases.
- Choose one number per channel and start a simple weekly report.
- Launch one small test with a clear budget and end date.`
const poCopy = async (t: string) => { try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(t); return true } } catch (e) {} try { const a = document.createElement("textarea"); a.value = t; a.setAttribute("readonly", ""); a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); const ok = document.execCommand("copy"); a.remove(); return ok } catch (e) { return false } }
const PoX = () => (<svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z" /></svg>)
const PoIn = () => (<svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.8h4V21H3zM9.5 9.8h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z" /></svg>)
const PoLink = () => (<svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>)
const PoTick = () => (<svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>)
export default function RwPost(props: PostProps) {
  const { slug = "", backLabel = "Back to blog", backLink = "/blog", byline = "By the Reachwise team", readSuffix = "read", extraBody = PO_EXTRA, shareLabel = "Share", copyLabel = "Copy link", copiedLabel = "Copied",
    ctaKicker = "Free audit", ctaTitle = "Want this for your brand?", ctaText = "", ctaButton = "Book my free audit", ctaLink = "", moreEyebrow = "Keep reading", moreTitle = "More *ideas*.", moreButton = "All articles", topLabel = "Back to top", bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill(); const site = useSite()
  const Dh: CSSProperties = { ...D, fontWeight: props.customFonts ? D.fontWeight : ("var(--rw-font-dw, 700)" as any) }
  const root = useRef<HTMLElement>(null); const cov = useRef<HTMLDivElement>(null); const art = useRef<HTMLDivElement>(null); const ring = useRef<HTMLButtonElement>(null)
  const { w } = useSize(root, bpHint); const phone = w < 810, tab = w >= 810 && w < 1100
  useMagnet(root, live)
  const on = useOn(root, live, rm, 0.05)
  const { row, rows } = useRow("posts", SEED.posts || [], slug)
  const more = rows.filter((r) => r.slug !== row.slug).slice(0, 3)
  const book = pick(ctaLink, site.book || "/contact")
  const settled = still || rm || !live
  useScrollVars(cov, live, rm)
  // share links need the live URL (client only)
  const [url, setUrl] = useState(""); useEffect(() => { try { setUrl(window.location.href) } catch (e) {} }, [row.slug])
  const [copied, setCopied] = useState(false); const ct = useRef(0)
  useEffect(() => () => window.clearTimeout(ct.current), [])
  const copy = async () => { const ok = await poCopy(url || (typeof window !== "undefined" ? window.location.href : "")); if (!ok) return; setCopied(true); window.clearTimeout(ct.current); ct.current = window.setTimeout(() => setCopied(false), 2200) }
  const title = String(row.f1 || "")
  const share = { x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, li: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` }
  // ---- the reading ring: article progress 0 → 1 (reading line at 55% of the viewport). Reads in the read phase, writes one CSS var + a data flag ----
  const [mounted, setMounted] = useState(false); useEffect(() => { if (live) setMounted(true) }, [live])
  useEffect(() => { if (!mounted || !art.current) return; const a = art.current; let top = 0, h = 1, vh = 1, last = -1, lastOn = "", lastPc = -1
    const read = () => { const r = a.getBoundingClientRect(); top = r.top; h = r.height || 1; vh = window.innerHeight || 1 }
    const off = onTick(() => { const el = ring.current; if (!el) return; const p = clamp01((vh * 0.55 - top) / h); const vis = top < vh * 0.7 && top + h > vh * 0.25 ? "1" : "0"
      if (vis !== lastOn) { lastOn = vis; el.setAttribute("data-on", vis); el.tabIndex = vis === "1" ? 0 : -1 }
      if (Math.abs(p - last) < 0.001) return; last = p; el.style.setProperty("--rp", p.toFixed(4)); const pc = Math.round(p * 100); if (pc !== lastPc) { lastPc = pc; const t = el.querySelector("b"); if (t) t.textContent = String(pc) } }, read)
    return () => off() }, [mounted, row.slug])
  const toTop = () => { const W = window as any; const y = root.current ? root.current.getBoundingClientRect().top + window.scrollY : 0; if (W.__ltLenis) W.__ltLenis.scrollTo(y); else window.scrollTo({ top: y, behavior: rm ? "auto" : "smooth" }) }
  // body = row body + Extra body; the lime CTA card sits before the 3rd "## " section (else at the end)
  const all = [String(row.f6 || "").trim(), String(extraBody || "").trim()].filter(Boolean).join("\n")
  const lines = all.split(/\n+/); let hc = 0, cut = -1; lines.forEach((l, i) => { if (cut < 0 && l.trim().startsWith("## ")) { hc++; if (hc === 3) cut = i } })
  const partA = cut < 0 ? all : lines.slice(0, cut).join("\n"), partB = cut < 0 ? "" : lines.slice(cut).join("\n")
  const C = 2 * Math.PI * 26
  const Rail = (
    <nav className="rwpo-rail" aria-label={shareLabel}>
      <a className="rwpo-back" href={backLink || "/blog"} style={M}><span aria-hidden><IcoArrow s={14} /></span>{backLabel}</a>
      <p className="rwpo-rl" style={M}>{shareLabel}</p>
      <div className="rwpo-sh">
        <a className="rwpo-si" href={share.x} target="_blank" rel="noopener" aria-label={`${shareLabel} on X`}><PoX /></a>
        <a className="rwpo-si" href={share.li} target="_blank" rel="noopener" aria-label={`${shareLabel} on LinkedIn`}><PoIn /></a>
        <button type="button" className={`rwpo-si rwpo-copy${copied ? " is-ok" : ""}`} onClick={copy} aria-label={copyLabel}><span className="rwpo-ci">{copied ? <PoTick /> : <PoLink />}</span><span className="rwpo-ct" style={M} aria-live="polite">{copied ? copiedLabel : copyLabel}</span></button>
      </div>
    </nav>)
  return (
    <section ref={root as any} className={`rw rw-sec rwpo${phone ? " is-ph" : tab ? " is-tab" : ""}${on ? " is-on" : ""}${settled ? " is-set" : ""}`} style={{ ...cssVars(c), ...B, ...(props.style || {}) }}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_MOTION + CSS_POST + siteFontCss(props) }} />
      <article className="rwpo-a">
        <header className="rw-wrap rwpo-top">
          <p className="rwpo-meta" style={{ ...M, ...rise(on, 60, 12) }}>{row.f2 && <span className="rwpo-kick"><i aria-hidden />{row.f2}</span>}{row.f3 && <span>{row.f3}</span>}{row.f4 && <span className="rwpo-read">{row.f4} {readSuffix}</span>}</p>
          {title && <Head key={row.slug || "t"} text={title} on={on} D={Dh} tag="h1" size={phone ? "clamp(38px,10.4vw,48px)" : "clamp(52px,5.8vw,92px)"} lh={0.96} delay={120} step={36} className="rwpo-h" />}
          {row.f5 && <p className="rwpo-lead" style={rise(on, 420)}>{row.f5}</p>}
          {byline && <p className="rwpo-by" style={{ ...M, ...rise(on, 500, 12) }}><span className="rwpo-av" aria-hidden><i /><i /><i /></span>{byline}</p>}
        </header>
        <div className="rw-wrap">
          <div ref={cov} className="rwpo-cov" style={rise(on, 300, 30)}>
            <Um key={row.slug || "c"} src={imgOr(row)} on={on} shape="iris" ratio="16/9" radius={phone ? 18 : 24} par={2.2} delay={250} sizes="(max-width: 809px) 100vw, 92vw" eager />
          </div>
        </div>
        <div className="rw-wrap rwpo-body">
          {!phone && !tab ? <aside className="rwpo-side">{Rail}</aside> : <div className="rwpo-side is-row">{Rail}</div>}
          <div ref={art} className="rwpo-art">
            <UI_Md text={partA} D={Dh} />
            {ctaTitle && (
              <aside className="rwpo-cta" aria-label={ctaKicker || ctaTitle}>
                <span className="rwpo-cta-r" aria-hidden><i /><i /><i /></span>
                {ctaKicker && <p className="rwpo-cta-k" style={M}><i aria-hidden />{ctaKicker}</p>}
                <p className="rwpo-cta-t" style={Dh}>{ctaTitle}</p>
                {ctaText && <p className="rwpo-cta-x">{ctaText}</p>}
                <Btn href={book} label={ctaButton} kind="solid" icon="cal" />
              </aside>)}
            {partB && <UI_Md text={partB} D={Dh} />}
          </div>
        </div>
      </article>
      {more.length > 0 && (
        <div className="rw-wrap"><div className="rwpo-more">
          <div className="rwpo-mh">
            <div className="rwpo-mhl"><Eyebrow text={moreEyebrow} on={on} M={M} /><Head text={moreTitle} on={on} D={Dh} size={phone ? "40px" : "clamp(40px,4.2vw,64px)"} lh={0.95} /></div>
            <Btn href={backLink || "/blog"} label={moreButton} kind="ghost" />
          </div>
          <div className={`rwpo-mg rwpo-n${more.length}`}>
            {more.map((r, i) => (
              <a key={r.slug || i} href={`/blog/${r.slug}`} className="rwpo-card">
                <span className="rwpo-mc"><img {...RS(imgOr(r), "(max-width: 809px) 100vw, 30vw")} alt="" loading="lazy" decoding="async" draggable={false} /></span>
                <span className="rwpo-mm" style={M}>{r.f2 && <span className="rwpo-mk">{r.f2}</span>}{r.f4 && <span className="rwpo-mr">{r.f4} {readSuffix}</span>}</span>
                <h3 className="rwpo-mt" style={Dh}><span>{r.f1}</span></h3>
              </a>))}
          </div>
        </div></div>)}
      {mounted && typeof document !== "undefined" && createPortal(
        <button ref={ring} type="button" className="rwpo-ring" data-on="0" tabIndex={-1} onClick={toTop} aria-label={topLabel} style={{ ...cssVars(c), ["--rp" as any]: 0 }}>
          <svg viewBox="0 0 60 60" aria-hidden><circle cx="30" cy="30" r="26" className="rwpo-rb" /><circle cx="30" cy="30" r="26" className="rwpo-rf" style={{ strokeDasharray: C, ["--c" as any]: C }} /></svg>
          <span className="rwpo-rn" style={M}><b>0</b><small>%</small></span>
          <span className="rwpo-ru" aria-hidden><IcoArrow s={14} /></span>
        </button>, document.body)}
    </section>
  )
}
const CSS_POST = `
.rwpo{background:var(--rw-bone);color:var(--rw-ink);padding:clamp(140px,13vw,190px) 0 clamp(96px,10vw,150px)}
.rwpo .rw-it{position:relative;color:var(--rw-ink);font-weight:inherit;padding:0 .06em;isolation:isolate}
.rwpo .rw-it::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:.1em;bottom:.02em;border-radius:.14em;background:var(--rw-brass);transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.7,0,.2,1) .7s}
.rwpo .rw-hd.is-on .rw-it::before{transform:none}
.rwpo-top{display:flex;flex-direction:column;align-items:center;text-align:center;gap:26px;margin-bottom:clamp(44px,4.6vw,72px)}
.rwpo-meta{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px 14px;margin:0;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--rw-mut)}
.rwpo-kick{display:inline-flex;align-items:center;gap:8px;padding:6px 12px 6px 10px;border-radius:999px;background:var(--rw-ink);color:var(--rw-bone)} .rwpo-kick i{width:7px;height:7px;border-radius:50%;background:var(--rw-brass)}
.rwpo-read{padding:6px 11px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--rw-fog)}
.rwpo-h{max-width:19ch;text-wrap:balance}
.rwpo-lead{margin:0;max-width:52ch;font-size:clamp(18px,1.4vw,21px);line-height:1.5;color:var(--rw-mut)}
.rwpo-by{display:inline-flex;align-items:center;gap:12px;margin:0;font-size:12px;letter-spacing:.06em;color:var(--rw-mut)}
.rwpo-av{display:inline-flex} .rwpo-av i{width:26px;height:26px;border-radius:50%;margin-left:-8px;box-shadow:0 0 0 2px var(--rw-bone);background:var(--rw-ink)} .rwpo-av i:first-child{margin-left:0;background:var(--rw-brass)} .rwpo-av i:last-child{background:var(--rw-stone)}
.rwpo-cov{position:relative}
.rwpo-cov .rw-um{width:100%}
.rwpo-cov .rw-um img{top:-12%;height:124%}
.rwpo-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,720px) minmax(0,1fr);gap:clamp(32px,4vw,64px);margin-top:clamp(56px,6vw,96px)}
.rwpo-side{grid-column:1;justify-self:start}
.rwpo-side:not(.is-row) .rwpo-rail{position:sticky;top:120px}
.rwpo-art{grid-column:2;min-width:0}
.rwpo-rail{display:flex;flex-direction:column;align-items:flex-start;gap:14px}
.rwpo-back{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 16px 0 6px;margin-bottom:22px;border-radius:999px;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 18%,transparent);text-decoration:none;font-size:12px;letter-spacing:.08em;text-transform:uppercase;transition:background .35s,color .35s}
.rwpo-back span{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--rw-ink);color:var(--rw-brass);rotate:180deg;transition:translate .45s cubic-bezier(.7,0,.2,1)}
.rwpo-back:hover{background:var(--rw-ink);color:var(--rw-bone)} .rwpo-back:hover span{background:var(--rw-brass);color:var(--rw-ink);translate:-3px 0}
.rwpo-rl{margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--rw-mut)}
.rwpo-sh{display:flex;flex-direction:column;align-items:flex-start;gap:8px}
.rwpo-si{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-width:44px;height:44px;padding:0;border:0;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);box-shadow:inset 0 0 0 1px var(--rw-fog);cursor:pointer;font:inherit;transition:background .35s,color .35s,box-shadow .35s,translate .45s cubic-bezier(.34,1.56,.64,1)}
.rwpo-si svg{width:16px;height:16px}
.rwpo-si:hover{background:var(--rw-ink);color:var(--rw-brass);box-shadow:none;translate:3px 0}
.rwpo-copy{padding:0 16px 0 0} .rwpo-ci{display:grid;place-items:center;width:44px;height:44px}
.rwpo-ct{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase}
.rwpo-copy.is-ok{background:var(--rw-brass);color:var(--rw-ink);box-shadow:none}
.rwpo-copy.is-ok::after{content:"";position:absolute;left:0;top:0;width:44px;height:44px;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);animation:rw-pingr 1.1s cubic-bezier(.2,.6,.3,1) 2;pointer-events:none}
.rwpo-side.is-row{grid-column:1/-1;justify-self:center;width:100%;max-width:720px}
.rwpo-side.is-row .rwpo-rail{flex-direction:row;flex-wrap:wrap;align-items:center;gap:10px;padding-bottom:28px;border-bottom:1px solid var(--rw-fog)}
.rwpo-side.is-row .rwpo-back{margin:0 auto 0 0} .rwpo-side.is-row .rwpo-sh{flex-direction:row}
.rwpo .rw-md{font-size:18px;line-height:1.72;color:color-mix(in srgb,var(--rw-ink) 84%,var(--rw-bone))}
.rwpo .rw-md>p:first-child{font-size:21px;line-height:1.55;color:var(--rw-ink)}
.rwpo .rw-md h2{margin:2em 0 .6em;font-size:clamp(28px,2.4vw,36px);line-height:1.08;letter-spacing:-.04em;color:var(--rw-ink)} .rwpo .rw-md h2:first-child{margin-top:0}
.rwpo .rw-md p{margin:0 0 1.1em}
.rwpo .rw-md ul{list-style:none;margin:0 0 1.4em;padding:0;display:flex;flex-direction:column;gap:12px;counter-reset:rwpo}
.rwpo .rw-md li{position:relative;padding-left:34px}
.rwpo .rw-md li::before{content:"";position:absolute;left:0;top:.42em;width:18px;height:18px;border-radius:50%;background:var(--rw-brass) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M6 12.5l4 4 8-9' fill='none' stroke='%230D0E10' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/></svg>") center/12px no-repeat}
.rwpo .rw-md blockquote{position:relative;margin:1.6em 0;padding:30px 32px 30px 76px;border-radius:24px;background:var(--rw-ink);color:var(--rw-cloud);font-size:clamp(21px,1.9vw,27px);line-height:1.3;letter-spacing:-.025em;font-weight:600}
.rwpo .rw-md blockquote::before{content:"";position:absolute;left:30px;top:36px;width:14px;height:14px;border-radius:50%;background:var(--rw-brass);box-shadow:0 0 0 6px color-mix(in srgb,var(--rw-brass) 22%,transparent),0 0 0 13px color-mix(in srgb,var(--rw-brass) 9%,transparent)}
.rwpo-cta{position:relative;overflow:hidden;isolation:isolate;display:flex;flex-direction:column;align-items:flex-start;gap:14px;margin:2.4em 0;padding:clamp(28px,3vw,40px);border-radius:24px;background:var(--rw-brass);color:var(--rw-ink)}
.rwpo-cta-r{position:absolute;z-index:-1;right:-90px;bottom:-90px;width:300px;height:300px}
.rwpo-cta-r i{position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--rw-ink) 30%,transparent);animation:rwpo-rg 4.2s cubic-bezier(.2,.6,.3,1) infinite;opacity:0}
.rwpo-cta-r i:nth-child(2){animation-delay:1.4s} .rwpo-cta-r i:nth-child(3){animation-delay:2.8s}
@keyframes rwpo-rg{0%{transform:scale(.12);opacity:1}100%{transform:scale(1);opacity:0}}
.rwpo-cta-k{display:inline-flex;align-items:center;gap:8px;margin:0;padding:6px 12px 6px 10px;border-radius:999px;background:var(--rw-ink);color:var(--rw-bone);font-size:11px;letter-spacing:.1em;text-transform:uppercase} .rwpo-cta-k i{width:7px;height:7px;border-radius:50%;background:#FF3E88}
.rwpo-cta-t{margin:0;font-size:clamp(30px,2.8vw,42px);line-height:1;letter-spacing:-.045em;max-width:16ch}
.rwpo-cta-x{margin:0 0 6px;max-width:44ch;font-size:16px;line-height:1.5;color:color-mix(in srgb,var(--rw-ink) 78%,var(--rw-brass))}
.rwpo-cta .rw-btn.rw-solid{--ring:var(--rw-brass);--fill:var(--rw-cloud)}
.rwpo-more{margin-top:clamp(96px,10vw,150px);padding-top:clamp(56px,5vw,80px);border-top:1px solid var(--rw-fog)}
.rwpo-mh{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:clamp(36px,4vw,56px)}
.rwpo-mhl{display:flex;flex-direction:column;gap:20px}
.rwpo-mg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(24px,2.4vw,40px)}
.rwpo-card{display:flex;flex-direction:column;gap:16px;text-decoration:none;color:inherit}
.rwpo-mc{position:relative;display:block;aspect-ratio:4/3;overflow:hidden;border-radius:20px;background:color-mix(in srgb,var(--rw-fog) 70%,var(--rw-bone))}
.rwpo-mc img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:scale 1.1s cubic-bezier(.2,.8,.2,1)}
.rwpo-card:hover .rwpo-mc img{scale:1.06}
.rwpo-mm{display:flex;flex-wrap:wrap;gap:8px;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
.rwpo-mk{padding:5px 10px;border-radius:999px;background:var(--rw-ink);color:var(--rw-bone)}
.rwpo-mr{padding:5px 10px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--rw-fog);color:var(--rw-mut);transition:background .35s,color .35s,box-shadow .35s}
.rwpo-card:hover .rwpo-mr{background:var(--rw-brass);color:var(--rw-ink);box-shadow:none}
.rwpo-mt{margin:0;font-size:clamp(21px,1.7vw,25px);line-height:1.12;letter-spacing:-.035em}
.rwpo-mt span{background:linear-gradient(var(--rw-ink),var(--rw-ink)) 0 96%/0% 2px no-repeat;transition:background-size .7s cubic-bezier(.7,0,.2,1);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.rwpo-card:hover .rwpo-mt span{background-size:100% 2px}
.rwpo-ring{position:fixed;z-index:900;right:clamp(16px,2vw,28px);bottom:clamp(16px,2vw,28px);display:grid;place-items:center;width:64px;height:64px;padding:0;border:0;border-radius:50%;background:var(--rw-ink);color:var(--rw-cloud);cursor:pointer;box-shadow:0 18px 40px -16px rgba(0,0,0,.55);opacity:0;scale:.6;pointer-events:none;transition:opacity .4s,scale .5s cubic-bezier(.34,1.56,.64,1)}
.rwpo-ring[data-on="1"]{opacity:1;scale:1;pointer-events:auto}
.rwpo-ring svg{position:absolute;inset:0;width:100%;height:100%;rotate:-90deg}
.rwpo-ring circle{fill:none;stroke-width:3.5}
.rwpo-rb{stroke:color-mix(in srgb,var(--rw-cloud) 16%,transparent)}
.rwpo-rf{stroke:var(--rw-brass);stroke-linecap:round;stroke-dashoffset:calc(var(--c)*(1 - var(--rp)))}
.rwpo-rn{position:relative;display:inline-flex;align-items:baseline;font-size:14px;font-weight:500;font-variant-numeric:tabular-nums;transition:opacity .3s,translate .35s} .rwpo-rn small{font-size:9px;opacity:.6}
.rwpo-ru{position:absolute;display:grid;place-items:center;rotate:-90deg;color:var(--rw-brass);opacity:0;translate:0 8px;transition:opacity .3s,translate .35s}
.rwpo-ring:hover .rwpo-rn,.rwpo-ring:focus-visible .rwpo-rn{opacity:0;translate:0 -8px} .rwpo-ring:hover .rwpo-ru,.rwpo-ring:focus-visible .rwpo-ru{opacity:1;translate:0 0}
.rwpo-ring:focus-visible{outline:3px solid var(--rw-brass)!important;outline-offset:3px!important}
.rwpo.is-tab .rwpo-body,.rwpo.is-ph .rwpo-body{grid-template-columns:minmax(0,1fr);gap:36px}
.rwpo.is-tab .rwpo-art,.rwpo.is-ph .rwpo-art{grid-column:1;max-width:720px;width:100%;justify-self:center}
.rwpo.is-tab .rwpo-mg{grid-template-columns:repeat(2,minmax(0,1fr))} .rwpo.is-tab .rwpo-n3 .rwpo-card:nth-child(3){display:none}
.rwpo.is-ph{padding-top:120px}
.rwpo.is-ph .rwpo-top{gap:20px} .rwpo.is-ph .rwpo-lead{font-size:17px}
.rwpo.is-ph .rwpo-side.is-row .rwpo-back{flex-basis:100%;margin-bottom:6px;width:max-content;flex:none}
.rwpo.is-ph .rwpo-side.is-row .rwpo-rl{display:none}
.rwpo.is-ph .rw-md{font-size:17px} .rwpo.is-ph .rw-md>p:first-child{font-size:19px}
.rwpo.is-ph .rw-md blockquote{padding:24px 22px 24px 58px;font-size:20px} .rwpo.is-ph .rw-md blockquote::before{left:22px;top:31px;width:12px;height:12px}
.rwpo.is-ph .rwpo-cta{padding:26px 22px}
.rwpo.is-ph .rwpo-mh{flex-direction:column;align-items:flex-start}
.rwpo.is-ph .rwpo-mg{grid-template-columns:1fr;gap:36px}
@media (max-width:809px){.rwpo-ring{width:56px;height:56px}}
@media (prefers-reduced-motion:reduce){.rwpo-cta-r i{animation:none;opacity:.3} .rwpo-ring{transition:none}}`
addPropertyControls(RwPost, {
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  slug: { type: ControlType.String, title: "Slug", description: "Bind to the CMS Slug on the /blog/:slug page. Empty = the slug in the URL", defaultValue: "" },
  backLabel: { type: ControlType.String, title: "Back label", defaultValue: "Back to blog" },
  backLink: { type: ControlType.Link, title: "Back link", defaultValue: "/blog" },
  byline: { type: ControlType.String, title: "Byline", description: "Empty hides it", defaultValue: "By the Reachwise team" },
  readSuffix: { type: ControlType.String, title: "Read label", defaultValue: "read" },
  extraBody: { type: ControlType.String, title: "Extra body", description: "Markdown added after the CMS Body on every post: ## heading, - list item, > quote. Empty = CMS Body only", displayTextArea: true, defaultValue: PO_EXTRA },
  shareLabel: { type: ControlType.String, title: "Share label", defaultValue: "Share" },
  copyLabel: { type: ControlType.String, title: "Copy label", defaultValue: "Copy link" },
  copiedLabel: { type: ControlType.String, title: "Copied label", defaultValue: "Copied" },
  ctaKicker: { type: ControlType.String, title: "CTA tag", defaultValue: "Free audit" },
  ctaTitle: { type: ControlType.String, title: "CTA title", description: "Empty hides the card", defaultValue: "Want this for your brand?" },
  ctaText: { type: ControlType.String, title: "CTA text", defaultValue: "Get a free 30-minute audit. We'll show you the three fastest wins in your search, social and ads, with numbers.", displayTextArea: true },
  ctaButton: { type: ControlType.String, title: "CTA button", defaultValue: "Book my free audit" },
  ctaLink: { type: ControlType.Link, title: "CTA link", description: "Empty = Booking Link on the Site CMS row" },
  moreEyebrow: { type: ControlType.String, title: "More label", defaultValue: "Keep reading" },
  moreTitle: { type: ControlType.String, title: "More title", description: "| = line break, *words* = lime marker", defaultValue: "More *ideas*." },
  moreButton: { type: ControlType.String, title: "More button", defaultValue: "All articles" },
  topLabel: { type: ControlType.String, title: "Ring label", description: "Screen-reader label of the reading ring (click = back to the top)", defaultValue: "Back to top" },
})
