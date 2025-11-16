# BI Analytics Pro

Sistema profissional de análise automática de planilhas com IA.

## 🚀 Deploy

Este projeto está configurado para deploy automático no GitHub Pages.

### URL do Projeto
**https://carlospiquet2023.github.io/bi_piquet/**

### Como funciona

1. Cada push para a branch `master` dispara o build automaticamente
2. GitHub Actions compila o projeto com Vite
3. Deploy automático no GitHub Pages
4. Site acessível em poucos minutos

## 🔧 Configuração Local

```bash
# Instalar dependências
npm install

# Configurar API DeepSeek (opcional)
cp .env.example .env
# Editar .env com sua API key

# Executar localmente
npm run dev

# Build para produção
npm run build
```

## 📦 Estrutura

- `src/` - Código-fonte
- `dist/` - Build de produção (gerado automaticamente)
- `.github/workflows/` - GitHub Actions para deploy automático

## 🔐 Variáveis de Ambiente

Para usar a IA avançada, configure no GitHub:

1. Vá em Settings → Secrets and variables → Actions
2. Adicione `DEEPSEEK_API_KEY` com sua chave da API

## 📄 Documentação

- [README.md](README.md) - Documentação completa
- [QUICKSTART.md](QUICKSTART.md) - Guia rápido
- [INSTRUCOES.md](INSTRUCOES.md) - Instruções de uso
- [IA_RELATORIO.md](IA_RELATORIO.md) - Documentação da IA
- [NOVAS_FUNCIONALIDADES.md](NOVAS_FUNCIONALIDADES.md) - Features avançadas

---

**Desenvolvido por:** Carlos Antonio de Oliveira Piquet  
**Email:** carlospiquet.projetos@gmail.com
