import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const formatStatus = (status) => String(status || 'pending').replace(/[_-]/g, ' ');

export default function StatementOfAccounts({ auth, appointments = [] }) {
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('all');
	const [updatingId, setUpdatingId] = useState(null);
	const [openActionId, setOpenActionId] = useState(null);

	const updateAppointmentStatus = (appointmentId, action) => {
		setUpdatingId(appointmentId);
		router.patch(route(`treasury.appointments.${action}`, appointmentId), {}, {
			preserveScroll: true,
			onFinish: () => setUpdatingId(null),
		});
	};

	const filteredAppointments = useMemo(() => {
		const query = search.trim().toLowerCase();

		return appointments.filter((appointment) => {
			const appointmentStatus = String(appointment.status || 'pending').toLowerCase();
			const matchesStatus = status === 'all'
				? !['confirmed', 'approved'].includes(appointmentStatus)
				: appointmentStatus === status;
			const searchableText = [
				appointment.id,
				appointment.user?.name,
				appointment.user?.email,
				appointment.service_category,
				appointment.appointment_type,
				appointment.area?.location_name,
				appointment.area_name,
			].filter(Boolean).join(' ').toLowerCase();

			return matchesStatus && (!query || searchableText.includes(query));
		});
	}, [appointments, search, status]);

	return (
		<AuthenticatedLayout user={auth.user} hideSidebar hideNotifications header={<h2 className="text-lg font-bold text-slate-800">Statement of Accounts</h2>}>
			<Head title="Statement of Accounts" />

				<img src="/images/opol-logo.png" alt="" aria-hidden="true" className="pointer-events-none fixed left-1/2 top-24 z-0 h-[30rem] w-[30rem] -translate-x-1/2 object-contain opacity-[0.11]" />
				<div className="relative z-10 mx-auto max-w-7xl">
					<header className="relative mb-7 overflow-hidden border border-[#0b2348] bg-[#0b2348] text-center text-white shadow-[0_16px_35px_rgba(11,35,72,0.16)]">
						<div className="relative z-10 flex flex-col items-center px-6 py-4">
							<img src="/images/opol-logo.png" alt="Municipality of Opol seal" className="h-16 w-16 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.25)]" />
							<p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-200">Municipality of Opol</p>
							<p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-white/80">Misamis Oriental</p>
							<div className="mx-auto mt-2 h-px w-16 bg-[#c8a951]" />
							<h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">Statement of Accounts</h1>
							<p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">Treasury Office</p>
						</div>
					</header>

					<section>
						<div className="flex flex-col gap-4 border-y border-slate-300 py-5 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b477f]">Treasury records</p>
								<h2 className="mt-1 text-lg font-bold text-[#12233f]">Appointments for review</h2>
								<p className="mt-1 text-xs text-slate-500">{filteredAppointments.length} record{filteredAppointments.length === 1 ? '' : 's'} shown</p>
							</div>
							<div className="flex flex-col gap-2 sm:flex-row">
								<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" className="border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0b477f] focus:ring-2 focus:ring-blue-100" />
								<select value={status} onChange={(event) => setStatus(event.target.value)} className="border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0b477f] focus:ring-2 focus:ring-blue-100">
									<option value="all">All statuses</option>
									{[...new Set(appointments.map((appointment) => String(appointment.status || 'pending').toLowerCase()))].map((appointmentStatus) => <option key={appointmentStatus} value={appointmentStatus}>{formatStatus(appointmentStatus)}</option>)}
								</select>
							</div>
						</div>

						{filteredAppointments.length ? (
							<div className="mt-5 overflow-x-auto border-b border-slate-300 bg-white">
								<table className="w-full min-w-[850px] divide-y divide-slate-200 text-left">
									<thead className="bg-[#102d55]">
										<tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/90">
											<th className="px-5 py-3">Appointment</th>
											<th className="px-5 py-3">Resident</th>
											<th className="px-5 py-3">Service</th>
											<th className="px-5 py-3 text-right">Payment</th>
											<th className="px-5 py-3">Status</th>
											<th className="px-5 py-3 text-right">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100 text-sm">
										{filteredAppointments.map((appointment) => (
													<tr key={appointment.id} className="transition hover:bg-[#f3f7fc]">
														<td className="px-5 py-4 font-bold text-[#12233f]">#{appointment.id}</td>
														<td className="px-5 py-4"><p className="font-semibold text-[#1b2c46]">{appointment.user?.name || 'Unknown resident'}</p><p className="mt-1 text-xs text-slate-500">{appointment.user?.email || 'No email'}</p></td>
														<td className="px-5 py-4 text-xs text-slate-600">{appointment.service_category || appointment.appointment_type || 'Service request'}</td>
														<td className="px-5 py-4 text-right font-bold text-[#12233f]">₱130.00</td>
														<td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 border border-[#b7d0e7] bg-[#edf5fc] px-2.5 py-1 text-[10px] font-bold capitalize text-[#0b477f]"><span className="h-1.5 w-1.5 rounded-full bg-[#c8a951]" />{formatStatus(appointment.status)}</span></td>
													<td className="px-5 py-4 text-right"><div className="relative flex justify-end gap-1.5"><button type="button" onClick={() => updateAppointmentStatus(appointment.id, 'confirm')} disabled={updatingId === appointment.id} aria-label={`Confirm appointment ${appointment.id}`} title="Confirm appointment" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-transparent text-emerald-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="h-4 w-4"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg></button><button type="button" onClick={() => setOpenActionId(openActionId === appointment.id ? null : appointment.id)} aria-expanded={openActionId === appointment.id} aria-label={`Open actions for appointment ${appointment.id}`} title="More actions" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg></button>{openActionId === appointment.id && <div className="absolute right-0 top-11 z-20 w-44 border border-slate-200 bg-white p-1 text-left shadow-lg"><button type="button" onClick={() => { updateAppointmentStatus(appointment.id, 'reject'); setOpenActionId(null); }} disabled={updatingId === appointment.id} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /></svg>Reject appointment</button></div>}</div></td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : <p className="px-5 py-12 text-center text-sm text-slate-500">No appointments match the selected filters.</p>}
					</section>
				</div>
			
		</AuthenticatedLayout>
	);
}
