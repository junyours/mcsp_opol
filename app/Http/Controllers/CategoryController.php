<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Category', [
            'auth' => [
                'user' => auth()->user(),
            ],
            'categories' => Category::latest()->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Category', [
            'auth' => [
                'user' => auth()->user(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_name' => ['required', 'string', 'max:255', 'unique:categories'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        Category::create([
            'category_name' => $validated['category_name'],
            'status' => $validated['status'],
        ]);

        return redirect()->route('categories.index')->with('success', 'Category created successfully.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'category_name' => ['required', 'string', 'max:255', 'unique:categories,category_name,' . $category->id],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $category->update([
            'category_name' => $validated['category_name'],
            'status' => $validated['status'],
        ]);

        return redirect()->route('categories.index')->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->delete();

        return redirect()->route('categories.index')->with('success', 'Category deleted successfully.');
    }
}
