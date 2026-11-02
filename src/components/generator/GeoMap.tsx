"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(event) { onPick(event.latlng.lat, event.latlng.lng); } });
  return null;
}

export default function GeoMap({ lat, lng, onPick }: { lat: number; lng: number; onPick: (lat: number, lng: number) => void }) {
  const safeLat = Number.isFinite(lat) ? Math.max(-90, Math.min(90, lat)) : 45.5152;
  const safeLng = Number.isFinite(lng) ? Math.max(-180, Math.min(180, lng)) : -122.6784;
  return <div className="overflow-hidden rounded-[10px] border border-hairline" aria-label="Interactive location picker">
    <MapContainer center={[safeLat, safeLng]} zoom={13} style={{ height: 220, width: "100%" }} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker center={[safeLat, safeLng]} radius={10} pathOptions={{ color: "#FFFFFF", weight: 3, fillColor: "#4F46FF", fillOpacity: 1 }} />
      <ClickHandler onPick={onPick} />
    </MapContainer>
    <p className="bg-surface px-3 py-2 text-[.68rem] text-muted">Click the map to place the pin. Map tiles © OpenStreetMap contributors.</p>
  </div>;
}
