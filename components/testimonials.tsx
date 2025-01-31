"use client"

import { useEffect } from 'react'
import { useI18n } from '@/lib/i18n/use-translations'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Quote } from 'lucide-react'

// 导入 Swiper 相关组件和样式
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export function Testimonials() {
  const { t } = useI18n()

  return (
    <section className="py-16 bg-muted/50">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('landing.testimonials.title')}</h2>
          <p className="text-muted-foreground">{t('landing.testimonials.subtitle')}</p>
        </div>

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
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <SwiperSlide key={index}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <Quote className="w-8 h-8 mb-4 text-primary" />
                  <blockquote className="mb-4 text-lg">
                    {t(`landing.testimonials.${index}.quote`)}
                  </blockquote>
                  <footer>
                    <div className="font-semibold">
                      {t(`landing.testimonials.${index}.author`)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t(`landing.testimonials.${index}.role`)}
                    </div>
                  </footer>
                </CardContent>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
} 