import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Inventory({ auth, seedlings = [], history = [], totals = {}, inventoryRequests = [] }) {
    const [activeTab, setActiveTab] = useState('overview');

    const seedlingForm = useForm({
        name: '',
        scientific_name: '',
        category: '',
        quantity: 0,
        unit: 'pcs',
        supplier: '',
    });

    const stockForm = useForm({
        seedling_id: '',
        movement_type: 'stock_in',
        quantity: 1,
        notes: '',
    });

    const handleSeedlingSubmit = (e) => {
        e.preventDefault();
        seedlingForm.post(route('inventory.seedlings.store'), {
            preserveScroll: true,
            onSuccess: () => seedlingForm.reset(),
        });
    };

    const handleStockSubmit = (e) => {
        e.preventDefault();
        stockForm.post(route('inventory.stock.store'), {
            preserveScroll: true,
            onSuccess: () => stockForm.reset('quantity', 'notes', 'seedling_id'),
        });
    };

    const reviewRequest = (request, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this inventory request?`)) return;

        router.patch(route(`inventory.requests.${action}` , request.id), {}, { preserveScroll: true });
    };

    const tabs = [
        { key: 'overview', label: 'Overview' },
        { key: 'stock', label: 'Stock In / Out' },
        { key: 'history', label: 'History' },
    ];

    const statCards = [
        { label: 'Seedlings', value: totals.seedlings ?? 0, tone: 'emerald' },
        { label: 'Available stock', value: totals.available_stock ?? 0, tone: 'slate' },
        { label: 'Stock in', value: totals.stock_in ?? 0, tone: 'emerald' },
        { label: 'Stock out', value: totals.stock_out ?? 0, tone: 'rose' },
    ];

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-base font-semibold tracking-tight text-blue-950">Inventory</h2>}>
            <Head title="Inventory" />

                <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-[26px] border border-blue-900/10 bg-blue-950 p-6 text-white shadow-[0_22px_50px_rgba(30,64,175,0.18)] sm:p-8">
                        <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border-[26px] border-blue-800/50" />
                        <div className="pointer-events-none absolute -bottom-24 right-36 h-44 w-44 rounded-full border-[18px] border-blue-900/70" />
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-blue-200">Operations / seedling inventory</p>
                                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Inventory dashboard</h1>
                                <p className="max-w-xl text-sm leading-6 text-blue-100">Monitor available seedlings, review staff requests, and keep every stock movement accountable.</p>
                            </div>

                            <div className="relative flex flex-wrap items-center gap-2 rounded-xl border border-blue-300/20 bg-blue-900/70 p-1.5">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={[
                                            'rounded-lg px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-200',
                                            activeTab === tab.key
                                                ? 'bg-blue-100 text-blue-950 shadow-sm'
                                                : 'text-blue-100 hover:bg-blue-800 hover:text-white',
                                        ].join(' ')}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {statCards.map((card) => (
                            <div
                                key={card.label}
                                className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_14px_32px_rgba(30,64,175,0.06)] sm:p-5"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                                    <span
                                        className={[
                                            'inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold',
                                            card.tone === 'emerald'
                                                ? 'bg-blue-100 text-blue-700'
                                                : card.tone === 'rose'
                                                    ? 'bg-rose-100 text-rose-700'
                                                    : 'bg-slate-200 text-slate-700',
                                        ].join(' ')}
                                    >
                                        {card.label.charAt(0)}
                                    </span>
                                </div>
                                <h3 className="mt-4 text-3xl font-bold tracking-tight text-blue-950">{card.value}</h3>
                            </div>
                        ))}
                    </div>

                    {inventoryRequests.length > 0 && (
                        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_16px_38px_rgba(30,64,175,0.07)] sm:p-5">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-700">Staff requests</p>
                                    <h2 className="mt-1 text-lg font-bold tracking-tight text-blue-950">Inventory approval queue</h2>
                                </div>
                                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">{inventoryRequests.filter((item) => item.status === 'pending').length} pending</span>
                            </div>
                            <div className="mt-5 overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className="bg-blue-50/70"><tr><th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-800">Appointment</th><th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-800">Seedling</th><th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-800">Requested by</th><th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-800">Status</th><th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-800">Action</th></tr></thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {inventoryRequests.map((request) => <tr key={request.id} className="hover:bg-slate-50/70"><td className="px-4 py-3.5 text-slate-700">#{request.appointment_id}<span className="block text-xs text-slate-400">{request.appointment?.service_category || 'Appointment'}</span></td><td className="px-4 py-3.5 font-medium text-slate-800">{request.seedling?.name || '—'}<span className="block text-xs text-slate-500">{request.quantity} {request.seedling?.unit || 'pcs'}</span></td><td className="px-4 py-3.5 text-slate-600">{request.requester?.name || '—'}</td><td className="px-4 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${request.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : request.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{request.status}</span></td><td className="px-4 py-3.5 text-right">{request.status === 'pending' && <div className="flex justify-end gap-2"><button type="button" onClick={() => reviewRequest(request, 'approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white hover:bg-emerald-700">Approve</button><button type="button" onClick={() => reviewRequest(request, 'reject')} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-rose-700 hover:bg-rose-100">Reject</button></div>}</td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
                            <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_16px_38px_rgba(30,64,175,0.06)] sm:p-5">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-700">Inventory list</p>
                                        <h2 className="mt-1 text-lg font-bold tracking-tight text-blue-950">Seedlings</h2>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                        <thead className="bg-slate-50/80">
                                            <tr>
                                                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Seedling</th>
                                                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Scientific name</th>
                                                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Category</th>
                                                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Qty</th>
                                                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Added by</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {seedlings.length > 0 ? (
                                                seedlings.map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="px-4 py-3.5">
                                                            <div className="font-medium text-slate-800">{item.name}</div>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-slate-600">{item.scientific_name || '—'}</td>
                                                        <td className="px-4 py-3.5 text-slate-600">{item.category}</td>
                                                        <td className="px-4 py-3.5">
                                                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-700">
                                                                {item.quantity} {item.unit}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-slate-600">{item.user_name || '—'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-12 text-center text-sm text-slate-500">
                                                        No seedlings recorded yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_16px_38px_rgba(30,64,175,0.06)] sm:p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-700">Add seedling</p>
                                <h2 className="mt-1 text-lg font-bold tracking-tight text-blue-950">New stock entry</h2>

                                <form onSubmit={handleSeedlingSubmit} className="mt-5 space-y-4">
                                    <div>
                                        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Seedling name</label>
                                        <input
                                            value={seedlingForm.data.name}
                                            onChange={(e) => seedlingForm.setData('name', e.target.value)}
                                            className="w-full rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Scientific name</label>
                                        <input
                                            value={seedlingForm.data.scientific_name}
                                            onChange={(e) => seedlingForm.setData('scientific_name', e.target.value)}
                                            placeholder="e.g. Swietenia macrophylla"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Category</label>
                                            <input
                                                value={seedlingForm.data.category}
                                                onChange={(e) => seedlingForm.setData('category', e.target.value)}
                                                className="w-full rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Unit</label>
                                            <select
                                                value={seedlingForm.data.unit}
                                                onChange={(e) => seedlingForm.setData('unit', e.target.value)}
                                                className="w-full rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            >
                                                <option value="pcs">pcs</option>
                                                <option value="bags">bags</option>
                                                <option value="trays">trays</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Quantity</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={seedlingForm.data.quantity}
                                                onChange={(e) => seedlingForm.setData('quantity', Number(e.target.value))}
                                                className="w-full rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Supplier</label>
                                            <input
                                                value={seedlingForm.data.supplier}
                                                onChange={(e) => seedlingForm.setData('supplier', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={seedlingForm.processing}
                                        className="w-full rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_22px_rgba(30,64,175,0.18)] transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {seedlingForm.processing ? 'Saving...' : 'Save seedling'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stock' && (
                        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                            <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_16px_38px_rgba(30,64,175,0.06)] sm:p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-700">Movement log</p>
                                <h2 className="mt-1 text-lg font-bold tracking-tight text-blue-950">Stock in / stock out</h2>

                                <form onSubmit={handleStockSubmit} className="mt-5 space-y-4">
                                    <div>
                                        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Seedling</label>
                                        <select
                                            value={stockForm.data.seedling_id}
                                            onChange={(e) => stockForm.setData('seedling_id', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                        >
                                            <option value="">Select seedling</option>
                                            {seedlings.map((item) => (
                                                <option key={item.id} value={item.id}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Movement type</label>
                                            <select
                                                value={stockForm.data.movement_type}
                                                onChange={(e) => stockForm.setData('movement_type', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                            >
                                                <option value="stock_in">Stock In</option>
                                                <option value="stock_out">Stock Out</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={stockForm.data.quantity}
                                                onChange={(e) => stockForm.setData('quantity', Number(e.target.value))}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Notes</label>
                                        <textarea
                                            value={stockForm.data.notes}
                                            onChange={(e) => stockForm.setData('notes', e.target.value)}
                                            rows="4"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={stockForm.processing}
                                        className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_22px_rgba(16,185,129,0.18)] transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {stockForm.processing ? 'Saving...' : 'Submit movement'}
                                    </button>
                                </form>
                            </div>

                            <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_16px_38px_rgba(30,64,175,0.06)] sm:p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-700">Quick summary</p>
                                <h3 className="mt-1 text-lg font-bold tracking-tight text-blue-950">Low stock</h3>
                                <div className="mt-5 space-y-3">
                                    {seedlings.filter((item) => item.quantity <= 10).length > 0 ? (
                                        seedlings.filter((item) => item.quantity <= 10).map((item) => (
                                            <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="font-medium text-slate-800">{item.name}</span>
                                                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-700">{item.quantity} left</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                                            All seedlings are currently above the low-stock threshold.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_16px_38px_rgba(30,64,175,0.06)] sm:p-5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-700">Audit trail</p>
                            <h2 className="mt-1 text-lg font-bold tracking-tight text-blue-950">Inventory history</h2>

                            <div className="mt-5 overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                    <thead className="bg-slate-50/80">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Seedling</th>
                                            <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Type</th>
                                            <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Quantity</th>
                                            <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">User</th>
                                            <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {history.length > 0 ? (
                                            history.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-4 py-3.5 font-medium text-slate-800">{item.seedling_name || '—'}</td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={[
                                                            'inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]',
                                                            item.movement_type === 'stock_in'
                                                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                : 'border border-rose-200 bg-rose-50 text-rose-700',
                                                        ].join(' ')}>
                                                            {item.movement_type === 'stock_in' ? 'Stock in' : 'Stock out'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-600">{item.quantity}</td>
                                                    <td className="px-4 py-3.5 text-slate-600">{item.user_name || '—'}</td>
                                                    <td className="px-4 py-3.5 text-slate-600">{item.created_at || '—'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-12 text-center text-sm text-slate-500">
                                                    No inventory history yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
        </AuthenticatedLayout>
    );
}
