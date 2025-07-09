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
import { Plus, Edit, Trash2, Package, Loader2, Filter, Tag, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ingredientService, 
  unitOfMeasureService,
  ingredientCategoryService,
  inventoryService,
  BackendIngredient,
  CreateIngredientRequest,
  UpdateIngredientRequest,
  UnitOfMeasure,
  IngredientCategory,
  ApiError
} from "@/lib/api"

interface LocalIngredient {
  id: number
  name: string
  description: string
  sku: string
  unitOfMeasureAbbreviation: string
  unitCost: number
  isPerishable: boolean
  expirationDate: string
  isActive: boolean
  categories?: IngredientCategory[]
  minimumStock?: number
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<LocalIngredient[]>([])
  const [units, setUnits] = useState<UnitOfMeasure[]>([])
  const [categories, setCategories] = useState<IngredientCategory[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<LocalIngredient | null>(null)
  const [selectedIngredientForCategories, setSelectedIngredientForCategories] = useState<LocalIngredient | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    unitOfMeasureId: "",
    unitCost: "",
    isPerishable: false,
    expirationDate: "",
    minimumStock: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError("") // Limpiar errores anteriores
      const [ingredientsData, unitsData, categoriesData] = await Promise.all([
        ingredientService.getActiveIngredients(),
        unitOfMeasureService.getActiveUnits(),
        ingredientCategoryService.getActiveCategories()
      ])
      
      // Cargar categorías para cada ingrediente
      const ingredientsWithCategories = await Promise.all(
        ingredientsData.map(async (ingredient) => {
          try {
            const categories = await ingredientCategoryService.getIngredientAssignedCategories(ingredient.id)
            return { ...ingredient, categories }
          } catch (error) {
            console.warn(`No se pudo cargar las categorías para el ingrediente ${ingredient.id}:`, error)
            return { ...ingredient, categories: [] }
          }
        })
      )
      
      setIngredients(ingredientsWithCategories)
      setUnits(unitsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error loading data:", error)
      if (error instanceof ApiError) {
        setError(`Error al cargar los datos: ${error.message}`)
      } else {
        setError("Error al cargar los datos. Por favor, intenta de nuevo.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (ingredient?: LocalIngredient) => {
    if (ingredient) {
      setEditingIngredient(ingredient)
      const unit = units.find(u => u.abbreviation === ingredient.unitOfMeasureAbbreviation)
      setFormData({
        name: ingredient.name,
        description: ingredient.description,
        sku: ingredient.sku,
        unitOfMeasureId: unit?.id.toString() || "",
        unitCost: ingredient.unitCost.toString(),
        isPerishable: ingredient.isPerishable,
        expirationDate: ingredient.isPerishable && ingredient.expirationDate ? ingredient.expirationDate.split('T')[0] : "",
        minimumStock: ingredient.categories && ingredient.categories.length > 0 && ingredient.minimumStock !== undefined ? ingredient.minimumStock.toString() : "",
      })
    } else {
      setEditingIngredient(null)
      setFormData({
        name: "",
        description: "",
        sku: "",
        unitOfMeasureId: "",
        unitCost: "",
        isPerishable: false,
        expirationDate: "",
        minimumStock: "",
      })
    }
    setError("")
    setIsDialogOpen(true)
  }

  const handleSaveIngredient = async () => {
    if (!formData.name || !formData.unitOfMeasureId || !formData.unitCost) {
      setError("Nombre, unidad de medida y costo son obligatorios")
      return
    }

    const unitCost = Number.parseFloat(formData.unitCost)

    if (isNaN(unitCost) || unitCost < 0) {
      setError("El costo debe ser un número válido mayor o igual a 0")
      return
    }

    // Validar fecha de vencimiento para productos perecederos
    if (formData.isPerishable && !formData.expirationDate) {
      setError("La fecha de vencimiento es obligatoria para productos perecederos")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      if (editingIngredient) {
        // Actualizar ingrediente existente
        const updateData: UpdateIngredientRequest = {
          ingredientId: editingIngredient.id,
          name: formData.name,
          description: formData.description,
          sku: formData.sku,
          unitOfMeasureId: Number.parseInt(formData.unitOfMeasureId),
          unitCost: unitCost,
          isPerishable: formData.isPerishable,
          expirationDate: formData.isPerishable && formData.expirationDate ? new Date(formData.expirationDate).toISOString() : new Date().toISOString(),
          minimumStock: Number.parseInt(formData.minimumStock),
        }

        await ingredientService.updateIngredient(updateData)
        await inventoryService.updateMinimumStock(editingIngredient.id, Number.parseInt(formData.minimumStock))
      } else {
        // Crear nuevo ingrediente
        const createData: CreateIngredientRequest = {
          name: formData.name,
          description: formData.description,
          sku: formData.sku,
          unitOfMeasureId: Number.parseInt(formData.unitOfMeasureId),
          unitCost: unitCost,
          isPerishable: formData.isPerishable,
          expirationDate: formData.isPerishable && formData.expirationDate ? new Date(formData.expirationDate).toISOString() : new Date().toISOString(),
          actualStock: 0,
          minimumStock: Number.parseInt(formData.minimumStock),
        }

        const created = await ingredientService.createIngredient(createData)
        await inventoryService.updateMinimumStock(created.id, Number.parseInt(formData.minimumStock))
      }

      // Recargar datos
      await loadData()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving ingredient:", error)
      if (error instanceof ApiError) {
        setError(error.message)
      } else {
        setError("Error al guardar el ingrediente. Por favor, intenta de nuevo.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteIngredient = async (ingredientId: number) => {
    try {
      setError("") // Limpiar errores anteriores
      await ingredientService.deactivateIngredient(ingredientId)
      await loadData()
    } catch (error) {
      console.error("Error deleting ingredient:", error)
      if (error instanceof ApiError) {
        setError(`Error al eliminar el ingrediente: ${error.message}`)
      } else {
        setError("Error al eliminar el ingrediente. Por favor, intenta de nuevo.")
      }
    }
  }

  const handleOpenCategoryDialog = (ingredient: LocalIngredient) => {
    setSelectedIngredientForCategories(ingredient)
    setIsCategoryDialogOpen(true)
  }

  const handleAssignCategory = async (ingredientId: number, categoryId: number) => {
    try {
      setIsCategorySubmitting(true)
      setError("") // Limpiar errores anteriores
      await ingredientService.assignCategory(ingredientId, categoryId)
      
      // Actualizar solo el ingrediente específico en lugar de recargar todo
      const updatedIngredients = ingredients.map(ingredient => {
        if (ingredient.id === ingredientId) {
          const category = categories.find(cat => cat.id === categoryId)
          if (category) {
            return {
              ...ingredient,
              categories: [...(ingredient.categories || []), category]
            }
          }
        }
        return ingredient
      })
      setIngredients(updatedIngredients)
      
      // Mostrar feedback temporal
      setTimeout(() => {
        setIsCategoryDialogOpen(false)
      }, 500)
      
    } catch (error) {
      console.error("Error assigning category:", error)
      if (error instanceof ApiError) {
        setError(`Error al asignar la categoría: ${error.message}`)
      } else {
        setError("Error al asignar la categoría. Por favor, intenta de nuevo.")
      }
    } finally {
      setIsCategorySubmitting(false)
    }
  }

  const handleUnassignCategory = async (ingredientId: number, categoryId: number) => {
    try {
      setIsCategorySubmitting(true)
      setError("") // Limpiar errores anteriores
      await ingredientService.unassignCategory(ingredientId, categoryId)
      
      // Actualizar solo el ingrediente específico en lugar de recargar todo
      const updatedIngredients = ingredients.map(ingredient => {
        if (ingredient.id === ingredientId) {
          return {
            ...ingredient,
            categories: ingredient.categories?.filter(cat => cat.id !== categoryId) || []
          }
        }
        return ingredient
      })
      setIngredients(updatedIngredients)
      
      // Mostrar feedback temporal
      setTimeout(() => {
        setIsCategoryDialogOpen(false)
      }, 500)
      
    } catch (error) {
      console.error("Error unassigning category:", error)
      if (error instanceof ApiError) {
        setError(`Error al desasignar la categoría: ${error.message}`)
      } else {
        setError("Error al desasignar la categoría. Por favor, intenta de nuevo.")
      }
    } finally {
      setIsCategorySubmitting(false)
    }
  }

  const getUnitLabel = (abbreviation: string) => {
    const unit = units.find(u => u.abbreviation === abbreviation)
    return unit ? `${unit.name} (${unit.abbreviation})` : abbreviation
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  // Filtrar ingredientes por categoría
  const filteredIngredients = selectedCategory === "all" 
    ? ingredients 
    : ingredients.filter(ingredient => 
        ingredient.categories?.some(cat => cat.id.toString() === selectedCategory)
      )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando ingredientes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Ingredientes</h1>
          <p className="text-muted-foreground">Administra los ingredientes y materias primas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ingrediente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingIngredient ? "Editar Ingrediente" : "Nuevo Ingrediente"}</DialogTitle>
              <DialogDescription>
                {editingIngredient ? "Modifica los datos del ingrediente" : "Crea un nuevo ingrediente"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Ingrediente *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Pollo, Papas, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Código único"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del ingrediente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasureId">Unidad de Medida *</Label>
                  <Select value={formData.unitOfMeasureId} onValueChange={(value) => setFormData({ ...formData, unitOfMeasureId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name} ({unit.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Costo por Unidad (S/) *</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isPerishable">Perecedero</Label>
                  <Select 
                    value={formData.isPerishable.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, isPerishable: value === "true", expirationDate: value === "false" ? "" : formData.expirationDate })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.isPerishable && (
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Fecha de Vencimiento *</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumStock">Stock Mínimo</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                  placeholder="0"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleSaveIngredient} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingIngredient ? "Guardar Cambios" : "Crear Ingrediente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingredientes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ingredients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perecederos</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{ingredients.filter((i) => i.isPerishable).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Perecederos</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ingredients.filter((i) => !i.isPerishable).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Ingredientes</CardTitle>
              <CardDescription>Todos los ingredientes registrados en el sistema</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIngredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ingredient.name}</div>
                      {ingredient.description && (
                        <div className="text-sm text-muted-foreground">{ingredient.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {ingredient.categories && ingredient.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ingredient.categories.map((category) => (
                          <Badge key={category.id} variant="outline">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin categoría</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{ingredient.sku}</TableCell>
                  <TableCell>{getUnitLabel(ingredient.unitOfMeasureAbbreviation)}</TableCell>
                  <TableCell>S/ {ingredient.unitCost.toFixed(2)}</TableCell>
                  <TableCell className="text-sm">
                    {ingredient.isPerishable && ingredient.expirationDate ? formatDate(ingredient.expirationDate) : "No aplica"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {ingredient.isPerishable && (
                        <Badge variant="outline" className="text-orange-600">
                          Perecedero
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(ingredient)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenCategoryDialog(ingredient)}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteIngredient(ingredient.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category Management Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Categorías</DialogTitle>
            <DialogDescription>
              {selectedIngredientForCategories && `Asigna o desasigna categorías para: ${selectedIngredientForCategories.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedIngredientForCategories && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Ingrediente:</span> {selectedIngredientForCategories.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedIngredientForCategories.description}
                </div>
              </div>
            )}

            {isCategorySubmitting && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Actualizando categorías...</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Categorías Asignadas</h4>
                <div className="space-y-2">
                  {selectedIngredientForCategories?.categories && selectedIngredientForCategories.categories.length > 0 ? (
                    selectedIngredientForCategories.categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{category.name}</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnassignCategory(selectedIngredientForCategories.id, category.id)}
                          disabled={isCategorySubmitting}
                        >
                          {isCategorySubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Desasignar"
                          )}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground border rounded-lg">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No hay categorías asignadas</p>
                      <p className="text-sm">Asigna categorías desde la sección de abajo</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Categorías Disponibles</h4>
                <div className="space-y-2">
                  {categories
                    .filter(category => 
                      !selectedIngredientForCategories?.categories?.some(assigned => assigned.id === category.id)
                    )
                    .map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{category.name}</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignCategory(selectedIngredientForCategories!.id, category.id)}
                          disabled={isCategorySubmitting}
                        >
                          {isCategorySubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Asignar"
                          )}
                        </Button>
                      </div>
                    ))}
                  {categories.filter(category => 
                    !selectedIngredientForCategories?.categories?.some(assigned => assigned.id === category.id)
                  ).length === 0 && (
                    <div className="p-4 text-center text-muted-foreground border rounded-lg">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>Todas las categorías están asignadas</p>
                      <p className="text-sm">Este ingrediente tiene todas las categorías disponibles</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} disabled={isCategorySubmitting}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
