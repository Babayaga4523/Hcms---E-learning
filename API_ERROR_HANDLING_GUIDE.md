# API Error Handling & Data Extraction - Quick Reference Guide

**For Developers:** Use this guide to properly handle API responses and errors in new components.

---

## 1. Data Extraction (API Response Inconsistency)

### Problem
Our API returns data in multiple formats depending on the endpoint:
```javascript
// Format 1: Direct array
[{ id: 1, name: 'Item 1' }]

// Format 2: Wrapped in 'data' key
{ data: [{ id: 1, name: 'Item 1' }] }

// Format 3: Custom key names
{ trainings: [{ id: 1 }] }
{ users: [{ id: 1 }] }

// Format 4: Pagination object
{ data: [...], meta: { last_page: 5, total: 100 } }
```

### Solution: Use `extractData()` utility

**Location:** `resources/js/Utilities/apiResponseHandler.js`

**Basic Usage:**
```javascript
import { extractData, extractMeta } from '@/Utilities/apiResponseHandler';

// Fetch data from API
const response = await axios.get('/api/trainings');

// Extract array (handles all formats automatically)
const trainings = extractData(response.data);

// Extract pagination metadata
const pagination = extractMeta(response.data);

// Use with fallback
const items = extractData(response.data, []); // Default to empty array
```

**Function Signature:**
```javascript
extractData(response, defaultValue = [])
// @param response - Server response object
// @param defaultValue - Fallback value if no data found
// @returns Array of data items or defaultValue
```

**Example in Component:**
```javascript
const Dashboard = () => {
    const [trainings, setTrainings] = useState([]);

    useEffect(() => {
        const fetchTrainings = async () => {
            try {
                const response = await axios.get('/api/user/trainings');
                // ✅ Good: Use extractData for automatic format handling
                const data = extractData(response.data);
                setTrainings(data);
            } catch (error) {
                console.error('Failed to fetch trainings:', error);
                showToast('Failed to load trainings', 'error');
            }
        };
        fetchTrainings();
    }, []);

    return (
        <div>
            {trainings.map(training => (
                <div key={training.id}>{training.name}</div>
            ))}
        </div>
    );
};
```

**Advanced Usage with Pagination:**
```javascript
const Catalog = () => {
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await axios.get('/api/items?page=1');
                // Extract both data and metadata
                const data = extractData(response.data);
                const meta = extractMeta(response.data);
                setItems(data);
                setPagination(meta);
            } catch (error) {
                showToast('Failed to load items', 'error');
            }
        };
        fetchItems();
    }, []);

    return (
        <div>
            {items.map(item => <div key={item.id}>{item.name}</div>)}
            <div>Page {pagination?.current_page} of {pagination?.last_page}</div>
        </div>
    );
};
```

**Anti-Patterns to Avoid:**
```javascript
// ❌ Bad: Complex ternary logic
const items = response.data.items?.data 
    || response.data.items 
    || response.data.data 
    || [];

// ❌ Bad: Hardcoded assumptions
const items = response.data.data; // Assumes 'data' key always exists

// ✅ Good: Use extractData
const items = extractData(response.data);
```

---

## 2. Authentication Error Handling (401 Redirect)

### Problem
When user session expires, API returns 401 Unauthorized. Without proper handling:
- UI gets stuck in loading state
- User gets no feedback
- Data might be corrupted
- User must force refresh

### Solution: Use `handleAuthError()` utility

**Location:** `resources/js/Utils/authGuard.js`

**Basic Usage:**
```javascript
import { handleAuthError } from '@/Utils/authGuard';
import showToast from '@/Utils/toast';

// Axios example
try {
    const response = await axios.get('/api/user/data');
    setData(response.data);
} catch (error) {
    // Check auth error first (highest priority)
    if (handleAuthError(error)) return;
    
    // Then handle other errors
    showToast('Failed to load data', 'error');
}
```

**Function Signature:**
```javascript
handleAuthError(error, redirectUrl = '/login', showNotification = true)
// @param error - Axios or fetch error object
// @param redirectUrl - Where to redirect (default: /login)
// @param showNotification - Show toast message (default: true)
// @returns true if error was 401 and handled, false otherwise
```

**Behavior on 401 Error:**
1. Show toast: "Sesi Anda telah berakhir. Silakan login kembali."
2. Clear localStorage and sessionStorage
3. Wait 800ms (let toast display)
4. Redirect to login page
5. Return `true` (indicating error was handled)

### Pattern for Different HTTP Methods

