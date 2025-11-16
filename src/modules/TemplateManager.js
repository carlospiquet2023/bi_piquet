/**
 * 📊 TemplateManager - Gerenciador de Templates de Análise
 * 
 * Responsável por:
 * - Gerenciar templates pré-configurados de análise
 * - Aplicar configurações específicas por tipo de negócio
 * - Mapear colunas automaticamente baseado no template
 * - Sugerir KPIs relevantes para cada template
 * 
 * Templates disponíveis:
 * - Vendas e Comercial
 * - Financeiro e Contabilidade
 * - Recursos Humanos (RH)
 * - Estoque e Inventário
 * - Marketing e Campanhas
 * - Atendimento ao Cliente
 * 
 * @class TemplateManager
 * @author Carlos Antonio de Oliveira Piquet
 * @version 1.0.0
 */

export class TemplateManager {
    constructor() {
        this.templates = this._initializeTemplates();
        this.currentTemplate = null;
    }

    /**
     * Inicializar templates pré-configurados
     * @returns {Object}
     * @private
     */
    _initializeTemplates() {
        return {
            vendas: {
                id: 'vendas',
                name: 'Vendas e Comercial',
                icon: '💰',
                description: 'Análise de vendas, produtos, clientes e desempenho comercial',
                color: '#4CAF50',
                expectedColumns: {
                    required: ['data', 'valor'],
                    optional: ['produto', 'cliente', 'vendedor', 'quantidade', 'categoria']
                },
                columnMapping: {
                    data: ['data', 'date', 'data_venda', 'data_pedido', 'dt_venda'],
                    valor: ['valor', 'value', 'preco', 'price', 'total', 'valor_total'],
                    produto: ['produto', 'product', 'item', 'descricao', 'nome_produto'],
                    cliente: ['cliente', 'customer', 'client', 'nome_cliente', 'empresa'],
                    vendedor: ['vendedor', 'seller', 'vendedora', 'responsavel', 'atendente'],
                    quantidade: ['quantidade', 'qty', 'qtd', 'amount', 'unidades'],
                    categoria: ['categoria', 'category', 'tipo', 'grupo', 'segmento']
                },
                kpis: [
                    { id: 'receita_total', name: 'Receita Total', formula: 'SUM', column: 'valor', format: 'currency' },
                    { id: 'ticket_medio', name: 'Ticket Médio', formula: 'AVG', column: 'valor', format: 'currency' },
                    { id: 'total_vendas', name: 'Total de Vendas', formula: 'COUNT', column: 'valor', format: 'number' },
                    { id: 'produtos_vendidos', name: 'Produtos Vendidos', formula: 'SUM', column: 'quantidade', format: 'number' },
                    { id: 'clientes_unicos', name: 'Clientes Únicos', formula: 'DISTINCT', column: 'cliente', format: 'number' }
                ],
                insights: [
                    'Produto mais vendido',
                    'Cliente que mais compra',
                    'Vendedor destaque',
                    'Tendência de vendas',
                    'Sazonalidade por período'
                ]
            },

            financeiro: {
                id: 'financeiro',
                name: 'Financeiro e Contabilidade',
                icon: '💵',
                description: 'Análise de receitas, despesas, fluxo de caixa e lucratividade',
                color: '#2196F3',
                expectedColumns: {
                    required: ['data', 'valor', 'tipo'],
                    optional: ['categoria', 'descricao', 'fornecedor', 'cliente', 'conta']
                },
                columnMapping: {
                    data: ['data', 'date', 'data_lancamento', 'dt_movimento', 'vencimento'],
                    valor: ['valor', 'value', 'amount', 'montante', 'total'],
                    tipo: ['tipo', 'type', 'natureza', 'operacao', 'movimento'],
                    categoria: ['categoria', 'category', 'classificacao', 'grupo', 'centro_custo'],
                    descricao: ['descricao', 'description', 'historico', 'obs', 'observacao'],
                    fornecedor: ['fornecedor', 'supplier', 'creditor', 'favorecido'],
                    cliente: ['cliente', 'customer', 'devedor', 'pagador'],
                    conta: ['conta', 'account', 'banco', 'conta_bancaria']
                },
                kpis: [
                    { id: 'receitas', name: 'Total Receitas', formula: 'SUM_IF', column: 'valor', condition: 'tipo=entrada', format: 'currency' },
                    { id: 'despesas', name: 'Total Despesas', formula: 'SUM_IF', column: 'valor', condition: 'tipo=saida', format: 'currency' },
                    { id: 'lucro', name: 'Lucro/Prejuízo', formula: 'SUBTRACT', columns: ['receitas', 'despesas'], format: 'currency' },
                    { id: 'margem', name: 'Margem (%)', formula: 'DIVIDE', columns: ['lucro', 'receitas'], format: 'percentage' },
                    { id: 'saldo', name: 'Saldo Atual', formula: 'BALANCE', column: 'valor', format: 'currency' }
                ],
                insights: [
                    'Maior categoria de despesa',
                    'Evolução do fluxo de caixa',
                    'Contas a pagar vencidas',
                    'Projeção de saldo',
                    'Despesas vs Receitas mensais'
                ]
            },

            rh: {
                id: 'rh',
                name: 'Recursos Humanos (RH)',
                icon: '👥',
                description: 'Análise de colaboradores, salários, benefícios e turnover',
                color: '#FF9800',
                expectedColumns: {
                    required: ['funcionario', 'salario'],
                    optional: ['departamento', 'cargo', 'data_admissao', 'data_demissao', 'status']
                },
                columnMapping: {
                    funcionario: ['funcionario', 'employee', 'colaborador', 'nome', 'nome_completo'],
                    salario: ['salario', 'salary', 'remuneracao', 'salario_base', 'valor'],
                    departamento: ['departamento', 'department', 'setor', 'area', 'divisao'],
                    cargo: ['cargo', 'position', 'funcao', 'role', 'titulo'],
                    data_admissao: ['data_admissao', 'hire_date', 'dt_admissao', 'inicio', 'contratacao'],
                    data_demissao: ['data_demissao', 'termination_date', 'dt_demissao', 'saida', 'desligamento'],
                    status: ['status', 'situacao', 'ativo', 'state', 'condition']
                },
                kpis: [
                    { id: 'total_funcionarios', name: 'Total de Funcionários', formula: 'COUNT', column: 'funcionario', format: 'number' },
                    { id: 'folha_pagamento', name: 'Folha de Pagamento', formula: 'SUM', column: 'salario', format: 'currency' },
                    { id: 'salario_medio', name: 'Salário Médio', formula: 'AVG', column: 'salario', format: 'currency' },
                    { id: 'turnover', name: 'Turnover Rate', formula: 'TURNOVER', columns: ['data_admissao', 'data_demissao'], format: 'percentage' },
                    { id: 'maior_departamento', name: 'Maior Departamento', formula: 'MODE', column: 'departamento', format: 'text' }
                ],
                insights: [
                    'Departamento com mais funcionários',
                    'Distribuição salarial',
                    'Taxa de rotatividade',
                    'Tempo médio de empresa',
                    'Custo por departamento'
                ]
            },

            estoque: {
                id: 'estoque',
                name: 'Estoque e Inventário',
                icon: '📦',
                description: 'Análise de produtos, quantidades, valores e movimentações',
                color: '#9C27B0',
                expectedColumns: {
                    required: ['produto', 'quantidade'],
                    optional: ['categoria', 'preco', 'fornecedor', 'localizacao', 'validade']
                },
                columnMapping: {
                    produto: ['produto', 'product', 'item', 'codigo', 'sku', 'descricao'],
                    quantidade: ['quantidade', 'qty', 'qtd', 'estoque', 'saldo', 'disponivel'],
                    categoria: ['categoria', 'category', 'tipo', 'grupo', 'familia'],
                    preco: ['preco', 'price', 'valor', 'custo', 'preco_unitario'],
                    fornecedor: ['fornecedor', 'supplier', 'fabricante', 'marca'],
                    localizacao: ['localizacao', 'location', 'deposito', 'armazem', 'local'],
                    validade: ['validade', 'expiration', 'dt_validade', 'vencimento']
                },
                kpis: [
                    { id: 'total_itens', name: 'Total de Itens', formula: 'COUNT', column: 'produto', format: 'number' },
                    { id: 'estoque_total', name: 'Estoque Total (Un)', formula: 'SUM', column: 'quantidade', format: 'number' },
                    { id: 'valor_estoque', name: 'Valor do Estoque', formula: 'SUM_MULTIPLY', columns: ['quantidade', 'preco'], format: 'currency' },
                    { id: 'itens_baixo_estoque', name: 'Itens em Falta', formula: 'COUNT_IF', column: 'quantidade', condition: '<10', format: 'number' },
                    { id: 'categorias', name: 'Categorias', formula: 'DISTINCT', column: 'categoria', format: 'number' }
                ],
                insights: [
                    'Produtos com baixo estoque',
                    'Valor total do inventário',
                    'Categoria com mais itens',
                    'Produtos próximos ao vencimento',
                    'Distribuição por fornecedor'
                ]
            },

            marketing: {
                id: 'marketing',
                name: 'Marketing e Campanhas',
                icon: '📢',
                description: 'Análise de campanhas, leads, conversões e ROI',
                color: '#E91E63',
                expectedColumns: {
                    required: ['campanha', 'investimento'],
                    optional: ['canal', 'leads', 'conversoes', 'data_inicio', 'data_fim', 'receita']
                },
                columnMapping: {
                    campanha: ['campanha', 'campaign', 'nome_campanha', 'promocao', 'acao'],
                    investimento: ['investimento', 'cost', 'custo', 'budget', 'orcamento', 'gasto'],
                    canal: ['canal', 'channel', 'midia', 'plataforma', 'origem'],
                    leads: ['leads', 'prospects', 'contatos', 'impressoes', 'views'],
                    conversoes: ['conversoes', 'conversions', 'vendas', 'sales', 'clientes'],
                    data_inicio: ['data_inicio', 'start_date', 'dt_inicio', 'lancamento'],
                    data_fim: ['data_fim', 'end_date', 'dt_fim', 'encerramento'],
                    receita: ['receita', 'revenue', 'retorno', 'faturamento', 'ganho']
                },
                kpis: [
                    { id: 'investimento_total', name: 'Investimento Total', formula: 'SUM', column: 'investimento', format: 'currency' },
                    { id: 'leads_gerados', name: 'Leads Gerados', formula: 'SUM', column: 'leads', format: 'number' },
                    { id: 'conversoes_total', name: 'Conversões', formula: 'SUM', column: 'conversoes', format: 'number' },
                    { id: 'taxa_conversao', name: 'Taxa de Conversão', formula: 'DIVIDE', columns: ['conversoes', 'leads'], format: 'percentage' },
                    { id: 'roi', name: 'ROI', formula: 'ROI', columns: ['receita', 'investimento'], format: 'percentage' }
                ],
                insights: [
                    'Campanha com melhor ROI',
                    'Canal mais efetivo',
                    'Custo por lead',
                    'Taxa de conversão por canal',
                    'Evolução de performance'
                ]
            },

            atendimento: {
                id: 'atendimento',
                name: 'Atendimento ao Cliente',
                icon: '🎧',
                description: 'Análise de tickets, satisfação, tempo de resposta e SLA',
                color: '#00BCD4',
                expectedColumns: {
                    required: ['ticket', 'data_abertura', 'status'],
                    optional: ['cliente', 'categoria', 'prioridade', 'atendente', 'data_resolucao', 'satisfacao']
                },
                columnMapping: {
                    ticket: ['ticket', 'id', 'numero', 'chamado', 'protocolo'],
                    data_abertura: ['data_abertura', 'created_at', 'dt_abertura', 'inicio'],
                    status: ['status', 'state', 'situacao', 'estado'],
                    cliente: ['cliente', 'customer', 'solicitante', 'usuario'],
                    categoria: ['categoria', 'category', 'tipo', 'assunto', 'motivo'],
                    prioridade: ['prioridade', 'priority', 'urgencia', 'severidade'],
                    atendente: ['atendente', 'agent', 'responsavel', 'operador'],
                    data_resolucao: ['data_resolucao', 'resolved_at', 'dt_resolucao', 'fechamento'],
                    satisfacao: ['satisfacao', 'satisfaction', 'nota', 'rating', 'avaliacao']
                },
                kpis: [
                    { id: 'total_tickets', name: 'Total de Tickets', formula: 'COUNT', column: 'ticket', format: 'number' },
                    { id: 'tickets_abertos', name: 'Tickets Abertos', formula: 'COUNT_IF', column: 'status', condition: '=aberto', format: 'number' },
                    { id: 'tempo_medio_resposta', name: 'Tempo Médio Resolução', formula: 'AVG_DIFF', columns: ['data_abertura', 'data_resolucao'], format: 'hours' },
                    { id: 'satisfacao_media', name: 'Satisfação Média', formula: 'AVG', column: 'satisfacao', format: 'rating' },
                    { id: 'sla_compliance', name: 'SLA Compliance', formula: 'SLA', columns: ['data_abertura', 'data_resolucao'], format: 'percentage' }
                ],
                insights: [
                    'Categoria mais recorrente',
                    'Atendente mais produtivo',
                    'Tickets fora do SLA',
                    'Evolução de satisfação',
                    'Picos de abertura de tickets'
                ]
            }
        };
    }

