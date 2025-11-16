/**
 * @fileoverview RFMAnalyzer - Análise RFM (Recency, Frequency, Monetary)
 * Segmentação avançada de clientes
 */

/**
 * @typedef {Object} RFMScore
 * @property {string} client - Nome do cliente
 * @property {number} recency - Dias desde última compra
 * @property {number} frequency - Número de compras
 * @property {number} monetary - Valor total gasto
 * @property {number} recencyScore - Score de recência (1-5)
 * @property {number} frequencyScore - Score de frequência (1-5)
 * @property {number} monetaryScore - Score monetário (1-5)
 * @property {string} segment - Segmento RFM
 * @property {string} recommendation - Recomendação de ação
 */

export class RFMAnalyzer {
  constructor() {
    this.segments = {
      'Champions': { desc: 'Melhores clientes', color: '#10b981', priority: 1 },
      'Loyal Customers': { desc: 'Clientes fiéis', color: '#3b82f6', priority: 2 },
      'Potential Loyalists': { desc: 'Potencial de fidelização', color: '#8b5cf6', priority: 3 },
      'Recent Customers': { desc: 'Clientes recentes', color: '#06b6d4', priority: 4 },
      'Promising': { desc: 'Promissores', color: '#14b8a6', priority: 5 },
      'Needs Attention': { desc: 'Precisa atenção', color: '#f59e0b', priority: 6 },
      'About To Sleep': { desc: 'Prestes a perder', color: '#f97316', priority: 7 },
      'At Risk': { desc: 'Em risco', color: '#ef4444', priority: 8 },
      'Cannot Lose': { desc: 'Não pode perder', color: '#dc2626', priority: 9 },
      'Hibernating': { desc: 'Hibernando', color: '#64748b', priority: 10 },
      'Lost': { desc: 'Perdidos', color: '#475569', priority: 11 }
    };
  }

  /**
   * Realiza análise RFM completa
   * @param {Array<Object>} data - Dados
   * @param {Object} columnMetadata - Metadados
   * @returns {Object} Análise RFM
   */
  analyze(data, columnMetadata) {
    // Identificar colunas necessárias
    const clientCol = columnMetadata.find(col => col.type === 'CLIENT');
    const dateCol = columnMetadata.find(col => col.type === 'DATE');
    const valueCol = columnMetadata.find(col => 
      col.type === 'CURRENCY' && 
      (col.name.toLowerCase().includes('valor') || 
       col.name.toLowerCase().includes('receita') ||
       col.name.toLowerCase().includes('venda'))
    );

    if (!clientCol || !dateCol || !valueCol) {
      return {
        available: false,
        reason: 'Colunas necessárias não encontradas (Cliente, Data, Valor)'
      };
    }

    // Calcular RFM
    const rfmScores = this.calculateRFM(data, clientCol.name, dateCol.name, valueCol.name);

    // Segmentar clientes
    const segments = this.segmentClients(rfmScores);

    // Gerar insights
    const insights = this.generateRFMInsights(segments);

    // Calcular métricas agregadas
    const metrics = this.calculateRFMMetrics(rfmScores, segments);

    return {
      available: true,
      scores: rfmScores,
      segments: segments,
      insights: insights,
      metrics: metrics,
      columnUsed: {
        client: clientCol.name,
        date: dateCol.name,
        value: valueCol.name
      }
    };
  }

  /**
   * Calcula scores RFM
   */
  calculateRFM(data, clientCol, dateCol, valueCol) {
    const clientData = new Map();

    // Encontrar data mais recente
    const dates = data.map(row => this.parseDate(row[dateCol])).filter(d => d);
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Agregar dados por cliente
    data.forEach(row => {
      const client = row[clientCol];
      const date = this.parseDate(row[dateCol]);
      const value = parseFloat(row[valueCol]) || 0;

      if (!client || !date || value <= 0) return;

      if (!clientData.has(client)) {
        clientData.set(client, {
          lastPurchase: date,
          purchases: [],
          totalValue: 0
        });
      }

      const clientInfo = clientData.get(client);
      if (date > clientInfo.lastPurchase) {
        clientInfo.lastPurchase = date;
      }
      clientInfo.purchases.push({ date, value });
      clientInfo.totalValue += value;
    });

    // Calcular RFM para cada cliente
    const rfmScores = [];

    clientData.forEach((info, client) => {
      const recency = Math.floor((maxDate - info.lastPurchase) / (1000 * 60 * 60 * 24));
      const frequency = info.purchases.length;
      const monetary = info.totalValue;

      rfmScores.push({
        client,
        recency,
        frequency,
        monetary,
        lastPurchase: info.lastPurchase
      });
    });

    // Calcular scores (1-5)
    return this.assignScores(rfmScores);
  }

