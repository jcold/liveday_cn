#!/usr/bin/env bash

SHELL_FOLDER=$(
  cd "$(dirname "$0")"
  pwd
)
cd $SHELL_FOLDER
echo work dir: $(pwd)

daobox_fe="$1"
if [ "$daobox_fe" == "" ];then
  daobox_fe=".."
fi

cp ${daobox_fe}/packages/note/.eslintrc.js .
cp ${daobox_fe}/packages/note/.prettierrc.js .
cp ${daobox_fe}/packages/note/babel.config.js .
cp ${daobox_fe}/packages/note/tsconfig.json .
cp ${daobox_fe}/packages/note/webpack.config.js .
cp ${daobox_fe}/packages/note/postcss.config.js .
cp ${daobox_fe}/packages/note/.eslintignore .
cp ${daobox_fe}/packages/note/.browserslistrc .
cp ${daobox_fe}/packages/note/.editorconfig .
cp ${daobox_fe}/packages/note/tailwind.config.js .

