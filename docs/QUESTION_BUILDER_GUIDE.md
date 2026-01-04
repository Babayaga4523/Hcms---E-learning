# Question Builder - API & Backend Implementation Guide

## Overview

The Question Builder component (`QuestionBuilder.jsx`) is a comprehensive React component for creating, managing, editing, and organizing questions for quizzes. It supports multiple question types, difficulty levels, and provides a full CRUD interface.

## Component Structure

### File Location
```
resources/js/Components/Admin/QuestionBuilder.jsx
```

### Component Exports
- **QuestionBuilder** - Main component for question management
- **QuestionForm** - Form component for creating/editing questions
- **MultipleChoiceForm** - Multiple choice specific form
- **TrueFalseForm** - True/False specific form
- **FillBlankForm** - Fill in the blank specific form
- **EssayForm** - Essay/Short answer specific form

## Props

### QuestionBuilder Component

```javascript
<QuestionBuilder
    quizId={number}                    // Required: Quiz ID to associate questions with
    questions={array}                  // Optional: Initial questions list (default: [])
    onQuestionAdded={function}         // Optional: Callback when question is created
    onQuestionUpdated={function}       // Optional: Callback when question is updated
/>
```

## Question Types Supported

### 1. Multiple Choice (multiple_choice)
```javascript
{
    id: 1,
    quiz_id: 1,
    question_text: "What is 2+2?",
    question_type: "multiple_choice",
    difficulty: "easy",
    points: 3,
    options: ["3", "4", "5", "6"],
    correct_answer: "4",
    explanation: "2+2 equals 4",
    order: 1
}
```
- 4-5 options with 1 correct answer
- Points: Based on difficulty (easy=3, medium=5, hard=7)
- Display: Radio buttons for answer selection

### 2. True/False (true_false)
```javascript
{
    id: 2,
    quiz_id: 1,
    question_text: "The Earth is flat.",
    question_type: "true_false",
    difficulty: "easy",
    points: 3,
    correct_answer: "false",
    explanation: "The Earth is a sphere",
    order: 2
}
```
- Binary choice: true or false
- correct_answer: "true" or "false"

### 3. Fill in the Blank (fill_blank)
```javascript
{
    id: 3,
    quiz_id: 1,
    question_text: "The capital of France is ____.",
    question_type: "fill_blank",
    difficulty: "medium",
    points: 5,
    correct_answer: "Paris",
    explanation: "Paris is the capital city of France",
    order: 3
}
```
- Case-insensitive matching
- Single line answer
- Support for multiple acceptable answers (future enhancement)

### 4. Essay/Short Answer (essay)
```javascript
{
    id: 4,
    quiz_id: 1,
    question_text: "Explain the importance of workplace safety in banking.",
    question_type: "essay",
    difficulty: "hard",
    points: 7,
    correct_answer: "Rubric: Answer should mention..."
    explanation: "This question requires manual grading",
    order: 4
}
```
- Open-ended response
- Requires manual grading (correct_answer contains rubric)
- Supports points assignment based on rubric criteria

## Difficulty Levels

```javascript
const difficultyLevels = [
    { value: 'easy', label: 'Mudah', points: 3 },
    { value: 'medium', label: 'Sedang', points: 5 },
    { value: 'hard', label: 'Sulit', points: 7 },
];
```

Auto-updates points when difficulty is changed during question creation.

## API Endpoints Required

### Create Question
```
POST /api/questions
Content-Type: application/json

{
    quiz_id: number,
    question_text: string,
    question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay',
    difficulty: 'easy' | 'medium' | 'hard',
    points: number,
    explanation: string,
    options: array (for multiple_choice),
    correct_answer: string,
    order: number
}

Response: { id, quiz_id, question_text, ... }
```

### Update Question
```
PUT /api/questions/{id}
Content-Type: application/json

{
    question_text: string,
    question_type: string,
    difficulty: string,
    points: number,
    explanation: string,
    options: array,
    correct_answer: string
}

Response: { id, quiz_id, question_text, ... }
```

### Delete Question
```
DELETE /api/questions/{id}

Response: { success: true, message: "Question deleted" }
```

### Fetch Questions by Quiz
```
GET /api/questions?quiz_id={id}

Response: [
    {
        id: 1,
        quiz_id: 1,
        question_text: "...",
        ...
    },
    ...
]
```

## Integration with QuizManagement

The QuestionBuilder is integrated into `QuizManagement.jsx` as a modal:

```jsx
// In QuizManagement.jsx
import QuestionBuilder from './QuestionBuilder';

// When user clicks "Tambah Soal" button on a quiz
{showQuestionBuilder && selectedQuiz && (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
        <div className="modal bg-white rounded-xl shadow-2xl">
            <QuestionBuilder 
                quizId={selectedQuiz.id}
                questions={selectedQuiz.questions || []}
                onQuestionAdded={() => { /* refresh */ }}
                onQuestionUpdated={() => { /* refresh */ }}
            />
        </div>
    </div>
)}
```

## Form Validation

### All Question Types
- ✅ Question text required and non-empty
- ✅ Difficulty level required
- ✅ Points auto-assigned based on difficulty

