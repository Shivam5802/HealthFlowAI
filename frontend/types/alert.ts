export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'WARNING';
export type AlertStatus = 'OPEN' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface AlertItem {
  id: string;
  facilityId: string;
  resourceId?: string | null;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  createdAt: string;
  resolvedAt?: string | null;
  facility?: {
    id: string;
    name: string;
    district: string;
  };
  resource?: {
    id: string;
    name: string;
    unit: string;
  };
}
