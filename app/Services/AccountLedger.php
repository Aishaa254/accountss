<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountTransaction;
use Illuminate\Validation\ValidationException;

class AccountLedger
{
    // Kisi payment ya expense ke liye account mein entry likhta hai.
    // Paisa nikalna ho aur account mein kam ho to rok deta hai.
    public static function post(
        Account $account,
        string $direction,
        float $amount,
        string $date,
        string $kind,
        string $sourceType,
        int $sourceId,
        ?string $method = null,
        ?string $reference = null,
        ?string $note = null
    ): AccountTransaction {
        // Do log aik hi waqt par nikalein to balance galat na ho
        $locked = Account::whereKey($account->id)->lockForUpdate()->first();

        if ($direction === 'out' && $amount > $locked->balance()) {
            throw ValidationException::withMessages([
                'account_id' => 'Not enough money in ' . $locked->name . '. Available: ' . number_format($locked->balance(), 2) . '.',
            ]);
        }

        return AccountTransaction::create([
            'account_id' => $locked->id,
            'date' => $date,
            'direction' => $direction,
            'amount' => round($amount, 2),
            'kind' => $kind,
            'method' => $method,
            'reference' => $reference,
            'note' => $note,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'created_by' => auth()->id(),
        ]);
    }

    // Payment ya expense hatay to uski entry bhi saath hat jati hai
    public static function forget(string $sourceType, int $sourceId): void
    {
        AccountTransaction::where('source_type', $sourceType)->where('source_id', $sourceId)->delete();
    }
}