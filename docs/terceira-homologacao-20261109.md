# Notare — terceira homologação técnica, 09/11/2026

Ajustes locais implementados para a última conferência humana. **183 testes aprovados, zero reprovados, zero ignorados; build aprovado.** As validações de interface foram feitas no navegador integrado, com o build servido apenas localmente. Não representam homologação visual definitiva no Safari. Nenhum commit, push, merge, PR ou deploy foi realizado.

## A. Resultado dos 14 grupos de ajustes

A numeração abaixo corresponde aos grupos 2 a 15 da solicitação; contexto, validação e relatório são tratados nas demais seções deste documento.

| Grupo | Estado | Resultado |
|---|---|---|
| 2. Evolução da frequência | Concluído | Informações e gráfico ocupam aproximadamente 36%/64% da largura útil em desktop; empilhamento até 1100 px. Título e descrição têm largura própria. O gráfico conserva oito pontos, valores, tooltip e foco. Em 320/390, datas alternam duas linhas para facilitar a leitura. Cálculos e descrição por extenso preservados. |
| 3. Splash individual | Concluído | Símbolo azul, verde e âmbar entram sucessivamente; os oito traços da palavra entram um a um. Depois aparecem slogan e os dois botões, separadamente. Composição completa em cerca de cinco segundos. Desenhos, formatos e direções preservados; não há Lottie ou nova marca. |
| 4. Onboarding | Concluído | Ordem aprovada mantida. Espaço após conteúdo: 54 px em 320/390, cerca de 77 px em 1280 e 86 px em 1440. A fotografia de Camila é o último elemento revelado na etapa 4; conclusão vem depois. Avançar, voltar e sair continuam imediatos e cancelam a execução pendente. |
| 5. Controle geral do painel | Concluído | Mensagem e controle geral removidos do HTML e do controlador. Quatro indicadores mantêm expansão individual; cards detalhados de prioridades, agenda, frequência e situação permanecem completos. |
| 6. Mensagens redundantes | Concluído | Removidas as mensagens de inserção de sugestão e explicação de regras locais nos formulários. Preenchimento do campo é o feedback. Erros reais e alerta de texto manual incompatível com mudança de contexto continuam disponíveis. |
| 7. Sugestões | Concluído | Desmarcar limpa somente o campo em edição em Novo registro, comunicado, finalização e recusa. Marcar preenche campo vazio, preservando texto manual já existente. Finalização usa o retorno mais recente, não anulado, vinculado ao mesmo plano e estudante. Sem retorno, explicita a falta do resultado e não inventa melhora. Sem IA externa. |
| 8. Links | Concluído | Ações de navegação no conteúdo usam azul distinto, sublinhado, hover e foco visível. Botões de expansão e títulos não receberam tratamento indiscriminado de link. Contraste calculado de 6,87:1 sobre a superfície principal. |
| 9. Superfícies e ícones | Concluído | Variações sutis de branco em cards, agenda, indicadores e blocos; bordas/sombras discretas. Ícones existentes nos indicadores e título do gráfico. Manrope, DM Sans e paleta estrutural preservadas. |
| 10. Toasts | Concluído | Avisos comuns e reversíveis compartilham o mesmo verde claro, borda, texto, ícone, espaçamento e posição superior. Rótulos distinguem sucesso, informação, atenção e erro. Fechar não desfaz. Prazo de cinco segundos de tempo ativo; foco, ponteiro e aba oculta pausam o prazo. Contrastes calculados: texto 9,54:1, rótulo 7,06:1, texto auxiliar 6,09:1. |
| 11. Desfazer revisão | Concluído | Aprovação e recusa oferecem reversão real. Restaura status e justificativa anteriores, atualiza listas e persiste. A decisão original fica no histórico e a reversão acrescenta um evento compensatório. Bloqueia reversão tardia, repetida, por outro perfil, após mudança da oferta, encerramento ou emissão posterior de voucher. Falha de gravação restaura o estado íntegro. |
| 12. Propostas para revisão | Implementação concluída; diagnóstico do Safari parcial | Base distribuída passa de 9 para 12 ofertas: seis aprovadas e seis pendentes, em nove parceiros. Três exemplos novos entram por atualização aditiva e idempotente. Decisões anteriores não são reabertas. A diferença específica vista no Safari não foi atribuída sem acesso ao seu armazenamento; investigação detalhada abaixo. |
| 13. Encerrar parceria | Concluído | X discreto em desktop, visível com foco e em telas estreitas/toque. Modal identifica parceiro, exige justificativa e permite Cancelar/Escape. Tab/Shift+Tab circulam dentro do modal. Encerramento retira dos ativos, persiste motivo/autoria/data e bloqueia novas ofertas/reservas, preservando o histórico. |
| 14. Preservações | Concluído nos cenários conferidos | Identificadores internos, códigos visíveis, contexto individual, duas famílias, calendário independente, cards detalhados, logos, contratação e regras de benefícios preservados. Os 29 arquivos de assets, core.js, data.js e community-media.js são idênticos ao início desta execução. |
| 15. Limites e segurança | Cumprido | Mesma branch e HEAD; main intacta. Trabalho anterior preservado. Sem serviços externos, novas dependências, gastos ou publicação. |

