/**
 * 📊 GoogleSheetsParser - Parser de Google Sheets Públicas
 * 
 * Responsável por:
 * - Importar dados de Google Sheets públicas via URL
 * - Converter URL de visualização para URL de exportação CSV
 * - Processar CSV exportado do Google Sheets
 * - Validar permissões de acesso
 * 
 * Formatos de URL suportados:
 * 1. https://docs.google.com/spreadsheets/d/{ID}/edit
 * 2. https://docs.google.com/spreadsheets/d/{ID}/edit#gid={SHEET_ID}
 * 3. URL de exportação direta (CSV)
 * 
 * @class GoogleSheetsParser
 * @author Carlos Antonio de Oliveira Piquet
 * @version 1.0.0
 */

import Papa from 'papaparse';

export class GoogleSheetsParser {
    constructor() {
        this.baseExportUrl = 'https://docs.google.com/spreadsheets/d/';
        this.exportFormat = '/export?format=csv';
    }

    /**
     * Parse Google Sheets a partir de URL
     * @param {string} url - URL da planilha (visualização ou edição)
     * @param {string} sheetId - ID da aba específica (opcional)
     * @returns {Promise<Object>} Dados processados
     */
    async parseGoogleSheets(url, sheetId = null) {
        try {
            // Validar e extrair ID da planilha
            const spreadsheetId = this._extractSpreadsheetId(url);
            if (!spreadsheetId) {
                throw new Error('URL inválida do Google Sheets');
            }

            // Construir URL de exportação CSV
            const csvUrl = this._buildCsvExportUrl(spreadsheetId, sheetId);
            
            console.log('📥 Importando do Google Sheets:', csvUrl);

            // Fazer requisição para obter CSV
            const csvData = await this._fetchCsvData(csvUrl);

            // Parse CSV usando Papa Parse
            const parseResult = await this._parseCsv(csvData);

            if (!parseResult.success || !parseResult.data || parseResult.data.length === 0) {
                throw new Error('Nenhum dado encontrado na planilha');
            }

            return {
                success: true,
                data: parseResult.data,
                metadata: {
                    format: 'google-sheets',
                    rowCount: parseResult.data.length,
                    columnCount: Object.keys(parseResult.data[0] || {}).length,
                    columns: Object.keys(parseResult.data[0] || {}),
                    spreadsheetId,
                    sheetId,
                    sourceUrl: url
                }
            };

        } catch (error) {
            console.error('❌ Erro ao processar Google Sheets:', error);
            return {
                success: false,
                error: error.message,
                data: [],
                metadata: null
            };
        }
    }

    /**
     * Extrair ID da planilha da URL
     * @param {string} url 
     * @returns {string|null}
     * @private
     */
    _extractSpreadsheetId(url) {
        // Padrão: https://docs.google.com/spreadsheets/d/{ID}/...
        const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    /**
     * Extrair ID da aba (gid) da URL
     * @param {string} url 
     * @returns {string|null}
     * @private
     */
    _extractSheetId(url) {
        // Padrão: #gid={SHEET_ID}
        const regex = /gid=([0-9]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    /**
     * Construir URL de exportação CSV
     * @param {string} spreadsheetId 
     * @param {string} sheetId 
     * @returns {string}
     * @private
     */
    _buildCsvExportUrl(spreadsheetId, sheetId = null) {
        let url = `${this.baseExportUrl}${spreadsheetId}${this.exportFormat}`;
        
        // Se tem ID de aba específica, adicionar
        if (sheetId) {
            url += `&gid=${sheetId}`;
        }
        
        return url;
    }

    /**
     * Fazer requisição para obter dados CSV
     * @param {string} url 
     * @returns {Promise<string>}
     * @private
     */
    async _fetchCsvData(url) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Planilha não encontrada. Verifique se a URL está correta.');
                } else if (response.status === 403) {
                    throw new Error('Acesso negado. A planilha precisa ser pública ou compartilhada.');
                } else {
                    throw new Error(`Erro ao acessar planilha: ${response.status} ${response.statusText}`);
                }
            }

            const csvText = await response.text();
            
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('Planilha está vazia');
            }

