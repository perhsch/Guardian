const translate = require('@iamtraction/google-translate');

/**
 * Translates text to the target language.
 * @param {String} text - Text to translate
 * @param {String} targetLang - Target language name or ISO 639-1 code (e.g. "Spanish", "es")
 * @returns {Promise<String|null>} Translated text or null on failure
 */
async function translateText(text, targetLang) {
    if (!text || typeof text !== 'string' || !targetLang || targetLang.toLowerCase() === 'en') {
        return text;
    }
    try {
        const result = await translate(text, { from: 'en', to: targetLang });
        return result.text;
    } catch {
        return text;
    }
}

/**
 * Translates response content and embeds to the user's language.
 * @param {Object} response - Response object with content and embeds
 * @param {String} targetLang - Target language code
 * @returns {Promise<Object>} Response with translated content
 */
async function translateResponse(response, targetLang) {
    if (!response || !targetLang || targetLang.toLowerCase() === 'en') return response;

    const translated = {
        content: response.content || null,
        embeds: response.embeds || [],
        ephemeral: response.ephemeral || false,
    };

    if (translated.content) {
        translated.content = await translateText(translated.content, targetLang);
    }

    if (translated.embeds.length > 0) {
        const Discord = require('discord.js');
        for (const embed of translated.embeds) {
            if (!(embed instanceof Discord.EmbedBuilder)) continue;
            const data = embed.data || {};
            if (data.description) {
                embed.setDescription(
                    await translateText(data.description, targetLang)
                );
            }
            if (data.title) {
                embed.setTitle(await translateText(data.title, targetLang));
            }
            if (data.fields?.length) {
                const translatedFields = [];
                for (const field of data.fields) {
                    translatedFields.push({
                        name: await translateText(field.name, targetLang),
                        value: await translateText(field.value, targetLang),
                        inline: field.inline,
                    });
                }
                embed.setFields(translatedFields);
            }
            if (data.footer?.text) {
                embed.setFooter({
                    text: await translateText(data.footer.text, targetLang),
                    iconURL: data.footer.iconURL,
                });
            }
        }
    }

    return translated;
}

module.exports = {
    translateText,
    translateResponse,
};
