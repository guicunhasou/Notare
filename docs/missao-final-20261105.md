# Notare — missão final de desenvolvimento / Pacote 05

Data: 05/11/2026. **Candidato local à versão final, sujeito à avaliação humana. Não representa homologação definitiva. Nenhum deploy, PR, atualização da main, pitch ou submissão acadêmica.**

## Resumo executivo

As sete imagens fornecidas foram integradas. P05.1 a P05.7 foram concluídos: duas assistências locais revisáveis, contratação em quatro etapas e cálculo acadêmico por segmento, preservando propostas antigas e as regras do Clube. A estabilização passou em **111 testes automatizados**, build estático, validação dirigida no navegador e revisão de arquivos para exposição pública.

A branch candidata é `codex/conclusao-mvp-2026`; o destino autorizado de push é exclusivamente `https://github.com/guicunhasou/Notare.git`. A Vercel está **preparada, não publicada**. O resultado efetivo do push e o HEAD final são conferidos e informados na resposta de entrega, após o commit deste relatório.

## Estado inicial e marco Git

| Campo | Inicial conferido | Candidato |
| --- | --- | --- |
| Branch | codex/conclusao-mvp-2026 | Mesma branch |
| HEAD | 5657e9dc97a63d04b33d032bcbca084ee88ecff1 | Implementação e testes em e4df457; documentação de estabilização em commit posterior |
| main local | e33081459c1124abbe62858b02bddb50cccf66d3 | Preservada |
| Árvore | Limpa | Consolidada em commits; limpeza conferida na entrega |
| Remoto | origin: https://github.com/guicunhasou/Notare.git | Destino preservado |

Commits desta missão:

1. `e4df457` — Integra imagens e conclui assistências e contratação do Pacote 05.
2. Commit deste relatório — Estabiliza candidato final e documenta publicação futura.

Marco: candidato final do MVP em 05/11/2026. Qualquer nova funcionalidade fica fora desta estabilização. Eventual tag de identificação é estritamente local, sem release pública ou tag remota.

## Integração das imagens — concluída

- Marina Souza e Paulo Lima: retratos circulares preservando a imagem fornecida.
- Papelaria Horizonte, Espaço Cultura, Oficina Vagalume de Papel, Estúdio Trilha do Movimento e Casa Pontes da Leitura: logos completos, sem redesenho ou deformação.
- Sete PNGs em `assets/community`, total de 817.028 bytes; textos alternativos preservados em `community-media.js`.
- Menus, seletor de perfis, perfis ativos, páginas familiares, parceiros, Clube e Revisar parcerias conferidos. A marca oficial Notare permaneceu intacta.
- [Inventário e procedência](assets-comunidade-pendentes.md). Não há mais pendência de fornecimento de imagens.

## Resultado de P05.1 a P05.7

| Item | Estado | Implementação |
| --- | --- | --- |
| P05.1 | Concluído | Gerar sugestão no comunicado considera estudante, frequência disponível e retorno familiar existente. Texto respeitoso, sem transcrever notas internas ou inventar eventos; editável e enviado somente pelo controle existente. |
| P05.2 | Concluído | Gerar sugestão em Resultado e continuidade considera plano, estudante, responsável, prazo e quantidade de registros não anulados. Pede avaliação e não presume melhora, conclusão ou novo compromisso. |
| P05.3 | Concluído | Regras locais, sem APIs/LLMs/credenciais. Campo vazio recebe texto editável; campo preenchido mantém conteúdo e apresenta prévia com Substituir texto / Manter texto. Troca de contexto invalida a prévia e orienta revisão. |
| P05.4 | Concluído | Histórico institucional removido da interface de assinatura. `business.history` e eventos continuam persistidos; plano ativo permanece visível. |
| P05.5 | Concluído | Segmento → Plano → Revisão → Confirmação. Voltar/Avançar preservam escolhas. Cancelar escolhas e descartar proposta preservam o plano ativo. Novo aceite é exigido após revisar a proposta. |
| P05.6 | Concluído | Cálculo inteiro por segmento e plano, apresentado na revisão. Proposta guarda o valor e a revisão da regra; adesão confirmada fixa os valores. Propostas/planos legados não são recalculados. |
| P05.7 | Concluído | Clube, revisão de ofertas, vouchers, conversões, comissão de 5%, perfis e permissões mantidos. Nenhum contrato, cobrança, mensagem externa ou pagamento executado. |

Também foi corrigida uma perda de rascunho reproduzida na validação: salvar um dos dois formulários de Famílias e retornos não apaga mais o texto ainda não confirmado do outro. A correção tem teste de regressão e foi conferida novamente na interface.

## Regra acadêmica de valores

Planos-base existentes, em centavos: Essencial 150.000; Acompanhamento 250.000; Rede 400.000. Os fatores abaixo são uma decisão local de apresentação acadêmica, **não pesquisa ou validação comercial**.

| Segmento | Fator da mensalidade |
| --- | --- |
| Educação Infantil | 0,80 |
| Ensino Fundamental | 1,00 |
| Ensino Médio | 1,10 |
| Educação de Jovens e Adultos | 0,85 |
| Educação Profissional e Tecnológica | 1,20 |