**GET Request with fetch:**
```javascript
const fetchData = async () => {
    try {
        const response = await fetch('/api/data');
        
        // Fetch doesn't auto-reject on 401, check manually
        if (response.status === 401) {
            handleAuthError({ response }, '/login');
            return; // Stop processing
        }
        
        if (!response.ok) {
            showToast('Failed to load data', 'error');
            return;
        }
        
        const data = await response.json();
        setData(extractData(data)); // Also handle response format
    } catch (error) {
        console.error('Network error:', error);
    }
};
```

**POST Request with axios:**
```javascript
const handleSubmit = async (formData) => {
    try {
        const response = await axios.post('/api/submit', formData);
        showToast('Success!', 'success');
    } catch (error) {
        // Check 401 before other error handling
        if (handleAuthError(error)) {
            return; // Don't process further
        }
        
        // Handle validation errors
        if (error.response?.status === 400) {
            const message = error.response.data.message;
            showToast(message, 'error');
            return;
        }
        
        // Generic error handler
        showToast('Failed to submit', 'error');
    }
};
```

**PATCH Request with multiple operations (fetch):**
```javascript
const handleBulkUpdate = async (ids) => {
    try {
        const responses = await Promise.all(
            ids.map(id => fetch(`/api/items/${id}/update`, { method: 'PATCH' }))
        );
        
        // Check all responses for 401
        for (const response of responses) {
            if (response.status === 401) {
                handleAuthError({ response }, '/login');
                return; // Stop on first 401
            }
        }
        
        showToast('Updated successfully', 'success');
    } catch (error) {
        console.error('Error:', error);
    }
};
```

**DELETE Request:**
```javascript
const handleDelete = async (id) => {
    try {
        await axios.delete(`/api/item/${id}`);
        showToast('Deleted successfully', 'success');
        // Update local state
        setItems(items.filter(item => item.id !== id));
    } catch (error) {
        if (handleAuthError(error)) return;
        
        if (error.response?.status === 404) {
            showToast('Item not found', 'error');
            return;
        }
        
        showToast('Failed to delete', 'error');
    }
};
```

### Complete Example Component

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import showToast from '@/Utils/toast';
import { handleAuthError } from '@/Utils/authGuard';
import { extractData, extractMeta } from '@/Utilities/apiResponseHandler';

const MyComponent = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/items?page=1');
            
            // Extract data (handles multiple API response formats)
            const data = extractData(response.data);
            const meta = extractMeta(response.data);
            
            setItems(data);
            setPagination(meta);
        } catch (error) {
            // Check auth error first with highest priority
            if (handleAuthError(error)) {
                return; // handleAuthError shows toast & redirects
            }
            
            // Then handle other errors
            showToast('Failed to load items', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this item?')) return;

        try {
            await axios.delete(`/api/items/${id}`);
            
            // Update UI
            setItems(items.filter(item => item.id !== id));
            showToast('Item deleted', 'success');
        } catch (error) {
            if (handleAuthError(error)) return;
            
            if (error.response?.status === 404) {
                // Item already deleted
                setItems(items.filter(item => item.id !== id));
                return;
            }
            
            showToast('Failed to delete item', 'error');
        }
    };

    const handleUpdate = async (id, updates) => {
        try {
            const response = await axios.patch(`/api/items/${id}`, updates);
            
            // Update item in list
            const updatedItem = extractData(response.data, {})[0] || updates;
            setItems(items.map(item => 
                item.id === id ? { ...item, ...updatedItem } : item
            ));
            
            showToast('Item updated', 'success');
        } catch (error) {
            if (handleAuthError(error)) return;
            showToast('Failed to update item', 'error');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            {items.map(item => (
                <div key={item.id}>
                    <h3>{item.name}</h3>
                    <button onClick={() => handleDelete(item.id)}>Delete</button>
                    <button onClick={() => handleUpdate(item.id, { name: 'Updated' })}>
                        Update
                    </button>
                </div>
            ))}
            {pagination && (
                <div>Page {pagination.current_page} of {pagination.last_page}</div>
            )}
        </div>
    );
};

export default MyComponent;
```

### Error Handling Decision Tree

```
API Call Error
    ↓
Is it a 401 (Unauthorized)?
    ├─ YES → handleAuthError(error) → return
    └─ NO ↓
       Is it a 403 (Forbidden)?
           ├─ YES → showToast('Access denied', 'error')
           └─ NO ↓
              Is it a 404 (Not Found)?
                  ├─ YES → showToast('Item not found', 'error')
                  └─ NO ↓
                     Is it a 5xx (Server Error)?
                         ├─ YES → showToast('Server error, try again', 'error')
                         └─ NO ↓
                            Is it a Network error?
                                ├─ YES → showToast('No internet connection', 'error')
                                └─ NO → showToast('Unknown error', 'error')
```

### Available Auth Error Functions

```javascript
import {
    handleAuthError,           // Main handler - call this first
    is401Error,               // Check if error is 401
    is403Error,               // Check if error is 403
    is404Error,               // Check if error is 404
    getAuthErrorMessage,      // Get localized error message
    isRetryableError,         // Check if error can be retried
    handleAuthorizationError, // Handle 403 errors
    withAuthGuard             // Hook to wrap async functions
} from '@/Utils/authGuard';
```

---

## 3. Combining Both: Complete Error Handling Pattern

```javascript
import React, { useState } from 'react';
import axios from 'axios';
import showToast from '@/Utils/toast';
import { handleAuthError } from '@/Utils/authGuard';
import { extractData } from '@/Utilities/apiResponseHandler';

const MyForm = () => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData) => {
        try {
            setLoading(true);
            
            // Make API call
            const response = await axios.post('/api/submit', formData);
            
            // Extract data (handles response format inconsistency)
            const result = extractData(response.data);
            
            showToast('Success!', 'success');
            return result;
        } catch (error) {
            // 1. Check authentication status first (highest priority)
            if (handleAuthError(error)) {
                return null; // handleAuthError shows toast & redirects
            }
            
            // 2. Check for validation errors
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach(field => {
                    showToast(`${field}: ${errors[field][0]}`, 'error');
                });
                return null;
            }
            
            // 3. Handle other known errors
            if (error.response?.status === 400) {
                showToast(error.response.data.message, 'error');
                return null;
            }
            
            // 4. Generic error handler
            const message = error.response?.data?.message || 'Operation failed';
            showToast(message, 'error');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(new FormData(e.target));
        }}>
            {/* Form fields */}
            <button disabled={loading}>{loading ? 'Loading...' : 'Submit'}</button>
        </form>
    );
};

