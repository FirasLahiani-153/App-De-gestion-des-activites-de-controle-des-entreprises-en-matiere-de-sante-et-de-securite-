<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return \App\Models\User::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string'
        ]);
        $validated['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);
        $user = \App\Models\User::create($validated);
        $user->assignRole($validated['role']);
        return response()->json($user, 201);
    }

    public function show(string $id)
    {
        return \App\Models\User::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $user = \App\Models\User::findOrFail($id);
        $user->update($request->except('password'));
        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }
        return response()->json($user);
    }

    public function destroy(string $id)
    {
        \App\Models\User::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
