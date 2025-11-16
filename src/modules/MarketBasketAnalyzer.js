/**
 * @fileoverview MarketBasketAnalyzer - Análise de Cesta de Mercado
 * Identifica produtos frequentemente comprados juntos (Associação)
 */

/**
 * @typedef {Object} AssociationRule
 * @property {Array<string>} antecedent - Produtos que aparecem primeiro
 * @property {Array<string>} consequent - Produtos que aparecem junto
 * @property {number} support - Suporte (frequência conjunta)
 * @property {number} confidence - Confiança (probabilidade condicional)
 * @property {number} lift - Lift (força da associação)
 */

export class MarketBasketAnalyzer {
  constructor() {
    this.minSupport = 0.02; // 2%
    this.minConfidence = 0.3; // 30%
  }

  /**
   * Analisa cestas de compra
   * @param {Array<Object>} data - Dados
   * @param {Object} columnMetadata - Metadados
   * @returns {Object} Análise de market basket
   */
  analyze(data, columnMetadata) {
    // Identificar colunas necessárias
    const productCol = columnMetadata.find(col => col.type === 'PRODUCT');
    const transactionCol = this.findTransactionColumn(data, columnMetadata);

    if (!productCol) {
      return {
        available: false,
        reason: 'Coluna de produto não identificada'
      };
    }

    // Agrupar produtos por transação
    const transactions = this.groupByTransaction(data, productCol.name, transactionCol);

    if (transactions.length < 10) {
      return {
        available: false,
        reason: 'Mínimo de 10 transações necessárias'
      };
    }

    // Encontrar itemsets frequentes
    const frequentItemsets = this.findFrequentItemsets(transactions);

    // Gerar regras de associação
    const rules = this.generateAssociationRules(frequentItemsets, transactions.length);

    // Top combos
    const topCombos = this.findTopCombos(rules);

    // Gerar insights
    const insights = this.generateMarketBasketInsights(rules, topCombos);

    // Métricas
    const metrics = this.calculateMarketBasketMetrics(transactions, rules);

    return {
      available: true,
      transactions: transactions.length,
      rules,
      topCombos,
      insights,
      metrics,
      columnsUsed: {
        product: productCol.name,
        transaction: transactionCol
      }
    };
  }

  /**
   * Encontra coluna que identifica transações
   */
  findTransactionColumn(data, columnMetadata) {
    // Procurar coluna explícita
    const candidates = ['pedido', 'transacao', 'transação', 'venda', 'id', 'nf', 'nota'];
    
    for (const col of columnMetadata) {
      const name = col.name.toLowerCase();
      if (candidates.some(c => name.includes(c))) {
        return col.name;
      }
    }

    // Se não encontrar, usar data + cliente como identificador
    const dateCol = columnMetadata.find(col => col.type === 'DATE');
    const clientCol = columnMetadata.find(col => col.type === 'CLIENT');

    if (dateCol && clientCol) {
      return `${dateCol.name}_${clientCol.name}`;
    }

    // Último recurso: agrupar por index
    return null;
  }

  /**
   * Agrupa produtos por transação
   */
  groupByTransaction(data, productCol, transactionCol) {
    const transactionMap = new Map();

    data.forEach((row, index) => {
      const product = row[productCol];
      if (!product) return;

      // Determinar ID da transação
      let transactionId;
      if (transactionCol && transactionCol.includes('_')) {
        // Combinar colunas
        const [col1, col2] = transactionCol.split('_');
        transactionId = `${row[col1]}_${row[col2]}`;
      } else if (transactionCol) {
        transactionId = row[transactionCol];
      } else {
        // Usar index como transação (cada linha = transação)
        transactionId = index;
      }

      if (!transactionMap.has(transactionId)) {
        transactionMap.set(transactionId, new Set());
      }

      transactionMap.get(transactionId).add(String(product).trim());
    });

    // Converter para array de arrays
    return Array.from(transactionMap.values())
      .map(set => Array.from(set))
      .filter(items => items.length > 0);
  }

