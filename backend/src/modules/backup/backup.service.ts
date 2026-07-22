import fs from 'fs';
import path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import { ZipArchive } from 'archiver';
import unzipper from 'unzipper';
import { prisma } from '../../config/database';
import { disconnectDatabase, connectDatabase } from '../../config/database';
import { dumpDatabase, restoreDatabase } from './pg-tools';
import type { BackupRecord, BackupType, BackupStatus, BackupStats } from '@magazin/shared';
import { BackupType as BackupTypeEnum } from '@magazin/shared';

export class BackupError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'BackupError';
  }
}

const BACKUP_DIR = path.resolve(__dirname, '../../../backups');
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');
const BACKUP_VERSION = '1.0';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatFilename(type: BackupType): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const prefix = type === BackupTypeEnum.AUTO ? 'auto' : type === BackupTypeEnum.PRE_RESTORE ? 'pre-restore' : 'manual';
  return `backup-${prefix}-${ts}.zip`;
}

function toRecord(row: {
  id: string;
  filename: string;
  sizeBytes: bigint | number;
  type: string;
  status: string;
  includesDb: boolean;
  includesFiles: boolean;
  createdById: string | null;
  errorMessage: string | null;
  createdAt: Date;
  createdBy?: { firstName: string; lastName: string } | null;
}): BackupRecord {
  return {
    id: row.id,
    filename: row.filename,
    sizeBytes: Number(row.sizeBytes),
    type: row.type as BackupRecord['type'],
    status: row.status as BackupRecord['status'],
    includesDb: row.includesDb,
    includesFiles: row.includesFiles,
    createdById: row.createdById,
    createdBy: row.createdBy,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
  };
}

async function createZip(
  zipPath: string,
  sql: string,
  metadata: Record<string, unknown>
): Promise<void> {
  ensureDir(path.dirname(zipPath));

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', reject);

    archive.pipe(output);
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
    archive.append(sql, { name: 'database.sql' });

    if (fs.existsSync(UPLOADS_DIR)) {
      archive.directory(UPLOADS_DIR, 'uploads');
    }

    archive.finalize();
  });
}

async function extractZip(zipPath: string, destDir: string): Promise<{ sql: string; metadata: Record<string, unknown> }> {
  ensureDir(destDir);

  await new Promise<void>((resolve, reject) => {
    const extract = unzipper.Extract({ path: destDir });
    extract.on('close', () => resolve());
    extract.on('error', reject);
    createReadStream(zipPath).pipe(extract);
  });

  const sqlPath = path.join(destDir, 'database.sql');
  const metaPath = path.join(destDir, 'metadata.json');

  if (!fs.existsSync(sqlPath)) {
    throw new BackupError('Backup файлында database.sql жок', 400);
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8');
  const metadata = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    : {};

  if (metadata.version && metadata.version !== BACKUP_VERSION) {
    throw new BackupError('Backup версиясы дал келбейт', 400);
  }

  return { sql, metadata };
}

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function removeDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) removeDir(p);
    else fs.unlinkSync(p);
  }
  fs.rmdirSync(dir);
}

export class BackupService {
  static getBackupDir(): string {
    ensureDir(BACKUP_DIR);
    return BACKUP_DIR;
  }

  static async list(): Promise<BackupRecord[]> {
    const rows = await prisma.backupRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
    return rows.map(toRecord);
  }

