'use client'

import { useState } from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export function BoxesFilterSheet() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="border-slate-800 bg-slate-900 hover:bg-slate-800">
          <Filter className="h-4 w-4 mr-2" />
          筛选
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-slate-950 border-slate-800 text-white">
        <SheetHeader>
          <SheetTitle className="text-white">筛选盒子</SheetTitle>
          <SheetDescription className="text-slate-400">
            根据条件筛选合适的游戏盒子
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* 折扣力度 */}
          <div>
            <Label className="text-white mb-3 block">折扣力度</Label>
            <div className="space-y-2">
              {['0.1折', '1折', '3折', '5折', '其他'].map((discount) => (
                <div key={discount} className="flex items-center space-x-2">
                  <Checkbox id={discount} />
                  <label
                    htmlFor={discount}
                    className="text-sm text-slate-300 cursor-pointer"
                  >
                    {discount}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 特色标签 */}
          <div>
            <Label className="text-white mb-3 block">特色标签</Label>
            <div className="space-y-2">
              {['首充福利', '续充优惠', '返利高', '游戏全', '客服好'].map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox id={tag} />
                  <label
                    htmlFor={tag}
                    className="text-sm text-slate-300 cursor-pointer"
                  >
                    {tag}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-slate-700 hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              应用筛选
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
