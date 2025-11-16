/**
 * Gerador de Insights com IA
 * Responsável por:
 * - Identificar padrões e anomalias
 * - Gerar insights estratégicos
 * - Detectar tendências
 * - Criar alertas e oportunidades
 */

import { InsightType } from '../types/enums.js';

export class InsightsGenerator {
  constructor(data, columnMetadata, analytics) {
    this.data = data;
    this.columnMetadata = columnMetadata;
    this.analytics = analytics;
    this.insights = [];
  }

  /**
   * Gera todos os insights
   * @returns {Array} Lista de insights
   */
  generateAll() {
    this.insights = [];
    
    // Insights de tendência
    this.analyzeTrends();
    
    // Insights de anomalias
    this.detectAnomalies();
    
    // Insights de performance
    this.analyzePerformance();
    
    // Insights de oportunidades
    this.identifyOpportunities();
    
    // Insights de alertas
    this.generateAlerts();
    
    // Ordenar por relevância
    this.insights.sort((a, b) => b.relevance - a.relevance);
    
    return this.insights;
  }

  /**
   * Analisa tendências
   */
  analyzeTrends() {
    // Tendência mensal
    if (this.analytics.trends.monthly) {
      const trend = this.analytics.trends.monthly;
      const changeValue = parseFloat(trend.change);
      
      if (Math.abs(changeValue) > 10) {
        this.addInsight({
          type: InsightType.TREND,
          title: changeValue > 0 ? '📈 Tendência de Crescimento' : '📉 Tendência de Queda',
          description: `${trend.description} de ${Math.abs(changeValue).toFixed(1)}% em relação ao mês anterior. ${
            changeValue > 0 
              ? 'O negócio está em trajetória positiva!'
              : 'Atenção: pode ser necessário revisar estratégias.'
          }`,
          relevance: Math.min(90, 50 + Math.abs(changeValue)),
          severity: changeValue > 0 ? 'success' : changeValue < -20 ? 'critical' : 'warning',
          data: { change: changeValue, direction: trend.direction },
        });
      }
    }
    
    // Sazonalidade
    if (this.analytics.groupings.monthly && this.analytics.groupings.monthly.length >= 6) {
      const seasonality = this.detectSeasonality();
      if (seasonality) {
        this.addInsight({
          type: InsightType.TREND,
          title: '📅 Padrão Sazonal Detectado',
          description: seasonality.description,
          relevance: 70,
          severity: 'info',
          data: seasonality,
        });
      }
    }
  }

  /**
   * Detecta anomalias
   */
  detectAnomalies() {
    // Verificar valores extremos
    const currencyColumns = this.columnMetadata.filter(c => c.type === 'currency');
    
    currencyColumns.forEach(column => {
      if (column.mean && column.stdDev) {
        const threshold = column.mean + (3 * column.stdDev);
        const outliers = this.data.filter(row => {
          const value = this.parseNumber(row[column.name]);
          return value > threshold;
        });
        
        if (outliers.length > 0) {
          this.addInsight({
            type: InsightType.ANOMALY,
            title: '⚡ Valores Atípicos Detectados',
            description: `Encontrados ${outliers.length} registro(s) com valores muito acima da média em "${column.name}". Verifique se são transações especiais ou erros.`,
            relevance: 75,
            severity: 'warning',
            data: { column: column.name, count: outliers.length, threshold },
          });
        }
      }
    });
    
    // Detectar quedas bruscas
    if (this.analytics.groupings.monthly && this.analytics.groupings.monthly.length > 1) {
      const monthly = this.analytics.groupings.monthly;
      for (let i = 1; i < monthly.length; i++) {
        const current = monthly[i].total;
        const previous = monthly[i - 1].total;
        const drop = ((current - previous) / previous) * 100;
        
        if (drop < -30) {
          this.addInsight({
            type: InsightType.ANOMALY,
            title: '🔴 Queda Brusca Detectada',
            description: `Em ${monthly[i].label}, houve uma queda de ${Math.abs(drop).toFixed(1)}% em relação ao mês anterior. Investigação recomendada.`,
            relevance: 95,
            severity: 'critical',
            data: { month: monthly[i].label, drop: drop.toFixed(1) },
          });
        }
      }
    }
  }

  /**
   * Analisa performance
   */
  analyzePerformance() {
    // Produto campeão
    const topProduct = this.analytics.kpis.find(k => k.id === 'top_product');
    if (topProduct && this.analytics.groupings.byProduct) {
      const topShare = (topProduct.subValue.match(/\d+/)[0] / this.data.length) * 100;
      
      if (topShare > 20) {
        this.addInsight({
          type: InsightType.RANKING,
          title: '🏆 Produto Dominante',
          description: `"${topProduct.value}" representa ${topShare.toFixed(1)}% das vendas. É o carro-chefe do negócio!`,
          relevance: 80,
          severity: 'success',
          data: { product: topProduct.value, share: topShare },
        });
      }
    }
    
    // Concentração de clientes/funcionários
    if (this.analytics.groupings.byCategory) {
      const top3 = this.analytics.groupings.byCategory.slice(0, 3);
      const top3Total = top3.reduce((sum, item) => sum + item.total, 0);
      const totalSum = this.analytics.groupings.byCategory.reduce((sum, item) => sum + item.total, 0);
      const concentration = (top3Total / totalSum) * 100;
      
      if (concentration > 70) {
        this.addInsight({
          type: InsightType.COMPARISON,
          title: '📊 Alta Concentração',
          description: `As 3 principais categorias representam ${concentration.toFixed(1)}% do total. Considere diversificar para reduzir riscos.`,
          relevance: 65,
          severity: 'warning',
          data: { concentration, top3: top3.map(t => t.label) },
        });
      }
    }
  }

