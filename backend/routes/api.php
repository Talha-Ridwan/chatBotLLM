<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\MessageController;
use App\Http\Middleware\IsAdmin;
#AuthController
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function(){
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware(IsAdmin::class)->group(function(){
        Route::post('/admin/see', [AdminController::class, 'seeUsers']);
        Route::post('/admin/create', [AdminController::class, 'createUsers']);
        Route::post('/admin/delete', [AdminController::class, 'deleteUsers']);
    });

    Route::post('/createChat', [ChatController::class, 'createChat']);
    Route::get('/getAllChats', [ChatController::class, 'listAllChats']);

    Route::delete('/chats/{chatSession}', [ChatController::class, 'deleteChat']);
    Route::patch('/chats/{chatSession}/visibility', [ChatController::class, 'flipChatSessionVisibility']);

    
    Route::post('/chats/{chatSession}/messages', [MessageController::class, 'sendMessage']);
    Route::get('/chats/{chatSession}', [ChatController::class, 'getChatHistory']);

    // Existing route
Route::post('/chats/{chatSession}/messages', [MessageController::class, 'sendMessage']);

// NEW: For Frontend Polling
Route::get('/messages/{messageId}/status', [MessageController::class, 'checkStatus']);

// NEW: For n8n Callback (Must be accessible from outside, so typically no auth middleware or use an API key)
Route::post('/n8n/callback', [MessageController::class, 'handleCallback'])->name('api.n8n.callback');
});



