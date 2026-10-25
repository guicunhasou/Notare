# Homologação Notare — 25/10/2026

## Resultado

Pronto para iniciar a preparação do pitch acadêmico com demonstração local explicitamente identificada. Nenhum bloqueante permanece nos percursos exercitados. Não equivale a autorização para publicar nem a validação de um serviço comercial.

Base inicial: branch `codex/conclusao-mvp-2026`, commit `76fb4ab`, diretório limpo. O servidor desta revisão usa somente `127.0.0.1:4329`, preservando as origens e dados anteriores. Nenhum serviço remoto foi modificado.

## Funcionalidades efetivamente testadas na interface

| Jornada | Execução e resultado |
| --- | --- |
| Implantação | Quatro etapas em desktop: instituição, contratação fictícia, importação simulada e acesso do funcionário; conclusão no painel |
| Navegação e perfis | Nove perfis: direção, coordenação, orientação, docência, secretaria, duas famílias e dois parceiros. Percorridos todos os links disponíveis em mobile e áreas escolares em desktop; acessos diretos restritos redirecionam |
| Escola | Registro de contato para Ana, plano criado no mobile, confirmação real, compromisso na agenda, conclusão do plano, devolutiva e histórico preservados; agenda deixa de mostrar o compromisso concluído |
| Escola–família | Contato compartilhado, leitura confirmada, resposta; escola visualiza retorno. A outra família permanece sem esse comunicado. Último contato passa a refletir retorno recebido |
| Clube e parceiros | Oferta submetida pelo Espaço Cultura, aprovação pela direção, segunda oferta recusada com justificativa, emissão de voucher, cancelamento, nova emissão e persistência após recarga |
| Conversão | Parceiro converte o voucher de R$ 59,90; comissão fictícia de R$ 3,00 é registrada e a ação não pode ser repetida. Voucher cancelado permanece com comissão zero |
| Adesão | Proposta descartada preserva o plano ativo; adesão ao Rede/Ensino Médio com aceite demonstrativo persiste após recarga. Suspender Clube remove novas ofertas sem apagar vouchers; reativação funciona |
| Estados | Busca sem resultado, cadastro sem resultado, ausência de comunicados para outra família, nenhuma oferta pendente, Clube suspenso e formulário com texto vazio/insuficiente com mensagem explícita |
| Acessibilidade | Tab/Shift+Tab contidos no menu, saída com Escape, navegação do seletor de perfis e restauração de foco; tabela pode receber foco e rolar horizontalmente |
| Responsividade | Desktop 1440×900, mobile 390×844 e conferência adicional de painel em 320×740; capturas reais do navegador |

## Defeitos encontrados e corrigidos

1. **P1 — confirmação sem autorização e sem criação:** `#conclusao` podia ser aberto por família/parceiro e exibir uma confirmação sem plano recém-criado. Agora exige permissão de planos, identificador de criação válido, estudante no escopo e plano não concluído. Recarregar uma confirmação sem contexto leva ao painel, preservando o plano no histórico.
2. **P1 — teclado preso no seletor mobile:** menu lateral e diálogo disputavam o foco. Abrir o diálogo fecha o menu; Tab percorre as opções, Escape fecha e restaura o controle visível.
3. **P1 — Escape mudava foco para menu fechado:** fechamento do menu escolar restaurava foco mesmo sem estar aberto. Agora só restaura quando efetivamente fecha esse menu.
4. **P1 — largura mínima:** cartões e cabeçalho alargavam a página a 320 pixels. Ajustados limites do grid, texto, cabeçalho e colunas dos indicadores; reteste apresentou largura de documento igual a 320 pixels.
5. **P1 — tabela durante transição:** o rótulo absoluto da tabela escapava do contêiner durante a animação e alargava temporariamente a página. Posicionamento relativo no contêiner mantém a rolagem dentro da tabela; região ganhou foco e nome acessível.
6. **P2 — calendário mobile:** herdava base flex de 360 pixels e gerava grande espaço vazio. Agora usa a altura do conteúdo; medida real de aproximadamente 135 pixels a 390 de largura.

## Testes e evidências

- `npm run check`: **50 testes aprovados**, zero falhas, com sintaxe dos seis módulos. Novo teste comportamental cobre confirmação com identificador ausente, inexistente, fora do escopo, plano concluído e plano válido.
- ESLint local, sem instalação: `no-undef` e `no-unused-vars` em app.js, core.js, ui.js, business.js e business-ui.js, sem erros.
- `git diff --check` sem erros. Aplicação estática, sem build ou migrations.
- Console do navegador sem erros na revisão final.
- Os percursos acima foram operados no navegador; não são inferidos dos testes unitários. Não há alegação de teste em aparelho físico ou leitor de tela.

Evidências no diretório local `output/homologacao-20261025` deste chat:

- `notare-desktop-painel.png`, `notare-desktop-familias-final.png`, `notare-desktop-assinatura.png`;
- `notare-mobile-painel.png`, `notare-mobile-320-corrigido.png`, `notare-mobile-plano-criado.png`;
- `notare-mobile-familia-final.png`, `notare-mobile-clube.png`, `notare-mobile-parceiro.png`, `notare-mobile-busca.png`;
- `notare-observacoes-browser.json`: observações de navegação e perfis, incluindo medições intermediárias anteriores às correções; o reteste final da fila tem documento de 375 pixels no viewport de 390. Os elementos da tabela continuam mais largos dentro de seu próprio contêiner rolável.

Capturas com `antes` documentam os defeitos e não representam o resultado final. Os dados são fictícios.

## Limitações e prontidão

Autenticação, vínculos familiares, contratação, comissões, pagamentos e importações continuam demonstrativos. O armazenamento é localStorage, sem sincronização ou autorização em servidor; não inserir dados reais. Navegador mobile significa viewport reduzido no navegador de homologação, não execução em iPhone físico. Safari e leitor de tela não foram exercitados. Fontes remotas preexistentes podem usar fallback sem rede.

Não foram produzidos pitch, slides, vídeo ou PDF final. Nenhum push, PR, issue, deploy, comunicação às integrantes ou alteração externa foi realizado. Os commits desta homologação permanecem exclusivamente locais.
