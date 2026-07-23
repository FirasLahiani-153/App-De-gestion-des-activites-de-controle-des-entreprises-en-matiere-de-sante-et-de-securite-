<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller implements HasMiddleware
{
    /**
     * Allowed application roles. Kept in one place so it's easy to extend
     * later (e.g. adding 'entreprise') without hunting through validation rules.
     */
    private const ASSIGNABLE_ROLES = ['admin', 'inspecteur', 'responsable'];

    public static function middleware(): array
    {
        return [
            new Middleware('permission:voir-utilisateurs', only: ['index', 'show']),
            new Middleware('permission:creer-utilisateurs', only: ['store']),
            new Middleware('permission:modifier-utilisateurs', only: ['update']),
            new Middleware('permission:supprimer-utilisateurs', only: ['destroy']),
        ];
    }

    public function index()
    {
        return User::with('roles:id,name')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:30',
            'matricule' => 'nullable|string|max:100|unique:users',
            'role' => ['required', 'string', Rule::in(self::ASSIGNABLE_ROLES)],
            // Only meaningful when role = 'responsable': lets them also carry
            // the inspecteur role, so a responsable can be assigned visits directly.
            'peut_inspecter' => 'sometimes|boolean',
        ]);

        // Only someone with explicit rights to assign roles can hand out
        // anything beyond the base act of creating a user record.
        if (! $request->user()->can('assigner-roles')) {
            return response()->json([
                'message' => "Vous n'avez pas la permission d'attribuer des rôles.",
            ], 403);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'matricule' => $validated['matricule'] ?? null,
            'is_active' => true,
        ]);

        $roles = [$validated['role']];
        if ($validated['role'] === 'responsable' && ($validated['peut_inspecter'] ?? false)) {
            $roles[] = 'inspecteur';
        }
        $user->syncRoles($roles);

        return response()->json($user->load('roles:id,name'), 201);
    }

    public function show(string $id)
    {
        return User::with('roles:id,name')->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => 'sometimes|nullable|string|max:30',
            'matricule' => ['sometimes', 'nullable', 'string', 'max:100', Rule::unique('users')->ignore($user->id)],
            'is_active' => 'sometimes|boolean',
            'role' => ['sometimes', 'string', Rule::in(self::ASSIGNABLE_ROLES)],
            'peut_inspecter' => 'sometimes|boolean',
        ]);

        if (array_key_exists('role', $validated) || array_key_exists('peut_inspecter', $validated)) {
            if (! $request->user()->can('assigner-roles')) {
                return response()->json([
                    'message' => "Vous n'avez pas la permission d'attribuer des rôles.",
                ], 403);
            }

            $newRole = $validated['role'] ?? $user->getRoleNames()->first(fn ($r) => $r !== 'inspecteur') ?? $user->getRoleNames()->first();

            // Don't let someone strip their own admin role and lock themselves out.
            if ($request->user()->is($user) && $newRole !== 'admin' && $user->hasRole('admin')) {
                return response()->json([
                    'message' => 'Vous ne pouvez pas retirer votre propre rôle administrateur.',
                ], 422);
            }

            $roles = [$newRole];
            $peutInspecter = $validated['peut_inspecter'] ?? $user->hasRole('inspecteur');
            if ($newRole === 'responsable' && $peutInspecter) {
                $roles[] = 'inspecteur';
            }

            $user->syncRoles($roles);
            unset($validated['role'], $validated['peut_inspecter']);
        }

        $user->update($validated);

        return response()->json($user->fresh()->load('roles:id,name'));
    }

    public function destroy(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        if ($request->user()->is($user)) {
            return response()->json([
                'message' => 'Vous ne pouvez pas supprimer votre propre compte.',
            ], 422);
        }

        $user->delete();

        return response()->json(null, 204);
    }
}