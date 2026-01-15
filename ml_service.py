"""
ML Service for Email Generation
Generates professional emails based on template patterns and user prompts
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import sqlite3
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Carregar templates do banco de dados
def load_templates():
    """Load templates from SQLite database"""
    templates = []
    db_path = Path(__file__).parent / 'data' / 'msdos.db'
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, text FROM templates')
        
        for row in cursor.fetchall():
            template_id, name, text = row
            templates.append({
                'id': template_id,
                'name': name,
                'text': text,
            })
        
        conn.close()
    except Exception as e:
        print(f"Error loading templates: {e}")
    
    return templates

# Analisar estrutura de um email
def analyze_email_structure(text):
    """Analyze the structure of an email"""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    result = {
        'greeting': '',
        'body': [],
        'fields': [],
        'closing': ''
    }
    
    if not lines:
        return result
    
    # Greeting (first line usually)
    if lines[0].startswith('Dear ') or lines[0].startswith('Hello '):
        result['greeting'] = lines[0]
        body_start = 1
    else:
        result['greeting'] = 'Dear Team,'
        body_start = 0
    
    # Find fields (lines with [...])
    field_lines = []
    body_lines = []
    
    for i, line in enumerate(lines[body_start:], body_start):
        if '[' in line and ']' in line:
            field_lines.append(line)
        elif any(closing in line for closing in ['Thank you', 'Best regards', 'Sincerely', 'Kind regards', 'Warm regards']):
            result['closing'] = '\n'.join(lines[i:])
            break
        else:
            body_lines.append(line)
    
    result['body'] = body_lines
    
    # Extract field placeholders
    for line in field_lines:
        fields = re.findall(r'([A-Za-z][A-Za-z0-9\s]+):\s*\[([^\]]+)\]', line)
        for field_name, example in fields:
            result['fields'].append({
                'name': field_name.strip(),
                'example': example.strip()
            })
    
    # Default closing if not found
    if not result['closing']:
        result['closing'] = 'Thank you for your assistance.'
    
    return result

# Gerar email baseado em padrões
def generate_email_from_prompt(prompt, subject, templates_list):
    """Generate email based on user prompt and template patterns"""
    
    # Extrair intent do prompt
    prompt_lower = prompt.lower()
    
    # Padrões de intent com keywords mais completas
    intents = {
        'mfa': ['mfa', 'authentication', 'autenticação', 'reset', 'multi-factor', 'dois fatores', 'cannot access'],
        'access': ['access', 'acesso', 'extend', 'extensão', 'account', 'reactivate', 'reativar', 'restore', 'recover', 'folder', 'network', 'pasta', 'drive', 'share', 'shared'],
        'account': ['account', 'conta', 'create', 'new user', 'novo', 'luxottica', 'criar', 'new account'],
        'license': ['license', 'licença', 'office', 'upgrade', 'renew', 'e1', 'e3', 'e5', 'atualizar'],
        'distribution': ['distribution', 'distribuição', 'group', 'email group', 'grupo', 'add email', 'remove email'],
        'block': ['block', 'bloqueio', 'deactivate', 'desativar', 'remove', 'remover', 'delete', 'deletar', 'disable'],
    }
    
    best_intent = 'access'
    best_score = 0
    
    for intent, keywords in intents.items():
        score = sum(1 for kw in keywords if kw in prompt_lower)
        if score > best_score:
            best_score = score
            best_intent = intent
    
    # Templates específicos por intent com estrutura profissional
    intent_templates = {
        'access': {
            'intro': 'Please extend the account access for the user below. The account has already expired:',
            'fields': ['User Email', 'Employee ID or Reference', 'Resource or Folder', 'Access Type', 'Ticket Number'],
        },
        'mfa': {
            'intro': 'Please reset the Multi-Factor Authentication (MFA) for the following user:',
            'fields': ['Full Name', 'Email Address', 'Username', 'Ticket Number'],
        },
        'account': {
            'intro': 'Please create a new account for the user below:',
            'fields': ['Full Name', 'Email Address', 'Department', 'Manager', 'Ticket Number'],
        },
        'license': {
            'intro': 'Please process the Office license request for the user below:',
            'fields': ['User Email', 'Current License', 'Requested License', 'Ticket Number'],
        },
        'distribution': {
            'intro': 'Please update the distribution group as requested:',
            'fields': ['User Email', 'Distribution Group', 'Action', 'Reason', 'Ticket Number'],
        },
        'block': {
            'intro': 'Please block and deactivate the account for the user below:',
            'fields': ['User Email', 'Employee ID', 'Reason', 'Effective Date', 'Ticket Number'],
        },
    }
    
    # Construir email profissional
    template_info = intent_templates.get(best_intent, intent_templates['access'])

    # Ajuste específico para pastas de rede (não colocar mensagem de conta expirada)
    folder_keywords = ['folder', 'pasta', 'network', 'share', 'shared', 'drive', '\\', '//']
    if best_intent == 'access' and any(k in prompt_lower for k in folder_keywords):
        template_info = {
            'intro': 'Please grant access to the network folder for the user below:',
            'fields': [
                'Email Address',
                'Employee ID or External Reference',
                'Folder Path',
                'Access Level',
                'Domain Group (if applicable)',
                'Reason for Access',
                'Ticket BR'
            ],
        }
    
    email_body = 'Dear Team,\n\n'
    email_body += template_info['intro'] + '\n\n'
    
    # Adicionar campos em formato limpo
    for field in template_info['fields'][:5]:  # Limitar a 5 campos
        email_body += f"  {field}: [{field}]\n"
    
    email_body += '\n'
    
    # Adicionar contexto sem copiar o prompt literal (mantém 100% inglês)
    email_body += 'Context:\n'
    email_body += '  Summary: [Summarize the user request in English]\n'
    email_body += '  Business justification: [Why the access is needed]\n\n'

    email_body += 'Let me know if you need any additional information.\n\n'
    email_body += 'Thank you for your assistance.'
    
    # Selecionar template usado para logging
    selected_template = None
    for template in templates_list:
        template_name_lower = template['name'].lower()
        if best_intent == 'access' and (
            'extend' in template_name_lower
            or 'reactivate' in template_name_lower
            or 'folder' in template_name_lower
            or 'network' in template_name_lower
            or 'share' in template_name_lower
        ):
            selected_template = template['name']
            break
        elif best_intent == 'mfa' and 'mfa' in template_name_lower:
            selected_template = template['name']
            break
        elif best_intent == 'account' and ('new' in template_name_lower or 'luxottica' in template_name_lower):
            selected_template = template['name']
            break
        elif best_intent == 'license' and 'license' in template_name_lower:
            selected_template = template['name']
            break
        elif best_intent == 'distribution' and ('distribution' in template_name_lower or 'group' in template_name_lower):
            selected_template = template['name']
            break
        elif best_intent == 'block' and ('block' in template_name_lower or 'deactivate' in template_name_lower):
            selected_template = template['name']
            break
    
    if not selected_template and templates_list:
        selected_template = templates_list[0]['name']
    
    return {
        'text': email_body,
        'subject': subject or 'Service Request',
        'intent': best_intent,
        'template_used': selected_template or 'default'
    }

# Carregar templates na inicialização
TEMPLATES = load_templates()
print(f"Loaded {len(TEMPLATES)} templates from database")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'templates_loaded': len(TEMPLATES)})

@app.route('/generate', methods=['POST'])
def generate():
    """
    Generate email based on prompt
    Request: {
        "text": "user prompt describing what email is needed",
        "fields": {"subject": "Email Subject", ...}
    }
    Response: {"text": "generated email body", "subject": "..."}
    """
    try:
        data = request.get_json()
        prompt = data.get('text', '')
        fields = data.get('fields', {})
        subject = fields.get('subject', '')
        
        if not prompt:
            return jsonify({'error': 'text field required'}), 400
        
        result = generate_email_from_prompt(prompt, subject, TEMPLATES)
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in /generate: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze email structure"""
    try:
        data = request.get_json()
        email_text = data.get('text', '')
        
        if not email_text:
            return jsonify({'error': 'text field required'}), 400
        
        analysis = analyze_email_structure(email_text)
        return jsonify(analysis)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/templates', methods=['GET'])
def list_templates():
    """List all available templates"""
    template_list = [
        {'id': t['id'], 'name': t['name']}
        for t in TEMPLATES
    ]
    return jsonify(template_list)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=False)
