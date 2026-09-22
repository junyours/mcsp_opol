import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Listbox } from '@headlessui/react';
import ResidentsLayout from '@/Layouts/ResidentsLayout';

const createMember = (role, label) => ({
    role,
    label,
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    phone_number: '',
    address: '',
});

const suffixOptions = ['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V'];
const fieldClassName = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100';

const formatCalendarDate = (date) => date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});

const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

function ModernSelect({ value, onChange, options, label }) {
    const selectedOption = options.find((option) => option.value === value) ?? options[0];

    return (
        <Listbox value={value} onChange={onChange}>
            {({ open }) => (
                <div className="relative isolate overflow-visible" style={{ zIndex: open ? 10000 : 1 }}>
                    <Listbox.Button className={`${fieldClassName} relative cursor-pointer pr-11 text-left`} style={{ position: 'relative', zIndex: 2 }}>
                        <span className="block">
                            <span className="block truncate">{selectedOption?.label ?? label}</span>
                            {selectedOption?.description && (
                                <span className="mt-1 block text-[11px] font-medium text-slate-500">
                                    {selectedOption.description}
                                </span>
                            )}
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700">
                            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Listbox.Button>
                    <Listbox.Options className="absolute left-0 top-full mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.16)] outline-none focus:outline-none" style={{ position: 'absolute', zIndex: 10001, left: 0, top: '100%', width: '100%' }}>
                        {options.map((option) => (
                            <Listbox.Option
                                key={option.value}
                                value={option.value}
                                className={({ active }) => `flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${active ? 'bg-blue-50 text-blue-900' : 'text-slate-700'}`}
                            >
                                {({ selected }) => (
                                    <>
                                        <div className="min-w-0 flex-1">
                                            <span className={selected ? 'block font-semibold' : 'block font-normal'}>{option.label}</span>
                                            {option.description && (
                                                <span className="mt-1 block text-[11px] text-slate-500">{option.description}</span>
                                            )}
                                        </div>
                                        {selected && <span className="ml-3 text-blue-600">&#10003;</span>}
                                    </>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </div>
            )}
        </Listbox>
    );
}

function ModernDatePicker({ value, onChange, min }) {
    const today = new Date();
    const [isOpen, setIsOpen] = useState(false);
    const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);

    const selectDate = (day) => {
        const selectedDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
        if (getDateKey(selectedDate) >= min) {
            onChange(getDateKey(selectedDate));
            setIsOpen(false);
        }
    };

    return (
        <div className="relative isolate overflow-visible" style={{ zIndex: isOpen ? 10000 : 1 }}>
            <button type="button" onClick={() => setIsOpen((open) => !open)} className={`${fieldClassName} relative cursor-pointer pr-12 text-left`} style={{ position: 'relative', zIndex: 2 }}>
                <span className={value ? 'text-slate-800' : 'text-slate-400'}>{value ? formatCalendarDate(new Date(`${value}T00:00:00`)) : 'Select a preferred date'}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-700">
                    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                    <path d="M7 3.5v3M17 3.5v3M3.5 9.5h17" strokeLinecap="round" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-full min-w-[280px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.16)]" style={{ position: 'absolute', zIndex: 10001, left: 0, top: '100%', width: '100%', minWidth: '280px' }}>
                    <div className="mb-3 flex items-center justify-between">
                        <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700" aria-label="Previous month">&#8592;</button>
                        <p className="text-sm font-bold text-slate-900">{visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                        <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700" aria-label="Next month">&#8594;</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-slate-400">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day} className="py-1">{day}</span>)}
                        {calendarDays.map((day, index) => {
                            const dateKey = day ? getDateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)) : null;
                            const isSelected = dateKey === value;
                            const isPast = dateKey && dateKey < min;

                            return day ? (
                                <button key={dateKey} type="button" disabled={isPast} onClick={() => selectDate(day)} className={`rounded-lg py-2 text-xs transition ${isSelected ? 'bg-blue-600 font-bold text-white' : isPast ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'}`}>
                                    {day}
                                </button>
                            ) : <span key={`empty-${index}`} />;
                        })}
                    </div>
                    <div className="mt-3 border-t border-slate-100 pt-3 text-center">
                        <button type="button" onClick={() => { setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1)); selectDate(today.getDate()); }} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Choose today</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ResidentsAppointment({ auth, areas = [] }) {
    const { errors = {} } = usePage().props;
    const [appointmentType, setAppointmentType] = useState('couple');
    const [serviceCategory, setServiceCategory] = useState('Tree Planting');
    const [scheduledDate, setScheduledDate] = useState('');
    const [areaName, setAreaName] = useState('');
    const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id ?? '');
    const [organizationName, setOrganizationName] = useState('');
    const [representativeName, setRepresentativeName] = useState('');
    const [representativePhone, setRepresentativePhone] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [members, setMembers] = useState([
        createMember('male', 'Male partner'),
        createMember('female', 'Female partner'),
    ]);

    const requiresSchedule = appointmentType !== 'individual';

    const handleAppointmentTypeChange = (type) => {
        setAppointmentType(type);
        if (type !== 'individual') setServiceCategory('Tree Planting');
        setScheduledDate(type === 'individual' ? '' : scheduledDate);
        setMembers(type === 'individual'
            ? [createMember('individual', 'Personal details')]
            : [createMember('male', 'Male partner'), createMember('female', 'Female partner')]);
    };

    const handleMemberChange = (index, field, value) => {
        setMembers((current) =>
            current.map((member, memberIndex) =>
                memberIndex === index ? { ...member, [field]: value } : member,
            ),
        );
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setStatusMessage('');
        setIsSubmitting(true);

        const appointmentData = {
            appointment_type: appointmentType,
            service_category: serviceCategory,
            scheduled_date: requiresSchedule ? scheduledDate : null,
            area_id: appointmentType === 'individual' ? null : (selectedAreaId || null),
            area_name: appointmentType === 'individual' ? areaName : null,
            organization_name: appointmentType === 'school' ? organizationName : null,
            representative_name: appointmentType === 'school' ? representativeName : null,
            representative_phone: appointmentType === 'school' ? representativePhone : null,
            participants: appointmentType === 'couple' || appointmentType === 'individual'
                ? members.map(({ label, ...member }) => member)
                : [],
        };

        console.info('Submitting tree planting appointment:', {
            ...appointmentData,
            participants: appointmentData.participants.map((member) => ({
                role: member.role,
                hasFirstName: Boolean(member.first_name),
                hasLastName: Boolean(member.last_name),
                hasPhoneNumber: Boolean(member.phone_number),
                hasAddress: Boolean(member.address),
            })),
        });

        router.post('/appointments', appointmentData, {
            preserveScroll: true,
            onSuccess: () => setSubmissionSuccess(true),
            onError: (submissionErrors) => {
                console.error('Tree planting appointment submission failed:', submissionErrors);
                const firstSubmissionError = Object.values(submissionErrors)
                    .flat()
                    .find((message) => typeof message === 'string');

                setStatusMessage(
                    submissionErrors.email || submissionErrors.appointment || firstSubmissionError || 'The certification registration could not be submitted. Please check the form and try again.',
                );
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    useEffect(() => {
        if (!submissionSuccess) return undefined;

        const redirectTimer = window.setTimeout(() => {
            router.visit(route('residents.my-appointments'));
        }, 3000);

        return () => window.clearTimeout(redirectTimer);
    }, [submissionSuccess]);

    return (
        <ResidentsLayout
            user={auth.user}
            header={<h6>Certification registration</h6>}
        >
            <Head title="MENRO Certification Registration" />

            <div className="relative isolate px-4 py-6 sm:px-6 sm:py-10">
                <img
                    src="/images/opol-logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none fixed left-1/2 top-[56%] z-0 w-[min(70vw,560px)] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.16]"
                />
                <div className="relative z-10 mx-auto max-w-5xl">
                    <div className="relative overflow-hidden rounded-[24px] bg-[#173f6b] px-5 py-7 text-white shadow-[0_18px_40px_rgba(23,63,107,0.16)] sm:px-8 sm:py-9">
                        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[18px] border-sky-200/15" />
                        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-200">MENRO services</p>
                                <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">MENRO certification registration</h1>
                                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                                    Submit the details below so our team can review and process your environmental service request.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-300 text-blue-950">1</span>
                                <span className="h-px w-8 bg-white/25" />
                                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30">2</span>
                                <span className="h-px w-8 bg-white/25" />
                                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30">3</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 sm:pt-8">

                    {statusMessage && (
                        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                            {statusMessage}
                        </div>
                    )}

                    {submissionSuccess && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
                            <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.2)]" role="status" aria-live="polite">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-7 w-7"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <h2 className="mt-4 text-lg font-black text-slate-900">Successfully submitted</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">Your certification registration was submitted successfully.</p>
                                <p className="mt-3 text-xs font-semibold text-blue-600">Opening My Registrations...</p>
                            </div>
                        </div>
                    )}

                    {errors.email && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {errors.email}
                        </div>
                    )}

                    {errors.appointment && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {errors.appointment}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-7">
                        <section className="relative z-20 overflow-visible rounded-[24px] border border-slate-200 bg-white/55 p-4 shadow-sm backdrop-blur-[2px] sm:p-5">
                            <div className="mb-5 flex items-start gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-700">01</span>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Request details</h2>
                                    <p className="mt-1 text-xs text-slate-500">Choose the certification service and registration information.</p>
                                </div>
                            </div>
                            <div className="grid gap-5 md:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                    Registration type
                                </label>
                                <ModernSelect
                                    value={appointmentType}
                                    onChange={handleAppointmentTypeChange}
                                    label="Select registration type"
                                    options={[
                                        { value: 'couple', label: 'Couple (Marriage)' },
                                        { value: 'school', label: 'School / Organization / Institution' },
                                        { value: 'individual', label: 'Individual Resident' },
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                    Area selection
                                </label>
                                {appointmentType === 'individual' ? (
                                    <input
                                        type="text"
                                        value={areaName}
                                        onChange={(event) => setAreaName(event.target.value)}
                                        placeholder="Enter your area or location"
                                        required
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                ) : (
                                    <ModernSelect
                                        value={selectedAreaId}
                                        onChange={setSelectedAreaId}
                                        label="Select area"
                                        options={areas.map((area) => ({ value: area.id, label: area.location_name }))}
                                    />
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                    Service category
                                </label>
                                <ModernSelect
                                    value={serviceCategory}
                                    onChange={setServiceCategory}
                                    label="Select service category"
                                    options={appointmentType === 'individual'
                                        ? [
                                            { value: 'Tree Planting', label: 'Tree Planting', description: 'Action and Certification' },
                                            { value: 'Tree Cutting', label: 'Tree Cutting', description: 'Certification only' },
                                            { value: 'Back Filling', label: 'Back Filling and Excavation', description: 'Inspection and Certification' },
                                            { value: 'Special Waste Collection', label: 'Special Waste Collection', description: 'Inspection and Certification' },
                                        ]
                                        : [{ value: 'Tree Planting', label: 'Tree Planting', description: 'Action and Certification' }]}
                                />
                            </div>

                            {requiresSchedule && (
                                <div>
                                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                        Preferred schedule
                                    </label>
                                    <ModernDatePicker
                                        value={scheduledDate}
                                        onChange={setScheduledDate}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            )}
                            </div>
                        </section>

                        <div className="rounded-2xl border border-slate-200 bg-white/55 px-4 py-3 text-sm text-slate-600 backdrop-blur-[2px]">
                            {appointmentType === 'individual'
                                ? 'Staff will coordinate and assign your certification schedule after reviewing your registration.'
                                : 'Choose your preferred date. Staff will confirm the final schedule after reviewing your registration.'}
                        </div>

                        {appointmentType === 'couple' || appointmentType === 'individual' ? (
                            <div className="space-y-5">
                                {members.map((member, index) => (
                                    <div key={member.role} className="rounded-[24px] border border-slate-200 bg-white/55 p-4 shadow-sm backdrop-blur-[2px] sm:p-5">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <h2 className="text-lg font-bold text-slate-900">{member.label}</h2>
                                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                                                {member.role === 'individual' ? 'individual resident' : member.role}
                                            </span>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            <div>
                                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                                    First name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={member.first_name}
                                                    onChange={(event) => handleMemberChange(index, 'first_name', event.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                                    Middle name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={member.middle_name}
                                                    onChange={(event) => handleMemberChange(index, 'middle_name', event.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                                    Last name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={member.last_name}
                                                    onChange={(event) => handleMemberChange(index, 'last_name', event.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                />
                                            </div>

                                            {member.role === 'male' && (
                                                <div>
                                                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                                        Suffix
                                                    </label>
                                                    <ModernSelect
                                                        value={member.suffix}
                                                        onChange={(value) => handleMemberChange(index, 'suffix', value)}
                                                        label="Select suffix"
                                                        options={[{ value: '', label: 'Select suffix' }, ...suffixOptions.map((suffix) => ({ value: suffix, label: suffix }))]}
                                                    />
                                                </div>
                                            )}

                                            <div>
                                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                                    Phone number
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={member.phone_number}
                                                    onChange={(event) => handleMemberChange(index, 'phone_number', event.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                />
                                            </div>

                                            <div className="md:col-span-2 xl:col-span-3">
                                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                                    Address
                                                </label>
                                                <input
                                                    type="text"
                                                    value={member.address}
                                                    onChange={(event) => handleMemberChange(index, 'address', event.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-[24px] border border-slate-200 bg-white/55 p-4 shadow-sm backdrop-blur-[2px] sm:p-5">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                            School / Organization / Institution name
                                        </label>
                                        <input
                                            type="text"
                                            value={organizationName}
                                            onChange={(event) => setOrganizationName(event.target.value)}
                                            required
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                            Representative name
                                        </label>
                                        <input
                                            type="text"
                                            value={representativeName}
                                            onChange={(event) => setRepresentativeName(event.target.value)}
                                            required
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                            Representative phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={representativePhone}
                                            onChange={(event) => setRepresentativePhone(event.target.value)}
                                            required
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">Invitation link</p>
                                    <p className="mt-2 text-sm text-slate-700">A unique member form link will be generated after submission.</p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        This public URL will be sent to the registered email so each member can submit their details without logging in.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Ready to submit?</p>
                                <p className="mt-1 text-xs text-slate-500">Your request will be reviewed by the MENRO team.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_15px_25px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {!isSubmitting && <span className="text-base leading-none">&#8594;</span>}
                                {isSubmitting ? 'Submitting...' : 'Submit registration'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            </div>
        </ResidentsLayout>
    );
}
