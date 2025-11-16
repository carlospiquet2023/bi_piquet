/**
 * AIReportGenerator.js
 * Gerador de Relatórios Detalhados com IA (DeepSeek)
 * 
 * Análises de nível profissional sênior:
 * - Análise profunda de tendências e padrões
 * - Identificação de anomalias e oportunidades
 * - Recomendações estratégicas personalizadas
 * - Previsões e simulações de cenários
 * - Análise de causas raiz
 * 
 * @author Carlos Antonio de Oliveira Piquet
 */

export class AIReportGenerator {
    constructor() {
        this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
        this.apiUrl = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com';
        this.model = 'deepseek-chat';
        this.maxRetries = 3;
        this.retryDelay = 2000;
    }

    /**
     * Gera relatório completo com análise de IA
     */
    async generateComprehensiveReport(data, analytics, advancedAnalytics) {
        try {
            const sections = await Promise.all([
                this.analyzeExecutiveSummary(data, analytics, advancedAnalytics),
                this.analyzeTrends(data, analytics),
                this.analyzeOpportunities(data, analytics, advancedAnalytics),
                this.analyzeRisks(data, analytics, advancedAnalytics),
                this.analyzePerformance(data, analytics, advancedAnalytics),
                this.analyzeStrategicRecommendations(data, analytics, advancedAnalytics),
                this.analyzePredictions(data, analytics, advancedAnalytics),
                this.analyzeActionPlan(data, analytics, advancedAnalytics)
            ]);

            return {
                timestamp: new Date().toISOString(),
                reportId: this.generateReportId(),
                sections: {
                    executiveSummary: sections[0],
                    trends: sections[1],
                    opportunities: sections[2],
                    risks: sections[3],
                    performance: sections[4],
                    recommendations: sections[5],
                    predictions: sections[6],
                    actionPlan: sections[7]
                },
                metadata: this.generateMetadata(data, analytics)
            };
        } catch (error) {
            console.error('Erro ao gerar relatório com IA:', error);
            return this.generateFallbackReport(data, analytics, advancedAnalytics);
        }
    }

    /**
     * Análise Executiva (Resumo para C-Level)
     */
    async analyzeExecutiveSummary(data, analytics, advancedAnalytics) {
        const prompt = this.buildExecutiveSummaryPrompt(data, analytics, advancedAnalytics);
        const response = await this.callDeepSeekAPI(prompt, 'executive');
        
        return {
            title: '📊 Sumário Executivo',
            content: response,
            priority: 'critical',
            audience: 'C-Level'
        };
    }

    /**
     * Análise de Tendências (Padrões Temporais)
     */
    async analyzeTrends(data, analytics) {
        const prompt = `
Você é um analista de dados SÊNIOR especializado em identificar tendências e padrões temporais.

DADOS FINANCEIROS:
- Receita Total: ${this.formatCurrency(analytics.totalRevenue)}
- Despesas Totais: ${this.formatCurrency(analytics.totalExpenses)}
- Lucro/Prejuízo: ${this.formatCurrency(analytics.profit)}
- Margem: ${this.formatPercentage(analytics.margin)}
- Período: ${analytics.dateRange?.start} a ${analytics.dateRange?.end}

DADOS MENSAIS:
${this.formatMonthlyData(analytics.byMonth)}

TAREFA: Analise as tendências identificando:
1. Padrões de crescimento ou queda (com % específicos)
2. Sazonalidade (quais meses são melhores/piores e por quê)
3. Anomalias (valores fora do padrão)
4. Ciclos de negócio identificados
5. Comparação com média histórica
6. Velocidade de mudança (aceleração/desaceleração)

Seja ESPECÍFICO com números, percentuais e datas. Identifique CAUSAS prováveis.
`;

        const response = await this.callDeepSeekAPI(prompt, 'trends');
        
        return {
            title: '📈 Análise de Tendências e Padrões',
            content: response,
            insights: this.extractTrendInsights(analytics),
            charts: ['line', 'area', 'trend']
        };
    }

