import React, { useState, useEffect } from 'react';
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    startOfWeek, 
    endOfWeek,
    isWithinInterval,
    isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function WeekSelectorCalendar({ initialStartDate, initialEndDate, onRangeChange }) {
    const [currentMonth, setCurrentMonth] = useState(initialStartDate ? new Date(initialStartDate) : new Date());
    const [selection, setSelection] = useState({ start: initialStartDate ? new Date(initialStartDate) : null, end: initialEndDate ? new Date(initialEndDate) : null });
    const [hoverDate, setHoverDate] = useState(null);

    useEffect(() => {
        setSelection({
            start: initialStartDate ? new Date(initialStartDate) : null,
            end: initialEndDate ? new Date(initialEndDate) : null
        });
    }, [initialStartDate, initialEndDate]);

    const handleDayClick = (day) => {
        const startOfWeekDay = startOfWeek(day, { weekStartsOn: 1 });
        const endOfWeekDay = endOfWeek(day, { weekStartsOn: 1 });

        if (!selection.start || (selection.start && selection.end)) {
            setSelection({ start: startOfWeekDay, end: null });
        } else {
            let newEnd = endOfWeekDay;
            let newStart = selection.start;
            if (newEnd < newStart) {
                [newStart, newEnd] = [startOfWeekDay, endOfWeek(newStart)];
            }
            setSelection({ start: newStart, end: newEnd });
            onRangeChange(format(newStart, 'yyyy-MM-dd'), format(newEnd, 'yyyy-MM-dd'));
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => (
        <div className="flex justify-between items-center p-2">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronLeft size={20} /></button>
            <div className="font-bold text-lg capitalize">{format(currentMonth, 'MMMM yyyy', { locale: es })}</div>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronRight size={20} /></button>
        </div>
    );

    const renderDays = () => (
        <div className="grid grid-cols-7 text-center text-xs text-gray-500">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => <div key={index} className="py-2">{day}</div>)}
        </div>
    );

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="grid grid-cols-7">
                {days.map((day, index) => {
                    const isInRange = selection.start && selection.end && isWithinInterval(day, selection);
                    const isHoverRange = selection.start && !selection.end && hoverDate && isWithinInterval(day, { start: selection.start, end: hoverDate });
                    const isStart = selection.start && isSameDay(day, selection.start);
                    const isEnd = selection.end && isSameDay(day, selection.end);
                    const isDisabled = format(day, 'M') !== format(currentMonth, 'M');

                    return (
                        <div
                            key={index}
                            className={`
                                p-2 h-12 flex items-center justify-center cursor-pointer text-sm
                                ${isDisabled ? 'text-gray-400 dark:text-gray-600' : ''}
                                ${isInRange || isHoverRange ? 'bg-blue-200 dark:bg-blue-800/50' : ''}
                                ${isStart ? 'bg-blue-600 text-white rounded-l-full' : ''}
                                ${isEnd ? 'bg-blue-600 text-white rounded-r-full' : ''}
                            `}
                            onClick={() => !isDisabled && handleDayClick(day)}
                            onMouseEnter={() => !isDisabled && setHoverDate(day)}
                            onMouseLeave={() => setHoverDate(null)}
                        >
                            <span>{format(day, 'd')}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
}