/**
 * UI Manager - Gerenciador de Interface
 * Responsável por toda a manipulação da UI
 */

export class UIManager {
  constructor() {
    this.sections = {
      upload: document.getElementById('upload-section'),
      processing: document.getElementById('processing-section'),
      dashboard: document.getElementById('dashboard-section'),
      error: document.getElementById('error-section'),
    };
  }

  /**
   * Mostra seção de upload
   */
  showUploadSection() {
    this.hideAllSections();
    this.sections.upload?.classList.remove('hidden');
  }

  /**
   * Mostra seção de processamento
   */
  showProcessingSection() {
    this.hideAllSections();
    this.sections.processing?.classList.remove('hidden');
  }

  /**
   * Mostra dashboard
   */
  showDashboard() {
    this.hideAllSections();
    this.sections.dashboard?.classList.remove('hidden');
  }

  /**
   * Mostra erro
   */
  showError(message) {
    this.hideAllSections();
    this.sections.error?.classList.remove('hidden');
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) errorMsg.textContent = message;
  }

  /**
   * Esconde todas as seções
   */
  hideAllSections() {
    Object.values(this.sections).forEach(section => {
      section?.classList.add('hidden');
    });
  }

  /**
   * Mostra informações do arquivo
   */
  showFileInfo(name, size) {
    const fileInfo = document.getElementById('file-info');
    if (fileInfo) {
      fileInfo.innerHTML = `📄 ${name} (${size})`;
      fileInfo.classList.remove('hidden');
    }
  }

  /**
   * Atualiza progresso
   */
  updateProgress(percentage) {
    const progress = document.getElementById('upload-progress');
    const fill = progress?.querySelector('.progress-fill');
    
    if (progress && fill) {
      progress.classList.remove('hidden');
      fill.style.width = `${percentage}%`;
    }
  }

  /**
   * Atualiza step do processamento
   */
  updateStep(stepNumber, status, message) {
    const step = document.querySelector(`.step[data-step="${stepNumber}"]`);
    if (!step) return;
    
    step.className = 'step';
    step.classList.add(`step-${status}`);
    
    const statusEl = step.querySelector('.step-status');
    if (statusEl) statusEl.textContent = message;
  }

  /**
   * Renderiza KPIs
   */
  renderKPIs(kpis) {
    const container = document.getElementById('kpis-container');
    if (!container) return;
    
    container.innerHTML = '<h2 class="section-title">📊 Principais Indicadores</h2>';
    
    const grid = document.createElement('div');
    grid.className = 'kpis-grid';
    
    kpis.forEach(kpi => {
      const card = document.createElement('div');
      card.className = `kpi-card ${kpi.trend ? 'kpi-' + kpi.trend : ''}`;
      
      card.innerHTML = `
        <div class="kpi-icon">${kpi.icon}</div>
        <div class="kpi-content">
          <div class="kpi-title">${kpi.title}</div>
          <div class="kpi-value">${kpi.value}</div>
          ${kpi.subValue ? `<div class="kpi-subvalue">${kpi.subValue}</div>` : ''}
          ${kpi.change !== undefined ? `<div class="kpi-change ${kpi.change >= 0 ? 'positive' : 'negative'}">${kpi.change >= 0 ? '↑' : '↓'} ${Math.abs(kpi.change).toFixed(1)}%</div>` : ''}
        </div>
      `;
      
      grid.appendChild(card);
    });
    
    container.appendChild(grid);
  }

  /**
   * Renderiza insights
   */
  renderInsights(insights) {
    const container = document.getElementById('insights-container');
    if (!container) return;
    
    container.innerHTML = '<h2 class="section-title">💡 Insights Estratégicos</h2>';
    
    const grid = document.createElement('div');
    grid.className = 'insights-grid';
    
    insights.slice(0, 8).forEach(insight => {
      const card = document.createElement('div');
      card.className = `insight-card insight-${insight.severity}`;
      
      card.innerHTML = `
        <div class="insight-header">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-relevance">${insight.relevance}%</div>
        </div>
        <div class="insight-description">${insight.description}</div>
        <div class="insight-footer">
          <span class="insight-type">${insight.type}</span>
        </div>
      `;
      
      grid.appendChild(card);
    });
    
    container.appendChild(grid);
  }

  /**
   * Renderiza gráficos
   */
  renderCharts(charts) {
    const container = document.getElementById('charts-container');
    if (!container) return;
    
    container.innerHTML = '<h2 class="section-title">📈 Visualizações</h2>';
    
    const grid = document.createElement('div');
    grid.className = 'charts-grid';
    
    charts.forEach((chart, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-container';
      wrapper.id = `chart-wrapper-${index}`;
      
      const canvas = document.createElement('canvas');
      canvas.id = `chart-${index}`;
      canvas.width = 400;
      canvas.height = 300;
      
      wrapper.appendChild(canvas);
      grid.appendChild(wrapper);
      
      // Renderizar gráfico
      setTimeout(() => {
        import('chart.js').then(({ Chart, registerables }) => {
          Chart.register(...registerables);
          new Chart(canvas, {
            type: chart.type,
            data: chart.data,
            options: chart.options,
          });
        });
      }, 100 * index);
    });
    
    container.appendChild(grid);
  }

  /**
   * Renderiza tabela de dados
   */
  renderDataTable(data, columnMetadata) {
    const container = document.getElementById('table-container');
    if (!container) return;
    
    container.innerHTML = '<h2 class="section-title">📋 Dados Processados</h2>';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    // Cabeçalho
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    columnMetadata.forEach(col => {
      const th = document.createElement('th');
      th.innerHTML = `
        ${col.name}
        <span class="column-type">${col.type}</span>
      `;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Corpo (primeiras 50 linhas)
    const tbody = document.createElement('tbody');
    const displayData = data.slice(0, 50);
    
    displayData.forEach(row => {
      const tr = document.createElement('tr');
      
      columnMetadata.forEach(col => {
        const td = document.createElement('td');
        const value = row[col.name];
        td.textContent = value !== null && value !== undefined ? value : '-';
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    wrapper.appendChild(table);
    
    if (data.length > 50) {
      const info = document.createElement('p');
      info.className = 'table-info';
      info.textContent = `Mostrando 50 de ${data.length} registros`;
      wrapper.appendChild(info);
    }
    
    container.appendChild(wrapper);
  }

  /**
   * Mostra loading
   */
  showLoading(message = 'Processando...') {
    let loader = document.getElementById('global-loader');
    
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'global-loader';
      loader.className = 'global-loader';
      loader.innerHTML = `
        <div class="loader-content">
          <div class="spinner"></div>
          <p class="loader-message">${message}</p>
        </div>
      `;
      document.body.appendChild(loader);
    } else {
      const msg = loader.querySelector('.loader-message');
      if (msg) msg.textContent = message;
      loader.classList.remove('hidden');
    }
  }

  /**
   * Esconde loading
   */
  hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.add('hidden');
  }

  /**
   * Mostra mensagem de sucesso
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * Mostra toast
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Reseta UI
   */
  reset() {
    this.showUploadSection();
    
    // Limpar containers
    ['kpis-container', 'insights-container', 'charts-container', 'table-container'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    
    // Resetar file info
    const fileInfo = document.getElementById('file-info');
    if (fileInfo) {
      fileInfo.classList.add('hidden');
      fileInfo.innerHTML = '';
    }
    
    // Resetar progress
    const progress = document.getElementById('upload-progress');
    if (progress) {
      progress.classList.add('hidden');
      const fill = progress.querySelector('.progress-fill');
      if (fill) fill.style.width = '0%';
    }
    
    // Resetar steps
    for (let i = 1; i <= 5; i++) {
      const step = document.querySelector(`.step[data-step="${i}"]`);
      if (step) {
        step.className = 'step';
        const status = step.querySelector('.step-status');
        if (status) status.textContent = 'Aguardando...';
      }
    }
  }
}
