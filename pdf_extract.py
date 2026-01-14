from pdfminer.high_level import extract_text
import sys, os, json

PDF_PATH = sys.argv[1] if len(sys.argv)>1 else 'examples/modelos de email.pdf'
OUT = 'data/pdf_templates.jsonl'
os.makedirs('data', exist_ok=True)
text = extract_text(PDF_PATH)
parts = [p.strip() for p in text.split('\n\n') if p.strip()]
with open(OUT,'w',encoding='utf-8') as f:
    for i,p in enumerate(parts):
        obj = {'id':i,'text':p}
        f.write(json.dumps(obj, ensure_ascii=False)+'\n')
print('extracted', len(parts), 'parts to', OUT)
