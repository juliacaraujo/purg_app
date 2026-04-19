#!/bin/bash
set -e

echo "Gerando build web..."
npx expo export --platform web

echo "Publicando em /var/www/purg..."
cp -r dist/. /var/www/purg/

echo "Limpando dist..."
rm -rf dist/

echo "Deploy concluído!"
