import OpenAI from 'openai';
import { sign } from '@/lib/server/tencent-sign';
import { translateWithKimiAPI } from '@/lib/server/translate';

export async function POST(request: Request) {
  try {
    const { text, targetLanguage, service } = await request.json();

    if (!text || !targetLanguage) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let translatedText;

    try {
      switch (service) {
        case 'deepseek':
          translatedText = await translateWithDeepSeekAPI(text, targetLanguage);
          break;
        case 'qwen':
          translatedText = await translateWithQwenAPI(text, targetLanguage);
          break;
        case 'zhipu':
          translatedText = await translateWithZhipuAPI(text, targetLanguage);
          break;
        case '4o-mini':
          translatedText = await translateWith4oMiniAPI(text, targetLanguage);
          break;
        case 'hunyuan':
          translatedText = await translateWithHunyuanAPI(text, targetLanguage);
          break;
        case 'minnimax':
          translatedText = await translateWithMinniMaxAPI(text, targetLanguage);
          break;
        case 'siliconflow':
          translatedText = await translateWithSiliconFlowAPI(text, targetLanguage);
          break;
        case 'claude_3_5':
          translatedText = await translateWithClaudeAPI(text, targetLanguage);
          break;
        case 'kimi':
          translatedText = await translateWithKimiAPI(text, targetLanguage);
          break;
        case 'step':
          translatedText = await translateWithStepAPI(text, targetLanguage);
          break;
        default:
          translatedText = await translateWithDeepSeekAPI(text, targetLanguage);
      }
    } catch (serviceError: any) {
      console.error(`${service} translation service error:`, serviceError);
      // 如果当前服务失败，尝试使用 DeepSeek 作为备选
      if (service !== 'deepseek') {
        console.log('Trying DeepSeek as fallback service...');
        translatedText = await translateWithDeepSeekAPI(text, targetLanguage);
      } else {
        throw serviceError;
      }
    }

    return new Response(JSON.stringify({ text: translatedText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    return new Response(JSON.stringify({ error: error.message || '翻译失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function translateWithDeepSeekAPI(text: string, targetLanguage: string) {
  const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DeepSeek API key not found');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com/v1'
  });

  const response = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text to ${targetLanguage}. Only return the translated text, no explanations.`
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  return response.choices[0].message.content || '';
}

async function translateWithQwenAPI(text: string, targetLanguage: string) {
  const apiKey = process.env.NEXT_PUBLIC_QWEN_API_KEY;
  if (!apiKey) {
    throw new Error('Qwen API key not found');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  });

  const response = await openai.chat.completions.create({
    model: 'qwen-max',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text to ${targetLanguage}. Only return the translated text, no explanations.`
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  return response.choices[0].message.content || '';
}

async function translateWithZhipuAPI(text: string, targetLanguage: string) {
  const apiKey = process.env.NEXT_PUBLIC_ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error('Zhipu API key not found');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4'
  });

  const response = await openai.chat.completions.create({
    model: 'glm-4',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text to ${targetLanguage}. Only return the translated text, no explanations.`
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  return response.choices[0].message.content || '';
}

async function translateWith4oMiniAPI(text: string, targetLanguage: string) {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.openai.com/v1'
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text to ${targetLanguage}. Only return the translated text, no explanations.`
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  return response.choices[0].message.content || '';
}

async function translateWithHunyuanAPI(text: string, targetLanguage: string) {
  const apiKey = process.env.NEXT_PUBLIC_TENCENT_API_KEY;
  if (!apiKey) {
    throw new Error('Tencent API key not found');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.hunyuan.cloud.tencent.com/v1'
  });

  const response = await openai.chat.completions.create({
    model: 'hunyuan-turbo',
    messages: [
      {
        role: 'system',
        content: `你是一个专业的翻译助手，请直接翻译文本，不要添加任何解释。`
      },
      {
        role: 'user',
        content: `将以下文本翻译成${targetLanguage}：\n\n${text}`
      }
    ],
    temperature: 0.1,
    top_p: 0.7,
    // @ts-expect-error key is not yet public
    enable_enhancement: true
  });

  return response.choices[0].message.content || '';
}

async function translateWithMinniMaxAPI(text: string, targetLanguage: string) {
  const apiKey = process.env.NEXT_PUBLIC_MINNIMAX_API_KEY;
  if (!apiKey) {
    throw new Error('MinniMax API key not found');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.minimax.chat/v1',
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'abab6.5s-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the text directly without any explanations.'
        },
        {
          role: 'user',
          content: `Translate to ${targetLanguage}:\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error('MinniMax translation error:', error);
    throw new Error(error.message || '翻译失败');
  }
}

async function translateWithSiliconFlowAPI(text: string, targetLanguage: string) {
  const apiKey = process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY;
  if (!apiKey) {
    throw new Error('SiliconFlow API key not found');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.siliconflow.com/v1'
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the text directly without any explanations.'
        },
        {
          role: 'user',
          content: `Translate to ${targetLanguage}:\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error('SiliconFlow translation error:', error);
    throw new Error(error.message || '翻译失败');
  }
}

async function translateWithClaudeAPI(text: string, targetLanguage: string) {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not found');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://openrouter.ai/api/v1'
  });

  const completion = await openai.chat.completions.create({
    model: 'anthropic/claude-3-haiku',
    messages: [
      {
        role: 'system',
        content: 'You are a professional translator. Translate the text directly without any explanations.'
      },
      {
        role: 'user',
        content: `Translate to ${targetLanguage}:\n${text}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  return completion.choices[0].message.content || '';
}

async function translateWithStepAPI(text: string, targetLanguage: string) {
  const apiKey = process.env.NEXT_PUBLIC_STEP_API_KEY;
  if (!apiKey) {
    throw new Error('Step API key not found');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.stepfun.com/v1'
  });

  const response = await openai.chat.completions.create({
    model: 'step-2-16k',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text to ${targetLanguage}. Only return the translated text, no explanations.`
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  return response.choices[0].message.content || '';
} 