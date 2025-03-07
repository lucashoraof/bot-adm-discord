// ---------------------------------------------------------------------------------------------------------------------
// REQUIREMENTS
// ---------------------------------------------------------------------------------------------------------------------
const Discord = require('discord.js');
const config = require('../../config.json');
// ---------------------------------------------------------------------------------------------------------------------
// SLASH COMMAND
// ---------------------------------------------------------------------------------------------------------------------
module.exports = {
  name: 'ticket',
  description: 'Cria o painel de tickets',
  type: 'CHAT_INPUT',
  defaultPermission: false,
// ---------------------------------------------------------------------------------------------------------------------
// VERIFICATION PERMISSION
// ---------------------------------------------------------------------------------------------------------------------
  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: '❌ Você não tem permissão para usar este comando.',
        ephemeral: true
      });
    }
// ---------------------------------------------------------------------------------------------------------------------
// EMBED SERVICE
// ---------------------------------------------------------------------------------------------------------------------
    const ticketEmbed = new Discord.MessageEmbed()
      .setColor(config.color)
      .setTitle('Central de Atendimento ao Cliente')
      .setDescription(`🇧🇷🇵🇹 Nessa seção, você pode tirar suas dúvidas, solicitar orçamentos ou entrar em contato com a nossa equipe da Code Lab, leia as opções abaixo e escolha a que melhor se encaixa com o seu caso para iniciar seu atendimento.\n\n🇬🇧🇺🇸 In this section, you can ask questions, request quotes or contact our Code Lab team. Read the options below and choose the one that best fits your case to start your service.`)
      .setImage('https://media.discordapp.net/attachments/926259039803945000/1328499097925189662/Banner_Notificacoes_3.jpg');
// ---------------------------------------------------------------------------------------------------------------------
// SELECTION MENU
// ---------------------------------------------------------------------------------------------------------------------
    const selectMenu = new Discord.MessageActionRow().addComponents(
      new Discord.MessageSelectMenu()
        .setCustomId('ticket')
        .setPlaceholder('Selecione uma opção | Select an option')
        .addOptions([
          {
            label: 'Solicitar Suporte | Request Support',
            emoji: '👥',
            value: 'sup'
          },
          {
            label: 'Solicitar Orçamento | Request Quote',
            emoji: '🛒',
            value: 'quote'
          }
        ])
    );
  // ---------------------------------------------------------------------------------------------------------------------
// SEND THE TICKET PANEL
// ---------------------------------------------------------------------------------------------------------------------
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