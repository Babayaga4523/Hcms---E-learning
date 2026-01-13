<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate - {{ $certificate_number }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; }
        .certificate {
            width: 100%;
            height: 100%;
            padding: 40px;
            box-sizing: border-box;
            background: #f7f7f7;
        }
        .card {
            border: 8px solid #2d6cdf;
            background: white;
            padding: 40px;
            text-align: center;
        }
        h1 { font-size: 42px; margin: 20px 0; }
        h2 { font-size: 24px; margin: 8px 0; color: #333; }
        .meta { margin-top: 30px; font-size: 14px; color: #555; }
        .small { font-size: 12px; color: #777; }

        /* Replaced inline styles with classes to satisfy linters */
        .meta-row { margin-top: 40px; display:flex; justify-content:space-between; align-items:center; }
        .left { text-align: left; }
        .center { text-align: center; }
        .right { text-align: right; }
        .materials-completed { margin-top: 30px; font-size: 12px; color: #777; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="card">
            <h1>Certificate of Completion</h1>
            <h2>{{ $training->title ?? ($certificate->training_title ?? 'Training') }}</h2>
            <p class="meta">This is to certify that</p>
            <h2>{{ $user->name ?? $certificate->user_name }}</h2>

            <p class="meta">has successfully completed the training and met the requirements.</p>

            <div class="meta-row">
                <div class="left">
                    <div class="small">Certificate Number</div>
                    <div>{{ $certificate->certificate_number ?? $certificate_number }}</div>
                </div>

                <div class="center">
                    <div class="small">Issued</div>
                    <div>{{ $issued_date }}</div>
                </div>

                <div class="right">
                    <div class="small">Instructor</div>
                    <div>{{ $certificate->instructor_name ?? ($training->instructor?->name ?? 'Admin LMS') }}</div>
                </div>
            </div>

            <div class="materials-completed">
                Materials completed: {{ $certificate->materials_completed ?? $training->trainingMaterials->count() ?? 'N/A' }}
            </div>
        </div>
    </div>
</body>
</html>