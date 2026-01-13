import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FileText, Award, CheckCircle2, Clock, Play } from 'lucide-react';

export default function TrainingResults({ auth, training = {}, enrollment = {}, progress = {}, quizAttempts = {}, materials = [] }) {
    const user = auth?.user || {};

    const pre = quizAttempts.pretest || null;
    const post = quizAttempts.posttest || null;

    return (
        <AppLayout user={user}>
            <Head title={`Hasil - ${training.title || 'Training'}`} />

            <div className="max-w-6xl mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold">Review Hasil — {training.title}</h1>
                        <p className="text-sm text-slate-500 mt-1">Ringkasan Pretest, Post-Test, dan Materi yang telah Anda selesaikan.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/training/${training.id}`} className="px-4 py-2 bg-white rounded-xl border shadow-sm">Kembali</Link>
                        <Link href={`/training/${training.id}/certificate`} className="px-4 py-2 bg-amber-400 text-white rounded-xl">Sertifikat</Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                <Award />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Pre-Test</p>
                                <h3 className="font-bold text-lg">{pre?.completed ? `${pre.score}%` : 'Belum'}</h3>
                                {pre?.completed && (
                                    <Link href={`/training/${training.id}/quiz/pretest/result/${pre.attempt_id}`} className="text-xs text-blue-600 mt-2 inline-block">Lihat hasil</Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <CheckCircle2 />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Post-Test</p>
                                <h3 className="font-bold text-lg">{post?.completed ? `${post.score}%` : 'Belum'}</h3>
                                {post?.completed && (
                                    <Link href={`/training/${training.id}/quiz/posttest/result/${post.attempt_id}`} className="text-xs text-blue-600 mt-2 inline-block">Lihat hasil</Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600">
                                <FileText />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Materi</p>
                                <h3 className="font-bold text-lg">{materials.length} item</h3>
                                <p className="text-xs text-slate-500 mt-2">{materials.filter(m => m.is_completed).length} selesai</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                    <h3 className="font-bold mb-4">Daftar Materi</h3>
                    <div className="space-y-3">
                        {materials.map((m, i) => (
                            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-slate-50 flex items-center justify-center text-slate-600">
                                        <Play size={16} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{m.title}</div>
                                        <div className="text-xs text-slate-500">{m.duration ? `${m.duration} min` : ''}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {m.is_completed ? (
                                        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">Selesai</div>
                                    ) : (
                                        <div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-xs">Belum</div>
                                    )}
                                    <Link href={`/training/${training.id}/material/${m.id}`} className="px-3 py-1 bg-white rounded-lg border text-sm">Buka</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
