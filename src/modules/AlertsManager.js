/**
 * @fileoverview AlertsManager - Gerenciamento de Alertas
 * Sistema de notificações e alertas automáticos baseados em regras
 */

/**
 * @typedef {Object} Alert
 * @property {string} id - ID único do alerta
 * @property {string} title - Título
 * @property {string} message - Mensagem
 * @property {string} severity - critical, high, medium, low
 * @property {string} category - Categoria do alerta
 * @property {Date} timestamp - Data/hora
 * @property {boolean} read - Se foi lido
 * @property {Object} data - Dados relacionados
 */

/**
 * @typedef {Object} AlertRule
 * @property {string} id - ID da regra
 * @property {string} name - Nome da regra
 * @property {string} condition - Condição
 * @property {Function} evaluate - Função de avaliação
 * @property {string} severity - Severidade se disparar
 * @property {boolean} active - Se está ativa
 */

export class AlertsManager {
  constructor() {
    this.alerts = [];
    this.rules = [];
    this.notifications = [];
    this.storageKey = 'bi_analytics_alerts';
  }

  /**
   * Inicializa o gerenciador
   */
  initialize() {
    this.loadFromStorage();
    this.setupDefaultRules();
  }

  /**
   * Configura regras padrão de alertas
   */
  setupDefaultRules() {
    if (this.rules.length > 0) return; // Já tem regras

    this.addRule({
      name: 'Queda de Receita',
      condition: 'revenue_drop',
      threshold: 20, // %
      severity: 'critical',
      active: true,
      description: 'Alerta quando receita cair mais de 20% vs período anterior'
    });

    this.addRule({
      name: 'Alto Churn',
      condition: 'high_churn',
      threshold: 30, // %
      severity: 'high',
      active: true,
      description: 'Alerta quando taxa de churn exceder 30%'
    });

    this.addRule({
      name: 'Estoque Baixo',
      condition: 'low_stock',
      threshold: 10,
      severity: 'medium',
      active: false,
      description: 'Alerta quando produtos com estoque abaixo de 10 unidades'
    });

    this.addRule({
      name: 'Cliente Inativo',
      condition: 'inactive_client',
      threshold: 90, // dias
      severity: 'medium',
      active: true,
      description: 'Alerta quando cliente ficar inativo por 90+ dias'
    });

    this.addRule({
      name: 'Anomalia de Valor',
      condition: 'value_anomaly',
      threshold: 3, // desvios padrão
      severity: 'high',
      active: true,
      description: 'Alerta quando detectar valores anômalos (outliers)'
    });

    this.addRule({
      name: 'Meta Não Atingida',
      condition: 'goal_not_met',
      threshold: 80, // % da meta
      severity: 'medium',
      active: false,
      description: 'Alerta quando não atingir 80% da meta do mês'
    });
  }

  /**
   * Adiciona uma regra de alerta
   * @param {Object} ruleConfig - Configuração da regra
   * @returns {string} ID da regra
   */
  addRule(ruleConfig) {
    const rule = {
      id: this.generateId(),
      ...ruleConfig,
      created: new Date().toISOString()
    };

    this.rules.push(rule);
    this.saveToStorage();

    return rule.id;
  }

  /**
   * Avalia todas as regras ativas
   * @param {Object} data - Dados para avaliação
   * @returns {Array<Alert>} Alertas disparados
   */
  evaluateRules(data) {
    const newAlerts = [];

    for (const rule of this.rules.filter(r => r.active)) {
      const result = this.evaluateRule(rule, data);

      if (result.triggered) {
        const alert = this.createAlert({
          title: rule.name,
          message: result.message,
          severity: rule.severity,
          category: rule.condition,
          data: result.data
        });

        newAlerts.push(alert);
      }
    }

    return newAlerts;
  }

