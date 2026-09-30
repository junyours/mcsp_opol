import { useEffect, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import jsQR from 'jsqr';

export default function AppointmentMembers({ auth, appointment }) {
    const memberCount = appointment.members?.length ?? 0;
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [attendanceFilter, setAttendanceFilter] = useState('all');
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedQrCode, setSelectedQrCode] = useState(null);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanFrameRef = useRef(null);
    const scanningRef = useRef(false);
    const [certificate, setCertificate] = useState(appointment.certificate ?? null);
    const [certificateFile, setCertificateFile] = useState(null);
    const [selectedCertificate, setSelectedCertificate] = useState(false);
    const [uploadingCertificate, setUploadingCertificate] = useState(false);
    const filteredMembers = (appointment.members ?? []).filter((member) => {
        const memberName = [member.first_name, member.middle_name, member.last_name, member.suffix].filter(Boolean).join(' ');
        const search = searchTerm.toLowerCase();

        const matchesSearch = [memberName, member.role, member.phone_number, member.email, member.address]
            .some((value) => String(value ?? '').toLowerCase().includes(search));
        const matchesRole = roleFilter === 'all' || String(member.role ?? '').toLowerCase() === roleFilter;
        const matchesAttendance = attendanceFilter === 'all' || String(member.attendance || 'non-present').toLowerCase() === attendanceFilter;

        return matchesSearch && matchesRole && matchesAttendance;
    });

    const escapeExcelHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const formatMemberName = (member) => [member.first_name, member.middle_name, member.last_name, member.suffix].filter(Boolean).join(' ');
    const formatTimeIn = (timeIn) => timeIn ? new Date(timeIn).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded';
    const resolveRequirementImageSource = (image) => image?.url || image?.data || (image?.path ? `/storage/${image.path.replace(/^public\//, '')}` : null);

    const downloadExcel = () => {
        const rows = filteredMembers.map((member, index) => `
            <tr class="data">
                <td>${index + 1}</td>
                <td>${escapeExcelHtml(formatMemberName(member))}</td>
                <td>${escapeExcelHtml(member.role || 'member')}</td>
                <td>${escapeExcelHtml(member.phone_number)}</td>
                <td>${escapeExcelHtml(member.email || 'Not provided')}</td>
                <td>${escapeExcelHtml(member.address)}</td>
                <td>${member.qrcode ? 'Available' : 'Not available'}</td>
                <td>${escapeExcelHtml(member.attendance || 'non-present')}</td>
                <td>${escapeExcelHtml(formatTimeIn(member.time_in))}</td>
            </tr>`).join('');
        const workbook = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial,sans-serif;color:#172b4d}table{border-collapse:collapse;width:100%}.title{background:#0b2a52;color:#fff;font-size:18px;font-weight:700;padding:14px}.subtitle{background:#eaf2fb;color:#315783;font-size:11px;padding:8px}.header{background:#123e73;color:#fff;font-weight:700}.header td{padding:9px;border:1px solid #8eacd0}.data td{padding:8px;border:1px solid #c5d6ea}.data:nth-child(even){background:#f1f6fc}</style></head><body><table><tr><td colspan="9" class="title">MENRO OPOL - ATTENDANCE REGISTER</td></tr><tr><td colspan="9" class="subtitle">Appointment #${escapeExcelHtml(appointment.id)} | ${escapeExcelHtml(appointment.organization_name || 'Appointment members')} | Exported ${escapeExcelHtml(new Date().toLocaleString())}</td></tr><tr class="header"><td>No.</td><td>Member name</td><td>Role</td><td>Phone</td><td>Email</td><td>Address</td><td>QR code</td><td>Attendance</td><td>Time in</td></tr>${rows}</table></body></html>`;
        const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `menro-attendance-appointment-${appointment.id}.xls`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const stopScanner = () => {
        scanningRef.current = false;
        if (scanFrameRef.current) window.cancelAnimationFrame(scanFrameRef.current);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsScanning(false);
    };

    useEffect(() => () => stopScanner(), []);

    useEffect(() => {
        if (!scannerOpen || scanResult) return undefined;

        let cancelled = false;
        const startScanner = async () => {
            setScanError('');
            try {
                if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not supported in this browser.');
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                streamRef.current = stream;
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                scanningRef.current = true;
                setIsScanning(true);

                const nativeDetector = 'BarcodeDetector' in window
                    ? new window.BarcodeDetector({ formats: ['qr_code'] })
                    : null;
                let lastScanAt = 0;
                let scanBusy = false;

                const handleScan = (rawValue) => {
                    if (!rawValue || !scanningRef.current) return;
                    try {
                        const payload = JSON.parse(rawValue);
                        if (!payload.member_id || !payload.appointment_id) throw new Error('Invalid member QR code.');
                        scanningRef.current = false;
                        window.axios.post(route('appointments.members.scan-attendance', appointment.id), {
                            member_id: payload.member_id,
                            appointment_id: payload.appointment_id,
                        }).then(({ data }) => {
                            const updatedMember = data.member;
                            const memberIndex = appointment.members.findIndex((member) => String(member.id) === String(updatedMember.id));
                            if (memberIndex >= 0) Object.assign(appointment.members[memberIndex], updatedMember);
                            setScanResult(updatedMember);
                            stopScanner();
                        }).catch((error) => {
                            scanningRef.current = true;
                            setScanError(error.response?.data?.message || 'This QR code is not valid for this appointment.');
                        });
                    } catch {
                        setScanError('This is not a valid MENRO member QR code.');
                    }
                };

                const scanFrame = (timestamp) => {
                    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;
                    if (timestamp - lastScanAt < 80 || scanBusy) {
                        scanFrameRef.current = window.requestAnimationFrame(scanFrame);
                        return;
                    }
                    lastScanAt = timestamp;
                    const video = videoRef.current;
                    if (video.readyState >= 2 && video.videoWidth > 0) {
                        scanBusy = true;
                        if (nativeDetector) {
                            nativeDetector.detect(video).then((barcodes) => {
                                if (barcodes[0]?.rawValue) handleScan(barcodes[0].rawValue);
                            }).catch(() => {}).finally(() => { scanBusy = false; });
                        } else {
                            const canvas = canvasRef.current;
                            const scanSize = Math.min(video.videoWidth, video.videoHeight) * 0.72;
                            const sourceX = (video.videoWidth - scanSize) / 2;
                            const sourceY = (video.videoHeight - scanSize) / 2;
                            canvas.width = 640;
                            canvas.height = 640;
                            const context = canvas.getContext('2d', { willReadFrequently: true });
                            context.drawImage(video, sourceX, sourceY, scanSize, scanSize, 0, 0, 640, 640);
                            const image = context.getImageData(0, 0, 640, 640);
                            const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
                            if (code?.data) handleScan(code.data);
                            scanBusy = false;
                        }
                    }
                    scanFrameRef.current = window.requestAnimationFrame(scanFrame);
                };
                scanFrameRef.current = window.requestAnimationFrame(scanFrame);
            } catch (error) {
                setScanError(error.message || 'Unable to access the camera. Please allow camera permission.');
            }
        };

        startScanner();
        return () => {
            cancelled = true;
            stopScanner();
        };
    }, [scannerOpen, scanResult, appointment]);

    const uploadCertificate = () => {
        if (!certificateFile) return;

        const formData = new FormData();
        formData.append('certificate', certificateFile);
        setUploadingCertificate(true);

        window.axios.post(route('appointments.certificate.store', appointment.id), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((response) => {
            setCertificate(response.data?.certificate ?? {
                original_name: certificateFile.name,
                mime_type: 'application/pdf',
            });
            window.location.reload();
        }).catch((error) => {
            const message = Object.values(error.response?.data?.errors ?? {}).flat().join('\n');
            window.alert(message || 'The certificate could not be uploaded.');
        }).finally(() => setUploadingCertificate(false));
    };

    const deleteMember = (member) => {
        const memberName = formatMemberName(member);
        if (!window.confirm(`Delete ${memberName} from this appointment? This action cannot be undone.`)) return;

        window.axios.delete(route('appointments.members.destroy', [appointment.id, member.id]))
            .then(() => window.location.reload())
            .catch((error) => window.alert(error.response?.data?.message || 'The member could not be deleted.'));
    };

    const deleteRequirement = (image) => {
        if (!image?.name) return;
        if (!window.confirm(`Delete ${image.name}? This file will be removed from this appointment.`)) return;

        window.axios.delete(route('appointments.requirements.destroy', appointment.id), {
            data: { name: image.name },
        }).then(() => window.location.reload())
          .catch((error) => window.alert(error.response?.data?.message || 'The requirement could not be deleted.'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-lg font-bold text-slate-800">Appointment members</h2>}
        >
            <Head title={`Members - Appointment #${appointment.id}`} />

            <div className="py-6">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <Link href={route('appointments.index')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 hover:text-emerald-600">← Back to appointments</Link>
                    <div className="mt-4 overflow-hidden rounded-[28px] border border-emerald-900/10 bg-[#124b39] p-6 text-white shadow-[0_20px_45px_rgba(18,75,57,0.16)] sm:p-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-200">Appointment #{appointment.id}</p>
                                <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">{appointment.organization_name || 'Manage Appointments'}</h1>
                                <p className="mt-2 text-sm text-emerald-100">Submitted by {appointment.user?.name} · {appointment.area?.location_name ?? appointment.area_name ?? 'No area selected'}</p>
                            </div>
                            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold capitalize text-lime-200 ring-1 ring-white/15">{appointment.status}</span>
                        </div>
                        <div className="mt-7 flex flex-wrap gap-3 border-t border-white/15 pt-5 text-xs text-emerald-100">
                            <span><strong className="text-white">{memberCount}</strong> members submitted</span>
                            <span className="text-emerald-300">•</span>
                            <span>{appointment.user?.email}</span>
                        </div>
                    </div>

                    <div className="mb-5 mt-8 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Total members</p>
                            <p className="mt-2 text-2xl font-black text-slate-900">{memberCount}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">With email</p>
                            <p className="mt-2 text-2xl font-black text-emerald-900">{appointment.members?.filter((member) => member.email).length ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">With phone</p>
                            <p className="mt-2 text-2xl font-black text-amber-900">{appointment.members?.filter((member) => member.phone_number).length ?? 0}</p>
                        </div>
                    </div>

                    {appointment.requirements?.images?.length > 0 && (
                        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Submitted documents</p>
                                <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-900">Service requirements</h2>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {appointment.requirements.images.map((image) => {
                                    const imageSource = resolveRequirementImageSource(image);

                                    return (
                                        <div key={image.name} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left transition hover:border-emerald-300 hover:shadow-md">
                                            <button type="button" onClick={() => setSelectedImage(image)} className="block w-full text-left">
                                                {image.mime === 'application/pdf' ? (
                                                    <div className="flex h-36 items-center justify-center bg-red-50 text-sm font-bold text-red-700">PDF document</div>
                                                ) : imageSource ? (
                                                    <img src={imageSource} alt={image.name} className="h-36 w-full object-cover transition group-hover:scale-[1.02]" />
                                                ) : (
                                                    <div className="flex h-36 items-center justify-center bg-slate-200 text-sm font-bold text-slate-600">No preview</div>
                                                )}
                                                <p className="truncate px-3 py-3 text-xs font-semibold text-slate-700">{image.name}</p>
                                            </button>
                                            <button type="button" onClick={() => deleteRequirement(image)} className="absolute right-2 top-2 rounded-lg border border-rose-200 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700 shadow-sm transition hover:bg-rose-50" aria-label={`Delete ${image.name}`}>
                                                Delete
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <section className="mt-6 rounded-[22px] border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Appointment certificate</p>
                                <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-900">Certificate PDF</h2>
                                <p className="mt-1 text-xs text-slate-500">Upload the certificate issued for this appointment.</p>
                            </div>
                            {certificate && (
                                <button type="button" onClick={() => setSelectedCertificate(true)} className="rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-blue-600">
                                    View certificate
                                </button>
                            )}
                        </div>
                        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-4 sm:flex-row sm:items-center">
                            <input type="file" accept="application/pdf,.pdf" onChange={(event) => setCertificateFile(event.target.files?.[0] ?? null)} className="block min-w-0 flex-1 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200" />
                            <button type="button" onClick={uploadCertificate} disabled={uploadingCertificate || !certificateFile} className="shrink-0 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40">
                                {uploadingCertificate ? 'Uploading...' : certificate ? 'Replace PDF' : 'Upload PDF'}
                            </button>
                        </div>
                        {certificate && <p className="mt-3 text-xs font-medium text-blue-700">Current file: {certificate.original_name}</p>}
                    </section>

                    {selectedImage && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={() => setSelectedImage(null)}>
                            <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-slate-900 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="requirement-preview-title" onMouseDown={(event) => event.stopPropagation()}>
                                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-white sm:px-5">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Requirement preview</p>
                                        <h2 id="requirement-preview-title" className="mt-1 truncate text-sm font-semibold">{selectedImage.name}</h2>
                                    </div>
                                    <button type="button" onClick={() => setSelectedImage(null)} className="rounded-xl border border-white/15 px-3 py-2 text-xl leading-none text-white transition hover:bg-white/10" aria-label="Close requirement preview">&times;</button>
                                </div>
                                <div className="flex min-h-[260px] items-center justify-center overflow-auto bg-slate-950 p-4 sm:p-8">
                                    {selectedImage.mime === 'application/pdf' ? (
                                        <iframe src={resolveRequirementImageSource(selectedImage) || selectedImage.data} title={selectedImage.name} className="h-[65vh] w-full rounded-lg bg-white" />
                                    ) : (
                                        (() => {
                                            const previewSource = resolveRequirementImageSource(selectedImage);
                                            return previewSource ? (
                                                <img src={previewSource} alt={selectedImage.name} className="max-h-[70vh] max-w-full rounded-lg object-contain" />
                                            ) : (
                                                <div className="flex h-[65vh] w-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800 text-sm font-semibold text-slate-300">No preview available</div>
                                            );
                                        })()
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-4 py-3 sm:px-5">
                                    <button type="button" onClick={() => deleteRequirement(selectedImage)} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-500/20">Delete requirement</button>
                                    <a href={resolveRequirementImageSource(selectedImage) || selectedImage.data} download={selectedImage.name} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500">Download file</a>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedCertificate && certificate && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 backdrop-blur-md sm:p-4" onMouseDown={() => setSelectedCertificate(false)}>
                            <div className="relative flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.45)]" role="dialog" aria-modal="true" aria-labelledby="certificate-preview-title" onMouseDown={(event) => event.stopPropagation()}>
                                <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-slate-900/95 px-4 py-3 text-white sm:px-6">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 3.5V8h4M8 12h8M8 15.5h6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">Certificate preview</p>
                                                <h2 id="certificate-preview-title" className="mt-0.5 truncate text-sm font-semibold sm:text-base">{certificate.original_name}</h2>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="hidden rounded-full bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-300 sm:inline-flex">High resolution PDF</span>
                                        <button type="button" onClick={() => setSelectedCertificate(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-xl leading-none text-white transition hover:bg-white/10" aria-label="Close certificate preview">&times;</button>
                                    </div>
                                </div>
                                <div className="flex min-h-[360px] items-center justify-center overflow-auto bg-slate-950 p-2 sm:p-4">
                                    <iframe src={route('appointments.certificate.view', appointment.id)} title={certificate.original_name} loading="eager" allow="fullscreen" className="h-[78vh] min-h-[520px] w-full rounded-xl bg-white shadow-2xl" />
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-4 py-3 sm:px-6">
                                    <p className="text-[10px] text-slate-400">Use the PDF viewer controls to zoom and inspect the document.</p>
                                    <div className="flex items-center gap-2">
                                        <a href={route('appointments.certificate.view', appointment.id)} target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-200 transition hover:bg-white/10">Open full screen</a>
                                        <a href={route('appointments.certificate.view', appointment.id)} download={certificate.original_name} className="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-blue-500">Download PDF</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mb-3 mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Participant records</p>
                            <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-900">Submitted members</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:items-center">
                            <button type="button" onClick={() => { setScanResult(null); setScanError(''); setScannerOpen(true); }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-3.5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(15,45,90,0.18)] transition hover:bg-blue-900 xl:w-auto">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2M18 14h2M14 18h2M18 18h2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                Scan attendance
                            </button>
                        <label className="relative sm:col-span-2 xl:col-auto">
                            <span className="sr-only">Search members</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                            </svg>
                            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search members" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:w-64" />
                        </label>
                            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 xl:w-auto">
                                <option value="all">All roles</option>
                                {[...new Set((appointment.members ?? []).map((member) => String(member.role || 'member').toLowerCase()))].map((role) => <option key={role} value={role}>{role}</option>)}
                            </select>
                            <select value={attendanceFilter} onChange={(event) => setAttendanceFilter(event.target.value)} aria-label="Filter by attendance" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 xl:w-auto">
                                <option value="all">All attendance</option>
                                <option value="present">Present</option>
                                <option value="non-present">Non-present</option>
                            </select>
                            <button type="button" onClick={downloadExcel} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-3.5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(15,45,90,0.18)] transition hover:bg-blue-900 xl:w-auto">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 4v11M7 11l5 5 5-5M5 20h14" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                Export Excel
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[22px] border border-blue-950/15 bg-white shadow-[0_16px_36px_rgba(15,45,90,0.1)]">
                        <div className="flex items-center justify-between border-b border-blue-900/10 bg-[#f3f7fc] px-5 py-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Attendance register</p>
                                <p className="mt-1 text-xs text-slate-500">Participant records and activity check-in details</p>
                            </div>
                            <span className="rounded-full bg-blue-950 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100">{filteredMembers.length} records</span>
                        </div>
                        <div className="grid gap-3 p-3 xl:hidden">
                            {filteredMembers.map((member, index) => {
                                const memberName = formatMemberName(member);
                                const isPresent = member.attendance === 'present';

                                return (
                                    <article key={member.id} className="min-w-0 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                                        <div className="flex min-w-0 items-start gap-3">
                                            {member.profile_picture ? (
                                                <img src={member.profile_picture} alt={`${memberName} profile`} className="h-12 w-12 shrink-0 rounded-xl border border-blue-100 object-cover" />
                                            ) : (
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">{memberName.charAt(0) || '?'}</div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">#{String(index + 1).padStart(2, '0')}</span>
                                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-blue-800">{member.role || 'member'}</span>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${isPresent ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{member.attendance || 'non-present'}</span>
                                                </div>
                                                <h3 className="mt-1 break-words text-sm font-bold text-blue-950">{memberName}</h3>
                                            </div>
                                        </div>
                                        <dl className="mt-4 grid min-w-0 grid-cols-1 gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2">
                                            <div className="min-w-0"><dt className="font-semibold text-slate-500">Phone</dt><dd className="mt-0.5 break-words text-slate-800">{member.phone_number || 'Not provided'}</dd></div>
                                            <div className="min-w-0"><dt className="font-semibold text-slate-500">Email</dt><dd className="mt-0.5 break-all text-slate-800">{member.email || 'Not provided'}</dd></div>
                                            <div className="min-w-0 sm:col-span-2"><dt className="font-semibold text-slate-500">Address</dt><dd className="mt-0.5 break-words text-slate-800">{member.address || 'Not provided'}</dd></div>
                                            <div className="min-w-0 sm:col-span-2"><dt className="font-semibold text-slate-500">Time in</dt><dd className="mt-0.5 text-slate-800">{formatTimeIn(member.time_in)}</dd></div>
                                        </dl>
                                        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                                            {member.qrcode && <button type="button" onClick={() => setSelectedQrCode(member)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"><img src={member.qrcode} alt="" className="h-6 w-6 rounded bg-white object-contain" />View QR</button>}
                                            <button type="button" onClick={() => deleteMember(member)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                Delete member
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        <div className="hidden overflow-x-auto xl:block">
                            <table className="min-w-[1400px] w-full border-collapse text-left text-sm">
                                <thead className="bg-blue-950 text-blue-50">
                                    <tr className="text-[10px] font-bold uppercase tracking-[0.14em]">
                                        <th className="w-16 border-r border-white/10 px-5 py-4 text-blue-200">ID</th>
                                        <th className="border-r border-white/10 px-5 py-4">Member name</th>
                                        <th className="border-r border-white/10 px-5 py-4">Photo</th>
                                        <th className="border-r border-white/10 px-5 py-4">Role</th>
                                        <th className="border-r border-white/10 px-5 py-4">Phone</th>
                                        <th className="border-r border-white/10 px-5 py-4">Email</th>
                                        <th className="border-r border-white/10 px-5 py-4">Address</th>
                                        <th className="border-r border-white/10 px-5 py-4">QR code</th>
                                        <th className="border-r border-white/10 px-5 py-4">Attendance</th>
                                        <th className="px-5 py-4">Time in</th>
                                        <th className="px-5 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-100/80">
                                    {filteredMembers.map((member, index) => (
                                        <tr key={member.id} className="text-slate-700 odd:bg-white even:bg-blue-50/45 transition-colors hover:bg-blue-100/60">
                                            <td className="border-r border-blue-100/70 px-5 py-4 text-xs font-bold text-blue-700">{String(index + 1).padStart(2, '0')}</td>
                                            <td className="px-5 py-4 font-bold text-blue-950">{[member.first_name, member.middle_name, member.last_name, member.suffix].filter(Boolean).join(' ')}</td>
                                            <td className="px-5 py-4">
                                                {member.profile_picture ? <img src={member.profile_picture} alt={`${[member.first_name, member.middle_name, member.last_name, member.suffix].filter(Boolean).join(' ')} profile`} className="h-11 w-11 rounded-xl border-2 border-white object-cover shadow-sm ring-1 ring-blue-100" /> : <span className="text-xs text-slate-400">Not available</span>}
                                            </td>
                                            <td className="px-5 py-4"><span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold capitalize text-blue-800">{member.role}</span></td>
                                            <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-600">{member.phone_number}</td>
                                            <td className="px-5 py-4 text-xs text-slate-600">{member.email || <span className="text-slate-400">Not provided</span>}</td>
                                            <td className="max-w-xs px-5 py-4 text-xs text-slate-600">{member.address}</td>
                                            <td className="px-5 py-4">
                                                {member.qrcode ? (
                                                    <button type="button" onClick={() => setSelectedQrCode(member)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100">
                                                        <img src={member.qrcode} alt="" className="h-8 w-8 rounded bg-white object-contain" />
                                                        View QR
                                                    </button>
                                                ) : <span className="text-xs text-slate-400">Not available</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${member.attendance === 'present' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {member.attendance || 'non-present'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-600">
                                                {member.time_in ? new Date(member.time_in).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <button type="button" onClick={() => deleteMember(member)} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {!appointment.members?.length && <div className="mt-6 rounded-[22px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">No members have submitted their details yet.</div>}
                    {appointment.members?.length > 0 && !filteredMembers.length && <div className="mt-6 rounded-[22px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">No members match your search.</div>}

                    {scannerOpen && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onMouseDown={() => { stopScanner(); setScannerOpen(false); setScanResult(null); }}>
                            <div className="w-full max-w-lg overflow-hidden rounded-[26px] border border-blue-900/20 bg-white shadow-[0_28px_80px_rgba(15,45,90,0.3)]" role="dialog" aria-modal="true" aria-labelledby="attendance-scanner-title" onMouseDown={(event) => event.stopPropagation()}>
                                <div className="flex items-center justify-between bg-blue-950 px-5 py-4 text-white sm:px-6">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">Attendance register</p>
                                        <h2 id="attendance-scanner-title" className="mt-1 text-lg font-black">{scanResult ? 'Attendance recorded' : 'Scan member QR code'}</h2>
                                    </div>
                                    <button type="button" onClick={() => { stopScanner(); setScannerOpen(false); setScanResult(null); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-xl leading-none text-white hover:bg-white/10" aria-label="Close scanner">&times;</button>
                                </div>

                                {!scanResult ? (
                                    <div className="p-5 sm:p-6">
                                        <div className="relative overflow-hidden rounded-2xl bg-slate-950">
                                            <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
                                            <canvas ref={canvasRef} className="hidden" />
                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                <div className="h-48 w-48 rounded-2xl border-2 border-cyan-300 shadow-[0_0_0_999px_rgba(2,8,23,0.35)] sm:h-56 sm:w-56" />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                                            <span className="mt-0.5 text-blue-700"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 8v4M12 16h.01" strokeLinecap="round" /><circle cx="12" cy="12" r="9" /></svg></span>
                                            <p className="text-xs leading-5 text-blue-900">Position the member QR code inside the frame. Attendance will be recorded automatically after a valid scan.</p>
                                        </div>
                                        {scanError && <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{scanError}</p>}
                                        {!isScanning && !scanError && <p className="mt-3 text-center text-xs text-slate-500">Starting camera...</p>}
                                    </div>
                                ) : (
                                    <div className="p-5 sm:p-7">
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                            <div className="flex items-center gap-4">
                                                {scanResult.profile_picture ? <img src={scanResult.profile_picture} alt={`${scanResult.first_name} profile`} className="h-20 w-20 rounded-2xl border-2 border-white object-cover shadow-sm" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-200 text-emerald-800">No photo</div>}
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Successfully checked in</p>
                                                    <h3 className="mt-1 text-xl font-black text-slate-900">{[scanResult.first_name, scanResult.middle_name, scanResult.last_name, scanResult.suffix].filter(Boolean).join(' ')}</h3>
                                                    <p className="mt-1 text-xs font-semibold capitalize text-emerald-700">{scanResult.attendance}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between rounded-xl bg-white/80 px-3 py-2.5 text-xs"><span className="text-slate-500">Time in</span><strong className="text-slate-900">{scanResult.time_in ? new Date(scanResult.time_in).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded'}</strong></div>
                                        </div>
                                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                                            <button type="button" onClick={() => { setScanResult(null); setScanError(''); }} className="rounded-xl bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-900">Scan next member</button>
                                            <button type="button" onClick={() => { stopScanner(); setScannerOpen(false); setScanResult(null); }} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-50">Close scanner</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {selectedQrCode && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={() => setSelectedQrCode(null)}>
                            <div className="w-full max-w-sm rounded-[24px] border border-blue-100 bg-white p-6 text-center shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="member-qrcode-title" onMouseDown={(event) => event.stopPropagation()}>
                                <div className="flex items-start justify-between gap-3 text-left">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Attendance QR code</p>
                                        <h2 id="member-qrcode-title" className="mt-1 text-lg font-black text-slate-900">{[selectedQrCode.first_name, selectedQrCode.middle_name, selectedQrCode.last_name, selectedQrCode.suffix].filter(Boolean).join(' ')}</h2>
                                    </div>
                                    <button type="button" onClick={() => setSelectedQrCode(null)} className="text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close QR code">&times;</button>
                                </div>
                                <div className="mx-auto mt-5 w-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                                    <img src={selectedQrCode.qrcode} alt="Member attendance QR code" className="h-64 w-64 object-contain" />
                                </div>
                                <div className="mt-5 grid gap-2 text-left text-xs">
                                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-500">Attendance</span><strong className="capitalize text-slate-800">{selectedQrCode.attendance || 'non-present'}</strong></div>
                                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-500">Time in</span><strong className="text-slate-800">{selectedQrCode.time_in ? new Date(selectedQrCode.time_in).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded'}</strong></div>
                                </div>
                                <a href={selectedQrCode.qrcode} download={`attendance-qr-${selectedQrCode.id}.png`} className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-blue-600">Download QR code</a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}