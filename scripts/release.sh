#!/bin/bash

BUMP_TYPE=${1:-patch}

if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch|premajor|preminor|prepatch|prerelease)$ ]]; then
  echo "Error: Invalid version bump type '$BUMP_TYPE'."
  echo "Usage: ./release.sh [major|minor|patch|premajor|preminor|prepatch|prerelease]"
  exit 1
fi

echo "Bumping $BUMP_TYPE version..."

npm version "$BUMP_TYPE" --no-git-tag-version
npm version "$BUMP_TYPE" --no-git-tag-version --prefix create

NEW_VERSION=$(node -p "require('./package.json').version")

git add package.json package-lock.json create/package.json create/package-lock.json
git commit -m "v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "v$NEW_VERSION"
git push --follow-tags

echo "Successfully released v$NEW_VERSION!"
