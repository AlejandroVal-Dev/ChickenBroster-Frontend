"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Lock, User, ChefHat, ShoppingCart, BarChart3, Users } from "lucide-react"
import Image from "next/image"

// Datos de usuarios mock
const users = [
  { id: 1, username: "admin", password: "admin123", role: "admin", name: "Administrador" },
  { id: 2, username: "cajero", password: "cajero123", role: "cashier", name: "Cajero Principal" },
  { id: 3, username: "cocina", password: "cocina123", role: "kitchen", name: "Chef Principal" },
  { id: 4, username: "mesero", password: "mesero123", role: "waiter", name: "Mesero Principal" },
]

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Simular delay de autenticación
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user = users.find((u) => u.username === username && u.password === password)

    if (user) {
      // Guardar datos del usuario en localStorage
      localStorage.setItem("currentUser", JSON.stringify(user))
      router.push("/dashboard")
    } else {
      setError("Usuario o contraseña incorrectos")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Panel izquierdo - Información y branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-8 bg-gradient-to-br from-orange-600 to-amber-600 text-white">
        <div className="max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto relative">
              <Image
                src="/chickenbroster.png"
                alt="ChickenBroster Logo"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">ChickenBroster ERP</h1>
              <p className="text-xl text-orange-100">Sistema de Gestión Restaurante</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Gestiona tu restaurante de manera eficiente</h2>
            {/* Lista de características 
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                <ChefHat className="w-6 h-6 text-orange-200" />
                <div>
                  <h3 className="font-semibold">Gestión de Cocina</h3>
                  <p className="text-sm text-orange-100">Control de inventario y órdenes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-orange-200" />
                <div>
                  <h3 className="font-semibold">Punto de Venta</h3>
                  <p className="text-sm text-orange-100">Ventas rápidas y eficientes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-200" />
                <div>
                  <h3 className="font-semibold">Reportes y Analytics</h3>
                  <p className="text-sm text-orange-100">Análisis detallado de ventas</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                <Users className="w-6 h-6 text-orange-200" />
                <div>
                  <h3 className="font-semibold">Gestión de Personal</h3>
                  <p className="text-sm text-orange-100">Control de usuarios y roles</p>
                </div>
              </div>
            </div>
            */}
            <div className="grid grid-cols-2 gap-4 mt-6">
  <div className="bg-white/10 rounded-xl p-5 flex flex-col items-center text-center hover:bg-white/20 transition">
    <ChefHat className="w-8 h-8 text-orange-200 mb-2" />
    <h3 className="font-semibold text-white">Gestión de Cocina</h3>
    <p className="text-sm text-orange-100">Control de inventario y órdenes</p>
  </div>

  <div className="bg-white/10 rounded-xl p-5 flex flex-col items-center text-center hover:bg-white/20 transition">
    <ShoppingCart className="w-8 h-8 text-orange-200 mb-2" />
    <h3 className="font-semibold text-white">Punto de Venta</h3>
    <p className="text-sm text-orange-100">Ventas rápidas y eficientes</p>
  </div>

  <div className="bg-white/10 rounded-xl p-5 flex flex-col items-center text-center hover:bg-white/20 transition">
    <BarChart3 className="w-8 h-8 text-orange-200 mb-2" />
    <h3 className="font-semibold text-white">Reportes y Analytics</h3>
    <p className="text-sm text-orange-100">Análisis detallado de ventas</p>
  </div>

  <div className="bg-white/10 rounded-xl p-5 flex flex-col items-center text-center hover:bg-white/20 transition">
    <Users className="w-8 h-8 text-orange-200 mb-2" />
    <h3 className="font-semibold text-white">Gestión de Personal</h3>
    <p className="text-sm text-orange-100">Control de usuarios y roles</p>
  </div>
</div>

          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario de login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-2xl border-orange-200 bg-white dark:bg-gray-800">
          <CardHeader className="text-center space-y-4">
            {/* Logo para móviles */}
            <div className="lg:hidden mx-auto w-20 h-20 relative">
              <Image
                src="/chickenbroster.png"
                alt="ChickenBroster Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Iniciar Sesión
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Accede a tu cuenta
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-600" />
                  Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-600" />
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 h-11"
                  required
                />
              </div>
              
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
              )}
              
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 h-11 shadow-lg transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
