/**
 * Módulo de Validação de Dados
 * Responsável por:
 * - Validar integridade dos dados
 * - Detectar inconsistências
 * - Sugerir correções
 * - Limpar dados
 */

import { ColumnType } from '../types/enums.js';

export class DataValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.suggestions = {};
  }

  /**
   * Valida o dataset completo
   * @param {Array<Object>} data - Dados a validar
   * @param {Array<Object>} columnMetadata - Metadados das colunas
   * @returns {Object} Resultado da validação
   */
  validate(data, columnMetadata) {
    this.errors = [];
    this.warnings = [];
    this.suggestions = {};
    
    // Validações gerais
    this.validateEmptyDataset(data);
    this.validateRowConsistency(data, columnMetadata);
    
    // Validações por coluna
    columnMetadata.forEach(column => {
      this.validateColumn(data, column);
    });
    
    // Validar valores nulos
    this.validateNullValues(data, columnMetadata);
    
    // Detectar duplicatas
    this.detectDuplicates(data, columnMetadata);
    
    // Sugestões de limpeza
    this.generateCleaningSuggestions(data, columnMetadata);
    
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      suggestions: this.suggestions,
      summary: this.generateSummary(),
    };
  }

  /**
   * Valida se o dataset não está vazio
   */
  validateEmptyDataset(data) {
    if (!data || data.length === 0) {
      this.errors.push({
        type: 'EMPTY_DATASET',
        message: 'O dataset está vazio',
        severity: 'critical',
      });
    }
  }

  /**
   * Valida consistência das linhas
   */
  validateRowConsistency(data, columnMetadata) {
    const expectedColumns = columnMetadata.map(c => c.name);
    
    data.forEach((row, index) => {
      const rowColumns = Object.keys(row);
      
      // Verifica colunas faltantes
      const missingColumns = expectedColumns.filter(col => !rowColumns.includes(col));
      if (missingColumns.length > 0) {
        this.warnings.push({
          type: 'MISSING_COLUMNS',
          row: index + 2, // +2 porque índice começa em 0 e linha 1 é cabeçalho
          columns: missingColumns,
          message: `Linha ${index + 2}: colunas faltantes - ${missingColumns.join(', ')}`,
        });
      }
      
      // Verifica se a linha está completamente vazia
      const allEmpty = Object.values(row).every(val => val === null || val === '');
      if (allEmpty) {
        this.warnings.push({
          type: 'EMPTY_ROW',
          row: index + 2,
          message: `Linha ${index + 2}: completamente vazia`,
        });
      }
    });
  }

  /**
   * Valida uma coluna específica
   */
  validateColumn(data, columnMetadata) {
    const { name, type } = columnMetadata;
    
    // Validações específicas por tipo
    switch (type) {
      case ColumnType.DATE:
        this.validateDateColumn(data, name);
        break;
      case ColumnType.NUMBER:
      case ColumnType.CURRENCY:
      case ColumnType.PERCENTAGE:
        this.validateNumericColumn(data, name, type);
        break;
      case ColumnType.EMAIL:
        this.validateEmailColumn(data, name);
        break;
      case ColumnType.PHONE:
        this.validatePhoneColumn(data, name);
        break;
    }
  }

  /**
   * Valida coluna de datas
   */
  validateDateColumn(data, columnName) {
    data.forEach((row, index) => {
      const value = row[columnName];
      if (value !== null && value !== '') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          this.errors.push({
            type: 'INVALID_DATE',
            column: columnName,
            row: index + 2,
            value,
            message: `Linha ${index + 2}, coluna "${columnName}": data inválida "${value}"`,
          });
        }
        
        // Verificar datas no futuro (pode ser warning dependendo do contexto)
        if (date > new Date()) {
          this.warnings.push({
            type: 'FUTURE_DATE',
            column: columnName,
            row: index + 2,
            value,
            message: `Linha ${index + 2}, coluna "${columnName}": data no futuro "${value}"`,
          });
        }
      }
    });
  }

  /**
   * Valida coluna numérica
   */
  validateNumericColumn(data, columnName, type) {
    data.forEach((row, index) => {
      const value = row[columnName];
      if (value !== null && value !== '') {
        const cleaned = String(value).replace(/[R$,%\s]/g, '').replace(',', '.');
        const number = parseFloat(cleaned);
        
        if (isNaN(number)) {
          this.errors.push({
            type: 'INVALID_NUMBER',
            column: columnName,
            row: index + 2,
            value,
            message: `Linha ${index + 2}, coluna "${columnName}": valor numérico inválido "${value}"`,
          });
        }
        
        // Verificar valores negativos em contextos onde não fazem sentido
        if (type === ColumnType.CURRENCY && number < 0) {
          this.warnings.push({
            type: 'NEGATIVE_VALUE',
            column: columnName,
            row: index + 2,
            value,
            message: `Linha ${index + 2}, coluna "${columnName}": valor negativo "${value}"`,
          });
        }
      }
    });
  }

  /**
   * Valida coluna de email
   */
  validateEmailColumn(data, columnName) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    data.forEach((row, index) => {
      const value = row[columnName];
      if (value !== null && value !== '' && !emailPattern.test(String(value))) {
        this.errors.push({
          type: 'INVALID_EMAIL',
          column: columnName,
          row: index + 2,
          value,
          message: `Linha ${index + 2}, coluna "${columnName}": email inválido "${value}"`,
        });
      }
    });
  }

  /**
   * Valida coluna de telefone
   */
  validatePhoneColumn(data, columnName) {
    const phonePattern = /^[\d\s\-()]{8,}$/;
    
    data.forEach((row, index) => {
      const value = row[columnName];
      if (value !== null && value !== '' && !phonePattern.test(String(value))) {
        this.warnings.push({
          type: 'INVALID_PHONE',
          column: columnName,
          row: index + 2,
          value,
          message: `Linha ${index + 2}, coluna "${columnName}": telefone possivelmente inválido "${value}"`,
        });
      }
    });
  }

  /**
   * Valida valores nulos
   */
  validateNullValues(data, columnMetadata) {
    columnMetadata.forEach(column => {
      if (column.nullPercentage > 50) {
        this.warnings.push({
          type: 'HIGH_NULL_PERCENTAGE',
          column: column.name,
          affectedRows: column.nullCount,
          percentage: column.nullPercentage.toFixed(2),
          message: `Coluna "${column.name}": ${column.nullPercentage.toFixed(2)}% de valores vazios (${column.nullCount} linhas)`,
        });
      }
    });
  }

  /**
   * Detecta linhas duplicadas
   */
  detectDuplicates(data, _columnMetadata) {
    const seen = new Map();
    const duplicates = [];
    
    data.forEach((row, index) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        duplicates.push({
          row: index + 2,
          duplicateOf: seen.get(key),
        });
      } else {
        seen.set(key, index + 2);
      }
    });
    
    if (duplicates.length > 0) {
      this.warnings.push({
        type: 'DUPLICATE_ROWS',
        count: duplicates.length,
        duplicates: duplicates.slice(0, 10), // Mostrar apenas as primeiras 10
        message: `${duplicates.length} linha(s) duplicada(s) encontrada(s)`,
      });
    }
  }

  /**
   * Gera sugestões de limpeza
   */
  generateCleaningSuggestions(_data, _columnMetadata) {
    // Sugerir remoção de linhas vazias
    const emptyRows = this.warnings.filter(w => w.type === 'EMPTY_ROW');
    if (emptyRows.length > 0) {
      this.suggestions.removeEmptyRows = {
        action: 'remove_empty_rows',
        description: `Remover ${emptyRows.length} linha(s) vazia(s)`,
        impact: `${emptyRows.length} linhas serão removidas`,
      };
    }
    
    // Sugerir remoção de duplicatas
    const duplicates = this.warnings.find(w => w.type === 'DUPLICATE_ROWS');
    if (duplicates) {
      this.suggestions.removeDuplicates = {
        action: 'remove_duplicates',
        description: `Remover ${duplicates.count} linha(s) duplicada(s)`,
        impact: `${duplicates.count} linhas serão removidas`,
      };
    }
    
    // Sugerir preenchimento de valores nulos
    const highNullColumns = this.warnings.filter(w => w.type === 'HIGH_NULL_PERCENTAGE');
    if (highNullColumns.length > 0) {
      this.suggestions.fillNullValues = {
        action: 'fill_null_values',
        description: `Preencher valores vazios em ${highNullColumns.length} coluna(s)`,
        columns: highNullColumns.map(w => w.column),
        options: ['média', 'mediana', 'valor padrão', 'remover linhas'],
      };
    }
  }

  /**
   * Gera resumo da validação
   */
  generateSummary() {
    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      criticalIssues: this.errors.filter(e => e.severity === 'critical').length,
      hasBlockingErrors: this.errors.some(e => e.severity === 'critical'),
      suggestionsCount: Object.keys(this.suggestions).length,
    };
  }

  /**
   * Limpa os dados baseado nas sugestões
   * @param {Array<Object>} data - Dados a limpar
   * @param {Array<string>} actionsToApply - Ações a aplicar
   * @returns {Array<Object>} Dados limpos
   */
  cleanData(data, actionsToApply = []) {
    let cleanedData = [...data];
    
    if (actionsToApply.includes('remove_empty_rows')) {
      cleanedData = cleanedData.filter(row => 
        Object.values(row).some(val => val !== null && val !== '')
      );
    }
    
    if (actionsToApply.includes('remove_duplicates')) {
      const seen = new Set();
      cleanedData = cleanedData.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    
    return cleanedData;
  }
}
