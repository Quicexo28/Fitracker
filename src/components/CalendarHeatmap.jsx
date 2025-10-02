import React, { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

// --- Funciones de Ayuda (sin cambios) ---
const getColorClass = (count) => {
    if (count === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (count <= 2) return 'bg-green-200 dark:bg-green-800/60 text-gray-800 dark:text-gray-100';
    if (count <= 4) return 'bg-green-400 dark:bg-green-700/70 text-gray-900 dark:text-gray-100 font-semibold';
    return 'bg-green-600 dark:bg-green-500/80 text-white font-bold';
};

const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-${weekNo}`;
};

const FilterButton = ({ label, onClick, isActive }) => (
    <button onClick={onClick} className={`px-3 py-1 text-sm rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>
        {label}
    </button>
);

// --- Componente Principal ---
export default function CalendarHeatmap({ sessions }) {
    const [timeRange, setTimeRange] = useState('year');
    const [viewedMonth, setViewedMonth] = useState(null);

    const { days, weeklyData, monthlyData } = useMemo(() => {
        const today = new Date();
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (timeRange === 'year') {
            startDate.setFullYear(today.getFullYear(), 0, 1);
        } else {
            switch (timeRange) {
                case 'month': startDate.setMonth(today.getMonth() - 1); break;
                case 'quarter': startDate.setMonth(today.getMonth() - 3); break;
                case 'semester': startDate.setMonth(today.getMonth() - 6); break;
            }
        }

        const workoutCounts = new Map();
        sessions.forEach(session => {
            const date = session.completedAt.toDate();
            if (date >= startDate) {
                const dateString = date.toISOString().split('T')[0];
                workoutCounts.set(dateString, (workoutCounts.get(dateString) || 0) + 1);
            }
        });

        const daysArray = [];
        let currentDate = new Date(startDate);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);

        while (currentDate < endDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            daysArray.push({ date: dateString, count: workoutCounts.get(dateString) || 0, weekKey: getWeekNumber(new Date(dateString + 'T00:00:00')), });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const weeksMap = new Map();
        daysArray.forEach(day => {
            if (!weeksMap.has(day.weekKey)) { weeksMap.set(day.weekKey, 0); }
            weeksMap.set(day.weekKey, weeksMap.get(day.weekKey) + day.count);
        });
        const aggregatedWeeks = Array.from(weeksMap.entries()).map(([weekKey, totalCount], index) => ({ weekKey, totalCount, displayWeekNumber: index + 1 }));

        const aggregatedMonths = Array(12).fill(0).map(() => ({ count: 0, name: '' }));
        const yearData = daysArray.filter(d => new Date(d.date + 'T00:00:00').getFullYear() === today.getFullYear());
        yearData.forEach(day => {
            const monthIndex = new Date(day.date + 'T00:00:00').getMonth();
            aggregatedMonths[`year-${monthIndex}`] = (aggregatedMonths[`year-${monthIndex}`] || 0) + day.count;
        });
        aggregatedMonths.forEach((month, index) => {
            month.name = new Date(today.getFullYear(), index).toLocaleString('es-ES', { month: 'short' });
        });


        return { days: daysArray, weeklyData: aggregatedWeeks, monthlyData: aggregatedMonths };
    }, [sessions, timeRange]);

    const renderCalendar = () => {
        if (timeRange === 'month') {
            return (
                <div className="flex flex-wrap gap-2">
                    {days.map(day => (
                        <div key={day.date} title={`${day.count} ent. el ${day.date}`} className={`w-14 h-14 rounded-md flex flex-col items-center justify-center flex-shrink-0 ${getColorClass(day.count)}`}>
                            <span className="text-xs">{new Date(day.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                            <span className="text-xl font-bold">{parseInt(day.date.split('-')[2], 10)}</span>
                        </div>
                    ))}
                </div>
            );
        }

        let weekBoxSize = 'w-12 h-12';
        let weekNumberSize = 'text-2xl';
        if (timeRange === 'quarter') {
            weekBoxSize = 'w-16 h-16';
            weekNumberSize = 'text-3xl';
        } else if (timeRange === 'year') {
            weekBoxSize = 'w-10 h-10'; // <-- AUMENTO DE TAMAÑO AQUÍ
            weekNumberSize = 'text-lg';
        }

        return (
             <div className="flex flex-wrap gap-2">
                {weeklyData.map(week => (
                    <div key={week.weekKey} title={`${week.totalCount} ent. en la semana ${week.displayWeekNumber}`} className={`${weekBoxSize} rounded-lg flex flex-col items-center justify-center ${getColorClass(week.totalCount)}`}>
                        <span className="text-xs opacity-75 -mb-1">Sem.</span>
                        <span className={`font-bold ${weekNumberSize}`}>{week.displayWeekNumber}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <FilterButton label="Mes" onClick={() => setTimeRange('month')} isActive={timeRange === 'month'} />
                <FilterButton label="Trimestre" onClick={() => setTimeRange('quarter')} isActive={timeRange === 'quarter'} />
                <FilterButton label="Semestre" onClick={() => setTimeRange('semester')} isActive={timeRange === 'semester'} />
                <FilterButton label="Año" onClick={() => setTimeRange('year')} isActive={timeRange === 'year'} />
            </div>

            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 min-h-[10rem]">
                {renderCalendar()}
            </div>

            <div className="flex items-center justify-end gap-2 text-xs text-gray-500 mt-2">
                Menos
                <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
                <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
                <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
                <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
                Más
            </div>
        </div>
    );
}