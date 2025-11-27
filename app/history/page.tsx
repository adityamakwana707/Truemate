import { Header } from "@/components/header"
import { HistoryTable } from "@/components/history-table"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Verification History</h1>
          <p className="text-muted-foreground">Your past fact-checks and saved claims</p>
        </div>

        {/* Quick stats */}
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">127</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">68</p>
                <p className="text-xs text-muted-foreground">True</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">32</p>
                <p className="text-xs text-muted-foreground">False</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">27</p>
                <p className="text-xs text-muted-foreground">Misleading</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <HistoryTable />
      </main>
    </div>
  )
}
