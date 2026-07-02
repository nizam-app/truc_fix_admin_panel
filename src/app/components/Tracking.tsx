import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Navigation,
  Truck,
  User,
} from "lucide-react";
import { getApiBaseUrl, getStoredAdminSession } from "../auth";
import { adminFetchJson } from "../apiClient";
import { LiveTrackingMap, type LiveTrackingMapItem } from "./LiveTrackingMap";

type TrackingItem = {
  _id: string;
  displayName: string;
  baseLocationText: string | null;
  state: "EN_ROUTE" | "ON_JOB" | "AVAILABLE" | "OFFLINE" | string;
  currentJob: {
    _id: string;
    jobCode: string;
    title: string;
    fleetCompanyName: string | null;
    etaMinutes: number | null;
  } | null;
  latestLocation: {
    point: {
      type: "Point";
      coordinates: [number, number];
      address?: string | null;
    } | null;
    pingedAt: string;
  } | null;
};

type LiveTrackingResponse = {
  status: string;
  message: string;
  data: {
    cards: {
      activeMechanics: number;
      onJob: number;
      enRoute: number;
      available: number;
    };
    items: TrackingItem[];
  };
};

const formatRelativeDate = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(Math.round(diffMs / 60000), 0);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} days ago`;
};

const formatStateLabel = (state: string) => {
  switch (state) {
    case "ON_JOB":
      return "On Job";
    case "EN_ROUTE":
      return "En Route";
    case "AVAILABLE":
      return "Available";
    case "OFFLINE":
      return "Offline";
    default:
      return state.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "ON_JOB":
      return "bg-blue-100 text-blue-800";
    case "EN_ROUTE":
      return "bg-yellow-100 text-yellow-800";
    case "AVAILABLE":
      return "bg-green-100 text-green-800";
    case "OFFLINE":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getUpdateIcon = (status: string) => {
  switch (status) {
    case "ON_JOB":
      return <Clock className="text-blue-600" size={16} />;
    case "EN_ROUTE":
      return <Navigation className="text-yellow-600" size={16} />;
    case "AVAILABLE":
      return <CheckCircle className="text-green-600" size={16} />;
    case "OFFLINE":
      return <AlertCircle className="text-slate-600" size={16} />;
    default:
      return <AlertCircle className="text-slate-600" size={16} />;
  }
};

export function Tracking() {
  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(null);
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [cards, setCards] = useState({
    activeMechanics: 0,
    onJob: 0,
    enRoute: 0,
    available: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const session = getStoredAdminSession();
  const accessToken = session?.accessToken;
  const apiBaseUrl = getApiBaseUrl();

  const fetchTracking = async (background = false) => {
    if (!accessToken) {
      setLoading(false);
      setError("Your admin session has expired. Please sign in again.");
      return;
    }

    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const payload = await adminFetchJson<LiveTrackingResponse & { message?: string }>(
        "/admin/live-tracking",
        { method: "GET" },
        "Unable to load live tracking."
      );

      const nextItems = payload.data.items || [];
      setItems(nextItems);
      setCards(
        payload.data.cards || {
          activeMechanics: 0,
          onJob: 0,
          enRoute: 0,
          available: 0,
        }
      );
      setLastUpdated(new Date().toISOString());

      setSelectedMechanic((currentSelected) => {
        if (currentSelected && nextItems.some((item) => item._id === currentSelected)) {
          return currentSelected;
        }
        return nextItems[0]?._id || null;
      });
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load live tracking."
      );
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchTracking();
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const intervalId = window.setInterval(() => {
      void fetchTracking(true);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [accessToken, apiBaseUrl]);

  const selectedMechanicItem =
    items.find((mechanic) => mechanic._id === selectedMechanic) || null;

  const serviceUpdates = useMemo(
    () =>
      items
        .filter((item) => item.currentJob || item.latestLocation)
        .sort((left, right) => {
          const rightTime = new Date(
            right.latestLocation?.pingedAt || right.currentJob?._id || 0
          ).getTime();
          const leftTime = new Date(
            left.latestLocation?.pingedAt || left.currentJob?._id || 0
          ).getTime();
          return rightTime - leftTime;
        })
        .map((item) => ({
          id: item._id,
          mechanic: item.displayName,
          status: item.state,
          time: item.latestLocation?.pingedAt
            ? formatRelativeDate(item.latestLocation.pingedAt)
            : "No recent ping",
          update: item.currentJob
            ? `${item.currentJob.jobCode} · ${item.currentJob.title}`
            : item.baseLocationText
              ? `Available near ${item.baseLocationText}`
              : "No active assignment",
        })),
    [items]
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-time Tracking</h1>
          <p className="mt-1 text-gray-600">
            Monitor mechanic coverage, latest job states, and recent location pings
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {refreshing ? "Refreshing live feed..." : null}
          {!refreshing && lastUpdated
            ? `Last updated ${formatRelativeDate(lastUpdated)}`
            : null}
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Active Mechanics</p>
            <div className="rounded-lg bg-blue-100 p-2">
              <User className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{cards.activeMechanics}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">On Job</p>
            <div className="rounded-lg bg-purple-100 p-2">
              <Clock className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{cards.onJob}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">En Route</p>
            <div className="rounded-lg bg-yellow-100 p-2">
              <Navigation className="text-yellow-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{cards.enRoute}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">Available</p>
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{cards.available}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-white shadow lg:col-span-2">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Coverage Map</h3>
          </div>
          <div className="p-4">
            <div className="relative h-96 overflow-hidden rounded-lg bg-gray-100">
              <LiveTrackingMap
                items={items as unknown as LiveTrackingMapItem[]}
                loading={loading}
                selectedId={selectedMechanic}
                onSelect={setSelectedMechanic}
              />

              <div className="pointer-events-none absolute right-4 top-4 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 text-xs text-gray-500 shadow">
                Updates every 15s from latest mechanic pings
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Mechanics</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-4 text-sm text-gray-500">Loading mechanics...</div>
              ) : items.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  No mechanics are active right now.
                </div>
              ) : (
                items.map((mechanic) => (
                  <div
                    key={mechanic._id}
                    className={`cursor-pointer p-4 transition-colors ${
                      selectedMechanic === mechanic._id ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedMechanic(mechanic._id)}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-semibold text-white">
                          {mechanic.displayName
                            .split(" ")
                            .map((name) => name[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {mechanic.displayName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {mechanic.baseLocationText || "Base location unavailable"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(
                          mechanic.state
                        )}`}
                      >
                        {formatStateLabel(mechanic.state)}
                      </span>
                    </div>

                    {mechanic.currentJob ? (
                      <div className="ml-10 text-xs text-gray-600">
                        <p className="font-medium">{mechanic.currentJob.title}</p>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Truck size={12} />
                          <span>{mechanic.currentJob.jobCode}</span>
                        </div>
                        {mechanic.currentJob.etaMinutes !== null ? (
                          <div className="mt-1 flex items-center gap-1 text-blue-600">
                            <Clock size={12} />
                            <span>ETA: {mechanic.currentJob.etaMinutes} min</span>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="ml-10 text-xs text-gray-500">
                        No active job assigned.
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Updates</h3>
            </div>
            <div className="max-h-96 divide-y divide-gray-200 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-sm text-gray-500">Loading updates...</div>
              ) : serviceUpdates.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  No live updates have arrived yet.
                </div>
              ) : (
                serviceUpdates.map((update) => (
                  <div key={update.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getUpdateIcon(update.status)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {update.mechanic}
                        </p>
                        <p className="text-sm text-gray-600">{update.update}</p>
                        <p className="mt-1 text-xs text-gray-500">{update.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedMechanicItem ? (
            <div className="rounded-lg bg-white p-4 shadow">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Selected Mechanic
              </h3>
              <p className="text-sm font-medium text-gray-900">
                {selectedMechanicItem.displayName}
              </p>
              <p className="text-sm text-gray-600">
                {selectedMechanicItem.baseLocationText || "Base location unavailable"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-1 font-semibold ${getStatusColor(
                    selectedMechanicItem.state
                  )}`}
                >
                  {formatStateLabel(selectedMechanicItem.state)}
                </span>
                {selectedMechanicItem.latestLocation?.pingedAt ? (
                  <span className="text-gray-500">
                    Last ping {formatRelativeDate(selectedMechanicItem.latestLocation.pingedAt)}
                  </span>
                ) : (
                  <span className="text-gray-500">No recent location ping</span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
