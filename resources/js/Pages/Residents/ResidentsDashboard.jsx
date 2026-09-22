import ResidentsLayout from '@/Layouts/ResidentsLayout';
import { Head, Link } from '@inertiajs/react';

export default function ResidentsDashboard({ auth }) {
    const quickActions = [
        {
            title: 'Register for certification',
            description: 'Submit your MENRO certification Application and service request.',
            href: route('residents.appointments'),
            tone: 'bg-blue-700 text-white hover:bg-blue-800',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <rect x="4" y="5" width="16" height="15" rx="2" />
                    <path d="M8 3v4M16 3v4M4 9h16M8 13h3M8 16h6" strokeLinecap="round" />
                </svg>
            ),
        },
        {
            title: 'View my Applications',
            description: 'Check certification status, schedules, and registered representatives.',
            href: route('residents.my-appointments'),
            tone: 'border border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50/40',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path d="M5 5.5h14v13H5zM8 3.5v4M16 3.5v4M5 9h14" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="m9 14 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
    ];

    const processSteps = [
        ['01', 'Submit your Application', 'Complete the certification Application form with your service and area.'],
        ['02', 'Wait for confirmation', 'MENRO staff will review your Application and coordinate the schedule.'],
        ['03', 'Prepare requirements', 'Check your Application details for documents and next steps.'],
    ];

    const paymentSteps = [
        ['01', 'Download the statement', 'Open My Applications and download the Statement of Account for your certification.'],
        ['02', 'Cut along the cutting line', 'Cut the Statement of Account along the dashed cutting area.'],
        ['03', 'Pay at the Treasury Office', 'Bring the cut statement to the Treasury Office and complete your payment.'],
        ['04', 'Submit your requirements', 'Return to My Applications and upload the required documents and official receipt.'],
    ];

    return (
        <ResidentsLayout
            user={auth.user}
            header={<h6>Dashboard</h6>}
        >
            <Head title="Dashboard" />

            <div className="relative overflow-hidden px-1 py-5 sm:px-2 sm:py-8">
                <div className="pointer-events-none absolute right-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
                <div className="relative mx-auto max-w-6xl space-y-6 sm:space-y-8">
                    <section className="overflow-hidden rounded-2xl bg-[#173f6b] text-white shadow-[0_16px_35px_rgba(23,63,107,0.16)]">
                        <div className="grid gap-6 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1fr_220px] lg:items-center">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200">Resident portal</p>
                                <h1 className="mt-3 max-w-xl text-2xl font-black leading-tight tracking-[-0.03em] sm:text-4xl">
                                    Welcome back, {auth.user?.name || 'Resident'}.
                                </h1>
                                <p className="mt-3 max-w-lg text-sm leading-6 text-blue-100">
                                    Manage your MENRO certification Applications and help keep Opol green, safe, and healthy.
                                </p>
                                <Link href={route('residents.appointments')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-blue-900 shadow-sm transition hover:bg-blue-50">
                                    Start a Application
                                    <span aria-hidden="true">&rarr;</span>
                                </Link>
                            </div>
                            <div className="hidden justify-center lg:flex">
                                <div className="flex h-40 w-40 items-center justify-center rounded-full border border-white/20 bg-white/10 p-5">
                                    <img src="/images/opol-logo.png" alt="Municipality of Opol" className="h-full w-full object-contain" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="mb-3 flex items-end justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Quick access</p>
                                <h2 className="mt-1 text-lg font-black text-slate-900 sm:text-xl">What would you like to do?</h2>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {quickActions.map((action) => (
                                <Link key={action.title} href={action.href} className={`group flex min-h-32 flex-col justify-between rounded-2xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${action.tone}`}>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">{action.icon}</span>
                                    <span className="mt-5">
                                        <span className="block text-sm font-black">{action.title}</span>
                                        <span className={`mt-1 block max-w-sm text-xs leading-5 ${action.title === 'Register for certification' ? 'text-blue-100' : 'text-slate-500'}`}>{action.description}</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Your process</p>
                                <h2 className="mt-1 text-lg font-black text-slate-900 sm:text-xl">From Application to certification</h2>
                            </div>
                            <Link href={route('residents.my-appointments')} className="text-xs font-bold text-blue-700 hover:text-blue-900">Track my requests &rarr;</Link>
                        </div>
                        <div className="mt-6 grid gap-5 md:grid-cols-3 md:gap-6">
                            {processSteps.map(([number, title, description], index) => (
                                <div key={number} className="relative border-l-2 border-blue-100 pl-4 md:border-l-0 md:border-t-2 md:pl-0 md:pt-4">
                                    <span className="text-xs font-black tracking-[0.12em] text-blue-700">{number}</span>
                                    <h3 className="mt-2 text-sm font-bold text-slate-900">{title}</h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                                    {index < processSteps.length - 1 && <span className="absolute -bottom-5 left-[-2px] h-5 border-l-2 border-dashed border-blue-100 md:bottom-auto md:left-auto md:right-[-1.5rem] md:top-[-2px] md:h-0 md:w-6 md:border-l-0 md:border-t-2" />}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5 shadow-sm sm:p-7">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">Payment and requirements</p>
                                <h2 className="mt-1 text-lg font-black text-slate-900 sm:text-xl">When your Application is on process</h2>
                            </div>
                            <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-800 shadow-sm">On process · Confirmed · Completed</span>
                        </div>
                        <p className="mt-3 max-w-3xl text-xs leading-5 text-slate-600">Follow these steps for Applications marked On process, Confirmed, or Completed. After payment, you may submit the required service documents and official receipt through My Applications.</p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {paymentSteps.map(([number, title, description]) => (
                                <div key={number} className="rounded-xl border border-sky-100 bg-white p-4">
                                    <span className="text-xs font-black tracking-[0.12em] text-sky-700">{number}</span>
                                    <h3 className="mt-2 text-sm font-bold text-slate-900">{title}</h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                                </div>
                            ))}
                        </div>
                        <Link href={route('residents.my-appointments')} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-sky-800 hover:text-sky-950">Open My Applications <span aria-hidden="true">&rarr;</span></Link>
                    </section>

                    <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
                            <div className="flex items-start gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 3 4 7v5c0 4.5 3.4 7.7 8 9 4.6-1.3 8-4.5 8-9V7l-8-4Z" strokeLinejoin="round" /><path d="m8.5 12 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </span>
                                <div>
                                    <h2 className="text-sm font-black text-slate-900">Before you submit</h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-600">Have your preferred service, planting area, contact details, and supporting information ready.</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 sm:p-6">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Need assistance?</p>
                            <p className="mt-2 text-sm font-bold text-slate-900">Review your certification details or coordinate with MENRO staff.</p>
                            <Link href={route('residents.my-appointments')} className="mt-3 inline-block text-xs font-bold text-amber-800 hover:text-amber-950">Open Applications &rarr;</Link>
                        </div>
                    </section>
                </div>
            </div>
        </ResidentsLayout>
    );
}
