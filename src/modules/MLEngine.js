/**
 * @fileoverview MLEngine - Motor de Machine Learning
 * Fornece previsões, clustering e análises preditivas
 */

import regression from 'regression';

/**
 * @typedef {Object} MLPrediction
 * @property {string} type - Tipo de predição
 * @property {Array<{date: string, predicted: number, confidence: number}>} predictions
 * @property {number} accuracy - Precisão do modelo (R²)
 * @property {string} method - Método utilizado
 */

/**
 * @typedef {Object} Cluster
 * @property {number} id - ID do cluster
 * @property {Array<Object>} members - Membros do cluster
 * @property {Object} centroid - Centro do cluster
 * @property {Array<string>} characteristics - Características principais
 */

export class MLEngine {
  constructor() {
    this.models = new Map();
  }

  /**
   * Realiza todas as análises de ML
   * @param {Array<Object>} data - Dados processados
   * @param {Object} columnMetadata - Metadados das colunas
   * @param {Object} analytics - Análises existentes
   * @returns {Object} Resultados de ML
   */
  analyzeAll(data, columnMetadata, analytics) {
    const results = {
      predictions: [],
      clusters: [],
      recommendations: [],
      riskScores: []
    };

    // 1. Previsões de série temporal
    if (analytics.monthlyData && analytics.monthlyData.length >= 3) {
      results.predictions.push(...this.predictRevenue(analytics.monthlyData));
    }

    // 2. Clustering de clientes/produtos
    const numericColumns = columnMetadata.filter(col => col.type === 'NUMBER' || col.type === 'CURRENCY');
    if (numericColumns.length >= 2 && data.length >= 10) {
      results.clusters = this.performClustering(data, numericColumns);
    }

    // 3. Análise de regressão múltipla
    const regressionResults = this.multipleRegression(data, columnMetadata);
    if (regressionResults) {
      results.regressionAnalysis = regressionResults;
    }

    // 4. Score de risco/oportunidade
    results.riskScores = this.calculateRiskScores(data, columnMetadata);

    // 5. Recomendações baseadas em padrões
    results.recommendations = this.generateMLRecommendations(results);

    return results;
  }

  /**
   * Previsão de receita usando regressão
   * @param {Array} monthlyData - Dados mensais
   * @returns {Array<MLPrediction>} Previsões
   */
  predictRevenue(monthlyData) {
    const predictions = [];

    try {
      // Preparar dados para regressão
      const dataPoints = monthlyData.map((item, index) => [index, item.revenue || 0]);

      // Tentar diferentes modelos
      const models = [
        { type: 'linear', name: 'Linear' },
        { type: 'exponential', name: 'Exponencial' },
        { type: 'polynomial', name: 'Polinomial', order: 2 }
      ];

      for (const model of models) {
        try {
          const result = model.order 
            ? regression[model.type](dataPoints, { order: model.order })
            : regression[model.type](dataPoints);

          // Prever próximos 3 meses
          const futurePredictions = [];
          const lastIndex = dataPoints.length - 1;

          for (let i = 1; i <= 3; i++) {
            const predicted = result.predict(lastIndex + i)[1];
            const confidence = Math.max(0, Math.min(100, result.r2 * 100));

            futurePredictions.push({
              month: `Mês +${i}`,
              predicted: Math.max(0, predicted),
              confidence: confidence
            });
          }

          predictions.push({
            type: 'revenue',
            method: model.name,
            predictions: futurePredictions,
            accuracy: result.r2,
            equation: result.string
          });
        } catch (error) {
          console.warn(`Modelo ${model.name} falhou:`, error.message);
        }
      }

      // Retornar o modelo com melhor R²
      return predictions.sort((a, b) => b.accuracy - a.accuracy).slice(0, 1);
    } catch (error) {
      console.error('Erro na previsão de receita:', error);
      return [];
    }
  }

