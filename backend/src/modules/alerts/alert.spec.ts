import { parseAlert } from './alert.js';

const valid = {
  timestamp: '2026-01-01T00:00:05Z',
  type: 'arp_spoofing',
  severity: 'high',
  source_ip: null,
  source_mac: 'aa:bb:cc:dd:ee:ff',
  target: '192.168.50.1',
  details: 'Réponse ARP non sollicitée',
  rule_id: 'ARP-001',
};

const without = (...keys: string[]): Record<string, unknown> => {
  const copy: Record<string, unknown> = { ...valid };
  for (const key of keys) delete copy[key];
  return copy;
};

const errorsOf = (input: unknown): string[] => {
  const result = parseAlert(input);
  return result.ok ? [] : result.errors;
};

describe('parseAlert', () => {
  it('accepts source_ip: null (offender IP unknown)', () => {
    expect(parseAlert(valid)).toEqual({ ok: true, alert: valid });
  });

  it('accepts absent source_mac and target', () => {
    expect(parseAlert(without('source_mac', 'target')).ok).toBe(true);
  });

  it('accepts an unknown type and rule_id (future rwatch rules)', () => {
    expect(
      parseAlert({
        ...valid,
        type: 'mqtt_client_id_spoofing',
        rule_id: 'MQTT-001',
      }).ok,
    ).toBe(true);
  });

  it('rejects a missing source_ip: null and absent are not the same', () => {
    expect(errorsOf(without('source_ip'))).toContain(
      'source_ip is required (null when unknown)',
    );
  });

  it('rejects source_mac: null (must be omitted when unknown)', () => {
    expect(errorsOf({ ...valid, source_mac: null })).toHaveLength(1);
  });

  it('rejects a severity outside the enumeration', () => {
    expect(errorsOf({ ...valid, severity: 'info' })).toHaveLength(1);
  });

  it.each([
    '2026-01-01T00:00:05.123Z',
    '2026-01-01T01:00:05+01:00',
    '2026-02-30T00:00:00Z',
  ])('rejects timestamp %s', (timestamp) => {
    expect(errorsOf({ ...valid, timestamp })).toHaveLength(1);
  });

  it('rejects an unknown field', () => {
    expect(errorsOf({ ...valid, extra: 1 })).toEqual(['unknown field: extra']);
  });

  it.each([null, [], 'text', 42])('rejects a non-object body (%j)', (body) => {
    expect(parseAlert(body).ok).toBe(false);
  });
});
