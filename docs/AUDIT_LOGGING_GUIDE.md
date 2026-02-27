# Audit Logging Implementation Guide

## Overview
Comprehensive audit logging for sensitive admin operations has been implemented through the `AuditService` class and reusable React error handling components.

## Backend Audit Logging

### Service Class Location
`app/Services/AuditService.php` - Centralized audit logging service

### Available Logging Methods

#### User Operations
- `AuditService::logUserCreate(array $userData)` - Log user creation
- `AuditService::logUserUpdate(int $userId, array $oldValues, array $newValues)` - Log user updates
- `AuditService::logUserDelete(int $userId, array $userData)` - Log user deletion
- `AuditService::logUserRoleChange(int $userId, string $oldRole, string $newRole)` - Log role changes
- `AuditService::logPasswordReset(int $userId, string $userName)` - Log password resets
- `AuditService::logBulkUserDelete(array $userIds, int $count)` - Log bulk deletions
- `AuditService::logCsvImport(int $count, array $summary)` - Log CSV imports

#### Module/Training Operations
- `AuditService::logModuleCreate(int $moduleId, array $moduleData)` - Log module creation
- `AuditService::logModuleUpdate(int $moduleId, array $oldValues, array $newValues)` - Log module updates
- `AuditService::logModuleDelete(int $moduleId, string $moduleTitle)` - Log module deletion

#### System Operations
- `AuditService::logReportExport(string $reportType, string $format)` - Log report exports
- `AuditService::logConfigChange(string $configKey, $oldValue, $newValue)` - Log config changes
- `AuditService::logSensitiveAccess(string $dataType, ?int $entityId = null)` - Log sensitive data access
- `AuditService::logPermissionDenied(string $action, string $resource)` - Log permission denials

### Implementation Pattern

```php
// At top of controller file
use App\Services\AuditService;

// In controller method
public function storeUser(Request $request)
{
    // Validate and create user...
    $newUser = User::create($validated);
    
    // Log the operation
    AuditService::logUserCreate($newUser->toArray());
    
    return response()->json(['user' => $newUser]);
}

public function updateUser(Request $request, User $user)
{
    $oldValues = $user->toArray();
    
    // Update user...
    $user->update($validated);
    
    // Log the changes
    AuditService::logUserUpdate($user->id, $oldValues, $user->toArray());
    
    return response()->json(['user' => $user]);
}
```

## Frontend Error Handling

### Available Components

#### ErrorAlert Component
Location: `resources/js/Components/Admin/ErrorAlert.jsx`

```jsx
import { ErrorAlert } from '@/Components/Admin/ErrorAlert';

// In component
<ErrorAlert 
    error={error}
    onDismiss={() => setError(null)}
    onRetry={handleRetry}
    title="Failed to load data"
/>
```

#### LoadingSpinner Component
Location: `resources/js/Components/Admin/LoadingSpinner.jsx`

```jsx
import { LoadingSpinner } from '@/Components/Admin/LoadingSpinner';

// Inline loading
<LoadingSpinner message="Loading users..." size="md" />

// Full screen overlay
<LoadingSpinner message="Processing..." overlay={true} size="lg" />
```

### useAsyncState Hook
Location: `resources/js/Hooks/useAsyncState.js`

```jsx
import { useAsyncState } from '@/Hooks/useAsyncState';

export function MyComponent() {
    const { loading, error, execute, clearError, retry } = useAsyncState();
    const [data, setData] = useState(null);

    const loadData = async () => {
        await execute(
            async (signal) => {
                const response = await fetch('/api/data', { signal });
                return await response.json();
            },
            (result) => setData(result)
        );
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <>
            <ErrorAlert 
                error={error} 
                onDismiss={clearError}
                onRetry={loadData}
            />
            {loading && <LoadingSpinner message="Loading..." />}
            {data && <div>{/* render data */}</div>}
        </>
    );
}
```

## Configuration

### Audit Settings
Location: `config/admin.php`

Sensitive operations list:
```php
'audit' => [
    'sensitive_operations' => [
        'user_create',
        'user_update',
        'user_delete',
        'user_role_change',
        'user_password_reset',
        'user_bulk_delete',
        'module_delete',
        'module_update',
        'module_create',
        'csv_import',
        'report_export',
        'system_config_change',
    ],
    'log_retention_days' => 90,
],
```

## Database Schema

Audit logs table columns:
- `id` - Primary key
- `user_id` - Admin who performed the action
- `action` - Type of action (user_create, user_update, etc.)
- `entity_type` - Type of entity (User, Module, etc.)
- `entity_id` - ID of the affected entity
- `changes` - JSON object with old/new values
- `ip_address` - IP address of the request
- `logged_at` - Timestamp of the action

## Best Practices

1. **Always log sensitive operations** - User create/update/delete, role changes, password resets
2. **Include descriptive messages** - Help with auditing and debugging
3. **Use specific action names** - Follow the naming convention in config/admin.php
4. **Capture both old and new values** - Essential for compliance and rollback analysis
5. **Log before returning success** - Ensure operation and audit log succeed together
6. **Handle audit log failures gracefully** - Don't break the main operation if audit logging fails

## Implementation Checklist

### Controllers to Update
- [ ] AdminUserController - All create/update/delete/role change operations
- [ ] AdminTrainingProgramController - All create/update/delete operations  
- [ ] AdminReportController - Report export operations
- [ ] AdminModuleController - Module management operations
- [ ] AdminDashboardController - Configuration changes

### React Components to Update
Priority pages (36+ total):
- [ ] UserManagement.jsx
- [ ] Dashboard.jsx
- [ ] TrainingProgram.jsx
- [ ] Reports pages
- [ ] All other admin pages

## Example: Complete User Create Implementation

```php
public function store(Request $request)
{
    $user = Auth::user();
    if ($user->role !== 'admin') {
        AuditService::logPermissionDenied('create_user', 'User');
        abort(403, 'Unauthorized');
    }

    $validated = $request->validate([
        'name' => 'required|string',
        'email' => 'required|email|unique:users',
        'password' => 'required|string|min:8',
        'role' => 'required|in:user,admin',
    ]);

    $newUser = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'role' => $validated['role'],
    ]);

    // Log successful creation
    AuditService::logUserCreate(
        array_merge($newUser->toArray(), ['role' => $validated['role']])
    );

    return response()->json(['user' => $newUser], 201);
}
```

## Verification

To verify audit logging is working:

```bash
# Check recent audit logs
SELECT * FROM audit_logs ORDER BY logged_at DESC LIMIT 20;

# Check logs for specific user
SELECT * FROM audit_logs WHERE user_id = 1 ORDER BY logged_at DESC;

# Check logs for specific action type
SELECT * FROM audit_logs WHERE action = 'user_create' ORDER BY logged_at DESC;
```

## Status

### Completed ✅
- AuditService created with 14 logging methods
- Configuration added to config/admin.php
- ErrorAlert and LoadingSpinner components created
- useAsyncState hook implemented
- Documentation complete

### In Progress 🔄
- Integration into existing controllers

### Recommendations
1. Start with AdminUserController for core user operations
2. Add logging to AdminTrainingProgramController next
3. Update React components to use new error handling
4. Create admin dashboard to view audit logs
5. Set up automated audit log retention policy
