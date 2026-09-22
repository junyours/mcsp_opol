import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ColumnChart, DonutChart } from '@/Components/AdminCharts';

const isCompleted = (status) => ['completed', 'approved', 'done'].includes(String(status ?? '').toLowerCase());
const formatSchedule = (appointment) => {
	if (!appointment.scheduled_date) return 'Staff scheduling';

	const date = new Date(`${appointment.scheduled_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	return appointment.scheduled_time ? `${date} at ${appointment.scheduled_time.slice(0, 5)}` : date;
};

export default function StaffDashboard({ auth, appointments = [] }) {
	const normalizedAppointments = appointments.map((appointment) => ({ ...appointment, normalizedStatus: String(appointment.status ?? 'pending').toLowerCase() }));
	const pendingCount = normalizedAppointments.filter(({ normalizedStatus }) => ['pending', 'onprocess', 'on process', 'inprocess', 'in process'].includes(normalizedStatus)).length;
	const completedCount = normalizedAppointments.filter(({ normalizedStatus }) => ['completed', 'done'].includes(normalizedStatus)).length;
	const serviceItems = Object.entries(normalizedAppointments.reduce((counts, appointment) => {
		const service = appointment.service_category || 'Other';
		counts[service] = (counts[service] || 0) + 1;
		return counts;
	}, {})).map(([label, value]) => ({ label, value }));
	const statusItems = Object.entries(normalizedAppointments.reduce((counts, appointment) => {
		const status = appointment.normalizedStatus.replace(/[_-]/g, ' ');
		counts[status] = (counts[status] || 0) + 1;
		return counts;
	}, {})).map(([label, value]) => ({ label, value }));
	const summaryCards = [
		{
			label: 'Assigned requests',
			value: String(appointments.length).padStart(2, '0'),
			detail: 'Requests assigned to you',
			tone: 'bg-blue-50 text-blue-700',
		},
		{
			label: "Today's schedule",
			value: String(appointments.filter(({ scheduled_date }) => scheduled_date === new Date().toISOString().split('T')[0]).length).padStart(2, '0'),
			detail: 'Appointments planned',
			tone: 'bg-sky-50 text-sky-700',
		},
		{
			label: 'Completed requests',
			value: String(completedCount).padStart(2, '0'),
			detail: 'Assigned work completed',
			tone: 'bg-amber-50 text-amber-700',
		},
		{
			label: 'Needs attention',
			value: String(pendingCount).padStart(2, '0'),
			detail: 'Requests still in progress',
			tone: 'bg-rose-50 text-rose-700',
		},
	];

	return (
		<AuthenticatedLayout
			user={auth.user}
				header={<h6>Dashboard</h6>}
		>
			<Head title="Staff dashboard" />

			<div className="space-y-6">
				<section className="relative overflow-hidden rounded-2xl bg-blue-950 px-5 py-6 text-white shadow-sm sm:px-7 sm:py-8">
					<div className="relative z-10 max-w-xl">
						<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-200">MENRO operations</p>
						<h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Good day, {auth.user.name}.</h1>
						<p className="mt-2 max-w-lg text-sm leading-6 text-blue-100">
							Keep today&apos;s environmental service requests moving and your field schedule on track.
						</p>
					</div>
					<div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border-[24px] border-blue-800/50" />
					<div className="absolute -bottom-24 right-24 h-44 w-44 rounded-full border-[18px] border-blue-900/70" />
				</section>

				<section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-4">
							<img src={(() => {
								const rawValue =
									auth.user?.profile_picture?.image_url ||
									auth.user?.profile_picture?.image ||
									auth.user?.profile_picture?.image_path ||
									auth.user?.profilePicture?.image_url ||
									auth.user?.profilePicture?.image ||
									auth.user?.profilePicture?.image_path ||
									auth.user?.profile_picture_path ||
									auth.user?.image_path ||
									'/images/profile.jpg';

								if (rawValue.startsWith('http://') || rawValue.startsWith('https://') || rawValue.startsWith('/storage/')) {
									return rawValue;
								}

								if (rawValue.startsWith('/')) {
									return `/storage${rawValue}`;
								}

								return `/storage/${rawValue.replace(/^\/+/, '')}`;
							})()} alt="Staff profile" className="h-14 w-14 rounded-full border border-blue-200 object-cover" />
							<div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Signed-in account</p><h2 className="mt-1 text-xl font-bold text-slate-800">{auth.user.name}</h2><p className="mt-1 text-sm text-slate-500">{auth.user.email}</p></div>
						</div>
						<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 sm:text-right"><p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Account role</p><p className="mt-1 text-sm font-bold capitalize text-blue-950">{auth.user.role || 'Staff'}</p></div>
					</div>
				</section>

				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{summaryCards.map((card) => (
						<div key={card.label} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
							<div className="flex items-start justify-between gap-3">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
								<span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${card.tone}`}>LIVE</span>
							</div>
							<p className="mt-5 text-3xl font-black tracking-tight text-slate-800">{card.value}</p>
							<p className="mt-1 text-xs text-slate-500">{card.detail}</p>
						</div>
					))}
				</section>

				<section className="grid gap-5 xl:grid-cols-2">
					<div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Your workload</p><h2 className="mt-1 text-lg font-bold text-slate-800">Requests by service</h2><div className="mt-5 rounded-xl border border-blue-50 bg-slate-50/60 p-4"><ColumnChart items={serviceItems} /></div></div>
					<div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Your workflow</p><h2 className="mt-1 text-lg font-bold text-slate-800">Assignment status</h2><div className="mt-5"><DonutChart items={statusItems} /></div></div>
				</section>

				<section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
					<div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Work queue</p>
								<h2 className="mt-1 text-lg font-bold text-slate-800">Priority for today</h2>
							</div>
							<span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">3 urgent</span>
						</div>
						<div className="mt-5 space-y-3">
							{appointments.slice(0, 5).map((appointment) => (
								<div key={appointment.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
									<div className="min-w-0">
										<p className="truncate text-sm font-semibold text-slate-800">{appointment.service_category || 'Environmental request'}</p>
										<p className="mt-1 truncate text-xs font-semibold text-slate-700">{appointment.user?.name || appointment.organization_name || 'Resident request'}</p>
										<p className="mt-1 truncate text-xs text-slate-500">{appointment.area?.location_name || appointment.area_name || appointment.members?.[0]?.address || 'No address provided'}</p>
									</div>
									<span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{formatSchedule(appointment)}</span>
								</div>
							))}
							{appointments.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">No requests have been assigned to you yet.</p>}
						</div>
					</div>

					<div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
							<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Quick access</p>
						<h2 className="mt-1 text-lg font-bold text-slate-800">Start a task</h2>
						<div className="mt-5 space-y-3">
							<Link href={route('profile.edit')} className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100">
								<span>Review your profile</span><span aria-hidden="true">-&gt;</span>
							</Link>
							<div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm font-semibold text-blue-800">
								<span>View assigned requests</span><span className="text-[10px] uppercase tracking-wide">{appointments.length} assigned</span>
							</div>
							<div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm font-semibold text-slate-400">
								<span>Open field schedule</span><span className="text-[10px] uppercase tracking-wide">Coming soon</span>
							</div>
						</div>
					</div>
				</section>
			</div>
		</AuthenticatedLayout>
	);
}
