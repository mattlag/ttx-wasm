import { TTX, createTTX, fontToTTX, ttxToFont } from '../../src/js/index.js';

describe('TTX WASM', () => {
  let ttx: TTX;

  beforeAll(async () => {
    ttx = await createTTX();
  });

  describe('Format Detection', () => {
    test('should detect TTF format', async () => {
      // Mock TTF header: sfntVersion = 0x00010000
      const ttfData = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x80]);
      const format = await ttx.detectFormat(ttfData);
      expect(format).toBe('TTF');
    });

    test('should detect OTF format', async () => {
      // Mock OTF header: sfntVersion = 'OTTO'
      const otfData = new Uint8Array([0x4f, 0x54, 0x54, 0x4f, 0x00, 0x0a, 0x00, 0x80]);
      const format = await ttx.detectFormat(otfData);
      expect(format).toBe('OTF');
    });

    test('should detect TTC format', async () => {
      // Mock TTC header: signature = 'ttcf'
      const ttcData = new Uint8Array([0x74, 0x74, 0x63, 0x66, 0x00, 0x01, 0x00, 0x00]);
      const format = await ttx.detectFormat(ttcData);
      expect(format).toBe('TTC');
    });

    test('should detect WOFF format', async () => {
      // Mock WOFF header: signature = 'wOFF'
      const woffData = new Uint8Array([0x77, 0x4f, 0x46, 0x46, 0x00, 0x01, 0x00, 0x00]);
      const format = await ttx.detectFormat(woffData);
      expect(format).toBe('WOFF');
    });

    test('should detect WOFF2 format', async () => {
      // Mock WOFF2 header: signature = 'wOF2'
      const woff2Data = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 0x00, 0x01, 0x00, 0x00]);
      const format = await ttx.detectFormat(woff2Data);
      expect(format).toBe('WOFF2');
    });

    test('should throw error for invalid data', async () => {
      const invalidData = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
      await expect(ttx.detectFormat(invalidData)).rejects.toThrow('Unknown font format');
    });

    test('should throw error for too small data', async () => {
      const tooSmallData = new Uint8Array([0x00, 0x01]);
      await expect(ttx.detectFormat(tooSmallData)).rejects.toThrow(
        'File too small to be a valid font'
      );
    });
  });

  describe('Font Information', () => {
    test('should get font info for TTF', async () => {
      const ttfData = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x80]);
      const info = await ttx.getFontInfo(ttfData);

      expect(info.format).toBe('TTF');
      expect(info).toHaveProperty('tables');
    });

    test('should get font info for TTC', async () => {
      const ttcData = new Uint8Array([0x74, 0x74, 0x63, 0x66, 0x00, 0x01, 0x00, 0x00]);
      const info = await ttx.getFontInfo(ttcData);

      expect(info.format).toBe('TTC');
      expect(info.fontCount).toBeGreaterThan(0);
    });
  });

  describe('Font to TTX Conversion', () => {
    test('should convert TTF to TTX', async () => {
      const ttfData = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x80]);
      const result = await ttx.dump(ttfData);

      expect(result.format).toBe('TTX');
      expect(result.data).toContain('<?xml');
      expect(result.data).toContain('<ttFont');
      expect(result.warnings).toBeDefined();
    });

    test('should respect table filtering options', async () => {
      const ttfData = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x80]);
      const result = await ttx.dump(ttfData, {
        onlyTables: ['head', 'name'],
      });

      expect(result.format).toBe('TTX');
      expect(result.data).toContain('<?xml');
    });

    test('should throw error for TTX input', async () => {
      const ttxData = new Uint8Array(Buffer.from('<?xml version="1.0"?><ttFont>', 'utf8'));
      await expect(ttx.dump(ttxData)).rejects.toThrow('Input is already in TTX format');
    });
  });

  describe('TTX to Font Conversion', () => {
    test('should convert TTX to font', async () => {
      const ttxData =
        '<?xml version="1.0" encoding="UTF-8"?>\n<ttFont sfntVersion="\\x00\\x01\\x00\\x00"></ttFont>';
      const result = await ttx.compile(ttxData);

      expect(result.format).toBe('TTF');
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.data.length).toBeGreaterThan(0);
    });

    test('should handle binary TTX input', async () => {
      const ttxString =
        '<?xml version="1.0" encoding="UTF-8"?>\n<ttFont sfntVersion="\\x00\\x01\\x00\\x00"></ttFont>';
      const ttxData = new Uint8Array(Buffer.from(ttxString, 'utf8'));
      const result = await ttx.compile(ttxData);

      expect(result.format).toBe('TTF');
      expect(result.data).toBeInstanceOf(Uint8Array);
    });

    test('should respect flavor option', async () => {
      const ttxData =
        '<?xml version="1.0" encoding="UTF-8"?>\n<ttFont sfntVersion="\\x00\\x01\\x00\\x00"></ttFont>';
      const result = await ttx.compile(ttxData, { flavor: 'woff' });

      expect(result.format).toBe('woff');
    });

    test('should throw error for invalid TTX', async () => {
      const invalidTtx = 'This is not valid TTX data';
      await expect(ttx.compile(invalidTtx)).rejects.toThrow(
        'Input does not appear to be valid TTX format'
      );
    });
  });

  describe('Table Listing', () => {
    test('should list tables in font', async () => {
      const ttfData = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x80]);
      const tables = await ttx.listTables(ttfData);

      expect(Array.isArray(tables)).toBe(true);
      expect(tables.length).toBeGreaterThan(0);
      expect(tables).toContain('head');
    });

    test('should throw error for TTX format', async () => {
      const ttxData = new Uint8Array(Buffer.from('<?xml version="1.0"?><ttFont>', 'utf8'));
      await expect(ttx.listTables(ttxData)).rejects.toThrow('Cannot list tables from TTX format');
    });
  });

  describe('Convenience Functions', () => {
    test('fontToTTX should work', async () => {
      const ttfData = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x80]);
      const ttxString = await fontToTTX(ttfData);

      expect(typeof ttxString).toBe('string');
      expect(ttxString).toContain('<?xml');
      expect(ttxString).toContain('<ttFont');
    });

    test('ttxToFont should work', async () => {
      const ttxData =
        '<?xml version="1.0" encoding="UTF-8"?>\n<ttFont sfntVersion="\\x00\\x01\\x00\\x00"></ttFont>';
      const fontData = await ttxToFont(ttxData);

      expect(fontData).toBeInstanceOf(Uint8Array);
      expect(fontData.length).toBeGreaterThan(0);
    });
  });
});

describe('TTX Class Initialization', () => {
  test('should create TTX instance', async () => {
    const ttxInstance = await createTTX();
    expect(ttxInstance).toBeInstanceOf(TTX);
  });

  test('should initialize multiple times safely', async () => {
    const ttx1 = new TTX();
    const ttx2 = new TTX();

    await ttx1.init();
    await ttx2.init();

    // Should not throw errors
    await ttx1.init();
    await ttx2.init();
  });
});
