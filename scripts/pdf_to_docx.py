#!/usr/bin/env python3
"""
PDF to DOCX converter using pdf2docx library
High-quality conversion that preserves formatting, fonts, and layout
"""

import sys
import os
import json
import traceback
from pathlib import Path

try:
    from pdf2docx import Converter
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "pdf2docx library not found. Please install it with: pip install pdf2docx"
    }))
    sys.exit(1)

def convert_pdf_to_docx(input_path, output_path):
    """
    Convert PDF to DOCX using pdf2docx library
    
    Args:
        input_path (str): Path to input PDF file
        output_path (str): Path to output DOCX file
    
    Returns:
        dict: Result with success status and any error messages
    """
    try:
        # Validate input file exists
        if not os.path.exists(input_path):
            return {
                "success": False,
                "error": f"Input file not found: {input_path}"
            }
        
        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # Redirect stderr to capture pdf2docx warnings/errors
        import io
        from contextlib import redirect_stderr
        
        stderr_capture = io.StringIO()
        
        with redirect_stderr(stderr_capture):
            # Create converter instance
            cv = Converter(input_path)
            
            # Convert PDF to DOCX
            # The pdf2docx library automatically handles:
            # - Text extraction with formatting
            # - Font preservation
            # - Layout preservation
            # - Image extraction
            # - Table structure
            cv.convert(output_path, start=0, end=None)
            
            # Close converter
            cv.close()
        
        # Get any warnings/errors from pdf2docx
        stderr_content = stderr_capture.getvalue()
        
        # Verify output file was created
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            result = {
                "success": True,
                "output_path": output_path,
                "file_size": file_size,
                "message": "PDF converted to DOCX successfully"
            }
            
            # Include warnings if any
            if stderr_content.strip():
                result["warnings"] = stderr_content.strip()
            
            return result
        else:
            return {
                "success": False,
                "error": "Output file was not created",
                "stderr": stderr_content.strip() if stderr_content.strip() else None
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }

def main():
    """Main function to handle command line arguments and conversion"""
    try:
        if len(sys.argv) != 3:
            result = {
                "success": False,
                "error": "Usage: python pdf_to_docx.py <input_pdf> <output_docx>"
            }
            print(json.dumps(result))
            sys.exit(1)
        
        input_path = sys.argv[1]
        output_path = sys.argv[2]
        
        # Perform conversion
        result = convert_pdf_to_docx(input_path, output_path)
        
        # Output result as JSON (ensure it's always valid JSON)
        print(json.dumps(result, ensure_ascii=False))
        
        # Exit with appropriate code
        sys.exit(0 if result["success"] else 1)
        
    except Exception as e:
        # Catch any unexpected errors and return as JSON
        error_result = {
            "success": False,
            "error": f"Unexpected error in main: {str(e)}",
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
