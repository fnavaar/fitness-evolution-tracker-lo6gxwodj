import pb from '@/lib/pocketbase/client'
import {
  streamAgentChat,
  type StreamAgentChatHandlers,
  type StreamAgentChatResult,
} from '@/lib/skipAi'

/* ----------------- Tipos ----------------- */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CoachProfileSnapshot {
  goal?: string
  current_weight?: number
  height?: number
  activity_level?: string
  training_frequency?: number
  dietary_preference?: string
  restrictions?: string
}

/* ----------------- Endpoint ----------------- */

const COACH_ENDPOINT = '/backend/v1/coach-chat'

/**
 * Envia o histórico de mensagens ao agente Coach Rocha no backend e devolve
 * a `Response` bruta (SSE) para ser consumida via `streamCoachChat`.
 *
 * O runtime do agente mantém o histórico da conversa server-side (por
 * `conversation_id`), então enviamos apenas a última mensagem do usuário +
 * o `context` de personalização na primeira rodada.
 */
export async function sendMessage(
  messages: ChatMessage[],
  opts: { conversationId?: string | null; context?: string; signal?: AbortSignal } = {},
): Promise<Response> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}${COACH_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token || '',
    },
    body: JSON.stringify({
      message: lastUser?.content ?? '',
      conversation_id: opts.conversationId ?? null,
      context: opts.context ?? '',
    }),
    signal: opts.signal,
  })
  return res
}

/**
 * Consome o stream SSE do agente, chamando os handlers a cada chunk.
 * Resolve quando o turno termina (`done`); lança em abort/erro.
 */
export async function streamCoachChat(
  res: Response,
  handlers: StreamAgentChatHandlers,
): Promise<StreamAgentChatResult> {
  return streamAgentChat(res, handlers)
}

/* ----------------- Histórico de conversas ----------------- */

export interface Conversation {
  id: string
  title: string // primeira mensagem do usuário
  created: string // ISO date
  updated: string
}

export interface RawAgentMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  created: string
}

/**
 * Lista as conversas anteriores do usuário autenticado com o agente
 * fitness-coach, mais recentes primeiro.
 */
export async function listConversations(limit = 50): Promise<Conversation[]> {
  const res = await fetch(
    `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/coach/conversations?limit=${limit}`,
    {
      method: 'GET',
      headers: {
        Authorization: pb.authStore.token || '',
      },
    },
  )
  if (!res.ok) {
    let msg = 'Não foi possível carregar suas conversas.'
    try {
      const body = await res.json()
      if (typeof body?.error === 'string') msg = body.error
    } catch {
      /* ignora */
    }
    throw new Error(msg)
  }
  const data = await res.json()
  // A resposta do runtime é um array; normalizamos campos.
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { conversations?: unknown })?.conversations)
      ? (data as { conversations: unknown[] }).conversations
      : []
  return (list as Record<string, unknown>[]).map((c) => {
    const title =
      (typeof c.title === 'string' && c.title) ||
      (typeof c.first_message === 'string' && c.first_message) ||
      (typeof c.last_message === 'string' && c.last_message) ||
      'Conversa'
    return {
      id: String(c.id ?? c.conversation_id ?? ''),
      title,
      created: typeof c.created === 'string' ? c.created : String(c.created ?? ''),
      updated:
        typeof c.updated === 'string'
          ? c.updated
          : typeof c.created === 'string'
            ? c.created
            : String(c.updated ?? ''),
    }
  })
}

/**
 * Exclui permanentemente uma conversa do usuário autenticado.
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  const res = await fetch(
    `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/coach/conversations/${encodeURIComponent(conversationId)}`,
    { method: 'DELETE', headers: { Authorization: pb.authStore.token || '' } },
  )
  if (!res.ok) {
    let msg = 'Não foi possível excluir a conversa.'
    try {
      const body = await res.json()
      if (typeof body?.error === 'string') msg = body.error
    } catch {
      /* ignora */
    }
    throw new Error(msg)
  }
}

/**
 * Renomeia o título de uma conversa do usuário autenticado.
 */
