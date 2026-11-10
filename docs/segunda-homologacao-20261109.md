# Notare — segunda homologação, 09/11/2026

Ajustes locais implementados e candidato pronto para a última conferência humana. **147 testes aprovados, zero reprovados; build aprovado.** A abertura aprovada, as fontes, as imagens, os IDs e os vínculos familiares foram preservados. Não houve commit, push, merge, PR ou deploy.

A nota **12/18** é a avaliação fornecida pelo usuário no Safari. Não se presumiu quais seis itens falharam. A conferência inicial combinou código, suíte de base com 134 testes e navegador antes das alterações. Os resultados abaixo são verificações técnicas, não uma nova homologação humana. A validação visual completa no Safari permanece limitada, conforme seção C.

## A. Os 18 critérios originais

| # | Critério | Estado encontrado antes das alterações | Resultado técnico final |
|---|---|---|---|
| 1 | Campos menores nas etapas 1 e 4 | Altura de cerca de 43 px confirmada; preservar. | Cumprido |
| 2 | Espaçamento entre conteúdo e navegação | Existente, porém navegação abaixo do conteúdo; inverter conforme nova referência. | Corrigido nesta execução |
| 3 | Conclusão no rodapé após animação | Implementado; preservar condicionamento e proximidade. | Cumprido; sequência refinada |
| 4 | Quatro indicadores compactos/expansíveis | Incorreto: apenas três têm expansão e textos extras continuam visíveis. | Corrigido nesta execução |
| 5 | Controle simplificado/completo | Existe, mas atua também nos detalhes e está fora da posição desejada. | Corrigido nesta execução |
| 6 | Cards detalhados preservados | Incorreto: prioridade detalhada recolhida e demais detalhes com expansão indevida. Recuperar estrutura pontual do histórico. | Corrigido nesta execução |
| 7 | Calendário expansível | Implementado com compromissos/estado vazio; preservar. | Cumprido |
| 8 | Calendário independente da agenda | Implementado; preservar e revalidar. | Cumprido |
| 9 | Sugestão opcional/editável | Funciona, mas botão e checkbox duplicam a ação; unificar conforme novo pedido. | Corrigido nesta execução |
| 10 | Estudante contextualizado | Nome/turma/código presentes; acrescentar imagem nos formulários. | Corrigido nesta execução |
| 11 | Código visível com ID estável | Implementado; preservar cálculo e IDs. | Cumprido |
| 12 | Toast no topo e Desfazer real | Implementado; toast comum sem fechar e prazos diferentes do novo pedido. | Corrigido nesta execução |
| 13 | Aprovar oferta | Implementado e coberto pela base de testes; preservar. | Cumprido |
| 14 | Recusa justificada em modal | Implementado; acrescentar sugestão opcional sem confirmar automaticamente. | Corrigido nesta execução |
| 15 | Pendentes separados de ativos | Implementado; preservar precedência visual de pendentes. | Cumprido |
| 16 | Quatro novas logos | Integradas e mapeadas; preservar arquivos. | Cumprido |
| 17 | Parceiros compactos | Implementado com apenas imagens e alternativas acessíveis; preservar. | Cumprido |
| 18 | Frequência por extenso | Implementado com variação dinâmica; preservar. | Cumprido |

Todos os itens estão implementados ou preservados nos cenários conferidos. Não há pendência de código conhecida nesses cenários. A confirmação visual humana, especialmente no Safari, não é declarada concluída.

## B. Treze ajustes adicionais

