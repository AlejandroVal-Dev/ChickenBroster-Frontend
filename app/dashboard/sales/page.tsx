"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect, Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Clock, CheckCircle } from "lucide-react"
import { tableService, productService, BackendTable, BackendProduct, orderService, CreateOrderRequest, cashboxService, CashRegisterSession } from "@/lib/api"

interface Table {
  id: number
  number: number | string // Permitir "Para Llevar"
  capacity: number
  status: "available" | "occupied" | "reserved"
  currentOrder?: {
    id: number
    items: number
    total: number
    startTime: string
  }
}

const initialTables: Table[] = [
  { id: 0, number: "Para Llevar", capacity: 0, status: "available" as const }, // Mesa Para Llevar - siempre disponible
]

// Utilidad para cargar mesas desde backend y agregar solo una mesa 'Para Llevar'
const fetchAndSetTables = async (
  setTables: Dispatch<SetStateAction<Table[]>>,
  setLoadingTables: (loading: boolean) => void
) => {
  setLoadingTables(true)
  try {
    const backendTables = await tableService.getActiveTables()
    const orders = await orderService.getAllOrders()
    // Filtrar órdenes con estado Created (1) o Paid (2)
    const busyTableIds = new Set(
      orders
        .filter((order: any) => order.status === 1 || order.status === 2)
        .map((order: any) => order.tableId)
    )
    // Buscar la mesa 'Para llevar' y ponerla al principio
    const paraLlevarTable = backendTables.find((t) => t.number.trim().toLowerCase() === "para llevar")
    const otherTables = backendTables.filter((t) => t.number.trim().toLowerCase() !== "para llevar")
    const mappedTables: Table[] = [
      ...(paraLlevarTable
        ? [{
            id: paraLlevarTable.id,
            number: paraLlevarTable.number,
            capacity: 0,
            status: "available" as const, // Siempre disponible
          }]
        : []),
      ...otherTables.map((t) => ({
        id: t.id,
        number: t.number,
        capacity: 0,
        status: busyTableIds.has(t.id) ? ("occupied" as const) : ("available" as const),
      })),
    ]
    setTables(mappedTables)
  } catch (e) {
    // Manejo de error
  } finally {
    setLoadingTables(false)
  }
}