  /**
   * Clustering K-means simplificado
   * @param {Array} data - Dados
   * @param {Array} numericColumns - Colunas numéricas
   * @returns {Array<Cluster>} Clusters
   */
  performClustering(data, numericColumns) {
    try {
      const k = Math.min(5, Math.ceil(data.length / 10)); // Número de clusters
      if (k < 2) return [];

      // Normalizar dados
      const normalized = this.normalizeData(data, numericColumns);
      
      // K-means
      const clusters = this.kMeans(normalized, k, numericColumns);

      // Adicionar características dos clusters
      return clusters.map((cluster, index) => {
        const characteristics = this.identifyClusterCharacteristics(
          cluster.members,
          numericColumns
        );

        return {
          id: index + 1,
          name: characteristics.name,
          members: cluster.members,
          centroid: cluster.centroid,
          characteristics: characteristics.traits,
          size: cluster.members.length,
          percentage: ((cluster.members.length / data.length) * 100).toFixed(1)
        };
      });
    } catch (error) {
      console.error('Erro no clustering:', error);
      return [];
    }
  }

  /**
   * Algoritmo K-means
   * @param {Array} data - Dados normalizados
   * @param {number} k - Número de clusters
   * @param {Array} columns - Colunas para clustering
   * @returns {Array} Clusters
   */
  kMeans(data, k, columns) {
    const maxIterations = 50;
    
    // Inicializar centroides aleatoriamente
    let centroids = this.initializeCentroids(data, k, columns);
    let clusters = [];
    let converged = false;
    let iteration = 0;

    while (!converged && iteration < maxIterations) {
      // Atribuir pontos aos clusters mais próximos
      clusters = Array.from({ length: k }, () => ({ members: [], centroid: null }));

      for (const point of data) {
        const nearestCluster = this.findNearestCentroid(point, centroids, columns);
        clusters[nearestCluster].members.push(point);
      }

      // Recalcular centroides
      const newCentroids = clusters.map(cluster => 
        this.calculateCentroid(cluster.members, columns)
      );

      // Verificar convergência
      converged = this.hasConverged(centroids, newCentroids, columns);
      centroids = newCentroids;
      iteration++;
    }

    // Atualizar centroides nos clusters
    clusters.forEach((cluster, index) => {
      cluster.centroid = centroids[index];
    });

    return clusters.filter(c => c.members.length > 0);
  }

  /**
   * Normaliza dados para ML
   * @param {Array} data - Dados
   * @param {Array} columns - Colunas
   * @returns {Array} Dados normalizados
   */
  normalizeData(data, columns) {
    const normalized = [];
    const stats = new Map();

    // Calcular min/max para cada coluna
    for (const col of columns) {
      const values = data.map(row => parseFloat(row[col.name]) || 0);
      stats.set(col.name, {
        min: Math.min(...values),
        max: Math.max(...values)
      });
    }

    // Normalizar (0-1)
    for (const row of data) {
      const normalizedRow = { ...row };
      for (const col of columns) {
        const value = parseFloat(row[col.name]) || 0;
        const { min, max } = stats.get(col.name);
        normalizedRow[`${col.name}_normalized`] = max > min ? (value - min) / (max - min) : 0;
      }
      normalized.push(normalizedRow);
    }

    return normalized;
  }

  /**
   * Inicializa centroides aleatoriamente
   */
  initializeCentroids(data, k, columns) {
    const centroids = [];
    const used = new Set();

    while (centroids.length < k && centroids.length < data.length) {
      const index = Math.floor(Math.random() * data.length);
      if (!used.has(index)) {
        const centroid = {};
        for (const col of columns) {
          centroid[col.name] = data[index][`${col.name}_normalized`] || 0;
        }
        centroids.push(centroid);
        used.add(index);
      }
    }

    return centroids;
  }

