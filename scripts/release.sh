#!/bin/bash

npm version patch --no-git-tag-version
npm version patch --no-git-tag-version --prefix create
git add .
git commit -m "v$(node -p "require('./package.json').version")"
git tag -a v$(node -p "require('./package.json').version") -m "v$(node -p "require('./package.json').version")"
git push --follow-tags