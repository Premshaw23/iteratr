'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronRight } from 'lucide-react'

interface Activity {
  date: string
  count: number
}

interface DayCell {
  date: Date
  dateStr: string
  count: number
  isMonthStart: boolean
}

interface MonthGroup {
  name: string
  weeks: DayCell[][]
}

export default function ActivityGrid({
  streakCount = 0,
}: {
  streakCount?: number
}) {
  const [data, setData] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [viewYear, setViewYear] = useState(new Date().getFullYear())

  useEffect(() => {
    let mounted = true
    fetch('/api/user/activity')
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return
        setData(Array.isArray(json) ? json : [])
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const activityMap = useMemo(() => {
    return new Map(data.map((item) => [item.date, item.count]))
  }, [data])

  const { monthGroups, activeDays, maxStreak } = useMemo(() => {
    // 1. Generate full year grid for the selected year
    const startOfYear = new Date(viewYear, 0, 1)
    const endOfYear = new Date(viewYear, 11, 31)
    
    // We want the grid to handle full weeks (Sun-Sat)
    // Find the first Sunday on or before Jan 1
    const firstSunday = new Date(startOfYear)
    firstSunday.setDate(startOfYear.getDate() - startOfYear.getDay())
    
    // Find the last Saturday on or after Dec 31
    const lastSaturday = new Date(endOfYear)
    lastSaturday.setDate(endOfYear.getDate() + (6 - endOfYear.getDay()))

    const monthGroups: MonthGroup[] = []
    let activeDays = 0
    let currentStreak = 0
    let maxStreak = 0

    for (let m = 0; m < 12; m++) {
      const monthWeeks: DayCell[][] = []
      const monthStart = new Date(viewYear, m, 1)
      const monthEnd = new Date(viewYear, m + 1, 0)

      // Start of month's grid (Sunday of the first week)
      const startOfGrid = new Date(monthStart)
      startOfGrid.setDate(monthStart.getDate() - monthStart.getDay())

      // End of month's grid (Saturday of the last week)
      const endOfGrid = new Date(monthEnd)
      endOfGrid.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()))

      const totalDaysInGrid = Math.ceil((endOfGrid.getTime() - startOfGrid.getTime()) / (1000 * 60 * 60 * 24)) + 1
      for (let w = 0; w < totalDaysInGrid / 7; w++) {
        const week: DayCell[] = []
        for (let d = 0; d < 7; d++) {
          const date = new Date(startOfGrid)
          date.setDate(startOfGrid.getDate() + (w * 7) + d)
          
          const isThisMonth = date.getMonth() === m
          const dateStr = date.toISOString().split('T')[0]
          const count = isThisMonth ? (activityMap.get(dateStr) || 0) : 0
          
          if (count > 0 && isThisMonth) {
             activeDays++
             currentStreak++
             if (currentStreak > maxStreak) maxStreak = currentStreak
          } else if (isThisMonth) {
             currentStreak = 0
          }

          week.push({ 
            date, 
            dateStr, 
            count: isThisMonth ? count : -1, // -1 means "not in this month's block"
            isMonthStart: date.getDate() === 1
          })
        }
        monthWeeks.push(week)
      }
      monthGroups.push({
        name: monthStart.toLocaleString('default', { month: 'short' }).toUpperCase(),
        weeks: monthWeeks
      })
    }

    return { monthGroups, activeDays, maxStreak }
  }, [activityMap, viewYear])

  const getIntensity = (count: number) => {
    if (count === -1) return 'opacity-0 pointer-events-none'
    if (count === 0) return 'bg-[#EBEDF0] dark:bg-slate-800/40' // Match GitHub empty exactly
    if (count <= 2)  return 'bg-[#9BE9A8] shadow-sm' 
    if (count <= 5)  return 'bg-[#40C463]'
    if (count <= 9)  return 'bg-[#30A14E]'
    return 'bg-[#216E39]'
  }

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-slate-100 bg-white p-8 shadow-sm animate-pulse">
        <div className="h-4 w-48 bg-slate-50 rounded mb-4" />
        <div className="h-32 w-full bg-slate-50/50 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white p-8 shadow-sm overflow-hidden select-none">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
        <div className="flex flex-col gap-1.5">
           <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
               <Calendar size={18} />
             </div>
             <h3 className="text-base font-black text-[#1A1D1F] tracking-tighter uppercase">Code Frequency</h3>
           </div>
           <p className="text-[10px] font-black text-[#6F767E] uppercase tracking-[0.1em]">
             {activeDays} ACTIVE DAYS IN {viewYear} • CURRENT STREAK: {streakCount}D • MAX STREAK: {maxStreak}
           </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-1.5 bg-[#F4F4F4]/70 p-1.2 rounded-[14px] border border-slate-100 shadow-inner">
           {[2026, 2025].map(y => (
             <button
               key={y}
               onClick={() => setViewYear(y)}
               className={`px-5 py-1.8 rounded-[11px] text-[10.5px] font-black transition-all ${viewYear === y ? 'bg-white text-[#1A1D1F] shadow-md border-[0.5px] border-slate-100' : 'text-[#9A9FA5] hover:text-[#1A1D1F]'}`}
             >
               {y}
             </button>
           ))}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-none">
        <div className="flex gap-11 min-w-max pb-6 pl-2">
           {/* Day Labels Column */}
           <div className="flex flex-col gap-[7.7px] mt-[25px]">
             {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
               <span key={d} className="text-[8.5px] h-3.5 flex items-center font-black text-[#9A9FA5] tracking-widest">{d}</span>
             ))}
           </div>

           {/* Month Blocks */}
           <div className="flex gap-4">
             {monthGroups.map((month) => (
               <div key={month.name} className="flex flex-col gap-3">
                 <span className="text-[10px] font-black text-[#1A1D1F] tracking-widest">{month.name}</span>
                 <div className="flex gap-[7.5px]">
                    {month.weeks.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-[7.5px]">
                        {week.map((day, dIdx) => (
                          <div 
                            key={dIdx}
                            title={day.count >= 0 ? `${day.date.toLocaleDateString()} • ${day.count} blocks` : ''}
                            className={`w-3.5 h-3.5 rounded-sm transition-all duration-200 cursor-pointer hover:scale-125 hover:rotate-6 ${getIntensity(day.count)}`}
                          />
                        ))}
                      </div>
                    ))}
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Footer / Legend */}
      <div className="flex justify-end pt-4 border-t border-slate-50">
        <div className="flex items-center gap-3 text-[10px] font-black text-[#6F767E] uppercase tracking-widest">
           <span>Less</span>
           <div className="flex gap-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-[#EBEDF0]" />
              <div className="w-3.5 h-3.5 rounded-sm bg-[#9BE9A8]" />
              <div className="w-3.5 h-3.5 rounded-sm bg-[#40C463]" />
              <div className="w-3.5 h-3.5 rounded-sm bg-[#30A14E]" />
              <div className="w-3.5 h-3.5 rounded-sm bg-[#216E39]" />
           </div>
           <span>More</span>
        </div>
      </div>
    </div>
  )
}