  /**
   * Identifica oportunidades
   */
  identifyOpportunities() {
    // Produtos com baixa penetração mas alto valor
    if (this.analytics.groupings.byProduct) {
      const products = this.analytics.groupings.byProduct;
      const avgCount = products.reduce((sum, p) => sum + p.count, 0) / products.length;
      
      const opportunities = products.filter(p => 
        p.count < avgCount && p.average > products[0].average * 0.7
      );
      
      if (opportunities.length > 0) {
        this.addInsight({
          type: InsightType.OPPORTUNITY,
          title: '💡 Oportunidade de Crescimento',
          description: `Produtos como "${opportunities[0].label}" têm alto valor médio mas baixo volume. Invista em marketing para aumentar vendas!`,
          relevance: 70,
          severity: 'info',
          data: { products: opportunities.slice(0, 3).map(p => p.label) },
        });
      }
    }
    
    // Meses com performance abaixo da média
    if (this.analytics.groupings.monthly && this.analytics.groupings.monthly.length >= 3) {
      const monthly = this.analytics.groupings.monthly;
      const avgTotal = monthly.reduce((sum, m) => sum + m.total, 0) / monthly.length;
      
      const underperforming = monthly.filter(m => m.total < avgTotal * 0.8);
      
      if (underperforming.length > 0) {
        this.addInsight({
          type: InsightType.OPPORTUNITY,
          title: '🎯 Oportunidade de Melhoria',
          description: `Meses como ${underperforming.map(m => m.label).join(', ')} tiveram performance abaixo da média. Planeje ações especiais para esses períodos.`,
          relevance: 60,
          severity: 'info',
          data: { months: underperforming.map(m => m.label) },
        });
      }
    }
  }

  /**
   * Gera alertas
   */
  generateAlerts() {
    // Alerta de prejuízo
    const profitKPI = this.analytics.kpis.find(k => k.id === 'profit');
    if (profitKPI && profitKPI.rawValue < 0) {
      this.addInsight({
        type: InsightType.ALERT,
        title: '⚠️ Atenção: Prejuízo',
        description: `O resultado está negativo em ${profitKPI.value}. Ação imediata necessária para reverter o cenário.`,
        relevance: 100,
        severity: 'critical',
        data: { profit: profitKPI.rawValue },
      });
    }
    
    // Alerta de dados incompletos
    const highNullColumns = this.columnMetadata.filter(c => c.nullPercentage > 30);
    if (highNullColumns.length > 0) {
      this.addInsight({
        type: InsightType.ALERT,
        title: '⚠️ Dados Incompletos',
        description: `${highNullColumns.length} coluna(s) com mais de 30% de valores vazios: ${highNullColumns.map(c => c.name).join(', ')}. Isso pode afetar a qualidade das análises.`,
        relevance: 55,
        severity: 'warning',
        data: { columns: highNullColumns.map(c => c.name) },
      });
    }
    
    // Alerta de margem apertada
    const revenueKPI = this.analytics.kpis.find(k => k.id === 'total_revenue');
    const expenseKPI = this.analytics.kpis.find(k => k.id === 'total_expense');
    
    if (revenueKPI && expenseKPI) {
      const margin = ((revenueKPI.rawValue - expenseKPI.rawValue) / revenueKPI.rawValue) * 100;
      
      if (margin < 20 && margin > 0) {
        this.addInsight({
          type: InsightType.ALERT,
          title: '📉 Margem Apertada',
          description: `A margem de lucro está em ${margin.toFixed(1)}%. Considere reduzir custos ou aumentar preços.`,
          relevance: 85,
          severity: 'warning',
          data: { margin: margin.toFixed(1) },
        });
      }
    }
  }

  /**
   * Detecta sazonalidade
   */
  detectSeasonality() {
    const monthly = this.analytics.groupings.monthly;
    if (!monthly || monthly.length < 6) return null;
    
    // Simples detecção: verificar se há padrão de alta/baixa
    const values = monthly.map(m => m.total);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    const highMonths = [];
    const lowMonths = [];
    
    monthly.forEach((m) => {
      if (m.total > avg * 1.2) highMonths.push(m.label);
      if (m.total < avg * 0.8) lowMonths.push(m.label);
    });
    
    if (highMonths.length > 0 || lowMonths.length > 0) {
      return {
        description: `Padrão identificado: ${
          highMonths.length > 0 
            ? `meses de pico em ${highMonths.join(', ')}.` 
            : ''
        } ${
          lowMonths.length > 0 
            ? `Períodos mais fracos em ${lowMonths.join(', ')}.` 
            : ''
        } Use isso para planejar estoque e marketing.`,
        highMonths,
        lowMonths,
      };
    }
    
    return null;
  }

  /**
   * Adiciona um insight
   */
  addInsight(insight) {
    this.insights.push({
      id: `insight-${this.insights.length + 1}`,
      timestamp: new Date(),
      ...insight,
    });
  }

  /**
   * Parse número
   */
  parseNumber(value) {
    if (value === null || value === '') return null;
    const cleaned = String(value).replace(/[R$,%\s]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
}
