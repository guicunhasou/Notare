# Notare — quarta rodada de ajustes, 09/11/2026

Ajustes implementados localmente. **202 testes aprovados, zero reprovados e build aprovado.** O projeto continua em avaliação, sem congelamento ou aprovação definitiva. Não houve commit, push, merge, PR, deploy ou mudança remota.

## Sete grupos de correções

Os filtros de Acompanhamento e Registros estão agrupados abaixo para organizar o retorno nos sete grupos solicitados.

| Grupo | Resultado | Arquivos principais |
|---|---|---|
| 1. Filtros de Acompanhamento e Registros | Concluído. Removido o rótulo visual Turma; selects com nome acessível próprio e opção inicial Selecione turma. Busca, select e filtros de situação têm 54 px de altura. Em 1440 ficam na mesma linha; em 1280 as situações ocupam outra linha; no mobile os controles se reorganizam. Em Registros, removido Consulta geral, select à esquerda e Limpar filtros e ver todos à direita, com centros verticais coincidentes. Link sublinhado e operação de limpeza preservados; histórico individual continua sem o container de filtros. | index.html, app.js, styles.css |
| 2. Palavra Notare na abertura | Concluído. A palavra inteira recebe uma animação no grupo SVG; os oito elementos internos não recebem animações próprias. Símbolo, palavra, slogan e botões continuam em sequência. A palavra entra de 1,95 a 3,45 segundos; último botão começa em 4,65 segundos, preservando a duração total anterior. Geometria, cores e movimento reduzido mantidos. | styles.css |
| 3. Fechar detalhes do calendário | Concluído, testado automaticamente. Botão Fechar compromissos do dia recolhe a área, limpa a seleção visual e devolve foco ao dia correspondente. Nova seleção reabre os detalhes. Não modifica compromissos nem Minha agenda. Conferência interativa no navegador ficou limitada, conforme abaixo. | index.html, app.js, styles.css |
| 4. Sugestões e Situação | Concluído. Texto pré-elaborado passa a Situação. Selecionar uma situação consulta a opção de sugestões antes de inserir texto. Desativada: campo vazio não recebe conteúdo e mudanças de situação, tipo, turma ou estudante preservam texto manual existente. Reativada: campo vazio usa a situação/contexto atuais; conteúdo manual não é sobrescrito. Desmarcar continua limpando apenas o campo em edição. Formulários compartilhados e recusa cobertos por testes. | index.html, app.js |
| 5. Comunicados e retornos | Concluído. Lista com gap estrutural de 18 px entre comunicados; conteúdo interno organizado por gap, margens redundantes retiradas e cantos arredondados preservados. Mesmo padrão na lista de comunicados do acesso familiar. Conteúdo e vínculos não foram alterados. | business-ui.js, styles.css |
| 6. Ofertas para revisão | Concluído. Ofertas separadas por gap de 18 px, respiro interno consistente e botões alinhados por flex/gap, sem somar margens individuais. Botões podem ocupar linhas próprias no mobile. Aprovação, recusa, justificativa, histórico e Desfazer mantêm o mecanismo existente. | business-ui.js, styles.css |
| 7. Empresas em revisão e cadastradas | Concluído na implementação e nos testes automatizados. Empresas com qualquer proposta pendente têm precedência na revisão e ficam fora dos cadastrados. As duas listas usam IDs explícitos para permitir comparação dos conjuntos. Aprovação, recusa, Desfazer, estados mistos e encerramento são reavaliados a cada renderização e recarga. Nenhum dado foi excluído ou estado falsificado. Conferência manual das transições nesta rodada ficou pendente pela limitação do navegador. | business-ui.js, testes |

## Diagnóstico e regra de parceiros

A terceira rodada acrescentou propostas pendentes de AlimentaBem, CulturaViva e Transporte Solidário, empresas que já possuíam ofertas aprovadas. A seleção anterior mostrava qualquer parceiro aprovado e qualquer oferta pendente, permitindo a mesma empresa nas duas seções. A duplicidade era reproduzível na base inicial, sem depender de filtros ou do armazenamento do Safari.

