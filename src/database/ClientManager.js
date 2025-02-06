const fs = require('fs').promises;
const path = require('path');

class ClientManager {
  constructor() {
    this.dbPath = path.join(__dirname, 'data');
    this.clientsFile = path.join(this.dbPath, 'clients.json');
    this.paymentsFile = path.join(this.dbPath, 'payments.json');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.dbPath, { recursive: true });
      
      // Criar arquivos se não existirem
      await this.createFileIfNotExists(this.clientsFile, { clients: [] });
      await this.createFileIfNotExists(this.paymentsFile, { payments: [] });
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
    }
  }

  async createFileIfNotExists(filePath, defaultData) {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  // Clientes
  async addClient(clientData) {
    try {
      const data = JSON.parse(await fs.readFile(this.clientsFile, 'utf8'));
      const newClient = {
        id: clientData.id,
        tag: clientData.tag,
        pais: clientData.pais,
        dataCadastro: clientData.dataCadastro,
        cadastradoEm: new Date().toISOString(),
        cadastradoPor: clientData.cadastradoPor
      };

      data.clients.push(newClient);
      await fs.writeFile(this.clientsFile, JSON.stringify(data, null, 2));
      return newClient;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      throw error;
    }
  }

  async getClient(userId) {
    try {
      const data = JSON.parse(await fs.readFile(this.clientsFile, 'utf8'));
      return data.clients.find(client => client.id === userId);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      throw error;
    }
  }

  // Pagamentos
  async addPayment(paymentData) {
    try {
      const data = JSON.parse(await fs.readFile(this.paymentsFile, 'utf8'));
      const newPayment = {
        id: Date.now().toString(),
        clientId: paymentData.clientId,
        valor: paymentData.valor,
        categoria: paymentData.categoria,
        servico: paymentData.servico,
        descricao: paymentData.descricao,
        dataServico: paymentData.dataServico,
        dataRegistro: new Date().toISOString(),
        registradoPor: paymentData.registradoPor
      };

      data.payments.push(newPayment);
      await fs.writeFile(this.paymentsFile, JSON.stringify(data, null, 2));
      return newPayment;
    } catch (error) {
      console.error('Erro ao adicionar pagamento:', error);
      throw error;
    }
  }

  async getClientPayments(userId) {
    try {
      const data = JSON.parse(await fs.readFile(this.paymentsFile, 'utf8'));
      return data.payments.filter(payment => payment.clientId === userId);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      throw error;
    }
  }

  async getReport(period) {
    try {
      const payments = JSON.parse(await fs.readFile(this.paymentsFile, 'utf8')).payments;
      const clients = JSON.parse(await fs.readFile(this.clientsFile, 'utf8')).clients;
      
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'hoje':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'semana':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'mes':
          // Primeiro dia do mês atual
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'ano':
          startDate = new Date(now.getFullYear(), 0, 1); // 1º de Janeiro do ano atual
          break;
      }

      const filteredPayments = payments.filter(p => new Date(p.dataServico) >= startDate);
      const filteredClients = clients.filter(c => new Date(c.cadastradoEm) >= startDate);

      // Cálculos financeiros
      const totalValue = filteredPayments.reduce((acc, p) => acc + p.valor, 0);
      const mediaTicket = totalValue / filteredPayments.length || 0;

      // Top 3 Clientes
      const clientesGastos = filteredPayments.reduce((acc, p) => {
        if (!acc[p.clientId]) {
          acc[p.clientId] = {
            id: p.clientId,
            total: 0,
            compras: 0
          };
        }
        acc[p.clientId].total += p.valor;
        acc[p.clientId].compras++;
        return acc;
      }, {});

      const topClientes = Object.values(clientesGastos)
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

      // Análise por categoria
      const categorias = filteredPayments.reduce((acc, p) => {
        if (!acc[p.categoria]) {
          acc[p.categoria] = {
            count: 0,
            valor: 0,
            servicos: {}
          };
        }
        acc[p.categoria].count++;
        acc[p.categoria].valor += p.valor;
        
        if (!acc[p.categoria].servicos[p.servico]) {
          acc[p.categoria].servicos[p.servico] = {
            count: 0,
            valor: 0
          };
        }
        acc[p.categoria].servicos[p.servico].count++;
        acc[p.categoria].servicos[p.servico].valor += p.valor;
        
        return acc;
      }, {});

      // Análise temporal (ordenada por data)
      const vendaPorDia = Object.entries(
        filteredPayments.reduce((acc, p) => {
          const data = new Date(p.dataServico).toLocaleDateString('pt-BR');
          if (!acc[data]) acc[data] = 0;
          acc[data] += p.valor;
          return acc;
        }, {})
      )
      .sort(([dataA], [dataB]) => {
        const [diaA, mesA, anoA] = dataA.split('/').map(Number);
        const [diaB, mesB, anoB] = dataB.split('/').map(Number);
        return new Date(anoA, mesA-1, diaA) - new Date(anoB, mesB-1, diaB);
      })
      .reduce((acc, [data, valor]) => {
        acc[data] = valor;
        return acc;
      }, {});

      return {
        periodo: {
          inicio: startDate.toLocaleDateString('pt-BR'),
          fim: now.toLocaleDateString('pt-BR')
        },
        financeiro: {
          faturamentoTotal: totalValue,
          mediaTicket: mediaTicket,
          totalVendas: filteredPayments.length,
          ticketMinimo: Math.min(...filteredPayments.map(p => p.valor)),
          ticketMaximo: Math.max(...filteredPayments.map(p => p.valor))
        },
        clientes: {
          total: filteredClients.length,
          ativos: new Set(filteredPayments.map(p => p.clientId)).size,
          topClientes: topClientes
        },
        categorias: Object.entries(categorias)
          .map(([nome, dados]) => ({
            nome,
            vendas: dados.count,
            valor: dados.valor,
            percentual: ((dados.valor / totalValue) * 100).toFixed(1),
            servicos: Object.entries(dados.servicos)
              .map(([servico, info]) => ({
                nome: servico,
                vendas: info.count,
                valor: info.valor
              }))
              .sort((a, b) => b.vendas - a.vendas)
          }))
          .sort((a, b) => b.valor - a.valor),
        vendaPorDia
      };
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  async removeClient(userId) {
    try {
      const data = JSON.parse(await fs.readFile(this.clientsFile, 'utf8'));
      const clientIndex = data.clients.findIndex(client => client.id === userId);
      
      if (clientIndex === -1) {
        throw new Error('Cliente não encontrado');
      }

      // Remover cliente
      const removedClient = data.clients.splice(clientIndex, 1)[0];
      await fs.writeFile(this.clientsFile, JSON.stringify(data, null, 2));

      // Remover pagamentos associados
      const paymentsData = JSON.parse(await fs.readFile(this.paymentsFile, 'utf8'));
      paymentsData.payments = paymentsData.payments.filter(p => p.clientId !== userId);
      await fs.writeFile(this.paymentsFile, JSON.stringify(paymentsData, null, 2));

      return removedClient;
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      throw error;
    }
  }
}

module.exports = ClientManager; 