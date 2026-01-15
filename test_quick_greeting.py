import datetime, random

h = datetime.datetime.now().hour
if 5 <= h < 12:
    greet = random.choice(['Bom dia', 'Olá'])
elif 12 <= h < 18:
    greet = random.choice(['Boa tarde', 'Olá'])
else:
    greet = random.choice(['Boa noite', 'Olá'])

print(f'hour: {h}')
print(f'greeting: {greet}')

prompt = 'Teste de geração'
for lang in ('pt','en'):
    if lang == 'en':
        text = f"Dear Team,\n\n{prompt}\n\nLet me know if you need any additional information.\n\nThank you."
    else:
        text = f"Olá,\n\n{prompt}\n\nCaso precise de algo mais, me avise.\n\nObrigado."
    print('\nfallback (' + lang + '):')
    print(text)
