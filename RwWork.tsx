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
  work: [{"slug": "northside-dental", "f1": "Northside Dental", "f2": "From page 4 to the top 3 for “dentist near me”", "f3": "Dental clinic", "f4": "SEO;Content", "f5": "Organic visits a month", "f6": "4,200", "f7": "38,900", "f8": "", "f9": "2025", "f10": "A local SEO rebuild: 60 location pages, 180 reviews and a content plan for every treatment.", "img": "https://framerusercontent.com/images/iQ0lX69C3YgeRjqffxWadnnAmnc.webp", "n1": "1"}, {"slug": "kinfolk-coffee", "f1": "Kinfolk Coffee", "f2": "A coffee brand people film for us", "f3": "Food & drink", "f4": "Social media;Content", "f5": "Instagram followers", "f6": "8,100", "f7": "96,400", "f8": "", "f9": "2025", "f10": "Three reels a week shot in the roasteries turned a local brand into a national one.", "img": "https://framerusercontent.com/images/myjp4zr3op66cJhewFtasNpY5I.webp", "n1": "2"}, {"slug": "fitloop", "f1": "Fitloop", "f2": "Paid ads that pay for themselves in 11 days", "f3": "Fitness app", "f4": "Paid ads", "f5": "Return on ad spend", "f6": "1.4", "f7": "6.2", "f8": "×", "f9": "2025", "f10": "We rebuilt the Meta account around creative testing and cut the cost per trial by 58%.", "img": "https://framerusercontent.com/images/hd4rblq8DW7sPIt8FWcRq1HdmQ0.webp", "n1": "3"}, {"slug": "haven-realty", "f1": "Haven Realty", "f2": "A pipeline of sellers, not just clicks", "f3": "Real estate", "f4": "Paid ads;Web design", "f5": "Seller leads a month", "f6": "14", "f7": "122", "f8": "", "f9": "2024", "f10": "A new site with valuation landing pages and Google campaigns for every neighbourhood.", "img": "https://framerusercontent.com/images/zEqvjQAlVPs2PE6oz2TsexQ8TA.webp", "n1": "4"}, {"slug": "lumen-skin", "f1": "Lumen Skin", "f2": "A skincare launch that sold out twice", "f3": "Beauty", "f4": "Social media;Branding", "f5": "Launch-week revenue", "f6": "$18k", "f7": "$142k", "f8": "", "f9": "2024", "f10": "Brand, creators and a TikTok launch plan built in six weeks.", "img": "https://framerusercontent.com/images/QSuLrUGcfrrneXqjDG4ZKyC91Gk.webp", "n1": "5"}, {"slug": "orbit-legal", "f1": "Orbit Legal", "f2": "Thought leadership that books consultations", "f3": "Law firm", "f4": "Content;SEO", "f5": "Consultations a month", "f6": "9", "f7": "57", "f8": "", "f9": "2024", "f10": "Weekly LinkedIn posts and long-form guides that rank and get shared by clients.", "img": "https://framerusercontent.com/images/csWXqRpXZMLSqxx74oKZj5QkJw.webp", "n1": "6"}]
}
const SW_BUILD = "RwWork@cms1"
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

