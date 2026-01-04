# 📁 HCMS E-Learning System - Folder Structure

## Backend Structure

### 🎓 Controllers
```
app/Http/Controllers/
├── Training/
│   ├── TrainingController.php        (List, Show, Index)
│   ├── TrainingStoreController.php   (Create, Store)
│   └── TrainingUpdateController.php  (Edit, Update, Delete)
├── Material/
│   ├── MaterialController.php        (List, Show)
│   └── MaterialUploadController.php  (Upload video, PDF, PPT)
├── Quiz/
│   ├── QuizController.php            (List, Show)
│   ├── QuizTakeController.php        (Start, Submit answers)
│   └── QuizResultController.php      (View results, Analytics)
├── Report/
│   ├── ReportController.php          (Dashboard, Progress)
│   ├── OJKReportController.php       (OJK compliance reports)
│   ├── BNIReportController.php       (BNI reports)
│   └── AuditReportController.php     (Audit reports)
└── Admin/
    └── DashboardController.php       (Admin panel)
```

### 📋 Form Requests (Validation)
```
app/Http/Requests/
├── Training/
│   ├── StoreTrainingRequest.php      (Create validation)
│   └── UpdateTrainingRequest.php     (Update validation)
├── Material/
│   ├── StoreMaterialRequest.php
│   └── UploadMaterialRequest.php
└── Quiz/
    ├── StoreQuizRequest.php
    └── SubmitAnswerRequest.php
```

### 🗂️ Models
```
app/Models/
├── User.php                          (Employee/Learner)
├── Training.php                      (Training programs)
├── Material.php                      (Video, PDF, PPT)
├── Quiz.php                          (Pre-test, Post-test)
├── Question.php                      (Quiz questions)
├── Answer.php                        (Quiz answers options)
├── UserTraining.php                  (User enrollment)
├── UserQuizAnswer.php                (User quiz responses)
├── UserProgress.php                  (Learning progress tracking)
├── Traits/
│   ├── HasTimestamps.php
│   ├── HasStatus.php
│   └── HasAudit.php
└── Relations/
    ├── TrainingRelations.php
    ├── QuizRelations.php
    └── UserRelations.php
```

### ⚙️ Services (Business Logic)
```
app/Services/
├── Training/
│   ├── TrainingService.php
│   └── EnrollmentService.php
├── Material/
│   ├── MaterialService.php
│   ├── VideoService.php
│   └── StorageService.php
├── Quiz/
│   ├── QuizService.php
│   ├── ScoringService.php
│   └── AnalyticsService.php
└── Report/
    ├── ReportService.php
    ├── OJKReportService.php
    ├── BNIReportService.php
    └── AuditReportService.php
```

### 📌 Enums & Constants
```
app/Enums/
├── TrainingStatus.php                (Active, Draft, Completed, Archived)
├── MaterialType.php                  (Video, PDF, PPT)
├── QuizType.php                      (PreTest, PostTest)
├── QuestionType.php                  (MultipleChoice, Essay, TrueFalse)
├── UserRole.php                      (Learner, Instructor, Admin, PIC)
└── ReportType.php                    (OJK, BNI, Audit)
```

### 🛡️ Exceptions & Middlewares
```
app/Exceptions/
├── MaterialUploadException.php
├── QuizSubmissionException.php
└── ReportGenerationException.php

app/Http/Middleware/
├── CheckTrainingAccess.php           (Verify enrollment)
├── CheckQuizAttempt.php              (Verify quiz rules)
└── AuditLog.php                      (Log actions for compliance)
```

---

## Frontend Structure

### 📄 Pages
```
resources/js/Pages/
├── Training/
│   ├── Index.jsx                     (List semua training)
│   ├── Show.jsx                      (Detail training)
│   ├── Enroll.jsx                    (Enrollment page)
│   └── Dashboard.jsx                 (My trainings)
├── Material/
│   ├── VideoPlayer.jsx               (Video learning)
│   ├── PDFViewer.jsx                 (PDF reading)
│   ├── SlideViewer.jsx               (PPT presentation)
│   └── MaterialList.jsx              (Material list)
├── Quiz/
│   ├── Start.jsx                     (Quiz start page)
│   ├── Take.jsx                      (Quiz taker)
│   ├── Review.jsx                    (Review answers)
│   └── Results.jsx                   (Quiz results)
├── Report/
│   ├── Progress.jsx                  (Learning progress)
│   ├── Certificate.jsx               (Achievement)
│   └── Performance.jsx               (Performance analytics)
└── Admin/
    ├── Dashboard.jsx
    ├── TrainingManagement.jsx
    ├── MaterialManagement.jsx
    ├── QuizManagement.jsx
    ├── UserManagement.jsx
    ├── ReportGeneration.jsx
    └── Settings.jsx
```

