const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const config = require('../../config.json');
const Discord = require('discord.js');
const dataManager = require('./dataManager');

const app = express();

// Configuração da sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Configurar estratégia Discord
const scopes = ['identify', 'email', 'guilds', 'guilds.join'];

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.OAUTH_CALLBACK_URL,
    scope: scopes
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Aqui você pode salvar informações do usuário se necessário
        return done(null, { ...profile, accessToken });
    } catch (err) {
        return done(err, null);
    }
}));

// Rota de autenticação
app.get('/auth/discord', passport.authenticate('discord'));

// Callback do OAuth2
app.get('/auth/discord/callback', 
    passport.authenticate('discord', { failureRedirect: '/' }),
    async (req, res) => {
        try {
            const discordClient = req.app.get('client');
            if (!discordClient) {
                throw new Error('Cliente Discord não encontrado');
            }

            const guild = await discordClient.guilds.fetch(config.guildId);
            if (!guild) {
                throw new Error('Servidor não encontrado');
            }

            // Verifica se o usuário já está no servidor
            let member;
            try {
                member = await guild.members.fetch(req.user.id);
            } catch (err) {
                // Se o usuário não estiver no servidor, tenta adicioná-lo
                try {
                    member = await guild.members.add(req.user.id, {
                        accessToken: req.user.accessToken,
                        roles: ['1333187382207447242'] // Cargo inicial
                    });
                } catch (addError) {
                    console.error('Erro ao adicionar membro:', addError);
                    throw new Error('Não foi possível adicionar você ao servidor');
                }
            }

            // Remove cargo inicial e adiciona cargo verificado
            await member.roles.remove('1333187382207447242').catch(console.error);
            await member.roles.add('746898390817964102').catch(console.error);

            // Salvar usuário verificado
            await dataManager.addVerifiedUser(req.user.id, {
                tag: member.user.tag,
                email: req.user.email,
                avatar: member.user.displayAvatarURL({ dynamic: true }),
                verifiedBy: 'oauth'
            });

            // Enviar log de verificação
            const logChannel = await guild.channels.fetch(config.logs_channel);
            if (logChannel) {
                const logEmbed = new Discord.MessageEmbed()
                    .setColor('#9bf819')
                    .setTitle('✅ Novo Membro Verificado')
                    .addFields([
                        { name: '👤 Usuário', value: `${member.user} (\`${member.user.tag}\`)`, inline: true },
                        { name: '📧 Email', value: req.user.email || 'Não fornecido', inline: true },
                        { name: '⏰ Verificado em', value: new Date().toLocaleString('pt-BR'), inline: true }
                    ])
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ 
                        text: `ID: ${member.user.id}`,
                        iconURL: guild.iconURL({ dynamic: true })
                    })
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

            // Fechar a janela imediatamente
            res.send('<script>window.close();</script>');
        } catch (error) {
            console.error('Erro no callback:', error);
            res.send('<script>window.close();</script>');
        }
    }
);

// Rota de erro
app.get('/error', (req, res) => {
    const message = req.query.message || 'Ocorreu um erro durante a autenticação.';
    res.send(`<h1>Erro na Autenticação</h1><p>${message}</p>`);
});

function startOAuthServer(client, port = 3000) {
    app.set('client', client);
    app.listen(port, () => {
        console.log(`Servidor OAuth2 rodando na porta ${port}`);
    });
}

module.exports = { startOAuthServer }; 