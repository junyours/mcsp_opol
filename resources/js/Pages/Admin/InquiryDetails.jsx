import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const formatDate = (date) => new Date(date).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

export default function InquiryDetails({ auth, inquiry, previousInquiries = [] }) {
    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-lg font-bold text-slate-800">Inquiry details</h2>}>
            <Head title={`Inquiry from ${inquiry.name}`} />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <Link href={route('inquiries.index')} className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700 hover:text-blue-900">&larr; All inquiries</Link>
                    <div className="mt-6 border-b border-slate-200 pb-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Service inquiry</p>
                        <h1 className="mt-2 text-2xl font-black text-slate-900">{inquiry.name}</h1>
                        <p className="mt-2 text-sm text-slate-500">{inquiry.email}</p>
                        <p className="mt-1 text-xs text-slate-400">Submitted {formatDate(inquiry.created_at)}</p>
                    </div>
                    <div className="mt-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Service concern</p>
                        <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">{inquiry.service || 'General environmental concern'}</p>
                    </div>
                    <div className="mt-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Message</p>
                        <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">{inquiry.message}</p>
                    </div>
                </section>

                <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
                        <h2 className="text-sm font-bold text-slate-900">Previous inquiries</h2>
                        <p className="mt-1 text-xs text-slate-500">{previousInquiries.length} other record{previousInquiries.length === 1 ? '' : 's'}</p>
                    </div>
                    <div className="max-h-[32rem] overflow-y-auto">
                        {previousInquiries.length ? previousInquiries.map((previous) => (
                            <Link key={previous.id} href={route('inquiries.show', previous.id)} className="block border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-blue-50/50">
                                <p className="truncate text-xs font-bold text-slate-800">{previous.name}</p>
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{previous.message}</p>
                                <p className="mt-1 text-[10px] text-slate-400">{formatDate(previous.created_at)}</p>
                            </Link>
                        )) : <p className="px-4 py-8 text-center text-xs text-slate-500">No previous inquiries.</p>}
                    </div>
                </aside>
            </div>
        </AuthenticatedLayout>
    );
}
