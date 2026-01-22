<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatSession;
use Illuminate\Support\Facades\Http; 

class MessageController extends Controller
{
    public function sendMessage(Request $request, ChatSession $chatSession)
    {
        if ($chatSession->user_id !== $request->user()->id) {
            abort(403, "You do not have permission to message in this chat.");
        }

        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        $chatSession->messages()->create([
            'sender' => 'human',     
            'text' => $validated['message'], 
        ]);

        try {
            $response = Http::timeout(60)->withHeaders([
                'X-API-KEY' => env('N8N_SECRET_KEY'),
                'Content-Type' => 'application/json',
            ])->post(env('N8N_WEBHOOK_URL'), [
                'message' => $validated['message'],
                'sessionId' => $chatSession->id
            ]);

            if ($response->failed()) {
                return response()->json(['error' => 'AI Service Unavailable'], 503);
            }

            $botContent = $response->json('output'); 

        } catch (\Exception $e) {
            return response()->json(['error' => 'Connection failed'], 500);
        }

        $botMessage = $chatSession->messages()->create([
            'sender' => 'LLM',        
            'text' => $botContent,    
        ]);

        return response()->json([
            'user_message' => $validated['message'],
            'bot_message' => $botContent
        ], 201);
    }
}