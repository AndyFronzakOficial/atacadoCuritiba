import { useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Box, CalendarDays, ChevronDown,
  CircleDollarSign, ClipboardList, Eye, Filter, LayoutDashboard, MessageCircle, MoreHorizontal, PackagePlus,
  Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Trash2, X, Pencil, AlertTriangle,
} from 'lucide-react'
import type { Order, OrderStatus, Product, ProductInput } from '../types'
import { currency, fullDate, shortDate, whatsappUrl } from '../lib/format'
import { categories } from '../lib/demo-data'
import ProductArtwork from './ProductArtwork'
import ProductFormModal from './ProductFormModal'

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Aguardando', confirmed: 'Confirmado', preparing: 'Em separação', completed: 'Concluído', canceled: 'Cancelado',
}
const statusOptions: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'completed', 'canceled']

function orderWhatsApp(order: Order) {
  const text = `Olá, ${order.customer.name.split(' ')[0]}! Estamos entrando em contato sobre o pedido ${order.orderNumber} da Atacadão Curitiba. Total dos produtos: ${currency(order.total)}.`
  return whatsappUrl(text)
}

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="order-detail-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
        <header className="detail-modal-header"><div><span className="eyebrow">DETALHES DO PEDIDO</span><h2 id="order-detail-title">{order.orderNumber}</h2><p>Recebido em {fullDate(order.createdAt)}</p></div><button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={20} /></button></header>
        <div className="detail-status-line"><span className={`status-pill status-${order.status}`}><span />{statusLabels[order.status]}</span><strong>{currency(order.total)}</strong></div>
        <div className="detail-section"><h3>Cliente</h3><div className="detail-customer-grid"><div><span>Nome</span><b>{order.customer.name}</b></div><div><span>Telefone</span><b>{order.customer.phone}</b></div><div><span>E-mail</span><b>{order.customer.email}</b></div><div><span>CPF</span><b>{order.customer.cpf}</b></div><div className="detail-address"><span>Endereço de entrega</span><b>{order.customer.address}, {order.customer.number}{order.customer.complement ? ` · ${order.customer.complement}` : ''}<br />{order.customer.neighborhood} · {order.customer.city}/{order.customer.state} · CEP {order.customer.cep}</b></div></div></div>
        <div className="detail-section"><h3>Itens do pedido <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span></h3><div className="detail-item-list">{order.items.map((item) => <div className="detail-item" key={`${item.sku}-${item.name}`}><div><b>{item.name}</b><span>{item.sku} · {item.quantity} un. × {currency(item.unitPrice)}</span></div><strong>{currency(item.subtotal)}</strong></div>)}</div><div className="detail-total"><span>Total dos produtos</span><strong>{currency(order.total)}</strong></div></div>
        <footer className="detail-modal-footer"><a className="button button-whatsapp" href={orderWhatsApp(order)} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Falar no WhatsApp</a><button className="button button-outline" onClick={onClose}>Fechar detalhes</button></footer>
      </section>
    </div>
  )
}

