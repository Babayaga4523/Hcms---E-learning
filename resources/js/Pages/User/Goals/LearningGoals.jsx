import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Target, Trophy, TrendingUp, Calendar, Plus, X, Edit3, 
    Trash2, Check, Clock, Zap, Award, Star, ChevronRight,
    BarChart3, Sparkles, Flag, Book, CheckCircle2
} from 'lucide-react';

const GoalCard = ({ goal, onEdit, onDelete, onToggleComplete }) => {
    const progress = (goal.current_progress / goal.target_value) * 100;
    const isCompleted = goal.status === 'completed';
    
    const typeConfig = {
        weekly: { color: 'bg-blue-500', icon: Calendar, label: 'Weekly' },
        monthly: { color: 'bg-purple-500', icon: Calendar, label: 'Monthly' },
        custom: { color: 'bg-teal-500', icon: Target, label: 'Custom' },
    };

    const config = typeConfig[goal.period] || typeConfig.weekly;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden hover:shadow-md transition ${
                isCompleted ? 'border-green-400' : 'border-slate-200'
            }`}
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 ${config.color} text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1`}>
                                <config.icon size={10} /> {config.label}
                            </span>
                            {isCompleted && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                                    <Trophy size={10} /> Completed
                                </span>
                            )}
                        </div>
                        <h3 className={`text-lg font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {goal.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">{goal.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onEdit(goal)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                            title="Edit"
                        >
                            <Edit3 size={16} className="text-slate-600" />
                        </button>
                        <button 
                            onClick={() => onDelete(goal.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                        >
                            <Trash2 size={16} className="text-red-600" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-600">
                            {goal.current_progress} / {goal.target_value} {goal.unit}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            className={`h-full rounded-full ${
                                isCompleted ? 'bg-green-500' : 
                                progress >= 75 ? 'bg-amber-500' : 
                                progress >= 50 ? 'bg-blue-500' : 'bg-slate-400'
                            }`}
                        />
                    </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {goal.days_remaining > 0 ? `${goal.days_remaining} days left` : 'Expired'}
                        </span>
                        {goal.points && (
                            <span className="flex items-center gap-1">
                                <Star size={12} className="text-amber-500" />
                                {goal.points} pts
                            </span>
                        )}
                    </div>

                    {!isCompleted && progress >= 100 && (
                        <button 
                            onClick={() => onToggleComplete(goal.id)}
                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition flex items-center gap-1"
                        >
                            <CheckCircle2 size={14} /> Mark Complete
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const MilestoneCard = ({ milestone }) => {
    return (
        <div className={`flex items-center gap-4 p-4 rounded-xl ${
            milestone.achieved ? 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300' : 'bg-slate-50 border border-slate-200'
        }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                milestone.achieved ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-500'
            }`}>
                <Trophy size={24} />
            </div>
            <div className="flex-1">
                <h4 className={`font-bold ${milestone.achieved ? 'text-amber-900' : 'text-slate-700'}`}>
                    {milestone.title}
                </h4>
                <p className="text-xs text-slate-600">{milestone.description}</p>
            </div>
            {milestone.achieved && (
                <div className="text-right">
                    <p className="text-xs text-amber-700 font-bold">Unlocked!</p>
                    <p className="text-[10px] text-amber-600">{milestone.achieved_date}</p>
                </div>
            )}
        </div>
    );
};

export default function LearningGoals({ auth }) {
    const user = auth.user;
    
    const [goals, setGoals] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [filterPeriod, setFilterPeriod] = useState('all');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        target_value: 10,
        current_progress: 0,
        unit: 'courses',
        period: 'weekly',
        end_date: '',
        points: 100,
    });

    useEffect(() => {
        loadGoals();
        loadMilestones();
    }, []);

    const loadGoals = () => {
        // Dummy data
        const dummyGoals = [
            {
                id: 1,
                title: 'Complete 5 Training Courses',
                description: 'Finish at least 5 complete training courses this week',
                target_value: 5,
                current_progress: 3,
                unit: 'courses',
                period: 'weekly',
                status: 'active',
                days_remaining: 4,
                points: 150,
                created_at: '2024-12-28',
            },
            {
                id: 2,
                title: 'Study 10 Hours',
                description: 'Dedicate 10 hours to learning this month',
                target_value: 10,
                current_progress: 10,
                unit: 'hours',
                period: 'monthly',
                status: 'completed',
                days_remaining: 0,
                points: 500,
                created_at: '2024-12-01',
            },
            {
                id: 3,
                title: 'Pass 8 Quizzes',
                description: 'Successfully pass 8 quizzes with score above 80%',
                target_value: 8,
                current_progress: 5,
                unit: 'quizzes',
                period: 'monthly',
                status: 'active',
                days_remaining: 15,
                points: 300,
                created_at: '2024-12-15',
            },
        ];
        setGoals(dummyGoals);
        setLoading(false);
    };

    const loadMilestones = () => {
        const dummyMilestones = [
            {
                id: 1,
                title: 'First Steps',
                description: 'Complete your first training course',
                achieved: true,
                achieved_date: 'Dec 20, 2024',
            },
            {
                id: 2,
                title: 'Dedicated Learner',
                description: 'Study for 20 hours total',
                achieved: true,
                achieved_date: 'Dec 25, 2024',
            },
            {
                id: 3,
                title: 'Quiz Master',
                description: 'Pass 10 quizzes with perfect score',
                achieved: false,
            },
            {
                id: 4,
                title: 'Speed Runner',
                description: 'Complete 5 courses in one week',
                achieved: false,
            },
        ];
        setMilestones(dummyMilestones);
    };

    const handleSubmit = () => {
        if (!formData.title || !formData.target_value) {
            alert('Please fill in all required fields');
            return;
        }

        if (editingGoal) {
            setGoals(goals.map(g => g.id === editingGoal.id ? { ...g, ...formData } : g));
        } else {
            const newGoal = {
                id: Date.now(),
                ...formData,
                current_progress: 0,
                status: 'active',
                days_remaining: 30,
                created_at: new Date().toISOString(),
            };
            setGoals([...goals, newGoal]);
        }

        setShowAddModal(false);
        setEditingGoal(null);
        resetForm();
    };

    const handleEdit = (goal) => {
        setEditingGoal(goal);
        setFormData({
            title: goal.title,
            description: goal.description,
            target_value: goal.target_value,
            current_progress: goal.current_progress,
            unit: goal.unit,
            period: goal.period,
            end_date: goal.end_date || '',
            points: goal.points,
        });
        setShowAddModal(true);
    };

    const handleDelete = (id) => {
        if (!confirm('Delete this goal?')) return;
        setGoals(goals.filter(g => g.id !== id));
    };

    const handleToggleComplete = (id) => {
        setGoals(goals.map(g => 
            g.id === id ? { ...g, status: 'completed' } : g
        ));
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            target_value: 10,
            current_progress: 0,
            unit: 'courses',
            period: 'weekly',
            end_date: '',
            points: 100,
        });
    };

    const filteredGoals = goals.filter(g => 
        filterPeriod === 'all' || g.period === filterPeriod
    );

    const activeGoals = filteredGoals.filter(g => g.status === 'active');
    const completedGoals = filteredGoals.filter(g => g.status === 'completed');
    const totalPoints = goals.filter(g => g.status === 'completed').reduce((sum, g) => sum + (g.points || 0), 0);

    return (
        <AppLayout user={user}>
            <Head title="Learning Goals" />

            <div className="max-w-7xl mx-auto pb-20">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Achievement
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900">Learning Goals</h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Set targets, track progress, and unlock achievements
                        </p>
                    </div>
                    <button 
                        onClick={() => {
                            setEditingGoal(null);
                            resetForm();
                            setShowAddModal(true);
                        }}
                        className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 hover:shadow-purple-300 transition hover:-translate-y-1"
                    >
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition">
                            <Plus size={16} />
                        </div>
                        Create New Goal
                    </button>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                        <Target size={32} className="mb-3 opacity-80" />
                        <h3 className="text-3xl font-black mb-1">{activeGoals.length}</h3>
                        <p className="text-sm text-blue-100">Active Goals</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                        <Trophy size={32} className="mb-3 opacity-80" />
                        <h3 className="text-3xl font-black mb-1">{completedGoals.length}</h3>
                        <p className="text-sm text-green-100">Completed</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
                        <Star size={32} className="mb-3 opacity-80" />
                        <h3 className="text-3xl font-black mb-1">{totalPoints}</h3>
                        <p className="text-sm text-amber-100">Total Points</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                        <Award size={32} className="mb-3 opacity-80" />
                        <h3 className="text-3xl font-black mb-1">{milestones.filter(m => m.achieved).length}/{milestones.length}</h3>
                        <p className="text-sm text-purple-100">Milestones</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { value: 'all', label: 'All Goals' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'custom', label: 'Custom' },
                    ].map(tab => (
                        <button 
                            key={tab.value}
                            onClick={() => setFilterPeriod(tab.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                                filterPeriod === tab.value 
                                    ? 'bg-slate-900 text-white' 
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Goals List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-black text-slate-900 mb-4">Your Goals</h2>
                        
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-500">Loading goals...</p>
                            </div>
                        ) : filteredGoals.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                                <Target size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="font-semibold text-slate-600">No goals yet</p>
                                <p className="text-sm text-slate-500 mt-1">Create your first learning goal!</p>
                            </div>
                        ) : (
                            <>
                                {activeGoals.length > 0 && (
                                    <div className="space-y-4">
                                        {activeGoals.map(goal => (
                                            <GoalCard 
                                                key={goal.id} 
                                                goal={goal}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onToggleComplete={handleToggleComplete}
                                            />
                                        ))}
                                    </div>
                                )}

                                {completedGoals.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                                            <Trophy size={20} className="text-green-600" />
                                            Completed Goals
                                        </h3>
                                        <div className="space-y-4">
                                            {completedGoals.map(goal => (
                                                <GoalCard 
                                                    key={goal.id} 
                                                    goal={goal}
                                                    onEdit={handleEdit}
                                                    onDelete={handleDelete}
                                                    onToggleComplete={handleToggleComplete}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Milestones Sidebar */}
                    <div>
                        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                            <Sparkles size={20} className="text-amber-500" />
                            Milestones
                        </h2>
                        <div className="space-y-3">
                            {milestones.map(milestone => (
                                <MilestoneCard key={milestone.id} milestone={milestone} />
                            ))}
                        </div>

                        {/* Quick Tips */}
                        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={20} className="text-indigo-600" />
                                <h3 className="font-bold text-indigo-900">Pro Tips</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-indigo-800">
                                <li className="flex items-start gap-2">
                                    <Check size={16} className="mt-0.5 shrink-0" />
                                    <span>Set realistic weekly goals to build momentum</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check size={16} className="mt-0.5 shrink-0" />
                                    <span>Track your progress daily for better results</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check size={16} className="mt-0.5 shrink-0" />
                                    <span>Complete goals to earn achievement points</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>

                {/* Add/Edit Goal Modal */}
                <AnimatePresence>
                    {showAddModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => setShowAddModal(false)}
                            />
                            
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="p-6 border-b border-slate-100 sticky top-0 bg-white">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-black text-slate-900">
                                            {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                                        </h2>
                                        <button 
                                            onClick={() => setShowAddModal(false)}
                                            className="p-2 rounded-lg hover:bg-slate-100"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                                            Goal Title *
                                        </label>
                                        <input 
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            placeholder="e.g., Complete 5 Training Courses"
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                                            Description
                                        </label>
                                        <textarea 
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="Describe your goal..."
                                            rows={3}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                                                Target Value *
                                            </label>
                                            <input 
                                                type="number"
                                                min="1"
                                                value={formData.target_value}
                                                onChange={(e) => setFormData({...formData, target_value: parseInt(e.target.value) || 0})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                                                Unit
                                            </label>
                                            <select 
                                                value={formData.unit}
                                                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-purple-500"
                                            >
                                                <option value="courses">Courses</option>
                                                <option value="hours">Hours</option>
                                                <option value="quizzes">Quizzes</option>
                                                <option value="modules">Modules</option>
                                                <option value="points">Points</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                                                Period
                                            </label>
                                            <select 
                                                value={formData.period}
                                                onChange={(e) => setFormData({...formData, period: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-purple-500"
                                            >
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                                                Reward Points
                                            </label>
                                            <input 
                                                type="number"
                                                min="0"
                                                value={formData.points}
                                                onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    {formData.period === 'custom' && (
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                                                End Date
                                            </label>
                                            <input 
                                                type="date"
                                                value={formData.end_date}
                                                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-slate-100 flex gap-3">
                                    <button 
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSubmit}
                                        className="flex-1 py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                                    >
                                        <Target size={18} />
                                        {editingGoal ? 'Update Goal' : 'Create Goal'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </AppLayout>
    );
}
