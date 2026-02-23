import { Download, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface BoxCardProps {
  id: number;
  name: string;
  logoColor: string;
  logoText: string;
  description: string;
  tags: string[];
  gameCount: number;
  rating: number;
  discount: string;
}

export function BoxCard({ id, name, logoColor, logoText, description, tags, gameCount, rating, discount }: BoxCardProps) {
  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-blue-900/10 group">
      <CardContent className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Logo Section */}
        <div className={`w-16 h-16 rounded-xl ${logoColor} flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0`}>
          {logoText}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{name}</h3>
            {discount && (
              <Badge className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-500/20">
                {discount}
              </Badge>
            )}
            <div className="flex items-center text-yellow-500 text-xs">
              <Star className="h-3 w-3 fill-current" />
              <span className="ml-1 font-medium">{rating}</span>
            </div>
          </div>
          
          <p className="text-sm text-slate-400 mb-3 line-clamp-1">
            {description}
          </p>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">
                {tag}
              </span>
            ))}
            <span className="text-xs px-2 py-1 text-slate-500">
              收录游戏 {gameCount}+
            </span>
          </div>
        </div>

        {/* Action Section */}
        <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
          <Button className="flex-1 md:w-32 bg-blue-600 hover:bg-blue-700 font-semibold shadow-lg shadow-blue-900/20" asChild>
            <Link href={`/boxes/${id}`}>
              查看详情
            </Link>
          </Button>
          <Button variant="outline" className="flex-1 md:w-32 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
            <Link href={`/boxes/${id}/download`}>
              <Download className="h-4 w-4 mr-2" />
              下载
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
