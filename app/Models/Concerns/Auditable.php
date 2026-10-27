<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;

// Kisi model mein "use Auditable;" likhne se uski create / edit / delete khud log ho jati hai
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            AuditLog::record('created', $model);
        });

        static::updated(function ($model) {
            $skip = ['created_at', 'updated_at', 'password', 'remember_token', 'last_login_at'];
            $changes = [];

            foreach ($model->getChanges() as $key => $value) {
                if (in_array($key, $skip, true)) {
                    continue;
                }
                $changes[$key] = ['from' => $model->getOriginal($key), 'to' => $value];
            }

            if ($changes) {
                AuditLog::record('updated', $model, null, $changes);
            }
        });

        static::deleted(function ($model) {
            AuditLog::record('deleted', $model);
        });
    }
}