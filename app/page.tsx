"use client"

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/use-translations'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { 
  Languages, 
  Image, 
  FileText, 
  Mic, 
  Video, 
  Moon, 
  Lock, 
  Crown, 
  Globe2, 
  Chrome, 
  MonitorSmartphone, 
  ArrowRight, 
  Sparkles 
} from 'lucide-react'

export default function Home() {
  const { t } = useI18n()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  const features = [
    {
      icon: <Languages className="h-8 w-8" />,
      title: t('landing.features.text.title'),
      description: t('landing.features.text.description'),
    },
    {
      icon: <Image className="h-8 w-8" />,
      title: t('landing.features.image.title'),
      description: t('landing.features.image.description'),
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: t('landing.features.pdf.title'),
      description: t('landing.features.pdf.description'),
    },
    {
      icon: <Mic className="h-8 w-8" />,
      title: t('landing.features.speech.title'),
      description: t('landing.features.speech.description'),
    },
    {
      icon: <Video className="h-8 w-8" />,
      title: t('landing.features.video.title'),
      description: t('landing.features.video.description'),
    },
  ]

  const highlights = [
    {
      icon: <Globe2 className="h-6 w-6" />,
      title: t('landing.highlights.multilingual.title'),
      description: t('landing.highlights.multilingual.description'),
    },
    {
      icon: <Moon className="h-6 w-6" />,
      title: t('landing.highlights.theme.title'),
      description: t('landing.highlights.theme.description'),
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: t('landing.highlights.privacy.title'),
      description: t('landing.highlights.privacy.description'),
    },
    {
      icon: <Chrome className="h-6 w-6" />,
      title: t('landing.highlights.web.title'),
      description: t('landing.highlights.web.description'),
    },
  ]

  const steps = [
    {
      number: "01",
      title: t('landing.steps.select.title'),
      description: t('landing.steps.select.description'),
    },
    {
      number: "02",
      title: t('landing.steps.upload.title'),
      description: t('landing.steps.upload.description'),
    },
    {
      number: "03",
      title: t('landing.steps.translate.title'),
      description: t('landing.steps.translate.description'),
    },
  ]

  const testimonials = [
    {
      quote: t('landing.testimonials.1.quote'),
      author: t('landing.testimonials.1.author'),
      role: t('landing.testimonials.1.role'),
      rating: 5
    },
    {
      quote: t('landing.testimonials.2.quote'),
      author: t('landing.testimonials.2.author'),
      role: t('landing.testimonials.2.role'),
      rating: 5
    },
    {
      quote: t('landing.testimonials.3.quote'),
      author: t('landing.testimonials.3.author'),
      role: t('landing.testimonials.3.role'),
      rating: 5
    },
    {
      quote: t('landing.testimonials.4.quote'),
      author: t('landing.testimonials.4.author'),
      role: t('landing.testimonials.4.role'),
      rating: 5
    },
    {
      quote: t('landing.testimonials.5.quote'),
      author: t('landing.testimonials.5.author'),
      role: t('landing.testimonials.5.role'),
      rating: 5
    },
    {
      quote: t('landing.testimonials.6.quote'),
      author: t('landing.testimonials.6.author'),
      role: t('landing.testimonials.6.role'),
      rating: 5
    }
  ]

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-16 lg:py-20 bg-background overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-slate-400/[0.05] bg-[size:32px_32px] dark:bg-grid-slate-600/[0.05]" />
          <div className="absolute inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <motion.div 
          className="container relative px-4 md:px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center space-y-6 text-center">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Badge variant="outline" className="px-6 py-2 text-base relative overflow-hidden group mb-4">
                <span className="relative z-10" suppressHydrationWarning>{t('landing.hero.badge')}</span>
                <motion.div
                  className="absolute inset-0 bg-primary/10"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              </Badge>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none mb-6">
                <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/50 to-primary bg-[200%_auto] animate-gradient" suppressHydrationWarning>
                  {t('landing.hero.appTitle')}
                </span>
              </h1>
              <p className="mx-auto max-w-[800px] text-gray-500 md:text-xl lg:text-2xl dark:text-gray-400 leading-relaxed" suppressHydrationWarning>
                {t('landing.hero.subtitle')}
              </p>
            </motion.div>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/translate" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full group relative px-8 py-6 text-lg font-medium overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center">
                    <Languages className="mr-3 h-6 w-6 transition-transform group-hover:scale-110" />
                    <span suppressHydrationWarning>{t('landing.hero.cta')}</span>
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button size="lg" className="w-full group relative px-8 py-6 text-lg font-medium overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center">
                    <Crown className="mr-3 h-6 w-6 transition-transform group-hover:scale-110 text-yellow-500" />
                    <span suppressHydrationWarning>{t('landing.hero.subscribe')}</span>
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                    <Sparkles className="absolute top-0 right-0 h-4 w-4 text-yellow-400 animate-pulse" />
                  </span>
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <motion.section 
        className="w-full py-12 bg-primary/5"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <div className="container px-4 md:px-6">
          <motion.div 
            className="text-center mb-8"
            variants={item}
          >
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="h-px w-8 bg-primary/60" />
              <h2 className="text-2xl font-bold" suppressHydrationWarning>{t('landing.features.title')}</h2>
              <div className="h-px w-8 bg-primary/60" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto text-sm" suppressHydrationWarning>
              {t('landing.features.subtitle')}
            </p>
          </motion.div>
          <div className="grid gap-4 lg:grid-cols-5 md:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div key={i} variants={item}>
                <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm border-primary/10 h-[240px] flex flex-col">
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="mb-4 rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/0 animate-spin-slow" />
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors" suppressHydrationWarning>
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm flex-1" suppressHydrationWarning>
                      {feature.description}
                    </p>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform" />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Highlights Section */}
      <motion.section 
        className="w-full py-12"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <div className="container px-4 md:px-6">
          <motion.div 
            className="text-center mb-8"
            variants={item}
          >
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="h-px w-8 bg-primary/60" />
              <h2 className="text-2xl font-bold" suppressHydrationWarning>{t('landing.highlights.title')}</h2>
              <div className="h-px w-8 bg-primary/60" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto text-sm" suppressHydrationWarning>
              {t('landing.highlights.subtitle')}
            </p>
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
            {highlights.map((highlight, i) => (
              <motion.div 
                key={i} 
                variants={item}
                className="group"
              >
                <div className="relative p-6 bg-background/50 backdrop-blur-sm rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 rounded-lg" />
                  <div className="relative">
                    <div className="mb-4 p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors w-12 h-12 flex items-center justify-center">
                      {highlight.icon}
                    </div>
                    <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors" suppressHydrationWarning>
                      {highlight.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm" suppressHydrationWarning>
                      {highlight.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Steps Section */}
      <motion.section 
        className="w-full py-12 bg-primary/5"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <div className="container px-4 md:px-6">
          <motion.div 
            className="text-center mb-8"
            variants={item}
          >
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="h-px w-8 bg-primary/60" />
              <h2 className="text-2xl font-bold" suppressHydrationWarning>{t('landing.steps.title')}</h2>
              <div className="h-px w-8 bg-primary/60" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto text-sm" suppressHydrationWarning>
              {t('landing.steps.subtitle')}
            </p>
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div 
                key={i} 
                variants={item}
                className="relative flex flex-col items-center text-center group"
              >
                <div className="mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary relative overflow-hidden group-hover:bg-primary/20 transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/0 animate-spin-slow" />
                      <span className="relative">{step.number}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="absolute top-1/2 left-full w-full h-px bg-gradient-to-r from-primary/40 to-primary/0 -translate-y-1/2 hidden lg:block" />
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors" suppressHydrationWarning>
                  {step.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm" suppressHydrationWarning>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section 
        className="w-full py-12"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <div className="container px-4 md:px-6">
          <motion.div 
            className="text-center mb-8"
            variants={item}
          >
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="h-px w-8 bg-primary/60" />
              <h2 className="text-2xl font-bold" suppressHydrationWarning>{t('landing.testimonials.title')}</h2>
              <div className="h-px w-8 bg-primary/60" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto text-sm" suppressHydrationWarning>
              {t('landing.testimonials.subtitle')}
            </p>
          </motion.div>
          <div className="relative overflow-hidden">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={30}
              slidesPerView={1}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
              }}
              navigation
              loop
              className="testimonials-swiper"
            >
              {testimonials.map((testimonial, i) => (
                <SwiperSlide key={i}>
                  <Card className="group bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-primary/10 hover:border-primary/30 h-[280px] flex flex-col">
                    <CardContent className="p-6 relative flex flex-col flex-1">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                      <div className="mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <span key={i} className="text-yellow-400 animate-pulse">★</span>
                        ))}
                      </div>
                      <p className="mb-4 text-base italic text-gray-600 dark:text-gray-300 relative flex-1" suppressHydrationWarning>
                        <span className="absolute -top-2 -left-2 text-4xl text-primary/20">"</span>
                        {testimonial.quote}
                        <span className="absolute -bottom-4 -right-2 text-4xl text-primary/20">"</span>
                      </p>
                      <div className="flex items-center space-x-3 mt-auto">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm relative overflow-hidden group-hover:bg-primary/20 transition-colors">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/0 animate-spin-slow" />
                          <span className="relative" suppressHydrationWarning>{testimonial.author[0]}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm" suppressHydrationWarning>{testimonial.author}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400" suppressHydrationWarning>{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </motion.section>
    </div>
  )
}