# QUICK REFERENCE: Common Patterns to Fix Across Codebase

---

## PATTERN 1: useEffect Cleanup (Affects 15+ components)

### ❌ WRONG
```jsx
useEffect(() => {
    setInterval(() => fetchData(), 30000);
    const timeout = setTimeout(() => doSomething(), 5000);
}, []);
```

### ✅ CORRECT
```jsx
useEffect(() => {
    const interval = setInterval(() => fetchData(), 30000);
    const timeout = setTimeout(() => doSomething(), 5000);
    
    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
}, []);
```

### 📋 Apply to These Files
- Dashboard.jsx
- SystemSettings.jsx  
- TrainingAnalytics.jsx
- UserManagement.jsx
- ComplianceTracker.jsx
- ApprovalWorkflow.jsx

---

## PATTERN 2: Missing Dependency in useEffect (Affects 12+ components)

### ❌ WRONG
```jsx
useEffect(() => {
    const data = processStats(stats); // Uses stats but not in deps
    setChartData(data);
}, []); // Missing stats!
```

### ✅ CORRECT
```jsx
useEffect(() => {
    const data = processStats(stats);
    setChartData(data);
}, [stats]); // ← Add stats
```

### 📋 Apply to These Files
- Dashboard.jsx (AreaChart setup)
- TrainingAnalytics.jsx (Chart setup)
- ExamAttempts.jsx (Score calculation)
- DepartmentManagement.jsx (Stats)

---

## PATTERN 3: Missing Authorization Check (Affects ALL 20 controllers)

### ❌ WRONG
```php
public function getRoles() {
    // No authorization!
    $roles = Role::all();
    return response()->json($roles);
}
```

### ✅ CORRECT
```php
public function getRoles() {
    $this->authorize('view-roles');
    $roles = Role::all();
    return response()->json($roles);
}
```

### 📋 Add to ALL These Controllers
```
UserController.php - getRoles, storeRole, updateRole, deleteRole
SettingsController.php - getSettings, saveSettings
ComplianceController.php - requestApproval, approveProgram, rejectProgram
DashboardMetricsController.php - getComprehensiveDashboard, getStatistics
ReportController.php - index, getDashboardData, exportReport
CommunicationHub.php - All public methods
AnnouncementManager.php - All public methods
... (Apply to all CRUD operations)
```

---

## PATTERN 4: N+1 Query Problem (Affects 5+ controllers)

### ❌ WRONG
```php
// 1 query to get all products
$products = Product::all();

// Then N more queries inside loop
foreach ($products as $product) {
    $categories = $product->categories; // ← N queries!
}
```

### ✅ CORRECT
```php
// 1 query with eager loading instead of N+1
$products = Product::with('categories')->get();

// Now accessing categories doesn't trigger queries
foreach ($products as $product) {
    $categories = $product->categories; // ← No extra queries
}
```

### 📋 Apply to
- UserController.php line 300-310 (getDepartments)
- DashboardMetricsController.php line 150-200
- ReportController.php (all report generation)
- AnalyticsController.php

**Checklist:**
```php
// BEFORE: Count queries
DB::enableQueryLog();
// ... your code ...
dd(DB::getQueryLog()); // Should see N+1 pattern

// AFTER: Should be much fewer queries
```

---

## PATTERN 5: Bulk Operation Race Condition (Affects 8 components)

### ❌ WRONG
```jsx
const handleApprove = async () => {
    setSubmitting(true);
    await fetch('/api/approve');
    setSubmitting(false);
    // User can click button again during request
}
```

### ✅ CORRECT
```jsx
const handleApprove = async () => {
    if (submitting) return; // Prevent duplicate clicks
    
    try {
        setSubmitting(true);
        const idempotencyKey = `${id}-${Date.now()}`;
        
        const res = await fetch('/api/approve', {
            method: 'POST',
            headers: {
                'Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify({...})
        });
        
        if (res.ok) {
            refetch(); // Reload data
        }
    } finally {
        setSubmitting(false);
    }
};
```

### 📋 Apply to
- ApprovalWorkflow.jsx (handleApprove, handleReject)
- UserAssignment.jsx (bulk operations)
- UserManagement.jsx (bulk delete)
- TestManagement.jsx (question operations)

---

## PATTERN 6: Missing Error Boundaries (Affects ALL pages)

### ❌ WRONG
```jsx
export default function MyPage() {
    const { data } = usePage().props;
    return (
        <div>
            <ChartComponent data={data} /> {/* If error, crashes everything */}
        </div>
    );
}
```

