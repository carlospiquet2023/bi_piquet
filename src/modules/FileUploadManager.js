/**
 * Módulo de Upload e Validação de Arquivos
 * Responsável por:
 * - Upload de arquivos Excel (.xlsx, .xls)
 * - Upload de arquivos JSON (.json)
 * - Upload de arquivos XML (.xml)
 * - Upload de arquivos CSV (.csv)
 * - Importação de Google Sheets via URL
 * - Validação de tipo e tamanho
 * - Tratamento de erros
 * 
 * @version 2.0.0
 */

export class FileUploadManager {
  constructor() {
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedExtensions = ['.xlsx', '.xls', '.json', '.xml', '.csv'];
    this.currentFile = null;
    this.currentFormat = null;
  }

  /**
   * Valida o arquivo selecionado
   * @param {File} file - Arquivo a ser validado
   * @returns {Object} Resultado da validação
   */
  validateFile(file) {
    const errors = [];
    const warnings = [];

    // Validar se arquivo existe
    if (!file) {
      errors.push('Nenhum arquivo selecionado');
      return { isValid: false, errors, warnings };
    }

    // Validar extensão
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.allowedExtensions.some(ext => 
      fileName.endsWith(ext)
    );
    
    if (!hasValidExtension) {
      errors.push(
        `Formato inválido. Aceitos: ${this.allowedExtensions.join(', ')}`
      );
    }

    // Detectar formato do arquivo
    const fileFormat = this.detectFileFormat(file);
    
    // Validar tipo MIME baseado no formato
    const validMimeTypes = this.getValidMimeTypes(fileFormat);
    
    if (validMimeTypes.length > 0 && file.type !== '' && !validMimeTypes.includes(file.type)) {
      warnings.push(`Tipo MIME do arquivo (${file.type}) pode não ser compatível`);
    }

    // Validar tamanho
    if (file.size > this.maxFileSize) {
      errors.push(
        `Arquivo muito grande. Máximo: ${this.formatFileSize(this.maxFileSize)}`
      );
    }

    if (file.size === 0) {
      errors.push('Arquivo vazio');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo: {
        name: file.name,
        size: file.size,
        sizeFormatted: this.formatFileSize(file.size),
        type: file.type,
        format: fileFormat,
        lastModified: new Date(file.lastModified),
      }
    };
  }

  /**
   * Detectar formato do arquivo pela extensão
   * @param {File} file 
   * @returns {string}
   */
  detectFileFormat(file) {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return 'excel';
    } else if (fileName.endsWith('.json')) {
      return 'json';
    } else if (fileName.endsWith('.xml')) {
      return 'xml';
    } else if (fileName.endsWith('.csv')) {
      return 'csv';
    }
    
    return 'unknown';
  }

  /**
   * Obter tipos MIME válidos para o formato
   * @param {string} format 
   * @returns {Array}
   */
  getValidMimeTypes(format) {
    const mimeTypes = {
      excel: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ],
      json: [
        'application/json',
        'text/json'
      ],
      xml: [
        'application/xml',
        'text/xml'
      ],
      csv: [
        'text/csv',
        'text/plain',
        'application/csv'
      ]
    };
    
    return mimeTypes[format] || [];
  }

  /**
   * Lê o arquivo como ArrayBuffer
   * @param {File} file - Arquivo a ser lido
   * @returns {Promise<ArrayBuffer>}
   */
  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          this.dispatchProgress(progress);
        }
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Processa o upload do arquivo
   * @param {File} file - Arquivo a ser processado
   * @returns {Promise<Object>}
   */
  async uploadFile(file) {
    const validation = this.validateFile(file);
    
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    this.currentFile = file;
    this.currentFormat = validation.fileInfo.format;
    
    try {
      // Ler arquivo baseado no formato
      let data;
      
      if (this.currentFormat === 'excel') {
        data = await this.readFile(file);
      } else if (this.currentFormat === 'json' || this.currentFormat === 'xml' || this.currentFormat === 'csv') {
        data = await this.readFileAsText(file);
      } else {
        throw new Error('Formato de arquivo não suportado');
      }
      
      return {
        success: true,
        data: data,
        format: this.currentFormat,
        fileInfo: validation.fileInfo,
        warnings: validation.warnings,
      };
    } catch (error) {
      throw new Error(`Falha no upload: ${error.message}`);
    }
  }

  /**
   * Lê o arquivo como texto (para JSON, XML, CSV)
   * @param {File} file - Arquivo a ser lido
   * @returns {Promise<string>}
   */
  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          this.dispatchProgress(progress);
        }
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Validar URL do Google Sheets
   * @param {string} url 
   * @returns {Object}
   */
  validateGoogleSheetsUrl(url) {
    const errors = [];
    const warnings = [];

    // Verificar se é URL válida
    try {
      new URL(url);
    } catch (e) {
      errors.push('URL inválida');
      return { isValid: false, errors, warnings };
    }

    // Verificar se é do Google Sheets
    if (!url.includes('docs.google.com/spreadsheets')) {
      errors.push('URL deve ser de uma planilha do Google Sheets');
    }

    // Verificar se tem ID
    const spreadsheetId = this._extractSpreadsheetId(url);
    if (!spreadsheetId) {
      errors.push('Não foi possível extrair o ID da planilha da URL');
    }

    // Avisos sobre permissões
    if (!url.includes('/edit') && !url.includes('/export')) {
      warnings.push('Certifique-se de que a planilha está configurada como pública');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      spreadsheetId
    };
  }

  /**
   * Extrair ID da planilha do Google Sheets
   * @param {string} url 
   * @returns {string|null}
   * @private
   */
  _extractSpreadsheetId(url) {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Formata o tamanho do arquivo
   * @param {number} bytes - Tamanho em bytes
   * @returns {string}
   */
  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Dispatch evento de progresso
   * @param {number} progress - Progresso (0-100)
   */
  dispatchProgress(progress) {
    window.dispatchEvent(new CustomEvent('upload-progress', {
      detail: { progress }
    }));
  }

  /**
   * Limpa o arquivo atual
   */
  clear() {
    this.currentFile = null;
    this.currentFormat = null;
  }

  /**
   * Obter formato atual
   * @returns {string|null}
   */
  getCurrentFormat() {
    return this.currentFormat;
  }

  /**
   * Obter lista de formatos suportados
   * @returns {Array}
   */
  getSupportedFormats() {
    return [
      { 
        format: 'excel', 
        extensions: ['.xlsx', '.xls'], 
        icon: '📊', 
        name: 'Microsoft Excel',
        description: 'Planilhas Excel (.xlsx, .xls)'
      },
      { 
        format: 'json', 
        extensions: ['.json'], 
        icon: '{ }', 
        name: 'JSON',
        description: 'JavaScript Object Notation (.json)'
      },
      { 
        format: 'xml', 
        extensions: ['.xml'], 
        icon: '< >', 
        name: 'XML',
        description: 'Extensible Markup Language (.xml)'
      },
      { 
        format: 'csv', 
        extensions: ['.csv'], 
        icon: '📄', 
        name: 'CSV',
        description: 'Comma-Separated Values (.csv)'
      },
      { 
        format: 'google-sheets', 
        extensions: [], 
        icon: '📗', 
        name: 'Google Sheets',
        description: 'Planilhas do Google (via URL pública)'
      }
    ];
  }
}
