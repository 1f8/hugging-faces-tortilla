import axios from 'axios'

const getFirst = (arr:any[]) => {
  if (!arr.length) return ''
  return arr[0]
}

/** For questions see HF documentation: https://huggingface.co/inference-api */
export class HuggingFacesTortilla {
  private apiKey: string

  constructor(apiKey:string) {
    this.apiKey = apiKey
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  private getEndpoint(modelID:string) {
    return `https://api-inference.huggingface.co/models/${modelID}`
  }

  requestCompletion(modelID:string, inputs:any) {
    return axios.post(
      this.getEndpoint(modelID),
      inputs,
      { headers: this.getHeaders() },
    )
    .then(res => res.data)
  }

  /** 英語だけ
   *  例: Can you please let us know more details about your
   *  答: experience
   *  https://huggingface.co/gpt2
  */
  async completionGPT2(query:string):Promise<string> {
    const res = await this.requestCompletion('gpt2', {
      inputs: query,
      parameters: {
        temperature: 1,
        max_new_tokens: 10,
        repetition_penalty: 50,
        return_full_text: false,
      },
    })
    return getFirst(res)?.generated_text || ''
  }

  /** 英語だけ
   *  例: The meaing of life is [MASK].
   *  答: [ 'simple', 'unknown', 'life', 'infinite', 'different' ]
  */
  async completionBert(query:string):Promise<string[]> {
    const res = await this.requestCompletion('bert-base-uncased', {
      inputs: query,
    })
    return res?.map(r => r.token_str) || []
  }

  /** 英語だけ
  */
  async summarizationBart(text:string):Promise<string> {
    const res = await this.requestCompletion('facebook/bart-large-cnn', {
      inputs: text,
      // parameters: {
      //   temperature: 1,
      //   repetition_penalty: 50,
      // },
    })
    return getFirst(res)?.summary_text || text
  }

  /** 英語だけ
   *  https://huggingface.co/google/tapas-base-finetuned-wtq
  */
  async tableAnswerTapas(query:string, table:Record<string,string[]>):Promise<TableAnswerTapasResponse> {
    const res = await this.requestCompletion('google/tapas-base-finetuned-wtq', {
      inputs: { query, table },
      // parameters: {
      //   temperature: 1,
      //   repetition_penalty: 50,
      // },
    })
    return res
  }

  /** 英語だけ
  */
  async sentimentDistilbert(query:string):Promise<SentimentDistilbertResponse> {
    const res = await this.requestCompletion('distilbert-base-uncased-finetuned-sst-2-english', {
      inputs: query,
    })
    const negative = getFirst(res)?.find(r => r.label==='NEGATIVE')?.score || 0
    const positive = getFirst(res)?.find(r => r.label==='POSITIVE')?.score || 0
    return {
      negative,
      positive,
      result: negative > positive ? 'NEGATIVE' : positive > negative ? 'POSITIVE' : 'NEUTRAL'
    }
  }

}

interface TableAnswerTapasResponse {
  answer: string
  coordinates: number[][]
  cells: string[]
  aggregator: string  // AVERAGE
}

interface SentimentDistilbertResponse {
  negative: number
  positive: number
  result: 'NEGATIVE'|'POSITIVE'|'NEUTRAL'
}
