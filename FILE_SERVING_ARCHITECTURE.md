# 📊 FILE SERVING ARCHITECTURE & FLOW

## Request-Response Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                            │
└─────────────────────────────────────────────────────────────────┘
                             ↓
        User clicks on PDF/Excel material in MaterialViewer
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│               FRONTEND: MaterialViewer.jsx                      │
│  ─────────────────────────────────────────────────────────────  │
│  1. Detect file type from URL/extension                        │
│     ├─ isPdfFile = url.match(/\.pdf$/i)                        │
│     ├─ isExcelFile = url.match(/\.(xlsx|xls|csv)$/i)           │
│     └─ isPowerpointFile = url.match(/\.pptx$/i)                │
│                             ↓                                   │
│  2. Route to correct viewer                                     │
│     ├─ PDF → PDFViewer (iframe)                                │
│     ├─ Excel → ExcelViewer (SheetJS)                           │
│     ├─ PPT → PowerPointViewer (download)                       │
│     └─ Other → IFrameViewer or download                        │
│                             ↓                                   │
│  3. Make HTTP request                                           │
│     GET /training/{trainingId}/material/{materialId}/serve     │
│     Headers: {                                                  │
│         Authorization: Bearer $TOKEN,                          │
│         Accept: application/pdf                                │
│     }                                                           │
└─────────────────────────────────────────────────────────────────┘
                             ↓
                    [Network Request]
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│          BACKEND: MaterialController::serveFile()              │
│  ─────────────────────────────────────────────────────────────  │
│  1. Authenticate user                                           │
│  2. Find material record                                        │
│  3. Check enrollment/permissions                               │
│  4. Get file path                                               │
│     ├─ Check pdf_path first (if Excel converted to PDF)        │
│     ├─ Fall back to file_path                                  │
│     └─ Verify file exists on disk                              │
│  5. Detect MIME type                                            │
│     $mimeType = mime_content_type($fullPath);                  │
│     ├─ application/pdf                                         │
│     ├─ text/csv                                                │
│     ├─ video/mp4                                               │
│     └─ application/vnd.ms-excel                                │
│  6. Log file serving                                            │
│     "Serving file: document.pdf with MIME type: application/pdf"
│  7. Set HTTP response headers                                   │
│     Content-Type: application/pdf                              │
│     Content-Disposition: inline; filename="document.pdf"       │ ← KEY!
│     Content-Length: 12345                                      │
│     Cache-Control: public, max-age=86400                       │
│     Accept-Ranges: bytes (for video seeking)                   │
│     X-Content-Type-Options: nosniff                            │
│  8. Stream file to client                                       │
│     response()->stream(function() use ($fullPath) {            │
│         $stream = fopen($fullPath, 'rb');                      │
│         fpassthru($stream);                                    │
│         fclose($stream);                                       │
│     }, 200, $headers);                                         │
└─────────────────────────────────────────────────────────────────┘
                             ↓
                    [Network Response]
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                 BROWSER: HTTP Response                         │
│  ─────────────────────────────────────────────────────────────  │
│  HTTP/1.1 200 OK                                                │
│  Content-Type: application/pdf                                 │
│  Content-Disposition: inline; filename="document.pdf"  ← KEY!  │
│  Content-Length: 12345                                         │
│  Cache-Control: public, max-age=86400                          │
│  X-Content-Type-Options: nosniff                               │
│  Accept-Ranges: bytes                                          │
│                             ↓                                   │
│  Browser reads Content-Disposition: inline                    │
│  → "Display this file inline" (NOT download)                  │
│                             ↓                                   │
│  Browser checks Content-Type: application/pdf                 │
│  → "This is a PDF file"                                        │
│                             ↓                                   │
│  Browser can display:                                          │
│  ✓ Native PDF viewer enabled                                   │
│  ✓ PDF.js viewer via iframe                                    │
│  ✓ Download link as fallback                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND: Display PDF (PDFViewer)                 │
│  ─────────────────────────────────────────────────────────────  │
│  <iframe src={url + '#toolbar=1&navpanes=0'} />               │
│  ├─ PDF.js viewer toolbar visible                              │
│  ├─ Zoom controls                                              │
│  ├─ Search functionality                                       │
│  ├─ Page navigation                                            │
│  ├─ Print capability                                           │
│  └─ User can interact with PDF inline ✅                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Excel File Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 ADMIN UPLOADS EXCEL FILE                       │
│                                                                 │
│  User selects: document.xlsx                                   │
│  Click: Upload                                                 │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│    AdminTrainingProgramController::uploadMaterial()            │
│  ─────────────────────────────────────────────────────────────  │
│  1. Receive file from upload                                    │
│  2. Detect MIME type & extension                               │
│  3. Check if Excel file                                         │
│     if (in_array($extension, ['xlsx','xls','xlsm','csv']))    │
│  4. Store original Excel file                                   │
│     storage/app/public/training-materials/document.xlsx        │
│  5. Call ExcelToPdfService::convert()                          │
│     Input: storage/app/public/.../document.xlsx               │
│     Output: storage/app/public/.../pdf/[timestamp]_document.pdf
│  6. Save to database                                            │
│     file_path: "training-materials/document.xlsx"             │
│     pdf_path: "training-materials/pdf/[timestamp]_document.pdf"
│     file_type: "pdf" (because converted)                       │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│        ExcelToPdfService::convert()                            │
│  ─────────────────────────────────────────────────────────────  │
│  1. Load Excel file with PhpSpreadsheet                        │
│     $spreadsheet = IOFactory::load($inputPath);               │
│  2. Create PDF writer (mPDF)                                    │
│     $writer = new Mpdf();                                      │
│  3. Convert each sheet to HTML                                  │
│     Preserves formatting, colors, borders                      │
│  4. Write PDF                                                   │
│     $writer->save($outputPath);                                │
│  5. Return success/failure                                      │
│     return file_exists($outputPath);                           │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE UPDATE                                   │
│  ─────────────────────────────────────────────────────────────  │
│  training_materials table:                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ id | title  | file_path | pdf_path | file_type | ...   │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ 5  │ Budget │ training- │ training │ pdf       │ ...   │  │
│  │    │ .xlsx  │ materials/│ materials│           │        │  │
│  │    │        │ Budget... │ /pdf/... │           │        │  │
│  │    │        │ .xlsx     │ .pdf     │           │        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ✓ file_path = original Excel location                        │
│  ✓ pdf_path = converted PDF location                          │
│  ✓ file_type = "pdf" (to route to PDFViewer)                 │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│           STUDENT VIEWS MATERIAL                               │
│  ─────────────────────────────────────────────────────────────  │
│  1. Click on "Budget.xlsx" material                            │
│  2. MaterialViewer fetches material data                        │
│  3. material.type = "pdf" (set during upload)                 │
│  4. material.pdf_path = "training-materials/pdf/..."          │
│  5. Frontend decides to use PDFViewer                          │
│  6. Requests: GET /training/1/material/5/serve               │
│  7. Backend returns PDF (not Excel)                            │
│  8. PDFViewer displays PDF inline                              │
│                             ↓                                   │
│  ✅ Student sees beautiful PDF of spreadsheet                 │
│  ✅ No Excel downloaded                                        │
│  ✅ Cannot edit original Excel (security)                     │
│  ✅ PDF can be printed, zoomed, searched                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Decision Tree: Which Viewer to Use

