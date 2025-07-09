"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { orderService, tableService, cashboxService, paymentService, CashRegisterSession, Payment } from "@/lib/api"

interface OrderItem {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: number
  userId: number
  tableId: number
  orderType: number
  status: number // 1: Created, 2: Paid
  totalAmount: number
  createdAt: string
  updatedAt: string | null
  items: OrderItem[]
}

// Nueva interfaz para mesa
interface Table {
  id: number
  number: string
  isAvailable: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const statusText: Record<number, string> = {
  1: "Creada",
  2: "Pagada",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableNumbers, setTableNumbers] = useState<Record<number, string>>({})
  const { toast } = useToast();

  // Fetch orders y mesas activas
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError(null)
      try {
        const data: Order[] = await orderService.getAllOrders()
        setOrders(data.filter(o => o.status === 1 || o.status === 2))
      } catch (err: any) {
        setError(err.message || "Error desconocido")
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()

    // Fetch table numbers
    const fetchTables = async () => {
      try {
        const tables: Table[] = await tableService.getActiveTables()
        const map: Record<number, string> = {}
        tables.forEach((t) => { map[t.id] = t.number })
        setTableNumbers(map)
      } catch (err) {
        // Manejo de error opcional
        console.error("Error fetching tables:", err)
      }
    }
    fetchTables()
  }, [])

  // Mark as completed
  const handleComplete = async (orderId: number) => {
    try {
      // Buscar la orden para obtener el monto
      const completedOrder = orders.find(o => o.id === orderId)
      if (!completedOrder) {
        throw new Error("Orden no encontrada")
      }

      // Actualizar orden en el backend - marcar como completada (status = 2)
      // await orderService.updateOrderStatus(orderId, 2)

      // Registrar movimiento en caja
      try {
        const user = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")!) : null
        const sessions = await cashboxService.getAllCashRegisters()
        const today = new Date().toISOString().split('T')[0]
        const openSession = sessions.find((s: CashRegisterSession) => s.status === "Open" && s.openedAt.split("T")[0] === today)
        
        if (!openSession) {
          toast({
            title: "Advertencia",
            description: "No hay caja abierta para registrar el movimiento de la orden.",
            variant: "destructive",
          })
        } else if (user && completedOrder) {
          // Obtener el método de pago de la orden usando el servicio de API
          const payments = await paymentService.getAllPayments()
          const orderPayment = payments.find((p: Payment) => p.orderId === orderId)
          const paymentMethod = orderPayment ? 
            (orderPayment.paymentMethod === 1 ? "efectivo" : 
             orderPayment.paymentMethod === 2 ? "tarjeta" : 
             orderPayment.paymentMethod === 3 ? "yape" : "efectivo") : "efectivo"
          
          await cashboxService.createMovement({
            sessionId: openSession.id,
            type: 1,
            amount: completedOrder.totalAmount,
            description: `Orden #${completedOrder.id} completada - ${paymentMethod}`,
            madeByUserId: user.id,
          })
        }
      } catch (e: any) {
        console.error("Error registering cash movement:", e)
        toast({
          title: "Advertencia",
          description: "No se pudo registrar el movimiento en caja.",
          variant: "destructive",
        })
      }

      // Marcar orden como completada (actualizar estado local)
      setOrders(orders => orders.filter(o => o.id !== orderId))
      
      toast({
        title: "Orden completada",
        description: `La orden #${orderId} ha sido completada correctamente.`,
        variant: "default",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al marcar como completada",
        variant: "destructive",
      })
    }
  }

  // Cancel order
  const handleCancel = async (orderId: number) => {
    try {
      // Actualizar orden en el backend - marcar como cancelada (status = 0)
      // await orderService.updateOrderStatus(orderId, 0)

      // Actualizar estado local (marcar como cancelada)
      setOrders(orders => orders.filter(o => o.id !== orderId))
      
      toast({
        title: "Orden cancelada",
        description: `La orden #${orderId} ha sido cancelada correctamente.`,
        variant: "destructive",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al cancelar la orden",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Órdenes</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Nota: Las actualizaciones de estado se reflejan solo en la interfaz. Los cambios no se persisten en el backend.
        </p>
      </div>
      {loading && <div>Cargando órdenes...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.length === 0 && <div className="col-span-full text-center text-muted-foreground">No hay órdenes activas</div>}
          {orders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle>Orden #{order.id}</CardTitle>
                <Badge>{statusText[order.status] || order.status}</Badge>
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-sm text-muted-foreground">
                  Mesa: {tableNumbers[order.tableId] || order.tableId}
                </div>
                <div className="mb-2 text-sm text-muted-foreground">Fecha: {new Date(order.createdAt).toLocaleString()}</div>
                <div className="mb-2">
                  <div className="font-semibold">Items:</div>
                  <ul className="ml-4 list-disc">
                    {order.items.map(item => (
                      <li key={item.productId} className="text-sm">
                        {item.quantity}x {item.productName} (S/ {item.unitPrice}) - Total: S/ {item.totalPrice}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4 font-bold text-green-700">Total: S/ {order.totalAmount}</div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleComplete(order.id)}>
                    Listo
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleCancel(order.id)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
