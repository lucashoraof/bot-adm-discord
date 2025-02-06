const Discord = require('discord.js');
const config = require('../../config.json');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`🍃 Bot Online em ${client.guilds.cache.size} servidores`);
    console.log(`👥 Servindo ${client.users.cache.size} usuários`);

  }
};
