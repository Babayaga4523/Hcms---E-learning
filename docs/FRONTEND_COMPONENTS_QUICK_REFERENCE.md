# Frontend Components Quick Reference

## 🚀 Quick Start Guide

### Access the New Features in Dashboard

```
Dashboard → [New Tabs] →
  • Compliance Tab - Monitor user compliance
  • Organization Tab - Manage departments & roles
```

---

## 📊 ComplianceDashboard Component

### What It Does
Real-time compliance monitoring dashboard showing user compliance status, escalations, and audit trails.

### Import
```jsx
import ComplianceDashboard from '@/Pages/Admin/ComplianceDashboard';
```

### Basic Usage
```jsx
<ComplianceDashboard />
```

### Key Features
- Summary metrics (total, compliant, non-compliant, escalated)
- Pie chart showing compliance distribution
- Bar chart showing escalation levels
- Non-compliant users table
- Bulk compliance check
- Auto-refresh capability

### Main Functions
| Function | Purpose |
|----------|---------|
| `fetchDashboard()` | Load compliance data from API |
| `handleCheckAllCompliance()` | Trigger compliance check for all users |
| `handleResolveNonCompliance(id, reason)` | Mark issue as resolved |

### API Calls Made
```javascript
complianceApi.getDashboard()
complianceApi.checkAllCompliance()
complianceApi.resolve(enrollmentId, reason)
```

---

## 🌳 DepartmentHierarchyTree Component

### What It Does
Interactive visual representation of department hierarchy with drill-down capabilities.

### Import
```jsx
import DepartmentHierarchyTree from '@/Components/Admin/DepartmentHierarchyTree';
```

### Usage Examples

**Basic View (Read-only):**
```jsx
<DepartmentHierarchyTree />
```

**With Selection Callback:**
```jsx
<DepartmentHierarchyTree 
  onSelectDepartment={(dept) => {
    console.log('Selected:', dept.name);
  }}
/>
```

**Editable Mode:**
```jsx
<DepartmentHierarchyTree 
  editable={true}
  onSelectDepartment={handleSelect}
/>
```

### Key Features
- Expandable/collapsible nodes
- User count per department
- Department details panel
- Drag-and-drop reorganization (editable)
- Breadcrumb navigation
- Search by department name
- Loading and error states

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSelectDepartment` | function | null | Callback when department selected |
| `editable` | boolean | false | Enable edit/drag mode |

### Keyboard Shortcuts
- **Arrow Keys** - Navigate tree
- **Enter** - Select department
- **Space** - Expand/collapse

### API Calls Made
```javascript
departmentApi.getTree()
departmentApi.moveDepartment(deptId, parentId)
departmentApi.getPath(deptId)
departmentApi.getDescendants(deptId)
```

---

## 👥 RoleAssignmentForm Component

### What It Does
Form for assigning roles to users, supporting both single and bulk operations.

### Import
```jsx
import RoleAssignmentForm from '@/Components/Admin/RoleAssignmentForm';
```

### Usage Examples

**For Specific User:**
```jsx
<RoleAssignmentForm 
  userId={123}
  onSuccess={() => refreshUserData()}
  onClose={() => setShowForm(false)}
/>
```

**Bulk Assignment Mode:**
```jsx
<RoleAssignmentForm 
  onSuccess={() => showSuccessToast()}
  onClose={() => closeModal()}
/>
```

**Standalone Modal:**
```jsx
const [showForm, setShowForm] = useState(false);

{showForm && (
  <Modal onClose={() => setShowForm(false)}>
    <RoleAssignmentForm 
      onSuccess={() => setShowForm(false)}
      onClose={() => setShowForm(false)}
    />
  </Modal>
)}
```

### Key Features
- Single user mode
- Bulk assignment mode (toggle switch)
- Role selection dropdown
- Department restriction support
- Current roles display with remove option
- Form validation
- Success/error notifications
- Loading states

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userId` | number | null | Pre-select user for single assignment |
| `onSuccess` | function | null | Called after successful operation |
| `onClose` | function | null | Called when form closed |

