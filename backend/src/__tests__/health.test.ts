import { describe, it, expect } from 'vitest';
import { createApp } from '../app';
import request from 'supertest';

describe('health endpoint', () => {
  it('returns health status structure', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/health');

    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data).toHaveProperty('database');
    expect(['ok', 'error']).toContain(res.body.data.database);
  });
});
