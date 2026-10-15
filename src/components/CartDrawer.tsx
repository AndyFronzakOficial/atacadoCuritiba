import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight, PackageCheck } from 'lucide-react'
import type { Product } from '../types'
import { currency } from '../lib/format'

export default function CartDrawer({
  open, products, cart, onClose, onChangeQuantity, onRemove, onCheckout,
}: {
  open: boolean
  products: Product[]
  cart: { productId: string; quantity: number }[]
  onClose: () => void
  onChangeQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  onCheckout: () => void
}) {
  if (!open) return null
  const lines = cart.map((line) => ({ ...line, product: products.find((product) => product.id === line.productId) })).filter((line) => line.product)
  const total = lines.reduce((sum, line) => sum + (line.product?.price || 0) * line.quantity, 0)
  const count = lines.reduce((sum, line) => sum + line.quantity, 0)

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header className="drawer-header">
          <div className="drawer-heading-icon"><ShoppingBag size={19} /></div>
          <div><h2 id="cart-title">Meu carrinho</h2><p>{count} {count === 1 ? 'produto' : 'produtos'}</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar carrinho"><X size={20} /></button>
        </header>
        {lines.length === 0 ? (
          <div className="cart-empty"><div className="empty-bag"><ShoppingBag size={30} /></div><h3>Seu carrinho está vazio</h3><p>Encontre aquele item que está faltando por aí.</p><button className="button button-primary" onClick={onClose}>Explorar produtos <ArrowRight size={17} /></button></div>
        ) : (
          <>
            <div className="cart-lines">
              {lines.map(({ product, quantity }) => product && (
                <article className="cart-line" key={product.id}>
                  <div className={`cart-product-visual art-mini-${product.visual}`}><span>{product.visual === 'bulb' ? '💡' : product.visual === 'drill' ? '🔧' : product.visual === 'camera' ? '📹' : product.visual === 'speaker' ? '🔊' : product.visual === 'earbuds' ? '🎧' : '📦'}</span></div>
                  <div className="cart-line-main"><strong>{product.name}</strong><span>{product.sku}</span><b>{currency(product.price)}</b>
                    <div className="cart-quantity-control">
                      <button aria-label="Diminuir quantidade" onClick={() => onChangeQuantity(product.id, quantity - 1)}><Minus size={13} /></button>
                      <span>{quantity}</span>
                      <button aria-label="Aumentar quantidade" disabled={quantity >= product.stock} onClick={() => onChangeQuantity(product.id, quantity + 1)}><Plus size={13} /></button>
                      <button className="cart-remove" aria-label="Remover item" onClick={() => onRemove(product.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <strong className="cart-line-total">{currency(product.price * quantity)}</strong>
                </article>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-subtotal"><span>Subtotal dos produtos</span><strong>{currency(total)}</strong></div>
              <div className="cart-freight"><PackageCheck size={16} /><span>Frete e entrega serão combinados no WhatsApp</span></div>
              <button className="button button-primary button-full cart-checkout" onClick={onCheckout}>Continuar para cadastro <ArrowRight size={18} /></button>
              <button className="continue-shopping" onClick={onClose}>Continuar comprando</button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
