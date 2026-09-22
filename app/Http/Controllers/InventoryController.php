<?php

namespace App\Http\Controllers;

use App\Models\Seedling;
use App\Models\SeedlingStockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index()
    {
        $seedlings = Seedling::with('user')
            ->latest()
            ->get()
            ->map(function ($seedling) {
                return [
                    'id' => $seedling->id,
                    'name' => $seedling->name,
                    'scientific_name' => $seedling->scientific_name,
                    'category' => $seedling->category,
                    'quantity' => (int) $seedling->quantity,
                    'unit' => $seedling->unit,
                    'supplier' => $seedling->supplier,
                    'user_name' => $seedling->user?->name,
                    'updated_at' => $seedling->updated_at?->format('M d, Y h:i A'),
                ];
            });

        $history = SeedlingStockMovement::with(['seedling', 'user'])
            ->latest()
            ->get()
            ->map(function ($movement) {
                return [
                    'id' => $movement->id,
                    'seedling_name' => $movement->seedling?->name,
                    'movement_type' => $movement->movement_type,
                    'quantity' => (int) $movement->quantity,
                    'user_name' => $movement->user?->name,
                    'notes' => $movement->notes,
                    'created_at' => $movement->created_at?->format('M d, Y h:i A'),
                ];
            });

        $inventoryRequests = \App\Models\InventoryRequest::with([
            'appointment:id,service_category',
            'seedling:id,name,unit,quantity',
            'requester:id,name',
        ])->latest()->get();

        $stockInTotal = SeedlingStockMovement::where('movement_type', 'stock_in')->sum('quantity');
        $stockOutTotal = SeedlingStockMovement::where('movement_type', 'stock_out')->sum('quantity');

        return Inertia::render('Admin/Inventory', [
            'auth' => [
                'user' => auth()->user(),
            ],
            'seedlings' => $seedlings,
            'history' => $history,
            'inventoryRequests' => $inventoryRequests,
            'totals' => [
                'seedlings' => $seedlings->count(),
                'available_stock' => $seedlings->sum('quantity'),
                'stock_in' => $stockInTotal,
                'stock_out' => $stockOutTotal,
            ],
        ]);
    }

    public function storeRequest(Request $request)
    {
        $appointment = \App\Models\TreePlantingAppointment::query()
            ->where('id', $request->integer('appointment_id'))
            ->where('assigned_to', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'appointment_id' => ['required', 'exists:tree_planting_appointments,id'],
            'seedling_id' => ['required', 'exists:seedlings,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        \App\Models\InventoryRequest::create([
            ...$validated,
            'requested_by' => $request->user()->id,
            'status' => 'pending',
        ]);

        return back()->with('success', "Inventory request submitted for appointment #{$appointment->id}.");
    }

    public function approveRequest(Request $request, \App\Models\InventoryRequest $inventoryRequest)
    {
        DB::transaction(function () use ($request, $inventoryRequest) {
            $inventoryRequest = \App\Models\InventoryRequest::query()
                ->lockForUpdate()
                ->findOrFail($inventoryRequest->id);

            if ($inventoryRequest->status !== 'pending') {
                throw ValidationException::withMessages(['request' => 'This inventory request has already been reviewed.']);
            }

            $seedling = Seedling::query()->lockForUpdate()->findOrFail($inventoryRequest->seedling_id);
            if ($seedling->quantity < $inventoryRequest->quantity) {
                throw ValidationException::withMessages(['request' => "Insufficient {$seedling->name} stock for this request."]);
            }

            $seedling->decrement('quantity', $inventoryRequest->quantity);
            SeedlingStockMovement::create([
                'seedling_id' => $seedling->id,
                'user_id' => $request->user()->id,
                'movement_type' => 'stock_out',
                'quantity' => $inventoryRequest->quantity,
                'notes' => "Approved inventory request #{$inventoryRequest->id} for appointment #{$inventoryRequest->appointment_id}",
            ]);

            $inventoryRequest->update([
                'status' => 'approved',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        });

        return back()->with('success', 'Inventory request approved and stock was deducted.');
    }

    public function rejectRequest(Request $request, \App\Models\InventoryRequest $inventoryRequest)
    {
        $validated = $request->validate(['review_notes' => ['nullable', 'string', 'max:500']]);

        if ($inventoryRequest->status !== 'pending') {
            throw ValidationException::withMessages(['request' => 'This inventory request has already been reviewed.']);
        }

        $inventoryRequest->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_notes' => $validated['review_notes'] ?? null,
        ]);

        return back()->with('success', 'Inventory request rejected.');
    }

    public function storeSeedling(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'scientific_name' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:0'],
            'unit' => ['required', 'string', 'max:50'],
            'supplier' => ['nullable', 'string', 'max:255'],
        ]);

        Seedling::create([
            'user_id' => auth()->id(),
            'name' => $validated['name'],
            'scientific_name' => $validated['scientific_name'] ?? null,
            'category' => $validated['category'],
            'quantity' => $validated['quantity'],
            'unit' => $validated['unit'],
            'supplier' => $validated['supplier'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Seedling added successfully.');
    }

    public function storeMovement(Request $request)
    {
        $validated = $request->validate([
            'seedling_id' => ['required', 'exists:seedlings,id'],
            'movement_type' => ['required', 'in:stock_in,stock_out'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $seedling = Seedling::findOrFail($validated['seedling_id']);

        DB::transaction(function () use ($seedling, $validated) {
            if ($validated['movement_type'] === 'stock_out' && $seedling->quantity < $validated['quantity']) {
                throw new \InvalidArgumentException('Insufficient stock available for stock out.');
            }

            if ($validated['movement_type'] === 'stock_in') {
                $seedling->quantity += $validated['quantity'];
            } else {
                $seedling->quantity -= $validated['quantity'];
            }

            $seedling->save();

            SeedlingStockMovement::create([
                'seedling_id' => $seedling->id,
                'user_id' => auth()->id(),
                'movement_type' => $validated['movement_type'],
                'quantity' => $validated['quantity'],
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return redirect()->back()->with('success', 'Stock updated successfully.');
    }
}
