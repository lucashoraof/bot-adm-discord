const Discord = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    try {
      // Adicionar cargo ao entrar no servidor
      const cargoInicialID = '1333187382207447242'; 

      await member.roles.add(cargoInicialID);

    } catch (error) {
      console.error('Erro ao adicionar cargo automático:', error);
    }
  }
}; 