    /**
     * Listar todos os templates disponíveis
     * @returns {Array}
     */
    listTemplates() {
        return Object.values(this.templates).map(t => ({
            id: t.id,
            name: t.name,
            icon: t.icon,
            description: t.description,
            color: t.color
        }));
    }

    /**
     * Obter template por ID
     * @param {string} templateId 
     * @returns {Object|null}
     */
    getTemplate(templateId) {
        return this.templates[templateId] || null;
    }

    /**
     * Aplicar template aos dados
     * @param {string} templateId 
     * @param {Array} data 
     * @returns {Object}
     */
    applyTemplate(templateId, data) {
        const template = this.getTemplate(templateId);
        if (!template) {
            return {
                success: false,
                error: 'Template não encontrado'
            };
        }

        this.currentTemplate = template;

        // Detectar colunas nos dados
        const availableColumns = Object.keys(data[0] || {});

        // Mapear colunas do template para colunas dos dados
        const mappedColumns = this._mapColumns(template.columnMapping, availableColumns);

        // Validar colunas obrigatórias
        const validation = this._validateRequiredColumns(template.expectedColumns.required, mappedColumns);

        return {
            success: validation.valid,
            template: {
                id: template.id,
                name: template.name,
                icon: template.icon,
                color: template.color
            },
            mappedColumns,
            kpis: template.kpis,
            insights: template.insights,
            validation
        };
    }

