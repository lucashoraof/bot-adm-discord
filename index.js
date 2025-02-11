require('dotenv').config();
const CustomClient = require('./src/utils/Client');
const { Intents } = require('discord.js');
const dataManager = require('./src/utils/dataManager');

const client = new CustomClient({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_VOICE_STATES
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

async function init() {
  // Inicializar o gerenciador de dados
  await dataManager.init();
  
  // Inicializar o bot
  await client.init();
}

init(); 