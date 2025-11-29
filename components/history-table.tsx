"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, ExternalLink } from "lucide-react"

interface HistoryItem {
  id: string
  claim: string
  verdict: "true" | "false" | "misleading" | "unknown"
  timestamp: string
  confidence: number
  explanation: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const verdictVariant = {
  true: "default" as const,
  false: "destructive" as const,
  misleading: "secondary" as const,
  unknown: "outline" as const,
}

export function HistoryTable() {
  const { data: responseData, isLoading } = useSWR("/api/history", fetcher)
  
  // Extract verifications array from response
  const data = responseData?.verifications || []
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)

  if (isLoading) {
    return <p className="text-muted-foreground">Loading history...</p>
  }

  if (!data || data.length === 0) {
    return <p className="text-muted-foreground">No verification history yet.</p>
  }

  return (
    <>
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim Summary</TableHead>
              <TableHead className="w-[100px]">Verdict</TableHead>
              <TableHead className="w-[100px]">Confidence</TableHead>
              <TableHead className="w-[150px]">Timestamp</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-md truncate">{item.claim}</TableCell>
                <TableCell>
                  <Badge variant={verdictVariant[item.verdict]}>{item.verdict}</Badge>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {item.confidence}%
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(item.timestamp).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Link href={`/results?claim=${encodeURIComponent(item.claim)}&fromHistory=true`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Claim</h4>
                <p className="text-sm text-muted-foreground">{selectedItem.claim}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Verdict</h4>
                  <Badge variant={verdictVariant[selectedItem.verdict]}>{selectedItem.verdict}</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Confidence</h4>
                  <p className="text-sm">{selectedItem.confidence}%</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Explanation</h4>
                <p className="text-sm text-muted-foreground">{selectedItem.explanation}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