  /**
   * Encontra itemsets frequentes (algoritmo Apriori simplificado)
   */
  findFrequentItemsets(transactions) {
    const frequentItemsets = new Map();
    const totalTransactions = transactions.length;

    // L1: Itemsets de tamanho 1
    const itemCounts = new Map();
    transactions.forEach(transaction => {
      transaction.forEach(item => {
        itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
      });
    });

    // Filtrar por suporte mínimo
    itemCounts.forEach((count, item) => {
      const support = count / totalTransactions;
      if (support >= this.minSupport) {
        frequentItemsets.set(JSON.stringify([item]), { items: [item], support, count });
      }
    });

    // L2: Itemsets de tamanho 2
    const items = Array.from(itemCounts.keys()).filter(item => {
      const support = itemCounts.get(item) / totalTransactions;
      return support >= this.minSupport;
    });

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const pair = [items[i], items[j]].sort();
        let count = 0;

        transactions.forEach(transaction => {
          if (pair.every(item => transaction.includes(item))) {
            count++;
          }
        });

        const support = count / totalTransactions;
        if (support >= this.minSupport) {
          frequentItemsets.set(JSON.stringify(pair), { items: pair, support, count });
        }
      }
    }

    return frequentItemsets;
  }

  /**
   * Gera regras de associação
   */
  generateAssociationRules(frequentItemsets, _totalTransactions) {
    const rules = [];

    // Processar apenas itemsets de tamanho 2
    frequentItemsets.forEach(({ items, support, count }) => {
      if (items.length !== 2) return;

      const [item1, item2] = items;

      // Regra: item1 => item2
      const item1Support = this.getItemSupport(frequentItemsets, [item1]);
      if (item1Support > 0) {
        const confidence = support / item1Support;
        const lift = confidence / this.getItemSupport(frequentItemsets, [item2]);

        if (confidence >= this.minConfidence) {
          rules.push({
            antecedent: [item1],
            consequent: [item2],
            support: support * 100,
            confidence: confidence * 100,
            lift,
            count
          });
        }
      }

      // Regra: item2 => item1
      const item2Support = this.getItemSupport(frequentItemsets, [item2]);
      if (item2Support > 0) {
        const confidence = support / item2Support;
        const lift = confidence / this.getItemSupport(frequentItemsets, [item1]);

        if (confidence >= this.minConfidence) {
          rules.push({
            antecedent: [item2],
            consequent: [item1],
            support: support * 100,
            confidence: confidence * 100,
            lift,
            count
          });
        }
      }
    });

    return rules.sort((a, b) => b.lift - a.lift);
  }

  /**
   * Obtém suporte de um item
   */
  getItemSupport(frequentItemsets, items) {
    const key = JSON.stringify(items.sort());
    const itemset = frequentItemsets.get(key);
    return itemset ? itemset.support : 0;
  }

  /**
   * Encontra top combinações
   */
  findTopCombos(rules) {
    return rules
      .filter(rule => rule.lift > 1) // Lift > 1 = associação positiva
      .slice(0, 10)
      .map(rule => ({
        combo: `${rule.antecedent[0]} → ${rule.consequent[0]}`,
        strength: rule.lift.toFixed(2),
        confidence: rule.confidence.toFixed(1) + '%',
        support: rule.support.toFixed(1) + '%',
        description: `${rule.confidence.toFixed(0)}% dos clientes que compram ${rule.antecedent[0]} também compram ${rule.consequent[0]}`
      }));
  }

  /**
   * Gera insights de market basket
   */
  generateMarketBasketInsights(rules, topCombos) {
    const insights = [];

    if (topCombos.length === 0) {
      insights.push({
        type: 'market_basket',
        priority: 'BAIXA',
        title: 'Poucas associações fortes encontradas',
        description: 'Produtos parecem ser comprados independentemente',
        action: 'Considere criar combos ou promoções para incentivar compras múltiplas'
      });
      return insights;
    }

    // Top associação
    const top = topCombos[0];
    insights.push({
      type: 'market_basket_top',
      priority: 'ALTA',
      title: `Combo forte: ${top.combo}`,
      description: top.description,
      action: `Cross-sell: ofereça ${top.combo.split(' → ')[1]} para quem compra ${top.combo.split(' → ')[0]}`
    });

    // Produtos âncora
    const anchorProducts = this.findAnchorProducts(rules);
    if (anchorProducts.length > 0) {
      insights.push({
        type: 'market_basket_anchor',
        priority: 'ALTA',
        title: `${anchorProducts.length} produto(s) âncora identificado(s)`,
        description: `${anchorProducts[0]} frequentemente leva à compra de outros produtos`,
        action: 'Use como produto de entrada para aumentar ticket médio'
      });
    }

    // Bundle recommendations
    if (rules.length >= 3) {
      insights.push({
        type: 'market_basket_bundle',
        priority: 'MÉDIA',
        title: `${Math.min(rules.length, 5)} combos recomendados para bundle`,
        description: 'Produtos com alta afinidade podem ser vendidos juntos',
        action: 'Crie kits/combos promocionais baseados nestas associações'
      });
    }

    return insights;
  }

  /**
   * Identifica produtos âncora (que levam a muitas compras)
   */
  findAnchorProducts(rules) {
    const productLeads = new Map();

    rules.forEach(rule => {
      const product = rule.antecedent[0];
      if (!productLeads.has(product)) {
        productLeads.set(product, { count: 0, totalLift: 0 });
      }

      const stats = productLeads.get(product);
      stats.count++;
      stats.totalLift += rule.lift;
    });

    return Array.from(productLeads.entries())
      .filter(([_, stats]) => stats.count >= 2)
      .sort((a, b) => b[1].totalLift - a[1].totalLift)
      .slice(0, 3)
      .map(([product, _]) => product);
  }

  /**
   * Calcula métricas de market basket
   */
  calculateMarketBasketMetrics(transactions, rules) {
    const productsPerTransaction = transactions.map(t => t.length);
    const avgBasketSize = productsPerTransaction.reduce((a, b) => a + b, 0) / transactions.length;

    return {
      totalTransactions: transactions.length,
      avgBasketSize: avgBasketSize.toFixed(2),
      rulesFound: rules.length,
      strongRules: rules.filter(r => r.lift > 1.5).length,
      topLift: rules[0]?.lift.toFixed(2) || 0,
      crossSellPotential: rules.length > 0 ? 'ALTO' : 'BAIXO'
    };
  }
}
