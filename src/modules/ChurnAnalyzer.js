/**
 * @fileoverview ChurnAnalyzer - Análise de Churn (Cancelamento/Abandono)
 * Prediz e identifica clientes em risco de churn
 */

/**
 * @typedef {Object} ChurnPrediction
 * @property {string} client - Cliente
 * @property {number} churnScore - Score de risco (0-100)
 * @property {string} riskLevel - Nível de risco
 * @property {Array<string>} indicators - Indicadores de churn
 * @property {string} recommendation - Recomendação de ação
 */

export class ChurnAnalyzer {
  constructor() {
    this.churnThresholds = {
      high: 70,
      medium: 40,
      low: 20
    };
  }

  /**
   * Analisa risco de churn
   * @param {Array<Object>} data - Dados
   * @param {Object} columnMetadata - Metadados
   * @returns {Object} Análise de churn
   */
  analyze(data, columnMetadata) {
    const clientCol = columnMetadata.find(col => col.type === 'CLIENT');
    const dateCol = columnMetadata.find(col => col.type === 'DATE');
    const valueCol = columnMetadata.find(col => 
      col.type === 'CURRENCY' && 
      (col.name.toLowerCase().includes('valor') || col.name.toLowerCase().includes('receita'))
    );

    if (!clientCol || !dateCol) {
      return {
        available: false,
        reason: 'Colunas de Cliente e Data são necessárias'
      };
    }

    // Calcular comportamento por cliente
    const clientBehavior = this.analyzeClientBehavior(data, clientCol.name, dateCol.name, valueCol?.name);

    // Calcular scores de churn
    const churnPredictions = this.calculateChurnScores(clientBehavior);

    // Identificar clientes em risco
    const atRisk = churnPredictions.filter(p => p.riskLevel === 'ALTO' || p.riskLevel === 'MÉDIO');

    // Gerar insights
    const insights = this.generateChurnInsights(churnPredictions, atRisk);

    // Métricas
    const metrics = this.calculateChurnMetrics(churnPredictions);

    return {
      available: true,
      predictions: churnPredictions,
      atRisk,
      insights,
      metrics,
      columnsUsed: {
        client: clientCol.name,
        date: dateCol.name,
        value: valueCol?.name
      }
    };
  }

  /**
   * Analisa comportamento de cada cliente
   */
  analyzeClientBehavior(data, clientCol, dateCol, valueCol) {
    const clientData = new Map();
    const now = new Date();

    data.forEach(row => {
      const client = row[clientCol];
      const date = this.parseDate(row[dateCol]);
      const value = valueCol ? (parseFloat(row[valueCol]) || 0) : 1;

      if (!client || !date) return;

      if (!clientData.has(client)) {
        clientData.set(client, {
          client,
          firstPurchase: date,
          lastPurchase: date,
          purchases: [],
          totalValue: 0,
          transactionCount: 0
        });
      }

      const info = clientData.get(client);
      info.purchases.push({ date, value });
      info.totalValue += value;
      info.transactionCount++;

      if (date < info.firstPurchase) info.firstPurchase = date;
      if (date > info.lastPurchase) info.lastPurchase = date;
    });

    // Calcular métricas adicionais
    clientData.forEach(info => {
      info.daysSinceLastPurchase = Math.floor((now - info.lastPurchase) / (1000 * 60 * 60 * 24));
      info.lifetimeDays = Math.floor((now - info.firstPurchase) / (1000 * 60 * 60 * 24));
      info.avgPurchaseValue = info.totalValue / info.transactionCount;
      info.purchaseFrequency = info.lifetimeDays > 0 ? info.transactionCount / (info.lifetimeDays / 30) : 0;

      // Calcular tendência de compra (últimos vs primeiros)
      const sortedPurchases = info.purchases.sort((a, b) => a.date - b.date);
      const halfPoint = Math.floor(sortedPurchases.length / 2);
      const firstHalf = sortedPurchases.slice(0, halfPoint);
      const secondHalf = sortedPurchases.slice(halfPoint);

      const avgFirst = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

      info.valueTrend = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;
    });

    return Array.from(clientData.values());
  }