A correção é de **apresentação**, preservando integralmente os dados: calcula-se o conjunto de empresas com ofertas pendentes e excluem-se esses IDs da lista de cadastrados. A base nova continua com **nove parceiros, doze ofertas e seis pendências**; agora exibe **seis empresas na revisão e três nos cadastrados**, sem interseção. Todas as logos permanecem disponíveis na seção correspondente ao estado atual.

Quando a última pendência de uma empresa é aprovada, ela sai da revisão e entra nos cadastrados. Se ainda existir outra proposta pendente da mesma empresa, ela permanece apenas na revisão. Recusar uma proposta não cria aprovação: uma empresa somente recusada não vira ativa. Uma empresa que já possuía aprovação válida pode voltar aos cadastrados quando a última pendência for resolvida, sem apagar a decisão anterior. Desfazer recalcula ambas as listas.

Benefícios anteriormente aprovados, vouchers e históricos não são apagados nem têm seu estado modificado para cumprir essa separação visual. Não houve migração, reset ou manipulação do armazenamento do Safari.

## Testes e evidências A–E

**A. Alinhamento dos filtros.** Medição real em 1440: todos os controles de Acompanhamento com 54 px e mesma coordenada superior. Em Registros, select e link têm o mesmo centro vertical em desktop. Conferidas larguras de 320, 390, 1280 e 1440, sem transbordamento. Combinação turma 8º A + busca Ana + prioridade Alta retornou somente Ana Souza; filtro de Registros retornou sete itens de 8º A; limpar por Enter restaurou a opção todas.

Capturas: [Acompanhamento em 1440](evidencias-quarta-rodada-20261109/acompanhamento-1440.jpg), [1280](evidencias-quarta-rodada-20261109/acompanhamento-1280.jpg), [320](evidencias-quarta-rodada-20261109/acompanhamento-320.jpg), [Registros em 1280](evidencias-quarta-rodada-20261109/registros-1280.jpg), [390](evidencias-quarta-rodada-20261109/registros-390.jpg).

**B. Palavra como grupo.** Estilo calculado no navegador: grupo opening-lettering com opening-lettering-in, duração 1,5 s e atraso 1,95 s. Todos os oito filhos com animation-name: none. Os atrasos posteriores permanecem 3,5 s para transição da abertura, 3,9 s para slogan e 4,65 s para o último botão. Evidência em [navegador.json](evidencias-quarta-rodada-20261109/navegador.json), área splash-grupo, e [captura da abertura](evidencias-quarta-rodada-20261109/entrada-palavra-grupo.jpg). A captura estática não representa vídeo da animação.

**C. Sugestão desativada.** Testes executam o controlador real: trocar situação não gera texto; texto manual é preservado; mudanças de estudante, turma e tipo não preenchem/apagam; reativação considera a situação atual; comunicados, finalização e recusa respeitam a opção desativada. No navegador, foram executadas mudanças de situação, turma, estudante e tipo com campo vazio e depois manual. Campo permaneceu vazio no primeiro caso e manteve a redação no segundo. Reativação preservou a redação manual e, após limpeza, produziu texto da situação escolhida para Luana Gomes. [Captura contextual](evidencias-quarta-rodada-20261109/sugestao-contextual-320.jpg).

**D. Ausência de duplicidade.** Os testes extraem os IDs efetivamente renderizados em data-review-partner e data-active-partner e exigem interseção vazia. Verificam estado inicial, aprovação, recusa, ambos os tipos de Desfazer, encerramento, múltiplas propostas com estados diferentes e persistência após recarga. Renderizar não pode modificar o banco em memória. A conferência visual inicial também observou conjuntos distintos nas quatro larguras. [Ofertas em 1440](evidencias-quarta-rodada-20261109/ofertas-1440.jpg), [390](evidencias-quarta-rodada-20261109/ofertas-390.jpg), [320](evidencias-quarta-rodada-20261109/ofertas-320.jpg).

**E. Operações e histórico.** Aprovar transfere empresa sem outras pendências; recusar não transforma empresa sem aprovação em ativa; Desfazer restaura o estado e as listas anteriores; encerrar retira dos ativos sem apagar o parceiro. Testes executam gravação e loadDatabase, preservando os eventos de revisão e compensação. Os testes anteriores de prazo, autorização, voucher posterior, falhas de gravação e restauração íntegra continuam aprovados. Não se declara repetição manual bem-sucedida dessas operações nesta rodada: o navegador deixou de aplicar cliques antes dessa etapa.

