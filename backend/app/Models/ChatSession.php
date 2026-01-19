<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatSession extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'visibility',
    ];

    public function messages()
    {
        return $this->hasMany(Message::class); // <--- Added 'return'
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}