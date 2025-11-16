/**
 * 📊 JSONParser - Parser de Arquivos JSON
 * 
 * Responsável por:
 * - Importar e validar arquivos JSON
 * - Converter estruturas JSON para formato tabular
 * - Suportar arrays simples e objetos aninhados
 * - Detectar e extrair dados de estruturas complexas
 * 
 * Formatos suportados:
 * 1. Array de objetos: [{"nome": "João", "idade": 30}, ...]
 * 2. Objeto com array: {"data": [...], "metadata": {...}}
 * 3. Arrays aninhados: {"vendas": {"2024": [...]}}
 * 
 * @class JSONParser
 * @author Carlos Antonio de Oliveira Piquet
 * @version 1.0.0
 */

export class JSONParser {
    constructor() {
        this.supportedFormats = [
            'array',           // Array direto de objetos
            'object-with-array', // Objeto contendo array
            'nested-object'    // Objeto aninhado
        ];
        
        this.maxDepth = 5; // Profundidade máxima para busca de arrays
    }

    /**
     * Parse arquivo JSON para formato tabular
     * @param {File|string} input - Arquivo File ou string JSON
     * @returns {Promise<Object>} Dados processados
     */
    async parseJSON(input) {
        try {
            let jsonData;
            
            // Se for File object, ler como texto
            if (input instanceof File) {
                const text = await this._readFileAsText(input);
                jsonData = JSON.parse(text);
            } else if (typeof input === 'string') {
                jsonData = JSON.parse(input);
            } else {
                jsonData = input; // Já é objeto
            }

            // Detectar estrutura e extrair dados
            const extractedData = this._extractTableData(jsonData);
            
            if (!extractedData || extractedData.length === 0) {
                throw new Error('Nenhum dado tabular encontrado no JSON');
            }

            // Normalizar dados para formato tabular consistente
            const normalizedData = this._normalizeData(extractedData);

            return {
                success: true,
                data: normalizedData,
                metadata: {
                    format: 'json',
                    rowCount: normalizedData.length,
                    columnCount: Object.keys(normalizedData[0] || {}).length,
                    columns: Object.keys(normalizedData[0] || {}),
                    originalStructure: this._detectStructure(jsonData)
                }
            };

        } catch (error) {
            console.error('❌ Erro ao processar JSON:', error);
            return {
                success: false,
                error: error.message,
                data: [],
                metadata: null
            };
        }
    }

    /**
     * Ler arquivo como texto
     * @param {File} file 
     * @returns {Promise<string>}
     * @private
     */
    _readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }

    /**
     * Extrair dados tabulares de estrutura JSON
     * @param {*} data - Dados JSON
     * @returns {Array} Array de objetos
     * @private
     */
    _extractTableData(data, depth = 0) {
        // Proteção contra recursão infinita
        if (depth > this.maxDepth) {
            return null;
        }

        // Caso 1: Já é um array de objetos
        if (Array.isArray(data) && data.length > 0) {
            // Verificar se são objetos válidos
            if (typeof data[0] === 'object' && data[0] !== null) {
                return data;
            }
        }

        // Caso 2: É um objeto - procurar arrays dentro dele
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            // Procurar por arrays de objetos nas propriedades
            for (const key in data) {
                const value = data[key];
                
                // Se encontrou array de objetos, retornar
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                    return value;
                }
                
                // Tentar recursivamente em objetos aninhados
                if (typeof value === 'object' && value !== null) {
                    const nested = this._extractTableData(value, depth + 1);
                    if (nested) {
                        return nested;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Detectar estrutura do JSON
     * @param {*} data 
     * @returns {string}
     * @private
     */
    _detectStructure(data) {
        if (Array.isArray(data)) {
            return 'array';
        }
        
        if (typeof data === 'object' && data !== null) {
            // Verificar se tem arrays como propriedades
            for (const key in data) {
                if (Array.isArray(data[key])) {
                    return 'object-with-array';
                }
            }
            return 'nested-object';
        }
        
        return 'unknown';
    }

    /**
     * Normalizar dados para formato consistente
     * @param {Array} data 
     * @returns {Array}
     * @private
     */
    _normalizeData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        // Achatar objetos aninhados (apenas 1 nível)
        return data.map(row => {
            const flatRow = {};
            
            for (const key in row) {
                const value = row[key];
                
                // Se valor é objeto, achatar
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    for (const nestedKey in value) {
                        flatRow[`${key}_${nestedKey}`] = value[nestedKey];
                    }
                } 
                // Se valor é array, converter para string
                else if (Array.isArray(value)) {
                    flatRow[key] = value.join(', ');
                }
                // Valor primitivo
                else {
                    flatRow[key] = value;
                }
            }
            
            return flatRow;
        });
    }

    /**
     * Validar arquivo JSON
     * @param {File} file 
     * @returns {Object}
     */
    validateFile(file) {
        const errors = [];
        const warnings = [];

        // Verificar extensão
        if (!file.name.toLowerCase().endsWith('.json')) {
            errors.push('Arquivo deve ter extensão .json');
        }

        // Verificar tipo MIME
        if (file.type && !file.type.includes('json') && file.type !== 'application/json') {
            warnings.push('Tipo MIME não é application/json, mas vamos tentar processar');
        }

        // Verificar tamanho (máximo 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 50MB`);
        }

        // Verificar se está vazio
        if (file.size === 0) {
            errors.push('Arquivo está vazio');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Converter dados tabulares para JSON
     * @param {Array} data - Array de objetos
     * @param {boolean} pretty - Formatar JSON
     * @returns {string}
     */
    exportToJSON(data, pretty = true) {
        try {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Dados inválidos para exportação');
            }

            const json = pretty 
                ? JSON.stringify(data, null, 2)
                : JSON.stringify(data);

            return json;

        } catch (error) {
            console.error('❌ Erro ao exportar JSON:', error);
            throw error;
        }
    }

    /**
     * Download JSON como arquivo
     * @param {Array} data 
     * @param {string} filename 
     */
    downloadJSON(data, filename = 'export.json') {
        try {
            const json = this.exportToJSON(data, true);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ JSON exportado:', filename);

        } catch (error) {
            console.error('❌ Erro ao fazer download do JSON:', error);
            throw error;
        }
    }

    /**
     * Exemplos de estruturas JSON suportadas
     * @returns {Object}
     */
    getExamples() {
        return {
            arraySimples: {
                description: 'Array de objetos (mais comum)',
                example: [
                    { "data": "2024-01-01", "produto": "Notebook", "valor": 3500 },
                    { "data": "2024-01-02", "produto": "Mouse", "valor": 45 }
                ]
            },
            objetoComArray: {
                description: 'Objeto contendo array de dados',
                example: {
                    "vendas": [
                        { "data": "2024-01-01", "produto": "Notebook", "valor": 3500 },
                        { "data": "2024-01-02", "produto": "Mouse", "valor": 45 }
                    ],
                    "metadata": {
                        "periodo": "Janeiro 2024",
                        "total": 3545
                    }
                }
            },
            objetoAninhado: {
                description: 'Estrutura aninhada',
                example: {
                    "nome": "João Silva",
                    "endereco": {
                        "rua": "Rua A",
                        "cidade": "São Paulo"
                    },
                    "vendas": 15000
                }
            }
        };
    }
}