### Por que havia duas propostas em vez de três?

O relatório anterior e a base inicial continham três propostas pendentes. A tela de revisão não tem filtro adicional e é reservada à direção. Aprovar ou recusar uma proposta modifica seu status persistido, retirando-a da revisão. O cenário três → duas foi reproduzido em execução isolada; isso é compatível com uma revisão anterior no navegador, mas não prova qual ação ocorreu no Safari do usuário. Não foi inspecionado nem resetado seu armazenamento.

A revisão local `reviewExamplesRevision: 1` acrescenta três propostas com IDs fixos, uma única vez, para AlimentaBem, CulturaViva e Transporte Solidário. Não sobrescreve ofertas existentes, não reinicia decisões e não restaura itens posteriormente retirados. Não insere exemplos para parceiro já encerrado. Portanto, uma instalação com duas pendências anteriores normalmente passa a cinco; uma base nova tem seis. Encerrar um parceiro também retira suas propostas da revisão disponível, mantendo os dados históricos.

Uma parceria ativa pode apresentar **outra proposta pendente**. A parceria continua ativa por sua oferta já aprovada; a proposta nova permanece em revisão e não entra no Clube antes de aprovada. Os três parceiros originalmente apenas pendentes não aparecem como ativos antes da aprovação. Não há duplicação de cadastro ou disponibilização de uma mesma oferta pendente como aprovada.

### Integridade do Desfazer e do encerramento

Desfazer restaura somente a oferta envolvida, conservando mudanças independentes. A gravação é verificada antes de apresentar sucesso. Mudança em outra aba ou estado incompatível impede a reversão, com mensagem. Não apaga decisões nem justificativas do histórico. O prazo fica pausado durante interação para permitir leitura e uso por teclado.

Encerrar é uma alteração de status, não exclusão. Ofertas e vouchers anteriores permanecem vinculados. Vouchers já emitidos conservam os fluxos existentes de cancelamento/conversão; novas reservas e reativação de ofertas ficam bloqueadas. Não há cancelamento automático de compromissos já assumidos nem botão Desfazer fictício para o encerramento. Sua reversão não foi solicitada.

## B. Testes e build

- Base executada antes das alterações: **147/147**.
- Suíte final completa: `npm run check` — **183 aprovados, 0 reprovados, 0 ignorados**.
- **36 casos novos** em `tests/third-review.test.mjs`. Os 147 casos anteriores foram mantidos, com expectativas atualizadas quando o pedido mudou dados, mensagens ou controles.
- Cobertura nova: aprovação/recusa/desfazer, histórico compensatório, persistência, replay, prazo/permissão, voucher posterior, mudanças independentes, falhas de gravação, exemplos idempotentes, encerramento/cancelamento/Escape, campos obrigatórios, preservação de vouchers, limpeza dos quatro tipos de campo, resultado vinculado ao plano, fotografia por último, cancelamento de animação, quatro etapas com movimento reduzido, gráfico mobile e circulação de foco.
- `npm run build` aprovado. Os dez arquivos principais de dist/ são idênticos aos fontes finais. Documentação e testes ficam fora do site estático.
- HTML: 212 IDs, sem duplicados, sem referência ARIA ausente e sem caminho local referenciado inexistente. `git diff --check` sem erros.
- Preservação: 29 assets sem alteração; SVG da abertura idêntico em geometria ao início; CSS anterior preservado, com ajustes acrescentados.

