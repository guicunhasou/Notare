# Notare — preparação para publicação futura na Vercel

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
