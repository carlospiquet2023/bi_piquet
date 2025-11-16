/**
 * @fileoverview DashboardCustomizer - Customização de Dashboards
 * Permite salvar, carregar e compartilhar layouts personalizados
 */

export class DashboardCustomizer {
  constructor() {
    this.layouts = new Map();
    this.currentLayout = 'default';
    this.storageKey = 'bi_analytics_layouts';
  }

  /**
   * Inicializa customizador
   */
  initialize() {
    this.loadFromStorage();
    
    // Layout padrão
    if (!this.layouts.has('default')) {
      this.layouts.set('default', this.getDefaultLayout());
    }
  }

  /**
   * Obtém layout padrão
   * @returns {Object} Layout padrão
   */
  getDefaultLayout() {
    return {
      name: 'default',
      displayName: 'Dashboard Padrão',
      sections: {
        kpis: { visible: true, order: 1, size: 'full' },
        insights: { visible: true, order: 2, size: 'full' },
        charts: { visible: true, order: 3, size: 'full' },
        advancedAnalytics: { visible: true, order: 4, size: 'full' },
        dataTable: { visible: true, order: 5, size: 'full' }
      },
      theme: 'light',
      chartTypes: {
        monthly: 'line',
        category: 'pie',
        products: 'bar'
      },
      kpiOrder: ['revenue', 'expense', 'profit', 'avgTicket'],
      refreshInterval: null, // Auto-refresh desabilitado
      created: new Date().toISOString()
    };
  }

  /**
   * Salva novo layout
   * @param {string} name - Nome do layout
   * @param {Object} config - Configuração
   * @returns {boolean} Sucesso
   */
  saveLayout(name, config) {
    try {
      const layout = {
        ...config,
        name,
        updated: new Date().toISOString()
      };

      this.layouts.set(name, layout);
      this.saveToStorage();
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar layout:', error);
      return false;
    }
  }

  /**
   * Carrega um layout
   * @param {string} name - Nome do layout
   * @returns {Object|null} Layout
   */
  loadLayout(name) {
    const layout = this.layouts.get(name);
    
    if (layout) {
      this.currentLayout = name;
      return { ...layout };
    }
    
    return null;
  }

  /**
   * Remove um layout
   * @param {string} name - Nome do layout
   * @returns {boolean} Sucesso
   */
  deleteLayout(name) {
    if (name === 'default') {
      console.warn('Não é possível deletar o layout padrão');
      return false;
    }

    const deleted = this.layouts.delete(name);
    
    if (deleted) {
      this.saveToStorage();
      
      if (this.currentLayout === name) {
        this.currentLayout = 'default';
      }
    }

    return deleted;
  }

  /**
   * Lista todos os layouts
   * @returns {Array<Object>} Layouts disponíveis
   */
  listLayouts() {
    return Array.from(this.layouts.entries()).map(([name, layout]) => ({
      name,
      displayName: layout.displayName || name,
      isCurrent: name === this.currentLayout,
      created: layout.created,
      updated: layout.updated
    }));
  }

  /**
   * Clona um layout
   * @param {string} sourceName - Layout fonte
   * @param {string} newName - Nome do novo layout
   * @param {string} displayName - Nome de exibição
   * @returns {boolean} Sucesso
   */
  cloneLayout(sourceName, newName, displayName) {
    const source = this.layouts.get(sourceName);
    
    if (!source) {
      console.error('Layout fonte não encontrado');
      return false;
    }

    const clone = {
      ...JSON.parse(JSON.stringify(source)),
      name: newName,
      displayName: displayName || `${source.displayName} (Cópia)`,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    this.layouts.set(newName, clone);
    this.saveToStorage();

    return true;
  }

  /**
   * Atualiza seção do layout atual
   * @param {string} sectionName - Nome da seção
   * @param {Object} config - Configuração
   * @returns {boolean} Sucesso
   */
  updateSection(sectionName, config) {
    const layout = this.layouts.get(this.currentLayout);
    
    if (!layout) return false;

    if (!layout.sections[sectionName]) {
      layout.sections[sectionName] = {};
    }

    layout.sections[sectionName] = {
      ...layout.sections[sectionName],
      ...config
    };

    layout.updated = new Date().toISOString();
    this.saveToStorage();

    return true;
  }

  /**
   * Toggle visibilidade de seção
   * @param {string} sectionName - Nome da seção
   * @returns {boolean} Nova visibilidade
   */
  toggleSection(sectionName) {
    const layout = this.layouts.get(this.currentLayout);
    
    if (!layout || !layout.sections[sectionName]) return false;

    const newVisibility = !layout.sections[sectionName].visible;
    layout.sections[sectionName].visible = newVisibility;
    
    layout.updated = new Date().toISOString();
    this.saveToStorage();

    return newVisibility;
  }

  /**
   * Reordena seções
   * @param {Array<string>} order - Nova ordem das seções
   * @returns {boolean} Sucesso
   */
  reorderSections(order) {
    const layout = this.layouts.get(this.currentLayout);
    
    if (!layout) return false;

    order.forEach((sectionName, index) => {
      if (layout.sections[sectionName]) {
        layout.sections[sectionName].order = index + 1;
      }
    });

    layout.updated = new Date().toISOString();
    this.saveToStorage();

    return true;
  }

  /**
   * Altera tema do dashboard
   * @param {string} theme - light ou dark
   * @returns {boolean} Sucesso
   */
  setTheme(theme) {
    const layout = this.layouts.get(this.currentLayout);
    
    if (!layout) return false;

    layout.theme = theme;
    layout.updated = new Date().toISOString();
    this.saveToStorage();

    // Aplicar tema no documento
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);

    return true;
  }

