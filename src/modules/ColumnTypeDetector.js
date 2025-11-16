/**
 * Módulo de Detecção Automática de Tipos de Colunas
 * Responsável por:
 * - Analisar amostras de dados
 * - Identificar tipo de cada coluna
 * - Calcular estatísticas básicas
 * - Gerar metadados detalhados
 */

import { ColumnType } from '../types/enums.js';

export class ColumnTypeDetector {
  constructor() {
    this.sampleSize = 100; // Quantidade de amostras para análise
  }

  /**
   * Detecta tipos de todas as colunas
   * @param {Array<Object>} data - Dados da planilha
   * @param {Array<string>} headers - Cabeçalhos
   * @returns {Array<Object>} Metadados das colunas
   */
  detectAllColumns(data, headers) {
    return headers.map(header => this.detectColumnType(data, header));
  }

  /**
   * Detecta o tipo de uma coluna específica
   * @param {Array<Object>} data - Dados da planilha
   * @param {string} columnName - Nome da coluna
   * @returns {Object} Metadados da coluna
   */
  detectColumnType(data, columnName) {
    const values = data.map(row => row[columnName]).filter(v => v !== null && v !== '');
    const samples = values.slice(0, this.sampleSize);
    
    // Estatísticas básicas
    const totalCount = data.length;
    const nullCount = totalCount - values.length;
    const uniqueValues = [...new Set(values)];
    const uniqueCount = uniqueValues.length;
    
    // Detectar tipo
    const type = this.identifyType(samples, columnName);
    
    // Estatísticas específicas por tipo
    const stats = this.calculateTypeSpecificStats(values, type);
    
    return {
      name: columnName,
      type,
      totalCount,
      nullCount,
      nullPercentage: (nullCount / totalCount) * 100,
      uniqueCount,
      uniquePercentage: (uniqueCount / totalCount) * 100,
      samples: samples.slice(0, 5),
      ...stats,
    };
  }

  /**
   * Identifica o tipo da coluna baseado em amostras
   * @param {Array} samples - Amostras de valores
   * @param {string} columnName - Nome da coluna
   * @returns {string} Tipo identificado
   */
  identifyType(samples, columnName) {
    if (samples.length === 0) return ColumnType.UNKNOWN;

    const columnLower = columnName.toLowerCase();
    
    // Verificar por nome da coluna primeiro
    if (this.isDateColumn(columnLower)) {
      if (this.validateDateValues(samples)) return ColumnType.DATE;
    }
    
    if (this.isCurrencyColumn(columnLower)) {
      if (this.validateNumericValues(samples)) return ColumnType.CURRENCY;
    }
    
    if (this.isPercentageColumn(columnLower)) {
      if (this.validateNumericValues(samples)) return ColumnType.PERCENTAGE;
    }
    
    // Verificar tipos específicos por nome
    if (columnLower.includes('produto') || columnLower.includes('product')) {
      return ColumnType.PRODUCT;
    }
    
    if (columnLower.includes('funcionário') || columnLower.includes('funcionario') || 
        columnLower.includes('employee') || columnLower.includes('vendedor')) {
      return ColumnType.EMPLOYEE;
    }
    
    if (columnLower.includes('cliente') || columnLower.includes('client') || 
        columnLower.includes('customer')) {
      return ColumnType.CLIENT;
    }
    
    if (columnLower.includes('sku') || columnLower.includes('código') || 
        columnLower.includes('codigo') || columnLower.includes('code')) {
      return ColumnType.SKU;
    }
    
    if (columnLower.includes('email') || columnLower.includes('e-mail')) {
      if (this.validateEmailValues(samples)) return ColumnType.EMAIL;
    }
    
    if (columnLower.includes('telefone') || columnLower.includes('phone') || 
        columnLower.includes('celular')) {
      return ColumnType.PHONE;
    }
    
    // Verificar por padrão dos valores
    if (this.validateDateValues(samples)) return ColumnType.DATE;
    if (this.validateBooleanValues(samples)) return ColumnType.BOOLEAN;
    if (this.validateEmailValues(samples)) return ColumnType.EMAIL;
    if (this.validatePhoneValues(samples)) return ColumnType.PHONE;
    if (this.validateNumericValues(samples)) return ColumnType.NUMBER;
    
    // Verificar se é categoria (poucos valores únicos)
    const uniqueRatio = new Set(samples).size / samples.length;
    if (uniqueRatio < 0.5 && samples.length > 10) {
      return ColumnType.CATEGORY;
    }
    
    return ColumnType.TEXT;
  }

