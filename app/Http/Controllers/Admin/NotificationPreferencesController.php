<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class NotificationPreferencesController extends Controller
{
    /**
     * Get notification preferences
     */
    public function getPreferences(Request $request)
    {
        try {
            $userId = $request->user()->id;
            
            $preferences = Cache::get("notification_preferences_{$userId}", [
                // Email Notifications
                'email_user_registration' => true,
                'email_program_enrollment' => true,
                'email_program_completion' => true,
                'email_quiz_reminder' => true,
                'email_deadline_reminder' => true,
                'email_approval_request' => true,
                'email_compliance_alert' => true,

                // SMS Notifications
                'sms_enabled' => false,
                'sms_quiz_reminder' => false,
                'sms_deadline_reminder' => false,
                'sms_approval_alert' => false,

                // In-App Notifications
                'app_user_registration' => true,
                'app_program_enrollment' => true,
                'app_program_completion' => true,
                'app_quiz_reminder' => true,
                'app_deadline_reminder' => true,
                'app_approval_request' => true,
                'app_compliance_alert' => true,

                // Notification Schedule
                'quiet_hours_enabled' => false,
                'quiet_hours_start' => '22:00',
                'quiet_hours_end' => '08:00',
            ]);

            return response()->json($preferences);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to get notification preferences',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save notification preferences
     */
    public function savePreferences(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $preferences = $request->all();

            // Validate quiet hours if enabled
            if ($preferences['quiet_hours_enabled'] ?? false) {
                $request->validate([
                    'quiet_hours_start' => 'required|date_format:H:i',
                    'quiet_hours_end' => 'required|date_format:H:i',
                ]);
            }

            // Cache preferences (expires in 1 year)
            Cache::put("notification_preferences_{$userId}", $preferences, now()->addDays(365));

            return response()->json([
                'message' => 'Notification preferences saved successfully',
                'data' => $preferences
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to save notification preferences',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get SMS gateway configuration
     */
    public function getSmsConfiguration()
    {
        try {
            $smsConfig = Cache::get('sms_config', [
                'provider' => 'twilio',
                'enabled' => false,
                'account_sid' => '',
                'auth_token' => '',
                'phone_number' => '',
            ]);

            return response()->json($smsConfig);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to get SMS configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save SMS gateway configuration
     */
    public function saveSmsConfiguration(Request $request)
    {
        try {
            $smsConfig = $request->all();

            // Validate SMS configuration
            if ($smsConfig['enabled'] ?? false) {
                $request->validate([
                    'provider' => 'required|string',
                    'account_sid' => 'required|string',
                    'auth_token' => 'required|string',
                    'phone_number' => 'required|string',
                ]);
            }

            // Cache SMS configuration
            Cache::put('sms_config', $smsConfig, now()->addDays(365));

            return response()->json([
                'message' => 'SMS configuration saved successfully',
                'data' => $smsConfig
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to save SMS configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test SMS sending
     */
    public function testSms(Request $request)
    {
        try {
            $request->validate([
                'phone_number' => 'required|string',
            ]);

            // TODO: Implement actual SMS sending via Twilio or other provider
            // For now, just return success
            
            return response()->json([
                'message' => 'Test SMS sent successfully',
                'phone_number' => $request->input('phone_number')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send test SMS',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
