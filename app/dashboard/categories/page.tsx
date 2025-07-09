"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Edit, Trash2, RotateCcw, ChefHat, Utensils, Shield, ChevronDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

/*
MÉTODOS PARA CONECTAR A BACKEND:

1. getCategories(type?: string)
   - GET /api/categories?type={type}
   - Retorna: Category[]

2. createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>)
   - POST /api/categories
   - Body: { name, description, type, parentId, color, icon }
   - Retorna: Category

3. updateCategory(categoryId: number, categoryData: Partial<Category>)
   - PUT /api/categories/{categoryId}
   - Body: campos a actualizar
   - Retorna: Category

4. deleteCategory(categoryId: number)
   - DELETE /api/categories/{categoryId}
   - Retorna: { success: boolean }

5. getCategoryUsage(categoryId: number)
   - GET /api/categories/{categoryId}/usage
   - Retorna: { products: number, ingredients: number, total: number }
*/

// Tipos de datos
interface ProductCategory {
  id: number
  name: string
  parentCategoryId?: number
  parentName?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

interface IngredientCategory {
  id: number
  name: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

// Configuración de tipos
const categoryTypes = [
  {
    value: "products",
    label: "Productos",
    description: "Categorías para productos del menú",
    icon: Utensils,
    color: "bg-restaurant-orange text-white",
  },
  {
    value: "ingredients",
    label: "Ingredientes",
    description: "Categorías para ingredientes y materias primas",
    icon: ChefHat,
    color: "bg-green-500 text-white",
  },
]

// API Base URL
const API_BASE = "/api"

// Verificar que fetch esté disponible
if (typeof fetch === 'undefined') {
  console.error('Fetch no está disponible en este entorno')
}

// Funciones de API
const api = {
  // Product Categories
  async getProductCategories() {
    try {
      console.log('Fetching product categories from:', `${API_BASE}/sales/ProductCategory`)
      const response = await fetch(`${API_BASE}/sales/ProductCategory`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('Product categories response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Product categories error response:', errorText)
        throw new Error(`Error al obtener categorías de productos: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      console.log('Product categories data:', data)
      return data
    } catch (error) {
      console.error('Network error in getProductCategories:', error)
      throw new Error(`Error de red al obtener categorías de productos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  },

  async getActiveProductCategories() {
    const response = await fetch(`${API_BASE}/sales/ProductCategory/actives`)
    if (!response.ok) throw new Error('Error al obtener categorías activas de productos')
    return response.json()
  },

  async getProductCategory(id: number) {
    const response = await fetch(`${API_BASE}/sales/ProductCategory/${id}`)
    if (!response.ok) throw new Error('Error al obtener categoría de producto')
    return response.json()
  },

  async createProductCategory(data: { name: string; parentCategoryId?: number | null }) {
    const response = await fetch(`${API_BASE}/sales/ProductCategory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Error al crear categoría de producto')
    return response.json()
  },

  async updateProductCategory(data: { categoryId: number; newName: string }) {
    const response = await fetch(`${API_BASE}/sales/ProductCategory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Error al actualizar categoría de producto')
    return response.json()
  },

  async deactivateProductCategory(id: number) {
    const response = await fetch(`${API_BASE}/sales/ProductCategory/${id}/deactivate`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Error al desactivar categoría de producto')
    return response.json()
  },

  async restoreProductCategory(id: number) {
    const response = await fetch(`${API_BASE}/sales/ProductCategory/${id}/restore`, {
      method: 'PATCH'
    })
    if (!response.ok) throw new Error('Error al restaurar categoría de producto')
    return response.json()
  },

  // Ingredient Categories
  async getIngredientCategories() {
    try {
      console.log('Fetching ingredient categories from:', `${API_BASE}/inventory/IngredientCategory`)
      const response = await fetch(`${API_BASE}/inventory/IngredientCategory`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('Ingredient categories response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Ingredient categories error response:', errorText)
        throw new Error(`Error al obtener categorías de ingredientes: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      console.log('Ingredient categories data:', data)
      return data
    } catch (error) {
      console.error('Network error in getIngredientCategories:', error)
      throw new Error(`Error de red al obtener categorías de ingredientes: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  },

  async getIngredientCategory(id: number) {
    const response = await fetch(`${API_BASE}/inventory/IngredientCategory/${id}`)
    if (!response.ok) throw new Error('Error al obtener categoría de ingrediente')
    return response.json()
  },

  async createIngredientCategory(data: { name: string }) {
    const response = await fetch(`${API_BASE}/inventory/IngredientCategory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Error al crear categoría de ingrediente')
    return response.json()
  },

  async updateIngredientCategory(data: { categoryId: number; name: string }) {
    const response = await fetch(`${API_BASE}/inventory/IngredientCategory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Error al actualizar categoría de ingrediente')
    return response.json()
  },

  async deactivateIngredientCategory(id: number) {
    const response = await fetch(`${API_BASE}/inventory/IngredientCategory/${id}/deactivate`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Error al desactivar categoría de ingrediente')
    return response.json()
  },

  async restoreIngredientCategory(id: number) {
    const response = await fetch(`${API_BASE}/inventory/IngredientCategory/${id}/restore`, {
      method: 'PATCH'
    })
    if (!response.ok) throw new Error('Error al restaurar categoría de ingrediente')
    return response.json()
  },
}

// Componente Select personalizado para evitar errores de tipos
const CustomSelect = ({ 
  value, 
  onValueChange, 
  placeholder, 
  children,
  displayValue 
}: { 
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  children: React.ReactNode
  displayValue?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-restaurant-orange/30 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-restaurant-orange focus:ring-offset-2"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {displayValue || value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

const CustomSelectItem = ({ 
  value, 
  children, 
  onClick 
}: { 
  value: string
  children: React.ReactNode
  onClick: () => void
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick()
    // Cerrar el dropdown después de un pequeño delay
    setTimeout(() => {
      // Buscar el botón del select y hacer clic en él
      const selectContainer = e.currentTarget.closest('.relative')
      if (selectContainer) {
        const selectButton = selectContainer.querySelector('button')
        if (selectButton) {
          selectButton.click()
        }
      }
    }, 100)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </button>
  )
}

export default function CategoriesPage() {
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])
  const [ingredientCategories, setIngredientCategories] = useState<IngredientCategory[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProductCategory | IngredientCategory | null>(null)
  const [selectedType, setSelectedType] = useState<string>("products")
  const [formData, setFormData] = useState({
    name: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    setError("")
    try {
      console.log('Cargando categorías...')
      
      // Verificar que fetch esté disponible
      if (typeof fetch === 'undefined') {
        throw new Error('Fetch no está disponible en este entorno')
      }
      
      const [products, ingredients] = await Promise.all([
        api.getProductCategories(),
        api.getIngredientCategories()
      ])
      console.log('Productos cargados:', products)
      console.log('Ingredientes cargados:', ingredients)
      setProductCategories(products)
      setIngredientCategories(ingredients)
    } catch (error) {
      console.error('Error loading categories:', error)
      setError(`Error al cargar las categorías: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Verificar permisos
  const hasCategoryPermission = (permission: string) => {
    return currentUser?.role === "admin" || currentUser?.username === "admin"
  }

  const handleOpenDialog = (category?: ProductCategory | IngredientCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: "",
      })
    }
    setError("")
    setIsDialogOpen(true)
  }

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      setError("El nombre de la categoría es obligatorio")
      return
    }

    setLoading(true)
    try {
      if (selectedType === "products") {
        if (editingCategory) {
          // Editar categoría de producto
          await api.updateProductCategory({
            categoryId: editingCategory.id,
            newName: formData.name
          })
        } else {
          // Crear categoría de producto
          await api.createProductCategory({
            name: formData.name,
            parentCategoryId: null
          })
        }
      } else {
        if (editingCategory) {
          // Editar categoría de ingrediente
          await api.updateIngredientCategory({
            categoryId: editingCategory.id,
            name: formData.name
          })
        } else {
          // Crear categoría de ingrediente
          await api.createIngredientCategory({
            name: formData.name
          })
        }
      }

      await loadCategories()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving category:', error)
      setError('Error al guardar la categoría')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (category: ProductCategory | IngredientCategory) => {
    setLoading(true)
    try {
      if (selectedType === "products") {
        if (category.isActive) {
          await api.deactivateProductCategory(category.id)
        } else {
          await api.restoreProductCategory(category.id)
        }
      } else {
        if (category.isActive) {
          await api.deactivateIngredientCategory(category.id)
        } else {
          await api.restoreIngredientCategory(category.id)
        }
      }
      await loadCategories()
    } catch (error) {
      console.error('Error toggling status:', error)
      setError('Error al cambiar el estado de la categoría')
    } finally {
      setLoading(false)
    }
  }

  const getTypeInfo = (type: string) => {
    return categoryTypes.find((t) => t.value === type) || categoryTypes[0]
  }

  const getCurrentCategories = () => {
    return selectedType === "products" ? productCategories : ingredientCategories
  }

  const getCategoryStats = () => {
    return categoryTypes.map((type) => ({
      ...type,
      count: type.value === "products" ? productCategories.length : ingredientCategories.length,
      activeCount: type.value === "products" 
        ? productCategories.filter(c => c.isActive).length 
        : ingredientCategories.filter(c => c.isActive).length,
    }))
  }

  if (!hasCategoryPermission("categories.view")) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            No tienes permisos para acceder a la gestión de categorías.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const categoryStats = getCategoryStats()
  const currentCategories = getCurrentCategories()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-restaurant-orange to-amber-600 bg-clip-text text-transparent">
            Gestión de Categorías
          </h1>
          <p className="text-muted-foreground">Organiza y clasifica productos e ingredientes</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadCategories} 
            variant="outline" 
            disabled={loading}
            className="border-restaurant-orange/30 text-restaurant-orange hover:bg-restaurant-orange hover:text-white"
          >
            {loading ? "Cargando..." : "Recargar"}
          </Button>
          {hasCategoryPermission("categories.create") && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="bg-gradient-orange hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Categoría
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-restaurant-orange">
                    {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory
                      ? "Modifica los datos de la categoría"
                      : `Crea una nueva categoría de ${getTypeInfo(selectedType).label.toLowerCase()}`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la Categoría</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={`Ej: ${selectedType === "products" ? "Bebidas Calientes" : "Carnes"}`}
                      className="border-restaurant-orange/30 focus:border-restaurant-orange"
                    />
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
                  <Button 
                    onClick={handleSaveCategory} 
                    className="bg-gradient-orange hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : (editingCategory ? "Guardar Cambios" : "Crear Categoría")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {categoryStats.map((stat) => (
          <Card
            key={stat.value}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedType === stat.value ? "ring-2 ring-restaurant-orange" : ""
            }`}
            onClick={() => setSelectedType(selectedType === stat.value ? "products" : stat.value)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
              <p className="text-xs text-muted-foreground">{stat.activeCount} activas</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla de Categorías */}
      <Card className="border-restaurant-orange/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-restaurant-orange">
                Categorías de {getTypeInfo(selectedType).label}
              </CardTitle>
              <CardDescription>
                {currentCategories.length} categorías totales
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {categoryTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                  className={
                    selectedType === type.value
                      ? "bg-gradient-orange"
                      : "border-restaurant-orange/30 text-restaurant-orange"
                  }
                >
                  <type.icon className="h-4 w-4 mr-1" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando categorías...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCategories.map((category) => {
                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {hasCategoryPermission("categories.edit") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(category)}
                              className="border-restaurant-orange/30 text-restaurant-orange hover:bg-restaurant-orange hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(category)}
                            disabled={loading}
                            className="border-restaurant-orange/30 text-restaurant-orange hover:bg-restaurant-orange hover:text-white"
                          >
                            {category.isActive ? (
                              <Trash2 className="h-4 w-4" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
