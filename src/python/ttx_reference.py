#!/usr/bin/env python3
"""
TTX-WASM Python Reference Implementation

This module provides a reference implementation of TTX functionality
that will be used as a guide for the WebAssembly port.
"""

import sys
import os
from typing import List, Dict, Optional, Union, Any
from pathlib import Path

# Import FontTools components
try:
    from fontTools.ttLib import TTFont, TTLibError
    from fontTools import ttx
    from fontTools.ttx import Options as TTXOptions
except ImportError:
    print("FontTools is required. Install with: pip install fonttools")
    sys.exit(1)


class TTXReference:
    """
    Reference implementation of TTX functionality using the original FontTools library.
    This serves as a specification for the WebAssembly implementation.
    """
    
    def __init__(self):
        self.supported_formats = ['TTF', 'OTF', 'WOFF', 'WOFF2', 'TTC', 'TTX']
    
    def detect_format(self, file_path: Union[str, Path]) -> str:
        """
        Detect the format of a font file.
        
        Args:
            file_path: Path to the font file
            
        Returns:
            String indicating the detected format
        """
        return ttx.guessFileType(str(file_path)) or 'UNKNOWN'
    
    def get_font_info(self, file_path: Union[str, Path], font_number: int = -1) -> Dict[str, Any]:
        """
        Get basic information about a font file.
        
        Args:
            file_path: Path to the font file
            font_number: Font index for TTC files
            
        Returns:
            Dictionary containing font information
        """
        try:
            format_type = self.detect_format(file_path)
            
            info = {
                'format': format_type,
                'path': str(file_path)
            }
            
            if format_type in ['TTF', 'OTF', 'WOFF', 'WOFF2', 'TTC']:
                # Load font to get detailed information
                font = TTFont(str(file_path), fontNumber=font_number, lazy=True)
                
                # Get table list
                info['tables'] = sorted(font.keys())
                
                # Get basic metadata if available
                metadata = {}
                
                if 'head' in font:
                    head = font['head']
                    metadata['unitsPerEm'] = head.unitsPerEm
                    metadata['created'] = head.created
                    metadata['modified'] = head.modified
                
                if 'name' in font:
                    name_table = font['name']
                    # Extract family and style names
                    for record in name_table.names:
                        if record.nameID == 1:  # Family name
                            metadata['family'] = record.toUnicode()
                        elif record.nameID == 2:  # Style name
                            metadata['style'] = record.toUnicode()
                        elif record.nameID == 5:  # Version
                            metadata['version'] = record.toUnicode()
                
                info['metadata'] = metadata
                font.close()
                
            return info
            
        except Exception as e:
            raise Exception(f"Failed to get font info: {e}")
    
    def dump_to_ttx(self, 
                   input_path: Union[str, Path], 
                   output_path: Optional[Union[str, Path]] = None,
                   tables: Optional[List[str]] = None,
                   skip_tables: Optional[List[str]] = None,
                   split_tables: bool = False,
                   split_glyphs: bool = False,
                   disassemble_instructions: bool = True,
                   font_number: int = -1) -> str:
        """
        Convert a font file to TTX XML format.
        
        Args:
            input_path: Path to input font file
            output_path: Path for output TTX file (optional)
            tables: List of tables to include
            skip_tables: List of tables to exclude
            split_tables: Whether to split tables into separate files
            split_glyphs: Whether to split glyphs into separate files
            disassemble_instructions: Whether to disassemble TrueType instructions
            font_number: Font index for TTC files
            
        Returns:
            Path to the generated TTX file
        """
        try:
            input_path = Path(input_path)
            
            if output_path is None:
                output_path = input_path.with_suffix('.ttx')
            else:
                output_path = Path(output_path)
            
            # Create TTX options
            options = TTXOptions([], 1)
            
            if tables:
                options.onlyTables = [t.ljust(4) for t in tables]
            if skip_tables:
                options.skipTables = [t.ljust(4) for t in skip_tables]
            
            options.splitTables = split_tables
            options.splitGlyphs = split_glyphs
            options.disassembleInstructions = disassemble_instructions
            options.fontNumber = font_number
            
            # Perform the conversion
            ttx.ttDump(str(input_path), str(output_path), options)
            
            return str(output_path)
            
        except Exception as e:
            raise Exception(f"Failed to dump font to TTX: {e}")
    
    def compile_from_ttx(self,
                        input_path: Union[str, Path],
                        output_path: Optional[Union[str, Path]] = None,
                        merge_file: Optional[Union[str, Path]] = None,
                        recalc_bboxes: bool = True,
                        flavor: Optional[str] = None) -> str:
        """
        Compile a TTX XML file to binary font format.
        
        Args:
            input_path: Path to input TTX file
            output_path: Path for output font file (optional)
            merge_file: Path to font file to merge with
            recalc_bboxes: Whether to recalculate glyph bounding boxes
            flavor: Output flavor ('woff', 'woff2', etc.)
            
        Returns:
            Path to the generated font file
        """
        try:
            input_path = Path(input_path)
            
            if output_path is None:
                # Determine extension based on TTX content or flavor
                if flavor:
                    ext = f'.{flavor}'
                else:
                    # Default to .ttf, but could be smarter about this
                    ext = '.ttf'
                output_path = input_path.with_suffix(ext)
            else:
                output_path = Path(output_path)
            
            # Create TTX options
            options = TTXOptions([], 1)
            options.mergeFile = str(merge_file) if merge_file else None
            options.recalcBBoxes = recalc_bboxes
            options.flavor = flavor
            
            # Perform the compilation
            ttx.ttCompile(str(input_path), str(output_path), options)
            
            return str(output_path)
            
        except Exception as e:
            raise Exception(f"Failed to compile TTX to font: {e}")
    
    def list_tables(self, file_path: Union[str, Path], font_number: int = -1) -> List[str]:
        """
        List all tables in a font file.
        
        Args:
            file_path: Path to the font file
            font_number: Font index for TTC files
            
        Returns:
            List of table names
        """
        try:
            font = TTFont(str(file_path), fontNumber=font_number, lazy=True)
            tables = sorted(font.keys())
            font.close()
            return tables
        except Exception as e:
            raise Exception(f"Failed to list tables: {e}")


