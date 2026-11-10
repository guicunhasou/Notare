# Notare — quinta rodada de ajustes pontuais

Implementação local concluída em 09/11/2026. **215 testes aprovados, zero reprovados; build aprovado.** MVP mantido em avaliação humana, sem congelamento ou publicação.

## A. Três ajustes

| Solicitação | Resultado |
|---|---|
| Calendário pela própria data | Concluído. Primeiro clique abre, segundo recolhe e terceiro reabre. Outra data atualiza diretamente. Botão de fechar preservado, com retorno de foco. Enter/Espaço usam o clique normal; setas continuam selecionando datas sem alternância involuntária. Não altera compromissos nem Minha agenda. |
| Espaçamento da recusa | Concluído. Cabeçalho com gap entre título e descrição; padding superior do formulário; distância entre sugestões, justificativa e ações; campo/ajuda agrupados; botões separados por gap. Nenhuma mudança na exigência de motivo, cancelamento, confirmação, histórico ou Desfazer. |
| Sugestões no encerramento | Concluído. Controle amarelo único, estrelas e checkbox inicialmente marcada. Texto local contextual com nome do parceiro, editável. Desmarcar limpa o campo; desativada não gera texto ao reabrir/trocar parceiro; reativar preenche campo vazio e preserva texto manual. Apenas confirmar encerra a parceria. |

A justificativa proposta é genérica e prudente: encerramento para reavaliar a continuidade dos benefícios, com preservação do histórico. Não afirma falhas da empresa, não usa contexto estudantil e não envia dados a IA externa. A geração não grava nem encerra a parceria.

**Arquivos alterados nesta rodada:** app.js, business-ui.js, business.js, index.html, styles.css. Criados: tests/fifth-review.test.mjs, este relatório e sua pasta de evidências. As modificações anteriores foram preservadas.

## B. Validação executada

- Base inicial: **202/202** testes aprovados.
- Suíte completa final: **215 aprovados, 0 reprovados, 0 ignorados**, com `npm run check`.
- **13 testes novos**, mantendo todos os anteriores: alternância/reabertura/troca de data, botão de fechar, foco/setas, independência da agenda, sugestão inicial, limpeza/desativação, troca de contexto, texto manual, confirmação obrigatória, Cancelar/Escape, permissões, persistência, falha de gravação e preservação de ofertas/vouchers.
- `npm run build` aprovado; dez arquivos principais de dist/ idênticos aos fontes finais. `git diff --check` sem erros; HTML sem IDs duplicados ou alvos ARIA ausentes.

**Navegador integrado real:** calendário abriu/fechou/reabriu por clique e Enter; outra data exibiu seus compromissos; botão de fechar e setas funcionaram; conteúdo de Minha agenda permaneceu idêntico. Recusa exigiu justificativa e permitiu Desfazer, com oferta novamente pendente após recarga. Encerramento preencheu sugestão inicial, preservou texto manual ao reativar, ficou vazio em outro contexto quando desativado e gerou o nome atual ao reativar. Cancelar e Escape preservaram a parceria e devolveram o foco. Confirmação com texto editado persistiu após recarga; o perfil do parceiro exibiu a justificativa salva. Tab permaneceu dentro dos modais. Nenhum aviso ou erro no console capturado.

### Responsividade dos modais

| Largura | Altura da janela | Recusa: altura do modal | Encerramento: altura do modal | Resultado |
|---|---|---|---|---|
| 1440 px | 1000 px | 508 px | 582 px | Sem transbordamento ou rolagem do modal |
| 1280 px | 1000 px | 508 px | 582 px | Sem transbordamento ou rolagem do modal |
| 390 px | 844 px | 565 px | 658 px | Sem transbordamento ou rolagem do modal |
| 320 px | 844 px | 613 px | 737 px | Sem transbordamento ou rolagem do modal |

Na recusa, espaçamento título/descrição de aproximadamente 12 px; cabeçalho/controle de 22,5 px em desktop e 18 px no mobile; grupos do formulário separados por 25,2 px e 19,8 px, respectivamente; botões separados por 18 px. O textarea continua redimensionável e pode ter sua própria rolagem para textos longos. Janelas menores que as testadas podem exigir rolagem acessível do modal.

A sessão integrada funcionou nesta rodada, inclusive nas interações antes limitadas. **Não foi feita homologação visual no Safari**, leitor de tela ou dispositivo físico de toque. Movimento reduzido não foi alterado; abertura e animações anteriores ficaram intactas.

Evidências: [calendário](evidencias-quinta-rodada-20261109/calendario-1440.jpg), [recusa desktop](evidencias-quinta-rodada-20261109/recusa-1440.jpg), [recusa 320](evidencias-quinta-rodada-20261109/recusa-320.jpg), [encerramento desktop](evidencias-quinta-rodada-20261109/encerramento-1440.jpg), [encerramento 320](evidencias-quinta-rodada-20261109/encerramento-320.jpg), [justificativa persistida](evidencias-quinta-rodada-20261109/encerramento-persistido-1440.jpg), [medições e console](evidencias-quinta-rodada-20261109/navegador.json), [215 testes](evidencias-quinta-rodada-20261109/testes-finais-215.txt), [build](evidencias-quinta-rodada-20261109/build-final.txt).

## C. Preservação e Git

- Diretório: /Users/guicunha/wd/notare.
- Branch inicial/final: **codex/conclusao-mvp-2026**.
- HEAD inicial/final: **c254b8f72a42c31c7a36b67e001604a30027612d**.
- main inicial/final: **e33081459c1124abbe62858b02bddb50cccf66d3**.
- Árvore já modificada no início e permanece modificada. Cópia inicial preservada em /private/tmp/notare-quinta-20261109-inicial.
- **Nenhum commit, push, merge, PR, deploy, alteração remota, instalação ou exclusão de dados.**

Os 29 assets, core.js, data.js, community-media.js, operations.js e ui.js são idênticos ao início. business.js recebeu somente a nova função de sugestão e sua exportação, sem mudança de dados iniciais, persistência ou regras comerciais. SVG da abertura e todo CSS anterior preservados; regras novas limitadas aos modais. Dois vínculos familiares mantidos; testes anteriores de separação de parceiros, Desfazer e histórico continuam aprovados.

As decisões de teste foram feitas em armazenamento isolado de 127.0.0.1:8776. Não foi manipulado o armazenamento do Safari ou resetada a base do usuário. [Preservação](evidencias-quinta-rodada-20261109/preservacao.json) · [Git inicial](evidencias-quinta-rodada-20261109/git-inicial.txt) · [Git final](evidencias-quinta-rodada-20261109/git-final.txt).

## D. Próxima conferência humana

Conferir no Safari somente os três pontos desta rodada: conforto da alternância pela data, espaçamento/leitura da recusa e redação/controle das sugestões de encerramento. Não há pendência de implementação conhecida nos cenários testados. O MVP segue em avaliação; nenhum pacote posterior foi iniciado.
