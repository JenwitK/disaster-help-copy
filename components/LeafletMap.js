"use client";
import Swal from "sweetalert2";
import { Siren, User, Phone, MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const defaultIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationPicker({ onPick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPick({ lat, lng });
    },
  });
  return null;
}

function FlyToIncident({ incident, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!incident) {
      map.closePopup();
      map.flyTo([13.7563, 100.5018], 13, { duration: 0.8 });
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
  selectedIncidentId,
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState(initialPosition || null);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  const markerRefs = useRef({});

  const thailandBounds = [
    [5.6, 97.3],
    [20.5, 105.7],
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!lightbox.open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(l => ({ ...l, open: false }));
      if (e.key === 'ArrowRight') setLightbox(l => ({ ...l, index: (l.index + 1) % l.images.length }));
      if (e.key === 'ArrowLeft') setLightbox(l => ({ ...l, index: (l.index - 1 + l.images.length) % l.images.length }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox.open, lightbox.images.length]);

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
    <>
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      maxBounds={thailandBounds}
      maxBoundsViscosity={5.0}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <LocationPicker onPick={handlePick} />

      <FlyToIncident
        incident={selectedIncident}
        markerRefs={markerRefs}
      />

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
                  <span className="popup-icon"><Siren size={18} /></span>
                  <h3 className="popup-title">{item.title || "เหตุฉุกเฉิน"}</h3>
                </div>

                <div className="popup-body">
                  {item.description && (
                    <p className="popup-desc">{item.description}</p>
                  )}

                  {item.incident_media?.length > 0 && (
                    <div className="popup-images">
                      {item.incident_media.map((media, idx) => (
                        <button
                          key={media.id}
                          className="popup-image-link"
                          onClick={() => setLightbox({
                            open: true,
                            images: item.incident_media.map(m => m.file_url),
                            index: idx
                          })}
                        >
                          <img src={media.file_url} alt="" className="popup-image" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="popup-meta">
                    <div className="meta-row">
                      <span className="meta-icon"><User size={14} /></span>
                      <span>{reporterName}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-icon"><Phone size={14} /></span>
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

      {position && (
        <Marker position={[position.lat, position.lng]} icon={defaultIcon}>
          <Popup>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <MapPin size={14} /> พิกัดที่เลือก
            </span>
            Lat: {position.lat.toFixed(6)} <br />
            Lng: {position.lng.toFixed(6)}
          </Popup>
        </Marker>
      )}
    </MapContainer>

    {lightbox.open && createPortal(
      <div className="lightbox-overlay" onClick={() => setLightbox(l => ({ ...l, open: false }))}>

        <button className="lightbox-close" onClick={() => setLightbox(l => ({ ...l, open: false }))}>
          <X size={20} />
        </button>

        <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>

          <div className="lightbox-image-row">
            {lightbox.images.length > 1 && (
              <button
                className="lightbox-nav"
                onClick={() => setLightbox(l => ({ ...l, index: (l.index - 1 + l.images.length) % l.images.length }))}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <img
              src={lightbox.images[lightbox.index]}
              alt=""
              className="lightbox-img"
            />

            {lightbox.images.length > 1 && (
              <button
                className="lightbox-nav"
                onClick={() => setLightbox(l => ({ ...l, index: (l.index + 1) % l.images.length }))}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {lightbox.images.length > 1 && (
            <div className="lightbox-dots">
              {lightbox.images.map((_, i) => (
                <button
                  key={i}
                  className={`lightbox-dot ${i === lightbox.index ? 'active' : ''}`}
                  onClick={() => setLightbox(l => ({ ...l, index: i }))}
                />
              ))}
            </div>
          )}

        </div>
      </div>,
      document.body
    )}
    </>
  );
}
