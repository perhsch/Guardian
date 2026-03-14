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
    const commands = [...new Set(text.match(cmdPattern) || [])];
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
export async function translateText(
    text: string | null | undefined,
    targetLang: string | null | undefined
): Promise<string> {
    // Fast path: early returns for common cases
    if (!text || typeof text !== 'string' || !targetLang || targetLang.toLowerCase() === 'en') {
        return text || '';
    }

    // Skip translation for very short or empty content
    const trimmedText = text.trim();
    if (trimmedText.length === 0 || trimmedText.length < 2) {
        return text;
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
export async function translateResponse(
    response: any,
    targetLang: string | null | undefined
): Promise<any> {
    // Fast path: early return for invalid responses
    if (!response || !targetLang || targetLang.toLowerCase() === 'en') return response;

    try {
        const translated = {
            ...response,
            content: response.content || null,
            embeds: Array.isArray(response.embeds) ? [...response.embeds] : [],
        };

        // Translate content if present
        if (translated.content) {
            translated.content = await translateText(translated.content, targetLang);
        }

        // Translate embeds in parallel
        if (translated.embeds.length > 0) {
            const embedPromises = translated.embeds.map(async (embed: any) => {
                if (!(embed instanceof EmbedBuilder)) return embed;
                const data: any = embed.data || {};

                // Batch translate all embed properties
                const [descTrans, titleTrans, authorTrans, footerTrans] = await Promise.all([
                    data.description
                        ? translateText(data.description, targetLang)
                        : Promise.resolve(null),
                    data.title ? translateText(data.title, targetLang) : Promise.resolve(null),
                    data.author?.name
                        ? translateText(data.author.name, targetLang)
                        : Promise.resolve(null),
                    data.footer?.text
                        ? translateText(data.footer.text, targetLang)
                        : Promise.resolve(null),
                ]);

                // Apply translations
                if (descTrans) embed.setDescription(descTrans);
                if (titleTrans) embed.setTitle(titleTrans);
                if (authorTrans) {
                    embed.setAuthor({
                        name: authorTrans,
                        iconURL: data.author.iconURL,
                        url: data.author.url,
                    });
                }
                if (footerTrans) {
                    embed.setFooter({
                        text: footerTrans,
                        iconURL: data.footer.iconURL,
                    });
                }

                // Translate fields in parallel if they exist
                if (data.fields?.length) {
                    const fieldPromises = data.fields.map(async (field: any) => {
                        const [nameTrans, valueTrans] = await Promise.all([
                            translateText(field.name, targetLang),
                            translateText(field.value, targetLang),
                        ]);
                        return {
                            name: nameTrans,
                            value: valueTrans,
                            inline: field.inline,
                        };
                    });
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
