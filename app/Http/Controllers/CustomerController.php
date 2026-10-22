<?php

namespace App\Http\Controllers;
use App\Models\Customer;

use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index()
    {
        $customers = Customer::with('invoices.items', 'invoices.payments')->latest()->get()->map(function ($c) {
            $ledger = [];
            $invoiceList = [];
    
            foreach ($c->invoices as $inv) {
                $ledger[] = [
                    'date' => $inv->date,
                    'desc' => 'Invoice ' . $inv->no,
                    'debit' => $inv->total(),
                    'credit' => 0,
                    'order' => 0,
                ];
    
                foreach ($inv->payments as $p) {
                    $ledger[] = [
                        'date' => $p->date,
                        'desc' => 'Payment received (' . $inv->no . ')',
                        'debit' => 0,
                        'credit' => $p->amount,
                        'order' => 1,
                    ];
                }
    
                $invoiceList[] = [
                    'no' => $inv->no,
                    'date' => $inv->date,
                    'amount' => $inv->total(),
                    'status' => $inv->status(),
                ];
            }
    
            usort($ledger, function ($a, $b) {
                return [$a['date'], $a['order']] <=> [$b['date'], $b['order']];
            });
    
            $row = $c->makeHidden('invoices')->toArray();
            $row['ledger'] = $ledger;
            $row['invoices'] = $invoiceList;
    
            return $row;
        });
    
        return response()->json($customers);
    }
public function store(Request $request)
{
    $data = $request->validate([
        'name' => 'required|string|max:255',
        'phone' => 'required|string|max:50',
        'whatsapp' => 'nullable|string|max:50',
        'email' => 'nullable|email',
        'city' => 'nullable|string|max:100',
        'address' => 'nullable|string',
        'limit' => 'required|numeric',
        'opening' => 'required|numeric',
        'notes' => 'nullable|string',
    ]);

    $customer = Customer::create($data);

    return response()->json(['id' => $customer->id]);
}
public function update(Request $request, Customer $customer)
{
    $data = $request->validate([
        'name' => 'sometimes|required|string|max:255',
        'phone' => 'sometimes|required|string|max:50',
        'whatsapp' => 'nullable|string|max:50',
        'email' => 'nullable|email',
        'city' => 'nullable|string|max:100',
        'address' => 'nullable|string',
        'limit' => 'sometimes|numeric',
        'opening' => 'sometimes|numeric',
        'notes' => 'nullable|string',
        'active' => 'sometimes|boolean',
    ]);

    $customer->update($data);

    return response()->json(['ok' => true]);
}
}
