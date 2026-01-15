"""Semantic search using FAISS index for template retrieval."""
from __future__ import annotations
import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional


class TemplateRetriever:
    def __init__(self, index_dir: str | Path):
        self.index_dir = Path(index_dir)
        self.templates = self._load_templates()
        self.metadata = self._load_metadata()
        self.index = self._load_index()
        self.embeddings = self._load_embeddings()
        
    def _load_templates(self) -> List[Dict]:
        """Load templates from JSON catalog."""
        catalog = self.index_dir.parent / 'templates_from_pdf.json'
        if catalog.exists():
            with open(catalog, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    
    def _load_metadata(self) -> List[Dict]:
        """Load template metadata."""
        meta_path = self.index_dir / 'metadata.json'
        if meta_path.exists():
            with open(meta_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    
    def _load_index(self):
        """Load FAISS index if available."""
        idx_path = self.index_dir / 'faiss.index'
        if idx_path.exists():
            try:
                import faiss
                return faiss.read_index(str(idx_path))
            except Exception:
                return None
        return None
    
    def _load_embeddings(self) -> Optional[np.ndarray]:
        """Load embeddings array."""
        emb_path = self.index_dir / 'embeddings.npy'
        if emb_path.exists():
            return np.load(emb_path)
        return None
    
    def embed_query(self, text: str) -> np.ndarray:
        """Embed a query text using the same method as templates."""
        # Fallback to TF-IDF if sentence-transformers unavailable
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            emb = model.encode([text], convert_to_numpy=True)
            return emb.astype('float32')[0]
        except Exception:
            # TF-IDF fallback: match the training vocabulary
            from sklearn.feature_extraction.text import TfidfVectorizer
            # Simple approach: fit on all template texts + query
            all_texts = [t.get('subject','') + '\n' + t.get('body','') for t in self.templates]
            all_texts.append(text)
            vec = TfidfVectorizer(max_features=1024)
            X = vec.fit_transform(all_texts)
            return X[-1].toarray().astype('float32')[0]
    
    def search(self, query: str, k: int = 3) -> List[Dict]:
        """Search for k most similar templates."""
        if self.index is None and self.embeddings is None:
            return []
        
        q_emb = self.embed_query(query)
        
        if self.index is not None:
            # Use FAISS
            import faiss
            q_vec = q_emb.reshape(1, -1)
            faiss.normalize_L2(q_vec)
            D, I = self.index.search(q_vec, k)
            results = []
            for i, dist in zip(I[0], D[0]):
                if i < len(self.templates):
                    t = self.templates[i].copy()
                    t['score'] = float(dist)
                    results.append(t)
            return results
        else:
            # Fallback: cosine similarity with embeddings
            from sklearn.metrics.pairwise import cosine_similarity
            sims = cosine_similarity([q_emb], self.embeddings)[0]
            top_k = np.argsort(sims)[::-1][:k]
            results = []
            for i in top_k:
                t = self.templates[i].copy()
                t['score'] = float(sims[i])
                results.append(t)
            return results