// ===== RwWork =====
interface WorkProps extends Pal {
  customFonts: boolean; displayFont: any; bodyFont: any; monoFont: any; bpHint: string
  eyebrow: string; heading: string; intro: string; button: string; buttonLink: string
  readLabel: string; dragLabel: string; beforeLabel: string; afterLabel: string; sliderLabel: string; autoplay: boolean; style?: CSSProperties
}
// ---- THE BEFORE / AFTER: one big case viewer. The cover photo is shown twice — BEFORE (greyscale, dark, a flat line, the old number as a ghost) and
// AFTER (full colour, a rising line, the new number huge in lime) — split by a draggable divider. As the viewer crosses the viewport the divider slides
// from 85% to 15% (AFTER takes over) and the AFTER number counts from Before to After in step with it. Drag / arrow keys take over. Client chips switch
// the case (crossfade + the divider replays); the next case plays every 7 s while the viewer is in view and not hovered. NOT pinned. ----
const wkParse = (s: string) => { const m = String(s || "").trim().match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/); if (!m) return null; const raw = m[2]; return { pre: m[1], n: parseFloat(raw.replace(/,/g, "")), dec: (raw.split(".")[1] || "").length, grp: raw.includes(","), suf: m[3] } }
const wkFmt = (n: number, dec: number, grp: boolean) => n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: grp || Math.abs(n) >= 10000 })
const wkHash = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }
// a growth line across the whole viewer (viewBox 1000 × 300): low on the left, high on the right, a seeded wiggle so it never reads as a ramp
const wkRise = (slug: string) => { const h = wkHash(slug); const N = 13; const pts: [number, number][] = []
  for (let i = 0; i < N; i++) { const t = i / (N - 1); const base = 276 - Math.pow(t, 1.7) * 236; const wig = i === 0 || i === N - 1 ? 0 : (((h >> (i % 10) * 3) & 7) - 3.5) * 7; pts.push([t * 1000, Math.max(22, Math.min(290, base + wig))]) }
  let d = `M${pts[0][0]},${pts[0][1]}`; for (let i = 1; i < N; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}` }
  return { d, end: pts[N - 1] } }
const wkFlat = (slug: string) => { const h = wkHash(slug + "b"); let d = "M0,262"; for (let i = 1; i <= 12; i++) { const y = 262 + (((h >> (i % 10) * 3) & 7) - 3.5) * 2.2; d += ` L${(i / 12) * 1000},${y.toFixed(1)}` } return d }
const DV0 = 0.85, DV1 = 0.15
export default function RwWork(props: WorkProps) {
  const { eyebrow = "(03) Case studies", heading = "Results you can|*count*.", intro = "Six clients, six channels, one habit: we report the number that pays the bills, before and after.", button = "All case studies", buttonLink = "/work",
    readLabel = "Read the case", dragLabel = "Drag", beforeLabel = "Before", afterLabel = "After", sliderLabel = "Compare before and after", autoplay = true, bpHint = "auto" } = props
  const c = colorsOf(props); const { D, B, M } = fontsOf(props); useFonts(); const live = useLive(); const rm = useReduced(); const still = useStill()
  const rows = useCMS("work", SEED.work || []); const n = rows.length
  const root = useRef<HTMLElement>(null); const view = useRef<HTMLDivElement>(null); const handle = useRef<HTMLDivElement>(null); const numEl = useRef<HTMLSpanElement>(null); const chip = useRef<HTMLDivElement>(null)
  const { w } = useSize(root, bpHint); const phone = w < 810, tab = w >= 810 && w < 1100
  const on = useOn(root, live, rm)
  useScrollVars(root, live, rm)
  useMagnet(root, live)
  const final = still || rm || !live
  const [cur, setCur] = useState(0); const curR = useRef(0); const [prev, setPrev] = useState<{ i: number; dv: number } | null>(null)
  useEffect(() => { if (curR.current >= n && n > 0) { curR.current = 0; setCur(0) } }, [n])
  // engine state (refs: written by the rAF, never by React)
  const E = useRef({ mode: "scroll" as "scroll" | "replay" | "manual" | "hold", dv: final ? 0.5 : DV0, man: 0.5, r0: 0, st: 0, inView: false })
  const [run, setRun] = useState(false) // auto-advance clock running (in view, past the reveal, not paused)
  const [paused, setPaused] = useState(false); const hovV = useRef(false); const focV = useRef(false)
  const row = rows[cur] || ({} as CmsRow)
  const A = wkParse(row.f7), Bn = wkParse(row.f6); const unit = row.f8 || ""
  const txtAt = (t: number) => { if (!A) return `${row.f7 || ""}${unit}`; const from = Bn ? Bn.n : 0; return `${A.pre}${wkFmt(from + (A.n - from) * t, A.dec, A.grp)}${A.suf}${unit}` }
  const go = (i: number) => { if (n < 1) return; const j = ((i % n) + n) % n; if (j === curR.current) return; const dvNow = E.current.dv; setPrev({ i: curR.current, dv: dvNow }); curR.current = j; setCur(j)
    const e = E.current; if (!final) { e.mode = "replay"; e.r0 = performance.now(); e.dv = DV0 } }
  useEffect(() => { if (!prev) return; const t = window.setTimeout(() => setPrev(null), 900); return () => window.clearTimeout(t) }, [prev])
  // ---- the divider engine ----
  useEffect(() => {
    const V = view.current; if (!V) return
    const e = E.current; let top = 0, h = 1, vh = 1, fresh = false, vis = true, lastDv = -1, lastTxt = "", lastAria = -1, lastRun = false
    if (final) { V.style.setProperty("--dv", "0.5"); V.style.setProperty("--dt", "1"); if (numEl.current) numEl.current.textContent = `${row.f7 || ""}${unit}`; handle.current?.setAttribute("aria-valuenow", "50"); return }
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; e.inView = es[0].intersectionRatio > 0.35; if (!vis && e.mode !== "scroll") e.mode = "scroll" }, { threshold: [0, 0.35, 0.6], rootMargin: "10% 0px 10% 0px" }); io.observe(V)
    const read = () => { if (!vis) { fresh = false; return } const r = V.getBoundingClientRect(); top = r.top; h = r.height; vh = window.innerHeight || 1; fresh = true }
    const off = onTick((now) => { if (!fresh) return
      // scroll: 0 when the viewer's top is at 88% of the viewport, 1 when it is at 12% (or when its bottom reaches 70% on short screens)
      const span = Math.max(80, Math.min(vh * 0.76, vh * 0.88 - (vh * 0.7 - h)))
      e.st = clamp01((vh * 0.88 - top) / span)
      let want: number
      if (e.mode === "manual") want = e.man
      else if (e.mode === "replay") { const k = clamp01((now - e.r0) / 1700); want = DV0 + (DV1 - DV0) * easeIO(k); if (k >= 1) e.mode = "hold" }
      else if (e.mode === "hold") want = DV1
      else want = DV0 + (DV1 - DV0) * e.st
      e.dv = e.mode === "manual" || e.mode === "replay" || lastDv < 0 ? want : e.dv + (want - e.dv) * 0.2
      if (Math.abs(e.dv - want) < 0.0006) e.dv = want
      if (Math.abs(e.dv - lastDv) > 0.0004 || (e.dv === want && e.dv !== lastDv)) { lastDv = e.dv; V.style.setProperty("--dv", e.dv.toFixed(4)); const t = clamp01((DV0 - e.dv) / (DV0 - DV1)); V.style.setProperty("--dt", t.toFixed(4))
        const tx = txtAt(t); if (tx !== lastTxt && numEl.current) { lastTxt = tx; numEl.current.textContent = tx }
        const a = Math.round(e.dv * 100); if (a !== lastAria && handle.current) { lastAria = a; handle.current.setAttribute("aria-valuenow", String(a)); handle.current.setAttribute("aria-valuetext", `${100 - a}% after`) } }
      const r = autoplay && n > 1 && e.inView && (e.mode !== "scroll" || e.st > 0.94)
      if (r !== lastRun) { lastRun = r; setRun(r) } }, read)
    return () => { off(); io.disconnect() }
  }, [final, cur, n, row.f6, row.f7, unit, autoplay])
  // ---- drag (pointer; horizontal intent only, so a phone can still scroll the page vertically) + DRAG cursor chip ----
  useEffect(() => {
    const V = view.current; if (!V || !live) return
    let id = -1, x0 = 0, y0 = 0, drag = false, cx = 0, cy = 0, tx = 0, ty = 0, inside = false
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches
    const setFrom = (x: number) => { const r = V.getBoundingClientRect(); const e = E.current; e.mode = "manual"; e.man = Math.min(0.97, Math.max(0.03, (x - r.left) / r.width)); if (finalR.current) putStatic(e.man) }
    const dn = (ev: PointerEvent) => { if ((ev.target as HTMLElement).closest?.("a")) return; id = ev.pointerId; x0 = ev.clientX; y0 = ev.clientY; drag = ev.pointerType === "mouse" || (ev.target as HTMLElement).closest?.(".rwwk-handle") !== null; if (drag) { try { V.setPointerCapture(id) } catch (x) {} setFrom(ev.clientX); V.classList.add("is-drag") } }
    const mv = (ev: PointerEvent) => { const r = V.getBoundingClientRect(); tx = ev.clientX - r.left; ty = ev.clientY - r.top; if (!inside) { cx = tx; cy = ty } inside = true
      if (ev.pointerId !== id) return; if (!drag && Math.abs(ev.clientX - x0) > 8 && Math.abs(ev.clientX - x0) > Math.abs(ev.clientY - y0)) { drag = true; try { V.setPointerCapture(id) } catch (x) {} V.classList.add("is-drag") } if (drag) setFrom(ev.clientX) }
    const up = () => { id = -1; drag = false; V.classList.remove("is-drag") }
    const lv = () => { inside = false }
    V.addEventListener("pointerdown", dn); V.addEventListener("pointermove", mv); V.addEventListener("pointerup", up); V.addEventListener("pointercancel", up); V.addEventListener("pointerleave", lv)
    const off = fine ? onTick(() => { const ch = chip.current; if (!ch || !inside) return; cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22; ch.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)` }) : () => {}
    return () => { off(); V.removeEventListener("pointerdown", dn); V.removeEventListener("pointermove", mv); V.removeEventListener("pointerup", up); V.removeEventListener("pointercancel", up); V.removeEventListener("pointerleave", lv) }
  }, [live])
  // reduced motion / static: no engine runs — a drag or a key moves the divider directly (the AFTER number stays final)
  const finalR = useRef(final); finalR.current = final
  const putStatic = (v: number) => { const V = view.current; if (!V) return; V.style.setProperty("--dv", v.toFixed(3)); const a = Math.round(v * 100); handle.current?.setAttribute("aria-valuenow", String(a)); handle.current?.setAttribute("aria-valuetext", `${100 - a}% after`) }
  const onHandleKey = (ev: any) => { const e = E.current; const k = ev.key; let v = e.mode === "manual" ? e.man : e.dv
    if (k === "ArrowLeft" || k === "ArrowDown") v -= 0.05; else if (k === "ArrowRight" || k === "ArrowUp") v += 0.05; else if (k === "Home") v = 0.03; else if (k === "End") v = 0.97; else if (k === "PageDown") v -= 0.2; else if (k === "PageUp") v += 0.2; else return
    ev.preventDefault(); e.mode = "manual"; e.man = Math.min(0.97, Math.max(0.03, v)); if (final) putStatic(e.man) }
  const onTabKey = (ev: any, i: number) => { const k = ev.key; const j = k === "ArrowRight" || k === "ArrowDown" ? i + 1 : k === "ArrowLeft" || k === "ArrowUp" ? i - 1 : k === "Home" ? 0 : k === "End" ? n - 1 : null; if (j === null) return; ev.preventDefault(); const t = ((j % n) + n) % n; go(t); root.current?.querySelectorAll<HTMLElement>(".rwwk-tab")[t]?.focus() }
  const pauseOn = () => { const p = hovV.current || focV.current; setPaused(p) }
  const hoverProps = { onPointerEnter: (e: any) => { if (e.pointerType === "mouse") { hovV.current = true; pauseOn() } }, onPointerLeave: () => { hovV.current = false; pauseOn() }, onFocus: () => { focV.current = true; pauseOn() }, onBlur: (e: any) => { if (!e.currentTarget.contains(e.relatedTarget)) { focV.current = false; pauseOn() } } }
  const layer = (r: CmsRow, i: number, key: string, cls: string, style?: CSSProperties, numRef?: boolean) => { const img = RS(imgOr(r), phone ? "100vw" : "(max-width: 1099px) 100vw, 92vw"); const rise = wkRise(r.slug || String(i)); const flat = wkFlat(r.slug || String(i))
    return (
      <div key={key} className={`rwwk-case ${cls}`} style={style} aria-hidden={cls.includes("is-out") ? true : undefined}>
        <div className="rwwk-lay rwwk-after">
          <img src={img.src} srcSet={(img as any).srcSet} sizes={(img as any).sizes} alt="" loading="lazy" decoding="async" draggable={false} />
          <i className="rwwk-scrim" />
          <svg className="rwwk-ch rwwk-ch-a" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden><defs><linearGradient id={`rwwk-g-${key}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--rw-brass)" stopOpacity=".42" /><stop offset="1" stopColor="var(--rw-brass)" stopOpacity="0" /></linearGradient></defs><path d={`${rise.d} L1000,300 L0,300 Z`} fill={`url(#rwwk-g-${key})`} /><path d={rise.d} className="rwwk-ln" vectorEffect="non-scaling-stroke" /></svg>
          <div className="rwwk-num rwwk-num-a"><span className="rwwk-pill is-a" style={M}><i />{afterLabel}</span><span className="rwwk-big" style={D}>{numRef ? <span ref={numEl}>{`${r.f7 || ""}${r.f8 || ""}`}</span> : `${r.f7 || ""}${r.f8 || ""}`}</span></div>
        </div>
        <div className="rwwk-lay rwwk-before">
          <img src={img.src} srcSet={(img as any).srcSet} sizes={(img as any).sizes} alt="" loading="lazy" decoding="async" draggable={false} />
          <i className="rwwk-scrim" />
          <svg className="rwwk-ch rwwk-ch-b" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden><path d={flat} className="rwwk-fl" vectorEffect="non-scaling-stroke" /></svg>
          <div className="rwwk-num rwwk-num-b"><span className="rwwk-pill" style={M}>{beforeLabel}</span><span className="rwwk-ghost" style={D}>{`${r.f6 || ""}${r.f8 || ""}`}</span></div>
        </div>
      </div>) }
  return (
    <section ref={root as any} className={`rw rw-dark rw-sec rwwk${phone ? " is-ph" : tab ? " is-tab" : ""}${on ? " is-on" : ""}${final ? " is-fin" : ""}`} style={{ ...cssVars(c), ...B, ...(props.style || {}) }}>
      <link rel="stylesheet" href={FONTS} /><style dangerouslySetInnerHTML={{ __html: CSS_BASE + CSS_MOTION + CSS_WK + siteFontCss(props) }} />
      <div className="rw-wrap">
        <header className="rwwk-head">
          <div className="rwwk-hl"><Eyebrow text={eyebrow} on={on} M={M} /><Head text={heading} on={on} D={D} size={phone ? "clamp(40px,11vw,48px)" : "clamp(40px,4.6vw,68px)"} lh={0.95} delay={80} /></div>
          <div className="rwwk-hr" style={rise(on, 300, 14)}>{intro && <p>{intro}</p>}{button && <Btn href={buttonLink || "/work"} label={button} kind="ghost" />}</div>
        </header>
        {n > 0 && (<div className="rwwk-main" {...hoverProps}>
          {n > 1 && (
            <div className="rwwk-tabs" role="tablist" aria-label="Case studies" style={rise(on, 360, 16)} onFocus={(e: any) => { const sc = e.currentTarget as HTMLElement; if (sc.scrollWidth > sc.clientWidth + 1) try { (e.target as HTMLElement).scrollIntoView({ block: "nearest", inline: "nearest" }) } catch (x) {} }}>
              {rows.map((r, i) => { const sel = i === cur; const im = RS(imgOr(r), "40px"); return (
                <button key={r.slug || i} type="button" role="tab" id={`rwwk-t-${i}`} aria-selected={sel} aria-controls="rwwk-panel" tabIndex={sel ? 0 : -1} className={`rwwk-tab${sel ? " is-sel" : ""}`} onClick={() => go(i)} onKeyDown={(e) => onTabKey(e, i)}>
                  <img src={im.src} srcSet={(im as any).srcSet} sizes="40px" alt="" loading="lazy" decoding="async" draggable={false} />
                  <span className="rwwk-tab-t"><b>{r.f1}</b><small style={M}>{r.f6}{r.f8} → {r.f7}{r.f8}</small></span>
                  {sel && <i key={`p${cur}`} className={`rwwk-prog${run && !paused && !final ? " is-run" : ""}`} onAnimationEnd={() => go(cur + 1)} aria-hidden />}
                </button>) })}
            </div>)}
          <div ref={view} className="rwwk-view" style={{ ...rise(on, 420, 30), ["--dv" as any]: final ? 0.5 : DV0, ["--dt" as any]: final ? 1 : 0 }}>
            {prev && rows[prev.i] && layer(rows[prev.i], prev.i, `o${prev.i}`, "is-out", { ["--dv" as any]: prev.dv.toFixed(3), ["--dt" as any]: clamp01((DV0 - prev.dv) / (DV0 - DV1)).toFixed(3) } as any)}
            {layer(row, cur, `c${cur}`, prev ? "is-in" : "", undefined, true)}
            <div className="rwwk-top" style={M}><span className="rwwk-cl"><i className="rw-port" />{row.f1}{row.f9 ? ` · ${row.f9}` : ""}</span><span className="rwwk-ml">{row.f5}</span></div>
            <div className="rwwk-div" aria-hidden><i /></div>
            <div ref={handle} className="rwwk-handle" role="slider" tabIndex={0} aria-label={sliderLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={final ? 50 : Math.round(DV0 * 100)} aria-valuetext={final ? "50% after" : undefined} onKeyDown={onHandleKey}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div ref={chip} className="rwwk-cur" aria-hidden><b style={M}>{dragLabel}</b></div>
          </div>
          <div className="rwwk-info" id="rwwk-panel" role={n > 1 ? "tabpanel" : undefined} aria-labelledby={n > 1 ? `rwwk-t-${cur}` : undefined} style={rise(on, 480, 18)}>
            <div key={`i${cur}`} className="rwwk-info-in">
              <div className="rwwk-il">
                <p className="rwwk-meta" style={M}><span>{row.f3}</span>{row.f9 && <span>{row.f9}</span>}</p>
                <h3 className="rwwk-title" style={D}><a href={`/work/${row.slug || ""}`}>{row.f2}</a></h3>
              </div>
              <div className="rwwk-ir">
                {row.f10 && <p className="rwwk-sum">{row.f10}</p>}
                <div className="rwwk-foot">
                  <span className="rwwk-svs" style={M}>{listOf(row.f4).map((s, k) => <span key={k}>{s}</span>)}</span>
                  <a className="rwwk-read" href={`/work/${row.slug || ""}`} style={M}>{readLabel}<IcoArrow s={14} /></a>
                </div>
              </div>
            </div>
          </div>
        </div>)}
      </div>
    </section>
  )
}
const CSS_WK = `
.rwwk{background:var(--rw-night);color:var(--rw-cloud);padding:clamp(88px,9vw,150px) 0 clamp(96px,10vw,160px);overflow-x:clip}
.rwwk .rw-eb i{position:relative} .rwwk .rw-eb i::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 1.5px var(--rw-brass);animation:rwwk-ping 1.8s cubic-bezier(.2,.6,.3,1) infinite} @keyframes rwwk-ping{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.8)}}
.rwwk .rw-hd{font-weight:var(--rw-font-dw,700);letter-spacing:-.045em} .rwwk .rw-it{font-weight:inherit;color:var(--rw-brass)}
.rwwk-head{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:end;gap:40px;margin-bottom:clamp(40px,4.4vw,64px)}
.rwwk-hl{display:flex;flex-direction:column;gap:26px;align-items:flex-start}
.rwwk-hr{display:flex;flex-direction:column;align-items:flex-start;gap:24px;justify-self:end;max-width:400px} .rwwk-hr p{margin:0;font-size:17px;line-height:1.5;color:var(--rw-mut)} .rwwk-hr .rw-btn{--ring:var(--rw-night)}
/* tabs */
.rwwk-tabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:12px}
.rwwk-tab{all:unset;box-sizing:border-box;position:relative;display:flex;align-items:center;gap:11px;min-width:0;padding:8px 12px 8px 8px;border-radius:999px;cursor:pointer;color:var(--rw-cloud);background:color-mix(in srgb,var(--rw-cloud) 6%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 12%,transparent);overflow:hidden;transition:background .35s,box-shadow .35s,color .35s}
.rwwk-tab img{width:40px;height:40px;flex:none;border-radius:50%;object-fit:cover;filter:grayscale(1) brightness(.8);transition:filter .5s}
.rwwk-tab-t{display:flex;flex-direction:column;gap:3px;min-width:0} .rwwk-tab-t b{font-size:13.5px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .rwwk-tab-t small{font-size:10.5px;letter-spacing:.02em;color:color-mix(in srgb,var(--rw-cloud) 60%,transparent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rwwk-tab:hover{background:color-mix(in srgb,var(--rw-cloud) 11%,transparent)} .rwwk-tab:hover img{filter:none}
.rwwk-tab.is-sel{background:var(--rw-cloud);color:var(--rw-ink);box-shadow:none} .rwwk-tab.is-sel img{filter:none} .rwwk-tab.is-sel small{color:color-mix(in srgb,var(--rw-ink) 62%,transparent)}
.rwwk-prog{position:absolute;left:16px;right:16px;bottom:0;height:3px;border-radius:3px;background:var(--rw-brass);box-shadow:0 0 0 .5px var(--rw-ink);transform:scaleX(0);transform-origin:left;animation:rwwk-prog 7s linear forwards;animation-play-state:paused}
.rwwk-prog.is-run{animation-play-state:running} @keyframes rwwk-prog{to{transform:scaleX(1)}}
.rwwk.is-fin .rwwk-prog{display:none}
/* the viewer */
.rwwk-view{position:relative;aspect-ratio:16/8;max-height:78svh;width:100%;border-radius:24px;overflow:hidden;background:var(--rw-pine);touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:ew-resize;isolation:isolate;--dv:.85;--dt:0}
.rwwk-case{position:absolute;inset:0}
.rwwk-case.is-in{animation:rwwk-in .8s ease both} .rwwk-case.is-out{z-index:2;animation:rwwk-out .8s ease both;pointer-events:none} @keyframes rwwk-in{from{opacity:0}} @keyframes rwwk-out{to{opacity:0}}
.rwwk-lay{position:absolute;inset:0;overflow:hidden}
.rwwk-lay img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.rwwk-after img{scale:calc(1.08 - var(--dt)*.08);transition:scale .2s linear}
.rwwk-before{clip-path:inset(0 calc((1 - var(--dv))*100%) 0 0)}
.rwwk-before img{filter:grayscale(1) brightness(.46) contrast(1.08)}
.rwwk-scrim{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.42),transparent 26%,transparent 46%,rgba(0,0,0,.72))}
.rwwk-before .rwwk-scrim{background:linear-gradient(180deg,rgba(0,0,0,.4),transparent 30%,rgba(0,0,0,.55))}
.rwwk-ch{position:absolute;left:0;right:0;bottom:0;width:100%;height:58%;overflow:visible;pointer-events:none}
.rwwk-ch-a{transform-origin:50% 100%;transform:scaleY(calc(.14 + var(--dt)*.86))}
.rwwk-ln{fill:none;stroke:var(--rw-brass);stroke-width:3;stroke-linejoin:round;filter:drop-shadow(0 0 10px color-mix(in srgb,var(--rw-brass) 70%,transparent))}
.rwwk-fl{fill:none;stroke:color-mix(in srgb,var(--rw-cloud) 55%,transparent);stroke-width:2;stroke-dasharray:6 7}
.rwwk-num{position:absolute;bottom:clamp(22px,3vw,40px);display:flex;flex-direction:column;gap:12px}
.rwwk-num-a{right:clamp(22px,3vw,44px);align-items:flex-end;text-align:right}
.rwwk-num-b{left:clamp(22px,3vw,44px);bottom:clamp(76px,8vw,118px);align-items:flex-start}
.rwwk-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in srgb,var(--rw-cloud) 80%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 34%,transparent);background:color-mix(in srgb,var(--rw-night) 30%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.rwwk-pill.is-a{background:var(--rw-brass);color:var(--rw-ink);box-shadow:none} .rwwk-pill.is-a i{width:7px;height:7px;border-radius:50%;background:#FF3E88}
.rwwk-big{font-size:clamp(84px,10.4vw,176px);line-height:.84;letter-spacing:-.06em;font-weight:var(--rw-font-dw,700);color:var(--rw-brass);font-variant-numeric:tabular-nums;white-space:nowrap;text-shadow:0 6px 50px rgba(0,0,0,.35)}
.rwwk-ghost{font-size:clamp(44px,4.8vw,80px);line-height:.9;letter-spacing:-.05em;font-weight:var(--rw-font-dw,700);color:transparent;-webkit-text-stroke:1.4px color-mix(in srgb,var(--rw-cloud) 70%,transparent);white-space:nowrap}
.rwwk-top{position:absolute;z-index:4;left:clamp(16px,2vw,26px);right:clamp(16px,2vw,26px);top:clamp(16px,2vw,24px);display:flex;justify-content:space-between;gap:12px;pointer-events:none;font-size:11.5px;letter-spacing:.06em}
.rwwk-cl{display:inline-flex;align-items:center;gap:9px;padding:8px 14px 8px 12px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);white-space:nowrap}
.rwwk-ml{display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;text-transform:uppercase;letter-spacing:.12em;font-size:10.5px;background:color-mix(in srgb,var(--rw-night) 40%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 22%,transparent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rwwk-div{position:absolute;z-index:3;top:0;bottom:0;left:calc(var(--dv)*100%);width:0;pointer-events:none} .rwwk-div i{position:absolute;top:0;bottom:0;left:-1px;width:2px;background:var(--rw-cloud);box-shadow:0 0 0 1px rgba(0,0,0,.12),0 0 24px 2px color-mix(in srgb,var(--rw-brass) 55%,transparent)}
.rwwk-handle{position:absolute;z-index:5;top:50%;left:calc(var(--dv)*100%);width:64px;height:64px;translate:-50% -50%;display:grid;place-items:center;border-radius:50%;color:var(--rw-cloud);background:color-mix(in srgb,var(--rw-night) 55%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 0 0 2px var(--rw-brass),0 12px 30px -8px rgba(0,0,0,.6);cursor:ew-resize;transition:scale .5s cubic-bezier(.34,1.56,.64,1),background .3s}
.rwwk-handle::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px var(--rw-brass);animation:rwwk-hp 2.2s cubic-bezier(.2,.6,.3,1) infinite} @keyframes rwwk-hp{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.75)}}
.rwwk-handle svg{width:24px;height:24px}
.rwwk-view:hover .rwwk-handle,.rwwk-view.is-drag .rwwk-handle,.rwwk-handle:focus-visible{scale:1.22;background:var(--rw-brass);color:var(--rw-ink)}
.rwwk-cur{position:absolute;z-index:6;left:0;top:0;pointer-events:none;opacity:0;transition:opacity .25s} .rwwk-cur b{display:block;translate:18px 18px;padding:7px 12px;border-radius:999px;background:var(--rw-cloud);color:var(--rw-ink);font-size:10.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 10px 24px -10px rgba(0,0,0,.6)}
@media (hover:hover) and (pointer:fine){.rwwk-view:hover .rwwk-cur{opacity:1}}
/* info */
.rwwk-info{margin-top:clamp(24px,2.6vw,36px)}
.rwwk-info-in{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:clamp(28px,4vw,72px);align-items:start;animation:rwwk-info .8s cubic-bezier(.2,.8,.2,1) both} @keyframes rwwk-info{from{opacity:0;translate:0 12px}}
.rwwk-meta{display:flex;gap:10px;margin:0 0 14px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--rw-mut)} .rwwk-meta span+span::before{content:"·";margin-right:10px}
.rwwk-title{margin:0;font-size:clamp(28px,2.6vw,40px);line-height:1.04;letter-spacing:-.04em;font-weight:var(--rw-font-dw,700);text-wrap:balance} .rwwk-title a{text-decoration:none;background:linear-gradient(var(--rw-brass),var(--rw-brass)) 0 100%/0 2px no-repeat;transition:background-size .6s cubic-bezier(.2,.8,.2,1)} .rwwk-title a:hover{background-size:100% 2px}
.rwwk-sum{margin:0 0 20px;font-size:17px;line-height:1.5;color:color-mix(in srgb,var(--rw-cloud) 80%,transparent);max-width:46ch}
.rwwk-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px}
.rwwk-svs{display:flex;flex-wrap:wrap;gap:6px} .rwwk-svs span{padding:6px 12px;border-radius:999px;font-size:11px;letter-spacing:.06em;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--rw-cloud) 24%,transparent)}
.rwwk-read{display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border-radius:999px;background:var(--rw-brass);color:var(--rw-ink);font-size:12px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;transition:gap .4s cubic-bezier(.34,1.56,.64,1)} .rwwk-read:hover{gap:16px}
/* tablet */
.rwwk.is-tab .rwwk-head{grid-template-columns:1fr;align-items:start} .rwwk.is-tab .rwwk-hr{justify-self:start;max-width:560px}
.rwwk.is-tab .rwwk-tabs{grid-template-columns:repeat(3,minmax(0,1fr))} .rwwk.is-tab .rwwk-view{aspect-ratio:4/3} .rwwk.is-tab .rwwk-info-in{grid-template-columns:1fr;gap:18px}
/* phone */
.rwwk.is-ph{padding:80px 0 88px}
.rwwk.is-ph .rwwk-head{grid-template-columns:1fr;gap:24px;margin-bottom:32px} .rwwk.is-ph .rwwk-hr{justify-self:stretch;max-width:none} .rwwk.is-ph .rwwk-hr p{font-size:16px}
.rwwk.is-ph .rwwk-tabs{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin:-4px -20px 8px;padding:6px 20px;scroll-padding:0 20px} .rwwk.is-ph .rwwk-tabs::-webkit-scrollbar{display:none}
.rwwk.is-ph .rwwk-tab{flex:none;width:auto;max-width:240px;scroll-snap-align:start}
.rwwk.is-ph .rwwk-view{aspect-ratio:4/5;max-height:none;border-radius:20px}
.rwwk.is-ph .rwwk-ch{height:46%} .rwwk.is-ph .rwwk-big{font-size:clamp(56px,17vw,76px)} .rwwk.is-ph .rwwk-ghost{font-size:32px;-webkit-text-stroke-width:1.1px}
.rwwk.is-ph .rwwk-num{bottom:18px;gap:8px} .rwwk.is-ph .rwwk-num-a{right:16px} .rwwk.is-ph .rwwk-num-b{left:16px;bottom:auto;top:66px}
.rwwk.is-ph .rwwk-ml{display:none} .rwwk.is-ph .rwwk-handle{width:54px;height:54px}
.rwwk.is-ph .rwwk-info-in{grid-template-columns:1fr;gap:16px} .rwwk.is-ph .rwwk-title{font-size:28px} .rwwk.is-ph .rwwk-sum{font-size:16px}
@media (prefers-reduced-motion:reduce){.rwwk-case.is-in,.rwwk-case.is-out,.rwwk-info-in{animation:none!important}}
`
addPropertyControls(RwWork, {
  ...COLOR_CONTROLS, ...FONT_CONTROLS, ...BP_CONTROL,
  eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "(03) Case studies" },
  heading: { type: ControlType.String, title: "Heading", description: "| = line break, *words* = lime", defaultValue: "Results you can|*count*.", displayTextArea: true },
  intro: { type: ControlType.String, title: "Intro", defaultValue: "Six clients, six channels, one habit: we report the number that pays the bills, before and after.", displayTextArea: true },
  button: { type: ControlType.String, title: "Button", defaultValue: "All case studies" },
  buttonLink: { type: ControlType.Link, title: "Button link", defaultValue: "/work" },
  readLabel: { type: ControlType.String, title: "Case link", defaultValue: "Read the case" },
  dragLabel: { type: ControlType.String, title: "Cursor chip", defaultValue: "Drag" },
  beforeLabel: { type: ControlType.String, title: "Before label", defaultValue: "Before" },
  afterLabel: { type: ControlType.String, title: "After label", defaultValue: "After" },
  sliderLabel: { type: ControlType.String, title: "Slider name", description: "Read out by screen readers", defaultValue: "Compare before and after" },
  autoplay: { type: ControlType.Boolean, title: "Auto-advance", description: "Next case every 7 s while in view", defaultValue: true },
})
