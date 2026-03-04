import { useState, useEffect, useMemo, useCallback } from 'react';
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
}

const INITIAL_MEDICAL_FORM: MedicalForm = {
    fullName: '', birthDate: '', dni: '', personalPhone: '',
    emergencyPhone: '', emergencyContactName: '', weight: '', height: '',
    heartDisease: false, chestPainActivity: false, chestPainRest: false,
    dizziness: false, boneIssues: false, asthma: false, surgery: false,
    heartMeds: false, pregnancy: false, diabetes: false,
    currentMeds: '', allergies: '', recentInjuries: '',
};

interface LeaderboardUser {
    id: string;
    name: string;
    avatar: string;
    league: string;
    points: number;
}

export function ProfileTab({ currentUser, updateUser, toggleTheme, theme, logout }: ProfileTabProps) {
    const { toast } = useToast();
    const [showMedicalDialog, setShowMedicalDialog] = useState(false);
    const [showLeaguesDialog, setShowLeaguesDialog] = useState(false);
    const [showRankingDialog, setShowRankingDialog] = useState(false);
    const [rankingFilter, setRankingFilter] = useState<'global' | 'gym'>('global');
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

    const leaderboard = useMemo(() => {
        if (!currentUser) return [];
        const userEntry: LeaderboardUser = {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            league: currentUser.ranked?.league || 'Hierro',
            points: currentUser.ranked?.currentPoints || 0,
        };
        // Solo retornamos al usuario real sin mezclar con mocks
        return [userEntry];
    }, [currentUser]);

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
    const [workoutCalendar, setWorkoutCalendar] = useState<Record<string, { status: 'training' | 'rest'; routine?: any }>>({});

    useEffect(() => {
        if (!currentUser?.id) return;

        const fetchDailyLogs = async () => {
            try {
                const { data, error } = await supabase
                    .from('daily_logs')
                    .select('date, activity_type')
                    .eq('user_id', currentUser.id);

                if (error) throw error;

                if (data) {
                    const calendarMap: Record<string, { status: 'training' | 'rest'; routine?: any }> = {};
                    data.forEach((log: any) => {
                        calendarMap[log.date] = {
                            status: log.activity_type as 'training' | 'rest'
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

    const getDayStatus = useCallback((date: Date): 'training' | 'rest' | null => {
        const key = format(date, 'yyyy-MM-dd');
        return workoutCalendar[key]?.status || null;
    }, [workoutCalendar]);

    const handleDayClick = (date: Date) => {
        setSelectedDay(date);
        setShowDayDetailDialog(true);
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
                                <p className="text-xs text-white/80">{points}/100 pts para subir</p>
                            </div>
                            <img src={avatarSrc} alt="avatar" className="w-16 h-20 object-contain drop-shadow-lg" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-2.5 bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${points}%` }} />
                            </div>
                        </div>
                    </button>
                );
            })()}

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
                        if (status === 'training') dayClass = 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
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
            <Dialog open={showMedicalDialog} onOpenChange={setShowMedicalDialog}>
                <DialogContent className="max-w-[92vw] rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><FileHeart className="text-primary" /> Ficha Médica</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-4">

                        {/* ── SECCIÓN 1: DATOS PERSONALES ── */}
                        <div>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Datos Personales</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5 col-span-2"><Label className="text-xs">Nombre Completo</Label><Input placeholder="Juan Pérez" value={medicalForm.fullName} onChange={(e) => setMedicalForm(prev => ({ ...prev, fullName: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Fecha de Nacimiento</Label><Input type="date" value={medicalForm.birthDate} onChange={(e) => setMedicalForm(prev => ({ ...prev, birthDate: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">DNI</Label><Input placeholder="12345678" value={medicalForm.dni} onChange={(e) => setMedicalForm(prev => ({ ...prev, dni: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Teléfono Personal</Label><Input type="tel" placeholder="+54 11 1234-5678" value={medicalForm.personalPhone} onChange={(e) => setMedicalForm(prev => ({ ...prev, personalPhone: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Contacto de Emergencia</Label><Input placeholder="Nombre del contacto" value={medicalForm.emergencyContactName} onChange={(e) => setMedicalForm(prev => ({ ...prev, emergencyContactName: e.target.value }))} /></div>
                                <div className="space-y-1.5 col-span-2"><Label className="text-xs">Teléfono de Emergencia</Label><Input type="tel" placeholder="+54 11 8765-4321" value={medicalForm.emergencyPhone} onChange={(e) => setMedicalForm(prev => ({ ...prev, emergencyPhone: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Peso (kg)</Label><Input type="number" placeholder="75" value={medicalForm.weight} onChange={(e) => setMedicalForm(prev => ({ ...prev, weight: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-xs">Altura (cm)</Label><Input type="number" placeholder="175" value={medicalForm.height} onChange={(e) => setMedicalForm(prev => ({ ...prev, height: e.target.value }))} /></div>
                            </div>
                        </div>

                        <hr className="border-border/50" />

                        {/* ── SECCIÓN 2: CUESTIONARIO DE SALUD ── */}
                        <div>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Cuestionario de Salud</h3>
                            <div className="space-y-3">
                                {([
                                    { key: 'heartDisease' as const, label: '¿Diagnóstico de enfermedad cardíaca o presión alta?' },
                                    { key: 'chestPainActivity' as const, label: '¿Dolor en pecho con actividad física?' },
                                    { key: 'chestPainRest' as const, label: '¿Dolor en pecho en el último mes en reposo?' },
                                    { key: 'dizziness' as const, label: '¿Pérdida de equilibrio, mareos o de conocimiento?' },
                                    { key: 'boneIssues' as const, label: '¿Problemas óseos, articulares o de columna?' },
                                    { key: 'asthma' as const, label: '¿Asma o dificultad respiratoria?' },
                                    { key: 'surgery' as const, label: '¿Cirugía en los últimos 6 meses?' },
                                    { key: 'heartMeds' as const, label: '¿Medicación para presión o corazón?' },
                                    { key: 'pregnancy' as const, label: '¿Embarazo o parto en los últimos 3-6 meses?' },
                                    { key: 'diabetes' as const, label: '¿Diabetes tipo 1 o 2?' },
                                ] as const).map(({ key, label }) => (
                                    <div key={key} className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-muted/40">
                                        <span className="text-xs text-foreground leading-snug flex-1">{label}</span>
                                        <Switch checked={medicalForm[key]} onCheckedChange={(checked) => setMedicalForm(prev => ({ ...prev, [key]: checked }))} />
                                    </div>
                                ))}
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
                <DialogContent className="max-w-[92vw] rounded-3xl p-6">
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
                <DialogContent className="max-w-[92vw] rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
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
                                                                        {completed ? `${league.ptsPerDivision}/${league.ptsPerDivision}` : `0/${league.ptsPerDivision}`} pts
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

            {/* Day Detail Dialog */}
            <Dialog open={showDayDetailDialog} onOpenChange={setShowDayDetailDialog}>
                <DialogContent className="max-w-[92vw] sm:max-w-md rounded-3xl p-6">
                    {selectedDayData?.status === 'training' && selectedDayData.routine ? (
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
                            <div className="space-y-4 py-2">
                                {/* Tarjeta de resumen de rutina */}
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                    <h3 className="font-bold text-foreground text-lg">{selectedDayData.routine.name}</h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm font-medium text-emerald-600">
                                            {selectedDayData.routine.exercises?.length || 0} ejercicios
                                        </span>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            <span>{selectedDayData.routine.duration} min</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Lista de ejercicios */}
                                <div className="space-y-2">
                                    {selectedDayData.routine.exercises?.map((ex: string, i: number) => (
                                        <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5">
                                            <span className="w-6 h-6 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm text-foreground font-medium">{ex}</span>
                                        </div>
                                    ))}
                                </div>
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
        </div>
    );
}