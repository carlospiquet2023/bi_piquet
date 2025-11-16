/**
 * Módulo de Upload e Validação de Arquivos
 * Responsável por:
 * - Upload de arquivos Excel
 * - Validação de tipo e tamanho
 * - Tratamento de erros
 */

export class FileUploadManager {
  constructor() {
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedExtensions = ['.xlsx', '.xls'];
    this.currentFile = null;
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

    // Validar tipo MIME
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    
    if (!validMimeTypes.includes(file.type) && file.type !== '') {
      warnings.push('Tipo MIME do arquivo pode não ser compatível');
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
        lastModified: new Date(file.lastModified),
      }
    };
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
    
    try {
      const arrayBuffer = await this.readFile(file);
      
      return {
        success: true,
        data: arrayBuffer,
        fileInfo: validation.fileInfo,
        warnings: validation.warnings,
      };
    } catch (error) {
      throw new Error(`Falha no upload: ${error.message}`);
    }
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
  }
}
