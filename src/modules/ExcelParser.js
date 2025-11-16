/**
 * Módulo de Leitura e Parsing de Excel
 * Responsável por:
 * - Ler arquivos Excel com SheetJS
 * - Converter para JSON
 * - Detectar cabeçalhos
 * - Extrair metadados básicos
 */

import * as XLSX from 'xlsx';

export class ExcelParser {
  constructor() {
    this.workbook = null;
    this.sheets = [];
    this.currentSheet = null;
  }

  /**
   * Lê o arquivo Excel do ArrayBuffer
   * @param {ArrayBuffer} arrayBuffer - Buffer do arquivo
   * @returns {Object} Workbook do SheetJS
   */
  readWorkbook(arrayBuffer) {
    try {
      this.workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false,
      });
      
      this.sheets = this.workbook.SheetNames.map(name => ({
        name,
        data: null,
        metadata: null,
      }));
      
      return this.workbook;
    } catch (error) {
      throw new Error(`Erro ao processar Excel: ${error.message}`);
    }
  }

  /**
   * Converte uma planilha para JSON
   * @param {string} sheetName - Nome da aba
   * @returns {Array<Object>} Dados em formato JSON
   */
  sheetToJSON(sheetName) {
    if (!this.workbook) {
      throw new Error('Nenhum workbook carregado');
    }

    const sheet = this.workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error(`Aba "${sheetName}" não encontrada`);
    }

    // Converter para JSON com opções
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1, // Retorna array de arrays
      raw: false, // Converte datas
      dateNF: 'yyyy-mm-dd',
      defval: null, // Valor padrão para células vazias
    });

    return jsonData;
  }

  /**
   * Processa uma aba específica
   * @param {string} sheetName - Nome da aba
   * @returns {Object} Dados processados
   */
  processSheet(sheetName) {
    const rawData = this.sheetToJSON(sheetName);
    
    if (rawData.length === 0) {
      throw new Error('Planilha vazia');
    }

    // Detectar cabeçalhos
    const headers = this.detectHeaders(rawData);
    
    // Converter para objetos
    const data = this.convertToObjects(rawData, headers);
    
    // Remover linhas completamente vazias
    const cleanData = data.filter(row => 
      Object.values(row).some(val => val !== null && val !== '')
    );

    return {
      sheetName,
      headers,
      data: cleanData,
      rawRowCount: rawData.length,
      cleanRowCount: cleanData.length,
      columnCount: headers.length,
    };
  }

  /**
   * Detecta os cabeçalhos da planilha
   * @param {Array} rawData - Dados brutos
   * @returns {Array<string>} Lista de cabeçalhos
   */
  detectHeaders(rawData) {
    if (rawData.length === 0) return [];

    // Assume que a primeira linha são os cabeçalhos
    const firstRow = rawData[0];
    
    // Validar se parecem cabeçalhos
    const looksLikeHeaders = firstRow.every(cell => 
      typeof cell === 'string' && cell.trim().length > 0
    );

    if (looksLikeHeaders) {
      return firstRow.map((header, index) => 
        header.trim() || `Coluna_${index + 1}`
      );
    }

    // Se não parecem cabeçalhos, gerar nomes automáticos
    return firstRow.map((_, index) => `Coluna_${index + 1}`);
  }

  /**
   * Converte arrays para objetos usando cabeçalhos
   * @param {Array} rawData - Dados brutos
   * @param {Array<string>} headers - Cabeçalhos
   * @returns {Array<Object>}
   */
  convertToObjects(rawData, headers) {
    // Pular primeira linha (cabeçalhos)
    const dataRows = rawData.slice(1);
    
    return dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] !== undefined ? row[index] : null;
      });
      return obj;
    });
  }

  /**
   * Processa todas as abas
   * @returns {Array<Object>}
   */
  processAllSheets() {
    if (!this.workbook) {
      throw new Error('Nenhum workbook carregado');
    }

    return this.sheets.map(sheet => {
      try {
        const processed = this.processSheet(sheet.name);
        sheet.data = processed.data;
        sheet.metadata = {
          headers: processed.headers,
          rawRowCount: processed.rawRowCount,
          cleanRowCount: processed.cleanRowCount,
          columnCount: processed.columnCount,
        };
        return sheet;
      } catch (error) {
        sheet.error = error.message;
        return sheet;
      }
    });
  }

  /**
   * Obtém a primeira aba com dados
   * @returns {Object}
   */
  getFirstValidSheet() {
    const processedSheets = this.processAllSheets();
    const validSheet = processedSheets.find(sheet => 
      sheet.data && sheet.data.length > 0
    );
    
    if (!validSheet) {
      throw new Error('Nenhuma aba com dados válidos encontrada');
    }
    
    this.currentSheet = validSheet;
    return validSheet;
  }

  /**
   * Extrai metadados gerais do arquivo
   * @returns {Object}
   */
  extractMetadata() {
    if (!this.workbook) {
      throw new Error('Nenhum workbook carregado');
    }

    return {
      sheetCount: this.workbook.SheetNames.length,
      sheetNames: this.workbook.SheetNames,
      props: this.workbook.Props || {},
    };
  }
}