  /**
   * Atribui scores de 1-5 para cada métrica
   */
  assignScores(rfmData) {
    // Ordenar para criar quintis
    const sortedByRecency = [...rfmData].sort((a, b) => a.recency - b.recency);
    const sortedByFrequency = [...rfmData].sort((a, b) => b.frequency - a.frequency);
    const sortedByMonetary = [...rfmData].sort((a, b) => b.monetary - a.monetary);

    const quintileSize = Math.ceil(rfmData.length / 5);

    // Atribuir scores
    rfmData.forEach(item => {
      // Recency: menor é melhor (score 5)
      const recencyIndex = sortedByRecency.findIndex(x => x.client === item.client);
      item.recencyScore = 5 - Math.floor(recencyIndex / quintileSize);
      item.recencyScore = Math.max(1, Math.min(5, item.recencyScore));

      // Frequency: maior é melhor (score 5)
      const frequencyIndex = sortedByFrequency.findIndex(x => x.client === item.client);
      item.frequencyScore = Math.floor(frequencyIndex / quintileSize) + 1;
      item.frequencyScore = Math.max(1, Math.min(5, item.frequencyScore));

      // Monetary: maior é melhor (score 5)
      const monetaryIndex = sortedByMonetary.findIndex(x => x.client === item.client);
      item.monetaryScore = Math.floor(monetaryIndex / quintileSize) + 1;
      item.monetaryScore = Math.max(1, Math.min(5, item.monetaryScore));
    });

    return rfmData;
  }