### Multiple Choice Specific
- ✅ All 4 options must be filled
- ✅ Exactly 1 correct answer selected (via radio)

### True/False Specific
- ✅ Correct answer must be selected (true or false)

### Fill in the Blank Specific
- ✅ Correct answer text required

### Essay Specific
- ✅ Explanation/rubric text required (for grading reference)

## State Management

```javascript
const [questions, setQuestions] = useState([]);           // All questions for quiz
const [showCreateForm, setShowCreateForm] = useState(false);  // Show create form?
const [showEditForm, setShowEditForm] = useState(false);     // Show edit form?
const [showPreview, setShowPreview] = useState(false);       // Show preview?
const [selectedQuestion, setSelectedQuestion] = useState(null); // Currently selected
const [loading, setLoading] = useState(false);               // API call loading
const [message, setMessage] = useState({});                  // Toast notifications
const [searchTerm, setSearchTerm] = useState('');            // Search filter
const [filterType, setFilterType] = useState('all');         // Type filter
const [filterDifficulty, setFilterDifficulty] = useState('all'); // Difficulty filter
```

## Features Implemented

### ✅ Create Question
- Form with dynamic fields based on question type
- Validation before submission
- Success/error notifications

### ✅ Edit Question
- Pre-populate form with existing question data
- Update via PUT endpoint
- Success/error notifications

### ✅ Delete Question
- Confirmation dialog before deletion
- Soft-delete or hard-delete support
- Success/error notifications

### ✅ Preview Question
- Display question as learner would see it
- Show correct answer (with visual indicator)
- Show difficulty and points

### ✅ Duplicate Question
- Copy existing question
- Clear ID for new creation
- Useful for creating similar questions

### ✅ Search & Filter
- Full-text search by question text
- Filter by question type
- Filter by difficulty level
- Combine multiple filters

### ✅ Question Numbering
- Auto-increment question order
- Visual numbering (1, 2, 3...)
- Sticky positioning for questions

## Future Enhancements

### Bulk Import
- CSV/Excel upload
- Template validation
- Error reporting

### Question Bank
- Save questions to reusable library
- Tag-based organization
- Category management
- Share questions between quizzes

### Advanced Features
- Question versioning/history
- Question analytics (% correct)
- Multiple correct answers (MC with multiple selections)
- Image/media support
- Equation/formula support (LaTeX)
- Question pool selection (random questions per attempt)

### Sequencing
- Drag-drop reordering
- Conditional logic (show Q2 only if Q1 is correct)
- Section breaks
- Time-per-question limits

## Error Handling

All API calls wrapped with try-catch:
```javascript
try {
    const response = await axios.post('/api/questions', payload);
    // Success handling
} catch (error) {
    showNotification(error.response?.data?.message || 'Error message', 'error');
}
```

## Notifications

Toast notifications with auto-dismiss (3 seconds):
- Success: Green background, success message
- Error: Red background, error message
- Auto-dismissal via setTimeout

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- React 18+
- Requires Axios for HTTP requests
- Requires Lucide React for icons

## Performance Considerations

- Questions list filtered client-side for instant search
- Modal prevents full page reload
- Debounced search (future enhancement)
- Virtual scrolling for large lists (future enhancement)
- Image compression for media uploads (future enhancement)

## Accessibility

- Form labels with `htmlFor` associations
- ARIA attributes on interactive elements
- Keyboard navigation support
- Focus management in modals
- Color-blind friendly difficulty badges (with text labels)

## Testing Strategy

```javascript
// Unit tests for validation
test('validates question text is required', () => {})
test('validates MC has 4 options', () => {})
test('validates correct answer selected', () => {})

// Integration tests
test('creates question via API', () => {})
test('edits question via API', () => {})
test('deletes question with confirmation', () => {})

// E2E tests
test('user creates full quiz with questions', () => {})
test('user can search and filter questions', () => {})
```

## Database Schema Required

```sql
CREATE TABLE questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'fill_blank', 'essay') NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    points INT DEFAULT 5,
    explanation TEXT,
    options JSON,
    correct_answer TEXT,
    order INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Add index for better query performance
CREATE INDEX idx_quiz_id ON questions(quiz_id);
CREATE INDEX idx_order ON questions(quiz_id, order);
```

## Integration Checklist

- [ ] Create Question model in Laravel
- [ ] Create Question controller with CRUD actions
- [ ] Define routes for question endpoints
- [ ] Add validation rules for each question type
- [ ] Test API endpoints with Postman
- [ ] Integrate QuestionBuilder in QuizManagement
- [ ] Test question creation flow
- [ ] Test question editing flow
- [ ] Test question deletion flow
- [ ] Test search and filters
- [ ] Deploy to production
- [ ] Monitor API performance

## Support & Troubleshooting

### Common Issues

1. **Questions not saving**
   - Check API endpoint exists
   - Verify CSRF token in headers
   - Check console for network errors

2. **Search not working**
   - Verify questions loaded in state
   - Check search term is lowercase
   - Debug filter logic

3. **Modal not closing**
   - Verify close button onClick handler
   - Check z-index conflicts
   - Test on different browsers

## References

- React Hooks: https://react.dev/reference/react/hooks
- Axios: https://axios-http.com/docs/intro
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** Production Ready
