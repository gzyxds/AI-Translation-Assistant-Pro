import { NextResponse } from 'next/server';
import { sign } from '@/lib/server/tencent-sign';

const endpoint = 'asr.tencentcloudapi.com';
const service = 'asr';
const version = '2019-06-14';
const region = 'ap-guangzhou';
const action = 'DescribeTaskStatus';

export async function POST(request: Request) {
  try {
    const { taskId } = await request.json();

    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
      TaskId: taskId,
    };

    const signature = sign({
      secretId: process.env.TENCENT_SECRET_ID || '',
      secretKey: process.env.TENCENT_SECRET_KEY || '',
      endpoint,
      service,
      version,
      region,
      action,
      timestamp,
      payload: params,
    });

    const response = await fetch(`https://${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': signature,
        'X-TC-Action': action,
        'X-TC-Version': version,
        'X-TC-Region': region,
        'X-TC-Timestamp': timestamp.toString(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.Response?.Error?.Message || 'API request failed');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('查询任务状态失败:', error);
    return NextResponse.json(
      { error: error.message || '查询任务状态失败' },
      { status: 500 }
    );
  }
} 