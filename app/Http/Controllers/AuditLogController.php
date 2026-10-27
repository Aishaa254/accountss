<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $query = AuditLog::query();

        $search = trim((string) $request->query('q'));
        if ($search !== '') {
            $query->where(function ($w) use ($search) {
                $w->where('description', 'like', '%' . $search . '%')
                    ->orWhere('user_name', 'like', '%' . $search . '%')
                    ->orWhere('subject_type', 'like', '%' . $search . '%');
            });
        }

        if ($request->query('user')) {
            $query->where('user_id', (int) $request->query('user'));
        }
        if ($request->query('action')) {
            $query->where('action', $request->query('action'));
        }
        if ($request->query('from')) {
            $query->whereDate('created_at', '>=', $request->query('from'));
        }
        if ($request->query('to')) {
            $query->whereDate('created_at', '<=', $request->query('to'));
        }

        $per = 25;
        $page = max(1, (int) $request->query('page', 1));
        $total = (clone $query)->count();

        $rows = $query->orderByDesc('id')->skip(($page - 1) * $per)->take($per)->get()->map(function ($r) {
            return [
                'id' => $r->id,
                'when' => $r->created_at->toIso8601String(),
                'user' => $r->user_name,
                'action' => $r->action,
                'type' => $r->subject_type ?? '',
                'text' => $r->description ?? '',
                'changes' => $r->changes ?? [],
                'ip' => $r->ip ?? '',
            ];
        });

        return response()->json([
            'data' => $rows,
            'total' => $total,
            'page' => $page,
            'pages' => max(1, (int) ceil($total / $per)),
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }
}