  /**
   * Avalia uma regra específica
   * @param {AlertRule} rule - Regra
   * @param {Object} data - Dados
   * @returns {Object} Resultado
   */
  evaluateRule(rule, data) {
    switch (rule.condition) {
      case 'revenue_drop':
        return this.checkRevenueDrop(data, rule.threshold);

      case 'high_churn':
        return this.checkHighChurn(data, rule.threshold);

      case 'low_stock':
        return this.checkLowStock(data, rule.threshold);

      case 'inactive_client':
        return this.checkInactiveClients(data, rule.threshold);

      case 'value_anomaly':
        return this.checkValueAnomalies(data, rule.threshold);

      case 'goal_not_met':
        return this.checkGoalProgress(data, rule.threshold);

      default:
        return { triggered: false };
    }
  }

  /**
   * Verifica queda de receita
   */
  checkRevenueDrop(data, threshold) {
    if (!data.analytics || !data.analytics.monthlyData || data.analytics.monthlyData.length < 2) {
      return { triggered: false };
    }

    const monthly = data.analytics.monthlyData;
    const current = monthly[monthly.length - 1].revenue || 0;
    const previous = monthly[monthly.length - 2].revenue || 0;

    if (previous === 0) return { triggered: false };

    const drop = ((previous - current) / previous) * 100;

    if (drop >= threshold) {
      return {
        triggered: true,
        message: `Receita caiu ${drop.toFixed(1)}% em relação ao período anterior`,
        data: { current, previous, drop }
      };
    }

    return { triggered: false };
  }

  /**
   * Verifica alto churn
   */
  checkHighChurn(data, threshold) {
    if (!data.churn || !data.churn.metrics) {
      return { triggered: false };
    }

    const churnRate = parseFloat(data.churn.metrics.churnRate);

    if (churnRate >= threshold) {
      return {
        triggered: true,
        message: `Taxa de churn em ${churnRate}% - acima do limite de ${threshold}%`,
        data: { churnRate, threshold, atRiskCount: data.churn.atRisk?.length || 0 }
      };
    }

    return { triggered: false };
  }

  /**
   * Verifica estoque baixo
   */
  checkLowStock(data, threshold) {
    // Implementação simplificada - assumindo coluna de estoque
    if (!data.processedData) return { triggered: false };

    const stockColumn = data.columnMetadata?.find(col => 
      col.name.toLowerCase().includes('estoque') || 
      col.name.toLowerCase().includes('stock')
    );

    if (!stockColumn) return { triggered: false };

    const lowStockItems = data.processedData.filter(row => {
      const stock = parseFloat(row[stockColumn.name]) || 0;
      return stock < threshold && stock > 0;
    });

    if (lowStockItems.length > 0) {
      return {
        triggered: true,
        message: `${lowStockItems.length} produto(s) com estoque abaixo de ${threshold} unidades`,
        data: { count: lowStockItems.length, items: lowStockItems.slice(0, 5) }
      };
    }

    return { triggered: false };
  }

  /**
   * Verifica clientes inativos
   */
  checkInactiveClients(data, threshold) {
    if (!data.churn || !data.churn.predictions) {
      return { triggered: false };
    }

    const inactiveClients = data.churn.predictions.filter(pred => 
      pred.daysSinceLastPurchase >= threshold
    );

    if (inactiveClients.length > 0) {
      return {
        triggered: true,
        message: `${inactiveClients.length} cliente(s) inativos há ${threshold}+ dias`,
        data: { count: inactiveClients.length, clients: inactiveClients.slice(0, 5) }
      };
    }

    return { triggered: false };
  }

  /**
   * Verifica anomalias de valor
   */
  checkValueAnomalies(data, _threshold) {
    if (!data.insights || !data.insights.insights) {
      return { triggered: false };
    }

    const anomalies = data.insights.insights.filter(insight => 
      insight.type === 'anomaly' || insight.type === 'outlier'
    );

    if (anomalies.length > 0) {
      return {
        triggered: true,
        message: `${anomalies.length} anomalia(s) detectada(s) nos dados`,
        data: { count: anomalies.length, anomalies: anomalies.slice(0, 3) }
      };
    }

    return { triggered: false };
  }

