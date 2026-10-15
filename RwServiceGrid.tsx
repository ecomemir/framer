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
  services: [{"slug": "seo", "f1": "SEO", "f2": "Rank for the searches that buy.", "f3": "Technical fixes, content and links that move you up the page for the words your customers type.", "f4": "$1,500/mo", "f5": "Technical audit;Keyword map;4 articles a month;Link building;Monthly ranking report", "f6": "seo", "f7": "#1 for 212 keywords", "n1": "1"}, {"slug": "social-media", "f1": "Social media", "f2": "Posts people stop for.", "f3": "Strategy, shooting, editing and community management on Instagram, TikTok and LinkedIn.", "f4": "$1,800/mo", "f5": "12 posts + 8 reels a month;Content calendar;Community replies;Monthly report", "f6": "social", "f7": "48k average reel views", "n1": "2"}, {"slug": "paid-ads", "f1": "Paid ads", "f2": "Every dollar tracked to a sale.", "f3": "Meta, Google and TikTok campaigns built around your margins, tested weekly and reported in revenue.", "f4": "$1,200/mo + ad spend", "f5": "Account setup;Creative testing;Weekly optimisation;Revenue dashboard", "f6": "ads", "f7": "6.2× return on ad spend", "n1": "3"}, {"slug": "content", "f1": "Content", "f2": "Articles, videos and emails that sell.", "f3": "Blog posts, newsletters and short videos written for search and for people.", "f4": "$1,400/mo", "f5": "Editorial plan;4 long-form articles;2 newsletters;Repurposed clips", "f6": "content", "f7": "3.4× more leads from blog", "n1": "4"}, {"slug": "web-design", "f1": "Web design", "f2": "Sites that turn visits into calls.", "f3": "Fast Framer and Webflow websites with landing pages built to convert your traffic.", "f4": "$4,500 once", "f5": "Wireframes;Design + build;CMS setup;Speed + SEO basics", "f6": "web", "f7": "+64% conversion rate", "n1": "5"}, {"slug": "branding", "f1": "Branding", "f2": "A brand people remember.", "f3": "Naming, logo, colours and a voice that makes your ads and posts look like one company.", "f4": "$3,800 once", "f5": "Brand workshop;Logo + identity;Brand guidelines;Social templates", "f6": "brand", "f7": "2 weeks to launch", "n1": "6"}]
}
const SW_BUILD = "RwServiceGrid@cms1"
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

