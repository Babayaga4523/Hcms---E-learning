# Frontend Integration Guide

## Overview
This guide documents the frontend integration of the new business logic system with React components and API endpoints.

## Components Created

### 1. **ComplianceDashboard** (`Pages/Admin/ComplianceDashboard.jsx`)
Complete compliance monitoring dashboard with real-time data visualization.

**Features:**
- Summary metrics (compliant, non-compliant, escalated counts)
- Compliance distribution pie chart
- Escalation levels bar chart
- Non-compliant users table with actions
- Check all compliance button for batch operations
- Error handling and loading states

**Usage:**
```jsx
import ComplianceDashboard from '@/Pages/Admin/ComplianceDashboard';

<ComplianceDashboard />
```

**API Endpoints Used:**
- `GET /api/compliance/dashboard` - Get dashboard data
- `POST /api/compliance/check-all` - Check all user compliance
- `POST /api/compliance/{enrollmentId}/resolve` - Resolve non-compliance

---

### 2. **DepartmentHierarchyTree** (`Components/Admin/DepartmentHierarchyTree.jsx`)
Interactive department hierarchy tree visualization with drag-and-drop support.

**Features:**
- Recursive tree rendering with expand/collapse
- Department selection with details panel
- User count badges
- Drag-and-drop reorganization (editable mode)
- Edit department functionality
- Real-time hierarchy updates
- Responsive design with animations

**Props:**
```jsx
<DepartmentHierarchyTree 
  onSelectDepartment={(dept) => console.log(dept)}
  editable={true}
/>
```

**API Endpoints Used:**
- `GET /api/departments/tree` - Get full hierarchy
- `PUT /api/departments/{id}/move` - Move department to parent
- `GET /api/departments/{id}` - Get department details
- `GET /api/departments/{id}/path` - Get department path
- `GET /api/departments/{id}/descendants` - Get child departments

---

### 3. **RoleAssignmentForm** (`Components/Admin/RoleAssignmentForm.jsx`)
Complete role assignment form supporting both single user and bulk operations.

**Features:**
- Single user role assignment
- Bulk user role assignment
- Department restriction support
- Current role display and removal
- Form validation
- Error and success handling
- Loading states

**Props:**
```jsx
<RoleAssignmentForm 
  userId={123}  // Optional - if provided, edit specific user
  onSuccess={() => refetch()}
  onClose={() => setOpen(false)}
/>
```

**API Endpoints Used:**
- `GET /api/users` - Get user list
- `GET /api/roles` - Get role list
- `POST /api/role-permissions/assign-role` - Assign role
- `POST /api/role-permissions/bulk-assign-role` - Bulk assign
- `GET /api/role-permissions/user/{userId}` - Get user roles
- `DELETE /api/role-permissions/{userId}/{roleId}` - Remove role
- `GET /api/departments/tree` - Get department hierarchy

---

## Dashboard Integration

### Updated Admin Dashboard (`Pages/Admin/Dashboard.jsx`)

The main admin dashboard now includes two new tabs:

1. **Compliance Tab** - Displays the ComplianceDashboard component
2. **Organization Tab** - Displays department hierarchy and role assignment

**Tab Navigation:**
```jsx
const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'analytics', label: 'Deep Analytics', icon: BarChart2 },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'organization', label: 'Organization', icon: GitBranch },
    { id: 'reports', label: 'Reports', icon: FileCheck },
];
```

**OrganizationTab Component:**
- Two-column layout
- Left (2/3): DepartmentHierarchyTree
- Right (1/3): RoleAssignmentForm
- Responsive on mobile

---

## API Client Integration

All components use the centralized API client from `Utils/ApiClient.js`.

### Import Pattern:
```jsx
import { 
  enrollmentApi, 
  complianceApi, 
  rolePermissionApi, 
  departmentApi 
} from '@/Utils/ApiClient';
```

### Common Usage Patterns:

**1. Data Fetching:**
```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
    complianceApi.getDashboard()
        .then(response => setData(response.data))
        .catch(error => console.error(error))
        .finally(() => setLoading(false));
}, []);
```

