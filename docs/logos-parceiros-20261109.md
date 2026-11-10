# Notare — quatro novas logos e parceiros aprovados

Complemento dos ajustes finais, executado em 09/11/2026 após recebimento da prancha e orientação do usuário: acrescentar as quatro marcas como aprovadas e remover os parceiros repetidos da lista de aprovados, preservando a revisão.

## Resultado

**Concluído:** quatro logos recortadas da prancha, integradas aos perfis e à lista compacta. Nenhuma imagem foi gerada ou redesenhada. Os sete recursos anteriores, inclusive as logos dos três parceiros em revisão, foram preservados byte a byte.

| Marca | Arquivo em assets/community/ | Dimensão | Peso |
|---|---|---|---|
| AlimentaBem | parceiro-alimentabem.png | 440 × 388 | 168.897 bytes |
| CulturaViva | parceiro-culturaviva.png | 440 × 389 | 168.823 bytes |
| Saúde em Foco | parceiro-saude-em-foco.png | 440 × 333 | 142.815 bytes |
| Transporte Solidário | parceiro-transporte-solidario.png | 440 × 397 | 178.057 bytes |

PNG, proporções e fundo original preservados; total de 658.592 bytes. Mapeamento e textos alternativos em `community-media.js`.

A base inicial agora possui **9 parceiros: 6 na lista de aprovados e 3 somente em revisão**. Os dois aprovados anteriores permanecem. As quatro novas marcas são parcerias aprovadas, inicialmente sem ofertas. Permanecem exatamente 5 ofertas: 2 aprovadas e 3 pendentes. Não foram inventados preços, benefícios, vouchers, conversões ou comissões para preencher os novos perfis.

Oficina Vagalume de Papel, Estúdio Trilha do Movimento e Casa Pontes da Leitura não aparecem entre os aprovados enquanto possuírem proposta pendente. Seus cadastros e imagens continuam na revisão. Após finalizar a revisão, a apresentação volta a refletir os estados das ofertas. A regra visual também evita repetição quando um parceiro tem simultaneamente uma oferta anterior aprovada e outra pendente; isso não revoga a oferta anterior nem altera os dados comerciais.

## Persistência e preservação

A inicialização usa a revisão aditiva 2 dos exemplos locais: insere somente IDs/perfis inexistentes e grava uma vez pelo mecanismo existente. Não sobrescreve nomes, decisões ou registros locais, não restaura parceiros ausentes depois da atualização e não recria ofertas da revisão anterior. Nenhum reset geral foi executado.

Os novos perfis utilizam o fluxo já existente do parceiro, sem acesso a estudantes ou registros escolares. Podem submeter ofertas para revisão, sem aprovação automática dessas ofertas. Os dois vínculos familiares foram preservados.

A introdução aprovada, `app.js`, `styles.css` e as sete imagens anteriores permaneceram idênticos ao estado no início desta continuação. Alterações locais do pacote final foram preservadas.

## Validação efetivamente executada

- `npm run check`: **134 aprovados, 0 reprovados, 0 ignorados**; seis testes novos de migração, separação das listas, preservação e permissões. Expectativas de quantidades e nomes dos testes de assets atualizadas.
- `npm run build`: aprovado. Imagens e arquivos alterados em `dist/` comparados byte a byte com os fontes finais.
- `git diff --check`: sem erros.
- Navegador real IAB/Chromium, em uma origem local de teste: 320, 390, 1280 e 1440 px. Sem transbordamento horizontal nas quatro larguras; seis logos da lista carregadas e três propostas preservadas somente na revisão.
- As quatro marcas foram acessadas pelo seletor de perfis usando Enter; imagem, nome, área e estado vazio de ofertas conferidos. Menu recolhido conferido com Transporte Solidário; perfil Saúde em Foco conferido em 320 px.
- Recarga manteve os seis aprovados e as três propostas pendentes. Nenhuma aprovação ou recusa foi executada nesta sessão de imagens.
- Nenhum erro ou aviso no console capturado. Safari, Firefox, aparelho físico e leitor de tela não homologados nesta continuação.

Evidências: [desktop](evidencias-logos-20261109/parcerias-1440.jpg), [1280](evidencias-logos-20261109/parcerias-1280.jpg), [390](evidencias-logos-20261109/parcerias-390.jpg), [320 completo](evidencias-logos-20261109/parcerias-320-completa.jpg), [perfil mobile](evidencias-logos-20261109/perfil-mobile-320.jpg), [observações do navegador](evidencias-logos-20261109/navegador.json), [134 testes](evidencias-logos-20261109/testes-134.txt), [build](evidencias-logos-20261109/build.txt).

## Arquivos desta continuação

- `business.js`: exemplos aditivos de parceiros aprovados, sem novas ofertas.
- `business-ui.js`: apresentação dos aprovados sem duplicar parceiros pendentes e identificação de parceria sem oferta.
- `community-media.js`: quatro mapeamentos e textos alternativos.
- `index.html`: versões dos três scripts atualizadas para evitar cache antigo.
- Quatro PNGs em `assets/community/`.
- `tests/community-logos.test.mjs`, `tests/p34.test.mjs`, `tests/p05.test.mjs`.
- Este relatório, atualização de continuidade em `docs/ajustes-finais-20261109.md` e evidências.

## Git e encerramento

Branch inicial/final: `codex/conclusao-mvp-2026`. HEAD inicial/final: `c254b8f72a42c31c7a36b67e001604a30027612d`. A árvore já continha as alterações locais do pacote final e permanece com mudanças não commitadas. `main` local permanece em `e33081459c1124abbe62858b02bddb50cccf66d3`.

**Nenhum commit, push, merge, PR ou deploy foi realizado.** A pendência das quatro logos está encerrada. Pronto para a última conferência humana; nenhum novo pacote iniciado.

## Acabamento solicitado: somente as logos

Removidos da lista compacta os nomes escritos abaixo das logos, os subtextos de aprovação/quantidade e a frase explicativa repetitiva. Mantidos o título da seção e os textos alternativos das imagens. Outras áreas continuam com sua identificação textual. Parceiro sem imagem disponível conserva o nome como alternativa, sem inventar uma logo.

134 testes aprovados e build validado novamente. Conferidas 320, 390, 1280 e 1440 px no navegador: seis imagens carregadas, nenhum texto repetido na lista e nenhum transbordamento horizontal. Sem erros ou avisos no console capturado. Nenhum commit, push ou deploy.

[Apresentação final desktop](evidencias-logos-20261109/somente-logos-1440.jpg) · [Mobile](evidencias-logos-20261109/somente-logos-320.jpg).