### Resultados executados

- Antes das alterações: `npm run check`, **183 aprovados, zero reprovados**.
- Depois das alterações: `npm run check`, **202 aprovados, zero reprovados, zero ignorados**. Mantidos os 183 casos anteriores; acrescentados **19** em tests/fourth-review.test.mjs. Duas expectativas de logos foram atualizadas para a regra visual agora exigida, conservando as verificações de integridade e disponibilidade.
- `npm run build`: aprovado. Dez arquivos principais em dist/ idênticos aos fontes finais.
- HTML sem IDs duplicados, referências ARIA ausentes ou arquivos locais referenciados inexistentes. `git diff --check` sem erros.
- Os 29 assets e core.js, data.js, community-media.js, business.js, operations.js e ui.js permaneceram idênticos ao início desta rodada.
- Gap de 18 px medido entre comunicados e entre ofertas em 320, 390, 1280 e 1440; sem transbordamento nas páginas conferidas. [Comunicados desktop](evidencias-quarta-rodada-20261109/comunicados-1440.jpg), [mobile](evidencias-quarta-rodada-20261109/comunicados-320.jpg).

Logs: [202 testes](evidencias-quarta-rodada-20261109/testes-finais-202.txt), [base de 183](evidencias-quarta-rodada-20261109/testes-iniciais-183.txt), [build](evidencias-quarta-rodada-20261109/build-final.txt), [preservação e estrutura](evidencias-quarta-rodada-20261109/preservacao-e-estrutura.json), [medições do navegador](evidencias-quarta-rodada-20261109/navegador.json).

## Limitações e próxima avaliação

A validação visual foi feita no navegador integrado, não no Safari. Após acionar Cancelar em um rascunho, a sessão de teste deixou de aceitar cliques; tentativas de recuperação e novas abas não restabeleceram a interação, embora navegação e leitura continuassem disponíveis. Não foi possível confirmar a causa. Não se atribui esse bloqueio ao aplicativo sem reprodução independente.

Por isso, **fechar/reabrir calendário e repetir aprovação, recusa, Desfazer e encerramento no navegador permanecem para conferência humana** nesta versão. Esses comportamentos passaram nos testes automatizados; tentativas sem mudança de estado no navegador não foram contabilizadas como aprovação funcional. Nenhuma captura foi apresentada como evidência de uma operação que não ocorreu.

Conferir também a suavidade da palavra como unidade no Safari e o resultado visual dos espaçamentos. Movimento reduzido foi preservado no código e nos testes anteriores; não houve nova sessão visual com essa preferência ativada. Não foram usados leitor de tela nem dispositivo físico de toque.

Não há pendência de implementação conhecida nos sete grupos. Há as limitações de validação descritas. O MVP **não foi congelado** e retorna para nova inspeção do usuário, sem iniciar outro pacote.

## Git e arquivos desta rodada

- Branch inicial/final: codex/conclusao-mvp-2026.
- HEAD inicial/final: c254b8f72a42c31c7a36b67e001604a30027612d.
- main inicial/final: e33081459c1124abbe62858b02bddb50cccf66d3.
- Árvore já estava modificada e permanece modificada. Trabalho anterior preservado; cópia inicial independente em /private/tmp/notare-quarta-20261109-inicial.
- Alterados nesta rodada: **index.html, styles.css, app.js, business-ui.js, tests/community-logos.test.mjs**. Criados: **tests/fourth-review.test.mjs**, este relatório e sua pasta de evidências. dist/ foi regenerado e é ignorado pelo Git.
- Demais modificações já existentes no Git pertencem às rodadas anteriores.
- Nenhum commit, push, merge, PR, deploy, consulta remota, mudança de main, dependência nova ou exclusão de dados.

[Git inicial](evidencias-quarta-rodada-20261109/git-inicial.txt) · [Git final](evidencias-quarta-rodada-20261109/git-final.txt).
