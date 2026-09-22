
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const initialForm = {
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    phone_number: '',
    address: '',
    email: '',
    profile_picture: null,
};

const suffixOptions = ['', 'Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V'];

export default function PublicMemberForm({ appointment }) {
    const { errors = {}, flash = {} } = usePage().props;
    const [form, setForm] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [submittedMember, setSubmittedMember] = useState(null);
    const [profilePreview, setProfilePreview] = useState('');

    useEffect(() => {
        if (flash.public_member?.qrcode) {
            setSubmittedMember(flash.public_member);
        }
    }, [flash.public_member]);

    const handleChange = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    const handleProfilePictureChange = (event) => {
        const file = event.target.files?.[0] ?? null;
        setForm((current) => ({ ...current, profile_picture: file }));
        setProfilePreview(file ? URL.createObjectURL(file) : '');
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');

        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== '') formData.append(key, value);
        });

        router.post(`/appointments/public/${appointment.token}/members`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setForm(initialForm);
                setProfilePreview('');
                setSuccessMessage('Your member details have been submitted successfully.');
            },
            onError: (submissionErrors) => {
                console.error('Public member submission failed:', submissionErrors);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100';

    return (
        <>
            <Head title="Submit Member Details" />
            <main className="relative min-h-screen overflow-hidden bg-[#edf5ef] px-4 py-6 text-slate-800 sm:px-8 sm:py-10">
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-lime-200/30 blur-3xl" />

                <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(20,83,45,0.14)] lg:grid lg:grid-cols-[0.8fr_1.2fr]">
                    <aside className="relative overflow-hidden bg-[#164e3b] px-6 py-8 text-white sm:px-10 sm:py-10">
                        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border-[28px] border-emerald-300/10" />
                        <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full border-[34px] border-lime-300/10" />
                        <div className="relative flex h-full flex-col">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-300 text-xl text-emerald-950">+</div>
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-lime-200">MENRO Opol</p>
                                    <p className="mt-1 text-xs text-emerald-100">Tree planting program</p>
                                </div>
                            </div>

                            <div className="mt-14 lg:mt-auto">
                                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-200">Member registration</p>
                                <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.06em] text-white sm:text-5xl">Grow the day together.</h1>
                                <p className="mt-5 max-w-sm text-sm leading-6 text-emerald-100">Your details help the team prepare an accurate participant list for this planting activity.</p>
                            </div>

                            <div className="mt-10 border-t border-white/15 pt-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Organization</p>
                                <p className="mt-2 text-lg font-semibold text-white">{appointment.organization_name}</p>
                            </div>
                        </div>
                    </aside>

                    <section className="px-6 py-8 sm:px-10 sm:py-10">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700">Participant details</p>
                                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">Add your information</h2>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">1 of 1</span>
                        </div>

                        {successMessage && <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{successMessage}</div>}
                        {errors.member && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errors.member}</div>}

                        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                            <div className="flex items-start gap-3">
                                {profilePreview ? <img src={profilePreview} alt="Profile preview" className="h-14 w-14 shrink-0 rounded-xl border-2 border-white object-cover shadow-sm" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" /></svg></div>}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">Attendance identification</p>
                                    <p className="mt-1 text-xs leading-5 text-amber-900">Please upload your real face photo. Otherwise, your registration may be rejected during attendance.</p>
                                </div>
                            </div>
                            <input name="profile_picture" type="file" accept="image/jpeg,image/png,image/webp" required onChange={handleProfilePictureChange} className="mt-4 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-amber-900 hover:file:bg-amber-200" />
                            {errors.profile_picture && <p className="mt-2 text-xs text-red-600">{errors.profile_picture}</p>}
                        </div>

                        {submittedMember && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={() => setSubmittedMember(null)}>
                                <div className="w-full max-w-md rounded-[28px] border border-emerald-100 bg-white p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.25)] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="member-qrcode-title" onMouseDown={(event) => event.stopPropagation()}>
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2M18 14h2M14 18h2M18 18h2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Registration complete</p>
                                    <h2 id="member-qrcode-title" className="mt-2 text-2xl font-black text-slate-900">Your attendance QR code</h2>
                                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Please download this QR code for your attendance during the activity.</p>
                                    <div className="mx-auto mt-5 w-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_30px_rgba(16,185,129,0.12)]">
                                        <img src={submittedMember.qrcode} alt={`Attendance QR code for ${submittedMember.name}`} className="h-64 w-64 max-w-full object-contain" />
                                    </div>
                                    <p className="mt-3 truncate text-xs font-semibold text-slate-700">{submittedMember.name}</p>
                                    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                                        <a href={submittedMember.qrcode} download={`attendance-qr-${submittedMember.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition hover:bg-emerald-600">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 4v11M7 11l5 5 5-5M5 20h14" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            Download QR code
                                        </a>
                                        <button type="button" onClick={() => setSubmittedMember(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-600 transition hover:bg-slate-50">Close</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-8 grid gap-x-4 gap-y-5 sm:grid-cols-2">
                        {[
                            ['first_name', 'First name', true],
                            ['middle_name', 'Middle name', false],
                            ['last_name', 'Last name', true],
                            ['suffix', 'Suffix', false],
                            ['phone_number', 'Phone number', true],
                            ['email', 'Email', false],
                        ].map(([name, label, required]) => (
                            <label key={name} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                {label}
                                {name === 'suffix' ? (
                                    <select name={name} value={form[name]} onChange={handleChange} className={`${inputClass} mt-2 normal-case tracking-normal shadow-sm`}>
                                        <option value="">Select suffix</option>
                                        {suffixOptions.slice(1).map((suffix) => <option key={suffix} value={suffix}>{suffix}</option>)}
                                    </select>
                                ) : (
                                    <input name={name} type={name === 'email' ? 'email' : name === 'phone_number' ? 'tel' : 'text'} value={form[name]} onChange={handleChange} required={required} className={`${inputClass} mt-2 normal-case tracking-normal shadow-sm`} />
                                )}
                                {errors[name] && <span className="mt-1 block normal-case tracking-normal text-red-600">{errors[name]}</span>}
                            </label>
                        ))}
                        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 sm:col-span-2">
                            Address
                            <input name="address" type="text" value={form.address} onChange={handleChange} required className={`${inputClass} mt-2 normal-case tracking-normal shadow-sm`} />
                            {errors.address && <span className="mt-1 block normal-case tracking-normal text-red-600">{errors.address}</span>}
                        </label>
                        <button type="submit" disabled={isSubmitting} className="mt-3 rounded-2xl bg-emerald-700 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_14px_24px_rgba(4,120,87,0.2)] transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">
                            {isSubmitting ? 'Submitting...' : 'Submit member details'}
                        </button>
                    </form>
                </section>
                </div>
            </main>
        </>
    );
}
