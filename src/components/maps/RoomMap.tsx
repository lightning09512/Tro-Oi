import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Link } from "react-router"

export interface RoomMapListing {
  id: string
  title: string
  price?: string
  area?: string
  location?: string
  latitude?: number
  longitude?: number
}

export const isValidMapPosition = (latitude: unknown, longitude: unknown): latitude is number =>
  typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
  typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180

export default function RoomMap({ listings, center, zoom = 11, note, className = "map-view" }: {
  listings: RoomMapListing[]
  center: [number, number]
  zoom?: number
  note?: string
  className?: string
}) {
  const validListings = listings.filter((room) => isValidMapPosition(room.latitude, room.longitude))
  const hasValidCenter = isValidMapPosition(center[0], center[1])
  if (!hasValidCenter) {
    return <div className={`${className} map-unavailable`} role="status">Chưa có tọa độ hợp lệ để hiển thị bản đồ.</div>
  }
  return <div className={className}>
    <MapContainer key={`${center[0]}-${center[1]}-${zoom}`} center={center} zoom={zoom} scrollWheelZoom>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {validListings.map((room) => <CircleMarker key={room.id} center={[room.latitude!, room.longitude!]} radius={9} pathOptions={{ color: "#0c8c72", fillColor: "#13aa8b", fillOpacity: 0.9 }}><Popup><strong>{room.title}</strong>{room.price && <><br/>{room.price}{room.area ? ` · ${room.area}` : ""}</>}{room.location && <><br/><span>{room.location}</span></>}<br/><Link to={`/phong/${room.id}`}>Xem chi tiết</Link></Popup></CircleMarker>)}
    </MapContainer>
    {note && <p className="map-note">{note}</p>}
  </div>
}
