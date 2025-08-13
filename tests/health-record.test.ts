import { describe, it, expect, beforeEach } from 'vitest';
import { Buffer } from 'node:buffer';

// Define the structure of a health record
interface HealthRecord {
  encryptedData: Buffer;
  version: number;
  timestamp: number;
}

// Define the structure of an access audit log entry
interface AuditLogEntry {
  accessor: string;
  timestamp: number;
}

// Interface for the mocked HealthRecordContract
interface MockHealthRecord {
  admin: string;
  paused: boolean;
  lastUpdatedBlock: number;
  patientRecords: Map<string, Map<number, HealthRecord>>;
  patientRecordCounters: Map<string, number>;
  accessAuditLog: Map<string, AuditLogEntry[]>;

  isAdmin(caller: string): boolean;
  setPaused(caller: string, pause: boolean): { value: boolean } | { error: number };
  storeRecord(caller: string, patient: string, encryptedData: Buffer): { value: number } | { error: number };
  updateRecord(caller: string, patient: string, recordId: number, encryptedData: Buffer): { value: number } | { error: number };
  getRecord(caller: string, patient: string, recordId: number): { value: HealthRecord } | { error: number };
  getRecordVersion(patient: string, recordId: number): { value: number } | { error: number };
  getAccessAuditLog(patient: string, recordId: number): { value: AuditLogEntry[] };
  getNextRecordId(patient: string): { value: number };
  getAdmin(): { value: string };
  isPaused(): { value: boolean };
  getLastUpdated(): { value: number };
  transferAdmin(caller: string, newAdmin: string): { value: boolean } | { error: number };
}

// Mock implementation of HealthRecordContract
const mockHealthRecord: MockHealthRecord = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  paused: false,
  lastUpdatedBlock: 0,
  patientRecords: new Map(),
  patientRecordCounters: new Map(),
  accessAuditLog: new Map(),

  isAdmin(caller: string): boolean {
    return caller === this.admin;
  },

  setPaused(caller: string, pause: boolean): { value: boolean } | { error: number } {
    if (!this.isAdmin(caller)) return { error: 100 };
    this.paused = pause;
    this.lastUpdatedBlock = 12345; // Mock block time
    return { value: pause };
  },

  storeRecord(caller: string, patient: string, encryptedData: Buffer): { value: number } | { error: number } {
    if (this.paused) return { error: 103 };
    if (caller !== patient) return { error: 100 };
    if (encryptedData.length === 0) return { error: 104 };
    if (patient === 'SP000000000000000000002Q6VF78') return { error: 101 };
    let records = this.patientRecords.get(patient) || new Map();
    const nextId = this.patientRecordCounters.get(patient) || 1;
    records.set(nextId, { encryptedData, version: 1, timestamp: 12345 }); // Mock timestamp
    this.patientRecords.set(patient, records);
    this.patientRecordCounters.set(patient, nextId + 1);
    this.accessAuditLog.set(`${patient}-${nextId}`, []);
    return { value: nextId };
  },

  updateRecord(caller: string, patient: string, recordId: number, encryptedData: Buffer): { value: number } | { error: number } {
    if (this.paused) return { error: 103 };
    if (caller !== patient) return { error: 100 };
    if (encryptedData.length === 0) return { error: 104 };
    if (patient === 'SP000000000000000000002Q6VF78') return { error: 101 };
    const records = this.patientRecords.get(patient);
    if (!records || !records.has(recordId)) return { error: 102 };
    const record = records.get(recordId)!;
    const newVersion = record.version + 1;
    records.set(recordId, { encryptedData, version: newVersion, timestamp: 12345 });
    return { value: newVersion };
  },

  getRecord(caller: string, patient: string, recordId: number): { value: HealthRecord } | { error: number } {
    if (caller !== patient) return { error: 100 };
    const records = this.patientRecords.get(patient);
    if (!records || !records.has(recordId)) return { error: 102 };
    const record = records.get(recordId)!;
    const auditKey = `${patient}-${recordId}`;
    const auditLog = this.accessAuditLog.get(auditKey) || [];
    auditLog.push({ accessor: caller, timestamp: 12345 });
    this.accessAuditLog.set(auditKey, auditLog);
    return { value: record };
  },

  getRecordVersion(patient: string, recordId: number): { value: number } | { error: number } {
    const records = this.patientRecords.get(patient);
    if (!records || !records.has(recordId)) return { error: 102 };
    return { value: records.get(recordId)!.version };
  },

  getAccessAuditLog(patient: string, recordId: number): { value: AuditLogEntry[] } {
    return { value: this.accessAuditLog.get(`${patient}-${recordId}`) || [] };
  },

  getNextRecordId(patient: string): { value: number } {
    return { value: this.patientRecordCounters.get(patient) || 1 };
  },

  getAdmin(): { value: string } {
    return { value: this.admin };
  },

  isPaused(): { value: boolean } {
    return { value: this.paused };
  },

  getLastUpdated(): { value: number } {
    return { value: this.lastUpdatedBlock };
  },

  transferAdmin(caller: string, newAdmin: string): { value: boolean } | { error: number } {
    if (!this.isAdmin(caller)) return { error: 100 };
    if (newAdmin === 'SP000000000000000000002Q6VF78') return { error: 101 };
    this.admin = newAdmin;
    this.lastUpdatedBlock = 12345; // Mock block time
    return { value: true };
  },
};