  /**
   * Verifica progresso de meta
   */
  checkGoalProgress(_data, _threshold) {
    // Implementação simplificada - requer configuração de metas
    return { triggered: false };
  }

  /**
   * Cria um alerta
   * @param {Object} alertData - Dados do alerta
   * @returns {Alert} Alerta criado
   */
  createAlert(alertData) {
    const alert = {
      id: this.generateId(),
      ...alertData,
      timestamp: new Date(),
      read: false
    };

    this.alerts.unshift(alert); // Adiciona no início
    this.saveToStorage();

    // Notificar
    this.notify(alert);

    return alert;
  }

  /**
   * Marca alerta como lido
   * @param {string} alertId - ID do alerta
   */
  markAsRead(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.read = true;
      this.saveToStorage();
    }
  }

  /**
   * Marca todos como lidos
   */
  markAllAsRead() {
    this.alerts.forEach(alert => alert.read = true);
    this.saveToStorage();
  }

  /**
   * Remove um alerta
   * @param {string} alertId - ID do alerta
   */
  deleteAlert(alertId) {
    this.alerts = this.alerts.filter(a => a.id !== alertId);
    this.saveToStorage();
  }

  /**
   * Limpa alertas antigos
   * @param {number} daysOld - Dias de antiguidade
   */
  clearOldAlerts(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffDate);
    this.saveToStorage();
  }

  /**
   * Obtém alertas não lidos
   * @returns {Array<Alert>} Alertas não lidos
   */
  getUnreadAlerts() {
    return this.alerts.filter(a => !a.read);
  }

  /**
   * Obtém alertas por severidade
   * @param {string} severity - Severidade
   * @returns {Array<Alert>} Alertas
   */
  getAlertsBySeverity(severity) {
    return this.alerts.filter(a => a.severity === severity);
  }

  /**
   * Obtém estatísticas de alertas
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      total: this.alerts.length,
      unread: this.alerts.filter(a => !a.read).length,
      critical: this.alerts.filter(a => a.severity === 'critical').length,
      high: this.alerts.filter(a => a.severity === 'high').length,
      medium: this.alerts.filter(a => a.severity === 'medium').length,
      low: this.alerts.filter(a => a.severity === 'low').length,
      activeRules: this.rules.filter(r => r.active).length,
      totalRules: this.rules.length
    };
  }

  /**
   * Notifica sobre novo alerta
   * @param {Alert} alert - Alerta
   */
  notify(alert) {
    // Notificação no navegador (se permitido)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`BI Analytics: ${alert.title}`, {
        body: alert.message,
        icon: '/icon.png',
        tag: alert.id
      });
    }

    // Adicionar à lista de notificações
    this.notifications.push({
      ...alert,
      shown: new Date()
    });

    // Limitar notificações na memória
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(-50);
    }
  }

  /**
   * Solicita permissão para notificações
   * @returns {Promise<string>} Permissão
   */
  async requestNotificationPermission() {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  /**
   * Gera ID único
   * @returns {string} ID
   */
  generateId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Salva no LocalStorage
   */
  saveToStorage() {
    try {
      const data = {
        alerts: this.alerts.slice(0, 100), // Limitar a 100 alertas
        rules: this.rules
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar alertas:', error);
    }
  }

  /**
   * Carrega do LocalStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);

      if (stored) {
        const data = JSON.parse(stored);
        this.alerts = data.alerts || [];
        this.rules = data.rules || [];

        // Converter timestamps de string para Date
        this.alerts.forEach(alert => {
          alert.timestamp = new Date(alert.timestamp);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  }

  /**
   * Limpa todos os dados
   */
  clearAll() {
    this.alerts = [];
    this.rules = [];
    this.notifications = [];
    localStorage.removeItem(this.storageKey);
  }
}
