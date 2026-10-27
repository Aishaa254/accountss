<?php

// Har role ko kin kin hisson ka access hai. '*' ka matlab sab kuch.
return [

    'modules' => [
        'dashboard' => 'Dashboard',
        'sales' => 'Invoices and Customers',
        'purchases' => 'Purchases and Vendors',
        'inventory' => 'Inventory',
        'expenses' => 'Expenses',
        'reports' => 'Reports',
        'accounting' => 'Accounting (journal, ledger)',
        'tasks' => 'Tasks (own tasks)',
        'tasks.manage' => 'Assign and manage all tasks',
        'settings' => 'Settings',
        'users' => 'Team and roles',
        'audit' => 'Activity log',
    ],

    'roles' => [
        'owner' => [
            'label' => 'Owner',
            'about' => 'Full access to everything, including team and settings.',
            'permissions' => ['*'],
        ],
        'accountant' => [
            'label' => 'Accountant',
            'about' => 'Sales, purchases, inventory, expenses, reports and accounting.',
            'permissions' => ['dashboard', 'sales', 'purchases', 'inventory', 'expenses', 'reports', 'accounting', 'tasks'],
        ],
        'manager' => [
            'label' => 'Manager',
            'about' => 'Runs daily work, assigns tasks and sees reports.',
            'permissions' => ['dashboard', 'sales', 'purchases', 'inventory', 'expenses', 'reports', 'tasks', 'tasks.manage'],
        ],
        'staff' => [
            'label' => 'Staff',
            'about' => 'Invoices, inventory and own tasks only.',
            'permissions' => ['dashboard', 'sales', 'inventory', 'tasks'],
        ],
    ],
];