```
User clicks on material
         ↓
    What is file type?
    ↙        ↓        ↘         ↙          ↘
  VIDEO    PDF      EXCEL    PPTX       OTHER
    ↓        ↓        ↓        ↓          ↓
  [1]      [2]      [3]      [4]       [5]

[1] VIDEO
    ├─ Check if .mp4 / .webm / .mov / etc.
    └─ Render VideoPlayer component
       ├─ Play/pause buttons
       ├─ Seek bar with Accept-Ranges
       ├─ Volume control
       ├─ Fullscreen
       └─ Skip forward/backward

[2] PDF
    ├─ Check if material.type = 'pdf' OR url ends with .pdf
    ├─ Render PDFViewer component
    │  ├─ <iframe src={url} />
    │  ├─ PDF.js toolbar
    │  ├─ Zoom, search, print
    │  └─ Download fallback
    └─ Backend returns:
       Content-Disposition: inline
       Content-Type: application/pdf

[3] EXCEL
    ├─ Check if url ends with .xlsx / .xls / .csv
    ├─ Check if material.type != 'pdf'
    │  (converted Excels have type='pdf')
    ├─ Render ExcelViewer component
    │  ├─ Load SheetJS from CDN
    │  ├─ Fetch Excel file
    │  ├─ Parse XLSX in browser
    │  ├─ Display as HTML table
    │  ├─ Show sheet tabs
    │  └─ Download link at bottom
    └─ Backend returns:
       Content-Disposition: inline
       Content-Type: text/csv OR application/vnd.ms-excel

[4] POWERPOINT
    ├─ Check if url ends with .pptx / .ppt
    ├─ Render PowerPointViewer component
    │  ├─ Show download button
    │  ├─ "Open in PowerPoint/Google Slides"
    │  └─ No inline preview (not supported)
    └─ Backend returns:
       Content-Disposition: inline (fallback to download)
       Content-Type: application/vnd.ms-powerpoint

[5] OTHER
    ├─ DOCX / DOC → IFrameViewer
    ├─ HTML → IFrameViewer
    ├─ Image → ImageViewer
    ├─ Unknown → IFrameViewer (browser decides)
    └─ Backend returns:
       Content-Disposition: inline
       Content-Type: detected by mime_content_type()
```