  /**
   * Calcula score de churn para cada cliente
   */
  calculateChurnScores(clientBehavior) {
    const predictions = [];

    // Calcular médias globais para comparação
    const avgDaysSinceLastPurchase = this.average(clientBehavior.map(c => c.daysSinceLastPurchase));
    const avgPurchaseFrequency = this.average(clientBehavior.map(c => c.purchaseFrequency));
    const avgValue = this.average(clientBehavior.map(c => c.totalValue));

    clientBehavior.forEach(client => {
      let churnScore = 0;
      const indicators = [];

      // 1. Recência (peso: 40%)
      const recencyScore = Math.min(100, (client.daysSinceLastPurchase / avgDaysSinceLastPurchase) * 40);
      churnScore += recencyScore;
      
      if (client.daysSinceLastPurchase > avgDaysSinceLastPurchase * 2) {
        indicators.push('Muito tempo desde última compra');
      }

      // 2. Frequência (peso: 30%)
      const frequencyScore = Math.max(0, 30 - (client.purchaseFrequency / avgPurchaseFrequency) * 30);
      churnScore += frequencyScore;
      
      if (client.purchaseFrequency < avgPurchaseFrequency * 0.5) {
        indicators.push('Baixa frequência de compra');
      }

      // 3. Valor (peso: 20%)
      const valueScore = Math.max(0, 20 - (client.totalValue / avgValue) * 20);
      churnScore += valueScore;
      
      if (client.totalValue < avgValue * 0.3) {
        indicators.push('Baixo valor total');
      }

      // 4. Tendência (peso: 10%)
      if (client.valueTrend < -20) {
        churnScore += 10;
        indicators.push('Tendência de queda no valor');
      } else if (client.valueTrend < 0) {
        churnScore += 5;
      }

      // 5. Cliente novo inativo (risco especial)
      if (client.lifetimeDays < 90 && client.daysSinceLastPurchase > 30) {
        churnScore += 10;
        indicators.push('Cliente novo mas inativo');
      }

      // Normalizar score
      churnScore = Math.min(100, Math.max(0, churnScore));

      const riskLevel = this.getRiskLevel(churnScore);

      predictions.push({
        client: client.client,
        churnScore: Math.round(churnScore),
        riskLevel,
        indicators,
        recommendation: this.getChurnRecommendation(riskLevel, indicators),
        daysSinceLastPurchase: client.daysSinceLastPurchase,
        totalValue: client.totalValue,
        transactionCount: client.transactionCount
      });
    });

    return predictions.sort((a, b) => b.churnScore - a.churnScore);
  }

  /**
   * Determina nível de risco
   */
  getRiskLevel(score) {
    if (score >= this.churnThresholds.high) return 'ALTO';
    if (score >= this.churnThresholds.medium) return 'MÉDIO';
    if (score >= this.churnThresholds.low) return 'BAIXO';
    return 'MÍNIMO';
  }

  /**
   * Gera recomendação baseada em risco
   */
  getChurnRecommendation(riskLevel, indicators) {
    const recommendations = {
      'ALTO': 'URGENTE: Contato imediato + desconto especial + atenção VIP',
      'MÉDIO': 'Re-engajamento: Email personalizado + oferta exclusiva',
      'BAIXO': 'Monitoramento: Newsletter + novidades',
      'MÍNIMO': 'Manutenção: Continue o relacionamento normal'
    };

    let rec = recommendations[riskLevel];

    if (indicators.includes('Cliente novo mas inativo')) {
      rec += ' | Foque em onboarding';
    }

    return rec;
  }

