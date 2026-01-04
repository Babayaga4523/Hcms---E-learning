# Smart Back Button Navigation - Implementation Summary

## Overview
Implemented intelligent back button navigation that returns users to their original context (pretest or posttest page) instead of always going to the question bank.

## Changes Made

### 1. Route Updates - [routes/web.php](routes/web.php)

#### Create Route (`/admin/question-management`)
- **Added:** `returnUrl` query parameter support
- **Purpose:** Pass context for where user came from when creating new questions
- **Route extracts:** `module`, `type`, and `returnUrl` query parameters

#### Edit Route (`/admin/question-management/{id}`)
- **Added:** `returnUrl` query parameter support
- **Purpose:** Pass context when editing questions
- **Route extracts:** `returnUrl` from query parameter

### 2. Component Updates - [resources/js/Pages/Admin/QuestionManagement.jsx](resources/js/Pages/Admin/QuestionManagement.jsx)

#### Props
- **Added:** `returnUrl` prop (defaults to null)
- **Added:** `getBackUrl()` function that returns appropriate URL based on context
  - If `returnUrl` provided → use it (user came from pretest/posttest page)
  - Otherwise → default to `/admin/questions` (question bank)

#### Back Buttons (2 locations)
1. **Header back button** (line 315)
   - Updated: `href="/admin/questions"` → `href={getBackUrl()}`
   - Icon: ArrowLeft

2. **Footer back button** (line 698)
   - Updated: `href="/admin/questions"` → `href={getBackUrl()}`
   - Text: "← Kembali"

### 3. Component Updates - [resources/js/Pages/Admin/TestManagement.jsx](resources/js/Pages/Admin/TestManagement.jsx)

#### handleEditQuestion()
**Before:**
```javascript
const handleEditQuestion = (questionId) => {
    window.location.href = `/admin/question-management/${questionId}`;
};
```

**After:**
```javascript
const handleEditQuestion = (questionId) => {
    const returnUrl = `/admin/training-programs/${program.id}/${testType}`;
    window.location.href = `/admin/question-management/${questionId}?returnUrl=${encodeURIComponent(returnUrl)}`;
};
```

#### handleAddQuestion()
**Before:**
```javascript
const handleAddQuestion = () => {
    window.location.href = `/admin/question-management?module=${program.id}&type=${testType}`;
};
```

**After:**
```javascript
const handleAddQuestion = () => {
    const returnUrl = `/admin/training-programs/${program.id}/${testType}`;
    window.location.href = `/admin/question-management?module=${program.id}&type=${testType}&returnUrl=${encodeURIComponent(returnUrl)}`;
};
```

## Navigation Flow

### Scenario 1: Edit Pretest Question
```
TestManagement (pretest view)
  ↓ Click "Edit" button
  ↓ handleEditQuestion() passes returnUrl
→ /admin/question-management/35?returnUrl=/admin/training-programs/1/pretest
  ↓ QuestionManagement gets returnUrl prop
  ↓ Click "← Kembali" button
→ Back to /admin/training-programs/1/pretest ✓
```

### Scenario 2: Edit Posttest Question
```
TestManagement (posttest view)
  ↓ Click "Edit" button
  ↓ handleEditQuestion() passes returnUrl
→ /admin/question-management/40?returnUrl=/admin/training-programs/2/posttest
  ↓ QuestionManagement gets returnUrl prop
  ↓ Click "← Kembali" button
→ Back to /admin/training-programs/2/posttest ✓
```

### Scenario 3: Create Question from Pretest
```
TestManagement (pretest view)
  ↓ Click "Tambah Soal" button
  ↓ handleAddQuestion() passes returnUrl
→ /admin/question-management?module=1&type=pretest&returnUrl=/admin/training-programs/1/pretest
  ↓ QuestionManagement gets returnUrl prop
  ↓ Click "← Kembali" button
→ Back to /admin/training-programs/1/pretest ✓
```

### Scenario 4: Direct Access (No Context)
```
User directly visits:
→ /admin/question-management?module=1&type=pretest
  ↓ No returnUrl provided
  ↓ QuestionManagement sets back button to default
  ↓ Click "← Kembali" button
→ Back to /admin/questions (Question Bank) ✓
```

## Testing Verification

✓ Routes accept `returnUrl` parameter
✓ Components properly destructure and use `returnUrl` prop
✓ Back buttons use `getBackUrl()` function for dynamic navigation
✓ Default fallback to `/admin/questions` when no context
✓ Build successful with all changes

## User Experience Improvements

1. **Intuitive Navigation:** Users no longer lose context when editing/creating questions
2. **Contextual Return:** Back button remembers where user came from
3. **Seamless Workflow:** Pretest ↔ Edit Question ↔ Pretest (same for posttest)
4. **Backward Compatibility:** Direct access to question management still works (defaults to question bank)

## Files Modified
- [routes/web.php](routes/web.php) - Added returnUrl parameter support
- [resources/js/Pages/Admin/QuestionManagement.jsx](resources/js/Pages/Admin/QuestionManagement.jsx) - Implemented getBackUrl()
- [resources/js/Pages/Admin/TestManagement.jsx](resources/js/Pages/Admin/TestManagement.jsx) - Pass returnUrl when navigating
