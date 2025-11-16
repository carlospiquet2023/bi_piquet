# 📊 BI Analytics Pro

> Sistema profissional de análise automática de planilhas com IA e geração de insights estratégicos

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Características

### ✨ Principais Funcionalidades

- **📤 Upload Inteligente**: Suporte a arquivos Excel (.xlsx, .xls) com validação automática
- **🔍 Detecção Automática de Tipos**: Identifica automaticamente o tipo de cada coluna (data, moeda, texto, categoria, etc.)
- **✅ Validação de Dados**: Detecta inconsistências, valores nulos, duplicatas e sugere correções
- **📊 KPIs Automáticos**: Calcula automaticamente indicadores-chave de performance
- **📈 Gráficos Inteligentes**: Gera visualizações adequadas baseadas nos tipos de dados
- **💡 Insights com IA**: Identifica padrões, anomalias, tendências e oportunidades
- **📄 Exportação Múltipla**: Exporta para PDF, Excel, CSV e imagens

### 🎯 Tipos de Dados Detectáveis

- 📅 Datas
- 💰 Valores Monetários
- 📊 Números
- 📝 Texto
- 🏷️ Categorias
- 📦 Produtos
- 👤 Funcionários
- 🤝 Clientes
- 🔢 SKU/Códigos
- ✉️ E-mails
- 📞 Telefones
- ✔️ Booleanos

### 📈 Análises Automáticas

- **Métricas Financeiras**: Total de entradas, saídas, lucro/prejuízo, ticket médio
- **Agrupamentos**: Por mês, categoria, produto, funcionário
- **Tendências**: Crescimento, queda, sazonalidade
- **Projeções**: Previsões baseadas em médias móveis
- **Comparações**: Performance relativa entre categorias

### 💡 Tipos de Insights

- 📈 **Tendências**: Identifica padrões de crescimento ou queda
- ⚡ **Anomalias**: Detecta valores atípicos e quedas bruscas
- 🏆 **Rankings**: Produtos campeões, funcionários destaque
- 💡 **Oportunidades**: Identifica potencial de crescimento
- ⚠️ **Alertas**: Avisos sobre prejuízos, margens apertadas

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Vanilla JavaScript (ES6+)
- **Build**: Vite
- **Leitura Excel**: SheetJS (xlsx)
- **Gráficos**: Chart.js
- **Exportação PDF**: jsPDF + jsPDF-AutoTable
- **Exportação CSV**: PapaParse
- **Captura de Tela**: html2canvas
- **Datas**: date-fns
- **Estatísticas**: Regression.js
- **Utilities**: Lodash-es

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Passos

1. **Clone ou extraia o projeto**

   ```bash
   cd bi_piquet
   ```

1. **Instale as dependências**

   ```bash
   npm install
   ```

1. **Inicie o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

1. **Abra no navegador**

   O Vite abrirá automaticamente em `http://localhost:3000`

## 📖 Como Usar

### 1️⃣ Upload da Planilha

- Clique em "Selecionar Arquivo" ou arraste e solte um arquivo Excel
- Formatos aceitos: `.xlsx`, `.xls`
- Tamanho máximo: 50MB

### 2️⃣ Processamento Automático

O sistema executa automaticamente:

1. ✅ Validação do arquivo
2. 📖 Leitura e parsing do Excel
3. 🔍 Detecção de tipos de colunas
4. ✅ Validação e limpeza dos dados
5. 📊 Geração de KPIs e métricas
6. 📈 Criação de gráficos
7. 💡 Geração de insights estratégicos

### 3️⃣ Visualização do Dashboard

O dashboard apresenta:

- **KPIs**: Cards com principais indicadores
- **Insights**: Análises estratégicas com relevância
- **Gráficos**: Visualizações automáticas
- **Tabela**: Dados processados

### 4️⃣ Exportação

Opções disponíveis:

- **📄 PDF**: Relatório completo com KPIs, insights e gráficos
- **📊 Excel**: Múltiplas abas (Dados, KPIs, Insights, Análises)
- **📋 CSV**: Dados brutos em formato CSV
- **🖼️ Imagens**: Screenshots dos gráficos

## 🏗️ Arquitetura do Sistema

### Estrutura de Pastas

