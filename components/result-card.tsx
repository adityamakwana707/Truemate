import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from "lucide-react"

interface ResultCardProps {
  claim: string
  verdict: "true" | "false" | "misleading" | "unknown"
  confidence: number
  explanation: string
}

const verdictConfig = {
  true: {
    label: "True",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    progressColor: "bg-green-500",
  },
  false: {
    label: "False",
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    progressColor: "bg-red-500",
  },
  misleading: {
    label: "Misleading",
    icon: AlertTriangle,
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    progressColor: "bg-yellow-500",
  },
  unknown: {
    label: "Unknown",
    icon: HelpCircle,
    className: "bg-muted text-muted-foreground border-muted",
    progressColor: "bg-muted-foreground",
  },
}

export function ResultCard({ claim, verdict, confidence, explanation }: ResultCardProps) {
  const config = verdictConfig[verdict] || verdictConfig.unknown
  const Icon = config.icon

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Claim text */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Claim</p>
          <h2 className="text-xl font-semibold leading-relaxed">{claim}</h2>
        </div>

        {/* Verdict badge - more prominent */}
        <div className="flex items-center gap-4">
          <Badge variant="outline" className={`text-base py-2 px-4 gap-2 ${config.className}`}>
            <Icon className="w-5 h-5" />
            {config.label}
          </Badge>
        </div>

        {/* Confidence score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Confidence Score</span>
            <span className="font-semibold">{confidence}%</span>
          </div>
          <div className="h-2 bg-muted overflow-hidden">
            <div className={`h-full transition-all ${config.progressColor}`} style={{ width: `${confidence}%` }} />
          </div>
        </div>

        {/* Explanation */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Analysis</p>
          <p className="text-muted-foreground leading-relaxed">{explanation}</p>
        </div>
      </CardContent>
    </Card>
  )
}
