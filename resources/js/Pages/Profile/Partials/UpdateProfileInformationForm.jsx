import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { useEffect, useState } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    profilePicture,
    className = '',
}) {
    const { auth } = usePage().props;
    const user = auth.user;

    const [picturePreview, setPicturePreview] = useState(
        profilePicture || null
    );

    const [pictureError, setPictureError] = useState('');

    const {
        data,
        setData,
        errors,
        processing,
        recentlySuccessful,
    } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        profile_picture: null,
    });

    /*
    |--------------------------------------------------------------------------
    | Keep profile picture synchronized with Laravel/Inertia
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        if (profilePicture) {
            setPicturePreview(profilePicture);
        }
    }, [profilePicture]);

    /*
    |--------------------------------------------------------------------------
    | Select profile picture
    |--------------------------------------------------------------------------
    */
    const handlePictureChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        console.log('Profile picture selected:', {
            name: file.name,
            type: file.type,
            size: file.size,
        });

        if (!file.type.startsWith('image/')) {
            setPictureError('Please choose an image file.');
            return;
        }

        if (file.size > 6 * 1024 * 1024) {
            setPictureError(
                'Please choose an image smaller than 6 MB.'
            );
            return;
        }

        setData('profile_picture', file);

        const previewUrl = URL.createObjectURL(file);

        setPicturePreview(previewUrl);
        setPictureError('');
    };

    /*
    |--------------------------------------------------------------------------
    | Submit profile
    |--------------------------------------------------------------------------
    */
    const submit = (event) => {
        event.preventDefault();

        const payload = new FormData();

        payload.append('_method', 'PATCH');
        payload.append('name', data.name);
        payload.append('email', data.email);

        if (data.profile_picture) {
            payload.append(
                'profile_picture',
                data.profile_picture
            );
        }

        console.log('Submitting profile update:', {
            name: data.name,
            email: data.email,
            hasProfilePicture: !!data.profile_picture,
            profilePictureName:
                data.profile_picture?.name || null,
            profilePictureSize:
                data.profile_picture?.size || null,
            profilePictureType:
                data.profile_picture?.type || null,
        });

        router.post(
            route('profile.update'),
            payload,
            {
                forceFormData: true,
                preserveScroll: true,

                onSuccess: () => {
                    console.log(
                        'Profile update successful'
                    );
                },

                onError: (responseErrors) => {
                    console.error(
                        'Profile update errors:',
                        responseErrors
                    );
                },

                onFinish: () => {
                    console.log(
                        'Profile update request finished'
                    );
                },
            }
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Image load error
    |--------------------------------------------------------------------------
    */
    const handleImageError = (event) => {
        console.error(
            'Profile image failed to load:',
            event.currentTarget.src
        );

        setPictureError(
            'Unable to load the profile picture.'
        );

        event.currentTarget.style.display = 'none';
    };

    return (
        <section className={className}>
            <header className="border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />

                    <h2 className="text-lg font-bold tracking-tight text-slate-800">
                        Profile information
                    </h2>
                </div>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                    Keep your contact details and profile photo up to date.
                </p>
            </header>

            <form
                onSubmit={submit}
                className="mt-6 space-y-6"
            >
                {/* PROFILE PICTURE */}
                <div className="flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-blue-100 shadow-sm">
                        {picturePreview ? (
                            <img
                                src={picturePreview}
                                alt={`${user?.name || 'User'} profile`}
                                className="h-full w-full object-cover"
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-blue-700">
                                {user?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            Profile photo
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Choose an image from your device or gallery.
                            JPG, PNG, GIF, or WebP up to 6 MB.
                        </p>

                        <label
                            htmlFor="profile_picture"
                            className="mt-3 inline-flex cursor-pointer items-center rounded-lg bg-blue-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-950"
                        >
                            Choose photo

                            <input
                                id="profile_picture"
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="sr-only"
                                onChange={handlePictureChange}
                            />
                        </label>

                        {(pictureError ||
                            errors.profile_picture) && (
                            <p className="mt-2 text-xs text-rose-600">
                                {pictureError ||
                                    errors.profile_picture}
                            </p>
                        )}
                    </div>
                </div>

                {/* NAME AND EMAIL */}
                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <InputLabel
                            htmlFor="name"
                            value="Name"
                        />

                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(event) =>
                                setData(
                                    'name',
                                    event.target.value
                                )
                            }
                            required
                            isFocused
                            autoComplete="name"
                        />

                        <InputError
                            className="mt-2"
                            message={errors.name}
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="email"
                            value="Email"
                        />

                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            value={data.email}
                            onChange={(event) =>
                                setData(
                                    'email',
                                    event.target.value
                                )
                            }
                            required
                            autoComplete="username"
                        />

                        <InputError
                            className="mt-2"
                            message={errors.email}
                        />
                    </div>
                </div>

                {/* EMAIL VERIFICATION */}
                {mustVerifyEmail &&
                    user.email_verified_at === null && (
                        <div>
                            <p className="mt-2 text-sm text-gray-800">
                                Your email address is unverified.

                                <Link
                                    href={route(
                                        'verification.send'
                                    )}
                                    method="post"
                                    as="button"
                                    className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Click here to re-send the verification email.
                                </Link>
                            </p>

                            {status ===
                                'verification-link-sent' && (
                                <div className="mt-2 text-sm font-medium text-green-600">
                                    A new verification link has been sent to your email address.
                                </div>
                            )}
                        </div>
                    )}

                {/* SAVE BUTTON */}
                <div className="flex items-center gap-4">
                    <PrimaryButton
                        className="bg-blue-800 hover:bg-blue-950 focus:bg-blue-950 focus:ring-blue-500"
                        disabled={processing}
                    >
                        {processing
                            ? 'Saving...'
                            : 'Save changes'}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}