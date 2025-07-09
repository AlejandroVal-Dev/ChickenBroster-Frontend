"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, ShoppingCart, Users, AlertTriangle, Package, Clock, Target } from "lucide-react"

import { 
  tableService, 
  orderService,
  apiRequest
} from "@/lib/api"

interface DashboardStats {
  totalTables: number
  availableTables: number
  occupiedTables: number
  totalOrders: number
  dailyOrders: number
  activeOrders: number
  dailySales: number
  avgOrderValue: number
  lowStockItems: number
}

interface RecentOrder {
  id: number
  tableId: number
  tableNumber: string
  totalAmount: number
  status: number
  createdAt: string
  items: Array<{
    productName: string
    quantity: number
  }>
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

interface LowStockItem {
  id: number
  name: string
  currentStock: number
  minimumStock: number
  unitOfMeasureAbbreviation: string
  urgency: "critical" | "high" | "medium"
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTables: 0,
    availableTables: 0,
    occupiedTables: 0,
    totalOrders: 0,
    dailyOrders: 0,
    activeOrders: 0,
    dailySales: 0,
    avgOrderValue: 0,
    lowStockItems: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch tables data from main tables module
        const tables = await tableService.getActiveTables()
        const availableTables = tables.filter(t => t.isAvailable).length
        const occupiedTables = tables.filter(t => !t.isAvailable).length

        // Fetch orders data from main orders module
        const orders = await orderService.getAllOrders()
        const today = new Date().toISOString().split('T')[0]
        const todayOrders = orders.filter(order => 
          order.createdAt.split('T')[0] === today
        )
        const dailyOrders = todayOrders.length
        const activeOrders = orders.filter(order => order.status === 1).length
        const dailySales = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
        const avgOrderValue = orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0

        // Fetch inventory data for low stock alerts
        const inventory = await apiRequest<InventoryItem[]>("/inventory/Inventory/actives")
        const lowStockItems = inventory.filter(item => 
          item.actualStock <= item.minimumStock
        )

        // Get recent orders (last 5 active ones)
        const recentOrdersData = orders
          .filter(order => order.status === 1) // Only active orders
          .slice(0, 5)
          .map(order => ({
            id: order.id,
            tableId: order.tableId,
            tableNumber: `Mesa ${order.tableId}`,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            items: order.items || []
          }))

        // Get low stock items
        const lowStockItemsData = lowStockItems.map(item => ({
          id: item.id,
          name: item.ingredientName,
          currentStock: item.actualStock,
          minimumStock: item.minimumStock,
          unitOfMeasureAbbreviation: "kg", // Default unit
          urgency: (item.actualStock === 0 ? "critical" : 
                  item.actualStock <= item.minimumStock * 0.5 ? "high" : "medium") as "critical" | "high" | "medium"
        }))

        setStats({
          totalTables: tables.length,
          availableTables,
          occupiedTables,
          totalOrders: orders.length,
          dailyOrders,
          activeOrders,
          dailySales,
          avgOrderValue,
          lowStockItems: lowStockItems.length
        })

        setRecentOrders(recentOrdersData)
        setLowStockItems(lowStockItemsData)

      } catch (err: any) {
        setError(err.message || "Error al cargar datos del dashboard")
        console.error("Dashboard error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return "Activa"
      case 2:
        return "Pagada"
      default:
        return "Desconocido"
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return "bg-orange-100 text-orange-800 border-orange-200"
      case 2:
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"
    }
  }

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "CRÍTICO"
      case "high":
        return "BAJO"
      default:
        return "MEDIO"
    }
  }

  const occupancyPercentage = stats.totalTables > 0 ? (stats.occupiedTables / stats.totalTables) * 100 : 0
  const dailyGoal = 1500 // Meta diaria
  const goalPercentage = dailyGoal > 0 ? (stats.dailySales / dailyGoal) * 100 : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Resumen general del restaurante - {new Date().toLocaleDateString("es-PE")}
          </p>
        </div>
        <div className="text-center py-8 text-orange-600">Cargando datos del dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Resumen general del restaurante - {new Date().toLocaleDateString("es-PE")}
          </p>
        </div>

        <div className="text-center py-8 text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Resumen general del restaurante - {new Date().toLocaleDateString("es-PE")}
        </p>
      </div>



      {/* Stats Cards Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Ventas del Día</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">S/ {stats.dailySales.toFixed(2)}</div>
            <div className="mt-2">
              <Progress value={goalPercentage} className="h-2 bg-orange-200" />
              <p className="text-xs text-orange-600 mt-1">
                {goalPercentage.toFixed(1)}% de la meta (S/ {dailyGoal})
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">Órdenes del Día</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.dailyOrders}</div>
            <div className="flex justify-between text-xs text-amber-600 mt-1">
              <span>Total: {stats.totalOrders}</span>
              <span>Promedio: S/ {stats.avgOrderValue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-300 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-800/20 dark:to-amber-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Ocupación</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {stats.occupiedTables}/{stats.totalTables}
            </div>
            <div className="mt-2">
              <Progress value={occupancyPercentage} className="h-2 bg-orange-200" />
              <p className="text-xs text-orange-600 mt-1">{occupancyPercentage.toFixed(0)}% ocupación</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.lowStockItems}</div>
            <p className="text-xs text-red-600 mt-1">Items requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Información Adicional */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-sm font-medium text-orange-800 dark:text-orange-200">Mesas Disponibles</div>
                <div className="text-lg font-bold text-orange-700 dark:text-orange-300">{stats.availableTables}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-amber-600" />
              <div>
                <div className="text-sm font-medium text-amber-800 dark:text-amber-200">Órdenes Activas</div>
                <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{stats.activeOrders}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-300 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-800/20 dark:to-amber-800/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-sm font-medium text-orange-800 dark:text-orange-200">Total Mesas</div>
                <div className="text-lg font-bold text-orange-700 dark:text-orange-300">{stats.totalTables}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Órdenes Recientes */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              Órdenes Recientes
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Últimas órdenes activas del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No hay órdenes activas
                </div>
              ) : (
                recentOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-orange-400">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-lg">#{order.id}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{order.tableNumber}</span>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">S/ {order.totalAmount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{order.items.length} items</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Creada: {new Date(order.createdAt).toLocaleTimeString("es-PE", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString("es-PE")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estado de Inventario */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Estado de Inventario
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Ingredientes que requieren atención inmediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No hay alertas de inventario
                </div>
              ) : (
                lowStockItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`border-l-4 ${item.urgency === "critical" ? "border-l-red-500" : "border-l-orange-400"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          <div>
                            <span className="font-semibold text-lg">{item.name}</span>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Mínimo requerido: {item.minimumStock} {item.unitOfMeasureAbbreviation}
                            </div>
                          </div>
                        </div>
                        <Badge className={getUrgencyColor(item.urgency)}>
                          {getUrgencyText(item.urgency)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-right">
                          <div className="text-xl font-bold text-red-600">
                            {item.currentStock} {item.unitOfMeasureAbbreviation}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Stock actual</div>
                        </div>
                        <div className="flex-1 mx-4">
                          <Progress 
                            value={item.minimumStock > 0 ? (item.currentStock / item.minimumStock) * 100 : 0} 
                            className="h-2 bg-orange-200" 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
