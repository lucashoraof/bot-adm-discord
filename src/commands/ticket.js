const Discord = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: 'ticket',
  description: 'Cria o painel de tickets',
  type: 'CHAT_INPUT',
  defaultPermission: false, // Apenas staff pode usar
  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: '❌ Você não tem permissão para usar este comando.',
        ephemeral: true
      });
    }

    // Criar o embed do ticket
    const ticketEmbed = new Discord.MessageEmbed()
      .setColor('#2c58f9')
      .setTitle('Central de Atendimento da Code Lab')
      .setDescription(`🇧🇷 Nessa seção, você pode tirar suas dúvidas, solicitar orçamentos ou entrar em contato com a nossa equipe da Code Lab, leia as opções abaixo e escolha a que melhor se encaixa com o seu caso para iniciar seu atendimento.\n\n🇺🇸 In this section, you can ask questions, request quotes or contact our Code Lab team. Read the options below and choose the one that best fits your case to start your service.`)
      .setImage('https://media.discordapp.net/attachments/926259039803945000/1328499097925189662/Banner_Notificacoes_3.jpg');

    // Criar o menu de seleção
    const selectMenu = new Discord.MessageActionRow().addComponents(
      new Discord.MessageSelectMenu()
        .setCustomId('ticket')
        .setPlaceholder('Selecione uma opção | Select an option')
        .addOptions([
          {
            label: 'Solicitar Suporte | Request Support',
            description: 'Fale com nossa equipe de suporte | Talk to our support team',
            emoji: '👥',
            value: 'sup'
          },
          {
            label: 'Proposta de Parceria | Partnership Proposal',
            description: 'Discuta oportunidades de parceria | Discuss partnership opportunities',
            emoji: '🤝',
            value: 'partner'
          },
          {
            label: 'Enviar Currículo | Send Resume',
            description: 'Trabalhe conosco | Work with us',
            emoji: '📃',
            value: 'resume'
          },
          {
            label: 'Solicitar Orçamento | Request Quote',
            description: 'Orçamento para serviços | Service quotation',
            emoji: '🛒',
            value: 'quote'
          }
        ])
    );

    // Enviar o embed com o menu
    try {
      await interaction.channel.send({
        embeds: [ticketEmbed],
        components: [selectMenu]
      });
    } catch (error) {
      console.error('Erro ao criar painel de tickets:', error);
      await interaction.reply({
        content: '❌ Erro ao criar o painel de tickets.',
        ephemeral: true
      });
    }
  }
}; 