import { useMemo } from 'react';
import useFirestoreCollection from './useFirestoreCollection.jsx';
import { isWithinInterval, differenceInCalendarWeeks } from 'date-fns';

export default function useActiveMesocycle(userId) {
    const { data: mesocycles, loading } = useFirestoreCollection(`users/${userId}/mesocycles`);

    const activePlan = useMemo(() => {
        if (loading || !mesocycles || mesocycles.length === 0) {
            return null;
        }

        const today = new Date();
        const currentPlan = mesocycles.find(plan => 
            plan.startDate && plan.endDate && isWithinInterval(today, {
                start: plan.startDate.toDate(),
                end: plan.endDate.toDate()
            })
        );

        if (!currentPlan) {
            return null;
        }

        const currentWeekNumber = differenceInCalendarWeeks(today, currentPlan.startDate.toDate(), { weekStartsOn: 1 }) + 1;
        const totalWeeks = currentPlan.weeks.length;

        return {
            ...currentPlan,
            currentWeek: currentWeekNumber,
            totalWeeks: totalWeeks,
        };

    }, [mesocycles, loading]);

    return { activePlan, loading };
}