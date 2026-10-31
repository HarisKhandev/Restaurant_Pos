const CITY_COORDS = {
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Faisalabad: { lat: 31.4504, lng: 73.1350 },
}

let mapsPromise = null

export function getCityCoords(city) {
  return CITY_COORDS[city] || CITY_COORDS.Lahore
}

export function getGoogleMapsApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
}

export function loadGoogleMaps() {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) return Promise.reject(new Error('NO_API_KEY'))
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('MAPS_LOAD_FAILED'))
    document.head.appendChild(script)
  })
  return mapsPromise
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Could not detect your location. Allow GPS access or pick on the map.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  })
}

function parseAddressParts(components = [], displayName = '') {
  const get = (type) => components.find((c) => c.types?.includes(type))?.long_name || ''
  const suburb = get('sublocality') || get('sublocality_level_1') || get('neighborhood')
  const area = suburb || get('locality') || get('administrative_area_level_2')
  const street = [get('street_number'), get('route')].filter(Boolean).join(' ')
  const address = street || displayName.split(',')[0]?.trim() || displayName
  return { address, area: area || get('locality') || '' }
}

async function reverseGeocodeGoogle(lat, lng) {
  const maps = await loadGoogleMaps()
  const geocoder = new maps.Geocoder()
  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        reject(new Error('Could not resolve this location.'))
        return
      }
      const result = results[0]
      const parts = parseAddressParts(result.address_components, result.formatted_address)
      resolve({
        lat, lng,
        label: result.formatted_address,
        address: parts.address,
        area: parts.area,
        formattedAddress: result.formatted_address,
      })
    })
  })
}

async function reverseGeocodeNominatim(lat, lng) {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Could not resolve this location.')
  const data = await res.json()
  const addr = data.address || {}
  const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || ''
  const address = [addr.house_number, addr.road, addr.residential].filter(Boolean).join(' ') || data.display_name?.split(',')[0] || ''
  return {
    lat, lng,
    label: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    address,
    area,
    formattedAddress: data.display_name,
  }
}

export async function reverseGeocode(lat, lng) {
  if (getGoogleMapsApiKey()) {
    try { return await reverseGeocodeGoogle(lat, lng) }
    catch { /* fall through */ }
  }
  return reverseGeocodeNominatim(lat, lng)
}

async function searchNominatim(query, city) {
  const q = encodeURIComponent(`${query}, ${city}, Pakistan`)
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.map((item) => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    label: item.display_name,
    address: [item.address?.house_number, item.address?.road].filter(Boolean).join(' ') || item.display_name.split(',')[0],
    area: item.address?.suburb || item.address?.neighbourhood || item.address?.city_district || item.address?.city || city,
    formattedAddress: item.display_name,
  }))
}

export async function searchAddress(query, city) {
  if (!query.trim()) return []
  if (getGoogleMapsApiKey()) {
    try {
      const maps = await loadGoogleMaps()
      const service = new maps.places.AutocompleteService()
      return new Promise((resolve) => {
        service.getPlacePredictions(
          { input: `${query}, ${city}, Pakistan`, componentRestrictions: { country: 'pk' } },
          async (predictions, status) => {
            if (status !== maps.places.PlacesServiceStatus.OK || !predictions?.length) {
              resolve(searchNominatim(query, city))
              return
            }
            const places = new maps.places.PlacesService(document.createElement('div'))
            const results = await Promise.all(predictions.slice(0, 5).map((p) => new Promise((res) => {
              places.getDetails({ placeId: p.place_id, fields: ['geometry', 'formatted_address', 'address_components', 'name'] }, (place, st) => {
                if (st !== maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) { res(null); return }
                const lat = place.geometry.location.lat()
                const lng = place.geometry.location.lng()
                const parts = parseAddressParts(place.address_components, place.formatted_address || p.description)
                res({
                  lat, lng,
                  label: place.formatted_address || p.description,
                  address: parts.address || place.name || '',
                  area: parts.area,
                  formattedAddress: place.formatted_address || p.description,
                })
              })
            })))
            resolve(results.filter(Boolean))
          },
        )
      })
    } catch {
      return searchNominatim(query, city)
    }
  }
  return searchNominatim(query, city)
}

export function googleMapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}&z=17`
}

export function googleMapsDirectionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}
