import { useState, useEffect, useRef } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';

const formatType = (type) => type === 'school' ? 'School / Organization' : type === 'individual' ? 'Individual Resident' : 'Couple';
const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatTime = (time) => time ? new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
const formatSchedule = (date, time) => date ? `${formatDate(date)}${time ? ` at ${formatTime(time)}` : ''}` : 'Staff scheduling';
const timeOptions = Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2);
    const minute = index % 2 === 0 ? '00' : '30';
    const value = `${String(hour).padStart(2, '0')}:${minute}`;

    return { value, label: formatTime(value) };
});

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const createMember = (role) => ({
    role,
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    phone_number: '',
    address: '',
});

function ScheduleDatePicker({ value, min, onChange, appointmentId }) {
    const today = new Date();
    const [isOpen, setIsOpen] = useState(false);
    const [visibleMonth, setVisibleMonth] = useState(() => {
        const selectedDate = value ? new Date(`${value}T00:00:00`) : today;
        return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    });
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);

    return (
        <div className="relative min-w-0 flex-1">
            <span className="mb-1 block px-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">Date</span>
            <button type="button" onClick={() => setIsOpen((open) => !open)} aria-label={`Schedule date for appointment ${appointmentId}`} aria-expanded={isOpen} className="relative block w-full rounded-md border border-slate-200 bg-white py-1.5 pl-5 pr-1 text-left text-[9px] font-medium text-slate-700 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-blue-600"><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M7 3.5v3M17 3.5v3M3.5 9.5h17" strokeLinecap="round" /></svg>
                {value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select'}
            </button>
            {isOpen && <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                <div className="mb-2 flex items-center justify-between">
                    <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700" aria-label="Previous month">&#8592;</button>
                    <p className="text-[10px] font-bold text-slate-800">{visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700" aria-label="Next month">&#8594;</button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] font-bold uppercase text-slate-400">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day} className="py-1">{day}</span>)}
                    {calendarDays.map((day, index) => {
                        const selectedDate = day ? dateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)) : null;
                        const isPast = selectedDate && selectedDate < min;

                        return day ? <button key={selectedDate} type="button" disabled={isPast} onClick={() => { onChange(selectedDate); setIsOpen(false); }} className={`rounded-md py-1.5 text-[9px] transition ${selectedDate === value ? 'bg-blue-600 font-bold text-white' : isPast ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'}`}>{day}</button> : <span key={`empty-${index}`} />;
                    })}
                </div>
            </div>}
        </div>
    );
}
const isOnProcess = (status) => ['onprocess', 'on process', 'inprocess', 'in process'].includes(String(status ?? '').toLowerCase());
const statusClass = (status) => {
    const normalizedStatus = String(status ?? '').toLowerCase();

    if (['completed', 'approved', 'done'].includes(normalizedStatus)) return 'bg-blue-100 text-blue-800';
    if (['rejected', 'cancelled', 'canceled'].includes(normalizedStatus)) return 'bg-sky-100 text-sky-800';
    if (isOnProcess(status)) return 'bg-cyan-50 text-cyan-700';

    return 'bg-sky-50 text-sky-700';
};

