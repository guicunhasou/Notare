# Notare — acompanhamento e permanência escolar

Aplicação local para organizar sinais de frequência, contatos, ocorrências, devolutivas e planos de ação.

## Funcionalidades

- painel inicial com gráfico de frequência e indicadores;
- menu lateral expansível e recolhível;
- fila de busca ativa escolar com filtros e pesquisa;
- perfil do estudante com sinais explicáveis e histórico;
- registro de ausências, contatos, ocorrências e devolutivas;
- criação de planos com responsável e prazo;
- histórico compartilhado e persistência local;
- troca de perfil com permissões e recortes diferentes.

## Escola e perfis

A interface utiliza a **Escola Horizonte Vivo**, com logotipo, endereço e contato próprios. Há cinco perfis de acesso:

- Direção escolar;
- Coordenação pedagógica;
- Orientação educacional;
- Docência, limitada à turma 8º B;
- Secretaria escolar, sem acesso a registros de ocorrências.

As permissões alteram a navegação, o universo de estudantes, os registros visíveis e as ações disponíveis.

## Base interna

O arquivo `data.js` contém uma base versionada com:

- 9 turmas exclusivamente do 6º ao 9º ano;
- 24 estudantes;
- 32 registros;
- 10 planos de ação;
- agenda de atividades;
- séries históricas de frequência geral e por turma;
- perfis, permissões e relacionamentos entre os dados.

Novos registros, planos, perfil selecionado e estado do menu são persistidos no `localStorage`. A opção **Restaurar base inicial**, disponível no seletor de perfil, recupera os dados originais.

O sistema não calcula uma pontuação oculta nem toma decisões automatizadas sobre estudantes.

## Como executar

Você pode abrir `index.html` diretamente no navegador ou servir esta pasta com um servidor HTTP estático:

```sh
python3 -m http.server 4173
```

Depois, acesse `http://localhost:4173`.
