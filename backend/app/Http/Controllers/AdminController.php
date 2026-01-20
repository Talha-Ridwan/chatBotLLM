<?php

namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function createUsers(Request $request){
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'email|unique:users,email',
            'password' => 'required|string|',
        ]);

        $validated['role'] = 'user';
        $validated['is_active'] = true;
        $user = User::create($validated);

        return response()->json([
        'message'=> "User created successfully",
        'user' => $user
    ], 201);
    }

    public function seeUsers(Request $request){
        $users = User::paginate(50);
        return response()->json(
            [
                "Users" => $users,
                "message" => "Fetching successful"
            ]
            );
    }

    public function deleteUsers(Request $request){
        $validated = $request->validate([
            "id_for_deletion" => "required|integer|exists:users,id"
        ]);

        $user = User::find($validated["id_for_deletion"]);

        if($user->role === "admin"){
            return response()->json(["message" => "Root user can't be deleted"], 403);
        }

        $user->delete();

        return response()->json([
            'message' => "User deleted",
            "deleted_id" => $user->id
        ], 200);
    }
}
