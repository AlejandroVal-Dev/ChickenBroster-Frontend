"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react"
import { cashboxService, CashRegisterSession } from "@/lib/api"

/*
MÉTODOS PARA CONECTAR A BACKEND:

1. openCashSession(openingAmount: number)
   - POST /api/cash/sessions
   - Body: { openingAmount, date, openTime }
   - Retorna: CashSession

2. closeCashSession(sessionId: number, closingAmount: number, notes?: string)
   - PUT /api/cash/sessions/{sessionId}/close
   - Body: { closingAmount, closeTime, notes }
   - Retorna: CashSession

3. getCurrentSession()
   - GET /api/cash/sessions/current
   - Retorna: CashSession | null

4. getTodaySales()
   - GET /api/sales/today
   - Retorna: Sale[]

5. getCashHistory(limit?: number)
   - GET /api/cash/sessions/history?limit={limit}
   - Retorna: CashSession[]
*/

interface CashSession {
  id: number
  date: string
  openTime: string
  closeTime?: string
  openingAmount: number
  closingAmount?: number
  status: "open" | "closed"
  cashSales: number
  cardSales: number
  yapeSales: number
  totalSales: number
  difference?: number
  notes?: string
}

interface Sale {
  id: number
  time: string
  table: number
  amount: number
  paymentMethod: "efectivo" | "tarjeta" | "yape"
}

export default function CashPage() {
  const [user, setUser] = useState<{ id: number; name: string } | null>(null)
  const [sessions, setSessions] = useState<CashRegisterSession[]>([])
  const [currentSession, setCurrentSession] = useState<CashRegisterSession | null>(null)
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [openingAmount, setOpeningAmount] = useState("")
  const [closingAmount, setClosingAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState<any[]>([])

  // Obtener usuario actual
  useEffect(() => {
    const u = localStorage.getItem("currentUser")
    if (u) setUser(JSON.parse(u))
  }, [])

  // Cargar sesiones
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const sessionsRes = await cashboxService.getAllCashRegisters()
        console.log("Sesiones cargadas:", sessionsRes) // Debug
        setSessions(sessionsRes)
        // Buscar sesión abierta
        const openSession = sessionsRes.find((s) => s.status === "Open")
        setCurrentSession(openSession || null)
      } catch (e: any) {
        console.error("Error cargando sesiones:", e) // Debug
        setError(e.message || "Error al cargar datos de caja")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    // Cargar movimientos del día si hay sesión abierta
    const fetchMovements = async () => {
      if (!currentSession) return setMovements([])
      try {
        const movs = await cashboxService.getMovements(currentSession.id)
        setMovements(movs)
      } catch {
        setMovements([])
      }
    }
    fetchMovements()
  }, [currentSession])

  // Calcular totales desde movimientos de la sesión actual
  const totalSales = movements.filter((m) => m.type === 1).reduce((sum, m) => sum + m.amount, 0)

  // Abrir caja
  const handleOpenCash = async () => {
    if (!user) {
      setError("Error de usuario")
      return
    }
    // Verificar si ya hay una caja abierta
    const openSession = sessions.find((s) => s.status === "Open")
    if (openSession) {
      setError("Ya hay una caja abierta. Debes cerrar la caja actual antes de abrir una nueva.")
      return
    }
    try {
      const session = await cashboxService.openCashRegister({
        openedByUserId: user.id,
        initialAmount: Number.parseFloat(openingAmount) || 0,
      })
      setSessions([...sessions, session])
      setCurrentSession(session)
      setIsOpenDialogOpen(false)
      setOpeningAmount("")
      setError("")
    } catch (e: any) {
      setError(e.message || "Error al abrir caja")
    }
  }

  // Cerrar caja
  const handleCloseCash = async () => {
    if (!currentSession || !closingAmount || Number.parseFloat(closingAmount) < 0 || !user) {
      setError("Ingresa un monto de cierre válido")
      return
    }
    try {
      const closedSession = await cashboxService.closeCashRegister({
        sessionId: currentSession.id,
        closedByUserId: user.id,
        countedAmount: Number.parseFloat(closingAmount),
        orderIds: [], // Sin órdenes específicas
      })
      setSessions(sessions.map((s) => (s.id === closedSession.id ? closedSession : s)))
      setCurrentSession(null)
      setIsCloseDialogOpen(false)
      setClosingAmount("")
      setNotes("")
      setError("")
    } catch (e: any) {
      setError(e.message || "Error al cerrar caja")
    }
  }

  // Buscar sesión abierta hoy
  const todaySession = currentSession

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cierre de Caja</h1>
          <p className="text-muted-foreground">Gestiona la apertura y cierre diario de caja</p>
        </div>
        <div className="flex gap-2">
          {!todaySession ? (
            <Button onClick={() => setIsOpenDialogOpen(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Abrir Caja
            </Button>
          ) : (
            <Button onClick={() => setIsCloseDialogOpen(true)} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Cerrar Caja
            </Button>
          )}
        </div>
      </div>

      {/* Current Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {todaySession ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Caja Abierta
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Caja Cerrada
              </>
            )}
          </CardTitle>
          <CardDescription>
            {todaySession && typeof todaySession.initialAmount === "number"
              ? `Abierta desde las ${todaySession.openedAt ? new Date(todaySession.openedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "--:--"} con S/ ${typeof todaySession.initialAmount === "number" ? todaySession.initialAmount.toFixed(2) : "--"}`
              : "No hay una sesión de caja abierta para hoy"}
          </CardDescription>
        </CardHeader>
        {todaySession && (
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Ventas</div>
                <div className="text-lg font-bold">S/ {totalSales.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Movimientos de la sesión */}
      {movements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Movimientos de Caja</CardTitle>
            <CardDescription>Ingresos y egresos registrados automáticamente</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{m.type === 1 ? "Ingreso" : "Egreso"}</TableCell>
                    <TableCell>S/ {m.amount.toFixed(2)}</TableCell>
                    <TableCell>{m.description}</TableCell>
                    <TableCell>{new Date(m.date).toLocaleString("es-PE")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Open Cash Dialog */}
      <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caja</DialogTitle>
            <DialogDescription>Ingresa el monto inicial con el que abres la caja</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openingAmount">Monto de Apertura (S/) - Opcional</Label>
              <Input
                id="openingAmount"
                type="number"
                step="0.01"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpenDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenCash}>Abrir Caja</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Cash Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Caja</DialogTitle>
            <DialogDescription>Ingresa el monto final contado en caja</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {todaySession && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Apertura: S/ {typeof todaySession.initialAmount === "number" ? todaySession.initialAmount.toFixed(2) : "--"}</div>
                  <div>Total Ventas: S/ {totalSales.toFixed(2)}</div>
                  <div className="font-medium">
                    Esperado en Caja: S/ {((typeof todaySession.initialAmount === "number" ? todaySession.initialAmount : 0) + totalSales).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="closingAmount">Monto Contado en Caja (S/)</Label>
              <Input
                id="closingAmount"
                type="number"
                step="0.01"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observaciones (opcional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCloseCash} variant="destructive">
              Cerrar Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
