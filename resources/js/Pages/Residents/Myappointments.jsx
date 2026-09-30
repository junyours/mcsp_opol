import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ResidentsLayout from '@/Layouts/ResidentsLayout';

const formatType = (type) => type === 'school' ? 'School / Organization' : type === 'individual' ? 'Individual Resident' : 'Couple';
const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatSchedule = (date) => date ? formatDate(date) : 'To be scheduled by staff';
const requiredDocuments = {
	'Tree Planting': ['OR for Tree Planting', 'Proof of Planting'],
	'Tree Cutting': ['Barangay Clearance', 'OR for Tree Cutting'],
	'Back Filling': ['Zoning Clearance', 'OR for Back Filling', 'Site Development Plan'],
	'Special Waste Collection': ['OR for Special Waste Collection'],
};
const environmentalGuidance = {
	'Tree Planting': {
		dos: [
			'Coordinate with MENRO before planting in areas covered by municipal or environmental regulations.',
			'Choose appropriate tree species suitable for the location.',
			'Plant trees in approved or appropriate planting areas.',
			'Consider existing roads, sidewalks, drainage systems, buildings, electrical lines, and other infrastructure.',
			'Properly maintain and care for newly planted trees.',
			'Follow any required registration, documentation, monitoring, or reporting procedures.',
			'Ask MENRO for guidance when unsure about the proper planting location or species.',
		],
		donts: [
			'Plant trees in locations that may obstruct roads, sidewalks, drainage, utilities, or public facilities.',
			'Plant invasive, unsuitable, or prohibited species.',
			'Damage existing trees, public property, or infrastructure while planting.',
			'Plant on restricted areas without proper authorization.',
			'Ignore required environmental or municipal procedures.',
			'Assume that planting on public property is automatically allowed.',
			'Abandon newly planted trees without proper maintenance.',
		],
	},
	'Tree Cutting': {
		dos: [
			'Coordinate with MENRO before cutting a tree.',
			'Determine whether the tree requires a permit or authorization before cutting.',
			'Provide the required documents and supporting information when applying for authorization.',
			'Allow MENRO personnel to inspect or assess the tree when required.',
			'Follow the conditions stated in the approved permit or authorization.',
			'Observe proper safety procedures when cutting or removing a tree.',
			'Comply with any replacement, replanting, or environmental requirements imposed by the authorities.',
		],
		donts: [
			'Cut or remove a regulated tree without the required permit or authorization.',
			'Assume that a tree located on private property can always be cut without permission.',
			'Cut trees located in public areas, roadsides, waterways, or other regulated areas without proper authorization.',
			'Illegally transport, sell, or dispose of timber or tree products.',
			'Damage neighboring trees or public infrastructure during tree removal.',
			'Falsify information or documents in connection with a tree-cutting application.',
			'Ignore MENRO instructions, inspection findings, permit conditions, or applicable environmental regulations.',
		],
	},
	'Special Waste Collection': {
		dos: [
			'Coordinate with MENRO before scheduling any special waste collection.',
			'Segregate and properly store special waste in designated containers before collection.',
			'Ensure the waste is accessible for collection and does not block roads, sidewalks, or public pathways.',
			'Review and comply with any municipal or environmental disposal requirements for the waste type.',
			'Keep the collection area safe for workers and the public during pickup.',
			'Prepare the necessary documents and supporting information required by MENRO.',
			'Follow any instructions given by staff regarding pickup time, location, or handling.',
		],
		donts: [
			'Dump or abandon special waste in public areas, waterways, empty lots, or other unauthorized locations.',
			'Mix hazardous or prohibited waste with ordinary garbage.',
			'Block roads, access points, or drainage systems while waiting for collection.',
			'Treat special waste collection as an automatic disposal method without prior coordination.',
			'Ignore MENRO guidelines for handling, packaging, or collection safety.',
			'Submit inaccurate or incomplete information about the waste being collected.',
			'Dispose of special waste without ensuring compliance with local environmental standards.',
		],
	},
};

const isOnProcess = (status) => ['ongoing', 'onprocess', 'on process', 'inprocess', 'in process'].includes(String(status ?? '').toLowerCase());
const statusClass = (status) => {
	const normalizedStatus = String(status ?? '').toLowerCase();

	if (['approved', 'completed', 'done'].includes(normalizedStatus)) return 'bg-blue-50 text-blue-700';
	if (['rejected', 'declined', 'cancelled', 'canceled'].includes(normalizedStatus)) return 'bg-rose-50 text-rose-700';
	if (isOnProcess(status)) return 'bg-sky-50 text-sky-700';

	return 'bg-amber-50 text-amber-700';
};

const getStatusStep = (status) => {
	return getTimelineSteps(status).findIndex((step) => step.toLowerCase() === getCurrentTimelineStatus(status).toLowerCase()) + 1 || 1;
};

