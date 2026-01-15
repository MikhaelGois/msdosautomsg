"""Build vector index from templates JSON.

Usage:
  python scripts/build_vector_index.py data/templates_from_pdf.json --out data/index

Produces:
  - data/index/faiss.index (if faiss available)
  - data/index/embeddings.npy
  - data/index/metadata.json

Fallback: if Faiss isn't available, saves embeddings + metadata and a sklearn NearestNeighbors pickle.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path
import numpy as np


def load_templates(path: Path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def embed_texts(texts, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(model_name)
        emb = model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
        return emb.astype('float32')
    except Exception as e:
        # offline or model download failed — fallback to TF-IDF dense vectors
        print('SentenceTransformer unavailable or offline — falling back to TF-IDF embeddings:', str(e))
        from sklearn.feature_extraction.text import TfidfVectorizer
        vec = TfidfVectorizer(max_features=1024)
        X = vec.fit_transform(texts)
        arr = X.toarray().astype('float32')
        return arr


def try_faiss_index(embeddings: np.ndarray, out_dir: Path):
    try:
        import faiss
    except Exception:
        return False
    d = embeddings.shape[1]
    index = faiss.IndexFlatIP(d)
    # normalize vectors for inner-product similarity
    faiss.normalize_L2(embeddings)
    index.add(embeddings)
    out_file = out_dir / 'faiss.index'
    faiss.write_index(index, str(out_file))
    return True


def fallback_save(embeddings: np.ndarray, out_dir: Path):
    # Save embeddings and metadata; user can load and use sklearn or FAISS elsewhere
    np.save(out_dir / 'embeddings.npy', embeddings)
    return True


def main(argv=None):
    argv = argv or sys.argv[1:]
    if not argv:
        print('Usage: build_vector_index.py templates.json [--out outdir]')
        return 1
    in_path = Path(argv[0])
    out = Path('data/index')
    if '--out' in argv:
        i = argv.index('--out')
        if i + 1 < len(argv):
            out = Path(argv[i+1])
    out.mkdir(parents=True, exist_ok=True)

    templates = load_templates(in_path)
    texts = []
    metas = []
    for t in templates:
        text = (t.get('subject','') + '\n' + t.get('body','')).strip()
        texts.append(text)
        metas.append({'id': t.get('id'), 'name': t.get('name'), 'subject': t.get('subject')})

    print(f'Embedding {len(texts)} templates...')
    embeddings = embed_texts(texts)

    # try faiss
    ok = try_faiss_index(embeddings.copy(), out)
    if ok:
        print('Built Faiss index at', out / 'faiss.index')
    else:
        print('Faiss not available; saving embeddings for offline indexing')
        fallback_save(embeddings, out)

    # Save metadata
    import json
    with open(out / 'metadata.json', 'w', encoding='utf-8') as f:
        json.dump(metas, f, ensure_ascii=False, indent=2)

    print('Saved metadata to', out / 'metadata.json')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
