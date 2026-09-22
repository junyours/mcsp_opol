import { useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import jsQR from 'jsqr';

const statusStyles = {
	pending: 'bg-amber-50 text-amber-700 ring-amber-200',
	approved: 'bg-blue-50 text-blue-700 ring-blue-200',
	scheduled: 'bg-sky-50 text-sky-700 ring-sky-200',
	completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
	declined: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const formatSchedule = (appointment) => {
	if (!appointment.scheduled_date) return 'Staff scheduling';

	const date = new Date(`${appointment.scheduled_date}T00:00:00`).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

	return appointment.scheduled_time ? `${date} at ${appointment.scheduled_time.slice(0, 5)}` : date;
};

const formatStatus = (status) => String(status || 'pending').replace(/[_-]/g, ' ');
const inventoryStatusStyles = {
	pending: 'bg-amber-50 text-amber-700 ring-amber-200',
	approved: 'bg-blue-50 text-blue-700 ring-blue-200',
	rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
};

function SeedlingDropdown({ seedlings, value, onChange }) {
	const [isOpen, setIsOpen] = useState(false);
	const selectedSeedling = seedlings.find((seedling) => String(seedling.id) === String(value));

	return (
		<div className="relative">
			<span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Seedling</span>
			<button
				type="button"
				onClick={() => setIsOpen((open) => !open)}
				aria-expanded={isOpen}
				className={`flex w-full items-center justify-between rounded-xl border bg-blue-50/40 px-3.5 py-3 text-left text-sm transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${isOpen ? 'border-blue-500 bg-white' : 'border-blue-100 hover:border-blue-300'}`}
			>
				<span className={selectedSeedling ? 'font-medium text-slate-700' : 'text-slate-400'}>
					{selectedSeedling ? selectedSeedling.name : 'Select available seedling'}
				</span>
				<span className={`ml-3 text-blue-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">⌄</span>
			</button>

			{isOpen && (
				<div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-blue-100 bg-white p-1.5 shadow-[0_16px_32px_rgba(30,64,175,0.16)]">
					{seedlings.length > 0 ? seedlings.map((seedling) => (
						<button
							key={seedling.id}
							type="button"
							onClick={() => { onChange(String(seedling.id)); setIsOpen(false); }}
							className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${String(seedling.id) === String(value) ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-900'}`}
						>
							<span className="font-medium">{seedling.name}</span>
							<span className={`ml-3 text-xs ${String(seedling.id) === String(value) ? 'text-blue-100' : 'text-slate-400'}`}>{seedling.quantity} {seedling.unit} available</span>
						</button>
					)) : (
						<p className="px-3 py-3 text-sm text-slate-500">No seedlings available</p>
					)}
				</div>
			)}
		</div>
	);
}

