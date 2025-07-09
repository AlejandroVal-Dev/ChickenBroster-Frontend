"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Shield, Users, Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

/*
MÉTODOS PARA CONECTAR A BACKEND:

1. getRoles()
   - GET /api/roles
   - Retorna: Role[]

2. createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>)
   - POST /api/roles
   - Body: { name, description, permissions }
   - Retorna: Role

3. updateRole(roleId: number, roleData: Partial<Role>)
   - PUT /api/roles/{roleId}
   - Body: campos a actualizar
   - Retorna: Role

4. deleteRole(roleId: number)
   - DELETE /api/roles/{roleId}
   - Retorna: { success: boolean }

5. getPermissions()
   - GET /api/permissions
   - Retorna: Permission[]

6. assignPermissionsToRole(roleId: number, permissionIds: number[])
   - POST /api/roles/{roleId}/permissions
   - Body: { permissionIds }
   - Retorna: Role
*/

interface Permission {
  id: string
  name: string
  description: string
  category: string
  resource: string
  action: string
}

interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
  userCount: number
  createdAt: string
  updatedAt: string
}

// Definición completa de permisos del sistema
const systemPermissions: Permission[] = [
  // Dashboard
  {
    id: "dashboard.view",
    name: "Ver Dashboard",
    description: "Acceso al panel principal",
    category: "Dashboard",
    resource: "dashboard",
    action: "view",
  },
  {
    id: "dashboard.stats",
    name: "Ver Estadísticas",
    description: "Ver métricas y reportes del dashboard",
    category: "Dashboard",
    resource: "dashboard",
    action: "stats",
  },

  // Ventas
  {
    id: "sales.view",
    name: "Ver Ventas",
    description: "Acceso al módulo de ventas",
    category: "Ventas",
    resource: "sales",
    action: "view",
  },
  {
    id: "sales.create",
    name: "Crear Ventas",
    description: "Registrar nuevas ventas",
    category: "Ventas",
    resource: "sales",
    action: "create",
  },
  {
    id: "sales.pos",
    name: "Usar POS",
    description: "Acceso al punto de venta",
    category: "Ventas",
    resource: "sales",
    action: "pos",
  },
  {
    id: "sales.discount",
    name: "Aplicar Descuentos",
    description: "Aplicar descuentos en ventas",
    category: "Ventas",
    resource: "sales",
    action: "discount",
  },

  // Órdenes
  {
    id: "orders.view",
    name: "Ver Órdenes",
    description: "Ver órdenes activas",
    category: "Órdenes",
    resource: "orders",
    action: "view",
  },
  {
    id: "orders.update",
    name: "Actualizar Órdenes",
    description: "Cambiar estado de órdenes",
    category: "Órdenes",
    resource: "orders",
    action: "update",
  },
  {
    id: "orders.history",
    name: "Ver Historial",
    description: "Acceso al historial de órdenes",
    category: "Órdenes",
    resource: "orders",
    action: "history",
  },
  {
    id: "orders.reprint",
    name: "Reimprimir Comandas",
    description: "Reimprimir comandas anteriores",
    category: "Órdenes",
    resource: "orders",
    action: "reprint",
  },

  // Inventario
  {
    id: "inventory.view",
    name: "Ver Inventario",
    description: "Ver stock actual",
    category: "Inventario",
    resource: "inventory",
    action: "view",
  },
  {
    id: "inventory.movements",
    name: "Movimientos de Stock",
    description: "Registrar entradas y salidas",
    category: "Inventario",
    resource: "inventory",
    action: "movements",
  },
  {
    id: "inventory.adjust",
    name: "Ajustar Inventario",
    description: "Realizar ajustes de inventario",
    category: "Inventario",
    resource: "inventory",
    action: "adjust",
  },
  {
    id: "inventory.reports",
    name: "Reportes de Inventario",
    description: "Ver reportes de stock",
    category: "Inventario",
    resource: "inventory",
    action: "reports",
  },

  // Caja
  {
    id: "cash.view",
    name: "Ver Caja",
    description: "Ver estado de caja",
    category: "Caja",
    resource: "cash",
    action: "view",
  },
  {
    id: "cash.open",
    name: "Abrir Caja",
    description: "Abrir sesión de caja",
    category: "Caja",
    resource: "cash",
    action: "open",
  },
  {
    id: "cash.close",
    name: "Cerrar Caja",
    description: "Cerrar sesión de caja",
    category: "Caja",
    resource: "cash",
    action: "close",
  },
  {
    id: "cash.history",
    name: "Historial de Caja",
    description: "Ver historial de sesiones",
    category: "Caja",
    resource: "cash",
    action: "history",
  },

  // Productos
  {
    id: "products.view",
    name: "Ver Productos",
    description: "Ver lista de productos",
    category: "Productos",
    resource: "products",
    action: "view",
  },
  {
    id: "products.create",
    name: "Crear Productos",
    description: "Agregar nuevos productos",
    category: "Productos",
    resource: "products",
    action: "create",
  },
  {
    id: "products.edit",
    name: "Editar Productos",
    description: "Modificar productos existentes",
    category: "Productos",
    resource: "products",
    action: "edit",
  },
  {
    id: "products.delete",
    name: "Eliminar Productos",
    description: "Eliminar productos",
    category: "Productos",
    resource: "products",
    action: "delete",
  },
  {
    id: "products.prices",
    name: "Gestionar Precios",
    description: "Modificar precios de productos",
    category: "Productos",
    resource: "products",
    action: "prices",
  },

  // Ingredientes
  {
    id: "ingredients.view",
    name: "Ver Ingredientes",
    description: "Ver lista de ingredientes",
    category: "Ingredientes",
    resource: "ingredients",
    action: "view",
  },
  {
    id: "ingredients.create",
    name: "Crear Ingredientes",
    description: "Agregar nuevos ingredientes",
    category: "Ingredientes",
    resource: "ingredients",
    action: "create",
  },
  {
    id: "ingredients.edit",
    name: "Editar Ingredientes",
    description: "Modificar ingredientes",
    category: "Ingredientes",
    resource: "ingredients",
    action: "edit",
  },
  {
    id: "ingredients.delete",
    name: "Eliminar Ingredientes",
    description: "Eliminar ingredientes",
    category: "Ingredientes",
    resource: "ingredients",
    action: "delete",
  },

  // Mesas
  {
    id: "tables.view",
    name: "Ver Mesas",
    description: "Ver configuración de mesas",
    category: "Mesas",
    resource: "tables",
    action: "view",
  },
  {
    id: "tables.create",
    name: "Crear Mesas",
    description: "Agregar nuevas mesas",
    category: "Mesas",
    resource: "tables",
    action: "create",
  },
  {
    id: "tables.edit",
    name: "Editar Mesas",
    description: "Modificar configuración de mesas",
    category: "Mesas",
    resource: "tables",
    action: "edit",
  },
  {
    id: "tables.delete",
    name: "Eliminar Mesas",
    description: "Eliminar mesas",
    category: "Mesas",
    resource: "tables",
    action: "delete",
  },
  {
    id: "tables.status",
    name: "Cambiar Estado",
    description: "Cambiar estado de mesas",
    category: "Mesas",
    resource: "tables",
    action: "status",
  },

  // Usuarios
  {
    id: "users.view",
    name: "Ver Usuarios",
    description: "Ver lista de usuarios",
    category: "Usuarios",
    resource: "users",
    action: "view",
  },
  {
    id: "users.create",
    name: "Crear Usuarios",
    description: "Agregar nuevos usuarios",
    category: "Usuarios",
    resource: "users",
    action: "create",
  },
  {
    id: "users.edit",
    name: "Editar Usuarios",
    description: "Modificar usuarios existentes",
    category: "Usuarios",
    resource: "users",
    action: "edit",
  },
  {
    id: "users.delete",
    name: "Eliminar Usuarios",
    description: "Eliminar usuarios",
    category: "Usuarios",
    resource: "users",
    action: "delete",
  },
  {
    id: "users.roles",
    name: "Asignar Roles",
    description: "Asignar roles a usuarios",
    category: "Usuarios",
    resource: "users",
    action: "roles",
  },

  // Roles y Permisos
  {
    id: "roles.view",
    name: "Ver Roles",
    description: "Ver lista de roles",
    category: "Roles",
    resource: "roles",
    action: "view",
  },
  {
    id: "roles.create",
    name: "Crear Roles",
    description: "Crear nuevos roles",
    category: "Roles",
    resource: "roles",
    action: "create",
  },
  {
    id: "roles.edit",
    name: "Editar Roles",
    description: "Modificar roles existentes",
    category: "Roles",
    resource: "roles",
    action: "edit",
  },
  {
    id: "roles.delete",
    name: "Eliminar Roles",
    description: "Eliminar roles personalizados",
    category: "Roles",
    resource: "roles",
    action: "delete",
  },
  {
    id: "roles.permissions",
    name: "Gestionar Permisos",
    description: "Asignar permisos a roles",
    category: "Roles",
    resource: "roles",
    action: "permissions",
  },

  // Reportes
  {
    id: "reports.sales",
    name: "Reportes de Ventas",
    description: "Ver reportes de ventas",
    category: "Reportes",
    resource: "reports",
    action: "sales",
  },
  {
    id: "reports.inventory",
    name: "Reportes de Inventario",
    description: "Ver reportes de inventario",
    category: "Reportes",
    resource: "reports",
    action: "inventory",
  },
  {
    id: "reports.financial",
    name: "Reportes Financieros",
    description: "Ver reportes financieros",
    category: "Reportes",
    resource: "reports",
    action: "financial",
  },
  {
    id: "reports.export",
    name: "Exportar Reportes",
    description: "Exportar reportes a PDF/Excel",
    category: "Reportes",
    resource: "reports",
    action: "export",
  },

  // Configuración
  {
    id: "settings.view",
    name: "Ver Configuración",
    description: "Acceso a configuración general",
    category: "Configuración",
    resource: "settings",
    action: "view",
  },
  {
    id: "settings.edit",
    name: "Editar Configuración",
    description: "Modificar configuración del sistema",
    category: "Configuración",
    resource: "settings",
    action: "edit",
  },
  {
    id: "settings.backup",
    name: "Respaldos",
    description: "Crear y restaurar respaldos",
    category: "Configuración",
    resource: "settings",
    action: "backup",
  },
]

