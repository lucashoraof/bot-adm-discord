// ---------------------------------------------------------------------------------------------------------------------
// REQUIREMENTS
// ---------------------------------------------------------------------------------------------------------------------
const { Client, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const path = require('path');

class CustomClient extends Client {
  constructor(options) {
    super(options);
    
    this.commands = new Collection();
    this.aliases = new Collection();
    this.config = require('../../config.json');
  }

  async init() {
    try {
      const commandPath = path.join(__dirname, '../commands');
      
      if (readdirSync(commandPath)) {
        const commandFiles = readdirSync(commandPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
          const command = require(path.join(commandPath, file));
          this.commands.set(command.name, command);
        }
      }
// ---------------------------------------------------------------------------------------------------------------------
// EVENTS
// ---------------------------------------------------------------------------------------------------------------------
      const eventPath = path.join(__dirname, '../events');
      const eventFiles = readdirSync(eventPath).filter(file => file.endsWith('.js'));
      
      for (const file of eventFiles) {
        const eventName = file.split('.')[0];
        const event = require(path.join(eventPath, file));
        
        if (event.once) {
          this.once(eventName, (...args) => event.execute(...args));
        } else {
          this.on(eventName, (...args) => event.execute(...args));
        }
      }
// ---------------------------------------------------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------------------------------------------------
      await this.login(process.env.TOKEN);
      console.log('🤖 Sistema da Code Lab iniciado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar:', error);
    }
  }
}

module.exports = CustomClient; 