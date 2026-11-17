# Notare — escopo atual das preferências

Conferência de 17/11/2026 — F11, somente documentação. A Work 1.03 não modifica persistência, valores padrão ou escopo de nenhuma preferência.

| Controle | Onde é mantido | Troca de perfil | Recarregar |
| --- | --- | --- | --- |
| Expansão dos detalhes do painel | `notare-dashboard-v3:<profileId>` no localStorage da mesma origem | Cada perfil recupera sua própria escolha | Recupera a escolha salva; sem armazenamento, vale apenas o fallback em memória da sessão |
| Sugestões de comunicado e de Resultado e continuidade | Objeto `automaticPreferences` em memória, com escolhas distintas para `body` e `conclusion` | Compartilhadas entre perfis na mesma página/sessão | Reiniciam habilitadas; não há chave por perfil |
| Sugestões de Novo registro | Estado da checkbox `#record-auto-suggestion` no formulário | Não há preferência salva por perfil; a troca de perfil reseta o formulário ao padrão habilitado | Reinicia no padrão do HTML; salvar um registro também reseta o formulário |
| Sugestões de recusa e encerramento de parceria | Checkboxes nos respectivos diálogos | Sem chave de armazenamento por perfil | Reiniciam no padrão do HTML |

As preferências do painel representam expansão de quatro seções (`priority`, `followup`, `actions`, `attendance`). Não incluem filtros, data selecionada do calendário ou a escolha de sugestões. O perfil demonstrativo selecionado e a lateral também têm suas próprias chaves, independentes do painel.

O fallback de preferências em memória não grava uma base escolar inacessível nem sincroniza escolhas entre abas ou dispositivos. Ao recarregar a página, esse fallback é perdido. Armazenamento incompatível ou bloqueado continua impedindo gravações destrutivas da base.

Sugestões usam regras e textos locais. O usuário deve revisar o texto. Textos editados manualmente permanecem sob as proteções existentes de rascunho e confirmação de navegação; a presença de uma sugestão não representa autosave remoto ou comunicação externa.

**Decisão de produto pendente:** tornar as escolhas de sugestões individuais e persistentes por perfil. Isso exige aprovação própria e não foi implementado nesta rodada. A diferença atual é um contrato documentado, não uma promessa de preferência pessoal persistente.

Fontes: `app.js` (`readDashboardPreferences`, `ensureDashboardPreferences`, `switchProfile`, formulário de registro) e `business-ui.js` (`automaticPreferences` e controles dos diálogos).
