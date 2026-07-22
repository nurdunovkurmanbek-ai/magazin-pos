import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Database, Download, Upload, Trash2, RotateCcw, Loader2, Shield, HardDrive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle,
} from '@/components/ui/modal';
import { useBackups } from '@/hooks/useBackups';
import { useStoreSettings } from '@/providers/StoreSettingsProvider';
import type { BackupRecord, StoreSettingsInput } from '@magazin/shared';
import { BackupType } from '@magazin/shared';
import { formatDateTime } from '@/lib/locale';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPE_KEYS: Record<BackupType, string> = {
  [BackupType.MANUAL]: 'backup.typeManual',
  [BackupType.AUTO]: 'backup.typeAuto',
  [BackupType.PRE_RESTORE]: 'backup.typePreRestore',
};

interface BackupTabProps {
  form: StoreSettingsInput;
  setForm: React.Dispatch<React.SetStateAction<StoreSettingsInput | null>>;
  canManage: boolean;
}

export function BackupTab({ form, setForm, canManage }: BackupTabProps) {
  const { t, i18n } = useTranslation();
  const {
    backups, stats, isLoading, actionLoading,
    createBackup, restoreBackup, uploadRestore, deleteBackup, downloadBackup,
  } = useBackups();
  const { refetch: refetchSettings } = useStoreSettings();

  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackupRecord | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof StoreSettingsInput>(key: K, value: StoreSettingsInput[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCreate = async () => {
    setError('');
    try {
      await createBackup();
    } catch (err) {
      setError((err as Error).message || t('backup.createError'));
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setError('');
    try {
      await restoreBackup(restoreTarget.id);
      setRestoreTarget(null);
      setConfirmText('');
      await refetchSettings();
      window.location.reload();
    } catch (err) {
      setError((err as Error).message || t('backup.restoreError'));
    }
  };

  const handleUploadRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      await uploadRestore(file);
      await refetchSettings();
      window.location.reload();
    } catch (err) {
      setError((err as Error).message || t('backup.restoreError'));
    } finally {
      if (uploadRef.current) uploadRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBackup(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setError((err as Error).message || t('backup.deleteError'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <HardDrive className="h-4 w-4" />
              {t('backup.totalBackups')}
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.totalBackups ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Database className="h-4 w-4" />
              {t('backup.totalSize')}
            </div>
            <p className="text-2xl font-bold mt-1">{formatBytes(stats?.totalSizeBytes ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield className="h-4 w-4" />
              {t('backup.lastBackup')}
            </div>
            <p className="text-sm font-medium mt-1">
              {stats?.lastBackupAt
                ? formatDateTime(stats.lastBackupAt, i18n.language)
                : t('common.noData')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Автоматтык backup жөндөөлөрү */}
      <Card>
        <CardHeader>
          <CardTitle>{t('backup.autoBackup')}</CardTitle>
          <CardDescription>{t('backup.autoBackupDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.backupAutoEnabled ?? true} disabled={!canManage}
              onChange={(e) => set('backupAutoEnabled', e.target.checked)} className="h-4 w-4" />
            <span className="text-sm">{t('backup.autoEnabled')}</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('backup.intervalHours')}</Label>
              <Input type="number" min="1" max="168" disabled={!canManage}
                value={form.backupIntervalHours ?? 24}
                onChange={(e) => set('backupIntervalHours', parseInt(e.target.value) || 24)} />
            </div>
            <div className="space-y-2">
              <Label>{t('backup.retentionCount')}</Label>
              <Input type="number" min="1" max="100" disabled={!canManage}
                value={form.backupRetentionCount ?? 10}
                onChange={(e) => set('backupRetentionCount', parseInt(e.target.value) || 10)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Аракеттер */}
      {canManage && (
        <div className="flex flex-wrap gap-2">
          <Button size="touch" onClick={handleCreate} disabled={actionLoading}>
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
            {t('backup.createNow')}
          </Button>
          <input ref={uploadRef} type="file" accept=".zip" className="hidden" onChange={handleUploadRestore} />
          <Button size="touch" variant="outline" disabled={actionLoading} onClick={() => uploadRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            {t('backup.uploadRestore')}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Тизме */}
      <Card>
        <CardHeader>
          <CardTitle>{t('backup.list')}</CardTitle>
          <CardDescription>{t('backup.listDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('backup.noBackups')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('backup.date')}</TableHead>
                  <TableHead>{t('backup.type')}</TableHead>
                  <TableHead>{t('backup.size')}</TableHead>
                  <TableHead>{t('backup.status')}</TableHead>
                  {canManage && <TableHead>{t('reports.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-sm">{formatDateTime(b.createdAt, i18n.language)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(TYPE_KEYS[b.type])}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatBytes(b.sizeBytes)}</TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'COMPLETED' ? 'success' : b.status === 'FAILED' ? 'destructive' : 'secondary'}>
                        {t(`backup.status_${b.status.toLowerCase()}`)}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-1">
                          {b.status === 'COMPLETED' && (
                            <>
                              <Button variant="ghost" size="icon-touch" onClick={() => downloadBackup(b.id, b.filename)} title={t('backup.download')}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon-touch" onClick={() => { setRestoreTarget(b); setConfirmText(''); }} title={t('backup.restore')}>
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon-touch" className="text-destructive" onClick={() => setDeleteTarget(b)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Restore ырастоо */}
      <Modal open={!!restoreTarget} onOpenChange={(o) => !o && setRestoreTarget(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t('backup.restoreTitle')}</ModalTitle>
            <ModalDescription>{t('backup.restoreDesc')}</ModalDescription>
          </ModalHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-destructive font-medium">{t('backup.restoreWarning')}</p>
            <div className="space-y-2">
              <Label>{t('backup.confirmRestore')}</Label>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="RESTORE" />
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" size="touch" onClick={() => setRestoreTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" size="touch" disabled={confirmText !== 'RESTORE' || actionLoading} onClick={handleRestore}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('backup.restore')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete ырастоо */}
      <Modal open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t('backup.deleteTitle')}</ModalTitle>
            <ModalDescription>{deleteTarget?.filename}</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" size="touch" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" size="touch" disabled={actionLoading} onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