```text
bi_piquet/
├── index.html              # HTML principal
├── package.json            # Dependências
├── vite.config.js         # Configuração Vite
└── src/
    ├── main.js            # Orquestrador principal
    ├── types/
    │   ├── enums.js       # Enumerações
    │   └── types.js       # Definições de tipos
    ├── modules/
    │   ├── FileUploadManager.js      # Upload e validação
    │   ├── ExcelParser.js            # Leitura Excel
    │   ├── ColumnTypeDetector.js     # Detecção de tipos
    │   ├── DataValidator.js          # Validação
    │   ├── AnalyticsEngine.js        # Motor de análise
    │   ├── ChartGenerator.js         # Geração de gráficos
    │   ├── InsightsGenerator.js      # Geração de insights
    │   └── ExportManager.js          # Exportação
    ├── ui/
    │   └── UIManager.js   # Gerenciador de interface
    └── styles/
        └── main.css       # Estilos
```

### Fluxo de Dados

```text
Upload → Validação → Parsing → Detecção → Validação → Análise → Insights → Dashboard
```

## 🔧 Módulos Principais

### FileUploadManager

- Valida formato e tamanho
- Lê arquivo como ArrayBuffer
- Emite eventos de progresso

### ExcelParser

- Usa SheetJS para ler Excel
- Converte para JSON
- Detecta cabeçalhos automaticamente

### ColumnTypeDetector

- Analisa amostras de dados
- Identifica tipo de cada coluna
- Calcula estatísticas (média, mediana, desvio padrão)

### DataValidator

- Valida integridade dos dados
- Detecta inconsistências
- Sugere correções

### AnalyticsEngine

- Calcula KPIs automáticos
- Realiza agrupamentos
- Gera projeções

### ChartGenerator

- Seleciona tipo de gráfico adequado
- Configura Chart.js
- Renderiza visualizações

### InsightsGenerator

- Detecta padrões e anomalias
- Identifica oportunidades
- Gera alertas estratégicos

### ExportManager

- Exporta para PDF com jsPDF
- Cria Excel multi-abas
- Gera CSV e imagens

## 📊 Exemplos de Planilhas Suportadas

### Vendas

```text
Data       | Produto  | Valor   | Funcionário | Cliente
01/01/2024 | Laptop   | 3500.00 | João Silva  | Empresa A
02/01/2024 | Mouse    | 45.00   | Maria Lima  | Cliente B
```

### Financeiro

```text
Data       | Tipo     | Categoria | Valor    | Descrição
15/01/2024 | Entrada  | Vendas    | 5000.00  | Venda produto X
20/01/2024 | Saída    | Despesas  | 1200.00  | Aluguel
```

## 🎨 Personalização

### Temas

Edite `src/styles/main.css` e modifique as variáveis CSS:

```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #10b981;
  /* ... */
}
```

### KPIs Customizados

Adicione novos KPIs em `src/modules/AnalyticsEngine.js`:

```javascript
calculateCustomKPI() {
  // Sua lógica aqui
  this.addKPI({
    id: 'custom_kpi',
    title: 'Meu KPI',
    value: calculatedValue,
    icon: '🎯',
    description: 'Descrição',
    category: 'custom',
  });
}
```

## 🧪 Testes

```bash
npm test
```

## 📝 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
npm test         # Executa testes
npm run lint     # Linter
npm run format   # Formatar código
```

## 🚀 Deploy

### Build de Produção

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`

### Deploy Sugeridos

- **Vercel**: `vercel deploy`
- **Netlify**: Conecte o repositório
- **GitHub Pages**: Configure no repositório

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes

## 👨‍💻 Autor

Desenvolvido com ❤️ para transformar dados em decisões estratégicas

## 🔮 Roadmap

- [ ] Suporte a mais formatos (CSV direto, Google Sheets)
- [ ] Inteligência Artificial avançada (ML predictions)
- [ ] Dashboard interativo com filtros
- [ ] Comparação entre períodos
- [ ] API REST para integração
- [ ] Modo dark
- [ ] Multi-idiomas
- [ ] Salvamento de configurações
- [ ] Templates de relatórios

## 📞 Suporte

Para suporte, abra uma issue no repositório ou entre em contato.

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
