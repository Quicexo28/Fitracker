// src/exercises.js (Versión Final y Completa con 4 niveles)

import { sub } from "date-fns";
import { is } from "date-fns/locale";

const exerciseDatabaseRaw = [
    {
        group: 'Pecho',
        items: [
            {
                id: 'press',
                name: 'Press',
                variations: [
                    {
                        id: 'bp', name: 'Plano',
                        subVariations: [
                            { id: 'bp-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'bp-dumbbell', name: 'con Mancuernas', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'bp-machine', name: 'en Máquina', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'bp-hmachine', name: 'en Hammer', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                        ]
                    },
                    {
                        id: 'inc', name: 'Inclinado',
                        subVariations: [
                            { id: 'inc-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'inc-dumbbell', name: 'con Mancuernas', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'inc-machine', name: 'en Máquina', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'inc-hmachine', name: 'en Hammer', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                        ]
                    },
                    {
                        id: 'dec', name: 'Declinado',
                        subVariations: [
                            { id: 'dec-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'dec-dumbbell', name: 'con Mancuernas', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'dec-machine', name: 'en Máquina', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'dec-hmachine', name: 'en Hammer', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                        ]
                    },
                ]
            },
            {
                id: 'flys',
                name: 'Aperturas',
                variations: [
                    {
                        id: 'fly-machine', name: 'en Máquina',
                        subVariations: [
                            { id: 'fly-pec-deck', name: 'Pec Deck',
                                executionTypes: [
                                    { id: 'fly-pec-deck-up', name: 'polea alta', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                                    { id: 'fly-pec-deck-down', name: 'polea baja', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho'},
                                    { id: 'fly-pec-deck-mid', name: 'polea media', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                                ]
                            },
                            { id: 'fly-hmachine', name: 'Hammer',
                                executionTypes: [
                                    { id: 'fly-hmachine-up', name: 'polea alta', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                                    { id: 'fly-hmachine-down', name: 'polea baja', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho'},
                                    { id: 'fly-hmachine-mid', name: 'polea media', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                                ]
                             },
                        ]
                    },
                    {
                        id: 'fly-cable', name: 'en Polea',
                        subVariations: [
                            { id: 'fly-cable-standing', name: 'De pie',
                                executionTypes: [
                                    { id: 'fly-cable-standing-up', name: 'polea alta', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                                    { id: 'fly-cable-standing-down', name: 'polea baja', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho'},
                                    { id: 'fly-cable-standing-mid', name: 'polea media', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                                ]
                            },
                            { id: 'fly-cable-bench', name: 'En banco',
                                executionTypes: [
                                    { id: 'fly-cable-bench-up', name: 'polea alta', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                                    { id: 'fly-cable-bench-down', name: 'polea baja', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho'},
                                    { id: 'fly-cable-bench-mid', name: 'polea media', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                                ]
                             },
                        ]
                    },
                    {
                        id: 'fly-dumbbell', name: 'con Mancuernas',
                        subVariations: [
                            { id: 'fly-dumbbell-flat', name: 'Plano', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'fly-dumbbell-incline', name: 'Inclinado', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'fly-dumbbell-decline', name: 'Declinado', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                        ]
                    },
                ]
            },
            { id: 'cable-crossovers', name: 'cruces de polea',
                variations: [
                    { id: 'cable-cross-up', name: 'polea alta',
                        subVariations: [
                            { id: 'cable-cross-up', name: 'Bilateral', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'cable-cross-up-uni', name: 'Unilateral', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho', isUnilateral: true},
                        ]
                    },
                    { id: 'cable-cross-down', name: 'polea baja',
                        subVariations: [
                            { id: 'cable-cross-down', name: 'Bilateral', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'cable-cross-down-uni', name: 'Unilateral', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho', isUnilateral: true},
                        ]
                    },
                    { id: 'cable-cross-mid', name: 'polea media',
                        subVariations: [
                            { id: 'cable-cross-mid', name: 'Bilateral', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'cable-cross-mid-uni', name: 'Unilateral', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho', isUnilateral: true},
                        ]
                    },
                ]
            },
            { id: 'push-ups', name: 'Flexiones',
                variations: [
                    { id: 'pu-standard', name: 'Estándar', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                    { id: 'pu-elevated', name: 'Elevadas', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                    { id: 'pu-declined', name: 'Declinadas', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                    { id: 'pu-knee', name: 'de Rodillas', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                    { id: 'pu-advance', name: 'Avanzadas',
                        executionTypes: [
                            { id: 'pu-advance-handstand', name: 'Vertical', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'pu-advance-diamond', name: 'Diamante', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'pu-advance-archer', name: 'Arquero', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'pu-advance-clap', name: 'Palmadas', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'pu-advance-one-arm', name: 'Unilateral', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho', isUnilateral: true },
                            { id: 'pu-advance-close-grip', name: 'Agarre Cerrado', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'pu-advance-wide-grip', name: 'Agarre Ancho', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'pu-advance-pike', name: 'en pico', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'pu-advance-spiderman', name: 'Spiderman', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                            { id: 'pu-advance-full-planche', name: 'Planche Completo', imageUrl: 'https://placehold.co/100x100/3b82f6/ffffff?text=Pecho' },
                        ]
                    },
                ]
            },
        ]
    },
    {
        group: 'Bíceps',
        items: [
            {
                id: 'biceps-curl-base',
                name: 'Curl de Bíceps',
                variations: [
                    {
                        id: 'bc-standard', name: 'Estándar',
                        subVariations: [
                            { id: 'bc-barbell', name: 'con Barra (recta o ez)', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                            { id: 'bc-dumbbell', name: 'con Mancuernas',
                                executionTypes: [
                                    { id: 'bc-dumbbell-standed', name: 'De pie', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                                    { id: 'bc-dumbbell-standed-uni', name: 'De pie Unilateral', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps', isUnilateral: true },
                                    { id: 'bc-dumbbell-seted', name: 'Sentado', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                                    { id: 'bc-dumbbell-seted-uni', name: 'Sentado Unilateral', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps', isUnilateral: true },
                                ]
                            },
                            { id: 'bc-cable', name: 'en Polea',
                                executionTypes: [
                                    { id: 'bc-cable-standed', name: 'De pie', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                                    { id: 'bc-cable-standed-uni', name: 'De pie Unilateral', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps', isUnilateral: true },
                                    { id: 'bc-cable-seted', name: 'Sentado', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                                    { id: 'bc-cable-seted-uni', name: 'Sentado Unilateral', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps', isUnilateral: true },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'bc-hammer', name: 'Martillo',
                        subVariations: [
                            { id: 'bc-hammer-dumbbell', name: 'con Mancuernas',
                                executionTypes: [
                                    { id: 'bc-hammer-dumbbell-standed', name: 'De pie', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                                    { id: 'bc-hammer-dumbbell-standed-uni', name: 'De pie Unilateral', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps', isUnilateral: true },
                                    { id: 'bc-hammer-dumbbell-seted', name: 'Sentado', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                                    { id: 'bc-hammer-dumbbell-seted-uni', name: 'Sentado Unilateral', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps', isUnilateral: true },
                                ]
                            },
                            { id: 'bc-hammer-cable', name: 'en Polea',
                                executionTypes: [
                                    { id: 'bc-hammer-cable-standed', name: 'De pie', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                                    { id: 'bc-hammer-cable-standed-uni', name: 'De pie Unilateral', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps', isUnilateral: true },
                                ]
                            },
                        ]
                    },
                    {
                        id: 'bc-preacher', name: 'Predicador',
                        subVariations: [
                            { id: 'bc-preacher-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                            { id: 'bc-preacher-dumbbell', name: 'con Mancuernas', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                            { id: 'bc-preacher-dumbbell-uni', name: 'con Mancuernas Unilateral', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps', isUnilateral: true },
                            { id: 'bc-preacher-machine', name: 'en Máquina', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                            { id: 'bc-preacher-hmachine', name: 'en Hammer', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                            { id: 'bc-preacher-cable', name: 'en Polea', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                        ]
                    },
                        { id: 'bc-bayesian', name: 'Bayesian', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps', isUnilateral: true },
                    {
                        id: 'bc-spider', name: 'Spider',
                        subVariations: [
                            { id: 'bc-spider-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                            { id: 'bc-spider-dumbbell', name: 'con Mancuernas', imageUrl: 'https://placehold.co/100x100/10b981/ffffff?text=Bíceps' },
                        ]
                    },
                ]
            }
        ]
    },
    {
        group: 'Cuádriceps',
        items: [
            {
                id: 'squat',
                name: 'Sentadilla',
                variations: [
                    {
                        id: 'sq-barbell', name: 'con Barra',
                        subVariations: [
                            { id: 'sq-back', name: 'Trasera', imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads' },
                            { id: 'sq-front', name: 'Frontal', imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads' },
                        ]
                    },
                    { id: 'sq-smith', name: 'en Máquina Smith',
                        subVariations: [
                            { id: 'sq-smith-back', name: 'Trasera', imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads' },
                            { id: 'sq-smith-front', name: 'Frontal', imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads' },
                        ]
                    },
                    { id: 'sq-hack', name: 'en Máquina Hack', imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads' },
                ]
            },
            {
                id: 'bulgarian-split-squat',
                name: 'Sentadilla Búlgara',
                variations: [
                    { id: 'bss-dumbbell', name: 'con Mancuernas', isUnilateral: true, imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads' },
                    { id: 'bss-barbell', name: 'con Barra', isUnilateral: true, imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads' },
                    { id: 'bss-smith', name: 'en Smith', isUnilateral: true, imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads' },
                ]
            },
            {
                id: 'leg-press',
                name: 'Prensa de Piernas',
                variations: [
                    { id: 'lp-bilateral', name: 'Bilateral', imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads' },
                    { id: 'lp-unilateral', name: 'Unilateral', imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads', isUnilateral: true },
                ]
            },
            {
                id: 'leg-extension',
                name: 'Extensión de Cuádriceps',
                variations: [
                    { id: 'le-bilateral', name: 'Bilateral', imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads' },
                    { id: 'le-unilateral', name: 'Unilateral', imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads', isUnilateral: true },
                    { id: 'le-hmachine', name: 'en Hammer', imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads' },
                    { id: 'le-hmachine-uni', name: 'en Hammer Unilateral', imageUrl: 'https://placehold.co/100x100/9333ea/ffffff?text=Quads', isUnilateral: true },
                ]
            },
        ]
    },
    {
        group: 'Femorales',
        items: [
            {
                id: 'deadlift',
                name: 'Peso Muerto',
                variations: [
                    { id: 'dl-conventional', name: 'Convencional', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral' },
                    { id: 'dl-sumo', name: 'Sumo', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral' },
                    {
                        id: 'dl-romanian', name: 'Rumano',
                        subVariations: [
                            { id: 'dlr-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral' },
                            { id: 'dlr-dumbbell', name: 'con Mancuernas', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral' },
                            { id: 'dlr-dumbbell-unilateral', name: 'con Mancuerna (Unilateral)', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral', isUnilateral: true },
                        ]
                    },
                    { id: 'dl-stiff-leg-dumbbell', name: 'Piernas Rígidas con Mancuernas', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral' },
                    { id: 'dl-stiff-leg-barbell', name: 'Piernas Rígidas con Barra', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral' },
                ]
            },
            {
                id: 'leg-curl',
                name: 'Curl Femoral',
                variations: [
                    {
                        id: 'lc-lying', name: 'Acostado en Máquina',
                        subVariations: [
                            { id: 'lc-lying-bilateral', name: 'Bilateral', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral' },
                            { id: 'lc-lying-unilateral', name: 'Unilateral', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral', isUnilateral: true },
                        ]
                    },
                    {
                        id: 'lc-seated', name: 'Sentado en Máquina',
                        subVariations: [
                            { id: 'lc-seated-bilateral', name: 'Bilateral', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral' },
                            { id: 'lc-seated-unilateral', name: 'Unilateral', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral', isUnilateral: true },
                        ]
                    },
                ]
            },
            { id: 'good-mornings', name: 'Buenos Días', variations: [{ id: 'gm-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral' }] },
            { id: 'hyperextensions', name: 'Hiperextensiones', variations: [{ id: 'hy-disc', name: 'con Disco', imageUrl: 'https://placehold.co/100x100/a16207/ffffff?text=Femoral' }] }
        ]
    },
    {
        group: 'Glúteos',
        items: [
            {
                id: 'hip-thrust', name: 'Hip Thrust',
                variations: [
                    { id: 'ht-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/ec4899/ffffff?text=Glúteo' },
                    { id: 'ht-machine', name: 'en Máquina', imageUrl: 'https://placehold.co/100x100/ec4899/ffffff?text=Glúteo' },
                    { id: 'ht-hmachine', name: 'en Hammer',
                        subVariations: [
                            { id: 'ht-hmachine-arm', name: 'de brazo', imageUrl: 'https://placehold.co/100x100/ec4899/ffffff?text=Glúteo' },
                            { id: 'ht-hmachine-belt', name: 'de correa', imageUrl: 'https://placehold.co/100x100/ec4899/ffffff?text=Glúteo' },
                        ]
                     },
                    { id: 'ht-smith', name: 'en Smith', imageUrl: 'https://placehold.co/100x100/ec4899/ffffff?text=Glúteo' },
                ]
            },
            {
                id: 'glute-bridge', name: 'Puente de Glúteos',
                variations: [
                    { id: 'gb-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/ec4899/ffffff?text=Glúteo' },
                    { id: 'gb-uni', name: 'a una Pierna', imageUrl: 'https://placehold.co/100x100/ec4899/ffffff?text=Glúteo', isUnilateral: true },
                ]
            },
            {
                id: 'glute-kickback', name: 'Patada de Glúteo',
                variations: [
                    { id: 'gk-cable', name: 'en Polea',
                        subVariations: [
                            { id: 'gk-cable-low', name: 'polea baja', imageUrl: 'https://placehold.co/100x100/ec4899/ffffff?text=Glúteo', isUnilateral: true },
                            { id: 'gk-cable-mid', name: 'polea media', imageUrl: 'https://placehold.co/100x100/ec4899/ffffff?text=Glúteo', isUnilateral: true },
                        ]
                    },
                    
                    { id: 'gk-machine', name: 'en Máquina', imageUrl: 'https://placehold.co/100x100/ec4899/ffffff?text=Glúteo', isUnilateral: true },
                ]
            },
        ]
    },
    {
        group: 'Espalda',
        items: [
             {
                id: 'pullups', name: 'Dominadas',
                variations: [
                    { id: 'pu-pronated', name: 'Agarre Prono (Pull-up)', imageUrl: 'https://placehold.co/100x100/16a34a/ffffff?text=Dorsal' },
                    { id: 'pu-supinated', name: 'Agarre Supino (Chin-up)', imageUrl: 'https://placehold.co/100x100/16a34a/ffffff?text=Dorsal' },
                    { id: 'pu-neutral', name: 'Agarre Neutro', imageUrl: 'https://placehold.co/100x100/16a34a/ffffff?text=Dorsal' },
                ]
            },
            {
                id: 'lat-pulldown', name: 'Jalón al Pecho',
                variations: [
                    { id: 'lpd-cable', name: 'en Polea',
                        subVariations: [
                            { id: 'lpd-cable-pronated', name: 'Agarre Prono', imageUrl: 'https://placehold.co/100x100/16a34a/ffffff?text=Dorsal' },
                            { id: 'lpd-cable-supinated', name: 'Agarre Supino', imageUrl: 'https://placehold.co/100x100/16a34a/ffffff?text=Dorsal' },
                            { id: 'lpd-cable-neutral', name: 'Agarre Neutro', imageUrl: 'https://placehold.co/100x100/16a34a/ffffff?text=Dorsal' },
                            { id: 'lpd-cable-neutral-uni', name: 'Agarre Neutro unilateral', imageUrl: 'https://placehold.co/100x100/16a34a/ffffff?text=Dorsal', isUnilateral: true },
                        ]
                     },
                    { id: 'lpd-machine', name: 'en Máquina',
                        subVariations: [
                            { id: 'lpd-machine-pronated', name: 'Agarre Prono', imageUrl: 'https://placehold.co/100x100/16a34a/ffffff?text=Dorsal' },
                            { id: 'lpd-machine-supinated', name: 'Agarre Supino', imageUrl: 'https://placehold.co/100x100/16a34a/ffffff?text=Dorsal' },
                            { id: 'lpd-machine-neutral', name: 'Agarre Neutro', imageUrl: 'https://placehold.co/100x100/16a34a/ffffff?text=Dorsal' },
                            { id: 'lpd-machine-neutral-uni', name: 'Agarre Neutro unilateral', imageUrl: 'https://placehold.co/100x100/16a34a/ffffff?text=Dorsal', isUnilateral: true },
                        ]
                     },
                ]
            },
            {
                id: 'face-pull', name: 'Face Pull',
                variations: [
                    { id: 'fp-cable', name: 'en Polea con Cuerda', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                ]
            },
            {
                id: 't-bar-row', name: 'Remo en Barra T',
                variations: [
                    { id: 'tbar-chest-supported', name: 'con Apoyo al Pecho', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                    { id: 'tbar-unsupported', name: 'sin Apoyo', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                ]
            },
            {
                id: 'row', name: 'Remo',
                variations: [
                    { id: 'row-barbell', name: 'con Barra',
                        subVariations: [
                            { id: 'row-barbell-toChest', name: 'al Pecho',
                                executionTypes: [
                                    { id: 'row-barbell-toChest-pronated', name: 'Agarre Prono', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                                    { id: 'row-barbell-toChest-supinated', name: 'Agarre Supino', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                                ]
                            },
                            { id: 'row-barbell-toHip', name: 'a la cadera',
                                executionTypes: [
                                    { id: 'row-barbell-toHip-pronated', name: 'Agarre Prono', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                                    { id: 'row-barbell-toHip-supinated', name: 'Agarre Supino', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                                ]
                            }
                        ]
                    },
                    { id: 'row-dumbbell', name: 'con Mancuernas',
                        subVariations: [
                            { id: 'row-dumbbell-pronated', name: 'Agarre Prono', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                            { id: 'row-dumbbell-supinated', name: 'Agarre Supino', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                            { id: 'row-dumbbell-supinated-uni', name: 'Agarre Supino unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                            { id: 'row-dumbbell-neutral', name: 'Agarre Neutro', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                            { id: 'row-dumbbell-neutral-uni', name: 'Agarre Neutro unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                        ]
                    },
                    { id: 'row-cable', name: 'en Polea',
                        subVariations: [
                            { id: 'row-cable-pronated', name: 'Agarre Prono', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                            { id: 'row-cable-supinated', name: 'Agarre Supino', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                            { id: 'row-cable-supinated-uni', name: 'Agarre Supino unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                            { id: 'row-cable-neutral', name: 'Agarre Neutro', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                            { id: 'row-cable-neutral-uni', name: 'Agarre Neutro unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                        ]
                    },
                    { id: 'row-machine', name: 'en Máquina',
                        subVariations: [
                            { id: 'row-cable-machine', name: 'maquina de poleas',
                                subVariations: [
                                    { id: 'row-cable-machine-pronated', name: 'Agarre Prono', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                                    { id: 'row-cable-machine-pronated-uni', name: 'Agarre Prono unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                                    { id: 'row-cable-machine-supinated', name: 'Agarre Supino', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                                    { id: 'row-cable-machine-supinated-uni', name: 'Agarre Supino unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                                    { id: 'row-cable-machine-neutral', name: 'Agarre Neutro', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                                    { id: 'row-cable-machine-neutral-uni', name: 'Agarre Neutro unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                                ]
                            },
                            { id: 'row-hmachine', name: 'Hammer',
                                subVariations: [
                                    { id: 'row-hmachine-pronated', name: 'Agarre Prono', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                                    { id: 'row-hmachine-pronated-uni', name: 'Agarre Prono unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                                    { id: 'row-hmachine-supinated', name: 'Agarre Supino', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                                    { id: 'row-hmachine-supinated-uni', name: 'Agarre Supino unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                                    { id: 'row-hmachine-neutral', name: 'Agarre Neutro', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                                    { id: 'row-hmachine-neutral-uni', name: 'Agarre Neutro unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                                ]
                            },
                        ]
                    },
                ]
            },
        ]
    },
    {
        group: 'Hombros',
        items: [
            {
                id: 'shoulder-press', name: 'Press de Hombros (press militar)',
                variations: [
                    { id: 'sp-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'sp-dumbbell', name: 'con Mancuernas', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'sp-smith', name: 'en Smith', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'sp-machine', name: 'en Máquina', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'sp-hmachine', name: 'en Hammer', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                ]
            },
            {
                id: 'lateral-raises', name: 'Elevaciones Laterales',
                variations: [
                    { id: 'lr-dumbbell', name: 'con Mancuernas', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'lr-dumbbell-uni', name: 'con Mancuernas unilaterales', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro', isUnilateral: true },
                    { id: 'lr-cable', name: 'en Polea', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro', isUnilateral: true },
                    { id: 'lr-cable-bi', name: 'en Polea bilateral', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'lr-machine', name: 'en Máquina', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'lr-machine-uni', name: 'en Máquina unilateral', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro', isUnilateral: true },
                    { id: 'lr-hmachine', name: 'en Hammer', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'lr-hmachine-uni', name: 'en Hammer unilateral', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro', isUnilateral: true },
                ]
            },
            {
                id: 'front-raises', name: 'Elevaciones Frontales',
                variations: [
                    { id: 'fr-dumbbell', name: 'con Mancuernas', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'fr-dumbbell-uni', name: 'con Mancuernas unilaterales', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro', isUnilateral: true },
                    { id: 'fr-cable', name: 'con Polea', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'fr-cable-uni', name: 'con Polea unilateral', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro', isUnilateral: true },
                    
                ]
            },
            {
                id: 'rear-delt-flys', name: 'Vuelos Posteriores',
                variations: [
                    { id: 'rdf-dumbbell', name: 'con Mancuernas', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'rdf-machine', name: 'en Máquina (Pec Deck Inverso)', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'rdf-cable', name: 'en Polea', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro' },
                    { id: 'rdf-cable-uni', name: 'en Polea unilateral', imageUrl: 'https://placehold.co/100x100/db2777/ffffff?text=Hombro', isUnilateral: true },
                ]
            },
        ]
    },
    {
        group: 'Triceps',
        items: [
            {
                id: 'tricep-dips', name: 'Fondos en Paralelas',
                variations: [
                    { id: 'td-close-grip', name: 'agarre cerrado', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                ]
            },
            {
                id: 'skullcrushers', name: 'Rompecráneos',
                variations: [
                    { id: 'sc-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                    { id: 'sc-dumbbell', name: 'con Mancuernas', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                ]
            },
            {
                id: 'tricep-push', name: 'Extensión de Tríceps en Polea',
                variations: [
                    { id: 'tp-uperhead', name: 'encima de la Cabeza',
                        subVariations: [
                            { id: 'tp-uperhead', name: 'estandar', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta'},
                            { id: 'tp-uperhead-uni', name: 'unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                        ]
                    },
                    { id: 'tp-down', name: 'hacia Abajo',
                        subVariations: [
                            { id: 'tp-down', name: 'estandar', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta'},
                            { id: 'tp-down-uni', name: 'unilateral', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                        ]
                    },
                ]
            },
            { id: 'tricep-kickback', name: 'Patada de Tríceps',
                variations: [
                    { id: 'tk-dumbbell', name: 'con Mancuerna', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                    { id: 'tk-cable', name: 'en Polea',
                        subVariations: [
                            { id: 'tk-cable-standed', name: 'erguido', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                            { id: 'tk-cable-inclined', name: 'inclinado', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta', isUnilateral: true },
                        ]
                    },
                ]
            },
            { id: 'press', name: 'Press de Tríceps',
                variations: [
                    { id: 'tp-close-grip', name: 'banca cerrada', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                    { id: 'tp-french', name: 'francés', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                    { id: 'tp-jm', name: 'jm press',
                        subVariations: [
                            { id: 'tp-jm-barbell', name: 'con barra', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                            { id: 'tp-jm-smith', name: 'en Smith', imageUrl: 'https://placehold.co/100x100/15803d/ffffff?text=Esp.Alta' },
                        ]
                    },
                ]
            },
        ]
    },
    {
        group: 'Abdominales',
        items: [
            { id: 'crunches', name: 'Encogimientos (Crunches)', variations: [{ id: 'crunch-machine', name: 'en Máquina', imageUrl: '...' }] },
            { id: 'leg-raises', name: 'Elevaciones de Piernas', variations: [{ id: 'lr-hanging', name: 'Colgado en Barra', imageUrl: '...' }] },
            { id: 'plank', name: 'Plancha', variations: [{ id: 'plank-iso', name: 'Isométrica', imageUrl: '...' }] },
            { id: 'pallof-press', name: 'Press Pallof', variations: [{ id: 'pp-cable', name: 'con Polea', imageUrl: '...', isUnilateral: true }] },
        ]
    },
    {
        group: 'Pantorrillas',
        items: [
             {
                id: 'calf-raises', name: 'Elevación de Talones',
                variations: [
                    { id: 'cr-extended-knee', name: 'con Rodilla Extendida',
                        subVariations: [
                            { id: 'cr-extended-knee-press', name: 'en Prensa', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla' },
                            { id: 'cr-extended-knee-machine', name: 'Sentado', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla' },
                            { id: 'cr-extended-knee-smith', name: 'en Smith', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla' },
                            { id: 'cr-extended-knee-hack', name: 'en Hack', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla' },
                            { id: 'cr-extended-knee-bodyweight', name: 'con Peso Corporal', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla' },
                            { id: 'cr-extended-knee-barbell', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla' },
                            { id: 'cr-extended-knee-press-uni', name: 'en Prensa', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla', isUnilateral: true },
                            { id: 'cr-extended-knee-machine-uni', name: 'Sentado', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla', isUnilateral: true },
                            { id: 'cr-extended-knee-smith-uni', name: 'en Smith', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla', isUnilateral: true },
                            { id: 'cr-extended-knee-hack-uni', name: 'en Hack', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla', isUnilateral: true },
                            { id: 'cr-extended-knee-bodyweight-uni', name: 'con Peso Corporal', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla', isUnilateral: true },
                            { id: 'cr-extended-knee-barbell-uni', name: 'con Barra', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla', isUnilateral: true },
                        ]
                     },
                    { id: 'cr-bent-knee', name: 'con Rodilla Flexionada (Sentado)', imageUrl: 'https://placehold.co/100x100/ca8a04/ffffff?text=Pantorrilla', isUnilateral: true },
                ]
            },
        ]
    },
    {
        group: 'Abductores',
        items: [
            { id: 'hip-abduction', name: 'Abducción de Cadera',
                variations: [
                    { id: 'ha-machine', name: 'en Máquina', imageUrl: 'https://placehold.co/100x100/f43f5e/ffffff?text=Abductor' },
                    { id: 'ha-cable', name: 'en Polea', imageUrl: 'https://placehold.co/100x100/f43f5e/ffffff?text=Abductor', isUnilateral: true },
                ]
            }
        ]
    },
    {
        group: 'Aductores',
        items: [
            { id: 'hip-adduction', name: 'Aducción de Cadera',
                variations: [
                    { id: 'had-machine', name: 'en Máquina', imageUrl: 'https://placehold.co/100x100/f43f5e/ffffff?text=Aductor' },
                    { id: 'had-cable', name: 'en Polea', imageUrl: 'https://placehold.co/100x100/f43f5e/ffffff?text=Aductor', isUnilateral: true },
                ]
            }
        ]
    },
];


// --- FUNCIÓN DE PROCESAMIENTO FINAL --------------------------------------------------
// Esta función recorre la base de datos y se asegura de que la propiedad `isUnilateral`
// esté definida (como `false` si no se especifica) en el nodo final de cada ejercicio.
export const exerciseDatabase = exerciseDatabaseRaw.map(group => ({
    ...group,
    items: group.items.map(item => {
        if (!item.variations) return { ...item, isUnilateral: !!item.isUnilateral };
        return {
            ...item,
            variations: item.variations.map(variation => {
                if (!variation.subVariations) return { ...variation, isUnilateral: !!variation.isUnilateral };
                return {
                    ...variation,
                    subVariations: variation.subVariations.map(subVariation => {
                        if (!subVariation.executionTypes) return { ...subVariation, isUnilateral: !!subVariation.isUnilateral };
                        return {
                            ...subVariation,
                            executionTypes: subVariation.executionTypes.map(executionType => ({
                                ...executionType,
                                isUnilateral: !!executionType.isUnilateral,
                            })),
                        };
                    }),
                };
            }),
        };
    }),
}));