Mensalidade = arredondamento em centavos do valor-base × fator. Implantação mantém a regra anterior: R$ 5.000,00 quando a revisão institucional é zero; R$ 0,00 nas adesões posteriores. Não se alteraram comissões ou preços das ofertas.

Exemplos conferidos: Essencial + Educação Infantil = R$ 1.200,00/mês; Rede + Ensino Médio = R$ 4.400,00/mês. O segundo permaneceu como plano ativo após confirmação e recarga na origem de teste. Propostas antigas mantêm os valores previamente persistidos, mesmo que diferentes da nova regra.

As escolhas ainda não confirmadas das etapas 1–3 são mantidas na página durante a navegação das etapas. A proposta preparada na etapa 4 é persistida e retomada após recarga. Não foi criado salvamento permanente de todo rascunho.

## Testes e estabilização

### Automatizados executados nesta missão

- `npm run check`: **111 aprovados, zero falhas, zero ignorados**. Inclui os 95 anteriores novamente executados e 16 novos testes direcionados.
- Cobertura nova: assistência sem efeitos colaterais, escopo/vínculo, retorno familiar, plano/prazo, anulações, preservação/substituição explícita do texto, contexto inválido, texto revisado salvo e recarregado, 15 combinações de valores, proposta legada, cancelamento/aceite, histórico preservado, sete PNGs e rascunhos simultâneos.
- `npm run build`: aprovado. Saída estática com **34 arquivos**, excluindo documentação, testes, capturas, `.git`, README, scripts de desenvolvimento e configurações locais.
- Estrutura HTML, IDs/referências ARIA e caminhos HTML/CSS: aprovados, sem recursos locais ausentes.
- `git diff --check`: aprovado.
- [Testes](evidencias-pacote-05/testes-automatizados.txt), [build](evidencias-pacote-05/build-estatico.txt), [verificação dirigida](evidencias-pacote-05/verificacao-publicacao.json).

### Navegador real

Servidor local restrito a `127.0.0.1:8768`, servindo **dist**, sem manipulação direta do armazenamento ou reset de dados. As operações abaixo foram executadas por controles da interface.

| Fluxo | Resultado |
| --- | --- |
| Splash/onboarding | Abertura e identidade preservadas; quatro etapas, avanço imediato, retorno e entrada no painel conferidos. |
| Dashboard/calendário | Expansão por Enter, preferência após recarga, seleção de hoje e estado vazio conferidos. |
| Registros | Sugestão existente editada, salva e anulada; original com autoria/data e anulação mantido após recarga. |
| Planos | Criação e Desfazer conferidos; anulação persiste. Conclusões pela nova assistência mantêm devolutiva e histórico. |
| Histórico | Histórico contextual de Ana contém apenas Ana; consulta global mantém os demais registros. |
| Cadastros | Três categorias, filtro 8º B e página 2 com quatro estudantes conferidos; inclusão continua com comportamento anterior. |
| Família | Comunicado revisado aparece no perfil correto; leitura e resposta geram retorno e persistem após recarga. |
| Assistências | Campos editáveis, prévia de substituição, Manter texto e preservação de rascunho simultâneo conferidos. |
| Contratação | Quatro etapas, retorno, alteração de segmento/plano, revisão, novo aceite, confirmação e recarga; cancelamento de outra proposta sem alterar plano ativo. Histórico institucional ausente. |
| Imagens | Dois familiares e cinco logos carregados, inclusive perfil conectado; menu expandido/recolhido e versões maiores nas áreas principais. |
| Clube/parceiro | Aprovação de oferta, emissão/cancelamento e reemissão de voucher; comissão zero antes e R$ 3,25 após conversão confirmada da oferta de R$ 65,00; persistência após recarga. |
| Responsividade | Contratação em 320/390/1280/1440 px; assistências e parceiros em telas estreitas. Medições registradas sem transbordamento horizontal da página. |
| Movimento reduzido | Preferência real do macOS ativada; expansão por teclado funcionou com transição praticamente nula. Estado original restaurado. |
| Console | Consulta final sem avisos ou erros da aplicação. |

[Observações de navegador](evidencias-pacote-05/verificacoes-navegador.json). As capturas representam a apresentação; persistência, ações e foco foram conferidos por interação, não presumidos pelas imagens.

O servidor observou também uma solicitação a `offline-worker.js`, caminho inexistente e não referenciado pelo código do Notare. Nenhum recurso artificial foi acrescentado para atendê-la; as jornadas e o console da aplicação permaneceram funcionais. A infraestrutura do navegador integrado não foi tratada como parte do site.

## Segurança, GitHub e preparação pública

