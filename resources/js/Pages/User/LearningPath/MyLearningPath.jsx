import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, Lock, CheckCircle2, Play, ChevronRight, Target,
    TrendingUp, Star, Award, Book, Clock, Users, Zap,
    ArrowRight, Filter, Search, BookOpen, GraduationCap
} from 'lucide-react';

const SkillNode = ({ skill, onSelect }) => {
    const statusConfig = {
        completed: { color: 'bg-green-500', icon: CheckCircle2, text: 'Completed' },
        in_progress: { color: 'bg-blue-500', icon: Play, text: 'In Progress' },
        available: { color: 'bg-amber-500', icon: Star, text: 'Available' },
        locked: { color: 'bg-slate-300', icon: Lock, text: 'Locked' },
    };

    const config = statusConfig[skill.status] || statusConfig.locked;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onSelect(skill)}
            className={`relative cursor-pointer ${skill.status === 'locked' ? 'opacity-50' : ''}`}
        >
            {/* Node */}
            <div className={`w-24 h-24 rounded-2xl ${config.color} flex items-center justify-center shadow-lg`}>
                <Icon size={32} className="text-white" />
            </div>
            
            {/* Label */}
            <div className="text-center mt-2">
                <p className="font-bold text-sm text-slate-900">{skill.name}</p>
                <p className="text-xs text-slate-500">{skill.courses} courses</p>
            </div>

            {/* Progress Badge */}
            {skill.status === 'in_progress' && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {skill.progress}%
                </div>
            )}

            {/* Completed Badge */}
            {skill.status === 'completed' && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                    <CheckCircle2 size={16} />
                </div>
            )}
        </motion.div>
    );
};

