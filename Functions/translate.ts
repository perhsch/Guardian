import { translationService } from './translationService.ts';
import { EmbedBuilder } from 'discord.js';

interface MaskResult {
    masked: string;
    commands: string[];
}

/**
 * Masks slash command names (e.g. /help, /language) so they are not translated.
 */
function maskSlashCommands(text: string): MaskResult {
    const cmdPattern = /\/[\w-]+/g;
    const commands = [...new Set((text.match(cmdPattern) || []))];
    let masked = text;
    commands.forEach((cmd, i) => {
        const escaped = cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        masked = masked.replace(new RegExp(escaped, 'g'), `\u2063SLASH${i}\u2063`);
    });
    return { masked, commands };
}

/**
 * Restores slash command names after translation.
 */
function unmaskSlashCommands(text: string, commands: string[]): string {
    let result = text;
    commands.forEach((cmd, i) => {
        const fullPlaceholder = new RegExp(`\u2063SLASH${i}\u2063`, 'g');
        const fallbackPlaceholder = new RegExp(`SLASH${i}`, 'g');
        result = result.replace(fullPlaceholder, cmd).replace(fallbackPlaceholder, cmd);
    });
    return result;
}

/**
 * Translates text to the target language.
 */
export async function translateText(text: string | null | undefined, targetLang: string | null | undefined): Promise<string> {
    if (!text || typeof text !== 'string' || !targetLang || targetLang.toLowerCase() === 'en') {
        return text || '';
    }
    try {
        const { masked, commands } = maskSlashCommands(text);
        const result = await translationService.translate(masked, targetLang);
        return unmaskSlashCommands(result, commands);
    } catch {
        return text;
    }
}

/**
 * Translates response content and embeds to the user's language.
 */
export async function translateResponse(response: any, targetLang: string | null | undefined): Promise<any> {
    if (!response || !targetLang || targetLang.toLowerCase() === 'en') return response;

    try {
        const translated = {
            ...response,
            content: response.content || null,
            embeds: Array.isArray(response.embeds) ? [...response.embeds] : [],
        };

        if (translated.content) {
            translated.content = await translateText(translated.content, targetLang);
        }

        if (translated.embeds.length > 0) {
            const embedPromises = translated.embeds.map(async (embed: any) => {
                if (!(embed instanceof EmbedBuilder)) return embed;
                const data: any = embed.data || {};

                const translations = await Promise.all([
                    data.description ? translateText(data.description, targetLang) : Promise.resolve(null),
                    data.title ? translateText(data.title, targetLang) : Promise.resolve(null),
                    data.author?.name ? translateText(data.author.name, targetLang) : Promise.resolve(null),
                    data.footer?.text ? translateText(data.footer.text, targetLang) : Promise.resolve(null)
                ]);

                if (translations[0]) embed.setDescription(translations[0]);
                if (translations[1]) embed.setTitle(translations[1]);
                if (translations[2]) {
                    embed.setAuthor({
                        name: translations[2],
                        iconURL: data.author.iconURL,
                        url: data.author.url,
                    });
                }
                if (translations[3]) {
                    embed.setFooter({
                        text: translations[3],
                        iconURL: data.footer.iconURL,
                    });
                }

                if (data.fields?.length) {
                    const fieldPromises = data.fields.map(async (field: any) => ({
                        name: await translateText(field.name, targetLang),
                        value: await translateText(field.value, targetLang),
                        inline: field.inline,
                    }));
                    embed.setFields(await Promise.all(fieldPromises));
                }

                return embed;
            });

            translated.embeds = await Promise.all(embedPromises);
        }

        return translated;
    } catch {
        return response;
    }
}
