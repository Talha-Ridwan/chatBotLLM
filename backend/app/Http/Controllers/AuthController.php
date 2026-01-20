<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
class AuthController extends Controller
{
    public function login(Request $request){
        $creds = $request->validate([
            'name' => 'required|string|max:255',
            'password' => 'required',
        ]);

        if (Auth::attempt($creds)){
            $user = Auth::user();
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json(['token'=>$token, 'role' => $user->role],200);
        }
        return response()->json(['message'=>'Invalid credentials'], 401);
    }

    public function logout(Request $request){
        $user = $request->user();
        $user->currentAccessToken()->delete();

        return response()->json([
            'message'=>'Logged out successfully'
        ], 200);
    }


}
