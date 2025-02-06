const Discord = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: 'cliente',
  description: 'Sistema de gestão de clientes',
  type: 'CHAT_INPUT',
  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: '❌ Você não tem permissão para usar este comando.',
        ephemeral: true
      });
    }

    const menuEmbed = new Discord.MessageEmbed()
      .setColor('#9bf819')
      .setTitle('🏢 Sistema de Gestão Code Lab')
      .setDescription('Selecione uma opção abaixo para gerenciar clientes e vendas.')
      .setFooter({ 
        text: 'Code Lab • Sistema de Gestão',
        iconURL: interaction.guild.iconURL({ dynamic: true })
      });

    const row = new Discord.MessageActionRow()
      .addComponents(
        new Discord.MessageSelectMenu()
          .setCustomId('gestao_menu')
          .setPlaceholder('Selecione uma opção')
          .addOptions([
            {
              label: 'Cadastrar Cliente',
              description: 'Cadastrar um novo cliente',
              value: 'cadastrar',
              emoji: '📋'
            },
            {
              label: 'Remover Cliente',
              description: 'Remover um cliente do sistema',
              value: 'remover',
              emoji: '🗑️'
            },
            {
              label: 'Registrar Pagamento',
              description: 'Registrar um novo pagamento',
              value: 'pagamento',
              emoji: '💰'
            },
            {
              label: 'Informações do Cliente',
              description: 'Ver informações detalhadas',
              value: 'info',
              emoji: 'ℹ️'
            },
            {
              label: 'Histórico Financeiro',
              description: 'Ver histórico de pagamentos',
              value: 'historico',
              emoji: '📊'
            },
            {
              label: 'Relatório de Vendas',
              description: 'Gerar relatório por período',
              value: 'relatorio',
              emoji: '📈'
            }
          ])
      );

    await interaction.reply({
      embeds: [menuEmbed],
      components: [row],
      ephemeral: true
    });
  }
}; 