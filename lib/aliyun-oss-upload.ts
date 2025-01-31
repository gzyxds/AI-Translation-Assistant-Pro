import OSS from 'ali-oss';

interface STSToken {
  region: string;
  bucket: string;
  credentials: {
    accessKeyId: string;
    accessKeySecret: string;
    securityToken: string;
    expiration: string;
  };
}

export async function getSTSToken(): Promise<STSToken> {
  const response = await fetch('/api/aliyun/oss/sts');
  if (!response.ok) {
    throw new Error('获取上传凭证失败');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || '获取上传凭证失败');
  }
  return result.data;
}

export async function uploadToOSS(file: File): Promise<string> {
  const stsToken = await getSTSToken();
  
  const client = new OSS({
    region: stsToken.region,
    accessKeyId: stsToken.credentials.accessKeyId,
    accessKeySecret: stsToken.credentials.accessKeySecret,
    stsToken: stsToken.credentials.securityToken,
    bucket: stsToken.bucket,
    secure: true,
    timeout: 120000,  // 增加超时时间到 120 秒
    refreshSTSToken: async () => {
      const refreshedToken = await getSTSToken();
      return {
        accessKeyId: refreshedToken.credentials.accessKeyId,
        accessKeySecret: refreshedToken.credentials.accessKeySecret,
        stsToken: refreshedToken.credentials.securityToken
      };
    },
    retryMax: 3,  // 最大重试次数
    headerEncoding: 'utf-8'
  });

  // 生成唯一的文件名
  const ext = file.name.split('.').pop();
  const filename = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    // 使用断点续传
    const result = await client.multipartUpload(filename, file, {
      parallel: 4,  // 并发上传分片数
      partSize: 1024 * 1024,  // 分片大小 1MB
      progress: function (p, checkpoint) {
        // 可以添加上传进度回调
        console.log('上传进度:', Math.floor(p * 100) + '%');
      }
    });

    // 返回文件的 URL
    return client.generateObjectUrl(result.name);
  } catch (error: any) {
    console.error('上传文件到 OSS 失败:', error);
    throw new Error(error.message || '上传文件失败');
  }
} 