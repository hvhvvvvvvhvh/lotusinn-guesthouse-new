import images from '../lib/optimizedImages.json';
export function optimizedImageUrl(src) { return images[src]?.variants.at(-1).src || src; }
export function imageSourceSet(src) {
  const image = images[src];
  if (image) return [...new Map(image.variants.map(item => [item.width, item])).values()].map(item => item.src + ' ' + item.width + 'w').join(', ');
  if (/^\/api\/site-image\?id=[a-f0-9]{64}$/.test(src || '')) return [480, 960, 1600].map(width => src + '&w=' + width + ' ' + width + 'w').join(', ');
  return undefined;
}
export default function SiteImage({ src, alt = '', loading = 'lazy', fetchPriority, sizes = '(max-width: 700px) 100vw, 50vw', className = '', ...props }) {
  const image = images[src];
  const srcSet = imageSourceSet(src);
  return <img {...props} className={`site-image ${className}`} src={optimizedImageUrl(src)} alt={alt} loading={loading} fetchpriority={fetchPriority} decoding="async"
    {...(srcSet ? { srcSet, sizes } : {})} {...(image ? { width: props.width || image.width, height: props.height || image.height } : {})} />;
}
