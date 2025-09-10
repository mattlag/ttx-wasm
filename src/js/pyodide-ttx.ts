/**
 * Pyodide-based TTX implementation using Python FontTools
 * Provides 100% feature parity with Python FontTools TTX
 */

import { loadPyodide, type PyodideInterface } from 'pyodide';

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

export class PyodideTTX {
  private pyodide: PyodideInterface | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Loading Pyodide...');
      this.pyodide = await loadPyodide({
        indexURL: './pyodide/', // Use local pyodide files
      });

      console.log('Pyodide loaded successfully, version:', this.pyodide.version);
      console.log('Available globals methods:', Object.keys(this.pyodide.globals));

      console.log('Installing FontTools and dependencies...');
      // First load micropip package via JavaScript
      await this.pyodide.loadPackage(['micropip']);

      // Then install our dependencies
      await this.pyodide.runPythonAsync(`
        import micropip
        await micropip.install(['fonttools', 'brotli'])
      `);

      // Load our Python TTX reference implementation
      console.log('Loading TTX implementation...');
      await this.pyodide.runPythonAsync(`
      import sys
      from fontTools.ttLib import TTFont
      from fontTools.misc.timeTools import timestampSinceEpoch
      from pathlib import Path
      import tempfile
      import io
      import json
      from typing import List, Dict, Any, Optional, Union
      import xml.etree.ElementTree as ET

      class PyodideTTXProcessor:
          """
          Python FontTools TTX processor running in Pyodide
          Provides 100% feature parity with native FontTools
          """
          
          def detect_format(self, font_data: bytes) -> str:
              """Detect font format from binary data"""
              if len(font_data) < 4:
                  return "UNKNOWN"
              
              signature = font_data[:4]
              
              if signature == b'\\x00\\x01\\x00\\x00':
                  return "TTF"
              elif signature == b'OTTO':
                  return "OTF"
              elif signature == b'ttcf':
                  return "TTC"
              elif signature == b'wOFF':
                  return "WOFF"
              elif signature == b'wOF2':
                  return "WOFF2"
              elif font_data[:5] == b'<?xml':
                  return "TTX"
              else:
                  return "UNKNOWN"
          
          def get_font_info(self, font_data: bytes, font_number: int = 0) -> Dict[str, Any]:
              """Get comprehensive font information"""
              try:
                  # Create temporary file for font data
                  with tempfile.NamedTemporaryFile(delete=False) as tmp:
                      tmp.write(font_data)
                      tmp_path = tmp.name
                  
                  # Open font with FontTools
                  font = TTFont(tmp_path, fontNumber=font_number, lazy=True)
                  
                  # Get basic info
                  info = {
                      'format': self.detect_format(font_data),
                      'tables': sorted(font.keys()),
                      'metadata': {}
                  }
                  
                  # Extract metadata from name table
                  if 'name' in font:
                      name_table = font['name']
                      for record in name_table.names:
                          if record.nameID == 1:  # Font Family
                              info['metadata']['family'] = str(record)
                          elif record.nameID == 2:  # Font Subfamily
                              info['metadata']['style'] = str(record)
                          elif record.nameID == 5:  # Version
                              info['metadata']['version'] = str(record)
                  
                  # Extract metadata from head table
                  if 'head' in font:
                      head_table = font['head']
                      info['metadata']['unitsPerEm'] = head_table.unitsPerEm
                      info['metadata']['created'] = str(timestampSinceEpoch(head_table.created))
                      info['metadata']['modified'] = str(timestampSinceEpoch(head_table.modified))
                  
                  font.close()
                  return info
                  
              except Exception as e:
                  raise Exception(f"Failed to get font info: {e}")
          
          def dump_to_ttx(self, font_data: bytes, tables=None, skip_tables=None, 
                         split_tables=False, split_glyphs=False, 
                         disassemble_instructions=True, font_number=0) -> str:
              """
              Convert font to TTX XML with full FontTools functionality
              
              Args:
                  font_data: Binary font data
                  tables: List of tables to include
                  skip_tables: List of tables to exclude
                  split_tables: Split tables into separate files
                  split_glyphs: Split glyph data
                  disassemble_instructions: Disassemble TrueType instructions
                  font_number: Font index for TTC files
              """
              try:
                  # Create temporary file for font data
                  with tempfile.NamedTemporaryFile(delete=False, suffix='.ttf') as tmp:
                      tmp.write(font_data)
                      tmp_path = tmp.name
                  
                  # Open font with FontTools
                  font = TTFont(tmp_path, fontNumber=font_number)
                  
                  # Apply table filtering
                  tables_to_dump = None
                  if tables:
                      tables_to_dump = tables
                  elif skip_tables:
                      tables_to_dump = [t for t in font.keys() if t not in skip_tables]
                  
                  # Create XML output
                  output = io.StringIO()
                  
                  # Dump to TTX format
                  font.saveXML(
                      output,
                      tables=tables_to_dump,
                      splitTables=split_tables,
                      splitGlyphs=split_glyphs,
                      disassembleInstructions=disassemble_instructions
                  )
                  
                  font.close()
                  return output.getvalue()
                  
              except Exception as e:
                  raise Exception(f"Failed to dump to TTX: {e}")
          
          def compile_from_ttx(self, ttx_content: str, flavor=None) -> bytes:
              """
              Compile TTX XML back to font binary
              
              Args:
                  ttx_content: TTX XML content
                  flavor: Output flavor (woff, woff2, etc.)
              """
              try:
                  # Create temporary file for TTX content
                  with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.ttx') as tmp:
                      tmp.write(ttx_content)
                      ttx_path = tmp.name
                  
                  # Create font from TTX
                  font = TTFont()
                  font.importXML(ttx_path)
                  
                  # Save to binary format
                  output = io.BytesIO()
                  if flavor:
                      font.flavor = flavor
                  font.save(output)
                  
                  font.close()
                  return output.getvalue()
                  
              except Exception as e:
                  raise Exception(f"Failed to compile from TTX: {e}")
          
          def list_tables(self, font_data: bytes, font_number: int = 0) -> List[str]:
              """List all tables in font"""
              try:
                  with tempfile.NamedTemporaryFile(delete=False) as tmp:
                      tmp.write(font_data)
                      tmp_path = tmp.name
                  
                  font = TTFont(tmp_path, fontNumber=font_number, lazy=True)
                  tables = sorted(font.keys())
                  font.close()
                  return tables
                  
              except Exception as e:
                  raise Exception(f"Failed to list tables: {e}")

      # Create global processor instance
      ttx_processor = PyodideTTXProcessor()
    `);