  /**
   * Gera insights de churn
   */
  generateChurnInsights(predictions, atRisk) {
    const insights = [];

    const totalClients = predictions.length;
    const highRisk = predictions.filter(p => p.riskLevel === 'ALTO').length;
    const mediumRisk = predictions.filter(p => p.riskLevel === 'MÉDIO').length;

    // Risco alto
    if (highRisk > 0) {
      const pct = (highRisk / totalClients) * 100;
      const atRiskValue = atRisk
        .filter(p => p.riskLevel === 'ALTO')
        .reduce((sum, p) => sum + p.totalValue, 0);

      insights.push({
        type: 'churn_high_risk',
        priority: 'CRÍTICA',
        title: `${highRisk} cliente(s) em ALTO risco de churn (${pct.toFixed(1)}%)`,
        description: `Representam R$ ${atRiskValue.toFixed(2)} em valor total`,
        action: 'Campanha de retenção urgente necessária'
      });
    }

    // Indicador mais comum
    const indicatorCounts = new Map();
    atRisk.forEach(pred => {
      pred.indicators.forEach(ind => {
        indicatorCounts.set(ind, (indicatorCounts.get(ind) || 0) + 1);
      });
    });

    if (indicatorCounts.size > 0) {
      const topIndicator = Array.from(indicatorCounts.entries())
        .sort((a, b) => b[1] - a[1])[0];

      insights.push({
        type: 'churn_indicator',
        priority: 'ALTA',
        title: `Principal indicador: ${topIndicator[0]}`,
        description: `Afeta ${topIndicator[1]} cliente(s)`,
        action: 'Atue para resolver este problema específico'
      });
    }

    // Taxa de churn estimada
    const churnRate = ((highRisk + mediumRisk) / totalClients) * 100;
    insights.push({
      type: 'churn_rate',
      priority: churnRate > 30 ? 'ALTA' : 'MÉDIA',
      title: `Taxa de churn estimada: ${churnRate.toFixed(1)}%`,
      description: churnRate > 30 
        ? 'Taxa acima do aceitável'
        : churnRate > 15 
          ? 'Taxa moderada - monitorar'
          : 'Taxa saudável',
      action: churnRate > 30
        ? 'Revisão completa da estratégia de retenção'
        : 'Mantenha ações preventivas'
    });

    return insights;
  }

  /**
   * Calcula métricas de churn
   */
  calculateChurnMetrics(predictions) {
    const total = predictions.length;
    const byRisk = {
      high: predictions.filter(p => p.riskLevel === 'ALTO').length,
      medium: predictions.filter(p => p.riskLevel === 'MÉDIO').length,
      low: predictions.filter(p => p.riskLevel === 'BAIXO').length,
      minimum: predictions.filter(p => p.riskLevel === 'MÍNIMO').length
    };

    return {
      totalClients: total,
      highRiskCount: byRisk.high,
      highRiskPct: ((byRisk.high / total) * 100).toFixed(1) + '%',
      mediumRiskCount: byRisk.medium,
      mediumRiskPct: ((byRisk.medium / total) * 100).toFixed(1) + '%',
      churnRate: (((byRisk.high + byRisk.medium) / total) * 100).toFixed(1) + '%',
      avgChurnScore: this.average(predictions.map(p => p.churnScore)).toFixed(1)
    };
  }

  /**
   * Calcula média
   */
  average(arr) {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  /**
   * Parse de data
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    try {
      const formats = [
        /^(\d{2})\/(\d{2})\/(\d{4})$/,
        /^(\d{4})-(\d{2})-(\d{2})$/,
        /^(\d{2})-(\d{2})-(\d{4})$/
      ];

      for (const format of formats) {
        const match = String(dateStr).match(format);
        if (match) {
          if (format === formats[1]) {
            return new Date(match[1], match[2] - 1, match[3]);
          } else {
            return new Date(match[3], match[2] - 1, match[1]);
          }
        }
      }

      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
}