### ✅ CORRECT
```jsx
class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
        console.error('Error caught:', error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-50 border border-red-200 rounded">
                    <h3 className="font-bold text-red-700">Something went wrong</h3>
                    <p className="text-sm text-red-600">{this.state.error?.message}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function MyPage() {
    const { data } = usePage().props;
    return (
        <ErrorBoundary>
            <ChartComponent data={data} />
        </ErrorBoundary>
    );
}
```

### 📋 Create in
- `app/Javascript/Components/ErrorBoundary.jsx`

Then wrap in all pages:
- Dashboard.jsx
- UserManagement.jsx
- TrainingProgram.jsx
- QuestionManagement.jsx
- All other pages

---

## PATTERN 7: Missing Null Checks (Affects 20+ components)

### ❌ WRONG
```jsx
<h1>{stats.total_users}</h1> // Crash if stats is null
<div>{program.title}</div>   // Crash if program is null
```

### ✅ CORRECT
```jsx
<h1>{stats?.total_users || 0}</h1> // Safe with nullish coalescing
<div>{program?.title || 'Untitled'}</div>

// Or more explicit:
if (!stats) return <div>Loading...</div>;
<h1>{stats.total_users}</h1>
```

### 📋 Search for and fix
- All component renders with object properties
- Especially in loops: `{item?.name}`
- Array access: `{array?.[0]?.value}`
- Function calls: `{obj?.method?.()}`

---

## PATTERN 8: Missing Form Validation (Affects 15+ forms)

### ❌ WRONG
```jsx
<button onClick={() => {
    axios.post('/api/save', formData); // No validation!
}}>
    Save
</button>
```

### ✅ CORRECT
```jsx
const [errors, setErrors] = useState({});

const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
        newErrors.name = 'Name is required';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
    }
    
    if (formData.password?.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

<button onClick={() => {
    if (validateForm()) {
        axios.post('/api/save', formData);
    }
}}>
    Save
</button>

// Show errors
{errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
```

### 📋 Apply to All Forms
- CreateProgramWithSteps.jsx
- UserDetail.jsx
- UserAssignment.jsx
- SystemSettings.jsx
- DepartmentManagement.jsx
- EmailConfiguration.jsx

---

## PATTERN 9: Missing Loading States (Affects 25+ components)

### ❌ WRONG
```jsx
<button onClick={async () => {
    await axios.post('/api/export');
    // User doesn't know if it's working
}}>
    Export
</button>
```

### ✅ CORRECT
```jsx
const [isExporting, setIsExporting] = useState(false);

<button 
    disabled={isExporting}
    onClick={async () => {
        try {
            setIsExporting(true);
            const res = await axios.post('/api/export');
            // Download or show success
        } catch (err) {
            showToast('Export failed', 'error');
        } finally {
            setIsExporting(false);
        }
    }}
>
    {isExporting ? (
        <>
            <Loader className="w-4 h-4 animate-spin mr-2" />
            Exporting...
        </>
    ) : (
        <>
            <Download className="w-4 h-4 mr-2" />
            Export
        </>
    )}
</button>
```

### 📋 Apply to
- All async button operations
- All fetches in useEffect
- All API calls

---

## PATTERN 10: Missing Sanitization (Affects 10+ components)

### ❌ WRONG
```jsx
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

### ✅ CORRECT
```jsx
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(userContent, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'ul', 'ol', 'li', 'br', 'p'],
    ALLOWED_ATTR: []
});

<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
```

### 📋 Apply to
- QuestionManagement.jsx (question_text display)
- TestManagement.jsx (question display)
- AnnouncementManager.jsx (announcement content)
- CommunicationHub.jsx (messages)

---

## PATTERN 11: Missing Pagination (Affects 8 endpoints)

### ❌ WRONG (Backend)
```php
public function getActivityLogs() {
    return AuditLog::all(); // All records at once!
}
```

### ✅ CORRECT (Backend)
```php
public function getActivityLogs(Request $request) {
    $perPage = $request->input('per_page', 20);
    
    return AuditLog::orderBy('created_at', 'desc')
        ->paginate($perPage);
}
```

### ❌ WRONG (Frontend)
```jsx
const [logs, setLogs] = useState([]);

useEffect(() => {
    fetch('/api/logs').then(r => r.json()).then(data => {
        setLogs(data); // All records in memory
    });
}, []);
```

### ✅ CORRECT (Frontend)
```jsx
const [logs, setLogs] = useState([]);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(0);

useEffect(() => {
    fetch(`/api/logs?page=${page}&per_page=20`)
        .then(r => r.json())
        .then(data => {
            setLogs(data.data);
            setTotalPages(Math.ceil(data.total / 20));
        });
}, [page]);

// Pagination UI
<div className="flex gap-2">
    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
        Previous
    </button>
    <span>Page {page} of {totalPages}</span>
    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
        Next
    </button>