  /**
   * Configura auto-refresh
   * @param {number|null} intervalSeconds - Intervalo em segundos (null para desabilitar)
   * @returns {boolean} Sucesso
   */
  setAutoRefresh(intervalSeconds) {
    const layout = this.layouts.get(this.currentLayout);
    
    if (!layout) return false;

    layout.refreshInterval = intervalSeconds;
    layout.updated = new Date().toISOString();
    this.saveToStorage();

    return true;
  }

  /**
   * Exporta layout como JSON
   * @param {string} name - Nome do layout
   * @returns {string|null} JSON do layout
   */
  exportLayout(name) {
    const layout = this.layouts.get(name);
    
    if (!layout) return null;

    return JSON.stringify(layout, null, 2);
  }

  /**
   * Importa layout de JSON
   * @param {string} json - JSON do layout
   * @param {string} newName - Nome para o layout importado
   * @returns {boolean} Sucesso
   */
  importLayout(json, newName) {
    try {
      const layout = JSON.parse(json);
      layout.name = newName || layout.name;
      layout.imported = new Date().toISOString();

      this.layouts.set(layout.name, layout);
      this.saveToStorage();

      return true;
    } catch (error) {
      console.error('Erro ao importar layout:', error);
      return false;
    }
  }

  /**
   * Reseta layout atual para padrão
   * @returns {boolean} Sucesso
   */
  resetToDefault() {
    const defaultLayout = this.getDefaultLayout();
    this.layouts.set(this.currentLayout, {
      ...defaultLayout,
      name: this.currentLayout,
      displayName: this.layouts.get(this.currentLayout)?.displayName || this.currentLayout,
      updated: new Date().toISOString()
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Salva layouts no LocalStorage
   */
  saveToStorage() {
    try {
      const data = {
        layouts: Array.from(this.layouts.entries()),
        currentLayout: this.currentLayout
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar no LocalStorage:', error);
    }
  }

  /**
   * Carrega layouts do LocalStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      
      if (stored) {
        const data = JSON.parse(stored);
        this.layouts = new Map(data.layouts);
        this.currentLayout = data.currentLayout || 'default';
      }
    } catch (error) {
      console.error('Erro ao carregar do LocalStorage:', error);
      this.layouts = new Map();
    }
  }

  /**
   * Limpa todos os layouts salvos
   * @returns {boolean} Sucesso
   */
  clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
      this.layouts = new Map();
      this.layouts.set('default', this.getDefaultLayout());
      this.currentLayout = 'default';
      return true;
    } catch (error) {
      console.error('Erro ao limpar layouts:', error);
      return false;
    }
  }

  /**
   * Obtém configuração atual completa
   * @returns {Object} Configuração
   */
  getCurrentConfig() {
    return this.loadLayout(this.currentLayout) || this.getDefaultLayout();
  }

  /**
   * Verifica se há mudanças não salvas
   * @param {Object} currentState - Estado atual do dashboard
   * @returns {boolean} Há mudanças
   */
  hasUnsavedChanges(currentState) {
    const savedLayout = this.layouts.get(this.currentLayout);
    
    if (!savedLayout) return false;

    return JSON.stringify(currentState) !== JSON.stringify(savedLayout);
  }
}
