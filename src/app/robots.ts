import { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site/site'

/**
 * 生成 robots.txt
 * 文档: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const hostname = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : siteConfig.hostname

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
      },
    ],
  }
}