describe('HealthRecordContract', () => {
  beforeEach(() => {
    mockHealthRecord.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockHealthRecord.paused = false;
    mockHealthRecord.lastUpdatedBlock = 0;
    mockHealthRecord.patientRecords = new Map();
    mockHealthRecord.patientRecordCounters = new Map();
    mockHealthRecord.accessAuditLog = new Map();
  });

  it('should store a new record', () => {
    const data = Buffer.from('encrypted-data');
    const result = mockHealthRecord.storeRecord('ST2CY5...', 'ST2CY5...', data);
    expect(result).toEqual({ value: 1 });
    expect(mockHealthRecord.patientRecords.get('ST2CY5...')?.get(1)).toEqual({
      encryptedData: data,
      version: 1,
      timestamp: 12345,
    });
    expect(mockHealthRecord.getNextRecordId('ST2CY5...')).toEqual({ value: 2 });
    expect(mockHealthRecord.accessAuditLog.get('ST2CY5...-1')).toEqual([]);
  });

  it('should update an existing record', () => {
    const data = Buffer.from('encrypted-data');
    mockHealthRecord.storeRecord('ST2CY5...', 'ST2CY5...', data);
    const newData = Buffer.from('updated-data');
    const result = mockHealthRecord.updateRecord('ST2CY5...', 'ST2CY5...', 1, newData);
    expect(result).toEqual({ value: 2 });
    expect(mockHealthRecord.patientRecords.get('ST2CY5...')?.get(1)).toEqual({
      encryptedData: newData,
      version: 2,
      timestamp: 12345,
    });
  });

  it('should get a record and log access', () => {
    const data = Buffer.from('encrypted-data');
    mockHealthRecord.storeRecord('ST2CY5...', 'ST2CY5...', data);
    const result = mockHealthRecord.getRecord('ST2CY5...', 'ST2CY5...', 1);
    expect(result).toEqual({
      value: { encryptedData: data, version: 1, timestamp: 12345 },
    });
    expect(mockHealthRecord.getAccessAuditLog('ST2CY5...', 1)).toEqual({
      value: [{ accessor: 'ST2CY5...', timestamp: 12345 }],
    });
  });

  it('should return record version', () => {
    const data = Buffer.from('encrypted-data');
    mockHealthRecord.storeRecord('ST2CY5...', 'ST2CY5...', data);
    const result = mockHealthRecord.getRecordVersion('ST2CY5...', 1);
    expect(result).toEqual({ value: 1 });
  });

  it('should transfer admin rights', () => {
    const result = mockHealthRecord.transferAdmin(mockHealthRecord.admin, 'ST3NB...');
    expect(result).toEqual({ value: true });
    expect(mockHealthRecord.getAdmin()).toEqual({ value: 'ST3NB...' });
  });

  it('should set paused state', () => {
    const result = mockHealthRecord.setPaused(mockHealthRecord.admin, true);
    expect(result).toEqual({ value: true });
    expect(mockHealthRecord.isPaused()).toEqual({ value: true });
    expect(mockHealthRecord.getLastUpdated()).toEqual({ value: 12345 });
  });

  it('should not allow non-owner to store', () => {
    const data = Buffer.from('encrypted-data');
    const result = mockHealthRecord.storeRecord('ST3NB...', 'ST2CY5...', data);
    expect(result).toEqual({ error: 100 });
  });

  it('should not allow non-owner to update', () => {
    const data = Buffer.from('encrypted-data');
    mockHealthRecord.storeRecord('ST2CY5...', 'ST2CY5...', data);
    const newData = Buffer.from('updated-data');
    const result = mockHealthRecord.updateRecord('ST3NB...', 'ST2CY5...', 1, newData);
    expect(result).toEqual({ error: 100 });
  });

  it('should not allow non-owner to get record', () => {
    const data = Buffer.from('encrypted-data');
    mockHealthRecord.storeRecord('ST2CY5...', 'ST2CY5...', data);
    const result = mockHealthRecord.getRecord('ST3NB...', 'ST2CY5...', 1);
    expect(result).toEqual({ error: 100 });
  });

  it('should not allow operations when paused', () => {
    mockHealthRecord.setPaused(mockHealthRecord.admin, true);
    const data = Buffer.from('encrypted-data');
    const storeResult = mockHealthRecord.storeRecord('ST2CY5...', 'ST2CY5...', data);
    expect(storeResult).toEqual({ error: 103 });
    const updateResult = mockHealthRecord.updateRecord('ST2CY5...', 'ST2CY5...', 1, data);
    expect(updateResult).toEqual({ error: 103 });
  });

  it('should not allow invalid patient principal', () => {
    const data = Buffer.from('encrypted-data');
    const result = mockHealthRecord.storeRecord('SP000000000000000000002Q6VF78', 'SP000000000000000000002Q6VF78', data);
    expect(result).toEqual({ error: 101 });
  });

  it('should not allow empty data', () => {
    const data = Buffer.from('');
    const result = mockHealthRecord.storeRecord('ST2CY5...', 'ST2CY5...', data);
    expect(result).toEqual({ error: 104 });
  });

  it('should return error for non-existent record', () => {
    const result = mockHealthRecord.getRecord('ST2CY5...', 'ST2CY5...', 999);
    expect(result).toEqual({ error: 102 });
    const versionResult = mockHealthRecord.getRecordVersion('ST2CY5...', 999);
    expect(versionResult).toEqual({ error: 102 });
  });

  it('should not allow non-admin to set paused', () => {
    const result = mockHealthRecord.setPaused('ST3NB...', true);
    expect(result).toEqual({ error: 100 });
  });

  it('should not allow non-admin to transfer admin', () => {
    const result = mockHealthRecord.transferAdmin('ST3NB...', 'ST4AB...');
    expect(result).toEqual({ error: 100 });
  });

  it('should not allow invalid admin principal', () => {
    const result = mockHealthRecord.transferAdmin(mockHealthRecord.admin, 'SP000000000000000000002Q6VF78');
    expect(result).toEqual({ error: 101 });
  });
});