**2. Form Submission:**
```jsx
const handleSubmit = async (formData) => {
    try {
        const result = await rolePermissionApi.assignRole(
            userId, 
            roleId, 
            deptId
        );
        toast.success('Role assigned');
        refetch();
    } catch (error) {
        toast.error(error.message);
    }
};
```

**3. Nested Data Fetching:**
```jsx
useEffect(() => {
    Promise.all([
        departmentApi.getTree(),
        rolePermissionApi.getUserRoles(userId),
        complianceApi.getDashboard()
    ]).then(([tree, roles, compliance]) => {
        // Process all data
    });
}, [userId]);
```

---

## API Endpoints Reference

### Enrollment API
- `POST /api/enrollments` - Create enrollment
- `POST /api/enrollments/{id}/transition-state` - Change state
- `POST /api/enrollments/{id}/issue-certificate` - Issue certificate
- `GET /api/enrollments/{id}` - Get enrollment
- `GET /api/enrollments/user/{userId}` - Get user enrollments
- `GET /api/enrollments/module/{moduleId}` - Get module enrollments

### Compliance API
- `GET /api/compliance/dashboard` - Get compliance dashboard
- `GET /api/compliance/non-compliant` - Get non-compliant users
- `GET /api/compliance/at-risk` - Get at-risk users
- `POST /api/compliance/{enrollmentId}/check` - Check compliance
- `POST /api/compliance/check-all` - Check all compliance
- `POST /api/compliance/{enrollmentId}/resolve` - Resolve issue
- `GET /api/compliance/audit-logs` - Get audit logs

### Role Permission API
- `POST /api/role-permissions/assign-role` - Assign role
- `DELETE /api/role-permissions/{userId}/{roleId}` - Remove role
- `POST /api/role-permissions/add-permission` - Add permission
- `DELETE /api/role-permissions/remove-permission` - Remove permission
- `POST /api/role-permissions/bulk-assign-role` - Bulk assign
- `POST /api/role-permissions/sync-permissions` - Sync permissions
- `GET /api/role-permissions/user/{userId}` - Get user roles
- `GET /api/role-permissions/role/{roleId}/sync-history` - Get sync history

### Department API
- `GET /api/departments/tree` - Get hierarchy tree
- `GET /api/departments/{id}/path` - Get department path
- `GET /api/departments/{id}/descendants` - Get child departments
- `GET /api/departments/{id}/ancestors` - Get parent departments
- `GET /api/departments/{id}/breadcrumb` - Get breadcrumb path
- `GET /api/departments/{id}/level` - Get department level
- `PUT /api/departments/{id}/move` - Move department
- `GET /api/reporting/user/{userId}/structure` - Get reporting structure
- `GET /api/reporting/user/{userId}/manager` - Get user's manager
- `GET /api/reporting/user/{userId}/subordinates` - Get user's subordinates

---

## Styling & Design System

All components use:
- **Tailwind CSS** for styling
- **Wondr Design System** for custom styling
- **Recharts** for data visualization
- **Lucide Icons** for icons
- **Framer Motion** for animations

### Color Scheme:
- Primary: `#005E54` (Wondr teal)
- Success: Green (`#22c55e`)
- Warning: Orange/Yellow (`#f97316`, `#eab308`)
- Error: Red (`#ef4444`)
- Info: Blue (`#3b82f6`)

### Common CSS Classes:
```jsx
// Glass panels
className="glass-panel rounded-[20px]"

// Gradient backgrounds
className="bg-gradient-to-br from-slate-50 to-emerald-50"

// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Animation wrapper
className="motion animate-enter"
```

---

## Error Handling

All API calls include comprehensive error handling:

```jsx
try {
    const data = await api.fetch();
    setData(data);
} catch (error) {
    if (error.response?.status === 403) {
        setError('You don\'t have permission');
    } else if (error.response?.status === 404) {
        setError('Resource not found');
    } else {
        setError(error.response?.data?.message || 'An error occurred');
    }
}
```

