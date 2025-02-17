const Discord = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: 'verificacao',
  description: 'Cria o painel de verificação',
  type: 'CHAT_INPUT',
  defaultPermission: false,
  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: '❌ Você não tem permissão para usar este comando.',
        ephemeral: true
      });
    }

    // Criar o botão de verificação
    const row = new Discord.MessageActionRow()
      .addComponents(
        new Discord.MessageButton()
          .setCustomId('iniciar_verificacao')
          .setLabel('Iniciar Verificação | Start Verification')
          .setStyle('SUCCESS')
      );

    // Enviar o botão
    try {
      await interaction.channel.send({
        components: [row]
      });

      await interaction.reply({
        content: '✅ Painel de verificação criado com sucesso!',
        ephemeral: true
      });
    } catch (error) {
      console.error('Erro ao criar painel de verificação:', error);
      await interaction.reply({
        content: '❌ Erro ao criar o painel de verificação.',
        ephemeral: true
      });
    }
  }
}; 