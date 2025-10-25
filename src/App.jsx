import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext.jsx';
import { Toaster } from 'react-hot-toast';

// Contextos
import { ActiveSessionProvider } from './context/ActiveSessionContext.jsx';
import { PreferencesProvider } from './context/PreferencesContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
// Importa tanto el Provider como el Hook del mismo archivo
import SessionProvider, { useSessions } from './context/SessionContext.jsx'; // <-- CORRECCIÓN AQUÍ

// Vistas
import LoginView from './views/LoginView.jsx';
import HomeView from './views/HomeView.jsx';
import RoutineManagementView from './views/RoutineManagementView.jsx';
import RoutineBuilderView from './views/RoutineBuilderView.jsx';
import CreateSessionView from './views/CreateSessionView.jsx';
import SessionHistoryView from './views/SessionHistoryView.jsx';
import SessionDetailView from './views/SessionDetailView.jsx';
import SettingsView from './views/SettingsView.jsx';
import ExerciseManagementView from './views/ExerciseManagementView.jsx';
import ExerciseAnalyticsView from './views/ExerciseAnalyticsView.jsx';
import BodyMeasurementsView from './views/BodyMeasurementsView.jsx';
import MesocyclePlannerView from './views/MesocyclePlannerView.jsx';
import MesocycleBuilderView from './views/MesocycleBuilderView.jsx';
import AnalyticsView from './views/AnalyticsView.jsx';
import ProfileView from './views/ProfileView.jsx';
import FriendsView from './views/FriendsView.jsx';
import MedalShowcaseView from './views/MedalShowcaseView.jsx';
// Asegúrate de que EditSessionView esté importado si lo usas en las rutas
import EditSessionView from './views/EditSessionView.jsx';


// Componentes
import PrivateRoute from './components/PrivateRoute.jsx';
import Navigation from './components/Navigation.jsx';
import PersistentSessionBar from './components/PersistentSessionBar.jsx';

// Hook de Undo
import { useUndoManager, UndoActionTypes } from './hooks/useUndoManager.jsx';

// Proveedores (sin cambios)
function AppProviders({ children }) {
  const { user } = useAuth();
  return (
    <PreferencesProvider user={user}>
      <SessionProvider user={user}>
        <ActiveSessionProvider>
          {children}
        </ActiveSessionProvider>
      </SessionProvider>
    </PreferencesProvider>
  );
}

// Contenido Principal Modificado
function AppContent() {
  const { user } = useAuth();
  // Obtén los setters necesarios (ajusta según tu estructura)
  const { refetchSessions } = useSessions(); // <-- Ahora useSessions está definido

  // Objeto con los setters que el hook necesita
  const stateSetters = {
      refetchSessions: refetchSessions,
      user: user,
      // Pasa aquí setSessionExercises y setWorkoutData si los obtienes aquí
      // setSessionExercises: ...,
      // setWorkoutData: ...,
  };

  // Instancia el hook de Undo
  const { addUndoAction } = useUndoManager(stateSetters);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full mb-16">
        <Routes>
          {/* Pasa 'addUndoAction' a las vistas */}
          <Route path="/login" element={<LoginView />} />

          <Route element={<PrivateRoute />}>
             <Route path="/" element={<HomeView user={user} />} />
             <Route path="/rutinas" element={<RoutineManagementView user={user} />} />
             <Route path="/rutina/:routineId" element={<RoutineBuilderView user={user} />} />
             {/* Pasa addUndoAction a las vistas correspondientes */}
             <Route path="/session/:routineId" element={<CreateSessionView user={user} addUndoAction={addUndoAction} />} />
             <Route path="/historial" element={<SessionHistoryView user={user} addUndoAction={addUndoAction} />} />
             <Route path="/historial/:sessionId" element={<SessionDetailView user={user} />} />
             {/* Asegúrate de tener la ruta para EditSessionView y pasar addUndoAction */}
             <Route path="/historial/:sessionId/editar" element={<EditSessionView user={user} addUndoAction={addUndoAction} />} />
             <Route path="/ajustes" element={<SettingsView user={user} />} />
             <Route path="/ejercicios" element={<ExerciseManagementView user={user} />} />
             <Route path="/ejercicios/:exerciseId" element={<ExerciseAnalyticsView user={user} />} />
             <Route path="/mediciones" element={<BodyMeasurementsView user={user} />} />
             <Route path="/planificacion" element={<MesocyclePlannerView user={user} />} />
             <Route path="/planificacion/nuevo" element={<MesocycleBuilderView user={user} />} />
             <Route path="/planificacion/editar/:mesocycleId" element={<MesocycleBuilderView user={user} />} />
             <Route path="/analiticas" element={<AnalyticsView user={user} />} />
             <Route path="/perfil" element={<ProfileView user={user} />} />
             <Route path="/amigos" element={<FriendsView user={user} />} />
             <Route path="/perfil/medallas" element={<MedalShowcaseView user={user} />} />
          </Route>

          <Route path="*" element={<h1 className="text-center text-3xl font-bold mt-10">404: Página no encontrada</h1>} />
        </Routes>
      </main>
      {user && <PersistentSessionBar />}
      {user && <Navigation />}
      {/* El componente UndoNotification ya no se renderiza aquí, lo maneja useUndoManager con react-hot-toast */}
    </div>
  );
}

// App Principal (sin cambios)
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProviders>
          <AppContent />
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: 'dark:bg-gray-700 dark:text-white',
            }}
          />
        </AppProviders>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;