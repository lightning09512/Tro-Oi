import { Outlet, useLocation } from "react-router"
import MainHeader from "@/components/layout/MainHeader"
import SiteFooter from "@/components/layout/SiteFooter"
import FloatingMascotWidget from "@/components/common/FloatingMascotWidget"
import ChatbotWidget from "@/components/common/ChatbotWidget"
import BottomNavigation from "@/components/layout/BottomNavigation"
import useScrollToTop from "@/hooks/useScrollToTop"

export default function MainLayout() {
  const { pathname } = useLocation()
  useScrollToTop()
  const isAuthPage = pathname === "/dang-nhap" || pathname === "/dang-ky" || pathname === "/quen-mat-khau" || pathname === "/dat-lai-mat-khau"
  const isFocusedWorkspace = isAuthPage || pathname === "/tin-nhan" || pathname === "/chu-tro/dang-tin" || /^\/chu-tro\/tin\/[^/]+\/chinh-sua$/.test(pathname)
  const isPublicContent = pathname === "/" || pathname === "/tim-phong" || pathname.startsWith("/phong/") || pathname === "/dien-dan" || pathname.startsWith("/bai-viet/")
  const isForum = pathname === "/dien-dan" || pathname.startsWith("/bai-viet/")
  const isRoomDetail = pathname.startsWith("/phong/")
  const isSearch = pathname === "/tim-phong"

  return (
    <>
      <MainHeader />
      <div id="main-content" className="content-route" tabIndex={-1}><Outlet /></div>
      {isPublicContent && <FloatingMascotWidget />}
      {!isFocusedWorkspace && <ChatbotWidget />}
      {!isFocusedWorkspace && <SiteFooter variant={isPublicContent ? "full" : "compact"} hidePromoBanner={isForum || isRoomDetail || isSearch} />}
      <BottomNavigation />
    </>
  )
}