export async function renameConversation(conversationId: string, title: string): Promise<void> {
  const res = await fetch(
    `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/coach/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: pb.authStore.token || '' },
      body: JSON.stringify({ title }),
    },
  )
  if (!res.ok) {
    let msg = 'Não foi possível renomear a conversa.'
    try {
      const body = await res.json()
      if (typeof body?.error === 'string') msg = body.error
    } catch {
      /* ignora */
    }
    throw new Error(msg)
  }
}

/**
 * Carrega as mensagens de uma conversa anterior, filtrando apenas as
 * mensagens exibíveis (role user/assistant com conteúdo).
 */
export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await fetch(
    `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/coach/conversations/${encodeURIComponent(
      conversationId,
    )}/messages`,
    {
      method: 'GET',
      headers: {
        Authorization: pb.authStore.token || '',
      },
    },
  )
  if (!res.ok) {
    let msg = 'Não foi possível carregar as mensagens.'
    try {
      const body = await res.json()
      if (typeof body?.error === 'string') msg = body.error
    } catch {
      /* ignora */
    }
    throw new Error(msg)
  }
  const data = await res.json()
  // Resposta pode ser um array de mensagens ou { messages: [...] }.
  const raw = Array.isArray(data)
    ? (data as RawAgentMessage[])
    : Array.isArray((data as { messages?: unknown })?.messages)
      ? (data as { messages: RawAgentMessage[] }).messages
      : []

  return raw
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length > 0,
    )
    .map((m) => ({
      id: String(m.id ?? ''),
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }))
}

/* ----------------- Personalização ----------------- */

const GOAL_LABELS: Record<string, string> = {
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Hipertrofia',
  condicionamento: 'Condicionamento',
  resistencia: 'Resistência',
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentario: 'Sedentário',
  levemente_ativo: 'Levemente ativo',
  moderadamente_ativo: 'Moderadamente ativo',
  muito_ativo: 'Muito ativo',
}

const DIET_LABELS: Record<string, string> = {
  onivoro: 'Onívoro',
  vegetariano: 'Vegetariano',
  vegano: 'Vegano',
}

/**
 * Monta um texto de contexto com os dados reais do atleta para anexar à
 * primeira mensagem — garante que o coach "saiba" do objetivo, peso atual,
 * treino e dieta ativos mesmo antes de chamar as ferramentas.
 */
export async function loadCoachContext(userId: string): Promise<string> {
  const lines: string[] = []

  // Perfil
  let profile: CoachProfileSnapshot | null = null
  try {
    const res = await pb.collection('profiles').getList(1, 1, {
      filter: `user_id = "${userId}"`,
    })
    if (res.items.length > 0) {
      profile = res.items[0] as unknown as CoachProfileSnapshot
    }
  } catch {
    /* ignora */
  }

  if (profile) {
    if (profile.goal) lines.push(`- Objetivo: ${GOAL_LABELS[profile.goal] || profile.goal}`)
    if (profile.current_weight) lines.push(`- Peso atual (cadastro): ${profile.current_weight} kg`)
    if (profile.height) lines.push(`- Altura: ${profile.height} cm`)
    if (profile.activity_level)
      lines.push(
        `- Nível de atividade: ${ACTIVITY_LABELS[profile.activity_level] || profile.activity_level}`,
      )
    if (profile.training_frequency)
      lines.push(`- Frequência de treino pretendida: ${profile.training_frequency}x por semana`)
    if (profile.dietary_preference)
      lines.push(
        `- Preferência alimentar: ${DIET_LABELS[profile.dietary_preference] || profile.dietary_preference}`,
      )
    if (profile.restrictions) lines.push(`- Restrições: ${profile.restrictions}`)
  } else {
    lines.push('- Perfil ainda não cadastrado.')
  }

  // Última entrada de progresso (peso mais recente)
  try {
    const prog = await pb.collection('progress').getList(1, 1, {
      filter: `user_id = "${userId}"`,
      sort: '-created',
    })
    if (prog.items.length > 0) {
      const p = prog.items[0] as unknown as { weight?: number; created?: string; body_fat?: number }
      if (p.weight) {
        const date = p.created
          ? new Date(p.created).toLocaleDateString('pt-BR')
          : 'data indisponível'
        lines.push(`- Último peso registrado: ${p.weight} kg (${date})`)
      }
      if (p.body_fat) lines.push(`- % de gordura recente: ${p.body_fat}%`)
    } else {
      lines.push('- Nenhuma entrada de progresso registrada ainda.')
    }
  } catch {
    /* ignora */
  }

  // Treino ativo
  try {
    const w = await pb.collection('workouts').getList(1, 1, {
      filter: `user_id = "${userId}" && status = "em_andamento"`,
      sort: '-created',
    })
    if (w.items.length > 0) {
      const wo = w.items[0] as unknown as { title?: string; days_per_week?: number }
      lines.push(
        `- Treino ativo: "${wo.title || 'Plano em andamento'}"${wo.days_per_week ? ` (${wo.days_per_week}x/semana)` : ''}`,
      )
    } else {
      lines.push('- Nenhum treino com status "em andamento" no momento.')
    }
  } catch {
    /* ignora */
  }

  // Dieta ativa
  try {
    const d = await pb.collection('diets').getList(1, 1, {
      filter: `user_id = "${userId}" && status = "em_andamento"`,
      sort: '-created',
    })
    if (d.items.length > 0) {
      const dt = d.items[0] as unknown as { title?: string; daily_calories?: number }
      lines.push(
        `- Dieta ativa: "${dt.title || 'Plano alimentar em andamento'}"${dt.daily_calories ? ` (${dt.daily_calories} kcal/dia)` : ''}`,
      )
    } else {
      lines.push('- Nenhuma dieta com status "em andamento" no momento.')
    }
  } catch {
    /* ignora */
  }

  return lines.join('\n')
}
