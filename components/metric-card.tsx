import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: number; isPositive: boolean }
}

export function MetricCard({ title, value, description, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
            {trend && (
              <p className={`text-sm font-medium mt-3 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}% from last month
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
