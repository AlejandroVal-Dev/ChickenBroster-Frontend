"use client"

import {
  ChefHat,
  ClipboardList,
  CreditCard,
  Home,
  Package,
  ShoppingCart,
  Users,
  Utensils,
  Warehouse,
  History,
  X,
  Shield,
  FolderOpen,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogoVariants } from "@/components/chickenbroster-logo"

interface User {
  id: number
  username: string
  role: string
  name: string
  permissions?: string[]
}

interface AppSidebarProps {
  user: User
  onClose?: () => void
}

// Sistema de permisos granular
const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    requiredPermissions: ["dashboard.view"],
  },
  {
    title: "Ventas",
    url: "/dashboard/sales",
    icon: ShoppingCart,
    requiredPermissions: ["sales.view", "sales.create"],
  },
  {
    title: "Órdenes",
    url: "/dashboard/orders",
    icon: ClipboardList,
    requiredPermissions: ["orders.view"],
  },
  {
    title: "Historial",
    url: "/dashboard/orders/history",
    icon: History,
    requiredPermissions: ["orders.history"],
  },
  {
    title: "Inventario",
    url: "/dashboard/inventory",
    icon: Warehouse,
    requiredPermissions: ["inventory.view"],
  },
  {
    title: "Cierre de Caja",
    url: "/dashboard/cash",
    icon: CreditCard,
    requiredPermissions: ["cash.view"],
  },
]

const managementItems = [
  {
    title: "Usuarios",
    url: "/dashboard/users",
    icon: Users,
    requiredPermissions: ["users.view"],
  },
  {
    title: "Roles",
    url: "/dashboard/roles",
    icon: Shield,
    requiredPermissions: ["roles.view"],
  },
  {
    title: "Categorías",
    url: "/dashboard/categories",
    icon: FolderOpen,
    requiredPermissions: ["categories.view"],
  },
  {
    title: "Productos",
    url: "/dashboard/products",
    icon: Utensils,
    requiredPermissions: ["products.view"],
  },
  {
    title: "Ingredientes",
    url: "/dashboard/ingredients",
    icon: ChefHat,
    requiredPermissions: ["ingredients.view"],
  },
  {
    title: "Mesas",
    url: "/dashboard/tables",
    icon: Package,
    requiredPermissions: ["tables.view"],
  },
]

// Permisos por rol (sistema de compatibilidad hacia atrás)
const rolePermissions = {
  admin: [
    "dashboard.view",
    "dashboard.stats",
    "sales.view",
    "sales.create",
    "sales.pos",
    "sales.discount",
    "orders.view",
    "orders.update",
    "orders.history",
    "orders.reprint",
    "inventory.view",
    "inventory.movements",
    "inventory.adjust",
    "inventory.reports",
    "cash.view",
    "cash.open",
    "cash.close",
    "cash.history",
    "products.view",
    "products.create",
    "products.edit",
    "products.delete",
    "products.prices",
    "ingredients.view",
    "ingredients.create",
    "ingredients.edit",
    "ingredients.delete",
    "tables.view",
    "tables.create",
    "tables.edit",
    "tables.delete",
    "tables.status",
    "users.view",
    "users.create",
    "users.edit",
    "users.delete",
    "users.roles",
    "roles.view",
    "roles.create",
    "roles.edit",
    "roles.delete",
    "roles.permissions",
    "categories.view",
    "categories.create",
    "categories.edit",
    "categories.delete",
    "reports.sales",
    "reports.inventory",
    "reports.financial",
    "reports.export",
    "settings.view",
    "settings.edit",
    "settings.backup",
  ],
  cashier: [
    "dashboard.view",
    "sales.view",
    "sales.create",
    "sales.pos",
    "orders.view",
    "orders.update",
    "cash.view",
    "cash.open",
    "cash.close",
    "products.view",
    "tables.view",
    "tables.status",
  ],
  kitchen: ["dashboard.view", "orders.view", "orders.update", "products.view", "ingredients.view", "inventory.view"],
  waiter: [
    "dashboard.view",
    "sales.view",
    "sales.create",
    "sales.pos",
    "orders.view",
    "orders.update",
    "products.view",
    "tables.view",
    "tables.status",
  ],
}

export function AppSidebar({ user, onClose }: AppSidebarProps) {
  const pathname = usePathname()

  // Obtener permisos del usuario (desde el usuario o por rol)
  const getUserPermissions = (): string[] => {
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions
    }
    // Fallback al sistema de roles anterior
    return rolePermissions[user.role as keyof typeof rolePermissions] || []
  }

  const userPermissions = getUserPermissions()

  const hasPermission = (requiredPermissions: string[]): boolean => {
    // Si no hay permisos requeridos, permitir acceso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    // Verificar si el usuario tiene al menos uno de los permisos requeridos
    return requiredPermissions.some((permission) => userPermissions.includes(permission))
  }

  const isActive = (url: string) => {
    return pathname === url
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header del sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-3">
          <LogoVariants.Sidebar />
          <div className="flex flex-col">
            <span className="text-sm font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              ChickenBroster
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Restaurante ERP</span>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Menú Principal */}
          <div>
            <h3 className="text-xs font-semibold text-orange-600/70 uppercase tracking-wider mb-3">Principal</h3>
            <div className="space-y-1">
              {menuItems.map(
                (item) =>
                  hasPermission(item.requiredPermissions) && (
                    <Link
                      key={item.title}
                      href={item.url}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                        ${
                          isActive(item.url)
                            ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/25"
                            : "text-gray-700 dark:text-gray-300 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20"
                        }
                      `}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  ),
              )}
            </div>
          </div>

          {/* Menú de Gestión */}
          {managementItems.some((item) => hasPermission(item.requiredPermissions)) && (
            <div>
              <h3 className="text-xs font-semibold text-orange-600/70 uppercase tracking-wider mb-3">Gestión</h3>
              <div className="space-y-1">
                {managementItems.map(
                  (item) =>
                    hasPermission(item.requiredPermissions) && (
                      <Link
                        key={item.title}
                        href={item.url}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                          ${
                            isActive(item.url)
                              ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/25"
                              : "text-gray-700 dark:text-gray-300 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20"
                          }
                        `}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    ),
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
        <div className="text-xs text-orange-600/70">
          Conectado como: <span className="font-medium text-orange-600">{user.name}</span>
        </div>
        <div className="text-xs text-orange-600/50 mt-1">
          Rol: {user.role} • {userPermissions.length} permisos
        </div>
      </div>
    </div>
  )
}
