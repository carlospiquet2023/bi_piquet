/**
 * @fileoverview CorrelationAnalyzer - Análise de Correlações
 * Detecta relações estatísticas entre variáveis numéricas
 */

/**
 * @typedef {Object} Correlation
 * @property {string} variable1 - Primeira variável
 * @property {string} variable2 - Segunda variável
 * @property {number} coefficient - Coeficiente de correlação (-1 a 1)
 * @property {string} strength - Força da correlação
 * @property {string} direction - Direção (positiva/negativa)
 * @property {number} pValue - Valor p (significância estatística)
 */

export class CorrelationAnalyzer {
  /**
   * Analisa correlações entre variáveis numéricas
   * @param {Array<Object>} data - Dados
   * @param {Object} columnMetadata - Metadados
   * @returns {Object} Análise de correlações
   */
  analyze(data, columnMetadata) {
    // Filtrar colunas numéricas
    const numericColumns = columnMetadata.filter(col => 
      col.type === 'NUMBER' || col.type === 'CURRENCY'
    );

    if (numericColumns.length < 2) {
      return {
        available: false,
        reason: 'Mínimo de 2 colunas numéricas necessárias'
      };
    }

    // Calcular matriz de correlação
    const correlationMatrix = this.calculateCorrelationMatrix(data, numericColumns);

    // Identificar correlações significativas
    const significantCorrelations = this.findSignificantCorrelations(correlationMatrix);

    // Gerar insights
    const insights = this.generateCorrelationInsights(significantCorrelations);

    // Preparar dados para visualização
    const heatmapData = this.prepareHeatmapData(correlationMatrix, numericColumns);

    return {
      available: true,
      matrix: correlationMatrix,
      significant: significantCorrelations,
      insights,
      heatmapData,
      columnsAnalyzed: numericColumns.map(c => c.name)
    };
  }

  /**
   * Calcula matriz de correlação completa
   */
  calculateCorrelationMatrix(data, numericColumns) {
    const matrix = [];

    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];

        const values1 = data.map(row => parseFloat(row[col1.name]) || 0);
        const values2 = data.map(row => parseFloat(row[col2.name]) || 0);

        const correlation = this.pearsonCorrelation(values1, values2);
        
        if (!isNaN(correlation)) {
          matrix.push({
            variable1: col1.name,
            variable2: col2.name,
            coefficient: correlation,
            strength: this.getCorrelationStrength(correlation),
            direction: correlation >= 0 ? 'positiva' : 'negativa',
            pValue: this.calculatePValue(correlation, data.length)
          });
        }
      }
    }

    return matrix.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
  }

  /**
   * Calcula correlação de Pearson
   */
  pearsonCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX * denomY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Determina força da correlação
   */
  getCorrelationStrength(coefficient) {
    const abs = Math.abs(coefficient);
    
    if (abs >= 0.9) return 'Muito Forte';
    if (abs >= 0.7) return 'Forte';
    if (abs >= 0.5) return 'Moderada';
    if (abs >= 0.3) return 'Fraca';
    return 'Muito Fraca';
  }

  /**
   * Calcula valor p aproximado
   */
  calculatePValue(r, n) {
    if (n < 3) return 1;

    // Teste t para correlação
    const t = r * Math.sqrt(n - 2) / Math.sqrt(1 - r * r);
    
    // Aproximação do p-value (simplificada)
    const absT = Math.abs(t);
    if (absT > 2.576) return 0.01;  // p < 0.01
    if (absT > 1.96) return 0.05;   // p < 0.05
    if (absT > 1.645) return 0.1;   // p < 0.1
    return 0.2;
  }

  /**
   * Identifica correlações estatisticamente significativas
   */
  findSignificantCorrelations(matrix) {
    return matrix.filter(corr => 
      Math.abs(corr.coefficient) >= 0.3 && corr.pValue <= 0.05
    );
  }

  /**
   * Gera insights baseados em correlações
   */
  generateCorrelationInsights(correlations) {
    const insights = [];

    // Top 3 correlações mais fortes
    const top3 = correlations.slice(0, 3);
    
    top3.forEach((corr, index) => {
      const direction = corr.direction === 'positiva' ? 'aumenta' : 'diminui';
      
      insights.push({
        type: 'correlation',
        priority: index === 0 ? 'ALTA' : 'MÉDIA',
        title: `Correlação ${corr.strength}: ${corr.variable1} e ${corr.variable2}`,
        description: `Quando ${corr.variable1} aumenta, ${corr.variable2} ${direction} (r=${corr.coefficient.toFixed(3)})`,
        action: `Use ${corr.variable1} como indicador preditivo de ${corr.variable2}`,
        confidence: `p-value: ${corr.pValue}`
      });
    });

    // Alertar sobre correlações negativas fortes
    const strongNegative = correlations.filter(c => c.coefficient < -0.7);
    
    if (strongNegative.length > 0) {
      insights.push({
        type: 'negative_correlation',
        priority: 'ALTA',
        title: `${strongNegative.length} correlação(ões) negativa(s) forte(s)`,
        description: `${strongNegative[0].variable1} e ${strongNegative[0].variable2} são inversamente relacionados`,
        action: 'Analise trade-offs entre estas variáveis nas decisões estratégicas'
      });
    }

    // Correlações positivas fortes (oportunidades)
    const strongPositive = correlations.filter(c => c.coefficient > 0.7);
    
    if (strongPositive.length > 0) {
      insights.push({
        type: 'positive_correlation',
        priority: 'MÉDIA',
        title: `${strongPositive.length} correlação(ões) positiva(s) forte(s)`,
        description: 'Variáveis que se movem juntas podem ser otimizadas simultaneamente',
        action: 'Crie estratégias combinadas para estas variáveis'
      });
    }

    return insights;
  }

  /**
   * Prepara dados para heatmap de correlação
   */
  prepareHeatmapData(matrix, columns) {
    const size = columns.length;
    const heatmap = Array(size).fill(null).map(() => Array(size).fill(0));

    // Diagonal = 1 (correlação com si mesmo)
    for (let i = 0; i < size; i++) {
      heatmap[i][i] = 1;
    }

    // Preencher matriz simétrica
    matrix.forEach(corr => {
      const i = columns.findIndex(c => c.name === corr.variable1);
      const j = columns.findIndex(c => c.name === corr.variable2);

      if (i !== -1 && j !== -1) {
        heatmap[i][j] = corr.coefficient;
        heatmap[j][i] = corr.coefficient;
      }
    });

    return {
      labels: columns.map(c => c.name),
      data: heatmap
    };
  }

  /**
   * Calcula correlação de Spearman (para dados não-lineares)
   */
  spearmanCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    // Converter para ranks
    const ranksX = this.getRanks(x);
    const ranksY = this.getRanks(y);

    // Aplicar Pearson nos ranks
    return this.pearsonCorrelation(ranksX, ranksY);
  }

  /**
   * Converte valores para ranks
   */
  getRanks(values) {
    const indexed = values.map((value, index) => ({ value, index }));
    indexed.sort((a, b) => a.value - b.value);

    const ranks = new Array(values.length);
    indexed.forEach((item, rank) => {
      ranks[item.index] = rank + 1;
    });

    return ranks;
  }
}
