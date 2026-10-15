import type { Customer, Order, Product } from '../types'

export const categories = [
  { name: 'Ferramentas', icon: '🔧', color: 'cat-orange' },
  { name: 'Elétrica', icon: '⚡', color: 'cat-yellow' },
  { name: 'Iluminação', icon: '💡', color: 'cat-blue' },
  { name: 'Celulares', icon: '📱', color: 'cat-purple' },
  { name: 'Áudio', icon: '🎧', color: 'cat-pink' },
  { name: 'Segurança', icon: '📹', color: 'cat-green' },
  { name: 'Bazar', icon: '📦', color: 'cat-sand' },
]

export const demoProducts: Product[] = [
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a001', sku: 'ATC-001', barcode: '7896001234567',
    name: 'Furadeira de impacto 650W', description: 'Furadeira compacta com mandril de 13 mm, seletor de impacto e empunhadura confortável.',
    category: 'Ferramentas', stock: 17, initialPrice: 249.9, price: 189.9, discountPercent: 24, visual: 'drill', active: true,
  },
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a002', sku: 'ATC-002', barcode: '7896001234574',
    name: 'Kit de chaves de precisão · 24 peças', description: 'Jogo com pontas variadas para pequenos reparos em eletrônicos e objetos do dia a dia.',
    category: 'Ferramentas', stock: 42, initialPrice: 59.9, price: 39.9, discountPercent: 33, visual: 'tools', active: true,
  },
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a003', sku: 'ATC-003', barcode: '7896001234581',
    name: 'Lâmpada LED bulbo 12W · bivolt', description: 'Luz branca econômica, acendimento instantâneo e vida útil prolongada.',
    category: 'Iluminação', stock: 86, initialPrice: 16.9, price: 11.9, discountPercent: 30, visual: 'bulb', active: true,
  },
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a004', sku: 'ATC-004', barcode: '7896001234598',
    name: 'Fita LED RGB 5 metros com controle', description: 'Decore ambientes com 16 cores, controle remoto e instalação autoadesiva.',
    category: 'Iluminação', stock: 31, initialPrice: 79.9, price: 54.9, discountPercent: 31, visual: 'led', active: true,
  },
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a005', sku: 'ATC-005', barcode: '7896001234604',
    name: 'Câmera Wi-Fi interna Full HD', description: 'Monitoramento pelo celular, visão noturna, áudio bidirecional e detecção de movimento.',
    category: 'Segurança', stock: 12, initialPrice: 199.9, price: 149.9, discountPercent: 25, visual: 'camera', active: true,
  },
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a006', sku: 'ATC-006', barcode: '7896001234611',
    name: 'Caixa de som Bluetooth portátil', description: 'Som potente, conexão sem fio e bateria recarregável para levar para qualquer lugar.',
    category: 'Áudio', stock: 25, initialPrice: 119.9, price: 84.9, discountPercent: 29, visual: 'speaker', active: true,
  },
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a007', sku: 'ATC-007', barcode: '7896001234628',
    name: 'Carregador turbo USB-C 20W', description: 'Carregamento rápido com proteção contra aquecimento e saída USB-C.',
    category: 'Celulares', stock: 61, initialPrice: 69.9, price: 44.9, discountPercent: 36, visual: 'charger', active: true,
  },
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a008', sku: 'ATC-008', barcode: '7896001234635',
    name: 'Cabo USB-C trançado 2 metros', description: 'Cabo reforçado com acabamento trançado, compatível com carregamento rápido.',
    category: 'Celulares', stock: 85, initialPrice: 29.9, price: 19.9, discountPercent: 33, visual: 'cable', active: true,
  },
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a009', sku: 'ATC-009', barcode: '7896001234642',
    name: 'Extensão elétrica 5 tomadas · 3 m', description: 'Cinco tomadas, cabo reforçado de 3 metros e chave liga/desliga iluminada.',
    category: 'Elétrica', stock: 24, initialPrice: 64.9, price: 48.9, discountPercent: 25, visual: 'extension', active: true,
  },
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a010', sku: 'ATC-010', barcode: '7896001234659',
    name: 'Organizador multiuso · 12 peças', description: 'Conjunto versátil para guardar e organizar pequenos itens em casa ou no trabalho.',
    category: 'Bazar', stock: 15, initialPrice: 89.9, price: 64.9, discountPercent: 28, visual: 'organizer', active: true,
  },
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a011', sku: 'ATC-011', barcode: '7896001234666',
    name: 'Fone Bluetooth TWS com estojo', description: 'Fones sem fio com estojo compacto, microfone integrado e encaixe confortável.',
    category: 'Áudio', stock: 38, initialPrice: 109.9, price: 74.9, discountPercent: 32, visual: 'earbuds', active: true,
  },
  {
    id: '2fa31f56-72a7-4a91-80e2-24d881e8a012', sku: 'ATC-012', barcode: '7896001234673',
    name: 'Alicate universal 8 polegadas', description: 'Alicate robusto com cabo anatômico, ideal para instalação, reparos e uso profissional.',
    category: 'Ferramentas', stock: 4, initialPrice: 49.9, price: 34.9, discountPercent: 30, visual: 'pliers', active: true,
  },
]

