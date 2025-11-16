/**
 * ColumnType Enum - Tipos de colunas detectáveis
 */
export const ColumnType = {
  DATE: 'date',
  NUMBER: 'number',
  CURRENCY: 'currency',
  PERCENTAGE: 'percentage',
  TEXT: 'text',
  CATEGORY: 'category',
  PRODUCT: 'product',
  EMPLOYEE: 'employee',
  CLIENT: 'client',
  SKU: 'sku',
  BOOLEAN: 'boolean',
  EMAIL: 'email',
  PHONE: 'phone',
  UNKNOWN: 'unknown'
};

/**
 * ChartType Enum - Tipos de gráficos disponíveis
 */
export const ChartType = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
  AREA: 'area',
  SCATTER: 'scatter',
  RADAR: 'radar',
  MIXED: 'mixed'
};

/**
 * InsightType Enum - Tipos de insights gerados
 */
export const InsightType = {
  TREND: 'trend',
  ANOMALY: 'anomaly',
  COMPARISON: 'comparison',
  RANKING: 'ranking',
  PREDICTION: 'prediction',
  ALERT: 'alert',
  OPPORTUNITY: 'opportunity'
};

/**
 * ProcessingStatus Enum - Status do processamento
 */
export const ProcessingStatus = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  READING: 'reading',
  DETECTING: 'detecting',
  VALIDATING: 'validating',
  ANALYZING: 'analyzing',
  GENERATING_INSIGHTS: 'generating_insights',
  COMPLETED: 'completed',
  ERROR: 'error'
};
