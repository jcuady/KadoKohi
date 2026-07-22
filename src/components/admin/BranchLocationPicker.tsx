import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, MapPin, Navigation, Search, X } from 'lucide-react';
import {
  reversePhilippinesLocation,
  searchPhilippinesLocations,
  type PhilippinesLocationResult,
} from '../../lib/philippinesLocationSearch';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const PH_CENTER: [number, number] = [12.8797, 121.774];
const PH_ZOOM = 6;
const PIN_ZOOM = 17;

const pinIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export type BranchLocationValue = {
  lat?: number;
  lng?: number;
  address?: string;
  city?: string;
  label?: string;
};

type Props = {
  value: BranchLocationValue;
  onChange: (next: BranchLocationValue) => void;
  /** Pre-fill search when editing an existing branch */
  searchHint?: string;
};

function FlyToPin({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], PIN_ZOOM, { duration: 0.55 });
  }, [lat, lng, map]);
  return null;
}

function MapClickToPin({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapPinLayer({
  lat,
  lng,
  onMove,
}: {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={[lat, lng]}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const pos = e.target.getLatLng();
          onMove(pos.lat, pos.lng);
        },
      }}
    />
  );
}

/** Single Leaflet map + Philippines Nominatim search — no duplicate OSM iframe. */
export default function BranchLocationPicker({ value, onChange, searchHint }: Props) {
  const [query, setQuery] = useState(searchHint ?? '');
  const [results, setResults] = useState<PhilippinesLocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [locating, setLocating] = useState(false);
  const [reverseBusy, setReverseBusy] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const hasPin = value.lat != null && value.lng != null;

  const mapCenter = useMemo<[number, number]>(
    () => (hasPin ? [value.lat!, value.lng!] : PH_CENTER),
    [hasPin, value.lat, value.lng],
  );

  useEffect(() => {
    if (searchHint) setQuery(searchHint);
  }, [searchHint]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setListOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError('');
      return;
    }

    debounceRef.current = setTimeout(() => {
      setSearching(true);
      setSearchError('');
      void searchPhilippinesLocations(q)
        .then((hits) => {
          setResults(hits);
          setListOpen(hits.length > 0);
        })
        .catch((err) => {
          setResults([]);
          setSearchError(err instanceof Error ? err.message : 'Search failed.');
        })
        .finally(() => setSearching(false));
    }, 320);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const applyResult = (hit: PhilippinesLocationResult) => {
    onChange({
      lat: hit.lat,
      lng: hit.lng,
      label: hit.label,
      address: hit.addressLine ?? value.address,
      city: hit.city ?? value.city,
    });
    setQuery(hit.label);
    setResults([]);
    setListOpen(false);
  };

  const applyPin = (lat: number, lng: number) => {
    onChange({ ...value, lat, lng });
    setReverseBusy(true);
    void reversePhilippinesLocation(lat, lng)
      .then((hit) => {
        if (!hit) return;
        onChange({
          lat,
          lng,
          label: hit.label,
          address: hit.addressLine ?? value.address,
          city: hit.city ?? value.city,
        });
        setQuery(hit.label);
      })
      .finally(() => setReverseBusy(false));
  };

  const clearPin = () => {
    onChange({
      ...value,
      lat: undefined,
      lng: undefined,
      label: undefined,
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not available in this browser.');
      return;
    }
    setLocating(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPin(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setSearchError('Could not read your location. Allow location access or search instead.');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  return (
    <div className="space-y-3" ref={wrapRef}>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">
          Branch location (Philippines)
        </label>
        <p className="mb-2 text-[11px] leading-relaxed dash-muted">
          Search any place in the Philippines, drop a pin, or use your current location. Address and city fill
          automatically.
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kado-red/70" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setListOpen(true);
            }}
            onFocus={() => {
              if (results.length) setListOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) {
                e.preventDefault();
                applyResult(results[0]);
              }
              if (e.key === 'Escape') setListOpen(false);
            }}
            placeholder="Search mall, street, barangay, city…"
            className="w-full rounded-xl border-2 border-kado-dark/80 bg-white py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/25"
            aria-label="Search branch location in the Philippines"
            aria-autocomplete="list"
            aria-expanded={listOpen && results.length > 0}
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setListOpen(false);
              }}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full dash-muted hover:bg-kado-cream"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {searching ? (
          <p className="mt-2 flex items-center gap-2 text-xs dash-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching Philippines…
          </p>
        ) : null}
        {searchError ? <p className="mt-2 text-xs text-red-600">{searchError}</p> : null}

        {listOpen && results.length > 0 ? (
          <ul
            className="mt-2 max-h-52 overflow-y-auto rounded-xl border dash-border bg-white shadow-md"
            role="listbox"
          >
            {results.map((hit, i) => (
              <li key={`${hit.lat.toFixed(5)}-${hit.lng.toFixed(5)}-${i}`} role="option">
                <button
                  type="button"
                  onClick={() => applyResult(hit)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-kado-cream"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kado-red" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 block font-semibold text-kado-dark">{hit.label}</span>
                    {hit.city ? <span className="text-[11px] dash-muted">{hit.city}</span> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border dash-border px-3 py-2 text-sm font-semibold dash-muted hover:bg-kado-cream disabled:opacity-50"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          {locating ? 'Locating…' : 'Use my current location'}
        </button>
        {hasPin ? (
          <button
            type="button"
            onClick={clearPin}
            className="min-h-[44px] rounded-xl border border-kado-red/25 px-3 py-2 text-sm font-semibold text-kado-red hover:bg-kado-red/10 sm:shrink-0"
          >
            Clear pin
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border dash-border">
        <MapContainer
          center={mapCenter}
          zoom={hasPin ? PIN_ZOOM : PH_ZOOM}
          className="z-0 h-64 w-full sm:h-72"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasPin ? (
            <>
              <FlyToPin lat={value.lat!} lng={value.lng!} />
              <MapPinLayer lat={value.lat!} lng={value.lng!} onMove={applyPin} />
            </>
          ) : (
            <MapClickToPin onPick={applyPin} />
          )}
        </MapContainer>
      </div>

      {hasPin ? (
        <p className="text-[11px] dash-muted">
          {reverseBusy ? 'Updating address from pin…' : value.label ?? 'Pin placed — drag to fine-tune.'}
        </p>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          Add a location pin so customers can open directions from the Branches page.
        </p>
      )}
    </div>
  );
}
