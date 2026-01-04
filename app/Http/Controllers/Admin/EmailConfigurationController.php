<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Mail\Message;

class EmailConfigurationController extends Controller
{
    /**
     * Get email configuration
     */
    public function getConfiguration()
    {
        $config = Cache::get('email_config', [
            'mail_driver' => config('mail.default', 'smtp'),
            'mail_host' => config('mail.mailers.smtp.host', 'smtp.mailtrap.io'),
            'mail_port' => config('mail.mailers.smtp.port', '465'),
            'mail_username' => config('mail.mailers.smtp.username', ''),
            'mail_password' => config('mail.mailers.smtp.password', ''),
            'mail_encryption' => config('mail.mailers.smtp.encryption', 'tls'),
            'mail_from_address' => config('mail.from.address', 'noreply@hcms.local'),
            'mail_from_name' => config('mail.from.name', 'HCMS E-Learning'),
        ]);

        return response()->json($config);
    }

    /**
     * Save email configuration
     */
    public function saveConfiguration(Request $request)
    {
        try {
            $config = $request->all();

            // Validate required fields
            $request->validate([
                'mail_driver' => 'required|string',
                'mail_host' => 'required|string',
                'mail_port' => 'required|integer',
                'mail_username' => 'required|string',
                'mail_encryption' => 'required|string',
                'mail_from_address' => 'required|email',
                'mail_from_name' => 'required|string',
            ]);

            // Update .env file
            $this->updateEnvFile('MAIL_DRIVER', $config['mail_driver']);
            $this->updateEnvFile('MAIL_HOST', $config['mail_host']);
            $this->updateEnvFile('MAIL_PORT', $config['mail_port']);
            $this->updateEnvFile('MAIL_USERNAME', $config['mail_username']);
            
            if (!empty($config['mail_password'])) {
                $this->updateEnvFile('MAIL_PASSWORD', $config['mail_password']);
            }

            $this->updateEnvFile('MAIL_ENCRYPTION', $config['mail_encryption']);
            $this->updateEnvFile('MAIL_FROM_ADDRESS', $config['mail_from_address']);
            $this->updateEnvFile('MAIL_FROM_NAME', $config['mail_from_name']);

            // Cache the configuration
            Cache::put('email_config', $config, now()->addDays(365));

            return response()->json([
                'message' => 'Email configuration saved successfully',
                'data' => $config
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to save email configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test email sending
     */
    public function testEmail(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
            ]);

            $testEmail = $request->input('email');

            // Send test email
            Mail::raw('This is a test email from HCMS E-Learning system.', function (Message $message) use ($testEmail) {
                $message->to($testEmail)
                    ->subject('HCMS Test Email')
                    ->from(config('mail.from.address', 'noreply@hcms.local'), config('mail.from.name', 'HCMS'));
            });

            return response()->json([
                'message' => 'Test email sent successfully',
                'recipient' => $testEmail
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send test email',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Update environment file
     */
    private function updateEnvFile($key, $value)
    {
        $envFile = base_path('.env');
        $contents = file_get_contents($envFile);

        // Escape quotes in value
        $value = str_replace('"', '\"', $value);

        $pattern = "/^{$key}=.*/m";
        $replacement = "{$key}=\"{$value}\"";

        if (preg_match($pattern, $contents)) {
            $contents = preg_replace($pattern, $replacement, $contents);
        } else {
            $contents .= "\n{$key}=\"{$value}\"";
        }

        file_put_contents($envFile, $contents);
    }
}
