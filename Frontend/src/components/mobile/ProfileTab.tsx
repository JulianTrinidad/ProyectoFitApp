import { useState, useMemo } from 'react';
import { Trophy, Mail, Phone, FileHeart, Sparkles, Dumbbell, Calendar, ChevronLeft, ChevronRight, ChevronDown, Moon, Phone as PhoneIcon, Lock, Crown, Users, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';

// Evolutionary avatar imports
import avatarMaleLower from '@/assets/avatar-male-lower.png';
import avatarMaleUpper from '@/assets/avatar-male-upper.png';
import avatarFemaleLower from '@/assets/avatar-female-lower.png';
import avatarFemaleUpper from '@/assets/avatar-female-upper.png';

interface ProfileTabProps {
    currentUser: any;
    updateUser: (id: string, data: any) => void;
    toggleTheme: () => void;
    theme: string;
    logout: () => void;
}

interface MedicalForm {
    weight: string;
    height: string;
    measurements: string;
    bloodType: string;
    takesMedication: boolean;
    medications: string;
    pathologies: string;
    isChronicPathology: boolean;
    injuries: string;
    emergencyPhone: string;
}

const INITIAL_MEDICAL_FORM: MedicalForm = {
    weight: '',
    height: '',
    measurements: '',
    bloodType: '',
    takesMedication: false,
    medications: '',
    pathologies: '',
    isChronicPathology: false,
    injuries: '',
    emergencyPhone: '',
};

// Mock routine names for calendar day detail
const WEEKDAY_ROUTINES: Record<number, { name: string; exercises: string[]; duration: number }> = {
    1: { name: 'Torso Fuerza', duration: 50, exercises: ['Press Banca 4×8', 'Remo con Barra 4×10', 'Press Militar 3×10', 'Curl Bíceps 3×12'] },
    2: { name: 'Piernas Potencia', duration: 55, exercises: ['Sentadilla 4×6', 'Peso Muerto 3×5', 'Prensa 3×12', 'Extensión Cuádriceps 3×15'] },
    3: { name: 'Tirón + Core', duration: 45, exercises: ['Dominadas 4×8', 'Remo Mancuerna 3×10', 'Face Pull 3×15', 'Plancha 3×45s'] },
    4: { name: 'Empuje + Hombros', duration: 48, exercises: ['Press Inclinado 4×8', 'Aperturas 3×12', 'Elevaciones Laterales 3×15', 'Fondos 3×10'] },
    5: { name: 'Full Body', duration: 60, exercises: ['Peso Muerto 3×5', 'Press Banca 3×8', 'Sentadilla Frontal 3×8', 'Remo Pendlay 3×10'] },
};

// Mock leaderboard data
interface LeaderboardUser {
    id: string;
    name: string;
    avatar: string;
    league: string;
    points: number;
}

const MOCK_LEADERBOARD_BASE: LeaderboardUser[] = [
    { id: 'lb-1', name: 'Valentina Torres', avatar: 'https://i.pravatar.cc/150?img=1', league: 'Diamante', points: 980 },
    { id: 'lb-2', name: 'Matías Herrera', avatar: 'https://i.pravatar.cc/150?img=3', league: 'Diamante', points: 925 },
    { id: 'lb-3', name: 'Camila Ríos', avatar: 'https://i.pravatar.cc/150?img=5', league: 'Esmeralda', points: 870 },
    { id: 'lb-4', name: 'Nicolás Paz', avatar: 'https://i.pravatar.cc/150?img=8', league: 'Esmeralda', points: 810 },
    { id: 'lb-5', name: 'Lucía Méndez', avatar: 'https://i.pravatar.cc/150?img=9', league: 'Oro', points: 740 },
    { id: 'lb-6', name: 'Santiago Vega', avatar: 'https://i.pravatar.cc/150?img=11', league: 'Oro', points: 680 },
    { id: 'lb-7', name: 'Martina López', avatar: 'https://i.pravatar.cc/150?img=16', league: 'Plata', points: 520 },
    { id: 'lb-8', name: 'Tomás Ruiz', avatar: 'https://i.pravatar.cc/150?img=12', league: 'Plata', points: 435 },
    { id: 'lb-9', name: 'Sofía Delgado', avatar: 'https://i.pravatar.cc/150?img=20', league: 'Bronce', points: 310 },
    { id: 'lb-10', name: 'Joaquín Peralta', avatar: 'https://i.pravatar.cc/150?img=14', league: 'Bronce', points: 220 },
    { id: 'lb-11', name: 'Florencia Gil', avatar: 'https://i.pravatar.cc/150?img=23', league: 'Hierro', points: 120 },
];


export function ProfileTab({ currentUser, updateUser, toggleTheme, theme, logout }: ProfileTabProps) {
    const { toast } = useToast();
    const [showMedicalDialog, setShowMedicalDialog] = useState(false);
    const [showLeaguesDialog, setShowLeaguesDialog] = useState(false);
    const [showRankingDialog, setShowRankingDialog] = useState(false);
    const [rankingFilter, setRankingFilter] = useState<'global' | 'gym'>('global');
    const [expandedLeague, setExpandedLeague] = useState<string | null>(null);

    // Progress analysis state
    const [showProgressDialog, setShowProgressDialog] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);

    const handleAnalyzeProgress = () => {
        setIsAnalyzing(true);
        setAiFeedback(null);
        setTimeout(() => {
            setIsAnalyzing(false);
            setAiFeedback(
                '¡Excelente trabajo! Comparando ambas imágenes, notamos un aumento visible en el volumen de tus deltoides (hombros) y mayor definición en la zona abdominal. Tu postura general también luce más erguida. La composición corporal ha mejorado notablemente: se observa menor porcentaje graso en la zona del torso y mayor tonicidad en brazos. ¡Seguí así!'
            );
        }, 2000);
    };

    // Build leaderboard with currentUser injected
    const leaderboard = useMemo(() => {
        const userEntry: LeaderboardUser = {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            league: currentUser.ranked?.league || 'Bronce',
            points: 490, // mid-table placement
        };
        const merged = [...MOCK_LEADERBOARD_BASE.filter(u => u.id !== currentUser.id), userEntry];
        return merged.sort((a, b) => b.points - a.points);
    }, [currentUser]);

    const getLeagueIconText = (league: string) => {
        const icons: Record<string, string> = {
            'Hierro': '⚙️', 'Bronce': '🥉', 'Plata': '🥈',
            'Oro': '🥇', 'Esmeralda': '💎', 'Diamante': '👑',
        };
        return icons[league] || '🏅';
    };
    const [medicalForm, setMedicalForm] = useState<MedicalForm>(INITIAL_MEDICAL_FORM);

    // Training calendar state
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const getLeagueIcon = (league: string) => {
        const icons: Record<string, string> = {
            'Hierro': '⚙️', 'Bronce': '🥉', 'Plata': '🥈',
            'Oro': '🥇', 'Esmeralda': '💎', 'Diamante': '👑',
        };
        return icons[league] || '🏅';
    };

    const getLeagueColor = (league: string) => {
        const colors: Record<string, string> = {
            'Hierro': 'from-gray-400 to-gray-600', 'Bronce': 'from-amber-600 to-amber-800',
            'Plata': 'from-gray-300 to-gray-500', 'Oro': 'from-yellow-400 to-yellow-600',
            'Esmeralda': 'from-emerald-400 to-emerald-600', 'Diamante': 'from-cyan-300 to-blue-500',
        };
        return colors[league] || 'from-gray-400 to-gray-600';
    };

    const handleSaveMedical = () => {
        console.log('Ficha médica guardada:', medicalForm);
        toast({ title: 'Ficha médica guardada ✅', description: 'Tus datos médicos han sido registrados.' });
        setShowMedicalDialog(false);
    };

    const daysSincePayment = Math.floor((Date.now() - currentUser.lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
    const membershipActive = daysSincePayment <= 30;

    return (
        <div className="p-4 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start gap-4">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-foreground">{currentUser.name}</h1>

                    {/* Contact Info */}
                    <div className="space-y-1 mt-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{currentUser.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{currentUser.phone || 'Sin teléfono'}</span>
                        </div>
                    </div>

                    {/* Badges Row */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Membership Badge */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${membershipActive
                            ? 'bg-success/20 text-success'
                            : 'bg-warning/20 text-warning'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${membershipActive ? 'bg-success' : 'bg-warning'}`} />
                            {membershipActive ? 'Activa' : 'En Espera'}
                        </div>

                        {/* Medical Record Badge */}
                        <button
                            onClick={() => setShowMedicalDialog(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer"
                        >
                            <FileHeart className="w-3.5 h-3.5" />
                            Ficha Médica
                        </button>
                    </div>
                </div>
            </div>

            {/* Mis Servicios */}
            {currentUser.services && currentUser.services.length > 0 && (
                <div>
                    <h2 className="font-semibold text-foreground mb-3">Mis Servicios</h2>
                    <div className="grid gap-2">
                        {currentUser.services.map((service: any, idx: number) => (
                            <div key={idx} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        {service.name === 'Boxeo' && '🥊'}
                                        {service.name === 'CrossFit' && '🏋️'}
                                        {service.name === 'Bicicleta' && '🚴'}
                                        {service.name === 'Natación' && '🏊'}
                                        {service.name === 'Yoga' && '🧘'}
                                        {service.name === 'Movilidad' && '🤸'}
                                        {service.name === 'Elongación' && '🙆'}
                                        {service.name === 'Musculación' && '💪'}
                                        {!['Boxeo', 'CrossFit', 'Bicicleta', 'Natación', 'Yoga', 'Movilidad', 'Elongación', 'Musculación'].includes(service.name) && '🏃'}
                                    </div>
                                    <span className="font-medium text-foreground">{service.name}</span>
                                </div>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${service.type === 'Personalizado'
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {service.type}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ranked Card — Redesigned */}
            {(() => {
                const league = currentUser.ranked?.league || 'Bronce';
                const division = currentUser.ranked?.division ? ['V', 'IV', 'III', 'II', 'I'][5 - currentUser.ranked.division] : 'IV';
                const points = currentUser.ranked?.currentPoints || 0;
                const gender = currentUser.gender || 'male';

                // Tier mapping
                const LOW_LEAGUES = ['Hierro', 'Bronce'];
                const MID_LEAGUES = ['Plata', 'Oro'];
                // HIGH = Esmeralda, Diamante
                const tier = LOW_LEAGUES.includes(league) ? 'low' : MID_LEAGUES.includes(league) ? 'mid' : 'high';

                // Evolutionary avatar
                const avatarMap: Record<string, Record<string, string>> = {
                    male: { low: avatarMaleLower, mid: avatarMaleUpper, high: avatarMaleUpper },
                    female: { low: avatarFemaleLower, mid: avatarFemaleUpper, high: avatarFemaleUpper },
                };
                const avatarSrc = avatarMap[gender]?.[tier] || avatarMaleLower;

                // Card gradient background (subtle, semi-transparent)
                const cardBgMap: Record<string, string> = {
                    'Hierro': 'from-gray-500/15 via-gray-600/10 to-gray-700/15',
                    'Bronce': 'from-amber-600/15 via-amber-700/10 to-amber-800/15',
                    'Plata': 'from-slate-300/15 via-slate-400/10 to-slate-500/15',
                    'Oro': 'from-yellow-400/15 via-amber-400/10 to-yellow-500/15',
                    'Esmeralda': 'from-emerald-400/15 via-emerald-500/10 to-emerald-600/15',
                    'Diamante': 'from-cyan-300/15 via-blue-400/10 to-cyan-500/15',
                };
                const cardBg = cardBgMap[league] || cardBgMap['Bronce'];

                // Border accent
                const borderMap: Record<string, string> = {
                    'Hierro': 'border-gray-500/30', 'Bronce': 'border-amber-600/30',
                    'Plata': 'border-slate-400/30', 'Oro': 'border-yellow-400/30',
                    'Esmeralda': 'border-emerald-400/30', 'Diamante': 'border-cyan-400/30',
                };
                const borderAccent = borderMap[league] || 'border-border';

                // Progress bar color
                const progressColorMap: Record<string, string> = {
                    'Hierro': 'bg-gray-400', 'Bronce': 'bg-amber-500',
                    'Plata': 'bg-slate-400', 'Oro': 'bg-yellow-400',
                    'Esmeralda': 'bg-emerald-400', 'Diamante': 'bg-cyan-400',
                };
                const progressColor = progressColorMap[league] || 'bg-primary';

                // Text color for rank name
                const rankTextMap: Record<string, string> = {
                    'Hierro': 'text-gray-300', 'Bronce': 'text-amber-400',
                    'Plata': 'text-slate-300', 'Oro': 'text-yellow-400',
                    'Esmeralda': 'text-emerald-400', 'Diamante': 'text-cyan-300',
                };
                const rankText = rankTextMap[league] || 'text-foreground';

                return (
                    <button
                        onClick={() => setShowLeaguesDialog(true)}
                        className={`relative rounded-3xl border ${borderAccent} p-5 shadow-soft overflow-hidden bg-gradient-to-br ${cardBg} w-full text-left transition-all hover:shadow-lg active:scale-[0.99] cursor-pointer`}
                    >
                        {/* Subtle sparkle for top tiers */}
                        {tier === 'high' && (
                            <div className="absolute top-3 right-3 animate-pulse">
                                <Sparkles className="w-5 h-5 text-cyan-300/60" />
                            </div>
                        )}

                        {/* Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className={`w-5 h-5 ${rankText}`} />
                            <h2 className="font-semibold text-foreground">Nivel de Atleta</h2>
                            <span className="ml-auto text-[10px] text-muted-foreground">Ver ligas →</span>
                        </div>

                        {/* Main Content: Info + Avatar */}
                        <div className="flex items-center gap-4 mb-4">
                            {/* Left: Medal + Text */}
                            <div className="flex items-center gap-3 flex-1">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getLeagueColor(league)} flex items-center justify-center text-3xl shadow-lg flex-shrink-0`}>
                                    {getLeagueIcon(league)}
                                </div>
                                <div>
                                    <p className={`text-2xl font-black tracking-tight ${rankText}`}>
                                        {league} {division}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {points}/100 pts para subir
                                    </p>
                                </div>
                            </div>

                            {/* Right: Evolutionary Avatar */}
                            <div className={`relative w-20 h-24 flex-shrink-0 ${tier === 'high' ? 'drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]' :
                                tier === 'mid' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]' : ''
                                }`}>
                                <img
                                    src={avatarSrc}
                                    alt={`Avatar ${tier}`}
                                    className={`w-full h-full object-contain transition-transform duration-500 ${tier === 'high' ? 'scale-110' : tier === 'mid' ? 'scale-105' : 'scale-100'
                                        }`}
                                />
                                {/* Tier label */}
                                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${tier === 'high' ? 'bg-cyan-400/20 text-cyan-300' :
                                    tier === 'mid' ? 'bg-yellow-400/20 text-yellow-300' :
                                        'bg-gray-400/20 text-gray-300'
                                    }`}>
                                    {tier === 'high' ? 'Élite' : tier === 'mid' ? 'Atleta' : 'Novato'}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Progreso</span>
                                <span className={`font-semibold ${rankText}`}>{points}%</span>
                            </div>
                            <div className="h-3 bg-background/40 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`}
                                    style={{ width: `${points}%` }}
                                />
                            </div>
                        </div>

                        {/* Ranking Button */}
                        <div className="mt-4 pt-3 border-t border-white/10">
                            <p className="text-xs text-muted-foreground text-center mb-3">
                                🏆 Gana puntos entrenando, descansando e hidratándote
                            </p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowRankingDialog(true); }}
                            className="w-full py-3 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            🏆 Ver Ranking Global
                        </button>
                    </button>
                );
            })()}

            {/* Leagues Dialog */}
            <Dialog open={showLeaguesDialog} onOpenChange={setShowLeaguesDialog}>
                <DialogContent className="max-w-[92vw] rounded-2xl max-h-[85vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            Camino a la Gloria
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground">Subí de liga ganando puntos al entrenar, descansar e hidratarte.</p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {(() => {
                            const userLeague = currentUser.ranked?.league || 'Bronce';
                            // Mock: user is at Bronce division 3 with 120/200 pts into that division
                            const userDivision = 3;
                            const userDivisionPts = 120;

                            const allLeagues = [
                                { name: 'Hierro', icon: '⚙️', gradient: 'from-gray-400 to-gray-600', bg: 'from-gray-500/20 to-gray-600/20', border: 'border-gray-500/40', text: 'text-gray-300', glow: 'shadow-[0_0_20px_rgba(156,163,175,0.4)]', desc: 'El inicio del camino', ptsPerDiv: 200 },
                                { name: 'Bronce', icon: '🥉', gradient: 'from-amber-600 to-amber-800', bg: 'from-amber-600/20 to-amber-700/20', border: 'border-amber-600/40', text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(217,119,6,0.4)]', desc: 'Compromiso constante', ptsPerDiv: 200 },
                                { name: 'Plata', icon: '🥈', gradient: 'from-gray-300 to-gray-500', bg: 'from-slate-300/20 to-slate-400/20', border: 'border-slate-400/40', text: 'text-slate-300', glow: 'shadow-[0_0_20px_rgba(148,163,184,0.4)]', desc: 'Disciplina probada', ptsPerDiv: 400 },
                                { name: 'Oro', icon: '🥇', gradient: 'from-yellow-400 to-yellow-600', bg: 'from-yellow-400/20 to-amber-400/20', border: 'border-yellow-400/40', text: 'text-yellow-400', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.4)]', desc: 'Atleta destacado', ptsPerDiv: 400 },
                                { name: 'Esmeralda', icon: '💎', gradient: 'from-emerald-400 to-emerald-600', bg: 'from-emerald-400/20 to-emerald-500/20', border: 'border-emerald-400/40', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.5)]', desc: 'Élite del gimnasio', ptsPerDiv: 500 },
                                { name: 'Diamante', icon: '👑', gradient: 'from-cyan-300 to-blue-500', bg: 'from-cyan-300/20 to-blue-400/20', border: 'border-cyan-400/40', text: 'text-cyan-300', glow: 'shadow-[0_0_24px_rgba(56,189,248,0.5)]', desc: 'Leyenda absoluta', ptsPerDiv: 500 },
                            ];
                            const userLeagueIdx = allLeagues.findIndex(l => l.name === userLeague);

                            return (
                                <div className="space-y-3">
                                    {allLeagues.map((league, leagueIdx) => {
                                        const isCurrent = leagueIdx === userLeagueIdx;
                                        const isLocked = leagueIdx > userLeagueIdx;
                                        const isConquered = leagueIdx < userLeagueIdx;
                                        const isExpanded = expandedLeague === league.name;

                                        return (
                                            <div key={league.name}>
                                                {/* League Header (clickable) */}
                                                <button
                                                    onClick={() => setExpandedLeague(isExpanded ? null : league.name)}
                                                    className={`w-full relative flex items-center gap-4 rounded-2xl border p-4 transition-all text-left ${isCurrent
                                                            ? `bg-gradient-to-r ${league.bg} ${league.border} ${league.glow} ring-2 ring-offset-2 ring-offset-background ring-current ${league.text}`
                                                            : isLocked
                                                                ? 'bg-muted/30 border-border/50 opacity-50'
                                                                : `bg-gradient-to-r ${league.bg} ${league.border} hover:shadow-md`
                                                        } ${isExpanded ? 'rounded-b-none' : ''}`}
                                                >
                                                    {/* Medal */}
                                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${league.gradient} flex items-center justify-center text-2xl shadow-lg flex-shrink-0 ${isLocked ? 'grayscale' : ''
                                                        }`}>
                                                        {isLocked ? <Lock className="w-5 h-5 text-white/60" /> : league.icon}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold text-sm ${isCurrent ? league.text : isLocked ? 'text-muted-foreground' : 'text-foreground'
                                                            }`}>
                                                            {league.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">{league.desc}</p>
                                                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{league.ptsPerDiv} pts/div · 5 divisiones</p>
                                                    </div>

                                                    {/* Status + Chevron */}
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {isCurrent && (
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-background/50 ${league.text}`}>
                                                                Tu rango
                                                            </span>
                                                        )}
                                                        {isConquered && <span className="text-lg">✅</span>}
                                                        {isLocked && <span className="text-[10px] text-muted-foreground font-medium">🔒</span>}
                                                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                                                            } ${isCurrent ? league.text : 'text-muted-foreground'
                                                            }`} />
                                                    </div>
                                                </button>

                                                {/* Sub-divisions (accordion content) */}
                                                {isExpanded && (
                                                    <div className={`border border-t-0 rounded-b-2xl overflow-hidden ${isCurrent ? league.border : isLocked ? 'border-border/50' : league.border
                                                        }`}>
                                                        {[5, 4, 3, 2, 1].map(div => {
                                                            let divStatus: 'completed' | 'current' | 'locked';
                                                            let divPoints = 0;

                                                            if (isConquered) {
                                                                divStatus = 'completed';
                                                                divPoints = league.ptsPerDiv;
                                                            } else if (isCurrent) {
                                                                if (div > userDivision) {
                                                                    divStatus = 'completed';
                                                                    divPoints = league.ptsPerDiv;
                                                                } else if (div === userDivision) {
                                                                    divStatus = 'current';
                                                                    divPoints = userDivisionPts;
                                                                } else {
                                                                    divStatus = 'locked';
                                                                    divPoints = 0;
                                                                }
                                                            } else {
                                                                divStatus = 'locked';
                                                                divPoints = 0;
                                                            }

                                                            return (
                                                                <div
                                                                    key={div}
                                                                    className={`flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0 transition-all ${divStatus === 'current'
                                                                            ? 'bg-primary/10'
                                                                            : divStatus === 'completed'
                                                                                ? 'bg-card/50'
                                                                                : 'bg-muted/20'
                                                                        }`}
                                                                >
                                                                    {/* Division Name */}
                                                                    <p className={`text-sm font-semibold flex-1 ${divStatus === 'current'
                                                                            ? 'text-primary'
                                                                            : divStatus === 'completed'
                                                                                ? 'text-foreground'
                                                                                : 'text-muted-foreground'
                                                                        }`}>
                                                                        {league.name} {div}
                                                                    </p>

                                                                    {/* Points */}
                                                                    <span className={`text-xs font-medium ${divStatus === 'current'
                                                                            ? 'text-primary'
                                                                            : divStatus === 'completed'
                                                                                ? 'text-muted-foreground'
                                                                                : 'text-muted-foreground/60'
                                                                        }`}>
                                                                        {divPoints}/{league.ptsPerDiv} pts
                                                                    </span>

                                                                    {/* Status Icon */}
                                                                    {divStatus === 'completed' && <span className="text-base">✅</span>}
                                                                    {divStatus === 'current' && (
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary">Tu Rango</span>
                                                                    )}
                                                                    {divStatus === 'locked' && <span className="text-sm">🔒</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Connector line between leagues */}
                                                {leagueIdx < allLeagues.length - 1 && !isExpanded && (
                                                    <div className="flex justify-center">
                                                        <div className={`w-0.5 h-3 ${leagueIdx < userLeagueIdx ? 'bg-primary/40' : 'bg-border/40'}`} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Gym Rat — Supreme Rank */}
                                    <div className="flex justify-center">
                                        <div className={`w-0.5 h-3 ${userLeagueIdx >= allLeagues.length ? 'bg-yellow-400/60' : 'bg-border/40'}`} />
                                    </div>
                                    <div className="relative rounded-2xl border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-400/10 via-amber-500/10 to-orange-500/10 p-5 overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.25)]">
                                        {/* Glow effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-orange-400/5 animate-pulse" />
                                        <div className="relative flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center text-3xl shadow-xl flex-shrink-0">
                                                🐀
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-base text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                                                    GYM RAT
                                                </p>
                                                <p className="text-xs text-yellow-500/80 font-medium">Rango Supremo · Puntos infinitos</p>
                                            </div>
                                            {userLeagueIdx >= allLeagues.length ? (
                                                <span className="text-lg">👑</span>
                                            ) : (
                                                <span className="text-sm">🔒</span>
                                            )}
                                        </div>
                                        <p className="relative text-[11px] text-yellow-500/60 mt-3 text-center italic">
                                            "Has conquistado el gimnasio. La gloria es infinita."
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Ranking Leaderboard Dialog */}
            <Dialog open={showRankingDialog} onOpenChange={setShowRankingDialog}>
                <DialogContent className="max-w-[92vw] rounded-2xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-3 flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-yellow-400" />
                            Clasificación
                        </DialogTitle>

                        {/* Filter Tabs */}
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => setRankingFilter('global')}
                                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${rankingFilter === 'global'
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                <Crown className="w-3.5 h-3.5" />
                                Global
                            </button>
                            <button
                                onClick={() => setRankingFilter('gym')}
                                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${rankingFilter === 'gym'
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                Mi Gimnasio
                            </button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        {/* Podium — Top 3 */}
                        {leaderboard.length >= 3 && (
                            <div className="flex items-end justify-center gap-3 mb-6 pt-4">
                                {/* 2nd Place */}
                                <div className="flex flex-col items-center w-[30%]">
                                    <div className="relative mb-2">
                                        <img
                                            src={leaderboard[1].avatar}
                                            alt={leaderboard[1].name}
                                            className={`w-16 h-16 rounded-full object-cover border-3 border-slate-400 shadow-lg ${leaderboard[1].id === currentUser.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                                                }`}
                                        />
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xl">🥈</span>
                                    </div>
                                    <p className={`text-xs font-semibold text-center truncate w-full ${leaderboard[1].id === currentUser.id ? 'text-primary' : 'text-foreground'
                                        }`}>{leaderboard[1].name.split(' ')[0]}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">{leaderboard[1].points} pts</p>
                                    <div className="w-full h-16 bg-slate-400/20 rounded-t-xl mt-2 flex items-center justify-center">
                                        <span className="text-2xl font-black text-slate-400/60">2</span>
                                    </div>
                                </div>

                                {/* 1st Place */}
                                <div className="flex flex-col items-center w-[34%]">
                                    <div className="relative mb-2">
                                        <img
                                            src={leaderboard[0].avatar}
                                            alt={leaderboard[0].name}
                                            className={`w-20 h-20 rounded-full object-cover border-3 border-yellow-400 shadow-xl ${leaderboard[0].id === currentUser.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                                                }`}
                                        />
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-2xl">🥇</span>
                                    </div>
                                    <p className={`text-sm font-bold text-center truncate w-full ${leaderboard[0].id === currentUser.id ? 'text-primary' : 'text-foreground'
                                        }`}>{leaderboard[0].name.split(' ')[0]}</p>
                                    <p className="text-xs text-yellow-500 font-semibold">{leaderboard[0].points} pts</p>
                                    <div className="w-full h-24 bg-yellow-400/20 rounded-t-xl mt-2 flex items-center justify-center">
                                        <span className="text-3xl font-black text-yellow-400/60">1</span>
                                    </div>
                                </div>

                                {/* 3rd Place */}
                                <div className="flex flex-col items-center w-[30%]">
                                    <div className="relative mb-2">
                                        <img
                                            src={leaderboard[2].avatar}
                                            alt={leaderboard[2].name}
                                            className={`w-16 h-16 rounded-full object-cover border-3 border-amber-600 shadow-lg ${leaderboard[2].id === currentUser.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                                                }`}
                                        />
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xl">🥉</span>
                                    </div>
                                    <p className={`text-xs font-semibold text-center truncate w-full ${leaderboard[2].id === currentUser.id ? 'text-primary' : 'text-foreground'
                                        }`}>{leaderboard[2].name.split(' ')[0]}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">{leaderboard[2].points} pts</p>
                                    <div className="w-full h-12 bg-amber-600/20 rounded-t-xl mt-2 flex items-center justify-center">
                                        <span className="text-xl font-black text-amber-600/60">3</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* List — 4th and below */}
                        <div className="flex flex-col gap-2.5">
                            {leaderboard.slice(3).map((user, idx) => {
                                const position = idx + 4;
                                const isCurrentUser = user.id === currentUser.id;
                                return (
                                    <div
                                        key={user.id}
                                        className={`flex items-center gap-3 rounded-2xl p-3 transition-all ${isCurrentUser
                                            ? 'bg-primary/10 border-2 border-primary/30 shadow-sm'
                                            : 'bg-card border border-border hover:bg-muted/50'
                                            }`}
                                    >
                                        {/* Position */}
                                        <span className={`w-8 text-center font-bold text-sm flex-shrink-0 ${isCurrentUser ? 'text-primary' : 'text-muted-foreground'
                                            }`}>#{position}</span>

                                        {/* Avatar */}
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className={`w-10 h-10 rounded-full object-cover flex-shrink-0 ${isCurrentUser ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                                                }`}
                                        />

                                        {/* Name & League */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'
                                                }`}>
                                                {user.name}
                                                {isCurrentUser && <span className="text-xs ml-1 opacity-70">(Tú)</span>}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <span>{getLeagueIconText(user.league)}</span>
                                                {user.league}
                                            </p>
                                        </div>

                                        {/* Points */}
                                        <div className="text-right flex-shrink-0">
                                            <p className={`text-sm font-bold ${isCurrentUser ? 'text-primary' : 'text-foreground'
                                                }`}>{user.points}</p>
                                            <p className="text-[10px] text-muted-foreground">pts</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Training Calendar */}
            {(() => {
                const monthStart = startOfMonth(calendarMonth);
                const monthEnd = endOfMonth(calendarMonth);
                const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
                // getDay: 0=Sun. Convert to Mon=0 based: (getDay(d) + 6) % 7
                const startOffset = (getDay(monthStart) + 6) % 7;

                const DAY_INITIALS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

                return (
                    <div className="bg-card rounded-3xl border border-border p-4 shadow-soft">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <h2 className="text-lg font-semibold text-foreground capitalize">
                                {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                            </h2>
                            <button
                                onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {/* Empty offset cells */}
                            {Array.from({ length: startOffset }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {/* Day cells */}
                            {daysInMonth.map(date => {
                                const dayNum = date.getDate();
                                const weekend = isWeekend(date);
                                const monIdx = (getDay(date) + 6) % 7; // 0=Mon
                                const initials = DAY_INITIALS[monIdx];
                                const isSelected = selectedDay?.getTime() === date.getTime();

                                return (
                                    <button
                                        key={dayNum}
                                        onClick={() => setSelectedDay(date)}
                                        className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border transition-all text-xs font-medium ${weekend
                                            ? 'bg-orange-500/15 text-orange-600 border-orange-400/30 dark:text-orange-400'
                                            : 'bg-emerald-500/15 text-emerald-700 border-emerald-400/30 dark:text-emerald-400'
                                            } ${isSelected ? 'ring-2 ring-offset-1 ring-offset-background ' + (weekend ? 'ring-orange-400' : 'ring-emerald-400') : ''}`}
                                    >
                                        <span className={`text-[9px] font-bold uppercase leading-none ${weekend ? 'text-orange-500/60 dark:text-orange-400/60' : 'text-emerald-600/60 dark:text-emerald-400/60'
                                            }`}>
                                            {initials}
                                        </span>
                                        <span className="text-sm font-bold leading-none">{dayNum}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-5 mt-4 pt-3 border-t border-border">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
                                <span className="text-xs text-muted-foreground">Entreno</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-orange-500/40" />
                                <span className="text-xs text-muted-foreground">Descanso</span>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Day Detail Dialog */}
            <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
                <DialogContent className="max-w-[92vw] rounded-2xl">
                    {selectedDay && (() => {
                        const weekend = isWeekend(selectedDay);
                        const dayOfWeek = ((getDay(selectedDay) + 6) % 7) + 1; // 1=Mon...5=Fri
                        const routine = !weekend ? WEEKDAY_ROUTINES[dayOfWeek] || WEEKDAY_ROUTINES[1] : null;

                        return (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        {weekend ? (
                                            <Moon className="w-5 h-5 text-orange-400" />
                                        ) : (
                                            <Dumbbell className="w-5 h-5 text-emerald-500" />
                                        )}
                                        {weekend ? 'Día de Descanso' : `Rutina del ${format(selectedDay, "d 'de' MMMM", { locale: es })}`}
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {format(selectedDay, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                    </p>
                                </DialogHeader>

                                {weekend ? (
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-orange-500/15 flex items-center justify-center">
                                            <span className="text-3xl">😴</span>
                                        </div>
                                        <p className="font-semibold text-foreground">¡Recuperando energías!</p>
                                        <p className="text-sm text-muted-foreground mt-1">🔋 Tu cuerpo necesita descanso para crecer</p>
                                    </div>
                                ) : routine && (
                                    <div className="space-y-3 py-2">
                                        {/* Routine summary card */}
                                        <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-400/20">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-bold text-foreground">{routine.name}</p>
                                                <span className="text-xs text-muted-foreground">⏱ {routine.duration} min</span>
                                            </div>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                {routine.exercises.length} ejercicios
                                            </p>
                                        </div>

                                        {/* Exercise list */}
                                        <div className="space-y-1.5">
                                            {routine.exercises.map((ex, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-3 bg-muted/50 rounded-xl px-3 py-2.5"
                                                >
                                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="text-sm text-foreground">{ex}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Visual Progress Analysis Card */}
            <button
                onClick={() => { setShowProgressDialog(true); setAiFeedback(null); setIsAnalyzing(false); }}
                className="w-full rounded-3xl border border-border bg-card p-5 shadow-soft text-left hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                        <Camera className="w-7 h-7 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-foreground">📸 Análisis de Progreso Visual</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Subí tus fotos y dejá que la IA analice tu evolución</p>
                    </div>
                    <span className="text-muted-foreground text-xs">Ver →</span>
                </div>
            </button>

            {/* Actions */}
            <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start" onClick={toggleTheme}>
                    {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
                </Button>
                <Button variant="destructive" className="w-full" onClick={logout}>
                    Cerrar Sesión
                </Button>
            </div>

            {/* Medical Record Dialog */}
            <Dialog open={showMedicalDialog} onOpenChange={setShowMedicalDialog}>
                <DialogContent className="max-w-[92vw] rounded-2xl max-h-[85vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <FileHeart className="w-5 h-5 text-primary" />
                            Ficha Médica
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground">Completá tu información médica para un entrenamiento seguro.</p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 space-y-6 py-4">
                        {/* ── DATOS FÍSICOS ── */}
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Datos Físicos</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="weight" className="text-xs">Peso (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        placeholder="75"
                                        value={medicalForm.weight}
                                        onChange={(e) => setMedicalForm(prev => ({ ...prev, weight: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="height" className="text-xs">Altura (cm)</Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        placeholder="175"
                                        value={medicalForm.height}
                                        onChange={(e) => setMedicalForm(prev => ({ ...prev, height: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="measurements" className="text-xs">Talla / Medidas</Label>
                                    <Input
                                        id="measurements"
                                        type="text"
                                        placeholder="M, L, XL..."
                                        value={medicalForm.measurements}
                                        onChange={(e) => setMedicalForm(prev => ({ ...prev, measurements: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="blood-type" className="text-xs">Tipo de Sangre</Label>
                                    <Select
                                        value={medicalForm.bloodType}
                                        onValueChange={(val) => setMedicalForm(prev => ({ ...prev, bloodType: val }))}
                                    >
                                        <SelectTrigger id="blood-type">
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                                                <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* ── DATOS MÉDICOS ── */}
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Datos Médicos</h3>
                            <div className="space-y-4">
                                {/* Takes Medication Switch */}
                                <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                                    <Label htmlFor="takes-medication" className="text-sm font-medium cursor-pointer">
                                        ¿Toma medicamentos?
                                    </Label>
                                    <Switch
                                        id="takes-medication"
                                        checked={medicalForm.takesMedication}
                                        onCheckedChange={(checked) => setMedicalForm(prev => ({
                                            ...prev,
                                            takesMedication: checked,
                                            medications: checked ? prev.medications : ''
                                        }))}
                                    />
                                </div>

                                {/* Conditional Medications Input */}
                                {medicalForm.takesMedication && (
                                    <div className="space-y-1.5 animate-fade-in">
                                        <Label htmlFor="medications" className="text-xs">¿Cuáles?</Label>
                                        <Input
                                            id="medications"
                                            placeholder="Ej: Ibuprofeno 400mg, Omeprazol..."
                                            value={medicalForm.medications}
                                            onChange={(e) => setMedicalForm(prev => ({ ...prev, medications: e.target.value }))}
                                        />
                                    </div>
                                )}

                                {/* Pathologies */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="pathologies" className="text-xs">Patologías</Label>
                                    <Input
                                        id="pathologies"
                                        type="text"
                                        placeholder="Ej: Asma, Diabetes Tipo 2, Hipertensión..."
                                        value={medicalForm.pathologies}
                                        onChange={(e) => setMedicalForm(prev => ({ ...prev, pathologies: e.target.value }))}
                                    />
                                </div>

                                {/* Chronic Pathology Switch */}
                                <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                                    <Label htmlFor="chronic-pathology" className="text-sm font-medium cursor-pointer">
                                        ¿Es patología crónica?
                                    </Label>
                                    <Switch
                                        id="chronic-pathology"
                                        checked={medicalForm.isChronicPathology}
                                        onCheckedChange={(checked) => setMedicalForm(prev => ({ ...prev, isChronicPathology: checked }))}
                                    />
                                </div>

                                {/* Injuries */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="injuries" className="text-xs">Lesiones Previas</Label>
                                    <Textarea
                                        id="injuries"
                                        placeholder="Ej: Esguince tobillo izq (2023), Tendinitis hombro..."
                                        value={medicalForm.injuries}
                                        onChange={(e) => setMedicalForm(prev => ({ ...prev, injuries: e.target.value }))}
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── EMERGENCIA ── */}
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Emergencia</h3>
                            <div className="space-y-1.5">
                                <Label htmlFor="emergency-phone" className="text-xs">Número de Emergencia</Label>
                                <div className="relative">
                                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="emergency-phone"
                                        type="tel"
                                        placeholder="+54 9 11 1234-5678"
                                        className="pl-9"
                                        value={medicalForm.emergencyPhone}
                                        onChange={(e) => setMedicalForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 px-6 py-4 border-t border-border flex-shrink-0">
                        <Button variant="secondary" onClick={() => setShowMedicalDialog(false)}>
                            Cancelar
                        </Button>
                        <Button variant="gradient" onClick={handleSaveMedical}>
                            Guardar Ficha
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Visual Progress Analysis Dialog */}
            <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                <DialogContent className="max-w-[92vw] rounded-2xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-3 flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <Camera className="w-5 h-5 text-violet-500" />
                            Mi Evolución
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground">Subí tus fotos y dejá que nuestra IA analice tus cambios físicos.</p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
                        {/* Before / After Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Before */}
                            <div className="flex flex-col items-center">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Antes</p>
                                <label className="w-full aspect-[3/4] rounded-xl bg-muted/60 border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-muted">
                                    <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">Subir foto</span>
                                    <input type="file" accept="image/*" className="hidden" />
                                </label>
                            </div>

                            {/* After */}
                            <div className="flex flex-col items-center">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Después</p>
                                <label className="w-full aspect-[3/4] rounded-xl bg-muted/60 border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-muted">
                                    <div className="w-12 h-12 rounded-full bg-fuchsia-500/10 flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-fuchsia-400" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">Subir foto</span>
                                    <input type="file" accept="image/*" className="hidden" />
                                </label>
                            </div>
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyzeProgress}
                            disabled={isAnalyzing}
                            className={`w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isAnalyzing
                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                : 'btn-gradient cursor-pointer'
                                }`}
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando imágenes con IA...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Analizar Progreso con IA
                                </>
                            )}
                        </button>

                        {/* AI Feedback Result */}
                        {aiFeedback && (
                            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 space-y-3 animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-foreground text-sm">Reporte de Inteligencia Artificial</h3>
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed italic">
                                    {aiFeedback}
                                </p>
                                <div className="flex items-center gap-1.5 pt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    <span className="text-[10px] text-muted-foreground">Análisis generado por IA · Solo orientativo</span>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
