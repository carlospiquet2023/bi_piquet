/**
 * @fileoverview TimeSeriesAnalyzer - Análise de Séries Temporais
 * Decomposição, sazonalidade, tendências e previsões
 */

/**
 * @typedef {Object} TimeSeriesDecomposition
 * @property {Array} trend - Componente de tendência
 * @property {Array} seasonal - Componente sazonal
 * @property {Array} residual - Resíduos
 */

export class TimeSeriesAnalyzer {
  /**
   * Analisa série temporal
   * @param {Array<Object>} data - Dados
   * @param {Object} columnMetadata - Metadados
   * @param {Object} analytics - Analytics existente
   * @returns {Object} Análise de série temporal
   */
  analyze(data, columnMetadata, analytics) {
    const dateCol = columnMetadata.find(col => col.type === 'DATE');
    const valueCol = columnMetadata.find(col => 
      col.type === 'CURRENCY' || col.type === 'NUMBER'
    );

    if (!dateCol || !valueCol) {
      return {
        available: false,
        reason: 'Colunas de Data e Valor necessárias'
      };
    }

    // Usar dados mensais do analytics se disponível
    const timeSeries = analytics.monthlyData && analytics.monthlyData.length > 0
      ? this.prepareFromMonthlyData(analytics.monthlyData)
      : this.prepareDailyData(data, dateCol.name, valueCol.name);

    if (timeSeries.length < 12) {
      return {
        available: false,
        reason: 'Mínimo de 12 períodos necessários para análise temporal'
      };
    }

    // Decomposição da série
    const decomposition = this.decomposeTimeSeries(timeSeries);

    // Análise de sazonalidade
    const seasonality = this.analyzeSeasonality(timeSeries);

    // Detecção de padrões
    const patterns = this.detectPatterns(timeSeries, decomposition);

    // Autocorrelação
    const autocorrelation = this.calculateAutocorrelation(timeSeries);

    // Gerar insights
    const insights = this.generateTimeSeriesInsights(decomposition, seasonality, patterns);

    // Métricas
    const metrics = this.calculateTimeSeriesMetrics(timeSeries, decomposition);

    return {
      available: true,
      series: timeSeries,
      decomposition,
      seasonality,
      patterns,
      autocorrelation,
      insights,
      metrics
    };
  }

  /**
   * Prepara dados de monthlyData
   */
  prepareFromMonthlyData(monthlyData) {
    return monthlyData.map((item, index) => ({
      period: index,
      value: item.revenue || item.value || 0,
      label: item.month || `Período ${index + 1}`
    }));
  }

