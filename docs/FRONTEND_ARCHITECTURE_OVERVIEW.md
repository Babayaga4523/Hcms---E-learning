# Frontend Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD (Main Entry Point)               │
│                          Dashboard.jsx                               │
└──────────────────────┬────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐
  │  Overview   │ │ Deep         │ │ **NEW** Features │
  │  Tab        │ │ Analytics    │ │                  │
  │             │ │ Tab          │ │ - Compliance     │
  │ (Existing)  │ │ (Existing)   │ │ - Organization   │
  └─────────────┘ └──────────────┘ │ - Reports        │
                                    └──────────────────┘
                                           │
            ┌──────────────────────────────┼──────────────────────────┐
            │                              │                          │
            ▼                              ▼                          ▼
  ┌─────────────────────┐    ┌──────────────────────┐    ┌────────────────┐
  │ ComplianceDashboard │    │   OrganizationTab    │    │ ReportsTab     │
  │ (New Component)     │    │                      │    │ (Existing)     │
  │                     │    │ 2-Column Layout:     │    └────────────────┘
  │ • Summary Cards     │    │ ┌──────────┬───────┐│
  │ • Pie Chart         │    │ │ Tree     │ Form  ││
  │ • Bar Chart         │    │ │ Dept     │ Role  ││
  │ • Users Table       │    │ │ Hierarchy│Assign ││
  │ • Actions           │    │ └──────────┴───────┘│
  └──────┬──────────────┘    │                     │
         │                   └──────┬──────────────┘
         │                          │
         │           ┌──────────────┴──────────────┐
         │           │                             │
         │           ▼                             ▼
         │  ┌─────────────────────┐    ┌──────────────────────┐
         │  │DepartmentHierarchy  │    │RoleAssignmentForm    │
         │  │Tree (New Component) │    │(New Component)       │
         │  │                     │    │                      │
         │  │ • Recursive Tree    │    │ • Single User Mode   │
         │  │ • Expandable Nodes  │    │ • Bulk Mode          │
         │  │ • User Counts       │    │ • Validation         │
         │  │ • Details Panel     │    │ • Current Roles      │
         │  │ • Edit Mode         │    │ • Department Select  │
         │  └────────┬────────────┘    └──────────┬───────────┘
         │           │                             │
         └───────────┴─────────────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────────────────────┐
      │          API CLIENT LAYER                    │
      │        (Utils/ApiClient.js)                  │
      │                                              │
      │  ┌────────────────┐  ┌────────────────┐    │
      │  │ enrollmentApi  │  │ complianceApi  │    │
      │  │ (6 methods)    │  │ (7 methods)    │    │
      │  └────────────────┘  └────────────────┘    │
      │                                              │
      │  ┌────────────────┐  ┌────────────────┐    │
      │  │rolePermission  │  │ departmentApi  │    │
      │  │Api (8 methods) │  │ (9 methods)    │    │
      │  └────────────────┘  └────────────────┘    │
      └──────────────────────────────────────────────┘
                     │
                     ▼ (HTTP Requests)
      ┌──────────────────────────────────────────────┐
      │        BACKEND API ENDPOINTS                 │
      │   (Laravel 11 with Service Layer)            │
      │                                              │
      │  /api/compliance/dashboard                   │
      │  /api/compliance/check-all                   │
      │  /api/compliance/{id}/resolve                │
      │                                              │
      │  /api/departments/tree                       │
      │  /api/departments/{id}/move                  │
      │  /api/departments/{id}/path                  │
      │                                              │
      │  /api/role-permissions/assign-role           │
      │  /api/role-permissions/bulk-assign-role      │
      │  /api/role-permissions/user/{id}             │
      │                                              │
      └──────────────────────────────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────────────────────┐
      │        SERVICE LAYER (Backend)               │
      │                                              │
      │  • EnrollmentService                         │
      │  • ComplianceService                         │
      │  • RolePermissionService                     │
      │  • DepartmentHierarchyService                │
      │  • BulkOperationService                      │
      │                                              │
      └──────────────────────────────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────────────────────┐
      │           DATABASE LAYER                     │
      │                                              │
      │  • users                                     │
      │  • roles                                     │
      │  • departments                               │
      │  • user_trainings                            │
      │  • compliance_audit_logs                     │
      │  • ... (other tables)                        │
      │                                              │
      └──────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Compliance Dashboard Flow

