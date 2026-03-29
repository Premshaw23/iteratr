'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import type { TopicStatsRow } from '@/types/database'

interface Props {
  stats: TopicStatsRow[]
}

export default function MasteryRadar({ stats }: Props) {
  // 1. Group by Topic and calculate avg pct
  const topicMap: Record<string, { solved: number; total: number }> = {}

  stats.forEach(s => {
    if (!topicMap[s.topic]) {
      topicMap[s.topic] = { solved: 0, total: 0 }
    }
    topicMap[s.topic].solved += s.solved_count
    topicMap[s.topic].total += (s.solved_count + s.fail_count)
  })

  // 2. Format for Recharts
  let data = Object.entries(topicMap).map(([topic, counts]) => {
    const pct = counts.total === 0 ? 0 : Math.round((counts.solved / counts.total) * 100)
    return {
      subject: topic.replace(/_/g, ' ').toUpperCase(),
      A:       Math.max(pct, 10), // minimum for visual
      fullMark: 100,
    }
  })

  // 3. Ensure at least 3 points for a radar polygon
  if (data.length === 1) {
    data.push({ subject: 'TREES', A: 0, fullMark: 100 })
    data.push({ subject: 'GRAPHS', A: 0, fullMark: 100 })
  } else if (data.length === 2) {
    data.push({ subject: 'DYNAMIC PROG.', A: 0, fullMark: 100 })
  }

  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
      <p className="text-xs text-muted font-medium italic">No topic data yet. Start a session!</p>
    </div>
  )

  return (
    <div className="w-full h-full min-h-[240px]">
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Mastery"
            dataKey="A"
            stroke="#2D4EF5"
            fill="#2D4EF5"
            fillOpacity={0.15}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
