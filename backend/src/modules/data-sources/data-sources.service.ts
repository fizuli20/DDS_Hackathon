import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSourceEntity } from '../../database/entities/data-source.entity';
import { DataSourceRecordEntity } from '../../database/entities/data-source-record.entity';
import { UnifiedStudentEntity } from '../../database/entities/unified-student.entity';
import { CreateDataSourceDto } from './dto/create-data-source.dto';
import { UpdateDataSourceDto } from './dto/update-data-source.dto';

type NormalizedRow = {
  mergeKey: string;
  studentId: string | null;
  name: string;
  cohort: string | null;
  pld: number | null;
  task: number | null;
  exam: number | null;
  attendance: number | null;
  overall: number | null;
};

@Injectable()
export class DataSourcesService implements OnModuleInit, OnModuleDestroy {
  private syncTimer: NodeJS.Timeout | null = null;
  private syncing = false;

  constructor(
    @InjectRepository(DataSourceEntity)
    private readonly sourcesRepo: Repository<DataSourceEntity>,
    @InjectRepository(DataSourceRecordEntity)
    private readonly recordsRepo: Repository<DataSourceRecordEntity>,
    @InjectRepository(UnifiedStudentEntity)
    private readonly unifiedRepo: Repository<UnifiedStudentEntity>,
  ) {}

  onModuleInit() {
    const intervalMs = Number(process.env.SYNC_INTERVAL_MS || 10 * 60 * 1000);
    if (Number.isFinite(intervalMs) && intervalMs >= 60_000) {
      this.syncTimer = setInterval(() => {
        void this.syncAllActive();
      }, intervalMs);
    }
  }

  onModuleDestroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  list() {
    return this.sourcesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(payload: CreateDataSourceDto) {
    const entity = this.sourcesRepo.create({
      name: payload.name.trim(),
      sheetUrl: payload.sheetUrl.trim(),
      type: payload.type,
      cohort: payload.cohort?.trim() || null,
      active: payload.active ?? true,
      priority: payload.priority ?? 100,
      columnMapping: payload.columnMapping ?? {},
    });
    const saved = await this.sourcesRepo.save(entity);
    await this.syncSource(saved.id);
    return saved;
  }

  async update(id: string, payload: UpdateDataSourceDto) {
    const existing = await this.sourcesRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Data source not found.');
    }
    Object.assign(existing, {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.sheetUrl !== undefined ? { sheetUrl: payload.sheetUrl.trim() } : {}),
      ...(payload.type !== undefined ? { type: payload.type } : {}),
      ...(payload.cohort !== undefined ? { cohort: payload.cohort.trim() || null } : {}),
      ...(payload.active !== undefined ? { active: payload.active } : {}),
      ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
      ...(payload.columnMapping !== undefined ? { columnMapping: payload.columnMapping } : {}),
    });
    return this.sourcesRepo.save(existing);
  }

  async remove(id: string) {
    const source = await this.sourcesRepo.findOne({ where: { id } });
    if (!source) {
      throw new NotFoundException('Data source not found.');
    }
    await this.sourcesRepo.delete(id);
    return { ok: true };
  }

  async syncOne(id: string) {
    const source = await this.sourcesRepo.findOne({ where: { id } });
    if (!source) {
      throw new NotFoundException('Data source not found.');
    }
    const stats = await this.syncSource(source.id);
    return { sourceId: id, ...stats };
  }

  async syncAllActive() {
    if (this.syncing) {
      return { running: true };
    }
    this.syncing = true;
    try {
      const sources = await this.sourcesRepo.find({ where: { active: true } });
      const results: Array<{ sourceId: string; rows: number }> = [];
      for (const source of sources) {
        const stats = await this.syncSource(source.id);
        results.push({ sourceId: source.id, rows: stats.rows });
      }
      return {
        running: false,
        syncedSources: results.length,
        results,
      };
    } finally {
      this.syncing = false;
    }
  }

  async aggregateByCohort(cohort?: string) {
    const qb = this.unifiedRepo.createQueryBuilder('u');
    if (cohort?.trim()) {
      qb.where('LOWER(u.cohort) = LOWER(:cohort)', { cohort: cohort.trim() });
    }
    const students = await qb.orderBy('u.name', 'ASC').getMany();
    const count = students.length || 1;
    const avg = (field: keyof UnifiedStudentEntity) =>
      Number(
        (
          students.reduce((sum, item) => sum + Number((item[field] as number | null) ?? 0), 0) /
          count
        ).toFixed(2),
      );
    return {
      cohort: cohort?.trim() || 'all',
      totalStudents: students.length,
      averages: {
        pld: avg('pld'),
        task: avg('task'),
        exam: avg('exam'),
        attendance: avg('attendance'),
        overall: avg('overall'),
      },
      students: students.map((item) => ({
        studentId: item.studentId,
        name: item.name,
        cohort: item.cohort,
        pld: item.pld,
        task: item.task,
        exam: item.exam,
        attendance: item.attendance,
        overall: item.overall,
        updatedAt: item.updatedAt,
      })),
    };
  }

  private normalizeHeader(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private toNumber(value: string | undefined): number | null {
    if (!value || !value.trim()) {
      return null;
    }
    const parsed = Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private csvToRows(csvText: string): string[][] {
    const rows: string[][] = [];
    let current = '';
    let row: string[] = [];
    let inQuotes = false;
    for (let i = 0; i < csvText.length; i += 1) {
      const char = csvText[i];
      const next = csvText[i + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
        continue;
      }
      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') {
          i += 1;
        }
        row.push(current.trim());
        if (row.some((cell) => cell.length > 0)) {
          rows.push(row);
        }
        row = [];
        current = '';
        continue;
      }
      current += char;
    }
    if (current.length > 0 || row.length > 0) {
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
    }
    return rows;
  }

  private extractSheetId(sheetUrl: string) {
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match?.[1]) {
      throw new Error('Invalid Google Sheet URL.');
    }
    return match[1];
  }

  private defaultMappingForType(type: string): Record<string, string> {
    const base = {
      studentId: 'student id',
      name: 'student name',
      cohort: 'cohort',
    };
    if (type === 'pld') {
      return { ...base, pld: 'pld score', overall: 'overall' };
    }
    if (type === 'task_exam') {
      return { ...base, task: 'task score', exam: 'exam score', overall: 'overall' };
    }
    if (type === 'attendance') {
      return { ...base, attendance: 'attendance activity', overall: 'overall' };
    }
    return {
      ...base,
      pld: 'pld score',
      task: 'task score',
      exam: 'exam score',
      attendance: 'attendance activity',
      overall: 'overall',
    };
  }

  private buildMergeKey(studentId: string | null, name: string, cohort: string | null) {
    if (studentId) {
      return `sid:${studentId.toLowerCase()}`;
    }
    return `name:${name.toLowerCase()}|cohort:${(cohort || 'unknown').toLowerCase()}`;
  }

  private async syncSource(sourceId: string) {
    const source = await this.sourcesRepo.findOne({ where: { id: sourceId } });
    if (!source) {
      throw new NotFoundException('Data source not found.');
    }

    const sheetId = this.extractSheetId(source.sheetUrl);
    const gidMatch = source.sheetUrl.match(/[#&?]gid=(\d+)/);
    const gid = gidMatch?.[1] ?? '0';
    const fetchHeaders = {
      'User-Agent':
        'Mozilla/5.0 (compatible; HSPTS-DataSources/1.0) Node.js fetch',
      Accept: 'text/csv,text/plain,*/*',
    };
    const urls = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
    ];

    let csv = '';
    let lastError = `Failed to fetch sheet for source ${source.name}.`;
    for (const csvUrl of urls) {
      try {
        const response = await fetch(csvUrl, { headers: fetchHeaders, redirect: 'follow' });
        if (!response.ok) {
          lastError = `HTTP ${response.status} for ${source.name}`;
          continue;
        }
        const text = await response.text();
        const t = text.slice(0, 500).trim().toLowerCase();
        if (t.startsWith('<!doctype') || t.startsWith('<html') || t.includes('<html')) {
          lastError = `Sheet ${source.name} returned HTML — share as “anyone with the link can view”.`;
          continue;
        }
        const parsed = this.csvToRows(text);
        if (parsed.length >= 2) {
          csv = text;
          break;
        }
        lastError = `No data rows in sheet ${source.name}.`;
      } catch {
        lastError = `Network error fetching ${source.name}.`;
      }
    }
    if (!csv) {
      throw new Error(lastError);
    }
    const rows = this.csvToRows(csv);
    if (rows.length < 2) {
      throw new Error(`No data rows found for source ${source.name}.`);
    }
    const headers = rows[0].map((item) => this.normalizeHeader(item));
    const mapping = {
      ...this.defaultMappingForType(source.type),
      ...(source.columnMapping || {}),
    };
    const colIndex = (key: string) => {
      const mapped = this.normalizeHeader(mapping[key] || '');
      if (!mapped) return -1;
      return headers.findIndex((item) => item === mapped);
    };

    const idx = {
      studentId: colIndex('studentId'),
      name: colIndex('name'),
      cohort: colIndex('cohort'),
      pld: colIndex('pld'),
      task: colIndex('task'),
      exam: colIndex('exam'),
      attendance: colIndex('attendance'),
      overall: colIndex('overall'),
    };

    const normalized: NormalizedRow[] = rows.slice(1).map((row) => {
      const studentId = idx.studentId >= 0 ? row[idx.studentId]?.trim() || null : null;
      const name = idx.name >= 0 ? row[idx.name]?.trim() || '' : '';
      const cohort = (idx.cohort >= 0 ? row[idx.cohort]?.trim() : source.cohort || '') || null;
      const safeName = name || (studentId ? `Student ${studentId}` : 'Unknown Student');
      return {
        mergeKey: this.buildMergeKey(studentId, safeName, cohort),
        studentId,
        name: safeName,
        cohort,
        pld: idx.pld >= 0 ? this.toNumber(row[idx.pld]) : null,
        task: idx.task >= 0 ? this.toNumber(row[idx.task]) : null,
        exam: idx.exam >= 0 ? this.toNumber(row[idx.exam]) : null,
        attendance: idx.attendance >= 0 ? this.toNumber(row[idx.attendance]) : null,
        overall: idx.overall >= 0 ? this.toNumber(row[idx.overall]) : null,
      };
    });

    await this.recordsRepo.delete({ sourceId: source.id });
    if (normalized.length) {
      const rawRows = normalized.map((item, rowIndex) =>
        this.recordsRepo.create({
          sourceId: source.id,
          rowIndex: rowIndex + 2,
          payload: JSON.parse(JSON.stringify(item)) as Record<string, unknown>,
        }),
      );
      await this.recordsRepo.save(rawRows);
    }

    for (const item of normalized) {
      const existing = await this.unifiedRepo.findOne({ where: { mergeKey: item.mergeKey } });
      if (!existing) {
        const created = this.unifiedRepo.create({
          ...item,
          sourcePriority: source.priority,
          lastSourceType: source.type,
          lastSyncedAt: new Date(),
        });
        await this.unifiedRepo.save(created);
        continue;
      }

      const higherPriority = source.priority <= existing.sourcePriority;
      const patch: Partial<UnifiedStudentEntity> = {
        studentId: existing.studentId || item.studentId,
        name: item.name || existing.name,
        cohort: item.cohort || existing.cohort,
        lastSyncedAt: new Date(),
        lastSourceType: source.type,
      };

      const fields: Array<keyof NormalizedRow> = ['pld', 'task', 'exam', 'attendance', 'overall'];
      for (const field of fields) {
        const incoming = item[field] as number | null;
        const current = existing[field as keyof UnifiedStudentEntity] as number | null;
        if (incoming === null) continue;
        if (higherPriority || current === null) {
          (patch as Record<string, unknown>)[field] = incoming;
        }
      }

      if (higherPriority) {
        patch.sourcePriority = source.priority;
      }
      await this.unifiedRepo.update({ id: existing.id }, patch);
    }

    source.lastSyncedAt = new Date();
    await this.sourcesRepo.save(source);
    return { rows: normalized.length };
  }
}
