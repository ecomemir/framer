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
const SW_BUILD = "RwStartHere@cms1"
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

// ===== RwStartHere =====
/**
 * REACHWISE — OWNER GUIDE (/start-here). A standalone page (no header, no footer, not on the Site Layout, noindex) for the person who remixed
 * the template: the Site row, the eight colour Styles, fonts, the eight collections and their detail pages, section text, buttons, the forms,
 * images, the loader and page transition, pages, samples to replace and "delete this page before you publish". Everything is plain HTML
 * (readable with JS off); JS only adds the robots noindex meta and lights the index chip of the section on screen. One h1.
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
type RwshSec = { id: string; t: string; lead: string; rows?: [string, string][]; steps?: string[]; note?: string; swatches?: boolean; paths?: [string, string][] }
const RWSH: RwshSec[] = [
  { id: "start", t: "Launch in five steps", lead: "Reachwise is a complete agency site: a home page with sixteen sections, services, case studies, team, pricing, blog, careers, contact and legal pages. Everything that repeats lives in the CMS, every colour is a Style, and one switch sets the fonts.", steps: [
    "Open CMS → Site and put in your agency name, email, phone, city and booking link (five minutes).",
    "Rewrite the Services, Work, Team and Reviews rows with your own offers, cases and people. Their pages follow on their own.",
    "Swap the hero crowd photo and the CMS photos for your own (see Images).",
    "Change the eight colour Styles if you want another palette, and pick fonts on the Header if you want other type.",
    "Replace the sample numbers and names (see Samples), delete this page, then publish."] },
  { id: "site", t: "The Site row", lead: "CMS → Site holds one row of agency-wide facts. The header, hero, page heroes, contact page, CTA, footer, loader and legal pages all read it, so you type each fact once.", rows: [
    ["Name", "Your agency name: header and footer wordmark, hero, loader, page titles in the legal pages."],
    ["Descriptor", "A short category line (Digital marketing agency). Page heroes and the loader."],
    ["Tagline", "One sentence about the agency. Hero and footer."],
    ["Email · Phone", "Contact page, header menu, footer, FAQ and careers lines, and the fallback of the contact form."],
    ["Booking Link", "Every \"Book a call\" button on the site: header, hero, pricing, FAQ, CTA, service and case pages. A Calendly or Cal.com link works well. Empty = /contact."],
    ["City · Time Zone", "The office line and the live local clock in the header menu, CTA and footer. Time Zone is an IANA name such as America/New_York or Europe/London."],
    ["Rating · Reviews Count", "The stars line under the hero, the clients band and the reviews section (4.9 · 126 client reviews)."],
    ["Socials", "Label:url pairs separated by commas: Instagram:https://…, LinkedIn:https://…. Footer, header menu and contact page."],
    ["Announcement", "The small pill above the hero headline (Now booking Q4 · 3 spots left). Empty hides it."],
    ["Clients Count", "The \"140+ brands\" proof in the hero and the clients band."]] },
  { id: "colours", t: "The eight colour Styles", lead: "Eight colour Styles repaint the whole site: every section, the header, buttons, the loader and the page transition. Assets panel → Colors → change a swatch; leave the sections bound to it.", swatches: true, rows: [
    ["Paper", "The chalk ground of the light sections and the text on dark buttons."],
    ["Ink", "Main text, solid buttons, dark cards on chalk."],
    ["Accent", "The signal lime: pulses, rings, highlight markers behind headline words, chips, progress lines and the lime numbers band. It is a surface colour; text on chalk stays Ink."],
    ["Deep · Dark", "Dark cards and the night ground: hero shade, case studies, content wall, pricing, CTA, footer, loader and page transition."],
    ["Line · Muted · White", "Hairlines, secondary text, and the white notification chips and cards."]], note: "Change a Style once and the whole site follows. The small pink notification dots are fixed in code on purpose; everything else follows the Styles." },
  { id: "fonts", t: "Fonts", lead: "One switch sets the fonts on every page. The defaults are Funnel Display (headlines), Funnel Sans (text) and Geist Mono (numbers, labels, counters).", steps: [
    "Open the Site Layout and select the Header.",
    "Turn on Custom Fonts and pick a Display, Body and Mono font.",
    "Publish. Every section follows. A section's own Custom Fonts switch overrides the header for that one section only."] },
  { id: "cms", t: "The eight collections", lead: "Add a row and it appears wherever it belongs; Services, Work, Team and Posts rows also get their own page. The Order number sorts every list, and deleting a row never leaves a hole.", rows: [
    ["Site", "One row of agency-wide facts (see The Site row)."],
    ["Services", "Title, Short, Body, From Price, Includes (a;b;c), Kind (seo, social, ads, content, web, brand — picks the live mini illustration), Stat. The services section on home, /services and every /services/:slug page."],
    ["Work", "Client, Title, Industry, Services (a;b), Metric Label, Before, After, Unit, Year, Summary, Photo. The before/after case viewer on home, /work and every /work/:slug case study."],
    ["Team", "Name, Role, Bio, Focus, LinkedIn, Photo. The team row on home and /about, and every /team/:slug page."],
    ["Reviews", "Name, Role, Company, Quote, Result, Rating, Photo. The notification-style reviews on home and /about."],
    ["Plans", "Name, Monthly, Quarterly, Tagline, Includes (a;b;c), Button, Featured (yes). The pricing cards on home and /pricing and the compare table."],
    ["FAQ", "Question, Answer, Group. The answers section on home, /services and /pricing."],
    ["Posts", "Title, Kicker, Date, Read, Excerpt, Body (## heading, - list item, > quote), Photo. The insights section, /blog and every /blog/:slug article."]], note: "Detail pages (/services/:slug, /work/:slug, /team/:slug, /blog/:slug) are one template each. Add a CMS row and its page exists; never duplicate a detail page by hand." },
  { id: "text", t: "Section text", lead: "Every word on the site is a control. Select a section on the canvas and edit it in the right panel; nothing is hidden in code.", rows: [
    ["Headlines", "A | starts a new line and *words* between stars get the lime highlight marker (Get seen by|the *right crowd.*)."],
    ["Lists", "Lists inside one control are separated by ; or , as the control's description says (Reach pop-ups, Service tags, Stats)."],
    ["Override law", "Controls that repeat a Site fact (Eyebrow, Primary link, Call link …) are empty on purpose: empty inherits from the CMS, typed text wins on that one section only. Delete the text (a single space also counts as empty) and the CMS value returns."],
    ["Colours per section", "Each section also has the eight colour controls, bound to the Styles. Rebinding one to a fixed colour makes only that section different."]] },
  { id: "forms", t: "Buttons and forms", lead: "Buttons and forms work the moment you publish; connect a form service when you want submissions stored.", rows: [
    ["Book a call", "Every booking button uses the Booking Link on the Site row, unless its own link control is filled in."],
    ["Contact form", "Select the Contact section on /contact → Form endpoint = a URL that accepts a JSON POST (Formspree, Make, Zapier, your API). Empty = the visitor's email app opens with the message filled in, addressed to the Site Email."],
    ["Free audit form", "The CTA form (email + budget) sends the visitor to your Booking Link with ?email=…&budget=… added, so booking tools that read those fields prefill them."],
    ["Labels", "Every label, option, error and thank-you message is a control on its section."]] },
  { id: "images", t: "Images", lead: "Export photos as WebP or JPG under 300 KB. The site serves smaller copies to phones on its own.", rows: [
    ["Hero crowd", "Select the Hero → Crowd photo. A crowd or street seen from above works best (landscape, at least 1920 px wide). Focus X / Focus Y move the crop. The grey-to-colour rings are drawn in code on top of any photo."],
    ["Case studies", "CMS → Work → Photo: landscape, 1600 px wide. Used as the before/after pair and the case study cover."],
    ["Team", "CMS → Team → Photo: portrait 3:4, 900 × 1200, plain background."],
    ["Reviews", "CMS → Reviews → Photo: square, 400 × 400 (small avatars)."],
    ["Blog", "CMS → Posts → Photo: landscape 16:9, 1600 × 900."],
    ["Other photos", "The About section's Photo 1–3 controls, the Social photo control on the services sections, and the Posts list of the content wall (image url, handle and likes per line)."]] },
  { id: "motion", t: "Loader and page transition", lead: "Both live once in the Site Layout, right under the Header, so every page gets them.", rows: [
    ["Loader", "\"The first ping\": plays on the first visit of a session only. Controls: Enabled, labels, Counter end, Duration, Once per session. Visitors can click or press Esc to skip."],
    ["Page transition", "\"The signal\": a ring grows from the clicked link and contracts on the next page. Controls: Enabled, Home label, Kicker, Duration. Outside links, email and phone links, new tabs and #links never trigger it."],
    ["Reduced motion", "Visitors who ask their device for less motion get a short fade instead, and no transition."]] },
  { id: "pages", t: "Pages", lead: "One Site Layout carries the header, smooth scroll, the CMS bridge, the loader, the page transition and the footer.", paths: [
    ["/", "Home — the reach hero and fifteen sections"], ["/services", "Services overview"], ["/services/:slug", "One page per Services row"], ["/work", "Case studies"], ["/work/:slug", "One page per Work row"],
    ["/about", "About, team and reviews"], ["/team/:slug", "One page per Team row"], ["/pricing", "Plans and compare table"], ["/blog", "All articles"], ["/blog/:slug", "One page per Posts row"],
    ["/careers", "Open roles"], ["/contact", "Contact form and booking"], ["/privacy · /terms · /cookies", "Legal pages with sample text"], ["404", "Not-found page"]],
    rows: [["Site Layout", "Pages panel → Layouts → Site Layout. The hidden layers named \"CMS Bridge · …\" connect the CMS to the sections. Leave them in place."], ["Page settings", "Each page has its own title and description in Page Settings; the social image and favicon are set once for the whole site."]] },
  { id: "samples", t: "Samples to replace", lead: "Everything that reads like a fact on the demo is a sample. Put in your own before you launch.", rows: [
    ["Numbers", "People reached, growth percentages, ROAS, the funnel counts and the numbers band: the Hero, Funnel and Numbers controls and the Site row."],
    ["Clients", "The client names and growth badges on the radar are fictional (the Clients section's Client names and Growth badges controls)."],
    ["Cases, team and reviews", "The Work, Team and Reviews rows are samples, photos included."],
    ["Legal pages", "Privacy, Terms and Cookies hold sample text. Rewrite them for your agency."]] },
  { id: "delete", t: "Delete this page before you publish", lead: "This guide is for you, not your visitors. It is hidden from search engines and nothing links to it, but delete it (Pages panel → Start here → Delete) before you launch." },
]
export default function RwStartHere(props: any) {
  const { kicker = "Owner guide · delete before publishing", heading = "Start *here.*", intro = "How to make Reachwise yours, about thirty minutes from remix to launch. Stuck on anything? We reply fast, usually the same day.", supportEmail = "solofoundryhq@gmail.com", supportLabel = "Email support", indexLabel = "In this guide",
    addonTitle = "Optional add-on: the SoloFoundry Assistant ($29/mo)", addonText = "A chat bubble for your agency site, trained on your own published pages. It answers what you offer, what each plan includes and how to book a call, from your Services, Pricing, FAQ and pages. Publish your site, email us your address, and we send one tenant ID to paste into the Assistant component. This template ships without it.", bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive()
  const root = useRef<HTMLElement>(null); const bar = useRef<HTMLElement>(null); const { w } = useSize(root, bpHint); const ph = w < 810, tab = w >= 810 && w < 1100
  const [cur, setCur] = useState(RWSH[0].id)
  useEffect(() => { if (!live) return; let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null; if (!m) { m = document.createElement("meta"); m.name = "robots"; document.head.appendChild(m) } m.content = "noindex, nofollow" }, [live])
  useEffect(() => { if (!live) return; let k = RWSH[0].id, last = "", p = 0, lastP = -1
    const off = onTick(() => { if (k !== last) { last = k; setCur(k); const a = bar.current?.querySelector<HTMLElement>(`[data-id="${k}"]`); const sc = a?.parentElement; if (a && sc && sc.scrollWidth > sc.clientWidth) sc.scrollTo({ left: Math.max(0, a.offsetLeft - sc.offsetLeft - 16), behavior: "smooth" }) } if (bar.current && Math.abs(p - lastP) > 0.001) { lastP = p; bar.current.style.setProperty("--rwsh-p", p.toFixed(4)) } },
      () => { const vh = window.innerHeight || 1; let kk = RWSH[0].id; for (const s of RWSH) { const e = document.getElementById("rwsh-" + s.id); if (e && e.getBoundingClientRect().top < vh * 0.35) kk = s.id } k = kk; const r = root.current?.getBoundingClientRect(); if (r) p = clamp01(-r.top / Math.max(1, r.height - vh)) })
    return off }, [live])
  const nn = (i: number) => String(i + 1).padStart(2, "0")
  const mh = String(heading).match(/^(.*?)\*(.+?)\*(.*)$/); const pre = mh ? mh[1] : heading, acc = mh ? mh[2] : "", post = mh ? mh[3] : ""
  const SW: [string, string][] = [["Paper", "bone"], ["Ink", "ink"], ["Accent", "brass"], ["Deep", "pine"], ["Line", "fog"], ["Muted", "stone"], ["White", "cloud"], ["Dark", "night"]]
  return (
    <section ref={root} className={`rw rwsh${ph ? " is-ph" : tab ? " is-tab" : ""}`} style={{ ...cssVars(c), ...B, ...(props.style || {}) } as any}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_RWSH + siteFontCss(props) }} />
      <header className="rwsh-head">
        <div className="rwsh-hl">
          <p className="rwsh-k" style={M}><i aria-hidden />{kicker}</p>
          <h1 className="rwsh-h1" style={D}>{pre}{acc && <mark>{acc}</mark>}{post}</h1>
        </div>
        <div className="rwsh-hr">
          <p className="rwsh-intro">{intro}</p>
          <div className="rwsh-cta"><Btn href={`mailto:${supportEmail}`} label={supportLabel} kind="solid" icon="mail" /><a className="rwsh-mail" href={`mailto:${supportEmail}`} style={M}>{supportEmail}</a></div>
        </div>
        <svg className="rwsh-rings" viewBox="0 0 400 400" aria-hidden><circle cx="200" cy="200" r="40" /><circle cx="200" cy="200" r="90" /><circle cx="200" cy="200" r="140" /><circle cx="200" cy="200" r="190" /><circle className="rwsh-core" cx="200" cy="200" r="9" /></svg>
      </header>
      <nav ref={bar as any} className="rwsh-bar" aria-label={indexLabel} style={M}>
        <span className="rwsh-bl">{indexLabel}</span>
        <div className="rwsh-chips">{RWSH.map((s, i) => <a key={s.id} data-id={s.id} href={`#rwsh-${s.id}`} className={cur === s.id ? "is-on" : ""} aria-current={cur === s.id ? "true" : undefined}><i>{nn(i)}</i>{s.t}</a>)}</div>
        <span className="rwsh-prog" aria-hidden><b /></span>
      </nav>
      <div className="rwsh-body">
        {RWSH.map((s, i) => (
          <article key={s.id} id={`rwsh-${s.id}`} className={`rwsh-sec${s.id === "delete" ? " is-last" : ""}`}>
            <div className="rwsh-side"><span className="rwsh-n" style={D}>{nn(i)}</span><h2 style={D}>{s.t}</h2></div>
            <div className="rwsh-main">
              <p className="rwsh-lead">{s.lead}</p>
              {s.swatches ? <ul className="rwsh-sw">{SW.map(([t, k]) => <li key={k}><i style={{ background: `var(--rw-${k})` }} /><span style={M}>{t}</span></li>)}</ul> : null}
              {s.steps ? <ol className="rwsh-steps">{s.steps.map((x, k) => <li key={k}><i style={M}>{nn(k)}</i><span>{x}</span></li>)}</ol> : null}
              {s.paths ? <ul className="rwsh-paths">{s.paths.map(([a, b], k) => <li key={k}><code style={M}>{a}</code><span>{b}</span></li>)}</ul> : null}
              {s.rows ? <dl className="rwsh-dl">{s.rows.map(([a, b], k) => <div key={k}><dt style={M}>{a}</dt><dd>{b}</dd></div>)}</dl> : null}
              {s.note ? <p className="rwsh-note"><i aria-hidden />{s.note}</p> : null}
            </div>
          </article>))}
        {addonTitle ? <aside className="rwsh-addon"><p className="rwsh-k rwsh-k-d" style={M}><i aria-hidden />Add-on</p><b style={D}>{addonTitle}</b><p>{addonText}</p></aside> : null}
        <footer className="rwsh-foot" style={M}><span>{supportLabel} · <a href={`mailto:${supportEmail}`}>{supportEmail}</a></span><span>We reply fast.</span></footer>
      </div>
    </section>
  )
}
const CSS_RWSH = `
.rwsh{position:relative;width:100%;background:var(--rw-bone);color:var(--rw-ink);padding:0 0 clamp(48px,6vw,96px);--pad:clamp(20px,4vw,64px)}
.rwsh-head{position:relative;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:clamp(24px,4vw,64px);align-items:end;padding:clamp(56px,7vw,112px) var(--pad) clamp(40px,5vw,72px);overflow:hidden;isolation:isolate}
.rwsh-rings{position:absolute;z-index:-1;right:-120px;top:-150px;width:520px;height:520px} .rwsh-rings circle{fill:none;stroke:color-mix(in srgb,var(--rw-ink) 12%,transparent);stroke-width:1} .rwsh-rings .rwsh-core{fill:var(--rw-brass);stroke:none}
.rwsh-k{display:inline-flex;align-items:center;gap:9px;margin:0 0 22px;padding:7px 13px 7px 11px;border-radius:999px;background:color-mix(in srgb,var(--rw-ink) 6%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 12%,transparent);font-size:11.5px;letter-spacing:.06em}
.rwsh-k i{width:7px;height:7px;border-radius:50%;background:#FF3E88}
.rwsh-h1{margin:0;font-size:clamp(68px,10vw,160px);line-height:.88;letter-spacing:-.06em;font-weight:var(--rw-font-dw,700)}
.rwsh-h1 mark{color:var(--rw-ink);background:var(--rw-brass);border-radius:.14em;padding:0 .08em;margin:0 .02em}
.rwsh-intro{margin:0 0 26px;max-width:520px;font-size:clamp(17px,1.4vw,20px);line-height:1.5}
.rwsh-cta{display:flex;flex-wrap:wrap;align-items:center;gap:16px 22px} .rwsh-mail{font-size:13px;color:var(--rw-mut);text-decoration:underline;text-underline-offset:4px;overflow-wrap:anywhere}
/* sticky index */
.rwsh-bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:18px;padding:12px var(--pad);background:color-mix(in srgb,var(--rw-bone) 90%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-top:1px solid var(--rw-fog);border-bottom:1px solid var(--rw-fog)}
.rwsh-bl{flex:none;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--rw-mut)}
.rwsh-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px} .rwsh-chips::-webkit-scrollbar{display:none}
.rwsh-chips a{flex:none;display:inline-flex;align-items:center;gap:8px;padding:8px 13px;border-radius:999px;font-size:12px;text-decoration:none;color:var(--rw-ink);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 14%,transparent);transition:background .25s,color .25s}
.rwsh-chips a i{font-style:normal;color:var(--rw-mut)} .rwsh-chips a:hover{background:color-mix(in srgb,var(--rw-ink) 6%,transparent)}
.rwsh-chips a.is-on{background:var(--rw-ink);color:var(--rw-bone);box-shadow:none} .rwsh-chips a.is-on i{color:var(--rw-brass)}
.rwsh-prog{position:absolute;left:0;right:0;bottom:-1px;height:2px} .rwsh-prog b{display:block;height:100%;background:var(--rw-brass);transform-origin:0 50%;transform:scaleX(var(--rwsh-p,0))}
/* sections: editorial rows */
.rwsh-body{padding:0 var(--pad)}
.rwsh-sec{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.6fr);gap:clamp(24px,4vw,72px);padding:clamp(40px,5vw,72px) 0;border-bottom:1px solid var(--rw-fog);scroll-margin-top:72px}
.rwsh-side{position:relative} .rwsh-n{display:block;margin:0 0 10px;font-size:14px;letter-spacing:-.01em;font-variant-numeric:tabular-nums;color:var(--rw-mut)}
.rwsh-sec h2{margin:0;font-size:clamp(30px,3.2vw,48px);line-height:.98;letter-spacing:-.045em;font-weight:var(--rw-font-dw,700);text-wrap:balance}
.rwsh-lead{margin:0 0 24px;max-width:720px;font-size:17px;line-height:1.6}
.rwsh-dl{margin:0;display:grid;border-top:1px solid var(--rw-fog)} .rwsh-dl div{display:grid;grid-template-columns:190px minmax(0,1fr);gap:20px;padding:15px 0;border-bottom:1px solid var(--rw-fog)}
.rwsh-dl dt{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;padding-top:3px;overflow-wrap:anywhere} .rwsh-dl dd{margin:0;font-size:15.5px;line-height:1.6;overflow-wrap:anywhere;color:color-mix(in srgb,var(--rw-ink) 88%,transparent)}
.rwsh-steps{list-style:none;margin:0;padding:0;display:grid;gap:10px;counter-reset:s} .rwsh-steps li{display:grid;grid-template-columns:44px 1fr;gap:14px;align-items:center;padding:14px 16px;border-radius:18px;background:var(--rw-cloud);font-size:15.5px;line-height:1.5}
.rwsh-steps li i{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--rw-brass);font-style:normal;font-size:12px;color:var(--rw-ink)}
.rwsh-sw{list-style:none;margin:0 0 24px;padding:0;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:10px} .rwsh-sw li{display:flex;flex-direction:column;gap:8px} .rwsh-sw i{display:block;aspect-ratio:1;border-radius:50%;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-ink) 16%,transparent)} .rwsh-sw span{font-size:11px;letter-spacing:.06em;text-align:center}
.rwsh-paths{list-style:none;margin:0 0 24px;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px} .rwsh-paths li{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border-radius:16px;background:var(--rw-cloud);font-size:14px;line-height:1.45}
.rwsh-paths code{font-size:12.5px;color:var(--rw-ink);overflow-wrap:anywhere} .rwsh-paths span{color:var(--rw-mut)}
.rwsh-note{display:flex;gap:12px;align-items:flex-start;margin:20px 0 0;padding:15px 18px;border-radius:18px;background:var(--rw-ink);color:var(--rw-bone);font-size:15px;line-height:1.55} .rwsh-note i{flex:none;width:9px;height:9px;margin-top:7px;border-radius:50%;background:var(--rw-brass)}
.rwsh-sec.is-last h2{max-width:12ch}
.rwsh-addon{margin:clamp(40px,5vw,72px) 0 0;padding:clamp(24px,3vw,40px);border-radius:28px;background:var(--rw-night);color:var(--rw-bone)} .rwsh-k-d{background:color-mix(in srgb,var(--rw-cloud) 9%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 18%,transparent);color:var(--rw-cloud);margin-bottom:16px} .rwsh-k-d i{background:var(--rw-brass)}
.rwsh-addon b{display:block;font-size:clamp(24px,2.2vw,34px);letter-spacing:-.035em;line-height:1.05;font-weight:var(--rw-font-dw,700)} .rwsh-addon p:last-child{margin:12px 0 0;max-width:760px;font-size:15.5px;line-height:1.6;color:color-mix(in srgb,var(--rw-bone) 82%,transparent)}
.rwsh-foot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:32px;font-size:12px;letter-spacing:.04em;color:var(--rw-mut)} .rwsh-foot a{color:var(--rw-ink)}
.rwsh.is-tab .rwsh-head{grid-template-columns:1fr} .rwsh.is-tab .rwsh-sec{grid-template-columns:1fr;gap:18px} .rwsh.is-tab .rwsh-sw{grid-template-columns:repeat(4,minmax(0,1fr))}
.rwsh.is-ph .rwsh-head{grid-template-columns:1fr;padding-top:44px} .rwsh.is-ph .rwsh-rings{width:320px;height:320px;right:-110px;top:-110px} .rwsh.is-ph .rwsh-bl{display:none}
.rwsh.is-ph .rwsh-sec{grid-template-columns:1fr;gap:14px} .rwsh.is-ph .rwsh-dl div{grid-template-columns:1fr;gap:4px} .rwsh.is-ph .rwsh-sw{grid-template-columns:repeat(4,minmax(0,1fr))} .rwsh.is-ph .rwsh-paths{grid-template-columns:1fr} .rwsh.is-ph .rwsh-lead{font-size:16px}
`
addPropertyControls(RwStartHere, {
  ...BP_CONTROL,
  kicker: { type: ControlType.String, title: "Kicker", defaultValue: "Owner guide · delete before publishing" }, heading: { type: ControlType.String, title: "Heading", description: "*word* = lime highlight", defaultValue: "Start *here.*" },
  intro: { type: ControlType.String, title: "Intro", displayTextArea: true, defaultValue: "How to make Reachwise yours, about thirty minutes from remix to launch. Stuck on anything? We reply fast, usually the same day." },
  supportEmail: { type: ControlType.String, title: "Support email", defaultValue: "solofoundryhq@gmail.com" }, supportLabel: { type: ControlType.String, title: "Support button", defaultValue: "Email support" },
  indexLabel: { type: ControlType.String, title: "Index label", defaultValue: "In this guide" },
  addonTitle: { type: ControlType.String, title: "Add-on title", description: "Empty hides the add-on card", defaultValue: "Optional add-on: the SoloFoundry Assistant ($29/mo)" },
  addonText: { type: ControlType.String, title: "Add-on text", displayTextArea: true, defaultValue: "A chat bubble for your agency site, trained on your own published pages. It answers what you offer, what each plan includes and how to book a call, from your Services, Pricing, FAQ and pages. Publish your site, email us your address, and we send one tenant ID to paste into the Assistant component. This template ships without it." },
  ...COLOR_CONTROLS, ...FONT_CONTROLS,
} as any)
