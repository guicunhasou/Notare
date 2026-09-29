# Notare — acompanhamento e permanência escolar

Aplicação local para organizar sinais de frequência, contatos, ocorrências, devolutivas e planos de ação.

## Funcionalidades

- jornada guiada que demonstra acesso institucional, contratação, configuração da equipe e acesso individual;
- painel inicial com gráfico de frequência e indicadores;
- saudação, data e calendário de três semanas atualizados automaticamente;
- menu lateral expansível e recolhível;
- central de notificações ancorada ao sino, com banners e avisos automáticos após 90 e 180 segundos;
- fotos da escola, da equipe e dos estudantes aplicadas à interface;
- fila de acompanhamento escolar com filtros e pesquisa;
- perfil do estudante com sinais explicáveis e histórico;
- registro de ausências, contatos, ocorrências e devolutivas, com autoria vinculada ao perfil conectado;
- sugestão simulada de texto, produzida por regras locais e identificada como recurso demonstrativo;
- criação de planos com responsável e prazo;
- consulta ao plano e ao escopo da contratação institucional;
- histórico compartilhado e persistência local;
- troca de perfil, exclusiva do MVP, com permissões e recortes diferentes.

## Escola e perfis

A interface utiliza a **Escola Horizonte Vivo**, com logotipo, endereço e contato próprios. Há cinco perfis de acesso:

- Direção escolar;
- Coordenação pedagógica;
- Orientação educacional;
- Docência, limitada às turmas 8º A e 8º B;
- Secretaria escolar, sem acesso a registros de ocorrências.

As permissões alteram a navegação, o universo de estudantes, os registros visíveis e as ações disponíveis.

## Base interna

O arquivo `data.js` contém uma base versionada com:

- 8 turmas do 6º ao 9º ano;
- 96 estudantes, com 12 estudantes por turma;
- 32 registros;
- 10 planos de ação;
- agenda de atividades;
- séries históricas de frequência geral e por turma;
- perfis, permissões e relacionamentos entre os dados.

Novos registros, planos, perfil selecionado e estado do menu são persistidos no `localStorage`. A opção **Restaurar base inicial**, disponível no seletor de perfil, recupera os dados originais.

O sistema não calcula uma pontuação oculta nem toma decisões automatizadas sobre estudantes.
