import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  ArrowRight, BadgePercent, Check, ChevronDown, Headphones, Heart, Menu, MessageCircle,
  PackageCheck, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Truck, UserRound, X,
} from 'lucide-react'
import AdminPage from './components/AdminPage'
import AdminLoginModal from './components/AdminLoginModal'
import CartDrawer from './components/CartDrawer'
import CheckoutModal from './components/CheckoutModal'
import ProductArtwork from './components/ProductArtwork'
import Toast from './components/Toast'
import { categories, demoOrders, demoProducts } from './lib/demo-data'
import { currency, makeId, makeOrderNumber, whatsappUrl } from './lib/format'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import type { CartLine, Customer, Order, OrderStatus, Product, ProductInput } from './types'

const STORE_PHONE = '+55 41 98746-3669'
const storageKeys = { products: 'atc.products.v1', orders: 'atc.orders.v1', cart: 'atc.cart.v1' }

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id), sku: String(row.sku ?? ''), name: String(row.name ?? ''), barcode: String(row.barcode ?? ''),
    description: String(row.description ?? ''), category: String(row.category ?? 'Bazar'), stock: Number(row.stock ?? 0),
    initialPrice: Number(row.initial_price ?? 0), price: Number(row.price ?? 0), discountPercent: Number(row.discount_percent ?? 0),
    visual: String(row.visual ?? 'organizer'), active: Boolean(row.active),
  }
}

