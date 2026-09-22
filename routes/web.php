<?php

use App\Http\Controllers\AreaController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\TreePlantingAppointmentController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$adminAnalytics = function () {
    $appointments = \App\Models\TreePlantingAppointment::query()
        ->with(['user:id,name', 'area:id,location_name', 'assignee:id,name'])
        ->withCount('members')
        ->latest()
        ->get();
    $inventoryRequests = \App\Models\InventoryRequest::query()
        ->with(['seedling:id,name,unit', 'appointment:id,area_id,area_name', 'appointment.area:id,location_name'])
        ->latest()
        ->get();
    $seedlings = \App\Models\Seedling::query()->orderBy('name')->get(['id', 'name', 'unit', 'quantity']);
    $areas = \App\Models\Area::query()->withCount('appointments')->orderBy('location_name')->get(['id', 'location_name', 'area_type', 'status']);
    $requirementsCount = \App\Models\Requirement::query()->count();
    $monthStart = now()->startOfYear();

    $months = collect(range(0, 11))->map(function ($offset) use ($monthStart, $appointments) {
        $month = $monthStart->copy()->addMonths($offset);
        $monthAppointments = $appointments->filter(fn ($appointment) => $appointment->created_at?->isSameMonth($month));

        return [
            'label' => $month->format('M'),
            'full_label' => $month->format('F Y'),
            'total' => $monthAppointments->count(),
            'completed' => $monthAppointments->whereIn('status', ['completed', 'done'])->count(),
        ];
    })->values();

    $statusCounts = $appointments->groupBy(fn ($appointment) => strtolower($appointment->status ?: 'pending'))
        ->map->count()->sortDesc();
    $serviceCounts = $appointments->groupBy(fn ($appointment) => $appointment->service_category ?: 'Unspecified')
        ->map->count()->sortDesc();
    $typeCounts = $appointments->groupBy(fn ($appointment) => ucfirst($appointment->appointment_type ?: 'Unknown'))
        ->map->count()->sortDesc();
    $plantedRequests = $inventoryRequests->where('status', 'approved');
    $plantedByArea = $plantedRequests->groupBy(function ($request) {
        return $request->appointment?->area?->location_name
            ?: $request->appointment?->area_name
            ?: 'Area not specified';
    })->map(function ($requests, $area) {
        return [
            'area' => $area,
            'trees' => $requests->sum('quantity'),
            'requests' => $requests->count(),
            'seedlings' => $requests->groupBy(fn ($request) => $request->seedling?->name ?: 'Unknown')
                ->map(fn ($items, $name) => ['name' => $name, 'quantity' => $items->sum('quantity')])
                ->sortByDesc('quantity')->values(),
        ];
    })->sortByDesc('trees')->values();

    return [
        'summary' => [
            'appointments' => $appointments->count(),
            'pending' => $appointments->whereIn('status', ['pending', 'onprocess'])->count(),
            'completed' => $appointments->whereIn('status', ['completed', 'done'])->count(),
            'residents' => $appointments->pluck('user_id')->filter()->unique()->count(),
            'members' => $appointments->sum('members_count'),
            'requirements' => $requirementsCount,
            'inventory_pending' => $inventoryRequests->where('status', 'pending')->count(),
            'seedlings' => $seedlings->sum('quantity'),
            'planted_trees' => $plantedRequests->sum('quantity'),
        ],
        'months' => $months,
        'status_counts' => $statusCounts,
        'service_counts' => $serviceCounts,
        'type_counts' => $typeCounts,
        'recent_appointments' => $appointments->take(8)->map(fn ($appointment) => [
            'id' => $appointment->id,
            'service' => $appointment->service_category ?: 'Unspecified',
            'status' => $appointment->status ?: 'pending',
            'location' => $appointment->area?->location_name ?: $appointment->area_name ?: 'Location not specified',
            'requester' => $appointment->user?->name ?: $appointment->organization_name ?: 'Resident request',
            'created_at' => $appointment->created_at?->format('M d, Y'),
        ])->values(),
        'staff_performance' => $appointments->filter(fn ($appointment) => $appointment->assignee)
            ->groupBy('assigned_to')->map(function ($staffAppointments) {
                $staff = $staffAppointments->first()->assignee;

                return [
                    'name' => $staff->name,
                    'assigned' => $staffAppointments->count(),
                    'completed' => $staffAppointments->whereIn('status', ['completed', 'done'])->count(),
                ];
            })->values(),
        'inventory' => [
            'pending' => $inventoryRequests->where('status', 'pending')->count(),
            'approved' => $inventoryRequests->where('status', 'approved')->count(),
            'rejected' => $inventoryRequests->where('status', 'rejected')->count(),
            'requested_quantity' => $inventoryRequests->sum('quantity'),
            'available_quantity' => $seedlings->sum('quantity'),
            'top_seedlings' => $inventoryRequests->groupBy(fn ($request) => $request->seedling?->name ?: 'Unknown')
                ->map(fn ($requests, $name) => ['name' => $name, 'quantity' => $requests->sum('quantity')])
                ->sortByDesc('quantity')->take(5)->values(),
        ],
            'planted_by_area' => $plantedByArea,
        'areas' => $areas->map(fn ($area) => [
            'name' => $area->location_name,
            'type' => $area->area_type,
            'status' => $area->status,
            'appointments' => $area->appointments_count,
        ])->values(),
    ];
};

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

