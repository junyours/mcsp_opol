import { useEffect, useState } from 'react';
import Dropdown from '@/Components/Dropdown';
import { Link, router, usePage } from '@inertiajs/react';

const navGroups = [
    {
        title: 'Main',
        items: [
            {
                label: 'Dashboard',
                href: route('residents.dashboard'),
                active: route().current('residents.dashboard'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M4 13.5h7V20H4v-6.5Zm9-11h7v8h-7V2.5Zm0 11h7V20h-7v-6.5ZM4 2.5h7v8H4v-8Z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ),
            },
            {
                label: 'My Registrations',
                href: route('residents.my-appointments'),
                active: route().current('residents.my-appointments'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M6 4.5h12v15H6zM9 2.5v4M15 2.5v4M6 9h12" strokeLinecap="round" strokeLinejoin="round" /><path d="m9 13 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ),
            },

                      {
                label: 'Certification Registration',
                href: route('residents.appointments'),
                active: route().current('residents.appointments'),
                icon: (
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
  <rect x="4" y="5" width="16" height="15" rx="2" />
  <path d="M8 3v4M16 3v4M4 9h16" strokeLinecap="round" />
</svg>
                ),
            },
          
        ],
    }, 
   
];

const SidebarToggleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <rect x="3.5" y="4" width="17" height="16" rx="2" fill="currentColor" opacity="0.16" />
        <path d="M5.5 4h4v16h-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="currentColor" />
        <path d="M9.5 4v16M13 8h4M13 12h4M13 16h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="3.5" y="4" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
);

