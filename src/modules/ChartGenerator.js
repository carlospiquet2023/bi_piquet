/**
 * Gerador Automático de Gráficos
 * Responsável por:
 * - Selecionar tipo de gráfico adequado baseado nos dados
 * - Configurar gráficos automaticamente
 * - Gerar visualizações com Chart.js
 */

import { Chart, registerables } from 'chart.js';
import { ChartType } from '../types/enums.js';

// Registrar componentes do Chart.js
Chart.register(...registerables);

export class ChartGenerator {
  constructor(data, columnMetadata, analytics) {
    this.data = data;
    this.columnMetadata = columnMetadata;
    this.analytics = analytics;
    this.charts = [];
    this.chartInstances = [];
  }

  /**
   * Gera todos os gráficos automaticamente
   * @returns {Array} Configurações dos gráficos
   */
  generateAll() {
    this.charts = [];
    
    // Gráfico de linha temporal (se houver datas + valores)
    if (this.analytics.groupings.monthly) {
      this.createMonthlyLineChart();
    }
    
    // Gráfico de pizza por categoria
    if (this.analytics.groupings.byCategory) {
      this.createCategoryPieChart();
    }
    
    // Gráfico de barras por produto
    if (this.analytics.groupings.byProduct) {
      this.createProductBarChart();
    }
    
    // Gráfico comparativo entrada vs saída
    if (this.hasRevenueExpense()) {
      this.createRevenueExpenseChart();
    }
    
    return this.charts;
  }

  /**
   * Cria gráfico de linha mensal
   */
  createMonthlyLineChart() {
    const data = this.analytics.groupings.monthly;
    
    if (!data || data.length === 0) return;
    
    const config = {
      id: 'chart-monthly-trend',
      type: ChartType.LINE,
      title: 'Evolução Mensal',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Valor Total',
          data: data.map(d => d.total),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.3,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: true,
            text: 'Evolução Mensal',
            font: {
              size: 16,
              weight: 'bold',
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(context.parsed.y);
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact',
                }).format(value);
              }
            }
          }
        }
      }
    };
    
    this.charts.push(config);
  }

  /**
   * Cria gráfico de pizza por categoria
   */
  createCategoryPieChart() {
    const data = this.analytics.groupings.byCategory;
    
    if (!data || data.length === 0) return;
    
    // Pegar top 10
    const topData = data.slice(0, 10);
    
    const config = {
      id: 'chart-category-pie',
      type: ChartType.PIE,
      title: 'Distribuição por Categoria',
      data: {
        labels: topData.map(d => d.label),
        datasets: [{
          data: topData.map(d => d.total),
          backgroundColor: this.generateColors(topData.length),
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
          },
          title: {
            display: true,
            text: 'Distribuição por Categoria',
            font: {
              size: 16,
              weight: 'bold',
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(context.parsed);
                
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    
    this.charts.push(config);
  }

  /**
   * Cria gráfico de barras por produto
   */
  createProductBarChart() {
    const data = this.analytics.groupings.byProduct;
    
    if (!data || data.length === 0) return;
    
    // Pegar top 15
    const topData = data.slice(0, 15);
    
    const config = {
      id: 'chart-product-bar',
      type: ChartType.BAR,
      title: 'Top Produtos por Valor',
      data: {
        labels: topData.map(d => d.label),
        datasets: [{
          label: 'Valor Total',
          data: topData.map(d => d.total),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Barras horizontais
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: 'Top Produtos por Valor',
            font: {
              size: 16,
              weight: 'bold',
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(context.parsed.x);
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact',
                }).format(value);
              }
            }
          }
        }
      }
    };
    
    this.charts.push(config);
  }

  /**
   * Cria gráfico comparativo receita vs despesa
   */
  createRevenueExpenseChart() {
    const revenueKPI = this.analytics.kpis.find(k => k.id === 'total_revenue');
    const expenseKPI = this.analytics.kpis.find(k => k.id === 'total_expense');
    
    if (!revenueKPI || !expenseKPI) return;
    
    const config = {
      id: 'chart-revenue-expense',
      type: ChartType.BAR,
      title: 'Receitas vs Despesas',
      data: {
        labels: ['Comparativo'],
        datasets: [
          {
            label: 'Receitas',
            data: [revenueKPI.rawValue],
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
          {
            label: 'Despesas',
            data: [expenseKPI.rawValue],
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: true,
            text: 'Receitas vs Despesas',
            font: {
              size: 16,
              weight: 'bold',
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(context.parsed.y);
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact',
                }).format(value);
              }
            }
          }
        }
      }
    };
    
    this.charts.push(config);
  }

  /**
   * Renderiza um gráfico no canvas
   * @param {string} canvasId - ID do canvas
   * @param {Object} config - Configuração do gráfico
   * @returns {Chart} Instância do Chart.js
   */
  renderChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} não encontrado`);
      return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    const chart = new Chart(ctx, {
      type: config.type,
      data: config.data,
      options: config.options,
    });
    
    this.chartInstances.push(chart);
    return chart;
  }

  /**
   * Gera cores para gráficos
   */
  generateColors(count) {
    const baseColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
      'rgba(255, 99, 255, 0.7)',
      'rgba(99, 255, 132, 0.7)',
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  /**
   * Verifica se há dados de receita e despesa
   */
  hasRevenueExpense() {
    return this.analytics.kpis.some(k => k.id === 'total_revenue') &&
           this.analytics.kpis.some(k => k.id === 'total_expense');
  }

  /**
   * Destrói todos os gráficos
   */
  destroyAll() {
    this.chartInstances.forEach(chart => chart.destroy());
    this.chartInstances = [];
  }
}