const blankCustomer = (name: string, phone: string, city: string): Customer => ({
  name, email: `${name.toLowerCase().replace(/ /g, '.')}@email.com`, phone, cpf: '***.***.***-**',
  cep: '80000-000', address: 'Rua das Flores', number: '120', complement: '', neighborhood: 'Centro', city, state: 'PR',
})

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

export const demoOrders: Order[] = [
  {
    id: 'cc00c47b-8b41-4317-9a7a-000000000001', orderNumber: 'AC-2026-1042', customer: blankCustomer('Marina Costa', '(41) 99912-3401', 'Curitiba'),
    items: [{ productId: demoProducts[2].id, sku: 'ATC-003', name: demoProducts[2].name, quantity: 10, unitPrice: 11.9, subtotal: 119 }],
    total: 119, status: 'completed', createdAt: daysAgo(0),
  },
  {
    id: 'cc00c47b-8b41-4317-9a7a-000000000002', orderNumber: 'AC-2026-1041', customer: blankCustomer('Rafael Almeida', '(41) 99832-7744', 'São José dos Pinhais'),
    items: [
      { productId: demoProducts[6].id, sku: 'ATC-007', name: demoProducts[6].name, quantity: 2, unitPrice: 44.9, subtotal: 89.8 },
      { productId: demoProducts[7].id, sku: 'ATC-008', name: demoProducts[7].name, quantity: 3, unitPrice: 19.9, subtotal: 59.7 },
    ], total: 149.5, status: 'preparing', createdAt: daysAgo(1),
  },
  {
    id: 'cc00c47b-8b41-4317-9a7a-000000000003', orderNumber: 'AC-2026-1040', customer: blankCustomer('Camila Ferreira', '(41) 99741-2506', 'Pinhais'),
    items: [{ productId: demoProducts[0].id, sku: 'ATC-001', name: demoProducts[0].name, quantity: 1, unitPrice: 189.9, subtotal: 189.9 }],
    total: 189.9, status: 'confirmed', createdAt: daysAgo(2),
  },
  {
    id: 'cc00c47b-8b41-4317-9a7a-000000000004', orderNumber: 'AC-2026-1039', customer: blankCustomer('João Pedro Lima', '(41) 99628-4408', 'Curitiba'),
    items: [{ productId: demoProducts[5].id, sku: 'ATC-006', name: demoProducts[5].name, quantity: 2, unitPrice: 84.9, subtotal: 169.8 }],
    total: 169.8, status: 'pending', createdAt: daysAgo(3),
  },
  {
    id: 'cc00c47b-8b41-4317-9a7a-000000000005', orderNumber: 'AC-2026-1038', customer: blankCustomer('Bruna Martins', '(41) 99157-8820', 'Colombo'),
    items: [
      { productId: demoProducts[1].id, sku: 'ATC-002', name: demoProducts[1].name, quantity: 3, unitPrice: 39.9, subtotal: 119.7 },
      { productId: demoProducts[9].id, sku: 'ATC-010', name: demoProducts[9].name, quantity: 1, unitPrice: 64.9, subtotal: 64.9 },
    ], total: 184.6, status: 'canceled', createdAt: daysAgo(5),
  },
]