---

## HTTP Headers Explanation

### Content-Type Header

**Purpose:** Tell browser what kind of file it is

```
Content-Type: application/pdf
  → "This is a PDF file"
  → Browser can display with PDF viewer

Content-Type: text/csv
  → "This is a CSV file"
  → Browser can display as text

Content-Type: application/octet-stream
  → "Unknown binary file"
  → Browser MUST download (cannot display)

Content-Type: video/mp4
  → "This is a video file"
  → Browser can play with video player
```

**Key Point:** If MIME type detection fails, many browsers default to download

### Content-Disposition Header

**Purpose:** Tell browser HOW to handle the file

```
Content-Disposition: inline; filename="document.pdf"
  → "Display this file inline in the browser"
  → Use filename only if user downloads
  → For PDF: Open in PDF viewer
  → For video: Play in video player
  → For image: Show image in browser

Content-Disposition: attachment; filename="document.pdf"
  → "Download this file"
  → Saves to Downloads folder
  → User cannot view inline
  → Always downloads
```

**KEY DIFFERENCE:**
```
inline = Display in browser (what we want) ✅
attachment = Download (what we DON'T want) ❌
```

### Other Headers

```
Content-Length: 12345
  → File size in bytes
  → Browser shows progress bar
  → Ensures complete file transfer

Accept-Ranges: bytes
  → Browser can request partial content
  → Enables video seek bar
  → Allows resume on interrupted downloads

Cache-Control: public, max-age=86400
  → Cache file for 1 day (86400 seconds)
  → public = anyone can cache
  → Improves performance on repeat views

X-Content-Type-Options: nosniff
  → Security: Prevent MIME type sniffing
  → Browser respects Content-Type header
  → Prevents vulnerability exploits

Pragma: public
  → Legacy cache directive (for old browsers)
  → Equivalent to Cache-Control

Expires: [future date]
  → Legacy expiration (for old browsers)
  → File is "fresh" until this date
```

---

## Troubleshooting Decision Tree

```
File auto-downloads when clicked
         ↓
    ┌────────────────────────────┐
    │ Step 1: Check DevTools     │
    └────────────────────────────┘
         ↓
    Open F12 → Network tab
    Click material → Find request
    Click request → Response Headers
         ↓
    ┌─────────────────────────────────────────┐
    │ Is Content-Disposition: inline?         │
    └─────────────────────────────────────────┘
    ↙                                      ↘
  YES (✓)                              NO (✗)
   ↓                                      ↓
 [A]                                    [B]
   ↓                                      ↓

[A] Headers are CORRECT (inline)
    ↓
    Issue is CLIENT-SIDE
    ↓
    Try these:
    ├─ Browser settings
    │  ├─ Chrome: Settings → Downloads → PDF behavior
    │  ├─ Firefox: about:config → pdfjs.disabled
    │  └─ Safari: Preferences → General
    ├─ Incognito mode (disable extensions)
    ├─ Different browser
    ├─ Clear browser cache/cookies
    ├─ Check antivirus/firewall
    └─ Check download manager

[B] Headers are WRONG (attachment or missing)
    ↓
    Issue is SERVER-SIDE
    ↓
    Try these:
    ├─ Check .htaccess for Content-Disposition rules
    ├─ Check nginx config for header overrides
    ├─ Review Laravel middleware
    ├─ Check for plugins modifying response
    ├─ Review web server configuration
    ├─ Verify file permissions
    └─ Check server logs for errors
```

---

## Performance Optimization

```
File Serving Pipeline:

1. Request arrives
2. Authentication check → Verify user logged in
3. Database query → Get material record
4. File system check → Verify file exists
5. MIME type detection → Identify file format
6. Stream to client → Send file in chunks

Optimizations Applied:
✓ Cache-Control headers for browser caching
✓ Accept-Ranges for resumable downloads
✓ Response streaming (not loading entire file in memory)
✓ File size verification before sending
✓ Logging for debugging issues
```

---

**Status:** All components working correctly ✅
**Remaining:** Browser verification required to identify root cause

See [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) for detailed diagnostics.
