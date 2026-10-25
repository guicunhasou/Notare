<div align="center">
  <img src="assets/brand/notare-logo.svg" alt="Notare" width="360" />

  <p><strong>Acompanhamento escolar com contexto, responsabilidade e continuidade.</strong></p>
  <p>MVP navegável da solução Notare para a Startup One / FIAP 2026.</p>
</div>

---

## 📌 Sobre o projeto

O **Notare** é uma proposta de permanência escolar voltada às equipes de direção, coordenação, orientação, docência e secretaria.

A aplicação reúne sinais como frequência em queda, faltas consecutivas e contatos sem retorno. A equipe consulta o contexto do estudante, registra informações e organiza planos de ação com responsável e prazo, preservando a decisão com os profissionais da escola.

Todos os nomes, contatos, instituições e dados apresentados são fictícios.

A ampliação local de 24/10/2026 integra famílias, Clube de Benefícios, parceiros e adesão institucional. Consulte [escopo, evidências e limites](docs/conclusao-local-2026.md).

---

## 🧭 User Flow

O fluxo principal demonstra a jornada da contratação institucional ao acompanhamento cotidiano:

1. acesso institucional da escola;
2. definição do segmento e do plano contratado;
3. configuração de turmas, estudantes, funcionários e fotos;
4. acesso individual do funcionário;
5. consulta ao painel e às prioridades;
6. análise do perfil e do histórico do estudante;
7. criação de um registro;
8. definição de um plano de ação;
9. confirmação e continuidade na agenda e no histórico.

A implantação é opcional, preenche os dados de cada etapa automaticamente e usa avanço manual por padrão. O usuário também pode ativar o modo automático, pausá-lo ou seguir diretamente para a visão geral.

---

## ✅ Funcionalidades implementadas

- jornada guiada com acesso, contratação, configuração e entrada do funcionário;
- painel com indicadores, prioridades, gráfico de frequência e calendário dinâmico;
- agenda pessoal filtrada pelo perfil conectado;
- fila de acompanhamento com busca e filtros;
- diretório de estudantes organizado por turma e em ordem alfabética;
- perfil do estudante com sinais explicáveis, contato e histórico;
- registros de ausência, contato, ocorrência e devolutiva;
- seleção da turma antes do estudante no novo registro;
- autoria do registro vinculada ao perfil conectado;
- sugestão simulada de texto produzida por regras locais;
- textos pré-elaborados que acompanham o tipo de registro, permanecem editáveis e pedem confirmação antes de substituir uma descrição preenchida;
- planos de ação com responsável, objetivo e prazo em dia útil;
- central de notificações por perfil, com avisos após 2 e 5 minutos no painel;
- consulta ao plano e ao escopo da contratação institucional;
- consulta paginada de estudantes, funcionários e turmas para direção e secretaria;
- navegação responsiva com suporte a teclado;
- persistência de alterações no navegador;
- comunicados escola–família, confirmação de leitura e resposta vinculada ao histórico escolar;
- conclusão de planos com devolutiva, preservação do histórico e retirada da agenda pendente;
- Clube gratuito para famílias, com ofertas, emissão e cancelamento de vouchers fictícios;
- parceiro com submissão de ofertas, revisão pela direção e controle de disponibilidade;
- conversão única de voucher e comissão de 5% estritamente simulada;
- proposta institucional, revisão, aceite demonstrativo e histórico do plano ativo.

---

## 👥 Perfis e permissões

A demonstração utiliza a **Escola Horizonte Vivo**, cinco perfis profissionais, duas famílias e dois parceiros:

| Perfil | Escopo principal |
| --- | --- |
| Direção escolar | Visão completa da unidade e dos acompanhamentos |
| Coordenação pedagógica | Turmas, registros pedagógicos e planos de ação |
| Orientação educacional | Estudantes em acompanhamento, contatos e devolutivas |
| Docência | Estudantes das turmas 8º A e 8º B |
| Secretaria escolar | Cadastros e registros de frequência, sem ocorrências |
| Marina Souza | Comunicados de Ana Souza e Clube gratuito |
| Paulo Lima | Comunicados de Lucas Lima e Clube gratuito |
| Papelaria Horizonte | Ofertas e conversões próprias |
| Espaço Cultura | Ofertas e conversões próprias |

A área de **Cadastros** é somente para consulta neste MVP e fica disponível para direção e secretaria. Inclusão e edição permanecem identificadas como funcionalidades futuras.

A troca rápida de perfis é um recurso exclusivo do MVP. No produto real, profissionais, responsáveis e parceiros utilizariam credenciais próprias. As permissões aqui demonstram fluxos na interface e nas regras locais: não constituem autenticação ou isolamento de dados em servidor. Não inserir dados reais.