const getCurrentTimelineStatus = (status) => {
	const normalizedStatus = String(status ?? '').toLowerCase().replace(/[_-]+/g, ' ');
	const completedIndex = normalizedStatus.indexOf('completed');
	const confirmedIndex = normalizedStatus.indexOf('confirmed');

	if (normalizedStatus.includes('declined') || normalizedStatus.includes('rejected') || normalizedStatus.includes('cancel')) return 'Declined';
	if (completedIndex >= 0 && confirmedIndex >= 0) return completedIndex > confirmedIndex ? 'Completed' : 'Confirmed';
	if (completedIndex >= 0) return 'Completed';
	if (confirmedIndex >= 0) return 'Confirmed';
	if (normalizedStatus.includes('approved')) return 'Approved';
	if (isOnProcess(status)) return 'Ongoing';

	return 'Pending';
};

const getTimelineSteps = (status) => {
	const normalizedStatus = String(status ?? '').toLowerCase().replace(/[_-]+/g, ' ');
	const steps = ['Pending', 'Ongoing'];
	const completedIndex = normalizedStatus.indexOf('completed');
	const confirmedIndex = normalizedStatus.indexOf('confirmed');

	if (normalizedStatus.includes('declined') || normalizedStatus.includes('rejected') || normalizedStatus.includes('cancel')) return [...steps, 'Declined'];
	if (completedIndex >= 0 && confirmedIndex >= 0) {
		return [...steps, ...(completedIndex < confirmedIndex ? ['Completed', 'Confirmed'] : ['Confirmed', 'Completed']), 'Approved'];
	}
	if (completedIndex >= 0) return [...steps, 'Completed', 'Approved'];
	if (confirmedIndex >= 0) return [...steps, 'Confirmed', 'Approved'];

	return [...steps, 'Confirmed', 'Approved'];
};

const needsRequirementsAction = (status) => {
	const normalizedStatus = String(status ?? '').toLowerCase();

	return isOnProcess(status) || normalizedStatus.includes('approved') || normalizedStatus.includes('confirmed') || normalizedStatus.includes('completed');
};

const canViewStatement = (status) => {
	const normalizedStatus = String(status ?? '').toLowerCase();

	return isOnProcess(status) || normalizedStatus.includes('confirmed') || normalizedStatus.includes('completed');
};