- Remoto confirmado por leitura: `guicunhasou/Notare`, **privado**, propriedade `guicunhasou`, permissão **ADMIN**. Os quatro colaboradores já existentes foram preservados; nenhuma pessoa foi contatada e nenhuma permissão mudou.
- O conector GitHub não alcançou o repositório; a verificação foi concluída pela CLI autenticada, sem exibir credenciais.
- Antes da missão, só havia a branch remota `main` em `e330814`, ancestral do candidato. A checagem remota é repetida antes do push, sem force push, sem PR e sem atualização da main.
- Varredura dirigida dos textos atuais e de blobs históricos alcançáveis: nenhum padrão de chave privada/token/credencial detectado. Sem arquivos `.env`, chaves privadas, bancos, fontes acadêmicas originais ou documentos de entrega no conjunto versionado examinado. Isso não constitui certificação de segurança.
- O aplicativo utiliza personagens e instituições fictícios. Créditos acadêmicos do README não compõem a saída pública do site.
- Não há chamadas de `fetch`, WebSocket, XMLHttpRequest ou sendBeacon nos controladores de execução. Scripts, fontes e imagens são locais.
- Não há autenticação real, backend institucional ou sincronização entre usuários. `localStorage` permanece separado por origem e perfil demonstrativo; o seletor de perfis não é uma barreira de segurança.
- Licenças SIL OFL das fontes preservadas e incluídas em dist. As novas imagens provêm exclusivamente da prancha fornecida; nenhuma licença de terceiros foi inventada.
- `vercel.json` preparado com build/saída explícitos e deploy automático por Git desativado. **Nenhum projeto da Vercel foi criado ou conectado.**

[Procedimento futuro de publicação](preparacao-vercel.md), incluindo branch, configuração, variáveis (nenhuma), rotas, limites do armazenamento e verificações posteriores ao deploy.

## Arquivos alterados

- `assets/community/*.png` (sete novos), `community-media.js`, `app.js`: imagens e enquadramento por perfil.
- `business.js`: sugestões locais, segmentos/cálculo e preservação dos valores de propostas e adesões.
- `business-ui.js`: assistências, prévia, etapas da proposta, remoção visual do histórico e preservação de rascunhos simultâneos.
- `index.html`, `styles.css`: versões de recursos e acabamento pontual das imagens/formulários.
- `tests/p05.test.mjs`, `tests/p34.test.mjs`, `tests/runtime.mjs`: testes direcionados e expectativa dos assets agora fornecidos.
- `scripts/build-static.mjs`, `package.json`, `.gitignore`, `vercel.json`: preparação estática, sem novas dependências.
- `README.md`, `docs/assets-comunidade-pendentes.md`, `docs/preparacao-vercel.md`, este relatório e `docs/evidencias-pacote-05/`: atualização técnica e evidências.

Marca, fontes, splash, base escolar, operações de anulação e fontes acadêmicas originais não foram modificados.

## Capturas representativas

- [Família com retrato](evidencias-pacote-05/familia-marina.jpg), [seletor de perfis](evidencias-pacote-05/perfis-imagens.jpg), [menu recolhido](evidencias-pacote-05/menu-recolhido.jpg).
- [Logos em Revisar parcerias](evidencias-pacote-05/parcerias-logos.jpg), [logo na área do parceiro](evidencias-pacote-05/parceiro-logo.jpg), [parceiro em 320 px](evidencias-pacote-05/parceiro-320.jpg).
- [Prévia sem sobrescrita](evidencias-pacote-05/sugestao-previa.jpg), [duas assistências](evidencias-pacote-05/assistencias-finais.jpg), [retorno familiar](evidencias-pacote-05/familia-retorno.jpg).
- [Revisão de valores](evidencias-pacote-05/contratacao-revisao.jpg), [confirmação](evidencias-pacote-05/contratacao-confirmacao.jpg), [320 px](evidencias-pacote-05/contratacao-320.jpg), [390 px](evidencias-pacote-05/contratacao-390.jpg), [confirmação em 390 px](evidencias-pacote-05/confirmacao-390.jpg).

## Pendências e avaliação humana

1. Avaliar apresentação, enquadramento dos retratos/logos e linguagem das sugestões; nenhuma decisão pedagógica é automatizada.
2. Avaliar o fluxo em etapas e aceitar/revisar os fatores acadêmicos por segmento. Eles não devem ser usados como preço comercial validado.
3. Não houve regressão identificada nas verificações executadas. Não foi repetida auditoria geral; não há homologação nesta missão em Safari, Firefox, dispositivos físicos ou leitores de tela.
4. A origem isolada de teste contém propostas, comunicados, respostas, quatro conclusões de planos, anulações e vouchers fictícios usados na conferência. Não foi feito reset para apagar evidências. Esses estados não foram inseridos em `data.js` nem transferidos de outros armazenamentos do usuário.
5. A futura origem pública começará com sua própria base local; não recebe o armazenamento do localhost. Permanecem os limites de protótipo acadêmico.
6. Publicação Vercel, eventual integração à main, vídeo-pitch, PPTX/PDF e submissão acadêmica **não executados**. Dependem da avaliação e próxima orientação do usuário.

Próximo passo: avaliação humana geral do candidato. Após autorização específica, publicar o commit aprovado na Vercel e validar a nova origem; depois concluir os materiais acadêmicos em tarefas próprias. Não ampliar o produto durante esse encerramento.
