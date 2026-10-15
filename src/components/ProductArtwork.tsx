import type { Product } from '../types'

const art: Record<string, string> = {
  drill: '🔧', tools: '🧰', bulb: '💡', led: '🌈', camera: '📹', speaker: '🔊',
  charger: '🔌', cable: '🧵', extension: '⚡', organizer: '📦', earbuds: '🎧', pliers: '🛠️',
}

export default function ProductArtwork({ product, compact = false }: { product: Product; compact?: boolean }) {
  const hasImage = Boolean(product.imageUrl)
  return (
    <div className={`product-art art-${product.visual} ${hasImage ? 'has-image' : ''} ${compact ? 'product-art-compact' : ''}`} aria-label={product.name}>
      {hasImage ? (
        <img className="product-real-image" src={product.imageUrl} alt={product.name} loading="lazy" />
      ) : (
        <>
          <span className="art-orbit art-orbit-one" />
          <span className="art-orbit art-orbit-two" />
          <span className="art-spark art-spark-one">✦</span>
          <span className="art-spark art-spark-two">✦</span>
          <span className="art-symbol">{art[product.visual] || '📦'}</span>
        </>
      )}
      <span className="art-caption">{product.category}</span>
    </div>
  )
}
