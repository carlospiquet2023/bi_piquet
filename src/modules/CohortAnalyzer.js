/**
 * @fileoverview CohortAnalyzer - Análise de Coorte
 * Analisa comportamento e retenção por grupos de clientes ao longo do tempo
 */

/**
 * @typedef {Object} CohortData
 * @property {string} cohort - Nome da coorte (ex: "Jan/2024")
 * @property {number} size - Tamanho inicial da coorte
 * @property {Map<string, number>} retention - Taxa de retenção por período
 * @property {Map<string, number>} revenue - Receita por período
 */

export class CohortAnalyzer {
  /**
   * Analisa coortes de clientes
   * @param {Array<Object>} data - Dados
   * @param {Object} columnMetadata - Metadados
   * @returns {Object} Análise de coorte
   */
  analyze(data, columnMetadata) {
    // Identificar colunas necessárias
    const clientCol = columnMetadata.find(col => col.type === 'CLIENT');
    const dateCol = columnMetadata.find(col => col.type === 'DATE');
    const valueCol = columnMetadata.find(col => 
      col.type === 'CURRENCY' && 
      (col.name.toLowerCase().includes('valor') || 
       col.name.toLowerCase().includes('receita'))
    );

    if (!clientCol || !dateCol) {
      return {
        available: false,
        reason: 'Colunas de Cliente e Data são necessárias'
      };
    }

    // Construir coortes
    const cohorts = this.buildCohorts(data, clientCol.name, dateCol.name, valueCol?.name);

    // Calcular matriz de retenção
    const retentionMatrix = this.calculateRetentionMatrix(cohorts);

    // Calcular matriz de receita
    const revenueMatrix = valueCol ? this.calculateRevenueMatrix(cohorts) : null;

    // Gerar insights
    const insights = this.generateCohortInsights(cohorts, retentionMatrix, revenueMatrix);

    // Calcular métricas
    const metrics = this.calculateCohortMetrics(cohorts, retentionMatrix);

    return {
      available: true,
      cohorts: Array.from(cohorts.values()),
      retentionMatrix,
      revenueMatrix,
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
   * Constrói coortes baseadas na primeira compra do cliente
   */
  buildCohorts(data, clientCol, dateCol, valueCol) {
    const clientFirstPurchase = new Map();
    const cohorts = new Map();

    // Identificar primeira compra de cada cliente
    data.forEach(row => {
      const client = row[clientCol];
      const date = this.parseDate(row[dateCol]);

      if (!client || !date) return;

      const cohortKey = this.getCohortKey(date);

      if (!clientFirstPurchase.has(client)) {
        clientFirstPurchase.set(client, { date, cohortKey });
      } else {
        const existing = clientFirstPurchase.get(client);
        if (date < existing.date) {
          existing.date = date;
          existing.cohortKey = cohortKey;
        }
      }
    });

    // Organizar dados por coorte e período
    data.forEach(row => {
      const client = row[clientCol];
      const date = this.parseDate(row[dateCol]);
      const value = valueCol ? (parseFloat(row[valueCol]) || 0) : 1;

      if (!client || !date) return;

      const firstPurchase = clientFirstPurchase.get(client);
      if (!firstPurchase) return;

      const cohortKey = firstPurchase.cohortKey;
      const periodKey = this.getPeriodKey(firstPurchase.date, date);

      // Criar coorte se não existir
      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, {
          cohort: cohortKey,
          cohortDate: firstPurchase.date,
          clients: new Set(),
          periods: new Map()
        });
      }

      const cohort = cohorts.get(cohortKey);
      cohort.clients.add(client);

      // Adicionar ao período
      if (!cohort.periods.has(periodKey)) {
        cohort.periods.set(periodKey, {
          activeClients: new Set(),
          revenue: 0,
          transactions: 0
        });
      }

      const period = cohort.periods.get(periodKey);
      period.activeClients.add(client);
      period.revenue += value;
      period.transactions++;
    });

    // Converter Sets para tamanhos
    cohorts.forEach(cohort => {
      cohort.size = cohort.clients.size;
      cohort.periods.forEach(period => {
        period.activeCount = period.activeClients.size;
        period.retention = (period.activeCount / cohort.size) * 100;
      });
    });

    return cohorts;
  }

