import { memo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { Scale, Dumbbell, type LucideIcon } from 'lucide-react'
import { buildLoadData, buildWeightData, type DashboardData } from '@/lib/dashboard'

const LIME = '#A3E635'
const ORANGE = '#FB923C'

interface ChartCardProps {
  title: string
  description: string
  icon: LucideIcon
  isLoading: boolean
  hasData: boolean
  emptyTitle: string
  emptyMessage: string
  children: React.ReactNode
  chartConfig: ChartConfig
}

function ChartCardBase({
  title,
  description,
  icon: Icon,
  isLoading,
  hasData,
  emptyTitle,
  emptyMessage,
  children,
  chartConfig,
}: ChartCardProps) {
  return (
    <Card className="bg-[#12121A] border-[#262635] rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1A1A24] text-slate-300 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-white">{title}</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[260px] flex items-center justify-center">
            <div className="w-full space-y-3 px-2">
              <Skeleton className="h-[230px] w-full rounded-xl bg-[#1A1A24]" />
            </div>
          </div>
        ) : !hasData ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1A24] flex items-center justify-center mb-3">
              <Icon className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-slate-300">{emptyTitle}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[260px]">{emptyMessage}</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full aspect-auto">
            {children}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

const ChartCard = memo(ChartCardBase)

interface WeightChartProps {
  data: DashboardData
  isLoading: boolean
}

const weightConfig: ChartConfig = {
  weight: { label: 'Peso (kg)', color: LIME },
}

function WeightChartBase({ data, isLoading }: WeightChartProps) {
  const points = buildWeightData(data.progress)
  const hasData = points.length > 0

  return (
    <ChartCard
      title="Evolução de Peso"
      description="Acompanhe seu peso ao longo do tempo"
      icon={Scale}
      isLoading={isLoading}
      hasData={hasData}
      emptyTitle="Nenhum registro encontrado"
      emptyMessage="Registre suas medições para ver sua evolução"
      chartConfig={weightConfig}
    >
      <AreaChart data={points} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LIME} stopOpacity={0.35} />
            <stop offset="100%" stopColor={LIME} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#262635" vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: '#64748B', fontSize: 11 }}
          minTickGap={16}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          tick={{ fill: '#64748B', fontSize: 11 }}
          width={44}
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `${v}kg`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelKey="weight"
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { fullDate?: string } | undefined
                return p?.fullDate ?? ''
              }}
              formatter={(value) => (
                <span className="font-mono font-semibold text-[#A3E635]">
                  {Number(value).toFixed(1)} kg
                </span>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="weight"
          stroke={LIME}
          strokeWidth={2.5}
          fill="url(#weightFill)"
          dot={{ r: 3.5, fill: LIME, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: LIME, stroke: '#0B0B10', strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartCard>
  )
}

export const WeightChart = memo(WeightChartBase)

interface LoadChartProps {
  data: DashboardData
  isLoading: boolean
}

const loadConfig: ChartConfig = {
  volume: { label: 'Carga Total (kg)', color: ORANGE },
}

function LoadChartBase({ data, isLoading }: LoadChartProps) {
  const points = buildLoadData(data.workoutLogs)
  const hasData = points.length > 0

  // Limite de barras exibidas para manter legibilidade (mais recentes).
  const shown = points.length > 12 ? points.slice(points.length - 12) : points

  return (
    <ChartCard
      title="Carga Total por Treino"
      description="Volume total treinado por sessão"
      icon={Dumbbell}
      isLoading={isLoading}
      hasData={hasData}
      emptyTitle="Nenhum treino registrado"
      emptyMessage="Complete treinos para ver sua progressão de carga"
      chartConfig={loadConfig}
    >
      <BarChart data={shown} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ORANGE} stopOpacity={1} />
            <stop offset="100%" stopColor={ORANGE} stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#262635" vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: '#64748B', fontSize: 11 }}
          minTickGap={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          tick={{ fill: '#64748B', fontSize: 11 }}
          width={48}
          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
        />
        <ChartTooltip
          cursor={{ fill: 'rgba(251,146,60,0.08)' }}
          content={
            <ChartTooltipContent
              labelKey="volume"
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { fullDate?: string } | undefined
                return p?.fullDate ?? ''
              }}
              formatter={(value) => (
                <span className="font-mono font-semibold text-[#FB923C]">
                  {Math.round(Number(value)).toLocaleString('pt-BR')} kg
                </span>
              )}
            />
          }
        />
        <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={46}>
          {shown.map((entry, i) => (
            <Cell key={i} fill="url(#barFill)" />
          ))}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

export const LoadChart = memo(LoadChartBase)

/** Charts Section — 2 colunas no desktop, empilhadas no mobile. */
function ChartsSectionBase({ data, isLoading }: { data: DashboardData; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <WeightChart data={data} isLoading={isLoading} />
      <LoadChart data={data} isLoading={isLoading} />
    </div>
  )
}

export const ChartsSection = memo(ChartsSectionBase)
export default ChartsSection
