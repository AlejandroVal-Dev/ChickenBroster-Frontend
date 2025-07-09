const API_BASE_URL = "http://192.168.1.7:5000"

// Interfaces para las tablas
export interface BackendTable {
  id: number
  number: string
  isAvailable: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTableRequest {
  number: string
}

// Clase para manejar errores de API
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// Función para verificar la conectividad del backend
export async function checkBackendHealth(): Promise<{ isConnected: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      return { isConnected: true, message: "Backend conectado correctamente" }
    } else {
      return { isConnected: false, message: `Backend respondió con status: ${response.status}` }
    }
  } catch (error) {
    console.error("Error checking backend health:", error)
    return { 
      isConnected: false, 
      message: "No se pudo conectar al backend. Verifica que el servidor esté ejecutándose en http://192.168.1.2:5000" 
    }
  }
}

// Función helper para hacer requests HTTP
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  try {
    console.log(`Making API request to: ${url}`)
    const response = await fetch(url, config)
    
    if (!response.ok) {
      let errorData: any = {}
      try {
        errorData = await response.json()
      } catch (parseError) {
        // Si no se puede parsear JSON, usar un mensaje por defecto
        errorData = { message: `HTTP error! status: ${response.status}` }
      }
      
      console.log(`API Error ${response.status}:`, errorData)
      
      throw new ApiError(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      )
    }

    // Si la respuesta es 204 (No Content), no intentar parsear JSON
    if (response.status === 204) {
      return {} as T
    }

    // Solo intentar parsear JSON si hay contenido
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      try {
        const data = await response.json()
        console.log(`API Response from ${url}:`, data)
        return data
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError)
        throw new ApiError(
          "Error parsing server response",
          response.status
        )
      }
    }

    return {} as T
  } catch (error) {
    console.error(`API Request failed for ${url}:`, error)
    
    if (error instanceof ApiError) {
      throw error
    }
    
    // Si es un error de red o fetch
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        "Error de conexión. Verifica tu conexión a internet y que el backend esté ejecutándose.",
        0
      )
    }
    
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      0
    )
  }
}

