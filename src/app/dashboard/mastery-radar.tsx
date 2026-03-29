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

const TOPIC_LABELS: Record<string, string> = {
  arrays: 'ARRAYS',
  trees: 'TREES',
  graphs: 'GRAPHS',
  dynamic_programming: 'DYN. PROG',
  linked_lists: 'LINKED LISTS',
  system_design: 'SYS DESIGN',
  os_concepts: 'OS',
  networking: 'NETWORKING',
  mixed: 'MIXED',
}

const ALL_TOPICS = Object.keys(TOPIC_LABELS)

export default function MasteryRadar({ stats }: Props) {
  // Group by topic and calculate mastery %
  const topicMap: Record<string, { solved: number; total: number }> = {}

  // Initialize all topics at 0
  ALL_TOPICS.forEach(t => {
    topicMap[t] = { solved: 0, total: 0 }
  })

  // Fill in actual data
  stats.forEach(s => {
    const topic = s.topic
    if (topicMap[topic] !== undefined) {
      topicMap[topic].solved += s.solved_count
      topicMap[topic].total += (s.solved_count + s.fail_count)
    }
  })

  // Only show topics that have been attempted OR are always-visible anchor topics
  const anchorTopics = ['arrays', 'trees', 'graphs', 'dynamic_programming', 'linked_lists', 'system_design']
  
  const topicsWithData = Object.keys(topicMap).filter(t => 
    topicMap[t].total > 0 || anchorTopics.includes(t)
  )

  const data = topicsWithData.map(topic => {
    const counts = topicMap[topic]
    const pct = counts.total === 0 ? 0 : Math.round((counts.solved / counts.total) * 100)
    return {
      subject: TOPIC_LABELS[topic] || topic.toUpperCase(),
      A: Math.max(pct, 5), // minimum 5 for visual polygon shape
      fullMark: 100,
    }
  })

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p className="text-xs text-muted font-medium italic">No topic data yet. Start a session!</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[240px]">
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
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
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
