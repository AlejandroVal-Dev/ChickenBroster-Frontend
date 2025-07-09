"use client"

import { useState, useEffect, useRef } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { productService, productRecipeService, recipeService, ingredientService, unitOfMeasureService, BackendProduct, BackendRecipe, RecipeIngredient, BackendIngredient, UnitOfMeasure, apiRequest } from "@/lib/api"

export default function ProductsPage() {
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [productRecipes, setProductRecipes] = useState<Record<number, BackendRecipe | null>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<BackendProduct | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
  })
  const [productIngredients, setProductIngredients] = useState<RecipeIngredient[]>([])
  const [recipeId, setRecipeId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ingredients, setIngredients] = useState<BackendIngredient[]>([])
  const [units, setUnits] = useState<UnitOfMeasure[]>([])

  // Cargar productos, categorías, y recetas al montar
  useEffect(() => {
    fetchAll()
    // Cargar ingredientes y unidades
    ingredientService.getActiveIngredients().then(setIngredients)
    unitOfMeasureService.getActiveUnits().then(setUnits)
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [prods] = await Promise.all([
        productService.getActiveProducts(),
      ])
      setProducts(prods)
      // Cargar categorías y recetas por producto
      const recMap: Record<number, BackendRecipe | null> = {}
      await Promise.all(prods.map(async (prod) => {
        try {
          const prodRecipe = await productRecipeService.getProductRecipe(prod.id)
          if (prodRecipe && prodRecipe.recipeId) {
            recMap[prod.id] = await recipeService.getRecipe(prodRecipe.recipeId)
          } else {
            recMap[prod.id] = null
          }
        } catch {
          recMap[prod.id] = null
        }
      }))
      setProductRecipes(recMap)
    } catch (e: any) {
      setError(e.message || "Error cargando productos/categorías")
    } finally {
      setLoading(false)
    }
  }

  // Modal handlers
  const handleOpenDialog = () => {
    setError("")
    setEditingProduct(null)
    setFormData({
      name: "",
      price: "",
      description: "",
      image: "",
    })
    setRecipeId(null)
    setProductIngredients([])
    setIsDialogOpen(true)
  }

  const handleSaveProduct = async () => {
    setError("")
    if (!formData.name || !formData.price) {
      setError("Nombre y precio son obligatorios")
      return
    }
    if (!productIngredients.length) {
      setError("Debes agregar al menos un ingrediente a la receta")
      return
    }
    setLoading(true)
    try {
      // Solo creación
      const product = await productService.createProduct({
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
      })
      const recipe = await recipeService.createRecipe({
        name: formData.name,
        ingredients: productIngredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unitOfMeasureId: getUnitOfMeasureId(ing.ingredientId)
        })),
      })
      await productRecipeService.createProductRecipe({
        productId: product.id,
        recipeId: recipe.id,
        quantity: 1,
      })
      if (formData.image) {
        // No hagas nada, solo permite la previsualización en el formulario
      }
      setIsDialogOpen(false)
      await fetchAll()
    } catch (e: any) {
      setError(e.message || (e.response && JSON.stringify(e.response)) || "Error guardando producto")
    } finally {
      setLoading(false)
    }
  }

  // Ingredientes handlers
  const addIngredient = () => {
    setProductIngredients([
      ...productIngredients,
      { ingredientId: 0, quantity: 0, unitOfMeasureId: 1 },
    ])
  }
  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...productIngredients]
    updated[index] = { ...updated[index], [field]: value }
    setProductIngredients(updated)
  }
  const removeIngredient = (index: number) => {
    setProductIngredients(productIngredients.filter((_, i) => i !== index))
  }

  // Estado producto
  const toggleProductStatus = async (productId: number) => {
    setLoading(true)
    try {
      await productService.deactivateProduct(productId)
      await fetchAll()
    } catch (e: any) {
      setError(e.message || "Error cambiando estado")
    } finally {
      setLoading(false)
    }
  }
  const deleteProduct = async (productId: number) => {
    setLoading(true)
    try {
      await productService.deactivateProduct(productId)
      await fetchAll()
    } catch (e: any) {
      setError(e.message || "Error eliminando producto")
    } finally {
      setLoading(false)
    }
  }

  // Helper para obtener unitOfMeasureId de un ingrediente
  const getUnitOfMeasureId = (ingredientId: number) => {
    // Busca el ingrediente en el array ingredients y retorna su unitOfMeasureId
    // Si no existe, retorna 1
    // NOTA: Debes agregar unitOfMeasureId al cargar los ingredientes activos
    // Si no está en el modelo actual, deberás agregarlo en el backend o mockearlo aquí
    // Por ahora, asume que unitOfMeasureId está presente en BackendIngredient
    // @ts-ignore
    return ingredients.find(i => i.id === ingredientId)?.unitOfMeasureId || 1
  }

  // UI principal
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
          <p className="text-muted-foreground">Administra el menú del restaurante</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Modifica los datos del producto" : "Crea un nuevo producto del menú"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Producto</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Pollo Broaster"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (S/)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del producto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Imagen del Producto</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        setFormData({ ...formData, image: event.target?.result as string })
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Ingredientes</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {productIngredients.map((ingredient, index) => {
                    const selectedIngredient = ingredients.find(i => i.id === ingredient.ingredientId)
                    return (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <Select
                            value={ingredient.ingredientId.toString()}
                            onValueChange={(value) => {
                              const ingId = Number(value)
                              updateIngredient(index, "ingredientId", ingId)
                              // No se asigna unitOfMeasureId, solo se muestra la abreviatura
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ingrediente" />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredients.map((ing) => (
                                <SelectItem key={ing.id} value={ing.id.toString()}>
                                  {ing.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="0.01"
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredient(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                            placeholder="Cantidad"
                          />
                        </div>
                        <div className="col-span-3 flex items-center">
                          {/* Mostrar la abreviatura de la unidad del ingrediente seleccionado */}
                          <span className="pl-2">{selectedIngredient ? selectedIngredient.unitOfMeasureAbbreviation : "-"}</span>
                        </div>
                        <div className="col-span-1">
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeIngredient(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
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
              <Button onClick={handleSaveProduct}>{editingProduct ? "Guardar Cambios" : "Crear Producto"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Productos del Menú</CardTitle>
          <CardDescription>Lista de todos los productos disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Ingredientes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={`/product-images/product-${product.id}.png`}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">S/ {product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {productRecipes[product.id]?.ingredients.map(ing => {
                          const ingObj = ingredients.find(i => i.id === ing.ingredientId)
                          return `${ingObj ? ingObj.name : '-'} (${ingObj ? ingObj.unitOfMeasureAbbreviation : '-'}) x${ing.quantity}`
                        }).join(", ") || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="destructive" size="sm" onClick={() => deleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
