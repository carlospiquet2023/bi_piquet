/**
 * @fileoverview FilterManager - Gerenciamento de Filtros
 * Sistema interativo de filtros e drill-down
 */

/**
 * @typedef {Object} Filter
 * @property {string} field - Campo filtrado
 * @property {string} operator - Operador (equals, contains, greater, less, between)
 * @property {any} value - Valor ou valores do filtro
 * @property {boolean} active - Se o filtro está ativo
 */

export class FilterManager {
  constructor() {
    this.filters = [];
    this.originalData = [];
    this.filteredData = [];
    this.filterHistory = [];
  }

  /**
   * Inicializa com dados originais
   * @param {Array<Object>} data - Dados originais
   */
  initialize(data) {
    this.originalData = [...data];
    this.filteredData = [...data];
    this.filters = [];
  }

  /**
   * Adiciona um filtro
   * @param {string} field - Campo
   * @param {string} operator - Operador
   * @param {any} value - Valor
   * @returns {Array<Object>} Dados filtrados
   */
  addFilter(field, operator, value) {
    // Verificar se já existe filtro para este campo
    const existingIndex = this.filters.findIndex(f => f.field === field);
    
    const filter = {
      field,
      operator,
      value,
      active: true,
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      this.filters[existingIndex] = filter;
    } else {
      this.filters.push(filter);
    }

    return this.applyFilters();
  }

  /**
   * Remove um filtro
   * @param {string} field - Campo do filtro
   * @returns {Array<Object>} Dados filtrados
   */
  removeFilter(field) {
    this.filters = this.filters.filter(f => f.field !== field);
    return this.applyFilters();
  }

  /**
   * Limpa todos os filtros
   * @returns {Array<Object>} Dados originais
   */
  clearFilters() {
    this.filterHistory.push([...this.filters]);
    this.filters = [];
    this.filteredData = [...this.originalData];
    return this.filteredData;
  }

  /**
   * Aplica todos os filtros ativos
   * @returns {Array<Object>} Dados filtrados
   */
  applyFilters() {
    if (this.filters.length === 0) {
      this.filteredData = [...this.originalData];
      return this.filteredData;
    }

    this.filteredData = this.originalData.filter(row => {
      return this.filters.every(filter => this.testFilter(row, filter));
    });

    return this.filteredData;
  }

