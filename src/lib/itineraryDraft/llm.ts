import Anthropic from '@anthropic-ai/sdk';
import { CandidateSpot, GenerateDraftInput, LlmDraftOutput } from './types';
import { buildSystemPrompt, buildUserContent, PLACE_TYPES } from './prompt';
import { draftLog } from './debug';

// ADR-0009: 初版は claude-haiku-4-5（コスト・速度重視、約2円/回）
const MODEL = 'claude-haiku-4-5';
const TOOL_NAME = 'emit_itinerary_draft';

// LLM の構造化出力を強制するツール定義（strict tool use）。
// strict:true のため、任意項目は null 許容(["string","null"])にして required に含める。
const DRAFT_TOOL = {
  name: TOOL_NAME,
  description: '組み立てた旅程ドラフトを構造化して出力する',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'description', 'days'],
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      days: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['chosenSpotId', 'activities'],
          properties: {
            chosenSpotId: { type: ['string', 'null'] },
            activities: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: [
                  'title',
                  'type',
                  'placeName',
                  'description',
                  'startTime',
                  'endTime',
                ],
                properties: {
                  title: { type: 'string' },
                  type: { type: 'string', enum: PLACE_TYPES },
                  placeName: { type: ['string', 'null'] },
                  description: { type: ['string', 'null'] },
                  startTime: { type: ['string', 'null'] },
                  endTime: { type: ['string', 'null'] },
                },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * LLM プロバイダの抽象。ADR-0009 の「プロバイダ抽象の裏に置き、後で
 * ローカルLLM等に差し替えられるようにする」ための最小インターフェイス。
 */
export type DraftLlm = {
  generate(
    input: GenerateDraftInput,
    candidatesByDay: CandidateSpot[][],
    repairNote?: string,
  ): Promise<LlmDraftOutput>;
};

export const anthropicDraftLlm: DraftLlm = {
  async generate(input, candidatesByDay, repairNote) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY が設定されていません');
    }

    const client = new Anthropic();
    const t0 = Date.now();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: buildSystemPrompt(),
      tools: [DRAFT_TOOL] as unknown as Anthropic.Messages.ToolUnion[],
      tool_choice: { type: 'tool', name: TOOL_NAME },
      messages: [
        {
          role: 'user',
          content: buildUserContent(input, candidatesByDay, repairNote),
        },
      ],
    });

    // 診断用（一時ログ）: 実トークン数・実コスト・LLM所要時間
    // Haiku 4.5: 入力 $1 / 出力 $5 per 1M tokens
    const u = response.usage;
    const costUsd = (u.input_tokens / 1e6) * 1 + (u.output_tokens / 1e6) * 5;
    draftLog('LLM', {
      model: MODEL,
      llmMs: Date.now() - t0,
      inputTokens: u.input_tokens,
      outputTokens: u.output_tokens,
      costUsd: Number(costUsd.toFixed(5)),
      costJPY: Math.round(costUsd * 150 * 100) / 100,
    });

    const toolBlock = response.content.find(
      (block) => block.type === 'tool_use' && block.name === TOOL_NAME,
    );
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error('LLMが旅程ドラフトを出力しませんでした');
    }

    return toolBlock.input as LlmDraftOutput;
  },
};
