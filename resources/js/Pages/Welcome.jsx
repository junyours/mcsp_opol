import { Link, Head } from '@inertiajs/react';
import { Lottie } from 'lottie-react';
import { useEffect, useState } from 'react';

const focusAreas = [
    {
        number: '01',
        title: 'Tree Planting',
        type: 'Action and certificate issuance',
        description: 'Register tree planting activities and request the corresponding MENRO certificate after the required action and review.',
    },
    {
        number: '02',
        title: 'Tree Cutting',
        type: 'Inspection and Certificate issuance',
        description: 'Submit your registration and supporting documents for Tree Cutting certificate evaluation and issuance.',
    },
    {
        number: '03',
        title: 'Backfilling',
        type: 'Inspection and Certificate issuance',
        description: 'Register your Backfilling certificate request for review and issuance by MENRO.',
    },
    {
        number: '04',
        title: 'Special Waste Collection',
        type: 'Inspection and certificate issuance',
        description: 'Request special waste collection action and register for the related MENRO certificate issuance.',
    },
    {
        number: '05',
        title: 'Electrical Installation',
        type: 'Certificate issuance only',
        description: 'Submit an online registration for Electrical Installation certificate review and issuance.',
    },
];

const commitments = [
    {
        title: 'Environmental Protection',
        description: 'Safeguarding Opol\'s natural environment and promoting responsible use of natural resources.',
    },
    {
        title: 'Sustainable Waste Management',
        description: 'Encouraging proper waste segregation, collection, disposal, and recycling practices within the community.',
    },
    {
        title: 'Natural Resource Conservation',
        description: 'Supporting tree planting, forest protection, and initiatives that preserve and restore natural resources.',
    },
    {
        title: 'Environmental Compliance',
        description: 'Monitoring establishments and activities to help ensure compliance with environmental requirements and regulations.',
    },
    {
        title: 'Community Partnership',
        description: 'Working with communities, organizations, businesses, and local stakeholders to achieve meaningful environmental action.',
    },
];

const getHelpResponse = (query) => {
    const normalizedQuery = query.toLowerCase();

    if (normalizedQuery.includes('account') || normalizedQuery.includes('login') || normalizedQuery.includes('password') || normalizedQuery.includes('register')) {
        return 'To manage your account, select Get Started to register, or Login to access your profile. Use Forgot Password on the login page if you cannot sign in.';
    }

    if (normalizedQuery.includes('appointment') || normalizedQuery.includes('schedule') || normalizedQuery.includes('book')) {
        return 'For an appointment, log in, open the appointment section, choose your environmental service, provide the requested details, and submit your request. You can monitor its status from your account.';
    }

    if (normalizedQuery.includes('certificate') || normalizedQuery.includes('tree') || normalizedQuery.includes('backfill') || normalizedQuery.includes('waste') || normalizedQuery.includes('electrical')) {
        return 'Choose the service that matches your concern, prepare the required documents, and submit your registration for MENRO review and certificate issuance.';
    }

    if (normalizedQuery.includes('contact') || normalizedQuery.includes('phone') || normalizedQuery.includes('email')) {
        return 'You can contact MENRO at 0978 333 4531 or opolmenro1@gmail.com. You can also visit the Contact page for more options.';
    }

    return 'Please ask about managing your account, the appointment process, certificate services, or contacting MENRO.';
};

