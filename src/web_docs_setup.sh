# web docs setup bash

npm run build

rm -rf ../docs/mc101
rm -rf ../docs/mininova
rm -rf ../docs/sh32
rm -rf ../docs/jdxi
rm -rf ../docs/jd800

cp -r ../build ../docs/mc101
cp -r ../build ../docs/mininova
cp -r ../build ../docs/sh32
cp -r ../build ../docs/jdxi
cp -r ../build ../docs/jd800

cp -f ./mc101/presets.js ../docs/mc101/
cp -f ./mininova/presets.js ../docs/mininova/
cp -f ./sh32/presets.js ../docs/sh32/
cp -f ./jdxi/presets.js ../docs/jdxi/
cp -f ./jd800/presets.js ../docs/jd800/
