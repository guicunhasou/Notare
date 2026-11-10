# Notare — sexta rodada: Desfazer encerramento de parceria

**Concluído localmente. 243 testes aprovados, zero reprovados e build aprovado.** Escopo restrito à reversão imediata do encerramento. Nenhum commit, push, merge, PR ou deploy.

## Implementação

Confirmar o encerramento continua gravando status, motivo, autoria e evento histórico. Agora oferece **Desfazer** e **Fechar** no toast verde-claro existente, com foco inicial em Desfazer. O modal fecha antes de apresentar o aviso. Fechar descarta somente o aviso.

Desfazer restaura exatamente o objeto anterior do parceiro, inclusive ausência ou valor anterior dos campos de encerramento. Não cria outro parceiro nem altera ofertas, vouchers ou decisões anteriores. A interface é atualizada imediatamente e a restauração é gravada no localStorage. Parceiros elegíveis reaparecem nos cadastrados; empresas com ofertas pendentes continuam somente na revisão, respeitando a regra visual aprovada. Operações antes disponíveis voltam a funcionar.

O evento original **end-partner** e sua justificativa permanecem. A reversão acrescenta **undo-end-partner**, relacionado ao evento original, com motivo e estado restaurado.

### Verificações de segurança

Antes de alterar qualquer dado, valida perfil autor, permissão, prazo, identificador da operação, token, estado completo do parceiro, ofertas/vouchers relacionados e último evento histórico desse parceiro. Reversão já executada, tardia ou incompatível é recusada sem escrita parcial. Mudança no armazenamento por outra aba é detectada pelo controle já existente, sem sobrescrever o estado mais recente.

Falha de gravação ao encerrar restaura o estado anterior, mantém o motivo no modal e não oferece Desfazer. Falha ao gravar a reversão conserva o encerramento e seu histórico íntegros, com mensagem de erro.

O prazo continua em **cinco segundos de tempo ativo**, pausado durante foco, ponteiro ou aba oculta. O componente visual e sua lógica de temporização não foram modificados. Fechar, expirar ou recarregar encerra a disponibilidade do aviso imediato; não foi criado um sistema de reversão de encerramentos históricos. A reversão já realizada permanece após recarga.

## Testes e build

- Base inicial executada: **215 aprovados, zero reprovados**.
- Suíte final completa, `npm run check`: **243 aprovados, 0 reprovados, 0 ignorados**.
- **28 testes novos** em tests/sixth-review.test.mjs. Mantidos os 215 casos anteriores; a expectativa antiga de ausência de Desfazer no encerramento foi atualizada para a funcionalidade agora solicitada, conservando as demais verificações daquele caso.
- Cobertura nova: aviso após confirmação, fechamento do modal antes do aviso, restauração exata e de campos legados, listagem ativa/revisão, preservação de ofertas/vouchers/comissões, retorno das operações, histórico compensatório, persistência, duplicidade, prazo, permissões, alterações incompatíveis, outra aba, falhas de gravação, fechar sem desfazer, foco e pausa do temporizador pelos três motivos.
- `npm run build` aprovado. Dez arquivos principais em dist/ idênticos aos fontes finais. `git diff --check` sem erros; HTML sem IDs duplicados ou referências ARIA ausentes.

[Testes iniciais](evidencias-sexta-rodada-20261109/testes-iniciais-215.txt) · [243 testes finais](evidencias-sexta-rodada-20261109/testes-finais-243.txt) · [Build](evidencias-sexta-rodada-20261109/build-final.txt).

## Navegador e evidências

Validação efetiva no navegador integrado, usando apenas a origem de teste **127.0.0.1:8777**:

- Encerramento pelo teclado removeu Saúde em Foco dos ativos e apresentou o toast com foco em Desfazer.
- Tab alcançou Fechar; Shift+Tab retornou a Desfazer; Enter restaurou a parceria, apresentou confirmação e devolveu foco ao conteúdo.
- Saúde em Foco reapareceu e permaneceu restaurada após recarga. Parceiro legado Papelaria Horizonte também foi encerrado e restaurado com sucesso.
- Fechar o aviso manteve Espaço Cultura encerrado após recarga.
- **Duas abas reais:** após encerrar na primeira e aprovar uma oferta na segunda, Desfazer na primeira informou que os dados haviam mudado em outra aba. Após recarregar, o encerramento e a aprovação da segunda aba permaneceram preservados.
- Toast conferido em **320, 390, 1280 e 1440 px**, sem transbordamento e abaixo do cabeçalho. Fundo calculado rgb(238,247,241), conforme o padrão existente. Foco e mensagem de pausa mantidos durante a conferência.
- Nenhum aviso ou erro de console capturado nas duas abas. Expiração exata e pausa por ponteiro/aba oculta foram verificadas por testes com relógio controlado; não são declaradas como nova sessão manual cronometrada.

Capturas: [toast em 1440](evidencias-sexta-rodada-20261109/encerramento-desfazer-1440.jpg), [1280](evidencias-sexta-rodada-20261109/encerramento-desfazer-1280.jpg), [390](evidencias-sexta-rodada-20261109/encerramento-desfazer-390.jpg), [320](evidencias-sexta-rodada-20261109/encerramento-desfazer-320.jpg), [parceria restaurada](evidencias-sexta-rodada-20261109/parceria-restaurada.jpg), [confirmação de reversão](evidencias-sexta-rodada-20261109/reversao-confirmada-1440.jpg), [bloqueio por outra aba](evidencias-sexta-rodada-20261109/desfazer-bloqueado-outra-aba.jpg), [observações](evidencias-sexta-rodada-20261109/navegador.json).

**Limitações:** não houve homologação visual no Safari nem teste com leitor de tela. Não há pendência de implementação conhecida nos cenários conferidos. A avaliação humana pode se concentrar no encerramento → Desfazer e no conforto do aviso. O MVP continua em avaliação, sem congelamento.

## Arquivos e preservação

Alterados nesta rodada: **operations.js**, **app.js**, **business-ui.js**, **index.html** (somente versões dos scripts) e **tests/third-review.test.mjs** (expectativa do aviso). Criados: **tests/sixth-review.test.mjs**, este relatório e sua pasta de evidências.

**Intactos em relação ao início:** styles.css, ui.js, business.js, core.js, data.js, community-media.js e todos os 29 assets. Preservados os dados iniciais, os dois vínculos familiares, a identidade visual, as sugestões, a aprovação/recusa com Desfazer e a separação entre empresas em revisão e cadastradas. Nenhuma dependência ou migração adicionada. As decisões feitas na origem isolada de teste não modificaram o armazenamento usado no Safari.

## Git final

- Branch inicial/final: **codex/conclusao-mvp-2026**.
- HEAD inicial/final: **c254b8f72a42c31c7a36b67e001604a30027612d**.
- main inicial/final: **e33081459c1124abbe62858b02bddb50cccf66d3**.
- Árvore já modificada antes da execução e permanece modificada; trabalho anterior preservado. Cópia inicial em /private/tmp/notare-sexta-20261109-inicial.
- **Sem commit, push, merge, PR, deploy, mudanças remotas ou exclusões de dados.** Nenhuma tarefa posterior iniciada.

[Preservação e build](evidencias-sexta-rodada-20261109/preservacao.json) · [Git inicial](evidencias-sexta-rodada-20261109/git-inicial.txt) · [Git final](evidencias-sexta-rodada-20261109/git-final.txt).
