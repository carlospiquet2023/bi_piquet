/**
 * Módulo de Exportação
 * Responsável por:
 * - Exportar para PDF
 * - Exportar para Excel
 * - Exportar para CSV
 * - Gerar imagens dos gráficos
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export class ExportManager {
  constructor(data, analytics, charts) {
    this.data = data;
    this.analytics = analytics;
    this.charts = charts;
  }

  /**
   * Exporta dashboard para PDF
   * @returns {Promise<void>}
   */
  async exportToPDF() {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Título
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('Relatório de Análise de Dados', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    
    // KPIs
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Principais Indicadores (KPIs)', 15, yPosition);
    yPosition += 8;
    
    const kpisData = this.analytics.kpis.slice(0, 10).map(kpi => [
      kpi.title,
      typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value,
      kpi.description || '',
    ]);
    
    pdf.autoTable({
      startY: yPosition,
      head: [['Indicador', 'Valor', 'Descrição']],
      body: kpisData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 15, right: 15 },
    });
    
    yPosition = pdf.lastAutoTable.finalY + 15;
    
    // Nova página para insights
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // Insights
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Insights Estratégicos', 15, yPosition);
    yPosition += 8;
    
    const insightsData = this.analytics.insights.slice(0, 8).map(insight => [
      insight.title.replace(/[^\w\s-]/g, ''), // Remove emojis
      insight.description,
    ]);
    
    pdf.autoTable({
      startY: yPosition,
      head: [['Insight', 'Descrição']],
      body: insightsData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219] },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 'auto' },
      },
    });
    
    yPosition = pdf.lastAutoTable.finalY + 15;
    
    // Capturar gráficos (se houver)
    if (this.charts && this.charts.length > 0) {
      pdf.addPage();
      yPosition = 20;
      
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Gráficos', 15, yPosition);
      yPosition += 10;
      
      // Tentar capturar container de gráficos
      const chartsContainer = document.getElementById('charts-container');
      if (chartsContainer) {
        try {
          const canvas = await html2canvas(chartsContainer, {
            scale: 2,
            logging: false,
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 30;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, Math.min(imgHeight, pageHeight - yPosition - 20));
        } catch (error) {
          console.warn('Não foi possível capturar gráficos:', error);
        }
      }
    }
    
    // Salvar PDF
    pdf.save(`relatorio-bi-${Date.now()}.pdf`);
  }

  /**
   * Exporta dados para Excel
   * @returns {void}
   */
  exportToExcel() {
    const wb = XLSX.utils.book_new();
    
    // Aba: Dados Originais
    const ws1 = XLSX.utils.json_to_sheet(this.data);
    XLSX.utils.book_append_sheet(wb, ws1, 'Dados');
    
    // Aba: KPIs
    const kpisFormatted = this.analytics.kpis.map(kpi => ({
      'Indicador': kpi.title,
      'Valor': typeof kpi.value === 'number' ? kpi.value : kpi.value,
      'Descrição': kpi.description || '',
      'Categoria': kpi.category || '',
    }));
    const ws2 = XLSX.utils.json_to_sheet(kpisFormatted);
    XLSX.utils.book_append_sheet(wb, ws2, 'KPIs');
    
    // Aba: Insights
    const insightsFormatted = this.analytics.insights.map(insight => ({
      'Tipo': insight.type,
      'Título': insight.title,
      'Descrição': insight.description,
      'Relevância': insight.relevance,
      'Severidade': insight.severity,
    }));
    const ws3 = XLSX.utils.json_to_sheet(insightsFormatted);
    XLSX.utils.book_append_sheet(wb, ws3, 'Insights');
    
    // Aba: Agrupamento Mensal (se houver)
    if (this.analytics.groupings && this.analytics.groupings.monthly) {
      const ws4 = XLSX.utils.json_to_sheet(this.analytics.groupings.monthly);
      XLSX.utils.book_append_sheet(wb, ws4, 'Análise Mensal');
    }
    
    // Salvar arquivo
    XLSX.writeFile(wb, `analise-bi-${Date.now()}.xlsx`);
  }

  /**
   * Exporta dados para CSV
   * @returns {void}
   */
  exportToCSV() {
    const csv = Papa.unparse(this.data, {
      delimiter: ';',
      header: true,
      encoding: 'utf-8',
    });
    
    // Criar blob e download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `dados-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Exporta gráfico específico como imagem
   * @param {string} chartId - ID do container do gráfico
   * @returns {Promise<void>}
   */
  async exportChartAsImage(chartId) {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
      throw new Error(`Gráfico ${chartId} não encontrado`);
    }
    
    try {
      const canvas = await html2canvas(chartElement, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `grafico-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Erro ao exportar gráfico:', error);
      throw error;
    }
  }

  /**
   * Exporta todos os gráficos como ZIP
   * @returns {Promise<void>}
   */
  async exportAllChartsAsImages() {
    // Implementação simplificada - exporta um por vez
    const chartElements = document.querySelectorAll('.chart-container canvas');
    
    for (let i = 0; i < chartElements.length; i++) {
      const chartElement = chartElements[i].parentElement;
      if (chartElement) {
        await this.exportChartAsImage(chartElement.id);
        // Pequeno delay entre downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
}
