'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import type { EloHistoryRow } from '@/types/database'

interface Props {
  history: EloHistoryRow[]
}

export default function EloChart({ history }: Props) {
  // 1. Prepare data (reverse to chronological order)
  const data = history
    .map((h, i) => ({
      index: i,
      elo:   h.elo_after,
      date:  new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
    .reverse()

  if (data.length < 2) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 border border-border rounded-xl">
        <div className="text-3xl grayscale opacity-50 mb-2">📈</div>
        <p className="text-xs text-muted font-bold uppercase tracking-wider">Historical Trend</p>
        <p className="text-[11px] text-muted">Complete more sessions to see your Elo trend line.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorElo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2D4EF5" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#2D4EF5" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              fontSize: '11px',
              fontWeight: 600
            }}
          />
          <Area 
            type="monotone" 
            dataKey="elo" 
            stroke="#2D4EF5" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorElo)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
