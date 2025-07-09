"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Plus, Edit, Trash2, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogoVariants } from "@/components/chickenbroster-logo"

interface User {
  id: number
  username: string
  password: string
  roleId: number
  roleName: string
  name: string
  active: boolean
}

interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
}

const availableRoles: Role[] = [
  {
    id: 1,
    name: "Super Administrador",
    description: "Acceso completo a todas las funcionalidades",
    permissions: [],
    isSystem: true,
  },
  {
    id: 2,
    name: "Administrador",
    description: "Gestión general del restaurante",
    permissions: [],
    isSystem: true,
  },
  {
    id: 3,
    name: "Cajero",
    description: "Manejo de ventas y caja",
    permissions: [],
    isSystem: true,
  },
  {
    id: 4,
    name: "Cocinero",
    description: "Gestión de órdenes y productos de cocina",
    permissions: [],
    isSystem: true,
  },
  {
    id: 5,
    name: "Mesero",
    description: "Atención al cliente y manejo de órdenes",
    permissions: [],
    isSystem: true,
  },
]

const initialUsers: User[] = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    roleId: 1,
    roleName: "Super Administrador",
    name: "Administrador",
    active: true,
  },
  {
    id: 2,
    username: "cajero",
    password: "cajero123",
    roleId: 3,
    roleName: "Cajero",
    name: "Cajero Principal",
    active: true,
  },
  {
    id: 3,
    username: "cocina",
    password: "cocina123",
    roleId: 4,
    roleName: "Cocinero",
    name: "Chef Principal",
    active: true,
  },
  {
    id: 4,
    username: "mesero",
    password: "mesero123",
    roleId: 5,
    roleName: "Mesero",
    name: "Mesero Principal",
    active: true,
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [roles, setRoles] = useState<Role[]>(availableRoles)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    roleId: "",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
  }, [])

  // Verificar si el usuario actual es admin
  const hasUserPermission = (permission: string) => {
    // En un sistema real, esto verificaría los permisos específicos del usuario
    return currentUser?.role === "admin" || currentUser?.username === "admin"
  }

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        password: "",
        name: user.name,
        roleId: user.roleId.toString(),
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: "",
        password: "",
        name: "",
        roleId: "",
      })
    }
    setError("")
    setIsDialogOpen(true)
  }

  const handleSaveUser = () => {
    if (!formData.username || !formData.name || !formData.roleId) {
      setError("Todos los campos son obligatorios")
      return
    }

    if (!editingUser && !formData.password) {
      setError("La contraseña es obligatoria para nuevos usuarios")
      return
    }

    // Verificar username único
    const existingUser = users.find((u) => u.username === formData.username && u.id !== editingUser?.id)
    if (existingUser) {
      setError("El nombre de usuario ya existe")
      return
    }

    const selectedRole = roles.find((r) => r.id === Number.parseInt(formData.roleId))
    if (!selectedRole) {
      setError("Rol seleccionado no válido")
      return
    }

    if (editingUser) {
      // Editar usuario existente
      setUsers(
        users.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                username: formData.username,
                name: formData.name,
                roleId: Number.parseInt(formData.roleId),
                roleName: selectedRole.name,
                ...(formData.password && { password: formData.password }),
              }
            : user,
        ),
      )
    } else {
      // Crear nuevo usuario
      const newUser: User = {
        id: Math.max(...users.map((u) => u.id)) + 1,
        username: formData.username,
        password: formData.password,
        name: formData.name,
        roleId: Number.parseInt(formData.roleId),
        roleName: selectedRole.name,
        active: true,
      }
      setUsers([...users, newUser])
    }

    setIsDialogOpen(false)
  }

  const handleDeleteUser = (userId: number) => {
    if (userId === currentUser?.id) {
      alert("No puedes eliminar tu propio usuario")
      return
    }
    setUsers(users.filter((user) => user.id !== userId))
  }

  const toggleUserStatus = (userId: number) => {
    if (userId === currentUser?.id) {
      alert("No puedes desactivar tu propio usuario")
      return
    }
    setUsers(users.map((user) => (user.id === userId ? { ...user, active: !user.active } : user)))
  }

  const getRoleInfo = (roleId: number) => {
    const role = roles.find((r) => r.id === roleId)
    return role || { name: "Rol desconocido", description: "", isSystem: false }
  }

  const getRoleColor = (roleId: number) => {
    const roleColors: { [key: number]: string } = {
      1: "bg-red-100 text-red-800 border-red-300", // Super Admin
      2: "bg-orange-100 text-orange-800 border-orange-300", // Admin
      3: "bg-green-100 text-green-800 border-green-300", // Cajero
      4: "bg-amber-100 text-amber-800 border-amber-300", // Cocinero
      5: "bg-orange-200 text-orange-800 border-orange-400", // Mesero
    }
    return roleColors[roleId] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  if (!hasUserPermission("users.view")) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            No tienes permisos para acceder a la gestión de usuarios.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Administra los usuarios del sistema y sus roles</p>
        </div>
        {hasUserPermission("users.create") && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-restaurant-orange">
                  {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? "Modifica los datos del usuario" : "Crea un nuevo usuario del sistema"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Ingresa el nombre de usuario"
                    className="border-restaurant-orange/30 focus:border-restaurant-orange"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ingresa el nombre completo"
                    className="border-restaurant-orange/30 focus:border-restaurant-orange"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{editingUser ? "Nueva Contraseña (opcional)" : "Contraseña"}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Dejar vacío para mantener actual" : "Ingresa la contraseña"}
                    className="border-restaurant-orange/30 focus:border-restaurant-orange"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                  >
                    <SelectTrigger className="border-restaurant-orange/30 focus:border-restaurant-orange">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.name}</span>
                            <span className="text-xs text-muted-foreground">{role.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button onClick={handleSaveUser} className="bg-gradient-orange hover:opacity-90">
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Total Usuarios
            </CardTitle>
            <LogoVariants.Small />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{users.length}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">Activos</CardTitle>
            <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {users.filter((u) => u.active).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">Roles Únicos</CardTitle>
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {new Set(users.map((u) => u.roleId)).size}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-300 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-800/20 dark:to-amber-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-300">Administradores</CardTitle>
            <LogoVariants.Small />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {users.filter((u) => u.roleId === 1 || u.roleId === 2).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800 dark:text-orange-200">Usuarios del Sistema</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">Lista de todos los usuarios registrados con sus roles asignados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const roleInfo = getRoleInfo(user.roleId)
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.roleId)}>{roleInfo.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "default" : "secondary"}>
                        {user.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {hasUserPermission("users.edit") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(user)}
                            className="border-orange-300 text-orange-600 hover:bg-orange-600 hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id)}
                          disabled={user.id === currentUser?.id}
                          className="border-orange-300 text-orange-600 hover:bg-orange-600 hover:text-white"
                        >
                          {user.active ? "Desactivar" : "Activar"}
                        </Button>
                        {hasUserPermission("users.delete") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
