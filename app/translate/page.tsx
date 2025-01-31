"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { Upload, Image as ImageIcon, Languages, Wand2, Mic, MicOff, Video, Loader2, FileText, FileType, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { extractTextFromImage, translateText, improveText } from '@/lib/gemini'
import { extractTextWithTencent } from '@/lib/tencent'
import { getLanguageCategories, getLanguagesByCategory } from '@/lib/languages'
import { useI18n } from '@/lib/i18n/use-translations'
import { TencentASRService } from '@/lib/tencent-asr'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { translateWithDeepSeek, translateWithQwen, translateWithZhipu, translateWithHunyuan, translateWith4oMini, translateWithMinniMax, translateWithSiliconFlow, translateWithClaude, translateWithStepAPI } from '@/lib/server/translate'
import { extractTextWithQwen } from '@/lib/qwen'
import { extractTextWithGemini } from '@/lib/gemini'
import { extractVideoFrames, analyzeVideoContent, extractTextWithZhipu, extractFileContent } from '@/lib/zhipu'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { extractTextWithDeepseek } from '@/lib/deepseek'
import { extractPDFWithKimi } from '@/lib/kimi'
import { useLanguage } from "@/components/language-provider"
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { uploadToOSS } from '@/lib/aliyun-oss-client'
import { extractTextWithKimi } from '@/lib/kimi'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { extractTextWithStep } from '@/lib/step'
import { SubscriptionDialog } from "@/components/subscription-dialog"

interface QuotaInfo {
  text_quota: number;
  image_quota: number;
  pdf_quota: number;
  speech_quota: number;
  video_quota: number;
  usage: {
    text: number;
    image: number;
    pdf: number;
    speech: number;
    video: number;
  };
}

