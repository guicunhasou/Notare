# Notare — segunda homologação, 09/11/2026

## Conferência inicial, antes de implementar

Branch `codex/conclusao-mvp-2026`, HEAD `c254b8f72a42c31c7a36b67e001604a30027612d`. Alterações locais anteriores preservadas em cópia independente. A informação 12/18 é a avaliação fornecida pelo usuário no Safari; não foi usada para adivinhar quais seis itens falharam. Esta conferência combina leitura do código, 134 testes de base aprovados e observação do painel, onboarding e novo registro no navegador local.

| # | Critério original | Estado encontrado / ação |
|---|---|---|
| 1 | Campos menores nas etapas 1 e 4 | Altura de cerca de 43 px confirmada; preservar. |
| 2 | Espaçamento entre conteúdo e navegação | Existente, porém navegação abaixo do conteúdo; inverter conforme nova referência. |
| 3 | Conclusão no rodapé após animação | Implementado; preservar condicionamento e proximidade. |
| 4 | Quatro indicadores compactos/expansíveis | Incorreto: apenas três têm expansão e textos extras continuam visíveis. |
| 5 | Controle simplificado/completo | Existe, mas atua também nos detalhes e está fora da posição desejada. |
| 6 | Cards detalhados preservados | Incorreto: prioridade detalhada recolhida e demais detalhes com expansão indevida. Recuperar estrutura pontual do histórico. |
| 7 | Calendário expansível | Implementado com compromissos/estado vazio; preservar. |
| 8 | Calendário independente da agenda | Implementado; preservar e revalidar. |
| 9 | Sugestão opcional/editável | Funciona, mas botão e checkbox duplicam a ação; unificar conforme novo pedido. |
| 10 | Estudante contextualizado | Nome/turma/código presentes; acrescentar imagem nos formulários. |
| 11 | Código visível com ID estável | Implementado; preservar cálculo e IDs. |
| 12 | Toast no topo e Desfazer real | Implementado; toast comum sem fechar e prazos diferentes do novo pedido. |
| 13 | Aprovar oferta | Implementado e coberto pela base de testes; preservar. |
| 14 | Recusa justificada em modal | Implementado; acrescentar sugestão opcional sem confirmar automaticamente. |
| 15 | Pendentes separados de ativos | Implementado; preservar precedência visual de pendentes. |
| 16 | Quatro novas logos | Integradas e mapeadas; preservar arquivos. |
| 17 | Parceiros compactos | Implementado com apenas imagens e alternativas acessíveis; preservar. |
| 18 | Frequência por extenso | Implementado com variação dinâmica; preservar. |

Não se atribui aprovação humana a critérios apenas inspecionados ou automatizados. Resultado final e evidências serão registrados ao fim desta execução.
