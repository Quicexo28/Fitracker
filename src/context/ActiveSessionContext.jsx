import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ActiveSessionContext = createContext();

export const useActiveSession = () => useContext(ActiveSessionContext);

export const ActiveSessionProvider = ({ children }) => {
    const [activeSession, setActiveSession] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [workoutData, setWorkoutData] = useState({});
    const [sessionExercises, setSessionExercises] = useState([]);
    const [restTimer, setRestTimer] = useState({ isActive: false, duration: 0, nextExerciseName: '', message: null, key: 0 });
    const [timeRemaining, setTimeRemaining] = useState(0);

    useEffect(() => {
        let timerInterval;
        if (restTimer.isActive && timeRemaining > 0) {
            timerInterval = setInterval(() => {
                setTimeRemaining(prev => prev - 1);
            }, 1000);
        } else if (timeRemaining === 0 && restTimer.isActive) {
            setRestTimer(prev => ({ ...prev, isActive: false }));
        }
        return () => clearInterval(timerInterval);
    }, [restTimer.isActive, timeRemaining]);
    
    useEffect(() => {
        let sessionInterval;
        if (activeSession) {
            sessionInterval = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - activeSession.startTime) / 1000);
                setElapsedTime(elapsed);
            }, 1000);
        } else {
            clearInterval(sessionInterval);
        }
        return () => clearInterval(sessionInterval);
    }, [activeSession]);

    const startSession = useCallback((routineId, routineName) => {
        setActiveSession({ routineId, routineName, startTime: Date.now() });
        setWorkoutData({});
        setSessionExercises([]);
    }, []);

    const endSession = useCallback(() => {
        setActiveSession(null);
    }, []);

    const updateWorkoutData = useCallback((exerciseId, setNumber, field, value) => {
        setWorkoutData(prevData => ({...prevData, [exerciseId]: {...prevData[exerciseId], [setNumber]: {...prevData[exerciseId]?.[setNumber], [field]: value}}}));
    }, []);

    const startRestTimer = useCallback((duration, nextExerciseName, message = null) => {
        if (duration > 0) {
            setRestTimer({ isActive: true, duration, nextExerciseName, message, key: Date.now() });
            setTimeRemaining(duration);
        }
    }, []);

    const closeRestTimer = useCallback(() => {
        setRestTimer(prev => ({ ...prev, isActive: false }));
        setTimeRemaining(0);
    }, []);

    const value = {
        activeSession,
        elapsedTime,
        startSession,
        endSession,
        workoutData,
        updateWorkoutData,
        restTimer,
        timeRemaining,
        startRestTimer,
        closeRestTimer,
        sessionExercises,
        setSessionExercises,
    };

    return (
        <ActiveSessionContext.Provider value={value}>
            {children}
        </ActiveSessionContext.Provider>
    );
};