const initialRoles: Role[] = [
  {
    id: 1,
    name: "Super Administrador",
    description: "Acceso completo a todas las funcionalidades del sistema",
    permissions: systemPermissions.map((p) => p.id),
    isSystem: true,
    userCount: 1,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 2,
    name: "Administrador",
    description: "Gestión general del restaurante sin acceso a configuración crítica",
    permissions: [
      "dashboard.view",
      "dashboard.stats",
      "sales.view",
      "sales.create",
      "sales.pos",
      "orders.view",
      "orders.update",
      "orders.history",
      "orders.reprint",
      "inventory.view",
      "inventory.movements",
      "inventory.reports",
      "cash.view",
      "cash.open",
      "cash.close",
      "cash.history",
      "products.view",
      "products.create",
      "products.edit",
      "products.prices",
      "ingredients.view",
      "ingredients.create",
      "ingredients.edit",
      "tables.view",
      "tables.edit",
      "tables.status",
      "users.view",
      "users.create",
      "users.edit",
      "reports.sales",
      "reports.inventory",
      "reports.financial",
    ],
    isSystem: true,
    userCount: 2,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 3,
    name: "Cajero",
    description: "Manejo de ventas y caja",
    permissions: [
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
    isSystem: true,
    userCount: 3,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 4,
    name: "Cocinero",
    description: "Gestión de órdenes y productos de cocina",
    permissions: [
      "dashboard.view",
      "orders.view",
      "orders.update",
      "products.view",
      "ingredients.view",
      "inventory.view",
    ],
    isSystem: true,
    userCount: 2,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 5,
    name: "Mesero",
    description: "Atención al cliente y manejo de órdenes",
    permissions: [
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
    isSystem: true,
    userCount: 4,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })
  const [error, setError] = useState("")

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
  }, [])

  // Verificar si el usuario actual tiene permisos para gestionar roles
  const hasRolePermission = (permission: string) => {
    // En un sistema real, esto verificaría los permisos del usuario actual
    return currentUser?.role === "admin" || currentUser?.username === "admin"
  }

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
      })
    } else {
      setEditingRole(null)
      setFormData({
        name: "",
        description: "",
        permissions: [],
      })
    }
    setError("")
    setIsDialogOpen(true)
  }

  const handleSaveRole = () => {
    if (!formData.name.trim()) {
      setError("El nombre del rol es obligatorio")
      return
    }

    if (formData.permissions.length === 0) {
      setError("Debe asignar al menos un permiso al rol")
      return
    }

    // Verificar nombre único
    const existingRole = roles.find(
      (r) => r.name.toLowerCase() === formData.name.toLowerCase() && r.id !== editingRole?.id,
    )
    if (existingRole) {
      setError("Ya existe un rol con ese nombre")
      return
    }

    if (editingRole) {
      // Editar rol existente
      if (editingRole.isSystem) {
        setError("No se pueden modificar los roles del sistema")
        return
      }

      setRoles(
        roles.map((role) =>
          role.id === editingRole.id
            ? {
                ...role,
                name: formData.name,
                description: formData.description,
                permissions: formData.permissions,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : role,
        ),
      )
    } else {
      // Crear nuevo rol
      const newRole: Role = {
        id: Math.max(...roles.map((r) => r.id)) + 1,
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        isSystem: false,
        userCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      }
      setRoles([...roles, newRole])
    }

    setIsDialogOpen(false)
  }

  const handleDeleteRole = (roleId: number) => {
    const role = roles.find((r) => r.id === roleId)
    if (!role) return

    if (role.isSystem) {
      alert("No se pueden eliminar los roles del sistema")
      return
    }

    if (role.userCount > 0) {
      alert("No se puede eliminar un rol que tiene usuarios asignados")
      return
    }

    if (confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) {
      setRoles(roles.filter((role) => role.id !== roleId))
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permissionId],
      })
    } else {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter((p) => p !== permissionId),
      })
    }
  }

  const toggleAllPermissionsInCategory = (category: string, checked: boolean) => {
    const categoryPermissions = systemPermissions.filter((p) => p.category === category).map((p) => p.id)

    if (checked) {
      const newPermissions = [...new Set([...formData.permissions, ...categoryPermissions])]
      setFormData({ ...formData, permissions: newPermissions })
    } else {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter((p) => !categoryPermissions.includes(p)),
      })
    }
  }

  const getPermissionsByCategory = () => {
    const categories: { [key: string]: Permission[] } = {}
    systemPermissions.forEach((permission) => {
      if (!categories[permission.category]) {
        categories[permission.category] = []
      }
      categories[permission.category].push(permission)
    })
    return categories
  }

  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = systemPermissions.filter((p) => p.category === category).map((p) => p.id)
    return categoryPermissions.every((p) => formData.permissions.includes(p))
  }

  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = systemPermissions.filter((p) => p.category === category).map((p) => p.id)
    return categoryPermissions.some((p) => formData.permissions.includes(p)) && !isCategoryFullySelected(category)
  }

  if (!hasRolePermission("roles.view")) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            No tienes permisos para acceder a la gestión de roles y permisos.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const permissionsByCategory = getPermissionsByCategory()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-restaurant-orange to-amber-600 bg-clip-text text-transparent">
            Gestión de Roles y Permisos
          </h1>
          <p className="text-muted-foreground">Administra roles personalizados y asigna permisos específicos</p>
        </div>
        {hasRolePermission("roles.create") && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-orange hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Rol
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-restaurant-orange">{editingRole ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
                <DialogDescription>
                  {editingRole ? "Modifica los datos y permisos del rol" : "Crea un nuevo rol personalizado"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Rol</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Supervisor de Turno"
                      className="border-restaurant-orange/30 focus:border-restaurant-orange"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permisos Seleccionados</Label>
                    <div className="text-sm text-restaurant-orange font-medium">
                      {formData.permissions.length} de {systemPermissions.length} permisos
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe las responsabilidades de este rol"
                    className="border-restaurant-orange/30 focus:border-restaurant-orange"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-restaurant-orange">Permisos del Sistema</Label>
                    <Badge variant="outline" className="border-restaurant-orange text-restaurant-orange">
                      {Object.keys(permissionsByCategory).length} categorías
                    </Badge>
                  </div>

                  <div className="grid gap-4">
                    {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                      <Card key={category} className="border-restaurant-orange/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <Settings className="h-4 w-4 text-restaurant-orange" />
                              {category}
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${category}`}
                                checked={isCategoryFullySelected(category)}
                                onCheckedChange={(checked) =>
                                  toggleAllPermissionsInCategory(category, checked as boolean)
                                }
                                className="data-[state=checked]:bg-restaurant-orange data-[state=checked]:border-restaurant-orange"
                              />
                              <Label htmlFor={`category-${category}`} className="text-xs text-restaurant-orange">
                                Seleccionar todos
                              </Label>
                            </div>
                          </div>
                          {isCategoryPartiallySelected(category) && (
                            <div className="text-xs text-amber-600">Parcialmente seleccionado</div>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {permissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-restaurant-orange/5"
                              >
                                <Checkbox
                                  id={permission.id}
                                  checked={formData.permissions.includes(permission.id)}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(permission.id, checked as boolean)
                                  }
                                  className="mt-1 data-[state=checked]:bg-restaurant-orange data-[state=checked]:border-restaurant-orange"
                                />
                                <div className="flex-1 min-w-0">
                                  <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                                    {permission.name}
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-1">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveRole} className="bg-gradient-orange hover:opacity-90">
                  {editingRole ? "Guardar Cambios" : "Crear Rol"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-restaurant-orange/20 bg-gradient-to-br from-restaurant-orange-light to-amber-100 dark:from-restaurant-orange/10 dark:to-amber-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-restaurant-orange-dark dark:text-restaurant-orange">
              Total Roles
            </CardTitle>
            <Shield className="h-4 w-4 text-restaurant-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-restaurant-orange">{roles.length}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-blue dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Roles Sistema</CardTitle>
            <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {roles.filter((r) => r.isSystem).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-green dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">
              Roles Personalizados
            </CardTitle>
            <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {roles.filter((r) => !r.isSystem).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {roles.reduce((sum, r) => sum + r.userCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card className="border-restaurant-orange/20">
        <CardHeader>
          <CardTitle className="text-restaurant-orange">Roles del Sistema</CardTitle>
          <CardDescription>Lista de todos los roles y sus permisos asignados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-muted-foreground">{role.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={role.isSystem ? "default" : "outline"}
                      className={
                        role.isSystem
                          ? "bg-restaurant-orange text-white"
                          : "border-restaurant-orange text-restaurant-orange"
                      }
                    >
                      {role.isSystem ? "Sistema" : "Personalizado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-restaurant-orange/50 text-restaurant-orange">
                        {role.permissions.length} permisos
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((role.permissions.length / systemPermissions.length) * 100)}% del total
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{role.userCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{role.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {hasRolePermission("roles.edit") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(role)}
                          className="border-restaurant-orange/30 text-restaurant-orange hover:bg-restaurant-orange hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasRolePermission("roles.delete") && !role.isSystem && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={role.userCount > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
