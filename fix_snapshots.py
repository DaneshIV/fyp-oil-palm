with open('dashboard/app/security/snapshots/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix missing <a tag
old = '''  <div className="flex items-center gap-2">
    
      href={`${API_URL}${selected.url}`}'''

new = '''  <div className="flex items-center gap-2">
    
      href={`${API_URL}${selected.url}`}'''

content = content.replace(old, new)

with open('dashboard/app/security/snapshots/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed!')