  /**
   * Valida se os valores são datas
   */
  validateDateValues(samples) {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}/, // DD-MM-YYYY
    ];
    
    const validCount = samples.filter(val => {
      const str = String(val);
      return datePatterns.some(pattern => pattern.test(str)) || 
             !isNaN(Date.parse(str));
    }).length;
    
    return validCount / samples.length > 0.7;
  }

  /**
   * Valida se os valores são numéricos
   */
  validateNumericValues(samples) {
    const validCount = samples.filter(val => {
      const cleaned = String(val).replace(/[R$,%\s]/g, '').replace(',', '.');
      return !isNaN(parseFloat(cleaned));
    }).length;
    
    return validCount / samples.length > 0.8;
  }

  /**
   * Valida se os valores são booleanos
   */
  validateBooleanValues(samples) {
    const booleanValues = ['sim', 'não', 'yes', 'no', 'true', 'false', '1', '0', 'verdadeiro', 'falso'];
    const validCount = samples.filter(val => 
      booleanValues.includes(String(val).toLowerCase())
    ).length;
    
    return validCount / samples.length > 0.8;
  }

  /**
   * Valida se os valores são emails
   */
  validateEmailValues(samples) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validCount = samples.filter(val => 
      emailPattern.test(String(val))
    ).length;
    
    return validCount / samples.length > 0.7;
  }

  /**
   * Valida se os valores são telefones
   */
  validatePhoneValues(samples) {
    const phonePattern = /^[\d\s\-()]{8,}$/;
    const validCount = samples.filter(val => 
      phonePattern.test(String(val))
    ).length;
    
    return validCount / samples.length > 0.7;
  }

  /**
   * Verifica se o nome da coluna indica data
   */
  isDateColumn(name) {
    const dateKeywords = ['data', 'date', 'dia', 'day', 'mes', 'month', 'ano', 'year', 'periodo', 'period'];
    return dateKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Verifica se o nome da coluna indica moeda
   */
  isCurrencyColumn(name) {
    const currencyKeywords = ['valor', 'price', 'preço', 'preco', 'total', 'receita', 'revenue', 'custo', 'cost', 'venda', 'sale'];
    return currencyKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Verifica se o nome da coluna indica porcentagem
   */
  isPercentageColumn(name) {
    const percentKeywords = ['percentual', 'percent', 'taxa', 'rate', '%'];
    return percentKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Calcula estatísticas específicas por tipo
   */
  calculateTypeSpecificStats(values, type) {
    const stats = {};
    
    if (type === ColumnType.NUMBER || type === ColumnType.CURRENCY || type === ColumnType.PERCENTAGE) {
      const numbers = values.map(v => {
        const cleaned = String(v).replace(/[R$,%\s]/g, '').replace(',', '.');
        return parseFloat(cleaned);
      }).filter(n => !isNaN(n));
      
      if (numbers.length > 0) {
        stats.min = Math.min(...numbers);
        stats.max = Math.max(...numbers);
        stats.mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        stats.sum = numbers.reduce((a, b) => a + b, 0);
        
        // Mediana
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        stats.median = sorted.length % 2 === 0 
          ? (sorted[mid - 1] + sorted[mid]) / 2 
          : sorted[mid];
        
        // Desvio padrão
        const variance = numbers.reduce((sum, num) => 
          sum + Math.pow(num - stats.mean, 2), 0
        ) / numbers.length;
        stats.stdDev = Math.sqrt(variance);
      }
    }
    
    if (type === ColumnType.DATE) {
      const dates = values.map(v => new Date(v)).filter(d => !isNaN(d));
      if (dates.length > 0) {
        stats.minDate = new Date(Math.min(...dates));
        stats.maxDate = new Date(Math.max(...dates));
        stats.dateRange = Math.ceil((stats.maxDate - stats.minDate) / (1000 * 60 * 60 * 24));
      }
    }
    
    if (type === ColumnType.CATEGORY || type === ColumnType.PRODUCT || 
        type === ColumnType.EMPLOYEE || type === ColumnType.CLIENT) {
      const frequency = {};
      values.forEach(v => {
        frequency[v] = (frequency[v] || 0) + 1;
      });
      
      stats.topValues = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([value, count]) => ({ value, count, percentage: (count / values.length) * 100 }));
    }
    
    return stats;
  }
}