function mapOrder(row: Record<string, unknown>): Order {
  const items = (Array.isArray(row.order_items) ? row.order_items : []) as Record<string, unknown>[]
  return {
    id: String(row.id), orderNumber: String(row.order_number),
    customer: {
      name: String(row.customer_name ?? ''), email: String(row.customer_email ?? ''), phone: String(row.customer_phone ?? ''),
      cpf: String(row.customer_cpf ?? ''), cep: String(row.customer_cep ?? ''), address: String(row.customer_address ?? ''),
      number: String(row.customer_number ?? ''), complement: String(row.customer_complement ?? ''), neighborhood: String(row.customer_neighborhood ?? ''),
      city: String(row.customer_city ?? ''), state: String(row.customer_state ?? ''),
    },
    items: items.map((item) => ({
      productId: String(item.product_id ?? ''), sku: String(item.product_sku ?? ''), name: String(item.product_name ?? ''),
      quantity: Number(item.quantity ?? 0), unitPrice: Number(item.unit_price ?? 0), subtotal: Number(item.subtotal ?? 0),
    })),
    total: Number(row.total ?? 0), status: (row.status ?? 'pending') as OrderStatus, createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => readStored(storageKeys.products, demoProducts))
  const [orders, setOrders] = useState<Order[]>(() => readStored(storageKeys.orders, demoOrders))
  const [cart, setCart] = useState<CartLine[]>(() => readStored(storageKeys.cart, []))
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [sort, setSort] = useState('featured')
  const [view, setView] = useState<'store' | 'admin'>('store')
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [adminLoginOpen, setAdminLoginOpen] = useState(false)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [toast, setToast] = useState({ message: '', tone: 'success' as 'success' | 'error' | 'info' })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { localStorage.setItem(storageKeys.products, JSON.stringify(products)) }, [products])
  useEffect(() => { localStorage.setItem(storageKeys.orders, JSON.stringify(orders)) }, [orders])
  useEffect(() => { localStorage.setItem(storageKeys.cart, JSON.stringify(cart)) }, [cart])

  useEffect(() => {
    const client = supabase
    if (!client) return
    let alive = true
    const loadCatalog = async () => {
      const { data, error } = await client.from('products').select('*').eq('active', true).order('sku')
      if (!alive) return
      if (!error && data) setProducts(data.map((row) => mapProduct(row as Record<string, unknown>)))
    }
    void loadCatalog()
    void client.auth.getSession().then(({ data }) => { if (alive) setAuthUser(data.session?.user ?? null) })
    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (alive) setAuthUser(session?.user ?? null)
    })
    return () => { alive = false; authListener.subscription.unsubscribe() }
  }, [])

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const cartLines = cart.map((line) => ({ product: products.find((product) => product.id === line.productId), quantity: line.quantity }))
    .filter((line): line is { product: Product; quantity: number } => Boolean(line.product))
  const cartTotal = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)

  const visibleProducts = useMemo(() => {
    const matched = products.filter((product) => product.active)
      .filter((product) => category === 'Todas' || product.category === category)
      .filter((product) => `${product.name} ${product.description} ${product.category} ${product.sku} ${product.barcode}`.toLowerCase().includes(query.toLowerCase().trim()))
    if (sort === 'price-asc') return matched.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return matched.sort((a, b) => b.price - a.price)
    if (sort === 'name') return matched.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    return matched.sort((a, b) => b.discountPercent - a.discountPercent)
  }, [products, category, query, sort])

  function notify(message: string, tone: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast({ message: '', tone: 'success' }), 3600)
  }

  async function refreshProducts(includeInactive = false) {
    if (!supabase) return
    let request = supabase.from('products').select('*').order('sku')
    if (!includeInactive) request = request.eq('active', true)
    const { data, error } = await request
    if (error) throw new Error(error.message)
    setProducts((data ?? []).map((row) => mapProduct(row as Record<string, unknown>)))
  }

  async function refreshOrders() {
    if (!supabase) return
    const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    setOrders((data ?? []).map((row) => mapOrder(row as Record<string, unknown>)))
  }

  function addToCart(product: Product) {
    if (product.stock < 1) { notify('Produto sem estoque no momento.', 'info'); return }
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) { notify('Você chegou ao limite disponível em estoque.', 'info'); return current }
        return current.map((line) => line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line)
      }
      return [...current, { productId: product.id, quantity: 1 }]
    })
    notify(`${product.name} adicionado ao carrinho.`)
  }

  function changeCartQuantity(productId: string, quantity: number) {
    const product = products.find((item) => item.id === productId)
    if (quantity <= 0) { setCart((current) => current.filter((line) => line.productId !== productId)); return }
    setCart((current) => current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(quantity, product?.stock ?? quantity) } : line))
  }

  async function handleCheckout(customer: Customer, password: string, mode: 'register' | 'login'): Promise<Order> {
    if (!cartLines.length) throw new Error('Adicione um produto ao carrinho antes de finalizar.')
    const maxSequence = orders.reduce((max, order) => {
      const parts = order.orderNumber.split('-')
      return Math.max(max, Number(parts[parts.length - 1]) || 0)
    }, 1000)
    const orderNumber = supabase
      ? `AC-${new Date().getFullYear()}-${makeId().replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}`
      : makeOrderNumber(maxSequence + 1)
    let id = makeId()
    let createdAt = new Date().toISOString()
    let savedOrderFromDatabase: Order | null = null

    if (supabase) {
      let user = authUser
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: customer.email, password })
        if (error) throw new Error(error.message)
        user = data.user
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: customer.email,
          password,
          options: { data: { full_name: customer.name, phone: customer.phone } },
        })
        if (error) throw new Error(error.message.includes('already registered') ? 'Este e-mail já possui conta. Selecione “Já tenho cadastro” para entrar.' : error.message)
        if (!data.session || !data.user) throw new Error('Conta criada. Confirme o e-mail enviado e depois entre em “Já tenho cadastro” para concluir o pedido.')
        user = data.user
      }
      if (!user) throw new Error('Não foi possível validar sua conta. Tente entrar novamente.')
      setAuthUser(user)

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id, full_name: customer.name, email: customer.email, phone: customer.phone, cpf: customer.cpf,
        cep: customer.cep, address: customer.address, number: customer.number, complement: customer.complement,
        neighborhood: customer.neighborhood, city: customer.city, state: customer.state,
      }, { onConflict: 'id' })
      if (profileError) throw new Error(`Não foi possível salvar seu cadastro: ${profileError.message}`)

      const { data: orderId, error: orderError } = await supabase.rpc('create_customer_order', {
        p_order_number: orderNumber,
        p_customer: {
          name: customer.name, email: customer.email, phone: customer.phone, cpf: customer.cpf,
          cep: customer.cep, address: customer.address, number: customer.number, complement: customer.complement,
          neighborhood: customer.neighborhood, city: customer.city, state: customer.state,
        },
        p_items: cartLines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
      })
      if (orderError) throw new Error(orderError.message.includes('stock') ? orderError.message : `Não foi possível registrar o pedido: ${orderError.message}`)
      id = String(orderId)
      const { data: savedRow, error: readError } = await supabase.from('orders').select('*, order_items(*)').eq('id', id).maybeSingle()
      if (!readError && savedRow) savedOrderFromDatabase = mapOrder(savedRow as Record<string, unknown>)
      try {
        await refreshProducts(false)
      } catch {
        setProducts((current) => current.map((product) => {
          const line = cartLines.find((item) => item.product.id === product.id)
          return line ? { ...product, stock: Math.max(0, product.stock - line.quantity) } : product
        }))
      }
      createdAt = new Date().toISOString()
    }

    const order: Order = savedOrderFromDatabase ?? {
      id, orderNumber, customer,
      items: cartLines.map(({ product, quantity }) => ({ productId: product.id, sku: product.sku, name: product.name, quantity, unitPrice: product.price, subtotal: product.price * quantity })),
      total: cartTotal, status: 'pending', createdAt,
    }
    setOrders((current) => [order, ...current])
    if (!supabase) {
      setProducts((current) => current.map((product) => {
        const line = cartLines.find((item) => item.product.id === product.id)
        return line ? { ...product, stock: Math.max(0, product.stock - line.quantity) } : product
      }))
    }
    setCart([])
    return order
  }

  async function saveProduct(input: ProductInput) {
    if (supabase) {
      const payload = {
        sku: input.sku, barcode: input.barcode, name: input.name, description: input.description,
        category: input.category, stock: input.stock, initial_price: input.initialPrice, price: input.price,
        discount_percent: input.discountPercent, visual: input.visual, active: input.active,
      }
      const result = input.id
        ? await supabase.from('products').update(payload).eq('id', input.id).select('*').single()
        : await supabase.from('products').insert(payload).select('*').single()
      if (result.error) throw new Error(result.error.message)
      const saved = mapProduct(result.data as Record<string, unknown>)
      setProducts((current) => input.id ? current.map((item) => item.id === input.id ? saved : item) : [...current, saved])
      notify(input.id ? 'Produto atualizado com sucesso.' : 'Produto adicionado ao catálogo.')
      return
    }
    const saved: Product = { ...input, id: input.id || makeId() }
    setProducts((current) => input.id ? current.map((item) => item.id === input.id ? saved : item) : [saved, ...current])
    notify(input.id ? 'Produto atualizado com sucesso.' : 'Produto adicionado ao catálogo.')
  }

  async function deleteProduct(productId: string) {
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', productId)
      if (error) { notify(`Não foi possível excluir: ${error.message}`, 'error'); return }
    }
    setProducts((current) => current.filter((product) => product.id !== productId))
    setCart((current) => current.filter((line) => line.productId !== productId))
    notify('Produto excluído do catálogo.')
  }

  async function changeOrderStatus(orderId: string, status: OrderStatus) {
    const order = orders.find((item) => item.id === orderId)
    if (!order || order.status === status) return
    const wasCanceled = order.status === 'canceled'
    const willBeCanceled = status === 'canceled'
    if (supabase) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
      if (error) { notify(`Não foi possível atualizar o pedido: ${error.message}`, 'error'); return }
      if (wasCanceled !== willBeCanceled) await refreshProducts(true)
    } else if (wasCanceled !== willBeCanceled) {
      if (willBeCanceled) {
        setProducts((current) => current.map((product) => {
          const line = order.items.find((item) => item.productId === product.id)
          return line ? { ...product, stock: product.stock + line.quantity } : product
        }))
      } else {
        const unavailable = order.items.find((line) => {
          const product = products.find((item) => item.id === line.productId)
          return product && product.stock < line.quantity
        })
        if (unavailable) { notify(`Estoque insuficiente para reabrir ${unavailable.name}.`, 'error'); return }
        setProducts((current) => current.map((product) => {
          const line = order.items.find((item) => item.productId === product.id)
          return line ? { ...product, stock: product.stock - line.quantity } : product
        }))
      }
    }
    setOrders((current) => current.map((item) => item.id === orderId ? { ...item, status } : item))
    notify('Status do pedido atualizado.')
  }

  async function deleteOrder(orderId: string) {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return
    if (supabase) {
      const { error } = await supabase.from('orders').delete().eq('id', orderId)
      if (error) { notify(`Não foi possível excluir o pedido: ${error.message}`, 'error'); return }
      if (order.status !== 'canceled') await refreshProducts(true)
    } else if (order.status !== 'canceled') {
      setProducts((current) => current.map((product) => {
        const line = order.items.find((item) => item.productId === product.id)
        return line ? { ...product, stock: product.stock + line.quantity } : product
      }))
    }
    setOrders((current) => current.filter((item) => item.id !== orderId))
    notify('Pedido excluído do painel.')
  }

  async function verifyAdmin(user: User) {
    if (!supabase) return true
    const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (error || data?.role !== 'admin') throw new Error('Esta conta não tem permissão de administrador. Peça ao responsável para liberar o perfil no Supabase.')
    return true
  }

  async function openAdmin() {
    if (!supabase) { setView('admin'); return }
    if (!authUser) { setAdminLoginOpen(true); return }
    try {
      await verifyAdmin(authUser)
      await Promise.all([refreshProducts(true), refreshOrders()])
      setView('admin')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Acesso negado.', 'error')
    }
  }

  async function adminLogin(email: string, password: string) {
    if (!supabase) { setView('admin'); setAdminLoginOpen(false); return }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('E-mail ou senha inválidos.')
    if (!data.user) throw new Error('Não foi possível validar o usuário.')
    try {
      await verifyAdmin(data.user)
      await Promise.all([refreshProducts(true), refreshOrders()])
      setAuthUser(data.user)
      setAdminLoginOpen(false)
      setView('admin')
    } catch (err) {
      await supabase.auth.signOut()
      throw err
    }
  }

  function contactStore() {
    const message = 'Olá! Gostaria de falar com a equipe do Atacadão Curitiba.'
    window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer')
  }

  if (view === 'admin') {
    return <><AdminPage products={products} orders={orders} onBack={() => setView('store')} onChangeOrderStatus={(id, status) => void changeOrderStatus(id, status)} onDeleteOrder={(id) => void deleteOrder(id)} onSaveProduct={saveProduct} onDeleteProduct={(id) => void deleteProduct(id)} /><Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ ...toast, message: '' })} /></>
  }

  return (
    <div className="store-app">
      <div className="announcement-bar"><div className="announcement-inner"><span className="announcement-offer"><Sparkles size={13} /> Preço de atacado, vantagem de verdade</span><span className="announcement-separator" /><span>Atendimento rápido pelo WhatsApp</span><a href={whatsappUrl('Olá! Gostaria de falar com a Atacadão Curitiba.')} target="_blank" rel="noreferrer"><MessageCircle size={14} /> {STORE_PHONE}</a></div></div>
      <header className="store-header">
        <div className="store-header-main">
          <button className="mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Abrir categorias"><Menu size={22} /></button>
          <a className="store-brand" href="#inicio" aria-label="Atacadão Curitiba - início"><img src="/logo.png" alt="Atacadão Curitiba" /></a>
          <form className="store-search" onSubmit={(event: FormEvent) => { event.preventDefault(); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }) }}>
            <Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="O que você está procurando?" aria-label="Buscar produtos" /><kbd>↵</kbd><button type="submit" aria-label="Buscar"><Search size={17} /></button>
          </form>
          <div className="store-header-actions">
            <button className="header-action account-action" onClick={() => { if (cartCount) setCartOpen(true); else { document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); notify('Seu cadastro será solicitado no checkout após adicionar produtos.', 'info') } }}><span className="header-action-icon"><UserRound size={19} /></span><span><small>Olá, cliente</small><b>Minha conta</b></span></button>
            <button className="header-action support-action" onClick={contactStore}><span className="header-action-icon"><Headphones size={19} /></span><span><small>Precisa de ajuda?</small><b>Fale conosco</b></span></button>
            <button className="cart-header-button" onClick={() => setCartOpen(true)} aria-label={`Abrir carrinho, ${cartCount} itens`}><ShoppingBag size={21} /><span className="cart-header-copy"><small>Meu carrinho</small><b>{cartCount} itens</b></span>{cartCount > 0 && <i>{cartCount}</i>}</button>
          </div>
        </div>
        <div className={`store-nav-row ${menuOpen ? 'nav-open' : ''}`}>
          <nav className="store-nav" aria-label="Navegação principal">
            <button className="nav-home" onClick={() => { setCategory('Todas'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Início</button>
            <button className="nav-category-link" onClick={() => { setCategory('Todas'); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }) }}>Todos os produtos</button>
            {categories.slice(0, 5).map((item) => <button key={item.name} onClick={() => { setCategory(item.name); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false) }}>{item.name}</button>)}
            <button className="nav-offer" onClick={() => { setSort('price-asc'); setCategory('Todas'); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }) }}><BadgePercent size={15} /> Ofertas</button>
          </nav>
          <button className="admin-shortcut" onClick={() => void openAdmin()}><ShieldCheck size={15} /> Painel da loja <ArrowRight size={14} /></button>
        </div>
      </header>

      <main id="inicio">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-kicker"><span /> ATACADO + VAREJO <i /> CURITIBA E REGIÃO</div>
            <h1>Variedade que resolve.<br /><span>Preço que surpreende.</span></h1>
            <p>Ferramentas, tecnologia, iluminação e muito mais para sua casa ou negócio — com preço bom de verdade.</p>
            <div className="hero-actions"><button className="button hero-primary" onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}>Explorar produtos <ArrowRight size={18} /></button><button className="hero-whatsapp" onClick={contactStore}><MessageCircle size={17} /> Fale com a gente</button></div>
            <div className="hero-proof"><div><span className="hero-proof-icon"><Check size={14} /></span><span><b>Compra simples</b><small>Finalize pelo WhatsApp</small></span></div><div><span className="hero-proof-icon"><Check size={14} /></span><span><b>Preço competitivo</b><small>Varejo e atacado</small></span></div></div>
          </div>
          <div className="hero-sticker"><span>ECONOMIA<br />DE VERDADE</span><b>+</b></div>
          <div className="hero-scroll-cue"><span /> Mais para descobrir</div>
        </section>

        <section className="benefit-strip" aria-label="Benefícios de comprar conosco">
          <div className="benefit-item"><span className="benefit-icon"><Truck size={20} /></span><div><b>Entrega combinada</b><small>Consulte sua região</small></div></div>
          <div className="benefit-item"><span className="benefit-icon"><BadgePercent size={20} /></span><div><b>Preço de atacado</b><small>Economize na sua compra</small></div></div>
          <div className="benefit-item"><span className="benefit-icon"><MessageCircle size={20} /></span><div><b>Atendimento direto</b><small>Converse com nossa equipe</small></div></div>
          <div className="benefit-item"><span className="benefit-icon"><ShieldCheck size={20} /></span><div><b>Compra segura</b><small>Confirmação pelo WhatsApp</small></div></div>
        </section>

        <section className="category-section store-container">
          <div className="section-heading"><div><span className="eyebrow">ENCONTRE O QUE PRECISA</span><h2>Compre por categoria</h2></div><button className="text-action" onClick={() => { setCategory('Todas'); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }) }}>Ver todas <ArrowRight size={16} /></button></div>
          <div className="category-grid">
            {categories.map((item) => <button key={item.name} className={`category-card ${item.color} ${category === item.name ? 'selected' : ''}`} onClick={() => { setCategory(item.name); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }) }}><span className="category-art">{item.icon}</span><span className="category-card-title">{item.name}</span><span className="category-chevron"><ArrowRight size={15} /></span></button>)}
          </div>
        </section>

        <section className="featured-promo store-container">
          <div className="promo-copy"><div className="promo-label"><Sparkles size={14} /> SELEÇÃO DA SEMANA</div><h2>Oportunidades para<br /><span>comprar melhor.</span></h2><p>Produtos selecionados com preço especial para deixar seu dia a dia mais fácil.</p><button onClick={() => { setSort('price-asc'); setCategory('Todas'); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }) }}>Ver ofertas <ArrowRight size={16} /></button></div>
          <div className="promo-product promo-product-one"><span>⚡</span><small>ELÉTRICA</small></div><div className="promo-product promo-product-two"><span>🔌</span><small>ACESSÓRIOS</small></div><div className="promo-orbit" />
          <div className="promo-price-note"><span>OFERTAS</span><b>DA SEMANA</b><i>↘</i></div>
        </section>

        <section className="catalog-section store-container" id="catalogo">
          <div className="catalog-heading"><div><span className="eyebrow">BOM PREÇO, TODO DIA</span><h2>Produtos em destaque <span className="catalog-sparkle">✦</span></h2><p>Escolha seus favoritos e receba atendimento direto pelo WhatsApp.</p></div><div className="catalog-controls"><label className="catalog-sort"><SlidersHorizontal size={16} /><span>Ordenar:</span><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar produtos"><option value="featured">Destaques</option><option value="price-asc">Preço: menor para maior</option><option value="price-desc">Preço: maior para menor</option><option value="name">Nome: A–Z</option></select><ChevronDown size={15} /></label></div></div>
          <div className="catalog-filter-row"><div className="catalog-chips"><button className={category === 'Todas' ? 'active' : ''} onClick={() => setCategory('Todas')}>Todos <span>{products.filter((product) => product.active).length}</span></button>{categories.map((item) => <button key={item.name} className={category === item.name ? 'active' : ''} onClick={() => setCategory(item.name)}>{item.name}</button>)}</div><div className="catalog-result-count">{visibleProducts.length} {visibleProducts.length === 1 ? 'produto' : 'produtos'} <span>encontrados</span></div></div>
          {query && <div className="search-result-note">Resultados para <b>“{query}”</b><button onClick={() => setQuery('')} aria-label="Limpar busca"><X size={14} /></button></div>}
          {visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product, index) => <ProductCard product={product} key={product.id} index={index} onAdd={addToCart} />)}</div> : <div className="catalog-empty"><div><Search size={27} /></div><h3>Não encontramos produtos</h3><p>Tente outra busca ou escolha uma categoria diferente.</p><button className="button button-outline" onClick={() => { setQuery(''); setCategory('Todas') }}>Limpar filtros</button></div>}
          <div className="catalog-bottom-note"><span className="catalog-note-icon"><PackageCheck size={18} /></span><span><b>Precisa de mais quantidade?</b><small>Chame a gente e consulte condições especiais para compras no atacado.</small></span><button onClick={contactStore}>Consultar no WhatsApp <ArrowRight size={15} /></button></div>
        </section>

        <section className="bottom-cta"><div className="bottom-cta-inner"><div className="bottom-cta-icon"><MessageCircle size={25} /></div><div><span className="eyebrow">ATENDIMENTO DE VERDADE</span><h2>Ficou com alguma dúvida?</h2><p>Chame nossa equipe no WhatsApp. A gente ajuda você a encontrar o que precisa.</p></div><button className="button button-whatsapp" onClick={contactStore}><MessageCircle size={18} /> Conversar agora <ArrowRight size={17} /></button></div></section>
      </main>

      <footer className="store-footer"><div className="store-container footer-main"><div className="footer-brand-column"><img src="/logo.png" alt="Atacadão Curitiba" /><p>Variedade, preço justo e atendimento próximo. Conte com a gente para comprar melhor.</p><button onClick={contactStore}><MessageCircle size={16} /> {STORE_PHONE}</button></div><div className="footer-links"><b>Institucional</b><a href="#inicio">Início</a><a href="#catalogo">Produtos</a><button onClick={() => void openAdmin()}>Área do administrador</button></div><div className="footer-links"><b>Atendimento</b><button onClick={contactStore}>Fale pelo WhatsApp</button><span>Curitiba e região</span><span>Segunda a sábado</span></div><div className="footer-news"><span className="eyebrow">OFERTAS E NOVIDADES</span><b>Encontre bons negócios por aqui.</b><p>Pedidos e dúvidas são finalizados diretamente com nossa equipe.</p><button onClick={contactStore}>Falar com a loja <ArrowRight size={16} /></button></div></div><div className="footer-bottom store-container"><span>© {new Date().getFullYear()} Atacadão Curitiba. Todos os direitos reservados.</span><span>Feito para comprar de um jeito mais simples <Heart size={14} fill="currentColor" /></span></div></footer>

      <CartDrawer open={cartOpen} products={products} cart={cart} onClose={() => setCartOpen(false)} onChangeQuantity={changeCartQuantity} onRemove={(id) => setCart((current) => current.filter((line) => line.productId !== id))} onCheckout={() => { if (!cartLines.length) { notify('Seu carrinho está vazio.', 'info'); return } setCartOpen(false); setCheckoutOpen(true) }} />
      {checkoutOpen && <CheckoutModal lines={cartLines} total={cartTotal} onClose={() => setCheckoutOpen(false)} onSubmit={handleCheckout} supabaseEnabled={isSupabaseConfigured} />}
      {adminLoginOpen && <AdminLoginModal onClose={() => setAdminLoginOpen(false)} onLogin={adminLogin} />}
      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ ...toast, message: '' })} />
    </div>
  )
}

