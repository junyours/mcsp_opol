import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const emptyForm = {
	name: '',
	email: '',
	role: 'Staff',
	password: '',
	password_confirmation: '',
	status: 'active',
};

export default function CreateStaff({ auth, staff = [] }) {
	const [editingStaff, setEditingStaff] = useState(null);
	const { data, setData, post, put, reset, errors, processing } = useForm(emptyForm);

	const closeForm = () => {
		setEditingStaff(null);
		reset();
	};

	const openEdit = (person) => {
		setEditingStaff(person);
		setData({ ...emptyForm, name: person.name, email: person.email, role: person.role, status: person.status });
	};

	const submit = (event) => {
		event.preventDefault();
		const options = { onSuccess: closeForm };

		if (editingStaff) {
			put(route('staff.update', editingStaff.id), options);
		} else {
			post(route('staff.store'), options);
		}
	};

	return (
		<AuthenticatedLayout user={auth.user} header={<h2 className="text-lg font-bold text-slate-800">Staff accounts</h2>}>
			<Head title="Staff accounts" />

			<div className="min-h-screen bg-[#f6f8f6] py-2">
				<div className="mx-auto max-w-6xl">
					<div className="mb-7 border-b border-slate-200 pb-6">
						<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
						<div>
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Administration / Users</p>
							<h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Staff accounts</h1>
							<p className="mt-1 text-sm text-slate-500">Manage access for the MENRO operations team.</p>
						</div>
						
						</div>
					</div>

					<div className="mb-6 grid gap-3 sm:grid-cols-3">
						<div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Total staff</p><p className="mt-1 text-xl font-bold text-slate-900">{staff.length}</p></div>
						<div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Active accounts</p><p className="mt-1 text-xl font-bold text-emerald-900">{staff.filter((person) => person.status === 'active').length}</p></div>
						<div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Inactive accounts</p><p className="mt-1 text-xl font-bold text-slate-700">{staff.filter((person) => person.status === 'inactive').length}</p></div>
					</div>

					<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
						<section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_5px_16px_rgba(15,23,42,0.04)]">
							<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4">
								<div><h2 className="text-sm font-bold text-slate-900">Team directory</h2>
								<p className="mt-1 text-xs text-slate-500">{staff.length} staff account{staff.length === 1 ? '' : 's'}</p>
								</div><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">MENRO staff</span>
							</div>
							{staff.length ? (
								<div className="overflow-x-auto">
									<table className="w-full min-w-[680px] divide-y divide-slate-200 text-left">
										<thead className="bg-slate-50/80">
											<tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
												<th className="px-5 py-3">Staff member</th>
												<th className="px-5 py-3">Email address</th>
													<th className="px-5 py-3">Role</th>
												<th className="px-5 py-3">Status</th>
												<th className="px-5 py-3 text-right">Action</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-100 text-sm">
											{staff.map((person) => (
												<tr key={person.id} className="transition hover:bg-emerald-50/30">
													<td className="px-5 py-4 font-bold text-slate-900"><div className="flex items-center gap-3">{(person.profile_picture?.image_url || person.profile_picture?.image) ? <img src={person.profile_picture?.image_url || person.profile_picture?.image} alt={`${person.name} profile`} className="h-8 w-8 shrink-0 rounded-full border border-emerald-100 object-cover" /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{person.name.charAt(0).toUpperCase()}</span>}{person.name}</div></td>
													<td className="px-5 py-4 text-xs text-slate-500">{person.email}</td>
													<td className="px-5 py-4"><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{person.role}</span></td>
													<td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${person.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{person.status}</span></td>
													<td className="px-5 py-4 text-right"><button type="button" onClick={() => openEdit(person)} aria-label={`Edit ${person.name}`} title="Edit account" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M12 20h9" strokeLinecap="round" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" strokeLinecap="round" strokeLinejoin="round" /></svg></button></td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : <p className="px-5 py-12 text-center text-sm text-slate-500">No staff accounts have been created.</p>}
						</section>

						<section className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,23,42,0.04)]">
							<div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
								<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11a3 3 0 1 0 0-6M16 14.5h1a4 4 0 0 1 4 4V20" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
								<div><h2 className="text-sm font-bold text-slate-900">{editingStaff ? 'Edit account' : 'Create account'}</h2><p className="text-xs text-slate-500">Staff access only</p></div>
							</div>
							<form onSubmit={submit} className="space-y-4">
								{['name', 'email'].map((field) => <div key={field}><label htmlFor={field} className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{field}</label><input id={field} type={field === 'email' ? 'email' : 'text'} value={data[field]} onChange={(event) => setData(field, event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" required /><p className="mt-1 text-xs text-rose-600">{errors[field]}</p></div>)}
								<div><label htmlFor="role" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Role</label><select id="role" value={data.role} onChange={(event) => setData('role', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"><option value="Staff">Staff</option><option value="Treasury">Treasury</option></select><p className="mt-1 text-xs text-rose-600">{errors.role}</p></div>
								<div><label htmlFor="status" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Status</label><select id="status" value={data.status} onChange={(event) => setData('status', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
								<div><label htmlFor="password" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Password {editingStaff && <span className="font-normal normal-case tracking-normal">(leave blank to keep)</span>}</label><input id="password" type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" required={!editingStaff} /><p className="mt-1 text-xs text-rose-600">{errors.password}</p><p className="mt-1 text-[10px] text-slate-400">Use at least 8 characters.</p></div>
								<div><label htmlFor="password_confirmation" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Confirm password</label><input id="password_confirmation" type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" required={!editingStaff} /></div>
								<div className="flex gap-2 pt-2"><button type="submit" disabled={processing} className="flex-1 rounded-lg bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50">{processing ? 'Saving...' : editingStaff ? 'Save changes' : 'Create staff'}</button>{editingStaff && <button type="button" onClick={closeForm} className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>}</div>
							</form>
						</section>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