| # | Observação | Resultado individual |
|---|---|---|
| 1 | Navegação acima do conteúdo | Concluído. Cabeçalho → progresso → navegação → espaçamento → conteúdo → rodapé, nas quatro etapas. Afastamento observado: 72 px em 1440, 64 px em 1280 e 45 px em 320/390. |
| 2 | Animação item por item | Concluído. Rótulo/título/texto, container, elementos e preenchimentos entram em sequência. Nenhuma animação de bloco inteiro foi acrescentada. Conclusão somente ao terminar. Avanço, retorno e saída imediatos cancelam a execução pendente. Movimento reduzido mostra a etapa pronta. |
| 3 | Indicadores e detalhes | Concluído. Quatro indicadores começam recolhidos em uma preferência nova, com título, valor e controle. Expansão revela textos/listas/ações preservados. Prioridades, agenda, frequência e situação detalhadas ficam visíveis, sem recolhimento. Estruturas recuperadas pontualmente do histórico anterior à compactação, consultando `807085a`; sem reset. |
| 4 | Chamada simplificado/completo | Concluído. Texto e ação logo abaixo da saudação/introdução. O controle afeta somente os quatro indicadores; o modo completo oferece retorno ao simplificado. Escolhas posteriores são guardadas por perfil na chave de apresentação v3, fora dos dados escolares. |
| 5 | Textos redundantes da agenda | Concluído. Removidos “Compromissos atribuídos…” e o resumo “1 compromisso…”. Compromissos, horários, estudantes, contexto e ações continuam visíveis. |
| 6 | Sugestão em controle único | Concluído. Checkbox nativa integrada à identificação amarela “Usar sugestões automáticas”, com estrelinhas e marcação inicial. Removido o botão duplicado nos três formulários. Texto permanece editável e nunca substitui silenciosamente conteúdo manual. |
| 7 | Sugestão para recusa | Concluído. Mesmo controle no modal. Regra local sugere solicitar esclarecimentos sobre a proposta; a justificativa pode ser editada. Desmarcar permite escrever manualmente. Recusa só ocorre ao confirmar, com motivo obrigatório. |
| 8 | Aviso demonstrativo repetido | Concluído. Removida a frase exata solicitada das seis áreas. Avisos específicos sobre consequências de vouchers, contratação e privacidade continuam nos seus fluxos, sem inventar operações reais. |
| 9 | Foto e identificação contextual | Concluído. Imagem existente ou avatar de fallback, nome, turma e código nos contextos de registro, plano, comunicado e finalização. Mantidos os IDs internos e a página individual dinâmica. |
| 10 | Navegação pelo cadastro | Concluído. Nome do estudante é botão acessível que usa a navegação existente. Retorno preserva busca, filtro, categoria e página. Nenhum HTML individual ou CRUD novo foi criado. |
| 11 | Finalizar acompanhamento | Concluído. Botão junto ao título em Acompanhamento e Famílias e retornos; formulário no modal, com contexto, resultado editável, cancelar e confirmar. Card grande próprio removido. Confirmação usa a regra existente de conclusão e preserva histórico. |
| 12 | Toasts e Desfazer | Concluído. Topo abaixo do cabeçalho, botão de fechar e prazo de cinco segundos sem interação. Foco, ponteiro e aba oculta pausam o tempo. Nas criações reversíveis, Desfazer recebe foco para permitir uso por teclado e o prazo permanece pausado enquanto esse foco estiver no aviso. Fechar mantém a criação e não abre outra notificação nem executa reversão. Não há Desfazer fictício em aprovações, recusas ou conclusões. |
| 13 | Dados para apresentação | Concluído. Atualização aditiva acrescenta quatro comunicados com leitura/resposta/pendência, dois registros de retorno, dois planos, dois compromissos vinculados, quatro ações de histórico e quatro ofertas coerentes para as novas marcas. Mantidas duas famílias, sem gerar conversões ou comissões. |

### Dados iniciais finais

- 96 estudantes e exatamente 2 vínculos familiares.
- 34 registros, 12 planos, 12 itens de agenda; a direção possui 3 compromissos antes de novas ações do usuário.
- 4 comunicados: dois respondidos, um lido sem resposta e um aguardando leitura/retorno.
- 9 parceiros; 6 na lista de aprovados e 3 somente em revisão.
- 9 ofertas: 6 aprovadas e 3 pendentes; zero vouchers/conversões iniciais e nenhuma comissão criada pelos exemplos.
- Frequência e sua variação continuam calculadas com os valores existentes; nenhum indicador foi preenchido artificialmente.

A revisão `presentationRevision: 1` insere exemplos com IDs fixos apenas uma vez e persiste pela atualização local existente. Não substitui dados com o mesmo ID, não restaura itens posteriormente retirados, não reabre plano anulado/concluído e não muda decisões de ofertas existentes. Os sete recursos antigos e as quatro novas logos permaneceram intactos. Nenhuma dependência, serviço ou integração foi adicionada.

## C. Validações executadas

### Automatizadas

- Antes das alterações: `npm run check`, **134 aprovados**.
- Ao final: `npm run check`, **147 aprovados, 0 reprovados, 0 ignorados**. Treze testes novos em `tests/second-review.test.mjs` verificam escopo do controle geral, navegação de cadastro, imagem/fallback, sugestão de recusa, conclusão/cancelamento/falha de persistência, duração/pausa/fechamento de avisos e dados aditivos.
- Expectativas anteriores de compactação dos detalhes, botão duplicado e quantidades fixas da base foram atualizadas para as orientações atuais; os testes correspondentes não foram removidos.
- `npm run build`: aprovado. Os dez arquivos de aplicação em `dist/` conferem byte a byte com a versão local final. Testes, relatórios e capturas ficam fora da saída estática.
- `git diff --check`: sem erros.
- HTML: sem IDs duplicados, referências ARIA sem destino, tags inconsistentes, labels aninhados ou caminhos locais ausentes.
- Comparação com a cópia inicial: introdução idêntica; CSS preexistente preservado como prefixo; `data.js`, `core.js`, `community-media.js` e todos os assets intactos. Os novos exemplos são acrescentados pela inicialização de negócio, sem editar a base escolar original.

