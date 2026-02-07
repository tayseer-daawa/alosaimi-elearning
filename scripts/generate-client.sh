#! /usr/bin/env bash

set -e
set -x

cd "$(dirname "$0")/../backend"
python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" > ../openapi.json
cd ..

# Admin Frontend
cp openapi.json frontend/admin
cd frontend/admin
npm run generate-client

cd -

# Student Frontend
cp openapi.json frontend/student
cd frontend/student
npm run generate-client

cd -
rm openapi.json