  /**
   * Calcula matriz de retenção
   */
  calculateRetentionMatrix(cohorts) {
    const matrix = [];
    const sortedCohorts = Array.from(cohorts.values())
      .sort((a, b) => a.cohortDate - b.cohortDate);

    // Determinar número máximo de períodos
    let maxPeriods = 0;
    sortedCohorts.forEach(cohort => {
      const periods = Array.from(cohort.periods.keys());
      maxPeriods = Math.max(maxPeriods, Math.max(...periods) + 1);
    });

    // Construir matriz
    sortedCohorts.forEach(cohort => {
      const row = {
        cohort: cohort.cohort,
        size: cohort.size,
        periods: []
      };

      for (let i = 0; i < maxPeriods; i++) {
        const period = cohort.periods.get(i);
        row.periods.push({
          period: i,
          activeClients: period?.activeCount || 0,
          retention: period?.retention || 0,
          transactions: period?.transactions || 0
        });
      }

      matrix.push(row);
    });

    return matrix;
  }

  /**
   * Calcula matriz de receita por coorte
   */
  calculateRevenueMatrix(cohorts) {
    const matrix = [];
    const sortedCohorts = Array.from(cohorts.values())
      .sort((a, b) => a.cohortDate - b.cohortDate);

    sortedCohorts.forEach(cohort => {
      const row = {
        cohort: cohort.cohort,
        periods: []
      };

      const periods = Array.from(cohort.periods.entries())
        .sort((a, b) => a[0] - b[0]);

      periods.forEach(([periodKey, period]) => {
        row.periods.push({
          period: periodKey,
          revenue: period.revenue,
          revenuePerClient: cohort.size > 0 ? period.revenue / cohort.size : 0,
          avgTransactionValue: period.transactions > 0 ? period.revenue / period.transactions : 0
        });
      });

      matrix.push(row);
    });

    return matrix;
  }

  /**
   * Gera insights da análise de coorte
   */
  generateCohortInsights(cohorts, retentionMatrix, revenueMatrix) {
    const insights = [];

    // Análise de retenção geral
    const avgRetentions = this.calculateAverageRetention(retentionMatrix);
    
    if (avgRetentions.length >= 2) {
      const period1 = avgRetentions[1] || 0;
      insights.push({
        type: 'cohort_retention',
        priority: period1 < 30 ? 'ALTA' : 'MÉDIA',
        title: `Retenção média no período 1: ${period1.toFixed(1)}%`,
        description: period1 < 30 
          ? 'Retenção baixa - risco de churn elevado'
          : period1 > 60 
            ? 'Excelente retenção de clientes'
            : 'Retenção moderada',
        action: period1 < 30 
          ? 'Implementar programa de engajamento imediato'
          : 'Manter estratégias de retenção atuais'
      });
    }

    // Tendência de retenção
    if (avgRetentions.length >= 3) {
      const trend = this.calculateRetentionTrend(avgRetentions);
      if (trend !== 'estável') {
        insights.push({
          type: 'cohort_trend',
          priority: trend === 'queda' ? 'ALTA' : 'MÉDIA',
          title: `Tendência de retenção: ${trend}`,
          description: `Retenção está em ${trend} ao longo dos períodos`,
          action: trend === 'queda'
            ? 'Revisar estratégias de engajamento e satisfação'
            : 'Potencializar ações que estão funcionando'
        });
      }
    }

    // Melhor coorte
    if (retentionMatrix.length > 1) {
      const bestCohort = this.findBestCohort(retentionMatrix);
      insights.push({
        type: 'cohort_best',
        priority: 'MÉDIA',
        title: `Melhor coorte: ${bestCohort.cohort}`,
        description: `Retenção de ${bestCohort.retention.toFixed(1)}% no período 1`,
        action: 'Analisar o que tornou esta coorte especial e replicar'
      });
    }

    // LTV por coorte (se tiver receita)
    if (revenueMatrix && revenueMatrix.length > 0) {
      const ltvInsight = this.analyzeLTV(revenueMatrix);
      if (ltvInsight) {
        insights.push(ltvInsight);
      }
    }

    return insights;
  }