### Navegador real e inspeção visual

Origem de teste separada `http://127.0.0.1:8773`, servindo o build local final. Nenhum reset de armazenamento do usuário. Testes de operações ocorreram somente nessa origem, com textos fictícios.

| Jornada | Resultado observado |
|---|---|
| Painel | Quatro indicadores recolhidos e quatro cards detalhados visíveis. Expandir/recolher individual e alternância geral funcionaram por teclado. Controle abaixo da saudação. |
| Calendário | 10/11 mostrou Thiago e Ana no próprio card. Texto da Minha agenda comparado antes/depois permaneceu idêntico. Estado vazio e navegação de datas também permanecem cobertos pela suíte. |
| Onboarding normal | Quatro etapas concluídas com campos finais corretos; título apareceu antes dos anexos, primeiro anexo antes do segundo e fotos. Na etapa 4, título antes dos campos e preenchimento progressivo. Navegação rápida até a etapa 4 levou cerca de 216 ms no roteiro, sem aguardar animações; Ir ao painel funcionou durante a execução. |
| Movimento reduzido | Todas as quatro etapas conferidas em **320, 390, 1280 e 1440 px**, com navegação acima, conteúdo completo e sem transbordamento. Campos das etapas 1/4 em torno de 43 px. Preferência do Mac ativada temporariamente e restaurada ao estado original desativado, confirmada no navegador. |
| Responsividade | Painel nas quatro larguras. Famílias, Cadastros, Acompanhamento e Parcerias em 320/390/1280, com conferências desktop de 1440 nas jornadas. Largura rolável igual à útil nos cenários medidos. Modais em 320/390; padding duplicado da finalização corrigido e ícone preservado em 18 px. |
| Sugestões | Desmarcar, limpar e trocar contexto permitiu campo manual vazio; marcar preencheu o texto correto. Conferido em registro, comunicado, conclusão e recusa. Apenas um controle amarelo por campo. |
| Estudante/cadastro | Busca por 9A11 abriu Lucas, URL manteve `estudante=lucas`, perfil mostrou turma/código. Voltar manteve a busca. Novo registro e finalização mostraram imagem e contexto correspondente. Fallback sem foto coberto automaticamente. |
| Desfazer/fechar | Registro salvo e anulado por Enter, com identificação de anulação após recarga. Outro aviso de criação foi fechado sem anular o registro e sem abrir outro toast. Em 320: aviso a 91 px, abaixo do cabeçalho de cerca de 78,5 px. Duração precisa de cinco segundos e pausas verificadas com relógio controlado na suíte. |
| Finalização | Abriu para Lucas, cancelar/Escape mantiveram o estado e devolveram foco. Texto revisado confirmado persistiu após recarga e apareceu no histórico; só a agenda vinculada foi encerrada. |
| Parcerias | Seis logos e nenhum nome/subtexto repetido na lista inicial. Recusa com sugestão não mudou status antes de confirmar; Escape devolveu foco e manteve três pendências; motivo vazio bloqueado; justificativa editada recusou Trilha. Vagalume aprovado apareceu na lista. Estados preservados após recarga. |
| Famílias/parceiro | Acessos de Marina e Paulo mantiveram apenas seus respectivos comunicados. AlimentaBem exibiu oferta aprovada, zero conversões e nenhuma informação escolar. |
| Console | Sem erros ou avisos no console capturado ao final. |

As ações de teste mudaram apenas a origem de teste: um registro anulado e outro mantido, plano de Lucas concluído, Trilha recusada e Vagalume aprovado. Isso não altera as quantidades iniciais distribuídas descritas acima. Os arquivos de evidência não devem ser confundidos com uma nova homologação do usuário.

### Limitações

