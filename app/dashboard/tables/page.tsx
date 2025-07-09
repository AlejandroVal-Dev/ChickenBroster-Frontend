"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Edit, Trash2, MapPin, Loader2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { tableService, BackendTable, ApiError, checkTableExists } from "@/lib/api"

interface RestaurantTable {
  id: number
  number: string
  status: "available" | "occupied"
  active: boolean
  notes?: string
}

const statuses = [
  { value: "available", label: "Disponible", color: "bg-green-100 text-green-800" },
  { value: "occupied", label: "Ocupada", color: "bg-red-100 text-red-800" },
]

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null)
  const [formData, setFormData] = useState({
    number: "",
    notes: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Función para ordenar mesas
  const sortTables = (tables: RestaurantTable[]): RestaurantTable[] => {
    return tables.sort((a, b) => {
      // "LLEVAR" siempre va primero
      if (a.number === "LLEVAR") return -1
      if (b.number === "LLEVAR") return 1
      
      // Convertir números a enteros para comparación numérica
      const numA = parseInt(a.number)
      const numB = parseInt(b.number)
      
      // Si ambos son números válidos, ordenar numéricamente
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      
      // Si solo uno es número, el número va primero
      if (!isNaN(numA)) return -1
      if (!isNaN(numB)) return 1
      
      // Si ambos son strings, ordenar alfabéticamente
      return a.number.localeCompare(b.number)
    })
  }

  // Cargar tablas desde el backend
  const loadTables = async () => {
    try {
      setLoading(true)
      const backendTables = await tableService.getActiveTables()
      
      // Convertir datos del backend al formato local
      const convertedTables: RestaurantTable[] = backendTables.map(table => ({
        id: table.id,
        number: table.number,
        status: table.isAvailable ? "available" : "occupied",
        active: table.isActive,
        notes: "",
      }))
      
      // Ordenar las tablas antes de guardarlas en el estado
      const sortedTables = sortTables(convertedTables)
      setTables(sortedTables)
    } catch (error) {
      console.error("Error loading tables:", error)
      setError("Error al cargar las tablas desde el servidor")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTables()
  }, [])

  const handleOpenDialog = (table?: RestaurantTable) => {
    if (table) {
      if (table.number.trim().toLowerCase() === "para llevar") return;
      setEditingTable(table)
      setFormData({
        number: table.number,
        notes: table.notes || "",
      })
    } else {
      setEditingTable(null)
      setFormData({
        number: "",
        notes: "",
      })
    }
    setError("")
    setIsDialogOpen(true)
  }

  const handleSaveTable = async () => {
    if (!formData.number.trim()) {
      setError("Número de mesa es obligatorio")
      return
    }

    try {
      setSaving(true)
      setError("")

      if (editingTable) {
        // Editar mesa existente - en este caso solo actualizamos el estado local
        // ya que el backend no tiene endpoint de edición
        setTables(
          tables.map((table) =>
            table.id === editingTable.id
              ? {
                  ...table,
                  number: formData.number,
                  notes: formData.notes,
                }
              : table,
          ),
        )
      } else {
        // Crear nueva mesa
        let success = false
        
        try {
          // Intentar crear la mesa
          await tableService.createTable({ number: formData.number })
          success = true
        } catch (error) {
          console.log("Error creating table:", error)
          
          // Si el error es 400 (mesa ya existe), intentar restaurarla
          if (error instanceof ApiError && error.status === 400) {
            console.log("Table already exists, attempting to restore...")
            
            try {
              // Buscar la mesa existente
              const existingTable = await checkTableExists(formData.number)
              console.log("Existing table found:", existingTable)
              
              if (existingTable) {
                // Restaurar la mesa existente
                await tableService.restoreTable(existingTable.id)
                console.log("Table restored successfully")
                success = true
              } else {
                console.log("No existing table found, will show error")
                // No re-lanzar el error, solo marcar como fallido
                success = false
              }
            } catch (restoreError) {
              console.error("Error during restore:", restoreError)
              // No re-lanzar el error, solo marcar como fallido
              success = false
            }
          } else {
            // Para otros errores, re-lanzar
            throw error
          }
        }
        
        // Solo recargar si la operación fue exitosa
        if (success) {
          await loadTables()
        } else {
          // Si falló la restauración, mostrar error
          setError("No se pudo crear o restaurar la mesa")
          return // Salir sin cerrar el diálogo
        }
      }

      setIsDialogOpen(false)
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message)
      } else {
        setError("Error al guardar la mesa")
      }
    } finally {
      setSaving(false)
    }
  }

  const updateTableStatus = async (tableId: number, newStatus: RestaurantTable["status"]) => {
    // Prevenir que la mesa "LLEVAR" cambie de estado
    const table = tables.find(t => t.id === tableId)
    if (table && table.number === "LLEVAR") {
      alert("La mesa 'LLEVAR' siempre debe mantenerse disponible")
      return
    }

    try {
      if (newStatus === "occupied") {
        await tableService.occupyTable(tableId)
      } else {
        await tableService.makeTableAvailable(tableId)
      }
      
      // Obtener el estado actualizado desde el backend
      const updatedTable = await tableService.getTable(tableId)
      
      // Actualizar estado local con los datos reales del backend
      const updatedTables: RestaurantTable[] = tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status: updatedTable.isAvailable ? "available" : "occupied",
              active: updatedTable.isActive,
            }
          : table,
      )
      
      // Ordenar las tablas después de la actualización
      const sortedTables = sortTables(updatedTables)
      setTables(sortedTables)
    } catch (error) {
      console.error("Error updating table status:", error)
      alert("Error al actualizar el estado de la mesa")
    }
  }

  const deleteTable = async (tableId: number) => {
    // Prevenir eliminar la mesa "LLEVAR"
    const table = tables.find(t => t.id === tableId)
    if (table && table.number === "LLEVAR") {
      alert("La mesa 'LLEVAR' no puede eliminarse")
      return
    }

    if (table && table.status === "occupied") {
      alert("No se puede eliminar una mesa ocupada")
      return
    }

    try {
      await tableService.deleteTable(tableId)
      // Recargar tablas para reflejar el borrado lógico
      await loadTables()
    } catch (error) {
      console.error("Error deleting table:", error)
      alert("Error al eliminar la mesa")
    }
  }

  const getStatusInfo = (status: string) => {
    return statuses.find((s) => s.value === status) || { label: status, color: "bg-gray-100 text-gray-800" }
  }

  const totalTables = tables.length
  const availableTables = tables.filter((t) => t.status === "available").length
  const occupiedTables = tables.filter((t) => t.status === "occupied").length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando mesas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Mesas</h1>
          <p className="text-muted-foreground">Administra las mesas del restaurante</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTables} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Mesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTable ? "Editar Mesa" : "Nueva Mesa"}</DialogTitle>
                <DialogDescription>
                  {editingTable ? "Modifica los datos de la mesa" : "Crea una nueva mesa"}
                </DialogDescription>
              </DialogHeader>
                          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número de Mesa</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="1"
                    disabled={editingTable?.number === "LLEVAR"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={editingTable?.status || "available"}
                    onValueChange={(value: RestaurantTable["status"]) => {
                      if (editingTable) {
                        updateTableStatus(editingTable.id, value)
                      }
                    }}
                    disabled={editingTable?.number === "LLEVAR"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveTable} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTable ? "Guardar Cambios" : "Crear Mesa"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mesas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTables}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableTables}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupadas</CardTitle>
            <MapPin className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{occupiedTables}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Mesas</CardTitle>
          <CardDescription>Administra el estado y configuración de todas las mesas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40 text-base font-semibold">Mesa</TableHead>
                <TableHead className="w-32 text-base font-semibold">Estado</TableHead>
                <TableHead className="w-24 text-base font-semibold">Activa</TableHead>
                <TableHead className="text-right w-40 text-base font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => {
                const statusInfo = getStatusInfo(table.status)
                const isParaLlevar = table.number.trim().toLowerCase() === "para llevar"
                
                return (
                  <TableRow key={table.id} className={`${isParaLlevar ? "bg-blue-50" : ""} hover:bg-gray-50`}>
                    <TableCell className="text-lg font-semibold py-4">
                      {isParaLlevar ? "Para Llevar" : `Mesa ${table.number}`}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={`${statusInfo.color} text-sm px-3 py-1`}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant={table.active ? "default" : "secondary"} className="text-sm px-3 py-1">
                        {table.active ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-3">
                        {isParaLlevar ? (
                          <span className="text-sm text-blue-600 font-medium">Protegida</span>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(table)}
                              className="h-9 w-9 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Select
                              value={table.status}
                              onValueChange={(value: RestaurantTable["status"]) => updateTableStatus(table.id, value)}
                            >
                              <SelectTrigger className="w-28 h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statuses.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteTable(table.id)}
                              disabled={table.status === "occupied"}
                              className="h-9 w-9 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
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

/*
MÉTODOS PARA CONECTAR A BACKEND:

1. getTables()
   - GET /api/tables
   - Retorna: RestaurantTable[]

2. createTable(tableData: Omit<RestaurantTable, 'id'>)
   - POST /api/tables
   - Body: { number, status, active, notes }
   - Retorna: RestaurantTable

3. updateTable(tableId: number, tableData: Partial<RestaurantTable>)
   - PUT /api/tables/{tableId}
   - Body: campos a actualizar
   - Retorna: RestaurantTable

4. updateTableStatus(tableId: number, status: string)
   - PATCH /api/tables/{tableId}/status
   - Body: { status }
   - Retorna: RestaurantTable

5. deleteTable(tableId: number)
   - DELETE /api/tables/{tableId}
   - Retorna: { success: boolean }

NOTA: La mesa "Para Llevar" (id: 0) nunca debe eliminarse ni cambiar su estado a "occupied"
*/
