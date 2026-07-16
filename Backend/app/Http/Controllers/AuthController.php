<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     *
     * Authenticates a user and returns a Sanctum token along with
     * the user's profile, role, and permissions.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Find user and verify password manually so we can check is_active
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Votre compte a été désactivé. Contactez un administrateur.',
            ], 403);
        }

        // Revoke all previous tokens for this device (optional: keep multiple sessions)
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'      => 'Connexion réussie.',
            'token'        => $token,
            'token_type'   => 'Bearer',
            'user'         => $this->formatUser($user),
        ]);
    }

    /**
     * POST /api/auth/register
     *
     * Registers a new user, assigns a selected role, and returns a token.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'phone'     => ['nullable', 'string', 'max:20'],
            'matricule' => ['nullable', 'string', 'max:255', 'unique:users'],
            'password'  => ['required', 'confirmed', Password::min(8)],
            'role'      => ['required', 'string', 'in:inspecteur,responsable'], // Allows choosing role for demo
        ]);

        $user = User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'phone'     => $validated['phone'] ?? null,
            'matricule' => $validated['matricule'] ?? null,
            'password'  => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        $user->assignRole($validated['role']);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'      => 'Inscription réussie.',
            'token'        => $token,
            'token_type'   => 'Bearer',
            'user'         => $this->formatUser($user),
        ], 201);
    }


    /**
     * POST /api/auth/logout
     *
     * Revokes the current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }

    /**
     * GET /api/auth/me
     *
     * Returns the authenticated user's profile, role, and permissions.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->formatUser($request->user()),
        ]);
    }

    /**
     * POST /api/auth/change-password
     *
     * Allows an authenticated user to change their own password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update(['password' => $request->password]);

        // Revoke all tokens so user must log in again
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Mot de passe modifié avec succès. Veuillez vous reconnecter.',
        ]);
    }

    // ---------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------

    /**
     * Build a consistent user payload for API responses.
     */
    private function formatUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'matricule'  => $user->matricule,
            'email'      => $user->email,
            'phone'      => $user->phone,
            'is_active'  => $user->is_active,
            'role'       => $user->getRoleNames()->first(),        // single role per user
            'permissions'=> $user->getAllPermissions()->pluck('name'),
            'created_at' => $user->created_at,
        ];
    }
}
