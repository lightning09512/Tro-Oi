import { useEffect, useRef, type RefObject } from "react"

let scrollLocks = 0
let previousOverflow = ""

/** Keep keyboard focus in a mounted modal and restore its opening control. */
export default function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled = true,
) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const dialog = ref.current
    if (!enabled || !dialog) return
    const previousFocus = document.activeElement as HTMLElement | null
    if (scrollLocks++ === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
    }
    const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.getClientRects().length > 0 && !element.closest('[hidden], [inert]'))
    const frame = requestAnimationFrame(() => {
      dialog.tabIndex = -1
      ;(controls()[0] ?? dialog).focus({ preventScroll: true })
    })
    const onKeyDown = (event: KeyboardEvent) => {
      const modals = document.querySelectorAll('[role="dialog"][aria-modal="true"]')
      if (modals.length && modals[modals.length - 1] !== dialog) return
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        closeRef.current()
      }
      if (event.key === "Tab") {
        const items = controls()
        const first = items[0] ?? dialog
        const last = items[items.length - 1] ?? dialog
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("keydown", onKeyDown)
      if (--scrollLocks === 0) document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [enabled, ref])
}
