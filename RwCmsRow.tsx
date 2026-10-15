import type { CSSProperties } from "react"
import { addPropertyControls, ControlType } from "framer"
type RowProps = { kind: string; slug: string; f1: string; f2: string; f3: string; f4: string; f5: string; f6: string; f7: string; f8: string; f9: string; f10: string; f11: string; f12: string; f13: string; f14: string; f15: string; f16: string; n1: number; n2: number; img: any; img2: any; style?: CSSProperties }
const src = (v: any) => (v && typeof v === "object" ? String(v.src || "") : typeof v === "string" ? v : "")
/**
 * REACHWISE — CMS bridge row. One renders per CMS item inside a hidden Collection List in the Site Layout, so every page carries the live CMS and the sections read these rows. Do not place it by hand or delete the "CMS Bridge" layers.
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1
 * @framerIntrinsicHeight 1
 */
export default function RwCmsRow(props: RowProps) {
  const { kind = "", slug = "", f1 = "", f2 = "", f3 = "", f4 = "", f5 = "", f6 = "", f7 = "", f8 = "", f9 = "", f10 = "", f11 = "", f12 = "", f13 = "", f14 = "", f15 = "", f16 = "", n1 = 0, n2 = 0, img, img2 } = props
  return <span data-rw-row={kind} data-slug={slug} data-f1={f1} data-f2={f2} data-f3={f3} data-f4={f4} data-f5={f5} data-f6={f6} data-f7={f7} data-f8={f8} data-f9={f9} data-f10={f10} data-f11={f11} data-f12={f12} data-f13={f13} data-f14={f14} data-f15={f15} data-f16={f16} data-n1={String(n1)} data-n2={String(n2)} data-img={src(img)} data-img2={src(img2)} aria-hidden style={{ ...props.style, display: "block", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }} />
}
const N = (t: string) => ({ type: ControlType.Number as const, title: t, defaultValue: 0, min: -1000000, max: 1000000, step: 0.01 })
const F_ = (t: string) => ({ type: ControlType.String as const, title: t, defaultValue: "" })
addPropertyControls(RwCmsRow, {
  kind: F_("Kind"), slug: F_("Slug"), f1: F_("F1"), f2: F_("F2"), f3: F_("F3"), f4: F_("F4"), f5: F_("F5"), f6: F_("F6"), f7: F_("F7"), f8: F_("F8"), f9: F_("F9"), f10: F_("F10"), f11: F_("F11"), f12: F_("F12"), f13: F_("F13"), f14: F_("F14"), f15: F_("F15"), f16: F_("F16"),
  n1: N("N1"), n2: N("N2"), img: { type: ControlType.ResponsiveImage, title: "Img" }, img2: { type: ControlType.ResponsiveImage, title: "Img2" },
})
