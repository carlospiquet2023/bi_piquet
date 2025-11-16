/**
 * Engine de Análise Automática
 * Responsável por:
 * - Calcular KPIs automáticos
 * - Gerar métricas estratégicas
 * - Realizar agrupamentos
 * - Calcular projeções
 */

import { ColumnType } from '../types/enums.js';

export class AnalyticsEngine {
  constructor(data, columnMetadata) {
    this.data = data;
    this.columnMetadata = columnMetadata;
    this.kpis = [];
    this.metrics = {};
  }

  /**
   * Executa todas as análises automáticas
   * @returns {Object} Resultado completo das análises
   */
  analyzeAll() {
    this.detectDataPatterns();
    this.calculateKPIs();
    this.performGroupings();
    this.calculateTrends();
    this.generateProjections();
    
    return {
      kpis: this.kpis,
      metrics: this.metrics,
      groupings: this.groupings,
      trends: this.trends,
      projections: this.projections,
    };
  }

  /**
   * Detecta padrões nos dados
   */
  detectDataPatterns() {
    const patterns = {
      hasDate: this.hasColumnType(ColumnType.DATE),
      hasCurrency: this.hasColumnType(ColumnType.CURRENCY),
      hasCategory: this.hasColumnType(ColumnType.CATEGORY),
      hasProduct: this.hasColumnType(ColumnType.PRODUCT),
      hasEmployee: this.hasColumnType(ColumnType.EMPLOYEE),
      hasClient: this.hasColumnType(ColumnType.CLIENT),
    };
    
    this.patterns = patterns;
    return patterns;
  }

  /**
   * Verifica se existe coluna de determinado tipo
   */
  hasColumnType(type) {
    return this.columnMetadata.some(col => col.type === type);
  }

  /**
   * Encontra colunas por tipo
   */
  getColumnsByType(type) {
    return this.columnMetadata.filter(col => col.type === type);
  }

  /**
   * Calcula KPIs automáticos
   */
  calculateKPIs() {
    this.kpis = [];
    
    // KPI: Total de Registros
    this.addKPI({
      id: 'total_records',
      title: 'Total de Registros',
      value: this.data.length,
      icon: '📊',
      description: 'Quantidade total de linhas válidas',
      category: 'geral',
    });
    
    // KPIs Financeiros
    const currencyColumns = this.getColumnsByType(ColumnType.CURRENCY);
    currencyColumns.forEach(col => {
      this.calculateFinancialKPIs(col);
    });
    
    // KPIs de Produtos
    const productColumns = this.getColumnsByType(ColumnType.PRODUCT);
    if (productColumns.length > 0) {
      this.calculateProductKPIs(productColumns[0]);
    }
    
    // KPIs de Funcionários
    const employeeColumns = this.getColumnsByType(ColumnType.EMPLOYEE);
    if (employeeColumns.length > 0) {
      this.calculateEmployeeKPIs(employeeColumns[0]);
    }
    
    // KPIs de Clientes
    const clientColumns = this.getColumnsByType(ColumnType.CLIENT);
    if (clientColumns.length > 0) {
      this.calculateClientKPIs(clientColumns[0]);
    }
    
    // KPIs Temporais
    const dateColumns = this.getColumnsByType(ColumnType.DATE);
    if (dateColumns.length > 0) {
      this.calculateTimeKPIs(dateColumns[0]);
    }
    
    return this.kpis;
  }

  /**
   * Calcula KPIs financeiros
   */
  calculateFinancialKPIs(column) {
    const values = this.getNumericValues(column.name);
    
    if (values.length === 0) return;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    
    // Total
    this.addKPI({
      id: `total_${column.name}`,
      title: `Total ${column.name}`,
      value: this.formatCurrency(sum),
      rawValue: sum,
      icon: '💰',
      description: `Soma total de ${column.name}`,
      category: 'financeiro',
    });
    
    // Média
    this.addKPI({
      id: `avg_${column.name}`,
      title: `Ticket Médio`,
      value: this.formatCurrency(avg),
      rawValue: avg,
      icon: '📈',
      description: `Valor médio por registro`,
      category: 'financeiro',
    });
    
    // Maior valor
    this.addKPI({
      id: `max_${column.name}`,
      title: `Maior ${column.name}`,
      value: this.formatCurrency(max),
      rawValue: max,
      icon: '🔝',
      description: `Maior valor registrado`,
      category: 'financeiro',
    });
    
    // Detectar entrada/saída
    this.detectRevenueExpense(column.name);
  }