    /**
     * Análise de Oportunidades (Crescimento)
     */
    async analyzeOpportunities(data, analytics, advancedAnalytics) {
        const prompt = `
Você é um CONSULTOR ESTRATÉGICO especializado em identificar oportunidades de crescimento.

ANÁLISE RFM (Segmentação de Clientes):
${this.formatRFMData(advancedAnalytics?.rfm)}

ANÁLISE DE PRODUTOS:
${this.formatProductData(analytics.byProduct)}

ANÁLISE GEOGRÁFICA:
${this.formatGeoData(advancedAnalytics?.geo)}

MARKET BASKET (Produtos Comprados Juntos):
${this.formatMarketBasketData(advancedAnalytics?.marketBasket)}

TAREFA: Identifique oportunidades de crescimento:
1. Clientes com potencial de upsell (RFM)
2. Produtos para cross-sell e bundling
3. Regiões inexploradas ou subaproveitadas
4. Segmentos de clientes para expansão
5. Produtos âncora para alavancar vendas
6. Estratégias de reativação de clientes inativos
7. Nichos com alto potencial de ROI

Para CADA oportunidade, forneça:
- Potencial de receita estimado (R$)
- Investimento necessário estimado
- Tempo de implementação
- Prioridade (Alta/Média/Baixa)
- ROI esperado (%)
`;

        const response = await this.callDeepSeekAPI(prompt, 'opportunities');
        
        return {
            title: '💡 Oportunidades de Crescimento',
            content: response,
            estimatedImpact: this.calculateOpportunityImpact(advancedAnalytics),
            priority: 'high'
        };
    }

    /**
     * Análise de Riscos (Ameaças e Problemas)
     */
    async analyzeRisks(data, analytics, advancedAnalytics) {
        const prompt = `
Você é um ANALISTA DE RISCOS especializado em identificar ameaças ao negócio.

ANÁLISE DE CHURN (Risco de Perda de Clientes):
${this.formatChurnData(advancedAnalytics?.churn)}

CONCENTRAÇÃO DE RECEITA:
${this.formatConcentrationData(analytics)}

TENDÊNCIAS NEGATIVAS:
${this.formatNegativeTrends(analytics)}

ALERTAS CRÍTICOS:
${this.formatAlerts(advancedAnalytics?.alerts)}

TAREFA: Identifique e analise riscos:
1. Clientes em risco de churn (com score de probabilidade)
2. Concentração excessiva (produtos, clientes, regiões)
3. Quedas de performance e suas causas
4. Margem apertada ou custos altos
5. Períodos de baixo lucro
6. Dependência de poucos clientes/produtos
7. Tendências de deterioração

Para CADA risco, forneça:
- Severidade (Crítica/Alta/Média/Baixa)
- Probabilidade de ocorrência (%)
- Impacto financeiro estimado (R$)
- Ações mitigadoras imediatas
- Indicadores para monitorar
`;

        const response = await this.callDeepSeekAPI(prompt, 'risks');
        
        return {
            title: '⚠️ Análise de Riscos e Ameaças',
            content: response,
            severity: this.calculateRiskSeverity(advancedAnalytics),
            alerts: advancedAnalytics?.alerts || []
        };
    }

    /**
     * Análise de Performance (Benchmarking)
     */
    async analyzePerformance(data, analytics, advancedAnalytics) {
        const prompt = `
Você é um ANALISTA DE PERFORMANCE especializado em benchmarking e KPIs.

KPIS PRINCIPAIS:
- Receita: ${this.formatCurrency(analytics.totalRevenue)}
- Lucro: ${this.formatCurrency(analytics.profit)}
- Margem: ${this.formatPercentage(analytics.margin)}
- Ticket Médio: ${this.formatCurrency(analytics.averageTicket)}
- Clientes: ${analytics.totalCustomers || 'N/A'}

RANKING DE PRODUTOS:
${this.formatProductRanking(analytics.byProduct)}

RANKING DE FUNCIONÁRIOS/VENDEDORES:
${this.formatEmployeeRanking(analytics.byEmployee)}

ANÁLISE DE COORTE (Retenção):
${this.formatCohortData(advancedAnalytics?.cohort)}

CORRELAÇÕES IMPORTANTES:
${this.formatCorrelationData(advancedAnalytics?.correlation)}

TAREFA: Avalie a performance identificando:
1. Top performers (produtos, vendedores, categorias)
2. Underperformers que precisam de atenção
3. Comparação com benchmarks da indústria (se aplicável)
4. Taxa de retenção e seu impacto
5. Eficiência operacional (custo vs receita)
6. KPIs fora do padrão (positivo ou negativo)
7. Correlações que impactam resultados

Para CADA análise:
- Compare com período anterior (% de mudança)
- Identifique padrões de sucesso replicáveis
- Sugira metas SMART realistas
`;

        const response = await this.callDeepSeekAPI(prompt, 'performance');
        
        return {
            title: '🏆 Análise de Performance e Benchmarking',
            content: response,
            benchmarks: this.generateBenchmarks(analytics),
            rankings: this.generateRankings(analytics)
        };
    }

