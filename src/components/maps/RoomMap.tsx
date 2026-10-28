import { Component, useState, type ReactNode } from "react"
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Link } from "react-router"
import { isValidMapPosition } from "@/utils/mapCoordinates"

export { isValidMapPosition, resolveLocationCoordinates, DISTRICT_COORDINATES } from "@/utils/mapCoordinates"

export interface RoomMapListing {
  id: string
  title: string
  price?: string
  area?: string
  location?: string
  latitude?: number
  longitude?: number
}

class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <div className="map-unavailable" role="status">Bản đồ chưa thể hiển thị. Thông tin phòng và liên hệ vẫn có thể sử dụng bình thường.</div> : this.props.children
  }
}

export default function RoomMap({ listings, center, zoom = 11, note, className = "map-view" }: {
  listings: RoomMapListing[]
  center: [number, number]
  zoom?: number
  note?: string
  className?: string
}) {
  const [tileError, setTileError] = useState(false)
  const [retry, setRetry] = useState(0)
  const validListings = listings.filter((room) => isValidMapPosition(room.latitude, room.longitude))
  const hasValidCenter = Array.isArray(center) && isValidMapPosition(center[0], center[1])
  if (!hasValidCenter) {
    return <div className={`${className} map-unavailable`} role="status">Chưa có tọa độ hợp lệ để hiển thị bản đồ.</div>
  }
  return <div className={className}>
    <MapBoundary key={`${center[0]}-${center[1]}-${retry}`}><MapContainer center={center} zoom={zoom} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        eventHandlers={{ tileerror: () => setTileError(true) }}
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      {validListings.map((room) => <CircleMarker key={room.id} center={[room.latitude!, room.longitude!]} radius={9} pathOptions={{ color: "#0c8c72", fillColor: "#13aa8b", fillOpacity: 0.9 }}><Popup><strong>{room.title}</strong>{room.price && <><br/>{room.price}{room.area ? ` · ${room.area}` : ""}</>}{room.location && <><br/><span>{room.location}</span></>}<br/><Link to={`/phong/${room.id}`}>Xem chi tiết</Link></Popup></CircleMarker>)}
    </MapContainer></MapBoundary>
    {tileError && <div className="map-tile-error" role="status"><span>Bản đồ nền chưa tải được. Hãy kiểm tra kết nối hoặc thử lại.</span><button type="button" onClick={() => { setTileError(false); setRetry((value) => value + 1) }}>Tải lại bản đồ</button></div>}
    {note && <p className="map-note">{note}</p>}
  </div>
}