  /**
   * Encontra centroide mais próximo
   */
  findNearestCentroid(point, centroids, columns) {
    let minDistance = Infinity;
    let nearestIndex = 0;

    centroids.forEach((centroid, index) => {
      const distance = this.euclideanDistance(point, centroid, columns);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  /**
   * Calcula distância euclidiana
   */
  euclideanDistance(point1, point2, columns) {
    let sum = 0;
    for (const col of columns) {
      const val1 = point1[`${col.name}_normalized`] || 0;
      const val2 = point2[col.name] || 0;
      sum += Math.pow(val1 - val2, 2);
    }
    return Math.sqrt(sum);
  }

  /**
   * Calcula centroide de um cluster
   */
  calculateCentroid(members, columns) {
    if (members.length === 0) return {};

    const centroid = {};
    for (const col of columns) {
      const sum = members.reduce((acc, member) => 
        acc + (member[`${col.name}_normalized`] || 0), 0
      );
      centroid[col.name] = sum / members.length;
    }
    return centroid;
  }

  /**
   * Verifica convergência
   */
  hasConverged(oldCentroids, newCentroids, columns) {
    const threshold = 0.001;

    for (let i = 0; i < oldCentroids.length; i++) {
      const distance = this.euclideanDistance(
        { ...oldCentroids[i], ...Object.fromEntries(columns.map(c => [`${c.name}_normalized`, oldCentroids[i][c.name] || 0])) },
        newCentroids[i],
        columns
      );
      if (distance > threshold) return false;
    }

    return true;
  }

  /**
   * Identifica características do cluster
   */
  identifyClusterCharacteristics(members, columns) {
    if (members.length === 0) return { name: 'Cluster Vazio', traits: [] };

    const traits = [];
    const averages = {};

    // Calcular médias
    for (const col of columns) {
      const values = members.map(m => parseFloat(m[col.name]) || 0);
      averages[col.name] = values.reduce((a, b) => a + b, 0) / values.length;
    }

    // Determinar nome e características
    const sortedCols = Object.entries(averages).sort((a, b) => b[1] - a[1]);
    const topCol = sortedCols[0];

    let name = 'Cluster Padrão';
    
    if (topCol[1] > 1000) {
      name = 'Alto Valor';
      traits.push(`Média de ${topCol[0]}: ${topCol[1].toFixed(2)}`);
    } else if (topCol[1] > 500) {
      name = 'Médio Valor';
      traits.push(`Média de ${topCol[0]}: ${topCol[1].toFixed(2)}`);
    } else {
      name = 'Baixo Valor';
      traits.push(`Média de ${topCol[0]}: ${topCol[1].toFixed(2)}`);
    }

    // Adicionar características adicionais
    for (const [colName, avg] of sortedCols.slice(0, 3)) {
      traits.push(`${colName}: ${avg.toFixed(2)}`);
    }

    return { name, traits };
  }

  /**
   * Regressão múltipla
   */
  multipleRegression(data, columnMetadata) {
    try {
      const numericCols = columnMetadata.filter(col => 
        col.type === 'NUMBER' || col.type === 'CURRENCY'
      );

      if (numericCols.length < 2) return null;

      // Encontrar coluna dependente (valor, receita, etc)
      const dependentCol = numericCols.find(col => 
        col.name.toLowerCase().includes('valor') ||
        col.name.toLowerCase().includes('receita') ||
        col.name.toLowerCase().includes('venda')
      ) || numericCols[0];

      const independentCols = numericCols.filter(col => col.name !== dependentCol.name).slice(0, 3);

      if (independentCols.length === 0) return null;

      // Calcular correlações
      const correlations = independentCols.map(col => {
        const correlation = this.calculateCorrelation(
          data.map(row => parseFloat(row[col.name]) || 0),
          data.map(row => parseFloat(row[dependentCol.name]) || 0)
        );

        return {
          variable: col.name,
          correlation: correlation,
          strength: Math.abs(correlation)
        };
      }).sort((a, b) => b.strength - a.strength);

      return {
        dependent: dependentCol.name,
        independent: correlations.map(c => c.variable),
        correlations: correlations,
        topPredictor: correlations[0]
      };
    } catch (error) {
      console.error('Erro na regressão múltipla:', error);
      return null;
    }
  }

  /**
   * Calcula correlação de Pearson
   */
  calculateCorrelation(x, y) {
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
   * Calcula scores de risco
   */
  calculateRiskScores(data, columnMetadata) {
    const scores = [];

    try {
      // Análise de concentração de clientes
      const clientCol = columnMetadata.find(col => col.type === 'CLIENT');
      if (clientCol) {
        const clientCounts = new Map();
        let totalRevenue = 0;

        data.forEach(row => {
          const client = row[clientCol.name];
          const revenueCol = columnMetadata.find(col => 
            col.type === 'CURRENCY' && 
            (col.name.toLowerCase().includes('receita') || col.name.toLowerCase().includes('valor'))
          );
          
          if (client && revenueCol) {
            const revenue = parseFloat(row[revenueCol.name]) || 0;
            clientCounts.set(client, (clientCounts.get(client) || 0) + revenue);
            totalRevenue += revenue;
          }
        });

        // Calcular concentração
        const topClient = Array.from(clientCounts.entries())
          .sort((a, b) => b[1] - a[1])[0];

        if (topClient && totalRevenue > 0) {
          const concentration = (topClient[1] / totalRevenue) * 100;
          scores.push({
            type: 'client_concentration',
            score: concentration,
            risk: concentration > 30 ? 'ALTO' : concentration > 15 ? 'MÉDIO' : 'BAIXO',
            description: `Cliente "${topClient[0]}" representa ${concentration.toFixed(1)}% da receita`,
            recommendation: concentration > 30 
              ? 'Diversifique sua base de clientes para reduzir risco'
              : 'Concentração de clientes está saudável'
          });
        }
      }
    } catch (error) {
      console.error('Erro no cálculo de risk scores:', error);
    }

    return scores;
  }

  /**
   * Gera recomendações baseadas em ML
   */
  generateMLRecommendations(mlResults) {
    const recommendations = [];

    // Recomendações de previsões
    if (mlResults.predictions.length > 0) {
      const prediction = mlResults.predictions[0];
      const trend = prediction.predictions[2].predicted > prediction.predictions[0].predicted ? 'crescimento' : 'queda';
      
      recommendations.push({
        type: 'forecast',
        priority: prediction.accuracy > 0.8 ? 'ALTA' : 'MÉDIA',
        title: `Tendência de ${trend} identificada`,
        description: `Modelo ${prediction.method} prevê ${trend} nos próximos 3 meses`,
        confidence: (prediction.accuracy * 100).toFixed(1) + '%',
        action: trend === 'crescimento' 
          ? 'Prepare-se para aumento de demanda'
          : 'Revise estratégias para reverter queda'
      });
    }

    // Recomendações de clusters
    if (mlResults.clusters.length > 0) {
      const largestCluster = mlResults.clusters.sort((a, b) => b.size - a.size)[0];
      recommendations.push({
        type: 'segmentation',
        priority: 'MÉDIA',
        title: `${mlResults.clusters.length} segmentos identificados`,
        description: `Maior segmento: ${largestCluster.name} (${largestCluster.percentage}%)`,
        action: 'Personalize estratégias para cada segmento'
      });
    }

    // Recomendações de risco
    if (mlResults.riskScores.length > 0) {
      const highRisks = mlResults.riskScores.filter(r => r.risk === 'ALTO');
      if (highRisks.length > 0) {
        recommendations.push({
          type: 'risk',
          priority: 'ALTA',
          title: `${highRisks.length} risco(s) alto(s) detectado(s)`,
          description: highRisks[0].description,
          action: highRisks[0].recommendation
        });
      }
    }

    return recommendations;
  }
}