  static async getStats(): Promise<BackupStats> {
    const [count, agg, last] = await Promise.all([
      prisma.backupRecord.count({ where: { status: 'COMPLETED' } }),
      prisma.backupRecord.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { sizeBytes: true },
      }),
      prisma.backupRecord.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      totalBackups: count,
      totalSizeBytes: Number(agg._sum.sizeBytes ?? 0),
      lastBackupAt: last?.createdAt.toISOString() ?? null,
      lastBackupStatus: (last?.status as BackupStatus) ?? null,
    };
  }

  static async create(type: BackupType = BackupTypeEnum.MANUAL, userId?: string): Promise<BackupRecord> {
    const filename = formatFilename(type);
    const zipPath = path.join(BACKUP_DIR, filename);

    const record = await prisma.backupRecord.create({
      data: {
        filename,
        sizeBytes: 0,
        type,
        status: 'PENDING',
        includesDb: true,
        includesFiles: true,
        createdById: userId ?? null,
      },
    });

    try {
      ensureDir(BACKUP_DIR);
      const sql = await dumpDatabase();
      const metadata = {
        version: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        type,
        includesDb: true,
        includesFiles: fs.existsSync(UPLOADS_DIR),
      };

      await createZip(zipPath, sql, metadata);
      const sizeBytes = fs.statSync(zipPath).size;

      const updated = await prisma.backupRecord.update({
        where: { id: record.id },
        data: { status: 'COMPLETED', sizeBytes },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      });

      await this.enforceRetention();
      return toRecord(updated);
    } catch (err) {
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      const msg = err instanceof Error ? err.message : 'Backup катасы';
      await prisma.backupRecord.update({
        where: { id: record.id },
        data: { status: 'FAILED', errorMessage: msg },
      });
      throw new BackupError(msg, 500);
    }
  }

  static getFilePath(filename: string): string {
    const safe = path.basename(filename);
    const full = path.join(BACKUP_DIR, safe);
    if (!fs.existsSync(full)) throw new BackupError('Backup файлы табылган жок', 404);
    return full;
  }

  static async restore(filename: string, userId?: string): Promise<void> {
    const safe = path.basename(filename);
    const zipPath = this.getFilePath(safe);
    const tempDir = path.join(BACKUP_DIR, `_restore_${Date.now()}`);

    try {
      await this.create(BackupTypeEnum.PRE_RESTORE, userId);

      const { sql } = await extractZip(zipPath, tempDir);
      const uploadsSrc = path.join(tempDir, 'uploads');

      await disconnectDatabase();
      try {
        await restoreDatabase(sql);
      } finally {
        await connectDatabase();
      }

      if (fs.existsSync(uploadsSrc)) {
        if (fs.existsSync(UPLOADS_DIR)) removeDir(UPLOADS_DIR);
        ensureDir(path.dirname(UPLOADS_DIR));
        copyDir(uploadsSrc, UPLOADS_DIR);
      }
    } finally {
      if (fs.existsSync(tempDir)) removeDir(tempDir);
    }
  }

  static async restoreFromUpload(filePath: string, userId?: string): Promise<void> {
    const tempName = `upload-${Date.now()}.zip`;
    const dest = path.join(BACKUP_DIR, tempName);
    fs.copyFileSync(filePath, dest);
    try {
      await this.restore(tempName, userId);
    } finally {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    }
  }

  static async remove(id: string): Promise<void> {
    const record = await prisma.backupRecord.findUnique({ where: { id } });
    if (!record) throw new BackupError('Backup табылган жок', 404);

    const filePath = path.join(BACKUP_DIR, record.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.backupRecord.delete({ where: { id } });
  }

  static async enforceRetention(): Promise<void> {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    const retention = settings?.backupRetentionCount ?? 10;

    const records = await prisma.backupRecord.findMany({
      where: { status: 'COMPLETED', type: { not: 'PRE_RESTORE' } },
      orderBy: { createdAt: 'desc' },
      skip: retention,
    });

    for (const r of records) {
      await this.remove(r.id).catch(() => undefined);
    }
  }

  static async runAutoBackup(): Promise<void> {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    if (!settings?.backupAutoEnabled) return;

    const lastAuto = await prisma.backupRecord.findFirst({
      where: { type: 'AUTO', status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });

    if (lastAuto) {
      const hoursSince = (Date.now() - lastAuto.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < settings.backupIntervalHours) return;
    }

    try {
      await this.create(BackupTypeEnum.AUTO);
      console.log('✅ Автоматтык backup ийгиликтүү түзүлдү');
    } catch (err) {
      console.error('❌ Автоматтык backup катасы:', err);
    }
  }
}