export default function TranslatePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useI18n()
  const { language } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [activeTab, setActiveTab] = useState('text')
  const [asrService, setAsrService] = useState('tencent')
  const asrServiceRef = useRef<TencentASRService | null>(null)
  const recognition = useRef<any>(null)
  const [translationService, setTranslationService] = useState('deepseek')
  const [ocrService, setOcrService] = useState('qwen')
  const [sourceText, setSourceText] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('')
  const [isFileProcessing, setIsFileProcessing] = useState(false)
  const [fileService, setFileService] = useState('deepseek')
  const [videoService, setVideoService] = useState('zhipu')
  const { trackEvent } = useAnalytics()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null)
  const [videoContent, setVideoContent] = useState<string>('');
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)

  // 检查是否还有剩余配额
  const hasRemainingQuota = useCallback((type: keyof Omit<QuotaInfo['usage'], 'text'>) => {
    if (!quotaInfo) return false
    const quotaKey = `${type}_quota` as keyof QuotaInfo
    const quota = quotaInfo[quotaKey]
    const used = quotaInfo.usage[type]
    if (typeof quota === 'number' && typeof used === 'number') {
      return quota === -1 || quota > used
    }
    return false
  }, [quotaInfo])

  // 获取配额信息的函数
  const fetchQuotaInfo = async () => {
    try {
      const response = await fetch('/api/user/info')
      const data = await response.json()
      if (data.error) {
        console.error('获取配额失败:', t(data.error))
        return
      }
      // 设置配额信息
      setQuotaInfo({
        text_quota: data.quota.text_quota,
        image_quota: data.quota.image_quota,
        pdf_quota: data.quota.pdf_quota,
        speech_quota: data.quota.speech_quota,
        video_quota: data.quota.video_quota,
        usage: data.usage
      })
    } catch (error) {
      console.error('获取配额信息失败:', error)
    }
  }

  useEffect(() => {
    if (session) {
      // 初始获取配额信息
      fetchQuotaInfo()

      // 每5秒刷新一次配额信息
      const intervalId = setInterval(fetchQuotaInfo, 5000)

      // 清理定时器
      return () => clearInterval(intervalId)
    }
  }, [session])

  // 检查并更新使用次数
  const checkAndUpdateUsage = useCallback(async (type: 'image' | 'pdf' | 'speech' | 'video') => {
    if (!session) {
      setShowAuthDialog(true)
      return false
    }

    try {
      const response = await fetch('/api/user/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type })
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: t('error.usageLimitExceeded'),
          description: t(`error.${type}LimitExceededDesc`),
          variant: "destructive"
        })
        return false
      }

      // 刷新配额信息
      fetchQuotaInfo()
      return true
    } catch (error) {
      console.error('更新使用次数失败:', error)
      return false
    }
  }, [session, t, toast])

  // 获取使用次数显示文本
  const getRemainingUsageText = (type: keyof Omit<QuotaInfo['usage'], 'text'>) => {
    if (!session) {
      return t('usage.loginToGet')
    }
    if (!quotaInfo) {
      return ''
    }
    const quota = quotaInfo[`${type}_quota` as keyof QuotaInfo] as number
    const used = quotaInfo.usage[type] as number
    const remaining = quota - used
    return t('usage.remainingToday', [remaining, quota])
  }

  // 获取文本翻译使用次数显示文本
  const getTextUsageText = () => {
    if (!session) {
      return t('usage.loginToGet')
    }
    return t('usage.unlimited')
  }

  // 检查登录状态的函数
  const checkAuth = useCallback(() => {
    if (!session) {
      setShowAuthDialog(true)
      return false
    }
    return true
  }, [session])

  // 处理登录按钮点击
  const handleLogin = useCallback(() => {
    setShowAuthDialog(false)
    router.push('/login?callbackUrl=/translate')
  }, [router])

  // 处理注册按钮点击
  const handleRegister = useCallback(() => {
    setShowAuthDialog(false)
    router.push('/register?callbackUrl=/translate')
  }, [router])

  // 添加使用次数状态
  const [usageCounts, setUsageCounts] = useState({
    image: 0,
    pdf: 0,
    speech: 0,
    video: 0
  });

  useEffect(() => {
    // 初始化腾讯云语音识别服务
    asrServiceRef.current = new TencentASRService();
  }, []);

  // 处理图片上传
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkAuth()) return;

    // 检查配额
    if (!hasRemainingQuota('image')) {
      setShowSubscriptionDialog(true);
      return;
    }

    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast({
        title: t('error.invalidImageFile'),
        description: t('error.invalidImageFileDesc'),
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [checkAuth, hasRemainingQuota, setShowSubscriptionDialog, toast, t, setImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!checkAuth()) return;

    // 检查配额
    if (!hasRemainingQuota('image')) {
      setShowSubscriptionDialog(true);
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: t('error.invalidFile'),
        description: t('error.invalidFileDesc'),
        variant: "destructive"
      });
    }
  }, [checkAuth, hasRemainingQuota, setShowSubscriptionDialog, toast, t, setImage]);

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkAuth()) return;

    const file = e.target.files?.[0]
    if (!file || (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf')) {
      toast({
        title: t('error.invalidFile'),
        description: t('error.invalidFileDesc'),
        variant: "destructive"
      });
      return;
    }

    // 检查配额
    if (!hasRemainingQuota('pdf')) {
      setShowSubscriptionDialog(true);
      return;
    }

    // 记录使用次数
    if (!await checkAndUpdateUsage('pdf')) {
      return;
    }

    try {
      setIsFileProcessing(true)
      setFileContent('')
      
      const content = await extractPDFWithKimi(file, (status) => {
        toast({
          title: status,
          description: t('success.description')
        })
      })
      
      setFileContent(content)
      toast({
        title: t('success.fileExtracted'),
        description: t('success.description')
      })
    } catch (error: any) {
      console.error('文件处理错误:', error)
      toast({
        title: t('error.fileProcessing'),
        description: error.message || t('error.fileProcessingDesc'),
        variant: "destructive"
      })
    } finally {
      setIsFileProcessing(false)
      // 清空文件输入框
      e.target.value = ''
    }
  };

  const handleSpeechUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkAuth()) return;

    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('audio/')) {
      toast({
        title: t('error.invalidAudioFile'),
        description: t('error.invalidAudioFileDesc'),
        variant: "destructive"
      });
      return;
    }

    // 检查配额
    if (!hasRemainingQuota('speech')) {
      setShowSubscriptionDialog(true);
      return;
    }

    // 记录使用次数
    if (!await checkAndUpdateUsage('speech')) {
      return;
    }

    setIsProcessing(true);
    try {
      if (!asrServiceRef.current) {
        asrServiceRef.current = new TencentASRService();
      }

      const text = await asrServiceRef.current.recognizeAudio(
        file,
        (progress) => {
          setInterimText(progress);
        },
        (error) => {
          toast({
            title: t('error.audioRecognition'),
            description: error,
            variant: "destructive"
          });
        }
      );
      
      setExtractedText(text);
      setInterimText('');
      toast({
        title: t('success.audioRecognized'),
        description: t('success.description')
      });
    } catch (error: any) {
      if (error.message !== '配额不足') {
        toast({
          title: t('error.audioProcessing'),
          description: String(error),
          variant: "destructive"
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeechFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith('audio/')) {
      throw new Error(t('error.invalidAudioFile'))
    }
    return await recognizeAudioFile(file)
  }

  const handleVideoUpload = async (file: File) => {
    if (!checkAuth()) return;

    if (!file || !file.type.startsWith('video/')) {
      toast({
        title: t('error.invalidVideoFile'),
        description: t('error.invalidVideoFileDesc'),
        variant: "destructive"
      });
      return;
    }

    // 先检查配额
    if (!await checkAndUpdateUsage('video')) {
      return;
    }

    setVideoFile(file);
    setIsProcessing(true);
    try {
      if (videoService === 'zhipu') {
        console.log('开始提取视频帧...');
        const frames = await extractVideoFrames(file);
        console.log('视频帧提取完成，帧数:', frames.length);
        console.log('第一帧数据示例:', frames[0].substring(0, 100) + '...');
        const text = await analyzeVideoContent(frames);
        console.log('视频处理完成，提取的文本长度:', text.length);
        setExtractedText(text);
      } else if (videoService === 'aliyun') {
        try {
          // 直接上传到 OSS
          const videoUrl = await uploadToOSS(file);
          console.log('视频上传成功，URL:', videoUrl);

          // 创建视频识别任务
          const createResponse = await fetch('/api/aliyun/video-ocr/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              videoUrl: videoUrl,
            }),
          });

          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('创建视频识别任务失败:', errorText);
            throw new Error(t('error.videoProcessingDesc'));
          }

          const createResult = await createResponse.json();
          if (!createResult.taskId) {
            throw new Error(t('error.videoProcessingDesc'));
          }

          console.log('开始轮询任务状态...');
          const result = await pollTaskStatus(createResult.taskId);
          
          if (!result || !result.raw) {
            throw new Error(t('error.videoProcessingDesc'));
          }

          // 处理OCR结果
          console.log('开始处理OCR结果:', result);
          
          // 创建一个Map来存储时间戳对应的文本
          const textMap = new Map<number, Set<string>>();

          try {
            // 尝试解析 Result 字符串
            if (typeof result.raw === 'string') {
              result.raw = JSON.parse(result.raw);
            }

            // 处理 OCR 结果
            if (result.raw?.ocrResults?.length) {
              result.raw.ocrResults.forEach((item: any) => {
                if (item.detailInfo?.length) {
                  item.detailInfo.forEach((detail: any) => {
                    if (detail.text && detail.timeStamp) {
                      const timestamp = Math.floor(detail.timeStamp / 1000) * 1000;
                      const text = String(detail.text).trim();
                      if (text.length >= 2 && /[\u4e00-\u9fa5a-zA-Z0-9]/.test(text)) {
                        if (!textMap.has(timestamp)) {
                          textMap.set(timestamp, new Set());
                        }
                        textMap.get(timestamp)?.add(text);
                      }
                    }
                  });
                }
              });
            }

            // 处理视频 OCR 结果
            if (result.raw?.videoOcrResults?.length) {
              result.raw.videoOcrResults.forEach((item: any) => {
                if (item.detailInfo?.length) {
                  item.detailInfo.forEach((detail: any) => {
                    if (detail.text && detail.timeStamp) {
                      const timestamp = Math.floor(detail.timeStamp / 1000) * 1000;
                      const text = String(detail.text).trim();
                      if (text.length >= 2 && /[\u4e00-\u9fa5a-zA-Z0-9]/.test(text)) {
                        if (!textMap.has(timestamp)) {
                          textMap.set(timestamp, new Set());
                        }
                        textMap.get(timestamp)?.add(text);
                      }
                    }
                  });
                }
              });
            }

            // 处理字幕结果
            if (result.raw?.subtitlesResults?.[0]?.subtitlesChineseResults) {
              const subtitles = result.raw.subtitlesResults[0].subtitlesChineseResults;
              Object.entries(subtitles).forEach(([timeStr, text]: [string, any]) => {
                // 过滤掉时间轴格式的文本
                if (text && !timeStr.includes('-->') && !String(text).includes('-->')) {
                  const textStr = String(text).trim();
                  // 过滤掉 [object Object] 和其他无效内容
                  if (textStr.length >= 2 && 
                      /[\u4e00-\u9fa5a-zA-Z0-9]/.test(textStr) && 
                      !textStr.includes('[object Object]') &&
                      !textStr.match(/\d{2}:\d{2}:\d{2},\d{3}/)) {
                    // 对于字幕，我们使用一个固定的时间戳，因为我们只关心文本内容
                    const timestamp = 0;
                    if (!textMap.has(timestamp)) {
                      textMap.set(timestamp, new Set());
                    }
                    textMap.get(timestamp)?.add(textStr);
                  }
                }
              });
            }

            // 按时间戳排序并合并文本，去重
            const sortedTexts = Array.from(textMap.entries())
              .sort(([a], [b]) => a - b)
              .map(([_, texts]) => Array.from(texts).join(' '))
              .filter(text => text.length > 0);

            const combinedText = sortedTexts.join('\n');
            console.log('提取的文本:', combinedText);
            
            if (combinedText) {
              setSourceText(combinedText);
              setExtractedText(combinedText);
            } else {
              console.log('没有提取到文本');
              toast({
                title: t('error.noTextExtracted'),
                description: t('error.noTextExtractedDesc'),
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('处理OCR结果时出错:', error);
            // 如果解析失败，尝试直接使用原始结果
            if (result.raw && typeof result.raw === 'string') {
              setSourceText(result.raw);
              setExtractedText(result.raw);
            }
          }

          setIsProcessing(false);
          setVideoFile(null);
          
        } catch (uploadError: any) {
          console.error('视频上传错误:', uploadError);
          toast({
            title: t('error.videoUploadFailed'),
            description: uploadError.message || t('error.videoUploadFailedDesc'),
            variant: "destructive"
          });
          return;
        }
      } else {
        throw new Error('不支持的视频服务');
      }

      toast({
        title: t('success.videoExtracted'),
        description: t('success.description')
      });
    } catch (error: any) {
      console.error('视频处理错误:', error);
      toast({
        title: t('error.videoProcessing'),
        description: error.message || t('error.videoProcessingDesc'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setVideoFile(null);
    }
  };

  const handleVideoFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith('video/')) {
      throw new Error(t('error.invalidVideoFile'))
    }
    return await processVideoFile(file)
  }

  // 处理文件变更
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 获取当前标签页类型
    const currentTab = activeTab.toLowerCase()
    
    // 检查配额
    if (currentTab !== 'text' && !hasRemainingQuota(currentTab as keyof Omit<QuotaInfo['usage'], 'text'>)) {
      setShowSubscriptionDialog(true);
      return;
    }

    // 根据不同类型处理文件
    try {
      switch (currentTab) {
        case 'image':
          if (!file.type.startsWith('image/')) {
            throw new Error(t('error.invalidImageFile'))
          }
          await handleImageUpload(e)
          break
        
        case 'file':
          if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
            throw new Error(t('error.invalidPDFFile'))
          }
          await handlePDFUpload(e)
          break
        
        case 'speech':
          if (!file.type.startsWith('audio/')) {
            throw new Error(t('error.invalidAudioFile'))
          }
          // 检查配额
          if (!hasRemainingQuota('speech')) {
            setShowSubscriptionDialog(true);
            return;
          }
          // 记录使用次数
          if (!await checkAndUpdateUsage('speech')) {
            return;
          }
          await handleSpeechUpload(e)
          break
        
        case 'video':
          if (!file.type.startsWith('video/')) {
            throw new Error(t('error.invalidVideoFile'))
          }
          await handleVideoUpload(file)
          break
      }
    } catch (error: any) {
      console.error('文件处理失败:', error)
      if (error.message !== '配额不足') {
        toast({
          variant: "destructive",
          title: t('error'),
          description: error.message || t('uploadFailed')
        })
      }
    } finally {
      // 清空文件输入框
      e.target.value = ''
    }
  }

  // 处理图片文件
  const handleImageFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error(t('error.invalidImageFile'))
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 处理PDF文件
  const handlePDFFile = async (file: File): Promise<string> => {
    if (!file.type.endsWith('pdf') && !file.type.startsWith('application/pdf')) {
      throw new Error(t('error.invalidPDFFile'))
    }
    return await extractPDFWithKimi(file)
  }

  // 处理语音文件
  const recognizeAudioFile = async (file: File): Promise<string> => {
    // 检查配额
    if (!hasRemainingQuota('speech')) {
      setShowSubscriptionDialog(true);
      throw new Error('配额不足');
    }

    // 记录使用次数
    if (!await checkAndUpdateUsage('speech')) {
      throw new Error('配额不足');
    }

    if (!asrServiceRef.current) {
      asrServiceRef.current = new TencentASRService();
    }

    return await asrServiceRef.current.recognizeAudio(
      file,
      (progress) => {
        setInterimText(progress);
      },
      (error) => {
        toast({
          title: t('error.audioRecognition'),
          description: error,
          variant: "destructive"
        });
      }
    );
  };

  // 处理视频文件
  const processVideoFile = async (file: File): Promise<string> => {
    if (videoService === 'zhipu') {
      const frames = await extractVideoFrames(file);
      return await analyzeVideoContent(frames);
    } else if (videoService === 'aliyun') {
      const videoUrl = await uploadToOSS(file);
      const createResponse = await fetch('/api/aliyun/video-ocr/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      });

      if (!createResponse.ok) {
        throw new Error(t('error.videoProcessingDesc'));
      }

      const createResult = await createResponse.json();
      if (!createResult.taskId) {
        throw new Error(t('error.videoProcessingDesc'));
      }

      const result = await pollTaskStatus(createResult.taskId);
      if (!result || !result.raw) {
        throw new Error(t('error.videoProcessingDesc'));
      }

      return result.raw;
    }
    
    throw new Error('不支持的视频服务');
  };

  // 处理文本翻译
  const handleTextTranslate = async () => {
    if (!sourceText) {
      toast({
        title: t('error.noText'),
        description: t('error.noTextDesc'),
        variant: "destructive"
      });
      return;
    }

    if (!selectedLanguage) {
      toast({
        title: t('error.noLanguage'),
        description: t('error.noLanguageDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      let result: string;
      switch (translationService) {
        case 'deepseek':
          result = await translateWithDeepSeek(sourceText, selectedLanguage)
          break;
        case 'qwen':
          result = await translateWithQwen(sourceText, selectedLanguage)
          break;
        case 'gemini':
          result = await translateText(sourceText, selectedLanguage)
          break;
        case 'zhipu':
          result = await translateWithZhipu(sourceText, selectedLanguage)
          break;
        case 'hunyuan':
          result = await translateWithHunyuan(sourceText, selectedLanguage)
          break;
        case 'step':
          result = await translateWithStepAPI(sourceText, selectedLanguage)
          break;
        default:
          result = await translateWithDeepSeek(sourceText, selectedLanguage)
      }
      setTranslatedText(result);
      toast({
        title: t('success.translated'),
        description: t('success.description')
      });
    } catch (error: any) {
      toast({
        title: t('error.translating'),
        description: error.message || t('error.translatingDesc'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理文本优化
  const handleImprove = async () => {
    if (!translatedText) {
      toast({
        title: t('error.noTranslation'),
        description: t('error.noTranslationDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const improved = await improveText(translatedText, selectedLanguage);
      setTranslatedText(improved);
      toast({
        title: t('success.improved'),
        description: t('success.description')
      });
    } catch (error: any) {
      toast({
        title: t('error.improving'),
        description: error.message || t('error.improvingDesc'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理语音识别开关
  const toggleSpeechRecognition = async () => {
    if (!checkAuth()) return;

    // 检查配额
    if (!isListening && !hasRemainingQuota('speech')) {
      setShowSubscriptionDialog(true);
      return;
    }

    if (!asrServiceRef.current) {
      toast({
        title: t('error.speechNotSupported'),
        description: t('error.speechNotSupportedDesc'),
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      if (recognition.current) {
        recognition.current.stop();
        recognition.current = null;
      }
      setIsListening(false);
      setInterimText('');
    } else {
      // 记录使用次数
      if (!await checkAndUpdateUsage('speech')) {
        return;
      }

      const rec = await asrServiceRef.current.recognizeStream(
        (text, isFinal) => {
          if (isFinal) {
            setExtractedText(text);
            setInterimText('');
            toast({
              title: t('success.speechRecognized'),
              description: t('success.description')
            });
          } else {
            setInterimText(text);
          }
        },
        (error) => {
          toast({
            title: t('error.speechRecognition'),
            description: error,
            variant: "destructive"
          });
          setIsListening(false);
        }
      );

      if (rec) {
        recognition.current = rec;
        rec.start();
        setIsListening(true);
      }
    }
  };

  // 处理图片文本提取
  const handleExtractText = async () => {
    if (!image) {
      toast({
        title: t('error.noImage'),
        description: t('error.noImageDesc'),
        variant: "destructive"
      });
      return;
    }

    // 检查配额
    if (!hasRemainingQuota('image')) {
      setShowSubscriptionDialog(true);
      return;
    }

    setIsProcessing(true);
    try {
      // 记录使用次数
      if (!await checkAndUpdateUsage('image')) {
        setIsProcessing(false);
        return;
      }

      let result: string;
      switch (ocrService) {
        case 'tencent':
          result = await extractTextWithTencent(image);
          break;
        case 'qwen':
          result = await extractTextWithQwen(image);
          break;
        case 'gemini':
          result = await extractTextFromImage(image);
          break;
        case 'zhipu':
          result = await extractTextWithZhipu(image);
          break;
        case 'kimi':
          result = await extractTextWithKimi(image);
          break;
        case 'step':
          result = await extractTextWithStep(image);
          break;
        default:
          result = await extractTextWithQwen(image);
      }
      setExtractedText(result);
      toast({
        title: t('success.extracted'),
        description: t('success.description')
      });
    } catch (error: any) {
      toast({
        title: t('error.extracting'),
        description: error.message || t('error.extractingDesc'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理翻译
  const handleTranslate = async () => {
    if (!extractedText || !selectedLanguage) {
      toast({
        title: t('error.translating'),
        description: t('error.noLanguage'),
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      let result: string;
      try {
        switch (translationService) {
          case 'deepseek':
            result = await translateWithDeepSeek(extractedText, selectedLanguage);
            break;
          case 'qwen':
            result = await translateWithQwen(extractedText, selectedLanguage);
            break;
          case 'gemini':
            result = await translateText(extractedText, selectedLanguage);
            break;
          case 'zhipu':
            result = await translateWithZhipu(extractedText, selectedLanguage);
            break;
          case 'hunyuan':
            result = await translateWithHunyuan(extractedText, selectedLanguage);
            break;
          case 'step':
            result = await translateWithStepAPI(extractedText, selectedLanguage);
            break;
          default:
            result = await translateWithDeepSeek(extractedText, selectedLanguage);
        }
      } catch (serviceError: any) {
        console.error(`${translationService} 翻译服务错误:`, serviceError);
        if (translationService !== 'deepseek') {
          console.log('尝试使用 DeepSeek 作为备选服务...');
          result = await translateWithDeepSeek(extractedText, selectedLanguage);
        } else {
          throw serviceError;
        }
      }

      setTranslatedText(result);
      toast({
        title: t('success.translated'),
        description: t('success.description')
      });
    } catch (error: any) {
      console.error('翻译错误:', error);
      toast({
        title: t('error.translating'),
        description: error.message || t('error.translatingDesc'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    setMounted(true)
  }, [])

  // 在切换标签页时清空状态
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setExtractedText('');
    setTranslatedText('');
    setInterimText('');
    setSourceText('');
    setSelectedLanguage('');
    if (value !== 'image') {
      setImage(null);
    }
    if (value !== 'video') {
      setVideoFile(null);
    }
    if (value !== 'file') {
      setFileContent('');
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    let attempts = 0;
    const POLL_INTERVAL = 5000; // 5秒
    const MAX_POLL_ATTEMPTS = 60; // 最多轮询60次，即5分钟
    
    while (attempts < MAX_POLL_ATTEMPTS) {
      try {
        const response = await fetch('/api/aliyun/video-ocr/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId }),
        });

        const result = await response.json();
        console.log('轮询返回结果:', result);
        
        if (result.status === 'success') {
          return result.data;
        }
        
        if (!result.success) {
          throw new Error(result.message || '任务处理失败');
        }
        
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        attempts++;
        
      } catch (error) {
        console.error('查询任务结果失败:', error);
        throw error;
      }
    }
    
    throw new Error('任务处理超时');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!mounted ? null : (
        <>
          <a
            href={t('banner.twitter')}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mb-4 p-3 text-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow transition-colors duration-200"
          >
            {t('banner.text')}
          </a>
          <Card className="p-4 md:p-6">
            <Tabs defaultValue="text" className="w-full" onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2 h-auto mb-6">
                <TabsTrigger value="text" className="data-[state=active]:bg-muted py-2 px-1 sm:px-2">
                  <Languages className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">{t('tabs.text')}</span>
                </TabsTrigger>
                <TabsTrigger value="image" className="data-[state=active]:bg-muted py-2 px-1 sm:px-2">
                  <ImageIcon className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">{t('tabs.image')}</span>
                </TabsTrigger>
                <TabsTrigger value="file" className="data-[state=active]:bg-muted py-2 px-1 sm:px-2">
                  <FileType className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">{t('tabs.pdf')}</span>
                </TabsTrigger>
                <TabsTrigger value="speech" className="data-[state=active]:bg-muted py-2 px-1 sm:px-2">
                  {isListening ? <MicOff className="w-4 h-4 mr-1 sm:mr-2" /> : <Mic className="w-4 h-4 mr-1 sm:mr-2" />}
                  <span className="text-xs sm:text-sm">{t('tabs.speech')}</span>
                </TabsTrigger>
                <TabsTrigger value="video" className="data-[state=active]:bg-muted py-2 px-1 sm:px-2">
                  <Video className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">{t('tabs.video')}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text">
                <div className="flex flex-col items-center justify-center gap-4">
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={t('enterText')}
                    className="w-full h-32 sm:h-40 p-4 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  />

                  <div className="flex flex-col w-full gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <Select 
                        onValueChange={(value) => {
                          console.log('Selected language:', value)
                          setSelectedLanguage(value)
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('selectLanguage')} />
                        </SelectTrigger>
                        <SelectContent>
                          {getLanguageCategories().map(category => (
                            <SelectGroup key={category}>
                              <SelectLabel>{category}</SelectLabel>
                              {getLanguagesByCategory(category).map(language => (
                                <SelectItem key={language.code} value={language.code}>
                                  {language.nativeName} ({language.name})
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select onValueChange={setTranslationService} defaultValue="deepseek">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('selectService')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deepseek">{t('translationServices.deepseek')}</SelectItem>
                          <SelectItem value="qwen">{t('translationServices.qwen')}</SelectItem>
                          <SelectItem value="gemini">{t('translationServices.gemini')}</SelectItem>
                          <SelectItem value="zhipu">{t('translationServices.zhipu')}</SelectItem>
                          <SelectItem value="hunyuan">{t('translationServices.hunyuan')}</SelectItem>
                          <SelectItem value="4o-mini">{t('translationServices.4o-mini')}</SelectItem>
                          <SelectItem value="minnimax">{t('translationServices.minnimax')}</SelectItem>
                          <SelectItem value="siliconflow">{t('translationServices.siliconflow')}</SelectItem>
                          <SelectItem value="claude_3_5">{t('translationServices.claude_3_5')}</SelectItem>
                          <SelectItem value="kimi">{t('translationServices.kimi')}</SelectItem>
                          <SelectItem value="step">{t('translationServices.step')}</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={handleTextTranslate}
                        disabled={!sourceText || !selectedLanguage || isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span className="text-sm">{t('translating')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Languages className="mr-2 h-4 w-4" />
                            <span className="text-sm">{t('buttons.startTranslate')}</span>
                          </div>
                        )}
                      </Button>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleImprove}
                              disabled={!translatedText || isProcessing}
                              variant="outline"
                              className="w-full"
                            >
                              <Wand2 className="mr-2 h-4 w-4" />
                              <span className="text-sm">{t('improve')}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">{t('improveTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {translatedText && (
                    <div className="w-full mx-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium mb-2 text-sm sm:text-base">{t('translatedText')}</h3>
                      <p className="whitespace-pre-wrap text-sm sm:text-base">{translatedText}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="image">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="text-sm text-gray-500 mb-2">
                    {getRemainingUsageText('image')}
                  </div>
                  <Card
                    className={`w-full max-w-xl h-48 flex items-center justify-center border-2 border-dashed ${
                      isDragging ? 'border-primary' : 'border-muted-foreground'
                    } relative overflow-hidden`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {image ? (
                      <div className="relative w-full h-full">
                        <img
                          src={image}
                          alt="Uploaded"
                          className="w-full h-full object-contain"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => setImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        <Upload className="h-8 w-8 mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">{t('dragAndDrop')}</p>
                        <div className="relative">
                          <Button variant="secondary" size="sm" onClick={() => {
                            if (!checkAuth()) return;
                          }}>
                            {t('selectImage')}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onClick={(e) => {
                                if (!checkAuth()) {
                                  e.preventDefault();
                                }
                              }}
                            />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                      <Select onValueChange={setOcrService} defaultValue="qwen">
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder={t('selectService')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tencent">{t('ocrServices.tencent')}</SelectItem>
                          <SelectItem value="qwen">{t('ocrServices.qwen')}</SelectItem>
                          <SelectItem value="gemini">{t('ocrServices.gemini')}</SelectItem>
                          <SelectItem value="zhipu">{t('ocrServices.zhipu')}</SelectItem>
                          <SelectItem value="kimi">{t('ocrServices.kimi')}</SelectItem>
                          <SelectItem value="step">{t('ocrServices.step')}</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={handleExtractText}
                        disabled={!image || isProcessing}
                        className="w-full sm:w-40"
                      >
                        {isProcessing ? (
                          <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>{t('extracting')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>{t('extract')}</span>
                          </div>
                        )}
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                      <Select onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder={t('selectLanguage')} />
                        </SelectTrigger>
                        <SelectContent>
                          {getLanguageCategories().map(category => (
                            <SelectGroup key={category}>
                              <SelectLabel>{category}</SelectLabel>
                              {getLanguagesByCategory(category).map(language => (
                                <SelectItem key={language.code} value={language.name}>
                                  {language.nativeName} ({language.name})
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select onValueChange={setTranslationService} defaultValue="deepseek">
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder={t('selectService')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deepseek">{t('translationServices.deepseek')}</SelectItem>
                          <SelectItem value="qwen">{t('translationServices.qwen')}</SelectItem>
                          <SelectItem value="gemini">{t('translationServices.gemini')}</SelectItem>
                          <SelectItem value="zhipu">{t('translationServices.zhipu')}</SelectItem>
                          <SelectItem value="hunyuan">{t('translationServices.hunyuan')}</SelectItem>
                          <SelectItem value="4o-mini">{t('translationServices.4o-mini')}</SelectItem>
                          <SelectItem value="minnimax">{t('translationServices.minnimax')}</SelectItem>
                          <SelectItem value="siliconflow">{t('translationServices.siliconflow')}</SelectItem>
                          <SelectItem value="claude_3_5">{t('translationServices.claude_3_5')}</SelectItem>
                          <SelectItem value="kimi">{t('translationServices.kimi')}</SelectItem>
                          <SelectItem value="step">{t('translationServices.step')}</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={handleTranslate}
                        disabled={!extractedText || !selectedLanguage || isProcessing}
                        className="w-full sm:w-40"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('translating')}
                          </>
                        ) : (
                          <>
                            <Languages className="mr-2 h-4 w-4" />
                            {t('buttons.startTranslate')}
                          </>
                        )}
                      </Button>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleImprove}
                              disabled={!translatedText || isProcessing}
                              variant="outline"
                              className="w-full sm:w-40"
                            >
                              <Wand2 className="mr-2 h-4 w-4" />
                              {t('improve')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('improveTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {extractedText && (
                    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium mb-2">{t('extractedText')}</h3>
                      <p className="whitespace-pre-wrap">{extractedText}</p>
                    </div>
                  )}

                  {translatedText && (
                    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium mb-2">{t('translatedText')}</h3>
                      <p className="whitespace-pre-wrap">{translatedText}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="file">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="text-sm text-gray-500 mb-2">
                    {getRemainingUsageText('pdf')}
                  </div>
                  <Card
                    className={cn(
                      "w-full max-w-2xl h-48 flex items-center justify-center border-2 border-dashed",
                      isDragging ? "border-primary" : "border-muted-foreground",
                      "relative overflow-hidden"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);

                      if (!checkAuth()) return;

                      // 检查配额
                      if (!hasRemainingQuota('pdf')) {
                        setShowSubscriptionDialog(true);
                        return;
                      }

                      const file = e.dataTransfer.files[0];
                      if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
                        handlePDFUpload({ target: { files: [file] } } as any);
                      } else {
                        toast({
                          title: t('error.invalidFile'),
                          description: t('error.invalidFileDesc'),
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    {fileContent ? (
                      <div className="relative w-full h-full p-4">
                        <textarea
                          value={fileContent}
                          readOnly
                          className="w-full h-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => setFileContent('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        <FileText className="h-8 w-8 mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">{t('dragAndDrop')}</p>
                        <div className="relative">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className={cn(
                              "w-full",
                              !hasRemainingQuota('pdf') && "opacity-50"
                            )}
                            onClick={() => {
                              if (!checkAuth()) return;
                            }}
                          >
                            {isFileProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('processing')}
                              </>
                            ) : (
                              t('selectPDF')
                            )}
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={handlePDFUpload}
                              className={cn(
                                "absolute inset-0 w-full h-full opacity-0",
                                hasRemainingQuota('pdf') ? "cursor-pointer" : "cursor-not-allowed"
                              )}
                              onClick={(e) => {
                                if (!checkAuth()) {
                                  e.preventDefault();
                                  return;
                                }
                                if (!hasRemainingQuota('pdf')) {
                                  e.preventDefault();
                                  setShowSubscriptionDialog(true);
                                }
                              }}
                              disabled={isFileProcessing}
                            />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>

                  <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                    <Select onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder={t('selectLanguage')} />
                      </SelectTrigger>
                      <SelectContent>
                        {getLanguageCategories().map(category => (
                          <SelectGroup key={category}>
                            <SelectLabel>{category}</SelectLabel>
                            {getLanguagesByCategory(category).map(language => (
                              <SelectItem key={language.code} value={language.name}>
                                {language.nativeName} ({language.name})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select onValueChange={setTranslationService} defaultValue="deepseek">
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder={t('selectService')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deepseek">{t('translationServices.deepseek')}</SelectItem>
                        <SelectItem value="qwen">{t('translationServices.qwen')}</SelectItem>
                        <SelectItem value="gemini">{t('translationServices.gemini')}</SelectItem>
                        <SelectItem value="zhipu">{t('translationServices.zhipu')}</SelectItem>
                        <SelectItem value="hunyuan">{t('translationServices.hunyuan')}</SelectItem>
                        <SelectItem value="4o-mini">{t('translationServices.4o-mini')}</SelectItem>
                        <SelectItem value="minnimax">{t('translationServices.minnimax')}</SelectItem>
                        <SelectItem value="siliconflow">{t('translationServices.siliconflow')}</SelectItem>
                        <SelectItem value="claude_3_5">{t('translationServices.claude_3_5')}</SelectItem>
                        <SelectItem value="kimi">{t('translationServices.kimi')}</SelectItem>
                        <SelectItem value="step">{t('translationServices.step')}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleTranslate}
                      disabled={!fileContent || !selectedLanguage || isProcessing}
                      className="w-full sm:w-40"
                    >
                      <Languages className="mr-2 h-4 w-4" />
                      {isProcessing ? t('translating') : t('buttons.startTranslate')}
                    </Button>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleImprove}
                            disabled={!translatedText || isProcessing}
                            variant="outline"
                            className="w-full sm:w-40"
                          >
                            <Wand2 className="mr-2 h-4 w-4" />
                            {t('improve')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('improveTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {translatedText && (
                    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium mb-2">{t('translatedText')}</h3>
                      <p className="whitespace-pre-wrap">{translatedText}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="speech">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="text-sm text-gray-500 mb-2">
                    {getRemainingUsageText('speech')}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                    <div className="relative w-[240px]">
                      <Button
                        variant="default"
                        className={cn(
                          "w-full",
                          !hasRemainingQuota('speech') && "opacity-50"
                        )}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {t('uploadAudio')}
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleSpeechUpload}
                          className={cn(
                            "absolute inset-0 w-full h-full opacity-0",
                            hasRemainingQuota('speech') ? "cursor-pointer" : "cursor-not-allowed"
                          )}
                          onClick={(e) => {
                            if (!checkAuth()) {
                              e.preventDefault();
                              return;
                            }
                            if (!hasRemainingQuota('speech')) {
                              e.preventDefault();
                              setShowSubscriptionDialog(true);
                            }
                          }}
                        />
                      </Button>
                    </div>

                    <div className="w-[240px]">
                      <Button
                        onClick={() => {
                          if (!checkAuth()) return;
                          toggleSpeechRecognition();
                        }}
                        variant={isListening ? "destructive" : "outline"}
                        className="w-full"
                        disabled={isProcessing || !asrServiceRef.current}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="mr-2 h-4 w-4" />
                            {t('stopListening')}
                          </>
                        ) : (
                          <>
                            <Mic className="mr-2 h-4 w-4" />
                            {t('startListening')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {isProcessing && (
                    <div className="w-full max-w-md p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t('processing')}</p>
                    </div>
                  )}

                  {interimText && (
                    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium mb-2">{t('interimText')}</h3>
                      <p className="whitespace-pre-wrap">{interimText}</p>
                    </div>
                  )}

                  {extractedText && (
                    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium mb-2">{t('extractedText')}</h3>
                      <p className="whitespace-pre-wrap">{extractedText}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                    <Select onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder={t('selectLanguage')} />
                      </SelectTrigger>
                      <SelectContent>
                        {getLanguageCategories().map(category => (
                          <SelectGroup key={category}>
                            <SelectLabel>{category}</SelectLabel>
                            {getLanguagesByCategory(category).map(language => (
                              <SelectItem key={language.code} value={language.code}>
                                {language.nativeName} ({language.name})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select onValueChange={setTranslationService} defaultValue="deepseek">
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder={t('selectService')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deepseek">{t('translationServices.deepseek')}</SelectItem>
                        <SelectItem value="qwen">{t('translationServices.qwen')}</SelectItem>
                        <SelectItem value="gemini">{t('translationServices.gemini')}</SelectItem>
                        <SelectItem value="zhipu">{t('translationServices.zhipu')}</SelectItem>
                        <SelectItem value="hunyuan">{t('translationServices.hunyuan')}</SelectItem>
                        <SelectItem value="4o-mini">{t('translationServices.4o-mini')}</SelectItem>
                        <SelectItem value="minnimax">{t('translationServices.minnimax')}</SelectItem>
                        <SelectItem value="siliconflow">{t('translationServices.siliconflow')}</SelectItem>
                        <SelectItem value="claude_3_5">{t('translationServices.claude_3_5')}</SelectItem>
                        <SelectItem value="kimi">{t('translationServices.kimi')}</SelectItem>
                        <SelectItem value="step">{t('translationServices.step')}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleTranslate}
                      disabled={!extractedText || !selectedLanguage || isProcessing}
                      className="w-full sm:w-40"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('translating')}
                        </>
                      ) : (
                        <>
                          <Languages className="mr-2 h-4 w-4" />
                          {t('buttons.startTranslate')}
                        </>
                      )}
                    </Button>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleImprove}
                            disabled={!translatedText || isProcessing}
                            variant="outline"
                            className="w-full sm:w-40"
                          >
                            <Wand2 className="mr-2 h-4 w-4" />
                            {t('improve')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('improveTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {translatedText && (
                    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium mb-2">{t('translatedText')}</h3>
                      <p className="whitespace-pre-wrap">{translatedText}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="video">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="text-sm text-gray-500 mb-2">
                    {getRemainingUsageText('video')}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl justify-center">
                    <Select onValueChange={setVideoService} defaultValue="zhipu">
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder={t('translate.selectVideoService')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zhipu">{t('translate.zhipu')}</SelectItem>
                        <SelectItem value="aliyun">{t('translate.aliyun')}</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="relative w-[240px] mx-auto">
                      <Button
                        variant="default"
                        className={cn(
                          "w-full",
                          !hasRemainingQuota('video') && "opacity-50"
                        )}
                      >
                        <Video className="mr-2 h-4 w-4" />
                        {t('uploadVideo')}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            // 阻止事件冒泡
                            e.stopPropagation();
                            
                            if (!checkAuth()) {
                              e.preventDefault();
                              return;
                            }
                            
                            // 检查配额
                            if (!hasRemainingQuota('video')) {
                              e.preventDefault();
                              setShowSubscriptionDialog(true);
                              return;
                            }
                            
                            const file = e.target.files?.[0];
                            if (file) {
                              handleVideoUpload(file);
                            }
                          }}
                          className={cn(
                            "absolute inset-0 w-full h-full opacity-0",
                            hasRemainingQuota('video') ? "cursor-pointer" : "cursor-not-allowed"
                          )}
                          onClick={(e) => {
                            if (!checkAuth()) {
                              e.preventDefault();
                              return;
                            }
                            if (!hasRemainingQuota('video')) {
                              e.preventDefault();
                              setShowSubscriptionDialog(true);
                            }
                          }}
                        />
                      </Button>
                    </div>
                  </div>

                  {videoFile && (
                    <div className="text-sm text-gray-500">
                      {videoFile.name}
                    </div>
                  )}

                  {isProcessing && (
                    <div className="w-full max-w-md p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t('processing')}</p>
                    </div>
                  )}

                  {extractedText && (
                    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium mb-2">{t('extractedText')}</h3>
                      <p className="whitespace-pre-wrap">{extractedText}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                    <Select onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder={t('selectLanguage')} />
                      </SelectTrigger>
                      <SelectContent>
                        {getLanguageCategories().map(category => (
                          <SelectGroup key={category}>
                            <SelectLabel>{category}</SelectLabel>
                            {getLanguagesByCategory(category).map(language => (
                              <SelectItem key={language.code} value={language.code}>
                                {language.nativeName} ({language.name})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select onValueChange={setTranslationService} defaultValue="deepseek">
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder={t('selectService')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deepseek">{t('translationServices.deepseek')}</SelectItem>
                        <SelectItem value="qwen">{t('translationServices.qwen')}</SelectItem>
                        <SelectItem value="gemini">{t('translationServices.gemini')}</SelectItem>
                        <SelectItem value="zhipu">{t('translationServices.zhipu')}</SelectItem>
                        <SelectItem value="hunyuan">{t('translationServices.hunyuan')}</SelectItem>
                        <SelectItem value="4o-mini">{t('translationServices.4o-mini')}</SelectItem>
                        <SelectItem value="minnimax">{t('translationServices.minnimax')}</SelectItem>
                        <SelectItem value="siliconflow">{t('translationServices.siliconflow')}</SelectItem>
                        <SelectItem value="claude_3_5">{t('translationServices.claude_3_5')}</SelectItem>
                        <SelectItem value="kimi">{t('translationServices.kimi')}</SelectItem>
                        <SelectItem value="step">{t('translationServices.step')}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleTranslate}
                      disabled={!extractedText || !selectedLanguage || isProcessing}
                      className="w-full sm:w-40"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('translating')}
                        </>
                      ) : (
                        <>
                          <Languages className="mr-2 h-4 w-4" />
                          {t('buttons.startTranslate')}
                        </>
                      )}
                    </Button>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleImprove}
                            disabled={!translatedText || isProcessing}
                            variant="outline"
                            className="w-full sm:w-40"
                          >
                            <Wand2 className="mr-2 h-4 w-4" />
                            {t('improve')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('improveTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {translatedText && (
                    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h3 className="font-medium mb-2">{t('translatedText')}</h3>
                      <p className="whitespace-pre-wrap">{translatedText}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('error.authRequired')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('error.pleaseLogin')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                <AlertDialogCancel>{t('error.cancelButton')}</AlertDialogCancel>
                <div className="flex gap-2">
                  <AlertDialogAction onClick={handleRegister} className="bg-primary hover:bg-primary/90">
                    {t('error.registerButton')}
                  </AlertDialogAction>
                  <AlertDialogAction onClick={handleLogin} className="bg-primary hover:bg-primary/90">
                    {t('error.loginButton')}
                  </AlertDialogAction>
                </div>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <SubscriptionDialog
            open={showSubscriptionDialog}
            onOpenChange={setShowSubscriptionDialog}
          />
        </>
      )}
    </div>
  );
}