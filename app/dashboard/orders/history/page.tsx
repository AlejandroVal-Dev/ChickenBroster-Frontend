"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Download, Search } from "lucide-react"
import { orderService } from "@/lib/api"

/*
MÉTODOS PARA CONECTAR A BACKEND:

1. fetchHistoricalOrders(filters?: {date?: string, table?: number})
   - GET /api/orders/history
   - Parámetros: date, table (opcionales)
   - Retorna: HistoricalOrder[]

2. downloadComanda(orderId: number)
   - GET /api/orders/{orderId}/receipt
   - Genera y descarga la comanda en PDF/TXT

3. searchOrdersByDate(date: string)
   - GET /api/orders/history?date={date}
   - Filtrar órdenes por fecha específica

4. searchOrdersByTable(tableNumber: number)
   - GET /api/orders/history?table={tableNumber}
   - Filtrar órdenes por número de mesa
*/

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
  status: number
  totalAmount: number
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchDate, setSearchDate] = useState("")
  const [searchTable, setSearchTable] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper para obtener fecha YYYY-MM-DD
  const getToday = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  // Fetch de órdenes usando el servicio de API
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const data = await orderService.getAllOrders()
        // Ordenar de más reciente a más antigua
        const sorted = data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(sorted)
      } catch (err: any) {
        setError(err.message || "Error al cargar el historial de órdenes")
        console.error("Error fetching orders:", err)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // Filtro de fecha por defecto (hoy)
  useEffect(() => {
    setSearchDate(getToday())
  }, [])

  // Adaptar la función de reimpresión
  const generateComanda = (order: Order) => {
    const fecha = new Date(order.createdAt).toLocaleDateString("es-PE")
    const hora = new Date(order.createdAt).toLocaleTimeString("es-PE")
    let comanda = `\n========================================\n           CHICKENBROSTER\n           REIMPRESIÓN\n========================================\nOrden #${order.id}\nFecha: ${fecha}\nHora: ${hora}\nMesa: ${order.tableId}\nMesero: -\n========================================\nPRODUCTOS:\n----------------------------------------\n`
    order.items.forEach((item) => {
      comanda += `${item.productName}\n`
      comanda += `  Cantidad: ${item.quantity}\n`
      comanda += `  Precio Unit: S/ ${item.unitPrice.toFixed(2)}\n`
      comanda += `  Subtotal: S/ ${(item.unitPrice * item.quantity).toFixed(2)}\n`
      comanda += `----------------------------------------\n`
    })
    comanda += `\nTOTAL: S/ ${order.totalAmount.toFixed(2)}\nMétodo de Pago: -\nEntregado: -\n\n========================================\n        ¡Gracias por su compra!\n========================================\n`
    return comanda
  }

  const downloadComanda = (order: Order) => {
    const content = generateComanda(order)
    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `reimpresion-orden-${order.id}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Filtrar solo órdenes pagadas o completadas (status como número)
  const validStatuses = [0, 2]
  const filteredByStatus = orders.filter(order => validStatuses.includes(order.status))

  // Stats
  const today = getToday()
  const todayOrders = filteredByStatus.filter((order) => order.createdAt.split("T")[0] === today).length
  const todayTotal = filteredByStatus.filter((order) => order.createdAt.split("T")[0] === today).reduce((sum, order) => sum + order.totalAmount, 0)

  // Mes actual (YYYY-MM)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthOrders = filteredByStatus.filter((order) => order.createdAt.slice(0, 7) === currentMonth).length
  const monthTotal = filteredByStatus.filter((order) => order.createdAt.slice(0, 7) === currentMonth).reduce((sum, order) => sum + order.totalAmount, 0)

  // Filtro de órdenes (por fecha y mesa)
  const filteredOrders = filteredByStatus.filter((order) => {
    const orderDate = order.createdAt.split("T")[0]
    const matchesDate = !searchDate || orderDate === searchDate
    const matchesTable = !searchTable || order.tableId.toString().includes(searchTable)
    return matchesDate && matchesTable
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Órdenes</h1>
          <p className="text-muted-foreground">Consulta y reimprime órdenes anteriores</p>
          <p className="text-sm text-muted-foreground mt-2">
            Muestra todas las órdenes del sistema. Usa los filtros para encontrar órdenes específicas.
          </p>
        </div>
        <div className="text-center py-8">Cargando historial de órdenes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Órdenes</h1>
          <p className="text-muted-foreground">Consulta y reimprime órdenes anteriores</p>
          <p className="text-sm text-muted-foreground mt-2">
            Muestra todas las órdenes del sistema. Usa los filtros para encontrar órdenes específicas.
          </p>
        </div>
        <div className="text-center py-8 text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historial de Órdenes</h1>
        <p className="text-muted-foreground">Consulta y reimprime órdenes anteriores</p>
        <p className="text-sm text-muted-foreground mt-2">
          Muestra todas las órdenes del sistema. Usa los filtros para encontrar órdenes específicas.
        </p>
      </div>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {todayTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes del Mes</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {monthTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="searchDate">Buscar por Fecha</Label>
              <Input id="searchDate" type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchTable">Buscar por Mesa</Label>
              <Input
                id="searchTable"
                type="number"
                placeholder="Número de mesa"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchDate("")
                  setSearchTable("")
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Históricas</CardTitle>
          <CardDescription>{filteredOrders.length} órdenes encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No se encontraron órdenes con los filtros aplicados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden #</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>Mesa {order.tableId}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.quantity}x {item.productName}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{order.items.length - 2} más...</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">S/ {order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(order.createdAt).toLocaleDateString("es-PE")}</div>
                        <div className="text-muted-foreground">
                          {new Date(order.createdAt).toLocaleTimeString("es-PE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => downloadComanda(order)}>
                        <Download className="h-4 w-4 mr-1" />
                        Reimprimir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