---

## 🗂️ Base demonstrativa

O arquivo `data.js` contém uma base local versionada com:

- 8 turmas do 6º ao 9º ano;
- 96 estudantes, com 12 estudantes por turma;
- 32 registros;
- 10 planos de ação;
- 10 compromissos iniciais na agenda;
- séries históricas de frequência geral e por turma;
- perfis, permissões e relacionamentos entre os dados.

Novos registros, planos, comunicados, propostas, ofertas, vouchers, conversões, perfil selecionado e estado do menu são armazenados no `localStorage`. A comunidade é acrescentada à base v7 existente sem apagar registros ou planos. Os novos perfis são derivados em execução, preservando os cinco perfis profissionais da base original. A opção **Restaurar base inicial**, disponível no seletor de perfil, recupera os dados originais.

---

## 🎨 Decisões de produto e interface

### Hierarquia e minimalismo

A interface prioriza leitura rápida, respiro e consistência. Indicadores resumem o cenário, enquanto listas, histórico e agenda apresentam os detalhes necessários para cada decisão.

### Priorização explicável

O Notare não calcula pontuação oculta nem toma decisões automáticas sobre estudantes. Os sinais apenas organizam informações observáveis, e a avaliação permanece com a equipe escolar.

### Privacidade desde o início

Os formulários orientam o registro de informações objetivas e evitam diagnósticos ou detalhes sensíveis. Os dados criados no MVP permanecem somente no navegador utilizado.

### Simulação identificada

A validação institucional, a contratação, a importação de arquivos e a sugestão de texto demonstram comportamentos esperados do produto, mas não fingem integrações reais.

---

## 🛠️ Tecnologias utilizadas

- **HTML5** para estrutura e semântica;
- **CSS3** para identidade visual, responsividade e estados de interação;
- **JavaScript** para navegação, regras do MVP e persistência local;
- **Node.js Test Runner** para as verificações automatizadas.

O projeto não utiliza framework frontend nem exige instalação de dependências para abrir a aplicação.

---

## 📁 Estrutura do projeto

```text
Notare/
├── assets/
│   ├── brand/       # Logos e favicon
│   ├── profiles/    # Escola e equipe fictícia
│   └── rosters/     # Pranchas de estudantes fictícios
├── tests/
│   ├── notare.test.mjs
│   └── business.test.mjs
├── app.js           # Fluxos, renderização e eventos
├── business.js      # Regras de famílias, parceiros, Clube e adesão
├── business-ui.js   # Jornadas da comunidade integradas à interface
├── docs/            # Escopo e evidências da conclusão local
├── core.js          # Utilitários, datas e reconciliação de dados
├── data.js          # Base fictícia versionada
├── index.html       # Estrutura das telas
├── styles.css       # Identidade visual e responsividade
├── ui.js            # Componentes de interação compartilhados
└── package.json     # Comandos de validação
```

---

## 🚀 Como executar

No diretório local do projeto, inicie um servidor restrito ao próprio computador:

```bash
python3 -m http.server 4319 --bind 127.0.0.1
```

Acesse `http://127.0.0.1:4319`. Não há build, instalação de dependências ou publicação necessária para esta demonstração. A persistência depende do navegador e da mesma origem/porta; dados não são sincronizados entre dispositivos ou abas em tempo real.


---

## 🧪 Validação

Com o Node.js instalado, execute:

```bash
npm run check
```

O comando verifica a sintaxe dos arquivos JavaScript e executa 50 testes de dados, datas, permissões, acessibilidade estrutural, persistência e regras dos principais fluxos. A validação real de interface e seus limites estão no documento de conclusão local.

---

## 🔒 Limites do MVP

- não existe autenticação conectada a um servidor nem sincronização multiusuário;
- não há cobrança, assinatura eletrônica, compra, repasse ou processamento comercial; preços, vouchers e comissões são hipóteses demonstrativas;
- nenhuma importação ou comunicação familiar é enviada para um serviço externo;
- a sugestão de texto não utiliza inteligência artificial real;
- os dados criados permanecem no `localStorage` do navegador;
- a aplicação organiza sinais, mas não substitui a análise profissional.

---

## 🧑‍💻 Equipe Notare

- Guilherme Victor Cunha de Souza
- Isamara Alves de Brito
- Kauane Cristiny Bomfim Silva Cavalcante
- Mirna L. Marinho Carneiro Andrade

---

<div align="center">
  <strong>Notare</strong><br />
  Permanência escolar com acompanhamento humano e responsável.
</div>


Homologação de 25/10/2026: [percursos reais em desktop/mobile, correções e limitações](docs/homologacao-20261025.md).
