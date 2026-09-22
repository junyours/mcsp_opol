import { useEffect, useRef, useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Login({ status, canResetPassword, turnstileSiteKey }) {
    const { flash = {} } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        cf_turnstile_response: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const turnstileWidgetIdRef = useRef(null);

    useEffect(() => {
        if (!turnstileSiteKey) {
            return undefined;
        }

        const scriptId = 'turnstile-script';
        const existingScript = document.getElementById(scriptId);

        const renderTurnstile = () => {
            if (!window.turnstile || !document.getElementById('turnstile-login-widget')) {
                return;
            }

            if (turnstileWidgetIdRef.current && window.turnstile) {
                window.turnstile.remove(turnstileWidgetIdRef.current);
            }

            const widgetId = window.turnstile.render('#turnstile-login-widget', {
                sitekey: turnstileSiteKey,
                action: 'login',
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
        script.onload = () => {
            renderTurnstile();
        };
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
            reset('password');
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
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {(flash.success || status) && (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-[0_10px_25px_rgba(16,185,129,0.12)]">
                    {flash.success || status}
                </div>
            )}

            <div className="relative z-10">
                <div className="mb-6 border-b border-[#d5e6ff] pb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#1d4ed8]">Welcome back</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#0b1b45]">Log In</h2>
                    <p className="mt-2 text-sm text-slate-600">Access your account to continue to the MENRO system.</p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf4ff] text-[#1d4ed8]">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" /><path d="m4.5 7 7.5 6 7.5-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </span>
                            Email
                        </label>

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full rounded-2xl border border-[#d9e8ff] bg-[#f5f9ff] px-4 py-3 text-sm text-slate-800 shadow-[0_10px_25px_rgba(148,163,184,0.12)] transition focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-blue-100"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />

                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf4ff] text-[#1d4ed8]">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7.5a4 4 0 1 1 8 0V10" strokeLinecap="round" /></svg>
                            </span>
                            Password
                        </label>

                        <div className="relative">
                            <TextInput
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full rounded-2xl border border-[#d9e8ff] bg-[#f5f9ff] px-4 py-3 pr-11 text-sm text-slate-800 shadow-[0_10px_25px_rgba(148,163,184,0.12)] transition focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-blue-100"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                onClick={() => setShowPassword((value) => !value)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 transition hover:bg-[#edf5ff] hover:text-[#1d4ed8]"
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 3l18 18" strokeLinecap="round" /><path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" strokeLinecap="round" /><path d="M9.88 5.08A10.63 10.63 0 0 1 12 5c4.42 0 8 3.58 8 7a12.9 12.9 0 0 1-2.21 4.1M6.61 6.61A12.14 12.14 0 0 0 4 12c0 3.42 3.58 7 8 7a9.8 9.8 0 0 0 4.52-1.11" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3.2" /></svg>
                                )}
                            </button>
                        </div>

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                        <label className="flex items-center">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                            />
                            <span className="ms-2 text-sm text-slate-600">Remember me</span>
                        </label>

                        {canResetPassword && (
                            <Link href={route('password.request')} className="text-sm font-medium text-[#1d4ed8] transition hover:text-[#0f3dac]">
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    {turnstileSiteKey && (
                        <div className="pt-1">
                            <div id="turnstile-login-widget" className="flex justify-center" />
                            {errors.cf_turnstile_response && (
                                <InputError message={errors.cf_turnstile_response} className="mt-2" />
                            )}
                        </div>
                    )}

                    <div className="pt-2">
                        <PrimaryButton
                            className="w-full justify-center rounded-2xl bg-[#0d5ec8] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_16px_30px_rgba(29,78,216,0.25)] transition hover:bg-[#0b4fb1] focus:bg-[#0b4fb1]"
                            disabled={processing}
                        >
                            {processing ? 'Signing in...' : 'Log In'}
                        </PrimaryButton>
                    </div>
                </form>

                <div className="mt-5 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span>or</span>
                    <span className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    
                </div>
            </div>
        </GuestLayout>
    );
}