const AppointmentTimeline = ({ status }) => {
	const currentStep = getStatusStep(status);
	const isDeclined = getCurrentTimelineStatus(status) === 'Declined';
	const steps = getTimelineSteps(status);
	const progressWidth = currentStep <= 1 ? 0 : ((currentStep - 1) / (steps.length - 1)) * 76;

	return (
		<div className="w-full max-w-[240px] px-0 py-0 sm:w-[240px]">
			<div className="mb-2 flex items-center justify-end">
				<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Status timeline</p>
			</div>
			<div className="relative flex items-start justify-between">
				<div className="absolute left-[12%] right-[12%] top-2 h-1 rounded-full bg-slate-200" />
				<div className={`absolute left-[12%] top-2 h-1 rounded-full transition-all duration-500 ${isDeclined ? 'bg-rose-400 shadow-sm shadow-rose-200' : 'bg-blue-500 shadow-sm shadow-blue-200'}`} style={{ width: `${progressWidth}%` }} />
				{steps.map((step, index) => {
					const stepNumber = index + 1;
					const isCurrent = stepNumber === currentStep;
					const isComplete = stepNumber < currentStep;

					return (
						<div key={step} style={{ width: `${100 / steps.length}%` }} className="relative z-10 flex flex-col items-center gap-1.5 text-center">
							<span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-[9px] font-bold transition ${isCurrent ? `${isDeclined ? 'border-rose-500 bg-rose-500' : 'border-blue-500 bg-blue-500'} text-white shadow-sm ${isDeclined ? 'shadow-rose-200' : 'shadow-blue-200'} animate-pulse` : isComplete ? `${isDeclined ? 'border-rose-300 bg-rose-100 text-rose-700' : 'border-blue-300 bg-blue-100 text-blue-700'}` : 'border-slate-200 bg-white text-slate-400'}`}>
								{isComplete ? (isDeclined && stepNumber === 2 ? '!' : '✓') : stepNumber}
							</span>
							<span className={`text-[9px] font-semibold ${isCurrent ? (isDeclined ? 'text-rose-700' : 'text-blue-700') : isComplete ? 'text-slate-600' : 'text-slate-400'}`}>{step}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	"'": '&#39;',
	'"': '&quot;',
}[character]));

export default function Myappointments({ auth, appointments = [] }) {
	const [selectedAppointment, setSelectedAppointment] = useState(null);
	const [certificateAppointment, setCertificateAppointment] = useState(null);
	const [statementAppointment, setStatementAppointment] = useState(null);
	const [memberSearch, setMemberSearch] = useState('');
	const [memberPage, setMemberPage] = useState(1);
	const [requirementFiles, setRequirementFiles] = useState({});
	const [uploadingRequirements, setUploadingRequirements] = useState(false);
	const [requirementsUploaded, setRequirementsUploaded] = useState(false);
	const membersPerPage = 20;

	const openMembers = (appointment) => {
		setSelectedAppointment(appointment);
		setMemberSearch('');
		setMemberPage(1);
		setRequirementFiles({});
	};

	const handleRequirementChange = async (documentName, file) => {
		if (!file) return;

		setRequirementFiles((current) => ({ ...current, [documentName]: { name: file.name, mime: file.type || 'application/octet-stream', size: file.size, file } }));
	};

	const uploadRequirements = () => {
		if (!selectedAppointment) return;

		const documents = requiredDocuments[selectedAppointment.service_category] ?? [];
		const formData = new FormData();

		documents.forEach((name) => {
			const fileEntry = requirementFiles[name];
			if (fileEntry?.file) {
				formData.append(`images[${name}]`, fileEntry.file);
			}
		});

		setUploadingRequirements(true);
		window.axios.post(route('appointments.requirements.store', selectedAppointment.id), formData, {
			headers: { Accept: 'application/json' },
		}).then(({ data }) => {
			setSelectedAppointment((current) => ({
				...current,
				requirements: { images: data.images },
			}));
			setRequirementsUploaded(true);
		}).catch((error) => {
			window.alert(error.response?.data?.message || 'The requirements could not be uploaded. Please check every document and try again.');
		}).finally(() => setUploadingRequirements(false));
	};

	const downloadStatement = async (appointment) => {
		const serviceCategory = escapeHtml(appointment.service_category || 'Tree Planting').toUpperCase();
		const residentName = escapeHtml(auth.user?.name || 'Resident');
		const generatedAt = new Date();
		const generatedDateTime = new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			second: '2-digit',
			hour12: true,
		}).format(generatedAt);
		const guidance = environmentalGuidance[appointment.service_category];
		const guidanceMarkup = guidance ? `
			<div class="guidance"><h2>${serviceCategory} REMINDERS</h2><div class="guidance-grid"><section class="dos"><h3>${serviceCategory} — DOs</h3><ul>${guidance.dos.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section><section class="donts"><h3>${serviceCategory} — DON'Ts</h3><ul>${guidance.donts.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section></div><div class="disclaimer"><strong>LEGAL / ORDINANCE DISCLAIMER</strong><p>These reminders are provided for general guidance only. Actual permit requirements, restrictions, fees, penalties, and procedures shall be based on the applicable municipal ordinances and national environmental laws and regulations. Please coordinate with the Municipal Environment and Natural Resources Office (MENRO) for official guidance.</p></div></div>
		` : '';
		const stepsMarkup = `<div class="steps"><h2>HOW TO COMPLETE YOUR PAYMENT</h2><ol><li><strong>Step 1:</strong> Download the Statement of Account.</li><li><strong>Step 2:</strong> Cut the Statement of Account along the dashed line.</li><li><strong>Step 3:</strong> Go to the Treasury Office and pay there.</li><li><strong>Step 4:</strong> Go back to the site, open My Registrations, select the ongoing registration, and upload the OR.</li></ol></div>`;

		const statementHtml = `<!doctype html><html><head><title>Statement of Account</title><style>
			@page{size:A4;margin:18mm}body{color:#1e293b;font-family:Arial,sans-serif;margin:0}.cut-area{border:2px dashed #64748b;padding:5px}.header{border-bottom:2px solid #334155;padding-bottom:5px;text-align:center}.logos{align-items:center;display:flex;justify-content:center;gap:14px}.logos img{height:34px;object-fit:contain;width:34px}.gov{font-size:8px;font-weight:700;line-height:1.2;text-transform:uppercase}h1{font-size:11px;margin:3px 0 0;text-transform:uppercase}.account{border-bottom:1px solid #cbd5e1;padding:6px 0}.statement{margin-top:8px;padding:1px}.statement-title{font-size:13px;font-weight:900;letter-spacing:0.08em;margin:0 0 8px;text-align:center;text-transform:uppercase}.issued-box{margin-top:14px;padding:8px 10px;border-top:1px solid #cbd5e1;background:#f8fafc}.issued-label{font-size:7px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#475569;margin-bottom:4px}.issued-name{font-size:8px;font-weight:700;color:#0f172a;line-height:1.5}.issued-meta{font-size:7px;color:#475569;margin-top:4px;line-height:1.5}h2{font-size:12px;margin:0 0 5px;text-align:center;text-transform:uppercase}table{border-collapse:collapse;width:100%}th,td{border:1px solid #64748b;padding:5px;text-align:left}th:last-child,td:last-child{text-align:center;width:90px}.total td{font-weight:700}.guidance{border-top:2px solid #15803d;margin-top:20px;padding-top:10px}.guidance-grid{display:grid;gap:10px;grid-template-columns:1fr 1fr}.guidance section{border:1px solid;padding:8px}.guidance h3{font-size:9px;margin:0 0 4px;text-transform:uppercase}.guidance ul{font-size:8px;line-height:1.25;margin:0;padding-left:14px}.dos{background:#f0fdf4;border-color:#bbf7d0}.dos h3{color:#166534}.donts{background:#fff1f2;border-color:#fecdd3}.donts h3{color:#9f1239}.disclaimer,.steps{background:#fffbeb;border:1px solid #fde68a;font-size:8px;line-height:1.25;margin-top:10px;padding:8px}.disclaimer strong,.steps h2{color:#92400e;font-size:9px}.steps{background:#eff6ff;border-color:#bfdbfe}.steps h2{color:#075985;text-align:left}.steps li{margin:3px 0}
		</style></head><body><div class="cut-area"><div class="header"><div class="logos"><img src="${window.location.origin}/images/opol-logo.png" alt="Municipality of Opol"><div class="gov">Republic of the Philippines<br>Province of Misamis Oriental<br>Municipality of Opol</div><img src="${window.location.origin}/images/logo.png" alt="MENRO"></div><h1>Municipal Environmental and Natural Resources Office</h1></div><div class="statement"><h1 class="statement-title">SYSTEM-GENERATED STATEMENT OF ACCOUNT</h1><div class="account">For the account of: <strong>${residentName}</strong></div><table><tr><th>Description</th><th>Amount</th></tr><tr><td>CERT. FOR ${serviceCategory}</td><td>130.00</td></tr><tr class="total"><td style="text-align:right">TOTAL</td><td>130.00</td></tr></table><div class="issued-box"><div class="issued-label">Issued by:</div><div class="issued-name">MUNICIPAL ENVIRONMENTAL AND NATURAL RESOURCES OFFICE<br>Municipality of Opol</div><div class="issued-meta">Generated on: ${escapeHtml(generatedDateTime)}</div></div></div></div>${guidanceMarkup}${stepsMarkup}</body></html>`;
		const parsedDocument = new DOMParser().parseFromString(statementHtml, 'text/html');
		const printable = document.createElement('div');
		printable.style.backgroundColor = '#fdfcf7';
		printable.style.boxSizing = 'border-box';
		printable.style.padding = '24px';
		printable.style.position = 'fixed';
		printable.style.left = '-10000px';
		printable.style.top = '0';
		printable.style.width = '794px';
		printable.innerHTML = parsedDocument.body.innerHTML;
		const documentStyles = parsedDocument.head.querySelector('style');
		if (documentStyles) printable.prepend(documentStyles.cloneNode(true));
		document.body.appendChild(printable);

		await Promise.all([...printable.querySelectorAll('img')].map((image) => image.complete
			? Promise.resolve()
			: new Promise((resolve) => { image.onload = resolve; image.onerror = resolve; })));

		const canvas = await html2canvas(printable, { backgroundColor: '#fdfcf7', scale: 2, useCORS: true });
		const pdf = new jsPDF('p', 'mm', 'a4');
		const pageWidth = 210;
		const pageHeight = 297;
		const pageMargin = 6;
		const availableWidth = pageWidth - (pageMargin * 2);
		const availableHeight = pageHeight - (pageMargin * 2);
		const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
		const imageWidth = canvas.width * scale;
		const imageHeight = canvas.height * scale;
		const imageLeft = (pageWidth - imageWidth) / 2;
		const imageTop = (pageHeight - imageHeight) / 2;

		pdf.addImage(canvas.toDataURL('image/png'), 'PNG', imageLeft, imageTop, imageWidth, imageHeight);

		printable.remove();
		pdf.save(`statement-of-account-${appointment.id}.pdf`);
	};

	useEffect(() => {
		const closeOnEscape = (event) => {
			if (event.key === 'Escape') {
				setSelectedAppointment(null);
				setCertificateAppointment(null);
				setStatementAppointment(null);
			}
		};

		if (selectedAppointment || certificateAppointment || statementAppointment) {
			document.addEventListener('keydown', closeOnEscape);
		}

		return () => document.removeEventListener('keydown', closeOnEscape);
	}, [selectedAppointment, certificateAppointment, statementAppointment]);

	useEffect(() => {
		if (!requirementsUploaded) return undefined;

		const timeout = window.setTimeout(() => setRequirementsUploaded(false), 6000);

		return () => window.clearTimeout(timeout);
	}, [requirementsUploaded]);

	return (
		<ResidentsLayout
			user={auth.user}
			header={<h6>My registrations</h6>}
		>
			<Head title="My MENRO Registrations" />

			<div className="relative isolate min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-10">
				<img src="/images/opol-logo.png" alt="" aria-hidden="true" className="pointer-events-none fixed left-1/2 top-[56%] z-0 w-[min(70vw,560px)] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.16]" />
				<div className="relative z-10 mx-auto max-w-6xl">
					<div className="mb-6 overflow-hidden rounded-[24px] border border-blue-900/10 bg-[#173f6b] p-5 text-white shadow-[0_18px_40px_rgba(23,63,107,0.16)] sm:p-8">
							<p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-200">MENRO certification portal</p>
						<div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<h1 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">My registrations</h1>
								<p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">View your MENRO certification registrations and the members registered for each one.</p>
							</div>
						</div>
					</div>

					<div className="space-y-6">
						{appointments.map((appointment) => {
							const assignedStaff = appointment.assigned_staff;

							return (
							<section
								key={appointment.id}
								onClick={() => openMembers(appointment)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') openMembers(appointment);
								}}
								tabIndex="0"
								role="button"
								className="group cursor-pointer overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
							>
								<div className="flex flex-col gap-4 border-b border-slate-100 bg-[#f5f8fc] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Registration #{appointment.id}</span>
											<span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${appointment.appointment_type === 'school' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{formatType(appointment.appointment_type)}</span>
										</div>
										<h2 className="mt-2 text-xl font-black text-slate-900">{appointment.organization_name || (appointment.appointment_type === 'individual' ? 'Individual resident' : 'Couple registration')}</h2>
										<p className="mt-1 text-xs text-slate-500">{appointment.area?.location_name ?? appointment.area_name ?? 'No area selected'} · Submitted {formatDate(appointment.created_at)}</p>
										<div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
											<span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-blue-700">{appointment.service_category ?? 'Tree Planting'}</span>
											<span className="rounded-lg bg-slate-100 px-2.5 py-1.5">Schedule: {formatSchedule(appointment.scheduled_date)}</span>
										</div>
										<div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
											{assignedStaff?.profile_picture ? (
												<img src={assignedStaff.profile_picture} alt={`${assignedStaff.name} profile`} className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm" />
											) : (
												<div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white" aria-hidden="true">
													{(assignedStaff?.name || 'S').charAt(0).toUpperCase()}
												</div>
											)}
											<div className="min-w-0">
												<p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-700">Assigned staff</p>
												<p className="truncate text-sm font-bold text-slate-800">{assignedStaff?.name || 'Not assigned yet'}</p>
												{assignedStaff?.email && <p className="truncate text-xs text-slate-500">{assignedStaff.email}</p>}
											</div>
										</div>
												{appointment.notes && (
													<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
														<div className="flex items-start gap-3">
															<span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700" aria-hidden="true">
																<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M5 5.5A2.5 2.5 0 017.5 3h9A2.5 2.5 0 0119 5.5v9a2.5 2.5 0 01-2.5 2.5H12l-4.5 4v-4h0A2.5 2.5 0 015 14.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>
															</span>
															<div className="min-w-0">
																<p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-800">Notes</p>
																<p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">{appointment.notes}</p>
															</div>
														</div>
													</div>
												)}
									</div>
									<AppointmentTimeline status={appointment.status} />
								</div>


								<div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6">
									<div>
										<p className="text-sm font-bold text-slate-900">Representatives</p>
										<p className="mt-1 text-xs text-slate-500">{appointment.members?.length ?? 0} member{appointment.members?.length === 1 ? '' : 's'} submitted</p>
									</div>
									<div className="flex flex-wrap items-center justify-end gap-3">
										{appointment.certificate && (
											<button
												type="button"
												onClick={(event) => {
													event.stopPropagation();
												setCertificateAppointment(appointment);
											}}
												className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
											>
												<span aria-hidden="true">&#128196;</span> View certificate
											</button>
										)}
										{canViewStatement(appointment.status) && (
											<button
												type="button"
												onClick={(event) => {
													event.stopPropagation();
													setStatementAppointment(appointment);
												}}
													className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
											>
												<span aria-hidden="true">&#128196;</span> Statement of account
											</button>
										)}
										<span className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 transition group-hover:translate-x-0.5">
											View details <span aria-hidden="true">&#8594;</span>
										</span>
									</div>
								</div>
							</section>
							);
						})}
					</div>

					{selectedAppointment && (
						<div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={() => setSelectedAppointment(null)}>
							<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]" role="dialog" aria-modal="true" aria-labelledby="members-modal-title" onMouseDown={(event) => event.stopPropagation()}>
								<div className="flex items-start justify-between gap-4 border-b border-blue-900/20 bg-[#173f6b] p-5 text-white sm:p-6">
									<div>
										<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200">Registration #{selectedAppointment.id}</p>
										<h2 id="members-modal-title" className="mt-2 text-xl font-black sm:text-2xl">Representatives</h2>
										<p className="mt-1 text-xs text-blue-100">{selectedAppointment.service_category ?? 'Tree Planting'} · {selectedAppointment.members?.length ?? 0} member{selectedAppointment.members?.length === 1 ? '' : 's'}</p>
									</div>
									<button type="button" onClick={() => setSelectedAppointment(null)} className="rounded-lg border border-white/25 px-3 py-2 text-xl leading-none text-white transition hover:bg-white/10" aria-label="Close members dialog">&times;</button>
								</div>
								<div className="max-h-[calc(90vh-110px)] overflow-y-auto p-4 sm:p-6">
									{needsRequirementsAction(selectedAppointment.status) && (
										<div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
											<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
												<div>
													<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Action required</p>
													<h3 className="mt-1 text-base font-bold text-slate-900">Upload service requirements</h3>
													<p className="mt-1 text-xs leading-5 text-slate-600">Upload one file for each document required for {selectedAppointment.service_category}.</p>
												</div>
												<span className="w-fit rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-800">On process</span>
											</div>
											{selectedAppointment.requirements?.images?.length ? (
												<p className="mt-4 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-blue-700">Requirements already uploaded.</p>
											) : (
												<div className="mt-4 space-y-3 [&>div.border-rose-200]:hidden">
																<div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
																	Requirements were removed. Please upload the required documents again.
																</div>															<div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
																Requirements were removed. Please upload the required documents again.
															</div>													{(requiredDocuments[selectedAppointment.service_category] ?? []).map((documentName) => (
														<label key={documentName} className="block rounded-xl border border-amber-100 bg-white p-3">
															<span className="mb-2 block text-xs font-semibold text-slate-700">{documentName}</span>
															<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => handleRequirementChange(documentName, event.target.files[0])} className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200" />
															{requirementFiles[documentName] && <span className="mt-2 block text-[11px] font-semibold text-blue-700">Ready: {requirementFiles[documentName].name}</span>}
														</label>
													))}
															<button type="button" disabled={uploadingRequirements || (requiredDocuments[selectedAppointment.service_category] ?? []).some((name) => !requirementFiles[name])} onClick={uploadRequirements} className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40">{uploadingRequirements ? 'Uploading requirements...' : 'Upload requirements'}</button>
												</div>
											)}
										</div>
									)}
									<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<label className="relative flex-1">
											<span className="sr-only">Search members</span>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
												<circle cx="11" cy="11" r="8" />
												<path d="m21 21-4.35-4.35" strokeLinecap="round" />
											</svg>
											<input value={memberSearch} onChange={(event) => { setMemberSearch(event.target.value); setMemberPage(1); }} placeholder="Search by name, phone, email, or address" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
										</label>
										<span className="text-xs font-semibold text-slate-500">{selectedAppointment.members?.length ?? 0} total</span>
									</div>
									{(() => {
										const search = memberSearch.toLowerCase();
										const filteredMembers = (selectedAppointment.members ?? []).filter((member) => {
											const memberName = [member.first_name, member.middle_name, member.last_name, member.suffix].filter(Boolean).join(' ');
											return [memberName, member.role, member.phone_number, member.email, member.address].some((value) => String(value ?? '').toLowerCase().includes(search));
										});
										const pageCount = Math.ceil(filteredMembers.length / membersPerPage);
										const visibleMembers = filteredMembers.slice((memberPage - 1) * membersPerPage, memberPage * membersPerPage);

										return filteredMembers.length ? (
										<div className="space-y-3">
											{visibleMembers.map((member) => (
												<div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
													<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
														<div>
															<p className="font-bold text-slate-900">{[member.first_name, member.middle_name, member.last_name, member.suffix].filter(Boolean).join(' ')}</p>
															<p className="mt-1 text-xs capitalize text-blue-700">{member.role}</p>
														</div>
														<div className="grid gap-2 text-xs text-slate-600 sm:min-w-[260px]">
															<p><span className="font-semibold text-slate-800">Phone:</span> {member.phone_number || 'Not provided'}</p>
															<p><span className="font-semibold text-slate-800">Email:</span> {member.email || 'Not provided'}</p>
															<p><span className="font-semibold text-slate-800">Address:</span> {member.address || 'Not provided'}</p>
														</div>
													</div>
												</div>
											))}
											{pageCount > 1 && <div className="flex items-center justify-between border-t border-slate-200 pt-4"><button type="button" disabled={memberPage === 1} onClick={() => setMemberPage((page) => page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="text-xs font-semibold text-slate-500">Page {memberPage} of {pageCount}</span><button type="button" disabled={memberPage === pageCount} onClick={() => setMemberPage((page) => page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Next</button></div>}
										</div>
										) : <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">{memberSearch ? 'No members match your search.' : 'No members have submitted their details yet.'}</p>;
									})()}
								</div>
							</div>
						</div>
					)}

					{requirementsUploaded && (
						<div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
							<div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.2)]" role="alertdialog" aria-modal="true" aria-labelledby="requirements-upload-success-title">
								<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-7 w-7"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
								</div>
								<h2 id="requirements-upload-success-title" className="mt-4 text-lg font-black text-slate-900">Successfully uploaded</h2>
								<p className="mt-2 text-sm leading-6 text-slate-500">Your requirements were uploaded successfully.</p>
								<button type="button" onClick={() => setRequirementsUploaded(false)} className="mt-5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-emerald-500">Close</button>
							</div>
						</div>
					)}

					{certificateAppointment && (
						<div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-3 sm:p-5" onMouseDown={() => setCertificateAppointment(null)}>
							<div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-600 bg-[#101827] shadow-[0_24px_70px_rgba(2,8,23,0.45)]" role="dialog" aria-modal="true" aria-labelledby="resident-certificate-title" onMouseDown={(event) => event.stopPropagation()}>
								<div className="relative flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 text-white sm:px-7">
									<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
									<div className="flex min-w-0 items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300 ring-1 ring-blue-300/20">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 3.5V8h4M8 12h8M8 15.5h6" strokeLinecap="round" strokeLinejoin="round" /></svg>
										</div>
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300">Official certificate</p>
												<span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-emerald-300">PDF document</span>
											</div>
											<h2 id="resident-certificate-title" className="mt-1 truncate text-sm font-bold text-white sm:text-base">{certificateAppointment.certificate.original_name}</h2>
											<p className="mt-1 text-[10px] text-slate-400">Registration #{certificateAppointment.id} · Ready for viewing</p>
										</div>
									</div>
									<button type="button" onClick={() => setCertificateAppointment(null)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 text-xl leading-none text-slate-300 transition hover:border-white/30 hover:bg-white/10 hover:text-white" aria-label="Close certificate viewer">&times;</button>
								</div>
								<div className="flex min-h-[360px] items-center justify-center overflow-auto bg-[#0b1220] p-3 sm:p-6">
									<div className="w-full overflow-hidden rounded-xl border border-slate-700/70 bg-slate-800 p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.3)] sm:p-2">
										<iframe src={route('appointments.certificate.view', certificateAppointment.id)} title={certificateAppointment.certificate.original_name} className="h-[72vh] min-h-[500px] w-full rounded-lg bg-white" />
									</div>
								</div>
								<div className="flex flex-col gap-3 border-t border-white/10 bg-[#101827] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
									<div className="flex items-center gap-2 text-[10px] text-slate-400">
										<span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-cyan-300">⌕</span>
										<span>Use the built-in PDF controls to zoom, print, or inspect the document.</span>
									</div>
									<div className="flex items-center gap-2">
										<a href={route('appointments.certificate.view', certificateAppointment.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-200 transition hover:border-white/30 hover:bg-white/10"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M14 5h5v5M19 5l-8 8" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" strokeLinecap="round" strokeLinejoin="round" /></svg> Open full screen</a>
										<a href={route('appointments.certificate.view', certificateAppointment.id)} download={certificateAppointment.certificate.original_name} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M12 4v11M7 11l5 5 5-5M5 20h14" strokeLinecap="round" strokeLinejoin="round" /></svg> Download PDF</a>
									</div>
								</div>
							</div>
						</div>
					)}

					{statementAppointment && (
						<div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={() => setStatementAppointment(null)}>
							<div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-slate-300 bg-[#fdfcf7] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="statement-title" onMouseDown={(event) => event.stopPropagation()}>
								<div className="relative border-2 border-dashed border-slate-500">
									<span className="absolute -top-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 bg-[#fdfcf7] px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true"><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="m8 7 12 5-12 5M8 7l6 5M8 17l6-5" strokeLinecap="round" strokeLinejoin="round" /></svg>Cut here</span>
								<div className="border-b-2 border-slate-700 px-4 pb-3 pt-3 text-center sm:px-8">
									<div className="flex items-center justify-center gap-3 text-[7px] font-bold text-slate-600 sm:gap-5 sm:text-[9px]">
										<img src="/images/opol-logo.png" alt="Municipality of Opol seal" className="h-9 w-9 object-contain sm:h-11 sm:w-11" />
										<div className="leading-tight uppercase tracking-[0.08em]">Republic of the Philippines<br />Province of Misamis Oriental<br />Municipality of Opol</div>
										<img src="/images/logo.png" alt="MENRO logo" className="h-9 w-9 object-contain sm:h-11 sm:w-11" />
									</div>
									<h2 className="mt-1 text-[9px] font-black uppercase tracking-[0.04em] text-slate-800 sm:text-xs">Municipal Environmental and Natural Resources Office</h2>
								</div>
								<div className="flex items-center justify-between border-b border-slate-300 px-4 py-2 sm:px-8">
									<p className="text-[11px] font-semibold text-slate-700 sm:text-xs">For the account of: <span className="ml-2 inline-block min-w-[150px] border-b border-slate-500 pb-1 font-bold text-slate-900">{auth.user?.name || 'Resident'}</span></p>
									<button type="button" onClick={() => setStatementAppointment(null)} className="rounded-lg border border-slate-300 px-2 py-1 text-lg leading-none text-slate-500 hover:bg-slate-100" aria-label="Close statement of account">&times;</button>
								</div>
								<div className="px-4 py-3 sm:px-8 sm:py-4">
									<div className="p-0 sm:p-2">
										<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
											<h3 id="statement-title" className="text-center text-base font-black uppercase text-slate-800 sm:text-left sm:text-lg">Statement of Account</h3>
											<button type="button" onClick={() => downloadStatement(statementAppointment)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-blue-600"><span aria-hidden="true">&#8595;</span> Download statement</button>
										</div>
										<div className="mt-3 overflow-hidden border border-slate-500">
										<div className="grid grid-cols-[1fr_110px] border-b border-slate-500 bg-slate-100 text-xs font-black uppercase text-slate-700 sm:grid-cols-[1fr_140px]">
											<div className="border-r border-slate-500 px-3 py-2">Description</div>
											<div className="px-3 py-2 text-center">Amount</div>
										</div>
										<div className="grid min-h-[58px] grid-cols-[1fr_110px] border-b border-slate-500 text-xs font-semibold text-slate-700 sm:grid-cols-[1fr_140px] sm:text-sm">
											<div className="border-r border-slate-500 px-3 py-4 uppercase">CERT. FOR {statementAppointment.service_category || 'TREE PLANTING'}</div>
											<div className="px-3 py-4 text-center">130.00</div>
										</div>
										<div className="grid grid-cols-[1fr_110px] text-xs font-black text-slate-700 sm:grid-cols-[1fr_140px] sm:text-sm">
											<div className="border-r border-slate-500 px-3 py-3 text-right uppercase">Total</div>
											<div className="px-3 py-3 text-center">130.00</div>
										</div>
									</div>
										<div className="mt-8 grid items-start gap-8 text-xs font-semibold uppercase text-slate-700 sm:grid-cols-2 sm:gap-16 sm:text-sm">
												
											
									</div>
									</div>
								</div>
							</div>
							<div className="px-6 py-5 sm:px-12 sm:py-7">
									{environmentalGuidance[statementAppointment.service_category] && (
										<div className="mt-8 border-t-2 border-blue-700 pt-5">
											<div className="mb-4 flex items-center gap-3">
												<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg">&#127793;</span>
												<div>
													<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">MENRO environmental guidance</p>
													<h4 className="mt-1 text-base font-black uppercase text-slate-800">{statementAppointment.service_category} reminders</h4>
												</div>
											</div>
											<div className="grid gap-4 md:grid-cols-2">
												{[
													{ title: `${statementAppointment.service_category} — DOs`, items: environmentalGuidance[statementAppointment.service_category].dos, tone: 'blue' },
													{ title: `${statementAppointment.service_category} — DON'Ts`, items: environmentalGuidance[statementAppointment.service_category].donts, tone: 'rose' },
												].map((panel) => (
															<div key={panel.title} className={`rounded-2xl border p-4 ${panel.tone === 'blue' ? 'border-blue-200 bg-blue-50/70' : 'border-rose-200 bg-rose-50/70'}`}>
																<h5 className={`text-xs font-black uppercase tracking-[0.08em] ${panel.tone === 'blue' ? 'text-blue-800' : 'text-rose-800'}`}>{panel.title}</h5>
																<ul className="mt-3 list-disc space-y-2 pl-5 text-[11px] leading-5 text-slate-700 marker:text-slate-500">
																	{panel.items.map((item) => <li key={item}>{item}</li>)}
														</ul>
													</div>
												))}
											</div>
											<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[11px] leading-5 text-slate-700">
												<p className="font-black uppercase tracking-[0.08em] text-amber-800">Legal / ordinance disclaimer</p>
												<p className="mt-2">These reminders are provided for general guidance only. Actual permit requirements, restrictions, fees, penalties, and procedures shall be based on the applicable municipal ordinances and national environmental laws and regulations. Please coordinate with the Municipal Environment and Natural Resources Office (MENRO) for official guidance.</p>
											</div>
									</div>
								)}
									<div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
										<p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-800">How to complete your payment</p>
												<div className="mt-3 grid gap-3 sm:grid-cols-2">
											{[
												'Download the Statement of Account.',
												'Cut the Statement of Account along the dashed line.',
												'Go to the Treasury Office and pay there.',
												'Go back to the site, open My Registrations, select the ongoing registration, and upload the OR.',
													].map((step, index) => (
														<div key={step} className="flex gap-3 rounded-xl border border-sky-100 bg-white/80 p-3 text-xs leading-5 text-slate-700">
																<span className="mt-1 shrink-0 font-bold text-sky-700">Step {index + 1}:</span>
																<span>{step}</span>
														</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{!appointments.length && <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><p className="text-lg font-bold text-slate-800">No registrations yet</p><p className="mt-2 text-sm text-slate-500">Your MENRO certification registrations will appear here.</p><Link href={route('residents.appointments')} className="mt-5 inline-flex rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-blue-600">Start registration</Link></div>}
				</div>
			</div>
		</ResidentsLayout>
	);
}
