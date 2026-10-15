import { useEffect } from "react"
import { Outlet, useLocation } from "react-router"
import MainHeader from "./MainHeader"
import SiteFooter from "./SiteFooter"

export default function MainLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const isFocusedWorkspace = pathname === "/tin-nhan" ||
    pathname === "/chu-tro/dang-tin" ||
    /^\/chu-tro\/tin\/[^/]+\/chinh-sua$/.test(pathname)
  const isPublicContent = pathname === "/" || pathname === "/tim-phong" ||
    pathname.startsWith("/phong/") || pathname === "/dien-dan" ||
    pathname.startsWith("/bai-viet/")

  return (
    <div className="flex min-h-dvh flex-col">
      <MainHeader />
      <main id="main-content" className="flex flex-1 flex-col">
        <Outlet />
      </main>
      {!isFocusedWorkspace && <SiteFooter variant={isPublicContent ? "full" : "compact"} />}
    </div>
  )
}
