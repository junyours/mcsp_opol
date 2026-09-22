import { useEffect, useRef, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Register({ turnstileSiteKey }) {
    const { flash = {} } = usePage().props;
    const [showOtp, setShowOtp] = useState(Boolean(flash.otp_sent));
    const [showTerms, setShowTerms] = useState(false);
    const [startedAt] = useState(() => Date.now());
    const turnstileWidgetIdRef = useRef(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms_accepted: false,
        website: '',
        started_at: startedAt,
        cf_turnstile_response: '',
    });
    const otpForm = useForm({ otp: '' });
    const emailIsTyping = data.email.trim().length > 0;
    const emailIsValid = data.email.trim().toLowerCase().endsWith('@gmail.com');
    const passwordIsTyping = data.password.length > 0;
    const passwordIsValid = data.password.length >= 8;

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    useEffect(() => {
        if (flash.otp_sent) setShowOtp(true);
    }, [flash.otp_sent]);

    useEffect(() => {
        if (!turnstileSiteKey) {
            return undefined;
        }

        const scriptId = 'turnstile-register-script';
        const existingScript = document.getElementById(scriptId);

        const renderTurnstile = () => {
            if (!window.turnstile || !document.getElementById('turnstile-register-widget')) {
                return;
            }

            if (turnstileWidgetIdRef.current && window.turnstile) {
                window.turnstile.remove(turnstileWidgetIdRef.current);
            }

            const widgetId = window.turnstile.render('#turnstile-register-widget', {
                sitekey: turnstileSiteKey,
                action: 'register',
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

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
            if (turnstileWidgetIdRef.current && window.turnstile) {
                window.turnstile.remove(turnstileWidgetIdRef.current);
                turnstileWidgetIdRef.current = null;
            }
        };
    }, [reset]);

    const submit = (e) => {
        e.preventDefault();

        if (!data.cf_turnstile_response) {
            setData('cf_turnstile_response', '');
        }

        post(route('register'));
    };

    const submitOtp = (e) => {
        e.preventDefault();

        otpForm.post(route('register.verify-otp'), {
            onError: () => setShowOtp(true),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="mb-5 border-b border-blue-100 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700">MENRO Certificate Services Portal</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-blue-950">Register</h1>
                <p className="mt-1 text-sm text-slate-500">Create your resident account.</p>
            </div>

            {showOtp ? (
                <form onSubmit={submitOtp} className="space-y-5">
                    <div className="rounded-2xl bg-blue-950 p-5 text-white shadow-[0_14px_30px_rgba(11,27,69,0.14)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200">Email verification</p>
                        <h1 className="mt-2 text-2xl font-black tracking-tight">Check your inbox</h1>
                        <p className="mt-2 text-sm leading-6 text-blue-100">
                            We sent a six-digit code to <span className="font-bold text-white">{flash.otp_email || data.email}</span>.
                        </p>
                    </div>

                    <div>
                        <InputLabel htmlFor="otp" value="Verification code" />
                        <TextInput
                            id="otp"
                            value={otpForm.data.otp}
                            className="mt-1 block w-full text-center text-2xl font-bold tracking-[0.35em]"
                            inputMode="numeric"
                            maxLength={6}
                            autoComplete="one-time-code"
                            isFocused={true}
                            onChange={(e) => otpForm.setData('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                        />
                        <InputError message={otpForm.errors.otp} className="mt-2" />
                    </div>

                    <button type="submit" disabled={otpForm.processing} className="w-full rounded-xl bg-blue-900 px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,94,200,0.2)] transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                        {otpForm.processing ? 'Verifying...' : 'Verify and create account'}
                    </button>
                    <button type="button" onClick={() => setShowOtp(false)} className="w-full text-sm font-semibold text-blue-700 hover:text-blue-950">Back to registration</button>
                </form>
            ) : (
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    {emailIsTyping && (
                        <p className={`mt-2 text-[11px] font-medium ${emailIsValid ? 'text-emerald-600' : 'text-red-500'}`}>
                            Must end with @gmail.com
                        </p>
                    )}
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="hidden" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input id="website" name="website" value={data.website} tabIndex="-1" autoComplete="off" onChange={(e) => setData('website', e.target.value)} />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    {passwordIsTyping && (
                        <p className={`mt-2 text-[11px] font-medium ${passwordIsValid ? 'text-emerald-600' : 'text-red-500'}`}>
                            Strength: minimum 8 letters
                        </p>
                    )}
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required
                    />

                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                {turnstileSiteKey && (
                    <div>
                        <div id="turnstile-register-widget" className="flex justify-center" />
                        {errors.cf_turnstile_response && (
                            <InputError message={errors.cf_turnstile_response} className="mt-2" />
                        )}
                    </div>
                )}

                <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                        <input id="terms_accepted" type="checkbox" checked={data.terms_accepted} onChange={(e) => setData('terms_accepted', e.target.checked)} className="mt-0.5 rounded border-blue-300 text-blue-800 focus:ring-blue-200" />
                        <label htmlFor="terms_accepted" className="leading-5">I accept the MENRO terms and conditions.</label>
                    </div>
                    <button type="button" onClick={() => setShowTerms(true)} className="ml-7 text-xs font-bold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-950">Read the full terms and conditions</button>
                    <InputError message={errors.terms_accepted} />
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                    <Link
                        href={route('login')}
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4 bg-blue-900 hover:bg-blue-800 focus:bg-blue-800" disabled={processing || !data.terms_accepted}>
                        {processing ? 'Sending code...' : 'Continue'}
                    </PrimaryButton>
                </div>
            </form>
            )}

            {showTerms && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center" onMouseDown={() => setShowTerms(false)}>
                    <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4 border-b border-blue-100 pb-4">
                            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">MENRO Certificate Services Portal</p><h2 className="mt-1 text-2xl font-black tracking-tight text-blue-950">Terms and Conditions</h2><p className="mt-1 text-xs text-slate-500">Last updated September 14, 2026</p></div>
                            <button type="button" onClick={() => setShowTerms(false)} aria-label="Close terms and conditions" className="text-2xl leading-none text-slate-400 hover:text-slate-700">&times;</button>
                        </div>
                        <div className="mt-5 space-y-5 text-sm leading-6 text-slate-600">
                            <section><h3 className="font-bold text-blue-950">1. Eligibility and account security</h3><p className="mt-1">You must provide your real name, a valid email address, and other information required for a legitimate MENRO service request. You are responsible for keeping your password confidential and for all activity performed through your account. Notify MENRO promptly if you believe your account has been accessed without permission.</p></section>
                            <section><h3 className="font-bold text-blue-950">2. Truthful applications and documents</h3><p className="mt-1">All appointment details, participant information, locations, supporting documents, and uploaded files must be complete, accurate, current, and related to the stated request. You must not submit forged, altered, misleading, fraudulent, or unlawfully obtained documents.</p></section>
                            <section><h3 className="font-bold text-blue-950">3. Review and service decisions</h3><p className="mt-1">Submitting an application does not guarantee approval, scheduling, inspection, collection, action, or certificate issuance. MENRO may request clarification, conduct verification or inspection, change a schedule, place a request on hold, approve it subject to conditions, or reject it when requirements are incomplete or the request does not comply with applicable rules.</p></section>
                            <section><h3 className="font-bold text-blue-950">4. Fees and official transactions</h3><p className="mt-1">Any fee displayed in the portal is subject to official verification and applicable municipal rules. A statement of account or online submission is not proof of payment. Payments must be made only through authorized municipal channels, and official receipts must be retained as proof of payment.</p></section>
                            <section><h3 className="font-bold text-blue-950">5. Acceptable use</h3><p className="mt-1">You must not use the portal to impersonate another person, make false reports, upload malicious code, interfere with system operation, bypass security controls, harvest personal information, submit spam, or use the service for unlawful, abusive, commercial, or unauthorized purposes.</p></section>
                            <section><h3 className="font-bold text-blue-950">6. Privacy and records</h3><p className="mt-1">MENRO may collect and process account details, appointment information, participant data, uploaded requirements, communications, payment-related records, and system activity to authenticate users, evaluate requests, coordinate services, issue certificates, maintain government records, and comply with legal obligations. Records may be retained for the period required by law and municipal policy.</p></section>
                            <section><h3 className="font-bold text-blue-950">7. Suspension and termination</h3><p className="mt-1">MENRO may suspend, restrict, or terminate access, cancel requests, or preserve relevant records when an account violates these terms, contains false information, presents a security or public-interest risk, or is subject to a lawful investigation. This does not remove any obligation or liability arising before suspension or termination.</p></section>
                            <section><h3 className="font-bold text-blue-950">8. Changes and agreement</h3><p className="mt-1">MENRO may update these terms when services, procedures, laws, or municipal policies change. The current version shown in the portal applies to future use. By accepting these terms, you confirm that you have read them, understood them, provided truthful information, and agree to comply with them and with applicable Philippine laws and municipal regulations.</p></section>
                        </div>
                        <button type="button" onClick={() => { setData('terms_accepted', true); setShowTerms(false); }} className="mt-6 w-full rounded-xl bg-blue-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800">I accept these terms</button>
                    </section>
                </div>
            )}
        </GuestLayout>
    );
}
