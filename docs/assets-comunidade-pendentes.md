# Imagens de familiares e parceiros — integração preparada

Data: 05/11/2026. Situação: **parcial; aguardando os arquivos do usuário**.

Nenhum retrato ou logo novo foi fornecido neste pacote. Não foram geradas imagens, SVGs, retratos por CSS ou substitutos. As iniciais que já existiam continuam visíveis.

## Inventário preservado

- `assets/profiles/escola-logo.png`: identidade da escola fictícia.
- `assets/profiles/{camila-duarte,rafael-nunes,livia-moura,bruno-reis,daniela-prado}.png`: equipe escolar.
- `assets/rosters/estudantes-{6,7,8,9}-ano.webp`: fotos de estudantes já existentes.
- Marca Notare e fontes locais: preservadas.

Esses arquivos não foram reaproveitados como familiares ou empresas, para evitar identificar indevidamente os perfis. Não foram encontrados retratos familiares ou logos específicos dos parceiros.

## Mapeamento para os arquivos futuros

`community-media.js` centraliza os caminhos esperados e os textos alternativos. Todos os campos `src` permanecem `null`, portanto a aplicação não solicita arquivos inexistentes.

| Perfil | Arquivo esperado | Texto alternativo preparado |
| --- | --- | --- |
| familia-ana | assets/community/familia-ana.png | Retrato de Marina Souza, responsável familiar fictícia |
| familia-lucas | assets/community/familia-lucas.png | Retrato de Paulo Lima, responsável familiar fictício |
| parceiro-papelaria | assets/community/parceiro-papelaria.png | Logo da empresa fictícia Papelaria Horizonte |
| parceiro-cultura | assets/community/parceiro-cultura.png | Logo da empresa fictícia Espaço Cultura |
| parceiro-vagalume | assets/community/parceiro-vagalume.png | Logo da empresa fictícia Oficina Vagalume de Papel |
| parceiro-trilha | assets/community/parceiro-trilha.png | Logo da empresa fictícia Estúdio Trilha do Movimento |
| parceiro-pontes | assets/community/parceiro-pontes.png | Logo da empresa fictícia Casa Pontes da Leitura |

Ao receber os arquivos, conferir sua correspondência e autorização, preservando o caráter fictício dos retratos e empresas. Copiar apenas os arquivos confirmados, preencher o respectivo `src` com o caminho local e revisar o texto alternativo. Os nomes e extensões podem ser ajustados aos arquivos efetivamente recebidos; não há exigência de converter para PNG.

A aplicação já usa esse mapeamento no seletor de perfis, na identidade do perfil ativo e na identificação dos parceiros em Revisar parcerias. Retratos usam recorte circular com `object-fit: cover`; logos preservam sua proporção com `object-fit: contain`.

Validar cada imagem no menu expandido/recolhido, no seletor de perfis, na listagem de parceiros e em 320/390 pixels. Conferir enquadramento, contraste, carregamento e texto alternativo. **Essa validação das novas imagens ainda não foi realizada porque os arquivos não foram fornecidos.**