### Error Messages:
- API client automatically includes error messages from backend
- Components display user-friendly error messages
- Validation errors are field-specific

---

## Loading States

**Loading Indicator Pattern:**
```jsx
{loading && (
    <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
            <RefreshCw size={40} className="text-blue-500" />
        </div>
    </div>
)}
```

**Button Loading State:**
```jsx
<button disabled={submitting}>
    {submitting ? (
        <>
            <Loader size={18} className="animate-spin" />
            Loading...
        </>
    ) : (
        'Submit'
    )}
</button>
```

---

## Testing Integration

### Component Testing Example:
```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoleAssignmentForm from '@/Components/Admin/RoleAssignmentForm';
import * as ApiClient from '@/Utils/ApiClient';

jest.mock('@/Utils/ApiClient');

describe('RoleAssignmentForm', () => {
    it('should assign role successfully', async () => {
        ApiClient.rolePermissionApi.assignRole.mockResolvedValue({
            success: true,
            data: { role_id: 1 }
        });

        render(<RoleAssignmentForm userId={1} />);
        
        // Fill form and submit
        fireEvent.change(screen.getByRole('combobox', { name: /role/i }), {
            target: { value: '1' }
        });
        fireEvent.click(screen.getByRole('button', { name: /assign/i }));

        await waitFor(() => {
            expect(screen.getByText(/successfully/i)).toBeInTheDocument();
        });
    });
});
```

---

## Performance Optimization

### Memoization:
All components use `React.memo()` to prevent unnecessary re-renders.

```jsx
const ComplianceDashboard = () => {
    // Component code
};

export default ComplianceDashboard;
```

### Data Caching:
API responses are cached at the component level. For global caching, consider:
- React Query / SWR
- Redux for state management
- Context API for shared state

### Lazy Loading:
```jsx
const ComplianceDashboard = lazy(() => 
    import('@/Pages/Admin/ComplianceDashboard')
);

<Suspense fallback={<LoadingSpinner />}>
    <ComplianceDashboard />
</Suspense>
```

---

## Troubleshooting

### API Errors

**401 Unauthorized:**
- Check authentication token
- Verify user is logged in
- Check middleware settings

**403 Forbidden:**
- Verify user has required permissions
- Check role-based access control

**500 Server Error:**
- Check server logs
- Verify database connectivity
- Check API endpoint implementation

### Component Issues

**Components not rendering:**
- Verify imports are correct
- Check for missing dependencies
- Check browser console for errors

**API calls failing:**
- Verify API client configuration
- Check CSRF token is being sent
- Verify endpoint URLs match backend routes

---

## Migration Guide

If updating existing pages to use new API:

1. **Replace old API calls:**
   ```jsx
   // Old
   fetch('/api/old-endpoint')
   
   // New
   import { departmentApi } from '@/Utils/ApiClient';
   departmentApi.getTree()
   ```

2. **Update component imports:**
   ```jsx
   import RoleAssignmentForm from '@/Components/Admin/RoleAssignmentForm';
   import DepartmentHierarchyTree from '@/Components/Admin/DepartmentHierarchyTree';
   ```

3. **Update data handlers:**
   ```jsx
   // Old
   const data = response.json();
   
   // New
   const data = response.data; // API client returns data directly
   ```

---

## Future Enhancements

Potential improvements for future iterations:

1. **Real-time Updates:** WebSocket integration for live data
2. **Caching:** React Query or SWR for advanced caching
3. **Pagination:** Implement pagination for large datasets
4. **Filtering:** Add advanced filtering capabilities
5. **Export:** CSV/Excel export functionality
6. **Notifications:** Toast notifications for all operations
7. **Accessibility:** ARIA labels and keyboard navigation
8. **Mobile Optimization:** Further mobile improvements

---

## Support & Documentation

For more information:
- Backend API Documentation: `docs/API_DOCUMENTATION.md`
- Service Layer Documentation: `docs/SERVICE_LAYER.md`
- Testing Documentation: `docs/TESTING_GUIDE.md`
