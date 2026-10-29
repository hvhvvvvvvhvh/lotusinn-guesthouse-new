import images from '../lib/optimizedImages.json';
export function optimizedImageUrl(src) { return images[src]?.variants.at(-1).src || src; }
export default function SiteImage({ src, alt = '', loading = 'lazy', sizes = '(max-width: 700px) 100vw, 50vw', className = '', ...props }) {
  const image = images[src];
  const variants = image ? [...new Map(image.variants.map(item => [item.width, item])).values()] : [];
  return <img {...props} className={`site-image ${className}`} src={optimizedImageUrl(src)} alt={alt} loading={loading} decoding="async"
    {...(image ? { srcSet: variants.map(item => `${item.src} ${item.width}w`).join(', '), sizes, width: props.width || image.width, height: props.height || image.height } : {})} />;
}
