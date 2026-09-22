import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const emptyForm = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    status: 'active',
};

const formatRole = (role) => {
    const normalized = String(role || 'User').trim();

    return normalized.toLowerCase() === 'user' ? 'User' : normalized || 'User';
};

export default function Users({ auth, residents = [] }) {
    const { data, setData, post, patch, delete: destroy, reset, errors, processing } = useForm(emptyForm);
    const [searchTerm, setSearchTerm] = useState('');
    const [residentPage, setResidentPage] = useState(1);
    const [editingResidentId, setEditingResidentId] = useState(null);
    const residentsPerPage = 10;
    const filteredResidents = residents.filter((resident) => {
        const search = searchTerm.trim().toLowerCase();
        if (!search) return true;

        return [resident.name, resident.email, resident.role, resident.status]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search));
    });
    const totalPages = Math.max(1, Math.ceil(filteredResidents.length / residentsPerPage));
    const currentPage = Math.min(residentPage, totalPages);
    const visibleResidents = filteredResidents.slice((currentPage - 1) * residentsPerPage, currentPage * residentsPerPage);

    const resetForm = () => {
        reset();
        setEditingResidentId(null);
    };

    const handleEdit = (resident) => {
        setData({
            name: resident.name || '',
            email: resident.email || '',
            password: '',
            password_confirmation: '',
            status: resident.status || 'active',
        });
        setEditingResidentId(resident.id);
    };

    const submit = (event) => {
        event.preventDefault();

        if (editingResidentId) {
            patch(route('residents.update', editingResidentId), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });

            return;
        }

        post(route('residents.store'), {
            preserveScroll: true,
            onSuccess: () => resetForm(),
        });
    };

    const handleDelete = (resident) => {
        if (!window.confirm(`Delete ${resident.name}? This action cannot be undone.`)) return;

        destroy(route('residents.destroy', resident.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-lg font-bold text-slate-800">Residents</h2>}
        >
            <Head title="Residents" />

            <div className="min-h-screen bg-[#f4f7fb] py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 rounded-[20px] border border-slate-200 bg-white px-5 py-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:px-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Administration / Accounts</p>
                                <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-900 sm:text-3xl">Manage Accounts</h1>
                                <p className="mt-2 text-sm text-slate-500">Manage user accounts and keep all users assigned to the default User role.</p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-800">
                                <span className="h-2 w-2 rounded-full bg-blue-700" />
                                Role: User
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Total residents</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">{residents.length}</p>
                        </div>
                        <div className="rounded-[18px] border border-blue-200 bg-blue-50 px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Role</p>
                            <p className="mt-2 text-2xl font-bold text-blue-900">User</p>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Active accounts</p>
                            <p className="mt-2 text-2xl font-bold text-slate-800">{residents.filter((resident) => resident.status === 'active').length}</p>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">Resident directory</h2>
                                    <p className="mt-1 text-xs text-slate-500">{filteredResidents.length} resident account{filteredResidents.length === 1 ? '' : 's'}{searchTerm ? ' found' : ''}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="relative">
                                        <span className="sr-only">Search residents</span>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                                        </svg>
                                        <input
                                            value={searchTerm}
                                            onChange={(event) => {
                                                setSearchTerm(event.target.value);
                                                setResidentPage(1);
                                            }}
                                            placeholder="Search residents"
                                            className="w-44 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
                                        />
                                    </label>
                                    <span className="hidden rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600 sm:inline-block">User accounts</span>
                                </div>
                            </div>

                            {filteredResidents.length ? (
                                <div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[640px] divide-y divide-slate-200 text-left">
                                            <thead className="bg-slate-50/80">
                                                <tr className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                                    <th className="px-3 py-2.5">Resident</th>
                                                    <th className="px-3 py-2.5">Email</th>
                                                    <th className="px-3 py-2.5">Role</th>
                                                    <th className="px-3 py-2.5">Status</th>
                                                    <th className="px-3 py-2.5">Joined</th>
                                                    <th className="px-3 py-2.5 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs">
                                                {visibleResidents.map((resident) => (
                                                    <tr key={resident.id} className="transition hover:bg-slate-50/80">
                                                        <td className="px-3 py-3 font-bold text-slate-900">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200">
                                                                    {resident.name?.charAt(0)?.toUpperCase() || 'R'}
                                                                </span>
                                                                <div>
                                                                    <div className="leading-4">{resident.name}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-[11px] text-slate-500">{resident.email}</td>
                                                        <td className="px-3 py-3">
                                                            <span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700 ring-1 ring-blue-100">
                                                                {formatRole(resident.role)}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <span className={`rounded-full px-2 py-1 text-[9px] font-bold capitalize ${resident.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'}`}>
                                                                {resident.status || 'active'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-[11px] text-slate-500">
                                                            {resident.created_at ? new Date(resident.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            }) : 'N/A'}
                                                        </td>
                                                        <td className="px-3 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Edit ${resident.name}`}
                                                                    onClick={() => handleEdit(resident)}
                                                                    className="inline-flex items-center justify-center p-1 text-slate-500 transition hover:text-slate-700"
                                                                >
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                                                        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    aria-label={`Delete ${resident.name}`}
                                                                    onClick={() => handleDelete(resident)}
                                                                    className="inline-flex items-center justify-center p-1 text-rose-500 transition hover:text-rose-700"
                                                                >
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                                                        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/40 px-5 py-3">
                                        <button
                                            type="button"
                                            onClick={() => setResidentPage((page) => Math.max(page - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Previous
                                        </button>

                                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                            Page {currentPage} of {totalPages}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => setResidentPage((page) => Math.min(page + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="px-5 py-12 text-center text-sm text-slate-500">{searchTerm ? 'No residents match your search.' : 'No resident accounts have been created.'}</p>
                            )}
                        </section>

                        <aside className="h-fit rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                            <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                            <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11a3 3 0 1 0 0-6M16 14.5h1a4 4 0 0 1 4 4V20" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900">{editingResidentId ? 'Edit resident' : 'Create resident'}</h2>
                                        <p className="text-xs text-slate-500">{editingResidentId ? 'Update account details' : 'Manual registration'}</p>
                                    </div>
                                </div>

                                {editingResidentId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 transition hover:text-slate-700"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Name</label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(event) => setData('name', event.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label htmlFor="email" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(event) => setData('email', event.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        required
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                                </div>

                                <div>
                                    <label htmlFor="status" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Status</label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(event) => setData('status', event.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="password" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                        Password {editingResidentId ? '(optional)' : ''}
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(event) => setData('password', event.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        required={!editingResidentId}
                                    />
                                    {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
                                </div>

                                <div>
                                    <label htmlFor="password_confirmation" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                        Confirm password {editingResidentId ? '(optional)' : ''}
                                    </label>
                                    <input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(event) => setData('password_confirmation', event.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        required={!editingResidentId}
                                    />
                                    {errors.password_confirmation && <p className="mt-1 text-xs text-rose-600">{errors.password_confirmation}</p>}
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {processing ? (editingResidentId ? 'Updating...' : 'Saving...') : (editingResidentId ? 'Update resident' : 'Create resident')}
                                    </button>
                                </div>
                            </form>
                        </aside>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
