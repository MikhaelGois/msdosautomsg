import json
import os
from collections import Counter

# Analisar todos os templates do PDF
templates = []
with open('data/pdf_templates.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            templates.append(obj.get('text', ''))
        except:
            pass

print(f"✓ Carregados {len(templates)} templates\n")

# Analisar padrões estruturais
print("=== ANÁLISE DE PADRÕES ===\n")

# Padrão 1: Estrutura geral
print("1. ESTRUTURA GERAL:")
for i, text in enumerate(templates[:2]):
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    print(f"\n   Template {i+1} ({len(lines)} linhas):")
    print(f"   Greeting: {lines[0][:60] if lines else 'N/A'}")
    print(f"   Body sample: {lines[1][:60] if len(lines) > 1 else 'N/A'}")
    if len(lines) > 2:
        print(f"   Fields sample: {lines[2][:60]}")

# Padrão 2: Placeholders
print("\n\n2. PLACEHOLDERS DETECTADOS:")
placeholders = Counter()
for text in templates:
    import re
    found = re.findall(r'\[([^\]]+)\]', text)
    for p in found:
        placeholders[p] += 1

print(f"   Total de placeholders únicos: {len(placeholders)}")
print("   Top 10:")
for p, count in placeholders.most_common(10):
    print(f"     - {p}: {count}x")

# Padrão 3: Estrutura de assinatura
print("\n\n3. ASSINATURAS:")
for i, text in enumerate(templates[:2]):
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if lines:
        print(f"   Template {i+1}: ...{lines[-1][-40:]}")

print("\n✓ Análise completa!")
