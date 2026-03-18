import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import axios from 'axios';

export default {
    enabled: true,
    data: new SlashCommandBuilder()
        .setName('wiki')
        .setDescription('Search Wikipedia with enhanced features')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Search term')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('lang')
                .setDescription('Language code (en, es, fr, etc.)')),

    async execute(interaction: ChatInputCommandInteraction) {
        const query = interaction.options.getString('query', true);
        const lang = interaction.options.getString('lang') || 'en';

        await interaction.deferReply();

        try {
            const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
            const searchResponse = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Guardian-Bot/1.7.0 (Discord Bot; +https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID)'
                }
            });
            
            if (!searchResponse.data.query || !searchResponse.data.query.search) {
                return interaction.editReply({
                    content: `❌ No results found for "${query}"`,
                });
            }
            
            const searchResults = searchResponse.data.query.search;

            if (searchResults.length === 0) {
                return interaction.editReply({
                    content: `❌ No results found for "${query}"`,
                });
            }

            const pageId = searchResults[0].pageid;
            const contentUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|info|images&pageids=${pageId}&exintro&explaintext&inprop=url|displaytitle&format=json&origin=*`;
            const contentResponse = await axios.get(contentUrl, {
                headers: {
                    'User-Agent': 'Guardian-Bot/1.7.0 (Discord Bot; +https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID)'
                }
            });
            
            if (!contentResponse.data.query || !contentResponse.data.query.pages || !contentResponse.data.query.pages[pageId]) {
                return interaction.editReply({
                    content: '❌ Failed to fetch article content',
                });
            }
            
            const page = contentResponse.data.query.pages[pageId];
            
            if (!page.extract || page.extract.trim() === '') {
                return interaction.editReply({
                    content: '❌ Article content not available',
                });
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`📚 ${page.displaytitle || page.title}`)
                .setURL(page.fullurl)
                .setDescription(page.extract.length > 800 ? page.extract.substring(0, 800) + '...' : page.extract)
                .addFields(
                    { name: '🔍 Search Results', value: `Found ${searchResults.length} result${searchResults.length > 1 ? 's' : ''}`, inline: true },
                    { name: '🌐 Language', value: lang.toUpperCase(), inline: true },
                    { name: '📊 Article ID', value: pageId.toString(), inline: true }
                )
                .setThumbnail(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(page.title)}.png`)
                .setFooter({ 
                    text: `Wikipedia ${lang.toUpperCase()} • Powered by Guardian Bot`,
                    iconURL: interaction.client.user?.displayAvatarURL()
                })
                .setTimestamp();

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setLabel('📖 Full Article')
                    .setStyle(ButtonStyle.Link)
                    .setURL(page.fullurl),
                new ButtonBuilder()
                    .setLabel('🔄 More Results')
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId(`wiki_more_${pageId}_${lang}`),
                new ButtonBuilder()
                    .setLabel('🌍 Change Language')
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId(`wiki_lang_${pageId}`),
                new ButtonBuilder()
                    .setLabel('📋 Copy URL')
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId(`wiki_copy_${page.fullurl}`)
            );

            const message = await interaction.editReply({ embeds: [embed], components: [row] });

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 300000
            });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.user.id !== interaction.user.id) {
                    await buttonInteraction.reply({
                        content: '❌ These buttons are only for the command user.',
                        ephemeral: true
                    });
                    return;
                }

                const customId = buttonInteraction.customId;

                if (customId.startsWith('wiki_more_')) {
                    const parts = customId.split('_');
                    const currentLang = parts[3];
                    
                    await buttonInteraction.deferUpdate();
                    
                    const moreUrl = `https://${currentLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
                    const moreResponse = await axios.get(moreUrl, {
                        headers: {
                            'User-Agent': 'Guardian-Bot/1.7.0 (Discord Bot; +https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID)'
                        }
                    });
                    
                    const moreResults = moreResponse.data.query.search;
                    const otherResults = moreResults.slice(1, 6); // Show next 5 results
                    
                    if (otherResults.length > 0) {
                        const moreEmbed = new EmbedBuilder()
                            .setColor(0x00ff00)
                            .setTitle(`🔍 More results for "${query}"`)
                            .setDescription(otherResults.map((result: any, index: number) => 
                                `**${index + 1}.** ${result.title}\n> ${result.snippet?.substring(0, 100)}...`
                            ).join('\n\n'))
                            .setFooter({ text: 'Click a number button to view that article' });

                        const numberRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                            ...otherResults.slice(0, 5).map((_: any, index: number) => 
                                new ButtonBuilder()
                                    .setLabel(`${index + 1}`)
                                    .setStyle(ButtonStyle.Primary)
                                    .setCustomId(`wiki_select_${otherResults[index].pageid}_${currentLang}`)
                            )
                        );

                        const moreMessage = await buttonInteraction.followUp({ embeds: [moreEmbed], components: [numberRow], ephemeral: true });

                        const moreCollector = moreMessage.createMessageComponentCollector({
                            componentType: ComponentType.Button,
                            time: 300000
                        });

                        moreCollector.on('collect', async (numberInteraction) => {
                            if (numberInteraction.user.id !== interaction.user.id) {
                                await numberInteraction.reply({
                                    content: '❌ These buttons are only for the command user.',
                                    ephemeral: true
                                });
                                return;
                            }

                            const numberCustomId = numberInteraction.customId;
                            if (numberCustomId.startsWith('wiki_select_')) {
                                const parts = numberCustomId.split('_');
                                const selectedPageId = parts[2];
                                const selectedLang = parts[3];
                                
                                if (!selectedPageId || !selectedLang) return;
                                
                                await numberInteraction.deferUpdate();
                                
                                try {
                                    const selectedUrl = `https://${selectedLang}.wikipedia.org/w/api.php?action=query&prop=extracts|info&pageids=${selectedPageId}&exintro&explaintext&inprop=url&format=json&origin=*`;
                                    const selectedResponse = await axios.get(selectedUrl, {
                                        headers: {
                                            'User-Agent': 'Guardian-Bot/1.7.0 (Discord Bot; +https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID)'
                                        }
                                    });
                                    
                                    const selectedPage = selectedResponse.data.query.pages[selectedPageId];
                                    
                                    const selectedEmbed = new EmbedBuilder()
                                        .setColor(0x00ff00)
                                        .setTitle(`📚 ${selectedPage.title}`)
                                        .setURL(selectedPage.fullurl)
                                        .setDescription(selectedPage.extract?.substring(0, 800) + '...' || 'No content available')
                                        .addFields(
                                            { name: '🌐 Language', value: selectedLang.toUpperCase(), inline: true },
                                            { name: '📊 Article ID', value: selectedPageId.toString(), inline: true }
                                        )
                                        .setThumbnail(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(selectedPage.title)}.png`)
                                        .setFooter({ text: `Wikipedia ${selectedLang.toUpperCase()}` })
                                        .setTimestamp();

                                    await numberInteraction.followUp({ embeds: [selectedEmbed], ephemeral: true });
                                } catch (error) {
                                    await numberInteraction.followUp({
                                        content: '❌ Failed to fetch selected article',
                                        ephemeral: true
                                    });
                                }
                            }
                        });
                    } else {
                        await buttonInteraction.followUp({
                            content: '❌ No more results found.',
                            ephemeral: true
                        });
                    }
                } else if (customId.startsWith('wiki_lang_')) {
                    const parts = customId.split('_');
                    const currentPageId = parts[2];
                    
                    await buttonInteraction.deferUpdate();
                    
                    const langRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setLabel('🇺🇸 English')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`wiki_change_${currentPageId}_en`),
                        new ButtonBuilder()
                            .setLabel('🇪🇸 Spanish')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`wiki_change_${currentPageId}_es`),
                        new ButtonBuilder()
                            .setLabel('🇫🇷 French')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`wiki_change_${currentPageId}_fr`),
                        new ButtonBuilder()
                            .setLabel('🇩🇪 German')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`wiki_change_${currentPageId}_de`)
                    );

                    const langMessage = await buttonInteraction.followUp({
                        content: '🌍 Choose a language:',
                        components: [langRow],
                        ephemeral: true
                    });

                    const langCollector = langMessage.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 300000
                    });

                    langCollector.on('collect', async (langInteraction) => {
                        if (langInteraction.user.id !== interaction.user.id) {
                            await langInteraction.reply({
                                content: '❌ These buttons are only for the command user.',
                                ephemeral: true
                            });
                            return;
                        }

                        const langCustomId = langInteraction.customId;
                        if (langCustomId.startsWith('wiki_change_')) {
                            const parts = langCustomId.split('_');
                            const pageId = parts[2];
                            const newLang = parts[3];
                            
                            if (!pageId || !newLang) return;
                            
                            await langInteraction.deferUpdate();
                            
                            try {
                                const changeUrl = `https://${newLang}.wikipedia.org/w/api.php?action=query&prop=extracts|info&pageids=${pageId}&exintro&explaintext&inprop=url|displaytitle&format=json&origin=*`;
                                const changeResponse = await axios.get(changeUrl, {
                                    headers: {
                                        'User-Agent': 'Guardian-Bot/1.7.0 (Discord Bot; +https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID)'
                                    }
                                });
                                
                                if (changeResponse.data.query.pages[pageId]) {
                                    const changedPage = changeResponse.data.query.pages[pageId];
                                    
                                    const updatedEmbed = new EmbedBuilder()
                                        .setColor(0x0099ff)
                                        .setTitle(`📚 ${changedPage.displaytitle || changedPage.title}`)
                                        .setURL(changedPage.fullurl)
                                        .setDescription(changedPage.extract?.length > 800 ? changedPage.extract.substring(0, 800) + '...' : changedPage.extract || 'No content available')
                                        .addFields(
                                            { name: '🔍 Search Results', value: `Found ${searchResults.length} result${searchResults.length > 1 ? 's' : ''}`, inline: true },
                                            { name: '🌐 Language', value: newLang.toUpperCase(), inline: true },
                                            { name: '📊 Article ID', value: pageId.toString(), inline: true }
                                        )
                                        .setThumbnail(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(changedPage.title)}.png`)
                                        .setFooter({ 
                                            text: `Wikipedia ${newLang.toUpperCase()} • Powered by Guardian Bot`,
                                            iconURL: interaction.client.user?.displayAvatarURL()
                                        })
                                        .setTimestamp();

                                    const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                                        new ButtonBuilder()
                                            .setLabel('📖 Full Article')
                                            .setStyle(ButtonStyle.Link)
                                            .setURL(changedPage.fullurl),
                                        new ButtonBuilder()
                                            .setLabel('🔄 More Results')
                                            .setStyle(ButtonStyle.Secondary)
                                            .setCustomId(`wiki_more_${pageId}_${newLang}`),
                                        new ButtonBuilder()
                                            .setLabel('🌍 Change Language')
                                            .setStyle(ButtonStyle.Secondary)
                                            .setCustomId(`wiki_lang_${pageId}`),
                                        new ButtonBuilder()
                                            .setLabel('📋 Copy URL')
                                            .setStyle(ButtonStyle.Secondary)
                                            .setCustomId(`wiki_copy_${changedPage.fullurl}`)
                                    );

                                    await interaction.editReply({ 
                                        embeds: [updatedEmbed], 
                                        components: [updatedRow]
                                    });

                                    await langInteraction.followUp({
                                        content: `✅ Language changed to ${newLang.toUpperCase()}`,
                                        ephemeral: true
                                    });
                                } else {
                                    await langInteraction.followUp({
                                        content: `❌ Article not available in ${newLang.toUpperCase()}`,
                                        ephemeral: true
                                    });
                                }
                            } catch (error) {
                                await langInteraction.followUp({
                                    content: '❌ Failed to change language',
                                    ephemeral: true
                                });
                            }
                        }
                    });
                } else if (customId.startsWith('wiki_copy_')) {
                    const url = customId.replace('wiki_copy_', '');
                    await buttonInteraction.followUp({
                        content: `📋 **URL copied:** ${url}`,
                        ephemeral: true
                    });
                } else if (customId.startsWith('wiki_select_')) {
                    const parts = customId.split('_');
                    const selectedPageId = parts[2];
                    const selectedLang = parts[3];
                    
                    if (!selectedPageId || !selectedLang) return;
                    
                    await buttonInteraction.deferUpdate();
                    
                    try {
                        const selectedUrl = `https://${selectedLang}.wikipedia.org/w/api.php?action=query&prop=extracts|info&pageids=${selectedPageId}&exintro&explaintext&inprop=url&format=json&origin=*`;
                        const selectedResponse = await axios.get(selectedUrl, {
                            headers: {
                                'User-Agent': 'Guardian-Bot/1.7.0 (Discord Bot; +https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID)'
                            }
                        });
                    
                    const selectedPage = selectedResponse.data.query.pages[selectedPageId];
                    
                    const selectedEmbed = new EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle(`📚 ${selectedPage.title}`)
                        .setURL(selectedPage.fullurl)
                        .setDescription(selectedPage.extract?.substring(0, 800) + '...' || 'No content available')
                        .setFooter({ text: `Wikipedia ${selectedLang.toUpperCase()}` });

                    await buttonInteraction.followUp({ embeds: [selectedEmbed], ephemeral: true });
                } catch (error) {
                    await buttonInteraction.followUp({
                        content: '❌ Failed to fetch selected article',
                        ephemeral: true
                    });
                }
                } else if (customId.startsWith('wiki_change_')) {
                    const parts = customId.split('_');
                    const pageId = parts[2];
                    const newLang = parts[3];
                    
                    if (!pageId || !newLang) return;
                    
                    await buttonInteraction.deferUpdate();
                    
                    const changeUrl = `https://${newLang}.wikipedia.org/w/api.php?action=query&prop=extracts|info&pageids=${pageId}&exintro&explaintext&inprop=url&format=json&origin=*`;
                    const changeResponse = await axios.get(changeUrl, {
                        headers: {
                            'User-Agent': 'Guardian-Bot/1.7.0 (Discord Bot; +https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID)'
                        }
                    });
                    
                    if (changeResponse.data.query.pages[pageId]) {
                        const changedPage = changeResponse.data.query.pages[pageId];
                        
                        const changedEmbed = new EmbedBuilder()
                            .setColor(0x00ff00)
                            .setTitle(` ${changedPage.title}`)
                            .setTitle(`📚 ${changedPage.title}`)
                            .setURL(changedPage.fullurl)
                            .setDescription(changedPage.extract?.substring(0, 800) + '...' || 'No content available')
                            .setFooter({ text: `Wikipedia ${newLang.toUpperCase()} • Language changed` });

                        await buttonInteraction.followUp({ embeds: [changedEmbed], ephemeral: true });
                    } else {
                        await buttonInteraction.followUp({
                            content: `❌ Article not available in ${newLang.toUpperCase()}`,
                            ephemeral: true
                        });
                    }
                }
            });

        } catch (error: any) {
            console.error('Wiki command error:', error);
            return interaction.editReply({
                content: `❌ Failed to fetch Wikipedia article: ${error.message || 'Unknown error'}`,
            });
        }
    }
};
