"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { checkBackendHealth, apiRequest } from "@/lib/api"
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { LogoVariants } from "@/components/chickenbroster-logo"

export function BackendStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [message, setMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])

  const checkConnection = async () => {
    setIsLoading(true)
    try {
      const health = await checkBackendHealth()
      setIsConnected(health.isConnected)
      setMessage(health.message)
      
      if (health.isConnected) {
        // Probar algunos endpoints básicos
        await testEndpoints()
      }
    } catch (error) {
      setIsConnected(false)
      setMessage("Error al verificar la conexión")
      console.error("Connection check error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const testEndpoints = async () => {
    const endpoints = [
      { name: "Tablas", url: "/sales/Table/actives" },
      { name: "Productos", url: "/sales/Product/actives" },
      { name: "Ingredientes", url: "/inventory/Inventory/actives" },
    ]

    const results = []
    
    for (const endpoint of endpoints) {
      try {
        const data = await apiRequest(endpoint.url)
        results.push({
          name: endpoint.name,
          status: "success",
          message: `✅ ${endpoint.name} - ${Array.isArray(data) ? data.length : 'OK'} items`
        })
      } catch (error) {
        results.push({
          name: endpoint.name,
          status: "error",
          message: `❌ ${endpoint.name} - ${error instanceof Error ? error.message : 'Error desconocido'}`
        })
      }
    }
    
    setTestResults(results)
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <LogoVariants.Medium />
          {isConnected ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
          Estado del Backend
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Verificación de conectividad y endpoints
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
            <span className="text-sm text-gray-600 dark:text-gray-300">{message}</span>
          </div>
          <Button
            onClick={checkConnection}
            disabled={isLoading}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
        </div>

        {isConnected && testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pruebas de Endpoints:</h4>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {result.status === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={result.status === "success" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                  {result.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {!isConnected && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Problemas de conexión detectados:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Verifica que el backend esté ejecutándose en http://192.168.1.7:5000</li>
                <li>Confirma que la dirección IP sea correcta</li>
                <li>Verifica que no haya firewall bloqueando la conexión</li>
                <li>Revisa la consola del navegador para más detalles</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 