Route::get('/contact', function () {
    return Inertia::render('Contact', [
        'turnstileSiteKey' => config('services.turnstile.site_key'),
    ]);
})->name('contact');

Route::post('/contact/inquiries', [InquiryController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('contact.inquiries.store');

Route::get('/dashboard', function () use ($adminAnalytics) {
    $analytics = $adminAnalytics();

    return Inertia::render('Dashboard', ['analytics' => $analytics]);
})->middleware(['auth', 'verified', 'admin'])->name('dashboard');

Route::get('/reports', function () use ($adminAnalytics) {
    return Inertia::render('Reports', ['analytics' => $adminAnalytics()]);
})->middleware(['auth', 'verified', 'admin'])->name('reports');

Route::get('/residents/dashboard', function () {
    return Inertia::render('Residents/ResidentsDashboard');
})->middleware(['auth', 'verified'])->name('residents.dashboard');

Route::get('/staff/dashboard', function () {
    $appointments = \App\Models\TreePlantingAppointment::query()
        ->where('assigned_to', request()->user()->id)
        ->with(['user:id,name,email', 'area:id,location_name', 'members:id,appointment_id,address'])
        ->with(['assignee:id,name,email', 'assignee.profilePicture:id,user_id,image'])
        ->withCount('members')
        ->latest()
        ->get();

    return Inertia::render('Staff/StaffDashboard', [
        'appointments' => $appointments,
    ]);
})->middleware(['auth', 'verified', 'staff'])->name('staff.dashboard');

Route::get('/staff/assigned-jobs', function () {
    $appointments = \App\Models\TreePlantingAppointment::query()
        ->where('assigned_to', request()->user()->id)
        ->with(['user:id,name,email', 'area:id,location_name'])
        ->with(['assignee:id,name,email', 'assignee.profilePicture:id,user_id,image', 'inventoryRequests.seedling:id,name,unit,quantity', 'members'])
        ->withCount('members')
        ->latest()
        ->get();

    return Inertia::render('Staff/AssignedJobs', [
        'appointments' => $appointments,
        'seedlings' => \App\Models\Seedling::query()->where('quantity', '>', 0)->orderBy('name')->get(['id', 'name', 'unit', 'quantity']),
    ]);
})->middleware(['auth', 'verified', 'staff'])->name('staff.assigned-jobs');

Route::get('/staff/history', function () {
    $appointments = \App\Models\TreePlantingAppointment::query()
        ->where('assigned_to', request()->user()->id)
        ->whereIn('status', ['approved', 'completed'])
        ->with(['user:id,name,email', 'area:id,location_name'])
        ->with(['assignee:id,name,email', 'assignee.profilePicture:id,user_id,image', 'inventoryRequests.seedling:id,name,unit,quantity', 'members'])
        ->withCount('members')
        ->latest()
        ->get();

    return Inertia::render('Staff/AssignedJobs', [
        'appointments' => $appointments,
        'historyOnly' => true,
        'seedlings' => \App\Models\Seedling::query()->where('quantity', '>', 0)->orderBy('name')->get(['id', 'name', 'unit', 'quantity']),
    ]);
})->middleware(['auth', 'verified', 'staff'])->name('staff.history');

Route::get('/treasury/statement-of-accounts', function () {
    return Inertia::render('treasury/StatementOfAccounts', [
        'appointments' => \App\Models\TreePlantingAppointment::query()
            ->with(['user:id,name,email', 'area:id,location_name'])
            ->latest()
            ->get(),
    ]);
})->middleware(['auth', 'verified', 'treasury'])->name('treasury.statement-accounts');

Route::patch('/treasury/appointments/{appointment}/confirm', [TreePlantingAppointmentController::class, 'approve'])
    ->middleware(['auth', 'verified', 'treasury'])
    ->name('treasury.appointments.confirm');
Route::patch('/treasury/appointments/{appointment}/reject', [TreePlantingAppointmentController::class, 'decline'])
    ->middleware(['auth', 'verified', 'treasury'])
    ->name('treasury.appointments.reject');

Route::get('/residents/appointments', function () {
    return Inertia::render('Residents/ResidentsAppointment', [
        'areas' => \App\Models\Area::query()
            ->where('status', 'active')
            ->orderBy('location_name')
            ->get(['id', 'location_name', 'area_type', 'corners']),
    ]);
})->middleware(['auth', 'verified'])->name('residents.appointments');

Route::get('/appointments/public/{token}', [TreePlantingAppointmentController::class, 'publicForm'])
    ->name('appointments.public');
Route::post('/appointments/public/{token}/members', [TreePlantingAppointmentController::class, 'storePublicMember'])
    ->name('appointments.public.members.store');

Route::middleware('auth')->group(function () {
    Route::post('/appointments', [TreePlantingAppointmentController::class, 'store'])->name('appointments.store');
    Route::post('/appointments/{appointment}/requirements', [TreePlantingAppointmentController::class, 'storeRequirements'])->name('appointments.requirements.store');
    Route::delete('/appointments/{appointment}/requirements', [TreePlantingAppointmentController::class, 'deleteRequirements'])->name('appointments.requirements.destroy');
    Route::get('/residents/my-appointments', [TreePlantingAppointmentController::class, 'mine'])->name('residents.my-appointments');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::get('/appointments/{appointment}/certificate/view', [TreePlantingAppointmentController::class, 'certificate'])->name('appointments.certificate.view');
    Route::post('/inventory/requests', [InventoryController::class, 'storeRequest'])->middleware('staff')->name('inventory.requests.store');
    Route::patch('/appointments/{appointment}/staff-approve', [TreePlantingAppointmentController::class, 'staffApprove'])->middleware('staff')->name('appointments.staff-approve');
    Route::patch('/appointments/{appointment}/staff-decline', [TreePlantingAppointmentController::class, 'staffDecline'])->middleware('staff')->name('appointments.staff-decline');
    Route::patch('/appointments/{appointment}/staff-complete', [TreePlantingAppointmentController::class, 'staffComplete'])->middleware('staff')->name('appointments.staff-complete');
    Route::post('/appointments/{appointment}/members/scan-attendance', [TreePlantingAppointmentController::class, 'scanMemberAttendance'])->middleware(['auth', 'verified'])->name('appointments.members.scan-attendance');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/areas', [AreaController::class, 'index'])->name('areas.index');
    Route::post('/areas', [AreaController::class, 'store'])->name('areas.store');

    Route::get('/appointments', [TreePlantingAppointmentController::class, 'index'])->name('appointments.index');
    Route::post('/appointments/manual', [TreePlantingAppointmentController::class, 'storeAdmin'])->name('appointments.manual.store');
    Route::get('/users', [\App\Http\Controllers\ResidentController::class, 'index'])->name('users.index');
    Route::post('/users', [\App\Http\Controllers\ResidentController::class, 'store'])->name('residents.store');
    Route::patch('/users/{user}', [\App\Http\Controllers\ResidentController::class, 'update'])->name('residents.update');
    Route::delete('/users/{user}', [\App\Http\Controllers\ResidentController::class, 'destroy'])->name('residents.destroy');
    Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');
    Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');
    Route::put('/staff/{user}', [StaffController::class, 'update'])->name('staff.update');
    Route::patch('/appointments/{appointment}/assign', [TreePlantingAppointmentController::class, 'assign'])->name('appointments.assign');
    Route::patch('/appointments/{appointment}/start-process', [TreePlantingAppointmentController::class, 'startProcess'])->name('appointments.start-process');
    Route::patch('/appointments/{appointment}/schedule', [TreePlantingAppointmentController::class, 'schedule'])->name('appointments.schedule');
    Route::patch('/appointments/{appointment}/remarks', [TreePlantingAppointmentController::class, 'remarks'])->name('appointments.remarks');
    Route::patch('/appointments/{appointment}/approve', [TreePlantingAppointmentController::class, 'approve'])->name('appointments.approve');
    Route::patch('/appointments/{appointment}/decline', [TreePlantingAppointmentController::class, 'decline'])->name('appointments.decline');
    Route::get('/appointments/{appointment}/members', [TreePlantingAppointmentController::class, 'members'])->name('appointments.members');
    Route::delete('/appointments/{appointment}/members/{memberId}', [TreePlantingAppointmentController::class, 'deleteMember'])->name('appointments.members.destroy');
    Route::post('/appointments/{appointment}/certificate', [TreePlantingAppointmentController::class, 'uploadCertificate'])->name('appointments.certificate.store');
    Route::get('/certificates', [TreePlantingAppointmentController::class, 'certificateFiles'])->name('certificates.index');
    Route::get('/inquiries', [InquiryController::class, 'index'])->name('inquiries.index');
    Route::get('/inquiries/{inquiry}', [InquiryController::class, 'show'])->name('inquiries.show');

    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory/seedlings', [InventoryController::class, 'storeSeedling'])->name('inventory.seedlings.store');
    Route::post('/inventory/stock', [InventoryController::class, 'storeMovement'])->name('inventory.stock.store');
    Route::patch('/inventory/requests/{inventoryRequest}/approve', [InventoryController::class, 'approveRequest'])->name('inventory.requests.approve');
    Route::patch('/inventory/requests/{inventoryRequest}/reject', [InventoryController::class, 'rejectRequest'])->name('inventory.requests.reject');

    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
});

require __DIR__.'/auth.php';
