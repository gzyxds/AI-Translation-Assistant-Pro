declare module '@alicloud/ocr-api20210707' {
  export class Client {
    constructor(config: any)
    recognizeVideoContentWithOptions(request: any, runtime: any): Promise<any>
    getAsyncJobResultWithOptions(request: any, runtime: any): Promise<any>
  }

  export class RecognizeVideoContentRequest {
    constructor(config: { videoURL: string })
  }

  export class GetAsyncJobResultRequest {
    constructor(config: { jobId: string })
  }
}

declare module '@alicloud/openapi-client' {
  export class Config {
    constructor(config: {
      accessKeyId: string
      accessKeySecret: string
      endpoint: string
      regionId: string
    })
  }
}

declare module '@alicloud/tea-util' {
  export class RuntimeOptions {
    constructor(options?: any)
  }
}

declare module 'ali-oss' {
  interface OSSOptions {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    stsToken?: string;
    secure?: boolean;
    timeout?: number;
    refreshSTSToken?: () => Promise<{
      accessKeyId: string;
      accessKeySecret: string;
      stsToken: string;
    }>;
    retryMax?: number;
    headerEncoding?: string;
  }

  interface MultipartUploadOptions {
    parallel?: number;
    partSize?: number;
    progress?: (p: number, checkpoint: any) => void;
  }

  interface PutResult {
    name: string;
    url: string;
    res: {
      status: number;
      statusCode: number;
      headers: {
        [key: string]: string;
      };
    };
  }

  class OSS {
    constructor(options: OSSOptions);
    put(name: string, file: File | Blob | Buffer): Promise<PutResult>;
    multipartUpload(name: string, file: File | Blob | Buffer, options?: MultipartUploadOptions): Promise<PutResult>;
    generateObjectUrl(name: string): string;
  }

  export = OSS;
}

declare module '@alicloud/sts-sdk' {
  interface STSOptions {
    accessKeyId: string;
    accessKeySecret: string;
    endpoint: string;
    region?: string;
  }

  interface Credentials {
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
    Expiration: string;
  }

  interface AssumeRoleResponse {
    credentials: Credentials;
  }

  class STS {
    constructor(options: STSOptions);
    assumeRole(
      roleArn: string,
      roleSessionName: string,
      policy?: string,
      expiration?: number,
      options?: any
    ): Promise<AssumeRoleResponse>;
  }

  export default STS;
}

declare module '@alicloud/sts20150401' {
  interface AssumeRoleRequest {
    roleArn: string;
    roleSessionName: string;
    policy?: string;
    durationSeconds?: number;
  }

  interface Credentials {
    accessKeyId: string;
    accessKeySecret: string;
    securityToken: string;
    expiration: string;
  }

  interface AssumeRoleResponse {
    body: {
      credentials: Credentials;
      requestId: string;
    };
  }

  class Client {
    constructor(config: any);
    assumeRole(request: AssumeRoleRequest): Promise<AssumeRoleResponse>;
  }

  export default Client;
} 