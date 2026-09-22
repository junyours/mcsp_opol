import { useState } from 'react';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';

const navGroups = [
    {
        title: 'Main',
        items: [
            {
                label: 'Dashboard',
                href: route('dashboard'),
                active: route().current('dashboard'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M4 13.5h7V20H4v-6.5Zm9-11h7v8h-7V2.5Zm0 11h7V20h-7v-6.5ZM4 2.5h7v8H4v-8Z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ),
            },
            

            {
                label: 'Service Request',
                href: route('appointments.index'),
                active: route().current('appointments.*'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <rect x="4" y="5" width="16" height="15" rx="2" />
                        <path d="M8 3v4M16 3v4M4 9h16" strokeLinecap="round" />
                    </svg>
                ),
            },

           
            {
                label: 'Certificates',
                href: route('certificates.index'),
                active: route().current('certificates.*'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M7 3.5h8l4 4V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 3.5V8h4M9 12h6M9 15h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ),
            },
            {
                label: 'Staff accounts',
                href: route('staff.index'),
                active: route().current('staff.*'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11a3 3 0 1 0 0-6M16 14.5h1a4 4 0 0 1 4 4V20" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ),
            },
            {
                label: 'Accounts',
                href: route('users.index'),
                active: route().current('users.*'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 8v6M16 11h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ),
            },

        ],
    },
    {
        title: 'Tree Planting',
        items: [
            {
                label: 'Areas',
                href: route('areas.index'),
                active: route().current('areas.index'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M7 4.5h7l5 5V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V6A1.5 1.5 0 0 1 7.5 4.5Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 4.5V10h5M9 13h6M9 16h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ),
            },

            {
                label: 'Inventory',
                href: route('inventory.index'),
                active: route().current('inventory.index'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="m4 7 8-4 8 4-8 4-8-4Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 7v10l8 4 8-4V7M12 11v10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ),
            },

        ],
    },


    {
        title: 'Over All Reports',
        items: [

            {
                label: 'Reports',
                href: route('reports'),
                active: route().current('reports'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M6 18.5V9.5M12 18.5v-8M18 18.5v-12" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 20.5h18" strokeLinecap="round" />
                    </svg>
                ),
            },

        ],
    },
];

export default function Authenticated({ user, header, children, hideSidebar = false, hideNotifications = false }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const {
        pending_appointments_count: pendingAppointmentsCount = 0,
        pending_appointments: pendingAppointments = [],
        unread_inquiries_count: unreadInquiriesCount = 0,
        staff_active_appointments_count: staffActiveAppointmentsCount = 0,
        staff_active_appointments: staffActiveAppointments = [],
    } = usePage().props;
    const isStaff = user?.role?.toLowerCase() === 'staff';
    const isTreasury = user?.role?.toLowerCase() === 'treasury';
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const navigationGroups = isTreasury
        ? [{
            title: 'Treasury workspace',
            items: [{
                label: 'Statement of Accounts',
                href: route('treasury.statement-accounts'),
                active: route().current('treasury.statement-accounts'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ),
            }],
        }]
        : isStaff
        ? [{
            title: 'Staff workspace',
            items: [
                {
                    ...navGroups[0].items[0],
                    href: route('staff.dashboard'),
                    active: route().current('staff.dashboard'),
                },
                {
                    label: 'Assigned jobs',
                    href: route('staff.assigned-jobs'),
                    active: route().current('staff.assigned-jobs'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                            <path d="M5 7.5h14v12H5zM8 7.5V5h8v2.5M8 12h8M8 15.5h5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ),
                },
                {
                    label: 'History',
                    href: route('staff.history'),
                    active: route().current('staff.history'),
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                            <path d="M4 6.5h16M4 12h16M4 17.5h10" strokeLinecap="round" />
                            <path d="m17 16 2 2 3-3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ),
                },
            ],
        }]
        : navGroups;
    const notificationItems = isAdmin ? pendingAppointments : staffActiveAppointments;
    const notificationCount = isAdmin ? pendingAppointmentsCount : staffActiveAppointmentsCount;
    const notificationTitle = isAdmin ? 'Pending appointments' : 'My active appointments';
    const notificationIcon = (
        <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] font-bold leading-4 text-white ring-2 ring-white">
                    {notificationCount > 99 ? '99+' : notificationCount}
                </span>
            )}
        </>
    );
    const notificationControl = hideNotifications ? null : isAdmin || isStaff ? (
        <div className="relative">
            <button
                type="button"
                onClick={() => setNotificationOpen((value) => !value)}
                aria-label={notificationCount > 0 ? `${notificationCount} ${notificationTitle.toLowerCase()}` : 'Notifications'}
                aria-expanded={notificationOpen}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
            >
                {notificationIcon}
            </button>

            {notificationOpen && (
                <div className="fixed inset-x-4 top-20 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-80">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">{notificationTitle}</p>
                        <span className="text-[10px] font-semibold text-slate-400">{notificationCount} total</span>
                    </div>

                    {notificationItems.length > 0 ? (
                        <div className="max-h-72 overflow-y-auto">
                            {notificationItems.map((appointment) => (
                                <Link
                                    key={appointment.id}
                                    href={route(isAdmin ? 'appointments.index' : 'staff.assigned-jobs')}
                                    onClick={() => setNotificationOpen(false)}
                                    className="block border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-blue-50"
                                >
                                    <p className="truncate text-xs font-semibold text-slate-800">
                                        {appointment.service_category || appointment.appointment_type || 'Service request'}
                                    </p>
                                    <p className="mt-1 truncate text-[11px] text-slate-500">
                                        {appointment.user?.name || 'Resident'} - {String(appointment.status || 'pending').replace(/[_-]/g, ' ')}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="px-4 py-5 text-center text-xs text-slate-500">No active appointments.</p>
                    )}
                </div>
            )}
        </div>
    ) : (
        <button
            type="button"
            aria-label="Notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
        >
            {notificationIcon}
        </button>
    );

    return (
        <div className="admin-shell min-h-screen bg-[#f4f7fb] text-slate-700" style={{ fontFamily: '"Segoe UI Variable", "Segoe UI", Inter, sans-serif' }}>
            <div className="flex min-h-screen">
                {!hideSidebar && <aside
                    className={[
                        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-blue-900 bg-blue-950 text-white transition-transform duration-200 ease-in-out lg:relative lg:inset-auto lg:z-auto lg:translate-x-0',
                        showingNavigationDropdown ? 'translate-x-0' : '-translate-x-full',
                        'w-60',
                        sidebarOpen ? 'lg:w-60' : 'lg:w-20',
                    ].join(' ')}
                >
                    <div className="flex h-16 items-center justify-between border-b border-white/10 px-3">
                        <div className={['flex items-center gap-2 overflow-hidden transition-all', sidebarOpen || showingNavigationDropdown ? 'opacity-100' : 'opacity-0 w-0'].join(' ')}>
                            <img src="/images/opol-logo.png" alt="Municipality of Opol seal" className="h-7 w-7 rounded-full border border-white/20 bg-white object-contain" />
                            <div className="min-w-0">
                                <div className="truncate text-[7px] font-semibold uppercase tracking-[0.18em] text-blue-100">Municipal Environmental</div>
                                <div className="truncate text-[7px] font-semibold uppercase tracking-[0.18em] text-blue-100">And Natural Resources</div>
                                <div className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-white">Office LGU-OPOl</div>
                            </div>
                        </div>

                        <button
                            type="button"
                            aria-label="Toggle sidebar"
                            onClick={() => setSidebarOpen((value) => !value)}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                        >
                            <span className="sr-only">Toggle navigation</span>
                            <span className="flex w-3.5 flex-col gap-1">
                                <span className="h-0.5 w-full rounded-full bg-white" />
                                <span className="h-0.5 w-full rounded-full bg-white" />
                                <span className="h-0.5 w-full rounded-full bg-white" />
                            </span>
                        </button>
                    </div>

                    <nav className="flex-1 space-y-3 px-2 py-3">
                        {navigationGroups.map((group) => (
                            <div key={group.title} className="space-y-1.5">
                                {(sidebarOpen || showingNavigationDropdown) && (
                                    <div className="px-2 pb-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-blue-100/80">
                                        {group.title}
                                    </div>
                                )}

                                {group.items.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={[
                                            'group flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium tracking-[0.02em] transition',
                                            item.active
                                                ? 'bg-white text-blue-950 shadow-sm'
                                                : 'text-blue-50/80 hover:bg-white/10 hover:text-white',
                                            sidebarOpen || showingNavigationDropdown ? '' : 'justify-center px-1.5',
                                        ].join(' ')}
                                    >
                                        <span className={['inline-flex h-6 w-6 items-center justify-center rounded-md border border-current/20 bg-white/5 text-[10px]', sidebarOpen ? '' : 'mx-auto'].join(' ')}>
                                            {item.icon}
                                        </span>
                                        <span className={['transition-all', sidebarOpen || showingNavigationDropdown ? 'opacity-100' : 'hidden'].join(' ')}>{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </nav>

                </aside>}

                <div className="flex flex-1 flex-col">
                    <header className="border-b border-blue-100 bg-white">
                        <div className="flex h-16 items-center justify-between px-3 sm:px-4 lg:px-5">
                            <div className="flex items-center gap-2.5">
                                {!hideSidebar && <button
                                    type="button"
                                    onClick={() => setShowingNavigationDropdown((value) => !value)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 lg:hidden"
                                    aria-label="Toggle menu"
                                    aria-expanded={showingNavigationDropdown}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                        <rect x="4" y="5" width="16" height="14" rx="2" />
                                        <path d="M9 5v14" strokeLinecap="round" />
                                        <path d="M12.5 9h4M12.5 12h4M12.5 15h2.5" strokeLinecap="round" />
                                    </svg>
                                </button>}

                                {header && (
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 sm:text-sm">
                                        <span className="capitalize">{user?.role || 'User'}</span>
                                        <span className="text-slate-300">&gt;</span>
                                        <div className="text-xs font-semibold text-slate-500 sm:text-sm">{header}</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2.5">
                                {notificationControl}

                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-lg">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center rounded-full bg-white p-1.5 shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition hover:shadow-[0_8px_22px_rgba(15,23,42,0.12)]"
                                            >
                                                <img
                                                    src={
                                                        (() => {
                                                            if (isAdmin) {
                                                                return '/images/profile.jpg';
                                                            }

                                                            const rawValue =
                                                                user?.profile_picture?.image_url ||
                                                                user?.profile_picture?.image ||
                                                                user?.profile_picture?.image_path ||
                                                                user?.profilePicture?.image_url ||
                                                                user?.profilePicture?.image ||
                                                                user?.profilePicture?.image_path ||
                                                                user?.profile_picture_path ||
                                                                user?.image_path ||
                                                                '/images/profile.jpg';

                                                            if (rawValue.startsWith('http://') || rawValue.startsWith('https://') || rawValue.startsWith('/storage/')) {
                                                                return rawValue;
                                                            }

                                                            if (rawValue.startsWith('/')) {
                                                                return `/storage${rawValue}`;
                                                            }

                                                            return `/storage/${rawValue.replace(/^\/+/, '')}`;
                                                        })()
                                                    }
                                                    alt="Profile"
                                                    className="h-8 w-8 rounded-full border border-blue-200 object-cover"
                                                />
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <div className="border-b border-slate-200 px-4 py-3">
                                            <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                                            <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email || 'No email available'}</p>
                                        </div>
                                        <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-4 sm:p-5 lg:p-6">
                        <div className="mx-auto max-w-6xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

            {isAdmin && (
                <Link
                    href={route('inquiries.index')}
                    aria-label={unreadInquiriesCount > 0 ? `${unreadInquiriesCount} unread inquiries` : 'Inquiries'}
                    className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-800 text-white shadow-[0_12px_30px_rgba(30,64,175,0.3)] transition hover:-translate-y-0.5 hover:bg-blue-700 sm:bottom-7 sm:right-7"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v8a2.5 2.5 0 0 1-2.5 2.5H12l-4.5 4v-4h0A2.5 2.5 0 0 1 5 13.5v-8Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 8h8M8 11.5h5" strokeLinecap="round" />
                    </svg>
                    {unreadInquiriesCount > 0 && (
                        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 text-center text-[10px] font-bold leading-5 text-white ring-2 ring-white">
                            {unreadInquiriesCount > 99 ? '99+' : unreadInquiriesCount}
                        </span>
                    )}
                </Link>
            )}

            {showingNavigationDropdown && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setShowingNavigationDropdown(false)}
                    className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
                />
            )}
        </div>
    );
}
