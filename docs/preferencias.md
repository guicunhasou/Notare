# Notare — preferências por perfil demonstrativo

A Work 1.05 implementa F11. Cada perfil demonstrativo tem cinco escolhas independentes de sugestões automáticas no navegador.

| Controle | Identificador | Padrão sem preferência válida |
| --- | --- | --- |
| Comunicado à família | `body` | Ligado |
| Resultado e continuidade | `conclusion` | Ligado |
| Novo registro | `record` | Ligado |
| Recusa de oferta | `rejection` | Ligado |
| Encerramento de parceria | `ending` | Ligado |

Cada escolha usa a chave `notare-suggestion-v1:<profileId>:<controle>` no `localStorage` da mesma origem. Os valores salvos são `true` e `false`. Valores ausentes ou inválidos usam o padrão ligado. Ao alternar o perfil ou recarregar, os controles recuperam as escolhas do perfil ativo quando o armazenamento está acessível.

No caso de falha ao salvar, a escolha funciona em memória para aquele perfil e controle até o fim da sessão da página. Ao recarregar, vale a última escolha que conseguiu ser gravada ou o padrão. As escolhas não se sincronizam entre origens ou dispositivos.

Ligar preenche um campo vazio quando existe sugestão para o contexto atual. Desligar remove apenas a sugestão automática que permanece intacta. Se o usuário digitou ou editou o texto, o controle preserva o conteúdo. As sugestões continuam usando regras locais e exigem revisão humana e confirmação pelo fluxo existente.

A preferência armazena apenas o estado do controle. Os rascunhos, a base escolar e o histórico seguem os fluxos existentes. As permissões de cada perfil continuam determinando quais formulários ele pode usar.

A expansão dos quatro indicadores do painel mantém sua própria chave `notare-dashboard-v3:<profileId>`. O perfil ativo e o estado da lateral também têm chaves independentes.
