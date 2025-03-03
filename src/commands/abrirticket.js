const Discord = require('discord.js');
const config = require('../../config.json');
const { Constants } = require('discord.js');

module.exports = {
  name: 'abrirticket',
  description: 'Abre um ticket para um usuário',
  type: 'CHAT_INPUT',
  options: [
    {
      name: 'usuario',
      description: 'Usuário para abrir o ticket',
      type: Constants.ApplicationCommandOptionTypes.USER,
      required: true
    },
    {
      name: 'tipo',
      description: 'Categoria do ticket',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
      choices: [
        {
          name: 'Suporte',
          value: 'sup'
        },
        {
          name: 'Orçamento',
          value: 'quote'
        }
      ]
    }
  ],
  async execute(interaction) {
    // Verifica permissão do staff
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: '❌ Você não tem permissão para usar este comando.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('usuario');
    const tipoTicket = interaction.options.getString('tipo');

    try {
      // Define o nome do canal baseado na categoria
      let channelName;
      switch (tipoTicket) {
        case 'sup':
          channelName = `📞・suporte-${user.username}`;
          break;
        case 'quote':
          channelName = `🛒・orçamento-${user.username}`;
          break;
      }

      // Criar canal do ticket
      const channel = await interaction.guild.channels.create(channelName, {
        type: 'GUILD_TEXT',
        parent: config.categoria,
        topic: `ID: ${user.id}`,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: ['VIEW_CHANNEL']
          },
          {
            id: user.id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
          },
          {
            id: interaction.user.id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
          }
        ]
      });

      // Criar embed inicial
      const ticketEmbed = new Discord.MessageEmbed()
        .setColor(config.color)
        .setAuthor({
          name: `Ticket de ${user.username}`,
          iconURL: user.displayAvatarURL({ dynamic: true })
        })
        .setDescription(`Olá, boas-vindas à **Code Lab**!\n\n🇧🇷🇵🇹 Nossa equipe irá te atender em breve! Enquanto isso, para tornar nosso **suporte** mais eficiente, sinta-se à vontade para **explicar** suas necessidades ou a **razão** de seu contato.\n\n🇬🇧🇺🇸 Our team will be in touch with you shortly! In the meantime, to make our **support** more efficient, please feel free to **explain** your needs or the **reason** for your contact.`)
        .setThumbnail('https://media.discordapp.net/attachments/926259039803945000/1328499098420121670/Logo_Code_Lab.jpg');

      // Botão Admin
      const adminRow = new Discord.MessageActionRow()
        .addComponents(
          new Discord.MessageButton()
            .setCustomId('admin_actions')
            .setLabel('Admin')
            .setStyle('SECONDARY')
            .setEmoji('⚙️')
        );

      // Enviar mensagem inicial
      await channel.send({
        content: `${user} ${interaction.user}`,
        embeds: [ticketEmbed],
        components: [adminRow]
      });

      // Notificar via DM
      try {
        const dmEmbed = new Discord.MessageEmbed()
          .setColor(config.color)
          .setAuthor({ 
            name: 'Sistema de notificação da Code Lab', 
            iconURL: interaction.guild.iconURL({ dynamic: true }) 
          })
          .setDescription(`Olá ${user}, como você está?\n\nAlguém do nosso time está querendo falar com você!\n\nClique no botão abaixo para acessar o ticket.`)
          .setImage('https://media.discordapp.net/attachments/926259039803945000/1333575143401984102/Banner_Notificacoes.jpg?ex=67996422&is=679812a2&hm=bf1daffd3c825df16c283455b2a90b00d2957c81e6dd5523d2fc9ef9bc1448d2&=&format=webp&width=1440&height=308')
          .setTimestamp();

        const dmButton = new Discord.MessageActionRow()
          .addComponents(
            new Discord.MessageButton()
              .setLabel('Ir para o Ticket')
              .setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
              .setStyle('LINK')
              .setEmoji('🎟️')
          );

        await user.send({
          embeds: [dmEmbed],
          components: [dmButton]
        });
      } catch (dmError) {
        console.log(`Não foi possível enviar DM para ${user.tag}`);
        await channel.send(`${user} Não foi possível enviar DM, verifique suas configurações de privacidade!`);
      }

      // Responder ao comando
      await interaction.reply({
        content: `✅ Ticket criado com sucesso em ${channel}`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      await interaction.reply({
        content: '❌ Erro ao criar o ticket!',
        ephemeral: true
      });
    }
  }
}; 