  /**
   * Calcula retenção média por período
   */
  calculateAverageRetention(matrix) {
    if (matrix.length === 0) return [];

    const maxPeriods = Math.max(...matrix.map(row => row.periods.length));
    const avgRetentions = [];

    for (let i = 0; i < maxPeriods; i++) {
      const retentions = matrix
        .map(row => row.periods[i]?.retention)
        .filter(r => r !== undefined && r > 0);

      if (retentions.length > 0) {
        avgRetentions.push(
          retentions.reduce((sum, r) => sum + r, 0) / retentions.length
        );
      }
    }

    return avgRetentions;
  }

  /**
   * Calcula tendência de retenção
   */
  calculateRetentionTrend(retentions) {
    if (retentions.length < 3) return 'estável';

    // Comparar últimos períodos com primeiros
    const firstHalf = retentions.slice(1, Math.ceil(retentions.length / 2));
    const secondHalf = retentions.slice(Math.ceil(retentions.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (diff < -10) return 'queda';
    if (diff > 10) return 'crescimento';
    return 'estável';
  }

  /**
   * Encontra melhor coorte
   */
  findBestCohort(matrix) {
    return matrix
      .map(row => ({
        cohort: row.cohort,
        retention: row.periods[1]?.retention || 0
      }))
      .sort((a, b) => b.retention - a.retention)[0];
  }

  /**
   * Analisa LTV (Lifetime Value)
   */
  analyzeLTV(revenueMatrix) {
    const ltvByCohort = revenueMatrix.map(row => {
      const totalRevenue = row.periods.reduce((sum, p) => sum + p.revenue, 0);
      const clients = row.periods[0]?.activeClients || 1;
      
      return {
        cohort: row.cohort,
        ltv: totalRevenue / clients,
        totalRevenue
      };
    });

    const avgLTV = ltvByCohort.reduce((sum, c) => sum + c.ltv, 0) / ltvByCohort.length;
    const bestLTV = ltvByCohort.sort((a, b) => b.ltv - a.ltv)[0];

    return {
      type: 'cohort_ltv',
      priority: 'MÉDIA',
      title: `LTV médio: R$ ${avgLTV.toFixed(2)}`,
      description: `Melhor coorte: ${bestLTV.cohort} com LTV de R$ ${bestLTV.ltv.toFixed(2)}`,
      action: 'Foque em aumentar LTV através de upsell e retenção'
    };
  }

  /**
   * Calcula métricas de coorte
   */
  calculateCohortMetrics(cohorts, retentionMatrix) {
    const totalClients = Array.from(cohorts.values())
      .reduce((sum, c) => sum + c.size, 0);

    const avgRetentions = this.calculateAverageRetention(retentionMatrix);

    return {
      totalCohorts: cohorts.size,
      totalClients,
      avgCohortSize: totalClients / cohorts.size,
      avgRetentionPeriod1: avgRetentions[1] || 0,
      avgRetentionPeriod2: avgRetentions[2] || 0,
      avgRetentionPeriod3: avgRetentions[3] || 0,
      retentionTrend: this.calculateRetentionTrend(avgRetentions)
    };
  }

  /**
   * Obtém chave da coorte (mês/ano da primeira compra)
   */
  getCohortKey(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
  }

  /**
   * Calcula período desde a primeira compra
   */
  getPeriodKey(firstDate, currentDate) {
    const months = (currentDate.getFullYear() - firstDate.getFullYear()) * 12 +
                   (currentDate.getMonth() - firstDate.getMonth());
    return Math.max(0, months);
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