  /**
   * Prepara dados diários/mensais
   */
  prepareDailyData(data, dateCol, valueCol) {
    const grouped = new Map();

    data.forEach(row => {
      const date = this.parseDate(row[dateCol]);
      const value = parseFloat(row[valueCol]) || 0;

      if (!date) return;

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, { sum: 0, count: 0 });
      }

      const monthData = grouped.get(monthKey);
      monthData.sum += value;
      monthData.count++;
    });

    const sorted = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return sorted.map(([monthKey, data], index) => ({
      period: index,
      value: data.sum,
      label: this.formatMonthKey(monthKey)
    }));
  }

  /**
   * Decomposição aditiva da série temporal
   */
  decomposeTimeSeries(series) {
    const n = series.length;
    const values = series.map(s => s.value);

    // Tendência (média móvel)
    const trend = this.calculateMovingAverage(values, Math.min(12, Math.floor(n / 2)));

    // Dessazonalizar
    const detrended = values.map((val, i) => val - (trend[i] || val));

    // Sazonalidade (média por período do ciclo)
    const seasonalPeriod = Math.min(12, n);
    const seasonal = this.calculateSeasonalComponent(detrended, seasonalPeriod);

    // Resíduos
    const residual = values.map((val, i) => 
      val - (trend[i] || 0) - (seasonal[i % seasonal.length] || 0)
    );

    return {
      trend: trend.map((val, i) => ({ period: i, value: val, label: series[i].label })),
      seasonal: seasonal.map((val, i) => ({ period: i, value: val })),
      residual: residual.map((val, i) => ({ period: i, value: val, label: series[i].label }))
    };
  }

  /**
   * Calcula média móvel
   */
  calculateMovingAverage(values, window) {
    const result = [];
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(values.length, i + Math.ceil(window / 2));
      const slice = values.slice(start, end);
      result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }

    return result;
  }

  /**
   * Calcula componente sazonal
   */
  calculateSeasonalComponent(detrended, period) {
    const seasonal = new Array(period).fill(0);
    const counts = new Array(period).fill(0);

    detrended.forEach((val, i) => {
      const seasonIndex = i % period;
      seasonal[seasonIndex] += val;
      counts[seasonIndex]++;
    });

    return seasonal.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 0);
  }

  /**
   * Analisa sazonalidade
   */
  analyzeSeasonality(series) {
    if (series.length < 12) return null;

    const values = series.map(s => s.value);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

    // Identificar meses de pico e vale
    const monthlyAvg = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);

    series.forEach((item, i) => {
      const monthIndex = i % 12;
      monthlyAvg[monthIndex] += item.value;
      monthlyCounts[monthIndex]++;
    });

    const seasonalPattern = monthlyAvg.map((sum, i) => {
      const avg = monthlyCounts[i] > 0 ? sum / monthlyCounts[i] : 0;
      return {
        month: this.getMonthName(i),
        avgValue: avg,
        indexValue: avgValue > 0 ? (avg / avgValue) * 100 : 100
      };
    });

    const peak = seasonalPattern.reduce((max, curr) => 
      curr.avgValue > max.avgValue ? curr : max
    );

    const valley = seasonalPattern.reduce((min, curr) => 
      curr.avgValue < min.avgValue ? curr : min
    );

    return {
      pattern: seasonalPattern,
      peakMonth: peak.month,
      peakValue: peak.avgValue,
      valleyMonth: valley.month,
      valleyValue: valley.avgValue,
      seasonalityStrength: ((peak.avgValue - valley.avgValue) / avgValue) * 100
    };
  }

  /**
   * Detecta padrões
   */
  detectPatterns(series, decomposition) {
    const patterns = [];

    // Tendência geral
    const trendValues = decomposition.trend.map(t => t.value).filter(v => v !== undefined);
    if (trendValues.length >= 2) {
      const firstHalf = trendValues.slice(0, Math.floor(trendValues.length / 2));
      const secondHalf = trendValues.slice(Math.floor(trendValues.length / 2));
      
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      const change = ((avgSecond - avgFirst) / avgFirst) * 100;

      if (Math.abs(change) > 10) {
        patterns.push({
          type: 'trend',
          description: change > 0 ? 'Tendência de crescimento' : 'Tendência de queda',
          magnitude: Math.abs(change).toFixed(1) + '%',
          confidence: 'ALTA'
        });
      }
    }

    // Volatilidade
    const values = series.map(s => s.value);
    const stdDev = this.standardDeviation(values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const cv = (stdDev / mean) * 100;

    patterns.push({
      type: 'volatility',
      description: cv > 30 ? 'Alta volatilidade' : cv > 15 ? 'Volatilidade moderada' : 'Baixa volatilidade',
      coefficient: cv.toFixed(1) + '%',
      confidence: 'ALTA'
    });

    // Ciclos
    const cycleLength = this.detectCycles(values);
    if (cycleLength > 0) {
      patterns.push({
        type: 'cycle',
        description: `Ciclo de ${cycleLength} períodos detectado`,
        length: cycleLength,
        confidence: 'MÉDIA'
      });
    }

    return patterns;
  }

  /**
   * Detecta ciclos na série
   */
  detectCycles(values) {
    // Implementação simplificada - procura periodicidade
    for (let period = 3; period <= Math.floor(values.length / 3); period++) {
      let correlation = 0;
      let count = 0;

      for (let i = 0; i < values.length - period; i++) {
        correlation += values[i] * values[i + period];
        count++;
      }

      const avgCorrelation = correlation / count;
      const variance = this.variance(values);

      if (avgCorrelation > variance * 0.7) {
        return period;
      }
    }

    return 0;
  }

  /**
   * Calcula autocorrelação
   */
  calculateAutocorrelation(series) {
    const values = series.map(s => s.value);
    const maxLag = Math.min(12, Math.floor(values.length / 3));
    const autocorr = [];

    for (let lag = 1; lag <= maxLag; lag++) {
      const corr = this.correlation(
        values.slice(0, -lag),
        values.slice(lag)
      );
      
      autocorr.push({
        lag,
        value: corr,
        significant: Math.abs(corr) > 0.3
      });
    }

    return autocorr;
  }

  /**
   * Calcula correlação entre duas séries
   */
  correlation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let num = 0, denomX = 0, denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denom = Math.sqrt(denomX * denomY);
    return denom === 0 ? 0 : num / denom;
  }

  /**
   * Gera insights de série temporal
   */
  generateTimeSeriesInsights(decomposition, seasonality, patterns) {
    const insights = [];

    // Tendência
    const trendPattern = patterns.find(p => p.type === 'trend');
    if (trendPattern) {
      insights.push({
        type: 'timeseries_trend',
        priority: 'ALTA',
        title: trendPattern.description,
        description: `Variação de ${trendPattern.magnitude}`,
        action: trendPattern.description.includes('crescimento')
          ? 'Capitalize na tendência positiva'
          : 'Implemente ações corretivas urgentes'
      });
    }

    // Sazonalidade
    if (seasonality && seasonality.seasonalityStrength > 20) {
      insights.push({
        type: 'timeseries_seasonality',
        priority: 'MÉDIA',
        title: `Sazonalidade forte detectada (${seasonality.seasonalityStrength.toFixed(1)}%)`,
        description: `Pico em ${seasonality.peakMonth}, vale em ${seasonality.valleyMonth}`,
        action: 'Prepare estoque e marketing para meses de pico'
      });
    }

    // Volatilidade
    const volatilityPattern = patterns.find(p => p.type === 'volatility');
    if (volatilityPattern && volatilityPattern.description.includes('Alta')) {
      insights.push({
        type: 'timeseries_volatility',
        priority: 'MÉDIA',
        title: volatilityPattern.description,
        description: `Coeficiente de variação: ${volatilityPattern.coefficient}`,
        action: 'Revisar estratégias para reduzir flutuações'
      });
    }

    return insights;
  }

  /**
   * Calcula métricas de série temporal
   */
  calculateTimeSeriesMetrics(series, decomposition) {
    const values = series.map(s => s.value);

    return {
      periods: series.length,
      mean: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      stdDev: this.standardDeviation(values).toFixed(2),
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      trendStrength: this.calculateTrendStrength(decomposition.trend),
      autocorrelationLag1: this.correlation(
        values.slice(0, -1),
        values.slice(1)
      ).toFixed(3)
    };
  }

  /**
   * Calcula força da tendência
   */
  calculateTrendStrength(trend) {
    const values = trend.map(t => t.value).filter(v => v !== undefined);
    if (values.length < 2) return '0%';

    const first = values[0];
    const last = values[values.length - 1];

    return first !== 0 ? (((last - first) / first) * 100).toFixed(1) + '%' : '0%';
  }

  /**
   * Desvio padrão
   */
  standardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Variância
   */
  variance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
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

  /**
   * Formata chave de mês
   */
  formatMonthKey(key) {
    const [year, month] = key.split('-');
    return `${month}/${year}`;
  }

  /**
   * Nome do mês
   */
  getMonthName(index) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[index];
  }
}
