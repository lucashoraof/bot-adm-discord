const Discord = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    try {
      // Cargo inicial ao entrar no servidor
      const cargoInicialID = '1333187382207447242';
      const canalLogsID = '1333190146547257416';

      // Adicionar cargo inicial
      await member.roles.add(cargoInicialID);

    } catch (error) {
      console.error('Erro ao adicionar cargo automático:', error);
    }
  }
}; 