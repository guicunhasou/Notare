# Notare — ajustes finais UX/UI e funcionais
> Atualização posterior nesta mesma data: a prancha foi recebida e as quatro logos foram integradas. O item 8 e a pendência de imagens foram concluídos. O resultado atual é de 134 testes aprovados e base com 6 parceiros aprovados e 3 somente em revisão, sem novas ofertas. Consulte [o complemento das logos](logos-parceiros-20261109.md). As descrições e evidências abaixo registram a execução anterior ao recebimento dos arquivos.

Execução local em 09/11/2026. Candidato à última conferência humana. Nenhum commit, push, merge, PR ou deploy nesta execução.

## A. Resultado por área

| Item | Situação | Resultado |
|---|---|---|
| 1. Onboarding | Concluído | Campos ilustrativos das etapas 1 e 4 acompanham o conteúdo, com cerca de 43 px nos cenários conferidos. Controles ficam abaixo do hero, com afastamento de 36 px no mobile. Rodapé agrupa informação e conclusão. A conclusão continua condicionada ao término da animação; avançar e voltar funcionam durante a execução. |
| 2. Cards | Concluído | Prioridades recolhido exibe título, círculo com quantidade dinâmica e botão acessível. Altura observada de aproximadamente 97 px em desktop e 320 px de largura. Conteúdo completo preservado na expansão. Minha agenda, Evolução e Situação iniciam abertos. Incluído Expandir tudo/Recolher tudo. |
| 3. Calendário | Concluído | Seleção revela compromissos no próprio card, incluindo acesso ao acompanhamento, ou estado vazio. Minha agenda conserva conteúdo e estado de expansão. Navegação por setas e destaque da data preservados. |
| 4. Sugestões | Concluído | Checkbox inicialmente marcada em Novo registro, Comunicado e Resultado e continuidade. Textos locais editáveis, preenchidos quando habilitado e vazio; conteúdo manual preservado. Troca de contexto atualiza somente texto automático intacto. Botões amarelos e ícones existentes preservados. Nenhum envio automático. |
| 5. Estudantes e atualização de escopo | Concluído | Código visível por ano/turma/posição, nome e contexto claros em perfil, registro, plano e comunicado. URLs continuam usando IDs internos. Página individual dinâmica preservada. Ex.: Ana Souza 8A02; Lucas Lima 9A11. Permanecem exatamente dois vínculos familiares. |
| 6. Toasts | Concluído | Avisos no topo, abaixo da altura efetiva do cabeçalho; empilhamento impede sobreposição entre toast e Desfazer. Foco, anúncios acessíveis e regras de anulação mantidos. |
| 7. Aprovação e recusa | Concluído | Ações distintas. Recusa abre modal nativo com justificativa obrigatória de 5 a 300 caracteres. Cancelar/Escape preservam a oferta e devolvem foco. Confirmação persiste motivo; falha de armazenamento mantém estado anterior e texto no modal. Aprovação atualiza lista e rejeita repetição. |
| 8. Parceiros e quatro novas logos | Parcial | Lista compacta de parceiros com ofertas aprovadas ou pausadas; propostas pendentes ficam na revisão. Layout e mudança de status concluídos. As quatro novas logos não foram anexadas a esta solicitação; integração pendente da prancha e identificação das marcas. Recursos existentes preservados. |
| 9. Evolução da frequência | Concluído | Texto dinâmico por extenso: queda, aumento ou sem variação; singular/plural corretos. Valores e cálculo não alterados. |
| 10. Vínculos familiares | Concluído | Nenhum responsável ou vínculo adicional criado. A restrição aos códigos foi substituída pela atualização expressa do usuário. |

### Decisões e preservação

- O código visível é calculado pela ordem alfabética em português do nome na turma completa; ID interno desempata nomes iguais. Filtros, paginação e perfil restrito não mudam a posição. Não existe número de chamada persistido no modelo atual. Uma futura alteração de nomes ou turma poderá mudar essa identificação visual, sem afetar os relacionamentos.
- Os IDs e códigos legados persistidos permanecem intactos. Busca aceita o código novo e o anterior. Não houve migração de dados escolares.
- A preferência do dashboard usa `notare-dashboard-v2:<perfil>`, separada do banco escolar. Recupera a apresentação aberta de agenda e análises uma vez; preserva as escolhas legadas dos outros cards e as novas escolhas individuais.
- Parceiro é exibido como cadastrado quando possui ao menos uma oferta aprovada ou pausada, esta última já aprovada anteriormente. Uma proposta pendente não é contada como oferta aprovada. Nenhum parceiro ou oferta foi removido.
- Sugestões continuam baseadas nas regras locais existentes. Não foi adicionada integração com IA, backend ou serviço externo.
- A introdução em HTML permaneceu idêntica à cópia inicial. Todo o CSS preexistente foi preservado como prefixo; ajustes desta tarefa foram acrescentados ao fim. As alterações locais anteriores de animação e slogan foram preservadas.
- `data.js`, `business.js`, `ui.js` e `community-media.js` permanecem idênticos à cópia inicial. Regras comerciais, tempos/pausa de Desfazer e imagens anteriores não foram alterados.

