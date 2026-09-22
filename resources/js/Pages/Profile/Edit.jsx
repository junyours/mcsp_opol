import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';

export default function Edit({
    auth,
    mustVerifyEmail,
    status,
    profilePicture,
}) {
    console.log('Profile page data:', {
        profilePicture,
        user: auth?.user,
    });

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<span>Account settings</span>}
        >
            <Head title="Profile" />

            <div className="py-5 sm:py-8">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">

                    {/* PAGE HEADER */}
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-700">
                                Personal workspace
                            </p>

                            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                Profile &amp; account
                            </h1>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                Manage how your information appears across the MENRO operations portal.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            Account active
                        </div>
                    </div>

                    {/* PROFILE SUMMARY */}
                    <div className="relative mb-5 overflow-hidden rounded-2xl bg-blue-950 px-5 py-5 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)] sm:px-7 sm:py-6">

                        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-4">

                                {/* PROFILE IMAGE */}
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/30 bg-blue-800 shadow-lg">

                                    {profilePicture ? (
                                        <img
                                            src={profilePicture}
                                            alt={`${auth.user.name}'s profile`}
                                            className="h-full w-full object-cover"
                                            onError={(event) => {
                                                console.error(
                                                    'Header profile image failed:',
                                                    event.currentTarget.src
                                                );

                                                event.currentTarget.style.display =
                                                    'none';

                                                const fallback =
                                                    event.currentTarget
                                                        .nextElementSibling;

                                                if (fallback) {
                                                    fallback.classList.remove(
                                                        'hidden'
                                                    );
                                                }
                                            }}
                                        />
                                    ) : null}

                                    <div
                                        className={`flex h-full w-full items-center justify-center text-xl font-bold text-blue-100 ${
                                            profilePicture
                                                ? 'hidden'
                                                : ''
                                        }`}
                                    >
                                        {auth.user.name
                                            ?.charAt(0)
                                            ?.toUpperCase() || 'U'}
                                    </div>
                                </div>

                                {/* USER INFORMATION */}
                                <div>
                                    <p className="text-lg font-bold tracking-tight">
                                        {auth.user.name}
                                    </p>

                                    <p className="mt-0.5 text-sm text-blue-100">
                                        {auth.user.email}
                                    </p>
                                </div>
                            </div>

                            {/* ROLE */}
                            <span className="w-fit rounded-full border border-blue-300/30 bg-blue-900/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100">
                                {auth.user.role || 'User'} account
                            </span>
                        </div>

                        {/* DECORATIVE SHAPES */}
                        <div className="absolute -right-8 -top-16 h-44 w-44 rounded-full border-[18px] border-blue-900/70" />

                        <div className="absolute -bottom-20 right-28 h-36 w-36 rounded-full border-[14px] border-blue-800/50" />
                    </div>

                    {/* ACCOUNT SECTIONS */}
                    <div className="space-y-5">

                        {/* PROFILE INFORMATION */}
                        <div className="border border-blue-100 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] sm:rounded-2xl sm:p-8">

                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                profilePicture={profilePicture}
                                className="max-w-2xl"
                            />

                        </div>

                        {/* PASSWORD */}
                        <div className="border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] sm:rounded-2xl sm:p-8">

                            <UpdatePasswordForm
                                className="max-w-xl"
                            />

                        </div>

                        {/* DELETE ACCOUNT */}
                        <div className="border border-rose-100 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] sm:rounded-2xl sm:p-8">

                            <DeleteUserForm
                                className="max-w-xl"
                            />

                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}