```
User visits Dashboard
    │
    ├─> Click "Compliance" tab
    │
    └─> ComplianceDashboard mounts
        │
        ├─> useEffect() triggered
        │
        ├─> Call complianceApi.getDashboard()
        │
        ├─> Display loading spinner
        │
        └─> Receive data:
            ├─> Render summary cards
            ├─> Render pie chart (distribution)
            ├─> Render bar chart (escalation)
            ├─> Render users table
            │
            └─> User actions:
                ├─> Click "Check All Compliance"
                │   └─> complianceApi.checkAllCompliance()
                │       └─> Refresh dashboard data
                │
                └─> Click "Resolve" on user
                    └─> complianceApi.resolve(id, reason)
                        └─> Refresh dashboard data
```

### Department Tree Flow

```
User visits Organization tab
    │
    └─> DepartmentHierarchyTree mounts
        │
        ├─> useEffect() triggered
        │
        ├─> Call departmentApi.getTree()
        │
        ├─> Receive nested tree structure
        │
        └─> Render recursive tree:
            ├─> Root department
            │
            └─> User can:
                ├─> Click to expand/collapse
                │   └─> Show children recursively
                │
                ├─> Click on department
                │   └─> Show details panel
                │
                ├─> Drag department (if editable)
                │   └─> Call departmentApi.moveDepartment()
                │       └─> Refresh tree
                │
                └─> View department details:
                    ├─> Department name
                    ├─> User count
                    ├─> Subdepartment count
                    └─> Parent department
```

### Role Assignment Flow

```
User clicks "Assign Role"
    │
    └─> RoleAssignmentForm opens
        │
        ├─> useEffect() triggered
        │
        ├─> Parallel API calls:
        │   ├─> fetch('/api/users')
        │   ├─> fetch('/api/roles')
        │   └─> departmentApi.getTree()
        │
        ├─> Display form with dropdowns
        │
        └─> User selects options:
            ├─> Mode selection:
            │   ├─> Single User mode:
            │   │   ├─> Select user
            │   │   ├─> Select role
            │   │   ├─> Optional: select department
            │   │   ├─> Click "Assign Role"
            │   │   └─> API call rolePermissionApi.assignRole()
            │   │
            │   └─> Bulk mode:
            │       ├─> Check multiple users
            │       ├─> Select role
            │       ├─> Optional: select department
            │       ├─> Click "Assign to N Users"
            │       └─> API call rolePermissionApi.bulkAssignRole()
            │
            └─> After success:
                ├─> Show success message
                ├─> If userId mode: show current roles
                ├─> If bulk mode: reset form
                └─> Call onSuccess callback (if provided)
```

---

## Component Dependency Tree

```
Dashboard.jsx (Main)
    │
    ├── AdminSidebar (existing)
    │
    └── Tabs:
        ├── OverviewTab (existing)
        │   └── Various charts & cards
        │
        ├── AnalyticsTab (existing)
        │   └── Module stats & learner rankings
        │
        ├── ComplianceDashboard (NEW)
        │   ├── SummaryCard (internal component)
        │   ├── Pie Chart (Recharts)
        │   ├── Bar Chart (Recharts)
        │   └── Data table
        │
        ├── OrganizationTab (NEW)
        │   ├── DepartmentHierarchyTree (NEW)
        │   │   ├── TreeNode (internal, recursive)
        │   │   └── DepartmentDetailsPanel (internal)
        │   │
        │   └── RoleAssignmentForm (NEW)
        │       ├── Form inputs
        │       └── Role list display
        │
        └── ReportsTab (existing)
            └── Reports table

Shared Dependencies:
    ├── Recharts (Charts)
    ├── Framer Motion (Animations)
    ├── Lucide Icons (Icons)
    ├── Tailwind CSS (Styling)
    ├── Inertia.js (Routing)
    └── ApiClient.js (API calls)
```

---

## State Management Flow

### ComplianceDashboard State

```
State Variables:
├── summary (object) ─> Dashboard data
├── nonCompliant (array) ─> Non-compliant users list
├── atRisk (array) ─> At-risk users list
├── loading (boolean) ─> Loading indicator
├── error (string) ─> Error message
└── selectedModule (object) ─> Selected module filter

Derived Data (useMemo):
├── escalationBreakdown ─> Count per level
├── escalationData ─> Formatted for chart
└── complianceData ─> Formatted for chart
```