- **Safari local: validação parcial.** O Notare abriu, os controles de expansão mudaram de estado e o calendário respondeu pela árvore de acessibilidade. A captura visual ficou inconclusiva, com mudança de aba/janela e limitação da automação. Não se declara a aparência/animação homologada no Safari. Somente a aba de teste criada nesta tarefa foi encerrada; as demais foram preservadas. As capturas inconclusivas não são apresentadas como prova visual final.
- Algumas esperas por seletor da automação atingiram seu prazo mesmo com o elemento já visível; os estados foram conferidos depois por observação direta. Isso não foi contabilizado como teste aprovado nem como defeito do aplicativo.
- Firefox, aparelho físico e leitor de tela não foram homologados. Falhas de armazenamento e algumas regras de integridade foram exercitadas automaticamente, sem provocar falha real no armazenamento do usuário.
- Não houve auditoria geral nova nem reexecução manual de toda funcionalidade histórica; regressão foi coberta pela suíte e pelas jornadas modificadas.

### Evidências

- [Onboarding com navegação acima](evidencias-segunda-homologacao-20261109/onboarding-etapa1-1440.jpg); etapas 2/3/4 e quatro etapas em 320/390 estão na mesma pasta.
- [Painel simplificado](evidencias-segunda-homologacao-20261109/painel-simplificado-1440.jpg), [completo](evidencias-segunda-homologacao-20261109/painel-completo-final-1440.jpg), [calendário](evidencias-segunda-homologacao-20261109/painel-calendario-1440.jpg), [mobile](evidencias-segunda-homologacao-20261109/painel-320.jpg).
- [Dados familiares](evidencias-segunda-homologacao-20261109/familias-1440.jpg), [registro de Lucas](evidencias-segunda-homologacao-20261109/registro-lucas-320.jpg), [finalização final em 320](evidencias-segunda-homologacao-20261109/finalizacao-final-320.jpg), [recusa sugerida](evidencias-segunda-homologacao-20261109/recusa-sugestao-1440.jpg), [Desfazer](evidencias-segunda-homologacao-20261109/desfazer-320.jpg).
- [147 testes](evidencias-segunda-homologacao-20261109/testes-finais-147.txt), [build](evidencias-segunda-homologacao-20261109/build-final.txt), [preservação/HTML](evidencias-segunda-homologacao-20261109/preservacao-e-estrutura.json), [observações do navegador](evidencias-segunda-homologacao-20261109/navegador.json), [auditoria inicial](evidencias-segunda-homologacao-20261109/auditoria-inicial.md).

## D. Git e arquivos

- Diretório: `/Users/guicunha/wd/notare`.
- Branch inicial/final: `codex/conclusao-mvp-2026`.
- HEAD inicial/final: `c254b8f72a42c31c7a36b67e001604a30027612d`.
- `main` inicial/final: `e33081459c1124abbe62858b02bddb50cccf66d3`.
- Árvore já estava modificada ao iniciar. Alterações desta execução somadas ao trabalho anterior, sem sobrescrever trechos não relacionados.
- Código alterado nesta execução: `app.js`, `business-ui.js`, `business.js`, `index.html`, `operations.js`, `styles.css`, `ui.js`.
- Testes atualizados: `tests/business.test.mjs`, `tests/community-logos.test.mjs`, `tests/final-ux.test.mjs`, `tests/notare.test.mjs`, `tests/p01.test.mjs`, `tests/p02.test.mjs`, `tests/p05.test.mjs`, `tests/p34.test.mjs`, `tests/runtime.mjs`. Novo: `tests/second-review.test.mjs`.
- Documentação nova: este relatório e `docs/evidencias-segunda-homologacao-20261109/`. Relatórios anteriores preservados.
- Assets, `core.js` e `community-media.js` que já apareciam no Git continuam com as mudanças anteriores, sem nova edição nesta execução. `dist/` reconstruído e ignorado pelo Git.
- **Nenhum commit, push, merge, PR, deploy, mudança de visibilidade ou acesso remoto realizado.**

## E. Próxima homologação e congelamento

Não foi identificado bloqueio funcional nas jornadas concluídas. O candidato está pronto para a última conferência humana e seleção de capturas, sem novos pacotes iniciados.

Conferir no Safari com a versão local atualizada: (1) ordem e ritmo das quatro etapas; (2) somente os quatro indicadores recolhidos, com detalhes preservados; (3) controle amarelo único e justificativa de recusa; (4) identidade/foto e retorno de Cadastros; (5) leitura e foco dos avisos, cujo prazo pausa durante interação. Avaliar também se os exemplos escolhidos são adequados às capturas do PPTX e pitch.

A única limitação relevante para encerrar a homologação é a conferência visual completa no Safari. Não se declara aprovação definitiva nem se inicia publicação, pitch, alteração de PPTX ou submissão acadêmica.
