// src/components/ProgressChart.jsx

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registramos los componentes de Chart.js que vamos a usar
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ProgressChart({ chartData }) {
    
    // Opciones de configuración para el gráfico
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Progreso a lo Largo del Tiempo',
                font: {
                    size: 18
                }
            },
        },
        scales: {
            y: {
                beginAtZero: false // No siempre queremos que el eje Y empiece en cero
            }
        }
    };

    return (
        <div className="relative h-96 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-inner">
             <Line options={options} data={chartData} />
        </div>
    );
}