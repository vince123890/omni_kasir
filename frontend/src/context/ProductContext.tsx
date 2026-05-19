import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { productApi } from '../api'
import type { Product } from '../api/types'

interface ProductContextType {
  products: Product[]
  loading: boolean
  reload: () => void
}

const ProductContext = createContext<ProductContextType | null>(null)

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    setLoading(true)
    productApi.list({ limit: 500 })
      .then(res => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  return (
    <ProductContext.Provider value={{ products, loading, reload }}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  const ctx = useContext(ProductContext)
  if (!ctx) throw new Error('useProducts must be used within ProductProvider')
  return ctx
}