export default function SalesPage() {
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isPOSOpen, setIsPOSOpen] = useState(false)
  const [loadingTables, setLoadingTables] = useState(false)

  useEffect(() => {
    fetchAndSetTables(setTables, setLoadingTables)
  }, [])

  const getStatusColor = (status: string, isParaLlevar = false) => {
    if (isParaLlevar) return "bg-green-100 text-green-800 border-green-200"
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "occupied":
        return "bg-red-100 text-red-800 border-red-200"
      case "reserved":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string, isParaLlevar = false) => {
    if (isParaLlevar) return "Siempre Disponible"
    switch (status) {
      case "available":
        return "Disponible"
      case "occupied":
        return "Ocupada"
      case "reserved":
        return "Reservada"
      default:
        return status
    }
  }

  const handleTableClick = (table: Table) => {
    // La mesa Para Llevar (id: 0) siempre está disponible
    if (table.id === 0 || table.status === "available") {
      setSelectedTable(table)
      setIsPOSOpen(true)
    } else if (table.status === "occupied") {
      setSelectedTable(table)
      setIsPOSOpen(true)
    }
  }

  const availableTables = tables.filter((t) => t.status === "available").length
  const occupiedTables = tables.filter((t) => t.status === "occupied").length
  const reservedTables = tables.filter((t) => t.status === "reserved").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ventas - Selección de Mesa</h1>
        <p className="text-muted-foreground">Selecciona una mesa para iniciar una venta</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesas Disponibles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableTables}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesas Ocupadas</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{occupiedTables}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesas Reservadas</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{reservedTables}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Mesas</CardTitle>
          <CardDescription>
            Haz clic en una mesa disponible para iniciar una venta o en una ocupada para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
            {tables.map((table) => {
              const isParaLlevar = typeof table.number === "string" && table.number.trim().toLowerCase() === "para llevar"

              return (
                <Card
                  key={table.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${getStatusColor(table.status, isParaLlevar)} ${
                    table.status === "reserved" && !isParaLlevar ? "cursor-not-allowed opacity-60" : ""
                  } ${isParaLlevar ? "border-2 border-blue-300" : ""}`}
                  onClick={() => (table.status !== "reserved" || isParaLlevar) && handleTableClick(table)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold mb-2">
                      {isParaLlevar ? "Para Llevar" : `Mesa ${table.number}`}
                    </div>
                    <Badge className={getStatusColor(table.status, isParaLlevar)}>
                      {getStatusText(table.status, isParaLlevar)}
                    </Badge>
                    {isParaLlevar && <div className="mt-2 text-xs text-blue-600">Pedidos para llevar</div>}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* POS Dialog */}
      <Dialog open={isPOSOpen} onOpenChange={setIsPOSOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Punto de Venta - {selectedTable?.id === 0 ? "Para Llevar" : `Mesa ${selectedTable?.number}`}
            </DialogTitle>
            <DialogDescription>
              {selectedTable?.status === "occupied"
                ? `Continuando orden #${selectedTable.currentOrder?.id}`
                : "Nueva orden"}
            </DialogDescription>
          </DialogHeader>
          {selectedTable && (
            <POSSystem
              table={selectedTable}
              onClose={() => setIsPOSOpen(false)}
              onOrderComplete={(table: Table, order: any) => {
                if (table.id === 0) {
                  setIsPOSOpen(false)
                  return
                }
                setTables(
                  tables.map((t) => (t.id === table.id ? { ...t, status: "occupied", currentOrder: order } : t)),
                )
                setIsPOSOpen(false)
              }}
              setTables={setTables}
              setLoadingTables={setLoadingTables}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente del Sistema POS
function POSSystem({
  table,
  onClose,
  onOrderComplete,
  setTables,
  setLoadingTables,
}: {
  table: Table
  onClose: () => void
  onOrderComplete: (table: Table, order: any) => void
  setTables: Dispatch<SetStateAction<Table[]>>
  setLoadingTables: (loading: boolean) => void
}) {
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [orderItems, setOrderItems] = useState<any[]>(
    table.currentOrder ? [] : [],
  )
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true)
      try {
        const backendProducts = await productService.getActiveProducts()
        setProducts(backendProducts)
      } catch (e) {
        // Manejo de error
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [])

  const addToOrder = (product: BackendProduct) => {
    const existingItem = orderItems.find((item) => item.id === product.id)
    if (existingItem) {
      setOrderItems(
        orderItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1 }])
    }
  }

  const removeFromOrder = (productId: number) => {
    setOrderItems(orderItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(productId)
    } else {
      setOrderItems(orderItems.map((item) => (item.id === productId ? { ...item, quantity } : item)))
    }
  }

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleCompleteOrder = async () => {
    // Generar comanda/boleta
    const orderData = {
      id: table.currentOrder?.id || Math.floor(Math.random() * 1000) + 100,
      items: orderItems.length,
      total: total,
      startTime: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      paymentMethod,
    }
    // Guardar orden en backend
    const orderPayload: CreateOrderRequest = {
      userId: 0, // Puedes cambiar esto si tienes auth
      tableId: table.id,
      orderType: table.id === 0 ? 2 : 1, // 2 = TakeAway, 1 = DineIn
      items: orderItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    }
    try {
      await orderService.createOrder(orderPayload)
      // Registrar movimiento en caja
      try {
        // Obtener usuario actual
        const user = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")!) : null
        // Obtener sesión de caja abierta del día
        const sessions = await cashboxService.getAllCashRegisters()
        const today = new Date().toISOString().split("T")[0]
        const openSession = sessions.find((s: CashRegisterSession) => s.status === "Open" && s.openedAt.split("T")[0] === today)
        if (!openSession) {
          setError("No hay caja abierta para registrar el movimiento de la orden.")
        } else if (user) {
          await cashboxService.createMovement({
            sessionId: openSession.id,
            type: 1,
            amount: total,
            description: `Orden #${orderData.id} - ${paymentMethod}`,
            madeByUserId: user.id,
          })
        }
      } catch (e: any) {
        setError(e.message || "No se pudo registrar el movimiento en caja.")
      }
      // Si la mesa NO es 'Para llevar', marcar como ocupada y actualizar estado local
      const isParaLlevar = typeof table.number === "string" && table.number.trim().toLowerCase() === "para llevar"
      if (!isParaLlevar) {
        await tableService.occupyTable(table.id)
        const updatedTable = await tableService.getTable(table.id)
        setTables((prevTables: Table[]) => prevTables.map((t: Table) =>
          t.id === table.id
            ? { ...t, status: updatedTable.isAvailable ? "available" : "occupied" }
            : t
        ))
      }
    } catch (e) {
      // Manejo de error
    }
    const comandaText = generateComanda(table, orderItems, total, paymentMethod)
    downloadComanda(
      comandaText,
      `comanda-${table.id === 0 ? "para-llevar" : `mesa-${table.number}`}-${orderData.id}.txt`,
    )
    onOrderComplete(table, orderData)
  }

  const generateComanda = (table: Table, items: any[], total: number, payment: string) => {
    const now = new Date()
    const fecha = now.toLocaleDateString("es-PE")
    const hora = now.toLocaleTimeString("es-PE")

    let comanda = `
========================================
         CHICKENBROSTER
========================================
Fecha: ${fecha}
Hora: ${hora}
${table.id === 0 ? "PARA LLEVAR" : `Mesa: ${table.number}`}
${table.id !== 0 ? `Capacidad: ${table.capacity} personas` : ""}
========================================
PRODUCTOS:
----------------------------------------
`

    items.forEach((item) => {
      comanda += `${item.name}\n`
      comanda += `  Cantidad: ${item.quantity}\n`
      comanda += `  Precio Unit: S/ ${item.price.toFixed(2)}\n`
      comanda += `  Subtotal: S/ ${(item.price * item.quantity).toFixed(2)}\n`
      comanda += `----------------------------------------\n`
    })

    comanda += `
TOTAL: S/ ${total.toFixed(2)}
Método de Pago: ${payment.toUpperCase()}

========================================
      ¡Gracias por su compra!
========================================
`

    return comanda
  }

  const downloadComanda = (content: string, filename: string) => {
    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Al cerrar el POS, marcar la mesa como disponible si no es para llevar
  const handleClosePOS = async () => {
    if (table.id !== 0) {
      try {
        await tableService.makeTableAvailable(table.id)
        // Recargar mesas tras liberar
        fetchAndSetTables(setTables, setLoadingTables)
      } catch (e) {
        // Manejo de error
      }
    }
    onClose()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
      {/* Products List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-96">
          {loadingProducts ? (
            <div>Cargando productos...</div>
          ) : (
            products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addToOrder(product)}
              >
                <CardContent className="p-3">
                  <img
                    src={"/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-20 object-cover rounded mb-2"
                  />
                  <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                  <p className="text-lg font-bold text-green-600">S/ {product.price.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      {/* Order Summary */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Orden</CardTitle>
            <CardDescription>{table.id === 0 ? "Para Llevar" : `Mesa ${table.number}`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-48 overflow-y-auto space-y-2">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">S/ {item.price.toFixed(2)} c/u</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      -
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
            </div>
            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <div className="grid grid-cols-3 gap-2">
                {["efectivo", "tarjeta", "yape"].map((method) => (
                  <Button
                    key={method}
                    variant={paymentMethod === method ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Button className="w-full" onClick={handleCompleteOrder} disabled={orderItems.length === 0}>
                Generar Comanda
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={handleClosePOS}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