Logs: [testes finais](evidencias-terceira-homologacao-20261109/testes-finais-183.txt), [base inicial](evidencias-terceira-homologacao-20261109/testes-iniciais-147.txt), [build](evidencias-terceira-homologacao-20261109/build-final.txt), [preservação](evidencias-terceira-homologacao-20261109/preservacao.json), [estrutura](evidencias-terceira-homologacao-20261109/estrutura-html.json).

## C. Navegador e evidências

Build servido em 127.0.0.1:8774 e localhost:8774, com armazenamento de teste isolado dos acessos habituais. Não houve publicação. As alterações de teste feitas nesses dois endereços não representam mudança da base inicial distribuída nem do armazenamento usado pelo usuário no Safari.

| Jornada | Resultado observado nesta execução |
|---|---|
| Responsividade | Painel e revisão em 320, 390, 1280 e 1440 px sem transbordamento horizontal. Gráfico empilhado no mobile, proporcional no desktop. Oito pontos mantidos e tooltip acessível pelo foco. |
| Indicadores | Expansão e recolhimento individuais, inclusive Enter; demais indicadores independentes e quatro cards detalhados visíveis. Controle geral ausente. |
| Calendário | 10/11 mostrou dois compromissos no próprio calendário; conteúdo de Minha agenda permaneceu idêntico. |
| Splash | Estados e atrasos calculados conferidos no navegador: símbolo em sequência, oito traços separados, slogan e botões posteriores. Capturas inicial e final. |
| Onboarding | Quatro etapas executadas normalmente; navegação imediata durante animação; conclusão observada ao final. Etapas 1 e 4 conferidas nas quatro larguras; etapas 2 e 3 em desktop. Camila ausente ao iniciar a etapa 4 e presente ao término; ordem exata também coberta em teste do controlador. |
| Sugestões | Texto manual apagado ao desmarcar em registro, comunicado, finalização e recusa; preenchimento retomado ao marcar; texto editável e sem mensagens redundantes de inserção. Finalização prudente sem resultado inventado. |
| Revisão de ofertas | Aprovação e recusa → cinco pendências; Desfazer → seis; seis preservadas após recarga. Oferta recusada exige motivo; vazio mantém modal aberto. |
| Encerramento | Enter abre; Escape cancela e restaura foco; confirmar retira parceiro, fecha modal e persiste após recarga. Perfil encerrado conserva ofertas e exibe motivo; benefício não disponível para novo resgate familiar. |
| Teclado | Indicadores por Enter, pontos do gráfico focáveis, abertura dos modais pelo teclado, Tab/Shift+Tab dentro, Escape e retorno ao acionador conferidos. |
| Toasts | Verde comum aos dois tipos, topo abaixo do cabeçalho, Desfazer e fechar funcionais. Fechar preserva aprovação após recarga. Toast de criação em 320 e recusa/modal em 390 sem transbordamento. |
| Regressões dirigidas | Cadastros abriu estudante por URL dinâmica com foto/nome/turma/código; registro criado e desfeito permaneceu anulado e rastreável após recarga. Família e parceiro mantiveram seus acessos; não foram criados responsáveis. |
| Console | Nenhum aviso ou erro capturado nos dois endereços durante os cenários realizados. |

**Limites da validação:** não foi concluída homologação visual no Safari, nem sessão com leitor de tela. Movimento reduzido foi validado nos quatro fluxos do controlador e nas regras de estilo; não foi executada nova conferência visual com a preferência do sistema ativada. Nenhuma preferência do sistema foi alterada nesta rodada. As verificações de teclado e largura são as jornadas acima, não uma nova auditoria universal de acessibilidade.

Capturas principais:

- [Gráfico desktop](evidencias-terceira-homologacao-20261109/grafico-desktop-1440.jpg), [320](evidencias-terceira-homologacao-20261109/grafico-320.jpg), [390](evidencias-terceira-homologacao-20261109/grafico-390.jpg).
- [Onboarding 1](evidencias-terceira-homologacao-20261109/onboarding-etapa1-1440.jpg), [2](evidencias-terceira-homologacao-20261109/onboarding-etapa2-1440.jpg), [3](evidencias-terceira-homologacao-20261109/onboarding-etapa3-1440.jpg), [4](evidencias-terceira-homologacao-20261109/onboarding-etapa4-1440.jpg), [etapa 4 em 320](evidencias-terceira-homologacao-20261109/onboarding-etapa4-320.jpg).
- [Aprovação com Desfazer](evidencias-terceira-homologacao-20261109/aprovacao-desfazer-1440.jpg), [recusa revisável](evidencias-terceira-homologacao-20261109/recusa-modal-1440.jpg), [revisão desfeita](evidencias-terceira-homologacao-20261109/revisao-desfeita-1440.jpg), [toast em 320](evidencias-terceira-homologacao-20261109/desfazer-320.jpg).
- [Encerramento](evidencias-terceira-homologacao-20261109/encerramento-modal-1440.jpg), [mobile](evidencias-terceira-homologacao-20261109/encerramento-320.jpg), [parceiro encerrado](evidencias-terceira-homologacao-20261109/parceiro-encerrado-1440.jpg).
- [Seis propostas na base nova](evidencias-terceira-homologacao-20261109/parcerias-iniciais-1440.jpg), [sugestão de finalização](evidencias-terceira-homologacao-20261109/sugestao-finalizacao-1440.jpg), [abertura final](evidencias-terceira-homologacao-20261109/entrada-final-1440.jpg), [observações do navegador](evidencias-terceira-homologacao-20261109/navegador.json).

As capturas de aprovação, recusa, encerramento e demais jornadas mostram momentos diferentes dos testes. Contagens posteriores a decisões/encerramento podem diferir das seis pendências da base nova. Nenhum estado foi forçado para apagar decisões do usuário.

## D. Git e arquivos

- Diretório: `/Users/guicunha/wd/notare`.
- Branch inicial/final: `codex/conclusao-mvp-2026`.
- HEAD inicial/final: `c254b8f72a42c31c7a36b67e001604a30027612d`.
- main inicial/final: `e33081459c1124abbe62858b02bddb50cccf66d3`.
- Árvore já estava modificada, com trabalhos das homologações anteriores ainda sem commit. Esse trabalho foi preservado; a árvore permanece modificada ao final.
- Nenhum commit, push, merge, PR, deploy, alteração de main ou consulta/mutação remota nesta execução.
- Cópia inicial independente dos fontes, testes, diferenças e hashes preservada em `/private/tmp/notare-terceira-20261109-inicial`.

**Alterados nesta execução:** `app.js`, `business-ui.js`, `business.js`, `index.html`, `operations.js`, `styles.css`, `ui.js`; expectativas em `tests/community-logos.test.mjs`, `tests/final-ux.test.mjs`, `tests/notare.test.mjs`, `tests/p01.test.mjs`, `tests/p05.test.mjs`, `tests/p34.test.mjs`, `tests/second-review.test.mjs`; novo `tests/third-review.test.mjs`; este relatório e sua pasta de evidências. Build gerado em dist/, ignorado pelo Git.

Arquivos como core.js, community-media.js, imagens e outros testes já apareciam modificados no Git por execuções anteriores, mas não foram alterados nesta rodada. Inventários: [início](evidencias-terceira-homologacao-20261109/git-inicial.txt), [final](evidencias-terceira-homologacao-20261109/git-final.txt), [diferenças desta rodada](evidencias-terceira-homologacao-20261109/diff-terceira-resumo.txt).

## E. Prontidão e última conferência humana

Não foi identificado problema de código impeditivo nos cenários testados. O MVP é candidato ao congelamento após sua última avaliação. Isso não constitui aprovação visual definitiva, publicação ou submissão acadêmica.

Conferir no Safari: proporção e leitura do gráfico; novo escalonamento da abertura; espaço antes do rodapé e fotografia por último; conforto visual dos links, superfícies e verde dos avisos; aprovação/recusa com Desfazer; encerramento e justificativa. Se possível, repetir abertura e onboarding com movimento reduzido ativado. Verificar a contagem conforme as decisões já persistidas, sem resetar a base para obter artificialmente seis pendências.

Mantidos como limites: aplicação acadêmica local, permissões demonstrativas e armazenamento por navegador; histórico não é sincronizado. Nenhuma integração real foi criada. Após aprovação humana, concentrar o trabalho nas capturas, PPTX e pitch. Nenhum novo pacote, publicação ou material acadêmico foi iniciado automaticamente.
