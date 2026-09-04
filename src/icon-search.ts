export type IconSize = 16 | 24 | 36;

/** Описание одной уникальной иконки в манифесте. */
export type IconManifestItem = {
    name: string;
    category: string;
    aliases: string[];
    sizes: IconSize[];
};

/** Структура манифеста, публикуемого пакетом sdds-icons. */
export type IconManifest = {
    schemaVersion: number;
    version: string;
    builtAt: string;
    icons: IconManifestItem[];
};

export type SearchIconsOptions = {
    /** Максимальное количество иконок в результате поиска. */
    limit?: number;
};

const DEFAULT_LIMIT = 20;

/**
 * Приводит поисковую строку и данные иконки к единому виду:
 * разделяет camelCase, убирает специальные символы и лишние пробелы,
 * а также делает сравнение независимым от регистра.
 */
function normalize(value: string): string {
    return value
        .normalize('NFKC')
        .replace(/([a-z\d])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .toLocaleLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

/**
 * Начисляет баллы за точное совпадение токена или совпадение по началу слова.
 * weight позволяет учитывать имя, категорию и aliases с разным приоритетом.
 */
function getTokenScore(queryTokens: string[], value: string, weight: number): number {
    const valueTokens = value.split(' ');

    return queryTokens.reduce((score, queryToken) => {
        if (valueTokens.includes(queryToken)) {
            return score + weight;
        }

        if (valueTokens.some((valueToken) => valueToken.startsWith(queryToken))) {
            return score + weight * 0.75;
        }

        return score;
    }, 0);
}

/** Рассчитывает релевантность одной иконки поисковому запросу. */
function getIconScore(icon: IconManifestItem, query: string, queryTokens: string[]): number {
    const name = normalize(icon.name);
    const category = normalize(icon.category);
    const aliases = icon.aliases.map(normalize);
    let score = 0;

    // Имя иконки — самый важный источник совпадений.
    if (name === query) {
        score += 1000;
    } else if (name.startsWith(query)) {
        score += 750;
    } else if (name.includes(query)) {
        score += 500;
    }

    // Aliases имеют меньший вес, но помогают найти иконку по словам из метаданных.
    for (const alias of aliases) {
        if (alias === query) {
            score += 700;
        } else if (alias.startsWith(query)) {
            score += 450;
        } else if (alias.includes(query)) {
            score += 300;
        }

        score += getTokenScore(queryTokens, alias, 40);
    }

    // Категория полезна для общих запросов, поэтому влияет на результат слабее имени и aliases.
    if (category === query) {
        score += 250;
    } else if (category.includes(query)) {
        score += 150;
    }

    score += getTokenScore(queryTokens, name, 80);
    score += getTokenScore(queryTokens, category, 20);

    return score;
}

/**
 * Ищет иконки в готовом манифесте и возвращает исходные элементы,
 * отсортированные от наиболее релевантного к наименее релевантному.
 */
export function searchIcons(
    manifest: IconManifest,
    searchQuery: string,
    options: SearchIconsOptions = {},
): IconManifestItem[] {
    const query = normalize(searchQuery);

    // Пустой запрос не должен возвращать весь манифест.
    if (!query) {
        return [];
    }

    const queryTokens = query.split(' ');
    const limit = Math.max(0, Math.floor(options.limit ?? DEFAULT_LIMIT));

    return (
        manifest.icons
            // Сохраняем исходный индекс, чтобы порядок был стабильным при одинаковых баллах.
            .map((icon, index) => ({
                icon,
                index,
                score: getIconScore(icon, query, queryTokens),
            }))
            // Иконки без совпадений не попадают в результат.
            .filter(({ score }) => score > 0)
            .sort((first, second) => second.score - first.score || first.index - second.index)
            .slice(0, limit)
            .map(({ icon }) => icon)
    );
}
