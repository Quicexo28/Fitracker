import React from 'react';
import Card from './Card.jsx';
import ProgressChart from './ProgressChart.jsx';
import { X, LineChart } from 'lucide-react';

export default function MeasurementDetailModal({ isOpen, onClose, measurement }) {
    if (!isOpen || !measurement) return null;

    const { name, history, unit } = measurement;

    const chartData = {
        labels: history.map(item => item.date),
        datasets: [{
            label: `${name} (${unit})`,
            data: history.map(item => item.value),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.1,
        }]
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <LineChart size={22} /> Progreso de {name}
                    </h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X /></button>
                </div>
                {history.length < 2 ? (
                    <p className="text-center text-gray-500 py-8">Necesitas al menos dos registros para ver un gráfico.</p>
                ) : (
                    <div className="h-96">
                        <ProgressChart chartData={chartData} />
                    </div>
                )}
            </Card>
        </div>
    );
}