## B. Validações executadas

### Automatizadas

- `npm run check`: **128 aprovados, 0 reprovados, 0 ignorados**. Inclui sintaxe, os 111 testes existentes e 17 novos testes direcionados. Expectativas antigas substituídas pelo novo comportamento solicitado foram atualizadas, sobretudo calendário independente e apresentação inicial dos cards.
- `npm run build`: aprovado. `dist/` foi reconstruído e seus dez arquivos de código conferem byte a byte com a versão local final. Documentação, testes e capturas não entram no site gerado.
- `git diff --check`: sem erros.
- Verificação estrutural do HTML: sem tags inconsistentes, IDs duplicados, referências ARIA sem destino ou caminhos locais ausentes.
- Comparação com cópia inicial: introdução, CSS preexistente, dados escolares, regras comerciais, Desfazer e mapeamento das imagens preservados.
- Novos testes cobrem códigos sem mutação, busca legada/nova, contexto nas URLs, preferências, calendário independente, expansão coletiva, automação opcional e conteúdo manual, texto da frequência, separação dos parceiros, duplicidade de aprovação, recusa/cancelamento/Escape e reversão em falha de persistência.

Evidências: [128 testes](evidencias-ajustes-finais-20261109/testes-128.txt), [build](evidencias-ajustes-finais-20261109/build.txt) e [preservação/estrutura](evidencias-ajustes-finais-20261109/preservacao-e-estrutura.json).

### Navegador real e inspeção visual

IAB/Chromium no Mac, servindo o build final por `127.0.0.1:8770`, origem de teste separada. As verificações abaixo foram efetivamente executadas; não constituem homologação humana nem auditoria geral.

| Jornada | Evidência observada |
|---|---|
| Dashboard e responsividade | Conferidas larguras de 320, 390, 1280 e 1440 px; largura rolável não superou a largura útil. Prioridade compacta, expansão individual por Enter e alternância coletiva funcionaram. Agenda e análises abertas novamente ao final. |
| Calendário | Dia 10/11/2026 mostrou Revisar plano interrompido, 13:30, Thiago Barros. Seta para 11/11 mostrou estado vazio e manteve foco/data selecionada. Conteúdo da Minha agenda comparado antes/depois permaneceu idêntico. |
| Sugestões | Desmarcar, limpar e trocar contexto não preencheu os campos. Marcar preencheu texto correspondente. Executado em registro, comunicado e conclusão de plano. Texto revisado em registro foi salvo e depois anulado com Desfazer. |
| Estudante e consulta | Ana 8A02 e Lucas 9A11 visíveis; acesso direto, seleção, novo registro e plano conservaram o estudante. Cadastro consultado por 8A02 e EST-014 encontrou Ana; filtro 8º A e próxima página funcionaram. Comunicado contextual de Lucas mostrou apenas os dois estudantes vinculados disponíveis. |
| Toast e Desfazer | Registro de teste salvo, aviso no topo e anulação por teclado; identificação de anulação permaneceu no histórico após recarga. Em 320 px: topo do aviso 91 px, abaixo do cabeçalho de aproximadamente 78,5 px, sem transbordamento. |
| Revisão de ofertas | Trilha: cancelar e Escape sem alteração; motivo vazio não confirmou; justificativa válida recusou. Vagalume e Pontes aprovadas. Recarga preservou os estados e mostrou somente as parcerias aprovadas. |
| Modal acessível | Foco inicial na justificativa, Tab alcança Cancelar; Escape/Cancelar devolvem foco ao acionador. Após confirmação, foco segue ao título da revisão. Conferido também em 390 px. |
| Onboarding | Quatro etapas e navegação imediata durante animação conferidas. Conclusão ausente durante animação e presente ao terminar. Todas as quatro etapas conferidas em 320 e 390 px com movimento reduzido real; campos das etapas 1/4 com cerca de 43 px, sem transbordamento. |
| Movimento reduzido | Preferência do Mac temporariamente ativada, confirmada por `prefers-reduced-motion` no navegador; versão sem espera conferida. Preferência original desativada restaurada e confirmada ao final. |
| Console | Nenhum erro ou aviso no console capturado ao fim das jornadas. |

