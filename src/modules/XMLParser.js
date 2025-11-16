/**
 * 📊 XMLParser - Parser de Arquivos XML
 * 
 * Responsável por:
 * - Importar e validar arquivos XML
 * - Converter estruturas XML para formato tabular
 * - Suportar diferentes estruturas XML (elementos, atributos)
 * - Extrair dados de tags repetidas
 * 
 * Formatos suportados:
 * 1. Lista de elementos: <vendas><venda>...</venda></vendas>
 * 2. Elementos com atributos: <venda id="1" valor="100"/>
 * 3. Estruturas mistas: atributos + elementos filhos
 * 
 * @class XMLParser
 * @author Carlos Antonio de Oliveira Piquet
 * @version 1.0.0
 */

export class XMLParser {
    constructor() {
        this.parser = new DOMParser();
        this.maxDepth = 5;
    }

    /**
     * Parse arquivo XML para formato tabular
     * @param {File|string} input - Arquivo File ou string XML
     * @returns {Promise<Object>} Dados processados
     */
    async parseXML(input) {
        try {
            let xmlText;
            
            // Se for File object, ler como texto
            if (input instanceof File) {
                xmlText = await this._readFileAsText(input);
            } else if (typeof input === 'string') {
                xmlText = input;
            } else {
                throw new Error('Formato de entrada inválido');
            }

            // Parse XML
            const xmlDoc = this.parser.parseFromString(xmlText, 'text/xml');
            
            // Verificar erros de parsing
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('XML mal formatado: ' + parserError.textContent);
            }

            // Detectar estrutura e extrair dados
            const extractedData = this._extractTableData(xmlDoc);
            
            if (!extractedData || extractedData.length === 0) {
                throw new Error('Nenhum dado tabular encontrado no XML');
            }

            // Normalizar dados
            const normalizedData = this._normalizeData(extractedData);

            return {
                success: true,
                data: normalizedData,
                metadata: {
                    format: 'xml',
                    rowCount: normalizedData.length,
                    columnCount: Object.keys(normalizedData[0] || {}).length,
                    columns: Object.keys(normalizedData[0] || {}),
                    rootElement: xmlDoc.documentElement.nodeName
                }
            };

        } catch (error) {
            console.error('❌ Erro ao processar XML:', error);
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
     * Extrair dados tabulares de estrutura XML
     * @param {Document} xmlDoc 
     * @returns {Array}
     * @private
     */
    _extractTableData(xmlDoc) {
        const root = xmlDoc.documentElement;
        
        // Procurar por elementos repetidos (linhas da tabela)
        const repeatingElements = this._findRepeatingElements(root);
        
        if (!repeatingElements || repeatingElements.length === 0) {
            return null;
        }

        // Converter elementos para objetos
        return Array.from(repeatingElements).map(element => 
            this._elementToObject(element)
        );
    }

    /**
     * Encontrar elementos repetidos (candidatos a linhas)
     * @param {Element} root 
     * @returns {NodeList}
     * @private
     */
    _findRepeatingElements(root) {
        const childTags = new Map();
        
        // Contar tags filhas
        for (const child of root.children) {
            const tagName = child.tagName;
            childTags.set(tagName, (childTags.get(tagName) || 0) + 1);
        }

        // Encontrar tag mais repetida (provavelmente as "linhas")
        let maxCount = 0;
        let rowTagName = null;
        
        for (const [tagName, count] of childTags.entries()) {
            if (count > maxCount) {
                maxCount = count;
                rowTagName = tagName;
            }
        }

        // Retornar todos os elementos dessa tag
        if (rowTagName && maxCount > 0) {
            return root.getElementsByTagName(rowTagName);
        }

        // Se não encontrou elementos repetidos, tentar recursivamente
        if (root.children.length === 1) {
            return this._findRepeatingElements(root.children[0]);
        }

        return null;
    }

    /**
     * Converter elemento XML para objeto JavaScript
     * @param {Element} element 
     * @returns {Object}
     * @private
     */
    _elementToObject(element) {
        const obj = {};

        // 1. Adicionar atributos
        if (element.attributes.length > 0) {
            for (const attr of element.attributes) {
                obj[attr.name] = attr.value;
            }
        }

        // 2. Processar elementos filhos
        if (element.children.length > 0) {
            for (const child of element.children) {
                const tagName = child.tagName;
                const textContent = child.textContent.trim();
                
                // Se tem filhos, recursivamente converter
                if (child.children.length > 0) {
                    obj[tagName] = this._elementToObject(child);
                } else {
                    obj[tagName] = textContent;
                }
            }
        } 
        // 3. Se não tem filhos, usar textContent
        else {
            const textContent = element.textContent.trim();
            if (textContent && Object.keys(obj).length === 0) {
                obj['value'] = textContent;
            }
        }

        return obj;
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
                } else {
                    flatRow[key] = value;
                }
            }
            