### Workflow: Single User

```
1. Component mounts → Fetch users, roles, departments
2. User selects target user
3. User selects role
4. User optionally selects department
5. User clicks "Assign Role"
6. API call made
7. Success message shown
8. Current roles list updates
9. Form resets or closes
```

### Workflow: Bulk Assignment

```
1. Switch to "Bulk Assignment" mode
2. Check multiple users from list
3. Select role
4. Optionally select department
5. Click "Assign to N Users"
6. API call made with user array
7. Success message shows count
8. Form resets
```

### API Calls Made
```javascript
rolePermissionApi.assignRole(userId, roleId, deptId)
rolePermissionApi.bulkAssignRole(userIds[], roleId, deptId)
rolePermissionApi.getUserRoles(userId)
rolePermissionApi.removeRole(userId, roleId)
departmentApi.getTree()
```

---

## 📱 Using Components Together

### Common Integration Pattern

```jsx
import ComplianceDashboard from '@/Pages/Admin/ComplianceDashboard';
import DepartmentHierarchyTree from '@/Components/Admin/DepartmentHierarchyTree';
import RoleAssignmentForm from '@/Components/Admin/RoleAssignmentForm';

export default function AdminPage() {
    const [selectedDept, setSelectedDept] = useState(null);
    const [showRoleForm, setShowRoleForm] = useState(false);

    return (
        <div className="grid grid-cols-3 gap-4">
            {/* Left Column - Compliance */}
            <div className="col-span-1">
                <ComplianceDashboard />
            </div>

            {/* Middle Column - Department Tree */}
            <div className="col-span-1">
                <DepartmentHierarchyTree 
                    onSelectDepartment={setSelectedDept}
                    editable={true}
                />
            </div>

            {/* Right Column - Role Form */}
            <div className="col-span-1">
                {showRoleForm && (
                    <RoleAssignmentForm 
                        onClose={() => setShowRoleForm(false)}
                        onSuccess={() => setShowRoleForm(false)}
                    />
                )}
            </div>
        </div>
    );
}
```

---

## 🔌 API Client Cheat Sheet

### Import All APIs
```jsx
import { 
  enrollmentApi, 
  complianceApi, 
  rolePermissionApi, 
  departmentApi 
} from '@/Utils/ApiClient';
```

### Common Operations

**Get Compliance Dashboard:**
```javascript
const dashboard = await complianceApi.getDashboard();
console.log(dashboard.data);
```

**Get Department Tree:**
```javascript
const tree = await departmentApi.getTree();
console.log(tree.data);
```

**Assign Role:**
```javascript
await rolePermissionApi.assignRole(
  userId,      // number
  roleId,      // number
  deptId       // number or null
);
```

**Bulk Assign Roles:**
```javascript
await rolePermissionApi.bulkAssignRole(
  [userId1, userId2, userId3],  // array
  roleId,                        // number
  deptId                         // number or null
);
```

**Get User Roles:**
```javascript
const roles = await rolePermissionApi.getUserRoles(userId);
console.log(roles.data);
```

**Check Compliance:**
```javascript
await complianceApi.checkCompliance(enrollmentId);
```

**Move Department:**
```javascript
await departmentApi.moveDepartment(
  deptId,      // number - department to move
  parentId     // number - new parent
);
```

---

## ⚠️ Error Handling Patterns

### Basic Pattern
```jsx
try {
    const data = await api.methodName();
    // Success handling
} catch (error) {
    if (error.response?.status === 403) {
        showError('Permission denied');
    } else if (error.response?.status === 404) {
        showError('Resource not found');
    } else {
        showError(error.response?.data?.message || 'An error occurred');
    }
}
```

### With Loading State
```jsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleSubmit = async () => {
    try {
        setLoading(true);
        setError(null);
        const result = await api.method();
        // Handle success
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};
```

