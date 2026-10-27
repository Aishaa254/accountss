<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = ['user_id', 'user_name', 'action', 'subject_type', 'subject_id', 'description', 'changes', 'ip'];

    protected $casts = [
        'changes' => 'array',
    ];

    // Record likhte waqt koi masla aaye to asli kaam nahi rukna chahiye
    public static function record(string $action, $model = null, ?string $description = null, ?array $changes = null): void
    {
        try {
            $user = auth()->user();

            static::create([
                'user_id' => $user ? $user->id : null,
                'user_name' => $user ? $user->name : 'System',
                'action' => $action,
                'subject_type' => $model ? class_basename($model) : null,
                'subject_id' => $model ? $model->getKey() : null,
                'description' => $description ?? ($model ? static::describe($model) : null),
                'changes' => $changes,
                'ip' => request() ? request()->ip() : null,
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private static function describe($model): string
    {
        $attrs = $model->getAttributes();

        foreach (['no', 'name', 'description', 'title'] as $key) {
            if (!empty($attrs[$key])) {
                return mb_substr((string) $attrs[$key], 0, 200);
            }
        }

        return '#' . $model->getKey();
    }
}