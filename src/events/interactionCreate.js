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
            const solicitacoesChannel = await interaction.guild.channels.fetch('1332564926233051209');
            const tipoTicket = interaction.values[0];

            // Verificar se o usuário já tem um ticket aberto ou pendente
            const ticketPendente = await solicitacoesChannel.messages.fetch()
              .then(messages => messages.find(m => {
                if (!m.embeds.length) return false;
                const embed = m.embeds[0];
                return embed.fields.find(f => f.name === '👤 Usuário')?.value.includes(interaction.user.id);
              }));

            if (ticketPendente) {
              return interaction.reply({
                content: '❌ Você já tem uma solicitação de ticket pendente. Aguarde ela ser atendida.',
                ephemeral: true
              });
            }

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

            // Embed de solicitação
            const solicitacaoEmbed = new Discord.MessageEmbed()
              .setColor('#FFA500')
              .setAuthor({ 
                name: `Nova Solicitação de ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
              })
              .addFields(
                { name: '👤 Usuário', value: `${interaction.user}`, inline: true },
                { name: '🎟️ Tipo', value: tipoTicket, inline: true },
                { name: '🕒 Horário', value: new Date().toLocaleString('pt-BR'), inline: true }
              );

            // Botão para aceitar
            const actionRow = new Discord.MessageActionRow().addComponents(
              new Discord.MessageButton()
                .setCustomId(`aceitar_ticket_${interaction.user.id}_${tipoTicket}`)
                .setLabel('Atender Ticket')
                .setStyle('SUCCESS')
                .setEmoji('📨')
            );

            // Enviar para o canal de solicitações
            await solicitacoesChannel.send({
              content: 'Nova solicitação de ticket:',
              embeds: [solicitacaoEmbed],
              components: [actionRow]
            });

            // Confirmar ao usuário
            await interaction.reply({
              content: '🎟️ **Solicitação registrada com sucesso!**\n\nSua solicitação está na nossa fila de atendimento e será processada por ordem de chegada.\n\nVocê receberá uma notificação na DM assim que nosso time iniciar seu atendimento.',
              ephemeral: true
            });

          } catch (error) {
            console.error('Erro ao processar ticket:', error);
            await interaction.reply({
              content: '❌ Ocorreu um erro ao processar sua solicitação.',
              ephemeral: true
            });
          }
        }
      }

      // Handler para botões
      if (interaction.isButton()) {
        // Botão de verificação
        if (interaction.customId === 'iniciar_verificacao') {
          try {
            // Verificar se já está verificado
            if (interaction.member.roles.cache.has('746898390817964102')) {
              return interaction.reply({
                content: '❌ Você já está verificado!',
                ephemeral: true
              });
            }

            // Criar o link de autorização com o formato correto
            const clientId = process.env.CLIENT_ID;
            const scopes = ['identify', 'email', 'guilds', 'guilds.join'];
            
            // URL especial que abre o modal nativo do Discord
            const authUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&scope=${scopes.join('%20')}&redirect_uri=${encodeURIComponent(process.env.OAUTH_CALLBACK_URL)}&prompt=consent`;

            // Redirecionar diretamente para a autorização
            await interaction.reply({
              content: 'Você está quase lá...',
              ephemeral: true,
              components: [
                new Discord.MessageActionRow()
                  .addComponents(
                    new Discord.MessageButton()
                      .setLabel('Clique aqui para Confirmar')
                      .setStyle('LINK')
                      .setURL(authUrl)
                  )
              ]
            });

          } catch (error) {
            console.error('Erro ao processar verificação:', error);
            await interaction.reply({
              content: '❌ Ocorreu um erro ao iniciar sua verificação.',
              ephemeral: true
            });
          }
        }

        // Handler para botão Admin
        if (interaction.customId === 'admin_actions') {
          // Verificar se o usuário tem permissão
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
                  description: 'Encerrar este atendimento',
                  value: 'close_ticket',
                  emoji: '🔒'
                },
                {
                  label: 'Notificar Usuário',
                  description: 'Enviar notificação',
                  value: 'notify_user',
                  emoji: '📢'
                },
                {
                  label: 'Adicionar Usuário',
                  description: 'Incluir alguém no ticket',
                  value: 'add_user',
                  emoji: '➕'
                },
                {
                  label: 'Remover Usuário',
                  description: 'Remover alguém do ticket',
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

      // Handler para ações do menu admin
      if (interaction.isSelectMenu() && interaction.customId === 'admin_menu') {
        try {
          const channel = interaction.channel;
          if (!channel.topic) {
            return interaction.reply({
              content: '❌ Não foi possível identificar o usuário do ticket.',
              ephemeral: true
            });
          }
          const userId = channel.topic.split(': ')[1];

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
                .setColor('#2c58f9')
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

      // Handler para modais
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
          const userId = channel.topic.split(': ')[1];
          
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

            try {
              await user.send({ embeds: [closeEmbed] });
            } catch (dmError) {
              console.log(`Não foi possível enviar DM para ${user.tag} - DMs fechadas`);
            }

            // Remover mensagem pendente se existir
            const solicitacoesChannel = await interaction.guild.channels.fetch('1332564926233051209');
            const ticketPendente = await solicitacoesChannel.messages.fetch()
              .then(messages => messages.find(m => {
                if (!m.embeds.length) return false;
                const embed = m.embeds[0];
                return embed.fields.find(f => f.name === '👤 Usuário')?.value.includes(userId);
              }));

            if (ticketPendente) {
              await ticketPendente.delete().catch(() => {});
            }

            // Envia mensagem no canal antes de deletar
            await channel.send({ 
              content: `✅ Ticket fechado por ${interaction.user}\n📝 **Motivo:** ${motivo}` 
            });

            // Pequeno delay antes de deletar o canal
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

      // Handler para botão de aceitar ticket
      if (interaction.isButton() && interaction.customId.startsWith('aceitar_ticket_')) {
        try {
          const [, , userId, tipoTicket] = interaction.customId.split('_');
          
          // Responder imediatamente à interação
          await interaction.deferReply({ ephemeral: true });
          
          const user = await interaction.guild.members.fetch(userId);
          
          // Definir nome do canal baseado no tipo
          let channelName;
          switch (tipoTicket) {
            case 'sup':
              channelName = `👥・suporte-${user.user.username}`;
              break;
            case 'partner':
              channelName = `🤝・parceria-${user.user.username}`;
              break;
            case 'resume':
              channelName = `📃・currículo-${user.user.username}`;
              break;
            case 'quote':
              channelName = `🛒・orçamento-${user.user.username}`;
              break;
            default:
              channelName = `👥・ticket-${user.user.username}`;
          }

          // Criar canal do ticket
          const channel = await interaction.guild.channels.create(channelName, {
            type: 'GUILD_TEXT',
            parent: config.categoria,
            topic: `ID: ${userId}`,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: ['VIEW_CHANNEL']
              },
              {
                id: userId,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
              },
              {
                id: interaction.user.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
              }
            ]
          });

          // Definir mensagem baseada no tipo
          let ticketDescription;
          switch (tipoTicket) {
            case 'sup':
              ticketDescription = `Olá, boas-vindas à **Code Lab**!\n\nNossa equipe irá te atender em breve! Enquanto isso, para tornar nosso **suporte** mais eficiente, sinta-se à vontade para **explicar** suas necessidades ou a **razão** de seu contato.`;
              break;
            case 'partner':
              ticketDescription = `Olá, boas-vindas à **Code Lab**!\n\nNossa equipe irá te atender em breve! Enquanto isso, para tornar nosso **suporte** mais eficiente, sinta-se à vontade para **explicar** suas necessidades ou a **razão** de seu contato.`;
              break;
            case 'resume':
              ticketDescription = `Olá, boas-vindas à **Code Lab**!\n\nNossa equipe irá te atender em breve! Enquanto isso, para tornar nosso **suporte** mais eficiente, sinta-se à vontade para **explicar** suas necessidades ou a **razão** de seu contato.`;
              break;
            case 'quote':
              ticketDescription = `Olá, boas-vindas à **Code Lab**!\n\nNossa equipe irá te atender em breve! Enquanto isso, para tornar nosso **suporte** mais eficiente, sinta-se à vontade para **explicar** suas necessidades ou a **razão** de seu contato.`;
              break;
            default:
              ticketDescription = `Olá, boas-vindas à **Code Lab**!\n\nNossa equipe irá te atender em breve! Enquanto isso, para tornar nosso **suporte** mais eficiente, sinta-se à vontade para **explicar** suas necessidades ou a **razão** de seu contato.`;
          }

          // Criar embed do ticket
          const ticketEmbed = new Discord.MessageEmbed()
            .setColor(config.color)
            .setAuthor({
              name: `Ticket de ${user.user.username}`,
              iconURL: user.user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(ticketDescription)
            .setThumbnail('https://media.discordapp.net/attachments/926259039803945000/1328499098420121670/Logo_Code_Lab.jpg');

          // Botão Admin
          const adminRow = new Discord.MessageActionRow()
            .addComponents(
              new Discord.MessageButton()
                .setCustomId('admin_actions')
                .setLabel('Admin')
                .setStyle('SECONDARY')
                .setEmoji('⚙️')
            );

          // Enviar mensagem inicial
          await channel.send({
            content: `${user} ${interaction.user}`,
            embeds: [ticketEmbed],
            components: [adminRow]
          });

          // Notificar usuário via DM
          try {
            const dmEmbed = new Discord.MessageEmbed()
              .setColor(config.color)
              .setAuthor({ 
                name: 'Sistema de notificação da Code Lab', 
                iconURL: interaction.guild.iconURL({ dynamic: true }) 
              })
              .setDescription(`${user}, você está por ai?\n\nSeu ticket foi aceito pelo nosso time!\n\nClique no botão abaixo para acessar o ticket.`)
              .setImage('https://media.discordapp.net/attachments/926259039803945000/1333577493046886440/Banner_Notificacoes.jpg?ex=67996653&is=679814d3&hm=713fc3b95964f546d1b2eb06b8a5cd948734bb54b8747561046fa63e8becea96&=&format=webp&width=1440&height=308')
              .setTimestamp();

            const dmButton = new Discord.MessageActionRow().addComponents(
              new Discord.MessageButton()
                .setLabel('Ir para o Ticket')
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
                .setStyle('LINK')
                .setEmoji('🎟️')
            );

            await user.send({ 
              embeds: [dmEmbed],
              components: [dmButton] 
            });
          } catch (dmError) {
            console.log(`Não foi possível enviar DM para ${user.tag}`);
            await channel.send(`${user} Não foi possível enviar DM, verifique suas configurações de privacidade!`);
          }

          // Atualizar mensagem original
          await interaction.message.delete().catch(() => {});

          // Atualizar a resposta da interação
          await interaction.editReply({
            content: `✅ Ticket criado em ${channel}`,
            ephemeral: true
          });

        } catch (error) {
          console.error('Erro ao criar ticket:', error);
          if (interaction.deferred) {
            await interaction.editReply({
              content: '❌ Erro ao criar o ticket!',
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: '❌ Erro ao criar o ticket!',
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
