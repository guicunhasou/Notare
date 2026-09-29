<div align="center">
  <img src="assets/brand/notare-logo.svg" alt="Notare" width="360" />

  <p><strong>Acompanhamento escolar com contexto, responsabilidade e continuidade.</strong></p>
  <p>MVP navegável desenvolvido como projeto acadêmico de Web Design na FIAP.</p>
</div>

---

## 📌 Sobre o projeto

O **Notare** é uma proposta de permanência escolar voltada às equipes de direção, coordenação, orientação, docência e secretaria.

A aplicação reúne sinais como frequência em queda, faltas consecutivas e contatos sem retorno. A equipe consulta o contexto do estudante, registra informações e organiza planos de ação com responsável e prazo, preservando a decisão com os profissionais da escola.

Todos os nomes, contatos, instituições e dados apresentados são fictícios.

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

A introdução preenche os dados automaticamente e permite pausar ou pular a apresentação.

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
- planos de ação com responsável, objetivo e prazo em dia útil;
- central de notificações com avisos após 90 e 180 segundos;
- consulta ao plano e ao escopo da contratação institucional;
- navegação responsiva com suporte a teclado;
- persistência de alterações no navegador.

---

## 👥 Perfis e permissões

A demonstração utiliza a **Escola Horizonte Vivo** e cinco perfis profissionais:

| Perfil | Escopo principal |
| --- | --- |
| Direção escolar | Visão completa da unidade e dos acompanhamentos |
| Coordenação pedagógica | Turmas, registros pedagógicos e planos de ação |
| Orientação educacional | Estudantes em acompanhamento, contatos e devolutivas |
| Docência | Estudantes das turmas 8º A e 8º B |
| Secretaria escolar | Cadastros e registros de frequência, sem ocorrências |

A troca rápida de perfis é um recurso exclusivo do MVP. No produto real, cada funcionário utilizaria suas próprias credenciais e não poderia trocar de identidade dentro do sistema.

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

Novos registros, planos, perfil selecionado e estado do menu são armazenados no `localStorage`. A opção **Restaurar base inicial**, disponível no seletor de perfil, recupera os dados originais.

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
│   └── notare.test.mjs
├── app.js           # Fluxos, renderização e eventos
├── core.js          # Utilitários, datas e reconciliação de dados
├── data.js          # Base fictícia versionada
├── index.html       # Estrutura das telas
├── styles.css       # Identidade visual e responsividade
├── ui.js            # Componentes de interação compartilhados
└── package.json     # Comandos de validação
```

---

## 🚀 Como executar

1. Clone o repositório:

```bash
git clone https://github.com/guicunhasou/Notare.git
```

2. Entre na pasta:

```bash
cd Notare
```

3. Abra o arquivo `index.html` em um navegador moderno.

Também é possível iniciar um servidor local:

```bash
python3 -m http.server 4173
```

Depois, acesse `http://localhost:4173`.

---

## 🧪 Validação

Com o Node.js instalado, execute:

```bash
npm run check
```

O comando verifica a sintaxe dos arquivos JavaScript e executa os testes de dados, datas, permissões, acessibilidade estrutural, persistência e contratos dos principais fluxos.

---

## 🔒 Limites do MVP

- não existe autenticação conectada a um servidor;
- não há cobrança, assinatura eletrônica ou processamento comercial;
- nenhuma importação é enviada para um serviço externo;
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
