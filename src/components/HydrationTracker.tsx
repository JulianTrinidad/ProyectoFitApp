import { Droplet, RotateCcw } from 'lucide-react';

interface HydrationTrackerProps {
  waterIntake: number;
  onAddWater: (amount: number) => void;
  onReset?: () => void;
  goal?: number;
}

export function HydrationTracker({ waterIntake, onAddWater, onReset, goal = 4000 }: HydrationTrackerProps) {
  // ─── Infinite bottle system ────────────────────────────────────
  const bottleNumber = Math.floor(waterIntake / goal) + 1;
  const currentMax = bottleNumber * goal;
  const bottleProgress = waterIntake - ((bottleNumber - 1) * goal);
  const percentage = Math.min(Math.round((bottleProgress / goal) * 100), 100);
  const totalLiters = (waterIntake / 1000).toFixed(1);
  const currentMaxLiters = (currentMax / 1000).toFixed(1);
  const goalLiters = goal / 1000;

  // Level markers adapt to current bottle size
  const markerCount = 3;
  const markerLabels = Array.from({ length: markerCount }, (_, i) => {
    const litValue = ((i + 1) / (markerCount + 1)) * goalLiters + ((bottleNumber - 1) * goalLiters);
    return `${litValue.toFixed(1)}L`;
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center">
            <Droplet className="w-5 h-5 text-cyan-500" fill="currentColor" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">Hidratación</h3>
            <p className="text-xs text-muted-foreground">
              {bottleNumber > 1
                ? `Botella ${bottleNumber} · Meta: ${goalLiters}L c/u`
                : `Meta: ${goalLiters} litros`
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-foreground">
            {totalLiters} <span className="text-muted-foreground font-normal text-sm">/ {currentMaxLiters}L</span>
          </p>
          <div className="flex items-center justify-end gap-1.5">
            {bottleNumber > 1 && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">
                Botella {bottleNumber}
              </span>
            )}
            <p className="text-xs text-muted-foreground">{percentage}%</p>
          </div>
        </div>
      </div>

      {/* Bottle Visualization */}
      <div className="flex justify-center mb-5">
        <div className="relative">
          {/* Bottle Cap */}
          <div className="mx-auto w-10 h-4 bg-cyan-200 dark:bg-cyan-700 rounded-t-lg border-2 border-b-0 border-cyan-300 dark:border-cyan-600" />
          {/* Bottle Neck */}
          <div className="mx-auto w-14 h-3 bg-cyan-100/60 dark:bg-cyan-900/30 border-x-2 border-cyan-200 dark:border-cyan-700" />
          {/* Bottle Body */}
          <div className="relative w-28 h-52 bg-cyan-50/80 dark:bg-cyan-950/20 rounded-3xl border-2 border-cyan-200 dark:border-cyan-700 overflow-hidden">
            {/* Water Fill */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out rounded-b-[1.25rem]"
              style={{ height: `${percentage}%` }}
            >
              {/* Gradient fill */}
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500 to-cyan-300 dark:from-cyan-600 dark:to-cyan-400" />
              {/* Shine / Reflection */}
              <div className="absolute inset-y-0 left-2 w-3 bg-white/20 dark:bg-white/10 rounded-full blur-sm" />
              {/* Wave top */}
              <div className="absolute top-0 left-0 right-0 h-3">
                <div className="w-full h-full bg-cyan-200/40 dark:bg-cyan-300/30 rounded-[50%] scale-x-150 translate-y-[-40%]" />
              </div>
            </div>

            {/* Level markers */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute left-3 right-3 border-t border-dashed border-cyan-200/60 dark:border-cyan-700/40"
                style={{ bottom: `${(i / 4) * 100}%` }}
              >
                <span className="absolute -right-1 -top-3 text-[9px] text-muted-foreground/60">
                  {markerLabels[i - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => onAddWater(250)}
            className="px-4 py-2 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 text-sm font-semibold hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors"
          >
            + 250ml
          </button>
          <button
            onClick={() => onAddWater(500)}
            className="px-4 py-2 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 text-sm font-semibold hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors"
          >
            + 500ml
          </button>
        </div>
        <button
          onClick={onReset}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          title="Reiniciar"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
