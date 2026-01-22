import { Users, TrendingUp, Award, AlertCircle, BookOpen, Trophy, CheckCircle } from 'lucide-react';

export const BRAND = {
  // Semantic class names to keep UI consistent across files
  classes: {
    primaryBg: 'bg-indigo-50',
    primaryText: 'text-indigo-600',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-600',
    warningBg: 'bg-amber-50',
    warningText: 'text-amber-600',
    dangerBg: 'bg-red-50',
    dangerText: 'text-red-600',
  },
  // Named colors suitable for Tremor components (small set, extendable)
  colors: {
    chartColors: ['indigo', 'emerald', 'amber', 'cyan', 'rose'],
    hex: {
      primary: '#4f46e5',
      accent: '#10b981',
    }
  },
  // Icon mapping (lucide-react icons)
  icons: {
    users: Users,
    trending: TrendingUp,
    award: Award,
    alert: AlertCircle,
    programs: BookOpen,
    trophy: Trophy,
    check: CheckCircle,
  }
};

export default BRAND;
