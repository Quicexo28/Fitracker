// 1. Importa los datos puros desde el archivo JSON
import exerciseDatabaseRaw from './exercisesData.json';

// 2. Define la función de procesamiento (la misma que ya teníamos)
//    Esta función recorre la estructura importada y asegura la consistencia de los datos.
const processExerciseData = (data) => {
    return data.map(group => ({
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
};

// 3. Procesa los datos importados y exporta el resultado final
export const exerciseDatabase = processExerciseData(exerciseDatabaseRaw);