/**
 * Arquivo Principal - Orquestrador do Sistema
 * Coordena todos os módulos e gerencia o fluxo completo
 */

import { FileUploadManager } from './modules/FileUploadManager.js';
import { ExcelParser } from './modules/ExcelParser.js';
import { ColumnTypeDetector } from './modules/ColumnTypeDetector.js';
import { DataValidator } from './modules/DataValidator.js';
import { AnalyticsEngine } from './modules/AnalyticsEngine.js';
import { ChartGenerator } from './modules/ChartGenerator.js';
import { InsightsGenerator } from './modules/InsightsGenerator.js';
import { ExportManager } from './modules/ExportManager.js';
import { ProcessingStatus } from './types/enums.js';
import { UIManager } from './ui/UIManager.js';
// Módulos de Análise Avançada
import { MLEngine } from './modules/MLEngine.js';
import { RFMAnalyzer } from './modules/RFMAnalyzer.js';
import { CohortAnalyzer } from './modules/CohortAnalyzer.js';
import { CorrelationAnalyzer } from './modules/CorrelationAnalyzer.js';
import { GeoAnalyzer } from './modules/GeoAnalyzer.js';
import { MarketBasketAnalyzer } from './modules/MarketBasketAnalyzer.js';
import { ChurnAnalyzer } from './modules/ChurnAnalyzer.js';
import { TimeSeriesAnalyzer } from './modules/TimeSeriesAnalyzer.js';
import { FilterManager } from './modules/FilterManager.js';
import { DashboardCustomizer } from './modules/DashboardCustomizer.js';
import { AlertsManager } from './modules/AlertsManager.js';
import { AdvancedChartsHelper } from './modules/AdvancedChartsHelper.js';
import { AIReportGenerator } from './modules/AIReportGenerator.js';

class BIAnalyticsPro {
  constructor() {
    this.uploadManager = new FileUploadManager();
    this.excelParser = new ExcelParser();
    this.typeDetector = new ColumnTypeDetector();
    this.validator = new DataValidator();
    this.uiManager = new UIManager();
    
    // Análises Avançadas
    this.mlEngine = new MLEngine();
    this.rfmAnalyzer = new RFMAnalyzer();
    this.cohortAnalyzer = new CohortAnalyzer();
    this.correlationAnalyzer = new CorrelationAnalyzer();
    this.geoAnalyzer = new GeoAnalyzer();
    this.marketBasketAnalyzer = new MarketBasketAnalyzer();
    this.churnAnalyzer = new ChurnAnalyzer();
    this.timeSeriesAnalyzer = new TimeSeriesAnalyzer();
    
    // Gerenciadores
    this.filterManager = new FilterManager();
    this.dashboardCustomizer = new DashboardCustomizer();
    this.alertsManager = new AlertsManager();
    this.aiReportGenerator = new AIReportGenerator();
    
    this.currentData = null;
    this.columnMetadata = null;
    this.analytics = null;
    this.charts = null;
    this.insights = null;
    this.exportManager = null;
    this.advancedAnalytics = null;
    
    this.status = ProcessingStatus.IDLE;
    
    this.init();
  }

  /**
   * Inicializa a aplicação
   */
  init() {
    console.log('🚀 BI Analytics Pro inicializado');
    this.setupEventListeners();
    this.uiManager.showUploadSection();
  }

  /**
   * Configura event listeners
   */
  setupEventListeners() {
    // Upload button
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
    
    // Drag and drop
    const uploadCard = document.querySelector('.upload-card');
    if (uploadCard) {
      uploadCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadCard.classList.add('drag-over');
      });
      
      uploadCard.addEventListener('dragleave', () => {
        uploadCard.classList.remove('drag-over');
      });
      
