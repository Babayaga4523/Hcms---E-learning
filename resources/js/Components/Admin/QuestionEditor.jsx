import React, { useState } from 'react';

export default function QuestionEditor({ question, index, onChange, onRemove, showPreviewOnly = false }) {
    const [previewOpen, setPreviewOpen] = useState(false);

    const update = (field, value) => {
        onChange(index, field, value);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between mb-4">
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase tracking-wider">Question {index + 1}</span>
                {!showPreviewOnly && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPreviewOpen(!previewOpen)} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded text-sm">Preview</button>
                        {onRemove && (
                            <button onClick={() => onRemove(index)} className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm">Remove</button>
                        )}
                    </div>
                )}
            </div>

            {!showPreviewOnly && (
                <>
                    <textarea
                        value={question.question_text}
                        onChange={(e) => update('question_text', e.target.value)}
                        placeholder="Enter your question here..."
                        className="w-full text-lg font-semibold text-slate-800 placeholder-slate-300 outline-none mb-4 p-2 border border-slate-200 rounded-lg"
                        rows={2}
                    />

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input value={question.option_a} onChange={(e) => update('option_a', e.target.value)} placeholder="Option A" className="p-2 border rounded" />
                        <input value={question.option_b} onChange={(e) => update('option_b', e.target.value)} placeholder="Option B" className="p-2 border rounded" />
                        <input value={question.option_c} onChange={(e) => update('option_c', e.target.value)} placeholder="Option C" className="p-2 border rounded" />
                        <input value={question.option_d} onChange={(e) => update('option_d', e.target.value)} placeholder="Option D" className="p-2 border rounded" />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm">Correct answer:</label>
                        <select value={question.correct_answer} onChange={(e) => update('correct_answer', e.target.value)} className="px-3 py-1 border rounded">
                            <option value="a">A</option>
                            <option value="b">B</option>
                            <option value="c">C</option>
                            <option value="d">D</option>
                        </select>
                    </div>
                </>
            )}

            {previewOpen && (
                <div className="mt-4 p-3 bg-slate-50 rounded">
                    <h4 className="font-bold mb-2">Preview</h4>
                    <p className="mb-2 text-slate-800">{question.question_text}</p>
                    <ol className="list-decimal pl-5 text-sm text-slate-700">
                        <li>{question.option_a}</li>
                        <li>{question.option_b}</li>
                        <li>{question.option_c}</li>
                        <li>{question.option_d}</li>
                    </ol>
                    <p className="text-xs text-slate-400 mt-2">Correct: {question.correct_answer.toUpperCase()}</p>
                </div>
            )}
        </div>
    );
}
