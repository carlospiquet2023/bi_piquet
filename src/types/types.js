/**
 * @typedef {Object} ColumnMetadata
 * @property {string} name - Nome da coluna
 * @property {string} type - Tipo detectado (ColumnType)
 * @property {number} nullCount - Quantidade de valores nulos
 * @property {number} uniqueCount - Quantidade de valores únicos
 * @property {any} min - Valor mínimo (para números/datas)
 * @property {any} max - Valor máximo (para números/datas)
 * @property {number} mean - Média (para números)
 * @property {number} median - Mediana (para números)
 * @property {number} stdDev - Desvio padrão (para números)
 * @property {Array<any>} samples - Amostras de valores
 */

/**
 * @typedef {Object} DatasetMetadata
 * @property {string} fileName - Nome do arquivo
 * @property {number} rowCount - Total de linhas
 * @property {number} columnCount - Total de colunas
 * @property {Array<ColumnMetadata>} columns - Metadados das colunas
 * @property {Date} uploadedAt - Data do upload
 * @property {number} fileSize - Tamanho do arquivo em bytes
 */

/**
 * @typedef {Object} KPI
 * @property {string} id - Identificador único
 * @property {string} title - Título do KPI
 * @property {number|string} value - Valor principal
 * @property {number} change - Variação percentual
 * @property {string} trend - 'up' | 'down' | 'neutral'
 * @property {string} icon - Emoji do ícone
 * @property {string} description - Descrição do KPI
 */

/**
 * @typedef {Object} Insight
 * @property {string} id - Identificador único
 * @property {string} type - Tipo do insight (InsightType)
 * @property {string} title - Título do insight
 * @property {string} description - Descrição detalhada
 * @property {number} relevance - Relevância (0-100)
 * @property {string} severity - 'critical' | 'warning' | 'info' | 'success'
 * @property {Object} data - Dados relacionados ao insight
 */

/**
 * @typedef {Object} ChartConfig
 * @property {string} id - Identificador único
 * @property {string} type - Tipo do gráfico (ChartType)
 * @property {string} title - Título do gráfico
 * @property {Object} data - Dados para o gráfico
 * @property {Object} options - Opções de configuração
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Se os dados são válidos
 * @property {Array<ValidationError>} errors - Erros encontrados
 * @property {Array<ValidationWarning>} warnings - Avisos
 * @property {Object} suggestions - Sugestões de correção
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} column - Coluna com erro
 * @property {number} row - Linha com erro
 * @property {string} message - Mensagem de erro
 * @property {string} type - Tipo de erro
 */

/**
 * @typedef {Object} ValidationWarning
 * @property {string} column - Coluna com aviso
 * @property {string} message - Mensagem de aviso
 * @property {number} affectedRows - Linhas afetadas
 */

export {};
