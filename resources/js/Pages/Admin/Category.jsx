import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

export default function Category({ auth, categories = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { data, setData, post, put, reset, errors } = useForm({
        category_name: '',
        status: 'active',
    });

    const filteredCategories = categories.filter(cat =>
        cat.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (editingId) {
            put(route('categories.update', editingId), {
                onSuccess: () => {
                    reset();
                    setIsOpen(false);
                    setEditingId(null);
                },
            });
        } else {
            post(route('categories.store'), {
                onSuccess: () => {
                    reset();
                    setIsOpen(false);
                },
            });
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setData({
            category_name: category.category_name,
            status: category.status,
        });
        setIsOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            router.delete(route('categories.destroy', id));
        }
    };

    const handleOpenModal = () => {
        reset();
        setEditingId(null);
        setIsOpen(true);
    };

    const handleCloseModal = () => {
        setIsOpen(false);
        setEditingId(null);
        reset();
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Categories" />

            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-2">
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-emerald-700">
                                            <rect x="4" y="4" width="6" height="6" rx="1" />
                                            <rect x="14" y="4" width="6" height="6" rx="1" />
                                            <rect x="4" y="14" width="6" height="6" rx="1" />
                                            <rect x="14" y="14" width="6" height="6" rx="1" />
                                        </svg>
                                    </div>
                                    Categories
                                </h1>
                                <p className="text-gray-500 text-sm sm:text-base">Manage and organize your service categories with ease</p>
                            </div>
                            <button
                                onClick={handleOpenModal}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                </svg>
                                Add Category
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    {categories.length > 0 && (
                        <div className="mb-6">
                            <div className="relative">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Modal */}
                    {isOpen && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                            <div className="relative mx-auto p-0 w-full max-w-md bg-white rounded-xl shadow-2xl transform transition-all">
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 rounded-t-xl flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                            {editingId ? (
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                                            ) : (
                                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                            )}
                                        </svg>
                                        {editingId ? 'Edit Category' : 'Create New Category'}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="text-white hover:text-emerald-100 transition"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div>
                                        <InputLabel htmlFor="category_name" value="Category Name" className="text-gray-700 font-semibold mb-2 block" />
                                        <TextInput
                                            id="category_name"
                                            type="text"
                                            name="category_name"
                                            value={data.category_name}
                                            onChange={(e) => setData('category_name', e.target.value)}
                                            placeholder="Enter category name"
                                            className="mt-1 block w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            required
                                        />
                                        <InputError message={errors.category_name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="status" value="Status" className="text-gray-700 font-semibold mb-2 block" />
                                        <select
                                            id="status"
                                            name="status"
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="mt-1 block w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent px-3 py-2 border"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        <InputError message={errors.status} className="mt-2" />
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="flex gap-3 justify-end pt-4 border-t">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 font-medium transition-all"
                                        >
                                            {editingId ? 'Update' : 'Create'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    {filteredCategories.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                            {/* Desktop View */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Category Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredCategories.map((category, index) => (
                                            <tr key={category.id} className={`hover:bg-emerald-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-emerald-600">
                                                                <rect x="4" y="4" width="6" height="6" rx="1" />
                                                                <rect x="14" y="4" width="6" height="6" rx="1" />
                                                                <rect x="4" y="14" width="6" height="6" rx="1" />
                                                                <rect x="14" y="14" width="6" height="6" rx="1" />
                                                            </svg>
                                                        </div>
                                                        {category.category_name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span
                                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                                            category.status === 'active'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        <span className={`h-2 w-2 rounded-full ${category.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`} />
                                                        {category.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            onClick={() => handleEdit(category)}
                                                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(category.id)}
                                                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                                                <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                                                                <line x1="10" y1="11" x2="10" y2="17" strokeLinecap="round" strokeLinejoin="round" />
                                                                <line x1="14" y1="11" x2="14" y2="17" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View */}
                            <div className="sm:hidden divide-y divide-gray-200">
                                {filteredCategories.map((category) => (
                                    <div key={category.id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-emerald-600">
                                                        <rect x="4" y="4" width="6" height="6" rx="1" />
                                                        <rect x="14" y="4" width="6" height="6" rx="1" />
                                                        <rect x="4" y="14" width="6" height="6" rx="1" />
                                                        <rect x="14" y="14" width="6" height="6" rx="1" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{category.category_name}</p>
                                                    <span
                                                        className={`inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                                            category.status === 'active'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${category.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`} />
                                                        {category.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="flex-1 inline-flex items-center justify-center gap-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="flex-1 inline-flex items-center justify-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                                    <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <line x1="10" y1="11" x2="10" y2="17" strokeLinecap="round" strokeLinejoin="round" />
                                                    <line x1="14" y1="11" x2="14" y2="17" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
                            <div className="mb-4 flex justify-center">
                                <div className="p-4 bg-gray-100 rounded-full">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-gray-400">
                                        <rect x="4" y="4" width="6" height="6" rx="1" />
                                        <rect x="14" y="4" width="6" height="6" rx="1" />
                                        <rect x="4" y="14" width="6" height="6" rx="1" />
                                        <rect x="14" y="14" width="6" height="6" rx="1" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
                            <p className="text-gray-500 mb-6">
                                {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first category'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={handleOpenModal}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                    </svg>
                                    Create First Category
                                </button>
                            )}
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Total Categories: <span className="font-semibold text-gray-900">{filteredCategories.length}</span></p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
