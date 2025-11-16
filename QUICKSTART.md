# BI Analytics Pro - Guia de Início Rápido

## 🚀 Instalação em 3 Passos

### 1. Instalar Dependências

```bash
npm install
```

### 2. Iniciar Servidor

```bash
npm run dev
```

### 3. Usar o Sistema

1. Abra <http://localhost:3000>
2. Faça upload de um arquivo Excel
3. Aguarde o processamento automático
4. Visualize insights e exporte relatórios!

## 📊 Exemplos de Planilhas

Você pode testar com planilhas que contenham:

- **Vendas**: Data, Produto, Valor, Vendedor, Cliente
- **Financeiro**: Data, Tipo (Entrada/Saída), Categoria, Valor
- **Estoque**: Produto, Quantidade, Valor, Fornecedor
- **RH**: Funcionário, Cargo, Salário, Departamento

## 🎯 Requisitos da Planilha

✅ Primeira linha deve conter os cabeçalhos
✅ Formato .xlsx ou .xls
✅ Máximo 50MB
✅ Dados organizados em colunas

## 💡 Dicas

- Nomeie as colunas claramente (ex: "Data da Venda", "Valor Total")
- Use formatos consistentes (datas, moedas)
- Evite células mescladas
- Remova linhas completamente vazias

## 🆘 Problemas Comuns

**Erro ao ler arquivo**
→ Verifique se é um arquivo Excel válido (.xlsx ou .xls)

**Gráficos não aparecem**
→ Certifique-se que há dados numéricos e datas

**Insights limitados**
→ Mais dados = melhores insights. Use pelo menos 20-30 registros

## 📚 Documentação Completa

Veja README.md para documentação detalhada
