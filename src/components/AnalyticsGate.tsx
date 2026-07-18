import { LucideIcon } from 'lucide-react';
import EmptyInsightState from './EmptyInsightState';

interface AnalyticsGateProps {
  /** The number of real data points currently available */
  dataPoints: number;
  /** Minimum required to show the chart */
  minRequired: number;
  /** Icon for the empty state */
  emptyIcon: LucideIcon;
  /** Short title for the empty state */
  emptyTitle: string;
  /** Description for the empty state */
  emptyDescription: string;
  /** The chart or content to render when gate passes */
  children: React.ReactNode;
}

/**
 * Renders children only when dataPoints >= minRequired.
 * Otherwise renders a polished EmptyInsightState.
 * Never shows fabricated data.
 */
export default function AnalyticsGate({
  dataPoints,
  minRequired,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  children,
}: AnalyticsGateProps) {
  if (dataPoints >= minRequired) {
    return <>{children}</>;
  }

  return (
    <EmptyInsightState
      icon={emptyIcon}
      title={emptyTitle}
      description={emptyDescription}
      minPoints={minRequired}
      currentPoints={dataPoints}
    />
  );
}