</div>
```

### 📋 Apply to Endpoints
- `/api/admin/activity-logs` (AuditLogViewer)
- `/api/admin/training-programs` (TrainingProgram)
- `/api/admin/users` (UserManagement)
- `/api/admin/compliance/approvals` (ApprovalWorkflow)
- `/api/admin/announcements` (AnnouncementManager)

---

## PATTERN 12: Database Transaction Pattern (Affects 5 controllers)

### ❌ WRONG
```php
foreach ($items as $item) {
    DB::table('table1')->update(...); // If error here, partial update
    DB::table('table2')->insert(...); // Desync
    AuditLog::create(...);
}
```

### ✅ CORRECT
```php
try {
    return DB::transaction(function() use ($items) {
        foreach ($items as $item) {
            DB::table('table1')->update([...]);
            DB::table('table2')->insert([...]);
            AuditLog::create([...]);
        }
        Cache::forget('relevant_cache');
        return response()->json(['success' => true]);
    });
} catch (\Exception $e) {
    Log::error('Transaction failed', ['error' => $e->getMessage()]);
    return response()->json(['error' => 'Operation failed'], 500);
}
```

### 📋 Apply to
- SettingsController.php
- ComplianceController.php
- UserController.php (bulk operations)
- DashboardMetricsController.php

---

## PATTERN 13: API Response Error Handling (Affects all API calls)

### ❌ WRONG (Frontend)
```jsx
const response = await axios.get('/api/data');
const data = response.data; // No error handling
```

### ✅ CORRECT (Frontend)
```jsx
try {
    const response = await axios.get('/api/data');
    
    if (!response.data?.success) {
        throw new Error(response.data?.message || 'Unknown error');
    }
    
    const data = response.data.data;
    return data;
} catch (error) {
    const message = error.response?.data?.message || error.message || 'Request failed';
    showToast(message, 'error');
    throw error;
}
```

### ✅ CORRECT (Backend)
```php
// STANDARDIZE ALL RESPONSES
try {
    $data = collect(Module::all());
    return response()->json([
        'success' => true,
        'data' => $data,
        'meta' => [
            'timestamp' => now(),
            'version' => 'v1'
        ]
    ]);
} catch (\Exception $e) {
    Log::error('Error:', ['error' => $e]);
    return response()->json([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Operation failed'
    ], 500);
}
```

---

## PATTERN 14: State Synchronization (Affects 5+ components)

### ❌ WRONG
```jsx
const [programs, setPrograms] = useState([]);

// Prop changes but state doesn't update
const { programs: propPrograms } = usePage().props;
```

### ✅ CORRECT
```jsx
const { programs: propPrograms } = usePage().props;
const [programsData, setProgramsData] = useState(propPrograms || []);

// Sync prop changes to state
useEffect(() => {
    setProgramsData(propPrograms);
    sessionStorage.setItem('programs', JSON.stringify(propPrograms));
}, [propPrograms]);
```

### 📋 Apply to
- TrainingProgram.jsx (programs sync)
- UserManagement.jsx (users sync)
- ApprovalWorkflow.jsx (approvals sync)

---

## QUICK CHECKLIST: Review Before Merging PR

```markdown
### Code Quality
- [ ] No console.log statements left
- [ ] No commented-out code blocks
- [ ] No TODO or FIXME comments
- [ ] All variables are used
- [ ] No unused imports

### Frontend Components
- [ ] All useEffect has cleanup
- [ ] All dependencies listed in deps array
- [ ] No prop drilling (max 3 levels)
- [ ] All async operations wrapped in try-catch
- [ ] Error boundaries wrapping complex sections
- [ ] Loading states for all async operations
- [ ] Null checks on all prop access
- [ ] Form validation before submit
- [ ] Input sanitization where needed
- [ ] No secrets in code

### Backend
- [ ] All public methods have authorization check
- [ ] No N+1 queries (run QueryLog check)
- [ ] Complex operations wrapped in DB::transaction()
- [ ] Proper error handling with logging
- [ ] SQL queries use parameterized statements
- [ ] File uploads validated (magic bytes + extension)
- [ ] Rate limiting on public endpoints
- [ ] Data sanitized on input
- [ ] Proper HTTP status codes
- [ ] CSRF tokens on all mutations

### Data
- [ ] Pagination on lists > 50 items
- [ ] Cache invalidation implemented
- [ ] State sync tested (props → state)
- [ ] Data consistency checked (before/after)

### Testing
- [ ] Unit tests for new functions
- [ ] Integration tests for workflows
- [ ] At least 1 manual test case executed
- [ ] Error cases tested
```

---

**Apply these patterns systematically to fix 60% of identified issues.**
