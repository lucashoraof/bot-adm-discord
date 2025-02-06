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
        // Menu de gestão de clientes
        if (interaction.customId === 'gestao_menu') {
          try {
            switch (interaction.values[0]) {
              case 'cadastrar': {
                const modal = new Discord.Modal()
                  .setCustomId('cadastro_cliente')
                  .setTitle('Cadastrar Novo Cliente');

                const userInput = new Discord.TextInputComponent()
                  .setCustomId('user_id')
                  .setLabel('ID do Usuário')
                  .setPlaceholder('Ex: 123456789012345678')
                  .setStyle('SHORT')
                  .setRequired(true);

                const paisInput = new Discord.TextInputComponent()
                  .setCustomId('pais')
                  .setLabel('País')
                  .setStyle('SHORT')
                  .setRequired(true);

                const dataInput = new Discord.TextInputComponent()
                  .setCustomId('data_cadastro')
                  .setLabel('Data de Cadastro (DD/MM/YYYY)')
                  .setStyle('SHORT')
                  .setRequired(true);

                modal.addComponents(
                  new Discord.MessageActionRow().addComponents(userInput),
                  new Discord.MessageActionRow().addComponents(paisInput),
                  new Discord.MessageActionRow().addComponents(dataInput)
                );

                await interaction.showModal(modal);
                break;
              }

              case 'pagamento': {
                const modal = new Discord.Modal()
                  .setCustomId('registro_pagamento')
                  .setTitle('Registrar Pagamento');

                const userInput = new Discord.TextInputComponent()
                  .setCustomId('user_id')
                  .setLabel('ID do Usuário')
                  .setPlaceholder('Ex: 123456789012345678')
                  .setStyle('SHORT')
                  .setRequired(true);

                const valorInput = new Discord.TextInputComponent()
                  .setCustomId('valor')
                  .setLabel('Valor (ex: 150.00)')
                  .setStyle('SHORT')
                  .setRequired(true);

                const categoriaInput = new Discord.TextInputComponent()
                  .setCustomId('categoria')
                  .setLabel('Categoria (premier/on-demand/hospedagem)')
                  .setStyle('SHORT')
                  .setRequired(true);

                const servicoInput = new Discord.TextInputComponent()
                  .setCustomId('servico')
                  .setLabel('Serviço Prestado')
                  .setPlaceholder('Descreva o serviço específico')
                  .setStyle('SHORT')
                  .setRequired(true);

                const dataInput = new Discord.TextInputComponent()
                  .setCustomId('data')
                  .setLabel('Data do Serviço (DD/MM/YYYY)')
                  .setStyle('SHORT')
                  .setRequired(true);

                modal.addComponents(
                  new Discord.MessageActionRow().addComponents(userInput),
                  new Discord.MessageActionRow().addComponents(valorInput),
                  new Discord.MessageActionRow().addComponents(categoriaInput),
                  new Discord.MessageActionRow().addComponents(servicoInput),
                  new Discord.MessageActionRow().addComponents(dataInput)
                );

                await interaction.showModal(modal);
          break;
              }

              case 'info':
              case 'historico': {
                const modal = new Discord.Modal()
                  .setCustomId(`consulta_${interaction.values[0]}`)
                  .setTitle('Consultar Cliente');

                const userInput = new Discord.TextInputComponent()
                  .setCustomId('user_id')
                  .setLabel('ID do Usuário')
                  .setStyle('SHORT')
                  .setRequired(true);

                modal.addComponents(
                  new Discord.MessageActionRow().addComponents(userInput)
                );

                await interaction.showModal(modal);
                break;
              }

              case 'relatorio': {
                const modal = new Discord.Modal()
                  .setCustomId('consulta_relatorio')
                  .setTitle('Gerar Relatório');

                const periodoInput = new Discord.TextInputComponent()
                  .setCustomId('periodo')
                  .setLabel('Período (hoje/semana/mes/ano)')
                  .setStyle('SHORT')
                  .setRequired(true);

                modal.addComponents(
                  new Discord.MessageActionRow().addComponents(periodoInput)
                );

                await interaction.showModal(modal);
          break;
              }

              case 'remover': {
                const modal = new Discord.Modal()
                  .setCustomId('remover_cliente')
                  .setTitle('Remover Cliente');

                const userInput = new Discord.TextInputComponent()
                  .setCustomId('user_id')
                  .setLabel('ID do Usuário')
                  .setPlaceholder('Ex: 123456789012345678')
                  .setStyle('SHORT')
                  .setRequired(true);

                modal.addComponents(
                  new Discord.MessageActionRow().addComponents(userInput)
                );

                await interaction.showModal(modal);
                break;
              }
            }
          } catch (error) {
            console.error('Erro ao processar menu:', error);
          }
        }

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
        if (interaction.customId === 'verificar') {
          try {
            // Verificar se já está verificado (tem o cargo final)
            if (interaction.member.roles.cache.has('746898390817964102')) {
              return interaction.reply({
                content: '❌ Você já está verificado!',
                ephemeral: true
              });
            }

            // Verificar se tem o cargo inicial
            if (!interaction.member.roles.cache.has('1333187382207447242')) {
              return interaction.reply({
                content: '❌ Você não possui acesso à verificação!',
                ephemeral: true
              });
            }

            // Desabilitar o botão imediatamente após o clique
            const disabledRow = new Discord.MessageActionRow()
              .addComponents(
                new Discord.MessageButton()
                  .setCustomId('verificar')
                  .setLabel('Verificar-se')
                  .setStyle('PRIMARY')
                  .setEmoji('✅')
                  .setDisabled(true)
              );

            // Atualizar a mensagem original com o botão desabilitado
            if (interaction.message.content) {
              await interaction.message.edit({
                content: interaction.message.content,
                components: [disabledRow]
              });
            }

            const modal = new Discord.Modal()
              .setCustomId('verify_modal')
              .setTitle('Verificação Code Lab');

            const nameInput = new Discord.TextInputComponent()
              .setCustomId('name')
              .setLabel('Nome e Sobrenome')
              .setStyle('SHORT')
              .setPlaceholder('Ex: João Silva')
              .setRequired(true);

            const whatsappInput = new Discord.TextInputComponent()
              .setCustomId('whatsapp')
              .setLabel('WhatsApp (com DDD)')
              .setStyle('SHORT')
              .setPlaceholder('Ex: +55 11 99999-9999')
              .setRequired(true);

            const locationInput = new Discord.TextInputComponent()
              .setCustomId('location')
              .setLabel('Estado e País')
              .setStyle('SHORT')
              .setPlaceholder('Ex: São Paulo, Brasil')
              .setRequired(true);

            const discoveryInput = new Discord.TextInputComponent()
              .setCustomId('discovery')
              .setLabel('Como nos conheceu?')
              .setStyle('PARAGRAPH')
              .setPlaceholder('Ex: Indicação de amigos, Comunidade, etc.')
              .setRequired(true);

            const interestInput = new Discord.TextInputComponent()
              .setCustomId('interest')
              .setLabel('Qual seu interesse na Code Lab?')
              .setStyle('PARAGRAPH')
              .setPlaceholder('Ex: Criação de código, Resolver bugs, etc.')
              .setRequired(true);

            modal.addComponents(
              new Discord.MessageActionRow().addComponents(nameInput),
              new Discord.MessageActionRow().addComponents(whatsappInput),
              new Discord.MessageActionRow().addComponents(locationInput),
              new Discord.MessageActionRow().addComponents(discoveryInput),
              new Discord.MessageActionRow().addComponents(interestInput)
            );

            await interaction.showModal(modal);
          } catch (error) {
            console.error('Erro ao mostrar modal:', error);
            await interaction.reply({
              content: '❌ Ocorreu um erro ao processar sua verificação.',
              ephemeral: true
            });
          }
        }

        if (interaction.customId === 'close_ticket') {
          try {
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
          } catch (error) {
            console.error('Erro ao mostrar modal:', error);
          await interaction.reply({
              content: '❌ Ocorreu um erro ao tentar fechar o ticket.',
            ephemeral: true
          });
          }
        }
      }

      // Handler para botão Admin
      if (interaction.isButton() && interaction.customId === 'admin_actions') {
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
          const userId = channel.topic.split(': ')[1]; // Pega o ID do usuário da descrição

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
        try {
          switch (interaction.customId) {
            case 'cadastro_cliente': {
              const userId = interaction.fields.getTextInputValue('user_id');
              const pais = interaction.fields.getTextInputValue('pais');
              const dataCadastro = interaction.fields.getTextInputValue('data_cadastro');

              // Validar se é um ID válido
              if (!/^\d+$/.test(userId)) {
                return interaction.reply({
                  content: '❌ ID inválido! Use apenas números.',
            ephemeral: true
          });
              }

              // Validar formato da data
              const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
              if (!dateRegex.test(dataCadastro)) {
                return interaction.reply({
                  content: '❌ Formato de data inválido! Use DD/MM/YYYY',
                  ephemeral: true
                });
              }

              // Converter data para ISO
              const [, day, month, year] = dataCadastro.match(dateRegex);
              const cadastroDate = new Date(year, month - 1, day);

              if (isNaN(cadastroDate.getTime())) {
                return interaction.reply({
                  content: '❌ Data inválida!',
            ephemeral: true
          });
              }

              try {
                const member = await interaction.guild.members.fetch(userId);
                
                await interaction.client.clientManager.addClient({
                  id: userId,
                  tag: member.user.tag,
                  pais: pais,
                  dataCadastro: cadastroDate.toISOString(),
                  cadastradoPor: interaction.user.id
                });

                const embed = new Discord.MessageEmbed()
                  .setColor('#9bf819')
                  .setTitle('📋 Novo Cliente Cadastrado')
                  .addFields([
                    { 
                      name: '👤 Cliente',
                      value: `${member} (\`${member.user.tag}\`)`,
                      inline: true 
                    },
                    { 
                      name: '🌎 País',
                      value: pais,
                      inline: true 
                    },
                    { 
                      name: '📅 Data de Cadastro',
                      value: dataCadastro,
                      inline: true 
                    }
                  ])
                  .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

                await interaction.reply({ embeds: [embed], ephemeral: true });
              } catch (error) {
                console.error('Erro ao cadastrar cliente:', error);
          await interaction.reply({
                  content: '❌ Erro ao cadastrar cliente. Verifique se o ID é válido e se o usuário existe no servidor.',
            ephemeral: true
          });
              }
              break;
            }

            case 'registro_pagamento': {
              const userId = interaction.fields.getTextInputValue('user_id');
              const valor = parseFloat(interaction.fields.getTextInputValue('valor'));
              const categoria = interaction.fields.getTextInputValue('categoria').toLowerCase();
              const servico = interaction.fields.getTextInputValue('servico');
              const dataServico = interaction.fields.getTextInputValue('data');

              // Validar se é um ID válido
              if (!/^\d+$/.test(userId)) {
                return interaction.reply({
                  content: '❌ ID inválido! Use apenas números.',
                ephemeral: true
              });
            }

              // Validar categoria
              const categoriasValidas = ['premier', 'on-demand', 'hospedagem'];
              if (!categoriasValidas.includes(categoria)) {
                return interaction.reply({
                  content: '❌ Categoria inválida! Use: premier, on-demand ou hospedagem',
              ephemeral: true
            });
              }

              // Validar formato da data
              const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
              if (!dateRegex.test(dataServico)) {
                return interaction.reply({
                  content: '❌ Formato de data inválido! Use DD/MM/YYYY',
              ephemeral: true
            });
              }

              // Converter data para ISO
              const [, day, month, year] = dataServico.match(dateRegex);
              const servicoDate = new Date(year, month - 1, day);

              if (isNaN(servicoDate.getTime())) {
                return interaction.reply({
                  content: '❌ Data inválida!',
                  ephemeral: true
                });
              }

              try {
                const member = await interaction.guild.members.fetch(userId);
                
                await interaction.client.clientManager.addPayment({
                  clientId: userId,
                  valor,
                  categoria,
                  servico,
                  dataServico: servicoDate.toISOString(),
                  registradoPor: interaction.user.id
                });

                const embed = new Discord.MessageEmbed()
                  .setColor('#9bf819')
                  .setTitle('💰 Novo Pagamento Registrado')
                  .addFields([
                    { name: '👤 Cliente', value: `${member} (\`${member.user.tag}\`)`, inline: true },
                    { name: '💵 Valor', value: `R$ ${valor.toFixed(2)}`, inline: true },
                    { name: '📁 Categoria', value: categoria.charAt(0).toUpperCase() + categoria.slice(1), inline: true },
                    { name: '🛠️ Serviço', value: servico, inline: true },
                    { name: '📅 Data do Serviço', value: dataServico, inline: true }
                  ])
                  .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

                await interaction.reply({ embeds: [embed], ephemeral: true });
          } catch (error) {
                console.error('Erro ao registrar pagamento:', error);
            await interaction.reply({
                  content: '❌ Erro ao registrar pagamento. Verifique se o ID é válido e se o usuário existe no servidor.',
              ephemeral: true
            });
          }
          break;
        }

            case 'consulta_info': {
              const userId = interaction.fields.getTextInputValue('user_id');

              // Validar se é um ID válido
              if (!/^\d+$/.test(userId)) {
                return interaction.reply({
                  content: '❌ ID inválido! Use apenas números.',
            ephemeral: true
          });
              }

              try {
                const client = await interaction.client.clientManager.getClient(userId);
                const member = await interaction.guild.members.fetch(userId);

                if (!client) {
                  return interaction.reply({
                    content: '❌ Cliente não encontrado!',
            ephemeral: true
          });
            }

                const embed = new Discord.MessageEmbed()
                  .setColor('#9bf819')
                  .setTitle('ℹ️ Informações do Cliente')
                  .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                  .addFields([
                    { 
                      name: '👤 Cliente',
                      value: `${member} (\`${member.user.tag}\`)`,
                      inline: true 
                    }
                  ]);

                // Adicionar campos opcionais apenas se existirem
                if (client.pais) {
                  embed.addField('🌎 País', client.pais, true);
                }

                if (client.dataCadastro) {
                  embed.addField(
                    '📅 Data de Cadastro',
                    new Date(client.dataCadastro).toLocaleDateString('pt-BR'),
                    true
                  );
                }

                if (client.cadastradoEm) {
                  embed.addField(
                    '⏰ Registrado em',
                    new Date(client.cadastradoEm).toLocaleString('pt-BR'),
                    true
                  );
                }

                await interaction.reply({ embeds: [embed], ephemeral: true });
              } catch (error) {
                console.error('Erro ao buscar informações:', error);
                await interaction.reply({
                  content: '❌ Erro ao buscar informações. Verifique se o ID é válido e se o usuário existe no servidor.',
                ephemeral: true
              });
              }
              break;
            }

            case 'consulta_historico': {
              const userId = interaction.fields.getTextInputValue('user_id');
              const payments = await interaction.client.clientManager.getClientPayments(userId);

              if (!payments.length) {
                return interaction.reply({
                  content: '❌ Nenhum pagamento encontrado para este cliente!',
              ephemeral: true
            });
              }

              const totalGasto = payments.reduce((acc, p) => acc + p.valor, 0);
              const embed = new Discord.MessageEmbed()
                  .setColor('#9bf819')
                .setTitle('📊 Histórico Financeiro')
                .setDescription(`Histórico de pagamentos de <@${userId}>`)
                .addFields([
                  { name: '💵 Total Gasto', value: `R$ ${totalGasto.toFixed(2)}`, inline: true },
                  { name: '🔢 Total de Compras', value: payments.length.toString(), inline: true }
                ]);

              // Adicionar últimos 5 pagamentos
              const recentPayments = payments.slice(-5).reverse();
              if (recentPayments.length) {
                embed.addField('📝 Últimos Pagamentos', 
                  recentPayments.map(p => 
                    `\`${new Date(p.dataServico).toLocaleDateString('pt-BR')}\` - ${p.servico} - R$ ${p.valor.toFixed(2)}`
                  ).join('\n')
                );
              }

              await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }

            case 'consulta_relatorio': {
              const periodo = interaction.fields.getTextInputValue('periodo');
              const report = await interaction.client.clientManager.getReport(periodo);

              const embed = new Discord.MessageEmbed()
                .setColor('#9bf819')
                .setTitle(`📊 Relatório de Vendas ${periodo.toUpperCase()}`)
                .setDescription(`*Período: ${report.periodo.inicio} até ${report.periodo.fim}*`)
                .addFields([
                  // Seção Financeira
                  {
                    name: '💰 VISÃO GERAL FINANCEIRA',
                    value: [
                      `> **Faturamento Total:** R$ ${report.financeiro.faturamentoTotal.toFixed(2)}`,
                      `> **Total de Vendas:** ${report.financeiro.totalVendas}`,
                      `> **Ticket Médio:** R$ ${report.financeiro.mediaTicket.toFixed(2)}`,
                      `> **Menor Venda:** R$ ${report.financeiro.ticketMinimo.toFixed(2)}`,
                      `> **Maior Venda:** R$ ${report.financeiro.ticketMaximo.toFixed(2)}`
                    ].join('\n')
                  },
                  // Seção Clientes
                  {
                    name: '👥 ANÁLISE DE CLIENTES',
                    value: [
                      `> **Novos Clientes:** ${report.clientes.total}`,
                      `> **Clientes Ativos:** ${report.clientes.ativos}`,
                      `\n**🏆 TOP 3 CLIENTES**`,
                      ...report.clientes.topClientes.map((c, i) => 
                        `> ${['🥇', '🥈', '🥉'][i]} <@${c.id}> • R$ ${c.total.toFixed(2)} (${c.compras} compras)`
                      )
                    ].join('\n')
                  },
                  // Seção Categorias
                  {
                    name: '📊 DESEMPENHO POR CATEGORIA',
                    value: report.categorias.map(cat => 
                      `**${cat.nome.toUpperCase()}** • ${cat.percentual}% do faturamento\n` +
                      `> Vendas: ${cat.vendas} | Valor: R$ ${cat.valor.toFixed(2)}\n` +
                      `> **Top Serviços:**\n${cat.servicos.slice(0, 3).map(s => 
                        `> • ${s.nome}: ${s.vendas}x (R$ ${s.valor.toFixed(2)})`
                      ).join('\n')}`
                    ).join('\n\n')
                  },
                  // Seção Evolução
                  {
                    name: '📈 EVOLUÇÃO DE VENDAS',
                    value: Object.entries(report.vendaPorDia)
                      .map(([data, valor]) => `> \`${data}\`: R$ ${valor.toFixed(2)}`)
                      .join('\n')
                  }
                ])
                .setFooter({ 
                  text: `Code Lab • Relatório Gerado em ${new Date().toLocaleString('pt-BR')}`,
                  iconURL: interaction.guild.iconURL({ dynamic: true })
                });

              await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }

            case 'remover_cliente': {
              const userId = interaction.fields.getTextInputValue('user_id');
              
              // Validar se é um ID válido
              if (!/^\d+$/.test(userId)) {
                return interaction.reply({
                  content: '❌ ID inválido! Use apenas números.',
            ephemeral: true
          });
              }

              try {
                const member = await interaction.guild.members.fetch(userId);
                const removedClient = await interaction.client.clientManager.removeClient(userId);

                if (!removedClient) {
                  return interaction.reply({
                    content: '❌ Cliente não encontrado no sistema.',
                ephemeral: true
              });
            }

                const embed = new Discord.MessageEmbed()
                  .setColor('#ff0000')
                  .setTitle('🗑️ Cliente Removido')
                  .setDescription('✅ Cliente e todos seus registros foram removidos do sistema.')
                  .addFields([
                    { 
                      name: '👤 Cliente',
                      value: `${member} (\`${member.user.tag}\`)`,
                      inline: true 
                    }
                  ])
                  .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

                // Adicionar campos opcionais apenas se existirem
                if (removedClient.pais) {
                  embed.addField('🌎 País', removedClient.pais, true);
                }

                if (removedClient.dataCadastro) {
                  embed.addField(
                    '📅 Data de Cadastro', 
                    new Date(removedClient.dataCadastro).toLocaleDateString('pt-BR'),
                    true
                  );
                }

                await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
                console.error('Erro ao remover cliente:', error);
                await interaction.reply({
                  content: '❌ Erro ao remover cliente. Verifique se o ID é válido e se o usuário existe no sistema.',
                ephemeral: true
              });
              }
              break;
            }

            case 'verify_modal': {
              try {
                const name = interaction.fields.getTextInputValue('name');
                const whatsapp = interaction.fields.getTextInputValue('whatsapp');
                const location = interaction.fields.getTextInputValue('location');
                const discovery = interaction.fields.getTextInputValue('discovery');
                const interest = interaction.fields.getTextInputValue('interest');

                // Verificar se tem o cargo inicial
                if (!interaction.member.roles.cache.has('1333187382207447242')) {
                  return interaction.reply({
                    content: '❌ Você não possui acesso à verificação!',
                    ephemeral: true
                  });
                }

                // Alterar nickname do usuário
                try {
                  await interaction.member.setNickname(name);
                } catch (nickError) {
                  console.error('Erro ao alterar nickname:', nickError);
                  // Não interrompe o processo, apenas registra o erro
                }

                // Alterar cargos
                await interaction.member.roles.remove('1333187382207447242');
                await interaction.member.roles.add('746898390817964102');

                // Criar embed de log
                const logEmbed = new Discord.MessageEmbed()
                  .setColor('#9bf819')
                  .setTitle('✅ Novo Membro Verificado')
                  .addFields([
                    { name: '👤 Usuário', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true },
                    { name: '📝 Nome', value: name, inline: true },
                    { name: '📱 WhatsApp', value: whatsapp, inline: true },
                    { name: '📍 Localização', value: location, inline: true },
                    { name: '🔍 Como nos conheceu', value: discovery, inline: false },
                    { name: '🎯 Interesse', value: interest, inline: false },
                    { name: '⏰ Verificado em', value: new Date().toLocaleString('pt-BR'), inline: true }
                  ])
                  .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

                // Tentar enviar log
                try {
                  const logChannel = await interaction.guild.channels.fetch(config.logs_channel);
                  if (logChannel) {
                    await logChannel.send({ embeds: [logEmbed] });
                  }
                } catch (logError) {
                  console.log('Não foi possível enviar log de verificação - Canal não encontrado');
                }

                await interaction.reply({
                  content: '✅ Sua verificação foi concluída com sucesso, seja bem-vindo(a) à Code Lab!',
                  ephemeral: true
                });
              } catch (error) {
                console.error('Erro ao processar verificação:', error);
                await interaction.reply({
                  content: '❌ Ocorreu um erro ao processar sua verificação.',
                  ephemeral: true
                });
              }
              break;
            }
          }
        } catch (error) {
          console.error('Erro ao processar modal:', error);
          await interaction.reply({
            content: '❌ Ocorreu um erro ao processar sua solicitação.',
            ephemeral: true
          }).catch(() => {});
        }
      }

      // Handler para modais de adicionar/remover usuário
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
      }

      // No handler de modais
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
