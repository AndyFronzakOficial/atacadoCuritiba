export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'completed' | 'canceled'

export interface Product {
  id: string
  sku: string
  name: string
  barcode: string
  description: string
  category: string
  stock: number
  initialPrice: number
  price: number
  discountPercent: number
  visual: string
  active: boolean
}

export interface Customer {
  name: string
  email: string
  phone: string
  cpf: string
  cep: string
  address: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export interface OrderItem {
  productId: string
  sku: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Order {
  id: string
  orderNumber: string
  customer: Customer
  items: OrderItem[]
  total: number
  status: OrderStatus
  createdAt: string
}

export interface CartLine {
  productId: string
  quantity: number
}

export type ProductInput = Omit<Product, 'id'> & { id?: string }
