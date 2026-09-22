import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const createCorner = (index) => ({
    id: `corner-${Date.now()}-${index}`,
    name: `Corner ${index + 1}`,
    coordinates: '',
});

const parseCoordinates = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    const parts = value.split(',').map((item) => Number(item.trim()));
    const [lat, lng] = parts;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }

    return [lng, lat];
};

function AreaMap({ areas }) {
    const mapContainer = useRef(null);
    const map = useRef(null);

    useEffect(() => {
        if (!mapContainer.current || !areas?.length) {
            return;
        }

        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        if (!token) {
            return;
        }

        mapboxgl.accessToken = token;

        if (map.current) {
            map.current.remove();
        }

        const validAreas = areas
            .map((area) => {
                const points = (area.corners ?? [])
                    .map((corner) => parseCoordinates(corner.coordinates))
                    .filter(Boolean);

                if (points.length < 3) {
                    return null;
                }

                const center = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
                const centroid = [center[0] / points.length, center[1] / points.length];

                return {
                    id: area.id,
                    location_name: area.location_name,
                    points,
                    centroid,
                };
            })
            .filter(Boolean);

        if (!validAreas.length) {
            return;
        }

        const bounds = new mapboxgl.LngLatBounds();
        validAreas.forEach((area) => area.points.forEach((point) => bounds.extend(point)));

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [124.6, 8.5],
            zoom: 12,
            attributionControl: false,
        });

        map.current.on('load', () => {
            validAreas.forEach((area) => {
                const polygonCoordinates = [...area.points, area.points[0]];

                map.current.addSource(`area-${area.id}`, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [polygonCoordinates],
                        },
                        properties: {
                            name: area.location_name,
                        },
                    },
                });

                map.current.addLayer({
                    id: `area-fill-${area.id}`,
                    type: 'fill',
                    source: `area-${area.id}`,
                    paint: {
                        'fill-color': '#10b981',
                        'fill-opacity': 0.18,
                    },
                });

                map.current.addLayer({
                    id: `area-line-${area.id}`,
                    type: 'line',
                    source: `area-${area.id}`,
                    paint: {
                        'line-color': '#047857',
                        'line-width': 2.5,
                    },
                });

                const popup = new mapboxgl.Popup({ offset: 24, closeButton: false })
                    .setHTML(`<div style="font-family:Segoe UI, sans-serif; font-size:12px; font-weight:700; color:#0f172a; padding:4px 8px; border-radius:10px; background:#fff; border:1px solid #d1fae5; box-shadow:0 10px 30px rgba(15,23,42,.12);">${area.location_name}</div>`);

                new mapboxgl.Marker({
                    color: '#047857',
                    scale: 1.1,
                })
                    .setLngLat(area.centroid)
                    .setPopup(popup)
                    .addTo(map.current);
            });

            map.current.fitBounds(bounds, {
                padding: 30,
                maxZoom: 13,
            });
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [areas]);

    return <div ref={mapContainer} className="h-[320px] w-full rounded-[24px] border border-emerald-100 bg-slate-100" />;
}

export default function Arealist({ auth, areas = [], flash = {} }) {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        location_name: '',
        area_type: 'Residential',
        corners: [
            { name: 'Corner 1', coordinates: '' },
            { name: 'Corner 2', coordinates: '' },
        ],
    });

    const updateCorner = (index, value) => {
        setData('corners', data.corners.map((corner, cornerIndex) =>
            cornerIndex === index ? { ...corner, coordinates: value } : corner,
        ));
    };

    const addCorner = () => {
        setData('corners', [
            ...data.corners,
            { name: `Corner ${data.corners.length + 1}`, coordinates: '' },
        ]);
    };

    const removeCorner = (index) => {
        if (data.corners.length <= 2) return;

        const nextCorners = data.corners
            .filter((_, cornerIndex) => cornerIndex !== index)
            .map((corner, cornerIndex) => ({
                ...corner,
                name: `Corner ${cornerIndex + 1}`,
            }));

        setData('corners', nextCorners);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('areas.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateModal(false);
                setData({
                    location_name: '',
                    area_type: 'Residential',
                    corners: [
                        { name: 'Corner 1', coordinates: '' },
                        { name: 'Corner 2', coordinates: '' },
                    ],
                });
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-lg font-bold text-slate-800">Area list</h2>}
        >
            <Head title="Area list" />

            <div className="py-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 rounded-[28px] border border-emerald-100 bg-gradient-to-r from-white via-emerald-50/40 to-white p-5 shadow-[0_18px_40px_rgba(15,118,110,0.06)] sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Area management</p>
                                <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-slate-900 sm:text-4xl">Area list</h1>
                                <p className="mt-2 max-w-xl text-sm text-slate-600">Monitor parcel coverage, boundary records, and administrative zones in one centralized GIS workspace.</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_18px_25px_rgba(16,185,129,0.22)] transition hover:bg-emerald-600"
                            >
                                + New area
                            </button>
                        </div>
                    </div>

                    <div className="mb-6 overflow-hidden rounded-[28px] border border-emerald-100 bg-white p-3 shadow-[0_18px_38px_rgba(15,118,110,0.06)] sm:p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Boundary overview</p>
                                <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-900">Area map</h2>
                            </div>
                        </div>
                        <AreaMap areas={areas} />
                    </div>

                    {flash.success && (
                        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_18px_38px_rgba(15,118,110,0.06)]">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="bg-slate-50/90">
                                    <tr>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Location</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Type</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Corners</th>
                                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {areas.length > 0 ? (
                                        areas.map((area) => (
                                            <tr key={area.id} className="hover:bg-slate-50/80">
                                                <td className="px-5 py-4 font-semibold text-slate-800">{area.location_name}</td>
                                                <td className="px-5 py-4 text-slate-600">{area.area_type}</td>
                                                <td className="px-5 py-4 text-slate-600">{Array.isArray(area.corners) ? area.corners.length : 0}</td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                                                        Active
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-5 py-12 text-center text-sm text-slate-500">
                                                No areas found yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-sm">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-6">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Area management</p>
                                <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-900">New area</h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-7">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="md:col-span-1">
                                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                        Location name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.location_name}
                                        onChange={(e) => setData('location_name', e.target.value)}
                                        placeholder="e.g. Barangay San Luis"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    />
                                    {errors.location_name && (
                                        <p className="mt-2 text-xs text-rose-600">{errors.location_name}</p>
                                    )}
                                </div>

                                <div className="md:col-span-1">
                                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                        Area type
                                    </label>
                                    <select
                                        value={data.area_type}
                                        onChange={(e) => setData('area_type', e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                    >
                                        <option value="Residential">Residential</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Forest">Forest</option>
                                        <option value="Protected">Protected Area</option>
                                    </select>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Boundary coordinates</h2>
                                        <p className="mt-1 text-xs text-slate-600">Enter the latitude and longitude for each corner of the area.</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addCorner}
                                        className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-emerald-600"
                                    >
                                        + Add corner
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {data.corners.map((corner, index) => (
                                        <div key={`${corner.name}-${index}`} className="rounded-2xl border border-emerald-100 bg-white p-4">
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">{corner.name}</h3>

                                                {data.corners.length > 2 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCorner(index)}
                                                        className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-600 transition hover:text-rose-700"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                    Latitude, Longitude
                                                </label>
                                                <input
                                                    type="text"
                                                    value={corner.coordinates}
                                                    onChange={(e) => updateCorner(index, e.target.value)}
                                                    placeholder="8.4878, 124.4659"
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(16,185,129,0.22)] transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {processing ? 'Saving...' : 'Save area'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