            return flatRow;
        });
    }

    /**
     * Validar arquivo XML
     * @param {File} file 
     * @returns {Object}
     */
    validateFile(file) {
        const errors = [];
        const warnings = [];

        // Verificar extensão
        const validExtensions = ['.xml', '.xsd', '.svg'];
        const hasValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension) {
            errors.push('Arquivo deve ter extensão .xml');
        }

        // Verificar tipo MIME
        if (file.type && !file.type.includes('xml')) {
            warnings.push('Tipo MIME não é application/xml, mas vamos tentar processar');
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
     * Converter dados tabulares para XML
     * @param {Array} data - Array de objetos
     * @param {string} rootTag - Nome da tag raiz
     * @param {string} rowTag - Nome da tag de linha
     * @returns {string}
     */
    exportToXML(data, rootTag = 'data', rowTag = 'row') {
        try {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Dados inválidos para exportação');
            }

            let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
            xml += `<${rootTag}>\n`;

            for (const row of data) {
                xml += `  <${rowTag}>\n`;
                
                for (const [key, value] of Object.entries(row)) {
                    const safeKey = this._sanitizeTagName(key);
                    const safeValue = this._escapeXML(String(value));
                    xml += `    <${safeKey}>${safeValue}</${safeKey}>\n`;
                }
                
                xml += `  </${rowTag}>\n`;
            }

            xml += `</${rootTag}>`;

            return xml;

        } catch (error) {
            console.error('❌ Erro ao exportar XML:', error);
            throw error;
        }
    }

    /**
     * Sanitizar nome de tag XML
     * @param {string} name 
     * @returns {string}
     * @private
     */
    _sanitizeTagName(name) {
        return String(name)
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/^[0-9]/, '_$&');
    }

    /**
     * Escapar caracteres especiais XML
     * @param {string} text 
     * @returns {string}
     * @private
     */
    _escapeXML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Download XML como arquivo
     * @param {Array} data 
     * @param {string} filename 
     */
    downloadXML(data, filename = 'export.xml') {
        try {
            const xml = this.exportToXML(data);
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ XML exportado:', filename);

        } catch (error) {
            console.error('❌ Erro ao fazer download do XML:', error);
            throw error;
        }
    }

    /**
     * Exemplos de estruturas XML suportadas
     * @returns {Object}
     */
    getExamples() {
        return {
            listaSimples: {
                description: 'Lista de elementos (mais comum)',
                example: `<?xml version="1.0" encoding="UTF-8"?>
<vendas>
  <venda>
    <data>2024-01-01</data>
    <produto>Notebook</produto>
    <valor>3500</valor>
  </venda>
  <venda>
    <data>2024-01-02</data>
    <produto>Mouse</produto>
    <valor>45</valor>
  </venda>
</vendas>`
            },
            comAtributos: {
                description: 'Elementos com atributos',
                example: `<?xml version="1.0" encoding="UTF-8"?>
<vendas>
  <venda id="1" data="2024-01-01">
    <produto>Notebook</produto>
    <valor>3500</valor>
  </venda>
  <venda id="2" data="2024-01-02">
    <produto>Mouse</produto>
    <valor>45</valor>
  </venda>
</vendas>`
            },
            estruturaMista: {
                description: 'Estrutura mista (atributos + elementos)',
                example: `<?xml version="1.0" encoding="UTF-8"?>
<vendas periodo="Janeiro 2024">
  <venda id="1">
    <cliente nome="João Silva" cidade="São Paulo"/>
    <produto>Notebook</produto>
    <valor moeda="BRL">3500</valor>
  </venda>
</vendas>`
            }
        };
    }
}
