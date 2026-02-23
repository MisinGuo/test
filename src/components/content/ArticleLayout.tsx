'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, Calendar, Clock, BookOpen, Gamepad2, PanelRightClose, PanelRightOpen, List, Pin, PinOff, GripHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import MarkdownRenderer from './MarkdownRenderer'
import { DownloadBox, BackToListButton } from './DownloadBox'
import type { ModuleConfig } from '@/config'

interface ArticleFrontmatter {
  title: string
  date?: string
  category?: string
  tags?: string[]
  [key: string]: any
}

interface ArticleLayoutProps {
  config: ModuleConfig
  frontmatter: ArticleFrontmatter
  content: string
  readingTime: number
  toc?: { level: number; text: string; id: string }[]
  gameName?: string
}

/**
 * 通用文章布局组件
 * 根据模块配置动态渲染不同的布局和组件
 */
export function ArticleLayout({
  config,
  frontmatter,
  content,
  readingTime,
  toc = [],
  gameName,
}: ArticleLayoutProps) {
  const { theme, articleDetail, sidebar, downloadEntry } = config
  
  // 侧边栏显示状态（桌面端）
  const [sidebarVisible, setSidebarVisible] = useState(true)
  // 移动端目录抽屉状态
  const [mobileTocOpen, setMobileTocOpen] = useState(false)
  // 移动端目录高度（可拖动调整）
  const [sheetHeight, setSheetHeight] = useState(50) // 百分比
  // 点击后是否自动关闭
  const [autoClose, setAutoClose] = useState(true)
  // 当前活跃的章节 ID
  const [activeId, setActiveId] = useState<string>('')
  // 拖动状态
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(50)

  // 监听滚动，更新当前活跃章节
  useEffect(() => {
    if (toc.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    )

    // 观察所有标题元素
    toc.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [toc])

  // 处理拖动开始
  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isDragging.current = true
    startHeight.current = sheetHeight
    if ('touches' in e) {
      startY.current = e.touches[0].clientY
    } else {
      startY.current = e.clientY
    }
  }, [sheetHeight])

  // 处理拖动移动
  useEffect(() => {
    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging.current) return
      
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const deltaY = startY.current - clientY
      const deltaPercent = (deltaY / window.innerHeight) * 100
      const newHeight = Math.min(85, Math.max(25, startHeight.current + deltaPercent))
      setSheetHeight(newHeight)
    }

    const handleEnd = () => {
      isDragging.current = false
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [])

  // 清理标题
  const cleanTitle = frontmatter.title
    .replace(/[?？]/g, ' - ')
    .split(/[,，;；]/)[0]
    .trim()

  // 判断是否应该显示侧边栏
  const showSidebar = sidebar.enabled && sidebarVisible

  return (
    <div className="bg-slate-950 min-h-screen pb-20 md:pb-0">
      {/* Breadcrumbs */}
      {articleDetail.showBreadcrumb && (
        <nav className="bg-slate-900 border-b border-slate-800 py-3" aria-label="Breadcrumb">
          <div className="container mx-auto px-4 flex items-center text-sm text-slate-400 flex-wrap gap-1">
            <Link href="/" className="hover:text-white">首页</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={config.routePrefix} className="hover:text-white">{config.title}</Link>
            {frontmatter.category && (
              <>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="text-white font-medium">{frontmatter.category}</span>
              </>
            )}
          </div>
        </nav>
      )}

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <article className={`transition-all duration-300 ${showSidebar ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {/* Article Header */}
          <header className="mb-8">
            <div className="flex gap-2 mb-4 flex-wrap">
              <Badge variant="secondary" className={theme.badgeColor}>
                {config.type === 'special' ? (
                  <Gamepad2 className="h-3 w-3 mr-1" />
                ) : (
                  <BookOpen className="h-3 w-3 mr-1" />
                )}
                {theme.badgeText}
              </Badge>
              {frontmatter.category && (
                <Badge variant="outline" className="text-slate-400 border-slate-700">
                  {frontmatter.category}
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
              {cleanTitle}
            </h1>
            
            {articleDetail.showMeta && (
              <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                {frontmatter.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {frontmatter.date}
                  </span>
                )}
                {articleDetail.showTOC && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    阅读约 {readingTime} 分钟
                  </span>
                )}
              </div>
            )}
          </header>

          <Separator className="my-6 bg-slate-800" />

          {/* Download Entry - In Content */}
          {downloadEntry.enabled && (downloadEntry.position === 'all' || downloadEntry.position === 'header') && (
            <DownloadBox config={config} gameName={gameName} />
          )}

          {/* Article Body */}
          <MarkdownRenderer content={content} />

          <Separator className="my-8 bg-slate-800" />

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <BackToListButton config={config} />
            
            {downloadEntry.enabled && (
              <Link 
                href={downloadEntry.buttonLink}
                className="inline-flex items-center justify-center px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-lg transition-all text-sm"
              >
                下载游戏盒子
              </Link>
            )}
          </div>
        </article>

        {/* Sidebar */}
        {sidebar.enabled && (
          <aside className={`hidden lg:block lg:col-span-4 transition-all duration-300 ${sidebarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
            <div className="sticky top-24 space-y-6">
              {/* TOC */}
              {sidebar.showTOC && toc.length > 0 && (
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white">目录</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarVisible(false)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                        title="关闭目录"
                      >
                        <PanelRightClose className="h-4 w-4" />
                      </Button>
                    </div>
                    <nav className="space-y-2">
                      {toc.map((item, index) => (
                        <a 
                          key={index}
                          href={`#${item.id}`}
                          className={`block text-sm transition-colors ${
                            item.level === 3 ? 'pl-4' : ''
                          } ${
                            activeId === item.id 
                              ? 'text-orange-400 font-medium border-l-2 border-orange-400 pl-2' 
                              : 'text-slate-400 hover:text-orange-400'
                          }`}
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              )}

              {/* Download Box in Sidebar */}
              {sidebar.showDownload && (
                <DownloadBox config={config} gameName={gameName} />
              )}

              {/* Related Articles Placeholder */}
              {sidebar.showRelated && (
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-white mb-4">相关{config.title}</h3>
                    <p className="text-sm text-slate-500">更多精彩内容即将上线...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>
        )}

        {/* 浮动按钮 - 打开目录 */}
        {sidebar.enabled && sidebar.showTOC && toc.length > 0 && !sidebarVisible && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarVisible(true)}
            className="hidden lg:flex fixed right-6 top-28 z-50 bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 shadow-lg"
            title="打开目录"
          >
            <PanelRightOpen className="h-4 w-4 mr-2" />
            目录
          </Button>
        )}
      </div>

      {/* Mobile Bottom Bar - For special only */}
      {config.type === 'special' && downloadEntry.enabled && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 lg:hidden z-40 flex gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex-1">
            <p className="text-xs text-slate-400 mb-1">{gameName || cleanTitle}</p>
            <div className="text-sm font-bold text-white">
              <span className="text-orange-400">0.1折</span> 起下载
            </div>
          </div>
          <Link 
            href={downloadEntry.buttonLink}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg shadow-orange-900/20 rounded-md flex items-center justify-center"
          >
            立即下载
          </Link>
        </div>
      )}

      {/* Mobile TOC Button & Sheet */}
      {sidebar.enabled && sidebar.showTOC && toc.length > 0 && (
        <Sheet open={mobileTocOpen} onOpenChange={setMobileTocOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`lg:hidden fixed z-50 bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 shadow-lg ${
                config.type === 'special' && downloadEntry.enabled ? 'bottom-24 right-4' : 'bottom-6 right-4'
              }`}
            >
              <List className="h-4 w-4 mr-2" />
              目录
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className="bg-slate-900 border-slate-800 px-6 flex flex-col"
            style={{ height: `${sheetHeight}vh` }}
          >
            {/* 拖动手柄 */}
            <div 
              className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center cursor-ns-resize touch-none"
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <GripHorizontal className="h-5 w-5 text-slate-600" />
            </div>
            
            <SheetHeader className="mt-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-white text-left">目录</SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoClose(!autoClose)}
                  className={`h-8 px-2 text-xs ${autoClose ? 'text-orange-400' : 'text-slate-400'} hover:text-white hover:bg-slate-800`}
                  title={autoClose ? '点击后自动关闭' : '点击后保持打开'}
                >
                  {autoClose ? <Pin className="h-3 w-3 mr-1" /> : <PinOff className="h-3 w-3 mr-1" />}
                  {autoClose ? '自动关闭' : '保持打开'}
                </Button>
              </div>
            </SheetHeader>
            <nav className="mt-4 space-y-3 overflow-y-auto flex-1 pb-4 px-2">
              {toc.map((item, index) => (
                <a 
                  key={index}
                  href={`#${item.id}`}
                  onClick={() => autoClose && setMobileTocOpen(false)}
                  className={`block text-sm transition-colors py-1 ${
                    item.level === 3 ? 'pl-4' : ''
                  } ${
                    activeId === item.id 
                      ? 'text-orange-400 font-medium border-l-2 border-orange-400 pl-2' 
                      : 'text-slate-300 hover:text-orange-400 active:text-orange-500'
                  } ${item.level === 3 && activeId !== item.id ? 'text-slate-400' : ''}`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