def main():
    """Command-line interface for the reference implementation."""
    import argparse
    
    parser = argparse.ArgumentParser(description='TTX-WASM Reference Implementation')
    parser.add_argument('input', help='Input font or TTX file')
    parser.add_argument('-o', '--output', help='Output file path')
    parser.add_argument('-l', '--list', action='store_true', help='List tables in font')
    parser.add_argument('-i', '--info', action='store_true', help='Show font information')
    parser.add_argument('-t', '--tables', nargs='*', help='Tables to include')
    parser.add_argument('-x', '--exclude', nargs='*', help='Tables to exclude')
    parser.add_argument('-s', '--split-tables', action='store_true', help='Split tables')
    parser.add_argument('-g', '--split-glyphs', action='store_true', help='Split glyphs')
    parser.add_argument('--no-instructions', action='store_true', help='Don\'t disassemble instructions')
    parser.add_argument('-y', '--font-number', type=int, default=-1, help='Font number for TTC')
    parser.add_argument('--flavor', help='Output flavor (woff, woff2, etc.)')
    
    args = parser.parse_args()
    
    ttx_ref = TTXReference()
    
    try:
        if args.list:
            tables = ttx_ref.list_tables(args.input, args.font_number)
            print(f"Tables in {args.input}:")
            for table in tables:
                print(f"  {table}")
        
        elif args.info:
            info = ttx_ref.get_font_info(args.input, args.font_number)
            print(f"Font Information for {args.input}:")
            print(f"  Format: {info['format']}")
            if 'tables' in info:
                print(f"  Tables: {len(info['tables'])} ({', '.join(info['tables'][:5])}{'...' if len(info['tables']) > 5 else ''})")
            if 'metadata' in info:
                metadata = info['metadata']
                if 'family' in metadata:
                    print(f"  Family: {metadata['family']}")
                if 'style' in metadata:
                    print(f"  Style: {metadata['style']}")
                if 'unitsPerEm' in metadata:
                    print(f"  Units per Em: {metadata['unitsPerEm']}")
        
        else:
            # Determine operation based on input format
            format_type = ttx_ref.detect_format(args.input)
            
            if format_type == 'TTX':
                # Compile TTX to font
                output = ttx_ref.compile_from_ttx(
                    args.input,
                    args.output,
                    flavor=args.flavor
                )
                print(f"Compiled TTX to: {output}")
            
            else:
                # Dump font to TTX
                output = ttx_ref.dump_to_ttx(
                    args.input,
                    args.output,
                    tables=args.tables,
                    skip_tables=args.exclude,
                    split_tables=args.split_tables,
                    split_glyphs=args.split_glyphs,
                    disassemble_instructions=not args.no_instructions,
                    font_number=args.font_number
                )
                print(f"Dumped font to TTX: {output}")
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
