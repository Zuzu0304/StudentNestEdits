import { mediaUrl } from './lib_api.js'

export function normaliseApiProperty(item) {
  const images = Array.isArray(item.images)
    ? item.images
        .map((media) =>
          typeof media === 'string'
            ? { url: media, type: 'image' }
            : media,
        )
        .filter((media) => media?.url)
    : []
  const firstImage = images.find((media) => media.type !== 'video')?.url
  const amenities = Array.isArray(item.amenities) ? item.amenities : []
  const numericPrice = Number(item.rent || 0)
  const availability = {
    available: 'Available now',
    reserved: 'Reserved',
    occupied: 'Occupied',
    unavailable: 'Unavailable',
  }

  return {
    id: item.id,
    name: item.title,
    location: [item.area, item.city].filter(Boolean).join(', '),
    area: item.area || '',
    price: `₦${numericPrice.toLocaleString()} / year`,
    numericPrice,
    propertyType: String(item.property_type || '').toLowerCase(),
    type: String(item.property_type || '').replace(/-/g, ' '),
    rooms: Number(item.bedrooms || 1),
    availability: availability[item.availability_status] || 'Unavailable',
    facilities: amenities,
    verified: Boolean(item.is_verified),
    rating: Number(item.rating || 0),
    reviews: Number(item.review_count || 0),
    image: mediaUrl(
      firstImage ||
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    ),
  }
}
