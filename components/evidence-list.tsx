import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, FileText } from "lucide-react"

interface Evidence {
  title: string
  link: string
  snippet: string
}

interface EvidenceListProps {
  evidence: Evidence[]
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  if (evidence.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Supporting Evidence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {evidence.map((item, index) => (
            <li key={index} className="border-b pb-4 last:border-0 last:pb-0">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 hover:text-primary transition-colors"
              >
                <span className="font-medium text-sm">{item.title}</span>
                <ExternalLink className="w-3 h-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <p className="text-sm text-muted-foreground mt-1">{item.snippet}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
