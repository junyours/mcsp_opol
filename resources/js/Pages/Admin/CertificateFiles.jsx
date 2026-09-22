import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = Number(bytes);
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const statusTone = (status) => {
    const normalized = String(status || '').toLowerCase();

    if (['completed', 'approved', 'done'].includes(normalized)) {
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/10';
    }

    if (['rejected', 'cancelled', 'canceled'].includes(normalized)) {
        return 'bg-rose-50 text-rose-700 ring-rose-600/10';
    }

    if (['onprocess', 'pending', 'processing'].includes(normalized)) {
        return 'bg-amber-50 text-amber-700 ring-amber-600/10';
    }

    return 'bg-slate-100 text-slate-700 ring-slate-600/10';
};

export default function CertificateFiles({ auth, certificateGroups = [] }) {
    const [selectedService, setSelectedService] = useState(null);
    const [selectedCertificateId, setSelectedCertificateId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const selectedGroup = useMemo(() => {
        if (!certificateGroups.length) return null;
        if (!selectedService) return certificateGroups[0];
        return certificateGroups.find((group) => group.service_category === selectedService) ?? certificateGroups[0];
    }, [certificateGroups, selectedService]);

    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) return certificateGroups;
        const term = searchTerm.toLowerCase();

        return certificateGroups
            .map((group) => ({
                ...group,
                certificates: (group.certificates ?? []).filter((certificate) => {
                    const haystack = [
                        certificate.original_name,
                        certificate.requester,
                        certificate.uploaded_by,
                        group.service_category,
                    ].filter(Boolean).join(' ').toLowerCase();
                    return haystack.includes(term);
                }),
            }))
            .filter((group) => group.service_category.toLowerCase().includes(term) || group.certificates.length > 0)
            .map((group) => ({
                ...group,
                count: group.certificates.length,
            }));
    }, [certificateGroups, searchTerm]);

    const activeGroup = useMemo(() => {
        if (!filteredGroups.length) return null;
        if (!selectedService) return filteredGroups[0];
        return filteredGroups.find((group) => group.service_category === selectedService) ?? filteredGroups[0];
    }, [filteredGroups, selectedService]);

    const selectedCertificate = useMemo(() => {
        if (!activeGroup || !selectedCertificateId) return null;
        return activeGroup.certificates.find((certificate) => String(certificate.id) === String(selectedCertificateId)) ?? null;
    }, [activeGroup, selectedCertificateId]);

    useEffect(() => {
        if (!certificateGroups.length) {
            setSelectedService(null);
            setSelectedCertificateId(null);
            return;
        }

        const firstGroup = certificateGroups[0];
        setSelectedService((current) => current ?? firstGroup.service_category);
        setSelectedCertificateId((current) => {
            const currentGroup = certificateGroups.find((group) => group.service_category === selectedService) ?? firstGroup;
            if (current && currentGroup.certificates.some((certificate) => String(certificate.id) === String(current))) {
                return current;
            }
            return null;
        });
    }, [certificateGroups, selectedService]);

    useEffect(() => {
        if (!filteredGroups.length) {
            setSelectedService(null);
            setSelectedCertificateId(null);
            return;
        }

        const nextGroup = filteredGroups.find((group) => group.service_category === selectedService) ?? filteredGroups[0];
        setSelectedService((current) => current && filteredGroups.some((group) => group.service_category === current) ? current : nextGroup.service_category);
    }, [filteredGroups, selectedService]);

    const totalFiles = certificateGroups.reduce((total, group) => total + (group.count || 0), 0);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-lg font-bold text-slate-800">Certificates</h2>}
        >
            <Head title="Certificates" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Service records</p>
                                <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Certificate files</h1>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                    <span className="font-bold text-slate-800">{totalFiles}</span> total files
                                </div>
                                <label className="relative block">
                                    <span className="sr-only">Search certificates</span>
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                            <circle cx="11" cy="11" r="6" strokeLinecap="round" />
                                            <path d="M16 16l4 4" strokeLinecap="round" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Search files or folders"
                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 sm:w-72"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {filteredGroups.length === 0 ? (
                        <div className="rounded-[26px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                                    <path d="M7 3.5h8l4 4V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M15 3.5V8h4M9 12h6M9 15h6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 className="mt-5 text-xl font-bold text-slate-800">No matching certificates found</h2>
                            <p className="mt-2 text-sm text-slate-500">Try another folder or file name.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
                            <aside className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Folders</p>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{filteredGroups.length}</span>
                                </div>

                                <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                                    {filteredGroups.map((group) => {
                                        const isSelected = activeGroup?.service_category === group.service_category;

                                        return (
                                            <button
                                                key={group.service_category}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedService(group.service_category);
                                                    setSelectedCertificateId(null);
                                                }}
                                                className={[
                                                    'flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition',
                                                    isSelected
                                                        ? 'border-emerald-200 bg-emerald-50 shadow-sm'
                                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white',
                                                ].join(' ')}
                                            >
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                                                        <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h4l1.5 2H18a2.5 2.5 0 0 1 2.5 2.5v6.5A2.5 2.5 0 0 1 18 19.5H6A2.5 2.5 0 0 1 3.5 17V8.5Z" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold text-slate-800">{group.service_category}</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">{group.count} file{group.count === 1 ? '' : 's'}</p>
                                                </div>
                                                <span className="text-lg text-slate-400">›</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>

                            <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
                                {activeGroup ? (
                                    <>
                                        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Open folder</p>
                                                <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-900">{activeGroup.service_category}</h2>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>{activeGroup.count} item{activeGroup.count === 1 ? '' : 's'}</span>
                                            </div>
                                        </div>

                                        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Files</p>
                                                <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">{activeGroup.certificates.length}</span>
                                            </div>
                                            <div className="grid max-h-[250px] gap-4 overflow-y-auto pr-1 md:grid-cols-3">
                                                {activeGroup.certificates.map((certificate) => (
                                                    <button
                                                        key={certificate.id}
                                                        type="button"
                                                        onClick={() => setSelectedCertificateId(certificate.id)}
                                                        className={[
                                                            'rounded-[22px] border px-3 py-3 text-left transition',
                                                            String(certificate.id) === String(selectedCertificateId)
                                                                ? 'border-emerald-300 bg-white shadow-sm'
                                                                : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white',
                                                        ].join(' ')}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 text-red-700">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                                                    <path d="M7 3.5h8l4 4V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                                                                    <path d="M15 3.5V8h4M9 12h6M9 15h6" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-bold text-slate-800">{certificate.original_name}</p>
                                                                <p className="mt-1 text-[11px] text-slate-500">{certificate.requester}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedCertificate ? (
                                            <div className="space-y-4 p-5">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Selected file</p>
                                                        <h3 className="mt-1 text-lg font-black text-slate-900">{selectedCertificate.original_name}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ${statusTone(selectedCertificate.status)}`}>
                                                            {selectedCertificate.status || 'unknown'}
                                                        </span>
                                                        <a href={selectedCertificate.view_url} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-500">
                                                            Open PDF
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-inner">
                                                    <iframe
                                                        src={selectedCertificate.view_url}
                                                        title={selectedCertificate.original_name}
                                                        className="h-[72vh] min-h-[520px] w-full bg-white"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex min-h-[420px] items-center justify-center p-8 text-center text-slate-500">
                                                Select a file to preview its PDF content.
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex min-h-[420px] items-center justify-center p-8 text-center text-slate-500">
                                        No certificate selected.
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
