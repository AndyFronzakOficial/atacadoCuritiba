import { useEffect, useState } from 'react'
import type { Product } from '../types'
import { getGoogleDriveImageUrl } from '../lib/googleDrive'

const art: Record<string, string> = {
  drill: '🔧', tools: '🧰', bulb: '💡', led: '🌈', camera: '📹', speaker: '🔊',
  charger: '🔌', cable: '🧵', extension: '⚡', organizer: '📦', earbuds: '🎧', pliers: '🛠️',
}

export default function ProductArtwork({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageSrc = getGoogleDriveImageUrl(product.imageUrl)
  const hasImage = Boolean(imageSrc) && !imageFailed

  useEffect(() => setImageFailed(false), [product.imageUrl])

  return (
    <div className={`product-art art-${product.visual} ${hasImage ? 'has-image' : ''} ${compact ? 'product-art-compact' : ''}`} aria-label={product.name}>
      {hasImage ? (
        <img className="product-real-image" src={imageSrc} alt={product.name} loading="lazy" onError={() => setImageFailed(true)} />
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
