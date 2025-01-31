import OpenAI from 'openai';

// 使用 DeepSeek API 进行文本翻译
export async function translateWithDeepSeek(text: string, targetLanguage: string) {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        targetLanguage,
        service: 'deepseek'
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || '翻译请求失败');
    }

    const result = await response.json();

    if (!result.text) {
      throw new Error('翻译结果为空');
    }

    return result.text.trim();
  } catch (error: any) {
    console.error('DeepSeek translation error:', error);
    throw error;
  }
}

// 使用通义千问 API 进行文本翻译
export async function translateWithQwen(text: string, targetLanguage: string) {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        targetLanguage,
        service: 'qwen'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '翻译请求失败');
    }

    if (!result.text) {
      throw new Error('翻译结果为空');
    }

    return result.text.trim();
  } catch (error: any) {
    console.error('Qwen translation error:', error);
    throw new Error(error.message || '翻译失败，请稍后重试');
  }
}

// 使用智谱 GLM4 API 进行文本翻译
export async function translateWithZhipu(text: string, targetLanguage: string) {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        targetLanguage,
        service: 'zhipu'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '翻译请求失败');
    }

    if (!result.text) {
      throw new Error('翻译结果为空');
    }

    return result.text.trim();
  } catch (error: any) {
    console.error('Zhipu translation error:', error);
    throw new Error(error.message || '翻译失败，请稍后重试');
  }
}

// 使用腾讯混元 API 进行文本翻译
export async function translateWithHunyuan(text: string, targetLang: string) {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        targetLanguage: targetLang,
        service: 'hunyuan'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '翻译请求失败');
    }

    if (!result.text) {
      throw new Error('翻译结果为空');
    }

    return result.text.trim();
  } catch (error: any) {
    console.error('Error translating with Hunyuan:', error);
    throw new Error(error.message || '翻译失败，请稍后重试');
  }
}

// 使用 OpenAI 4o-mini API 进行文本翻译
export async function translateWith4oMini(text: string, targetLanguage: string) {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        targetLanguage,
        service: '4o-mini'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '翻译请求失败');
    }

    if (!result.text) {
      throw new Error('翻译结果为空');
    }

    return result.text.trim();
  } catch (error: any) {
    console.error('OpenAI translation error:', error);
    throw new Error(error.message || '翻译失败，请稍后重试');
  }
}

// 使用 MinniMax abab6.5s-chat API 进行文本翻译
export async function translateWithMinniMax(text: string, targetLanguage: string) {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        targetLanguage,
        service: 'minnimax'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '翻译请求失败');
    }

    if (!result.text) {
      throw new Error('翻译结果为空');
    }

    return result.text.trim();
  } catch (error: any) {
    console.error('MinniMax translation error:', error);
    throw new Error(error.message || '翻译失败，请稍后重试');
  }
}

// 使用 SiliconFlow Llama-3.3 API 进行文本翻译
export async function translateWithSiliconFlow(text: string, targetLanguage: string) {
  try {
    const response = await fetch('/api/translate/siliconflow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        targetLanguage,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '翻译请求失败');
    }

    if (!result.text) {
      throw new Error('翻译结果为空');
    }

    return result.text.trim();
  } catch (error: any) {
    console.error('SiliconFlow translation error:', error);
    throw new Error(error.message || '翻译失败，请稍后重试');
  }
}

// 使用 OpenRouter API 的 Claude 3.5 进行文本翻译
export async function translateWithClaude(text: string, targetLanguage: string) {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        targetLanguage,
        service: 'claude-3.5'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '翻译请求失败');
    }

    if (!result.text) {
      throw new Error('翻译结果为空');
    }

    return result.text.trim();
  } catch (error: any) {
    console.error('Claude translation error:', error);
    throw new Error(error.message || '翻译失败，请稍后重试');
  }
}

export async function translateWithKimiAPI(text: string, targetLanguage: string) {
  const apiKey = process.env.NEXT_PUBLIC_KIMI_API_KEY;
  if (!apiKey) {
    throw new Error('Kimi API key not found');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.moonshot.cn/v1',
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'moonshot-v1-128k',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Keep the original format and style.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const translatedText = completion.choices[0]?.message?.content;
    if (!translatedText) {
      throw new Error('No translation result');
    }

    return translatedText;
  } catch (error: any) {
    console.error('Kimi translation error:', error);
    throw new Error(error.message || 'Translation failed');
  }
}

export async function translateWithStepAPI(text: string, targetLanguage: string) {
  try {
    const response = await fetch('/api/translate/step', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        targetLanguage
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.translation) {
      throw new Error('No translation result');
    }

    return data.translation;
  } catch (error: any) {
    console.error('Step translation error:', error);
    throw new Error(error.message || 'Translation failed');
  }
} 