  /**
   * Detecta receitas e despesas
   */
  detectRevenueExpense(columnName) {
    // Procurar colunas que indiquem tipo de transação
    const typeColumns = this.columnMetadata.filter(col => 
      col.name.toLowerCase().includes('tipo') || 
      col.name.toLowerCase().includes('category') ||
      col.name.toLowerCase().includes('operação')
    );
    
    if (typeColumns.length > 0) {
      const typeCol = typeColumns[0].name;
      const revenue = this.sumWhere(columnName, typeCol, 
        ['entrada', 'receita', 'revenue', 'income', 'venda', 'sale']
      );
      const expense = this.sumWhere(columnName, typeCol, 
        ['saída', 'despesa', 'expense', 'cost', 'custo', 'gasto']
      );
      
      if (revenue > 0) {
        this.addKPI({
          id: 'total_revenue',
          title: 'Total de Entradas',
          value: this.formatCurrency(revenue),
          rawValue: revenue,
          icon: '💵',
          description: 'Receitas / Entradas',
          category: 'financeiro',
          trend: 'up',
        });
      }
      
      if (expense > 0) {
        this.addKPI({
          id: 'total_expense',
          title: 'Total de Saídas',
          value: this.formatCurrency(expense),
          rawValue: expense,
          icon: '💸',
          description: 'Despesas / Saídas',
          category: 'financeiro',
          trend: 'down',
        });
      }
      
      if (revenue > 0 && expense > 0) {
        const profit = revenue - expense;
        this.addKPI({
          id: 'profit',
          title: profit >= 0 ? 'Lucro' : 'Prejuízo',
          value: this.formatCurrency(Math.abs(profit)),
          rawValue: profit,
          icon: profit >= 0 ? '✅' : '⚠️',
          description: profit >= 0 ? 'Resultado Positivo' : 'Resultado Negativo',
          category: 'financeiro',
          trend: profit >= 0 ? 'up' : 'down',
        });
      }
    }
  }

  /**
   * Calcula KPIs de produtos
   */
  calculateProductKPIs(column) {
    const products = this.data.map(row => row[column.name]).filter(Boolean);
    const uniqueProducts = new Set(products);
    
    this.addKPI({
      id: 'total_products',
      title: 'Total de Produtos',
      value: uniqueProducts.size,
      icon: '📦',
      description: 'Produtos únicos no catálogo',
      category: 'produtos',
    });
    
    // Produto mais vendido
    const productFrequency = this.getFrequency(column.name);
    if (productFrequency.length > 0) {
      const topProduct = productFrequency[0];
      this.addKPI({
        id: 'top_product',
        title: 'Produto Campeão',
        value: topProduct.value,
        subValue: `${topProduct.count} vendas`,
        icon: '🏆',
        description: 'Produto mais vendido',
        category: 'produtos',
      });
    }
  }

  /**
   * Calcula KPIs de funcionários
   */
  calculateEmployeeKPIs(column) {
    const employees = this.data.map(row => row[column.name]).filter(Boolean);
    const uniqueEmployees = new Set(employees);
    
    this.addKPI({
      id: 'total_employees',
      title: 'Total de Funcionários',
      value: uniqueEmployees.size,
      icon: '👥',
      description: 'Funcionários ativos',
      category: 'equipe',
    });
    
    // Funcionário destaque
    const employeeFrequency = this.getFrequency(column.name);
    if (employeeFrequency.length > 0) {
      const topEmployee = employeeFrequency[0];
      this.addKPI({
        id: 'top_employee',
        title: 'Funcionário Destaque',
        value: topEmployee.value,
        subValue: `${topEmployee.count} registros`,
        icon: '⭐',
        description: 'Funcionário mais produtivo',
        category: 'equipe',
      });
    }
  }

  /**
   * Calcula KPIs de clientes
   */
  calculateClientKPIs(column) {
    const clients = this.data.map(row => row[column.name]).filter(Boolean);
    const uniqueClients = new Set(clients);
    
    this.addKPI({
      id: 'total_clients',
      title: 'Total de Clientes',
      value: uniqueClients.size,
      icon: '🤝',
      description: 'Clientes únicos',
      category: 'clientes',
    });
  }