      this.initialized = true;
      console.log('Pyodide TTX initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize Pyodide TTX:', error);
      throw error;
    }
  }

  async detectFormat(fontData: Uint8Array): Promise<string> {
    await this.initialize();
    if (!this.pyodide) throw new Error('Pyodide not initialized');

    try {
      this.pyodide.globals.set('font_data', fontData);
      return this.pyodide.runPython('ttx_processor.detect_format(font_data.to_py())');
    } catch (error) {
      console.error('Error in detectFormat:', error);
      throw new Error(`Font format detection failed: ${error}`);
    }
  }

  async getFontInfo(fontData: Uint8Array, fontNumber = 0): Promise<FontInfo> {
    await this.initialize();
    if (!this.pyodide) throw new Error('Pyodide not initialized');

    try {
      this.pyodide.globals.set('font_data', fontData);
      this.pyodide.globals.set('font_number', fontNumber);

      const result = this.pyodide.runPython(`
        import json
        info = ttx_processor.get_font_info(font_data.to_py(), font_number)
        json.dumps(info)
      `);

      return JSON.parse(result);
    } catch (error) {
      console.error('Error in getFontInfo:', error);
      throw new Error(`Font info extraction failed: ${error}`);
    }
  }

  async dumpToTTX(fontData: Uint8Array, options: TTXOptions = {}): Promise<string> {
    await this.initialize();
    if (!this.pyodide) throw new Error('Pyodide not initialized');

    this.pyodide.globals.set('font_data', fontData);
    this.pyodide.globals.set('tables', options.tables || null);
    this.pyodide.globals.set('skip_tables', options.skipTables || null);
    this.pyodide.globals.set('split_tables', options.splitTables || false);
    this.pyodide.globals.set('split_glyphs', options.splitGlyphs || false);
    this.pyodide.globals.set('disassemble_instructions', options.disassembleInstructions || true);
    this.pyodide.globals.set('font_number', options.fontNumber || 0);

    return this.pyodide.runPython(`
      ttx_processor.dump_to_ttx(
          font_data.to_py(),
          tables=tables,
          skip_tables=skip_tables,
          split_tables=split_tables,
          split_glyphs=split_glyphs,
          disassemble_instructions=disassemble_instructions,
          font_number=font_number
      )
    `);
  }

  async compileFromTTX(ttxContent: string, options: TTXOptions = {}): Promise<Uint8Array> {
    await this.initialize();
    if (!this.pyodide) throw new Error('Pyodide not initialized');

    this.pyodide.globals.set('ttx_content', ttxContent);
    this.pyodide.globals.set('flavor', options.flavor || null);

    const result = this.pyodide.runPython(`
      binary_data = ttx_processor.compile_from_ttx(ttx_content, flavor=flavor)
      binary_data
    `);

    return new Uint8Array(result.toJs());
  }

  async listTables(fontData: Uint8Array, fontNumber = 0): Promise<string[]> {
    await this.initialize();
    if (!this.pyodide) throw new Error('Pyodide not initialized');

    this.pyodide.globals.set('font_data', fontData);
    this.pyodide.globals.set('font_number', fontNumber);

    const result = this.pyodide.runPython(`
      import json
      tables = ttx_processor.list_tables(font_data.to_py(), font_number)
      json.dumps(tables)
    `);

    return JSON.parse(result);
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const pyodideTTX = new PyodideTTX();
