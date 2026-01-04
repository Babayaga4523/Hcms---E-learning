import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AuditorModeSwitch({ auditorMode, setAuditorMode }) {
    return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Auditor Mode</h3>
                    <p className="text-sm text-gray-600">
                        {auditorMode 
                            ? '✅ Mode: Presentasi (Data sensitif disembunyikan)' 
                            : '🔓 Mode: Normal (Akses penuh)'}
                    </p>
                </div>
                
                <button
                    onClick={() => setAuditorMode(!auditorMode)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                        auditorMode
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    {auditorMode ? (
                        <>
                            <Eye className="w-5 h-5" />
                            Kembali ke Normal
                        </>
                    ) : (
                        <>
                            <EyeOff className="w-5 h-5" />
                            Aktifkan Auditor Mode
                        </>
                    )}
                </button>
            </div>

            {auditorMode && (
                <div className="mt-4 p-3 bg-white border border-purple-200 rounded-lg">
                    <p className="text-xs text-purple-900 font-semibold">
                        🔒 Mode Auditor Aktif:
                    </p>
                    <ul className="text-xs text-purple-800 mt-2 space-y-1 ml-4 list-disc">
                        <li>Data sensitif (NIP, Email) disembunyikan</li>
                        <li>Hanya grafik & statistik umum yang ditampilkan</li>
                        <li>Tombol edit/delete tidak tersedia</li>
                        <li>Perfect untuk presentasi ke auditor OJK/BNI</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