export default function AssignedJobs({ auth, appointments = [], seedlings = [], historyOnly = false }) {
	const displayedAppointments = historyOnly
		? appointments
		: appointments.filter((appointment) => !['completed', 'approved'].includes(String(appointment.status || '').toLowerCase()));
	const [selectedAppointment, setSelectedAppointment] = useState(null);
	const [selectedInventoryAppointment, setSelectedInventoryAppointment] = useState(null);
	const [scannerOpen, setScannerOpen] = useState(false);
	const [scanResult, setScanResult] = useState(null);
	const [scanError, setScanError] = useState('');
	const [scanDebug, setScanDebug] = useState('');
	const [isScanning, setIsScanning] = useState(false);
	const [isSubmittingPresence, setIsSubmittingPresence] = useState(false);
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const streamRef = useRef(null);
	const scanFrameRef = useRef(null);
	const scanningRef = useRef(false);
	const [showInventoryForm, setShowInventoryForm] = useState(false);
	const requestForm = useForm({ appointment_id: '', seedling_id: '', quantity: 1, notes: '' });

	const openAppointment = (appointment) => {
		setSelectedAppointment(appointment);
		setShowInventoryForm(false);
		requestForm.setData({ appointment_id: appointment.id, seedling_id: '', quantity: 1, notes: '' });
	};

	const submitInventoryRequest = (event) => {
		event.preventDefault();
		requestForm.post(route('inventory.requests.store'), { preserveScroll: true, onSuccess: () => setSelectedAppointment(null) });
	};

	const updateAppointmentStatus = (appointment, action) => {
		const actionLabel = action === 'staff-approve' ? 'approve' : action === 'staff-complete' ? 'complete' : 'reject';
		if (!window.confirm(`Are you sure you want to ${actionLabel} this appointment?`)) return;
		router.patch(route(`appointments.${action}`, appointment.id), {}, { preserveScroll: true, onSuccess: () => setSelectedAppointment(null) });
	};

	const parseMemberQrPayload = (rawValue) => {
		const cleanValue = String(rawValue ?? '').trim();
		if (!cleanValue) return null;

		const candidates = [cleanValue];
		const strippedQuotes = cleanValue.replace(/^(["'`]+)|(["'`]+)$/g, '').trim();
		if (strippedQuotes && strippedQuotes !== cleanValue) candidates.push(strippedQuotes);

		try {
			const decoded = decodeURIComponent(cleanValue);
			if (decoded && decoded !== cleanValue) candidates.push(decoded);
		} catch {
			// ignore decode errors
		}

		for (const candidate of candidates) {
			const trimmed = String(candidate).trim();
			const jsonObject = trimmed.match(/\{[\s\S]*\}/)?.[0];

			if (jsonObject) {
				try {
					const parsed = JSON.parse(jsonObject);
					if (parsed && (parsed.member_id || parsed.appointment_id)) {
						return {
							member_id: Number(parsed.member_id),
							appointment_id: Number(parsed.appointment_id),
						};
					}
				} catch {
					// keep checking other formats
				}
			}

			try {
				const parsed = JSON.parse(trimmed);
				if (parsed && (parsed.member_id || parsed.appointment_id)) {
					return {
						member_id: Number(parsed.member_id),
						appointment_id: Number(parsed.appointment_id),
					};
				}
			} catch {
				// keep checking other formats
			}
		}

		const memberMatch = cleanValue.match(/member[_-]?id\s*[=:]\s*["']?(\d+)/i)
			|| cleanValue.match(/"member_id"\s*:\s*(\d+)/i)
			|| cleanValue.match(/'member_id'\s*:\s*(\d+)/i);
		const appointmentMatch = cleanValue.match(/appointment[_-]?id\s*[=:]\s*["']?(\d+)/i)
			|| cleanValue.match(/"appointment_id"\s*:\s*(\d+)/i)
			|| cleanValue.match(/'appointment_id'\s*:\s*(\d+)/i);
		if (memberMatch?.[1] && appointmentMatch?.[1]) {
			return {
				member_id: Number(memberMatch[1]),
				appointment_id: Number(appointmentMatch[1]),
			};
		}

		return null;
	};

	const stopScanner = () => {
		scanningRef.current = false;
		if (scanFrameRef.current) window.cancelAnimationFrame(scanFrameRef.current);
		streamRef.current?.getTracks().forEach((track) => track.stop());
		streamRef.current = null;
		if (videoRef.current) {
			videoRef.current.pause();
			videoRef.current.srcObject = null;
		}
		setIsScanning(false);
		setScanDebug('');
	};

	const resolveMemberFromQrPayload = (payload) => {
		if (!selectedAppointment || !selectedAppointment.members) return null;
		const memberId = Number(payload.member_id);
		if (!memberId) return null;
		return selectedAppointment.members.find((member) => String(member.id) === String(memberId)) || null;
	};

	const handlePresentMember = () => {
		if (!scanResult || !selectedAppointment) return;
		setIsSubmittingPresence(true);

		window.axios.post(route('appointments.members.scan-attendance', selectedAppointment.id), {
			member_id: scanResult.id || scanResult.member_id,
			appointment_id: selectedAppointment.id,
			qr_data: scanResult.qr_data || '',
		})
			.then(({ data }) => {
				const member = data.member;
				const memberIndex = selectedAppointment.members?.findIndex((item) => String(item.id) === String(member.id));
				if (memberIndex >= 0) Object.assign(selectedAppointment.members[memberIndex], member);
				setScanError('');
				setScanResult(null);
			})
			.catch((error) => {
				setScanError(error.response?.data?.message || 'This QR code could not be marked as present.');
			})
			.finally(() => {
				setIsSubmittingPresence(false);
			});
	};

	useEffect(() => () => stopScanner(), []);

	useEffect(() => {
		if (!scannerOpen || scanResult || !selectedAppointment) return undefined;

		let cancelled = false;
		const startScanner = async () => {
			setScanError('');
			setScanDebug('');
			try {
				if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not supported in this browser.');
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((track) => track.stop());
					streamRef.current = null;
				}

				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: { ideal: 'environment' },
						width: { ideal: 1280 },
						height: { ideal: 720 },
					},
					audio: false,
				});

				if (cancelled) {
					stream.getTracks().forEach((track) => track.stop());
					return;
				}

				streamRef.current = stream;
				const video = videoRef.current;
				if (!video) return;
				video.srcObject = stream;
				video.muted = true;
				video.playsInline = true;
				await video.play().catch(() => {});
				scanningRef.current = true;
				setIsScanning(true);

				const nativeDetector = 'BarcodeDetector' in window
					? new window.BarcodeDetector({ formats: ['qr_code'] })
					: null;
				let lastScanAt = 0;
				let scanBusy = false;

				const handleScan = (rawValue) => {
					if (!rawValue || !scanningRef.current) return;
					const normalizedRawValue = String(rawValue).trim();
					setScanDebug(normalizedRawValue.slice(0, 500));
					const payload = parseMemberQrPayload(normalizedRawValue);
					if (!payload) {
						setScanError('This is not a valid MENRO member QR code.');
						return;
					}

					const member = resolveMemberFromQrPayload(payload);
					if (!member) {
						setScanError('This member is not part of this appointment.');
						return;
					}

					scanningRef.current = false;
					setScanError('');
					setScanDebug('');
					setScanResult({
						...member,
						id: member.id,
						member_id: payload.member_id,
						appointment_id: payload.appointment_id,
						qr_data: normalizedRawValue,
						attendance: member.attendance || 'pending',
						preview: true,
					});
					stopScanner();
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
							nativeDetector.detect(video)
								.then((barcodes) => {
									if (barcodes[0]?.rawValue) handleScan(barcodes[0].rawValue);
								})
								.catch(() => {})
								.finally(() => { scanBusy = false; });
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

				if (videoRef.current) {
					scanFrameRef.current = window.requestAnimationFrame(scanFrame);
				}
			} catch (error) {
				setScanError(error.message || 'Unable to access the camera. Please allow camera permission.');
				setIsScanning(false);
			}
		};

		startScanner();
		return () => {
			cancelled = true;
			stopScanner();
		};
	}, [scannerOpen, scanResult, selectedAppointment]);

	return (
		<AuthenticatedLayout
			user={auth.user}
			header={<span>{historyOnly ? 'History' : 'Assigned jobs'}</span>}
		>
			<Head title={historyOnly ? 'History' : 'Assigned jobs'} />

			<div className="space-y-6">
				<section className="relative overflow-hidden rounded-2xl bg-blue-950 px-5 py-6 text-white shadow-sm sm:px-7 sm:py-8">
					<div className="relative z-10 max-w-2xl">
						<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-200">Staff workspace</p>
						<h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{historyOnly ? 'Job history' : 'Your assigned jobs'}</h1>
						<p className="mt-2 text-sm leading-6 text-blue-100">
							{historyOnly ? 'Review approved and completed environmental service appointments in your queue.' : 'Review the environmental service appointments assigned to you and keep each request moving.'}
						</p>
					</div>
					<div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border-[24px] border-blue-800/50" />
					<div className="absolute -bottom-24 right-24 h-44 w-44 rounded-full border-[18px] border-blue-900/70" />
				</section>

				<section className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Work queue</p>
						<h2 className="mt-1 text-xl font-bold text-slate-800">{historyOnly ? 'Appointment history' : 'Assigned appointments'}</h2>
					</div>
					<div className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-right shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
						<p className="text-2xl font-black text-blue-950">{displayedAppointments.length}</p>
						<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{historyOnly ? 'Total history' : 'Total assigned'}</p>
					</div>
				</section>

				{displayedAppointments.length > 0 ? (
					<section className="grid gap-5 xl:grid-cols-2">
						{displayedAppointments.map((appointment) => {
							const status = String(appointment.status || 'pending').toLowerCase();
							const location = appointment.area?.location_name || appointment.area_name || 'Location to be confirmed';
							const requester = appointment.user?.name || appointment.organization_name || 'Resident request';
							const assignedStaff = appointment.assignee;
							const profileImage = assignedStaff?.profile_picture?.image;

							return (
								<article key={appointment.id} onClick={() => openAppointment(appointment)} onKeyDown={(event) => event.key === 'Enter' && openAppointment(appointment)} role="button" tabIndex="0" className="relative cursor-pointer overflow-hidden rounded-2xl border border-blue-100/80 bg-white p-5 shadow-[0_14px_30px_rgba(37,99,235,0.18),0_4px_10px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_22px_42px_rgba(37,99,235,0.28),0_7px_14px_rgba(15,23,42,0.07)] focus:outline-none focus:ring-2 focus:ring-blue-300 sm:p-6">
									<div className={`absolute inset-x-0 top-0 h-1 ${status === 'completed' ? 'bg-emerald-500' : ['declined', 'rejected'].includes(status) ? 'bg-rose-500' : status === 'pending' ? 'bg-amber-400' : 'bg-blue-600'}`} aria-hidden="true" />
									<div className="flex items-start justify-between gap-4">
										<div className="min-w-0">
											<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">Request #{appointment.id}</p>
											<h3 className="mt-2 truncate text-lg font-bold text-slate-800">{appointment.service_category || 'Environmental request'}</h3>
										</div>
										<span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusStyles[status] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
											{formatStatus(status)}
										</span>
									</div>

									<div className="mt-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
										{profileImage ? (
											<img src={profileImage} alt={`${assignedStaff.name} profile`} className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm" />
										) : (
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white" aria-hidden="true">
												{(assignedStaff?.name || 'S').charAt(0).toUpperCase()}
											</div>
										)}
										<div className="min-w-0">
											<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700">Assigned staff</p>
											<p className="truncate text-sm font-bold text-slate-800">{assignedStaff?.name || 'Staff member'}</p>
											{assignedStaff?.email && <p className="truncate text-xs text-slate-500">{assignedStaff.email}</p>}
										</div>
									</div>

									<dl className="mt-5 grid gap-4 border-y border-slate-100 py-4 sm:grid-cols-2">
										<div>
											<dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Location</dt>
											<dd className="mt-1 text-sm font-medium text-slate-700">{location}</dd>
										</div>
										<div>
											<dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Requester</dt>
											<dd className="mt-1 truncate text-sm font-medium text-slate-700">{requester}</dd>
										</div>
										<div>
											<dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Schedule</dt>
											<dd className="mt-1 text-sm font-medium text-slate-700">{formatSchedule(appointment)}</dd>
										</div>
										<div>
											<dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Participants</dt>
											<dd className="mt-1 text-sm font-medium text-slate-700">{appointment.members_count ?? 0} registered</dd>
										</div>
									</dl>

									<div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
										<div>
											<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700">Inventory</p>
											<p className="mt-1 text-xs text-slate-500">{appointment.inventory_requests?.length || 0} request{appointment.inventory_requests?.length === 1 ? '' : 's'}</p>
										</div>
										<button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryAppointment(appointment); }} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-800 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300">View inventory</button>
									</div>
								</article>
							);
						})}
					</section>
				) : (
					<section className="rounded-2xl border border-dashed border-blue-200 bg-white px-6 py-14 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
								<path d="M5 7.5h14v12H5zM8 7.5V5h8v2.5M8 12h8M8 15.5h5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>
						<h3 className="mt-4 text-lg font-bold text-slate-800">No assigned jobs yet</h3>
						<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">New appointments assigned to you will appear here.</p>
					</section>
				)}

				{selectedAppointment && (
					<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 sm:items-center" onMouseDown={() => setSelectedAppointment(null)}>
						<div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
							<div className="flex items-start justify-between gap-4">
								<div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Request #{selectedAppointment.id}</p><h2 className="mt-1 text-xl font-bold text-slate-900">{selectedAppointment.service_category || 'Environmental request'}</h2></div>
								<span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusStyles[String(selectedAppointment.status || 'pending').toLowerCase()] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>{formatStatus(selectedAppointment.status)}</span>
								<button type="button" onClick={() => setSelectedAppointment(null)} aria-label="Close appointment details" className="text-2xl leading-none text-slate-400 hover:text-slate-700">&times;</button>
							</div>
							{historyOnly ? selectedAppointment.status !== 'completed' && <button type="button" onClick={() => updateAppointmentStatus(selectedAppointment, 'staff-complete')} className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">Complete appointment</button> : <div className="mt-5 grid gap-3 sm:grid-cols-2">
								<button type="button" onClick={() => updateAppointmentStatus(selectedAppointment, 'staff-complete')} disabled={selectedAppointment.status === 'completed'} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">Complete appointment</button>
								<button type="button" onClick={() => updateAppointmentStatus(selectedAppointment, 'staff-decline')} disabled={['rejected', 'declined'].includes(String(selectedAppointment.status).toLowerCase())} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50">Reject appointment</button>
							</div>}
								<button type="button" onClick={() => { setScanResult(null); setScanError(''); setScanDebug(''); setScannerOpen(true); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-800 transition hover:bg-blue-100">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2M18 14h2M14 18h2M18 18h2" strokeLinecap="round" strokeLinejoin="round" /></svg>
								Scan attendance
						</button>
							<div className="mt-6 border-t border-slate-100 pt-5">
								<button type="button" onClick={() => setShowInventoryForm((visible) => !visible)} aria-expanded={showInventoryForm} className="flex w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100">
									<span><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Inventory</span><span className="mt-1 block text-sm font-semibold text-blue-950">{showInventoryForm ? 'Hide request form' : 'Request seedlings for this appointment'}</span></span>
									<span className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg text-blue-700 shadow-sm transition-transform ${showInventoryForm ? 'rotate-180' : ''}`} aria-hidden="true">⌄</span>
								</button>

								{showInventoryForm && (
									<form onSubmit={submitInventoryRequest} className="mt-4 space-y-4 rounded-xl border border-blue-100 bg-blue-50/30 p-4">
										<div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">New request</p><h3 className="mt-1 text-base font-bold text-slate-900">Request seedlings for this appointment</h3></div>
										<SeedlingDropdown seedlings={seedlings} value={requestForm.data.seedling_id} onChange={(value) => requestForm.setData('seedling_id', value)} />
										<input required type="number" min="1" value={requestForm.data.quantity} onChange={(event) => requestForm.setData('quantity', Number(event.target.value))} placeholder="Quantity" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100" />
										<textarea value={requestForm.data.notes} onChange={(event) => requestForm.setData('notes', event.target.value)} rows="3" placeholder="Notes for the admin (optional)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100" />
										<button type="submit" disabled={requestForm.processing || seedlings.length === 0} className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{requestForm.processing ? 'Submitting...' : 'Submit inventory request'}</button>
									</form>
								)}
							</div>
						</div>
					</div>
				)}

				{scannerOpen && (
					<div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onMouseDown={() => { stopScanner(); setScannerOpen(false); setScanResult(null); }}>
						<div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-blue-900/20 bg-white shadow-[0_20px_55px_rgba(15,45,90,0.24)]" role="dialog" aria-modal="true" aria-labelledby="staff-attendance-scanner-title" onMouseDown={(event) => event.stopPropagation()}>
							<div className="flex shrink-0 items-center justify-between bg-blue-950 px-4 py-3.5 text-white sm:px-6">
								<div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">Attendance register</p><h2 id="staff-attendance-scanner-title" className="mt-1 text-lg font-black">{scanResult ? 'Attendance recorded' : 'Scan member QR code'}</h2></div>
								<button type="button" onClick={() => { stopScanner(); setScannerOpen(false); setScanResult(null); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-xl leading-none text-white hover:bg-white/10" aria-label="Close scanner">&times;</button>
							</div>
							{!scanResult ? (
								<div className="overflow-y-auto p-4 sm:p-6">
									<div className="relative mx-auto max-h-[48vh] overflow-hidden rounded-xl bg-slate-950"><video ref={videoRef} muted playsInline className="aspect-[4/3] max-h-[48vh] w-full object-cover" /><canvas ref={canvasRef} className="hidden" /><div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="h-40 w-40 rounded-xl border-2 border-cyan-300 shadow-[0_0_0_999px_rgba(2,8,23,0.35)] sm:h-52 sm:w-52" /></div></div>
									<div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">Position the member QR code inside the frame. Press Present to record attendance and scan the next member.</div>
									{scanError && <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{scanError}</p>}
									{!isScanning && !scanError && <p className="mt-3 text-center text-xs text-slate-500">Starting camera...</p>}
								</div>
							) : (
								<div className="overflow-y-auto p-4 sm:p-7">
									<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
										<div className="flex flex-col items-center text-center">
											{scanResult.profile_picture ? (
												<img src={scanResult.profile_picture} alt={`${scanResult.first_name} profile`} className="h-28 w-28 rounded-[26px] border-4 border-white object-cover shadow-md sm:h-36 sm:w-36" />
											) : (
												<div className="flex h-28 w-28 items-center justify-center rounded-[26px] border-4 border-white bg-emerald-200 text-emerald-800 shadow-md sm:h-36 sm:w-36">No photo</div>
											)}
											<p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Successfully checked in</p>
											<h3 className="mt-1 text-lg font-black text-slate-900 sm:text-xl">{[scanResult.first_name, scanResult.middle_name, scanResult.last_name, scanResult.suffix].filter(Boolean).join(' ')}</h3>
															<p className="mt-1 text-xs font-semibold capitalize text-emerald-700">{scanResult.preview ? 'Ready to mark present' : (scanResult.attendance || 'present')}</p>
										</div>
														{scanResult.preview ? (
															<div className="mt-5 grid gap-2 sm:grid-cols-2">
																<button type="button" onClick={handlePresentMember} disabled={isSubmittingPresence} className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
																	{isSubmittingPresence ? 'Marking...' : 'Present & Next'}
																</button>
																<button type="button" onClick={() => { setScanResult(null); setScanError(''); setScanDebug(''); }} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-50">Scan next</button>
															</div>
														) : (
															<div className="mt-4 flex items-center justify-between rounded-lg bg-white/80 px-3 py-2.5 text-xs">
																<span className="text-slate-500">Time in</span>
																<strong className="text-right text-slate-900">{scanResult.time_in ? new Date(scanResult.time_in).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded'}</strong>
															</div>
														)}
									</div>
													{!scanResult.preview && (
														<div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => { setScanResult(null); setScanError(''); }} className="rounded-xl bg-blue-950 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-900">Scan next member</button><button type="button" onClick={() => { stopScanner(); setScannerOpen(false); setScanResult(null); }} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-50">Close scanner</button></div>
													)}
								</div>
							)}
						</div>
					</div>
				)}

				{selectedInventoryAppointment && (
					<div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center" onMouseDown={() => setSelectedInventoryAppointment(null)}>
						<div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
							<div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Inventory requests</p>
									<h2 className="mt-1 text-xl font-bold text-blue-950">Appointment #{selectedInventoryAppointment.id}</h2>
									<p className="mt-1 text-sm text-slate-500">{selectedInventoryAppointment.service_category || 'Environmental request'}</p>
								</div>
								<button type="button" onClick={() => setSelectedInventoryAppointment(null)} aria-label="Close inventory requests" className="text-2xl leading-none text-slate-400 hover:text-slate-700">&times;</button>
							</div>

							{selectedInventoryAppointment.inventory_requests?.length ? (
								<div className="mt-5 space-y-3">
									{selectedInventoryAppointment.inventory_requests.map((request) => {
										const requestStatus = String(request.status || 'pending').toLowerCase();

										return (
											<div key={request.id} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
												<div className="flex flex-wrap items-start justify-between gap-3">
													<div>
														<p className="font-bold text-slate-800">{request.seedling?.name || 'Seedling'}</p>
														<p className="mt-1 text-sm text-slate-500">Quantity requested: <span className="font-semibold text-slate-700">{request.quantity} {request.seedling?.unit || 'pcs'}</span></p>
													</div>
													<span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${inventoryStatusStyles[requestStatus] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>{formatStatus(requestStatus)}</span>
												</div>
												{request.notes && <p className="mt-3 border-t border-blue-100 pt-3 text-sm leading-6 text-slate-600">{request.notes}</p>}
												{request.review_notes && <p className="mt-2 text-xs text-rose-700">Admin note: {request.review_notes}</p>}
											</div>
										);
									})}
								</div>
							) : (
								<div className="mt-5 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-5 py-10 text-center">
									<p className="font-semibold text-blue-950">No inventory requested yet</p>
									<p className="mt-1 text-sm text-slate-500">Open the appointment details to request seedlings for this job.</p>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</AuthenticatedLayout>
	);
}
