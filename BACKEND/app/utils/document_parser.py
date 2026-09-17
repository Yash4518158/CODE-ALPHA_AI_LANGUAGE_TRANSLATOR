import io
from PyPDF2 import PdfReader
from docx import Document

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Extracts raw text from a document in memory based on its file extension.
    Supported extensions: .pdf, .docx, .txt
    """
    ext = filename.lower().split('.')[-1]
    
    try:
        if ext == 'pdf':
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text.strip()
            
        elif ext == 'docx':
            docx_file = io.BytesIO(file_bytes)
            document = Document(docx_file)
            return "\n".join([paragraph.text for paragraph in document.paragraphs]).strip()
            
        elif ext == 'txt':
            return file_bytes.decode('utf-8', errors='ignore').strip()
            
        else:
            raise ValueError(f"Unsupported file extension: .{ext}")
            
    except Exception as e:
        raise Exception(f"Failed to parse document: {str(e)}")
