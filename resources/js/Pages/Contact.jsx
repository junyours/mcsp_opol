import { useEffect, useRef, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const contactDetails = [
    {
        label: 'Office',
        value: 'Municipal Environment and Natural Resources Office',
        detail: 'Municipality of Opol, Misamis Oriental',
    },
    {
        label: 'Office hours',
        value: 'Monday to Friday',
        detail: '8:00 AM - 5:00 PM',
    },
    {
        label: 'Public assistance',
        value: 'Environmental service concerns',
        detail: 'Visit the MENRO office during office hours for assistance.',
    },
];

export default function Contact({ turnstileSiteKey }) {
    const { flash = {} } = usePage().props;
    const turnstileWidgetIdRef = useRef(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        service: '',
        message: '',
        cf_turnstile_response: '',
    });

    const submit = (event) => {
        event.preventDefault();

        if (!data.cf_turnstile_response) {
            setData('cf_turnstile_response', '');
        }

        post(route('contact.inquiries.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    useEffect(() => {
        if (!turnstileSiteKey) {
            return undefined;
        }

        const scriptId = 'turnstile-contact-script';
        const existingScript = document.getElementById(scriptId);

        const renderTurnstile = () => {
            if (!window.turnstile || !document.getElementById('turnstile-contact-widget')) {
                return;
            }

            if (turnstileWidgetIdRef.current && window.turnstile) {
                window.turnstile.remove(turnstileWidgetIdRef.current);
            }

            const widgetId = window.turnstile.render('#turnstile-contact-widget', {
                sitekey: turnstileSiteKey,
                action: 'contact',
                theme: 'light',
                size: 'normal',
                callback: (token) => setData('cf_turnstile_response', token),
                'expired-callback': () => setData('cf_turnstile_response', ''),
                'error-callback': () => setData('cf_turnstile_response', ''),
            });

            turnstileWidgetIdRef.current = widgetId;
        };

        if (existingScript) {
            if (window.turnstile) {
                renderTurnstile();
            }
            return undefined;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => renderTurnstile();
        document.body.appendChild(script);

        return () => {
            if (turnstileWidgetIdRef.current && window.turnstile) {
                window.turnstile.remove(turnstileWidgetIdRef.current);
                turnstileWidgetIdRef.current = null;
            }
        };
    }, [turnstileSiteKey, setData]);

    return (
        <>
            <Head title="Contact MENRO Opol" />

            <div className="relative min-h-screen overflow-hidden bg-[#f7f8fa] text-slate-800 antialiased" style={{ fontFamily: '"Segoe UI Variable", "Segoe UI", Inter, sans-serif' }}>
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-[-8rem] top-[-8rem] h-[32rem] w-[32rem] rounded-full bg-blue-100/45 blur-3xl" />
                    <div className="absolute right-[-10rem] top-[18%] h-[30rem] w-[30rem] rounded-full bg-red-100/35 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-[#b3343a]" />
                </div>

                <main className="relative mx-auto max-w-7xl px-5 pb-16 pt-8 lg:px-8 lg:pb-24 lg:pt-12">
                    <nav className="mb-14 flex items-center justify-between border-b border-blue-100 pb-5 lg:mb-20" aria-label="Main navigation">
                        <Link href={route('home')} className="text-xs font-bold uppercase tracking-[0.2em] text-[#12314d]">
                            MENRO <span className="text-[#b3343a]">Opol</span>
                        </Link>

                        <div className="flex items-center gap-5 text-sm font-semibold text-slate-600 sm:gap-8">
                            <Link href={route('home')} className="transition hover:text-[#b3343a]">Home</Link>
                            <Link href={`${route('home')}#about`} className="transition hover:text-[#b3343a]">About</Link>
                            <Link href={`${route('home')}#services`} className="transition hover:text-[#b3343a]">Services</Link>
                            <Link href={route('contact')} className="text-[#b3343a]">Contact</Link>
                        </div>
                    </nav>

                    <section className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b3343a]">Get in touch</p>
                            <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] text-[#12314d] sm:text-5xl">
                                Contact MENRO Opol.
                            </h1>
                            <div className="mt-6 h-1 w-16 bg-[#b3343a]" />
                            <p className="mt-7 max-w-md text-base leading-8 text-slate-600">
                                For online certificate registration, action requests, and environmental service concerns, connect with the Municipal Environment and Natural Resources Office.
                            </p>

                            <div className="mt-10 space-y-6">
                                {contactDetails.map((detail) => (
                                    <div key={detail.label} className="border-l-2 border-[#b3343a] pl-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b3343a]">{detail.label}</p>
                                        <p className="mt-1 text-sm font-semibold text-[#12314d]">{detail.value}</p>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">{detail.detail}</p>
                                    </div>
                                ))}

                                <div className="border-l-2 border-[#b3343a] pl-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b3343a]">Contact details</p>
                                    <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                                        <a href="tel:09059696288" className="flex items-center gap-2 font-semibold text-[#12314d] transition hover:text-[#b3343a]">
                                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 4h3l2 5-2 1.5a13 13 0 0 0 5.5 5.5L15 14l5 2v3c0 1.1-.9 2-2 2C10.3 21 3 13.7 3 5c0-1.1.9-2 2-2Z" /></svg>
                                            0905-969-6288
                                        </a>
                                        <a href="mailto:opolmenro1@gmail.com" className="flex items-center gap-2 transition hover:text-[#b3343a]">
                                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="m3 6 9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" /></svg>
                                            opolmenro1@gmail.com
                                        </a>
                                        <a href="https://www.facebook.com/profile.php?id=61580625399057" target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-[#b3343a]">
                                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.4v3h2.7v8h3.4Z" /></svg>
                                            Facebook page
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[1.35rem] border border-white/80 bg-white p-6 shadow-[0_22px_48px_rgba(127,29,29,0.13),0_10px_25px_rgba(18,49,77,0.08)] sm:p-8 sm:shadow-[0_28px_60px_rgba(127,29,29,0.15),0_12px_30px_rgba(18,49,77,0.09)]">
                            <div className="mb-8 border-b border-blue-100 pb-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b3343a]">Public assistance</p>
                                <h2 className="mt-2 text-2xl font-bold text-[#12314d]">Send an inquiry</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">Provide your details and service concern so MENRO can guide your certificate registration or action request.</p>
                            </div>

                            {flash.success && (
                                <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700" role="status">
                                    {flash.success}
                                </div>
                            )}

                            <form className="space-y-5" onSubmit={submit}>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#12314d]">Full name</label>
                                        <input id="name" type="text" value={data.name} onChange={(event) => setData('name', event.target.value)} className="w-full border-blue-100 bg-[#f7f8fa] px-4 py-3 text-sm text-slate-700 shadow-none focus:border-[#b3343a] focus:ring-[#b3343a]" placeholder="Your full name" required />
                                        {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#12314d]">Email address</label>
                                        <input id="email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className="w-full border-blue-100 bg-[#f7f8fa] px-4 py-3 text-sm text-slate-700 shadow-none focus:border-[#b3343a] focus:ring-[#b3343a]" placeholder="you@example.com" required />
                                        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="service" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#12314d]">Service concern</label>
                                    <select id="service" value={data.service} onChange={(event) => setData('service', event.target.value)} className="w-full border-blue-100 bg-[#f7f8fa] px-4 py-3 text-sm text-slate-700 shadow-none focus:border-[#b3343a] focus:ring-[#b3343a]">
                                        <option value="">Choose a service</option>
                                        <option>Tree Planting - Action and certificate issuance</option>
                                        <option>Tree Cutting - Certificate issuance only</option>
                                        <option>Backfilling - Certificate issuance only</option>
                                        <option>Special Waste Collection - Action and certificate issuance</option>
                                        <option>Electrical Installation - Certificate issuance only</option>
                                        <option>Other environmental concern</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="message" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#12314d]">Message</label>
                                    <textarea id="message" rows="5" value={data.message} onChange={(event) => setData('message', event.target.value)} className="w-full border-blue-100 bg-[#f7f8fa] px-4 py-3 text-sm text-slate-700 shadow-none focus:border-[#b3343a] focus:ring-[#b3343a]" placeholder="How can MENRO assist you?" required />
                                    {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message}</p>}
                                </div>

                                {turnstileSiteKey && (
                                    <div>
                                        <div id="turnstile-contact-widget" className="flex justify-center" />
                                        {errors.cf_turnstile_response && (
                                            <p className="mt-2 text-xs text-rose-600">{errors.cf_turnstile_response}</p>
                                        )}
                                    </div>
                                )}

                                <button type="submit" disabled={processing} className="w-full rounded-md bg-[#12314d] px-6 py-3.5 text-sm font-semibold tracking-[0.01em] text-white shadow-[0_12px_30px_rgba(18,49,77,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0d253b] hover:shadow-[0_16px_32px_rgba(18,49,77,0.24)] disabled:cursor-not-allowed disabled:opacity-60">
                                    {processing ? 'Submitting...' : 'Submit inquiry'}
                                </button>
                            </form>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