### DepartmentHierarchyTree State

```
State Variables:
├── tree (object) ─> Full hierarchy structure
├── loading (boolean) ─> Loading indicator
├── error (string) ─> Error message
├── expandedNodes (Set) ─> Which nodes expanded
├── editingId (number) ─> Currently editing node
├── editValues (object) ─> Edit form values
└── selectedNode (object) ─> Currently selected node
```

### RoleAssignmentForm State

```
State Variables:
├── formData (object)
│   ├── user_id (number)
│   ├── role_id (number)
│   ├── department_id (number)
│   └── bulk_user_ids (array)
├── users (array) ─> User dropdown options
├── roles (array) ─> Role dropdown options
├── departments (array) ─> Department options
├── userRoles (array) ─> Current user's roles
├── loading (boolean)
├── submitting (boolean)
├── error (string)
├── success (string)
└── isBulk (boolean) ─> Bulk vs single mode
```

---

## API Request/Response Examples

### Compliance Dashboard Request

**Request:**
```
GET /api/compliance/dashboard
Headers:
  - Authorization: Bearer {token}
  - X-CSRF-TOKEN: {token}
  - Accept: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_enrollments": 250,
    "compliant_count": 180,
    "non_compliant_count": 50,
    "escalated_count": 20,
    "escalation_breakdown": {
      "1": 10,
      "2": 7,
      "3": 3
    },
    "non_compliant_users": [
      {
        "enrollment_id": 1,
        "user_id": 5,
        "user_name": "John Doe",
        "module_name": "Module 1",
        "reason": "Overdue",
        "escalation_level": 1,
        "days_overdue": 15
      }
    ],
    "at_risk_users": [
      {
        "enrollment_id": 2,
        "user_id": 6,
        "user_name": "Jane Smith",
        "module_name": "Module 2",
        "days_remaining": 3
      }
    ]
  }
}
```

### Department Tree Request

**Request:**
```
GET /api/departments/tree
Headers: [same as above]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Head Office",
    "code": "HO",
    "level": 0,
    "users_count": 15,
    "children": [
      {
        "id": 2,
        "name": "IT Department",
        "code": "IT",
        "level": 1,
        "users_count": 8,
        "children": [
          {
            "id": 5,
            "name": "Development Team",
            "code": "DEV",
            "level": 2,
            "users_count": 5,
            "children": []
          }
        ]
      },
      {
        "id": 3,
        "name": "HR Department",
        "code": "HR",
        "level": 1,
        "users_count": 7,
        "children": []
      }
    ]
  }
}
```

### Role Assignment Request

**Request:**
```
POST /api/role-permissions/assign-role
Content-Type: application/json
Headers: [same as above]

Body:
{
  "user_id": 5,
  "role_id": 3,
  "department_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role assigned successfully",
  "data": {
    "user_id": 5,
    "role_id": 3,
    "role_name": "Manager",
    "department_id": 2,
    "department_name": "IT Department",
    "assigned_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## Error Handling Flow

```
API Request
    │
    └─> Network/Server Error
        │
        ├─> 4xx Error (Client Error)
        │   ├─> 400: Validation error
        │   │   └─> Display field-specific error
        │   │
        │   ├─> 401: Not authenticated
        │   │   └─> Redirect to login
        │   │
        │   ├─> 403: Permission denied
        │   │   └─> Show "Access Denied" message
        │   │
        │   └─> 404: Not found
        │       └─> Show "Resource not found" message
        │
        ├─> 5xx Error (Server Error)
        │   └─> Show "Server error occurred" message
        │
        └─> Network Error
            └─> Show "Connection error" message

Component shows error state:
├─> Red error banner
├─> Error message text
├─> Retry button
└─> User can take action
```

---

## Performance Optimization Strategies

```
Component Rendering:
├─> React.memo() on all components
│   └─> Prevent re-render on props change
│
├─> useMemo() on derived data
│   └─> Cache computed values
│
├─> useCallback() on event handlers
│   └─> Prevent function re-creation
│
└─> Lazy loading with Suspense
    └─> Load components on demand

Data Fetching:
├─> Cache at component level
├─> Avoid duplicate requests
├─> Batch parallel requests with Promise.all()
└─> Debounce search input

Rendering Performance:
├─> Virtualization for large lists
├─> Pagination for large datasets
├─> Code splitting by route
└─> Lazy load images
```

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Complete ✅
