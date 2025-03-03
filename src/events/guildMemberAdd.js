const Discord = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    try {
      // Adicionar cargo ao entrar no servidor
      const cargoInicialID = '746898390817964102'; 

      await member.roles.add(cargoInicialID);

    } catch (error) {
      console.error('Erro ao adicionar cargo automático:', error);
    }
  }
};