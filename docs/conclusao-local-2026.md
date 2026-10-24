# Notare — conclusão técnica local em 24/10/2026

## Escopo e origem das decisões

Notare é a solução oficial da Startup One, conforme confirmação do responsável pelo projeto. A proposta B2B2C das entregas anteriores orientou a ampliação: escola paga pela solução e implantação; família acessa gratuitamente; parceiros participam do Clube e uma conversão elegível pode originar comissão. A equipe escolar mantém a decisão sobre o acompanhamento.

Referências originais, mantidas somente para leitura em `/Users/guicunha/Desktop/focos/*/fiap 2026/`:

- `notare-5-entrega.pdf` e `notare-5-enunciado.png`: monetização, assinatura escolar, implantação e comissões;
- `notare-6-entrega.pdf` e `notare-6-enunciado.png`: MVP escolar, contexto do estudante, registro, plano e continuidade;
- `notare-7-enunciado.png`: entrega final da Startup One. Nenhum pitch foi produzido nesta execução.

As jornadas acrescentadas nesta revisão não são apresentadas como existentes nos PDFs anteriores. O ponto de partida técnico era `39fb085` e continha o acompanhamento escolar e implantação demonstrativa, mas não os ciclos funcionais de família, benefícios e parceiros agora integrados.

## Matriz da ampliação

| Necessidade | Resultado local | Evidência principal |
| --- | --- | --- |
| Escola compartilhar contato e receber retorno | Atendido no MVP: envio, leitura, resposta única, devolutiva e histórico | `business.js`: sendMessage/respondMessage; área Famílias e retornos |
| Responsável acompanhar sua família | Atendido no MVP para dois vínculos fictícios: Ana/Marina e Lucas/Paulo | scopedStudents/familyMessages; área Minha família |
| Clube de Benefícios | Atendido: ofertas aprovadas, disponibilidade e validade, voucher, cancelamento e histórico | availableOffers/reserve/cancelRedemption; área Clube |
| Parceiro participar sem acesso à experiência escolar | Atendido na simulação: ofertas próprias, revisão institucional, pausa, extrato sem identidade familiar | createOffer/reviewOffer/toggleOffer/partnerStatement |
| Monetização por conversão | Atendido como simulação: valor e taxa congelados na emissão, comissão apenas no uso confirmado e único | confirmConversion; testes de duplicação e parceiro incorreto |
| Adesão institucional com começo e conclusão | Atendido como simulação: proposta, revisão, aceite explícito, plano ativo e histórico | proposeSubscription/activateSubscription; área Plano e assinatura |
| Continuidade do acompanhamento | Atendido: criar plano pode compartilhar comunicado seguro; concluir preserva dados e encerra somente compromissos vinculados | app.js e completePlan; histórico e agenda |
| Persistência | Atendido no navegador: nova comunidade acrescentada à base v7 sem mudar a chave existente ou apagar registros | initialize; teste de migração; recarga real na interface |
| Autenticação, cobrança e troca de dados entre usuários reais | Fora da implementação demonstrativa: não verificado como serviço real | Limites abaixo |

## Regras de produto

- Só o texto explicitamente destinado à família é compartilhado. Notas internas e ocorrências não são copiadas automaticamente. O contato opcional de um novo plano compartilha tipo e prazo, sem observações internas.
- A resposta familiar gera devolutiva com autoria e atualiza a comunicação exibida no perfil. Um novo contato volta a aguardar retorno. A resposta não modifica frequência nem encerra a prioridade automaticamente.
- A direção aprova ou recusa ofertas; o parceiro não pode aprovar a própria oferta. Ofertas pausadas, vencidas e sem estoque não aceitam novos resgates.
- Um resgate por família/oferta; cancelamento devolve disponibilidade uma única vez. Vouchers vencidos não podem ser convertidos. Vouchers já utilizados permanecem no histórico e não geram nova comissão.
- O parceiro vê código, benefício, situação, valor fictício e comissão. O extrato não inclui estudante, responsável, contato ou histórico escolar.
- Desabilitar o Clube impede novos resgates, preservando vouchers anteriores. A configuração é da direção.
- A proposta ainda não aceita não troca o plano ativo. O aceite é apenas demonstrativo e não formaliza contrato. Descartar a proposta mantém o plano anterior.