function ManualAppointmentForm({ users, areas, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        appointment_type: 'couple',
        service_category: 'Tree Planting',
        scheduled_date: '',
        area_id: areas[0]?.id ?? '',
        area_name: '',
        organization_name: '',
        representative_name: '',
        representative_phone: '',
        participants: [createMember('male'), createMember('female')],
    });

    const requiresSchedule = data.appointment_type !== 'individual';

    const updateType = (appointmentType) => {
        setData({
            ...data,
            appointment_type: appointmentType,
            scheduled_date: appointmentType === 'individual' ? '' : data.scheduled_date,
            participants: appointmentType === 'individual'
                ? [createMember('individual')]
                : [createMember('male'), createMember('female')],
        });
    };

    const updateMember = (index, field, value) => {
        setData('participants', data.participants.map((member, memberIndex) => (
            memberIndex === index ? { ...member, [field]: value } : member
        )));
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('appointments.manual.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
    const labelClass = 'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500';
    const sectionTitleClass = 'text-xs font-bold uppercase tracking-[0.14em] text-blue-700 mb-3 flex items-center gap-2';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Create Manual Appointment</h2>
                    <p className="mt-1 text-xs text-slate-500">Submit appointment details on behalf of an active user</p>
                </div>
                <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-4">
                    <h3 className={sectionTitleClass}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Basic Information
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>User</label>
                            <select value={data.user_id} onChange={(event) => setData('user_id', event.target.value)} className={inputClass} required>
                                <option value="">Select User</option>
                                {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
                            </select>
                            {errors.user_id && <p className="mt-1 text-[10px] text-rose-600">{errors.user_id}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Appointment Type</label>
                            <select value={data.appointment_type} onChange={(event) => updateType(event.target.value)} className={inputClass}>
                                <option value="couple">Couple</option>
                                <option value="school">School / Organization / Institution</option>
                                <option value="individual">Individual Resident</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Service Category</label>
                            <select value={data.service_category} onChange={(event) => setData('service_category', event.target.value)} className={inputClass}>
                                <option>Tree Planting</option>
                                <option>Tree Cutting</option>
                                <option>Back Filling</option>
                                <option>Special Waste Collection</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>{data.appointment_type === 'individual' ? 'Area or Location' : 'Area Selection'}</label>
                            {data.appointment_type === 'individual' ? (
                                <input value={data.area_name} onChange={(event) => setData('area_name', event.target.value)} className={inputClass} placeholder="Enter location" required />
                            ) : (
                                <select value={data.area_id} onChange={(event) => setData('area_id', event.target.value)} className={inputClass}>
                                    <option value="">Select area</option>
                                    {areas.map((area) => <option key={area.id} value={area.id}>{area.location_name}</option>)}
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {requiresSchedule && (
                    <div className="space-y-2">
                        <label className={labelClass}>Preferred Schedule</label>
                        <input type="date" min={new Date().toISOString().split('T')[0]} value={data.scheduled_date} onChange={(event) => setData('scheduled_date', event.target.value)} className={inputClass} required />
                    </div>
                )}

                {data.appointment_type === 'school' ? (
                    <div className="space-y-4">
                        <h3 className={sectionTitleClass}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-2a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Organization Details
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label className={labelClass}>Organization Name</label>
                                <input value={data.organization_name} onChange={(event) => setData('organization_name', event.target.value)} className={inputClass} required />
                            </div>
                            <div>
                                <label className={labelClass}>Representative Name</label>
                                <input value={data.representative_name} onChange={(event) => setData('representative_name', event.target.value)} className={inputClass} required />
                            </div>
                            <div>
                                <label className={labelClass}>Representative Phone</label>
                                <input value={data.representative_phone} onChange={(event) => setData('representative_phone', event.target.value)} className={inputClass} required />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h3 className={sectionTitleClass}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87M9 13a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Participant Information
                        </h3>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {data.participants.map((member, index) => (
                                <div key={member.role} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
                                    <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">{member.role === 'individual' ? 'Personal Details' : `${member.role} Partner`}</p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {[
                                            ['first_name', 'First Name', true],
                                            ['middle_name', 'Middle Name', false],
                                            ['last_name', 'Last Name', true],
                                            ['phone_number', 'Phone Number', true],
                                            ['address', 'Address', true],
                                        ].map(([field, label, required]) => (
                                            <div key={field} className={field === 'address' ? 'sm:col-span-2' : ''}>
                                                <label className={labelClass}>{label}</label>
                                                <input value={member[field]} onChange={(event) => updateMember(index, field, event.target.value)} className={inputClass} required={required} />
                                            </div>
                                        ))}
                                        {member.role === 'male' && (
                                            <div>
                                                <label className={labelClass}>Suffix</label>
                                                <input value={member.suffix} onChange={(event) => updateMember(index, 'suffix', event.target.value)} className={inputClass} placeholder="Optional" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {errors.appointment && <p className="text-xs text-rose-600">{errors.appointment}</p>}
                
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-100">
                        Cancel
                    </button>
                    <button type="submit" disabled={processing} className="rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-blue-200">
                        {processing ? 'Creating...' : 'Create Appointment'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function AppointmentList({ auth, appointments = [], staff = [], users = [], areas = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [scheduleDrafts, setScheduleDrafts] = useState({});
    const [remarksDrafts, setRemarksDrafts] = useState({});
    const [openTimePicker, setOpenTimePicker] = useState(null);
    const [openStatusMenu, setOpenStatusMenu] = useState(null);
    const [showManualForm, setShowManualForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [certificateUploadAppointment, setCertificateUploadAppointment] = useState(null);
    const [certificateUploaded, setCertificateUploaded] = useState(false);
    const certificateInputRef = useRef(null);
    const itemsPerPage = 20;
    const { patch, processing } = useForm();

    const getAssignedStaff = (appointment) => staff.find((person) => String(person.id) === String(appointment.assigned_to));

    const filteredAppointments = appointments.filter((appointment) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = [
            appointment.id,
            appointment.user?.name,
            appointment.user?.email,
            appointment.area?.location_name,
            appointment.area_name,
            appointment.service_category,
        ].some((value) => String(value ?? '').toLowerCase().includes(search));
        const normalizedStatus = String(appointment.status ?? '').toLowerCase();
        const matchesStatus = statusFilter === 'approved'
            ? normalizedStatus === 'approved'
            : statusFilter === 'all'
                ? !['approved', 'rejected', 'declined'].includes(normalizedStatus)
                : normalizedStatus === String(statusFilter).toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;
    const paginatedAppointments = filteredAppointments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    // Reset to page 1 if current page is beyond total pages
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    // Reset to page 1 when filters change
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const assignAppointment = (appointmentId, assignedTo) => {
        router.patch(
            route('appointments.assign', appointmentId),
            { assigned_to: assignedTo || null },
            { preserveScroll: true },
        );
    };

    const updateStatus = (appointmentId, status) => {
        const action = status === 'approved' ? 'approve' : 'decline';

        if (!window.confirm(`Are you sure you want to ${action} this appointment?`)) return;

        patch(route(`appointments.${action}`, appointmentId), {
            preserveScroll: true,
        });
    };

    const startProcess = (appointmentId) => {
        if (!window.confirm('Start processing this appointment?')) return;

        router.patch(route('appointments.start-process', appointmentId), {}, {
            preserveScroll: true,
        });
    };

    const getScheduleDraft = (appointment) => scheduleDrafts[appointment.id] ?? {
        date: appointment.scheduled_date ?? '',
        time: appointment.scheduled_time ? String(appointment.scheduled_time).slice(0, 5) : '',
    };

    const updateScheduleDraft = (appointmentId, field, value) => {
        const appointment = appointments.find(({ id }) => id === appointmentId);
        setScheduleDrafts((current) => ({
            ...current,
            [appointmentId]: { ...getScheduleDraft(appointment), [field]: value },
        }));
    };

    const scheduleAppointment = (appointmentId) => {
        const appointment = appointments.find(({ id }) => id === appointmentId);
        const draft = scheduleDrafts[appointmentId] ?? getScheduleDraft(appointment);
        const schedulePayload = {
            scheduled_date: draft?.date ?? '',
            scheduled_time: draft?.time ?? '',
        };

        console.info('Saving appointment schedule:', {
            appointmentId,
            draft,
            payload: schedulePayload,
        });

        if (!draft?.date || !draft?.time) return;

        router.patch(route('appointments.schedule', appointmentId), schedulePayload, {
            preserveScroll: true,
            onSuccess: () => console.info('Appointment schedule saved successfully:', {
                appointmentId,
                payload: schedulePayload,
            }),
            onError: (errors) => {
                window.alert(Object.values(errors).flat().join('\n') || 'The schedule could not be saved.');
            },
        });
    };

    const getRemarksDraft = (appointment) => remarksDrafts[appointment.id] ?? appointment.notes ?? '';

    const updateRemarksDraft = (appointmentId, value) => {
        setRemarksDrafts((current) => ({ ...current, [appointmentId]: value }));
    };

    const saveRemarks = (appointmentId) => {
        router.patch(route('appointments.remarks', appointmentId), {
            notes: remarksDrafts[appointmentId] ?? '',
        }, {
            preserveScroll: true,
            onError: (errors) => {
                window.alert(Object.values(errors).flat().join('\n') || 'The remarks could not be saved.');
            },
        });
    };

    const uploadCertificate = (event) => {
        const file = event.target.files?.[0];
        const appointmentId = certificateUploadAppointment;
        event.target.value = '';

        if (!file || !appointmentId) {
            setCertificateUploadAppointment(null);
            return;
        }
        if (file.type !== 'application/pdf') {
            window.alert('Please select a PDF file.');
            setCertificateUploadAppointment(null);
            return;
        }

        const formData = new FormData();
        formData.append('certificate', file);
        setCertificateUploadAppointment(appointmentId);

        router.post(route('appointments.certificate.store', appointmentId), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setCertificateUploaded(true),
            onFinish: () => setCertificateUploadAppointment(null),
        });
    };

    const openCertificatePicker = (appointmentId) => {
        setCertificateUploadAppointment(appointmentId);
        certificateInputRef.current?.click();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-lg font-bold text-slate-800">Appointment list</h2>}
        >
            <Head title="Appointment list" />
            <input ref={certificateInputRef} type="file" accept="application/pdf,.pdf" onChange={uploadCertificate} className="hidden" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="relative mb-6 overflow-hidden rounded-[28px] border border-blue-900/10 bg-blue-950 p-6 text-white shadow-[0_20px_45px_rgba(15,23,42,0.16)] sm:p-8">
                        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border-[18px] border-white/10" />
                        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-200">Menro operations</p>
                                <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">Service Requests</h1>
                                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Review, assign, and process environmental service requests from one central queue.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-100"><span className="h-2 w-2 rounded-full bg-blue-300" /> Live request queue</div>
                        </div>
                    </div>

                    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            ['All requests', appointments.length, 'bg-white text-slate-900', 'border-slate-200'],
                            ['Couple appointments', appointments.filter((appointment) => appointment.appointment_type === 'couple').length, 'bg-blue-50 text-blue-900', 'border-blue-100'],
                            ['Organization requests', appointments.filter((appointment) => appointment.appointment_type === 'school').length, 'bg-amber-50 text-amber-900', 'border-amber-100'],
                            ['On process', appointments.filter(({ status }) => isOnProcess(status)).length, 'bg-sky-50 text-sky-900', 'border-sky-100'],
                        ].map(([label, value, style, border]) => (
                            <div key={label} className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style} ${border}`}>
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">{label}</p>
                                    <span className="h-2 w-2 rounded-full bg-current opacity-60" />
                                </div>
                                <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                            <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Request queue</h2>
                                <p className="mt-1 text-xs text-slate-500">{paginatedAppointments.length} of {filteredAppointments.length} requests shown (Page {currentPage} of {totalPages})</p>
                            </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <button type="button" onClick={() => setShowManualForm(true)} className="rounded-xl bg-blue-700 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-600 shadow-lg shadow-blue-200">
                                        Manual Appointment
                                    </button>
                                <label className="relative">
                                    <span className="sr-only">Search requests</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                                    </svg>
                                    <input value={searchTerm} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search requests" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-56" />
                                </label>
                                <label>
                                    <span className="sr-only">Filter by status</span>
                                    <select value={statusFilter} onChange={(event) => handleStatusChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-36">
                                        <option value="all">All statuses</option>
                                        {[...new Set(appointments.map(({ status }) => status))].map((status) => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </label>
                            </div>
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[980px] divide-y divide-slate-200 text-left text-[10px]">
                                <thead className="bg-slate-50">
                                    <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                        <th className="px-3 py-3">Appointment</th>
                                        <th className="px-3 py-3">Applicant</th>
                                        <th className="px-3 py-3">Service</th>
                                        <th className="px-3 py-3">Schedule</th>
                                        <th className="px-3 py-3">Area</th>
                                        <th className="px-3 py-3">Remarks</th>
                                        <th className="px-3 py-3">Assigned</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="px-3 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedAppointments.length > 0 ? (
                                        paginatedAppointments.map((appointment) => (
                                            <tr key={appointment.id} className="text-[10px] text-slate-700 transition-colors hover:bg-slate-50">
                                                <td className="px-3 py-3">
                                                    <p className="font-bold text-slate-900">#{appointment.id}</p>
                                                    <span className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold ${appointment.appointment_type === 'school' ? 'bg-sky-100 text-sky-800' : 'bg-blue-100 text-blue-800'}`}>{formatType(appointment.appointment_type)}</span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="truncate font-semibold text-slate-800" title={appointment.user?.name ?? 'Unknown user'}>{appointment.user?.name ?? 'Unknown user'}</p>
                                                    <p className="mt-1 truncate text-[9px] text-slate-500" title={appointment.user?.email ?? 'No email'}>{appointment.user?.email ?? 'No email'}</p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="truncate font-semibold text-slate-800" title={appointment.service_category ?? 'Tree Planting'}>{appointment.service_category ?? 'Tree Planting'}</p>
                                                    <p className="mt-1 text-[9px] text-slate-400">{appointment.appointment_type === 'individual' ? 'Individual request' : 'Service request'}</p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="truncate font-semibold text-slate-800" title={formatSchedule(appointment.scheduled_date, appointment.scheduled_time)}>{formatSchedule(appointment.scheduled_date, appointment.scheduled_time)}</p>
                                                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/80 p-1.5 shadow-inner">
                                                        <div className="flex items-end gap-1.5">
                                                            <ScheduleDatePicker value={getScheduleDraft(appointment).date} min={new Date().toISOString().split('T')[0]} appointmentId={appointment.id} onChange={(value) => updateScheduleDraft(appointment.id, 'date', value)} />
                                                            <div className="relative w-[70px] shrink-0">
                                                                <span className="mb-1 block px-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">Time</span>
                                                                <button type="button" onClick={() => setOpenTimePicker(openTimePicker === appointment.id ? null : appointment.id)} aria-label={`Schedule time for appointment ${appointment.id}`} aria-expanded={openTimePicker === appointment.id} className="relative block w-full rounded-md border border-slate-200 bg-white py-1.5 pl-5 pr-1 text-left text-[9px] font-medium text-slate-700 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-blue-600"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                                    {getScheduleDraft(appointment).time ? formatTime(getScheduleDraft(appointment).time) : 'Select'}
                                                                </button>
                                                                {openTimePicker === appointment.id && <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                                                                    <p className="border-b border-slate-100 px-2 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">Choose time</p>
                                                                    <div className="max-h-44 overflow-y-auto pr-0.5">
                                                                        {timeOptions.map((option) => <button key={option.value} type="button" onClick={() => { updateScheduleDraft(appointment.id, 'time', option.value); setOpenTimePicker(null); }} className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] transition ${getScheduleDraft(appointment).time === option.value ? 'bg-blue-600 font-bold text-white' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'}`}><span>{option.label}</span>{getScheduleDraft(appointment).time === option.value && <span>✓</span>}</button>)}
                                                                    </div>
                                                                </div>}
                                                            </div>
                                                            <button type="button" onClick={() => scheduleAppointment(appointment.id)} disabled={processing || !getScheduleDraft(appointment).date || !getScheduleDraft(appointment).time} aria-label="Save appointment schedule" title="Save schedule" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3"><p className="truncate font-medium" title={appointment.area?.location_name ?? appointment.area_name ?? 'No area selected'}>{appointment.area?.location_name ?? appointment.area_name ?? 'No area selected'}</p><p className="mt-1 text-[9px] text-slate-400">{formatDate(appointment.created_at)}</p></td>
                                                <td className="px-3 py-3">
                                                    <div className="flex min-w-[180px] items-end gap-1.5">
                                                        <textarea value={getRemarksDraft(appointment)} onChange={(event) => updateRemarksDraft(appointment.id, event.target.value)} rows="2" maxLength="2000" placeholder="Add remarks" aria-label={`Remarks for appointment ${appointment.id}`} className="w-full resize-y rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[9px] text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                                        <button type="button" onClick={() => saveRemarks(appointment.id)} disabled={processing} aria-label="Save appointment remarks" title="Save remarks" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <select
                                                        value={appointment.assigned_to ?? ''}
                                                        disabled={processing}
                                                        onChange={(event) => assignAppointment(appointment.id, event.target.value)}
                                                        className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1.5 text-[9px] text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize ${statusClass(appointment.status)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{appointment.status}</span>
                                                    {isOnProcess(appointment.status) && <p className="mt-1 text-[9px] font-semibold text-slate-500">Requirements: review details</p>}
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <div className="flex min-w-[78px] items-center justify-end gap-1">
                                                        <button type="button" onClick={() => openCertificatePicker(appointment.id)} disabled={certificateUploadAppointment === appointment.id} aria-label="Upload appointment certificate" title="Upload certificate PDF" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-700 shadow-sm shadow-blue-100 transition duration-200 hover:scale-105 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:cursor-wait disabled:opacity-50"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                                        <Link href={route('appointments.members', appointment.id)} aria-label="View appointment details" title="View appointment details" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm shadow-sky-200 transition duration-200 hover:scale-105 hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
                                                        <div className="relative">
                                                            <button type="button" onClick={() => setOpenStatusMenu(openStatusMenu === appointment.id ? null : appointment.id)} aria-expanded={openStatusMenu === appointment.id} aria-label="Open appointment status actions" title="Status actions" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300">
                                                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                                                            </button>
                                                            {openStatusMenu === appointment.id && <div className="absolute right-0 top-10 z-30 w-44 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
                                                                {!isOnProcess(appointment.status) && !['approved', 'completed', 'rejected', 'declined'].includes(String(appointment.status ?? '').toLowerCase()) && <button type="button" onClick={() => { startProcess(appointment.id); setOpenStatusMenu(null); }} disabled={processing} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"><span className="text-sm">▶</span> Start process</button>}
                                                                <button type="button" onClick={() => { updateStatus(appointment.id, 'approved'); setOpenStatusMenu(null); }} disabled={processing} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"><span className="text-sm">✓</span> Approve appointment</button>
                                                                <button type="button" onClick={() => { updateStatus(appointment.id, 'rejected'); setOpenStatusMenu(null); }} disabled={processing} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><span className="text-sm">×</span> Reject appointment</button>
                                                            </div>}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                    ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-12 text-center text-sm text-slate-500">
                                                No appointments to display on this page.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {!appointments.length && <div className="px-6 py-12 text-center text-sm text-slate-500">No appointments have been submitted yet.</div>}
                        {appointments.length > 0 && !filteredAppointments.length && <div className="px-6 py-12 text-center text-sm text-slate-500">No requests match your current filters.</div>}
                        {filteredAppointments.length > 0 && (
                            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
                                <p className="text-xs text-slate-500">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length} requests
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePreviousPage}
                                        disabled={currentPage === 1}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs font-medium text-slate-700">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 grid gap-3 md:hidden">
                        {paginatedAppointments.length > 0 ? (
                            paginatedAppointments.map((appointment) => (
                            <div key={appointment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Appointment #{appointment.id}</p>
                                        <h3 className="mt-1 font-bold text-slate-900">{appointment.user?.name ?? 'Unknown user'}</h3>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusClass(appointment.status)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{appointment.status}</span>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                    <div><p className="text-slate-400">Service</p><p className="mt-1 font-semibold text-slate-800">{appointment.service_category ?? 'Tree Planting'}</p></div>
                                    <div><p className="text-slate-400">Schedule</p><p className="mt-1 font-semibold text-slate-800">{formatSchedule(appointment.scheduled_date, appointment.scheduled_time)}</p></div>
                                    <div className="col-span-2"><p className="text-slate-400">Area</p><p className="mt-1 font-semibold text-slate-800">{appointment.area?.location_name ?? appointment.area_name ?? 'No area selected'}</p></div>
                                    <div className="col-span-2"><p className="text-slate-400">Remarks</p><div className="mt-1 flex items-end gap-2"><textarea value={getRemarksDraft(appointment)} onChange={(event) => updateRemarksDraft(appointment.id, event.target.value)} rows="2" maxLength="2000" placeholder="Add remarks" aria-label={`Remarks for appointment ${appointment.id}`} className="w-full resize-y rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><button type="button" onClick={() => saveRemarks(appointment.id)} disabled={processing} aria-label="Save appointment remarks" title="Save remarks" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div></div>
                                    <div className="col-span-2"><p className="text-slate-400">Assigned staff</p><div className="mt-1 flex items-center gap-2">{getAssignedStaff(appointment)?.profile_picture?.image ? <img src={getAssignedStaff(appointment).profile_picture.image} alt={`${getAssignedStaff(appointment).name} profile`} className="h-7 w-7 rounded-full border border-slate-200 object-cover" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">{getAssignedStaff(appointment)?.name?.charAt(0).toUpperCase() || '?'}</span>}<select value={appointment.assigned_to ?? ''} disabled={processing} onChange={(event) => assignAppointment(appointment.id, event.target.value)} className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option value="">Unassigned</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></div></div>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs font-bold">
                                    <span className="text-blue-700">{formatType(appointment.appointment_type)}</span>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => openCertificatePicker(appointment.id)} disabled={certificateUploadAppointment === appointment.id} aria-label="Upload appointment certificate" title="Upload certificate PDF" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-700 shadow-sm shadow-blue-100 transition duration-200 hover:scale-105 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:cursor-wait disabled:opacity-50"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                        <>
                                        </>
                                        <Link href={route('appointments.members', appointment.id)} aria-label="View appointment details" title="View appointment details" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm shadow-sky-200 transition duration-200 hover:scale-105 hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
                                        <div className="relative">
                                            <button type="button" onClick={() => setOpenStatusMenu(openStatusMenu === appointment.id ? null : appointment.id)} aria-expanded={openStatusMenu === appointment.id} aria-label="Open appointment status actions" title="Status actions" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg></button>
                                            {openStatusMenu === appointment.id && <div className="absolute right-0 top-10 z-30 w-44 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
                                                {!isOnProcess(appointment.status) && !['approved', 'completed', 'rejected', 'declined'].includes(String(appointment.status ?? '').toLowerCase()) && <button type="button" onClick={() => { startProcess(appointment.id); setOpenStatusMenu(null); }} disabled={processing} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"><span className="text-sm">▶</span> Start process</button>}
                                                <button type="button" onClick={() => { updateStatus(appointment.id, 'approved'); setOpenStatusMenu(null); }} disabled={processing} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"><span className="text-sm">✓</span> Approve appointment</button>
                                                <button type="button" onClick={() => { updateStatus(appointment.id, 'rejected'); setOpenStatusMenu(null); }} disabled={processing} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><span className="text-sm">×</span> Reject appointment</button>
                                            </div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                        ) : (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                                No appointments to display on this page.
                            </div>
                        )}
                        {filteredAppointments.length > 0 && paginatedAppointments.length > 0 && (
                            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-4 mt-4 rounded-2xl">
                                <p className="text-xs text-slate-500">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length} requests
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePreviousPage}
                                        disabled={currentPage === 1}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs font-medium text-slate-700">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal show={certificateUploaded} onClose={() => setCertificateUploaded(false)} maxWidth="sm">
                <div className="p-6 text-center sm:p-7">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-7 w-7">
                            <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-slate-900">Certificate uploaded successfully</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">The certificate PDF has been saved to the appointment record.</p>
                    <button type="button" onClick={() => setCertificateUploaded(false)} className="mt-5 rounded-lg bg-blue-700 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-600">
                        Close
                    </button>
                </div>
            </Modal>

            <Modal show={showManualForm} onClose={() => setShowManualForm(false)} maxWidth="4xl" className="max-h-[90vh] overflow-y-auto">
                <ManualAppointmentForm users={users} areas={areas} onClose={() => setShowManualForm(false)} />
            </Modal>
        </AuthenticatedLayout>
    );
}