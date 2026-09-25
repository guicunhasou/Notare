window.NOTARE_SEED = {
  schemaVersion: 5,
  school: {
    id: "school-demo-001",
    name: "Escola Horizonte Vivo",
    shortLocation: "Cidade Modelo · Ensino Fundamental",
    address: "Alameda Horizonte Vivo, 120",
    contact: "(00) 0000-0000 · contato@horizontevivo.exemplo",
    code: "ESC-001"
  },
  profiles: [
    {
      id: "direcao",
      name: "Camila Duarte",
      initials: "CD",
      role: "Direção escolar",
      description: "Visão completa da unidade e de todos os acompanhamentos.",
      permissions: ["dashboard:view", "followup:view", "students:view", "records:view", "records:create", "occurrences:view", "occurrences:create", "plans:create", "privacy:view"],
      scope: "all"
    },
    {
      id: "coordenacao",
      name: "Rafael Nunes",
      initials: "RN",
      role: "Coordenação pedagógica",
      description: "Acompanha turmas, registros pedagógicos e planos de ação.",
      permissions: ["dashboard:view", "followup:view", "students:view", "records:view", "records:create", "occurrences:view", "occurrences:create", "plans:create"],
      scope: "all"
    },
    {
      id: "orientacao",
      name: "Lívia Moura",
      initials: "LM",
      role: "Orientação educacional",
      description: "Conduz acolhimentos, contatos familiares e devolutivas.",
      permissions: ["dashboard:view", "followup:view", "students:view", "records:view", "records:create", "occurrences:view", "occurrences:create", "plans:create"],
      scope: "followup"
    },
    {
      id: "docencia",
      name: "Bruno Reis",
      initials: "BR",
      role: "Docência · 8º B",
      description: "Visualiza a própria turma e registra sinais pedagógicos.",
      permissions: ["dashboard:view", "students:view", "records:view", "records:create", "occurrences:view", "occurrences:create"],
      scope: "class:8º B"
    },
    {
      id: "secretaria",
      name: "Daniela Prado",
      initials: "DP",
      role: "Secretaria escolar",
      description: "Consulta cadastros e registra informações de frequência.",
      permissions: ["dashboard:view", "followup:view", "students:view", "records:view", "records:create"],
      scope: "attendance"
    }
  ],
  classes: [
    { id: "6a", label: "6º A", shift: "Manhã", students: 31 },
    { id: "6b", label: "6º B", shift: "Manhã", students: 30 },
    { id: "6c", label: "6º C", shift: "Tarde", students: 29 },
    { id: "7a", label: "7º A", shift: "Manhã", students: 30 },
    { id: "7b", label: "7º B", shift: "Tarde", students: 31 },
    { id: "8a", label: "8º A", shift: "Manhã", students: 30 },
    { id: "8b", label: "8º B", shift: "Manhã", students: 32 },
    { id: "9a", label: "9º A", shift: "Tarde", students: 32 },
    { id: "9c", label: "9º C", shift: "Tarde", students: 28 }
  ],
  analytics: {
    labels: ["05/08", "12/08", "19/08", "26/08", "02/09", "09/09", "16/09", "23/09"],
    attendance: [91, 90, 92, 89, 88, 87, 88, 89],
    byClass: {
      "6º A": [93, 92, 94, 91, 90, 91, 92, 92],
      "6º B": [90, 89, 91, 88, 87, 86, 88, 89],
      "6º C": [92, 91, 92, 90, 89, 90, 91, 91],
      "7º A": [89, 88, 90, 87, 86, 87, 88, 89],
      "7º B": [88, 87, 89, 86, 85, 86, 87, 88],
      "8º A": [91, 90, 91, 89, 87, 88, 89, 90],
      "8º B": [90, 89, 91, 88, 87, 89, 90, 91],
      "9º A": [86, 85, 87, 84, 83, 84, 85, 86],
      "9º C": [94, 93, 95, 92, 91, 92, 93, 94]
    }
  },
  students: [
    {
      id: "ana", name: "Ana Souza", initials: "AS", className: "8º B", code: "EST-014", priority: "alta", status: "Atenção alta",
      signals: "Frequência em queda · 3 faltas consecutivas", updated: "Hoje, 09:18", attendance: 78, consecutiveAbsences: 3, actionsCompleted: 1,
      metrics: [["78%", "frequência no mês", "−9 p.p. em 30 dias"], ["3", "faltas consecutivas", "última presença: 21/09"], ["1", "contato registrado", "sem retorno até agora"]],
      reason: "A frequência caiu, há faltas consecutivas e o primeiro contato ainda não teve retorno. A classificação apenas organiza os sinais; a decisão continua com a equipe.",
      contact: "há 3 dias · sem retorno", guardian: "Responsável familiar A.", preferredChannel: "Telefone cadastrado",
      timeline: [["25/09", "Docência registrou nova ausência no primeiro horário."], ["22/09", "Mensagem enviada ao responsável familiar."], ["18/09", "Queda de participação observada em sala."], ["15/09", "Sinal de frequência incluído no acompanhamento."]]
    },
    {
      id: "lucas", name: "Lucas Lima", initials: "LL", className: "9º A", code: "EST-027", priority: "media", status: "Acompanhar",
      signals: "Queda de participação · devolutiva pendente", updated: "Ontem, 16:40", attendance: 88, consecutiveAbsences: 0, actionsCompleted: 2,
      metrics: [["88%", "frequência no mês", "−3 p.p. em 30 dias"], ["1", "devolutiva pendente", "prazo: amanhã"], ["2", "ações realizadas", "uma resposta registrada"]],
      reason: "A participação diminuiu e existe uma devolutiva próxima do prazo. O histórico sugere acompanhamento, sem determinar uma conclusão sobre o estudante.",
      contact: "há 5 dias · respondido", guardian: "Responsável familiar L.", preferredChannel: "Aplicativo de mensagens",
      timeline: [["24/09", "Orientação solicitou devolutiva pedagógica."], ["20/09", "Conversa de acolhimento realizada."], ["17/09", "Sinal de participação registrado."]]
    },
    {
      id: "beatriz", name: "Beatriz Santos", initials: "BS", className: "9º C", code: "EST-031", priority: "evolucao", status: "Em evolução",
      signals: "Plano em andamento · presença regularizada", updated: "Há 2 dias", attendance: 94, consecutiveAbsences: 0, actionsCompleted: 3,
      metrics: [["94%", "frequência no mês", "+6 p.p. em 30 dias"], ["0", "faltas consecutivas", "presença regularizada"], ["3", "ações concluídas", "próxima revisão: 30/09"]],
      reason: "A presença melhorou após as ações combinadas. O caso permanece visível para que a equipe acompanhe a estabilidade dessa evolução.",
      contact: "há 4 dias · respondido", guardian: "Responsável familiar B.", preferredChannel: "Telefone cadastrado",
      timeline: [["23/09", "Presença regularizada na última semana."], ["19/09", "Família confirmou apoio ao plano."], ["16/09", "Plano de retorno iniciado."]]
    },
    {
      id: "joao", name: "João Oliveira", initials: "JO", className: "7º A", code: "EST-043", priority: "alta", status: "Atenção alta",
      signals: "4 ausências no mês · contato não concluído", updated: "Hoje, 08:05", attendance: 74, consecutiveAbsences: 2, actionsCompleted: 0,
      metrics: [["74%", "frequência no mês", "−12 p.p. em 30 dias"], ["2", "faltas consecutivas", "nova ausência hoje"], ["2", "tentativas de contato", "sem confirmação"]],
      reason: "A frequência apresenta queda relevante e ainda não houve confirmação de contato. A equipe deve validar o contexto antes de definir qualquer encaminhamento.",
      contact: "ontem · sem confirmação", guardian: "Responsável familiar J.", preferredChannel: "Telefone cadastrado",
      timeline: [["25/09", "Nova ausência registrada."], ["24/09", "Segunda tentativa de contato."], ["21/09", "Caso incluído na fila de prioridade."]]
    },
    {
      id: "marina", name: "Marina Costa", initials: "MC", className: "6º C", code: "EST-052", priority: "media", status: "Acompanhar",
      signals: "Mudança de comportamento · escuta agendada", updated: "Há 3 dias", attendance: 96, consecutiveAbsences: 0, actionsCompleted: 1,
      metrics: [["96%", "frequência no mês", "estável"], ["1", "escuta agendada", "prazo: 28/09"], ["1", "observação pedagógica", "aguardando devolutiva"]],
      reason: "A frequência está estável, mas a equipe registrou uma mudança que merece escuta. O acompanhamento evita conclusões antecipadas.",
      contact: "não necessário até agora", guardian: "Responsável familiar M.", preferredChannel: "Aplicativo de mensagens",
      timeline: [["22/09", "Escuta individual agendada."], ["21/09", "Observação pedagógica registrada."]]
    },
    {
      id: "gabriel", name: "Gabriel Rocha", initials: "GR", className: "8º B", code: "EST-058", priority: "evolucao", status: "Em evolução",
      signals: "Retorno confirmado · frequência em recuperação", updated: "Há 3 dias", attendance: 91, consecutiveAbsences: 0, actionsCompleted: 2,
      metrics: [["91%", "frequência no mês", "+4 p.p. em 30 dias"], ["0", "faltas consecutivas", "retorno confirmado"], ["2", "ações concluídas", "revisão em 7 dias"]],
      reason: "O retorno foi confirmado e a frequência está se recuperando. O caso segue em observação por um período combinado.",
      contact: "há 6 dias · respondido", guardian: "Responsável familiar G.", preferredChannel: "E-mail cadastrado",
      timeline: [["22/09", "Presença regular na semana."], ["18/09", "Plano revisado com a família."]]
    },
    {
      id: "isabela", name: "Isabela Freitas", initials: "IF", className: "6º A", code: "EST-063", priority: "media", status: "Acompanhar",
      signals: "2 faltas alternadas · primeiro contato realizado", updated: "Há 4 dias", attendance: 86, consecutiveAbsences: 0, actionsCompleted: 1,
      metrics: [["86%", "frequência no mês", "−5 p.p. em 30 dias"], ["2", "faltas alternadas", "últimos 10 dias"], ["1", "contato realizado", "aguardando devolutiva"]],
      reason: "As faltas não são consecutivas, mas a recorrência recente merece acompanhamento e escuta do contexto.",
      contact: "há 4 dias · aguardando retorno", guardian: "Responsável familiar I.", preferredChannel: "Telefone cadastrado",
      timeline: [["21/09", "Primeiro contato realizado."], ["19/09", "Segunda falta alternada registrada."]]
    },
    {
      id: "pedro", name: "Pedro Almeida", initials: "PA", className: "7º A", code: "EST-071", priority: "evolucao", status: "Em evolução",
      signals: "Ação concluída · participação retomada", updated: "Há 5 dias", attendance: 97, consecutiveAbsences: 0, actionsCompleted: 3,
      metrics: [["97%", "frequência no mês", "+3 p.p. em 30 dias"], ["0", "faltas consecutivas", "sem alertas"], ["3", "ações concluídas", "caso em revisão"]],
      reason: "A participação foi retomada após as ações acordadas. O acompanhamento continua até a revisão final.",
      contact: "há 8 dias · respondido", guardian: "Responsável familiar P.", preferredChannel: "Aplicativo de mensagens",
      timeline: [["20/09", "Participação retomada."], ["17/09", "Ação pedagógica concluída."]]
    },
    {
      id: "sofia", name: "Sofia Martins", initials: "SM", className: "8º B", code: "EST-077", priority: "media", status: "Acompanhar",
      signals: "Atividades não entregues · escuta prevista", updated: "Ontem, 11:20", attendance: 93, consecutiveAbsences: 0, actionsCompleted: 0,
      metrics: [["93%", "frequência no mês", "estável"], ["3", "atividades pendentes", "últimas duas semanas"], ["1", "escuta prevista", "prazo: 29/09"]],
      reason: "A frequência está estável, mas há uma sequência de atividades pendentes. A equipe registrou o sinal para compreender o contexto.",
      contact: "ainda não realizado", guardian: "Responsável familiar S.", preferredChannel: "Telefone cadastrado",
      timeline: [["24/09", "Escuta pedagógica prevista."], ["23/09", "Terceira atividade pendente registrada."]]
    },
    {
      id: "thiago", name: "Thiago Barros", initials: "TB", className: "9º A", code: "EST-084", priority: "alta", status: "Atenção alta",
      signals: "5 faltas no mês · retorno interrompido", updated: "Hoje, 10:15", attendance: 69, consecutiveAbsences: 2, actionsCompleted: 1,
      metrics: [["69%", "frequência no mês", "−14 p.p. em 30 dias"], ["5", "faltas no mês", "duas consecutivas"], ["1", "plano interrompido", "revisão urgente"]],
      reason: "A frequência segue em queda e o retorno combinado foi interrompido. A equipe precisa revisar o plano junto ao estudante e à família.",
      contact: "há 2 dias · respondido", guardian: "Responsável familiar T.", preferredChannel: "Telefone cadastrado",
      timeline: [["25/09", "Segunda ausência consecutiva."], ["23/09", "Família informou dificuldade de rotina."], ["16/09", "Primeiro plano criado."]]
    },
    {
      id: "lara", name: "Lara Fernandes", initials: "LF", className: "9º C", code: "EST-091", priority: "evolucao", status: "Em evolução",
      signals: "Devolutiva concluída · sem novas ausências", updated: "Há 6 dias", attendance: 98, consecutiveAbsences: 0, actionsCompleted: 2,
      metrics: [["98%", "frequência no mês", "+5 p.p. em 30 dias"], ["0", "novas ausências", "há 18 dias"], ["2", "ações concluídas", "monitoramento mensal"]],
      reason: "Não houve novas ausências desde a devolutiva. A equipe mantém uma revisão mensal para confirmar a estabilidade.",
      contact: "há 10 dias · respondido", guardian: "Responsável familiar L.", preferredChannel: "E-mail cadastrado",
      timeline: [["19/09", "Devolutiva concluída."], ["12/09", "Acompanhamento mensal definido."]]
    },
    {
      id: "enrico", name: "Enrico Azevedo", initials: "EA", className: "6º C", code: "EST-103", priority: "media", status: "Acompanhar",
      signals: "Chegadas tardias · conversa agendada", updated: "Hoje, 07:55", attendance: 92, consecutiveAbsences: 0, actionsCompleted: 0,
      metrics: [["92%", "frequência no mês", "estável"], ["4", "chegadas tardias", "últimos 12 dias"], ["1", "conversa agendada", "prazo: 26/09"]],
      reason: "A frequência geral está estável, mas há repetição de chegadas tardias. O caso foi sinalizado para diálogo, sem julgamento prévio.",
      contact: "ainda não realizado", guardian: "Responsável familiar E.", preferredChannel: "Aplicativo de mensagens",
      timeline: [["25/09", "Quarta chegada tardia registrada."], ["24/09", "Conversa agendada com orientação."]]
    },
    {
      id: "caio", name: "Caio Mendes", initials: "CM", className: "6º B", code: "EST-108", priority: "alta", status: "Atenção alta",
      signals: "Frequência abaixo de 80% · contato pendente", updated: "Hoje, 10:40", attendance: 76, consecutiveAbsences: 2, actionsCompleted: 0,
      metrics: [["76%", "frequência no mês", "−11 p.p. em 30 dias"], ["2", "faltas consecutivas", "última presença: 22/09"], ["0", "contatos concluídos", "primeira tentativa hoje"]],
      reason: "A frequência caiu abaixo de 80% e o contato ainda não foi concluído. A equipe precisa compreender o contexto antes de propor uma ação.",
      contact: "hoje · aguardando retorno", guardian: "Responsável familiar C.", preferredChannel: "Telefone cadastrado",
      timeline: [["25/09", "Primeira tentativa de contato."], ["24/09", "Segunda ausência consecutiva."]]
    },
    {
      id: "julia", name: "Júlia Andrade", initials: "JA", className: "6º B", code: "EST-112", priority: "evolucao", status: "Em evolução",
      signals: "Presença regularizada · plano em revisão", updated: "Há 2 dias", attendance: 95, consecutiveAbsences: 0, actionsCompleted: 2,
      metrics: [["95%", "frequência no mês", "+7 p.p. em 30 dias"], ["0", "faltas consecutivas", "regular há 3 semanas"], ["2", "ações concluídas", "revisão em 02/10"]],
      reason: "A presença foi regularizada após o plano combinado. O acompanhamento permanece aberto até a revisão final.",
      contact: "há 7 dias · respondido", guardian: "Responsável familiar J.", preferredChannel: "Aplicativo de mensagens",
      timeline: [["23/09", "Terceira semana com presença regular."], ["18/09", "Plano revisado com a família."]]
    },
    {
      id: "matheus", name: "Matheus Ribeiro", initials: "MR", className: "6º A", code: "EST-119", priority: "media", status: "Acompanhar",
      signals: "Faltas alternadas · devolutiva agendada", updated: "Ontem, 14:10", attendance: 84, consecutiveAbsences: 0, actionsCompleted: 1,
      metrics: [["84%", "frequência no mês", "−6 p.p. em 30 dias"], ["3", "faltas alternadas", "últimos 15 dias"], ["1", "devolutiva agendada", "prazo: 27/09"]],
      reason: "As faltas alternadas aumentaram no período. A devolutiva ajudará a equipe a identificar possíveis barreiras à presença.",
      contact: "há 2 dias · respondido", guardian: "Responsável familiar M.", preferredChannel: "Telefone cadastrado",
      timeline: [["24/09", "Devolutiva agendada."], ["20/09", "Terceira falta alternada registrada."]]
    },
    {
      id: "luana", name: "Luana Gomes", initials: "LG", className: "7º B", code: "EST-124", priority: "alta", status: "Atenção alta",
      signals: "Frequência crítica · retorno familiar pendente", updated: "Hoje, 08:30", attendance: 72, consecutiveAbsences: 3, actionsCompleted: 0,
      metrics: [["72%", "frequência no mês", "−13 p.p. em 30 dias"], ["3", "faltas consecutivas", "nova ausência hoje"], ["2", "tentativas de contato", "sem retorno"]],
      reason: "A frequência segue em queda, com três faltas consecutivas e contato ainda sem retorno. O caso requer acolhimento e verificação de contexto.",
      contact: "ontem · sem retorno", guardian: "Responsável familiar L.", preferredChannel: "Telefone cadastrado",
      timeline: [["25/09", "Terceira ausência consecutiva."], ["24/09", "Segunda tentativa de contato."]]
    },
    {
      id: "davi", name: "Davi Carvalho", initials: "DC", className: "7º B", code: "EST-131", priority: "media", status: "Acompanhar",
      signals: "Participação reduzida · escuta marcada", updated: "Há 2 dias", attendance: 89, consecutiveAbsences: 0, actionsCompleted: 1,
      metrics: [["89%", "frequência no mês", "−2 p.p. em 30 dias"], ["1", "escuta marcada", "prazo: 30/09"], ["2", "observações pedagógicas", "sem conclusão antecipada"]],
      reason: "A frequência está próxima da média, mas houve redução de participação registrada por diferentes docentes. Uma escuta foi marcada.",
      contact: "não realizado", guardian: "Responsável familiar D.", preferredChannel: "Aplicativo de mensagens",
      timeline: [["23/09", "Escuta marcada com orientação."], ["18/09", "Segunda observação pedagógica."]]
    },
    {
      id: "yasmin", name: "Yasmin Pereira", initials: "YP", className: "7º A", code: "EST-138", priority: "evolucao", status: "Em evolução",
      signals: "Ações concluídas · participação retomada", updated: "Há 4 dias", attendance: 96, consecutiveAbsences: 0, actionsCompleted: 3,
      metrics: [["96%", "frequência no mês", "+5 p.p. em 30 dias"], ["0", "faltas consecutivas", "sem alertas recentes"], ["3", "ações concluídas", "monitoramento quinzenal"]],
      reason: "A estudante retomou a participação e mantém presença regular. O caso permanece em monitoramento quinzenal.",
      contact: "há 9 dias · respondido", guardian: "Responsável familiar Y.", preferredChannel: "E-mail cadastrado",
      timeline: [["21/09", "Participação retomada."], ["15/09", "Ação pedagógica concluída."]]
    },
    {
      id: "alice", name: "Alice Monteiro", initials: "AM", className: "8º A", code: "EST-145", priority: "media", status: "Acompanhar",
      signals: "Duas ausências · contato realizado", updated: "Hoje, 11:05", attendance: 87, consecutiveAbsences: 1, actionsCompleted: 1,
      metrics: [["87%", "frequência no mês", "−4 p.p. em 30 dias"], ["2", "ausências no mês", "uma nesta semana"], ["1", "contato realizado", "família respondeu"]],
      reason: "Houve duas ausências recentes, mas o contato familiar foi concluído. A equipe acompanhará a presença na próxima semana.",
      contact: "hoje · respondido", guardian: "Responsável familiar A.", preferredChannel: "Aplicativo de mensagens",
      timeline: [["25/09", "Família respondeu ao contato."], ["24/09", "Segunda ausência no mês."]]
    },
    {
      id: "miguel", name: "Miguel Araújo", initials: "MA", className: "8º A", code: "EST-151", priority: "alta", status: "Atenção alta",
      signals: "4 faltas consecutivas · sem contato confirmado", updated: "Hoje, 09:50", attendance: 73, consecutiveAbsences: 4, actionsCompleted: 0,
      metrics: [["73%", "frequência no mês", "−15 p.p. em 30 dias"], ["4", "faltas consecutivas", "última presença: 18/09"], ["2", "tentativas de contato", "sem confirmação"]],
      reason: "Quatro faltas consecutivas e ausência de contato confirmado tornam necessária uma verificação imediata do contexto.",
      contact: "hoje · sem confirmação", guardian: "Responsável familiar M.", preferredChannel: "Telefone cadastrado",
      timeline: [["25/09", "Segunda tentativa de contato."], ["24/09", "Quarta ausência consecutiva."]]
    },
    {
      id: "heloisa", name: "Heloísa Cardoso", initials: "HC", className: "8º B", code: "EST-159", priority: "evolucao", status: "Em evolução",
      signals: "Frequência recuperada · acompanhamento leve", updated: "Há 5 dias", attendance: 97, consecutiveAbsences: 0, actionsCompleted: 2,
      metrics: [["97%", "frequência no mês", "+8 p.p. em 30 dias"], ["0", "faltas consecutivas", "regular há 4 semanas"], ["2", "ações concluídas", "revisão em 04/10"]],
      reason: "A frequência foi recuperada e está estável. O caso permanece aberto apenas para a revisão combinada.",
      contact: "há 12 dias · respondido", guardian: "Responsável familiar H.", preferredChannel: "E-mail cadastrado",
      timeline: [["20/09", "Quarta semana de presença regular."], ["13/09", "Acompanhamento reduzido."]]
    },
    {
      id: "vinicius", name: "Vinícius Lopes", initials: "VL", className: "9º A", code: "EST-166", priority: "media", status: "Acompanhar",
      signals: "Rendimento oscilante · reunião prevista", updated: "Ontem, 13:25", attendance: 85, consecutiveAbsences: 0, actionsCompleted: 1,
      metrics: [["85%", "frequência no mês", "−5 p.p. em 30 dias"], ["1", "reunião prevista", "prazo: 01/10"], ["2", "devolutivas recebidas", "ações em definição"]],
      reason: "A frequência e o rendimento oscilaram no período. A equipe reunirá as devolutivas antes de definir o próximo passo.",
      contact: "há 3 dias · respondido", guardian: "Responsável familiar V.", preferredChannel: "Telefone cadastrado",
      timeline: [["24/09", "Reunião pedagógica prevista."], ["22/09", "Segunda devolutiva recebida."]]
    },
    {
      id: "manuela", name: "Manuela Dias", initials: "MD", className: "9º C", code: "EST-173", priority: "evolucao", status: "Em evolução",
      signals: "Plano concluído · presença estável", updated: "Há 7 dias", attendance: 94, consecutiveAbsences: 0, actionsCompleted: 3,
      metrics: [["94%", "frequência no mês", "+4 p.p. em 30 dias"], ["0", "faltas consecutivas", "estável há 20 dias"], ["3", "ações concluídas", "encerramento previsto"]],
      reason: "O plano foi concluído e a presença segue estável. Falta apenas a devolutiva final para encerrar o acompanhamento.",
      contact: "há 8 dias · respondido", guardian: "Responsável familiar M.", preferredChannel: "Aplicativo de mensagens",
      timeline: [["18/09", "Plano concluído."], ["12/09", "Presença estabilizada."]]
    },
    {
      id: "arthur", name: "Arthur Teixeira", initials: "AT", className: "9º A", code: "EST-181", priority: "media", status: "Acompanhar",
      signals: "Chegadas tardias · orientação realizada", updated: "Há 2 dias", attendance: 90, consecutiveAbsences: 0, actionsCompleted: 1,
      metrics: [["90%", "frequência no mês", "estável"], ["5", "chegadas tardias", "últimas 3 semanas"], ["1", "orientação realizada", "revisão: 03/10"]],
      reason: "A presença está estável, mas as chegadas tardias são recorrentes. A orientação já foi realizada e terá revisão.",
      contact: "há 5 dias · respondido", guardian: "Responsável familiar A.", preferredChannel: "Telefone cadastrado",
      timeline: [["23/09", "Orientação individual realizada."], ["20/09", "Quinta chegada tardia registrada."]]
    }
  ],
  records: [
    { id: "rec-001", kind: "Ausência", studentId: "ana", description: "Nova ausência registrada no primeiro horário.", date: "25/09/2026", ownerId: "docencia", followup: true },
    { id: "rec-002", kind: "Devolutiva", studentId: "lucas", description: "Orientação solicitou retorno da equipe pedagógica.", date: "24/09/2026", ownerId: "orientacao", followup: true },
    { id: "rec-003", kind: "Contato", studentId: "beatriz", description: "Família confirmou apoio ao plano de retorno.", date: "19/09/2026", ownerId: "orientacao", followup: false },
    { id: "rec-004", kind: "Ocorrência", studentId: "marina", description: "Mudança de participação observada e encaminhada para escuta.", date: "21/09/2026", ownerId: "docencia", followup: true },
    { id: "rec-005", kind: "Contato", studentId: "joao", description: "Segunda tentativa de contato, ainda sem confirmação.", date: "24/09/2026", ownerId: "orientacao", followup: true },
    { id: "rec-006", kind: "Devolutiva", studentId: "gabriel", description: "Equipe confirmou evolução na frequência e na participação.", date: "22/09/2026", ownerId: "coordenacao", followup: false },
    { id: "rec-007", kind: "Ausência", studentId: "isabela", description: "Segunda falta alternada registrada nos últimos dez dias.", date: "19/09/2026", ownerId: "secretaria", followup: true },
    { id: "rec-008", kind: "Devolutiva", studentId: "pedro", description: "Participação retomada após ação pedagógica.", date: "20/09/2026", ownerId: "docencia", followup: false },
    { id: "rec-009", kind: "Ocorrência", studentId: "sofia", description: "Sequência de atividades não entregues registrada para escuta.", date: "23/09/2026", ownerId: "docencia", followup: true },
    { id: "rec-010", kind: "Ausência", studentId: "thiago", description: "Segunda ausência consecutiva após interrupção do retorno.", date: "25/09/2026", ownerId: "secretaria", followup: true },
    { id: "rec-011", kind: "Devolutiva", studentId: "lara", description: "Sem novas ausências desde a última devolutiva.", date: "19/09/2026", ownerId: "coordenacao", followup: false },
    { id: "rec-012", kind: "Ocorrência", studentId: "enrico", description: "Quarta chegada tardia registrada no período.", date: "25/09/2026", ownerId: "secretaria", followup: true },
    { id: "rec-013", kind: "Contato", studentId: "ana", description: "Mensagem enviada ao responsável familiar.", date: "22/09/2026", ownerId: "orientacao", followup: true },
    { id: "rec-014", kind: "Contato", studentId: "thiago", description: "Família respondeu e relatou dificuldade de rotina.", date: "23/09/2026", ownerId: "orientacao", followup: true },
    { id: "rec-015", kind: "Devolutiva", studentId: "lara", description: "Acompanhamento mensal definido com a equipe.", date: "12/09/2026", ownerId: "coordenacao", followup: false },
    { id: "rec-016", kind: "Ocorrência", studentId: "lucas", description: "Queda de participação observada em duas aulas.", date: "17/09/2026", ownerId: "docencia", followup: true },
    { id: "rec-017", kind: "Ausência", studentId: "caio", description: "Segunda ausência consecutiva registrada.", date: "24/09/2026", ownerId: "secretaria", followup: true },
    { id: "rec-018", kind: "Contato", studentId: "caio", description: "Primeira tentativa de contato realizada.", date: "25/09/2026", ownerId: "orientacao", followup: true },
    { id: "rec-019", kind: "Devolutiva", studentId: "julia", description: "Presença regular confirmada pela equipe.", date: "23/09/2026", ownerId: "coordenacao", followup: false },
    { id: "rec-020", kind: "Ausência", studentId: "matheus", description: "Terceira falta alternada no período.", date: "20/09/2026", ownerId: "secretaria", followup: true },
    { id: "rec-021", kind: "Ausência", studentId: "luana", description: "Terceira ausência consecutiva registrada.", date: "25/09/2026", ownerId: "secretaria", followup: true },
    { id: "rec-022", kind: "Contato", studentId: "luana", description: "Segunda tentativa de contato sem retorno.", date: "24/09/2026", ownerId: "orientacao", followup: true },
    { id: "rec-023", kind: "Ocorrência", studentId: "davi", description: "Participação reduzida observada por docentes.", date: "18/09/2026", ownerId: "docencia", followup: true },
    { id: "rec-024", kind: "Devolutiva", studentId: "yasmin", description: "Participação retomada e presença regular.", date: "21/09/2026", ownerId: "coordenacao", followup: false },
    { id: "rec-025", kind: "Contato", studentId: "alice", description: "Família respondeu e confirmou acompanhamento.", date: "25/09/2026", ownerId: "orientacao", followup: false },
    { id: "rec-026", kind: "Ausência", studentId: "miguel", description: "Quarta ausência consecutiva registrada.", date: "24/09/2026", ownerId: "secretaria", followup: true },
    { id: "rec-027", kind: "Contato", studentId: "miguel", description: "Segunda tentativa de contato sem confirmação.", date: "25/09/2026", ownerId: "orientacao", followup: true },
    { id: "rec-028", kind: "Devolutiva", studentId: "heloisa", description: "Frequência recuperada e acompanhamento reduzido.", date: "20/09/2026", ownerId: "coordenacao", followup: false },
    { id: "rec-029", kind: "Devolutiva", studentId: "vinicius", description: "Segunda devolutiva pedagógica recebida.", date: "22/09/2026", ownerId: "coordenacao", followup: true },
    { id: "rec-030", kind: "Devolutiva", studentId: "manuela", description: "Plano concluído e presença estabilizada.", date: "18/09/2026", ownerId: "orientacao", followup: false },
    { id: "rec-031", kind: "Ocorrência", studentId: "arthur", description: "Quinta chegada tardia registrada.", date: "20/09/2026", ownerId: "secretaria", followup: true },
    { id: "rec-032", kind: "Devolutiva", studentId: "arthur", description: "Orientação individual realizada.", date: "23/09/2026", ownerId: "orientacao", followup: true }
  ],
  plans: [
    { id: "plan-001", studentId: "beatriz", type: "Plano de retorno", ownerId: "orientacao", owner: "Lívia Moura · Orientação educacional", date: "2026-09-30", status: "active", notes: "Revisar estabilidade da frequência e participação.", family: true, created: "16/09/2026" },
    { id: "plan-002", studentId: "gabriel", type: "Revisão pedagógica", ownerId: "coordenacao", owner: "Rafael Nunes · Coordenação pedagógica", date: "2026-10-01", status: "active", notes: "Confirmar manutenção da frequência.", family: false, created: "18/09/2026" },
    { id: "plan-003", studentId: "pedro", type: "Acompanhamento de participação", ownerId: "docencia", owner: "Bruno Reis · Docência", date: "2026-09-28", status: "review", notes: "Concluir revisão após retomada da participação.", family: false, created: "17/09/2026" },
    { id: "plan-004", studentId: "thiago", type: "Contato com responsável", ownerId: "orientacao", owner: "Lívia Moura · Orientação educacional", date: "2026-09-26", status: "overdue", notes: "Rever plano interrompido com estudante e família.", family: true, created: "16/09/2026" },
    { id: "plan-005", studentId: "lara", type: "Monitoramento mensal", ownerId: "coordenacao", owner: "Rafael Nunes · Coordenação pedagógica", date: "2026-10-12", status: "active", notes: "Confirmar estabilidade no próximo ciclo.", family: false, created: "12/09/2026" },
    { id: "plan-006", studentId: "julia", type: "Revisão de frequência", ownerId: "coordenacao", owner: "Rafael Nunes · Coordenação pedagógica", date: "2026-10-02", status: "review", notes: "Confirmar estabilidade antes do encerramento.", family: true, created: "18/09/2026" },
    { id: "plan-007", studentId: "luana", type: "Contato com responsável", ownerId: "orientacao", owner: "Lívia Moura · Orientação educacional", date: "2026-09-26", status: "overdue", notes: "Compreender as ausências e combinar retorno.", family: true, created: "24/09/2026" },
    { id: "plan-008", studentId: "yasmin", type: "Monitoramento quinzenal", ownerId: "coordenacao", owner: "Rafael Nunes · Coordenação pedagógica", date: "2026-10-05", status: "active", notes: "Acompanhar a manutenção da participação.", family: false, created: "15/09/2026" },
    { id: "plan-009", studentId: "heloisa", type: "Revisão de encerramento", ownerId: "orientacao", owner: "Lívia Moura · Orientação educacional", date: "2026-10-04", status: "active", notes: "Revisar indicadores antes do encerramento.", family: false, created: "13/09/2026" },
    { id: "plan-010", studentId: "manuela", type: "Devolutiva final", ownerId: "orientacao", owner: "Lívia Moura · Orientação educacional", date: "2026-09-30", status: "review", notes: "Realizar devolutiva e encerrar acompanhamento.", family: true, created: "18/09/2026" }
  ],
  agenda: [
    { time: "14:00", title: "Contato com responsável", studentId: "ana", ownerId: "orientacao" },
    { time: "15:30", title: "Escuta individual", studentId: "marina", ownerId: "orientacao" },
    { time: "Amanhã", title: "Revisar devolutiva", studentId: "lucas", ownerId: "coordenacao" },
    { time: "26/09", title: "Revisar plano interrompido", studentId: "thiago", ownerId: "direcao" },
    { time: "28/09", title: "Conversa pedagógica", studentId: "sofia", ownerId: "docencia" },
    { time: "11:30", title: "Contato com responsável", studentId: "caio", ownerId: "orientacao" },
    { time: "13:45", title: "Revisar ausências", studentId: "luana", ownerId: "coordenacao" },
    { time: "27/09", title: "Devolutiva pedagógica", studentId: "matheus", ownerId: "coordenacao" },
    { time: "30/09", title: "Escuta individual", studentId: "davi", ownerId: "orientacao" },
    { time: "01/10", title: "Reunião pedagógica", studentId: "vinicius", ownerId: "coordenacao" }
  ]
};