    /**
     * Recomendações Estratégicas
     */
    async analyzeStrategicRecommendations(data, analytics, advancedAnalytics) {
        const prompt = `
Você é um CONSULTOR ESTRATÉGICO DE NEGÓCIOS com visão holística.

CONTEXTO COMPLETO DO NEGÓCIO:
${this.buildBusinessContext(data, analytics, advancedAnalytics)}

TAREFA: Forneça recomendações estratégicas ACIONÁVEIS:

1. CURTO PRAZO (0-3 meses):
   - Ações imediatas de alto impacto
   - Quick wins (ganhos rápidos)
   - Correções de problemas críticos

2. MÉDIO PRAZO (3-12 meses):
   - Projetos estruturantes
   - Melhorias de processos
   - Expansão planejada

3. LONGO PRAZO (12+ meses):
   - Visão estratégica
   - Transformação digital
   - Novos mercados/produtos

Para CADA recomendação:
- Objetivo claro e mensurável
- Recursos necessários (humanos, financeiros, tempo)
- ROI esperado
- Riscos e mitigações
- Métricas de sucesso
- Prioridade (P0/P1/P2/P3)
`;

        const response = await this.callDeepSeekAPI(prompt, 'recommendations');
        
        return {
            title: '🎯 Recomendações Estratégicas',
            content: response,
            roadmap: this.generateRoadmap(analytics, advancedAnalytics),
            priority: 'critical'
        };
    }

    /**
     * Previsões e Projeções
     */
    async analyzePredictions(data, analytics, advancedAnalytics) {
        const prompt = `
Você é um CIENTISTA DE DADOS especializado em previsões e modelagem preditiva.

DADOS HISTÓRICOS:
${this.formatHistoricalData(analytics)}

MACHINE LEARNING - PREVISÕES:
${this.formatMLPredictions(advancedAnalytics?.ml)}

ANÁLISE DE SÉRIES TEMPORAIS:
${this.formatTimeSeriesData(advancedAnalytics?.timeSeries)}

TAREFA: Gere previsões e projeções:

1. RECEITA FUTURA:
   - Próximo mês (com intervalo de confiança)
   - Próximo trimestre
   - Próximo ano
   - Cenário otimista, realista, pessimista

2. TENDÊNCIAS ESPERADAS:
   - Continuação de padrões identificados
   - Possíveis pontos de inflexão
   - Sazonalidade futura

3. IMPACTO DE INICIATIVAS:
   - Projeção se implementar recomendações
   - ROI esperado de investimentos

4. ALERTAS FUTUROS:
   - Quando métricas críticas podem ser atingidas
   - Momentos de atenção (picos, vales)

Base suas previsões em:
- Dados históricos concretos
- Modelos estatísticos (ML, regressão)
- Padrões sazonais identificados
- Tendências confirmadas

Seja CONSERVADOR mas ESPECÍFICO. Indique nível de confiança (%) para cada previsão.
`;

        const response = await this.callDeepSeekAPI(prompt, 'predictions');
        
        return {
            title: '🔮 Previsões e Projeções',
            content: response,
            predictions: this.extractPredictions(advancedAnalytics),
            confidence: this.calculateConfidence(advancedAnalytics)
        };
    }