Dados de teste ficaram somente nessa origem local do navegador: duas aprovações e uma recusa levaram a 4 parceiros com oferta aprovada e zero ofertas pendentes nessa sessão. A base inicial do projeto continua com 5 parceiros, 2 ofertas aprovadas e 3 pendentes. Não houve reset do armazenamento do usuário nem alteração da base distribuída.

Capturas representativas:

- [Dashboard em 320 px](evidencias-ajustes-finais-20261109/dashboard-final-320.jpg) e [calendário com compromisso](evidencias-ajustes-finais-20261109/dashboard-calendario-final-1440.jpg).
- [Sugestões e checkboxes](evidencias-ajustes-finais-20261109/sugestoes-checkbox.jpg), [plano de Lucas](evidencias-ajustes-finais-20261109/plano-lucas-390.jpg), [Desfazer no topo em 320 px](evidencias-ajustes-finais-20261109/desfazer-320.jpg).
- [Ofertas inicialmente separadas](evidencias-ajustes-finais-20261109/parcerias-separadas.jpg), [recusa justificada](evidencias-ajustes-finais-20261109/recusa-modal.jpg), [modal mobile](evidencias-ajustes-finais-20261109/modal-390.jpg).
- Parceiros após operações: [320](evidencias-ajustes-finais-20261109/parcerias-finais-320.jpg), [390](evidencias-ajustes-finais-20261109/parcerias-finais-390.jpg), [1280](evidencias-ajustes-finais-20261109/parcerias-finais-1280.jpg), [1440](evidencias-ajustes-finais-20261109/parcerias-finais-1440.jpg).
- As quatro etapas em movimento reduzido estão na mesma pasta, arquivos `onboarding-320-etapa1.jpg` a `onboarding-390-etapa4.jpg`.
- [Observações do navegador](evidencias-ajustes-finais-20261109/verificacoes-navegador.json). São observações instrumentadas das jornadas, não uma contagem independente de testes aprovados.

### Limitações de cobertura

Não executados Safari, Firefox, aparelho físico, leitor de tela ou homologação humana geral. Ao encerrar o servidor, seu log mostrou requisições a `offline-worker.js?version=entry-962b9ae59157f43be979c9fe2df677cb.js` com HTTP 404. Esse recurso não é referenciado no HTML, CSS ou JavaScript do projeto; a origem dessa requisição auxiliar não foi confirmada. Não foi criado um arquivo artificial para atendê-la. Os recursos do Notare conferidos carregaram e as jornadas acima funcionaram; o console capturado permaneceu sem erros/avisos. Não foram repetidos todos os fluxos antigos no navegador: a suíte existente foi utilizada para regressão dirigida. Falha de armazenamento na recusa e bloqueio de aprovação duplicada foram exercitados automaticamente; persistência, cancelamento e motivo obrigatório também foram verificados no navegador.

## C. Pendências e riscos

1. **Quatro novas logos: pendente de arquivos.** Não há prancha nova nesta solicitação. Nenhuma imagem foi inventada ou atribuída a outra empresa. A integração poderá ser concluída após o envio e identificação das marcas.
2. A mudança visual dos códigos é segura no modelo atual; sua posição é alfabética, não um número de chamada oficial. Isso deve ser considerado se os dados forem editados futuramente.
3. Aplicação continua acadêmica, local e sem autenticação real. Nenhum trabalho de publicação, alteração de proteção ou serviço remoto fez parte desta execução.
4. Avaliação visual final pertence ao usuário. Os ajustes estão prontos para essa conferência; não são declarados homologados por ela.

## D. Estado do Git e arquivos

- Diretório: `/Users/guicunha/wd/notare`.
- Branch inicial e final: `codex/conclusao-mvp-2026`.
- HEAD inicial e final: `c254b8f72a42c31c7a36b67e001604a30027612d`.
- `main` local inicial e final: `e33081459c1124abbe62858b02bddb50cccf66d3`.
- Estado inicial: `index.html` e `styles.css` já modificados. Preservados integralmente nos trechos preexistentes descritos acima.
- Estado final: mudanças locais em `app.js`, `business-ui.js`, `core.js`, `index.html`, `styles.css`, `tests/notare.test.mjs`, `tests/p34.test.mjs`; novos `tests/final-ux.test.mjs`, este relatório e `docs/evidencias-ajustes-finais-20261109/`.
- `dist/` é gerado e ignorado pelo Git.
- **Nenhum commit, push, merge, PR ou deploy realizado. `main` não foi alterada.**

## E. Encerramento

Não foi identificado bloqueio funcional nos fluxos testados. O MVP pode ser congelado como candidato à última conferência humana, mantendo a pendência visual das quatro logos explicitamente aberta. Não foram iniciados novos pacotes, publicação, pitch ou submissão acadêmica.
