# ⚡ ATIVE SEU SITE AGORA - PASSO A PASSO

## 🎯 O código está no GitHub, mas você precisa ATIVAR o GitHub Pages!

---

## 📍 PASSO 1: Ativar GitHub Pages (OBRIGATÓRIO)

### 1.1. Acesse as configurações

**👉 CLIQUE AQUI:** https://github.com/carlospiquet2023/bi_piquet/settings/pages

### 1.2. Configure o Source

Você verá uma página com a opção **"Build and deployment"**

**IMPORTANTE:** Selecione:
- **Source:** `GitHub Actions` (NÃO selecione "Deploy from a branch")

### 1.3. Salve (se necessário)

Algumas vezes o GitHub salva automaticamente. Se aparecer um botão "Save", clique nele.

---

## 📍 PASSO 2: Aguarde o Deploy Automático

### 2.1. Veja o progresso

**👉 CLIQUE AQUI:** https://github.com/carlospiquet2023/bi_piquet/actions

Você verá algo como:
```
✓ fix: Adicionar .nojekyll para GitHub Pages funcionar corretamente
  Running...
```

### 2.2. Aguarde completar

- **Tempo estimado:** 2-5 minutos
- **Status:** Você verá um ✓ verde quando concluir
- Se houver erro (❌ vermelho), clique para ver os logs

---

## 📍 PASSO 3: Acesse Seu Site

**🌐 URL DO SEU SITE:**

**https://carlospiquet2023.github.io/bi_piquet/**

Após o deploy completar (✓ verde), acesse esta URL.

---

## ❓ TROUBLESHOOTING

### Erro 404 - Página não encontrada

**Causa:** GitHub Pages ainda não foi ativado ou o deploy ainda não completou

**Solução:**
1. Verifique se você fez o PASSO 1 (ativar GitHub Pages)
2. Aguarde o deploy completar (PASSO 2)
3. Limpe o cache do navegador (Ctrl + Shift + R)
4. Tente novamente após 5 minutos

### Build falha no GitHub Actions

**Causa:** Algum erro no código ou configuração

**Solução:**
1. Acesse: https://github.com/carlospiquet2023/bi_piquet/actions
2. Clique no workflow com erro (❌ vermelho)
3. Clique em "build" para ver os logs
4. Copie o erro e me envie

### Página em branco

**Causa:** Problema com o base path do Vite

**Solução:**
1. O arquivo `.nojekyll` já foi adicionado
2. O `vite.config.js` já tem `base: '/bi_piquet/'`
3. Aguarde o próximo deploy completar
4. Se persistir, me avise

---

## 🔐 PASSO 4 (OPCIONAL): Configurar IA

Para habilitar os relatórios com Inteligência Artificial:

### 4.1. Acesse Secrets

**👉 CLIQUE AQUI:** https://github.com/carlospiquet2023/bi_piquet/settings/secrets/actions

### 4.2. Adicione a API Key

1. Clique em **"New repository secret"**
2. **Name:** `DEEPSEEK_API_KEY`
3. **Secret:** `sk-cd9e6e512dd24211a9fa32c3c6aec7ce`
4. Clique em **"Add secret"**

### 4.3. Redesploy

1. Vá em: https://github.com/carlospiquet2023/bi_piquet/actions
2. Clique no último workflow (o mais recente)
3. Clique no botão "Re-run all jobs" (no canto superior direito)
4. Aguarde completar (2-5 minutos)

**Pronto!** Agora o botão "🤖 Gerar Relatório com IA" funcionará.

---

## ✅ VERIFICAÇÃO FINAL

Após seguir os passos acima:

- [ ] GitHub Pages ativado (Source: GitHub Actions)
- [ ] Deploy completou com sucesso (✓ verde)
- [ ] Site acessível em: https://carlospiquet2023.github.io/bi_piquet/
- [ ] Upload de planilha funciona
- [ ] Dashboard exibe corretamente
- [ ] (Opcional) API DeepSeek configurada
- [ ] (Opcional) Relatório com IA funciona

---

## 🎉 RESULTADO

Seu sistema estará **COMPLETAMENTE ONLINE** e acessível de qualquer lugar!

**Funcionalidades ativas:**
✅ Upload de Excel
✅ 14 análises avançadas
✅ Machine Learning
✅ RFM, Cohort, Churn, etc.
✅ Gráficos interativos
✅ Exportação PDF/Excel/CSV
✅ Relatório com IA (se configurou a API)

---

## 📞 AINDA COM PROBLEMAS?

**Me envie:**
1. Captura de tela da página: https://github.com/carlospiquet2023/bi_piquet/settings/pages
2. Captura de tela do GitHub Actions: https://github.com/carlospiquet2023/bi_piquet/actions
3. O erro que aparece (se houver)

**Desenvolvedor:** Carlos Antonio de Oliveira Piquet  
**Email:** carlospiquet.projetos@gmail.com

---

## 🚀 LINKS RÁPIDOS

- **🌐 Seu Site:** https://carlospiquet2023.github.io/bi_piquet/
- **⚙️ Ativar Pages:** https://github.com/carlospiquet2023/bi_piquet/settings/pages
- **🔄 Ver Deploy:** https://github.com/carlospiquet2023/bi_piquet/actions
- **🔐 Adicionar Secret:** https://github.com/carlospiquet2023/bi_piquet/settings/secrets/actions
- **📦 Repositório:** https://github.com/carlospiquet2023/bi_piquet

---

**👆 SIGA O PASSO 1 AGORA PARA ATIVAR SEU SITE!**