  /**
   * Calcula KPIs temporais
   */
  calculateTimeKPIs(column) {
    const dates = this.data
      .map(row => row[column.name])
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d));
    
    if (dates.length === 0) return;
    
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const range = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    
    this.addKPI({
      id: 'date_range',
      title: 'Período Analisado',
      value: `${range} dias`,
      subValue: `${this.formatDate(minDate)} - ${this.formatDate(maxDate)}`,
      icon: '📅',
      description: 'Intervalo de tempo dos dados',
      category: 'temporal',
    });
  }

  /**
   * Formata data em pt-BR
   */
  formatDate(date) {
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Realiza agrupamentos automáticos
   */
  performGroupings() {
    this.groupings = {};
    
    // Agrupamento por data (mensal)
    const dateColumns = this.getColumnsByType(ColumnType.DATE);
    const currencyColumns = this.getColumnsByType(ColumnType.CURRENCY);
    
    if (dateColumns.length > 0 && currencyColumns.length > 0) {
      this.groupings.monthly = this.groupByMonth(dateColumns[0].name, currencyColumns[0].name);
    }
    
    // Agrupamento por categoria
    const categoryColumns = this.getColumnsByType(ColumnType.CATEGORY);
    if (categoryColumns.length > 0 && currencyColumns.length > 0) {
      this.groupings.byCategory = this.groupBy(categoryColumns[0].name, currencyColumns[0].name);
    }
    
    // Agrupamento por produto
    const productColumns = this.getColumnsByType(ColumnType.PRODUCT);
    if (productColumns.length > 0 && currencyColumns.length > 0) {
      this.groupings.byProduct = this.groupBy(productColumns[0].name, currencyColumns[0].name);
    }
    
    return this.groupings;
  }

  /**
   * Agrupa por mês
   */
  groupByMonth(dateColumn, valueColumn) {
    const groups = {};
    
    this.data.forEach(row => {
      const date = row[dateColumn] ? new Date(row[dateColumn]) : null;
      const value = this.parseNumber(row[valueColumn]);
      
      if (date && !isNaN(date) && value !== null) {
        const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        if (!groups[monthKey]) {
          groups[monthKey] = { sum: 0, count: 0, items: [] };
        }
        groups[monthKey].sum += value;
        groups[monthKey].count++;
        groups[monthKey].items.push(row);
      }
    });
    
    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        label: this.formatMonthLabel(month),
        total: data.sum,
        average: data.sum / data.count,
        count: data.count,
      }));
  }

  /**
   * Formata label do mês
   */
  formatMonthLabel(monthKey) {
    const [year, month] = monthKey.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]}/${year}`;
  }

  /**
   * Agrupa por campo
   */
  groupBy(groupColumn, valueColumn) {
    const groups = {};
    
    this.data.forEach(row => {
      const key = row[groupColumn];
      const value = this.parseNumber(row[valueColumn]);
      
      if (key && value !== null) {
        if (!groups[key]) {
          groups[key] = { sum: 0, count: 0 };
        }
        groups[key].sum += value;
        groups[key].count++;
      }
    });
    
    return Object.entries(groups)
      .map(([key, data]) => ({
        label: key,
        total: data.sum,
        average: data.sum / data.count,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }

  /**
   * Calcula tendências
   */
  calculateTrends() {
    this.trends = {};
    
    if (this.groupings.monthly && this.groupings.monthly.length > 1) {
      const values = this.groupings.monthly.map(m => m.total);
      this.trends.monthly = this.calculateTrendDirection(values);
    }
    
    return this.trends;
  }

  /**
   * Calcula direção da tendência
   */
  calculateTrendDirection(values) {
    if (values.length < 2) return 'neutral';
    
    const last = values[values.length - 1];
    const previous = values[values.length - 2];
    const change = ((last - previous) / previous) * 100;
    
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
      change: change.toFixed(2),
      description: change > 0 ? 'Crescimento' : change < 0 ? 'Queda' : 'Estável',
    };
  }

  /**
   * Gera projeções simples
   */
  generateProjections() {
    this.projections = {};
    
    if (this.groupings.monthly && this.groupings.monthly.length >= 3) {
      const values = this.groupings.monthly.map(m => m.total);
      const lastThree = values.slice(-3);
      const avgLastThree = lastThree.reduce((a, b) => a + b, 0) / 3;
      
      this.projections.nextMonth = {
        value: avgLastThree,
        confidence: 'medium',
        method: 'média móvel (3 meses)',
      };
    }
    
    return this.projections;
  }

  // ========== MÉTODOS AUXILIARES ==========

  addKPI(kpi) {
    this.kpis.push({
      ...kpi,
      timestamp: new Date(),
    });
  }

  getNumericValues(columnName) {
    return this.data
      .map(row => this.parseNumber(row[columnName]))
      .filter(val => val !== null);
  }

  parseNumber(value) {
    if (value === null || value === '') return null;
    const cleaned = String(value).replace(/[R$,%\s]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  sumWhere(valueColumn, filterColumn, filterValues) {
    return this.data
      .filter(row => {
        const val = String(row[filterColumn]).toLowerCase();
        return filterValues.some(fv => val.includes(fv.toLowerCase()));
      })
      .reduce((sum, row) => sum + (this.parseNumber(row[valueColumn]) || 0), 0);
  }

  getFrequency(columnName) {
    const freq = {};
    this.data.forEach(row => {
      const val = row[columnName];
      if (val) {
        freq[val] = (freq[val] || 0) + 1;
      }
    });
    
    return Object.entries(freq)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }
}
