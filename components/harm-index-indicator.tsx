import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

interface HarmIndexIndicatorProps {
  level: "low" | "medium" | "high"
}

const levelConfig = {
  low: {
    label: "Low Risk",
    className: "bg-green-600 hover:bg-green-700 text-white",
  },
  medium: {
    label: "Medium Risk",
    className: "bg-yellow-600 hover:bg-yellow-700 text-white",
  },
  high: {
    label: "High Risk",
    className: "bg-red-600 hover:bg-red-700 text-white",
  },
}

export function HarmIndexIndicator({ level }: HarmIndexIndicatorProps) {
  const config = levelConfig[level] || levelConfig.low

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Harm Index
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Badge className={config.className}>{config.label}</Badge>
        <p className="text-xs text-muted-foreground mt-2">Potential impact if this claim spreads.</p>
      </CardContent>
    </Card>
  )
}