// ===== RwServiceGrid =====
interface ServiceGridProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  eyebrow: string; heading: string; intro: string; button: string; buttonLink: string
  fromLabel: string; exploreLabel: string; liveLabel: string; waitLabel: string; replayLabel: string; includesCount: number
  seoQuery: string; socialHandle: string; socialPhoto: any; adsHeadline: string; articleTitle: string; webUrl: string; brandName: string; style?: CSSProperties
}
// ---- THE CHANNEL WALL (/services): every Services row as a large card in two offset columns. Each card carries the channel's LIVE mini-UI.
// Scroll mechanic: a card waits in grey ("waiting for signal") until its top crosses 70% of the viewport; then a lime REACH RIPPLE expands out of
// its top-left corner, the stage blooms into colour and the mini-UI starts. Hover: the card lifts, a smaller ripple pings and the mini-UI replays at 2×. ----
const SG_PHOTO = "https://framerusercontent.com/images/xbfdpTvZzzafiJOwtXCs0luyp2I.webp"
const SG_TONES = ["fog", "lime", "cloud", "ink", "fog", "lime"]
// step counter: 0 → n over time while `run`, else the final step at once
function useSgStep(n: number, ms: number, run: any, delay = 350) {
  const [s, setS] = useState(run ? 0 : n)
  useEffect(() => { if (run === "wait") { setS(0); return } if (!run) { setS(n); return } setS(0); let k = 0, iv = 0; const t = window.setTimeout(() => { iv = window.setInterval(() => { k++; setS(k); if (k >= n) window.clearInterval(iv) }, ms) }, delay); return () => { window.clearTimeout(t); window.clearInterval(iv) } }, [run, n])
  return s
}
// eased count a → b while `run` (final value at once otherwise)
function useSgCount(a: number, b: number, dur: number, run: any, delay = 300) {
  const [v, setV] = useState(run ? a : b)
  useEffect(() => { if (run === "wait") { setV(a); return } if (!run) { setV(b); return } setV(a); let raf = 0; const t0 = performance.now() + delay; const f = (t: number) => { const p = clamp01((t - t0) / dur); setV(a + (b - a) * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(f) }; raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf) }, [run, a, b])
  return v
}
const SgHeart = () => (<svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 20.5S3.5 15.4 3.5 9.4A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8.5 2.1c0 6-8.5 11.1-8.5 11.1z" /></svg>)
const SgMark = ({ s = 26 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 32 32" aria-hidden><circle cx="16" cy="16" r="15" fill="var(--rw-brass)" /><circle cx="16" cy="16" r="3.4" fill="var(--rw-ink)" /><path d="M10.2 21.8a8.2 8.2 0 0 1 0-11.6M21.8 10.2a8.2 8.2 0 0 1 0 11.6" fill="none" stroke="var(--rw-ink)" strokeWidth="2.4" strokeLinecap="round" /></svg>)
type SgCfg = { seoQuery: string; socialHandle: string; photo: string; adsHeadline: string; articleTitle: string; webUrl: string; brandName: string }
type SgP = { run: any; spd?: number; cfg: SgCfg; M: CSSProperties; D: CSSProperties }
const SgUI = ({ kind, ...p }: SgP & { kind: string }) => { const k = String(kind || "").toLowerCase(); const C = k === "seo" ? SgSeo : k === "social" ? SgSoc : k === "ads" ? SgAds : k === "content" ? SgCnt : k === "web" ? SgWeb : SgBrd; return <C {...p} /> }
// SEO: our result climbs from #5 to #1
const SgSeo = ({ run, cfg, M, D, spd = 1 }: SgP) => { const st = useSgStep(4, 640 / spd, run, 420); const ours = 4 - st; const others = ["citydentalcare.com", "yelp.com › dentists", "smilecentre.co", "healthgrades.com"]
  return (<div className="rwsg-ui rwsg-seo">
    <div className="rwsg-q" style={M}><svg viewBox="0 0 24 24" aria-hidden><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M15 15l5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg><span>{cfg.seoQuery}</span><i /></div>
    <p className="rwsg-meta" style={M}>About 2,140,000 results · 0.42 s</p>
    <div className="rwsg-res">{[0, 1, 2, 3, 4].map((i) => { const me = i === 4; const slot = me ? ours : (i < ours ? i : i + 1); return (
      <div key={i} className={`rwsg-r${me ? " is-me" : ""}${me && ours === 0 ? " is-top" : ""}`} style={{ top: `${Math.min(4, slot) * 20}%` }}>
        <i className="rwsg-fav" /><span className="rwsg-rt"><b style={M}>{me ? "yoursite.com" : others[i]}</b>{me ? <strong style={D}>Your brand · {cfg.seoQuery}</strong> : <em />}<em className="rwsg-rt2" /></span>
        {me && <span className="rwsg-rank" style={M}>#{ours + 1}</span>}
      </div>) })}</div>
    <p className={`rwsg-toast${ours === 0 ? " is-on" : ""}`} style={M}><i />Position 1 · clicks +212%</p>
  </div>) }
// Social: a post collecting likes, heart pops, hearts float up
const SgSoc = ({ run, cfg, M, D, spd = 1 }: SgP) => { const likes = useSgCount(1184, 1312, 2200 / spd, run, 500); const pop = useSgStep(1, 400 / spd, run, 700)
  return (<div className="rwsg-ui rwsg-soc"><div className="rwsg-phone">
    <div className="rwsg-ph-h"><i className="rwsg-av" /><span style={M}>{cfg.socialHandle}</span><b style={M}>···</b></div>
    <div className="rwsg-ph"><img {...RS(cfg.photo, "360px")} alt="" loading="lazy" decoding="async" draggable={false} />
      <span className={`rwsg-float${pop ? " is-on" : ""}`} aria-hidden><i /><i /><i /></span>
      <span className={`rwsg-toast rwsg-toast-s${pop ? " is-on" : ""}`} style={M}><i />+128 likes in 1 h</span></div>
    <div className="rwsg-pb"><span className={`rwsg-hrt${pop ? " is-pop" : ""}`}><SgHeart /><i /></span><svg className="rwsg-ic" viewBox="0 0 24 24" aria-hidden><path d="M4 12a8 8 0 1 1 3.3 6.5L4 20l1.2-3.6A8 8 0 0 1 4 12z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg><svg className="rwsg-ic" viewBox="0 0 24 24" aria-hidden><path d="M21 4L10 14M21 4l-7 17-4-7-7-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg></div>
    <p className="rwsg-likes" style={D}>{Math.round(likes).toLocaleString("en-US")} likes</p>
    <p className="rwsg-cap"><b>{cfg.socialHandle.replace(/^@/, "")}</b> Monday mornings, sorted ☕</p>
  </div></div>) }
// Ads: an ad card + two gauges ticking + revenue bars growing
const SgGauge = ({ v, max, label, text, M, D }: { v: number; max: number; label: string; text: string; M: CSSProperties; D: CSSProperties }) => { const f = clamp01(v / max)
  return (<span className="rwsg-g"><svg viewBox="0 0 120 70" aria-hidden><path d="M10 62a50 50 0 0 1 100 0" className="rwsg-g0" pathLength={1} /><path d="M10 62a50 50 0 0 1 100 0" className="rwsg-g1" pathLength={1} style={{ strokeDashoffset: 1 - f }} /></svg><b style={D}>{text}</b><small style={M}>{label}</small></span>) }
const SgAds = ({ run, cfg, M, D, spd = 1 }: SgP) => { const ctr = useSgCount(0.9, 4.8, 1900 / spd, run); const roas = useSgCount(1.4, 6.2, 2100 / spd, run, 450); const bars = [0.28, 0.36, 0.34, 0.5, 0.58, 0.74, 0.96]
  return (<div className="rwsg-ui rwsg-ads">
    <div className="rwsg-ad"><span className="rwsg-spon" style={M}><i className="rwsg-av" />Sponsored</span><b style={D}>{cfg.adsHeadline}</b><span className="rwsg-adimg" aria-hidden><i /></span><span className="rwsg-adbtn" style={M}>Book now</span></div>
    <div className="rwsg-gs"><SgGauge v={ctr} max={6} label="CTR" text={`${ctr.toFixed(1)}%`} M={M} D={D} /><SgGauge v={roas} max={8} label="ROAS" text={`${roas.toFixed(1)}×`} M={M} D={D} /></div>
    <span className={`rwsg-bars${run === true ? " is-run" : ""}`} aria-hidden>{bars.map((h, i) => <i key={i} style={{ height: `${h * 100}%`, animationDelay: `${0.3 + i * 0.09}s` }} />)}</span>
  </div>) }
// Content: an article typing itself, the read counter climbing
const SgCnt = ({ run, cfg, M, D, spd = 1 }: SgP) => { const full = cfg.articleTitle; const n = useSgStep(full.length, 40 / spd, run, 350); const reads = useSgCount(0, 2410, 2600 / spd, run, 600)
  return (<div className="rwsg-ui rwsg-cnt"><div className="rwsg-art">
    <span className="rwsg-kick" style={M}>Guide · 6 min read</span>
    <b className="rwsg-type" style={D}>{full.slice(0, n)}<i className={n < full.length ? "is-typing" : ""} /></b>
    <span className="rwsg-by" style={M}><i className="rwsg-av" />Reachwise editorial</span>
    <span className="rwsg-lines" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} />)}</span>
    <span className="rwsg-prog" aria-hidden><i style={{ transform: `scaleX(${(reads / 2410).toFixed(3)})` }} /></span>
    <span className="rwsg-reads" style={M}><em />{Math.round(reads).toLocaleString("en-US")} reads this week</span>
  </div></div>) }
// Web: a browser whose landing page scrolls, a cursor clicks the CTA
const SgWeb = ({ cfg, M }: SgP) => (<div className="rwsg-ui rwsg-web"><div className="rwsg-br">
    <div className="rwsg-chrome"><i /><i /><i /><span style={M}>{cfg.webUrl}</span></div>
    <div className="rwsg-vp"><div className="rwsg-page">
      <span className="rwsg-pg-nav"><i /><i /><i /><i /></span>
      <span className="rwsg-pg-h"><i /><i /><i /></span><span className="rwsg-pg-b" />
      <span className="rwsg-pg-img" /><span className="rwsg-pg-row"><i /><i /><i /></span>
      <span className="rwsg-pg-h"><i /><i /></span><span className="rwsg-pg-q" /><span className="rwsg-pg-row"><i /><i /></span><span className="rwsg-pg-b" />
    </div><i className="rwsg-cur" aria-hidden /></div>
    <span className="rwsg-conv" style={M}>Conversion 4.1% ▲</span>
  </div></div>)
// Brand: the logo, four swatches flipping to a second palette, the type
const SgBrd = ({ cfg, M, D }: SgP) => (<div className="rwsg-ui rwsg-brd">
    <div className="rwsg-logo"><SgMark s={44} /><b style={D}>{cfg.brandName}</b></div>
    <div className="rwsg-sw">{["#0D0E10", "#D4FF3A", "#FF3E88", "#FFFFFF"].map((hx, i) => <span key={i} className={`rwsg-s rwsg-s${i}`} style={{ animationDelay: `${i * 0.16}s` }}><i><small style={M}>{hx}</small></i><i><small style={M}>{["#1F3A2E", "#FF8A3D", "#F2E6D3", "#2F5BFF"][i]}</small></i></span>)}</div>
    <div className="rwsg-spec"><span style={D}>Aa</span><span style={M}>Display · Sans · Mono<br />Guidelines v1.0</span></div>
    <div className="rwsg-apps" aria-hidden><i className="rwsg-app1"><SgMark s={22} /></i><i className="rwsg-app2" style={D}>{cfg.brandName}</i><i className="rwsg-app3" /></div>
  </div>)

export default function RwServiceGrid(props: ServiceGridProps) {
  const { eyebrow = "(01) All channels", heading = "Pick one channel,|or *all six*.", intro = "Every channel below is run by a senior specialist, reported in one dashboard and billed as one monthly retainer. Mix them as you grow.", button = "Book a call", buttonLink = "",
    fromLabel = "From", exploreLabel = "Explore", liveLabel = "Live", waitLabel = "Waiting for signal", replayLabel = "Hover a card to replay it", includesCount = 3,
    seoQuery = "dentist near me", socialHandle = "@kinfolk.coffee", socialPhoto, adsHeadline = "Free whitening with every new-patient visit", articleTitle = "How to rank #1 for “near me” searches",
    webUrl = "yoursite.com/offer", brandName = "Kinfolk", bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill(); const site = useSite()
  const rows = useCMS("services", SEED.services || []); const n = rows.length
  const root = useRef<HTMLElement>(null); const grid = useRef<HTMLDivElement>(null)
  const { w } = useSize(root, bpHint); const phone = w < 810, tab = w >= 810 && w < 1100
  const on = useOn(root, live, rm)
  useMagnet(root, live)
  const final = still || rm || !live
  const cfg: SgCfg = { seoQuery, socialHandle, photo: srcOf(socialPhoto, SG_PHOTO), adsHeadline, articleTitle, webUrl, brandName }
  const book = pick(buttonLink, site.book || "/contact")
  // reached[i]: the card's top has crossed 70% of the viewport (stays reached). One shared rAF: reads first, then a state write only on change.
  const [reach, setReach] = useState<boolean[]>([]); const reachR = useRef<boolean[]>([])
  useEffect(() => {
    if (final || !grid.current) return
    const G = grid.current; let tops: number[] = [], vh = 1, vis = true
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting }, { rootMargin: "30% 0px 30% 0px" }); io.observe(G)
    const read = () => { if (!vis) return; vh = window.innerHeight || 1; tops = Array.from(G.querySelectorAll<HTMLElement>(".rwsg-card")).map((el) => el.getBoundingClientRect().top) }
    const off = onTick(() => { if (!vis || !tops.length) return; let ch = false; const nx = tops.map((t, i) => { const v = !!reachR.current[i] || t < vh * 0.7; if (v !== !!reachR.current[i]) ch = true; return v }); if (ch) { reachR.current = nx; setReach(nx) } }, read)
    return () => { off(); io.disconnect() }
  }, [final, n])
  // hover replay at 2× (only once the previous run has had time to finish)
  const [rep, setRep] = useState<number[]>([]); const repT = useRef<number[]>([])
  const replay = (i: number) => { if (final || !reachR.current[i]) return; const t = performance.now(); if (t - (repT.current[i] || 0) < 2600) return; repT.current[i] = t; setRep((a) => { const b = a.slice(); b[i] = (b[i] || 0) + 1; return b }) }
  return (
    <section ref={root as any} className={`rw rw-sec rwsg${phone ? " is-ph" : tab ? " is-tab" : ""}${on ? " is-on" : ""}${final ? " is-fin" : ""}`} style={{ ...cssVars(c), ...B, ...(props.style || {}) }}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_MOTION + CSS_SG + siteFontCss(props) }} />
      <div className="rw-wrap">
        <header className="rwsg-head">
          <div className="rwsg-hl"><Eyebrow text={eyebrow} on={on} M={M} /><Head text={heading} on={on} D={D} size={phone ? "clamp(40px,11vw,48px)" : "clamp(40px,4.6vw,68px)"} lh={0.95} delay={80} /></div>
          <div className="rwsg-hr" style={rise(on, 300, 14)}>{intro && <p>{intro}</p>}{button && <Btn href={book} label={button} kind="ghost" icon="cal" />}</div>
        </header>
        {n > 0 && (
          <div ref={grid} className="rwsg-grid">
            {rows.map((r, i) => { const hit = final || !!reach[i]; const tone = SG_TONES[i % SG_TONES.length]; const inc = listOf(r.f5).slice(0, Math.max(0, Math.round(includesCount))); const num = String(i + 1).padStart(2, "0")
              const run: any = final ? false : hit ? true : "wait"
              return (
                <article key={r.slug || i} className={`rwsg-card t-${tone}${hit ? " is-hit" : ""}`} onPointerEnter={() => replay(i)} style={{ ["--i" as any]: i }}>
                  <i className="rwsg-rip" aria-hidden><b /><b /><b className="rwsg-hov" /></i>
                  <div className="rwsg-stage" aria-hidden>
                    <SgUI key={`${hit ? "h" : "w"}${rep[i] || 0}`} kind={r.f6} run={run} spd={rep[i] ? 2 : 1} cfg={cfg} M={M} D={D} />
                    <span className="rwsg-st" style={M}><i />{hit ? liveLabel : waitLabel}<em>{r.f1}</em></span>
                    <span className="rwsg-no" style={M}>{num}</span>
                  </div>
                  <div className="rwsg-tx">
                    <div className="rwsg-tt"><h2 style={D}>{r.f1}</h2>{r.f7 && <span className="rwsg-stat" style={M}><i />{r.f7}</span>}</div>
                    {r.f2 && <p className="rwsg-short">{r.f2}</p>}
                    {r.f3 && <p className="rwsg-body">{r.f3}</p>}
                    {inc.length > 0 && <ul className="rwsg-inc">{inc.map((x, j) => <li key={j} style={{ ["--j" as any]: j }}><svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="11" /><path d="M6.5 12.5l3.8 3.8 7.2-8" pathLength={1} /></svg>{x}</li>)}</ul>}
                    <div className="rwsg-foot">
                      {r.f4 && <p className="rwsg-pr" style={M}><small>{fromLabel}</small><span>{r.f4}</span></p>}
                      <Btn href={`/services/${r.slug || ""}`} label={exploreLabel} kind="ghost" sub={r.f1} />
                    </div>
                  </div>
                </article>) })}
          </div>)}
        {n > 0 && replayLabel && !phone && <p className="rwsg-hint" style={{ ...M, ...rise(on, 500, 8) }}><i aria-hidden />{replayLabel}</p>}
      </div>
    </section>
  )
}
const CSS_SG = `
.rwsg{background:var(--rw-bone);color:var(--rw-ink);padding:clamp(72px,7vw,120px) 0 clamp(110px,11vw,180px);overflow-x:clip}
.rwsg .rw-eb i{position:relative} .rwsg .rw-eb i::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 1.5px var(--rw-brass);animation:rwsg-ping 1.8s cubic-bezier(.2,.6,.3,1) infinite}
@keyframes rwsg-ping{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.8)}}
.rwsg .rw-hd{font-weight:var(--rw-font-dw,700);letter-spacing:-.045em}
.rwsg .rw-it{position:relative;isolation:isolate;font-weight:inherit;color:var(--rw-ink);padding:0 .06em;margin:0 -.02em}
.rwsg .rw-it::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:.1em;bottom:.02em;border-radius:.14em;background:var(--rw-brass);transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.7,0,.2,1) var(--pd,.6s)}
.rwsg .rw-hd.is-on .rw-it::before{transform:none}
.rwsg-head{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:end;gap:40px;margin-bottom:clamp(44px,4.6vw,72px)}
.rwsg-hl{display:flex;flex-direction:column;gap:26px;align-items:flex-start}
.rwsg-hr{display:flex;flex-direction:column;align-items:flex-start;gap:24px;justify-self:end;max-width:420px} .rwsg-hr p{margin:0;font-size:17px;line-height:1.5;color:var(--rw-mut)}
/* two offset columns: the even cards hang 140px lower */
.rwsg-grid{--off:140px;display:grid;grid-template-columns:1fr 1fr;gap:28px 24px;padding-bottom:var(--off)}
.rwsg-card:nth-child(even){translate:0 var(--off)}
.rwsg-card{position:relative;display:flex;flex-direction:column;border-radius:30px;padding:12px;background:var(--rw-cloud);box-shadow:0 0 0 1px color-mix(in srgb,var(--rw-ink) 7%,transparent);overflow:hidden;isolation:isolate;transition:transform .7s cubic-bezier(.2,.8,.2,1),box-shadow .6s}
.rwsg-card:hover{transform:translateY(-8px);box-shadow:0 0 0 1px color-mix(in srgb,var(--rw-ink) 10%,transparent),0 40px 70px -40px rgba(13,14,16,.45)}
/* the reach ripple: two lime rings out of the top-left corner */
.rwsg-rip{position:absolute;z-index:3;left:0;top:0;width:0;height:0;pointer-events:none}
.rwsg-rip b{position:absolute;left:0;top:0;width:260%;aspect-ratio:1;translate:-50% -50%;border-radius:50%;box-shadow:inset 0 0 0 2px var(--rw-brass),0 0 0 1px color-mix(in srgb,var(--rw-brass) 40%,transparent);background:radial-gradient(circle,transparent 62%,color-mix(in srgb,var(--rw-brass) 12%,transparent) 70%,transparent 71%);scale:0;opacity:0}
.rwsg-rip{width:100%;height:100%}
.rwsg-card.is-hit .rwsg-rip b:not(.rwsg-hov){animation:rwsg-rip 1.7s cubic-bezier(.15,.6,.3,1) both} .rwsg-card.is-hit .rwsg-rip b:nth-child(2){animation-delay:.28s}
@keyframes rwsg-rip{0%{scale:0;opacity:1}70%{opacity:.9}100%{scale:1;opacity:0}}
.rwsg-card.is-hit .rwsg-rip .rwsg-hov{animation:none} .rwsg-card.is-hit:hover .rwsg-rip .rwsg-hov{animation:rwsg-rip2 1.1s cubic-bezier(.2,.6,.3,1) both}
@keyframes rwsg-rip2{0%{scale:0;opacity:1}100%{scale:.45;opacity:0}}
.rwsg.is-fin .rwsg-rip{display:none}
/* stage: grey + dim while it waits, blooms when reached */
.rwsg-stage{position:relative;height:380px;border-radius:22px;overflow:hidden;background:var(--stg);--pfg:var(--rw-ink);--mut:color-mix(in srgb,var(--rw-ink) 60%,transparent);--stg:color-mix(in srgb,var(--rw-ink) 6%,transparent)}
.rwsg-card.t-lime .rwsg-stage{--stg:color-mix(in srgb,var(--rw-brass) 55%,var(--rw-bone))}
.rwsg-card.t-cloud .rwsg-stage{--stg:var(--rw-bone)}
.rwsg-card.t-ink .rwsg-stage{--stg:var(--rw-ink);--pfg:var(--rw-cloud);--mut:color-mix(in srgb,var(--rw-cloud) 62%,transparent)} .rwsg-card.t-ink .rwsg-brd,.rwsg-card.t-ink .rwsg-spec{color:var(--rw-cloud)}
.rwsg-stage>.rwsg-ui{filter:grayscale(1);opacity:.42;transition:filter 1.2s ease .25s,opacity 1s ease .25s}
.rwsg-card.is-hit .rwsg-stage>.rwsg-ui{filter:none;opacity:1}
.rwsg-card:not(.is-hit) .rwsg-page,.rwsg-card:not(.is-hit) .rwsg-cur,.rwsg-card:not(.is-hit) .rwsg-s{animation-play-state:paused}
.rwsg-st{position:absolute;z-index:4;left:14px;top:14px;display:inline-flex;align-items:center;gap:8px;padding:6px 11px 6px 9px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;box-shadow:0 8px 20px -12px rgba(0,0,0,.4)}
.rwsg-st i{width:7px;height:7px;border-radius:50%;background:color-mix(in srgb,var(--rw-ink) 30%,transparent);transition:background .4s} .rwsg-card.is-hit .rwsg-st i{background:#FF3E88;animation:rw-blink 1.4s ease-in-out infinite}
.rwsg-st em{font-style:normal;color:color-mix(in srgb,var(--rw-ink) 50%,transparent)} .rwsg-st em::before{content:"· "}
.rwsg-no{position:absolute;z-index:4;right:14px;top:14px;display:grid;place-items:center;min-width:44px;height:30px;padding:0 10px;border-radius:999px;background:var(--rw-ink);color:var(--rw-brass);font-size:12px;letter-spacing:.06em}
/* when the stage has a floating header chip, keep the mini-UI's own top clear */
.rwsg-stage>.rwsg-ui{padding-top:56px}
.rwsg-stage>.rwsg-soc{padding-top:48px}
/* copy */
.rwsg-tx{display:flex;flex-direction:column;gap:14px;padding:26px 16px 12px}
.rwsg-tt{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.rwsg-tt h2{margin:0;font-size:clamp(36px,3.3vw,52px);line-height:.96;letter-spacing:-.045em;font-weight:var(--rw-font-dw,700)}
.rwsg-stat{flex:none;display:inline-flex;align-items:center;gap:8px;margin-top:6px;padding:7px 12px;border-radius:999px;background:var(--rw-brass);color:var(--rw-ink);font-size:11.5px;letter-spacing:.02em} .rwsg-stat i{width:7px;height:7px;border-radius:50%;background:#FF3E88}
.rwsg-short{margin:0;font-size:20px;line-height:1.3;letter-spacing:-.015em;font-weight:500}
.rwsg-body{margin:0;font-size:16px;line-height:1.55;color:var(--rw-mut);max-width:52ch}
.rwsg-inc{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 0;padding:0}
.rwsg-inc li{display:inline-flex;align-items:center;gap:8px;padding:7px 13px 7px 8px;border-radius:999px;background:var(--rw-bone);font-size:14px;line-height:1.2}
.rwsg-inc svg{width:18px;height:18px;flex:none} .rwsg-inc circle{fill:var(--rw-brass);stroke:none} .rwsg-inc path{fill:none;stroke:var(--rw-ink);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .6s cubic-bezier(.6,0,.3,1) calc(.9s + var(--j)*.14s)}
.rwsg-card.is-hit .rwsg-inc path,.rwsg.is-fin .rwsg-inc path{stroke-dashoffset:0}
.rwsg-foot{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:10px;padding-top:18px;border-top:1px solid var(--rw-fog)}
.rwsg-pr{display:flex;flex-direction:column;gap:3px;margin:0;font-size:15px} .rwsg-pr small{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--rw-mut)}
.rwsg-foot .rw-btn{--ring:var(--rw-cloud)}
.rwsg-hint{display:flex;align-items:center;gap:8px;margin:28px 0 0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--rw-mut)} .rwsg-hint i{width:7px;height:7px;border-radius:50%;background:#FF3E88;animation:rw-blink 1.4s ease-in-out infinite}
/* tablet */
.rwsg.is-tab .rwsg-head{grid-template-columns:1fr;align-items:start} .rwsg.is-tab .rwsg-hr{justify-self:start;max-width:560px}
.rwsg.is-tab .rwsg-grid{--off:90px;gap:20px 16px} .rwsg.is-tab .rwsg-stage{height:330px} .rwsg.is-tab .rwsg-tx{padding:22px 10px 8px}
.rwsg.is-tab .rwsg-bars{display:none} .rwsg.is-tab .rwsg-tt{flex-direction:column;gap:10px} .rwsg.is-tab .rwsg-short{font-size:18px}
/* phone */
.rwsg.is-ph{padding:64px 0 88px}
.rwsg.is-ph .rwsg-head{grid-template-columns:1fr;gap:24px;margin-bottom:36px} .rwsg.is-ph .rwsg-hr{justify-self:stretch;max-width:none} .rwsg.is-ph .rwsg-hr p{font-size:16px}
.rwsg.is-ph .rwsg-grid{grid-template-columns:1fr;--off:0px;gap:16px} .rwsg.is-ph .rwsg-card{border-radius:24px;padding:8px} .rwsg.is-ph .rwsg-stage{height:320px;border-radius:18px}
.rwsg.is-ph .rwsg-tx{padding:20px 10px 8px} .rwsg.is-ph .rwsg-tt{flex-direction:column;gap:10px} .rwsg.is-ph .rwsg-tt h2{font-size:38px} .rwsg.is-ph .rwsg-short{font-size:18px} .rwsg.is-ph .rwsg-body{font-size:15.5px}
.rwsg.is-ph .rwsg-foot .rw-btn{width:100%} .rwsg.is-ph .rwsg-st em{display:none}
.rwsg.is-ph .rwsg-card:hover{transform:none}
/* ================= mini UIs (shared with the homepage channel switcher, own prefix) ================= */
/* ================= mini UIs ================= */
.rwsg-ui{position:absolute;inset:0;display:flex;flex-direction:column;gap:12px;padding:20px;color:var(--rw-ink);font-size:12px}
.rwsg-av{display:inline-block;flex:none;width:22px;height:22px;border-radius:50%;background:conic-gradient(from 200deg,var(--rw-brass),#FF3E88,var(--rw-brass))}
.rwsg-toast{position:absolute;display:inline-flex;align-items:center;gap:8px;margin:0;padding:8px 13px 8px 9px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);font-size:11.5px;white-space:nowrap;box-shadow:0 14px 30px -12px rgba(0,0,0,.45),0 0 0 1px color-mix(in srgb,var(--rw-ink) 8%,transparent);opacity:0;scale:.6;translate:0 10px;transition:opacity .35s,scale .55s cubic-bezier(.34,1.56,.64,1),translate .55s cubic-bezier(.34,1.56,.64,1)}
.rwsg-toast i{width:18px;height:18px;border-radius:50%;background:var(--rw-brass);box-shadow:inset 0 0 0 5px var(--rw-brass),inset 0 0 0 9px var(--rw-ink)} .rwsg-toast::after{content:"";position:absolute;right:-2px;top:-2px;width:9px;height:9px;border-radius:50%;background:#FF3E88;box-shadow:0 0 0 2px var(--rw-cloud)}
.rwsg-toast.is-on{opacity:1;scale:1;translate:0 0}
/* seo */
.rwsg-q{display:flex;align-items:center;gap:10px;height:44px;padding:0 16px;border-radius:999px;background:var(--rw-cloud);box-shadow:0 1px 0 color-mix(in srgb,var(--rw-ink) 8%,transparent),0 10px 24px -16px rgba(0,0,0,.4);font-size:13.5px} .rwsg-q svg{width:16px;height:16px;flex:none;color:var(--rw-mut)} .rwsg-q span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .rwsg-q>i{width:3px;height:16px;border-radius:2px;background:var(--rw-ink);animation:rw-blink 1s steps(1) infinite}
.rwsg-meta{margin:0 4px;font-size:10.5px;letter-spacing:.04em;color:var(--mut)}
.rwsg-res{position:relative;flex:1;min-height:0}
.rwsg-r{position:absolute;left:0;right:0;height:calc(20% - 6px);display:flex;align-items:center;gap:11px;padding:0 12px;border-radius:12px;background:color-mix(in srgb,var(--rw-cloud) 55%,transparent);transition:top .6s cubic-bezier(.34,1.25,.64,1),background .4s,box-shadow .4s}
.rwsg-fav{width:22px;height:22px;flex:none;border-radius:50%;background:color-mix(in srgb,var(--rw-ink) 12%,transparent)}
.rwsg-rt{display:flex;flex-direction:column;gap:5px;flex:1;min-width:0} .rwsg-rt b{font-size:10.5px;font-weight:400;color:color-mix(in srgb,var(--rw-ink) 72%,transparent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .rwsg-rt em{display:block;height:6px;width:82%;border-radius:4px;background:color-mix(in srgb,var(--rw-ink) 16%,transparent)} .rwsg-rt em.rwsg-rt2{width:58%;height:5px;background:color-mix(in srgb,var(--rw-ink) 9%,transparent)}
.rwsg-rt strong{font-size:14px;line-height:1.1;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rwsg-r.is-me{z-index:2;background:var(--rw-cloud);box-shadow:0 0 0 1.5px var(--rw-ink),0 12px 26px -14px rgba(0,0,0,.55)} .rwsg-r.is-me .rwsg-fav{background:var(--rw-brass);box-shadow:inset 0 0 0 5px var(--rw-cloud),0 0 0 1px var(--rw-ink)} .rwsg-r.is-me .rwsg-rt b{color:var(--rw-ink)}
.rwsg-r.is-top{box-shadow:0 0 0 1.5px var(--rw-ink),0 0 0 6px color-mix(in srgb,var(--rw-brass) 70%,transparent),0 12px 26px -14px rgba(0,0,0,.55)}
.rwsg-rank{flex:none;padding:4px 9px;border-radius:999px;background:var(--rw-ink);color:var(--rw-brass);font-size:12px}
.rwsg-seo .rwsg-toast{right:18px;bottom:18px}
/* social */
.rwsg-soc{align-items:center;justify-content:center;padding:18px}
.rwsg-phone{position:relative;display:flex;flex-direction:column;width:min(100%,270px);height:100%;max-height:470px;border-radius:30px;padding:10px;background:var(--rw-cloud);box-shadow:0 0 0 1px color-mix(in srgb,var(--rw-ink) 10%,transparent),0 30px 60px -30px rgba(0,0,0,.6)}
.rwsg-ph-h{display:flex;align-items:center;gap:8px;padding:4px 4px 10px;font-size:11.5px} .rwsg-ph-h b{margin-left:auto;font-weight:400;color:var(--rw-mut)}
.rwsg-ph{position:relative;flex:1;min-height:0;border-radius:18px;overflow:hidden;background:var(--rw-ink)} .rwsg-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.rwsg-float{position:absolute;right:18px;bottom:10px;width:24px;height:80px;pointer-events:none} .rwsg-float i{position:absolute;left:0;bottom:0;width:18px;height:18px;opacity:0;background:#FF3E88;clip-path:path('M9 16.5S1 11.8 1 6.3A3.9 3.9 0 0 1 9 4.6 3.9 3.9 0 0 1 17 6.3c0 5.5-8 10.2-8 10.2z')}
.rwsg-float.is-on i{animation:rwsg-fl 2.2s cubic-bezier(.2,.7,.3,1) infinite} .rwsg-float.is-on i:nth-child(2){animation-delay:.5s;left:8px} .rwsg-float.is-on i:nth-child(3){animation-delay:1.1s;left:-6px}
@keyframes rwsg-fl{0%{opacity:0;transform:translateY(0) scale(.5)}15%{opacity:1}100%{opacity:0;transform:translateY(-78px) scale(1.1) rotate(-12deg)}}
.rwsg-toast-s{left:10px;top:10px}
.rwsg-pb{display:flex;align-items:center;gap:12px;padding:10px 4px 4px} .rwsg-ic{width:21px;height:21px}
.rwsg-hrt{position:relative;display:grid;place-items:center;width:23px;height:23px;transition:color .3s} .rwsg-hrt svg{width:23px;height:23px}
.rwsg-hrt i{position:absolute;inset:-3px;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);opacity:0}
.rwsg-hrt.is-pop{color:#FF3E88} .rwsg-hrt.is-pop svg{animation:rwsg-hp .6s cubic-bezier(.34,1.56,.64,1)} .rwsg-hrt.is-pop i{animation:rwsg-ping 1s cubic-bezier(.2,.6,.3,1)}
@keyframes rwsg-hp{0%{scale:1}45%{scale:1.45}100%{scale:1}}
.rwsg-likes{margin:4px 4px 0;font-size:15px;letter-spacing:-.02em;font-weight:700;font-variant-numeric:tabular-nums}
.rwsg-cap{margin:2px 4px 4px;font-size:12px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .rwsg-cap b{font-weight:600}
/* ads */
.rwsg-ad{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 88px;grid-template-rows:auto 1fr auto;gap:8px 14px;padding:16px;border-radius:16px;background:var(--rw-ink);color:var(--rw-cloud)}
.rwsg-spon{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:color-mix(in srgb,var(--rw-cloud) 62%,transparent)} .rwsg-spon .rwsg-av{width:18px;height:18px}
.rwsg-ad b{grid-column:1;font-size:19px;line-height:1.08;letter-spacing:-.03em;font-weight:700}
.rwsg-adimg{grid-column:2;grid-row:1/4;border-radius:12px;background:radial-gradient(circle at 35% 30%,var(--rw-brass),color-mix(in srgb,var(--rw-brass) 30%,var(--rw-ink)) 70%);overflow:hidden;position:relative} .rwsg-adimg i{position:absolute;left:50%;top:56%;width:46px;height:46px;border-radius:50%;translate:-50% -50%;background:var(--rw-cloud);box-shadow:0 0 0 10px color-mix(in srgb,var(--rw-cloud) 26%,transparent)}
.rwsg-adbtn{grid-column:1;justify-self:start;padding:7px 12px;border-radius:999px;background:var(--rw-brass);color:var(--rw-ink);font-size:11px}
.rwsg-gs{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rwsg-g{position:relative;display:flex;flex-direction:column;align-items:center;padding:12px 10px 10px;border-radius:14px;background:var(--rw-cloud)} .rwsg-g svg{width:100%;max-width:140px;height:auto;overflow:visible}
.rwsg-g0,.rwsg-g1{fill:none;stroke-width:11;stroke-linecap:round} .rwsg-g0{stroke:color-mix(in srgb,var(--rw-ink) 9%,transparent)} .rwsg-g1{stroke:var(--rw-brass);stroke-dasharray:1 1;filter:drop-shadow(0 0 .6px var(--rw-ink))}
.rwsg-g b{margin-top:-30px;font-size:24px;line-height:1;letter-spacing:-.03em;font-weight:700;font-variant-numeric:tabular-nums} .rwsg-g small{margin-top:5px;font-size:10px;letter-spacing:.14em;color:var(--rw-mut)}
.rwsg-bars{flex:1;min-height:30px;display:flex;align-items:flex-end;gap:6px;padding:0 4px} .rwsg-bars i{flex:1;border-radius:5px 5px 2px 2px;background:color-mix(in srgb,var(--pfg) 11%,transparent);transform-origin:bottom} .rwsg-bars i:last-child{background:var(--rw-brass);box-shadow:inset 0 0 0 1px var(--rw-ink)}
.rwsg-bars.is-run i{animation:rwsg-bar .9s cubic-bezier(.2,.8,.2,1) backwards} @keyframes rwsg-bar{from{transform:scaleY(0)}}
/* content */
.rwsg-cnt{padding:18px}
.rwsg-art{position:relative;flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:12px;padding:22px;border-radius:16px;background:var(--rw-cloud);box-shadow:0 20px 40px -26px rgba(0,0,0,.5)}
.rwsg-kick{align-self:flex-start;padding:5px 10px;border-radius:999px;background:var(--rw-brass);font-size:10px;letter-spacing:.1em;text-transform:uppercase}
.rwsg-type{min-height:3.3em;font-size:26px;line-height:1.08;letter-spacing:-.035em;font-weight:700} .rwsg-type i{display:inline-block;width:3px;height:.9em;margin-left:3px;vertical-align:-.08em;background:var(--rw-ink);animation:rw-blink 1s steps(1) infinite} .rwsg-type i.is-typing{animation:none}
.rwsg-by{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--rw-mut)}
.rwsg-lines{display:flex;flex-direction:column;gap:8px;flex:1;min-height:0;overflow:hidden} .rwsg-lines i{flex:none;height:6px;border-radius:4px;background:color-mix(in srgb,var(--rw-ink) 10%,transparent)} .rwsg-lines i:nth-child(3n+2){width:92%} .rwsg-lines i:nth-child(3n){width:70%}
.rwsg-prog{height:4px;border-radius:4px;background:color-mix(in srgb,var(--rw-ink) 8%,transparent);overflow:hidden} .rwsg-prog i{display:block;height:100%;background:var(--rw-ink);transform-origin:left}
.rwsg-reads{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--rw-ink);font-variant-numeric:tabular-nums} .rwsg-reads em{width:7px;height:7px;border-radius:50%;background:#FF3E88}
/* web */
.rwsg-web{padding:18px}
.rwsg-br{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;border-radius:14px;overflow:hidden;background:var(--rw-cloud);box-shadow:0 24px 44px -26px rgba(0,0,0,.55),0 0 0 1px color-mix(in srgb,var(--rw-ink) 8%,transparent)}
.rwsg-chrome{display:flex;align-items:center;gap:6px;height:34px;flex:none;padding:0 12px;border-bottom:1px solid var(--rw-fog)} .rwsg-chrome>i{width:8px;height:8px;border-radius:50%;background:var(--rw-fog)} .rwsg-chrome>i:first-child{background:#FF3E88} .rwsg-chrome span{margin-left:8px;flex:1;padding:4px 12px;border-radius:999px;background:var(--rw-bone);font-size:10.5px;color:var(--rw-mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rwsg-vp{position:relative;flex:1;min-height:0;overflow:hidden}
.rwsg-page{display:flex;flex-direction:column;gap:14px;padding:16px;animation:rwsg-scroll 8s cubic-bezier(.65,0,.35,1) infinite}
@keyframes rwsg-scroll{0%,14%{transform:translateY(0)}46%,62%{transform:translateY(-46%)}90%,100%{transform:translateY(0)}}
.rwsg-pg-nav{display:flex;gap:8px;align-items:center} .rwsg-pg-nav i{height:6px;width:28px;border-radius:4px;background:color-mix(in srgb,var(--rw-ink) 14%,transparent)} .rwsg-pg-nav i:first-child{width:18px;height:18px;border-radius:50%;background:var(--rw-brass);box-shadow:inset 0 0 0 1px var(--rw-ink);margin-right:auto}
.rwsg-pg-h{display:flex;flex-direction:column;gap:7px} .rwsg-pg-h i{height:16px;width:88%;border-radius:5px;background:var(--rw-ink)} .rwsg-pg-h i+i{width:64%} .rwsg-pg-h i+i+i{width:40%}
.rwsg-pg-b{align-self:flex-start;width:108px;height:30px;flex:none;border-radius:999px;background:var(--rw-brass);box-shadow:inset 0 0 0 1px var(--rw-ink)}
.rwsg-pg-img{height:120px;flex:none;border-radius:12px;background:linear-gradient(135deg,var(--rw-ink),color-mix(in srgb,var(--rw-ink) 60%,var(--rw-brass)))}
.rwsg-pg-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px} .rwsg-pg-row i{height:64px;border-radius:10px;background:var(--rw-bone)} .rwsg-pg-row:has(i:nth-child(2):last-child){grid-template-columns:1fr 1fr}
.rwsg-pg-q{height:70px;flex:none;border-radius:12px;background:color-mix(in srgb,var(--rw-brass) 40%,var(--rw-cloud))}
.rwsg-cur{position:absolute;left:62%;top:58%;width:18px;height:18px;border-radius:50%;background:var(--rw-ink);box-shadow:0 0 0 3px var(--rw-cloud);animation:rwsg-cur 8s cubic-bezier(.65,0,.35,1) infinite}
@keyframes rwsg-cur{0%,10%{transform:translate(0,0)}22%{transform:translate(-90px,-60px) scale(.8)}26%{transform:translate(-90px,-60px) scale(1.1)}40%,100%{transform:translate(0,0)}}
.rwsg-conv{position:absolute;right:12px;bottom:12px;display:inline-flex;align-items:center;padding:7px 11px;border-radius:999px;background:var(--rw-ink);color:var(--rw-brass);font-size:11px}
/* brand */
.rwsg-brd{justify-content:space-between;padding:24px}
.rwsg-logo{display:flex;align-items:center;gap:12px} .rwsg-logo b{font-size:38px;letter-spacing:-.055em;font-weight:800;line-height:1}
.rwsg-sw{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;perspective:500px}
.rwsg-s{position:relative;height:86px;transform-style:preserve-3d;animation:rwsg-flip 4.4s cubic-bezier(.7,0,.2,1) infinite}
.rwsg-s i{position:absolute;inset:0;display:flex;align-items:flex-end;padding:8px;border-radius:12px;backface-visibility:hidden;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 14%,transparent)} .rwsg-s i+i{transform:rotateY(180deg)} .rwsg-s small{font-size:9px;letter-spacing:.06em;mix-blend-mode:difference;color:#fff}
.rwsg-s0 i:first-child{background:var(--rw-ink)} .rwsg-s0 i+i{background:#1F3A2E} .rwsg-s1 i:first-child{background:var(--rw-brass)} .rwsg-s1 i+i{background:#FF8A3D} .rwsg-s2 i:first-child{background:#FF3E88} .rwsg-s2 i+i{background:#F2E6D3} .rwsg-s3 i:first-child{background:var(--rw-cloud)} .rwsg-s3 i+i{background:#2F5BFF}
@keyframes rwsg-flip{0%,35%{transform:rotateY(0)}50%,85%{transform:rotateY(180deg)}100%{transform:rotateY(360deg)}}
.rwsg-spec{display:flex;align-items:center;gap:16px;font-size:10.5px;line-height:1.5;letter-spacing:.1em;text-transform:uppercase;color:var(--rw-ink)} .rwsg-spec span:first-child{font-size:64px;line-height:1;letter-spacing:-.05em;text-transform:none;font-weight:700}
.rwsg-apps{display:flex;gap:10px;align-items:center} .rwsg-apps i{display:grid;place-items:center;height:44px;border-radius:12px;font-style:normal}
.rwsg-app1{width:44px;background:var(--rw-ink)} .rwsg-app2{padding:0 16px;background:var(--rw-brass);color:var(--rw-ink);font-size:15px;font-weight:700;letter-spacing:-.03em;border-radius:999px!important} .rwsg-app3{flex:1;background:repeating-linear-gradient(90deg,#FF3E88 0 12px,var(--rw-ink) 12px 24px);opacity:.9}
.rwsg.is-fin .rwsg-s,.rwsg.is-fin .rwsg-page,.rwsg.is-fin .rwsg-cur,.rwsg.is-fin .rwsg-float i{animation:none!important}
.rwsg.is-ph .rwsg-ui{padding:14px} .rwsg.is-ph .rwsg-bars{display:none} .rwsg.is-ph .rwsg-type{font-size:21px} .rwsg.is-ph .rwsg-s{height:64px} .rwsg.is-ph .rwsg-spec span:first-child{font-size:46px} .rwsg.is-ph .rwsg-logo b{font-size:30px} .rwsg.is-ph .rwsg-brd{padding:16px} .rwsg.is-ph .rwsg-apps{display:none}
.rwsg.is-ph .rwsg-ad b{font-size:16px} .rwsg.is-ph .rwsg-g b{font-size:20px;margin-top:-26px}
.rwsg.is-ph .rwsg-stage>.rwsg-ui{padding-top:52px}
.rwsg-card:hover .rwsg-page,.rwsg-card:hover .rwsg-cur{animation-duration:4s} .rwsg-card:hover .rwsg-s{animation-duration:2.2s}
@media (prefers-reduced-motion:reduce){.rwsg-s,.rwsg-page,.rwsg-cur,.rwsg-float i{animation:none!important}}
`
addPropertyControls(RwServiceGrid, {
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "(01) All channels" },
  heading: { type: ControlType.String, title: "Heading", description: "| = line break, *word* = lime marker", defaultValue: "Pick one channel,|or *all six*." },
  intro: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "Every channel below is run by a senior specialist, reported in one dashboard and billed as one monthly retainer. Mix them as you grow." },
  button: { type: ControlType.String, title: "Button", defaultValue: "Book a call" },
  buttonLink: { type: ControlType.Link, title: "Button link", description: "Empty = Booking Link on the Site CMS row" },
  fromLabel: { type: ControlType.String, title: "Price label", defaultValue: "From" },
  exploreLabel: { type: ControlType.String, title: "Card button", defaultValue: "Explore" },
  liveLabel: { type: ControlType.String, title: "Live label", defaultValue: "Live" },
  waitLabel: { type: ControlType.String, title: "Waiting label", defaultValue: "Waiting for signal" },
  replayLabel: { type: ControlType.String, title: "Hint", defaultValue: "Hover a card to replay it" },
  includesCount: { type: ControlType.Number, title: "Includes shown", min: 0, max: 6, step: 1, displayStepper: true, defaultValue: 3 },
  seoQuery: { type: ControlType.String, title: "SEO search", defaultValue: "dentist near me" },
  socialHandle: { type: ControlType.String, title: "Social handle", defaultValue: "@kinfolk.coffee" },
  socialPhoto: { type: ControlType.ResponsiveImage, title: "Social photo" },
  adsHeadline: { type: ControlType.String, title: "Ad headline", defaultValue: "Free whitening with every new-patient visit" },
  articleTitle: { type: ControlType.String, title: "Article title", defaultValue: "How to rank #1 for “near me” searches" },
  webUrl: { type: ControlType.String, title: "Web address", defaultValue: "yoursite.com/offer" },
  brandName: { type: ControlType.String, title: "Brand name", defaultValue: "Kinfolk" },
})