A mensalidade de referência de R$ 2.500 e implantação de R$ 5.000 seguem a hipótese acadêmica de monetização. Os planos Essencial/Rede e a taxa de 5% são parâmetros ilustrativos para exercitar a navegação, sem validação comercial nem relação contratual. Não demonstram receita obtida. Valores ficam em centavos internamente para evitar cálculo monetário inconsistente.

## Validação realizada

### Automatizada e revisão estática

- `npm run check`: sintaxe de seis arquivos JavaScript e **49 testes aprovados**, sendo 38 anteriores e 11 de regras acrescentadas.
- Cobertura nova: migração preservando edições; escopo de turma e família; leitura idempotente; resposta única; comunicação atual; conclusão e agenda; revisão/aceite de proposta; validade de oferta; autoaprovação proibida; estoque/cancelamento/duplicação; Clube pausado; conversão de parceiro correto, valor congelado e arredondamento; extrato sem identidade familiar.
- ESLint já disponível no ambiente, sem instalação de dependências: `no-undef` e `no-unused-vars` em app.js, business.js e business-ui.js, sem erros. A configuração temporária não modifica o projeto nem pretende equivaler a uma auditoria completa de segurança.
- `git diff --check` sem erros. Aplicação estática, sem etapa de build ou migrations.

### Interface real no navegador local

Em `127.0.0.1:4319`, com dados exclusivamente fictícios:

1. direção enviou comunicado para Ana; Marina confirmou leitura e respondeu; a escola visualizou o retorno;
2. Marina emitiu voucher; a recarga manteve código e disponibilidade;
3. Papelaria visualizou somente seu extrato, confirmou utilização fictícia, registrou R$ 4 de comissão simulada e perdeu a ação de conversão repetida;
4. parceiro submeteu nova oferta; a direção aprovou; a família passou a vê-la no Clube;
5. tentativa do parceiro de abrir Famílias e retornos foi recusada e redirecionada;
6. direção revisou e confirmou adesão ao Notare Rede; recarga preservou o plano ativo;
7. criação de plano para Ana gerou agenda e comunicado; conclusão retirou o plano da lista pendente e apareceu no histórico preservado;
8. resumo de contato e sinais passaram a refletir a comunicação atual; oferta já resgatada deixou de oferecer uma nova emissão;
9. composição visual revisada em desktop; nenhum erro registrado no console da revisão final.

As verificações de regras não equivalem a testes automatizados de ponta a ponta. Navegador móvel real, Safari, leitor de tela, rede indisponível e sincronização entre abas/dispositivos não foram validados nesta execução.

## Limites e pendências

**Pronto para revisão e demonstração acadêmica local controlada**, identificando as simulações. Nenhum bloqueante funcional foi encontrado nos ciclos exercitados.

- **P1 para a apresentação:** revisar a experiência no navegador e tamanho de tela que serão efetivamente usados; não usar dados reais. Manter a mesma origem/porta para preservar a sessão demonstrativa. As fontes Google já existentes podem depender de rede, com fallback do sistema.
- **P1 se houver publicação autorizada:** publicar apenas após aprovação do responsável e repetir os percursos na origem final. Dados de localStorage não são levados automaticamente ao endereço publicado.
- **P2/evolução:** ampliar vínculos familiares e cadastro de parceiros, implementar edição de cadastros e validar condições comerciais com interessados reais.
- **Fora deste MVP:** autenticação e autorização em servidor, persistência central, auditoria imutável, pagamentos, contratos, repasses, notificações externas e integrações personalizadas. As permissões são regras locais de demonstração; a base fictícia é acessível a quem tem o navegador/código. Não há garantia de privacidade de produção.

Registros e planos existentes são preservados. A opção explícita Restaurar base inicial continua apagando somente a demonstração do navegador após confirmação; não foi usada para substituir dados anteriores nesta revisão. Para evitar sobrescrita por outra aba, utilize uma única aba de demonstração por origem: não há mecanismo de concorrência multiusuário.

## Sigilo e situação de publicação

Desenvolvimento no branch local `codex/conclusao-mvp-2026`. Nenhum push, PR, issue, comentário, compartilhamento ou deploy foi realizado. Nenhuma dependência paga ou serviço externo novo foi incluído. Não houve mudanças em produção. O envio de commits e qualquer publicação aguardam autorização explícita posterior.