const PathCard = ({ path, onEnroll }) => {
    const progress = (path.completed_courses / path.total_courses) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition"
        >
            {/* Header */}
            <div className={`p-6 bg-gradient-to-br ${path.gradient}`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <path.icon size={28} className="text-white" />
                    </div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                        {path.level}
                    </span>
                </div>
                <h3 className="text-xl font-black text-white mb-2">{path.name}</h3>
                <p className="text-white/80 text-sm">{path.description}</p>
            </div>

            {/* Progress */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600">
                        {path.completed_courses}/{path.total_courses} Courses Completed
                    </span>
                    <span className="text-xs font-bold text-slate-900">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                        <Clock size={16} className="mx-auto mb-1 text-slate-400" />
                        <p className="text-xs font-bold text-slate-900">{path.duration}</p>
                        <p className="text-[10px] text-slate-500">Duration</p>
                    </div>
                    <div className="text-center">
                        <Users size={16} className="mx-auto mb-1 text-slate-400" />
                        <p className="text-xs font-bold text-slate-900">{path.enrolled}</p>
                        <p className="text-[10px] text-slate-500">Enrolled</p>
                    </div>
                    <div className="text-center">
                        <Star size={16} className="mx-auto mb-1 text-slate-400" />
                        <p className="text-xs font-bold text-slate-900">{path.rating}</p>
                        <p className="text-[10px] text-slate-500">Rating</p>
                    </div>
                </div>

                {/* Action */}
                {path.enrolled_by_user ? (
                    <Link
                        href={`/learning-path/${path.id}`}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
                    >
                        Continue Learning <ArrowRight size={16} />
                    </Link>
                ) : (
                    <button
                        onClick={() => onEnroll(path.id)}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition"
                    >
                        Enroll in Path
                    </button>
                )}
            </div>
        </motion.div>
    );
};

const CourseCard = ({ course, onStart }) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition">
            <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    course.status === 'completed' ? 'bg-green-100 text-green-600' :
                    course.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                    course.status === 'locked' ? 'bg-slate-100 text-slate-400' :
                    'bg-amber-100 text-amber-600'
                }`}>
                    {course.status === 'completed' ? <CheckCircle2 size={24} /> :
                     course.status === 'locked' ? <Lock size={24} /> :
                     <Book size={24} />}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">{course.title}</h4>
                    <p className="text-xs text-slate-500 mb-2">{course.description}</p>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                            <Star size={12} /> {course.rating}
                        </span>
                    </div>

                    {/* Prerequisites */}
                    {course.prerequisites?.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-bold">Requires:</span>
                            {course.prerequisites.map((prereq, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">
                                    {prereq}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action */}
                {course.status !== 'locked' && (
                    <button
                        onClick={() => onStart(course.id)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                            course.status === 'completed' 
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {course.status === 'completed' ? 'Review' :
                         course.status === 'in_progress' ? 'Continue' :
                         'Start'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default function MyLearningPath({ auth }) {
    const user = auth.user;
    
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Dummy data - Skill Tree
    const skillTree = [
        {
            id: 1,
            name: 'Basics',
            courses: 3,
            status: 'completed',
            progress: 100,
            level: 1,
        },
        {
            id: 2,
            name: 'Security',
            courses: 5,
            status: 'in_progress',
            progress: 60,
            level: 2,
        },
        {
            id: 3,
            name: 'Leadership',
            courses: 4,
            status: 'available',
            progress: 0,
            level: 2,
        },
        {
            id: 4,
            name: 'Advanced',
            courses: 6,
            status: 'locked',
            progress: 0,
            level: 3,
        },
        {
            id: 5,
            name: 'Expert',
            courses: 8,
            status: 'locked',
            progress: 0,
            level: 4,
        },
    ];

    // Dummy data - Learning Paths
    const learningPaths = [
        {
            id: 1,
            name: 'Cyber Security Master',
            description: 'Complete cybersecurity training from basics to advanced',
            level: 'Beginner → Advanced',
            total_courses: 12,
            completed_courses: 7,
            duration: '24 hours',
            enrolled: '1.2k',
            rating: '4.8',
            gradient: 'from-blue-500 to-blue-600',
            icon: Award,
            enrolled_by_user: true,
        },
        {
            id: 2,
            name: 'Leadership Excellence',
            description: 'Develop essential leadership and management skills',
            level: 'Intermediate',
            total_courses: 8,
            completed_courses: 0,
            duration: '16 hours',
            enrolled: '890',
            rating: '4.9',
            gradient: 'from-purple-500 to-purple-600',
            icon: GraduationCap,
            enrolled_by_user: false,
        },
        {
            id: 3,
            name: 'Data Analytics Pro',
            description: 'Master data analysis and visualization techniques',
            level: 'Advanced',
            total_courses: 10,
            completed_courses: 0,
            duration: '20 hours',
            enrolled: '650',
            rating: '4.7',
            gradient: 'from-teal-500 to-teal-600',
            icon: TrendingUp,
            enrolled_by_user: false,
        },
    ];

    // Dummy data - Recommended Courses
    const recommendedCourses = [
        {
            id: 1,
            title: 'Advanced Threat Detection',
            description: 'Learn to identify and respond to security threats',
            duration: '2.5 hours',
            rating: '4.8',
            status: 'available',
            prerequisites: ['Security Basics', 'Network Fundamentals'],
        },
        {
            id: 2,
            title: 'Incident Response Planning',
            description: 'Develop effective incident response strategies',
            duration: '3 hours',
            rating: '4.9',
            status: 'available',
            prerequisites: ['Advanced Threat Detection'],
        },
        {
            id: 3,
            title: 'Security Compliance',
            description: 'Understanding regulatory compliance requirements',
            duration: '2 hours',
            rating: '4.7',
            status: 'locked',
            prerequisites: ['Incident Response Planning', 'Risk Management'],
        },
    ];

    const handleEnroll = (pathId) => {
        alert(`Enrolling in path ${pathId}`);
    };

    const handleStartCourse = (courseId) => {
        alert(`Starting course ${courseId}`);
    };

    return (
        <AppLayout user={user}>
            <Head title="My Learning Path" />

            <div className="max-w-7xl mx-auto pb-20">
                
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                            Your Journey
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">Learning Roadmap</h1>
                    <p className="text-slate-500 font-medium">
                        Follow structured paths, track prerequisites, and progress through your skill tree
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                        <CheckCircle2 size={32} className="mb-3 opacity-80" />
                        <h3 className="text-3xl font-black mb-1">3</h3>
                        <p className="text-sm text-green-100">Skills Mastered</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                        <Play size={32} className="mb-3 opacity-80" />
                        <h3 className="text-3xl font-black mb-1">2</h3>
                        <p className="text-sm text-blue-100">In Progress</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
                        <Star size={32} className="mb-3 opacity-80" />
                        <h3 className="text-3xl font-black mb-1">5</h3>
                        <p className="text-sm text-amber-100">Available Next</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                        <Award size={32} className="mb-3 opacity-80" />
                        <h3 className="text-3xl font-black mb-1">12</h3>
                        <p className="text-sm text-purple-100">Total Paths</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-slate-200">
                    {[
                        { id: 'overview', label: 'Overview', icon: MapPin },
                        { id: 'skill-tree', label: 'Skill Tree', icon: Target },
                        { id: 'paths', label: 'Learning Paths', icon: BookOpen },
                        { id: 'recommended', label: 'Recommended', icon: Zap },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition relative ${
                                activeTab === tab.id
                                    ? 'text-blue-600'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Current Path Progress */}
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-blue-100 text-sm font-semibold mb-1">Current Path</p>
                                        <h2 className="text-3xl font-black">Cyber Security Master</h2>
                                    </div>
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                        <Award size={40} />
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold">7 of 12 courses completed</span>
                                        <span className="text-sm font-bold">58%</span>
                                    </div>
                                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full" style={{ width: '58%' }} />
                                    </div>
                                </div>

                                {/* Next Course */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-blue-100 mb-1">Next Course</p>
                                        <p className="font-bold">Advanced Threat Detection</p>
                                    </div>
                                    <Link
                                        href="/training/8"
                                        className="px-6 py-2 bg-white text-blue-600 rounded-xl font-bold hover:shadow-lg transition"
                                    >
                                        Start Now
                                    </Link>
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                    <h3 className="text-lg font-black text-slate-900 mb-4">Recent Achievements</h3>
                                    <div className="space-y-3">
                                        {[
                                            { name: 'Security Basics', date: 'Dec 28, 2024', icon: '🏆' },
                                            { name: 'Network Fundamentals', date: 'Dec 25, 2024', icon: '⭐' },
                                            { name: 'Risk Management', date: 'Dec 20, 2024', icon: '🎖️' },
                                        ].map((achievement, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                <span className="text-2xl">{achievement.icon}</span>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{achievement.name}</p>
                                                    <p className="text-xs text-slate-500">{achievement.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                    <h3 className="text-lg font-black text-slate-900 mb-4">Available Paths</h3>
                                    <div className="space-y-3">
                                        {learningPaths.slice(1, 3).map((path) => (
                                            <div key={path.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${path.gradient} flex items-center justify-center`}>
                                                        <path.icon size={20} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900">{path.name}</p>
                                                        <p className="text-xs text-slate-500">{path.total_courses} courses</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} className="text-slate-400" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'skill-tree' && (
                        <motion.div
                            key="skill-tree"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="bg-white rounded-3xl border border-slate-200 p-8">
                                <h2 className="text-2xl font-black text-slate-900 mb-6">Your Skill Progression</h2>
                                
                                {/* Skill Tree Visualization */}
                                <div className="relative">
                                    {/* Level 1 */}
                                    <div className="flex justify-center mb-16">
                                        <SkillNode skill={skillTree[0]} onSelect={setSelectedSkill} />
                                    </div>

                                    {/* Connector Line */}
                                    <div className="absolute left-1/2 top-24 w-0.5 h-12 bg-slate-200 -translate-x-1/2"></div>

                                    {/* Level 2 */}
                                    <div className="flex justify-center gap-32 mb-16">
                                        <SkillNode skill={skillTree[1]} onSelect={setSelectedSkill} />
                                        <SkillNode skill={skillTree[2]} onSelect={setSelectedSkill} />
                                    </div>

                                    {/* Connector Lines */}
                                    <div className="absolute left-1/2 top-48 w-32 h-0.5 bg-slate-200 -translate-x-1/2"></div>
                                    <div className="absolute left-1/2 top-48 w-0.5 h-12 bg-slate-200 translate-x-16"></div>
                                    <div className="absolute left-1/2 top-48 w-0.5 h-12 bg-slate-200 -translate-x-16"></div>

                                    {/* Level 3 */}
                                    <div className="flex justify-center mb-16">
                                        <SkillNode skill={skillTree[3]} onSelect={setSelectedSkill} />
                                    </div>

                                    {/* Connector Line */}
                                    <div className="absolute left-1/2 bottom-24 w-0.5 h-12 bg-slate-200 -translate-x-1/2"></div>

                                    {/* Level 4 */}
                                    <div className="flex justify-center">
                                        <SkillNode skill={skillTree[4]} onSelect={setSelectedSkill} />
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        <span className="text-sm text-slate-600">Completed</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                        <span className="text-sm text-slate-600">In Progress</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-amber-500 rounded"></div>
                                        <span className="text-sm text-slate-600">Available</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-slate-300 rounded"></div>
                                        <span className="text-sm text-slate-600">Locked</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'paths' && (
                        <motion.div
                            key="paths"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {learningPaths.map(path => (
                                    <PathCard key={path.id} path={path} onEnroll={handleEnroll} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'recommended' && (
                        <motion.div
                            key="recommended"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                <h2 className="text-xl font-black text-slate-900 mb-6">Recommended Next Courses</h2>
                                <div className="space-y-4">
                                    {recommendedCourses.map(course => (
                                        <CourseCard key={course.id} course={course} onStart={handleStartCourse} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </AppLayout>
    );
}
