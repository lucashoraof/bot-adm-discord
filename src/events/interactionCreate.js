// ---------------------------------------------------------------------------------------------------------------------
// REQUIREMENTS
// ---------------------------------------------------------------------------------------------------------------------
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../../config.json');
const Discord = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    const client = interaction.client;

    try {
      // Handler para comandos slash
      if (interaction.isCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        try {
          await command.execute(interaction);
        } catch (error) {
          console.error('Erro ao executar comando:', error);
          await interaction.reply({
            content: '❌ Ocorreu um erro ao executar este comando.',
            ephemeral: true
          });
        }
      }

      // Handler para menus de seleção
      if (interaction.isSelectMenu()) {
        // Menu de tickets
        if (interaction.customId === 'ticket') {
          try {
            const tipoTicket = interaction.values[0];

            // Verificar se o usuário já tem um ticket aberto
            const ticketAberto = interaction.guild.channels.cache.find(channel => 
              channel.topic?.includes(`ID: ${interaction.user.id}`)
            );

            if (ticketAberto) {
              return interaction.reply({
                content: `❌ Você já tem um ticket aberto em ${ticketAberto}.`,
                ephemeral: true
              });
            }

// ---------------------------------------------------------------------------------------------------------------------
// CHANNEL NAME BASED ON CATEGORY
// ---------------------------------------------------------------------------------------------------------------------
            let channelName;
            switch (tipoTicket) {
              case 'sup':
                channelName = `📞・suporte-${interaction.user.username}`;
                break;
              case 'quote':
                channelName = `🛒・orçamento-${interaction.user.username}`;
                break;
              default:
                channelName = `👥・ticket-${interaction.user.username}`;
            }
// ---------------------------------------------------------------------------------------------------------------------
// CREATE TICKET CHANNEL
// ---------------------------------------------------------------------------------------------------------------------
            const channel = await interaction.guild.channels.create(channelName, {
              type: 'GUILD_TEXT',
              parent: config.categoria,
              topic: `ID: ${interaction.user.id} | Created: ${Date.now()}`,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
                  deny: ['VIEW_CHANNEL']
                },
                {
                  id: interaction.user.id,
                  allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                },
                {
                  id: config.suporte,
                  allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                }
              ]
            });
// ---------------------------------------------------------------------------------------------------------------------
// TICKET MESSAGE/EMBED BASED ON SELECTED OPTION
// ---------------------------------------------------------------------------------------------------------------------
            let ticketDescription;
            switch (tipoTicket) {
              case 'sup':
                ticketDescription = `Olá ${interaction.user}, boas-vindas à **Code Lab**!\n\n🇧🇷🇵🇹 Nossa equipe irá te atender em breve! Enquanto isso, para tornar nosso **suporte** mais eficiente, sinta-se à vontade para **explicar** suas necessidades ou a **razão** de seu contato.\n\n🇬🇧🇺🇸 Our team will be in touch with you shortly! In the meantime, to make our **support** more efficient, please feel free to **explain** your needs or the **reason** for your contact.`;
                break;
              case 'quote':
                ticketDescription = `Olá ${interaction.user}, boas-vindas à **Code Lab**!\n\n🇧🇷🇵🇹 Nossa equipe irá te atender em breve! Enquanto isso, para tornar nosso **suporte** mais eficiente, sinta-se à vontade para **explicar** suas necessidades ou a **razão** de seu contato.\n\n 🇬🇧🇺🇸 Our team will be in touch with you shortly! In the meantime, to make our **support** more efficient, please feel free to **explain** your needs or the **reason** for your contact.`;
                break;
              default:
                ticketDescription = `Olá ${interaction.user}, boas-vindas à **Code Lab**!\n\n🇧🇷🇵🇹 Nossa equipe irá te atender em breve! Enquanto isso, para tornar nosso **suporte** mais eficiente, sinta-se à vontade para **explicar** suas necessidades ou a **razão** de seu contato.\n\n 🇬🇧🇺🇸 Our team will be in touch with you shortly! In the meantime, to make our **support** more efficient, please feel free to **explain** your needs or the **reason** for your contact.`;
            }
// ---------------------------------------------------------------------------------------------------------------------
// CREATE TICKET EMBED
// ---------------------------------------------------------------------------------------------------------------------
            const ticketEmbed = new Discord.MessageEmbed()
              .setColor(config.color)
              .setAuthor({
                name: `Ticket de ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
              })
              .setDescription(ticketDescription)
              .setThumbnail('https://media.discordapp.net/attachments/926259039803945000/1328499098420121670/Logo_Code_Lab.jpg');
// ---------------------------------------------------------------------------------------------------------------------
// ADMIN BUTTON
// ---------------------------------------------------------------------------------------------------------------------
            const adminRow = new Discord.MessageActionRow()
              .addComponents(
                new Discord.MessageButton()
                  .setCustomId('admin_actions')
                  .setLabel('Admin')
                  .setStyle('SECONDARY')
                  .setEmoji('⚙️')
              );
// ---------------------------------------------------------------------------------------------------------------------
// SEND INITIAL MESSAGE
// ---------------------------------------------------------------------------------------------------------------------
            await channel.send({
              content: `${interaction.user} <@&${config.suporte}>`,
              embeds: [ticketEmbed],
              components: [adminRow]
            });
// ---------------------------------------------------------------------------------------------------------------------
// CONFIRM TO USER
// ---------------------------------------------------------------------------------------------------------------------
            await interaction.reply({
              content: `Seu ticket foi criado com sucesso em ${channel}`,
              ephemeral: true
            });

          } catch (error) {
            console.error('Erro ao criar ticket:', error);
            await interaction.reply({
              content: '❌ Ocorreu um erro ao criar o ticket.',
              ephemeral: true
            });
          }
        }
      }
// ---------------------------------------------------------------------------------------------------------------------
// HANDLER FOR BUTTONS
// ---------------------------------------------------------------------------------------------------------------------
      if (interaction.isButton()) {
        if (interaction.customId === 'admin_actions') {
          if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({
              content: '❌ Apenas a equipe administrativa pode usar este botão.',
              ephemeral: true
            });
          }

          const menuRow = new Discord.MessageActionRow().addComponents(
            new Discord.MessageSelectMenu()
              .setCustomId('admin_menu')
              .setPlaceholder('Selecione uma ação')
              .addOptions([
                {
                  label: 'Fechar Ticket',
                  value: 'close_ticket',
                  emoji: '🔒'
                },
                {
                  label: 'Notificar Usuário',
                  value: 'notify_user',
                  emoji: '📢'
                },
                {
                  label: 'Adicionar Usuário',
                  value: 'add_user',
                  emoji: '➕'
                },
                {
                  label: 'Remover Usuário',
                  value: 'remove_user',
                  emoji: '➖'
                }
              ])
          );

          await interaction.reply({
            components: [menuRow],
            ephemeral: true
          });
        }
      }
// ---------------------------------------------------------------------------------------------------------------------
// HANDLER FOR ADMIN MENU ACTIONS
// ---------------------------------------------------------------------------------------------------------------------
      if (interaction.isSelectMenu() && interaction.customId === 'admin_menu') {
        try {
          const channel = interaction.channel;
          if (!channel.topic) {
            return interaction.reply({
              content: '❌ Não foi possível identificar o usuário do ticket.',
              ephemeral: true
            });
          }
          const userIdMatch = channel.topic.match(/ID: (\d+)/);
const userId = userIdMatch ? userIdMatch[1] : null;
if (!userId) throw new Error('Formato de ID inválido no tópico');

          switch (interaction.values[0]) {
            case 'close_ticket':
              const closeModal = new Discord.Modal()
                .setCustomId('close_ticket_modal')
                .setTitle('Fechar Ticket');

              const motivoInput = new Discord.TextInputComponent()
                .setCustomId('motivo')
                .setLabel('Motivo do Fechamento')
                .setStyle('PARAGRAPH')
                .setRequired(true);

              closeModal.addComponents(new Discord.MessageActionRow().addComponents(motivoInput));
              await interaction.showModal(closeModal);
              break;

            case 'notify_user':
              const user = await interaction.guild.members.fetch(userId);
              const notifyEmbed = new Discord.MessageEmbed()
                .setColor(config.color)
                .setAuthor({ 
                  name: 'Sistema de notificação da Code Lab', 
                  iconURL: interaction.guild.iconURL({ dynamic: true }) 
                })
                .setDescription(`Olá ${user}, tudo certo?\n\nEstou passando aqui para avisar que você tem uma **nova mensagem** no seu ticket, certifique-se de responder o mais rápido possível, em caso de **ausência** da parte do usuário, o ticket será **encerrado.**\n\nClique no botão abaixo para acessar o ticket.`)
                .setImage('https://media.discordapp.net/attachments/926259039803945000/1328499097673535588/Banner_Notificacoes_2.jpg')
                .setTimestamp();

              const buttonRow = new Discord.MessageActionRow()
                .addComponents(
                  new Discord.MessageButton()
                    .setLabel('Acessar Ticket')
                    .setStyle('LINK')
                    .setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
                    .setEmoji('🎫')
                );

              await user.send({ 
                embeds: [notifyEmbed],
                components: [buttonRow]
              });
            
              await interaction.reply({
                content: 'O usuário notificado com sucesso!',
                ephemeral: true
              });
              break;

            case 'add_user':
              const modal = new Discord.Modal()
                .setCustomId('add_user_modal')
                .setTitle('Adicionar Usuário');

              const userInput = new Discord.TextInputComponent()
                .setCustomId('user_id')
                .setLabel('ID do Usuário')
                .setStyle('SHORT')
                .setRequired(true);

              modal.addComponents(new Discord.MessageActionRow().addComponents(userInput));
              await interaction.showModal(modal);
              break;

            case 'remove_user':
              const removeModal = new Discord.Modal()
                .setCustomId('remove_user_modal')
                .setTitle('Remover Usuário');

              const removeUserInput = new Discord.TextInputComponent()
                .setCustomId('user_id')
                .setLabel('ID do Usuário')
                .setStyle('SHORT')
                .setRequired(true);

              removeModal.addComponents(new Discord.MessageActionRow().addComponents(removeUserInput));
              await interaction.showModal(removeModal);
              break;
          }
        } catch (error) {
          console.error('Erro ao executar ação:', error);
          await interaction.reply({
            content: '❌ Ocorreu um erro ao executar esta ação.',
            ephemeral: true
          });
        }
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId === 'add_user_modal') {
          const userId = interaction.fields.getTextInputValue('user_id');
          try {
            const user = await interaction.guild.members.fetch(userId);
            await interaction.channel.permissionOverwrites.create(user, {
              VIEW_CHANNEL: true,
              SEND_MESSAGES: true,
              READ_MESSAGE_HISTORY: true
            });
            
            await interaction.reply({
              content: `✅ Usuário ${user} adicionado ao ticket!`,
              ephemeral: true
            });
          } catch (error) {
            await interaction.reply({
              content: '❌ Usuário não encontrado ou erro ao adicionar.',
              ephemeral: true
            });
          }
        }

        if (interaction.customId === 'remove_user_modal') {
          const userId = interaction.fields.getTextInputValue('user_id');
          try {
            const user = await interaction.guild.members.fetch(userId);
            await interaction.channel.permissionOverwrites.delete(user);
            
            await interaction.reply({
              content: `✅ Usuário ${user} removido do ticket!`,
              ephemeral: true
            });
          } catch (error) {
            await interaction.reply({
              content: '❌ Usuário não encontrado ou erro ao remover.',
              ephemeral: true
            });
          }
        }

        if (interaction.customId === 'close_ticket_modal') {
          const motivo = interaction.fields.getTextInputValue('motivo');
          const channel = interaction.channel;
          const userIdMatch = channel.topic.match(/ID: (\d+)/);
const userId = userIdMatch ? userIdMatch[1] : null;
if (!userId) throw new Error('Formato de ID inválido no tópico');
          
          try {
            try {
              const user = await interaction.guild.members.fetch(userId);
              const closeEmbed = new Discord.MessageEmbed()
                .setColor(config.color)
                .setAuthor({ 
                  name: 'Sistema de notificação da Code Lab', 
                  iconURL: interaction.guild.iconURL({ dynamic: true }) 
                })
                .setDescription(`Olá ${user}, seu ticket foi encerrado.\n\n**Motivo:** ${motivo}`)
                .setImage('https://media.discordapp.net/attachments/926259039803945000/1328499097371410473/Banner_Notificacoes_1.jpg')
                .setTimestamp();

              await user.send({ embeds: [closeEmbed] });
            } catch (dmError) {
              console.log(`Não foi possível enviar DM para o usuário - DMs fechadas`);
            }

            await channel.send({ 
              content: `✅ Ticket fechado por ${interaction.user}\n📝 **Motivo:** ${motivo}` 
            });

            setTimeout(async () => {
              try {
                await channel.delete();
              } catch (deleteError) {
                console.error('Erro ao deletar canal:', deleteError);
              }
            }, 5000);

            await interaction.reply({
              content: '✅ Ticket fechado com sucesso!',
              ephemeral: true
            });

          } catch (error) {
            console.error('Erro ao fechar ticket:', error);
            await interaction.reply({
              content: '❌ Ocorreu um erro ao fechar o ticket.',
              ephemeral: true
            });
          }
        }
      }

    } catch (error) {
      console.error('Erro no interactionCreate:', error);
    }
  }
};
