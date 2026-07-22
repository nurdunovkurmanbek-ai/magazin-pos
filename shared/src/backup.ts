/** Backup түрү */
export enum BackupType {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
  PRE_RESTORE = 'PRE_RESTORE',
}

/** Backup статусу */
export enum BackupStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/** Backup жазуусу */
export interface BackupRecord {
  id: string;
  filename: string;
  sizeBytes: number;
  type: BackupType;
  status: BackupStatus;
  includesDb: boolean;
  includesFiles: boolean;
  createdById: string | null;
  createdBy?: { firstName: string; lastName: string } | null;
  errorMessage: string | null;
  createdAt: string;
}

/** Backup конфигурациясы */
export interface BackupConfig {
  backupAutoEnabled: boolean;
  backupIntervalHours: number;
  backupRetentionCount: number;
}

/** Backup статистикасы */
export interface BackupStats {
  totalBackups: number;
  totalSizeBytes: number;
  lastBackupAt: string | null;
  lastBackupStatus: BackupStatus | null;
}

/** Backup тизмеси жообу */
export interface BackupListResponse {
  items: BackupRecord[];
  stats: BackupStats;
}