    /**
     * Plano de Ação Detalhado
     */
    async analyzeActionPlan(data, analytics, advancedAnalytics) {
        const prompt = `
Você é um GERENTE DE PROJETOS especializado em planos de ação executáveis.

Com base em TODAS as análises anteriores (tendências, oportunidades, riscos, performance, recomendações, previsões), crie um PLANO DE AÇÃO DETALHADO.

FORMATO:

**AÇÕES IMEDIATAS (Esta Semana):**
1. [Ação específica]
   - Responsável sugerido: [Cargo/Área]
   - Tempo estimado: [Horas/Dias]
   - Custo estimado: R$ [Valor]
   - Resultado esperado: [Métrica específica]

**AÇÕES PRIORITÁRIAS (Este Mês):**
[Mesmo formato]

**AÇÕES ESTRATÉGICAS (Este Trimestre):**
[Mesmo formato]

**MÉTRICAS DE ACOMPANHAMENTO:**
- [Métrica 1]: Meta [valor], Frequência [diária/semanal/mensal]
- [Métrica 2]: ...

**CRONOGRAMA VISUAL:**
Semana 1: [Ações]
Semana 2-4: [Ações]
Mês 2-3: [Ações]

**ORÇAMENTO ESTIMADO:**
- Total curto prazo: R$ [valor]
- Total médio prazo: R$ [valor]
- ROI esperado: [%] em [prazo]

Seja EXTREMAMENTE ESPECÍFICO e ACIONÁVEL. Cada ação deve poder ser executada imediatamente.
`;

        const response = await this.callDeepSeekAPI(prompt, 'action_plan');
        
        return {
            title: '✅ Plano de Ação Detalhado',
            content: response,
            timeline: this.generateTimeline(analytics, advancedAnalytics),
            budget: this.estimateBudget(analytics)
        };
    }

