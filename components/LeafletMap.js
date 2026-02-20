"use client";
import Swal from "sweetalert2";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./LeafletMap.css";
import L from "leaflet";

// แก้ปัญหา marker ไม่ขึ้นใน Next.js
const defaultIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// คอมโพเนนต์จับ event คลิกบนแผนที่
function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPick({ lat, lng });
    },
  });
  return null;
}

// ✅ คอมโพเนนต์เอาไว้สั่งซูม + เปิด popup
function FlyToIncident({ incident, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    // 👇 ถ้าไม่มี incident = โหมด "ยกเลิกเลือก"
    if (!incident) {
      map.closePopup(); // ปิด popup ทั้งหมด
      map.flyTo([13.7563, 100.5018], 13, { duration: 0.8 }); // กลับไปกรุงเทพ (หรือ center ที่อยากได้)
      return;
    }

    if (incident.lat && incident.lng) {
      const lat = Number(incident.lat);
      const lng = Number(incident.lng);

      map.flyTo([lat, lng], 16, { duration: 1.2 });

      const markerRef = markerRefs.current[incident.id];
      if (markerRef) {
        setTimeout(() => {
          markerRef.openPopup();
        }, 1200);
      }
    }
  }, [incident, map, markerRefs]);

  return null;
}

export default function LeafletMap({
  onSelectLocation,
  initialPosition,
  incidents,
  selectedIncidentId, // 👈 เพิ่มตัวนี้
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState(initialPosition || null);

  const markerRefs = useRef({}); // 👈 เก็บ ref ของ marker แต่ละอัน

  const thailandBounds = [
    [5.6, 97.3],
    [20.5, 105.7],
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    } else {
      setPosition(null);
    }
  }, [initialPosition]);

  if (!mounted) return null;

  const handlePick = (pos) => {
    if (!isInThailand(pos.lat, pos.lng)) {
      Swal.fire({
        icon: "warning",
        title: "หยุดก่อนไอชาย",
        text: "เลือกปักหมุดได้แค่ในไทยไอสัส!",
        confirmButtonText: "OK",
      });
      return;
    }

    setPosition(pos);
    if (onSelectLocation) {
      onSelectLocation(pos);
    }
  };

  const isInThailand = (lat, lng) => {
    const southWest = thailandBounds[0];
    const northEast = thailandBounds[1];

    return (
      lat >= southWest[0] &&
      lat <= northEast[0] &&
      lng >= southWest[1] &&
      lng <= northEast[1]
    );
  };

  const center = position
    ? [position.lat, position.lng]
    : [13.7563, 100.5018];

  const selectedIncident = incidents.find(
    (i) => i.id === selectedIncidentId
  );

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      maxBounds={thailandBounds}
      maxBoundsViscosity={5.0}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <LocationPicker onPick={handlePick} />

      {/* ✅ ซูมไป + เปิด popup เมื่อเลือก incident */}
      <FlyToIncident
        incident={selectedIncident}
        markerRefs={markerRefs}
      />

      {/* หมุดจากฐานข้อมูล incidents */}
      {incidents.map((item) => {
        if (
          item.lat == null ||
          item.lng == null ||
          isNaN(Number(item.lat)) ||
          isNaN(Number(item.lng))
        ) {
          return null;
        }


        const reporterName = item.users_app
          ? item.users_app.full_name
          : "ไม่ทราบชื่อ";

        const reporterPhone = item.users_app
          ? item.users_app.phone_number
          : "ไม่มี";

        return (
          <Marker
            key={item.id}
            position={[Number(item.lat), Number(item.lng)]}
            icon={defaultIcon}
            ref={(ref) => {
              if (ref) markerRefs.current[item.id] = ref;
            }}
          >
            <Popup className="custom-popup">
              <div className="popup-container">
                <div className="popup-header">
                  <span className="popup-icon">🚨</span>
                  <h3 className="popup-title">{item.title || "เหตุฉุกเฉิน"}</h3>
                </div>

                <div className="popup-body">
                  <p className="popup-desc">{item.description || "ไม่มีรายละเอียด"}</p>

                  <div className="popup-meta">
                    <div className="meta-row">
                      <span className="meta-icon">👤</span>
                      <span>{reporterName}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-icon">📞</span>
                      <span>{reporterPhone}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-status-dot" data-status={item.status}></span>
                      <span className="meta-status-text">{item.status || "รอดำเนินการ"}</span>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${Number(item.lat)},${Number(item.lng)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="popup-action-btn"
                  >
                    เปิดใน Google Maps
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* หมุดตำแหน่งที่ผู้ใช้เลือก */}
      {position && (
        <Marker position={[position.lat, position.lng]} icon={defaultIcon}>
          <Popup>
            📍 พิกัดที่เลือก <br />
            Lat: {position.lat.toFixed(6)} <br />
            Lng: {position.lng.toFixed(6)}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
