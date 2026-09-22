import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { DonutChart, LineChart } from '@/Components/AdminCharts';

const number = (value) => new Intl.NumberFormat('en-US').format(value ?? 0);

export default function Dashboard({ auth, analytics }) {
    const summary = analytics?.summary ?? {};
    const statusItems = Object.entries(analytics?.status_counts ?? {}).map(([label, value]) => ({ label: label.replace(/[_-]/g, ' '), value }));
    const recentAppointments = analytics?.recent_appointments ?? [];
    const cards = [
        ['Total appointments', summary.appointments, 'All submitted requests', 'bg-blue-50 text-blue-700'],
        ['Needs attention', summary.pending, 'Pending or on process', 'bg-amber-50 text-amber-700'],
        ['Completed', summary.completed, 'Finished field work', 'bg-sky-50 text-sky-700'],
        ['Residents served', summary.residents, 'Unique requesters', 'bg-slate-100 text-slate-700'],
    ];
    return (
        <AuthenticatedLayout user={auth.user} header={<h6>Dashboard</h6>}>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-2xl bg-blue-950 px-5 py-6 text-white shadow-sm sm:px-7 sm:py-8">
                    <div className="relative z-10 max-w-2xl">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-200">MENRO administration</p>
                        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">System overview</h1>
                        <p className="mt-2 text-sm leading-6 text-blue-100">A current view of service requests, field activity, residents, and inventory.</p>
                    </div>
                    <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border-[24px] border-blue-800/50" />
                </section>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map(([label, value, detail, tone]) => (
                        <div key={label} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                            <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${tone}`}>{label}</span>
                            <p className="mt-5 text-3xl font-black text-blue-950">{number(value)}</p>
                            <p className="mt-1 text-xs text-slate-500">{detail}</p>
                        </div>
                    ))}
                </section>
                <section className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
                    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
                        <div className="mb-5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Activity trend</p>
                            <h2 className="mt-1 text-lg font-bold text-slate-800">Appointments by month</h2>
                        </div>
                        <LineChart data={analytics?.months ?? []} />
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
                        <div className="mb-5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Current distribution</p>
                            <h2 className="mt-1 text-lg font-bold text-slate-800">Requests by status</h2>
                        </div>
                        <DonutChart items={statusItems} />
                    </div>
                </section>
                <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Latest activity</p>
                                <h2 className="mt-1 text-lg font-bold text-slate-800">Recent requests</h2>
                            </div>
                            <Link href={route('reports')} className="text-xs font-bold text-blue-700 hover:text-blue-900">View reports</Link>
                        </div>
                        <div className="mt-5 space-y-2">
                            {recentAppointments.slice(0, 5).map((appointment) => (
                                <div key={appointment.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800">{appointment.service}</p>
                                        <p className="mt-1 truncate text-xs text-slate-500">{appointment.location} · {appointment.requester}</p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold capitalize text-blue-700">{appointment.status}</span>
                                </div>
                            ))}
                            {!recentAppointments.length && <p className="py-8 text-center text-sm text-slate-500">No appointments recorded yet.</p>}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Resources</p>
                        <h2 className="mt-1 text-lg font-bold text-slate-800">Operational snapshot</h2>
                        <dl className="mt-5 grid grid-cols-2 gap-3">
                            {[['Registered members', summary.members], ['Requirements filed', summary.requirements], ['Pending inventory', summary.inventory_pending], ['Planted trees', summary.planted_trees], ['Seedlings available', summary.seedlings]].map(([label, value]) => (
                                <div key={label} className="rounded-xl bg-blue-50/60 p-4">
                                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                                    <dd className="mt-2 text-xl font-black text-blue-950">{number(value)}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
