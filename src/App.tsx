import { RouterProvider } from "react-router"
import { AuthProvider } from "@/contexts/AuthContext"
import { FavoritesProvider } from "@/contexts/FavoritesContext"
import { PlatformProvider } from "@/contexts/PlatformContext"
import { ToastProvider } from "@/contexts/ToastContext"
import { router } from "@/routes"
import PlatformStatusBanner from "@/components/layout/PlatformStatusBanner"
import ErrorBoundary from "@/components/common/ErrorBoundary"
import ChatbotWidget from "./components/common/ChatbotWidget"

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PlatformProvider>
          <PlatformStatusBanner />
          <ToastProvider>
            <FavoritesProvider>
              <RouterProvider router={router} />
              <ChatbotWidget />
            </FavoritesProvider>
          </ToastProvider>
        </PlatformProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
