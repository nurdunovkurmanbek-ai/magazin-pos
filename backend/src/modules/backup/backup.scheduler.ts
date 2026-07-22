import cron from 'node-cron';
import { BackupService } from './backup.service';

let scheduled = false;

/** Автоматтык backup пландаштыруучу — ар 1 саатта текшерет */
export function startBackupScheduler(): void {
  if (scheduled) return;
  scheduled = true;

  cron.schedule('0 * * * *', () => {
    void BackupService.runAutoBackup();
  });

  setTimeout(() => {
    void BackupService.runAutoBackup();
  }, 30_000);

  console.log('📦 Backup пландаштыруучу иштетилди');
}
