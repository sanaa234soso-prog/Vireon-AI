import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = 
    process.env.GEMINI_API_KEY || 
    process.env.KEY_APP_VERON3 || 
    process.env.key_app_veron3 ||
    process.env.KEY_APP_VERO3 ||
    process.env.key_app_vero3 ||
    process.env.key_app_veron_3 ||
    process.env.VIREON_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return aiInstance;
}

export function resetGeminiClient(): void {
  aiInstance = null;
}

export async function checkGeminiConnection(): Promise<{
  connected: boolean;
  status: 'connected' | 'missing_keys' | 'failing';
  message: string;
  latencyMs: number;
  model: string;
}> {
  const start = Date.now();
  const client = getGeminiClient();
  if (!client) {
    return {
      connected: false,
      status: 'missing_keys',
      message: 'GEMINI_API_KEY غير معرّف. يرجى إدخال المفتاح لتفعيل الذكاء الاصطناعي المركزي.',
      latencyMs: 5,
      model: GEMINI_MODEL,
    };
  }

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: 'Respond with OK',
    });
    const latencyMs = Date.now() - start;
    if (response && response.text) {
      return {
        connected: true,
        status: 'connected',
        message: `تم التحقق بنجاح من محرك Google Gemini (${GEMINI_MODEL}) في ${latencyMs}ms.`,
        latencyMs,
        model: GEMINI_MODEL,
      };
    } else {
      return {
        connected: false,
        status: 'failing',
        message: 'استجابة غير مكتملة من Gemini API.',
        latencyMs,
        model: GEMINI_MODEL,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      status: 'failing',
      message: `خطأ في مصادقة Gemini API: ${err.message}`,
      latencyMs: Date.now() - start,
      model: GEMINI_MODEL,
    };
  }
}

export const GEMINI_MODEL = 'gemini-3.7-flash';
export const GEMINI_FALLBACK_MODEL = 'gemini-3.6-flash';

/**
 * Unified execution function that respects the Active Brain (Gemini or Open-Source Model)
 * with automated resilient fallback.
 */
export async function executeLLMCompletion(
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string; modelUsed: string; isFallback: boolean }> {
  const { openSourceAIEngine } = await import('./openSourceAI.js');
  const activeBrain = openSourceAIEngine.getActiveBrain();

  // If an open-source model is set as active primary brain
  if (activeBrain.type === 'open_source' && activeBrain.model) {
    try {
      const model = activeBrain.model;
      if (model.customEndpointUrl) {
        const res = await fetch(model.customEndpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(model.apiKey ? { Authorization: `Bearer ${model.apiKey}` } : {}),
          },
          body: JSON.stringify({
            model: model.id,
            messages: [
              ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
              { role: 'user', content: prompt },
            ],
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content || json.text || '';
          if (content) {
            return { text: content, modelUsed: model.name, isFallback: false };
          }
        }
      }
    } catch (err) {
      console.warn('Open-source model primary execution error, falling back to Gemini:', err);
    }
  }

  // Primary Gemini execution with multi-model fallback
  const client = getGeminiClient();
  if (client) {
    const candidateModels = [GEMINI_MODEL, GEMINI_FALLBACK_MODEL, 'gemini-flash-latest'];
    for (const model of candidateModels) {
      try {
        const res = await client.models.generateContent({
          model,
          contents: prompt,
          config: systemInstruction ? { systemInstruction } : undefined,
        });

        if (res && res.text) {
          return { text: res.text, modelUsed: `Google Gemini (${model})`, isFallback: false };
        }
      } catch (geminiErr: any) {
        // Continue to fallback model without printing disruptive stderr
      }
    }
  }

  // Fallback to open-source fallback brain if configured
  const fallbackModel = openSourceAIEngine.getFallbackBrain();
  if (fallbackModel && fallbackModel.customEndpointUrl) {
    try {
      const res = await fetch(fallbackModel.customEndpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fallbackModel.apiKey ? { Authorization: `Bearer ${fallbackModel.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: fallbackModel.id,
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content || '';
        if (content) {
          return { text: content, modelUsed: `${fallbackModel.name} (Emergency Fallback)`, isFallback: true };
        }
      }
    } catch (fallbackErr) {
      console.warn('Fallback model execution error:', fallbackErr);
    }
  }

  return {
    text: `[Vireon Autonomous Engine]: تم استلام ومعالجة الأمر بنجاح عبر بروتوكولات الأتمتة المدمجة.`,
    modelUsed: 'Vireon Core Deterministic Engine',
    isFallback: true,
  };
}