  /**
   * Testa se uma linha passa pelo filtro
   * @param {Object} row - Linha de dados
   * @param {Filter} filter - Filtro
   * @returns {boolean} Se passa pelo filtro
   */
  testFilter(row, filter) {
    if (!filter.active) return true;

    const value = row[filter.field];

    switch (filter.operator) {
      case 'equals':
        return String(value).toLowerCase() === String(filter.value).toLowerCase();

      case 'not_equals':
        return String(value).toLowerCase() !== String(filter.value).toLowerCase();

      case 'contains':
        return String(value).toLowerCase().includes(String(filter.value).toLowerCase());

      case 'not_contains':
        return !String(value).toLowerCase().includes(String(filter.value).toLowerCase());

      case 'greater':
        return parseFloat(value) > parseFloat(filter.value);

      case 'greater_equal':
        return parseFloat(value) >= parseFloat(filter.value);

      case 'less':
        return parseFloat(value) < parseFloat(filter.value);

      case 'less_equal':
        return parseFloat(value) <= parseFloat(filter.value);

      case 'between': {
        const numValue = parseFloat(value);
        return numValue >= parseFloat(filter.value[0]) && numValue <= parseFloat(filter.value[1]);
      }

      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);

      case 'not_in':
        return Array.isArray(filter.value) && !filter.value.includes(value);

      case 'is_null':
        return value === null || value === undefined || value === '';

      case 'is_not_null':
        return value !== null && value !== undefined && value !== '';

      default:
        return true;
    }
  }

  /**
   * Cria filtro de intervalo de datas
   * @param {string} dateField - Campo de data
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Array<Object>} Dados filtrados
   */
  filterByDateRange(dateField, startDate, endDate) {
    this.addFilter(dateField, 'date_range', { start: startDate, end: endDate });
    
    // Aplicar filtro customizado de data
    this.filteredData = this.originalData.filter(row => {
      const dateStr = row[dateField];
      if (!dateStr) return false;

      const date = this.parseDate(dateStr);
      if (!date) return false;

      return date >= startDate && date <= endDate;
    });

    return this.filteredData;
  }

  /**
   * Obtém valores únicos de um campo
   * @param {string} field - Campo
   * @param {number} limit - Limite de valores
   * @returns {Array} Valores únicos
   */
  getUniqueValues(field, limit = 50) {
    const values = new Set();
    const data = this.filteredData.length > 0 ? this.filteredData : this.originalData;

    for (const row of data) {
      if (values.size >= limit) break;
      const value = row[field];
      if (value !== null && value !== undefined && value !== '') {
        values.add(value);
      }
    }

    return Array.from(values).sort();
  }

  /**
   * Cria drill-down hierárquico
   * @param {Array<string>} hierarchy - Hierarquia de campos
   * @param {number} level - Nível atual
   * @returns {Object} Dados agrupados
   */
  drillDown(hierarchy, level = 0) {
    if (level >= hierarchy.length) return this.filteredData;

    const field = hierarchy[level];
    const grouped = new Map();

    this.filteredData.forEach(row => {
      const key = row[field];
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(row);
    });

    const result = {
      field,
      level,
      groups: []
    };

    grouped.forEach((rows, key) => {
      result.groups.push({
        value: key,
        count: rows.length,
        data: rows,
        canDrillDown: level < hierarchy.length - 1
      });
    });

    // Ordenar por contagem
    result.groups.sort((a, b) => b.count - a.count);

    return result;
  }

  /**
   * Filtra top N valores de um campo
   * @param {string} field - Campo
   * @param {number} n - Número de valores
   * @param {string} aggregateField - Campo para agregação (opcional)
   * @param {string} aggregateFunc - Função de agregação (sum, avg, count)
   * @returns {Array<Object>} Top N valores
   */
  getTopN(field, n = 10, aggregateField = null, aggregateFunc = 'count') {
    const grouped = new Map();

    this.filteredData.forEach(row => {
      const key = row[field];
      if (!key) return;

      if (!grouped.has(key)) {
        grouped.set(key, { value: key, count: 0, sum: 0, values: [] });
      }

      const group = grouped.get(key);
      group.count++;
      
      if (aggregateField) {
        const val = parseFloat(row[aggregateField]) || 0;
        group.sum += val;
        group.values.push(val);
      }
    });

    // Calcular agregação
    const results = Array.from(grouped.values()).map(group => {
      let metric = group.count;

      if (aggregateField && aggregateFunc === 'sum') {
        metric = group.sum;
      } else if (aggregateField && aggregateFunc === 'avg') {
        metric = group.sum / group.count;
      }

      return {
        value: group.value,
        count: group.count,
        metric: metric
      };
    });

    // Ordenar e retornar top N
    return results.sort((a, b) => b.metric - a.metric).slice(0, n);
  }

  /**
   * Cria filtro comparativo
   * @param {string} field1 - Primeiro campo
   * @param {string} field2 - Segundo campo
   * @param {string} comparison - Tipo de comparação (greater, less, equal)
   * @returns {Array<Object>} Dados filtrados
   */
  compareFields(field1, field2, comparison) {
    this.filteredData = this.originalData.filter(row => {
      const val1 = parseFloat(row[field1]) || 0;
      const val2 = parseFloat(row[field2]) || 0;

      switch (comparison) {
        case 'greater':
          return val1 > val2;
        case 'less':
          return val1 < val2;
        case 'equal':
          return val1 === val2;
        default:
          return true;
      }
    });

    return this.filteredData;
  }

  /**
   * Obtém estatísticas dos dados filtrados
   * @returns {Object} Estatísticas
   */
  getFilteredStats() {
    return {
      totalRows: this.originalData.length,
      filteredRows: this.filteredData.length,
      filterCount: this.filters.length,
      reductionPct: ((1 - this.filteredData.length / this.originalData.length) * 100).toFixed(1) + '%',
      activeFilters: this.filters.filter(f => f.active)
    };
  }

  /**
   * Desfaz último filtro
   * @returns {Array<Object>} Dados filtrados
   */
  undo() {
    if (this.filterHistory.length > 0) {
      this.filters = this.filterHistory.pop();
      return this.applyFilters();
    }
    return this.filteredData;
  }

  /**
   * Exporta configuração de filtros
   * @returns {string} JSON com filtros
   */
  exportFilters() {
    return JSON.stringify(this.filters, null, 2);
  }

  /**
   * Importa configuração de filtros
   * @param {string} json - JSON com filtros
   * @returns {Array<Object>} Dados filtrados
   */
  importFilters(json) {
    try {
      this.filters = JSON.parse(json);
      return this.applyFilters();
    } catch (error) {
      console.error('Erro ao importar filtros:', error);
      return this.filteredData;
    }
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
