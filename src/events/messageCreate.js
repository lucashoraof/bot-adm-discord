const Discord = require('discord.js');
const config = require('../../config.json');
const warnedChannels = new Set();

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    if (message.author.bot) return;

    const channel = message.channel;
    if (!channel.topic || !channel.topic.includes('Created:')) return;

    const createdTime = parseInt(channel.topic.split('Created: ')[1]);
    const createdDate = new Date(createdTime);
    const creationHour = createdDate.getUTCHours() - 3;
    
    if (creationHour >= 18 || creationHour < 12) {
      if (!warnedChannels.has(channel.id)) {
        warnedChannels.add(channel.id);
        
        const warningEmbed = new Discord.MessageEmbed()
          .setColor(config.color)
          .setTitle('É uma pena! Estamos fora do nosso horário comercial')
          .setDescription('🇧🇷🇵🇹 Nosso time está offline no momento, nosso **horário de atendimento** é de **12:00 às 18:00** (GTM-3). Sua solicitação foi registrada e será respondida assim que ficarmos disponíveis, vamos te enviar uma notificação na DM.\n\n🇬🇧🇺🇸 Our team is currently offline, our **business hours** are from **12:00 PM to 6:00 PM** (GTM-3). Your request has been registered and will be answered as soon as we become available, we will send you a notification via DM.');

        await channel.send({ embeds: [warningEmbed] });
      }
    }
  }
};