/**
 * Node.js backend for TTX functionality using native Python FontTools
 * Provides the same API as the browser version but uses subprocess calls
 */

import { exec } from 'child_process';
import { mkdtemp, readFile, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

export interface TTXOptions {
  tables?: string[];
  skipTables?: string[];
  splitTables?: boolean;
  splitGlyphs?: boolean;
  disassembleInstructions?: boolean;
  fontNumber?: number;
  flavor?: string;
}

export interface FontInfo {
  format: string;
  tables: string[];
  metadata: {
    family?: string;
    style?: string;
    version?: string;
    unitsPerEm?: number;
    created?: string;
    modified?: string;
  };
}

const execAsync = promisify(exec);

export class NodeTTX {
  private pythonExecutable: string;
  private initialized = false;
  private fontToolsAvailable = false;

  constructor(pythonExecutable = 'python3') {
    this.pythonExecutable = pythonExecutable;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if Python is available
      await execAsync(`${this.pythonExecutable} --version`);

      // Check if FontTools is installed
      const { stdout } = await execAsync(
        `${this.pythonExecutable} -c "import fontTools; print('FontTools available')"`
      );

      if (stdout.includes('FontTools available')) {
        this.fontToolsAvailable = true;
        this.initialized = true;
        console.log('✓ Node.js TTX backend initialized with native FontTools');
      } else {
        throw new Error('FontTools not found');
      }
    } catch (error: any) {
      throw new Error(
        `Failed to initialize Node.js TTX backend: ${error.message}\n\nTo fix this:\n  pip install fonttools\n  # or\n  pip3 install fonttools`
      );
    }
  }

  isInitialized(): boolean {
    return this.initialized && this.fontToolsAvailable;
  }

  async detectFormat(fontData: Uint8Array): Promise<string> {
    const tempDir = await mkdtemp(join(tmpdir(), 'ttx-'));
    const fontPath = join(tempDir, 'font.tmp');

    try {
      await writeFile(fontPath, fontData);

      const python_script = `
import sys
from pathlib import Path

font_path = sys.argv[1]
font_data = Path(font_path).read_bytes()

if len(font_data) < 4:
    print("UNKNOWN")
    sys.exit()

signature = font_data[:4]

if signature == b'\\x00\\x01\\x00\\x00':
    print("TTF")
elif signature == b'OTTO':
    print("OTF") 
elif signature == b'ttcf':
    print("TTC")
elif signature == b'wOFF':
    print("WOFF")
elif signature == b'wOF2':
    print("WOFF2")
elif font_data[:5] == b'<?xml':
    print("TTX")
else:
    print("UNKNOWN")
`;

      const { stdout } = await execAsync(
        `${this.pythonExecutable} -c "${python_script}" "${fontPath}"`
      );
      return stdout.trim();
    } finally {
      await unlink(fontPath).catch(() => {});
      // Note: temp directory cleanup could be improved
    }
  }

  async getFontInfo(fontData: Uint8Array, fontNumber = 0): Promise<FontInfo> {
    const tempDir = await mkdtemp(join(tmpdir(), 'ttx-'));
    const fontPath = join(tempDir, 'font.tmp');

    try {
      await writeFile(fontPath, fontData);

      const python_script = `
import sys
import json
from fontTools.ttLib import TTFont
from pathlib import Path

try:
    font_path = sys.argv[1]
    font_number = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    
    font = TTFont(font_path, fontNumber=font_number)
    
    info = {
        "format": "TTF" if font.sfntVersion == "\\x00\\x01\\x00\\x00" else "OTF",
        "tables": list(font.keys()),
        "metadata": {}
    }
    
    # Extract metadata if available
    if 'name' in font:
        name_table = font['name']
        info["metadata"]["family"] = str(name_table.getDebugName(1)) if name_table.getDebugName(1) else None
        info["metadata"]["style"] = str(name_table.getDebugName(2)) if name_table.getDebugName(2) else None
        info["metadata"]["version"] = str(name_table.getDebugName(5)) if name_table.getDebugName(5) else None
    
    if 'head' in font:
        head_table = font['head']
        info["metadata"]["unitsPerEm"] = head_table.unitsPerEm
        info["metadata"]["created"] = str(head_table.created) if hasattr(head_table, 'created') else None
        info["metadata"]["modified"] = str(head_table.modified) if hasattr(head_table, 'modified') else None
    
    print(json.dumps(info))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

      const { stdout } = await execAsync(
        `${this.pythonExecutable} -c "${python_script}" "${fontPath}" ${fontNumber}`
      );
      const result = JSON.parse(stdout.trim());

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } finally {
      await unlink(fontPath).catch(() => {});
    }
  }

  async dumpToTTX(fontData: Uint8Array, options: TTXOptions = {}): Promise<string> {
    const tempDir = await mkdtemp(join(tmpdir(), 'ttx-'));
    const fontPath = join(tempDir, 'input.font');
    const ttxPath = join(tempDir, 'output.ttx');

    try {
      await writeFile(fontPath, fontData);

      // Build ttx command arguments
      const args = ['-o', ttxPath];

      if (options.tables && options.tables.length > 0) {
        args.push('-t', options.tables.join(','));
      }

      if (options.skipTables && options.skipTables.length > 0) {
        args.push('-x', options.skipTables.join(','));
      }

      if (options.splitTables) {
        args.push('-s');
      }

      if (options.splitGlyphs) {
        args.push('-g');
      }

      if (options.disassembleInstructions) {
        args.push('-i');
      }

      if (options.fontNumber) {
        args.push('-y', options.fontNumber.toString());
      }

      args.push(fontPath);

      // Execute ttx command
      await execAsync(`${this.pythonExecutable} -m fontTools.ttx ${args.join(' ')}`);

      // Read the generated TTX file
      const ttxContent = await readFile(ttxPath, 'utf-8');
      return ttxContent;
    } finally {
      await unlink(fontPath).catch(() => {});
      await unlink(ttxPath).catch(() => {});
    }
  }

  async compileFromTTX(ttxContent: string, options: TTXOptions = {}): Promise<ArrayBuffer> {
    const tempDir = await mkdtemp(join(tmpdir(), 'ttx-'));
    const ttxPath = join(tempDir, 'input.ttx');
    const fontPath = join(tempDir, 'output.font');

    try {
      await writeFile(ttxPath, ttxContent, 'utf-8');

      // Build ttx compile command
      const args = ['-o', fontPath];

      if (options.flavor) {
        args.push('--flavor', options.flavor);
      }

      args.push(ttxPath);

      // Execute ttx compile command
      await execAsync(`${this.pythonExecutable} -m fontTools.ttx ${args.join(' ')}`);

      // Read the generated font file
      const fontData = await readFile(fontPath);
      return new Uint8Array(fontData).buffer;
    } finally {
      await unlink(ttxPath).catch(() => {});
      await unlink(fontPath).catch(() => {});
    }
  }
}
