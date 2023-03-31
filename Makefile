serve:
	@RUST_BACKTRACE=1 pnpm daobox serve \
		--assets-dir ./dist/assets \
		--assets-prefix / \
		--dist-dir ./dist \
		--i18n-dir ./src/_layout/i18n \
		--templates-dir ./src

export-all:
#@RUST_BACKTRACE=1 /Users/dayu/.cargo/bin/daobox-site serve \
	
	@RUST_BACKTRACE=1 pnpm daobox serve \
		--assets-dir ./dist/assets \
		--assets-prefix / \
		--dist-dir ./dist \
		--i18n-dir ./src/_layout/i18n \
		--templates-dir ./src \
		--excludes /site/docs/ \
		--export

fe-dev:
	 pnpm run dev

fe-build:
	pnpm run build

dist: fe-build export-all


sync-fe:
	./sync_fe_dev_2.sh /Users/dayu/Coder/yiibox/daobox_fe