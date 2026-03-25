UPDATE platform_settings 
SET value = replace(replace(replace(value, '#funcões', '#funcoes'), '#preços', '#precos'), '#demonstracão', '#demonstracao') 
WHERE key IN ('landing_page_published', 'landing_page_draft');