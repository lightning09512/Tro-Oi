import { RouterProvider } from "react-router"
import { router } from "@/routes"
import { AuthProvider } from "@/contexts/AuthContext"
import { PlatformProvider } from "@/contexts/PlatformContext"
import { FavoritesProvider } from "@/contexts/FavoritesContext"
import PlatformStatusBanner from "@/components/layout/PlatformStatusBanner"

export default function App() {
  return (
    <AuthProvider>
      <PlatformProvider>
        <PlatformStatusBanner />
        <FavoritesProvider>
          <RouterProvider router={router} />
        </FavoritesProvider>
      </PlatformProvider>
    </AuthProvider>
  )
}

