import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { OpenRouterAnalysisDto } from './dto/openrouter-analysis.dto';

type OpenRouterResponse = {
  id: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

@Injectable()
export class AnalysisService {
  async analyzeWithOpenRouter(payload: OpenRouterAnalysisDto) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENROUTER_API_KEY is not configured.',
      );
    }

    const model = payload.model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    const userPrompt = payload.context
      ? `${payload.prompt}\n\nContext:\n${payload.context}`
      : payload.prompt;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(process.env.OPENROUTER_SITE_URL
          ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL }
          : {}),
        ...(process.env.OPENROUTER_APP_NAME
          ? { 'X-Title': process.env.OPENROUTER_APP_NAME }
          : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are an academic analytics assistant. Provide concise, actionable insights.',
          },
          { role: 'user', content: userPrompt },
        ],
        temperature: payload.temperature ?? 0.3,
        max_tokens: payload.maxTokens ?? 600,
      }),
    });

    const data = (await response.json()) as OpenRouterResponse;

    if (!response.ok) {
      throw new BadGatewayException(
        data?.error?.message || 'OpenRouter request failed.',
      );
    }

    return {
      provider: 'openrouter',
      model: data.model || model,
      text: data.choices?.[0]?.message?.content || '',
      usage: data.usage || null,
      requestId: data.id || null,
    };
  }
}
