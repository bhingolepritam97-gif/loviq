import os
import re

base_dir = r'D:\dating app 1\loviq\src\screens\onboarding'

for filename in os.listdir(base_dir):
    if not filename.endswith('.js'): continue
    filepath = os.path.join(base_dir, filename)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove subtitle="Step X of Y"
    content = re.sub(r'\s*subtitle="Step \d+ of \d+"\s*', '\n        ', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Cleaned up subtitle props.')
