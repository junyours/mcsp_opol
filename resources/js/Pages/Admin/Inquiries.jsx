import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const formatDate = (date) => new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

export default function Inquiries({ auth, inquiries = [] }) {
    const unreadCount = inquiries.filter((inquiry) => !inquiry.is_read).length;

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-lg font-bold text-slate-800">Inquiries</h2>}>
            <Head title="Inquiries" />

            <div className="space-y-6">
                <section className="rounded-2xl bg-blue-950 px-5 py-6 text-white shadow-sm sm:px-7">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-200">Public assistance</p>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Inquiries</h1>
                            <p className="mt-2 text-sm leading-6 text-blue-100">Review questions and service concerns submitted through the Contact page.</p>
                        </div>
                        <span className="w-fit rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">{unreadCount} unread</span>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {inquiries.length ? inquiries.map((inquiry) => (
                        <Link
                            key={inquiry.id}
                            href={route('inquiries.show', inquiry.id)}
                            className="block border-b border-slate-100 px-5 py-4 transition last:border-b-0 hover:bg-blue-50/50 sm:px-6"
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        {!inquiry.is_read && <span className="h-2 w-2 rounded-full bg-rose-500" aria-label="Unread" />}
                                        <h2 className={`truncate text-sm ${inquiry.is_read ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>{inquiry.name}</h2>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">{inquiry.email}{inquiry.service ? ` · ${inquiry.service}` : ''}</p>
                                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{inquiry.message}</p>
                                </div>
                                <time className="shrink-0 text-[11px] text-slate-400">{formatDate(inquiry.created_at)}</time>
                            </div>
                        </Link>
                    )) : (
                        <p className="px-6 py-14 text-center text-sm text-slate-500">No inquiries have been submitted yet.</p>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
