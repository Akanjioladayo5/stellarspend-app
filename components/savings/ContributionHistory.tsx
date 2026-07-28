'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { Contribution } from '@/lib/types/savings'

interface ContributionHistoryProps {
  contributions: Contribution[]
  goalName: string
}

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  scheduled: 'Scheduled',
  'round-up': 'Round-Up',
}

const SOURCE_COLORS: Record<string, string> = {
  manual: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'round-up': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
}

export function ContributionHistory({
  contributions,
  goalName,
}: ContributionHistoryProps) {
  const sorted = [...contributions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contribution History</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No contributions yet for &quot;{goalName}&quot;
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((contribution) => (
              <div
                key={contribution.id}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      ${contribution.amount.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${SOURCE_COLORS[contribution.source]}`}
                    >
                      {SOURCE_LABELS[contribution.source]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(contribution.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
