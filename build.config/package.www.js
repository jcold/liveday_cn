module.exports = {
  entry: {
    main: [
      './src/assets/js/MainEntrypoint.ts',
    ],
  },

  //   title: '道盒剪辑',
  //   template: './templates/main.html',

  // JS & CSS 输出目录
  //   outputDir: './dist',

  // JS & CSS 文件名是否禁用HASH
  //   disableHash: true,

  // 禁用js&css各自存放
  //   disableAssetsDir: true,

  // svg icon dir
  // svgIconDir: '../src/assets/svg-icon/'

  // WASM native dir
  // wasmNativeDir: '../native_dir'

  // 需要直接复制的静态资源
  //   publicDir: './src/entrypoint/chrome_extension/plugin_framework',

  //   devServer: {
  //     host: '0.0.0.0',
  //     port: 9808,
  //     baseDir: '',
  //     proxy: [
  //       {
  //         context: ['/api/', '/view/', '/static/', '/port/'],
  //         target: 'http://0.0.0.0:9080/',
  //       },
  //     ],
  //   },

  env: {
    base: {
      NODE_ENV: 'development',
      VUE_APP_ROUTER_MODE: 'history',
    },
    dev: {
      // TAILWIND_MODE: 'build'
    },
    prod: {
      NODE_ENV: 'production',
      VUE_APP_ROUTER_MODE: 'history',
    },
  },
}
