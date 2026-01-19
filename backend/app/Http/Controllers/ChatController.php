<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatSession;
class ChatController extends Controller
{
    public function createChat(Request $request) {

    $session = $request->user()->chatSessions()->create([
        'title' => 'Unnamed Session',
        'visibility' => true,
    ]);

    return response()->json($session, 201);
    }

    public function deleteChat(Request $request, ChatSession $chatSession){
        if($chatSession->user_id != $request->user()->id){
            abort(403, "Not your chat");
        }
        $chatSession->delete();
        return response()->json(["message" => "Chat deleted successfully"], 200);
    }

    public function flipChatSessionVisibility(Request $request, ChatSession $chatSession){
        if ($chatSession->user_id != $request->user()->id){
            abort(403, 'Forbidden');
        }

        $chatSession->visibility = !$chatSession->visibility;

        $chatSession->save();
        return response()->json([
        'message' => 'Visibility updated',
        'visibility' => $chatSession->visibility
    ], 200);
    }

    public function listAllChats(Request $request){
        $response = $request->user()
        ->chatSessions()
        ->where('visibility', true)
        ->latest()
        ->get();

        return response()->json($response);
    }
}