### 🧩 Components
```
resources/js/Components/
├── Training/
│   ├── TrainingCard.jsx
│   ├── TrainingList.jsx
│   ├── TrainingFilter.jsx
│   └── EnrollButton.jsx
├── Material/
│   ├── MaterialCard.jsx
│   ├── MaterialPlayer.jsx
│   ├── MaterialUploader.jsx
│   └── MaterialProgress.jsx
├── Quiz/
│   ├── QuestionCard.jsx
│   ├── QuizTimer.jsx
│   ├── AnswerOptions.jsx
│   └── QuizProgress.jsx
├── Report/
│   ├── ProgressChart.jsx
│   ├── PerformanceGraph.jsx
│   └── CertificatePreview.jsx
├── Layout/
│   ├── AuthLayout.jsx
│   ├── AdminLayout.jsx
│   ├── Navbar.jsx
│   └── Sidebar.jsx
└── Shared/
    ├── Modal.jsx
    ├── Alert.jsx
    ├── LoadingSpinner.jsx
    ├── Pagination.jsx
    └── FormError.jsx
```

### 🎣 Hooks
```
resources/js/Hooks/
├── useTraining.js                    (Training data fetching)
├── useQuiz.js                        (Quiz logic)
├── useAuth.js                        (Authentication)
├── useNotification.js                (Toast messages)
├── usePagination.js                  (Pagination logic)
└── useLocalStorage.js                (Draft saving)
```

### 📡 Services
```
resources/js/Services/
├── api.js                            (Axios base configuration)
├── training.js                       (Training API calls)
├── material.js                       (Material API calls)
├── quiz.js                           (Quiz API calls)
├── auth.js                           (Authentication API)
└── report.js                         (Report API calls)
```

### 🛠️ Utils
```
resources/js/Utils/
├── formatter.js                      (Date, currency formatting)
├── validators.js                     (Form validation)
├── constants.js                      (App constants)
├── helpers.js                        (Helper functions)
└── permissions.js                    (Role-based access)
```

---

## Database Structure

### Migrations
```
database/migrations/
├── 2024_01_01_000001_create_trainings_table.php
├── 2024_01_01_000002_create_materials_table.php
├── 2024_01_01_000003_create_quizzes_table.php
├── 2024_01_01_000004_create_questions_table.php
├── 2024_01_01_000005_create_answers_table.php
├── 2024_01_01_000006_create_user_trainings_table.php
├── 2024_01_01_000007_create_user_quiz_answers_table.php
├── 2024_01_01_000008_create_user_progress_table.php
└── 2024_01_01_000009_create_audit_logs_table.php
```

### Seeders
```
database/seeders/
├── DatabaseSeeder.php
└── Training/
    ├── TrainingSeeder.php
    ├── MaterialSeeder.php
    ├── QuizSeeder.php
    └── UserSeeder.php
```

---

## Storage Structure

### Materials
```
storage/app/materials/
├── videos/                           (Learning videos)
│   ├── training_1/
│   └── training_2/
├── documents/                        (PDF files)
│   ├── training_1/
│   └── training_2/
└── presentations/                    (PPT/Slide files)
    ├── training_1/
    └── training_2/
```

### Reports
```
storage/app/reports/
├── ojk/                              (OJK compliance exports)
│   ├── 2024_01/
│   └── 2024_02/
├── bni/                              (BNI reports)
│   ├── 2024_01/
│   └── 2024_02/
└── audit/                            (Audit records)
    ├── 2024_01/
    └── 2024_02/
```

---

## Configuration Files

```
Root/
├── .env                              (Environment variables)
├── .env.example
├── composer.json                     (PHP dependencies)
├── package.json                      (Node dependencies)
├── vite.config.js                    (Vite bundler config)
├── tailwind.config.js                (Tailwind CSS config)
├── postcss.config.js                 (PostCSS config)
├── phpunit.xml                       (PHPUnit testing)
└── eslint.config.js                  (ESLint config)
```

---

## Naming Conventions

### Controllers
- Singular + action: `TrainingController`
- Methods: `index()`, `show()`, `create()`, `store()`, `edit()`, `update()`, `destroy()`

### Models
- Singular: `Training`, `Material`, `Quiz`, `Question`

### Routes
- Plural resources: `/trainings`, `/materials`, `/quizzes`
- Nested: `/trainings/1/materials`, `/quizzes/1/answers`

### Components
- PascalCase: `TrainingCard.jsx`, `QuizTimer.jsx`

### Functions
- camelCase: `fetchTrainings()`, `submitQuiz()`

### Variables
- camelCase: `userProgress`, `trainingId`, `quizStatus`

---

## Development Workflow

```
1. Create migration          → Create database table
2. Create model             → Setup relationships
3. Create form request      → Validation rules
4. Create controller        → API endpoints
5. Create service           → Business logic
6. Create routes            → Expose endpoints
7. Create React components  → UI implementation
8. Create tests             → Unit & feature tests
```

---

**Last Updated:** December 23, 2025
**Version:** 1.0