      uploadCard.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadCard.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
          this.handleFile(e.dataTransfer.files[0]);
        }
      });
    }
    
    // Export buttons
    document.getElementById('export-pdf-btn')?.addEventListener('click', () => this.exportToPDF());
    document.getElementById('export-excel-btn')?.addEventListener('click', () => this.exportToExcel());
    document.getElementById('export-csv-btn')?.addEventListener('click', () => this.exportToCSV());
    document.getElementById('new-analysis-btn')?.addEventListener('click', () => this.reset());
    document.getElementById('retry-btn')?.addEventListener('click', () => this.reset());
    
    // AI Report button
    document.getElementById('ai-report-btn')?.addEventListener('click', () => this.generateAIReport());
    
    // Progress listener
    window.addEventListener('upload-progress', (e) => {
      this.uiManager.updateProgress(e.detail.progress);
    });
  }

  /**
   * Manipula seleção de arquivo
   */
  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      await this.handleFile(file);
    }
  }

  /**
   * Processa o arquivo completo
   */
  async handleFile(file) {
    try {
      this.status = ProcessingStatus.UPLOADING;
      this.uiManager.showFileInfo(file.name, this.uploadManager.formatFileSize(file.size));
      
      // ETAPA 1: Upload e leitura
      this.uiManager.showProcessingSection();
      this.uiManager.updateStep(1, 'processing', 'Lendo arquivo...');
      
      const uploadResult = await this.uploadManager.uploadFile(file);
      
      // ETAPA 2: Parsing Excel
      this.status = ProcessingStatus.READING;
      this.uiManager.updateStep(1, 'completed', 'Leitura concluída!');
      this.uiManager.updateStep(2, 'processing', 'Detectando colunas...');
      
      await this.delay(500);
      
      this.excelParser.readWorkbook(uploadResult.data);
      const sheetData = this.excelParser.getFirstValidSheet();
      
      this.currentData = sheetData.data;
      
      // ETAPA 3: Detecção de tipos
      this.status = ProcessingStatus.DETECTING;
      this.uiManager.updateStep(2, 'completed', `${sheetData.metadata.columnCount} colunas detectadas!`);
      this.uiManager.updateStep(3, 'processing', 'Validando dados...');
      
      await this.delay(500);
      
      this.columnMetadata = this.typeDetector.detectAllColumns(
        this.currentData,
        sheetData.metadata.headers
      );
      
      // ETAPA 4: Validação
      this.status = ProcessingStatus.VALIDATING;
      const validation = this.validator.validate(this.currentData, this.columnMetadata);
      
      if (validation.warnings.length > 0) {
        console.warn('Avisos de validação:', validation.warnings);
      }
      
      // Limpar dados se necessário
      this.currentData = this.validator.cleanData(this.currentData, ['remove_empty_rows']);
      
      this.uiManager.updateStep(3, 'completed', 'Dados validados!');
      this.uiManager.updateStep(4, 'processing', 'Gerando análises...');
      
      await this.delay(500);
      
      // ETAPA 5: Análise
      this.status = ProcessingStatus.ANALYZING;
      const analyticsEngine = new AnalyticsEngine(this.currentData, this.columnMetadata);
      this.analytics = analyticsEngine.analyzeAll();
      
      this.uiManager.updateStep(4, 'completed', `${this.analytics.kpis.length} KPIs gerados!`);
      this.uiManager.updateStep(5, 'processing', 'Criando insights...');
      
      await this.delay(500);
      
      // ETAPA 6: Insights
      this.status = ProcessingStatus.GENERATING_INSIGHTS;
      const insightsGenerator = new InsightsGenerator(
        this.currentData,
        this.columnMetadata,
        this.analytics
      );
      this.insights = insightsGenerator.generateAll();
      this.analytics.insights = this.insights;
      
      // Gerar gráficos
      const chartGenerator = new ChartGenerator(
        this.currentData,
        this.columnMetadata,
        this.analytics
      );
      this.charts = chartGenerator.generateAll();
      
      this.uiManager.updateStep(5, 'completed', `${this.insights.length} insights criados!`);
      
      await this.delay(500);
      
      // ETAPA 6.5: Análises Avançadas
      console.log('🔬 Executando análises avançadas...');
      this.advancedAnalytics = {
        ml: this.mlEngine.analyzeAll(this.currentData, this.columnMetadata, this.analytics),
        rfm: this.rfmAnalyzer.analyze(this.currentData, this.columnMetadata),
        cohort: this.cohortAnalyzer.analyze(this.currentData, this.columnMetadata),
        correlation: this.correlationAnalyzer.analyze(this.currentData, this.columnMetadata),
        geo: this.geoAnalyzer.analyze(this.currentData, this.columnMetadata),
        marketBasket: this.marketBasketAnalyzer.analyze(this.currentData, this.columnMetadata),
        churn: this.churnAnalyzer.analyze(this.currentData, this.columnMetadata),
        timeSeries: this.timeSeriesAnalyzer.analyze(this.currentData, this.columnMetadata, this.analytics)
      };
      
      // Inicializar gerenciadores
      this.filterManager.initialize(this.currentData);
      this.dashboardCustomizer.initialize();
      this.alertsManager.initialize();
      
      // Avaliar alertas
      const newAlerts = this.alertsManager.evaluateRules({
        processedData: this.currentData,
        columnMetadata: this.columnMetadata,
        analytics: this.analytics,
        churn: this.advancedAnalytics.churn,
        insights: this.insights
      });
      
      console.log(`✅ ${newAlerts.length} alerta(s) gerado(s)`);
      
      await this.delay(1000);
      
      // ETAPA 7: Exibir dashboard
      this.status = ProcessingStatus.COMPLETED;
      this.displayDashboard();
      
      // Criar export manager
      this.exportManager = new ExportManager(this.currentData, this.analytics, this.charts);
      
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Exibe o dashboard final
   */
  displayDashboard() {
    this.uiManager.showDashboard();
    
    // Renderizar KPIs
    this.uiManager.renderKPIs(this.analytics.kpis);
    
    // Renderizar Insights
    this.uiManager.renderInsights(this.insights);
    
    // Renderizar Gráficos
    this.uiManager.renderCharts(this.charts);
    
    // Renderizar Análises Avançadas
    this.displayAdvancedAnalytics();
    
    // Renderizar Tabela
    this.uiManager.renderDataTable(this.currentData, this.columnMetadata);
    
    // Mostrar alertas se houver
    this.displayAlerts();
    
    console.log('✅ Dashboard renderizado com sucesso!');
  }
  
  /**
   * Exibe análises avançadas
   */
  displayAdvancedAnalytics() {
    if (!this.advancedAnalytics) return;
    
    const container = document.getElementById('advanced-analytics-container') || 
                     this.createAdvancedAnalyticsContainer();
    
    container.innerHTML = '<h2>📊 Análises Avançadas</h2>';
    
    // Machine Learning
    if (this.advancedAnalytics.ml.predictions?.length > 0) {
      this.displayMLAnalysis(container);
    }
    
    // RFM
    if (this.advancedAnalytics.rfm.available) {
      this.displayRFMAnalysis(container);
    }
    
    // Cohort
    if (this.advancedAnalytics.cohort.available) {
      this.displayCohortAnalysis(container);
    }
    
    // Correlation
    if (this.advancedAnalytics.correlation.available) {
      this.displayCorrelationAnalysis(container);
    }
    
    // Geographic
    if (this.advancedAnalytics.geo.available) {
      this.displayGeoAnalysis(container);
    }
    
    // Market Basket
    if (this.advancedAnalytics.marketBasket.available) {
      this.displayMarketBasketAnalysis(container);
    }
    
    // Churn
    if (this.advancedAnalytics.churn.available) {
      this.displayChurnAnalysis(container);
    }
    
    // Time Series
    if (this.advancedAnalytics.timeSeries.available) {
      this.displayTimeSeriesAnalysis(container);
    }
  }
  
  /**
   * Cria container para análises avançadas
   */
  createAdvancedAnalyticsContainer() {
    const container = document.createElement('div');
    container.id = 'advanced-analytics-container';
    container.className = 'section';
    
    const chartsSection = document.getElementById('charts-container');
    if (chartsSection && chartsSection.parentNode) {
      chartsSection.parentNode.insertBefore(container, chartsSection.nextSibling);
    } else {
      const dashboardSection = document.getElementById('dashboard-section');
      if (dashboardSection) {
        const containerDiv = dashboardSection.querySelector('.container');
        if (containerDiv) {
          containerDiv.appendChild(container);
        }
      }
    }
    
    return container;
  }
  
  /**
   * Exibe análise de Machine Learning
   */
  displayMLAnalysis(container) {
    const section = document.createElement('div');
    section.className = 'analysis-section';
    section.innerHTML = `
      <h3>🤖 Machine Learning - Previsões</h3>
      <div class="ml-predictions"></div>
    `;
    container.appendChild(section);
    
    const mlData = this.advancedAnalytics.ml;
    const predictionsDiv = section.querySelector('.ml-predictions');
    
    if (mlData.predictions.length > 0) {
      const pred = mlData.predictions[0];
      predictionsDiv.innerHTML = `
        <p><strong>Modelo:</strong> ${pred.method}</p>
        <p><strong>Precisão (R²):</strong> ${(pred.accuracy * 100).toFixed(1)}%</p>
        <p><strong>Previsões próximos 3 períodos:</strong></p>
        <ul>
          ${pred.predictions.map(p => `
            <li>${p.month}: R$ ${p.predicted.toFixed(2)} (Confiança: ${p.confidence.toFixed(1)}%)</li>
          `).join('')}
        </ul>
      `;
    }
  }
  
  /**
   * Exibe análise RFM
   */
  displayRFMAnalysis(container) {
    const section = document.createElement('div');
    section.className = 'analysis-section';
    section.innerHTML = `
      <h3>🎯 Análise RFM - Segmentação de Clientes</h3>
      <div class="rfm-segments"></div>
      <canvas id="rfm-chart" width="400" height="300"></canvas>
    `;
    container.appendChild(section);
    
    const rfmData = this.advancedAnalytics.rfm;
    const segmentsDiv = section.querySelector('.rfm-segments');
    
    segmentsDiv.innerHTML = `
      <p><strong>Total de Clientes:</strong> ${rfmData.metrics.totalClients}</p>
      <p><strong>Segmentos Identificados:</strong></p>
      <ul>
        ${rfmData.segments.slice(0, 5).map(s => `
          <li><span style="color: ${s.color}">⬤</span> ${s.name}: ${s.count} cliente(s)</li>
        `).join('')}
      </ul>
    `;
    
    // Criar gráfico RFM
    setTimeout(() => {
      AdvancedChartsHelper.createRFMSegmentsChart(rfmData, 'rfm-chart');
    }, 100);
  }
  
  /**
   * Exibe análise de Coorte
   */
  displayCohortAnalysis(container) {
    const section = document.createElement('div');
    section.className = 'analysis-section';
    section.innerHTML = `
      <h3>📅 Análise de Coorte - Retenção</h3>
      <canvas id="cohort-chart" width="600" height="300"></canvas>
    `;
    container.appendChild(section);
    
    setTimeout(() => {
      AdvancedChartsHelper.createCohortRetentionChart(
        this.advancedAnalytics.cohort,
        'cohort-chart'
      );
    }, 100);
  }
  
  /**
   * Exibe análise de Correlação
   */
  displayCorrelationAnalysis(container) {
    const section = document.createElement('div');
    section.className = 'analysis-section';
    section.innerHTML = `
      <h3>🔗 Correlações entre Variáveis</h3>
      <div class="correlation-list"></div>
    `;
    container.appendChild(section);
    
    const corrData = this.advancedAnalytics.correlation;
    const listDiv = section.querySelector('.correlation-list');
    
    if (corrData.significant.length > 0) {
      listDiv.innerHTML = `
        <p><strong>Top Correlações Significativas:</strong></p>
        <ul>
          ${corrData.significant.slice(0, 5).map(c => `
            <li>${c.variable1} ↔ ${c.variable2}: <strong>${c.coefficient.toFixed(3)}</strong> (${c.strength})</li>
          `).join('')}
        </ul>
      `;
    } else {
      listDiv.innerHTML = '<p>Nenhuma correlação forte detectada</p>';
    }
  }
  
  /**
   * Exibe análise Geográfica
   */
  displayGeoAnalysis(container) {
    const section = document.createElement('div');
    section.className = 'analysis-section';
    section.innerHTML = `
      <h3>🗺️ Distribuição Geográfica</h3>
      <canvas id="geo-chart" width="600" height="400"></canvas>
    `;
    container.appendChild(section);
    
    setTimeout(() => {
      AdvancedChartsHelper.createGeoChart(this.advancedAnalytics.geo, 'geo-chart');
    }, 100);
  }
  
  /**
   * Exibe análise Market Basket
   */
  displayMarketBasketAnalysis(container) {
    const section = document.createElement('div');
    section.className = 'analysis-section';
    section.innerHTML = `
      <h3>🛒 Market Basket - Produtos Associados</h3>
      <div class="basket-combos"></div>
    `;
    container.appendChild(section);
    
    const basketData = this.advancedAnalytics.marketBasket;
    const combosDiv = section.querySelector('.basket-combos');
    
    if (basketData.topCombos?.length > 0) {
      combosDiv.innerHTML = `
        <p><strong>Top Combinações:</strong></p>
        <ul>
          ${basketData.topCombos.slice(0, 5).map(c => `
            <li><strong>${c.combo}</strong><br/>${c.description}</li>
          `).join('')}
        </ul>
      `;
    } else {
      combosDiv.innerHTML = '<p>Poucas associações encontradas</p>';
    }
  }
  
  /**
   * Exibe análise de Churn
   */
  displayChurnAnalysis(container) {
    const section = document.createElement('div');
    section.className = 'analysis-section';
    section.innerHTML = `
      <h3>⚠️ Análise de Churn</h3>
      <div class="churn-stats"></div>
      <canvas id="churn-chart" width="600" height="300"></canvas>
    `;
    container.appendChild(section);
    
    const churnData = this.advancedAnalytics.churn;
    const statsDiv = section.querySelector('.churn-stats');
    
    statsDiv.innerHTML = `
      <p><strong>Taxa de Churn:</strong> <span style="color: ${churnData.metrics.churnRate > '30%' ? '#dc2626' : '#059669'}">${churnData.metrics.churnRate}</span></p>
      <p><strong>Clientes em Alto Risco:</strong> ${churnData.metrics.highRiskCount}</p>
    `;
    
    setTimeout(() => {
      AdvancedChartsHelper.createChurnScoreChart(churnData, 'churn-chart');
    }, 100);
  }
  
  /**
   * Exibe análise de Série Temporal
   */
  displayTimeSeriesAnalysis(container) {
    const section = document.createElement('div');
    section.className = 'analysis-section';
    section.innerHTML = `
      <h3>📈 Série Temporal - Tendências e Padrões</h3>
      <div class="timeseries-info"></div>
    `;
    container.appendChild(section);
    
    const tsData = this.advancedAnalytics.timeSeries;
    const infoDiv = section.querySelector('.timeseries-info');
    
    if (tsData.patterns?.length > 0) {
      infoDiv.innerHTML = `
        <p><strong>Padrões Detectados:</strong></p>
        <ul>
          ${tsData.patterns.map(p => `
            <li><strong>${p.description}</strong> - ${p.type === 'trend' ? p.magnitude : p.coefficient || ''}</li>
          `).join('')}
        </ul>
      `;
    }
  }
  
  /**
   * Exibe alertas
   */
  displayAlerts() {
    const unreadAlerts = this.alertsManager.getUnreadAlerts();
    
    if (unreadAlerts.length > 0) {
      console.log(`🔔 ${unreadAlerts.length} novo(s) alerta(s)`);
      
      // Mostrar badge ou notificação visual
      const alertBadge = document.getElementById('alert-badge');
      if (alertBadge) {
        alertBadge.textContent = unreadAlerts.length;
        alertBadge.style.display = 'block';
      }
    }
  }

  /**
   * Exporta para PDF
   */
  async exportToPDF() {
    if (!this.exportManager) return;
    
    try {
      this.uiManager.showLoading('Gerando PDF...');
      await this.exportManager.exportToPDF();
      this.uiManager.hideLoading();
      this.uiManager.showSuccess('PDF exportado com sucesso!');
    } catch (error) {
      this.uiManager.hideLoading();
      this.uiManager.showError('Erro ao exportar PDF: ' + error.message);
    }
  }

  /**
   * Exporta para Excel
   */
  exportToExcel() {
    if (!this.exportManager) return;
    
    try {
      this.exportManager.exportToExcel();
      this.uiManager.showSuccess('Excel exportado com sucesso!');
    } catch (error) {
      this.uiManager.showError('Erro ao exportar Excel: ' + error.message);
    }
  }

  /**
   * Exporta para CSV
   */
  exportToCSV() {
    if (!this.exportManager) return;
    
    try {
      this.exportManager.exportToCSV();
      this.uiManager.showSuccess('CSV exportado com sucesso!');
    } catch (error) {
      this.uiManager.showError('Erro ao exportar CSV: ' + error.message);
    }
  }

  /**
   * Reseta a aplicação
   */
  reset() {
    this.currentData = null;
    this.columnMetadata = null;
    this.analytics = null;
    this.charts = null;
    this.insights = null;
    this.exportManager = null;
    this.status = ProcessingStatus.IDLE;
    
    this.uploadManager.clear();
    this.uiManager.reset();
    
    // Limpar input
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
  }

  /**
   * Gera relatório detalhado com IA
   */
  async generateAIReport() {
    if (!this.currentData || !this.analytics) {
      alert('⚠️ Nenhuma análise disponível. Por favor, faça upload de uma planilha primeiro.');
      return;
    }

    const button = document.getElementById('ai-report-btn');
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span> Gerando Relatório com IA...';
    }

    try {
      console.log('🤖 Iniciando geração de relatório com IA...');
      
      // Gerar relatório completo com IA
      const aiReport = await this.aiReportGenerator.generateComprehensiveReport(
        this.currentData,
        this.analytics,
        this.advancedAnalytics
      );

      console.log('✅ Relatório IA gerado:', aiReport);

      // Exibir relatório na interface
      this.displayAIReport(aiReport);

      // Habilitar exportação do relatório
      this.enableAIReportExport(aiReport);

    } catch (error) {
      console.error('Erro ao gerar relatório com IA:', error);
      alert(`Erro ao gerar relatório: ${error.message}`);
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = '🤖 Gerar Relatório com IA';
      }
    }
  }

  /**
   * Exibe relatório de IA na interface
   */
  displayAIReport(report) {
    const container = document.getElementById('ai-report-container') || this.createAIReportContainer();
    
    container.innerHTML = `
      <div class="ai-report">
        <div class="ai-report-header">
          <h2>🤖 Relatório Inteligente com IA</h2>
          <p class="report-meta">
            ID: ${report.reportId} | 
            Gerado em: ${new Date(report.timestamp).toLocaleString('pt-BR')}
          </p>
          <button id="export-ai-report-btn" class="export-btn">
            📄 Exportar Relatório IA
          </button>
        </div>

        ${this.renderReportSection(report.sections.executiveSummary)}
        ${this.renderReportSection(report.sections.trends)}
        ${this.renderReportSection(report.sections.opportunities)}
        ${this.renderReportSection(report.sections.risks)}
        ${this.renderReportSection(report.sections.performance)}
        ${this.renderReportSection(report.sections.recommendations)}
        ${this.renderReportSection(report.sections.predictions)}
        ${this.renderReportSection(report.sections.actionPlan)}
      </div>
    `;

    // Scroll suave até o relatório
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Adicionar listener para exportação
    document.getElementById('export-ai-report-btn')?.addEventListener('click', () => {
      this.exportAIReport(report);
    });
  }

  /**
   * Renderiza uma seção do relatório
   */
  renderReportSection(section) {
    if (!section) return '';

    const priorityClass = section.priority || 'normal';
    const severityClass = section.severity ? `severity-${section.severity.toLowerCase()}` : '';

    return `
      <div class="report-section ${priorityClass} ${severityClass}">
        <h3>${section.title}</h3>
        <div class="section-content">
          ${this.formatMarkdownToHTML(section.content)}
        </div>
        ${section.insights ? this.renderInsights(section.insights) : ''}
        ${section.charts ? this.renderChartPlaceholders(section.charts) : ''}
      </div>
    `;
  }

  /**
   * Converte Markdown para HTML (básico)
   */
  formatMarkdownToHTML(text) {
    if (!text) return '';

    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Negrito
      .replace(/\*(.+?)\*/g, '<em>$1</em>') // Itálico
      .replace(/^### (.+)$/gm, '<h4>$3</h4>') // H4
      .replace(/^## (.+)$/gm, '<h3>$1</h3>') // H3
      .replace(/^# (.+)$/gm, '<h2>$1</h2>') // H2
      .replace(/^- (.+)$/gm, '<li>$1</li>') // Lista
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>') // Envolver lista
      .replace(/\n\n/g, '</p><p>') // Parágrafos
      .replace(/^(.+)$/gm, '<p>$1</p>'); // Wrap em parágrafos
  }

  /**
   * Renderiza insights adicionais
   */
  renderInsights(insights) {
    if (!insights || insights.length === 0) return '';

    return `
      <div class="section-insights">
        ${insights.map(insight => `
          <div class="insight-item ${insight.type}">
            ${insight.message}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Renderiza placeholders para gráficos
   */
  renderChartPlaceholders(charts) {
    return `
      <div class="section-charts">
        ${charts.map(chart => `
          <div class="chart-placeholder" data-chart-type="${chart}">
            📊 Gráfico: ${chart}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Cria container para relatório IA
   */
  createAIReportContainer() {
    const container = document.createElement('div');
    container.id = 'ai-report-container';
    container.className = 'ai-report-container';
    
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
      const containerDiv = dashboardSection.querySelector('.container');
      if (containerDiv) {
        containerDiv.appendChild(container);
      } else {
        dashboardSection.appendChild(container);
      }
    } else {
      document.body.appendChild(container);
    }
    
    return container;
  }

  /**
   * Habilita exportação do relatório IA
   */
  enableAIReportExport(report) {
    this.currentAIReport = report;
  }

  /**
   * Exporta relatório IA para PDF
   */
  async exportAIReport(report) {
    try {
      const button = document.getElementById('export-ai-report-btn');
      if (button) {
        button.disabled = true;
        button.textContent = '⏳ Gerando PDF...';
      }

      // Verificar se jsPDF está disponível
      if (!window.jspdf) {
        throw new Error('Biblioteca jsPDF não carregada. Recarregue a página e tente novamente.');
      }

      // Criar PDF do relatório IA
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      let yPosition = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 7;
      const maxWidth = 170;

      // Título
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Relatorio Inteligente com IA', margin, yPosition);
      yPosition += 10;

      // Metadados
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`ID: ${report.reportId}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Gerado em: ${new Date(report.timestamp).toLocaleString('pt-BR')}`, margin, yPosition);
      yPosition += 15;

      // Processar seções
      const sections = Object.values(report.sections);
      for (const section of sections) {
        if (!section) continue;

        // Verificar espaço na página
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        // Título da seção
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        const sectionTitle = section.title?.replace(/[^\x00-\x7F]/g, '') || 'Secao';
        doc.text(sectionTitle, margin, yPosition);
        yPosition += lineHeight + 3;

        // Conteúdo
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Limpar conteúdo de caracteres especiais e formatação Markdown
        const content = (section.content || '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/#{1,6}\s/g, '')
          .replace(/[^\x00-\x7F]/g, '')
          .trim();
        
        if (content) {
          const lines = doc.splitTextToSize(content, maxWidth);
          
          for (const line of lines) {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          }
        }
        
        yPosition += 10; // Espaço entre seções
      }

      // Salvar PDF
      const filename = `Relatorio_IA_${report.reportId}_${Date.now()}.pdf`;
      doc.save(filename);

      // Feedback de sucesso
      this.uiManager.showToast(`✅ Relatório exportado: ${filename}`, 'success');

    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      this.uiManager.showToast(`❌ Erro ao exportar: ${error.message}`, 'error');
    } finally {
      const button = document.getElementById('export-ai-report-btn');
      if (button) {
        button.disabled = false;
        button.textContent = '📄 Exportar Relatório IA';
      }
    }
  }

  /**
   * Manipula erros
   */
  handleError(error) {
    console.error('❌ Erro:', error);
    this.status = ProcessingStatus.ERROR;
    this.uiManager.showError(error.message);
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.biApp = new BIAnalyticsPro();
  });
} else {
  window.biApp = new BIAnalyticsPro();
}

export default BIAnalyticsPro;
