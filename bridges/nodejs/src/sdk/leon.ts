import {
  INTENT_OBJECT,
  SKILL_CONFIG,
  SKILL_SRC_CONFIG
} from '@bridge/constants'

export interface ActionParams {
  lang: string
  utterance: string
  current_entities: unknown[] // TODO
  entities: unknown[] // TODO
  current_resolvers: unknown[] // TODO
  resolvers: unknown[] // TODO
  slots: Record<string, unknown>[] // TODO
}
export type ActionFunction = (params: ActionParams) => Promise<void>

export interface IntentObject extends ActionParams {
  id: string
  domain: string
  skill: string
  action: string
}

interface AnswerOutput extends IntentObject {
  output: {
    codes: string
    speech: string
    core?: AnswerCoreData
    options: Record<string, string>
  }
}

interface AnswerCoreData {
  restart?: boolean
  isInActionLoop?: boolean
  showNextActionSuggestions?: boolean
  showSuggestions?: boolean
}

interface TextAnswer {
  key: string
  data?: AnswerData
  core?: AnswerCoreData
}

interface WidgetAnswer {
  // TODO
  key: 'widget'
  data?: AnswerData
  core?: AnswerCoreData
}

type AnswerData = Record<string, string | number> | null
type AnswerInput = TextAnswer | WidgetAnswer

class Leon {
  private static instance: Leon

  constructor() {
    if (!Leon.instance) {
      Leon.instance = this
    }
  }

  /**
   * Get source configuration
   * @example getSRCConfig() // { credentials: { apiKey: 'abc' } }
   */
  public getSRCConfig<T>(key: string): T
  public getSRCConfig<T extends Record<string, unknown>>(key?: undefined): T
  public getSRCConfig<T extends Record<string, unknown> | unknown>(
    key?: string
  ): T {
    try {
      if (key) {
        return SKILL_SRC_CONFIG[key] as T
      }

      return SKILL_SRC_CONFIG as T
    } catch (e) {
      console.error('Error while getting source configuration:', e)

      return {} as T
    }
  }

  /**
   * Apply data to the answer
   * @param answerKey The answer key
   * @param data The data to apply
   * @example setAnswerData('key', { name: 'Leon' })
   */
  public setAnswerData(
    answerKey: string,
    data: AnswerData = null
  ): string | null {
    try {
      // In case the answer key is a raw answer
      if (SKILL_CONFIG.answers == null || !SKILL_CONFIG.answers[answerKey]) {
        return answerKey
      }

      const answers = SKILL_CONFIG.answers[answerKey] ?? ''
      let answer: string

      if (Array.isArray(answers)) {
        answer = answers[Math.floor(Math.random() * answers.length)] ?? ''
      } else {
        answer = answers
      }

      if (data) {
        for (const key in data) {
          answer = answer.replaceAll(`%${key}%`, String(data[key]))
        }
      }

      if (SKILL_CONFIG.variables) {
        const { variables } = SKILL_CONFIG

        for (const key in variables) {
          answer = answer.replaceAll(`%${key}%`, String(variables[key]))
        }
      }

      return answer
    } catch (e) {
      console.error('Error while setting answer data:', e)

      return null
    }
  }

  /**
   * Send an answer to the core
   * @param answerInput The answer input
   * @example answer({ key: 'greet' }) // 'Hello world'
   * @example answer({ key: 'welcome', data: { name: 'Louis' } }) // 'Welcome Louis'
   * @example answer({ key: 'confirm', core: { restart: true } }) // 'Would you like to retry?'
   */
  public async answer(answerInput: AnswerInput): Promise<void> {
    try {
      const answerObject: AnswerOutput = {
        ...INTENT_OBJECT,
        output: {
          codes: answerInput.key,
          speech: this.setAnswerData(answerInput.key, answerInput.data) ?? '',
          core: answerInput.core,
          options: this.getSRCConfig('options')
        }
      }

      process.stdout.write(JSON.stringify(answerObject))
    } catch (e) {
      console.error('Error while creating answer:', e)
    }
  }
}

export const leon = new Leon()
