import { useState, useEffect, useCallback } from 'react';
import { Trophy, Phone, FileHeart, Sparkles, Dumbbell, Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Moon, Phone as PhoneIcon, Lock, Crown, Users, Camera, Loader2, Clock, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Evolutionary avatar imports
import avatarMaleLower from '@/assets/avatar-male-lower.png';
import avatarMaleUpper from '@/assets/avatar-male-upper.png';
import avatarFemaleLower from '@/assets/avatar-female-lower.png';
import avatarFemaleUpper from '@/assets/avatar-female-upper.png';

import { TrainerDashboardTab } from './TrainerDashboardTab';

interface ProfileTabProps {
    currentUser: any;
    updateUser: (id: string, data: any) => void;
    toggleTheme: () => void;
    theme: string;
    logout: () => void;
}

interface MedicalForm {
    fullName: string;
    birthDate: string;
    dni: string;
    personalPhone: string;
    emergencyPhone: string;
    emergencyContactName: string;
    weight: string;
    height: string;
    heartDisease: boolean;
    chestPainActivity: boolean;
    chestPainRest: boolean;
    dizziness: boolean;
    boneIssues: boolean;
    asthma: boolean;
    surgery: boolean;
    heartMeds: boolean;
    pregnancy: boolean;
    diabetes: boolean;
    currentMeds: string;
    allergies: string;
    recentInjuries: string;
    gender: string;
}

const INITIAL_MEDICAL_FORM: MedicalForm = {
    fullName: '', birthDate: '', dni: '', personalPhone: '',
    emergencyPhone: '', emergencyContactName: '', weight: '', height: '',
    heartDisease: false, chestPainActivity: false, chestPainRest: false,
    dizziness: false, boneIssues: false, asthma: false, surgery: false,
    heartMeds: false, pregnancy: false, diabetes: false,
    currentMeds: '', allergies: '', recentInjuries: '', gender: '',
};



export function ProfileTab({ currentUser, updateUser, toggleTheme, theme, logout }: ProfileTabProps) {
    const { toast } = useToast();
    const [showMedicalDialog, setShowMedicalDialog] = useState(false);
    const [showLeaguesDialog, setShowLeaguesDialog] = useState(false);
    const [showTrainerDashboard, setShowTrainerDashboard] = useState(false);

    const [expandedLeague, setExpandedLeague] = useState<string | null>(null);

    const [showProgressDialog, setShowProgressDialog] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);

    // ── Avatar & Name editing states ──
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState(currentUser?.name || '');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const handleAnalyzeProgress = () => {
        setIsAnalyzing(true);
        setAiFeedback(null);
        setTimeout(() => {
            setIsAnalyzing(false);
            setAiFeedback(
                '¡Excelente trabajo! Comparando ambas imágenes, notamos un aumento visible en el volumen de tus deltoides (hombros) y mayor definición en la zona abdominal. Tu postura general también luce más erguida. ¡Seguí así!'
            );
        }, 2000);
    };

    // ── Avatar upload handler ──
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setIsUploadingAvatar(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            updateUser(currentUser.id, { avatar: publicUrl });
            await supabase.from('profiles').update({ avatar: publicUrl }).eq('id', currentUser.id);

            toast({ title: 'Foto actualizada ✅', description: 'Tu nueva foto de perfil se guardó correctamente.' });
        } catch (err: any) {
            console.error('Avatar upload error:', err);
            toast({ title: 'Error al subir foto', description: err.message || 'Intentá de nuevo más tarde.', variant: 'destructive' });
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // ── Name save handler ──
    const handleNameSave = async () => {
        const trimmed = editNameValue.trim();
        if (!trimmed) return;
        try {
            updateUser(currentUser.id, { name: trimmed });
            await supabase.from('profiles').update({ name: trimmed }).eq('id', currentUser.id);
            setIsEditingName(false);
            toast({ title: 'Nombre actualizado ✅', description: 'Tu nombre se guardó correctamente.' });
        } catch (err: any) {
            console.error('Name save error:', err);
            toast({ title: 'Error al guardar nombre', description: err.message || 'Intentá de nuevo más tarde.', variant: 'destructive' });
        }
    };

    // ── Leaderboard state & fetch ──
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

    // ── Personal Records states ──
    const [showRecordsDialog, setShowRecordsDialog] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<(null | { id: string; name: string; pr: number })[]>([null, null, null, null, null]);
    const [isExerciseSelectorOpen, setIsExerciseSelectorOpen] = useState(false);
    const [activeSlotIndex, setActiveSlotIndex] = useState(0);
    const [availableExercises, setAvailableExercises] = useState<any[]>([]);
    const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');

    const LEAGUE_WEIGHTS: Record<string, number> = {
        'Supremo': 7, 'Diamante': 6, 'Esmeralda': 5,
        'Oro': 4, 'Plata': 3, 'Bronce': 2, 'Hierro': 1,
    };

    const fetchLeaderboard = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, avatar, ranked');
            if (error) throw error;
            if (!data) return;

            const sorted = data
                .map((u: any) => ({
                    id: u.id,
                    name: u.name || 'Atleta',
                    avatar: u.avatar,
                    league: u.ranked?.league || 'Hierro',
                    division: u.ranked?.division || 5,
                    points: u.ranked?.currentPoints || 0,
                }))
                .sort((a: any, b: any) => {
                    const wA = LEAGUE_WEIGHTS[a.league] || 0;
                    const wB = LEAGUE_WEIGHTS[b.league] || 0;
                    if (wA !== wB) return wB - wA;
                    if (a.division !== b.division) return a.division - b.division;
                    return b.points - a.points;
                });

            setLeaderboard(sorted);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        }
    }, []);

    const handleOpenLeaderboard = () => {
        setIsLeaderboardOpen(true);
        fetchLeaderboard();
    };

    // ── Personal Records functions ──
    const fetchPRForExercise = async (exerciseId: string, exerciseName: string, slotIndex: number) => {
        try {
            const { data } = await supabase
                .from('personal_records')
                .select('max_weight')
                .eq('user_id', currentUser.id)
                .eq('exercise_id', exerciseId)
                .limit(1)
                .single();

            const pr = data?.max_weight ?? 0;
            setSelectedSlots(prev => {
                const updated = [...prev];
                updated[slotIndex] = { id: exerciseId, name: exerciseName, pr };
                return updated;
            });
        } catch (err) {
            console.error('Error fetching PR:', err);
            setSelectedSlots(prev => {
                const updated = [...prev];
                updated[slotIndex] = { id: exerciseId, name: exerciseName, pr: 0 };
                return updated;
            });
        }
    };

    const openExerciseSelector = async (slotIndex: number) => {
        setActiveSlotIndex(slotIndex);
        setExerciseSearchQuery('');
        try {
            const { data } = await supabase.from('exercises').select('id, name').order('name');
            setAvailableExercises(data || []);
        } catch (err) {
            console.error('Error fetching exercises:', err);
        }
        setIsExerciseSelectorOpen(true);
    };

    const getLeagueIconText = (league: string) => {
        const icons: Record<string, string> = { 'Hierro': '⚙️', 'Bronce': '🥉', 'Plata': '🥈', 'Oro': '🥇', 'Esmeralda': '💎', 'Diamante': '👑' };
        return icons[league] || '🏅';
    };

    const [medicalForm, setMedicalForm] = useState<MedicalForm>(() => ({
        ...INITIAL_MEDICAL_FORM,
        ...(currentUser?.medical_record || {}),
    }));
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [showDayDetailDialog, setShowDayDetailDialog] = useState(false);

    // Workout calendar data from daily_logs
    const [workoutCalendar, setWorkoutCalendar] = useState<Record<string, { status: 'workout' | 'rest'; workout_id?: string; routine?: any }>>({});

    // Day detail states
    const [selectedRoutineData, setSelectedRoutineData] = useState<any>(null);
    const [selectedExerciseLogs, setSelectedExerciseLogs] = useState<any[]>([]);
    const [isLoadingDayDetail, setIsLoadingDayDetail] = useState(false);

    // ── Streak reset check ──
    useEffect(() => {
        if (!currentUser?.id) return;
        const checkStreak = async () => {
            try {
                const { data, error } = await supabase.rpc('check_and_reset_streak', { p_user_id: currentUser.id });
                if (error) throw error;
                // If streak was reset, update local state
                if (data !== null && data !== undefined && data !== currentUser.streak) {
                    updateUser(currentUser.id, { streak: data });
                }
            } catch (err) {
                console.error('Error checking streak:', err);
            }
        };
        checkStreak();
    }, [currentUser?.id]);

    useEffect(() => {
        if (!currentUser?.id) return;

        const fetchDailyLogs = async () => {
            try {
                const { data, error } = await supabase
                    .from('daily_logs')
                    .select('date, activity_type, workout_id')
                    .eq('user_id', currentUser.id);

                if (error) throw error;

                if (data) {
                    const calendarMap: Record<string, { status: 'workout' | 'rest'; workout_id?: string; routine?: any }> = {};
                    data.forEach((log: any) => {
                        const dateString = log.date.split('T')[0];
                        calendarMap[dateString] = {
                            status: log.activity_type as 'workout' | 'rest',
                            workout_id: log.workout_id
                        };
                    });
                    setWorkoutCalendar(calendarMap);
                }
            } catch (err) {
                console.error('Error fetching daily logs:', err);
            }
        };

        fetchDailyLogs();
    }, [currentUser?.id, calendarMonth]);

    const getDayStatus = useCallback((date: Date): 'workout' | 'rest' | null => {
        const key = format(date, 'yyyy-MM-dd');
        return workoutCalendar[key]?.status || null;
    }, [workoutCalendar]);

    const handleDayClick = async (date: Date) => {
        setSelectedDay(date);
        const dateString = format(date, 'yyyy-MM-dd');
        const dayData = workoutCalendar[dateString];

        setShowDayDetailDialog(true);

        if (dayData?.status === 'workout' && dayData.workout_id) {
            setIsLoadingDayDetail(true);
            try {
                // Fetch routine
                const { data: routineData } = await supabase
                    .from('routines')
                    .select('*, routine_exercises(*, exercises(*))')
                    .eq('id', dayData.workout_id)
                    .single();

                // Fetch exercise logs
                const { data: logsData } = await supabase
                    .from('exercise_logs')
                    .select('*')
                    .eq('date', dateString)
                    .eq('user_id', currentUser.id)
                    .order('set_index', { ascending: true });

                setSelectedRoutineData(routineData);
                setSelectedExerciseLogs(logsData || []);
            } catch (err) {
                console.error("Error fetching day details:", err);
            } finally {
                setIsLoadingDayDetail(false);
            }
        } else {
            setSelectedRoutineData(null);
            setSelectedExerciseLogs([]);
        }
    };


    const selectedDayData = selectedDay ? workoutCalendar[format(selectedDay, 'yyyy-MM-dd')] : null;

    const getLeagueIcon = (league: string) => {
        const icons: Record<string, string> = { 'Hierro': '⚙️', 'Bronce': '🥉', 'Plata': '🥈', 'Oro': '🥇', 'Esmeralda': '💎', 'Diamante': '👑' };
        return icons[league] || '🏅';
    };

    const getLeagueColor = (league: string) => {
        const colors: Record<string, string> = { 'Hierro': 'from-gray-400 to-gray-600', 'Bronce': 'from-amber-600 to-amber-800', 'Plata': 'from-gray-300 to-gray-500', 'Oro': 'from-yellow-400 to-yellow-600', 'Esmeralda': 'from-emerald-400 to-emerald-600', 'Diamante': 'from-cyan-300 to-blue-500' };
        return colors[league] || 'from-gray-400 to-gray-600';
    };

    const handleSaveMedical = async () => {
        try {
            updateUser(currentUser.id, { medical_record: medicalForm });
            await supabase.from('profiles').update({ medical_record: medicalForm }).eq('id', currentUser.id);
            setShowMedicalDialog(false);
            toast({ title: 'Ficha médica guardada ✅', description: 'Tus datos médicos han sido registrados.' });
        } catch (err: any) {
            console.error('Medical save error:', err);
            toast({ title: 'Error al guardar', description: err.message || 'Intentá de nuevo más tarde.', variant: 'destructive' });
        }
    };

    if (!currentUser) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    const membershipActive = currentUser.membershipStatus === 'active';

    return (
        <div className="p-4 space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-start gap-4">
                {/* Avatar with upload */}
                <label className="cursor-pointer relative group flex-shrink-0">
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                    <img
                        src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}`}
                        alt={currentUser.name}
                        className="w-20 h-20 rounded-2xl object-cover"
                    />
                    {/* Overlay */}
                    {isUploadingAvatar ? (
                        <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    )}
                </label>

                <div className="flex-1 min-w-0">
                    {/* Name — inline edit */}
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                className="h-8 text-lg font-bold"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                            />
                            <button onClick={handleNameSave} className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors">
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-foreground">{currentUser.name}</h1>
                            <button onClick={() => { setEditNameValue(currentUser.name); setIsEditingName(true); }} className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${membershipActive ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                            <div className={`w-2 h-2 rounded-full ${membershipActive ? 'bg-success' : 'bg-warning'}`} />
                            {membershipActive ? 'Activa' : 'En Espera'}
                        </div>
                        <button onClick={() => setShowMedicalDialog(true)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer">
                            <FileHeart className="w-3.5 h-3.5" /> Ficha Médica
                        </button>
                    </div>
                </div>
            </div>

            {/* Ranked Card */}
            {(() => {
                const league = currentUser.ranked?.league || 'Hierro';
                const division = currentUser.ranked?.division || 5;
                const points = currentUser.ranked?.currentPoints || 0;
                const maxPoints = currentUser.ranked?.maxPoints || 200;
                const gender = currentUser.gender || 'male';
                const tier = ['Hierro', 'Bronce'].includes(league) ? 'low' : ['Plata', 'Oro'].includes(league) ? 'mid' : 'high';

                const avatarMap: any = {
                    male: { low: avatarMaleLower, mid: avatarMaleUpper, high: avatarMaleUpper },
                    female: { low: avatarFemaleLower, mid: avatarFemaleUpper, high: avatarFemaleUpper },
                };
                const avatarSrc = avatarMap[gender]?.[tier] || avatarMaleLower;

                return (
                    <button onClick={() => setShowLeaguesDialog(true)} className={`relative rounded-3xl border border-white/10 p-5 shadow-soft overflow-hidden bg-gradient-to-br ${getLeagueColor(league)} w-full text-left transition-all hover:shadow-lg active:scale-[0.99] cursor-pointer`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-white" />
                            <h2 className="font-semibold text-white">Nivel de Atleta</h2>
                            <span className="ml-auto text-[10px] text-white/70">Ver ligas →</span>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shadow-lg flex-shrink-0 text-white">
                                {getLeagueIcon(league)}
                            </div>
                            <div className="flex-1">
                                <p className="text-2xl font-black tracking-tight text-white">{league} {division}</p>
                                <p className="text-xs text-white/80">{points}/{maxPoints} pts para subir</p>
                            </div>
                            <img src={avatarSrc} alt="avatar" className="w-16 h-20 object-contain drop-shadow-lg" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-2.5 bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${(points / maxPoints) * 100}%` }} />
                            </div>
                        </div>
                    </button>
                );
            })()}

            {/* Ranking Global Trophy Button */}
            <button
                onClick={handleOpenLeaderboard}
                className="w-[85%] mx-auto h-20 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 rounded-t-lg rounded-b-[4rem] shadow-[0_15px_30px_-10px_rgba(202,138,4,0.6)] border-b-[10px] border-yellow-800 flex items-center justify-center transition-all active:scale-95 cursor-pointer hover:brightness-110 my-8"
            >
                <span className="text-yellow-950 font-black tracking-widest uppercase text-lg drop-shadow-sm">
                    RANKING GLOBAL 🏆
                </span>
            </button>

            {/* Mis Récords Personales Button */}
            <button
                onClick={() => setShowRecordsDialog(true)}
                className="w-full rounded-2xl border border-violet-500/20 bg-card p-4 flex items-center gap-3 transition-all hover:border-violet-500/40 hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
                <div className="w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-violet-500" />
                </div>
                <div className="flex-1 text-left">
                    <p className="font-bold text-sm text-foreground">MIS RÉCORDS PERSONALES</p>
                    <p className="text-[10px] text-muted-foreground">Visualizá tus PRs por ejercicio</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Dashboard Entrenador Button (Solo Trainers) */}
            {currentUser?.role === 'trainer' && (
                <button
                    onClick={() => setShowTrainerDashboard(true)}
                    className="w-full rounded-2xl border border-orange-500/20 bg-card p-4 flex items-center gap-3 transition-all hover:border-orange-500/40 hover:shadow-md active:scale-[0.98] cursor-pointer"
                >
                    <div className="w-11 h-11 rounded-xl bg-orange-500/15 flex items-center justify-center">
                        <Users className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-bold text-sm text-foreground">DASHBOARD DE ENTRENADOR</p>
                        <p className="text-[10px] text-muted-foreground">Gestioná tus clientes y asigná rutinas</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
            )}

            {/* Calendar */}
            <div className="bg-card rounded-3xl border border-border p-4 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="p-2 hover:bg-muted rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                    <h2 className="text-sm font-semibold capitalize">{format(calendarMonth, 'MMMM yyyy', { locale: es })}</h2>
                    <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="p-2 hover:bg-muted rounded-full"><ChevronRight className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].map(d => <div key={d} className="text-[9px] text-center font-bold text-muted-foreground">{d}</div>)}
                    {Array.from({ length: (getDay(startOfMonth(calendarMonth)) + 6) % 7 }).map((_, i) => <div key={i} />)}
                    {eachDayOfInterval({ start: startOfMonth(calendarMonth), end: endOfMonth(calendarMonth) }).map(date => {
                        const status = getDayStatus(date);
                        let dayClass = 'bg-transparent text-muted-foreground';
                        if (status === 'workout') dayClass = 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
                        if (status === 'rest') dayClass = 'bg-orange-500/10 text-orange-600 border border-orange-500/20';
                        return (
                            <button key={date.toString()} onClick={() => handleDayClick(date)} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${dayClass}`}>
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
                {/* Leyenda */}
                <div className="flex items-center justify-center gap-5 mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-300" />
                        <span className="text-[11px] text-muted-foreground">Entreno</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-orange-300" />
                        <span className="text-[11px] text-muted-foreground">Descanso</span>
                    </div>
                </div>
            </div>

            {/* Progress AI */}
            <button onClick={() => setShowProgressDialog(true)} className="w-full rounded-3xl border border-border bg-card p-5 shadow-soft text-left flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center flex-shrink-0"><Camera className="w-6 h-6 text-violet-500" /></div>
                <div className="flex-1"><h2 className="font-semibold text-sm">📸 Análisis de Progreso Visual</h2><p className="text-[10px] text-muted-foreground">Usá nuestra IA para analizar tus fotos</p></div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Actions */}
            <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start rounded-2xl h-12" onClick={toggleTheme}>
                    {theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
                </Button>
                <Button variant="destructive" className="w-full rounded-2xl h-12" onClick={logout}>Cerrar Sesión</Button>
            </div>

            {/* Dialogs */}
            <Dialog open={showTrainerDashboard} onOpenChange={setShowTrainerDashboard}>
                <DialogContent className="max-w-[92vw] rounded-3xl p-0 max-h-[85vh] overflow-hidden flex flex-col bg-background border-border" aria-describedby={undefined}>
                    <div className="flex-1 overflow-y-auto w-full h-full relative">
                        <TrainerDashboardTab currentUser={currentUser} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showMedicalDialog} onOpenChange={setShowMedicalDialog}>
                <DialogContent className="max-w-[92vw] rounded-3xl p-6 max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><FileHeart className="text-primary" /> Ficha Médica</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-4">

                        {/* ── SECCIÓN 1: DATOS PERSONALES ── */}
                        <div>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Datos Personales</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5"><Label className="text-xs">Nombre Completo</Label><Input placeholder="Juan Pérez" value={medicalForm.fullName} onChange={(e) => setMedicalForm(prev => ({ ...prev, fullName: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Sexo</Label><Select value={medicalForm.gender} onValueChange={(value) => setMedicalForm(prev => ({ ...prev, gender: value }))}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="male">Masculino</SelectItem><SelectItem value="female">Femenino</SelectItem></SelectContent></Select></div>
                                <div className="space-y-1.5"><Label className="text-xs">Fecha de Nacimiento</Label><Input type="date" value={medicalForm.birthDate} onChange={(e) => setMedicalForm(prev => ({ ...prev, birthDate: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">DNI</Label><Input placeholder="12345678" value={medicalForm.dni} onChange={(e) => setMedicalForm(prev => ({ ...prev, dni: e.target.value }))} /></div>
                                <div className="space-y-1.5 col-span-2"><Label className="text-xs">Teléfono Personal</Label><Input type="tel" placeholder="+54 11 1234-5678" value={medicalForm.personalPhone} onChange={(e) => setMedicalForm(prev => ({ ...prev, personalPhone: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Contacto de Emergencia</Label><Input placeholder="Nombre del contacto" value={medicalForm.emergencyContactName} onChange={(e) => setMedicalForm(prev => ({ ...prev, emergencyContactName: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Tel. de Emergencia</Label><Input type="tel" placeholder="+54 11 8765-4321" value={medicalForm.emergencyPhone} onChange={(e) => setMedicalForm(prev => ({ ...prev, emergencyPhone: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Peso (kg)</Label><Input type="number" placeholder="75" value={medicalForm.weight} onChange={(e) => setMedicalForm(prev => ({ ...prev, weight: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Altura (cm)</Label><Input type="number" placeholder="175" value={medicalForm.height} onChange={(e) => setMedicalForm(prev => ({ ...prev, height: e.target.value }))} /></div>
                            </div>
                        </div>

                        <hr className="border-border/50" />

                        {/* ── SECCIÓN 3: DETALLES ── */}
                        <div>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Detalles Adicionales</h3>
                            <div className="space-y-3">
                                <div className="space-y-1.5"><Label className="text-xs">Medicación actual (crónica o regular)</Label><Textarea placeholder="Ej: Enalapril 10mg, Levotiroxina..." value={medicalForm.currentMeds} onChange={(e) => setMedicalForm(prev => ({ ...prev, currentMeds: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Alergias severas</Label><Textarea placeholder="Ej: Penicilina, Maní..." value={medicalForm.allergies} onChange={(e) => setMedicalForm(prev => ({ ...prev, allergies: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Lesiones recientes (desgarros, esguinces activos)</Label><Textarea placeholder="Ej: Esguince de tobillo derecho hace 2 semanas..." value={medicalForm.recentInjuries} onChange={(e) => setMedicalForm(prev => ({ ...prev, recentInjuries: e.target.value }))} /></div>
                            </div>
                        </div>

                    </div>
                    <DialogFooter><Button className="w-full rounded-xl" onClick={handleSaveMedical}>Guardar Ficha Médica</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                <DialogContent className="max-w-[92vw] rounded-3xl p-6" aria-describedby={undefined}>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="text-violet-500" /> Mi Evolución con IA</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="aspect-[3/4] bg-muted rounded-2xl border-2 border-dashed flex items-center justify-center text-[10px]">Foto Anterior</div>
                            <div className="aspect-[3/4] bg-muted rounded-2xl border-2 border-dashed flex items-center justify-center text-[10px]">Foto Actual</div>
                        </div>
                        <Button className="w-full rounded-xl btn-gradient" onClick={handleAnalyzeProgress} disabled={isAnalyzing}>
                            {isAnalyzing ? <Loader2 className="animate-spin" /> : 'Analizar con IA'}
                        </Button>
                        {aiFeedback && <div className="text-xs bg-violet-500/5 p-4 rounded-2xl border border-violet-500/10 italic text-foreground/80">{aiFeedback}</div>}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Leagues Dialog */}
            <Dialog open={showLeaguesDialog} onOpenChange={setShowLeaguesDialog}>
                <DialogContent className="max-w-[92vw] rounded-3xl p-6 max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" /> Camino a la Gloria
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">Subí de liga ganando puntos al entrenar, descansar e hidratarte.</p>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        {(() => {
                            const LEAGUES = [
                                { name: 'Hierro', ptsPerDivision: 200 },
                                { name: 'Bronce', ptsPerDivision: 200 },
                                { name: 'Plata', ptsPerDivision: 400 },
                                { name: 'Oro', ptsPerDivision: 400 },
                                { name: 'Esmeralda', ptsPerDivision: 500 },
                                { name: 'Diamante', ptsPerDivision: 500 },
                            ];
                            const LEAGUE_ORDER = LEAGUES.map(l => l.name);
                            const userLeague = currentUser.ranked?.league || 'Hierro';
                            const userDivision = currentUser.ranked?.division || 5;
                            const userLeagueIdx = LEAGUE_ORDER.indexOf(userLeague);

                            const isDivisionCompleted = (leagueName: string, division: number) => {
                                const leagueIdx = LEAGUE_ORDER.indexOf(leagueName);
                                if (leagueIdx < userLeagueIdx) return true;
                                if (leagueIdx === userLeagueIdx) return division > userDivision;
                                return false;
                            };

                            return (
                                <>
                                    {LEAGUES.map(league => {
                                        const isExpanded = expandedLeague === league.name;
                                        const leagueIdx = LEAGUE_ORDER.indexOf(league.name);
                                        const isCurrentLeague = league.name === userLeague;
                                        const isCompletedLeague = leagueIdx < userLeagueIdx;
                                        return (
                                            <div key={league.name} className="rounded-2xl overflow-hidden border border-border/50">
                                                <button
                                                    onClick={() => setExpandedLeague(isExpanded ? null : league.name)}
                                                    className={`w-full flex items-center gap-3 p-4 text-left transition-all bg-gradient-to-r ${getLeagueColor(league.name)} hover:opacity-90`}
                                                >
                                                    <span className="text-2xl">{getLeagueIcon(league.name)}</span>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-white text-sm">{league.name}</p>
                                                        <p className="text-[10px] text-white/70">{league.ptsPerDivision} pts por división</p>
                                                    </div>
                                                    {isCurrentLeague && (
                                                        <span className="text-[9px] bg-white/25 text-white px-2 py-0.5 rounded-full font-semibold">TU LIGA</span>
                                                    )}
                                                    {isCompletedLeague && (
                                                        <Check className="w-5 h-5 text-white" />
                                                    )}
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-4 h-4 text-white/70" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-white/70" />
                                                    )}
                                                </button>
                                                {isExpanded && (
                                                    <div className="bg-card divide-y divide-border/30">
                                                        {[5, 4, 3, 2, 1].map(div => {
                                                            const completed = isDivisionCompleted(league.name, div);
                                                            const isCurrent = isCurrentLeague && div === userDivision;
                                                            return (
                                                                <div
                                                                    key={div}
                                                                    className={`flex items-center justify-between px-4 py-3 text-sm ${isCurrent ? 'bg-primary/10' : ''
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        {completed ? (
                                                                            <Check className="w-4 h-4 text-emerald-500" />
                                                                        ) : (
                                                                            <Lock className="w-4 h-4 text-muted-foreground/50" />
                                                                        )}
                                                                        <span className={`font-medium ${isCurrent ? 'text-primary' : completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                            {league.name} {div}
                                                                        </span>
                                                                        {isCurrent && (
                                                                            <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">ACTUAL</span>
                                                                        )}
                                                                    </div>
                                                                    <span className={`text-xs tabular-nums ${completed ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                                                        {completed ? `${league.ptsPerDivision}/${league.ptsPerDivision}` : isCurrent ? `${currentUser?.ranked?.currentPoints || 0}/${league.ptsPerDivision}` : `0/${league.ptsPerDivision}`} pts
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {/* GYM PARTNER — Rango Supremo */}
                                    <div className="rounded-2xl overflow-hidden border border-border/50">
                                        <div className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600">
                                            <span className="text-2xl">🏆</span>
                                            <div className="flex-1">
                                                <p className="font-black text-white text-sm tracking-wide">GYM PARTNER</p>
                                                <p className="text-[10px] text-white/70">Rango Supremo — Puntos infinitos</p>
                                            </div>
                                            <Crown className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Ranking Leaderboard Dialog */}
            <Dialog open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen}>
                <DialogContent className="max-w-[92vw] rounded-3xl p-0 max-h-[85vh] flex flex-col overflow-hidden" aria-describedby={undefined}>
                    {/* ── HEADER NARANJA ── */}
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-center">
                        <DialogHeader className="text-center">
                            <DialogTitle className="text-white font-black text-lg tracking-wide">Global</DialogTitle>
                        </DialogHeader>
                    </div>

                    {(() => {
                        const myRankIndex = leaderboard.findIndex(u => u.id === currentUser?.id);
                        const myRank = myRankIndex + 1;
                        const showPodium = leaderboard.length >= 1;
                        const top3 = leaderboard.slice(0, 3);
                        const listUsers = leaderboard.slice(Math.min(3, leaderboard.length), 100);
                        const listStartRank = Math.min(3, leaderboard.length) + 1;
                        const myInTop100 = myRank >= 1 && myRank <= 100;

                        return (
                            <div className="flex-1 overflow-y-auto min-h-0 relative">
                                {/* ── PODIO VISUAL ESCALONADO ── */}
                                {showPodium && (
                                    <div className="flex justify-center items-end gap-3 mb-6 h-48 mt-4 pt-10 px-4 overflow-visible">
                                        {/* 2° Puesto (Izquierda - Plata) */}
                                        <div className="flex flex-col items-center">
                                            {top3[1] ? (() => {
                                                const isMe2 = top3[1].id === currentUser?.id;
                                                return (
                                                    <>
                                                        <img
                                                            src={top3[1].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[1].name)}&size=64&background=C0C0C0&color=fff`}
                                                            alt={top3[1].name}
                                                            className={`w-[50px] h-[50px] rounded-full object-cover border-[3px] shadow-md ${isMe2 ? 'border-orange-400' : 'border-gray-300'}`}
                                                        />
                                                        <p className={`text-[10px] font-bold mt-1 truncate max-w-[68px] text-center ${isMe2 ? 'text-orange-600 dark:text-orange-400' : 'text-foreground'}`}>{top3[1].name}{isMe2 ? ' (TÚ)' : ''}</p>
                                                        <p className="text-[9px] text-muted-foreground">{top3[1].points} pts</p>
                                                    </>
                                                );
                                            })() : (
                                                <div className="w-[50px] h-[50px] rounded-full border-[3px] border-dashed border-gray-300/50 flex items-center justify-center mb-[calc(0.25rem+1rem)]">
                                                    <span className="text-gray-300 text-sm">?</span>
                                                </div>
                                            )}
                                            <div className={`w-[72px] h-[72px] rounded-t-xl flex items-center justify-center mt-1 shadow-inner ${top3[1] && top3[1].id === currentUser?.id ? 'bg-orange-100/70 border-2 border-orange-400/50' : 'bg-slate-100/50 border border-gray-300/30'}`}>
                                                <span className="text-2xl font-black text-gray-400 drop-shadow">2</span>
                                            </div>
                                        </div>

                                        {/* 1° Puesto (Centro - Oro - MÁS ALTO) */}
                                        <div className="flex flex-col items-center -mt-4">
                                            <span className="text-2xl mb-0.5">👑</span>
                                            {(() => {
                                                const isMe1 = top3[0].id === currentUser?.id;
                                                return (
                                                    <>
                                                        <div className="relative">
                                                            <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 blur-md opacity-60 animate-pulse" />
                                                            <img
                                                                src={top3[0].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[0].name)}&size=80&background=FFD700&color=fff`}
                                                                alt={top3[0].name}
                                                                className={`w-[60px] h-[60px] rounded-full object-cover border-[3px] shadow-xl relative z-10 ${isMe1 ? 'border-orange-400' : 'border-yellow-400'}`}
                                                            />
                                                        </div>
                                                        <p className={`text-[11px] font-black mt-1 truncate max-w-[80px] text-center ${isMe1 ? 'text-orange-600 dark:text-orange-400' : 'text-foreground'}`}>{top3[0].name}{isMe1 ? ' (TÚ)' : ''}</p>
                                                        <p className="text-[9px] text-yellow-600 dark:text-yellow-400 font-bold">{top3[0].points} pts</p>
                                                        <div className={`w-[84px] h-[96px] rounded-t-xl flex items-center justify-center mt-1 shadow-lg ${isMe1 ? 'bg-orange-100/60 border-2 border-orange-400/50' : 'bg-yellow-100/50 border border-yellow-400/30'}`}>
                                                            <span className="text-3xl font-black text-yellow-500 drop-shadow-lg">1</span>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {/* 3° Puesto (Derecha - Bronce) */}
                                        <div className="flex flex-col items-center">
                                            {top3[2] ? (() => {
                                                const isMe3 = top3[2].id === currentUser?.id;
                                                return (
                                                    <>
                                                        <img
                                                            src={top3[2].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[2].name)}&size=64&background=CD7F32&color=fff`}
                                                            alt={top3[2].name}
                                                            className={`w-[46px] h-[46px] rounded-full object-cover border-[3px] shadow-md ${isMe3 ? 'border-orange-400' : 'border-orange-300'}`}
                                                        />
                                                        <p className={`text-[10px] font-bold mt-1 truncate max-w-[68px] text-center ${isMe3 ? 'text-orange-600 dark:text-orange-400' : 'text-foreground'}`}>{top3[2].name}{isMe3 ? ' (TÚ)' : ''}</p>
                                                        <p className="text-[9px] text-muted-foreground">{top3[2].points} pts</p>
                                                    </>
                                                );
                                            })() : (
                                                <div className="w-[46px] h-[46px] rounded-full border-[3px] border-dashed border-orange-300/50 flex items-center justify-center mb-[calc(0.25rem+1rem)]">
                                                    <span className="text-orange-300 text-sm">?</span>
                                                </div>
                                            )}
                                            <div className={`w-[72px] h-[48px] rounded-t-xl flex items-center justify-center mt-1 shadow-inner ${top3[2] && top3[2].id === currentUser?.id ? 'bg-orange-100/70 border-2 border-orange-400/50' : 'bg-orange-50/50 border border-orange-300/30'}`}>
                                                <span className="text-2xl font-black text-orange-400 drop-shadow">3</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── LISTA SEGMENTADA ── */}
                                <div className="px-3 pb-3">
                                    {listUsers.map((user: any, index: number) => {
                                        const realRank = index + listStartRank;
                                        const isMe = user.id === currentUser?.id;
                                        // Segmento de color: 4-10 gris azulado, 11+ blanco
                                        const segmentBg = realRank <= 10
                                            ? 'bg-slate-50 dark:bg-slate-900/40'
                                            : 'bg-white dark:bg-card';

                                        return (
                                            <div
                                                key={user.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl text-sm mb-1 transition-colors ${isMe
                                                    ? 'bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-500 shadow-[0_0_12px_rgba(251,146,60,0.2)]'
                                                    : `${segmentBg} hover:bg-muted/50`
                                                    }`}
                                            >
                                                <span className={`w-7 text-center font-black tabular-nums text-xs ${isMe ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                                    {realRank}
                                                </span>
                                                <img
                                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=32`}
                                                    alt={user.name}
                                                    className={`w-9 h-9 rounded-full object-cover flex-shrink-0 ${isMe ? 'border-2 border-orange-400 shadow-sm' : ''}`}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-semibold truncate text-sm ${isMe ? 'text-orange-600 dark:text-orange-400' : 'text-foreground'}`}>
                                                        {user.name}{isMe ? ' (Tú)' : ''}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {getLeagueIconText(user.league)} {user.league} {user.division}
                                                    </p>
                                                </div>
                                                <span className={`text-xs font-bold tabular-nums flex-shrink-0 ${isMe ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                                    {user.points} pts
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ── PUESTO FIJADO (fuera del Top 100) ── */}
                                {myRank > 100 && (() => {
                                    const me = leaderboard[myRankIndex];
                                    if (!me) return null;
                                    return (
                                        <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t border-border px-3 pb-3 pt-2">
                                            <div className="text-center py-1">
                                                <span className="text-muted-foreground text-[10px] tracking-widest">· · ·</span>
                                            </div>
                                            <div className="bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-500 rounded-xl p-3 flex items-center gap-3 shadow-[0_-4px_16px_rgba(251,146,60,0.15)]">
                                                <span className="w-7 text-center font-black text-orange-500 tabular-nums text-sm">#{myRank}</span>
                                                <img
                                                    src={me.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(me.name)}&size=32`}
                                                    alt={me.name}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-orange-400 flex-shrink-0 shadow-sm"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-orange-600 dark:text-orange-400 truncate text-sm">{me.name}</p>
                                                    <p className="text-[9px] text-orange-500/80 font-bold uppercase tracking-widest">TU PUESTO ACTUAL</p>
                                                </div>
                                                <span className="text-sm font-black text-orange-500 tabular-nums flex-shrink-0">{me.points} pts</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Day Detail Dialog */}
            <Dialog open={showDayDetailDialog} onOpenChange={setShowDayDetailDialog}>
                <DialogContent className="max-w-[92vw] sm:max-w-md rounded-3xl p-6" aria-describedby={undefined}>
                    {selectedDayData?.status === 'workout' ? (
                        /* ── ESTADO B: DÍA DE ENTRENAMIENTO ── */
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                        <Dumbbell className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-foreground leading-tight">
                                            Rutina del {selectedDay ? format(selectedDay, "EEEE d 'de' MMMM", { locale: es }) : ''}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                                            {selectedDay ? format(selectedDay, "EEEE d 'de' MMMM, yyyy", { locale: es }) : ''}
                                        </p>
                                    </div>
                                </DialogTitle>
                            </DialogHeader>
                            <div className="py-2 max-h-[70vh] overflow-y-auto pr-2">
                                {isLoadingDayDetail ? (
                                    <div className="flex justify-center items-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                                    </div>
                                ) : selectedRoutineData ? (
                                    <div className="space-y-4">
                                        {/* Tarjeta de resumen de rutina */}
                                        <div className="bg-green-100/50 dark:bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4">
                                            <h3 className="font-bold text-emerald-950 dark:text-emerald-50 text-lg">{selectedRoutineData.name}</h3>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {selectedRoutineData.routine_exercises?.length || 0} ejercicios
                                                </span>
                                                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{selectedRoutineData.duration_minutes || 0} min</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lista de ejercicios — nuevo diseño */}
                                        <div className="space-y-3">
                                            {selectedRoutineData.routine_exercises?.sort((a: any, b: any) => a.order_index - b.order_index).map((re: any, i: number) => {
                                                const exerciseId = re.exercises?.id;
                                                const exerciseLogs = selectedExerciseLogs.filter(l => l.exercise_id === exerciseId);

                                                return (
                                                    <div key={i} className="flex rounded-xl border border-border overflow-hidden bg-card">
                                                        {/* Columna izquierda — Número */}
                                                        <div className="w-12 flex items-center justify-center border-r border-border bg-muted/20 flex-shrink-0">
                                                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                                                {i + 1}
                                                            </span>
                                                        </div>

                                                        {/* Columna derecha — Contenido */}
                                                        <div className="flex-1 flex flex-col p-3">
                                                            <p className="text-sm font-bold text-foreground text-center mb-2">
                                                                {re.exercises?.name || 'Ejercicio'}
                                                            </p>

                                                            {exerciseLogs.length > 0 ? (
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                                                    {exerciseLogs.map((log: any, si: number) => (
                                                                        <p key={si} className="text-xs text-muted-foreground">
                                                                            Serie {log.set_index ?? (si + 1)}: {log.reps ?? '?'} Rep - {log.weight ?? '0'}kg
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-muted-foreground text-center">
                                                                    Sin registros de series para este ejercicio
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground mt-4 mb-2">¡Completaste tu rutina este día! 💪</p>
                                )}
                            </div>
                        </>
                    ) : (
                        /* ── ESTADO A: DÍA VACÍO / DESCANSO ── */
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    <span className="capitalize">
                                        {selectedDay ? format(selectedDay, "EEEE d 'de' MMMM, yyyy", { locale: es }) : ''}
                                    </span>
                                </DialogTitle>
                            </DialogHeader>
                            <div className="py-6">
                                <div className="text-center">
                                    <div className="text-5xl mb-3">📅</div>
                                    <p className="text-sm text-muted-foreground">Sin registro para este día</p>
                                </div>
                            </div>

                        </>
                    )}
                </DialogContent>
            </Dialog>
            {/* ── RECORDS DIALOG ── */}
            <Dialog open={showRecordsDialog} onOpenChange={setShowRecordsDialog}>
                <DialogContent className="max-w-[95vw] sm:max-w-md rounded-3xl p-5 max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Dumbbell className="w-5 h-5 text-violet-500" />
                            Mis Récords Personales
                        </DialogTitle>
                    </DialogHeader>

                    {/* ── BAR CHART ── */}
                    <div className="mt-4 mb-6">
                        <div className="flex items-end gap-2" style={{ height: 200 }}>
                            {/* Y-Axis labels */}
                            <div className="flex flex-col justify-between h-full text-[9px] text-muted-foreground tabular-nums pr-1" style={{ minWidth: 28 }}>
                                {[150, 120, 90, 60, 30, 0].map(v => (
                                    <span key={v}>{v}</span>
                                ))}
                            </div>
                            {/* Bars */}
                            <div className="flex-1 flex items-end justify-around gap-1.5 h-full border-l border-b border-border/50 pl-1 pb-0.5">
                                {selectedSlots.map((slot, i) => {
                                    const pr = slot?.pr || 0;
                                    const heightPct = Math.min((pr / 150) * 100, 100);
                                    return (
                                        <div key={i} className="flex flex-col items-center flex-1" style={{ height: '100%', justifyContent: 'flex-end' }}>
                                            <span className="text-[10px] font-bold text-foreground mb-1 tabular-nums">{pr > 0 ? `${pr}` : '-'}</span>
                                            <div
                                                className="w-full max-w-[40px] rounded-t-lg transition-all duration-500"
                                                style={{
                                                    height: pr > 0 ? `${heightPct}%` : '3px',
                                                    background: pr > 0
                                                        ? `linear-gradient(to top, hsl(${260 + i * 15}, 70%, 55%), hsl(${260 + i * 15}, 70%, 70%))`
                                                        : 'hsl(var(--muted))'
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <p className="text-[9px] text-muted-foreground text-center mt-1">Peso máximo (kg)</p>
                    </div>

                    {/* ── SLOTS ── */}
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Ejercicios seleccionados</p>
                        <div className="flex justify-between gap-2">
                            {selectedSlots.map((slot, i) => (
                                <button
                                    key={i}
                                    onClick={() => openExerciseSelector(i)}
                                    className={`flex-1 aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${slot
                                        ? 'border-violet-500/30 bg-violet-500/5'
                                        : 'border-dashed border-muted-foreground/30 bg-muted/30 hover:border-violet-500/30'
                                        }`}
                                >
                                    {slot ? (
                                        <>
                                            <span className="text-[10px] font-bold text-foreground leading-tight text-center px-1 line-clamp-2">
                                                {slot.name.length > 10 ? slot.name.substring(0, 10) + '…' : slot.name}
                                            </span>
                                            <span className="text-[9px] text-violet-500 font-bold">{slot.pr} kg</span>
                                        </>
                                    ) : (
                                        <span className="text-lg text-muted-foreground/50">+</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── EXERCISE SELECTOR DIALOG ── */}
            <Dialog open={isExerciseSelectorOpen} onOpenChange={setIsExerciseSelectorOpen}>
                <DialogContent className="max-w-[92vw] sm:max-w-sm rounded-3xl p-5 max-h-[80vh] flex flex-col" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Elegir ejercicio</DialogTitle>
                    </DialogHeader>
                    <Input
                        placeholder="Buscar ejercicio..."
                        value={exerciseSearchQuery}
                        onChange={(e) => setExerciseSearchQuery(e.target.value)}
                        className="rounded-xl mt-2"
                    />
                    <div className="flex-1 overflow-y-auto mt-3 space-y-1 max-h-[50vh]">
                        {availableExercises
                            .filter(ex => ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()))
                            .map((ex: any) => (
                                <button
                                    key={ex.id}
                                    onClick={() => {
                                        fetchPRForExercise(ex.id, ex.name, activeSlotIndex);
                                        setIsExerciseSelectorOpen(false);
                                    }}
                                    className="w-full text-left p-3 rounded-xl hover:bg-muted/60 transition-colors text-sm font-medium"
                                >
                                    {ex.name}
                                </button>
                            ))}
                        {availableExercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No se encontraron ejercicios</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}