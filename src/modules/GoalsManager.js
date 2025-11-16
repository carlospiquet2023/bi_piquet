/**
 * 🎯 GoalsManager - Gerenciador de Metas e Objetivos
 * 
 * Responsável por:
 * - Definir e gerenciar metas de negócio
 * - Acompanhar progresso em tempo real
 * - Gerar alertas quando metas são atingidas ou não
 * - Calcular taxa de atingimento e projeções
 * - Sugerir ações para alcançar objetivos
 * 
 * Tipos de metas suportadas:
 * - Receita e vendas
 * - Quantidade (vendas, clientes, produtos)
 * - Percentuais (margem, conversão, satisfação)
 * - Tempo (resposta, entrega, resolução)
 * 
 * @class GoalsManager
 * @author Carlos Antonio de Oliveira Piquet
 * @version 1.0.0
 */

export class GoalsManager {
    constructor() {
        this.goals = [];
        this.achievements = [];
    }

    /**
     * Criar nova meta
     * @param {Object} goalConfig 
     * @returns {Object}
     */
    createGoal(goalConfig) {
        const goal = {
            id: this._generateId(),
            name: goalConfig.name,
            description: goalConfig.description || '',
            type: goalConfig.type, // revenue, quantity, percentage, time
            metric: goalConfig.metric, // nome da métrica (ex: 'receita_total')
            target: goalConfig.target, // valor alvo
            current: 0, // valor atual
            period: goalConfig.period || 'month', // day, week, month, quarter, year
            startDate: goalConfig.startDate || new Date(),
            endDate: goalConfig.endDate || this._calculateEndDate(goalConfig.period),
            priority: goalConfig.priority || 'medium', // low, medium, high, critical
            status: 'active', // active, completed, failed, paused
            progress: 0, // percentual de atingimento
            alerts: {
                enabled: goalConfig.alerts !== false,
                thresholds: goalConfig.thresholds || [25, 50, 75, 90, 100]
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.goals.push(goal);
        return goal;
    }

    /**
     * Atualizar progresso de uma meta
     * @param {string} goalId 
     * @param {number} currentValue 
     * @returns {Object}
     */
    updateGoalProgress(goalId, currentValue) {
        const goal = this.getGoal(goalId);
        if (!goal) {
            return {
                success: false,
                error: 'Meta não encontrada'
            };
        }

        const previousProgress = goal.progress;
        goal.current = currentValue;
        goal.progress = (currentValue / goal.target) * 100;
        goal.updatedAt = new Date();

        // Verificar se status mudou
        if (goal.progress >= 100) {
            goal.status = 'completed';
        }

        // Verificar alerts de threshold
        const alerts = this._checkThresholdAlerts(goal, previousProgress);

        // Registrar achievement se completou
        if (goal.status === 'completed' && previousProgress < 100) {
            this._recordAchievement(goal);
        }

        return {
            success: true,
            goal,
            alerts,
            achievement: goal.status === 'completed'
        };
    }

    /**
     * Calcular progresso de metas baseado em dados
     * @param {Array} data - Dados analisados
     * @param {Object} kpis - KPIs calculados
     */
    calculateGoalsProgress(data, kpis) {
        const results = [];

        for (const goal of this.goals) {
            if (goal.status !== 'active') continue;

            // Obter valor atual da métrica
            const currentValue = kpis[goal.metric] || 0;
            
            // Atualizar progresso
            const result = this.updateGoalProgress(goal.id, currentValue);
            results.push(result);
        }

        return results;
    }

    /**
     * Obter meta por ID
     * @param {string} goalId 
     * @returns {Object|null}
     */
    getGoal(goalId) {
        return this.goals.find(g => g.id === goalId) || null;
    }

    /**
     * Listar todas as metas
     * @param {string} status - Filtrar por status (opcional)
     * @returns {Array}
     */
    listGoals(status = null) {
        if (status) {
            return this.goals.filter(g => g.status === status);
        }
        return this.goals;
    }

    /**
     * Listar metas ativas
     * @returns {Array}
     */
    getActiveGoals() {
        return this.listGoals('active');
    }

    /**
     * Deletar meta
     * @param {string} goalId 
     * @returns {boolean}
     */
    deleteGoal(goalId) {
        const index = this.goals.findIndex(g => g.id === goalId);
        if (index === -1) return false;

        this.goals.splice(index, 1);
        return true;
    }

    /**
     * Pausar meta
     * @param {string} goalId 
     */
    pauseGoal(goalId) {
        const goal = this.getGoal(goalId);
        if (goal) {
            goal.status = 'paused';
            goal.updatedAt = new Date();
        }
    }

    /**
     * Reativar meta
     * @param {string} goalId 
     */
    resumeGoal(goalId) {
        const goal = this.getGoal(goalId);
        if (goal && goal.status === 'paused') {
            goal.status = 'active';
            goal.updatedAt = new Date();
        }
    }

    /**
     * Verificar alertas de threshold
     * @param {Object} goal 
     * @param {number} previousProgress 
     * @returns {Array}
     * @private
     */
    _checkThresholdAlerts(goal, previousProgress) {
        if (!goal.alerts.enabled) return [];

        const alerts = [];
        const thresholds = goal.alerts.thresholds;

        for (const threshold of thresholds) {
            // Se cruzou o threshold (de baixo para cima)
            if (previousProgress < threshold && goal.progress >= threshold) {
                alerts.push({
                    type: threshold === 100 ? 'success' : 'info',
                    message: threshold === 100 
                        ? `🎉 Meta "${goal.name}" atingida! Parabéns!`
                        : `📊 Meta "${goal.name}" atingiu ${threshold}% do objetivo`,
                    threshold,
                    goalId: goal.id,
                    timestamp: new Date()
                });
            }
        }

        return alerts;
    }

    /**
     * Registrar achievement (meta alcançada)
     * @param {Object} goal 
     * @private
     */
    _recordAchievement(goal) {
        this.achievements.push({
            id: this._generateId(),
            goalId: goal.id,
            goalName: goal.name,
            target: goal.target,
            achieved: goal.current,
            completedAt: new Date(),
            daysToComplete: this._calculateDaysToComplete(goal.startDate, new Date())
        });
    }

    /**
     * Obter achievements (metas alcançadas)
     * @returns {Array}
     */
    getAchievements() {
        return this.achievements;
    }

    /**
     * Projetar se meta será atingida
     * @param {string} goalId 
     * @returns {Object}
     */
    projectGoalAchievement(goalId) {
        const goal = this.getGoal(goalId);
        if (!goal) return null;

        const now = new Date();
        const timeElapsed = now - new Date(goal.startDate);
        const timeTotal = new Date(goal.endDate) - new Date(goal.startDate);
        const timeRemaining = new Date(goal.endDate) - now;

        const percentTimeElapsed = (timeElapsed / timeTotal) * 100;
        const percentTimeRemaining = (timeRemaining / timeTotal) * 100;

        // Calcular velocidade atual
        const currentRate = goal.current / (timeElapsed / (1000 * 60 * 60 * 24)); // por dia

        // Projetar valor final
        const projectedFinal = currentRate * (timeTotal / (1000 * 60 * 60 * 24));
        const projectedProgress = (projectedFinal / goal.target) * 100;

        // Status da projeção
        let projectionStatus;
        if (projectedProgress >= 100) {
            projectionStatus = 'on-track';
        } else if (projectedProgress >= 80) {
            projectionStatus = 'at-risk';
        } else {
            projectionStatus = 'off-track';
        }

        return {
            goal: {
                id: goal.id,
                name: goal.name,
                target: goal.target,
                current: goal.current,
                progress: goal.progress
            },
            time: {
                elapsed: percentTimeElapsed,
                remaining: percentTimeRemaining,
                daysRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
            },
            projection: {
                final: projectedFinal,
                progress: projectedProgress,
                status: projectionStatus,
                gap: goal.target - projectedFinal
            },
            recommendations: this._generateRecommendations(goal, projectedProgress, currentRate)
        };
    }

    /**
     * Gerar recomendações para atingir meta
     * @param {Object} goal 
     * @param {number} projectedProgress 
     * @param {number} currentRate 
     * @returns {Array}
     * @private
     */
    _generateRecommendations(goal, projectedProgress, currentRate) {
        const recommendations = [];

        if (projectedProgress >= 100) {
            recommendations.push({
                type: 'success',
                message: 'Você está no caminho certo! Continue assim para atingir a meta.'
            });
        } else {
            const requiredRate = (goal.target - goal.current) / ((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24));
            const increaseNeeded = ((requiredRate - currentRate) / currentRate) * 100;

            recommendations.push({
                type: 'warning',
                message: `É necessário aumentar a performance em ${increaseNeeded.toFixed(1)}% para atingir a meta.`
            });

            recommendations.push({
                type: 'action',
                message: `Meta diária necessária: ${requiredRate.toFixed(2)} ${this._getUnitLabel(goal.type)}`
            });

            if (goal.type === 'revenue') {
                recommendations.push({
                    type: 'tip',
                    message: 'Considere: aumentar ticket médio, prospectar novos clientes ou lançar promoções.'
                });
            }
        }

        return recommendations;
    }

    /**
     * Comparar metas entre períodos
     * @param {string} goalId 
     * @param {Object} previousPeriodData 
     * @returns {Object}
     */
    compareWithPreviousPeriod(goalId, previousPeriodData) {
        const goal = this.getGoal(goalId);
        if (!goal) return null;

        const currentValue = goal.current;
        const previousValue = previousPeriodData.value || 0;

        const difference = currentValue - previousValue;
        const percentChange = previousValue > 0 ? (difference / previousValue) * 100 : 0;

        return {
            current: {
                period: goal.period,
                value: currentValue,
                progress: goal.progress
            },
            previous: {
                period: previousPeriodData.period,
                value: previousValue
            },
            comparison: {
                difference,
                percentChange,
                trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable'
            }
        };
    }

    /**
     * Obter dashboard de metas
     * @returns {Object}
     */
    getGoalsDashboard() {
        const active = this.listGoals('active');
        const completed = this.listGoals('completed');
        const failed = this.listGoals('failed');

        return {
            summary: {
                total: this.goals.length,
                active: active.length,
                completed: completed.length,
                failed: failed.length,
                completionRate: this.goals.length > 0 
                    ? (completed.length / this.goals.length) * 100 
                    : 0
            },
            byPriority: {
                critical: active.filter(g => g.priority === 'critical'),
                high: active.filter(g => g.priority === 'high'),
                medium: active.filter(g => g.priority === 'medium'),
                low: active.filter(g => g.priority === 'low')
            },
            byProgress: {
                onTrack: active.filter(g => g.progress >= 75),
                atRisk: active.filter(g => g.progress >= 50 && g.progress < 75),
                offTrack: active.filter(g => g.progress < 50)
            },
            recentAchievements: this.achievements.slice(-5).reverse()
        };
    }

    /**
     * Calcular data final baseada no período
     * @param {string} period 
     * @returns {Date}
     * @private
     */
    _calculateEndDate(period) {
        const now = new Date();
        const end = new Date(now);

        switch (period) {
            case 'day':
                end.setDate(end.getDate() + 1);
                break;
            case 'week':
                end.setDate(end.getDate() + 7);
                break;
            case 'month':
                end.setMonth(end.getMonth() + 1);
                break;
            case 'quarter':
                end.setMonth(end.getMonth() + 3);
                break;
            case 'year':
                end.setFullYear(end.getFullYear() + 1);
                break;
        }

        return end;
    }

    /**
     * Calcular dias para completar
     * @param {Date} start 
     * @param {Date} end 
     * @returns {number}
     * @private
     */
    _calculateDaysToComplete(start, end) {
        const diff = new Date(end) - new Date(start);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Obter label da unidade de medida
     * @param {string} type 
     * @returns {string}
     * @private
     */
    _getUnitLabel(type) {
        const units = {
            revenue: 'R$',
            quantity: 'unidades',
            percentage: '%',
            time: 'horas'
        };
        return units[type] || '';
    }

    /**
     * Gerar ID único
     * @returns {string}
     * @private
     */
    _generateId() {
        return 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Exportar metas para JSON
     * @returns {string}
     */
    exportGoals() {
        return JSON.stringify({
            goals: this.goals,
            achievements: this.achievements,
            exportedAt: new Date()
        }, null, 2);
    }

    /**
     * Importar metas de JSON
     * @param {string} json 
     * @returns {boolean}
     */
    importGoals(json) {
        try {
            const data = JSON.parse(json);
            this.goals = data.goals || [];
            this.achievements = data.achievements || [];
            return true;
        } catch (error) {
            console.error('Erro ao importar metas:', error);
            return false;
        }
    }

    /**
     * Obter templates de metas pré-configuradas
     * @returns {Object}
     */
    getGoalTemplates() {
        return {
            vendas: {
                name: 'Meta de Vendas Mensal',
                type: 'revenue',
                metric: 'receita_total',
                target: 100000,
                period: 'month',
                priority: 'high'
            },
            clientes: {
                name: 'Novos Clientes no Mês',
                type: 'quantity',
                metric: 'clientes_novos',
                target: 50,
                period: 'month',
                priority: 'medium'
            },
            margem: {
                name: 'Margem de Lucro Trimestral',
                type: 'percentage',
                metric: 'margem_lucro',
                target: 30,
                period: 'quarter',
                priority: 'critical'
            },
            satisfacao: {
                name: 'Satisfação do Cliente',
                type: 'percentage',
                metric: 'satisfacao_media',
                target: 90,
                period: 'month',
                priority: 'high'
            }
        };
    }
}
