const Discord = require('discord.js');
const config = require('../../config.json');
const dataManager = require('../utils/dataManager');

module.exports = {
  name: 'massadm',
  description: 'Gerenciar mensagens em massa para membros verificados',
  type: 'CHAT_INPUT',
  options: [
    {
      name: 'ação',
      description: 'Ação a ser executada',
      type: 3,
      required: true,
      choices: [
        {
          name: 'listar',
          value: 'list'
        },
        {
          name: 'enviar',
          value: 'send'
        }
      ]
    }
  ],
  async execute(interaction) {
    // Verificar permissões
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: '❌ Você não tem permissão para usar este comando.',
        ephemeral: true
      });
    }

    const action = interaction.options.getString('ação');

    try {
      // Pegar todos os membros verificados do DataManager
      const verifiedUsers = dataManager.getVerifiedUsers();
      const verifiedMembers = [];

      // Buscar membros atuais do servidor
      for (const userData of verifiedUsers) {
        try {
          const member = await interaction.guild.members.fetch(userData.id);
          if (member) {
            verifiedMembers.push(member);
          }
        } catch (error) {
          console.error(`Membro não encontrado: ${userData.id}`);
          // Remover usuário dos verificados se não estiver mais no servidor
          await dataManager.removeVerifiedUser(userData.id);
        }
      }

      if (action === 'list') {
        // Criar embed com a lista de membros
        const listEmbed = new Discord.MessageEmbed()
          .setColor('#2c58f9')
          .setTitle('📊 Membros Verificados')
          .setDescription(`Total de membros verificados: ${verifiedMembers.length}`)
          .addField('Lista de Membros', 
            verifiedMembers.length > 0 
              ? verifiedMembers.map(member => 
                  `${member.user.tag} (${member.user.id})`
                ).join('\n').slice(0, 1024) 
              : 'Nenhum membro verificado encontrado'
          )
          .setFooter({ 
            text: `Solicitado por ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .setTimestamp();

        // Se houver muitos membros, criar um arquivo de texto
        if (verifiedMembers.length > 30) {
          const fullList = verifiedMembers.map(member => 
            `${member.user.tag} (${member.user.id})`
          ).join('\n');

          const buffer = Buffer.from(fullList, 'utf-8');
          
          await interaction.reply({
            embeds: [listEmbed],
            files: [{
              attachment: buffer,
              name: 'membros_verificados.txt'
            }],
            ephemeral: true
          });
        } else {
          await interaction.reply({
            embeds: [listEmbed],
            ephemeral: true
          });
        }
      }

      else if (action === 'send') {
        // Primeiro, pedir a mensagem
        await interaction.reply({
          content: '📝 Por favor, envie a mensagem que você deseja enviar para todos os membros verificados.\n\n**Observações:**\n- Você tem 5 minutos para enviar a mensagem\n- A mensagem pode conter formatação do Discord (negrito, itálico, etc)\n- Para cancelar, digite `cancelar`',
          ephemeral: true
        });

        // Criar coletor de mensagens
        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ 
          filter, 
          max: 1,
          time: 300000 // 5 minutos
        });

        collector.on('collect', async message => {
          // Se o usuário quiser cancelar
          if (message.content.toLowerCase() === 'cancelar') {
            await interaction.editReply({
              content: '❌ Envio cancelado.',
              ephemeral: true
            });
            return;
          }

          // Deletar a mensagem do usuário para manter o chat limpo
          await message.delete().catch(() => {});

          // Confirmar o envio
          const confirmEmbed = new Discord.MessageEmbed()
            .setColor('#ff9900')
            .setTitle('⚠️ Confirmação de Envio em Massa')
            .setDescription(`Você está prestes a enviar uma mensagem para ${verifiedMembers.length} membros.\n\n**Mensagem:**\n${message.content}`)
            .setFooter({ 
              text: 'Esta ação não pode ser desfeita!'
            });

          const confirmRow = new Discord.MessageActionRow()
            .addComponents(
              new Discord.MessageButton()
                .setCustomId('confirm_mass_dm')
                .setLabel('Confirmar Envio')
                .setStyle('SUCCESS'),
              new Discord.MessageButton()
                .setCustomId('cancel_mass_dm')
                .setLabel('Cancelar')
                .setStyle('DANGER')
            );

          const confirmMsg = await interaction.editReply({
            content: null,
            embeds: [confirmEmbed],
            components: [confirmRow]
          });

          // Coletor para a confirmação
          const buttonCollector = confirmMsg.createMessageComponentCollector({ 
            time: 30000,
            max: 1
          });

          buttonCollector.on('collect', async i => {
            if (i.customId === 'confirm_mass_dm') {
              await i.update({
                content: '📨 Iniciando envio das mensagens...',
                embeds: [],
                components: []
              });

              let sent = 0;
              let failed = 0;

              // Enviar mensagens
              for (const member of verifiedMembers) {
                try {
                  await member.send({
                    content: message.content
                  });
                  sent++;
                  
                  // Atualizar progresso a cada 10 mensagens
                  if (sent % 10 === 0) {
                    await i.editReply({
                      content: `📨 Enviando mensagens... (${sent}/${verifiedMembers.length})`
                    });
                  }
                } catch (error) {
                  failed++;
                  console.error(`Erro ao enviar DM para ${member.user.tag}:`, error);
                }

                // Aguardar um pouco para evitar rate limit
                await new Promise(resolve => setTimeout(resolve, 1000));
              }

              // Resultado final
              await i.editReply({
                content: `✅ Envio concluído!\n\n📨 Mensagens enviadas: ${sent}\n❌ Falhas: ${failed}`
              });
            } else {
              await i.update({
                content: '❌ Envio cancelado.',
                embeds: [],
                components: []
              });
            }
          });

          buttonCollector.on('end', collected => {
            if (collected.size === 0) {
              interaction.editReply({
                content: '❌ Tempo esgotado. Envio cancelado.',
                embeds: [],
                components: []
              });
            }
          });
        });

        collector.on('end', collected => {
          if (collected.size === 0) {
            interaction.editReply({
              content: '❌ Tempo esgotado. Nenhuma mensagem enviada.',
              ephemeral: true
            });
          }
        });
      }
    } catch (error) {
      console.error('Erro ao executar comando:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao executar o comando.',
        ephemeral: true
      });
    }
  }
}; 