---

## 🎨 Styling & Theming

### Using Wondr Design System
```jsx
// Primary button
<button className="bg-[#005E54] text-white px-4 py-2 rounded-lg hover:bg-[#002824]">
  Submit
</button>

// Success state
<div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
  Success message
</div>

// Error state
<div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
  Error message
</div>

// Glass panel
<div className="glass-panel rounded-[20px] p-6">
  Content
</div>
```

### Responsive Classes
```jsx
// Mobile-first responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

---

## 📈 Performance Tips

### Memoization
```jsx
// Component won't re-render unless props change
const Memoized = React.memo(MyComponent);
```

### Lazy Loading
```jsx
const ComplianceDashboard = React.lazy(() => 
  import('@/Pages/Admin/ComplianceDashboard')
);

<Suspense fallback={<LoadingSpinner />}>
  <ComplianceDashboard />
</Suspense>
```

### Data Fetching
```jsx
// Fetch once on mount
useEffect(() => {
    fetchData();
}, []); // Empty dependency array

// Re-fetch when userId changes
useEffect(() => {
    fetchUserData();
}, [userId]);
```

---

## 🐛 Debugging Tips

### Check API Response
```jsx
const data = await api.method();
console.log('API Response:', data);
console.log('Data object:', data.data);
```

### Monitor Component State
```jsx
useEffect(() => {
    console.log('State updated:', { loading, error, data });
}, [loading, error, data]);
```

### Verify API Client
```jsx
import { departmentApi } from '@/Utils/ApiClient';
console.log('departmentApi methods:', Object.keys(departmentApi));
```

### Browser DevTools
- F12 → Network tab → Check API calls
- Check response payloads
- Verify headers include CSRF token
- Monitor console for errors

---

## 📝 Common Tasks

### Task: Add Role to User
```jsx
import { rolePermissionApi } from '@/Utils/ApiClient';

const handleAddRole = async (userId, roleId, deptId = null) => {
    try {
        await rolePermissionApi.assignRole(userId, roleId, deptId);
        showSuccess('Role assigned');
        refreshUserRoles(userId);
    } catch (error) {
        showError(error.message);
    }
};
```

### Task: Reorganize Department
```jsx
import { departmentApi } from '@/Utils/ApiClient';

const handleMoveDepartment = async (deptId, newParentId) => {
    try {
        await departmentApi.moveDepartment(deptId, newParentId);
        showSuccess('Department moved');
        refreshTree();
    } catch (error) {
        showError('Cannot move department: ' + error.message);
    }
};
```

### Task: Check User Compliance
```jsx
import { complianceApi } from '@/Utils/ApiClient';

const checkCompliance = async (enrollmentId) => {
    try {
        const result = await complianceApi.checkCompliance(enrollmentId);
        refreshComplianceData();
    } catch (error) {
        showError('Compliance check failed');
    }
};
```

---

## 🔐 Security

### CSRF Protection
✅ Automatically handled by API client
```javascript
// No manual action needed - CSRF token added to all requests
```

### Authentication
✅ Requires authenticated session
```javascript
// Check authentication in browser:
// Cookie: XSRF-TOKEN
// Check Inertia props: auth.user
```

### Authorization
✅ Backend validates permissions
```javascript
// Components may return 403 Forbidden if user lacks permission
// Handle in error state
```

---

## 📞 Support & Help

### Getting Help
1. Check `docs/FRONTEND_INTEGRATION_GUIDE.md` for detailed docs
2. Look at component source code for examples
3. Check API responses in browser DevTools
4. Review error messages for clues

### Reporting Issues
When reporting component issues, include:
- Which component is affected
- What action triggered the issue
- Error message from console
- Browser and OS information
- Screenshot if visual issue

---

**Last Updated:** 2024
**Components Version:** 1.0
**API Version:** 1.0
**Status:** Production Ready ✅
