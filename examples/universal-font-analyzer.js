/**
 * Universal Library Example
 * Shows how to create a library that works in both Node.js and browser environments
 */

import { TTX } from '../dist/ttx-wasm-universal.esm.js';

export class FontAnalyzer {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the font analyzer
   * Automatically detects environment and uses appropriate backend
   */
  async initialize(config = {}) {
    if (this.initialized) return;

    await TTX.initialize(config);
    this.initialized = true;

    console.log(`FontAnalyzer initialized with ${TTX.getRuntime()} backend`);
  }

  /**
   * Get comprehensive font analysis
   */
  async analyze(fontData) {
    if (!this.initialized) {
      throw new Error('FontAnalyzer not initialized. Call initialize() first.');
    }

    const results = {
      basicInfo: {},
      validation: {},
      tables: {},
      roundTrip: {},
    };

    try {
      // Basic information
      results.basicInfo.format = await TTX.detectFormat(fontData);
      results.basicInfo.info = await TTX.getFontInfo(fontData);
      results.basicInfo.size = fontData.length || fontData.byteLength;

      // Validation
      results.validation = await TTX.validateFont(fontData);

      // Table analysis
      results.tables = {
        count: results.basicInfo.info.tables.length,
        list: results.basicInfo.info.tables,
        essential: this.checkEssentialTables(results.basicInfo.info.tables),
        optional: this.checkOptionalTables(results.basicInfo.info.tables),
      };

      // Round-trip test (quick version with essential tables only)
      const essentialTables = ['head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post'];
      const availableEssential = essentialTables.filter(table =>
        results.basicInfo.info.tables.includes(table)
      );

      if (availableEssential.length > 0) {
        results.roundTrip = await TTX.roundTripTest(fontData, {
          tables: availableEssential,
          recalcBBoxes: false, // Preserve original bounding boxes
          recalcTimestamp: false, // Preserve original timestamps
        });
      }

      return results;
    } catch (error) {
      throw new Error(`Font analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract specific font tables as TTX
   */
  async extractTables(fontData, tableNames) {
    if (!this.initialized) {
      throw new Error('FontAnalyzer not initialized. Call initialize() first.');
    }

    return await TTX.dumpToTTX(fontData, {
      tables: tableNames,
    });
  }

  /**
   * Convert TTX back to font
   */
  async compileTTX(ttxContent, options = {}) {
    if (!this.initialized) {
      throw new Error('FontAnalyzer not initialized. Call initialize() first.');
    }

    return await TTX.compileFromTTX(ttxContent, options);
  }

  /**
   * Check for essential font tables
   */
  checkEssentialTables(tables) {
    const essential = ['head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post'];
    const missing = essential.filter(table => !tables.includes(table));
    const present = essential.filter(table => tables.includes(table));

    return {
      required: essential,
      present,
      missing,
      isComplete: missing.length === 0,
    };
  }

  /**
   * Check for optional/advanced font tables
   */
  checkOptionalTables(tables) {
    const optional = [
      'kern',
      'GPOS',
      'GSUB',
      'GDEF',
      'BASE',
      'JSTF',
      'DSIG',
      'gasp',
      'hdmx',
      'LTSH',
      'PCLT',
      'VDMX',
      'vhea',
      'vmtx',
    ];
    const present = optional.filter(table => tables.includes(table));
    const advanced = ['GPOS', 'GSUB', 'GDEF', 'BASE'];
    const hasAdvanced = advanced.some(table => tables.includes(table));

    return {
      available: optional,
      present,
      hasAdvanced,
      advancedTables: advanced.filter(table => tables.includes(table)),
    };
  }

  /**
   * Generate a human-readable report
   */
  generateReport(analysisResults) {
    const r = analysisResults;
    let report = '';

    report += `Font Analysis Report\n`;
    report += `===================\n\n`;

    // Basic Info
    report += `📄 Format: ${r.basicInfo.format}\n`;
    report += `📊 Size: ${Math.round(r.basicInfo.size / 1024)} KB\n`;
    if (r.basicInfo.info.metadata.family) {
      report += `👨‍👩‍👧‍👦 Family: ${r.basicInfo.info.metadata.family}\n`;
    }
    if (r.basicInfo.info.metadata.style) {
      report += `🎨 Style: ${r.basicInfo.info.metadata.style}\n`;
    }
    report += `\n`;

    // Validation
    report += `🔍 Validation: ${r.validation.isValid ? '✅ PASSED' : '❌ FAILED'}\n`;
    if (r.validation.errors.length > 0) {
      report += `❌ Errors: ${r.validation.errors.length}\n`;
      r.validation.errors.forEach(error => (report += `   • ${error}\n`));
    }
    if (r.validation.warnings.length > 0) {
      report += `⚠️  Warnings: ${r.validation.warnings.length}\n`;
      r.validation.warnings.forEach(warning => (report += `   • ${warning}\n`));
    }
    report += `\n`;

    // Tables
    report += `📋 Tables: ${r.tables.count} total\n`;
    report += `   Essential: ${r.tables.essential.present.length}/${r.tables.essential.required.length} ${r.tables.essential.isComplete ? '✅' : '❌'}\n`;
    if (r.tables.essential.missing.length > 0) {
      report += `   Missing: ${r.tables.essential.missing.join(', ')}\n`;
    }
    if (r.tables.optional.present.length > 0) {
      report += `   Optional: ${r.tables.optional.present.join(', ')}\n`;
    }
    if (r.tables.optional.hasAdvanced) {
      report += `   Advanced: ${r.tables.optional.advancedTables.join(', ')} 🚀\n`;
    }
    report += `\n`;

    // Round-trip
    if (r.roundTrip.similarity !== undefined) {
      report += `🔄 Round-trip: ${r.roundTrip.success ? '✅ PASSED' : '❌ FAILED'}\n`;
      report += `   Similarity: ${r.roundTrip.similarity.toFixed(2)}%\n`;
      if (r.roundTrip.differences?.length > 0) {
        report += `   Differences: ${r.roundTrip.differences.length}\n`;
      }
    }

    return report;
  }

  /**
   * Get current runtime information
   */
  getRuntimeInfo() {
    return {
      environment: TTX.getRuntime(),
      config: TTX.getConfig(),
      initialized: this.initialized,
    };
  }
}

// Usage examples for different environments:

// Node.js usage:
// const analyzer = new FontAnalyzer();
// await analyzer.initialize({ pythonExecutable: 'python3' });
// const results = await analyzer.analyze(fontData);
// console.log(analyzer.generateReport(results));

// Browser usage:
// const analyzer = new FontAnalyzer();
// await analyzer.initialize();
// const results = await analyzer.analyze(fontData);
// console.log(analyzer.generateReport(results));