function ProductCard({ product, index, onAdd }: { product: Product; index: number; onAdd: (product: Product) => void }) {
  const discount = product.discountPercent || (product.initialPrice > product.price ? Math.round((1 - product.price / product.initialPrice) * 100) : 0)
  return (
    <article className="product-card" style={{ animationDelay: `${Math.min(index * 35, 240)}ms` }}>
      <div className="product-card-image">
        <ProductArtwork product={product} />
        {discount > 0 && <span className="product-discount">-{discount}%</span>}
        {product.stock > 0 && product.stock < 6 && <span className="product-low-stock">Últimas unidades</span>}
        <button className="product-favorite" aria-label={`Favoritar ${product.name}`} onClick={(event) => { const button = event.currentTarget; button.classList.toggle('is-favorite') }}><Heart size={17} /></button>
      </div>
      <div className="product-card-content">
        <div className="product-category-line"><span />{product.category}<small>{product.sku}</small></div>
        <h3 title={product.name}>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-price-row"><div>{product.initialPrice > product.price && <span className="product-old-price">{currency(product.initialPrice)}</span>}<strong>{currency(product.price)}</strong></div><span className="unit-label">à vista</span></div>
        <div className="product-stock-line"><span className={product.stock === 0 ? 'stock-indicator stock-indicator-out' : product.stock < 6 ? 'stock-indicator stock-indicator-low' : 'stock-indicator'} />{product.stock === 0 ? 'Indisponível' : product.stock < 6 ? `Restam ${product.stock} unidades` : 'Em estoque'}</div>
        <button className="button add-cart-button" disabled={product.stock < 1} onClick={() => onAdd(product)}>{product.stock < 1 ? 'Avise-me quando chegar' : <><ShoppingBag size={16} /> Adicionar ao carrinho</>}</button>
      </div>
    </article>
  )
}