  /**
   * Segmenta clientes baseado em scores RFM
   */
  segmentClients(rfmScores) {
    const segmented = new Map();

    rfmScores.forEach(score => {
      const segment = this.determineSegment(score);
      score.segment = segment;
      score.recommendation = this.getRecommendation(segment);

      if (!segmented.has(segment)) {
        segmented.set(segment, {
          name: segment,
          description: this.segments[segment].desc,
          color: this.segments[segment].color,
          priority: this.segments[segment].priority,
          clients: [],
          totalValue: 0,
          avgRecency: 0,
          avgFrequency: 0
        });
      }

      const segmentData = segmented.get(segment);
      segmentData.clients.push(score);
      segmentData.totalValue += score.monetary;
    });

    // Calcular médias
    segmented.forEach(segment => {
      const count = segment.clients.length;
      segment.avgRecency = segment.clients.reduce((sum, c) => sum + c.recency, 0) / count;
      segment.avgFrequency = segment.clients.reduce((sum, c) => sum + c.frequency, 0) / count;
      segment.count = count;
    });

    return Array.from(segmented.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Determina segmento baseado em scores RFM
   */
  determineSegment(score) {
    const { recencyScore: R, frequencyScore: F, monetaryScore: M } = score;

    // Champions
    if (R >= 4 && F >= 4 && M >= 4) return 'Champions';

    // Loyal Customers
    if (R >= 3 && F >= 4 && M >= 4) return 'Loyal Customers';

    // Potential Loyalists
    if (R >= 4 && F >= 2 && M >= 2) return 'Potential Loyalists';

    // Recent Customers
    if (R >= 4 && F <= 2) return 'Recent Customers';

    // Promising
    if (R >= 3 && F <= 2 && M <= 2) return 'Promising';

    // Needs Attention
    if (R >= 3 && F >= 3 && M >= 3) return 'Needs Attention';

    // About To Sleep
    if (R <= 3 && F <= 2) return 'About To Sleep';

    // At Risk
    if (R <= 2 && F >= 3 && M >= 3) return 'At Risk';

    // Cannot Lose
    if (R <= 2 && F >= 4 && M >= 4) return 'Cannot Lose';

    // Hibernating
    if (R <= 2 && F <= 2 && M >= 2) return 'Hibernating';

    // Lost
    return 'Lost';
  }

  /**
   * Retorna recomendação para cada segmento
   */
  getRecommendation(segment) {
    const recommendations = {
      'Champions': 'Recompense! Ofereça VIP, early access, pré-vendas',
      'Loyal Customers': 'Upsell produtos premium. Peça reviews e referências',
      'Potential Loyalists': 'Programa de fidelidade. Ofertas personalizadas',
      'Recent Customers': 'Onboarding forte. Segunda compra em até 30 dias',
      'Promising': 'Engajamento frequente. Ofertas especiais limitadas',
      'Needs Attention': 'Re-engajamento. Pesquisa de satisfação. Promoções',
      'About To Sleep': 'Promoções agressivas. Lembrete de benefícios',
      'At Risk': 'Recuperação urgente. Desconto especial. Contato direto',
      'Cannot Lose': 'Atenção VIP. Gestor de contas dedicado. Benefícios exclusivos',
      'Hibernating': 'Campanha de reativação. Ofertas irresistíveis',
      'Lost': 'Campanha win-back. Pesquisa de saída. Nova proposta de valor'
    };

    return recommendations[segment] || 'Monitorar comportamento';
  }

  /**
   * Gera insights da análise RFM
   */
  generateRFMInsights(segments) {
    const insights = [];
    const totalClients = segments.reduce((sum, s) => sum + s.count, 0);
    const totalValue = segments.reduce((sum, s) => sum + s.totalValue, 0);

    // Top 3 segmentos por valor
    const topByValue = [...segments]
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 3);

    insights.push({
      type: 'rfm_value',
      priority: 'ALTA',
      title: 'Distribuição de Valor por Segmento',
      description: `Top 3: ${topByValue.map(s => 
        `${s.name} (${((s.totalValue / totalValue) * 100).toFixed(1)}%)`
      ).join(', ')}`,
      action: `Foque em ${topByValue[0].name} - ${topByValue[0].description}`
    });

    // Clientes em risco
    const atRisk = segments.filter(s => 
      s.name === 'At Risk' || s.name === 'Cannot Lose' || s.name === 'About To Sleep'
    );

    if (atRisk.length > 0) {
      const riskCount = atRisk.reduce((sum, s) => sum + s.count, 0);
      const riskValue = atRisk.reduce((sum, s) => sum + s.totalValue, 0);

      insights.push({
        type: 'rfm_risk',
        priority: 'ALTA',
        title: `${riskCount} clientes em risco`,
        description: `Representam ${((riskValue / totalValue) * 100).toFixed(1)}% do valor total`,
        action: 'Campanha de retenção urgente necessária'
      });
    }

    // Champions
    const champions = segments.find(s => s.name === 'Champions');
    if (champions) {
      insights.push({
        type: 'rfm_champions',
        priority: 'MÉDIA',
        title: `${champions.count} Champions identificados`,
        description: `${((champions.count / totalClients) * 100).toFixed(1)}% da base - ${((champions.totalValue / totalValue) * 100).toFixed(1)}% do valor`,
        action: champions.recommendation
      });
    }

    // Novos clientes
    const newCustomers = segments.filter(s => 
      s.name === 'Recent Customers' || s.name === 'Promising'
    );

    if (newCustomers.length > 0) {
      const newCount = newCustomers.reduce((sum, s) => sum + s.count, 0);
      insights.push({
        type: 'rfm_new',
        priority: 'MÉDIA',
        title: `${newCount} novos clientes promissores`,
        description: 'Oportunidade de conversão em clientes fiéis',
        action: 'Implementar programa de onboarding e segunda compra'
      });
    }

    return insights;
  }

  /**
   * Calcula métricas agregadas RFM
   */
  calculateRFMMetrics(rfmScores, segments) {
    return {
      totalClients: rfmScores.length,
      avgRecency: rfmScores.reduce((sum, s) => sum + s.recency, 0) / rfmScores.length,
      avgFrequency: rfmScores.reduce((sum, s) => sum + s.frequency, 0) / rfmScores.length,
      avgMonetary: rfmScores.reduce((sum, s) => sum + s.monetary, 0) / rfmScores.length,
      segmentCount: segments.length,
      topSegment: segments[0]?.name,
      valueConcentration: segments[0] 
        ? (segments[0].totalValue / segments.reduce((sum, s) => sum + s.totalValue, 0) * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  /**
   * Parse de data
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    try {
      // Tentar vários formatos
      const formats = [
        /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
        /^(\d{4})-(\d{2})-(\d{2})$/,   // YYYY-MM-DD
        /^(\d{2})-(\d{2})-(\d{4})$/    // DD-MM-YYYY
      ];

      for (const format of formats) {
        const match = String(dateStr).match(format);
        if (match) {
          if (format === formats[1]) {
            // YYYY-MM-DD
            return new Date(match[1], match[2] - 1, match[3]);
          } else {
            // DD/MM/YYYY ou DD-MM-YYYY
            return new Date(match[3], match[2] - 1, match[1]);
          }
        }
      }

      // Tentar parse direto
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
}
