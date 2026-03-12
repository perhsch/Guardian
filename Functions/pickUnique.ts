/**
 * @template T
 * @param original
 * @param values
 */
export function pickUnique<T>(original: T[], values: number): T[] {
    const array = [...original];
    const picked: T[] = [];

    for (let i = 0; i < values; i++) {
        const pick = Math.floor(Math.random() * array.length);
        picked.push(...(array.splice(pick, 1) as T[]));
    }

    return picked;
}
