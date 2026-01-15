import sys
try:
    import faiss
    print('faiss imported, version:', getattr(faiss, '__version__', 'unknown'))
    idx = faiss.IndexFlatL2(8)
    print('IndexFlatL2 created OK')
    sys.exit(0)
except Exception as e:
    print('faiss import failed:', repr(e))
    sys.exit(2)
