/// <reference path="../pb_data/types.d.ts" />
// Expande o catálogo de exercícios de ~10 para 45 exercícios, cobrindo os
// 7 muscle_group × 5 equipment × 3 difficulty. Permite ao Especialista de
// Treinos montar treinos variados e equilibrados (antes o catálogo limitava
// a variedade e forçava "o mais similar").
//
// Idempotente: cria apenas exercícios cujo `name` ainda não existe.
migrate(
  (app) => {
    const exercisesCol = app.findCollectionByNameOrId('exercises')

    const exerciseList = [
      // ── PERNAS (dominante de joelho + quadril) ──
      {
        name: 'Agachamento Livre',
        muscle_group: 'pernas',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Posicione a barra sobre os trapézios. Mantenha os pés afastados na largura dos ombros, coluna ereta. Agache flexionando joelhos e quadril até as coxas ficarem paralelas ao chão. Retorne mantendo os calcanhares no chão.',
      },
      {
        name: 'Agachamento Frontal',
        muscle_group: 'pernas',
        equipment: 'barra',
        difficulty: 'avancado',
        instructions:
          'Apoie a barra na parte frontal dos ombros, com cotovelos elevados. Agache mantendo o tronco ereto e os calcanhares no chão, até as coxas ficarem paralelas. Retorne à posição inicial.',
      },
      {
        name: 'Leg Press 45°',
        muscle_group: 'pernas',
        equipment: 'maquina',
        difficulty: 'iniciante',
        instructions:
          'Sente-se na máquina com os pés na plataforma na largura dos ombros. Flexione os joelhos até aproximadamente 90 graus, mantendo a lombar apoiada. Empurre a plataforma estendendo os joelhos sem travar.',
      },
      {
        name: 'Cadeira Extensora',
        muscle_group: 'pernas',
        equipment: 'maquina',
        difficulty: 'iniciante',
        instructions:
          'Sente-se com a almofada sobre o tornozelo. Estenda os joelhos até a extensão completa, contraindo o quadríceps no topo. Desça controlando o movimento.',
      },
      {
        name: 'Mesa Flexora',
        muscle_group: 'pernas',
        equipment: 'maquina',
        difficulty: 'iniciante',
        instructions:
          'Deite-se de bruços com a almofada sobre o calcanhar. Flexione os joelhos trazendo os calcanhares em direção aos glúteos. Desça controlando o movimento.',
      },
      {
        name: 'Cadeira Flexora',
        muscle_group: 'pernas',
        equipment: 'maquina',
        difficulty: 'iniciante',
        instructions:
          'Sente-se na máquina com a almofada sobre o tornozelo. Flexione os joelhos puxando a almofada para baixo e para trás, contraindo os posteriores. Retorne de forma controlada.',
      },
      {
        name: 'Afundo',
        muscle_group: 'pernas',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Segurando um halter em cada mão, dê um passo à frente. Flexione ambos os joelhos até formar um ângulo de 90 graus com a perna da frente. Retorne e alterne a perna.',
      },
      {
        name: 'Afundo Búlgaro',
        muscle_group: 'pernas',
        equipment: 'halteres',
        difficulty: 'intermediario',
        instructions:
          'Com um pé apoiado em um banco atrás, flexione o joelho da frente até a coxa ficar paralela ao chão. Mantenha o tronco ereto. Empurre com o calcanhar para voltar.',
      },
      {
        name: 'Passada Caminhando',
        muscle_group: 'pernas',
        equipment: 'halteres',
        difficulty: 'intermediario',
        instructions:
          'Com halteres nas mãos, dê passadas alternadas para a frente, flexionando os joelhos até ~90 graus. Mantenha o tronco ereto e o equilíbrio.',
      },
      {
        name: 'Stiff',
        muscle_group: 'pernas',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Segure a barra com pegada pronada. Com os joelhos levemente flexionados, flexione o quadril empurrando o quadril para trás, descendo a barra ao longo das coxas. Retorne contraindo os posteriores e glúteos.',
      },
      {
        name: 'Levantamento Terra',
        muscle_group: 'pernas',
        equipment: 'barra',
        difficulty: 'avancado',
        instructions:
          'Fique de pé com a barra sobre o meio dos pés. Flexione quadril e joelhos para segurar a barra. Mantenha o peito aberto e as costas retas. Eleve a barra estendendo quadril e joelhos simultaneamente.',
      },
      {
        name: 'Elevação Pélvica',
        muscle_group: 'gluteos',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Deite-se de costas com a barra apoiada sobre o quadril (com proteção). Empurre o quadril para cima contraindo os glúteos até o corpo formar uma linha reta. Desça controlando.',
      },
      {
        name: 'Glúteo na Polia',
        muscle_group: 'gluteos',
        equipment: 'cabos',
        difficulty: 'iniciante',
        instructions:
          'Com a tornozeleira presa à polia baixa, leve a perna para trás estendendo o quadril, contraindo o glúteo. Retorne de forma controlada.',
      },
      {
        name: 'Panturrilha em Pé',
        muscle_group: 'pernas',
        equipment: 'maquina',
        difficulty: 'iniciante',
        instructions:
          'Com os ombros apoiados na máquina e as pontas dos pés na plataforma, eleve os calcanhares o máximo possível. Desça lentamente até o alongamento.',
      },

      // ── PEITO ──
      {
        name: 'Supino Reto',
        muscle_group: 'peito',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Deite-se no banco plano. Segure a barra com pegada ligeiramente mais larga que os ombros. Desça até a linha do peito e empurre de volta até a extensão quase completa dos braços.',
      },
      {
        name: 'Supino Inclinado',
        muscle_group: 'peito',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Deite-se no banco inclinado a ~30 graus. Desça a barra até a parte superior do peito e empurre para cima e ligeiramente para trás.',
      },
      {
        name: 'Supino com Halteres',
        muscle_group: 'peito',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Deite-se no banco com um halter em cada mão. Desça os halteres até a linha do peito e empurre-os para cima até quase se encontrarem.',
      },
      {
        name: 'Crucifixo',
        muscle_group: 'peito',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Deite-se no banco com halteres acima do peito, palmas voltadas uma para a outra. Abra os braços em arco até sentir o alongamento no peito e volte.',
      },
      {
        name: 'Cross Over',
        muscle_group: 'peito',
        equipment: 'cabos',
        difficulty: 'iniciante',
        instructions:
          'Com as polias na altura dos ombros, puxe as alças para baixo e para a frente até as mãos se encontrarem à frente do corpo, contraindo o peito.',
      },
      {
        name: 'Supino na Máquina',
        muscle_group: 'peito',
        equipment: 'maquina',
        difficulty: 'iniciante',
        instructions:
          'Ajuste o assento para que as alças fiquem na linha do peito. Empurre as alças para a frente até a extensão quase completa e retorne controlando.',
      },
      {
        name: 'Flexão de Braço',
        muscle_group: 'peito',
        equipment: 'peso_corporal',
        difficulty: 'iniciante',
        instructions:
          'Apoie as mãos no chão na largura dos ombros, corpo alinhado. Desça o peito em direção ao chão flexionando os cotovelos e empurre de volta.',
      },

      // ── COSTAS ──
      {
        name: 'Remada Curvada',
        muscle_group: 'costas',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Incline o tronco a ~45 graus com a coluna neutra e joelhos levemente flexionados. Puxe a barra em direção ao abdômen, contraindo as escápulas na subida.',
      },
      {
        name: 'Remada Baixa',
        muscle_group: 'costas',
        equipment: 'cabos',
        difficulty: 'iniciante',
        instructions:
          'Sente-se com os pés apoiados e o tronco ereto. Puxe a alça em direção ao abdômen, contraindo as escápulas. Retorne estendendo os braços sem perder a postura.',
      },
      {
        name: 'Puxada Frontal',
        muscle_group: 'costas',
        equipment: 'cabos',
        difficulty: 'iniciante',
        instructions:
          'Sente-se na polia alta com as mãos na barra em pegada pronada. Puxe a barra em direção à parte superior do peito, contraindo as costas. Suba controlando.',
      },
      {
        name: 'Puxada Aberta',
        muscle_group: 'costas',
        equipment: 'cabos',
        difficulty: 'intermediario',
        instructions:
          'Na polia alta com pegada aberta, puxe a barra em direção à parte superior do peito, abrindo o peito e contraindo o dorsal. Retorne com controle.',
      },
      {
        name: 'Remada Unilateral com Halter',
        muscle_group: 'costas',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Apoie um joelho e uma mão em um banco. Com o halter na outra mão, puxe em direção ao quadril, contraindo a escápula. Desça controlando.',
      },
      {
        name: 'Remada na Máquina',
        muscle_group: 'costas',
        equipment: 'maquina',
        difficulty: 'iniciante',
        instructions:
          'Sente-se com o peito apoiado no suporte. Puxe as alças em direção ao corpo, contraindo as costas. Retorne controlando o peso.',
      },
      {
        name: 'Barra Fixa',
        muscle_group: 'costas',
        equipment: 'peso_corporal',
        difficulty: 'avancado',
        instructions:
          'Segure a barra com pegada pronada, mãos na largura dos ombros. Puxe o corpo para cima até o queixo ultrapassar a barra. Desça controlando até a extensão quase completa.',
      },

      // ── OMBROS ──
      {
        name: 'Desenvolvimento Militar',
        muscle_group: 'ombros',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Em pé ou sentado, apoie a barra no peitoral superior. Empurre verticalmente para cima da cabeça até os braços estenderem. Controle a descida até a clavícula.',
      },
      {
        name: 'Desenvolvimento com Halteres',
        muscle_group: 'ombros',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Sentado ou em pé, eleve os halteres das alturas dos ombros até a extensão dos braços acima da cabeça. Desça controlando até a altura dos ombros.',
      },
      {
        name: 'Elevação Lateral',
        muscle_group: 'ombros',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Segure os halteres ao lado das coxas. Com os cotovelos levemente flexionados, eleve os braços lateralmente até a altura dos ombros. Desça de forma lenta e controlada.',
      },
      {
        name: 'Elevação Frontal',
        muscle_group: 'ombros',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Com os halteres à frente das coxas, eleve os braços à frente até a altura dos ombros, mantendo os cotovelos levemente flexionados. Desça controlando.',
      },
      {
        name: 'Desenvolvimento na Máquina',
        muscle_group: 'ombros',
        equipment: 'maquina',
        difficulty: 'iniciante',
        instructions:
          'Ajuste o assento para que as alças fiquem na altura dos ombros. Empurre as alças para cima até a extensão quase completa e retorne controlando.',
      },
      {
        name: 'Crucifixo Inverso',
        muscle_group: 'ombros',
        equipment: 'halteres',
        difficulty: 'intermediario',
        instructions:
          'Incline o tronco à frente com a coluna neutra. Com os halteres pendentes, abra os braços lateralmente contraindo o deltoide posterior. Retorne controlando.',
      },
      {
        name: 'Face Pull',
        muscle_group: 'ombros',
        equipment: 'cabos',
        difficulty: 'iniciante',
        instructions:
          'Na polia alta com corda, puxe as pontas em direção ao rosto, abrindo os cotovelos para os lados e contraindo o deltoide posterior. Retorne controlando.',
      },

      // ── BRAÇOS ──
      {
        name: 'Rosca Direta',
        muscle_group: 'bracos',
        equipment: 'barra',
        difficulty: 'iniciante',
        instructions:
          'Em pé, segure a barra com pegada supinada. Com os cotovelos fixos ao lado do corpo, flexione-os trazendo a barra até a altura dos ombros. Desça controlando.',
      },
      {
        name: 'Rosca Alternada',
        muscle_group: 'bracos',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Em pé, com halteres nas mãos e cotovelos fixos, flexione um braço por vez trazendo o halter até o ombro. Desça controlando e alterne.',
      },
      {
        name: 'Rosca Martelo',
        muscle_group: 'bracos',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Com os halteres em pegada neutra (palmas voltadas uma para a outra), flexione os cotovelos trazendo os halteres até os ombros. Desça controlando.',
      },
      {
        name: 'Rosca Scott',
        muscle_group: 'bracos',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Apoie os braços no banco Scott. Flexione os cotovelos trazendo a barra em direção aos ombros. Desça controlando até a extensão quase completa.',
      },
      {
        name: 'Tríceps Corda',
        muscle_group: 'bracos',
        equipment: 'cabos',
        difficulty: 'iniciante',
        instructions:
          'Na polia alta com corda, incline levemente o corpo à frente. Com os cotovelos fixos, estenda os braços para baixo abrindo as pontas da corda no final.',
      },
      {
        name: 'Tríceps Testa',
        muscle_group: 'bracos',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Deitado no banco, segure a barra acima do peito e flexione os cotovelos descendo a barra em direção à testa. Estenda os cotovelos de volta.',
      },
      {
        name: 'Tríceps Francês',
        muscle_group: 'bracos',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Em pé ou sentado, segure um halter com as duas mãos acima da cabeça. Flexione os cotovelos descendo o halter atrás da cabeça e estenda de volta.',
      },
      {
        name: 'Mergulho no Banco',
        muscle_group: 'bracos',
        equipment: 'peso_corporal',
        difficulty: 'iniciante',
        instructions:
          'Apoie as mãos em um banco atrás do corpo, com as pernas estendidas. Flexione os cotovelos descendo o quadril e empurre de volta.',
      },
      {
        name: 'Tríceps na Polia',
        muscle_group: 'bracos',
        equipment: 'cabos',
        difficulty: 'iniciante',
        instructions:
          'Na polia alta com barra reta, com os cotovelos fixos ao lado do corpo, estenda os braços para baixo. Retorne controlando até a altura do peito.',
      },

      // ── CORE ──
      {
        name: 'Prancha',
        muscle_group: 'core',
        equipment: 'peso_corporal',
        difficulty: 'iniciante',
        instructions:
          'Apoie os antebraços e as pontas dos pés no chão. Mantenha o corpo alinhado da cabeça aos calcanhares, contraindo abdômen e glúteos.',
      },
      {
        name: 'Prancha Lateral',
        muscle_group: 'core',
        equipment: 'peso_corporal',
        difficulty: 'iniciante',
        instructions:
          'Apoie um antebraço no chão e mantenha o corpo em linha reta de lado. Contraia o abdômen e segure a posição. Alterne o lado.',
      },
      {
        name: 'Abdominal Remador',
        muscle_group: 'core',
        equipment: 'peso_corporal',
        difficulty: 'intermediario',
        instructions:
          'Deite-se e, em um movimento controlado, eleve o tronco e um joelho simultaneamente, tocando o cotovelo oposto no joelho. Alterne os lados.',
      },
      {
        name: 'Elevação de Pernas',
        muscle_group: 'core',
        equipment: 'peso_corporal',
        difficulty: 'intermediario',
        instructions:
          'Deitado, mantenha as pernas estendidas e eleve-as até ficarem perpendiculares ao chão, contraindo o abdômen. Desça controlando sem tocar o chão.',
      },
      {
        name: 'Prancha com Toque no Ombro',
        muscle_group: 'core',
        equipment: 'peso_corporal',
        difficulty: 'intermediario',
        instructions:
          'Na posição de prancha alta, toque o ombro oposto com uma mão, mantendo o quadril estável. Alterne os lados sem balançar o corpo.',
      },
      {
        name: 'Abdominal na Polia',
        muscle_group: 'core',
        equipment: 'cabos',
        difficulty: 'iniciante',
        instructions:
          'Ajoelhado na polia alta com corda, flexione o tronco contraindo o abdômen, trazendo os cotovelos em direção às coxas. Retorne controlando.',
      },
      {
        name: 'Russian Twist',
        muscle_group: 'core',
        equipment: 'peso_corporal',
        difficulty: 'iniciante',
        instructions:
          'Sentado com os joelhos flexionados e o tronco levemente inclinado, gire o tronco para os lados, tocando o chão ao lado do quadril. Mantenha o abdômen contraído.',
      },
      {
        name: 'Prancha com Elevação de Pernas',
        muscle_group: 'core',
        equipment: 'peso_corporal',
        difficulty: 'intermediario',
        instructions:
          'Na prancha alta, eleve uma perna estendida mantendo o quadril alinhado. Segure brevemente e alterne as pernas.',
      },
    ]

    let created = 0
    for (const exData of exerciseList) {
      try {
        app.findFirstRecordByData('exercises', 'name', exData.name)
      } catch (_) {
        const exRecord = new Record(exercisesCol)
        exRecord.set('name', exData.name)
        exRecord.set('muscle_group', exData.muscle_group)
        exRecord.set('equipment', exData.equipment)
        exRecord.set('difficulty', exData.difficulty)
        exRecord.set('instructions', exData.instructions)
        app.save(exRecord)
        created++
      }
    }
    console.log('[0034] exercícios criados:', created)
  },
  (app) => {
    // rollback: remove os exercícios adicionados (só os que este catálogo criou).
    const exerciseList = [
      'Agachamento Frontal',
      'Leg Press 45°',
      'Cadeira Extensora',
      'Mesa Flexora',
      'Cadeira Flexora',
      'Afundo Búlgaro',
      'Passada Caminhando',
      'Stiff',
      'Elevação Pélvica',
      'Glúteo na Polia',
      'Panturrilha em Pé',
      'Supino Inclinado',
      'Supino com Halteres',
      'Crucifixo',
      'Cross Over',
      'Supino na Máquina',
      'Flexão de Braço',
      'Remada Baixa',
      'Puxada Frontal',
      'Puxada Aberta',
      'Remada Unilateral com Halter',
      'Remada na Máquina',
      'Barra Fixa',
      'Desenvolvimento com Halteres',
      'Elevação Frontal',
      'Desenvolvimento na Máquina',
      'Crucifixo Inverso',
      'Face Pull',
      'Rosca Alternada',
      'Rosca Martelo',
      'Rosca Scott',
      'Tríceps Testa',
      'Tríceps Francês',
      'Mergulho no Banco',
      'Tríceps na Polia',
      'Prancha Lateral',
      'Abdominal Remador',
      'Elevação de Pernas',
      'Prancha com Toque no Ombro',
      'Abdominal na Polia',
      'Russian Twist',
      'Prancha com Elevação de Pernas',
    ]
    for (const name of exerciseList) {
      try {
        const rec = app.findFirstRecordByData('exercises', 'name', name)
        app.delete(rec)
      } catch (_) {}
    }
  },
)