export default MyForm;
```

---

## Common Mistakes to Avoid

### ❌ Not checking 401 first
```javascript
// Wrong: Checking specific errors before auth
if (error.response?.status === 400) {
    // Handle 400
} else if (error.response?.status === 404) {
    // Handle 404
} else if (error.response?.status === 401) {
    // Handle auth - TOO LATE! Should be first!
}

// Right: Always check 401 first
if (handleAuthError(error)) return;
// Then check other errors...
```

### ❌ Not clearing localStorage
```javascript
// Wrong: Only redirecting
if (error.response?.status === 401) {
    window.location.href = '/login'; // Stale data in localStorage!
}

// Right: handleAuthError clears storage automatically
if (handleAuthError(error)) return; // Clears localStorage internally
```

### ❌ Hardcoding response paths
```javascript
// Wrong: Assumes 'data' key always exists
const items = response.data.data; // Might be response.data.items!

// Right: Use extractData
const items = extractData(response.data); // Handles all formats
```

### ❌ Not handling fetch response status
```javascript
// Wrong: fetch doesn't auto-reject on 401
try {
    const response = await fetch('/api/data');
    // 401 response is "ok" here, will try to parse JSON
    const data = await response.json();
} catch (error) {
    // handleAuthError never called!
}

// Right: Check response status explicitly
try {
    const response = await fetch('/api/data');
    if (response.status === 401) {
        handleAuthError({ response });
        return;
    }
    const data = await response.json();
} catch (error) {
    console.error(error);
}
```

---

## Testing Your Implementation

### Test Case 1: Verify 401 handling
1. Login to system
2. Open DevTools → Application → Clear all storage
3. Run an API call
4. Verify:
   - ✅ Toast notification appears
   - ✅ Redirect to login happens
   - ✅ localStorage is empty

### Test Case 2: Verify data extraction
1. Check network tab for API response format
2. Verify extractData() returns correct array
3. Test with different response formats:
   - Direct array: `[...]`
   - Wrapped: `{ data: [...] }`
   - Custom key: `{ trainings: [...] }`

### Test Case 3: Verify error precedence
1. Make API call that returns error
2. Verify error matches priority:
   - 401 → handleAuthError
   - 4xx → specific handler
   - 5xx → generic handler

---

## Summary

| Utility | File | Use For | Returns |
|---------|------|---------|---------|
| `extractData()` | apiResponseHandler.js | Extract array from API response | Array or defaultValue |
| `extractMeta()` | apiResponseHandler.js | Extract pagination metadata | Metadata object |
| `handleAuthError()` | authGuard.js | Handle 401 errors | boolean |
| `is401Error()` | authGuard.js | Check if 401 | boolean |
| `getAuthErrorMessage()` | authGuard.js | Get error message | string |

**Remember:** Always check `handleAuthError()` first before other error handling!

---

**Version:** 1.0  
**Last Updated:** 2024  
**Questions?** Check ISSUE_1_IMPLEMENTATION.md and ISSUE_2_IMPLEMENTATION.md
