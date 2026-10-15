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
const SW_BUILD = "RwServices@cms1"
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

// ===== RwServices =====
interface ServicesProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  eyebrow: string; heading: string; intro: string; button: string; buttonLink: string; fromLabel: string; exploreLabel: string; includesLabel: string; hint: string
  seoQuery: string; socialHandle: string; socialPhoto: any; adsHeadline: string; articleTitle: string; webUrl: string; brandName: string; style?: CSSProperties
}
// ---- THE CHANNEL SWITCHER: six tall panels side by side, one per service. A collapsed panel is a spine (number, the title set vertically, a "+");
// the open one fills the row with a LIVE mini-UI of that channel (search rank climbing, a post collecting likes, ad gauges ticking, an article typing,
// a landing page scrolling, a brand system flipping) + the offer. The OPEN panel follows scroll across the section; hover / click / keys take over for 4 s.
// Tablet / phone: the same six as a vertical accordion; one row open at a time and the open slot has a FIXED height, so the page length never changes. ----
const SV_PHOTO = "https://framerusercontent.com/images/xbfdpTvZzzafiJOwtXCs0luyp2I.webp"
const SV_TONES = ["fog", "ink", "cloud", "lime", "pine", "bone"]
const SV_DARK = new Set(["ink", "pine"])
// step counter: 0 → n over time while `run`, else the final step at once
function useSvStep(n: number, ms: number, run: boolean, delay = 350) {
  const [s, setS] = useState(run ? 0 : n)
  useEffect(() => { if (!run) { setS(n); return } setS(0); let k = 0, iv = 0; const t = window.setTimeout(() => { iv = window.setInterval(() => { k++; setS(k); if (k >= n) window.clearInterval(iv) }, ms) }, delay); return () => { window.clearTimeout(t); window.clearInterval(iv) } }, [run, n, ms])
  return s
}
// eased count a → b while `run` (final value at once otherwise)
function useSvCount(a: number, b: number, dur: number, run: boolean, delay = 300) {
  const [v, setV] = useState(run ? a : b)
  useEffect(() => { if (!run) { setV(b); return } setV(a); let raf = 0; const t0 = performance.now() + delay; const f = (t: number) => { const p = clamp01((t - t0) / dur); setV(a + (b - a) * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(f) }; raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf) }, [run, a, b, dur])
  return v
}
const SvHeart = () => (<svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 20.5S3.5 15.4 3.5 9.4A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8.5 2.1c0 6-8.5 11.1-8.5 11.1z" /></svg>)
const SvMark = ({ s = 26 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 32 32" aria-hidden><circle cx="16" cy="16" r="15" fill="var(--rw-brass)" /><circle cx="16" cy="16" r="3.4" fill="var(--rw-ink)" /><path d="M10.2 21.8a8.2 8.2 0 0 1 0-11.6M21.8 10.2a8.2 8.2 0 0 1 0 11.6" fill="none" stroke="var(--rw-ink)" strokeWidth="2.4" strokeLinecap="round" /></svg>)
type SvCfg = { seoQuery: string; socialHandle: string; photo: string; adsHeadline: string; articleTitle: string; webUrl: string; brandName: string }
type SvP = { run: boolean; cfg: SvCfg; M: CSSProperties; D: CSSProperties }
const SvUI = ({ kind, ...p }: SvP & { kind: string }) => { const k = String(kind || "").toLowerCase(); const C = k === "seo" ? SvSeo : k === "social" ? SvSoc : k === "ads" ? SvAds : k === "content" ? SvCnt : k === "web" ? SvWeb : SvBrd; return <C {...p} /> }
// SEO: our result climbs from #5 to #1
const SvSeo = ({ run, cfg, M, D }: SvP) => { const st = useSvStep(4, 640, run, 420); const ours = 4 - st; const others = ["citydentalcare.com", "yelp.com › dentists", "smilecentre.co", "healthgrades.com"]
  return (<div className="rwsv-ui rwsv-seo">
    <div className="rwsv-q" style={M}><svg viewBox="0 0 24 24" aria-hidden><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M15 15l5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg><span>{cfg.seoQuery}</span><i /></div>
    <p className="rwsv-meta" style={M}>About 2,140,000 results · 0.42 s</p>
    <div className="rwsv-res">{[0, 1, 2, 3, 4].map((i) => { const me = i === 4; const slot = me ? ours : (i < ours ? i : i + 1); return (
      <div key={i} className={`rwsv-r${me ? " is-me" : ""}${me && ours === 0 ? " is-top" : ""}`} style={{ top: `${Math.min(4, slot) * 20}%` }}>
        <i className="rwsv-fav" /><span className="rwsv-rt"><b style={M}>{me ? "yoursite.com" : others[i]}</b>{me ? <strong style={D}>Your brand · {cfg.seoQuery}</strong> : <em />}<em className="rwsv-rt2" /></span>
        {me && <span className="rwsv-rank" style={M}>#{ours + 1}</span>}
      </div>) })}</div>
    <p className={`rwsv-toast${ours === 0 ? " is-on" : ""}`} style={M}><i />Position 1 · clicks +212%</p>
  </div>) }
// Social: a post collecting likes, heart pops, hearts float up
const SvSoc = ({ run, cfg, M, D }: SvP) => { const likes = useSvCount(1184, 1312, 2200, run, 500); const pop = useSvStep(1, 400, run, 700)
  return (<div className="rwsv-ui rwsv-soc"><div className="rwsv-phone">
    <div className="rwsv-ph-h"><i className="rwsv-av" /><span style={M}>{cfg.socialHandle}</span><b style={M}>···</b></div>
    <div className="rwsv-ph"><img {...RS(cfg.photo, "360px")} alt="" loading="lazy" decoding="async" draggable={false} />
      <span className={`rwsv-float${pop ? " is-on" : ""}`} aria-hidden><i /><i /><i /></span>
      <span className={`rwsv-toast rwsv-toast-s${pop ? " is-on" : ""}`} style={M}><i />+128 likes in 1 h</span></div>
    <div className="rwsv-pb"><span className={`rwsv-hrt${pop ? " is-pop" : ""}`}><SvHeart /><i /></span><svg className="rwsv-ic" viewBox="0 0 24 24" aria-hidden><path d="M4 12a8 8 0 1 1 3.3 6.5L4 20l1.2-3.6A8 8 0 0 1 4 12z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg><svg className="rwsv-ic" viewBox="0 0 24 24" aria-hidden><path d="M21 4L10 14M21 4l-7 17-4-7-7-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg></div>
    <p className="rwsv-likes" style={D}>{Math.round(likes).toLocaleString("en-US")} likes</p>
    <p className="rwsv-cap"><b>{cfg.socialHandle.replace(/^@/, "")}</b> Monday mornings, sorted ☕</p>
  </div></div>) }
// Ads: an ad card + two gauges ticking + revenue bars growing
const SvGauge = ({ v, max, label, text, M, D }: { v: number; max: number; label: string; text: string; M: CSSProperties; D: CSSProperties }) => { const f = clamp01(v / max)
  return (<span className="rwsv-g"><svg viewBox="0 0 120 70" aria-hidden><path d="M10 62a50 50 0 0 1 100 0" className="rwsv-g0" pathLength={1} /><path d="M10 62a50 50 0 0 1 100 0" className="rwsv-g1" pathLength={1} style={{ strokeDashoffset: 1 - f }} /></svg><b style={D}>{text}</b><small style={M}>{label}</small></span>) }
const SvAds = ({ run, cfg, M, D }: SvP) => { const ctr = useSvCount(0.9, 4.8, 1900, run); const roas = useSvCount(1.4, 6.2, 2100, run, 450); const bars = [0.28, 0.36, 0.34, 0.5, 0.58, 0.74, 0.96]
  return (<div className="rwsv-ui rwsv-ads">
    <div className="rwsv-ad"><span className="rwsv-spon" style={M}><i className="rwsv-av" />Sponsored</span><b style={D}>{cfg.adsHeadline}</b><span className="rwsv-adimg" aria-hidden><i /></span><span className="rwsv-adbtn" style={M}>Book now</span></div>
    <div className="rwsv-gs"><SvGauge v={ctr} max={6} label="CTR" text={`${ctr.toFixed(1)}%`} M={M} D={D} /><SvGauge v={roas} max={8} label="ROAS" text={`${roas.toFixed(1)}×`} M={M} D={D} /></div>
    <span className={`rwsv-bars${run ? " is-run" : ""}`} aria-hidden>{bars.map((h, i) => <i key={i} style={{ height: `${h * 100}%`, animationDelay: `${0.3 + i * 0.09}s` }} />)}</span>
  </div>) }
// Content: an article typing itself, the read counter climbing
const SvCnt = ({ run, cfg, M, D }: SvP) => { const full = cfg.articleTitle; const n = useSvStep(full.length, 40, run, 350); const reads = useSvCount(0, 2410, 2600, run, 600)
  return (<div className="rwsv-ui rwsv-cnt"><div className="rwsv-art">
    <span className="rwsv-kick" style={M}>Guide · 6 min read</span>
    <b className="rwsv-type" style={D}>{full.slice(0, n)}<i className={n < full.length ? "is-typing" : ""} /></b>
    <span className="rwsv-by" style={M}><i className="rwsv-av" />Reachwise editorial</span>
    <span className="rwsv-lines" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} />)}</span>
    <span className="rwsv-prog" aria-hidden><i style={{ transform: `scaleX(${(reads / 2410).toFixed(3)})` }} /></span>
    <span className="rwsv-reads" style={M}><em />{Math.round(reads).toLocaleString("en-US")} reads this week</span>
  </div></div>) }
// Web: a browser whose landing page scrolls, a cursor clicks the CTA
const SvWeb = ({ cfg, M }: SvP) => (<div className="rwsv-ui rwsv-web"><div className="rwsv-br">
    <div className="rwsv-chrome"><i /><i /><i /><span style={M}>{cfg.webUrl}</span></div>
    <div className="rwsv-vp"><div className="rwsv-page">
      <span className="rwsv-pg-nav"><i /><i /><i /><i /></span>
      <span className="rwsv-pg-h"><i /><i /><i /></span><span className="rwsv-pg-b" />
      <span className="rwsv-pg-img" /><span className="rwsv-pg-row"><i /><i /><i /></span>
      <span className="rwsv-pg-h"><i /><i /></span><span className="rwsv-pg-q" /><span className="rwsv-pg-row"><i /><i /></span><span className="rwsv-pg-b" />
    </div><i className="rwsv-cur" aria-hidden /></div>
    <span className="rwsv-conv" style={M}>Conversion 4.1% ▲</span>
  </div></div>)
// Brand: the logo, four swatches flipping to a second palette, the type
const SvBrd = ({ cfg, M, D }: SvP) => (<div className="rwsv-ui rwsv-brd">
    <div className="rwsv-logo"><SvMark s={44} /><b style={D}>{cfg.brandName}</b></div>
    <div className="rwsv-sw">{["#0D0E10", "#D4FF3A", "#FF3E88", "#FFFFFF"].map((hx, i) => <span key={i} className={`rwsv-s rwsv-s${i}`} style={{ animationDelay: `${i * 0.16}s` }}><i><small style={M}>{hx}</small></i><i><small style={M}>{["#1F3A2E", "#FF8A3D", "#F2E6D3", "#2F5BFF"][i]}</small></i></span>)}</div>
    <div className="rwsv-spec"><span style={D}>Aa</span><span style={M}>Display · Sans · Mono<br />Guidelines v1.0</span></div>
    <div className="rwsv-apps" aria-hidden><i className="rwsv-app1"><SvMark s={22} /></i><i className="rwsv-app2" style={D}>{cfg.brandName}</i><i className="rwsv-app3" /></div>
  </div>)
export default function RwServices(props: ServicesProps) {
  const { eyebrow = "(02) Services", heading = "Six channels.|*One* growth plan.", intro = "SEO, social, ads, content, web and brand under one retainer, one team and one monthly report.", button = "All services", buttonLink = "/services",
    fromLabel = "From", exploreLabel = "Explore", includesLabel = "What's included", hint = "Scroll to switch channels, or pick one",
    seoQuery = "dentist near me", socialHandle = "@kinfolk.coffee", socialPhoto, adsHeadline = "Free whitening with every new-patient visit", articleTitle = "How to rank #1 for “near me” searches",
    webUrl = "yoursite.com/offer", brandName = "Kinfolk", bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill()
  const rows = useCMS("services", SEED.services || []); const n = rows.length
  const root = useRef<HTMLElement>(null); const acc = useRef<HTMLDivElement>(null)
  const { w } = useSize(root, bpHint); const phone = w < 810, tab = w >= 810 && w < 1100, horiz = w >= 1240
  const on = useOn(root, live, rm)
  useScrollVars(root, live, rm)
  useMagnet(root, live)
  const final = still || rm || !live
  const [act, setAct0] = useState(0); const actR = useRef(0); const [prev, setPrev] = useState(-1)
  const setAct = (i: number) => { if (i === actR.current || i < 0 || i >= n) return; setPrev(actR.current); actR.current = i; setAct0(i) }
  const hold = useRef(0) // performance.now() until which the visitor's pick holds (Infinity while hovering)
  const hovT = useRef(0)
  const cfg: SvCfg = { seoQuery, socialHandle, photo: srcOf(socialPhoto, SV_PHOTO), adsHeadline, articleTitle, webUrl, brandName }
  useEffect(() => { if (actR.current >= n && n > 0) { actR.current = 0; setAct0(0) } }, [n])
  // ---- geometry: the open panel's content is laid out at its FINAL width (no reflow while it grows); the vertical open slot = tallest content ----
  useLayoutEffect(() => {
    const A = acc.current; if (!A) return
    const m = () => { if (horiz) { const cw = parseFloat(getComputedStyle(A).getPropertyValue("--cw")) || 92; const gap = 8; A.style.setProperty("--ow", `${Math.max(320, A.clientWidth - (n - 1) * (cw + gap) - cw)}px`) }
      else { let mx = 0; A.querySelectorAll<HTMLElement>(".rwsv-pin").forEach((el) => { mx = Math.max(mx, el.scrollHeight) }); if (mx > 0) A.style.setProperty("--oh", `${Math.ceil(mx)}px`) } }
    m(); const ro = new ResizeObserver(m); ro.observe(A); A.querySelectorAll(".rwsv-pin").forEach((el) => ro.observe(el)); return () => ro.disconnect()
  }, [horiz, n, w])
  // ---- the scroll walk: the accordion's pass through the viewport is split into n segments; entering a new segment opens that channel (unless a pick holds) ----
  useEffect(() => {
    if (final || !acc.current || n < 2) return
    const A = acc.current; let top = 0, h = 1, vh = 1, fresh = false, vis = true, lastIdx = -1, lastP = -1
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting }, { rootMargin: "20% 0px 20% 0px" }); io.observe(A)
    const read = () => { if (!vis) { fresh = false; return } const r = A.getBoundingClientRect(); top = r.top; h = r.height; vh = window.innerHeight || 1; fresh = true }
    const off = onTick(() => { if (!fresh) return
      const p = clamp01((vh * 0.72 - top) / (h + vh * 0.54)); if (Math.abs(p - lastP) > 0.002) { lastP = p; A.style.setProperty("--ap", p.toFixed(3)) }
      const idx = Math.min(n - 1, Math.floor(p * n))
      if (idx !== lastIdx) { lastIdx = idx; if (performance.now() > hold.current) setAct(idx) } }, read)
    return () => { off(); io.disconnect() }
  }, [final, n])
  // a keyboard visitor's pick holds until the pointer takes over again (the scroll walk must not re-open panels under their focus)
  const kb = useRef(false)
  const pickHold = (i: number, ms = 4000) => { hold.current = kb.current ? Infinity : performance.now() + ms; setAct(i) }
  const onKey = (e: any, i: number) => { const k = e.key; let j = -1
    if (k === "ArrowRight" || k === "ArrowDown") j = (i + 1) % n; else if (k === "ArrowLeft" || k === "ArrowUp") j = (i - 1 + n) % n; else if (k === "Home") j = 0; else if (k === "End") j = n - 1
    if (j < 0) return; e.preventDefault(); pickHold(j); const b = acc.current?.querySelectorAll<HTMLElement>(".rwsv-sp")[j]; b?.focus() }
  const fine = useRef(false); useEffect(() => { if (live) fine.current = window.matchMedia("(hover:hover) and (pointer:fine)").matches }, [live])
  // hover takes over only on REAL pointer movement (content scrolling under a still pointer fires enter events too — that must not freeze the scroll walk)
  const hovI = useRef(-1)
  const moveOn = (e: any, i: number) => { if (!fine.current || !horiz || (!e.movementX && !e.movementY)) return; kb.current = false; hold.current = performance.now() + 4000; if (i === actR.current) { hovI.current = i; window.clearTimeout(hovT.current); return } if (hovI.current === i) return; hovI.current = i; window.clearTimeout(hovT.current); hovT.current = window.setTimeout(() => { if (hovI.current === i) setAct(i) }, 140) }
  const leaveAcc = () => { window.clearTimeout(hovT.current); hovI.current = -1 }
  // closed panels are inert (their Explore link can't take focus)
  useEffect(() => { const A = acc.current; if (!A) return; A.querySelectorAll<HTMLElement>(".rwsv-pc").forEach((el, i) => { (el as any).inert = i !== act }) }, [act, n, horiz])
  const mode = horiz ? "is-h" : "is-v"
  return (
    <section ref={root as any} className={`rw rw-sec rwsv ${mode}${phone ? " is-ph" : tab ? " is-tab" : ""}${on ? " is-on" : ""}${final ? " is-fin" : ""}`} style={{ ...cssVars(c), ...B, ...(props.style || {}) }}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_MOTION + CSS_SV + siteFontCss(props) }} />
      <div className="rw-wrap">
        <header className="rwsv-head">
          <div className="rwsv-hl"><Eyebrow text={eyebrow} on={on} M={M} /><Head text={heading} on={on} D={D} size={phone ? "clamp(40px,11vw,48px)" : "clamp(40px,4.6vw,68px)"} lh={0.95} delay={80} /></div>
          <div className="rwsv-hr" style={rise(on, 300, 14)}>{intro && <p>{intro}</p>}{button && <Btn href={buttonLink || "/services"} label={button} kind="ghost" />}</div>
        </header>
        {n > 0 && (
          <div ref={acc} className="rwsv-acc" style={rise(on, 380, 28)} onPointerLeave={leaveAcc}>
            {rows.map((r, i) => { const open = i === act; const tone = SV_TONES[i % SV_TONES.length]; const dk = SV_DARK.has(tone); const inc = listOf(r.f5); const id = `rwsv-${r.slug || i}`; const showUI = open || i === prev || still
              return (
                <div key={r.slug || i} className={`rwsv-p t-${tone}${dk ? " is-dk" : ""}${open ? " is-open" : ""}`} onPointerMove={(e) => moveOn(e, i)}>
                  <button type="button" className="rwsv-sp" id={`${id}-b`} aria-expanded={open} aria-controls={`${id}-c`} onClick={() => pickHold(i)} onKeyDown={(e) => onKey(e, i)} onFocus={(e) => { if ((e.target as HTMLElement).matches(":focus-visible")) { kb.current = true; hold.current = Infinity } }}>
                    <span className="rwsv-num" style={M}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="rwsv-vt" style={D}>{r.f1}</span>
                    {!horiz && <span className="rwsv-rs">{r.f2}</span>}
                    <span className="rwsv-plus" aria-hidden><i /><i /></span>
                  </button>
                  <div className="rwsv-pc" id={`${id}-c`} role="region" aria-labelledby={`${id}-b`}>
                    <div className="rwsv-pin">
                      <div className="rwsv-stage">{showUI && <SvUI key={open ? `o${act}` : `c${i}`} kind={r.f6} run={open && on && !final} cfg={cfg} M={M} D={D} />}</div>
                      <div className="rwsv-tx">
                        {horiz && <h3 className="rwsv-tt" style={D}>{r.f1}</h3>}
                        {r.f3 && <p className="rwsv-body">{r.f3}</p>}
                        {inc.length > 0 && <div className="rwsv-inc"><p className="rwsv-il" style={M}>{includesLabel}</p><ul>{inc.map((x, j) => <li key={j}>{x}</li>)}</ul></div>}
                        <div className="rwsv-foot">
                          {r.f7 && <span className="rwsv-stat" style={M}><i />{r.f7}</span>}
                          {r.f4 && <span className="rwsv-pr" style={M}><small>{fromLabel}</small>{r.f4}</span>}
                          <Btn href={`/services/${r.slug || ""}`} label={exploreLabel} kind="solid" sub={r.f1} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>) })}
          </div>)}
        {n > 1 && (
          <div className="rwsv-rail" style={rise(on, 520, 10)} aria-hidden>
            <span className="rwsv-seg">{rows.map((r, i) => <i key={i} className={i === act ? "is-on" : i < act ? "is-past" : ""} />)}</span>
            <span className="rwsv-now" style={M}><b>{String(act + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</b>{rows[act] ? rows[act].f1 : ""}</span>
            {hint && <span className="rwsv-hint" style={M}><i />{hint}</span>}
          </div>)}
      </div>
    </section>
  )
}
const CSS_SV = `
.rwsv{background:var(--rw-bone);color:var(--rw-ink);padding:clamp(88px,9vw,150px) 0 clamp(96px,10vw,160px);overflow-x:clip}
.rwsv .rw-eb i{position:relative} .rwsv .rw-eb i::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 1.5px var(--rw-brass);animation:rwsv-ping 1.8s cubic-bezier(.2,.6,.3,1) infinite} @keyframes rwsv-ping{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.8)}}
/* headline accent = lime marker that wipes in */
.rwsv .rw-hd{font-weight:var(--rw-font-dw,700);letter-spacing:-.045em}
.rwsv .rw-it{position:relative;isolation:isolate;font-weight:inherit;color:var(--rw-ink);padding:0 .06em;margin:0 -.02em}
.rwsv .rw-it::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:.1em;bottom:.02em;border-radius:.14em;background:var(--rw-brass);transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.7,0,.2,1) var(--pd,.6s)}
.rwsv .rw-hd.is-on .rw-it::before{transform:none}
.rwsv-head{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:end;gap:40px;margin-bottom:clamp(44px,4.6vw,72px)}
.rwsv-hl{display:flex;flex-direction:column;gap:26px;align-items:flex-start}
.rwsv-hr{display:flex;flex-direction:column;align-items:flex-start;gap:24px;justify-self:end;max-width:400px} .rwsv-hr p{margin:0;font-size:17px;line-height:1.5;color:var(--rw-mut)}
/* ---- panels (both modes) ---- */
.rwsv-acc{position:relative;--cw:92px;--ease:cubic-bezier(.65,0,.25,1)}
.rwsv-p{position:relative;overflow:hidden;border-radius:22px;background:var(--pbg);color:var(--pfg);--pbg:var(--rw-fog);--pfg:var(--rw-ink);--line:color-mix(in srgb,var(--rw-ink) 14%,transparent);--mut:color-mix(in srgb,var(--rw-ink) 62%,transparent);--stg:color-mix(in srgb,var(--rw-ink) 6%,transparent);isolation:isolate}
.rwsv-p.t-cloud{--pbg:var(--rw-cloud);--stg:var(--rw-bone)}
.rwsv-p.t-lime{--pbg:color-mix(in srgb,var(--rw-brass) 58%,var(--rw-bone));--stg:color-mix(in srgb,var(--rw-cloud) 55%,transparent)}
.rwsv-p.t-bone{--pbg:var(--rw-bone);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 16%,transparent)}
.rwsv-p.t-ink{--pbg:var(--rw-ink)} .rwsv-p.t-pine{--pbg:var(--rw-pine)}
.rwsv-p.is-dk{--pfg:var(--rw-cloud);--line:color-mix(in srgb,var(--rw-cloud) 16%,transparent);--mut:color-mix(in srgb,var(--rw-cloud) 66%,transparent);--stg:color-mix(in srgb,var(--rw-cloud) 7%,transparent)}
.rwsv-sp{all:unset;box-sizing:border-box;position:absolute;z-index:3;cursor:pointer;color:inherit;-webkit-tap-highlight-color:transparent}
.rwsv-sp:focus-visible{outline-offset:-4px!important;box-shadow:none!important;border-radius:22px} .rwsv-p.is-dk .rwsv-sp:focus-visible{outline-color:var(--rw-cloud)!important}
.rwsv-num{display:inline-grid;place-items:center;min-width:42px;height:28px;padding:0 9px;border-radius:999px;font-size:11.5px;letter-spacing:.08em;box-shadow:inset 0 0 0 1px var(--line);transition:background .45s,color .45s,box-shadow .45s}
.rwsv-p.is-open .rwsv-num{background:var(--rw-brass);color:var(--rw-ink);box-shadow:none} .rwsv-p.t-lime.is-open .rwsv-num{background:var(--rw-ink);color:var(--rw-brass)}
.rwsv-vt{font-weight:var(--rw-font-dw,700);letter-spacing:-.04em;line-height:1;white-space:nowrap}
.rwsv-plus{position:relative;display:block;flex:none;width:40px;height:40px;border-radius:50%;box-shadow:inset 0 0 0 1px var(--line);transition:rotate .6s cubic-bezier(.34,1.56,.64,1),background .35s,box-shadow .35s}
.rwsv-plus i{position:absolute;left:50%;top:50%;width:13px;height:1.6px;border-radius:2px;background:currentColor;translate:-50% -50%} .rwsv-plus i+i{rotate:90deg;transition:scale .45s}
.rwsv-p.is-open .rwsv-plus{background:var(--rw-brass);color:var(--rw-ink);box-shadow:none} .rwsv-p.is-open .rwsv-plus i+i{scale:0 1} .rwsv-p.t-lime.is-open .rwsv-plus{background:var(--rw-ink);color:var(--rw-brass)}
.rwsv-p:not(.is-open) .rwsv-sp:hover .rwsv-plus{rotate:90deg;background:var(--pfg);color:var(--pbg);box-shadow:none}
.rwsv-stage{position:relative;overflow:hidden;border-radius:18px;background:var(--stg)}
.rwsv-tx{display:flex;flex-direction:column;align-items:flex-start;gap:18px;min-width:0}
.rwsv-tt{margin:0;font-size:48px;line-height:.98;letter-spacing:-.045em;font-weight:var(--rw-font-dw,700)}
.rwsv-body{margin:0;font-size:16.5px;line-height:1.5;max-width:40ch}
.rwsv-il{margin:0 0 10px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
.rwsv-inc ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px} .rwsv-inc li{position:relative;padding-left:27px;font-size:15px;line-height:1.35}
.rwsv-inc li::before{content:"";position:absolute;left:0;top:0;width:18px;height:18px;border-radius:50%;background:var(--rw-brass) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M6 12.5l4 4 8-9' fill='none' stroke='%230D0E10' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/></svg>") center/11px no-repeat}
.rwsv-p.t-lime .rwsv-inc li::before{background:var(--rw-ink) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M6 12.5l4 4 8-9' fill='none' stroke='%23D4FF3A' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/></svg>") center/11px no-repeat}
.rwsv-foot{display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;margin-top:auto;padding-top:6px}
.rwsv-stat{display:inline-flex;align-items:center;gap:8px;padding:8px 13px;border-radius:999px;background:var(--rw-brass);color:var(--rw-ink);font-size:12px;letter-spacing:.02em;font-weight:500} .rwsv-stat i{width:7px;height:7px;border-radius:50%;background:#FF3E88}
.rwsv-p.t-lime .rwsv-stat{background:var(--rw-ink);color:var(--rw-brass)}
.rwsv-pr{display:flex;flex-direction:column;gap:3px;font-size:14px} .rwsv-pr small{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
.rwsv-foot .rw-btn{--ring:var(--pbg)}
.rwsv-p.is-dk .rw-btn.rw-solid{--face:var(--rw-brass);--fg:var(--rw-ink);--fill:var(--rw-cloud);--fg2:var(--rw-ink);--chip:var(--rw-ink);--chipfg:var(--rw-brass);--chip2:var(--rw-ink);--chipfg2:var(--rw-cloud)}
/* the open panel's copy settles in after the panel has grown; a closing panel's copy leaves at once */
.rwsv-pin{transition:opacity .25s ease,translate .25s ease} .rwsv-p:not(.is-open) .rwsv-pin{opacity:0;translate:0 14px}
.rwsv-p.is-open .rwsv-pin{opacity:1;translate:0 0;transition:opacity .6s ease .32s,translate .8s cubic-bezier(.2,.8,.2,1) .32s}
/* ---- HORIZONTAL (desktop) ---- */
.rwsv.is-h .rwsv-acc{display:flex;gap:8px;height:560px}
.rwsv.is-h .rwsv-p{flex:0 0 var(--cw);transition:flex-grow .95s var(--ease),background .5s}
.rwsv.is-h .rwsv-p.is-open{flex-grow:1}
.rwsv.is-h .rwsv-sp{left:0;top:0;bottom:0;width:var(--cw);display:flex;flex-direction:column;align-items:center;padding:24px 0 24px}
.rwsv.is-h .rwsv-p:not(.is-open) .rwsv-sp{right:0;width:auto}
.rwsv.is-h .rwsv-vt{margin-top:auto;margin-bottom:22px;writing-mode:vertical-rl;rotate:180deg;font-size:30px;transition:opacity .4s,translate .6s cubic-bezier(.2,.8,.2,1)}
.rwsv.is-h .rwsv-p.is-open .rwsv-vt{opacity:0;translate:0 20px}
.rwsv.is-h .rwsv-p:not(.is-open):hover{background:color-mix(in srgb,var(--pbg) 90%,var(--pfg))}
.rwsv.is-h .rwsv-pc{position:absolute;top:0;bottom:0;left:var(--cw);width:var(--ow,760px)}
.rwsv.is-h .rwsv-pin{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,2.6vw,40px);height:100%;padding:24px 32px 28px 0}
.rwsv.is-h .rwsv-tx{padding-top:8px}
/* scroll rail */
.rwsv-rail{display:flex;align-items:center;gap:22px;margin-top:22px}
.rwsv-seg{display:flex;gap:6px;flex:none} .rwsv-seg i{display:block;width:28px;height:4px;border-radius:4px;background:color-mix(in srgb,var(--rw-ink) 14%,transparent);transition:background .4s,width .6s cubic-bezier(.2,.8,.2,1)} .rwsv-seg i.is-past{background:color-mix(in srgb,var(--rw-ink) 42%,transparent)} .rwsv-seg i.is-on{width:56px;background:var(--rw-ink);box-shadow:inset 0 0 0 1px var(--rw-ink)}
.rwsv-now{display:flex;align-items:center;gap:12px;font-size:12px;letter-spacing:.06em;text-transform:uppercase} .rwsv-now b{font-weight:500;padding:4px 9px;border-radius:999px;background:var(--rw-brass)}
.rwsv-hint{display:flex;align-items:center;gap:8px;margin-left:auto;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--rw-mut)} .rwsv-hint i{width:7px;height:7px;border-radius:50%;background:#FF3E88;animation:rw-blink 1.4s ease-in-out infinite}
/* ---- VERTICAL (tablet / phone): the open slot has a fixed height (--oh), so one opening while another closes never changes the page length ---- */
.rwsv.is-v .rwsv-acc{display:flex;flex-direction:column;gap:6px}
.rwsv.is-v .rwsv-sp{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;column-gap:16px;width:100%;min-height:76px;padding:0 16px 0 18px}
.rwsv.is-v .rwsv-vt{font-size:30px}
.rwsv.is-v .rwsv-rs{grid-column:2;grid-row:2;margin:-12px 0 16px;font-size:14px;line-height:1.35;color:var(--mut);display:none}
.rwsv.is-v .rwsv-pc{height:0;overflow:hidden;transition:height .8s var(--ease)}
.rwsv.is-v .rwsv-p.is-open .rwsv-pc{height:var(--oh,640px)}
.rwsv.is-v .rwsv-pin{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;padding:4px 18px 22px}
.rwsv.is-v .rwsv-stage{height:340px}
.rwsv.is-v .rwsv-rail{margin-top:18px} .rwsv.is-v .rwsv-hint{display:none}
.rwsv.is-v .rwsv-tt{display:none}
/* tablet */
.rwsv.is-tab .rwsv-head{grid-template-columns:1fr;align-items:start} .rwsv.is-tab .rwsv-hr{justify-self:start;max-width:560px}
/* phone */
.rwsv.is-ph{padding:80px 0 88px}
.rwsv.is-ph .rwsv-head{grid-template-columns:1fr;gap:24px;margin-bottom:36px} .rwsv.is-ph .rwsv-hr{justify-self:stretch;max-width:none} .rwsv.is-ph .rwsv-hr p{font-size:16px}
.rwsv.is-ph .rwsv-sp{min-height:68px;column-gap:12px;padding:0 12px 0 14px} .rwsv.is-ph .rwsv-vt{font-size:25px} .rwsv.is-ph .rwsv-num{min-width:36px;height:24px;font-size:10.5px;padding:0 7px} .rwsv.is-ph .rwsv-plus{width:36px;height:36px}
.rwsv.is-ph .rwsv-pin{grid-template-columns:1fr;gap:18px;padding:2px 12px 18px} .rwsv.is-ph .rwsv-stage{height:300px}
.rwsv.is-ph .rwsv-body{font-size:15.5px} .rwsv.is-ph .rwsv-inc li{font-size:14.5px} .rwsv.is-ph .rwsv-foot .rw-btn{width:100%}
.rwsv.is-ph .rwsv-rail{gap:14px} .rwsv.is-ph .rwsv-seg i{width:16px} .rwsv.is-ph .rwsv-seg i.is-on{width:32px}
/* ================= mini UIs ================= */
.rwsv-ui{position:absolute;inset:0;display:flex;flex-direction:column;gap:12px;padding:20px;color:var(--rw-ink);font-size:12px}
.rwsv-av{display:inline-block;flex:none;width:22px;height:22px;border-radius:50%;background:conic-gradient(from 200deg,var(--rw-brass),#FF3E88,var(--rw-brass))}
.rwsv-toast{position:absolute;display:inline-flex;align-items:center;gap:8px;margin:0;padding:8px 13px 8px 9px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);font-size:11.5px;white-space:nowrap;box-shadow:0 14px 30px -12px rgba(0,0,0,.45),0 0 0 1px color-mix(in srgb,var(--rw-ink) 8%,transparent);opacity:0;scale:.6;translate:0 10px;transition:opacity .35s,scale .55s cubic-bezier(.34,1.56,.64,1),translate .55s cubic-bezier(.34,1.56,.64,1)}
.rwsv-toast i{width:18px;height:18px;border-radius:50%;background:var(--rw-brass);box-shadow:inset 0 0 0 5px var(--rw-brass),inset 0 0 0 9px var(--rw-ink)} .rwsv-toast::after{content:"";position:absolute;right:-2px;top:-2px;width:9px;height:9px;border-radius:50%;background:#FF3E88;box-shadow:0 0 0 2px var(--rw-cloud)}
.rwsv-toast.is-on{opacity:1;scale:1;translate:0 0}
/* seo */
.rwsv-q{display:flex;align-items:center;gap:10px;height:44px;padding:0 16px;border-radius:999px;background:var(--rw-cloud);box-shadow:0 1px 0 color-mix(in srgb,var(--rw-ink) 8%,transparent),0 10px 24px -16px rgba(0,0,0,.4);font-size:13.5px} .rwsv-q svg{width:16px;height:16px;flex:none;color:var(--rw-mut)} .rwsv-q span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .rwsv-q>i{width:3px;height:16px;border-radius:2px;background:var(--rw-ink);animation:rw-blink 1s steps(1) infinite}
.rwsv-meta{margin:0 4px;font-size:10.5px;letter-spacing:.04em;color:var(--mut)}
.rwsv-res{position:relative;flex:1;min-height:0}
.rwsv-r{position:absolute;left:0;right:0;height:calc(20% - 6px);display:flex;align-items:center;gap:11px;padding:0 12px;border-radius:12px;background:color-mix(in srgb,var(--rw-cloud) 55%,transparent);transition:top .6s cubic-bezier(.34,1.25,.64,1),background .4s,box-shadow .4s}
.rwsv-fav{width:22px;height:22px;flex:none;border-radius:50%;background:color-mix(in srgb,var(--rw-ink) 12%,transparent)}
.rwsv-rt{display:flex;flex-direction:column;gap:5px;flex:1;min-width:0} .rwsv-rt b{font-size:10.5px;font-weight:400;color:color-mix(in srgb,var(--rw-ink) 72%,transparent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .rwsv-rt em{display:block;height:6px;width:82%;border-radius:4px;background:color-mix(in srgb,var(--rw-ink) 16%,transparent)} .rwsv-rt em.rwsv-rt2{width:58%;height:5px;background:color-mix(in srgb,var(--rw-ink) 9%,transparent)}
.rwsv-rt strong{font-size:14px;line-height:1.1;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rwsv-r.is-me{z-index:2;background:var(--rw-cloud);box-shadow:0 0 0 1.5px var(--rw-ink),0 12px 26px -14px rgba(0,0,0,.55)} .rwsv-r.is-me .rwsv-fav{background:var(--rw-brass);box-shadow:inset 0 0 0 5px var(--rw-cloud),0 0 0 1px var(--rw-ink)} .rwsv-r.is-me .rwsv-rt b{color:var(--rw-ink)}
.rwsv-r.is-top{box-shadow:0 0 0 1.5px var(--rw-ink),0 0 0 6px color-mix(in srgb,var(--rw-brass) 70%,transparent),0 12px 26px -14px rgba(0,0,0,.55)}
.rwsv-rank{flex:none;padding:4px 9px;border-radius:999px;background:var(--rw-ink);color:var(--rw-brass);font-size:12px}
.rwsv-seo .rwsv-toast{right:18px;bottom:18px}
/* social */
.rwsv-soc{align-items:center;justify-content:center;padding:18px}
.rwsv-phone{position:relative;display:flex;flex-direction:column;width:min(100%,270px);height:100%;max-height:470px;border-radius:30px;padding:10px;background:var(--rw-cloud);box-shadow:0 0 0 1px color-mix(in srgb,var(--rw-ink) 10%,transparent),0 30px 60px -30px rgba(0,0,0,.6)}
.rwsv-ph-h{display:flex;align-items:center;gap:8px;padding:4px 4px 10px;font-size:11.5px} .rwsv-ph-h b{margin-left:auto;font-weight:400;color:var(--rw-mut)}
.rwsv-ph{position:relative;flex:1;min-height:0;border-radius:18px;overflow:hidden;background:var(--rw-ink)} .rwsv-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.rwsv-float{position:absolute;right:18px;bottom:10px;width:24px;height:80px;pointer-events:none} .rwsv-float i{position:absolute;left:0;bottom:0;width:18px;height:18px;opacity:0;background:#FF3E88;clip-path:path('M9 16.5S1 11.8 1 6.3A3.9 3.9 0 0 1 9 4.6 3.9 3.9 0 0 1 17 6.3c0 5.5-8 10.2-8 10.2z')}
.rwsv-float.is-on i{animation:rwsv-fl 2.2s cubic-bezier(.2,.7,.3,1) infinite} .rwsv-float.is-on i:nth-child(2){animation-delay:.5s;left:8px} .rwsv-float.is-on i:nth-child(3){animation-delay:1.1s;left:-6px}
@keyframes rwsv-fl{0%{opacity:0;transform:translateY(0) scale(.5)}15%{opacity:1}100%{opacity:0;transform:translateY(-78px) scale(1.1) rotate(-12deg)}}
.rwsv-toast-s{left:10px;top:10px}
.rwsv-pb{display:flex;align-items:center;gap:12px;padding:10px 4px 4px} .rwsv-ic{width:21px;height:21px}
.rwsv-hrt{position:relative;display:grid;place-items:center;width:23px;height:23px;transition:color .3s} .rwsv-hrt svg{width:23px;height:23px}
.rwsv-hrt i{position:absolute;inset:-3px;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);opacity:0}
.rwsv-hrt.is-pop{color:#FF3E88} .rwsv-hrt.is-pop svg{animation:rwsv-hp .6s cubic-bezier(.34,1.56,.64,1)} .rwsv-hrt.is-pop i{animation:rwsv-ping 1s cubic-bezier(.2,.6,.3,1)}
@keyframes rwsv-hp{0%{scale:1}45%{scale:1.45}100%{scale:1}}
.rwsv-likes{margin:4px 4px 0;font-size:15px;letter-spacing:-.02em;font-weight:700;font-variant-numeric:tabular-nums}
.rwsv-cap{margin:2px 4px 4px;font-size:12px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .rwsv-cap b{font-weight:600}
/* ads */
.rwsv-ad{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 88px;grid-template-rows:auto 1fr auto;gap:8px 14px;padding:16px;border-radius:16px;background:var(--rw-ink);color:var(--rw-cloud)}
.rwsv-spon{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:color-mix(in srgb,var(--rw-cloud) 62%,transparent)} .rwsv-spon .rwsv-av{width:18px;height:18px}
.rwsv-ad b{grid-column:1;font-size:19px;line-height:1.08;letter-spacing:-.03em;font-weight:700}
.rwsv-adimg{grid-column:2;grid-row:1/4;border-radius:12px;background:radial-gradient(circle at 35% 30%,var(--rw-brass),color-mix(in srgb,var(--rw-brass) 30%,var(--rw-ink)) 70%);overflow:hidden;position:relative} .rwsv-adimg i{position:absolute;left:50%;top:56%;width:46px;height:46px;border-radius:50%;translate:-50% -50%;background:var(--rw-cloud);box-shadow:0 0 0 10px color-mix(in srgb,var(--rw-cloud) 26%,transparent)}
.rwsv-adbtn{grid-column:1;justify-self:start;padding:7px 12px;border-radius:999px;background:var(--rw-brass);color:var(--rw-ink);font-size:11px}
.rwsv-gs{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rwsv-g{position:relative;display:flex;flex-direction:column;align-items:center;padding:12px 10px 10px;border-radius:14px;background:var(--rw-cloud)} .rwsv-g svg{width:100%;max-width:140px;height:auto;overflow:visible}
.rwsv-g0,.rwsv-g1{fill:none;stroke-width:11;stroke-linecap:round} .rwsv-g0{stroke:color-mix(in srgb,var(--rw-ink) 9%,transparent)} .rwsv-g1{stroke:var(--rw-brass);stroke-dasharray:1 1;filter:drop-shadow(0 0 .6px var(--rw-ink))}
.rwsv-g b{margin-top:-30px;font-size:24px;line-height:1;letter-spacing:-.03em;font-weight:700;font-variant-numeric:tabular-nums} .rwsv-g small{margin-top:5px;font-size:10px;letter-spacing:.14em;color:var(--rw-mut)}
.rwsv-bars{flex:1;min-height:30px;display:flex;align-items:flex-end;gap:6px;padding:0 4px} .rwsv-bars i{flex:1;border-radius:5px 5px 2px 2px;background:color-mix(in srgb,var(--pfg) 11%,transparent);transform-origin:bottom} .rwsv-bars i:last-child{background:var(--rw-brass);box-shadow:inset 0 0 0 1px var(--rw-ink)}
.rwsv-bars.is-run i{animation:rwsv-bar .9s cubic-bezier(.2,.8,.2,1) backwards} @keyframes rwsv-bar{from{transform:scaleY(0)}}
/* content */
.rwsv-cnt{padding:18px}
.rwsv-art{position:relative;flex:1;display:flex;flex-direction:column;gap:12px;padding:22px;border-radius:16px;background:var(--rw-cloud);box-shadow:0 20px 40px -26px rgba(0,0,0,.5)}
.rwsv-kick{align-self:flex-start;padding:5px 10px;border-radius:999px;background:var(--rw-brass);font-size:10px;letter-spacing:.1em;text-transform:uppercase}
.rwsv-type{min-height:3.3em;font-size:26px;line-height:1.08;letter-spacing:-.035em;font-weight:700} .rwsv-type i{display:inline-block;width:3px;height:.9em;margin-left:3px;vertical-align:-.08em;background:var(--rw-ink);animation:rw-blink 1s steps(1) infinite} .rwsv-type i.is-typing{animation:none}
.rwsv-by{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--rw-mut)}
.rwsv-lines{display:flex;flex-direction:column;gap:8px;flex:1;min-height:0;overflow:hidden} .rwsv-lines i{flex:none;height:6px;border-radius:4px;background:color-mix(in srgb,var(--rw-ink) 10%,transparent)} .rwsv-lines i:nth-child(3n+2){width:92%} .rwsv-lines i:nth-child(3n){width:70%}
.rwsv-prog{height:4px;border-radius:4px;background:color-mix(in srgb,var(--rw-ink) 8%,transparent);overflow:hidden} .rwsv-prog i{display:block;height:100%;background:var(--rw-ink);transform-origin:left}
.rwsv-reads{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--rw-ink);font-variant-numeric:tabular-nums} .rwsv-reads em{width:7px;height:7px;border-radius:50%;background:#FF3E88}
/* web */
.rwsv-web{padding:18px}
.rwsv-br{position:relative;flex:1;display:flex;flex-direction:column;border-radius:14px;overflow:hidden;background:var(--rw-cloud);box-shadow:0 24px 44px -26px rgba(0,0,0,.55),0 0 0 1px color-mix(in srgb,var(--rw-ink) 8%,transparent)}
.rwsv-chrome{display:flex;align-items:center;gap:6px;height:34px;flex:none;padding:0 12px;border-bottom:1px solid var(--rw-fog)} .rwsv-chrome>i{width:8px;height:8px;border-radius:50%;background:var(--rw-fog)} .rwsv-chrome>i:first-child{background:#FF3E88} .rwsv-chrome span{margin-left:8px;flex:1;padding:4px 12px;border-radius:999px;background:var(--rw-bone);font-size:10.5px;color:var(--rw-mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rwsv-vp{position:relative;flex:1;min-height:0;overflow:hidden}
.rwsv-page{display:flex;flex-direction:column;gap:14px;padding:16px;animation:rwsv-scroll 8s cubic-bezier(.65,0,.35,1) infinite}
@keyframes rwsv-scroll{0%,14%{transform:translateY(0)}46%,62%{transform:translateY(-46%)}90%,100%{transform:translateY(0)}}
.rwsv-pg-nav{display:flex;gap:8px;align-items:center} .rwsv-pg-nav i{height:6px;width:28px;border-radius:4px;background:color-mix(in srgb,var(--rw-ink) 14%,transparent)} .rwsv-pg-nav i:first-child{width:18px;height:18px;border-radius:50%;background:var(--rw-brass);box-shadow:inset 0 0 0 1px var(--rw-ink);margin-right:auto}
.rwsv-pg-h{display:flex;flex-direction:column;gap:7px} .rwsv-pg-h i{height:16px;width:88%;border-radius:5px;background:var(--rw-ink)} .rwsv-pg-h i+i{width:64%} .rwsv-pg-h i+i+i{width:40%}
.rwsv-pg-b{align-self:flex-start;width:108px;height:30px;flex:none;border-radius:999px;background:var(--rw-brass);box-shadow:inset 0 0 0 1px var(--rw-ink)}
.rwsv-pg-img{height:120px;flex:none;border-radius:12px;background:linear-gradient(135deg,var(--rw-ink),color-mix(in srgb,var(--rw-ink) 60%,var(--rw-brass)))}
.rwsv-pg-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px} .rwsv-pg-row i{height:64px;border-radius:10px;background:var(--rw-bone)} .rwsv-pg-row:has(i:nth-child(2):last-child){grid-template-columns:1fr 1fr}
.rwsv-pg-q{height:70px;flex:none;border-radius:12px;background:color-mix(in srgb,var(--rw-brass) 40%,var(--rw-cloud))}
.rwsv-cur{position:absolute;left:62%;top:58%;width:18px;height:18px;border-radius:50%;background:var(--rw-ink);box-shadow:0 0 0 3px var(--rw-cloud);animation:rwsv-cur 8s cubic-bezier(.65,0,.35,1) infinite}
@keyframes rwsv-cur{0%,10%{transform:translate(0,0)}22%{transform:translate(-90px,-60px) scale(.8)}26%{transform:translate(-90px,-60px) scale(1.1)}40%,100%{transform:translate(0,0)}}
.rwsv-conv{position:absolute;right:12px;bottom:12px;display:inline-flex;align-items:center;padding:7px 11px;border-radius:999px;background:var(--rw-ink);color:var(--rw-brass);font-size:11px}
/* brand */
.rwsv-brd{justify-content:space-between;padding:24px}
.rwsv-logo{display:flex;align-items:center;gap:12px} .rwsv-logo b{font-size:38px;letter-spacing:-.055em;font-weight:800;line-height:1}
.rwsv-p.is-dk .rwsv-brd,.rwsv-p.is-dk .rwsv-spec{color:var(--rw-cloud)}
.rwsv-sw{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;perspective:500px}
.rwsv-s{position:relative;height:86px;transform-style:preserve-3d;animation:rwsv-flip 4.4s cubic-bezier(.7,0,.2,1) infinite}
.rwsv-s i{position:absolute;inset:0;display:flex;align-items:flex-end;padding:8px;border-radius:12px;backface-visibility:hidden;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 14%,transparent)} .rwsv-s i+i{transform:rotateY(180deg)} .rwsv-s small{font-size:9px;letter-spacing:.06em;mix-blend-mode:difference;color:#fff}
.rwsv-s0 i:first-child{background:var(--rw-ink)} .rwsv-s0 i+i{background:#1F3A2E} .rwsv-s1 i:first-child{background:var(--rw-brass)} .rwsv-s1 i+i{background:#FF8A3D} .rwsv-s2 i:first-child{background:#FF3E88} .rwsv-s2 i+i{background:#F2E6D3} .rwsv-s3 i:first-child{background:var(--rw-cloud)} .rwsv-s3 i+i{background:#2F5BFF}
@keyframes rwsv-flip{0%,35%{transform:rotateY(0)}50%,85%{transform:rotateY(180deg)}100%{transform:rotateY(360deg)}}
.rwsv-spec{display:flex;align-items:center;gap:16px;font-size:10.5px;line-height:1.5;letter-spacing:.1em;text-transform:uppercase;color:var(--rw-ink)} .rwsv-spec span:first-child{font-size:64px;line-height:1;letter-spacing:-.05em;text-transform:none;font-weight:700}
.rwsv-apps{display:flex;gap:10px;align-items:center} .rwsv-apps i{display:grid;place-items:center;height:44px;border-radius:12px;font-style:normal}
.rwsv-app1{width:44px;background:var(--rw-ink)} .rwsv-app2{padding:0 16px;background:var(--rw-brass);color:var(--rw-ink);font-size:15px;font-weight:700;letter-spacing:-.03em;border-radius:999px!important} .rwsv-app3{flex:1;background:repeating-linear-gradient(90deg,#FF3E88 0 12px,var(--rw-ink) 12px 24px);opacity:.9}
.rwsv.is-fin .rwsv-s,.rwsv.is-fin .rwsv-page,.rwsv.is-fin .rwsv-cur,.rwsv.is-fin .rwsv-float i{animation:none!important}
.rwsv.is-ph .rwsv-ui{padding:14px} .rwsv.is-ph .rwsv-bars{display:none} .rwsv.is-ph .rwsv-type{font-size:21px} .rwsv.is-ph .rwsv-s{height:64px} .rwsv.is-ph .rwsv-spec span:first-child{font-size:46px} .rwsv.is-ph .rwsv-logo b{font-size:30px} .rwsv.is-ph .rwsv-brd{padding:16px} .rwsv.is-ph .rwsv-apps{display:none}
.rwsv.is-v .rwsv-ad b{font-size:16px} .rwsv.is-v .rwsv-g b{font-size:20px;margin-top:-26px}
@media (prefers-reduced-motion:reduce){.rwsv-s,.rwsv-page,.rwsv-cur,.rwsv-float i{animation:none!important}}
`
addPropertyControls(RwServices, {
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "(02) Services" },
  heading: { type: ControlType.String, title: "Heading", description: "| = line break, *word* = lime marker", defaultValue: "Six channels.|*One* growth plan." },
  intro: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "SEO, social, ads, content, web and brand under one retainer, one team and one monthly report." },
  button: { type: ControlType.String, title: "Button", defaultValue: "All services" },
  buttonLink: { type: ControlType.Link, title: "Button link", defaultValue: "/services" },
  fromLabel: { type: ControlType.String, title: "Price label", defaultValue: "From" },
  exploreLabel: { type: ControlType.String, title: "Panel button", defaultValue: "Explore" },
  includesLabel: { type: ControlType.String, title: "Includes label", defaultValue: "What's included" },
  hint: { type: ControlType.String, title: "Hint", defaultValue: "Scroll to switch channels, or pick one" },
  seoQuery: { type: ControlType.String, title: "SEO search", defaultValue: "dentist near me" },
  socialHandle: { type: ControlType.String, title: "Social handle", defaultValue: "@kinfolk.coffee" },
  socialPhoto: { type: ControlType.ResponsiveImage, title: "Social photo" },
  adsHeadline: { type: ControlType.String, title: "Ad headline", defaultValue: "Free whitening with every new-patient visit" },
  articleTitle: { type: ControlType.String, title: "Article title", defaultValue: "How to rank #1 for “near me” searches" },
  webUrl: { type: ControlType.String, title: "Web address", defaultValue: "yoursite.com/offer" },
  brandName: { type: ControlType.String, title: "Brand name", defaultValue: "Kinfolk" },
})