export default function ResidentsLayout({ user, header, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const {
        resident_notifications_count: notificationCount = 0,
        resident_notifications: notifications = [],
    } = usePage().props;

    useEffect(() => {
        const refreshNotifications = () => {
            router.reload({
                only: ['resident_notifications_count', 'resident_notifications'],
                preserveState: true,
                preserveScroll: true,
            });
        };

        const interval = window.setInterval(refreshNotifications, 10000);

        return () => window.clearInterval(interval);
    }, []);

    const markNotificationRead = (notificationId) => {
        router.post(route('notifications.read', notificationId), {}, {
            preserveScroll: true,
        });
    };

    const markAllNotificationsRead = () => {
        router.post(route('notifications.read-all'), {}, {
            preserveScroll: true,
        });
    };

    return (
        <div className="relative min-h-screen bg-[#f5f8fc] text-slate-700" style={{ fontFamily: '"Segoe UI Variable", "Segoe UI", Inter, sans-serif' }}>
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar overlay"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[1px] lg:hidden"
                />
            )}

            <div className="flex min-h-screen flex-col lg:flex-row">
                <aside
                    className={[
                        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-blue-300/60 bg-gradient-to-b from-[#3d83ee] via-[#2869df] to-[#1f55c7] text-slate-800 shadow-[8px_0_24px_rgba(30,64,175,0.12)] transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0',
                        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0',
                        sidebarOpen ? 'w-60' : 'w-60 lg:w-20',
                    ].join(' ')}
                >
                    <div className="flex h-16 items-center justify-between border-b border-white/20 px-3">
                        <div className={['flex items-center gap-2 overflow-hidden transition-all', sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'].join(' ')}>
                            <img src="/images/opol-logo.png" alt="Municipality of Opol seal" className="h-7 w-7 rounded-full border border-blue-200 bg-white object-contain" />
                            <div className="min-w-0">
                                <div className="truncate text-[7px] font-semibold uppercase tracking-[0.18em] text-blue-950/75">Municipal Environment</div>
                                <div className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-blue-950">Opol</div>
                            </div>
                        </div>

                        <button
                            type="button"
                            aria-label="Toggle sidebar"
                            onClick={() => setSidebarOpen((value) => !value)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/70 bg-white text-blue-800 shadow-[0_4px_12px_rgba(30,64,175,0.18)] transition hover:bg-blue-50"
                        >
                            <span className="sr-only">Toggle navigation</span>
                            <SidebarToggleIcon />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-5 px-2 py-4">
                        {navGroups.map((group) => (
                            <div key={group.title} className="space-y-1.5">
                                {sidebarOpen && (
                                    <div className="px-2 pb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-950/70">
                                        {group.title}
                                    </div>
                                )}

                                {group.items.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        title={sidebarOpen ? undefined : item.label}
                                        aria-label={sidebarOpen ? undefined : item.label}
                                        className={[
                                            'group flex min-h-10 items-center gap-2 rounded-xl px-2 py-2 text-[11px] font-semibold tracking-[0.01em] transition-all',
                                            item.active
                                                ? 'bg-white text-blue-900 shadow-[0_6px_16px_rgba(30,64,175,0.2)]'
                                                : 'text-blue-950/80 hover:bg-white/25 hover:text-blue-950',
                                            sidebarOpen ? '' : 'justify-center px-1.5',
                                        ].join(' ')}
                                    >
                                        <span className={[
                                            'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] transition-colors',
                                            item.active ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-white/25 bg-white/15 text-blue-950/80 group-hover:bg-white/30',
                                            sidebarOpen ? '' : 'mx-auto',
                                        ].join(' ')}>
                                            {item.icon}
                                        </span>
                                        <span className={['transition-all', sidebarOpen ? 'opacity-100' : 'hidden'].join(' ')}>{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </nav>

                    {sidebarOpen && (
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            className="absolute right-3 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white/70 text-blue-900 hover:bg-white lg:hidden"
                            aria-label="Close sidebar"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}

                </aside>

                <div className="flex flex-1 flex-col">
                    <header className="relative z-[60] border-b border-blue-100 bg-white/90 backdrop-blur-sm">
                        <div className="flex h-16 items-center justify-between px-3 sm:px-4 lg:px-5">
                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen(true)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 lg:hidden"
                                    aria-label="Toggle menu"
                                >
                                    <SidebarToggleIcon />
                                </button>

                                {header && <div className="text-base font-semibold text-slate-800 sm:text-lg">{header}</div>}
                            </div>

                            <div className="flex items-center gap-2.5">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNotificationOpen((value) => !value);
                                            router.reload({
                                                only: ['resident_notifications_count', 'resident_notifications'],
                                                preserveState: true,
                                                preserveScroll: true,
                                            });
                                        }}
                                        aria-label={notificationCount > 0 ? `${notificationCount} notifications` : 'Notifications'}
                                        aria-expanded={notificationOpen}
                                        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        {notificationCount > 0 && (
                                            <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] font-bold leading-4 text-white ring-2 ring-white">
                                                {notificationCount > 99 ? '99+' : notificationCount}
                                            </span>
                                        )}
                                    </button>

                                    {notificationOpen && (
                                        <div className="fixed inset-x-4 top-20 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-80">
                                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">Notifications</p>
                                                {notificationCount > 0 && (
                                                    <button type="button" onClick={markAllNotificationsRead} className="text-[10px] font-semibold text-blue-600 hover:text-blue-800">
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>

                                            {notifications.length > 0 ? (
                                                <div className="max-h-80 overflow-y-auto">
                                                    {notifications.map((notification) => (
                                                        <Link
                                                            key={notification.id}
                                                            href={route('residents.my-appointments')}
                                                            onClick={() => {
                                                                markNotificationRead(notification.id);
                                                                setNotificationOpen(false);
                                                            }}
                                                            className="block border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-blue-50"
                                                        >
                                                                <div className="flex items-center gap-2">
                                                                    {notification.data?.status === 'rejected' && (
                                                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600" aria-label="Rejected">
                                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3" aria-hidden="true">
                                                                                <path d="M7 7l10 10M17 7L7 17" strokeLinecap="round" />
                                                                            </svg>
                                                                        </span>
                                                                    )}
                                                                    <p className="text-xs font-semibold text-slate-800">{notification.data?.title || 'Notification'}</p>
                                                                </div>
                                                                {notification.data?.assigned_staff && (
                                                                    <p className="mt-1 text-[11px] font-semibold text-blue-700">Assigned staff: {notification.data.assigned_staff}</p>
                                                                )}
                                                            <p className="mt-1 text-[11px] leading-4 text-slate-500">{notification.data?.message}</p>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="px-4 py-5 text-center text-xs text-slate-500">No new notifications.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-lg">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center rounded-full bg-white p-1.5 shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition hover:shadow-[0_8px_22px_rgba(15,23,42,0.12)]"
                                            >
                                                <img
                                                    src="/images/profile.jpg"
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

            <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' border-t border-blue-100 bg-white p-4 sm:hidden'}>
                <div className="space-y-3">
                    {navGroups.map((group) => (
                        <div key={group.title} className="space-y-2">
                            <div className="px-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">{group.title}</div>
                            {group.items.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={[
                                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium',
                                        item.active ? 'bg-blue-50 text-blue-700' : 'text-slate-700',
                                    ].join(' ')}
                                >
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    ))}
                    <Link href={route('logout')} method="post" as="button" className="mt-2 block w-full rounded-xl bg-slate-900 px-3 py-2 text-left text-sm font-medium text-white">
                        Log Out
                    </Link>
                </div>
            </div>
        </div>
    );
}