export default function AdminPage({
  products, orders, onBack, onChangeOrderStatus, onDeleteOrder, onSaveProduct, onDeleteProduct,
}: {
  products: Product[]
  orders: Order[]
  onBack: () => void
  onChangeOrderStatus: (orderId: string, status: OrderStatus) => void
  onDeleteOrder: (orderId: string) => void
  onSaveProduct: (input: ProductInput) => Promise<void>
  onDeleteProduct: (productId: string) => void
}) {
  const [tab, setTab] = useState<'dashboard' | 'orders' | 'products'>('dashboard')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [productSearch, setProductSearch] = useState('')
  const [productCategory, setProductCategory] = useState('all')
  const [productStock, setProductStock] = useState('all')
  const [productSort, setProductSort] = useState('name')
  const [formProduct, setFormProduct] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const activeOrders = orders.filter((order) => order.status !== 'canceled')
  const totalSales = activeOrders.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = orders.filter((order) => order.status === 'pending').length
  const averageOrder = activeOrders.length ? totalSales / activeOrders.length : 0
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 5).length
  const outOfStock = products.filter((product) => product.stock === 0).length

  const filteredOrders = useMemo(() => orders
    .filter((order) => `${order.orderNumber} ${order.customer.name} ${order.customer.email}`.toLowerCase().includes(orderSearch.toLowerCase()))
    .filter((order) => orderStatusFilter === 'all' || order.status === orderStatusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [orders, orderSearch, orderStatusFilter])

  const filteredProducts = useMemo(() => products
    .filter((product) => `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(productSearch.toLowerCase()))
    .filter((product) => productCategory === 'all' || product.category === productCategory)
    .filter((product) => productStock === 'all' || (productStock === 'low' ? product.stock <= 5 : productStock === 'available' ? product.stock > 5 : product.stock === 0))
    .sort((a, b) => productSort === 'price-asc' ? a.price - b.price : productSort === 'price-desc' ? b.price - a.price : a.name.localeCompare(b.name, 'pt-BR')),
  [products, productSearch, productCategory, productStock, productSort])

  const chartData = useMemo(() => {
    const result = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))
      const dayOrders = activeOrders.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate.getFullYear() === date.getFullYear() && orderDate.getMonth() === date.getMonth() && orderDate.getDate() === date.getDate()
      })
      return { date, value: dayOrders.reduce((sum, order) => sum + order.total, 0) }
    })
    return result
  }, [activeOrders])
  const maxChartValue = Math.max(...chartData.map((item) => item.value), 1)

  function openNewProduct() { setFormProduct(null); setFormOpen(true) }
  function nextSku() {
    const max = products.reduce((highest, product) => Math.max(highest, Number(product.sku.replace(/\D/g, '')) || 0), 0)
    return `ATC-${String(max + 1).padStart(3, '0')}`
  }
  async function saveProduct(input: ProductInput) {
    await onSaveProduct(input)
    setFormOpen(false)
    setFormProduct(null)
  }
  function deleteOrder(order: Order) {
    if (window.confirm(`Excluir permanentemente o pedido ${order.orderNumber}?`)) onDeleteOrder(order.id)
  }
  function deleteProduct(product: Product) {
    if (window.confirm(`Excluir o produto “${product.name}” do catálogo?`)) onDeleteProduct(product.id)
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <button className="admin-brand" onClick={onBack} aria-label="Voltar à loja"><img src="/logo.png" alt="Atacadão Curitiba" /><span><b>ATACADÃO</b><strong>CURITIBA</strong></span></button>
        <div className="sidebar-section-label">PAINEL DA LOJA</div>
        <nav className="admin-nav">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}><LayoutDashboard size={18} /> Dashboard</button>
          <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><ClipboardList size={18} /> Pedidos {pendingOrders > 0 && <span className="nav-count">{pendingOrders}</span>}</button>
          <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}><Box size={18} /> Produtos</button>
        </nav>
        <div className="admin-sidebar-spacer" />
        <div className="sidebar-help-card"><div className="help-icon"><ShieldCheck size={18} /></div><b>Operação segura</b><p>Pedidos e dados de clientes ficam protegidos pelo seu acesso.</p></div>
        <button className="admin-back-link" onClick={onBack}><ArrowLeft size={17} /> Voltar à loja</button>
        <div className="admin-sidebar-footer"><span className="sidebar-avatar">AC</span><div><b>Atacadão Curitiba</b><span>Administrador</span></div><MoreHorizontal size={17} /></div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div><div className="breadcrumb">Loja <span>/</span> {tab === 'dashboard' ? 'Visão geral' : tab === 'orders' ? 'Pedidos' : 'Produtos'}</div><h1>{tab === 'dashboard' ? 'Bom dia, lojista 👋' : tab === 'orders' ? 'Pedidos' : 'Produtos'}</h1></div>
          <div className="admin-top-actions"><span className="admin-date"><CalendarDays size={16} /> {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span><button className="store-return" onClick={onBack}><ArrowLeft size={16} /> Ir para a loja</button></div>
        </header>

        <main className="admin-content">
          {tab === 'dashboard' && (
            <>
              <div className="admin-greeting-row"><div><span className="eyebrow">RESUMO DA OPERAÇÃO</span><p>Acompanhe o movimento da sua loja em um só lugar.</p></div><button className="button button-primary" onClick={openNewProduct}><PackagePlus size={17} /> Adicionar produto</button></div>
              <section className="stats-grid">
                <article className="stat-card"><div className="stat-card-top"><span>Vendas registradas</span><div className="stat-icon stat-orange"><CircleDollarSign size={19} /></div></div><strong>{currency(totalSales)}</strong><small>Pedidos não cancelados</small><div className="stat-decoration"><ArrowUpRight size={18} /></div></article>
                <article className="stat-card"><div className="stat-card-top"><span>Total de pedidos</span><div className="stat-icon stat-violet"><ShoppingBag size={19} /></div></div><strong>{orders.length}</strong><small>{pendingOrders} aguardando atendimento</small><div className="stat-decoration"><ArrowUpRight size={18} /></div></article>
                <article className="stat-card"><div className="stat-card-top"><span>Ticket médio</span><div className="stat-icon stat-yellow"><BarChart3 size={19} /></div></div><strong>{currency(averageOrder)}</strong><small>Por pedido ativo</small><div className="stat-decoration"><ArrowUpRight size={18} /></div></article>
                <article className="stat-card"><div className="stat-card-top"><span>Produtos no catálogo</span><div className="stat-icon stat-green"><Box size={19} /></div></div><strong>{products.length}</strong><small>{lowStock + outOfStock} com estoque baixo ou zerado</small><div className="stat-decoration"><ArrowUpRight size={18} /></div></article>
              </section>

              <section className="admin-dashboard-grid">
                <article className="admin-panel sales-panel">
                  <div className="panel-heading"><div><span className="eyebrow">VENDAS</span><h2>Últimos 7 dias</h2></div><div className="chart-key"><span /> Total dos pedidos</div></div>
                  <div className="chart-total"><strong>{currency(chartData.reduce((sum, item) => sum + item.value, 0))}</strong><span>em pedidos ativos no período</span></div>
                  <div className="sales-chart" aria-label="Gráfico de vendas dos últimos sete dias">
                    <div className="chart-grid-lines"><i /><i /><i /><i /></div>
                    {chartData.map((item) => <div className="chart-column" key={item.date.toISOString()}><div className="chart-bar-wrap"><span className="chart-bar" style={{ height: `${Math.max(6, item.value / maxChartValue * 100)}%` }} title={currency(item.value)} /></div><small>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(item.date).replace('.', '')}</small></div>)}
                  </div>
                </article>
                <article className="admin-panel quick-panel"><div className="panel-heading"><div><span className="eyebrow">ATENÇÃO</span><h2>Para acompanhar</h2></div><div className="quick-alert-icon"><AlertTriangle size={19} /></div></div>
                  <button className="quick-row" onClick={() => setTab('orders')}><span className="quick-row-icon quick-orange"><ClipboardList size={17} /></span><span><b>{pendingOrders} pedido{pendingOrders === 1 ? '' : 's'} aguardando</b><small>Veja e dê retorno aos clientes</small></span><ArrowRight size={16} /></button>
                  <button className="quick-row" onClick={() => { setTab('products'); setProductStock('low') }}><span className="quick-row-icon quick-yellow"><AlertTriangle size={17} /></span><span><b>{lowStock + outOfStock} produto{lowStock + outOfStock === 1 ? '' : 's'} com estoque baixo</b><small>Confira itens com até 5 unidades</small></span><ArrowRight size={16} /></button>
                  <div className="stock-alert-footer"><span className="stock-dot" /> {outOfStock} sem estoque <span className="stock-divider" /> {lowStock} quase acabando</div>
                </article>
              </section>

              <section className="admin-panel recent-orders-panel">
                <div className="panel-heading"><div><span className="eyebrow">MOVIMENTAÇÃO RECENTE</span><h2>Últimos pedidos</h2></div><button className="text-action" onClick={() => setTab('orders')}>Ver todos <ArrowRight size={16} /></button></div>
                <OrdersTable orders={orders.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)} onOpen={setSelectedOrder} onStatus={onChangeOrderStatus} onDelete={deleteOrder} compact />
              </section>
            </>
          )}

          {tab === 'orders' && (
            <section className="admin-panel full-admin-panel">
              <div className="panel-heading panel-heading-orders"><div><span className="eyebrow">GESTÃO DE VENDAS</span><h2>Todos os pedidos <span className="heading-count">{orders.length}</span></h2></div><div className="orders-summary-badge"><span /> {pendingOrders} aguardando</div></div>
              <div className="table-toolbar"><label className="admin-search"><Search size={17} /><input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Buscar por pedido ou cliente..." /></label><label className="select-filter"><Filter size={16} /><select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}><option value="all">Todos os status</option>{statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select><ChevronDown size={15} /></label></div>
              <OrdersTable orders={filteredOrders} onOpen={setSelectedOrder} onStatus={onChangeOrderStatus} onDelete={deleteOrder} />
              {filteredOrders.length === 0 && <div className="table-empty"><Search size={22} /><b>Nenhum pedido encontrado</b><span>Tente ajustar a busca ou o filtro de status.</span></div>}
              <div className="panel-table-footer">Exibindo <b>{filteredOrders.length}</b> de <b>{orders.length}</b> pedidos</div>
            </section>
          )}

          {tab === 'products' && (
            <section className="admin-panel full-admin-panel">
              <div className="panel-heading panel-heading-orders"><div><span className="eyebrow">CATÁLOGO DA LOJA</span><h2>Gerenciar produtos <span className="heading-count">{products.length}</span></h2></div><button className="button button-primary" onClick={openNewProduct}><PackagePlus size={17} /> Novo produto</button></div>
              <div className="table-toolbar product-toolbar"><label className="admin-search"><Search size={17} /><input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Buscar por nome, SKU ou código de barras..." /></label><label className="select-filter"><Filter size={16} /><select value={productCategory} onChange={(e) => setProductCategory(e.target.value)}><option value="all">Todas as categorias</option>{categories.map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}</select><ChevronDown size={15} /></label><label className="select-filter stock-select"><SlidersHorizontal size={16} /><select value={productStock} onChange={(e) => setProductStock(e.target.value)}><option value="all">Qualquer estoque</option><option value="available">Em estoque</option><option value="low">Estoque baixo</option><option value="zero">Sem estoque</option></select><ChevronDown size={15} /></label><label className="sort-select"><select value={productSort} onChange={(e) => setProductSort(e.target.value)}><option value="name">Nome A–Z</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select><ChevronDown size={15} /></label></div>
              <div className="product-admin-table-wrap"><table className="admin-table products-table"><thead><tr><th>Produto</th><th>SKU / Código de barras</th><th>Categoria</th><th>Estoque</th><th>Preço</th><th>Desconto</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{filteredProducts.map((product) => <tr key={product.id}><td><div className="admin-product-cell"><div className="admin-product-thumb"><ProductArtwork product={product} compact /></div><div><b>{product.name}</b><small>{product.description}</small></div></div></td><td><b className="sku-text">{product.sku}</b><small className="barcode-text">{product.barcode || '—'}</small></td><td><span className="category-tag">{product.category}</span></td><td><StockBadge stock={product.stock} /></td><td><b>{currency(product.price)}</b>{product.initialPrice > product.price && <small className="old-price-admin">{currency(product.initialPrice)}</small>}</td><td><span className="discount-tag">-{product.discountPercent}%</span></td><td><div className="row-action-group"><button className="row-action" title="Editar produto" aria-label={`Editar ${product.name}`} onClick={() => { setFormProduct(product); setFormOpen(true) }}><Pencil size={15} /></button><button className="row-action row-delete" title="Excluir produto" aria-label={`Excluir ${product.name}`} onClick={() => deleteProduct(product)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>
              {filteredProducts.length === 0 && <div className="table-empty"><Box size={22} /><b>Nenhum produto encontrado</b><span>Experimente alterar os filtros ou adicionar um produto.</span></div>}
              <div className="panel-table-footer">Exibindo <b>{filteredProducts.length}</b> de <b>{products.length}</b> produtos</div>
            </section>
          )}
        </main>
      </div>

      {formOpen && <ProductFormModal product={formProduct} nextSku={nextSku()} onClose={() => { setFormOpen(false); setFormProduct(null) }} onSave={saveProduct} />}
      {selectedOrder && <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  )
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="stock-badge stock-out"><i /> Sem estoque</span>
  if (stock <= 5) return <span className="stock-badge stock-low"><i /> {stock} un.</span>
  return <span className="stock-badge stock-good"><i /> {stock} un.</span>
}

function OrdersTable({ orders, onOpen, onStatus, onDelete, compact = false }: {
  orders: Order[]
  onOpen: (order: Order) => void
  onStatus: (id: string, status: OrderStatus) => void
  onDelete: (order: Order) => void
  compact?: boolean
}) {
  return (
    <div className="orders-table-wrap"><table className={`admin-table orders-table ${compact ? 'compact-table' : ''}`}><thead><tr><th>Pedido</th><th>Cliente</th><th>Data</th><th>Itens</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><button className="order-number-link" onClick={() => onOpen(order)}>{order.orderNumber}</button></td><td><div className="customer-table-cell"><span className="customer-avatar">{order.customer.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div><b>{order.customer.name}</b><small>{order.customer.phone}</small></div></div></td><td><span className="order-date-text">{shortDate(order.createdAt)}</span><small className="order-hour-text">{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(order.createdAt))}</small></td><td><span className="items-count">{order.items.reduce((sum, item) => sum + item.quantity, 0)} itens</span></td><td><b className="order-total-text">{currency(order.total)}</b></td><td><label className={`status-select-wrap status-${order.status}`}><span className="status-dot" /><select aria-label={`Status do pedido ${order.orderNumber}`} value={order.status} onChange={(e) => onStatus(order.id, e.target.value as OrderStatus)}>{statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select><ChevronDown size={12} /></label></td><td><div className="row-action-group"><button className="row-action" title="Ver pedido" aria-label={`Ver pedido ${order.orderNumber}`} onClick={() => onOpen(order)}><Eye size={15} /></button><a className="row-action row-whatsapp" title="WhatsApp do cliente" aria-label={`WhatsApp ${order.customer.name}`} href={orderWhatsApp(order)} target="_blank" rel="noreferrer"><MessageCircle size={15} /></a><button className="row-action row-delete" title="Excluir pedido" aria-label={`Excluir pedido ${order.orderNumber}`} onClick={() => onDelete(order)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>
  )
}