            return csvText;

        } catch (error) {
            // Se é erro de CORS, sugerir alternativa
            if (error.message.includes('CORS')) {
                throw new Error('Erro de CORS. Use a opção de download CSV e faça upload do arquivo.');
            }
            throw error;
        }
    }

    /**
     * Parse CSV usando Papa Parse
     * @param {string} csvData 
     * @returns {Promise<Object>}
     * @private
     */
    _parseCsv(csvData) {
        return new Promise((resolve) => {
            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    resolve({
                        success: true,
                        data: results.data,
                        errors: results.errors
                    });
                },
                error: (error) => {
                    resolve({
                        success: false,
                        error: error.message,
                        data: []
                    });
                }
            });
        });
    }

    /**
     * Validar URL do Google Sheets
     * @param {string} url 
     * @returns {Object}
     */
    validateUrl(url) {
        const errors = [];
        const warnings = [];

        // Verificar se é URL válida
        try {
            new URL(url);
        } catch (e) {
            errors.push('URL inválida');
            return { valid: false, errors, warnings };
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
            warnings.push('Certifique-se de que a planilha está configurada como pública ou com link de compartilhamento');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            spreadsheetId
        };
    }

    /**
     * Obter informações da planilha a partir da URL
     * @param {string} url 
     * @returns {Object}
     */
    getSheetInfo(url) {
        return {
            spreadsheetId: this._extractSpreadsheetId(url),
            sheetId: this._extractSheetId(url),
            csvExportUrl: this._buildCsvExportUrl(
                this._extractSpreadsheetId(url),
                this._extractSheetId(url)
            )
        };
    }

    /**
     * Gerar URL de compartilhamento público
     * @param {string} spreadsheetId 
     * @returns {string}
     */
    generatePublicUrl(spreadsheetId) {
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`;
    }

    /**
     * Instruções para tornar planilha pública
     * @returns {Object}
     */
    getPublicSharingInstructions() {
        return {
            title: 'Como tornar sua planilha pública',
            steps: [
                '1. Abra a planilha no Google Sheets',
                '2. Clique em "Compartilhar" (canto superior direito)',
                '3. Em "Acesso geral", selecione "Qualquer pessoa com o link"',
                '4. Defina permissão como "Leitor"',
                '5. Clique em "Copiar link"',
                '6. Cole o link aqui no sistema'
            ],
            note: 'A planilha ficará visível apenas para quem tiver o link. Não será indexada no Google.',
            security: 'Recomendação: Use planilhas com dados não-sensíveis ou crie uma cópia antes de compartilhar.'
        };
    }

    /**
     * Exemplos de URLs suportadas
     * @returns {Object}
     */
    getExamples() {
        return {
            urlPadrao: {
                description: 'URL padrão de edição',
                example: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'
            },
            urlComAba: {
                description: 'URL com aba específica (gid)',
                example: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0'
            },
            urlExportacao: {
                description: 'URL de exportação direta (CSV)',
                example: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv'
            },
            planilhaExemplo: {
                description: 'Planilha pública de exemplo (Google)',
                example: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
                note: 'Esta é uma planilha de exemplo pública mantida pelo Google'
            }
        };
    }

    /**
     * Limitações e considerações
     * @returns {Object}
     */
    getLimitations() {
        return {
            cors: {
                title: 'Limitações de CORS',
                description: 'Alguns navegadores podem bloquear requisições cross-origin. Neste caso, baixe o CSV e faça upload.',
                workaround: 'Arquivo → Download → Valores separados por vírgula (.csv)'
            },
            permissions: {
                title: 'Permissões necessárias',
                description: 'A planilha deve estar configurada como pública ou com link de compartilhamento.',
                required: 'Acesso: Qualquer pessoa com o link (Leitor)'
            },
            size: {
                title: 'Tamanho máximo',
                description: 'Recomendado: até 5000 linhas para melhor performance.',
                note: 'Planilhas muito grandes podem demorar para carregar.'
            },
            realtime: {
                title: 'Atualização em tempo real',
                description: 'Os dados são importados no momento da requisição.',
                note: 'Para ver alterações, reimporte a planilha.'
            }
        };
    }
}
