/**
 * @fileoverview GeoAnalyzer - Análise Geográfica
 * Analisa distribuição geográfica de vendas, clientes e operações
 */

/**
 * @typedef {Object} GeoData
 * @property {string} location - Localização (cidade, estado, região)
 * @property {number} count - Quantidade de ocorrências
 * @property {number} revenue - Receita total
 * @property {number} percentage - Porcentagem do total
 * @property {Object} coordinates - Coordenadas (lat, lng) se disponível
 */

export class GeoAnalyzer {
  constructor() {
    // Mapa de estados brasileiros
    this.brazilianStates = {
      'AC': { name: 'Acre', region: 'Norte' },
      'AL': { name: 'Alagoas', region: 'Nordeste' },
      'AP': { name: 'Amapá', region: 'Norte' },
      'AM': { name: 'Amazonas', region: 'Norte' },
      'BA': { name: 'Bahia', region: 'Nordeste' },
      'CE': { name: 'Ceará', region: 'Nordeste' },
      'DF': { name: 'Distrito Federal', region: 'Centro-Oeste' },
      'ES': { name: 'Espírito Santo', region: 'Sudeste' },
      'GO': { name: 'Goiás', region: 'Centro-Oeste' },
      'MA': { name: 'Maranhão', region: 'Nordeste' },
      'MT': { name: 'Mato Grosso', region: 'Centro-Oeste' },
      'MS': { name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
      'MG': { name: 'Minas Gerais', region: 'Sudeste' },
      'PA': { name: 'Pará', region: 'Norte' },
      'PB': { name: 'Paraíba', region: 'Nordeste' },
      'PR': { name: 'Paraná', region: 'Sul' },
      'PE': { name: 'Pernambuco', region: 'Nordeste' },
      'PI': { name: 'Piauí', region: 'Nordeste' },
      'RJ': { name: 'Rio de Janeiro', region: 'Sudeste' },
      'RN': { name: 'Rio Grande do Norte', region: 'Nordeste' },
      'RS': { name: 'Rio Grande do Sul', region: 'Sul' },
      'RO': { name: 'Rondônia', region: 'Norte' },
      'RR': { name: 'Roraima', region: 'Norte' },
      'SC': { name: 'Santa Catarina', region: 'Sul' },
      'SP': { name: 'São Paulo', region: 'Sudeste' },
      'SE': { name: 'Sergipe', region: 'Nordeste' },
      'TO': { name: 'Tocantins', region: 'Norte' }
    };

    this.regions = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
  }

  /**
   * Analisa dados geográficos
   * @param {Array<Object>} data - Dados
   * @param {Object} columnMetadata - Metadados
   * @returns {Object} Análise geográfica
   */
  analyze(data, columnMetadata) {
    // Identificar colunas geográficas
    const geoColumns = this.identifyGeoColumns(columnMetadata);
    
    if (geoColumns.length === 0) {
      return {
        available: false,
        reason: 'Nenhuma coluna geográfica identificada (cidade, estado, CEP, região)'
      };
    }

    const valueCol = columnMetadata.find(col => 
      col.type === 'CURRENCY' && 
      (col.name.toLowerCase().includes('valor') || 
       col.name.toLowerCase().includes('receita'))
    );

    // Análise por estado
    const byState = this.analyzeByState(data, geoColumns, valueCol?.name);

    // Análise por região
    const byRegion = this.analyzeByRegion(byState);

    // Análise por cidade
    const byCity = this.analyzeByCity(data, geoColumns, valueCol?.name);

    // Gerar insights
    const insights = this.generateGeoInsights(byState, byRegion, byCity);

    // Métricas geográficas
    const metrics = this.calculateGeoMetrics(byState, byRegion);

    return {
      available: true,
      byState,
      byRegion,
      byCity,
      insights,
      metrics,
      columnsUsed: geoColumns.map(c => c.name)
    };
  }

  /**
   * Identifica colunas com informação geográfica
   */
  identifyGeoColumns(columnMetadata) {
    const geoKeywords = ['cidade', 'estado', 'uf', 'região', 'regiao', 'cep', 'localidade', 'municipio'];
    
    return columnMetadata.filter(col => {
      const name = col.name.toLowerCase();
      return geoKeywords.some(keyword => name.includes(keyword));
    });
  }

  /**
   * Analisa dados por estado
   */
  analyzeByState(data, geoColumns, valueCol) {
    const stateData = new Map();

    // Tentar encontrar coluna de estado/UF
    const stateCol = geoColumns.find(col => {
      const name = col.name.toLowerCase();
      return name.includes('estado') || name.includes('uf');
    });

    if (!stateCol) {
      // Tentar extrair de outras colunas
      return this.extractStateFromOtherColumns(data, geoColumns, valueCol);
    }

    data.forEach(row => {
      const stateValue = row[stateCol.name];
      if (!stateValue) return;

      const state = this.normalizeState(stateValue);
      if (!state) return;

      if (!stateData.has(state)) {
        stateData.set(state, {
          state,
          stateName: this.brazilianStates[state]?.name || state,
          region: this.brazilianStates[state]?.region || 'Outro',
          count: 0,
          revenue: 0
        });
      }

      const stateInfo = stateData.get(state);
      stateInfo.count++;
      if (valueCol) {
        stateInfo.revenue += parseFloat(row[valueCol]) || 0;
      }
    });

    // Calcular porcentagens
    const total = Array.from(stateData.values()).reduce((sum, s) => sum + s.count, 0);
    const totalRevenue = Array.from(stateData.values()).reduce((sum, s) => sum + s.revenue, 0);

    stateData.forEach(state => {
      state.percentage = (state.count / total) * 100;
      state.revenuePercentage = totalRevenue > 0 ? (state.revenue / totalRevenue) * 100 : 0;
    });

    return Array.from(stateData.values())
      .sort((a, b) => b.revenue - a.revenue || b.count - a.count);
  }

  /**
   * Normaliza nome/sigla de estado
   */
  normalizeState(value) {
    const str = String(value).trim().toUpperCase();

    // Já é sigla
    if (this.brazilianStates[str]) {
      return str;
    }

    // Buscar por nome
    for (const [uf, info] of Object.entries(this.brazilianStates)) {
      if (info.name.toUpperCase() === str) {
        return uf;
      }
    }

    // Tentar match parcial
    for (const [uf, info] of Object.entries(this.brazilianStates)) {
      if (str.includes(info.name.toUpperCase()) || info.name.toUpperCase().includes(str)) {
        return uf;
      }
    }

    return null;
  }

  /**
   * Tenta extrair estado de colunas de cidade ou endereço
   */
  extractStateFromOtherColumns(data, geoColumns, valueCol) {
    const stateData = new Map();

    data.forEach(row => {
      for (const col of geoColumns) {
        const value = row[col.name];
        if (!value) continue;

        // Procurar sigla de estado no texto (padrão: XX ou - XX)
        const stateMatch = String(value).match(/\b([A-Z]{2})\b/);
        if (stateMatch) {
          const state = stateMatch[1];
          if (this.brazilianStates[state]) {
            if (!stateData.has(state)) {
              stateData.set(state, {
                state,
                stateName: this.brazilianStates[state].name,
                region: this.brazilianStates[state].region,
                count: 0,
                revenue: 0
              });
            }

            const stateInfo = stateData.get(state);
            stateInfo.count++;
            if (valueCol) {
              stateInfo.revenue += parseFloat(row[valueCol]) || 0;
            }
            break;
          }
        }
      }
    });

    const total = Array.from(stateData.values()).reduce((sum, s) => sum + s.count, 0);
    const totalRevenue = Array.from(stateData.values()).reduce((sum, s) => sum + s.revenue, 0);

    stateData.forEach(state => {
      state.percentage = (state.count / total) * 100;
      state.revenuePercentage = totalRevenue > 0 ? (state.revenue / totalRevenue) * 100 : 0;
    });

    return Array.from(stateData.values())
      .sort((a, b) => b.revenue - a.revenue || b.count - a.count);
  }

  /**
   * Agrupa dados por região
   */
  analyzeByRegion(stateData) {
    const regionData = new Map();

    stateData.forEach(state => {
      const region = state.region;

      if (!regionData.has(region)) {
        regionData.set(region, {
          region,
          states: [],
          count: 0,
          revenue: 0
        });
      }

      const regionInfo = regionData.get(region);
      regionInfo.states.push(state.state);
      regionInfo.count += state.count;
      regionInfo.revenue += state.revenue;
    });

    // Calcular porcentagens
    const total = Array.from(regionData.values()).reduce((sum, r) => sum + r.count, 0);
    const totalRevenue = Array.from(regionData.values()).reduce((sum, r) => sum + r.revenue, 0);

    regionData.forEach(region => {
      region.percentage = (region.count / total) * 100;
      region.revenuePercentage = totalRevenue > 0 ? (region.revenue / totalRevenue) * 100 : 0;
      region.stateCount = region.states.length;
    });

    return Array.from(regionData.values())
      .sort((a, b) => b.revenue - a.revenue || b.count - a.count);
  }

  /**
   * Analisa dados por cidade
   */
  analyzeByCity(data, geoColumns, valueCol) {
    const cityCol = geoColumns.find(col => {
      const name = col.name.toLowerCase();
      return name.includes('cidade') || name.includes('municipio');
    });

    if (!cityCol) return [];

    const cityData = new Map();

    data.forEach(row => {
      const city = row[cityCol.name];
      if (!city) return;

      const normalizedCity = String(city).trim();

      if (!cityData.has(normalizedCity)) {
        cityData.set(normalizedCity, {
          city: normalizedCity,
          count: 0,
          revenue: 0
        });
      }

      const cityInfo = cityData.get(normalizedCity);
      cityInfo.count++;
      if (valueCol) {
        cityInfo.revenue += parseFloat(row[valueCol]) || 0;
      }
    });

    const total = Array.from(cityData.values()).reduce((sum, c) => sum + c.count, 0);
    const totalRevenue = Array.from(cityData.values()).reduce((sum, c) => sum + c.revenue, 0);

    cityData.forEach(city => {
      city.percentage = (city.count / total) * 100;
      city.revenuePercentage = totalRevenue > 0 ? (city.revenue / totalRevenue) * 100 : 0;
    });

    return Array.from(cityData.values())
      .sort((a, b) => b.revenue - a.revenue || b.count - a.count)
      .slice(0, 20); // Top 20 cidades
  }

  /**
   * Gera insights geográficos
   */
  generateGeoInsights(byState, byRegion, byCity) {
    const insights = [];

    // Concentração geográfica
    if (byState.length > 0) {
      const topState = byState[0];
      insights.push({
        type: 'geo_concentration_state',
        priority: topState.percentage > 40 ? 'ALTA' : 'MÉDIA',
        title: `${topState.stateName} concentra ${topState.percentage.toFixed(1)}% das operações`,
        description: `Receita: R$ ${topState.revenue.toFixed(2)} (${topState.revenuePercentage.toFixed(1)}%)`,
        action: topState.percentage > 40 
          ? 'Alta concentração - considere diversificação geográfica'
          : 'Explore oportunidades neste estado líder'
      });
    }

    // Análise por região
    if (byRegion.length > 0) {
      const topRegion = byRegion[0];
      insights.push({
        type: 'geo_region',
        priority: 'MÉDIA',
        title: `Região ${topRegion.region} domina com ${topRegion.percentage.toFixed(1)}%`,
        description: `Abrange ${topRegion.stateCount} estado(s)`,
        action: 'Fortaleça presença nas outras regiões para balancear portfólio'
      });
    }

    // Oportunidades não exploradas
    const coveredStates = byState.length;
    const totalStates = Object.keys(this.brazilianStates).length;
    
    if (coveredStates < totalStates) {
      const uncovered = totalStates - coveredStates;
      insights.push({
        type: 'geo_opportunity',
        priority: 'MÉDIA',
        title: `${uncovered} estados ainda não cobertos`,
        description: `Operando em ${coveredStates} de ${totalStates} estados`,
        action: 'Oportunidade de expansão geográfica'
      });
    }

    // Top cidade
    if (byCity.length > 0 && byCity[0].percentage > 15) {
      insights.push({
        type: 'geo_city',
        priority: 'MÉDIA',
        title: `${byCity[0].city} é o principal município`,
        description: `${byCity[0].percentage.toFixed(1)}% das operações`,
        action: 'Mercado prioritário - investir em marketing local'
      });
    }

    return insights;
  }

  /**
   * Calcula métricas geográficas
   */
  calculateGeoMetrics(byState, byRegion) {
    return {
      statesCovered: byState.length,
      regionsCovered: byRegion.length,
      topState: byState[0]?.stateName,
      topStatePercentage: byState[0]?.percentage.toFixed(1) + '%',
      topRegion: byRegion[0]?.region,
      topRegionPercentage: byRegion[0]?.percentage.toFixed(1) + '%',
      geographicDiversity: this.calculateDiversityIndex(byState)
    };
  }

  /**
   * Calcula índice de diversidade geográfica (Herfindahl-Hirschman)
   */
  calculateDiversityIndex(stateData) {
    if (stateData.length === 0) return 0;

    const hhi = stateData.reduce((sum, state) => {
      return sum + Math.pow(state.percentage, 2);
    }, 0);

    // Normalizar para 0-100 (100 = totalmente diversificado)
    const maxHHI = 10000; // 100^2 (concentração total)
    const diversity = ((maxHHI - hhi) / maxHHI) * 100;

    return diversity.toFixed(1);
  }
}