    /**
     * Chama a API DeepSeek com retry logic
     */
    async callDeepSeekAPI(prompt, section) {
        if (!this.apiKey || this.apiKey === 'sua_chave_api_aqui') {
            console.warn('API Key não configurada. Usando análise local.');
            return this.generateLocalAnalysis(section);
        }

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.apiUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            {
                                role: 'system',
                                content: 'Você é um analista de negócios SÊNIOR com 20+ anos de experiência em Business Intelligence, análise financeira e estratégia corporativa. Suas análises são profundas, baseadas em dados, e fornecem insights acionáveis. Você sempre fornece números específicos, percentuais e recomendações práticas.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 2000,
                        stream: false
                    })
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                return data.choices[0].message.content;

            } catch (error) {
                console.error(`Tentativa ${attempt} falhou:`, error);
                
                if (attempt === this.maxRetries) {
                    console.warn('Todas as tentativas falharam. Usando análise local.');
                    return this.generateLocalAnalysis(section);
                }
                
                await this.sleep(this.retryDelay * attempt);
            }
        }
    }

    /**
     * Análise local como fallback (sem IA)
     */
    generateLocalAnalysis(section) {
        const localAnalyses = {
            executive: '**Sumário Executivo Gerado Localmente**\n\nO sistema detectou padrões importantes nos dados fornecidos. Para análises mais profundas com IA, configure a API DeepSeek no arquivo .env.',
            trends: '**Análise de Tendências**\n\nPadrões temporais identificados com base em análise estatística local.',
            opportunities: '**Oportunidades Identificadas**\n\nOportunidades baseadas em análise de dados estruturada.',
            risks: '**Riscos Identificados**\n\nRiscos calculados com base em thresholds estatísticos.',
            performance: '**Análise de Performance**\n\nKPIs e benchmarks calculados localmente.',
            recommendations: '**Recomendações**\n\nRecomendações baseadas em regras de negócio pré-configuradas.',
            predictions: '**Previsões**\n\nProjeções baseadas em modelos estatísticos locais (regressão, média móvel).',
            action_plan: '**Plano de Ação**\n\nPlano gerado com base nas análises anteriores.'
        };

        return localAnalyses[section] || 'Análise não disponível.';
    }

    // ==================== FORMATADORES DE DADOS ====================

    buildExecutiveSummaryPrompt(data, analytics, advancedAnalytics) {
        return `
Você é um ANALISTA C-LEVEL apresentando para CEO/CFO/COO.

RESUMO FINANCEIRO:
- Receita Total: ${this.formatCurrency(analytics.totalRevenue)}
- Despesas: ${this.formatCurrency(analytics.totalExpenses)}
- Lucro: ${this.formatCurrency(analytics.profit)}
- Margem: ${this.formatPercentage(analytics.margin)}
- Período: ${analytics.dateRange?.start} a ${analytics.dateRange?.end}

DESTAQUES:
- Produto Campeão: ${analytics.topProduct?.name || 'N/A'} (${this.formatCurrency(analytics.topProduct?.total)})
- Funcionário Destaque: ${analytics.topEmployee?.name || 'N/A'}
- Total de Clientes: ${analytics.totalCustomers || 'N/A'}
- Ticket Médio: ${this.formatCurrency(analytics.averageTicket)}

ANÁLISES AVANÇADAS DISPONÍVEIS:
${this.summarizeAdvancedAnalytics(advancedAnalytics)}

TAREFA: Crie um sumário executivo de 2-3 parágrafos:
1. Situação atual do negócio (saúde financeira)
2. 3 principais descobertas (positivas ou negativas)
3. 1 recomendação crítica imediata

Use linguagem executiva, seja direto, números primeiro.
`;
    }

    formatMonthlyData(byMonth) {
        if (!byMonth || Object.keys(byMonth).length === 0) return 'Dados mensais não disponíveis';
        
        return Object.entries(byMonth)
            .map(([month, data]) => `${month}: Receita ${this.formatCurrency(data.revenue)}, Despesas ${this.formatCurrency(data.expenses)}`)
            .join('\n');
    }

    formatRFMData(rfm) {
        if (!rfm?.available) return 'Análise RFM não disponível';
        
        const segments = rfm.segments || {};
        return Object.entries(segments)
            .map(([segment, clients]) => `${segment}: ${clients.length} clientes`)
            .slice(0, 5)
            .join('\n');
    }

    formatProductData(byProduct) {
        if (!byProduct || Object.keys(byProduct).length === 0) return 'Dados de produtos não disponíveis';
        
        return Object.entries(byProduct)
            .slice(0, 10)
            .map(([product, data]) => `${product}: ${this.formatCurrency(data.total)} (${data.count} vendas)`)
            .join('\n');
    }

    formatGeoData(geo) {
        if (!geo?.available) return 'Análise geográfica não disponível';
        
        const states = geo.byState || {};
        return Object.entries(states)
            .slice(0, 10)
            .map(([state, data]) => `${state}: ${this.formatCurrency(data.revenue)}`)
            .join('\n');
    }

    formatMarketBasketData(marketBasket) {
        if (!marketBasket?.available) return 'Market Basket não disponível';
        
        const rules = marketBasket.associationRules || [];
        return rules
            .slice(0, 5)
            .map(rule => `${rule.antecedent.join('+')} → ${rule.consequent.join('+')} (Confiança: ${(rule.confidence * 100).toFixed(1)}%)`)
            .join('\n');
    }

    formatChurnData(churn) {
        if (!churn?.available) return 'Análise de Churn não disponível';
        
        return `
Total em Risco: ${churn.atRisk?.length || 0} clientes
Risco Alto: ${churn.riskDistribution?.ALTO || 0}
Risco Médio: ${churn.riskDistribution?.MÉDIO || 0}
Impacto Financeiro Estimado: ${this.formatCurrency(churn.totalAtRiskRevenue || 0)}
`;
    }

    formatConcentrationData(analytics) {
        const top3Products = Object.entries(analytics.byProduct || {})
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 3);
        
        const top3Revenue = top3Products.reduce((sum, [_, data]) => sum + data.total, 0);
        const concentration = (top3Revenue / analytics.totalRevenue * 100).toFixed(1);
        
        return `Top 3 produtos representam ${concentration}% da receita`;
    }

    formatNegativeTrends(analytics) {
        const trends = [];
        
        if (analytics.margin < 0.15) trends.push('⚠️ Margem baixa (<15%)');
        if (analytics.profit < 0) trends.push('🔴 Prejuízo no período');
        
        return trends.length > 0 ? trends.join('\n') : 'Nenhuma tendência negativa crítica identificada';
    }

    formatAlerts(alerts) {
        if (!alerts || alerts.length === 0) return 'Nenhum alerta crítico';
        
        return alerts
            .slice(0, 5)
            .map(alert => `${this.getSeverityIcon(alert.severity)} ${alert.message}`)
            .join('\n');
    }

    formatProductRanking(byProduct) {
        if (!byProduct) return 'Ranking não disponível';
        
        return Object.entries(byProduct)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10)
            .map(([product, data], index) => `${index + 1}. ${product}: ${this.formatCurrency(data.total)}`)
            .join('\n');
    }

    formatEmployeeRanking(byEmployee) {
        if (!byEmployee) return 'Ranking não disponível';
        
        return Object.entries(byEmployee)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10)
            .map(([employee, data], index) => `${index + 1}. ${employee}: ${this.formatCurrency(data.total)}`)
            .join('\n');
    }

    formatCohortData(cohort) {
        if (!cohort?.available) return 'Análise de Coorte não disponível';
        
        return `Taxa de Retenção Média: ${cohort.averageRetention?.toFixed(1)}%`;
    }

    formatCorrelationData(correlation) {
        if (!correlation?.available) return 'Correlações não disponíveis';
        
        const strong = correlation.strongCorrelations || [];
        return strong
            .slice(0, 5)
            .map(c => `${c.var1} ↔ ${c.var2}: ${c.correlation.toFixed(2)}`)
            .join('\n');
    }

    buildBusinessContext(data, analytics, advancedAnalytics) {
        return `
FINANCEIRO: Receita ${this.formatCurrency(analytics.totalRevenue)}, Lucro ${this.formatCurrency(analytics.profit)}, Margem ${this.formatPercentage(analytics.margin)}
PRODUTOS: ${Object.keys(analytics.byProduct || {}).length} produtos ativos
CLIENTES: ${analytics.totalCustomers || 'N/A'} clientes
PERÍODO: ${analytics.dateRange?.start} a ${analytics.dateRange?.end}
SEGMENTAÇÃO RFM: ${advancedAnalytics?.rfm?.available ? 'Disponível' : 'N/A'}
CHURN: ${advancedAnalytics?.churn?.atRisk?.length || 0} clientes em risco
`;
    }

    formatHistoricalData(analytics) {
        const months = Object.keys(analytics.byMonth || {}).length;
        return `${months} meses de dados históricos disponíveis`;
    }

    formatMLPredictions(ml) {
        if (!ml?.available) return 'Previsões ML não disponíveis';
        
        const pred = ml.predictions?.revenue;
        return pred ? `Próximo mês: ${this.formatCurrency(pred.nextMonth)} (Confiança: ${(pred.confidence * 100).toFixed(0)}%)` : 'N/A';
    }

    formatTimeSeriesData(timeSeries) {
        if (!timeSeries?.available) return 'Série temporal não disponível';
        
        return `Tendência: ${timeSeries.trend || 'N/A'}, Sazonalidade: ${timeSeries.seasonality ? 'Detectada' : 'Não detectada'}`;
    }

    summarizeAdvancedAnalytics(advancedAnalytics) {
        if (!advancedAnalytics) return 'Análises avançadas não disponíveis';
        
        const available = [];
        if (advancedAnalytics.ml?.available) available.push('Machine Learning');
        if (advancedAnalytics.rfm?.available) available.push('RFM');
        if (advancedAnalytics.churn?.available) available.push('Churn');
        if (advancedAnalytics.cohort?.available) available.push('Cohort');
        if (advancedAnalytics.geo?.available) available.push('Geográfica');
        
        return available.length > 0 ? available.join(', ') : 'Nenhuma';
    }

    // ==================== HELPERS ====================

    extractTrendInsights(analytics) {
        const insights = [];
        
        const monthlyData = Object.values(analytics.byMonth || {});
        if (monthlyData.length >= 2) {
            const recent = monthlyData.slice(-2);
            const growth = ((recent[1].revenue - recent[0].revenue) / recent[0].revenue * 100).toFixed(1);
            insights.push({
                type: growth > 0 ? 'positive' : 'negative',
                message: `Receita ${growth > 0 ? 'cresceu' : 'caiu'} ${Math.abs(growth)}% no último mês`
            });
        }
        
        return insights;
    }

    calculateOpportunityImpact(advancedAnalytics) {
        let totalImpact = 0;
        
        if (advancedAnalytics?.rfm?.available) {
            const champions = advancedAnalytics.rfm.segments?.Champions || [];
            totalImpact += champions.length * 1000; // Estimativa conservadora
        }
        
        return totalImpact;
    }

    calculateRiskSeverity(advancedAnalytics) {
        const alerts = advancedAnalytics?.alerts || [];
        const critical = alerts.filter(a => a.severity === 'critical').length;
        const high = alerts.filter(a => a.severity === 'high').length;
        
        if (critical > 0) return 'CRÍTICA';
        if (high > 2) return 'ALTA';
        return 'MODERADA';
    }

    generateBenchmarks(analytics) {
        return {
            margin: {
                value: analytics.margin,
                benchmark: 0.30,
                status: analytics.margin >= 0.30 ? 'good' : 'warning'
            },
            averageTicket: {
                value: analytics.averageTicket,
                status: 'normal'
            }
        };
    }

    generateRankings(analytics) {
        return {
            products: Object.entries(analytics.byProduct || {})
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 5)
                .map(([name, data]) => ({ name, value: data.total })),
            employees: Object.entries(analytics.byEmployee || {})
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 5)
                .map(([name, data]) => ({ name, value: data.total }))
        };
    }

    generateRoadmap(analytics, advancedAnalytics) {
        return {
            shortTerm: ['Corrigir alertas críticos', 'Implementar recomendações P0'],
            mediumTerm: ['Expandir para novas regiões', 'Otimizar mix de produtos'],
            longTerm: ['Transformação digital', 'Novos canais de vendas']
        };
    }

    extractPredictions(advancedAnalytics) {
        return {
            revenue: advancedAnalytics?.ml?.predictions?.revenue,
            churn: advancedAnalytics?.churn?.totalAtRisk,
            trend: advancedAnalytics?.timeSeries?.trend
        };
    }

    calculateConfidence(advancedAnalytics) {
        return advancedAnalytics?.ml?.predictions?.revenue?.confidence || 0.7;
    }

    generateTimeline(analytics, advancedAnalytics) {
        return {
            week1: ['Análise de alertas críticos', 'Contato com clientes em risco'],
            month1: ['Implementar quick wins', 'Revisar mix de produtos'],
            quarter1: ['Expandir para novas regiões', 'Otimizar processos']
        };
    }

    estimateBudget(analytics) {
        const revenue = analytics.totalRevenue || 0;
        return {
            shortTerm: revenue * 0.02, // 2% da receita
            mediumTerm: revenue * 0.05, // 5% da receita
            expectedROI: 3.0 // 3x retorno
        };
    }

    generateFallbackReport(data, analytics, advancedAnalytics) {
        return {
            timestamp: new Date().toISOString(),
            reportId: this.generateReportId(),
            sections: {
                executiveSummary: {
                    title: '📊 Sumário Executivo',
                    content: this.generateLocalAnalysis('executive'),
                    priority: 'critical'
                },
                message: 'Relatório gerado com análise local. Configure a API DeepSeek para análises com IA.'
            },
            metadata: this.generateMetadata(data, analytics)
        };
    }

    generateMetadata(data, analytics) {
        return {
            generatedAt: new Date().toISOString(),
            dataPoints: data.length,
            period: analytics.dateRange,
            version: '1.0.0',
            generator: 'BI Analytics Pro - AI Report Generator'
        };
    }

    generateReportId() {
        return `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    getSeverityIcon(severity) {
        const icons = {
            critical: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '🟢'
        };
        return icons[severity] || '⚪';
    }

    formatCurrency(value) {
        if (value === undefined || value === null) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatPercentage(value) {
        if (value === undefined || value === null) return '0%';
        return `${(value * 100).toFixed(1)}%`;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
