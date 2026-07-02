import React, { useEffect, useMemo, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export type LiveTrackingMapItem = {
  _id: string;
  displayName: string;
  state: string;
  baseLocationText: string | null;
  currentJob: {
    jobCode: string;
    title: string;
    fleetCompanyName: string | null;
    etaMinutes: number | null;
  } | null;
  latestLocation: {
    point: { type: "Point"; coordinates: [number, number]; address?: string | null } | null;
    pingedAt: string;
  } | null;
};

const getPinColor = (status: string) => {
  switch (status) {
    case "ON_JOB":
      return "#2563eb"; // blue-600
    case "EN_ROUTE":
      return "#ca8a04"; // yellow-600
    case "AVAILABLE":
      return "#16a34a"; // green-600
    case "OFFLINE":
      return "#64748b"; // slate-500
    default:
      return "#64748b";
  }
};

const formatStateLabel = (state: string) =>
  state.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

type Props = {
  items: LiveTrackingMapItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function LiveTrackingMap({ items, loading, selectedId, onSelect }: Props) {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || "";
  const canRenderMap = apiKey.trim().length > 0;

  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const optionsSetRef = useRef(false);

  const points = useMemo(() => {
    return items
      .map((item) => {
        const coords = item.latestLocation?.point?.coordinates;
        if (!coords || coords.length !== 2) return null;
        const [lng, lat] = coords;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { id: item._id, lat, lng };
      })
      .filter(Boolean) as Array<{ id: string; lat: number; lng: number }>;
  }, [items]);

  useEffect(() => {
    if (!canRenderMap) return;
    if (!mapNodeRef.current) return;
    if (mapRef.current) return;

    let isCancelled = false;
    setMapsError(null);
    if (!optionsSetRef.current) {
      setOptions({ key: apiKey, v: "weekly" });
      optionsSetRef.current = true;
    }

    const timeoutId = window.setTimeout(() => {
      if (isCancelled) return;
      if (!mapRef.current) {
        setMapsError(
          "Map is taking too long to load. Check API key restrictions (HTTP referrers), billing, and that the Maps JavaScript API is enabled."
        );
      }
    }, 12000);

    Promise.all([importLibrary("maps"), importLibrary("marker")])
      .then(() => {
        if (isCancelled) return;
        if (!(window as any).google?.maps?.Map) {
          throw new Error("Google Maps failed to initialize.");
        }
        mapRef.current = new google.maps.Map(mapNodeRef.current!, {
          center: { lat: 0, lng: 0 },
          zoom: 2,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          clickableIcons: false,
        });
        infoWindowRef.current = new google.maps.InfoWindow();
        setMapsReady(true);
      })
      .catch((err) => {
        // If the script fails to load (bad key, blocked, offline), we fall back to placeholder UI.
        setMapsReady(false);
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load Google Maps. Check API key restrictions and billing.";
        setMapsError(message);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [apiKey, canRenderMap]);

  useEffect(() => {
    if (!mapsReady) return;
    const map = mapRef.current;
    if (!map) return;

    const markerIds = new Set(items.map((i) => i._id));
    for (const [id, marker] of markersRef.current.entries()) {
      if (!markerIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    }

    for (const item of items) {
      const coords = item.latestLocation?.point?.coordinates;
      if (!coords) continue;
      const [lng, lat] = coords;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const existing = markersRef.current.get(item._id);
      const position = { lat, lng };

      if (existing) {
        existing.setPosition(position);
        continue;
      }

      const marker = new google.maps.Marker({
        position,
        map,
        title: item.displayName,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: getPinColor(item.state),
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 8,
        },
      });

      marker.addListener("click", () => {
        onSelect(item._id);
        const info = infoWindowRef.current;
        if (!info) return;

        const job = item.currentJob;
        const eta = job?.etaMinutes !== null && job?.etaMinutes !== undefined ? job.etaMinutes : null;

        info.setContent(`
          <div style="min-width:220px">
            <div style="font-weight:600;color:#0f172a">${item.displayName}</div>
            <div style="font-size:12px;color:#475569">${item.baseLocationText ?? "No base location"}</div>
            <div style="margin-top:6px;font-size:12px;color:#0f172a">
              <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#f1f5f9">
                ${formatStateLabel(item.state)}
              </span>
            </div>
            ${
              job
                ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0">
                    <div style="font-size:12px;font-weight:600;color:#0f172a">${job.jobCode}</div>
                    <div style="font-size:12px;color:#334155">${job.title}</div>
                    <div style="font-size:12px;color:#64748b">${job.fleetCompanyName ?? "Fleet not linked"}</div>
                    ${eta !== null ? `<div style="margin-top:6px;font-size:12px;color:#2563eb">ETA: ${eta} min</div>` : ""}
                  </div>`
                : ""
            }
          </div>
        `);
        info.open({ map, anchor: marker });
      });

      markersRef.current.set(item._id, marker);
    }

    if (points.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      for (const p of points) bounds.extend(new google.maps.LatLng(p.lat, p.lng));
      map.fitBounds(bounds, 64);
    }
  }, [items, mapsReady, onSelect, points]);

  useEffect(() => {
    if (!mapsReady) return;
    if (!selectedId) return;

    const marker = markersRef.current.get(selectedId);
    const map = mapRef.current;
    if (!marker || !map) return;

    const position = marker.getPosition();
    if (position) {
      map.panTo(position);
    }
  }, [mapsReady, selectedId]);

  return (
    <div className="absolute inset-0">
      {/* Always render the map node to avoid a loading deadlock */}
      <div ref={mapNodeRef} className="absolute inset-0" />

      {!canRenderMap ? (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-gray-500">
          Add your Google Maps key to{" "}
          <code className="mx-1 rounded bg-white px-1 py-0.5">VITE_GOOGLE_MAPS_API_KEY</code> in{" "}
          <code className="mx-1 rounded bg-white px-1 py-0.5">Admin panel website/.env.local</code> to enable the live
          map.
        </div>
      ) : mapsError ? (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-gray-600">
          <div className="max-w-xl">
            <div className="font-medium text-gray-900">Unable to load map</div>
            <div className="mt-1">{mapsError}</div>
            <div className="mt-3 text-xs text-gray-500">
              Most common fixes: add{" "}
              <code className="rounded bg-white px-1 py-0.5">http://localhost:5174/*</code> to HTTP referrers, enable
              “Maps JavaScript API”, and ensure billing is enabled.
            </div>
          </div>
        </div>
      ) : !mapsReady ? (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-gray-500">
          {loading ? "Loading live mechanic positions..." : "Loading map..."}
        </div>
      ) : null}
    </div>
  );
}

