const fs = require('fs').promises;
const path = require('path');

class DataManager {
    constructor() {
        this.dataPath = path.join(process.cwd(), 'data');
        this.verifiedUsersPath = path.join(this.dataPath, 'verified_users.json');
        this.data = {
            verifiedUsers: []
        };
    }

    async init() {
        try {
            // Criar diretório de dados se não existir
            await fs.mkdir(this.dataPath, { recursive: true });

            // Tentar carregar dados existentes
            try {
                const fileData = await fs.readFile(this.verifiedUsersPath, 'utf-8');
                this.data = JSON.parse(fileData);
            } catch (error) {
                // Se o arquivo não existir, criar com dados vazios
                await this.saveData();
            }
        } catch (error) {
            console.error('Erro ao inicializar DataManager:', error);
        }
    }

    async saveData() {
        try {
            await fs.writeFile(
                this.verifiedUsersPath,
                JSON.stringify(this.data, null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
        }
    }

    async addVerifiedUser(userId, userData) {
        if (!this.data.verifiedUsers) {
            this.data.verifiedUsers = [];
        }

        // Verificar se usuário já existe
        const existingUser = this.data.verifiedUsers.find(user => user.id === userId);
        if (!existingUser) {
            this.data.verifiedUsers.push({
                id: userId,
                verifiedAt: new Date().toISOString(),
                ...userData
            });
            await this.saveData();
        }
    }

    async removeVerifiedUser(userId) {
        if (!this.data.verifiedUsers) return;

        this.data.verifiedUsers = this.data.verifiedUsers.filter(user => user.id !== userId);
        await this.saveData();
    }

    getVerifiedUsers() {
        return this.data.verifiedUsers || [];
    }

    isUserVerified(userId) {
        return this.data.verifiedUsers?.some(user => user.id === userId) || false;
    }
}

module.exports = new DataManager(); 