    /**
     * Mapear colunas do template para colunas dos dados
     * @param {Object} columnMapping 
     * @param {Array} availableColumns 
     * @returns {Object}
     * @private
     */
    _mapColumns(columnMapping, availableColumns) {
        const mapped = {};

        for (const [templateCol, possibleNames] of Object.entries(columnMapping)) {
            // Procurar correspondência (case-insensitive)
            const found = availableColumns.find(col => {
                const colLower = col.toLowerCase();
                return possibleNames.some(name => name.toLowerCase() === colLower);
            });

            if (found) {
                mapped[templateCol] = found;
            }
        }

        return mapped;
    }

    /**
     * Validar colunas obrigatórias
     * @param {Array} required 
     * @param {Object} mappedColumns 
     * @returns {Object}
     * @private
     */
    _validateRequiredColumns(required, mappedColumns) {
        const missing = required.filter(col => !mappedColumns[col]);

        return {
            valid: missing.length === 0,
            missing,
            found: Object.keys(mappedColumns)
        };
    }

    /**
     * Sugerir template baseado nas colunas dos dados
     * @param {Array} data 
     * @returns {Object}
     */
    suggestTemplate(data) {
        if (!data || data.length === 0) {
            return null;
        }

        const availableColumns = Object.keys(data[0]).map(c => c.toLowerCase());
        const scores = {};

        // Calcular score de compatibilidade para cada template
        for (const [id, template] of Object.entries(this.templates)) {
            let score = 0;

            // Verificar colunas obrigatórias
            for (const requiredCol of template.expectedColumns.required) {
                const possibleNames = template.columnMapping[requiredCol] || [];
                if (possibleNames.some(name => availableColumns.includes(name.toLowerCase()))) {
                    score += 10; // Peso alto para obrigatórias
                }
            }

            // Verificar colunas opcionais
            for (const optionalCol of template.expectedColumns.optional) {
                const possibleNames = template.columnMapping[optionalCol] || [];
                if (possibleNames.some(name => availableColumns.includes(name.toLowerCase()))) {
                    score += 3; // Peso menor para opcionais
                }
            }

            scores[id] = score;
        }

        // Encontrar template com maior score
        const bestMatch = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
        const [templateId, score] = bestMatch;

        if (score === 0) {
            return null; // Nenhum template compatível
        }

        return {
            templateId,
            template: this.templates[templateId],
            score,
            confidence: score > 20 ? 'high' : score > 10 ? 'medium' : 'low'
        };
    }

    /**
     * Obter template atual
     * @returns {Object|null}
     */
    getCurrentTemplate() {
        return this.currentTemplate;
    }

    /**
     * Limpar template atual
     */
    clearTemplate() {
        this.currentTemplate = null;
    }
}
