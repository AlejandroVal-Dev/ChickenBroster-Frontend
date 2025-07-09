"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Package, AlertTriangle, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiRequest } from "@/lib/api"

// Movement Types
enum MovementType {
  None = 0,
  Income = 1,
  Outcome = 2,
  Adjust = 3
}

interface InventoryItem {
  id: number
  ingredientName: string
  actualStock: number
  minimumStock: number
  underMinimum: boolean
  lastMovement: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

interface InventoryMovement {
  id: number
  ingredientId?: number
  ingredientName: string
  unitOfMeasureAbbreviation: string
  quantity: number
  movementType: string // 'Income' | 'Outcome' | 'Adjust'
  reason: string
  madeByUserId: number
  movementDate: string
}

interface CreateMovementRequest {
  ingredientId: number
  unitOfMeasureId: number
  quantity: number
  movementType: MovementType
  reason: string
  madeByUserId: number
}

interface MovementFilterRequest {
  ingredientId?: number
  from?: string
  to?: string
  movementType?: MovementType
  madeByUserId?: number
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [movementData, setMovementData] = useState({
    type: MovementType.Income,
    quantity: "",
    reason: "",
  })
  const [error, setError] = useState("")
  const [movementsError, setMovementsError] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)

  // Fetch inventory data
  const fetchInventory = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiRequest<InventoryItem[]>("/inventory/Inventory/actives")
      setInventory(data || [])
    } catch {
      setError('Error al cargar el inventario')
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch movements using basic endpoint and sort by date
  const fetchMovements = async () => {
    setMovementsError("")
    try {
      const data = await apiRequest<InventoryMovement[]>("/inventory/InventoryMovement")
      const sorted = (data || []).sort((a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime())
      setMovements(sorted)
    } catch {
      setMovements([])
      setMovementsError("Error al cargar movimientos")
    }
  }

  // Create movement
  const createMovement = async (movementData: CreateMovementRequest) => {
    try {
      return await apiRequest<InventoryMovement>("/inventory/InventoryMovement", {
        method: 'POST',
        body: JSON.stringify(movementData),
      })
    } catch (error) {
      console.error('Error creating movement:', error)
      throw error
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchInventory()
    fetchMovements()
  }, [])

  const handleOpenMovementDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setMovementData({
      type: MovementType.Income,
      quantity: "",
      reason: "",
    })
    setError("")
    setIsMovementDialogOpen(true)
  }

  const handleSaveMovement = async () => {
    if (!selectedItem || !movementData.quantity || !movementData.reason) {
      setError("Todos los campos son obligatorios")
      return
    }

    const quantity = Number.parseFloat(movementData.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      setError("La cantidad debe ser un número válido mayor a 0")
      return
    }

    // Verificar si hay suficiente stock para salidas
    if (movementData.type === MovementType.Outcome && quantity > selectedItem.actualStock) {
      setError("No hay suficiente stock disponible")
      return
    }

    try {
      const movementRequest: CreateMovementRequest = {
        ingredientId: selectedItem.id,
        unitOfMeasureId: 1, // Default unit ID
        quantity: quantity,
        movementType: movementData.type,
        reason: movementData.reason,
        madeByUserId: 1, // Default user ID
      }

      await createMovement(movementRequest)
      
      // Refresh data
      await fetchInventory()
      await fetchMovements()
      
      setIsMovementDialogOpen(false)
    } catch (error) {
      setError("Error al registrar el movimiento")
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.actualStock <= 0) {
      return {
        status: "empty",
        color: "bg-red-500 text-white",
        text: "Sin Stock",
        icon: <XCircle className="h-4 w-4" />,
        priority: 4,
      }
    } else if (item.underMinimum) {
      return {
        status: "critical",
        color: "bg-red-100 text-red-800 border-red-300",
        text: "Stock Crítico",
        icon: <AlertTriangle className="h-4 w-4" />,
        priority: 3,
      }
    } else if (item.actualStock <= item.minimumStock * 1.5) {
      return {
        status: "low",
        color: "bg-orange-100 text-orange-800 border-orange-300",
        text: "Stock Bajo",
        icon: <AlertCircle className="h-4 w-4" />,
        priority: 2,
      }
    } else {
      return {
        status: "normal",
        color: "bg-green-100 text-green-800 border-green-300",
        text: "Stock Normal",
        icon: <CheckCircle2 className="h-4 w-4" />,
        priority: 0,
      }
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "Income":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "Outcome":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "Adjust":
        return <Package className="h-4 w-4 text-blue-600" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getMovementTypeText = (type: string) => {
    switch (type) {
      case "Income":
        return "entrada"
      case "Outcome":
        return "salida"
      case "Adjust":
        return "ajuste"
      default:
        return "desconocido"
    }
  }

  // Filtros y estadísticas
  const outOfStockItems = inventory.filter((item) => item.actualStock === 0)
  const criticalItems = inventory.filter((item) => item.actualStock > 0 && item.underMinimum)
  const lowStockItems = inventory.filter(
    (item) => item.actualStock > 0 && !item.underMinimum && item.actualStock <= item.minimumStock * 1.5,
  )

  // Filtrar inventario según el estado seleccionado
  const filteredInventory = inventory
    .filter((item) => {
      const status = getStockStatus(item).status
      switch (filterStatus) {
        case "outofstock":
          return item.actualStock === 0
        case "critical":
          return item.actualStock > 0 && status === "critical"
        case "low":
          return item.actualStock > 0 && status === "low"
        case "normal":
          return item.actualStock > 0 && status === "normal"
        default:
          return true
      }
    })
    .sort((a, b) => {
      // Ordenar por prioridad (sin stock y críticos primero)
      const statusA = getStockStatus(a)
      const statusB = getStockStatus(b)
      return statusB.priority - statusA.priority
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando inventario...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Inventario</h1>
        <p className="text-muted-foreground">Controla el stock de ingredientes y materias primas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-500 bg-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">Sin Stock</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{outOfStockItems.length}</div>
            <p className="text-xs text-red-700">Productos agotados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Stock Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalItems.length}</div>
            <p className="text-xs text-red-600">Requiere atención inmediata</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Stock Bajo</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
            <p className="text-xs text-orange-600">Considerar reposición</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticas */}
      {outOfStockItems.length > 0 && (
        <Alert className="border-red-500 bg-red-100">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>¡ATENCIÓN!</strong> Tienes {outOfStockItems.length} productos <b>sin stock</b>: {" "}
            <span className="font-medium">{outOfStockItems.map((item) => item.ingredientName).join(", ")}</span>
          </AlertDescription>
        </Alert>
      )}
      {criticalItems.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>¡ATENCIÓN!</strong> Tienes {criticalItems.length} productos con stock crítico: {" "}
            <span className="font-medium">{criticalItems.map((item) => item.ingredientName).join(", ")}</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Inventory Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Inventario Actual</CardTitle>
                  <CardDescription>Estado visual del stock de ingredientes</CardDescription>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los items</SelectItem>
                    <SelectItem value="critical">Stock Crítico</SelectItem>
                    <SelectItem value="low">Stock Bajo</SelectItem>
                    <SelectItem value="normal">Stock Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {inventory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay inventario disponible
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item)

                    return (
                      <Card
                        key={item.id}
                        className={`transition-all hover:shadow-md ${status.color.includes("border") ? status.color : ""}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {status.icon}
                                <h3 className="font-semibold text-lg">{item.ingredientName}</h3>
                              </div>
                              <Badge className={status.color}>{status.text}</Badge>
                            </div>
                            <Button size="sm" onClick={() => handleOpenMovementDialog(item)}>
                              Movimiento
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className="text-2xl font-bold">
                                {item.actualStock}
                              </div>
                              <div className="text-sm text-muted-foreground">Stock actual</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-medium">Mín: {item.minimumStock}</div>
                              <div className="text-sm text-muted-foreground">Stock mínimo</div>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Último movimiento: {item.lastMovement ? new Date(item.lastMovement).toLocaleDateString() : 'N/A'}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle>Movimientos Recientes</CardTitle>
            <CardDescription>Últimos movimientos de inventario</CardDescription>
          </CardHeader>
          <CardContent>
            {movementsError ? (
              <div className="text-center py-4 text-red-600">
                {movementsError}
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay movimientos recientes
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {movements.slice(0, 10).map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getMovementIcon(movement.movementType)}
                      <div>
                        <div className="font-medium">{movement.ingredientName || `Ingrediente ${movement.ingredientId}`}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(movement.movementDate).toLocaleString()} • Usuario {movement.madeByUserId}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-medium text-lg ${
                          movement.movementType === "Income"
                            ? "text-green-600"
                            : movement.movementType === "Outcome"
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      >
                        {movement.movementType === "Income" ? "+" : movement.movementType === "Outcome" ? "-" : "="}
                        {movement.quantity}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">{getMovementTypeText(movement.movementType)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Movement Dialog */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento de Stock</DialogTitle>
            <DialogDescription>{selectedItem && `Registra un movimiento para: ${selectedItem.ingredientName}`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedItem && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Stock actual:</span> {selectedItem.actualStock}
                  </div>
                  <div>
                    <span className="font-medium">Stock mínimo:</span> {selectedItem.minimumStock}
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span> {selectedItem.underMinimum ? 'Bajo mínimo' : 'Normal'}
                  </div>
                  <div>
                    <span className="font-medium">Último movimiento:</span> {selectedItem.lastMovement ? new Date(selectedItem.lastMovement).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <Select
                value={movementData.type.toString()}
                onValueChange={(value) =>
                  setMovementData({ ...movementData, type: parseInt(value) as MovementType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MovementType.Income.toString()}>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Entrada (Compra/Recepción)
                    </div>
                  </SelectItem>
                  <SelectItem value={MovementType.Outcome.toString()}>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Salida (Uso/Venta)
                    </div>
                  </SelectItem>
                  <SelectItem value={MovementType.Adjust.toString()}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Ajuste de Inventario
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                step="0.01"
                value={movementData.quantity}
                onChange={(e) => setMovementData({ ...movementData, quantity: e.target.value })}
                placeholder="Cantidad"
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo/Observación</Label>
              <Textarea
                value={movementData.reason}
                onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                placeholder="Describe el motivo del movimiento"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMovement}>Registrar Movimiento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
