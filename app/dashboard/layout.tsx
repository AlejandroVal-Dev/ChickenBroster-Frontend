"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { LogOut, User, Menu, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { LogoVariants } from "@/components/chickenbroster-logo"

interface DashboardUser {
  id: number
  username: string
  role: string
  name: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/")
      return
    }
    setUser(JSON.parse(currentUser))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mx-auto mb-4">
            <LogoVariants.Loading />
          </div>
          <div className="text-orange-600 font-semibold">Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-orange-200 dark:border-orange-800
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <AppSidebar user={user} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border-b border-orange-200 dark:border-orange-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="lg:hidden text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                              <LogoVariants.Header />
                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  ChickenBroster ERP
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-2 text-sm bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
                <User className="h-4 w-4 text-orange-600" />
                <span className="hidden sm:inline font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
                <span className="text-orange-600/70">({user.role})</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-orange-300 text-orange-600 hover:bg-orange-600 hover:text-white bg-transparent"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Salir</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50/50 to-orange-50/20 dark:from-gray-900/50 dark:to-gray-800/50">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