// Servicios para tablas
export const tableService = {
  // Obtener todas las tablas activas
  async getActiveTables(): Promise<BackendTable[]> {
    return apiRequest<BackendTable[]>("/sales/Table/actives")
  },

  // Obtener todas las tablas (activas e inactivas)
  async getAllTables(): Promise<BackendTable[]> {
    return apiRequest<BackendTable[]>("/sales/Table")
  },

  // Crear una nueva tabla
  async createTable(data: CreateTableRequest): Promise<BackendTable> {
    return apiRequest<BackendTable>("/sales/Table", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // Obtener mesa específica por ID
  async getTable(id: number): Promise<BackendTable> {
    return apiRequest<BackendTable>(`/sales/Table/${id}`)
  },

  // Marcar mesa como ocupada
  async occupyTable(id: number): Promise<void> {
    return apiRequest<void>(`/sales/Table/${id}/occupy`, {
      method: "PUT",
    })
  },

  // Marcar mesa como disponible
  async makeTableAvailable(id: number): Promise<void> {
    return apiRequest<void>(`/sales/Table/${id}/available`, {
      method: "PUT",
    })
  },

  // Borrado lógico de mesa
  async deleteTable(id: number): Promise<void> {
    return apiRequest<void>(`/sales/Table/${id}/deactivate`, {
      method: "DELETE",
    })
  },

  // Restaurar mesa (cuando ya existe con el mismo nombre)
  async restoreTable(id: number): Promise<void> {
    return apiRequest<void>(`/sales/Table/${id}/restore`, {
      method: "PATCH",
    })
  },
}

// Función helper para verificar si una tabla existe por número
export async function checkTableExists(number: string): Promise<BackendTable | null> {
  try {
    console.log("Checking if table exists:", number)
    const tables = await tableService.getAllTables()
    console.log("All tables (including inactive):", tables)
    
    const existingTable = tables.find(table => table.number === number)
    console.log("Found existing table:", existingTable)
    
    return existingTable || null
  } catch (error) {
    console.error("Error checking if table exists:", error)
    return null
  }
}

// Interfaces para ingredientes
export interface BackendIngredient {
  id: number
  name: string
  description: string
  sku: string
  unitOfMeasureAbbreviation: string
  unitCost: number
  isPerishable: boolean
  expirationDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CreateIngredientRequest {
  name: string
  description: string
  sku: string
  unitOfMeasureId: number
  unitCost: number
  isPerishable: boolean
  expirationDate: string
  actualStock: number
  minimumStock: number
}

export interface UpdateIngredientRequest {
  ingredientId: number
  name: string
  description: string
  sku: string
  unitOfMeasureId: number
  unitCost: number
  isPerishable: boolean
  expirationDate: string
  minimumStock: number
}

// Interfaces para unidades de medida
export interface UnitOfMeasure {
  id: number
  name: string
  abbreviation: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

// Servicios para ingredientes
export const ingredientService = {
  // Obtener todos los ingredientes activos
  async getActiveIngredients(): Promise<BackendIngredient[]> {
    return apiRequest<BackendIngredient[]>("/inventory/Ingredient/actives")
  },

  // Obtener ingrediente específico por ID
  async getIngredient(id: number): Promise<BackendIngredient> {
    return apiRequest<BackendIngredient>(`/inventory/Ingredient/${id}`)
  },

  // Obtener ingredientes por categoría
  async getIngredientsByCategory(categoryId: number): Promise<BackendIngredient[]> {
    return apiRequest<BackendIngredient[]>(`/inventory/Ingredient/category/${categoryId}`)
  },

  // Crear nuevo ingrediente
  async createIngredient(data: CreateIngredientRequest): Promise<BackendIngredient> {
    return apiRequest<BackendIngredient>("/inventory/Ingredient", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // Actualizar ingrediente existente
  async updateIngredient(data: UpdateIngredientRequest): Promise<BackendIngredient> {
    return apiRequest<BackendIngredient>("/inventory/Ingredient", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // Desactivar ingrediente (borrado lógico)
  async deactivateIngredient(id: number): Promise<void> {
    return apiRequest<void>(`/inventory/Ingredient/${id}/deactivate`, {
      method: "DELETE",
    })
  },

  // Restaurar ingrediente
  async restoreIngredient(id: number): Promise<void> {
    return apiRequest<void>(`/inventory/Ingredient/${id}/restore`, {
      method: "PATCH",
    })
  },

  // Asignar categoría a ingrediente
  async assignCategory(ingredientId: number, categoryId: number): Promise<void> {
    return apiRequest<void>("/inventory/Ingredient/assign-category", {
      method: "PUT",
      body: JSON.stringify({ ingredientId, categoryId }),
    })
  },

  // Desasignar categoría de ingrediente
  async unassignCategory(ingredientId: number, categoryId: number): Promise<void> {
    return apiRequest<void>("/inventory/Ingredient/unassign-category", {
      method: "PUT",
      body: JSON.stringify({ ingredientId, categoryId }),
    })
  },
}

// Servicios para unidades de medida
export const unitOfMeasureService = {
  // Obtener todas las unidades de medida activas
  async getActiveUnits(): Promise<UnitOfMeasure[]> {
    return apiRequest<UnitOfMeasure[]>("/inventory/UnitOfMeasure/actives")
  },
}

// Interfaces para categorías de ingredientes
export interface IngredientCategory {
  id: number
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

// Servicios para categorías de ingredientes
export const ingredientCategoryService = {
  // Obtener todas las categorías activas
  async getActiveCategories(): Promise<IngredientCategory[]> {
    return apiRequest<IngredientCategory[]>("/inventory/IngredientCategory/active")
  },

  // Obtener categorías asignadas a un ingrediente específico
  async getIngredientAssignedCategories(ingredientId: number): Promise<IngredientCategory[]> {
    return apiRequest<IngredientCategory[]>(`/inventory/IngredientCategory/${ingredientId}/assigned-categories`)
  },
}

// Servicio para inventario
export const inventoryService = {
  async updateMinimumStock(ingredientId: number, minimumStock: number): Promise<void> {
    return apiRequest<void>("/inventory/Inventory", {
      method: "PUT",
      body: JSON.stringify({ ingredientId, minimumStock }),
    })
  },
}

// Interfaces para productos
export interface BackendProduct {
  id: number
  name: string
  description: string
  price: number
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CreateProductRequest {
  name: string
  description: string
  price: number
}

export interface AssignCategoryRequest {
  productId: number
  categoryId: number
}

// Servicios para productos
export const productService = {
  // Obtener todos los productos activos
  async getActiveProducts(): Promise<BackendProduct[]> {
    return apiRequest<BackendProduct[]>("/sales/Product/actives")
  },

  // Obtener todos los productos (sin filtros)
  async getAllProducts(): Promise<BackendProduct[]> {
    return apiRequest<BackendProduct[]>("/sales/Product")
  },

  // Obtener producto por ID
  async getProduct(id: number): Promise<BackendProduct> {
    return apiRequest<BackendProduct>(`/sales/Product/${id}`)
  },

  // Crear producto
  async createProduct(data: CreateProductRequest): Promise<BackendProduct> {
    return apiRequest<BackendProduct>("/sales/Product", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // Desactivar producto
  async deactivateProduct(id: number): Promise<void> {
    return apiRequest<void>(`/sales/Product/${id}/deactivate`, {
      method: "DELETE",
    })
  },

  // Restaurar producto
  async restoreProduct(id: number): Promise<void> {
    return apiRequest<void>(`/sales/Product/${id}/restore`, {
      method: "PATCH",
    })
  },

  // Obtener productos por categoría
  async getProductsByCategory(categoryId: number): Promise<BackendProduct[]> {
    return apiRequest<BackendProduct[]>(`/sales/Product/by-category/${categoryId}`)
  },

  // Asignar categoría a producto
  async assignCategory(productId: number, categoryId: number): Promise<void> {
    return apiRequest<void>("/sales/Product/assign-category", {
      method: "POST",
      body: JSON.stringify({ productId, categoryId }),
    })
  },

  // Remover categoría de producto
  async unassignCategory(productId: number, categoryId: number): Promise<void> {
    return apiRequest<void>("/sales/Product/unassign-category", {
      method: "POST",
      body: JSON.stringify({ productId, categoryId }),
    })
  },
}

// Interfaces para recetas
export interface RecipeIngredient {
  ingredientId: number
  ingredientName?: string
  quantity: number
  unitOfMeasureAbbreviation?: string
  unitOfMeasureId?: number
}

export interface BackendRecipe {
  id: number
  name: string
  ingredients: RecipeIngredient[]
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CreateRecipeRequest {
  name: string
  ingredients: {
    ingredientId: number
    quantity: number
    unitOfMeasureId: number
  }[]
}

export interface UpdateRecipeRequest {
  recipeId: number
  name: string
}

export interface AddRecipeIngredientRequest {
  ingredientId: number
  quantity: number
  unitOfMeasureId: number
}

export interface UpdateRecipeIngredientRequest {
  ingredientId: number
  newQuantity: number
}

// Servicios para recetas
export const recipeService = {
  async getActiveRecipes(): Promise<BackendRecipe[]> {
    return apiRequest<BackendRecipe[]>("/inventory/Recipe/active")
  },
  async getAllRecipes(): Promise<BackendRecipe[]> {
    return apiRequest<BackendRecipe[]>("/inventory/Recipe/")
  },
  async getRecipe(id: number): Promise<BackendRecipe> {
    return apiRequest<BackendRecipe>(`/inventory/Recipe/${id}`)
  },
  async createRecipe(data: CreateRecipeRequest): Promise<BackendRecipe> {
    return apiRequest<BackendRecipe>("/inventory/Recipe", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  async updateRecipe(data: UpdateRecipeRequest): Promise<void> {
    return apiRequest<void>("/inventory/Recipe", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },
  async deactivateRecipe(id: number): Promise<void> {
    return apiRequest<void>(`/inventory/Recipe/${id}/deactivate`, {
      method: "DELETE",
    })
  },
  async restoreRecipe(id: number): Promise<void> {
    return apiRequest<void>(`/inventory/Recipe/${id}/restore`, {
      method: "PATCH",
    })
  },
  async addIngredient(recipeId: number, data: AddRecipeIngredientRequest): Promise<void> {
    return apiRequest<void>(`/inventory/Recipe/${recipeId}/ingredients`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  async updateIngredientQuantity(recipeId: number, data: UpdateRecipeIngredientRequest): Promise<void> {
    return apiRequest<void>(`/inventory/Recipe/${recipeId}/ingredients`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },
  async removeIngredient(recipeId: number, ingredientId: number): Promise<void> {
    return apiRequest<void>(`/inventory/Recipe/${recipeId}/ingredients/${ingredientId}`, {
      method: "DELETE",
    })
  },
}

// Interfaces para ProductRecipe
export interface BackendProductRecipe {
  id: number
  productId: number
  recipeId: number
  quantity: number
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CreateProductRecipeRequest {
  productId: number
  recipeId: number
  quantity: number
}

export interface UpdateProductRecipeRequest {
  productId: number
  newQuantity: number
}

// Servicios para ProductRecipe
export const productRecipeService = {
  async getAllProductRecipes(): Promise<BackendProductRecipe[]> {
    return apiRequest<BackendProductRecipe[]>("/sales/ProductRecipe")
  },
  async getProductRecipeByProduct(productId: number): Promise<BackendProductRecipe> {
    return apiRequest<BackendProductRecipe>(`/sales/ProductRecipe/${productId}`)
  },
  async createProductRecipe(data: CreateProductRecipeRequest): Promise<void> {
    return apiRequest<void>("/sales/ProductRecipe", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  async updateProductRecipeQuantity(data: UpdateProductRecipeRequest): Promise<void> {
    return apiRequest<void>("/sales/ProductRecipe", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },
  async deactivateProductRecipe(productRecipeId: number): Promise<void> {
    return apiRequest<void>(`/sales/ProductRecipe/${productRecipeId}/deactivat`, {
      method: "DELETE",
    })
  },
  async restoreProductRecipe(productRecipeId: number): Promise<void> {
    return apiRequest<void>(`/sales/ProductRecipe/${productRecipeId}/restore`, {
      method: "PATCH",
    })
  },
  async getProductRecipe(productId: number): Promise<BackendProductRecipe> {
    return apiRequest<BackendProductRecipe>(`/sales/ProductRecipe/${productId}`)
  },
}

export interface BackendProductCategory {
  id: number
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export const productCategoryService = {
  async getActiveCategories(): Promise<BackendProductCategory[]> {
    return apiRequest<BackendProductCategory[]>("/sales/ProductCategory/actives")
  },
  async getAssignedCategories(productId: number): Promise<BackendProductCategory[]> {
    return apiRequest<BackendProductCategory[]>(`/sales/ProductCategory/${productId}/assigned-categories`)
  },
  async getAllProductCategories(): Promise<{ productId: number; category: BackendProductCategory }[]> {
    return apiRequest<{ productId: number; category: BackendProductCategory }[]>("/sales/ProductCategory")
  },
}

// Interfaces para órdenes
export interface CreateOrderRequest {
  userId: number
  tableId: number
  orderType: number
  items: {
    productId: number
    quantity: number
  }[]
}

export const orderService = {
  async createOrder(data: CreateOrderRequest): Promise<any> {
    return apiRequest<any>("/sales/Order", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  async getOrder(orderId: number): Promise<any> {
    return apiRequest<any>(`/sales/Order/${orderId}`)
  },
  async getActiveOrderByTable(tableId: number): Promise<any> {
    return apiRequest<any>(`/sales/Order/by-table/${tableId}`)
  },
  async getAllOrders(): Promise<any[]> {
    return apiRequest<any[]>("/sales/Order")
  },
  async updateOrderStatus(orderId: number, status: number): Promise<any> {
    return apiRequest<any>(`/sales/Order/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
  },
  async completeOrder(orderId: number): Promise<any> {
    return apiRequest<any>(`/sales/Order/${orderId}/complete`, {
      method: "PUT",
    })
  },
  async cancelOrder(orderId: number): Promise<any> {
    return apiRequest<any>(`/sales/Order/${orderId}/cancel`, {
      method: "PUT",
    })
  },
}

// --- Servicios para Caja y Pagos ---

export interface CashRegisterSession {
  id: number
  openedAt: string
  closedAt: string | null
  openedByUserId: number
  closedByUserId: number | null
  initialAmount: number
  expectedAmount: number
  countedAmount: number | null
  difference: number | null
  status: "Open" | "Closed"
}

export interface OpenCashRegisterRequest {
  openedByUserId: number
  initialAmount: number
}

export interface CloseCashRegisterRequest {
  sessionId: number
  closedByUserId: number
  countedAmount: number
  orderIds: number[]
}

export interface CashRegisterMovementRequest {
  sessionId: number
  type: number
  amount: number
  description: string
  madeByUserId: number
}

export interface Payment {
  id: number
  orderId: number
  paymentMethod: number // 1: Cash, 2: Card, 3: Yape
  amount: number
  date: string
}

export interface CreatePaymentRequest {
  orderId: number
  paymentMethod: number
  amount: number
}

export const cashboxService = {
  async openCashRegister(data: OpenCashRegisterRequest): Promise<CashRegisterSession> {
    return apiRequest<CashRegisterSession>("/cashbox/CashRegister/open", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  async closeCashRegister(data: CloseCashRegisterRequest): Promise<CashRegisterSession> {
    return apiRequest<CashRegisterSession>("/cashbox/CashRegister/close", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },
  async getCurrentCashRegister(sessionId: number): Promise<CashRegisterSession> {
    return apiRequest<CashRegisterSession>(`/cashbox/CashRegister/${sessionId}`)
  },
  async getAllCashRegisters(): Promise<CashRegisterSession[]> {
    return apiRequest<CashRegisterSession[]>("/cashbox/CashRegister")
  },
  async createMovement(data: CashRegisterMovementRequest): Promise<any> {
    return apiRequest<any>("/cashbox/CashRegister/movement", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  async getMovements(sessionId: number): Promise<any[]> {
    return apiRequest<any[]>(`/cashbox/CashRegister/${sessionId}/movements`)
  },
}

export const paymentService = {
  async getAllPayments(): Promise<Payment[]> {
    return apiRequest<Payment[]>("/sales/Payment")
  },
  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    return apiRequest<Payment>("/sales/Payment", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  async getPaymentByOrder(orderId: number): Promise<Payment | null> {
    try {
      const payments = await this.getAllPayments()
      return payments.find(p => p.orderId === orderId) || null
    } catch (error) {
      console.error("Error getting payment by order:", error)
      return null
    }
  },
} 