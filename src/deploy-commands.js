const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { readdirSync } = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('Comandos encontrados:', commandFiles);

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push({
    name: command.name,
    description: command.description,
    options: command.options || [],
    default_member_permissions: '8'
  });
}

console.log('Comandos para registrar:', commands);

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Iniciando registro dos comandos slash...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('Comandos slash registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})(); 