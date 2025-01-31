import { NextResponse } from 'next/server'
import * as $OpenApi from '@alicloud/openapi-client'
import * as $STS20150401 from '@alicloud/sts20150401'

export async function GET() {
  try {
    if (!process.env.ALIYUN_ACCESS_KEY_ID || 
        !process.env.ALIYUN_ACCESS_KEY_SECRET || 
        !process.env.ALIYUN_RAM_ROLE_ARN || 
        !process.env.ALIYUN_OSS_BUCKET ||
        !process.env.ALIYUN_OSS_REGION) {
      throw new Error('缺少必要的环境变量配置');
    }

    // 打印 AccessKey 前缀，用于验证
    console.log('AccessKey 信息:', {
      accessKeyIdPrefix: process.env.ALIYUN_ACCESS_KEY_ID.substring(0, 8) + '****',
      region: process.env.ALIYUN_OSS_REGION,
      bucket: process.env.ALIYUN_OSS_BUCKET
    });

    console.log('RAM 角色信息:', {
      roleArn: process.env.ALIYUN_RAM_ROLE_ARN,
      accountId: process.env.ALIYUN_RAM_ROLE_ARN.split('::')[1]?.split(':')[0]
    });

    const config = new $OpenApi.Config({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'sts.aliyuncs.com',
      regionId: 'cn-hangzhou'  // 使用默认的 cn-hangzhou 地区
    });

    const client = new $STS20150401.default(config);

    // 获取 STS token，有效期15分钟
    const result = await client.assumeRole({
      roleArn: process.env.ALIYUN_RAM_ROLE_ARN,
      roleSessionName: 'video-upload',
      durationSeconds: 900
    });

    console.log('STS 响应成功');

    // 检查返回结果的结构
    if (!result.body || !result.body.credentials) {
      console.error('无效的 STS 响应结构:', result);
      throw new Error('无效的 STS 响应');
    }

    return NextResponse.json({
      success: true,
      data: {
        region: process.env.ALIYUN_OSS_REGION,
        bucket: process.env.ALIYUN_OSS_BUCKET,
        credentials: {
          accessKeyId: result.body.credentials.accessKeyId,
          accessKeySecret: result.body.credentials.accessKeySecret,
          securityToken: result.body.credentials.securityToken,
          expiration: result.body.credentials.expiration
        }
      }
    });
  } catch (error: any) {
    console.error('获取 STS token 失败:', error);
    console.error('详细错误信息:', {
      code: error.code,
      message: error.message,
      data: error.data,
      statusCode: error.statusCode,
      stack: error.stack
    });
    return NextResponse.json({
      success: false,
      message: `获取上传凭证失败: ${error.message || '未知错误'}`,
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
        statusCode: error.statusCode
      }
    }, { status: 500 });
  }
} 