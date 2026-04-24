#!/bin/bash
set -e

echo "Gerando build web..."
npx expo export --platform web

echo "Aplicando patches no index.html..."
python3 - <<'EOF'
import re

with open("dist/index.html", "r") as f:
    html = f.read()

# 1. viewport-fit=cover — habilita env(safe-area-inset-*) em mobile browsers
html = html.replace(
    'width=device-width, initial-scale=1, shrink-to-fit=no',
    'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
)

# 2. 100dvh — desconta a barra de endereços em mobile browsers,
#    evitando que a tab bar fique cortada abaixo da área visível.
#    Substitui todas as ocorrências de "height: 100%;" dentro do bloco <style id="expo-reset">
def patch_style(m):
    return m.group(0).replace("height: 100%;", "height: 100dvh;")

html = re.sub(
    r'<style id="expo-reset">.*?</style>',
    patch_style,
    html,
    flags=re.DOTALL
)

# 3. Title — garante que o título seja Purg
import re as re2
html = re2.sub(r'<title>[^<]*</title>', '<title>Purg</title>', html)

with open("dist/index.html", "w") as f:
    f.write(html)

print("  viewport-fit=cover: ok")
print("  height 100dvh: ok")
print("  title Purg: ok")
EOF


echo "Publicando em /var/www/purg..."
cp -r dist/. /var/www/purg/

echo "Limpando dist..."
rm -rf dist/

echo "Deploy concluído!"
