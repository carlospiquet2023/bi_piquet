/**
 * @fileoverview AdvancedChartsHelper - Gr\u00e1ficos Avan\u00e7ados
 * Heatmaps, Scatter plots, Radar charts, Funnel charts
 */

import { Chart } from 'chart.js';

export class AdvancedChartsHelper {
  /**
   * Cria heatmap de correla\u00e7\u00e3o
   * @param {Object} correlationData - Dados de correla\u00e7\u00e3o
   * @param {string} canvasId - ID do canvas
   * @returns {Chart} Inst\u00e2ncia do gr\u00e1fico
   */
  static createCorrelationHeatmap(correlationData, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const { labels, data } = correlationData.heatmapData;

    // Preparar dados para heatmap
    const datasets = data.map((row, rowIndex) => ({
      label: labels[rowIndex],
      data: row.map((value, colIndex) => ({
        x: labels[colIndex],
        y: labels[rowIndex],
        v: value
      })),
      backgroundColor: row.map(value => this.getHeatmapColor(value))
    }));

    return new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Matriz de Correla\u00e7\u00e3o',
            font: { size: 16 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw.v;
                return `Correla\u00e7\u00e3o: ${value.toFixed(3)}`;
              }
            }
          }
        },
        scales: {
          x: { type: 'category', position: 'bottom' },
          y: { type: 'category', position: 'left' }
        }
      }
    });
  }

  /**
   * Cria scatter plot para correla\u00e7\u00f5es
   * @param {Array} data - Dados
   * @param {string} xField - Campo X
   * @param {string} yField - Campo Y
   * @param {string} canvasId - ID do canvas
   * @returns {Chart} Inst\u00e2ncia do gr\u00e1fico
   */
  static createScatterPlot(data, xField, yField, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const scatterData = data.map(row => ({
      x: parseFloat(row[xField]) || 0,
      y: parseFloat(row[yField]) || 0
    }));

    return new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${yField} vs ${xField}`,
          data: scatterData,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Dispersão: ${yField} vs ${xField}`,
            font: { size: 16 }
          },
          legend: { display: false }
        },
        scales: {
          x: { title: { display: true, text: xField } },
          y: { title: { display: true, text: yField } }
        }
      }
    });
  }

  /**
   * Cria radar chart para RFM
   * @param {Object} rfmData - Dados RFM
   * @param {string} canvasId - ID do canvas
   * @returns {Chart} Inst\u00e2ncia do gr\u00e1fico
   */
  static createRFMRadarChart(rfmData, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Top 5 clientes por score RFM
    const topClients = rfmData.scores.slice(0, 5);

    const datasets = topClients.map((client, index) => ({
      label: client.client,
      data: [client.recencyScore, client.frequencyScore, client.monetaryScore],
      borderColor: this.getColorByIndex(index),
      backgroundColor: this.getColorByIndex(index, 0.2),
      pointBackgroundColor: this.getColorByIndex(index)
    }));

    return new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Recência', 'Frequência', 'Valor Monetário'],
        datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Análise RFM - Top 5 Clientes',
            font: { size: 16 }
          }
        },
        scales: {
          r: {
            min: 0,
            max: 5,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  /**
   * Cria funnel chart para conversão
   * @param {Array} funnelData - Dados do funil
   * @param {string} canvasId - ID do canvas
   * @returns {Chart} Inst\u00e2ncia do gr\u00e1fico
   */
  static createFunnelChart(funnelData, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: funnelData.map(stage => stage.label),
        datasets: [{
          label: 'Conversão',
          data: funnelData.map(stage => stage.value),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ]
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Funil de Conversão',
            font: { size: 16 }
          },
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Cria gr\u00e1fico de coorte (retenção)
   * @param {Object} cohortData - Dados de coorte
   * @param {string} canvasId - ID do canvas
   * @returns {Chart} Inst\u00e2ncia do gr\u00e1fico
   */
  static createCohortRetentionChart(cohortData, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const matrix = cohortData.retentionMatrix;
    
    const datasets = matrix.map((row, index) => ({
      label: row.cohort,
      data: row.periods.map(p => p.retention),
      borderColor: this.getColorByIndex(index),
      backgroundColor: this.getColorByIndex(index, 0.1),
      fill: false,
      tension: 0.4
    }));

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: matrix[0].periods.map((_, i) => `Período ${i}`),
        datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Retenção por Coorte (%)',
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Taxa de Retenção (%)' }
          },
          x: {
            title: { display: true, text: 'Período desde Primeira Compra' }
          }
        }
      }
    });
  }

  /**
   * Cria gr\u00e1fico de segmentos RFM
   * @param {Object} rfmData - Dados RFM
   * @param {string} canvasId - ID do canvas
   * @returns {Chart} Inst\u00e2ncia do gr\u00e1fico
   */
  static createRFMSegmentsChart(rfmData, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: rfmData.segments.map(s => s.name),
        datasets: [{
          data: rfmData.segments.map(s => s.count),
          backgroundColor: rfmData.segments.map(s => s.color)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Distribuição de Segmentos RFM',
            font: { size: 16 }
          },
          legend: {
            position: 'right',
            labels: {
              generateLabels: (chart) => {
                const data = chart.data;
                return data.labels.map((label, i) => ({
                  text: `${label} (${data.datasets[0].data[i]})`,
                  fillStyle: data.datasets[0].backgroundColor[i]
                }));
              }
            }
          }
        }
      }
    });
  }

  /**
   * Cria gr\u00e1fico de churn score
   * @param {Object} churnData - Dados de churn
   * @param {string} canvasId - ID do canvas
   * @returns {Chart} Inst\u00e2ncia do gr\u00e1fico
   */
  static createChurnScoreChart(churnData, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Top 10 clientes em risco
    const topRisk = churnData.predictions.slice(0, 10);

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topRisk.map(p => p.client),
        datasets: [{
          label: 'Score de Churn',
          data: topRisk.map(p => p.churnScore),
          backgroundColor: topRisk.map(p => {
            if (p.riskLevel === 'ALTO') return 'rgba(220, 38, 38, 0.7)';
            if (p.riskLevel === 'MÉDIO') return 'rgba(251, 146, 60, 0.7)';
            return 'rgba(250, 204, 21, 0.7)';
          })
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Top 10 Clientes em Risco de Churn',
            font: { size: 16 }
          },
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Score de Churn' }
          }
        }
      }
    });
  }

  /**
   * Cria mapa geográfico (simplificado com barras)
   * @param {Object} geoData - Dados geográficos
   * @param {string} canvasId - ID do canvas
   * @returns {Chart} Inst\u00e2ncia do gr\u00e1fico
   */
  static createGeoChart(geoData, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const topStates = geoData.byState.slice(0, 10);

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topStates.map(s => s.stateName),
        datasets: [{
          label: 'Receita por Estado',
          data: topStates.map(s => s.revenue),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Top 10 Estados por Receita',
            font: { size: 16 }
          },
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Obtém cor para heatmap baseado no valor
   * @param {number} value - Valor entre -1 e 1
   * @returns {string} Cor RGB
   */
  static getHeatmapColor(value) {
    // Negativo = vermelho, Positivo = azul
    if (value < 0) {
      const intensity = Math.abs(value) * 255;
      return `rgba(${intensity}, 0, 0, 0.7)`;
    } else {
      const intensity = value * 255;
      return `rgba(0, 0, ${intensity}, 0.7)`;
    }
  }

  /**
   * Obtém cor por índice
   * @param {number} index - Índice
   * @param {number} alpha - Transparência
   * @returns {string} Cor RGBA
   */
  static getColorByIndex(index, alpha = 1) {
    const colors = [
      [255, 99, 132],   // Vermelho
      [54, 162, 235],   // Azul
      [255, 206, 86],   // Amarelo
      [75, 192, 192],   // Verde-água
      [153, 102, 255],  // Roxo
      [255, 159, 64],   // Laranja
      [199, 199, 199],  // Cinza
      [83, 102, 255],   // Azul índigo
      [255, 99, 255],   // Rosa
      [99, 255, 132]    // Verde claro
    ];

    const color = colors[index % colors.length];
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  }
}
