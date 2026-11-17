# Notare — configuração atual e histórico de publicação

## Estado conferido em 17/11/2026

- A `main` local tem como base o commit `4cbe7a3`, com Work 1.01/1.02 consolidadas. Os refinamentos Work 1.03 estão locais, sem commit ou publicação nesta rodada.
- Já existe a demonstração pública [notare-startup.vercel.app](https://notare-startup.vercel.app/): HTTP 200 verificado em consulta somente de leitura nesta data. O commit do deploy não foi identificado pelos metadados públicos disponíveis; não foi presumida equivalência com a árvore local.
- O `vercel.json` mantém `framework: null`, `npm run build`, saída `dist` e `git.deploymentEnabled: false`. Nenhum comando de deploy foi executado.
- O build estático não inclui documentação, testes ou arquivos locais. A quantidade histórica de 34 arquivos abaixo descreve exclusivamente a etapa de 05/11; não é o inventário atual.

## Cabeçalhos preparados pela Work 1.03

A regra `source: "/(.*)"` aplica os quatro cabeçalhos a todas as respostas do site:

| Cabeçalho | Política |
| --- | --- |
| Content-Security-Policy | Recursos locais; scripts somente da própria origem; fontes locais; imagens locais e `data:`; sem conexões remotas, objetos, frames ou enquadramento por terceiros |
| X-Frame-Options | `DENY`, compatível com `frame-ancestors 'none'` |
| X-Content-Type-Options | `nosniff`; o servidor deve enviar o tipo MIME correto por arquivo |
| Referrer-Policy | `strict-origin-when-cross-origin` |

A CSP completa está em `vercel.json`. `style-src` permite estilos inline porque a interface existente usa atributos e variáveis CSS para fotos em prancha, animações e estados. Isso não permite scripts inline nem `eval`. `img-src data:` preserva a seta SVG dos selects. Não foi adicionado Content-Type global: HTML, JavaScript, CSS, fontes e imagens precisam manter seus próprios tipos. HTTPS/HSTS continuam sob responsabilidade da hospedagem.

Foi preparada validação local com os mesmos valores de cabeçalhos. **Isso não prova que a Vercel já os está enviando.** O GET público consultado ainda não apresentou esses quatro cabeçalhos; a nova configuração não foi publicada.

## Validação futura, somente após autorização

1. Conferir o commit/ref aprovado e repetir `npm run check` e `npm run build`.
2. Criar um Preview apenas com autorização específica; validar os cabeçalhos HTTP nas rotas e assets reais, tipos MIME e ausência de duplicações ou overrides no projeto da Vercel.
3. Verificar console/CSP, fontes locais, SVG inline, imagens em prancha e foto otimizada, rotas por hash, formulários e Web Locks com dados fictícios.
4. A CSP não libera scripts de terceiros, inclusive ferramentas de inspeção injetadas pelo Preview. Se uma ferramenta da hospedagem conflitar, avaliar sua desativação nesse Preview antes de ampliar a política do produto.
5. Publicação definitiva e eventual ativação do deploy automático exigem autorização separada. Não migrar dados escolares reais.

Referências oficiais consultadas em 17/11/2026: [headers na configuração Vercel](https://vercel.com/docs/project-configuration/vercel-json#headers), [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), [frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors), [nosniff](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options), [Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy).

---

## Registro histórico preservado — 05/11/2026

O conteúdo a seguir descreve a candidata e o estado de publicação daquela data. As referências a `main` antiga, branch candidata e ausência de publicação foram superadas pelo estado atual acima; permanecem como evidência histórica.

### Preparação para publicação futura — documento original

Data: 05/11/2026. **Preparado e validado localmente. Nenhum deploy foi executado; nenhum projeto, conta, domínio ou URL pública foi criado.**

## Fonte correta e condição de publicação

- Repositório: `https://github.com/guicunhasou/Notare`, privado.
- Branch candidata: `codex/conclusao-mvp-2026`.
- `main` permanece no commit histórico `e330814`; não contém a conclusão dos pacotes. Não publicar a `main` antiga por engano.
- A publicação da candidata, a integração futura à `main` e qualquer conexão à Vercel dependem da próxima autorização do usuário. Não há autorização de deploy nesta missão.
- `vercel.json` define `git.deploymentEnabled: false`, impedindo deploy automático por commits enquanto a publicação estiver suspensa. Não confundir push no GitHub com publicação do site.

## Configuração preparada

| Campo | Valor |
| --- | --- |
| Framework Preset | Other (`framework: null`) |
| Root Directory | Raiz do repositório (`.`) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | Não há dependências a instalar; pode ficar sem instalação |
| Node | 24 utilizado na validação local |
| Variáveis de ambiente | Nenhuma |
| Deploy automático por Git | Desativado no arquivo versionado |

O projeto continua estático, sem framework, backend ou integração externa. O build usa apenas recursos nativos do Node e copia uma lista fechada de arquivos do site. `dist` contém 34 arquivos: HTML, CSS, oito scripts e os assets necessários, incluindo licenças das fontes. Documentação, testes, capturas, README, `.git`, arquivos temporários e configurações locais não são copiados. `dist/` e `.vercel/` são ignorados pelo Git.

As rotas usam fragmentos (`/#painel`, `/#registros?estudante=ana`, `/#familias`, `/#assinatura`). O servidor entrega `index.html`; a aplicação interpreta o fragmento. Não é necessário rewrite genérico, função serverless ou API. Caminhos de scripts, imagens e fontes são relativos e locais.

## Procedimento posterior, somente após autorização

1. Conferir o commit candidato, os testes e a avaliação humana. Manter o repositório privado.
2. Definir explicitamente se será publicada a branch candidata ou se haverá integração autorizada à `main`; esta missão não integrou branches.
3. Somente então criar/importar o projeto na Vercel. Selecionar o repositório e a ref correta; uma importação que conclua em Deploy já é publicação.
4. Usar os valores da tabela acima. Não adicionar credenciais, bancos, autenticação ou variáveis fictícias.
5. Para publicação manual, usar o commit/ref aprovado. Caso se deseje futuramente deploy automático, alterar `git.deploymentEnabled` apenas com essa autorização, restringindo-o à branch escolhida.
6. Após a publicação autorizada, conferir as rotas por acesso direto e recarga, caminhos de assets, menu, teclado, 320/390 px, movimento reduzido, formulários, avisos, persistência e console.
7. Repetir as jornadas principais de comunicados, sugestões, proposta, histórico e vouchers na nova origem, sempre com dados fictícios.

## Limitações e riscos conhecidos

- `localStorage` pertence ao navegador e à origem. O novo domínio não recebe dados do localhost e não sincroniza usuários ou dispositivos. Não copiar armazenamento escolar real para o site.
- O seletor de perfis demonstra permissões; não constitui autenticação ou segurança institucional. Todos os dados entregues ao navegador são acessíveis localmente a quem o utiliza.
- Não inserir dados pessoais reais. O site é um protótipo acadêmico e explicita os limites em interface e documentação.
- Os valores de assinatura são hipóteses acadêmicas, não preços comercialmente validados. Aceites, comunicados, vouchers e comissões não geram operações externas.
- Navegação por hash e recursos estáticos foram conferidos em servidor local servindo `dist`. A infraestrutura real da Vercel ainda não foi homologada.
- Dispositivos físicos, Safari, Firefox e leitores de tela não foram testados nesta missão. A avaliação humana de apresentação continua pendente.
- Configurações locais desativam deploy automático por Git; não bloqueiam um deploy manual que alguém autorizado execute fora desta tarefa.

Referências oficiais consultadas em 05/11/2026: [configuração de build e diretório de saída](https://vercel.com/docs/builds/configure-a-build), [configuração estática](https://vercel.com/docs/project-configuration/vercel-json), [desativação de deploy automático](https://vercel.com/docs/project-configuration/git-configuration).
