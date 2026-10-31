import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Crosshair, LoaderCircle, MapPin, Navigation, Search, X } from 'lucide-react'
import { Button } from './ui'
import {
  getCityCoords, getCurrentPosition, getGoogleMapsApiKey, googleMapsUrl,
  loadGoogleMaps, reverseGeocode, searchAddress,
} from '../services/googleMaps'

export default function DeliveryLocationPicker({ city, value, onChange }) {
  const [mapOpen, setMapOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [mapError, setMapError] = useState('')
  const [useGoogle, setUseGoogle] = useState(!!getGoogleMapsApiKey())
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)
  const searchTimer = useRef(null)

  const applyLocation = useCallback((location) => {
    onChange({
      lat: location.lat,
      lng: location.lng,
      address: location.address || value.address,
      area: location.area || value.area,
      locationLabel: location.label || location.formattedAddress || '',
    })
  }, [onChange, value.address, value.area])

  const applyLocationRef = useRef(applyLocation)
  applyLocationRef.current = applyLocation

  const detectLocation = async () => {
    setLocating(true)
    setMapError('')
    try {
      const pos = await getCurrentPosition()
      const resolved = await reverseGeocode(pos.lat, pos.lng)
      applyLocation(resolved)
    } catch (err) {
      setMapError(err.message)
    } finally {
      setLocating(false)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) { setSuggestions([]); return }
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchAddress(searchQuery, city)
        setSuggestions(results)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(searchTimer.current)
  }, [searchQuery, city])

  useEffect(() => {
    if (!mapOpen) return
    let cancelled = false
    const init = async () => {
      setMapError('')
      setLoading(true)
      const center = value.lat ? { lat: value.lat, lng: value.lng } : getCityCoords(city)
      try {
        const maps = await loadGoogleMaps()
        if (cancelled || !mapRef.current) return
        setUseGoogle(true)
        const map = new maps.Map(mapRef.current, {
          center,
          zoom: value.lat ? 17 : 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        const marker = new maps.Marker({
          map,
          position: value.lat ? center : null,
          draggable: true,
          animation: value.lat ? null : maps.Animation.DROP,
        })
        mapInstance.current = map
        markerRef.current = marker

        const setFromLatLng = async (lat, lng) => {
          marker.setPosition({ lat, lng })
          map.panTo({ lat, lng })
          map.setZoom(17)
          try {
            const resolved = await reverseGeocode(lat, lng)
            applyLocationRef.current(resolved)
          } catch (err) {
            setMapError(err.message)
          }
        }

        map.addListener('click', (e) => setFromLatLng(e.latLng.lat(), e.latLng.lng()))
        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          setFromLatLng(pos.lat(), pos.lng())
        })

        if (!value.lat) {
          try {
            const pos = await getCurrentPosition()
            if (!cancelled) await setFromLatLng(pos.lat, pos.lng)
          } catch { /* user can click map */ }
        }
      } catch {
        if (cancelled || !mapRef.current) return
        setUseGoogle(false)
        initOsmMap(center, cancelled)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const initOsmMap = (center, cancelled) => {
      if (cancelled || !mapRef.current) return
      const iframe = document.createElement('iframe')
      iframe.className = 'osm-map-fallback'
      iframe.title = 'Map picker'
      iframe.loading = 'lazy'
      iframe.referrerPolicy = 'no-referrer'
      const bbox = 0.012
      iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - bbox}%2C${center.lat - bbox}%2C${center.lng + bbox}%2C${center.lat + bbox}&layer=mapnik&marker=${center.lat}%2C${center.lng}`
      mapRef.current.innerHTML = ''
      mapRef.current.appendChild(iframe)
      setMapError('Add VITE_GOOGLE_MAPS_API_KEY for interactive Google Maps. Use GPS or search below.')
    }

    init()
    return () => {
      cancelled = true
      mapInstance.current = null
      markerRef.current = null
      if (mapRef.current) mapRef.current.innerHTML = ''
    }
  }, [mapOpen, city])

  const pickSuggestion = (item) => {
    applyLocationRef.current(item)
    setSearchQuery('')
    setSuggestions([])
    setMapOpen(false)
  }

  const confirmMapLocation = async () => {
    if (markerRef.current && useGoogle) {
      const pos = markerRef.current.getPosition()
      if (pos) {
        try {
          const resolved = await reverseGeocode(pos.lat(), pos.lng())
          applyLocationRef.current(resolved)
        } catch (err) {
          setMapError(err.message)
          return
        }
      }
    }
    setMapOpen(false)
  }

  return (
    <div className="delivery-location-picker">
      <div className="location-picker-header">
        <span><MapPin size={15}/> Delivery location</span>
        {value.lat && <small className="location-set"><Check size={12}/> Pin set</small>}
      </div>

      <div className="location-actions">
        <button type="button" className="location-action-btn primary" onClick={detectLocation} disabled={locating}>
          {locating ? <LoaderCircle size={16} className="spin"/> : <Crosshair size={16}/>}
          {locating ? 'Detecting…' : 'Use my location'}
        </button>
        <button type="button" className="location-action-btn" onClick={() => setMapOpen(true)}>
          <Navigation size={16}/> Pick on map
        </button>
      </div>

      <label className="location-search-label">
        Search address
        <div className="location-search">
          <Search size={16}/>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${city}…`}
          />
          {searching && <LoaderCircle size={14} className="spin"/>}
        </div>
      </label>
      {suggestions.length > 0 && (
        <ul className="location-suggestions">
          {suggestions.map((item) => (
            <li key={`${item.lat}-${item.lng}-${item.label}`}>
              <button type="button" onClick={() => pickSuggestion(item)}>
                <MapPin size={14}/><span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.locationLabel && (
        <div className="location-preview">
          <MapPin size={14}/>
          <div>
            <strong>{value.locationLabel}</strong>
            {value.lat && (
              <a href={googleMapsUrl(value.lat, value.lng)} target="_blank" rel="noreferrer">View on Google Maps</a>
            )}
          </div>
        </div>
      )}

      {mapError && <div className="checkout-error">{mapError}</div>}

      {mapOpen && (
        <div className="location-map-overlay" onClick={() => setMapOpen(false)}>
          <div className="location-map-modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>
                <small>PICK DELIVERY PIN</small>
                <h3>{useGoogle ? 'Google Maps' : 'Map picker'}</h3>
              </div>
              <button type="button" onClick={() => setMapOpen(false)}><X size={18}/></button>
            </header>
            <div className="location-map-wrap">
              {loading && <div className="map-loading"><LoaderCircle size={24} className="spin"/><span>Loading map…</span></div>}
              <div ref={mapRef} className="google-map-canvas"/>
            </div>
            <p className="map-hint">{useGoogle ? 'Tap the map or drag the pin to set your exact delivery point.' : 'Use GPS or address search, then confirm.'}</p>
            <div className="map-modal-actions">
              <Button type="button" variant="outline" onClick={detectLocation} disabled={locating}>
                <Crosshair size={15}/> Current location
              </Button>
              <Button type="button" onClick={confirmMapLocation}>Confirm this location</Button>
            </div>
            {!getGoogleMapsApiKey() && (
              <small className="map-api-note">Tip: set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env</code> for full Google Maps (Places + draggable pin).</small>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