export default function Welcome({ auth }) {
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [helpTopic, setHelpTopic] = useState(null);
    const [helpQuery, setHelpQuery] = useState('');
    const [helpResponse, setHelpResponse] = useState('');
    const [isAssistantTyping, setIsAssistantTyping] = useState(false);

    const helpTopics = {
        account: {
            title: 'Manage your account',
            steps: [
                'Select Get Started to create a resident account.',
                'Use Login to access your account and update your profile information.',
                'Use Forgot Password on the login page if you cannot access your account.',
            ],
        },
        appointment: {
            title: 'Appointment process',
            steps: [
                'Log in to your account and open the appointment section.',
                'Choose the environmental service and provide the requested details.',
                'Submit your request, then monitor your appointment status from your account.',
            ],
        },
    };

    const handleHelpQueryChange = (event) => {
        const query = event.target.value;
        setHelpQuery(query);
        setHelpResponse('');
    };

    useEffect(() => {
        if (helpQuery.trim().length < 3) {
            setIsAssistantTyping(false);
            return undefined;
        }

        setIsAssistantTyping(true);
        let typingAnimation;
        const responseDelay = window.setTimeout(() => {
            const response = getHelpResponse(helpQuery);
            let characterIndex = 0;

            setIsAssistantTyping(false);
            setHelpResponse('');

            typingAnimation = window.setInterval(() => {
                characterIndex += 1;
                setHelpResponse(response.slice(0, characterIndex));

                if (characterIndex >= response.length) {
                    window.clearInterval(typingAnimation);
                }
            }, 18);

        }, 700);

        return () => {
            window.clearTimeout(responseDelay);
            if (typingAnimation) {
                window.clearInterval(typingAnimation);
            }
        };
    }, [helpQuery]);

    return (
        <>
            <Head title="MCSP | Opol" />

            <div className="relative min-h-screen overflow-hidden bg-[#f7f8fa] text-slate-800 antialiased" style={{ fontFamily: '"Segoe UI Variable", "Segoe UI", Inter, sans-serif' }}>
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-[-8rem] top-[-8rem] h-[32rem] w-[32rem] rounded-full bg-blue-100/45 blur-3xl" />
                    <div className="absolute right-[-10rem] top-[18%] h-[30rem] w-[30rem] rounded-full bg-red-100/35 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-[#b3343a]" />
                </div>

                <div className="pointer-events-none fixed inset-0 z-0 flex h-screen w-screen items-center justify-center overflow-hidden">
                    <img
                        src="/images/bagong-opol.png"
                        alt=""
                        aria-hidden="true"
                        className="h-[min(78vh,760px)] w-[min(96vw,1100px)] max-w-none object-contain opacity-[0.13]"
                    />
                </div>

                <button
                    type="button"
                    aria-label="Open help and service guide"
                    onClick={() => setIsHelpOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full border border-blue-100 bg-white/95 p-3 shadow-[0_18px_35px_rgba(18,49,77,0.16)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                    <Lottie
                        src="/animations/call.json"
                        autoplay
                        loop
                        style={{ width: '52px', height: '52px', display: 'block' }}
                    />
                </button>

                {isHelpOpen && (
                    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#12314d]/30 p-4 backdrop-blur-[2px] sm:items-center" role="presentation" onMouseDown={() => setIsHelpOpen(false)}>
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="help-title"
                            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(18,49,77,0.25)]"
                            onMouseDown={(event) => event.stopPropagation()}
                        >
                            <div className="border-b border-blue-100 bg-[#12314d] px-6 py-5 text-white">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-blue-100">
                                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m7-2a8 8 0 0 1-8 8 8.5 8.5 0 0 1-3.7-.8L4 20l.8-3.3A8 8 0 1 1 20 12Z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">MENRO support</p>
                                            <h2 id="help-title" className="mt-1 text-xl font-bold">How can we help?</h2>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Close service guide"
                                        onClick={() => { setIsHelpOpen(false); setHelpTopic(null); }}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-blue-100 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    >
                                        &times;
                                    </button>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-blue-100">Find quick answers about your account and environmental service appointments.</p>
                            </div>

                            <div className="p-6">
                                {!helpTopic ? (
                                    <div>
                                        <label htmlFor="help-query" className="text-xs font-semibold uppercase tracking-[0.12em] text-[#12314d]">Ask a question</label>
                                        <div className="relative mt-2">
                                            <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-slate-400 stroke-2"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-4-4" /></svg>
                                            <input
                                                id="help-query"
                                                type="text"
                                                value={helpQuery}
                                                onChange={handleHelpQueryChange}
                                                placeholder="How do I book an appointment?"
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#b3343a] focus:bg-white focus:ring-4 focus:ring-red-50"
                                            />
                                        </div>

                                        {isAssistantTyping && (
                                            <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-slate-500" aria-live="polite">
                                                <span className="font-medium">MENRO assistant is typing</span>
                                                <span className="flex gap-1" aria-hidden="true">
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b3343a] [animation-delay:-0.3s]" />
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b3343a] [animation-delay:-0.15s]" />
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b3343a]" />
                                                </span>
                                            </div>
                                        )}

                                        {helpResponse && !isAssistantTyping && (
                                            <div className="mt-4 flex gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-slate-600" aria-live="polite">
                                                <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 fill-none stroke-[#12314d] stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm0 5v4m0 4h.01" /></svg>
                                                <span>{helpResponse}</span>
                                            </div>
                                        )}

                                        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Quick help</p>
                                        <div className="mt-3 grid gap-3">
                                            <button type="button" onClick={() => setHelpTopic('account')} className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-[#b3343a] hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-blue-200">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#12314d] transition group-hover:bg-white">
                                                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><circle cx="12" cy="8" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 20a7 7 0 0 1 14 0" /></svg>
                                                </span>
                                                <span><span className="block text-sm font-bold text-[#12314d]">Manage my account</span><span className="mt-0.5 block text-xs text-slate-500">Create, access, or recover your account.</span></span>
                                            </button>
                                            <button type="button" onClick={() => setHelpTopic('appointment')} className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-[#b3343a] hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-blue-200">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#b3343a] transition group-hover:bg-white">
                                                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><rect x="4" y="5" width="16" height="15" rx="2" /><path strokeLinecap="round" d="M8 3v4m8-4v4M4 10h16" /></svg>
                                                </span>
                                                <span><span className="block text-sm font-bold text-[#12314d]">Appointment process</span><span className="mt-0.5 block text-xs text-slate-500">Request and monitor an appointment.</span></span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <button type="button" onClick={() => setHelpTopic(null)} className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b3343a] hover:text-[#12314d]">&larr; Choose another topic</button>
                                        <h3 className="mt-4 text-lg font-bold text-[#12314d]">{helpTopics[helpTopic].title}</h3>
                                        <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                                            {helpTopics[helpTopic].steps.map((step, index) => (
                                                <li key={step} className="flex gap-3">
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-[#b3343a]">{index + 1}</span>
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <main id="home" className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-8 lg:px-8 lg:pb-24 lg:pt-12">
                    <nav className="mb-14 flex items-center justify-between border-b border-blue-100 pb-5 lg:mb-20" aria-label="Main navigation">
                        <a href="#home" className="text-xs font-bold uppercase tracking-[0.2em] text-[#12314d]">
                            MCSP <span className="text-[#b3343a]">Opol</span>
                        </a>

                        <div className="flex items-center gap-6 text-sm font-semibold text-slate-600 sm:gap-8">
                            <a href="#home" className="transition hover:text-[#b3343a]">Home</a>
                            <a href="#about" className="transition hover:text-[#b3343a]">About</a>
                            <a href="#services" className="transition hover:text-[#b3343a]">Services</a>
                            <a href={route('contact')} className="transition hover:text-[#b3343a]">Contact</a>
                        </div>
                    </nav>

                    <section className="grid scroll-mt-8 items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
                        <div className="flex flex-col justify-center">
                            <div className="mb-6 flex items-center gap-3">
                                <img
                                    src="/images/opol-logo.png"
                                    alt="MENRO Opol seal"
                                    className="h-14 w-14 rounded-full border border-blue-200 bg-white object-cover shadow-sm shadow-blue-100"
                                />
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#b3343a]">MENRO Certificate Services Portal</div>
                                    <div className="text-sm font-black uppercase tracking-[0.12em] text-slate-900">Opol</div>
                                </div>
                            </div>

                            <div className="mb-6 inline-flex w-fit items-center border-l-4 border-[#b3343a] bg-blue-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#12314d]">
                                Online Registration for Certificate Issuance
                            </div>

                            <div className="relative max-w-2xl">

                                <h1 className="relative z-10 max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.05em] text-[#12314d] sm:text-5xl lg:text-[4.2rem]" style={{ fontFamily: '"Segoe UI Variable", "Segoe UI", Inter, sans-serif' }}>
                                    MENRO Certificate Services Portal
                                </h1>
                            </div>

                            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg" style={{ fontFamily: '"Segoe UI Variable", "Segoe UI", Inter, sans-serif' }}>
                                MCSP makes it easier for residents to request environmental actions and apply for official certificate issuance through a clear and convenient process.
                            </p>

                            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                                <Link
                                    href={route('register')}
                                    className="rounded-md bg-[#12314d] px-6 py-3.5 text-sm font-semibold tracking-[0.01em] text-white shadow-[0_12px_30px_rgba(18,49,77,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0d253b] hover:shadow-[0_16px_32px_rgba(18,49,77,0.24)]"
                                >
                                    Get Started
                                </Link>

                                <Link
                                    href={route('login')}
                                    className="text-sm font-semibold text-[#12314d] transition hover:text-[#b3343a]"
                                >
                                    Login
                                </Link>
                            </div>

                            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                <span className="border border-blue-100 bg-white px-3 py-1.5 text-[#12314d]">Online registration</span>
                                <span className="border border-blue-100 bg-white px-3 py-1.5 text-[#12314d]">Certificate issuance</span>
                                <span className="border border-blue-100 bg-white px-3 py-1.5 text-[#12314d]">Environmental services</span>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -left-6 top-10 h-28 w-28 rounded-full bg-blue-200/60 blur-3xl" />
                            <div className="absolute -right-8 bottom-6 h-32 w-32 rounded-full bg-red-200/50 blur-3xl" />

                            <div className="relative overflow-hidden rounded-[1.35rem] border border-white/80 bg-white p-2 shadow-[0_22px_45px_rgba(127,29,29,0.10),0_10px_25px_rgba(18,49,77,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(127,29,29,0.16),0_14px_30px_rgba(18,49,77,0.10)]">
                                <div className="flex h-[440px] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-white to-red-50">
                                    <Lottie
                                        src="/animations/environmental_waste.json"
                                        autoplay
                                        loop
                                        renderer="svg"
                                        rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
                                        style={{ width: '110%', height: '110%', display: 'block', transform: 'translateY(4px)' }}
                                    />
                                </div>
                            </div>

                            <div className="absolute inset-x-5 bottom-5 border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b3343a]">Local governance</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-800">Online certificate registration</p>
                                    </div>
                                    <div className="bg-blue-100 px-2.5 py-1 text-xs font-semibold text-[#12314d]">Active</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="about" className="mt-20 scroll-mt-8 border-t border-blue-100 pt-10">
                        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b3343a]">About MENRO Opol</p>
                                    <h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.04em] text-[#12314d] lg:text-4xl">
                                    A simpler way to register for MENRO certificate issuance.
                                </h2>
                                <div className="mt-6 h-1 w-16 bg-[#b3343a]" />
                            </div>

                            <div className="space-y-5 text-sm leading-8 text-slate-600 sm:text-base">
                                <p>
                                    The <strong className="font-semibold text-[#12314d]">MENRO Opol Online Registration System</strong> is designed to help residents, businesses, and organizations register for environmental certificates in a clear, organized, and accessible way.
                                </p>
                                <p>
                                    Through the system, applicants can submit their information, select the appropriate service, provide supporting requirements, and monitor their certificate request.
                                </p>
                                <p>
                                    Tree Cutting, Backfilling, and Electrical Installation are available for <strong className="font-semibold text-[#12314d]">certificate issuance only</strong>. Tree Planting and Special Waste Collection include an action request together with certificate issuance.
                                </p>
                            </div>
                        </div>

                        <div className="mt-14">
                            <div className="mb-6 flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b3343a]">Our commitment</p>
                                    <h3 className="mt-2 text-2xl font-bold text-[#12314d]">Clear registration for every service.</h3>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {commitments.map((commitment, index) => (
                                    <div key={commitment.title} className="rounded-xl border border-white/80 bg-white p-5 shadow-[0_14px_28px_rgba(127,29,29,0.08),0_5px_14px_rgba(18,49,77,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(127,29,29,0.14),0_8px_18px_rgba(18,49,77,0.08)]">
                                        <div className="mb-5 flex items-center gap-3">
                                            <span className="text-xs font-bold text-[#b3343a]">0{index + 1}</span>
                                            <span className="h-px flex-1 bg-blue-100" />
                                        </div>
                                        <h4 className="text-base font-semibold text-[#12314d]">{commitment.title}</h4>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">{commitment.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </section>

                    <section id="services" className="mt-20 scroll-mt-8 border-t border-blue-100 pt-10">
                        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                            <div className="max-w-2xl">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b3343a]">Our services</p>
                                <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#12314d] lg:text-4xl">
                                    Environmental services for a safer, greener Opol.
                                </h2>
                            </div>
                            <p className="max-w-sm text-sm leading-7 text-slate-500">
                                Practical assistance and responsible environmental management for residents, communities, and local partners.
                            </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {focusAreas.map((item) => (
                                <div
                                    key={item.title}
                                    className="group rounded-xl border border-white/80 bg-white p-6 shadow-[0_16px_32px_rgba(127,29,29,0.10),0_6px_16px_rgba(18,49,77,0.06)] transition duration-300 hover:-translate-y-1.5 hover:border-[#b3343a]/40 hover:shadow-[0_24px_44px_rgba(127,29,29,0.18),0_10px_22px_rgba(18,49,77,0.08)]"
                                >
                                    <div className="mb-7 flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center bg-red-50 text-xs font-bold text-[#b3343a]">
                                            {item.number}
                                        </div>
                                        <div className="h-px w-16 bg-blue-100 transition group-hover:bg-[#b3343a]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-[#12314d]">{item.title}</h3>
                                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#b3343a]">{item.type}</p>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="contact" className="mt-20 border-t-4 border-[#b3343a] bg-[#12314d] px-6 py-8 text-white shadow-[0_25px_60px_rgba(18,49,77,0.18)] sm:px-8 lg:px-10">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                                    Strengthening environmental governance and community stewardship in Opol.
                                </h3>
                                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100">
                                    <a href="tel:09783334531" className="transition hover:text-white">MENRO: 0978 333 4531</a>
                                    <a href="mailto:opolmenro1@gmail.com" className="transition hover:text-white">opolmenro1@gmail.com</a>
                                    <a href="https://www.facebook.com/profile.php?id=61580625399057" target="_blank" rel="noreferrer" className="transition hover:text-white">Facebook</a>
                                </div>
                            </div>

                            <Link
                                href={route('contact')}
                                className="inline-flex items-center justify-center rounded-md bg-[#1d5b8f] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(18,49,77,0.18)] transition hover:bg-[#164b78] hover:shadow-[0_14px_28px_rgba(18,49,77,0.24)]"
                            >
                                Contact MENRO
                            </Link>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
