<?php

namespace App\Http\Controllers;

use App\Models\Area;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AreaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Arealist', [
            'auth' => [
                'user' => auth()->user(),
            ],
            'areas' => Area::latest()->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Arealist', [
            'auth' => [
                'user' => auth()->user(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'location_name' => ['required', 'string', 'max:255'],
            'area_type' => ['required', 'string', 'max:255'],
            'corners' => ['required', 'array'],
            'corners.*.name' => ['required', 'string'],
            'corners.*.coordinates' => ['required', 'string'],
        ]);

        Area::create([
            'location_name' => $validated['location_name'],
            'area_type' => $validated['area_type'],
            'corners' => $validated['corners'],
            'status' => 'active',
        ]);

        return redirect()->route('areas.index')->with('success', 'Area created successfully.');
    }
}
