#!/bin/bash
set -e

echo "Gerando build web..."
npx expo export --platform web

echo "Aplicando patches no index.html..."
python3 - <<'EOF'
import re, time, json

BUILD_TS = str(int(time.time()))

with open("dist/index.html", "r") as f:
    html = f.read()

# 1. viewport-fit=cover — habilita env(safe-area-inset-*) em mobile browsers
html = html.replace(
    'width=device-width, initial-scale=1, shrink-to-fit=no',
    'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
)

# 2. 100dvh — desconta a barra de endereços em mobile browsers,
#    evitando que a tab bar fique cortada abaixo da área visível.
def patch_style(m):
    return m.group(0).replace("height: 100%;", "height: 100dvh;")

html = re.sub(
    r'<style id="expo-reset">.*?</style>',
    patch_style,
    html,
    flags=re.DOTALL
)

# 3. Title — garante que o título seja Purg
html = re.sub(r'<title>[^<]*</title>', '<title>Purg</title>', html)

# 4. Prefetch do vídeo de abertura
if '<link rel="prefetch" href="/abertura.mp4"' not in html:
    html = html.replace('</head>', '<link rel="prefetch" href="/abertura.mp4" as="video">\n</head>')

# 5. Versão do build + proteção contra bfcache
#    - window.__BUILD_TS: comparado em runtime com /version.json para detectar build antigo
#    - pageshow: força reload quando o browser restaura a página do bfcache
VERSION_SCRIPT = f'''<script>
window.__BUILD_TS="{BUILD_TS}";
window.addEventListener("pageshow",function(e){{if(e.persisted)location.reload();}});
</script>'''
html = html.replace('</head>', VERSION_SCRIPT + '\n</head>')

with open("dist/index.html", "w") as f:
    f.write(html)

# Grava version.json para checagem em runtime pelo app
with open("dist/version.json", "w") as f:
    json.dump({"ts": BUILD_TS}, f)

print("  viewport-fit=cover: ok")
print("  height 100dvh: ok")
print("  title Purg: ok")
print("  prefetch vídeo: ok")
print(f"  version.json: {BUILD_TS}")
print("  bfcache guard: ok")
EOF


echo "Publicando em /var/www/purg..."
rm -rf /var/www/purg/_expo/
cp -r dist/. /var/www/purg/
cp assets/purg_video_abertura.mp4 /var/www/purg/abertura.mp4
cp src/assets/logo.png /var/www/purg/logo.png

echo "Limpando dist..."
rm -rf dist/

echo "Deploy concluído!"
