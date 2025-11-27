import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ShieldCheck } from "lucide-react"

interface SourceCredibilityBadgeProps {
  score: number
}

export function SourceCredibilityBadge({ score }: SourceCredibilityBadgeProps) {
  const getScoreLabel = (score: number) => {
    if (score >= 80) return "High"
    if (score >= 50) return "Medium"
    return "Low"
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Source Credibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{getScoreLabel(score)}</span>
          <span className="font-medium">{score}/100</span>
        </div>
        <Progress value={score} className="h-2" />
      </CardContent>
    </Card>
  )
}
