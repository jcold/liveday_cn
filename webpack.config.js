const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WebpackAssetsManifest = require('webpack-assets-manifest')
const {VueLoaderPlugin} = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin')
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const {WebpackConfigDumpPlugin} = require('webpack-config-dump-plugin')

const {
  config,
  getPageEntry,
  isObject,
  getEntrypoint,
} = require('./build.config/helper')
const jsonToStr = (json) => JSON.stringify(json)
const isProd = process.env.NODE_ENV === 'production'

const resolve = (dir) => path.resolve(__dirname, dir)

const assetsDir = (cat) => {
  return config().disableAssetsDir ? '' : `assets/${cat}/`
}

function conditionalCompiler(opts) {
  const ret = {
    loader: 'ifdef-loader',
    options: {
      notInWorker: true, // 默认固定配置，仅当编译worker时指定为false
      inElectron: process.env.IN_ELECTRON === 'on',
      notInElectron: process.env.IN_ELECTRON !== 'on',
      isDebug: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isDesktopRelease:
        process.env.NODE_ENV === 'production' &&
        process.env.IN_ELECTRON === 'on',
      envTest: process.env.ENV_CONFIG === 'test',
      'ifdef-verbose': true, // add this for verbose output
      'ifdef-triple-slash': false, // add this to use double slash comment instead of default triple slash
      'ifdef-fill-with-blanks': true, // add this to remove code with blank spaces instead of "//" comments
      'ifdef-uncomment-prefix': '// #code ', // add this to uncomment code starting with "// #code "
    },
  }

  if (opts) {
    Object.keys(opts).forEach((k) => {
      ret.options[k] = opts[k]
    })
  }

  return ret
}

// 从 cross-env-file -p ./build.config/profile.note.electron.build.json webpack --config ./webpack.d/webpack.prod.js --progress
// 获取配置文件路径，将该文件用于env环境变量输入， 用于webpack.DefinePlugins 输入
// const profile_file_path = (function() {
//   const npm_script = process.env.npm_lifecycle_script
//   console.log('node env', npm_script)
//   const matches = npm_script.match(/-p\s+([^\s]+)/)
//   if (!matches) {
//     throw new Error('not assign env file')
//   }

//   if (matches.length !== 2) {
//     throw new Error('invalid npm script command')
//   } else {
//     const arr = matches[1].split('/')
//     return './build.config/' + arr[arr.length - 1]
//   }
// })()

const profile_file_path = process.env.ENV_File

console.log('env', require(profile_file_path))
console.log('entrypoint', getEntrypoint())

module.exports = {
  mode: process.env.NODE_ENV,

  // devtool: 'cheap-module-source-map',
  // devtool: 'eval-cheap-module-source-map',
  // devtool: 'source-map',
  devtool: isProd ? false : 'eval-source-map',
  // devtool: 'cheap-module-source-map',

  // 入口配置
  entry: getEntrypoint(),

  ...(config().devServer
    ? {
      devServer: {
        historyApiFallback: false,
        host: config().devServer.host || '0.0.0.0',
        port: config().devServer.port || 9080,
        static: {
          // https://webpack.docschina.org/configuration/dev-server/#publicpath
          publicPath: config().devServer.basePrefix || '/assets',
          directory: path.join(
            __dirname,
            config().devServer.staticDir || './public',
          ),
          serveIndex: true,
        },
        proxy: config().devServer.proxy || [],
        open: false,
      },
    }
    : {}),

  // runtimeCompiler: true,
  target: process.env.IN_ELECTRON === 'on' ? 'electron-renderer' : 'web',
  // stats: 'errors-warnings',
  stats: {children: true},
  externals: {
    // vue: 'Vue',
    // axios: 'axios',
  },

  // 打包输出配置
  output: {
    path: resolve(config().outputDir || './dist'),
    filename: isProd
      ? assetsDir('js') +
      '[name]' +
      (config().disableHash ? '' : '.[chunkhash:8]') +
      '.js'
      : 'assets/[name].js', // filename是相对于path路径生成
    publicPath: process.env.VUE_APP_CDN_PREFIX,
    assetModuleFilename: 'assets/img/[hash][ext][query]',
  },

  // 引入资源省略后缀、资源别名配置
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json', '.vue', 'css', 'scss'],
    alias: {
      '@icon': resolve('src/assets/svg-icon'),
      // vue$: 'vue/dist/vue.esm-bundler.js',
      '@': resolve('src'),
      src: resolve('src'),
    },
  },

  optimization: {
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,
          },
          output: {ascii_only: true},
        },
      }),
    ],
    // noEmitOnErrors: true,

    ...(isProd && !config().disableSplitJs
      ? {
        splitChunks: {
          chunks: 'async', // 必须三选一： "initial" | "all" | "async"
          minSize: 30000, // 形成一个新代码块最小的体积
          minChunks: 2, // 在分割之前，这个代码块最小应该被引用的次数（译注：为保证代码块复用性，默认配置的策略是不需要多次引用也可以被分割）. must be greater than or equal 2. The minimum number of chunks which need to contain a module before it's moved into the commons chunk.
          maxAsyncRequests: 5, // 按需加载时候最大的并行请求数。
          maxInitialRequests: 3, // 一个入口最大的并行请求数。
          cacheGroups: {
            vendor: {
              name: 'vendor', // 要缓存的 分隔出来的 chunk 名称
              chunks: 'all', // all-异步加载快，但初始下载量较大，文件共用性好； initial-初始下载量较小，但异步加载量较大，文件间有重复内容
              priority: -10,
              reuseExistingChunk: true, // 选项用于配置在模块完全匹配时重用已有的块，而不是创建新块
              test: /node_modules[\\/]/,
            },
          },
        },
      }
      : {}),

    // end of optimization
  },

  // 定义模块规则
  module: {
    unknownContextCritical: false,
    noParse: /^(vue|vue-router|vuex|vuex-router-sync|axios)$/,
    rules: [
      {
        test: /\.vue$/,
        include: [resolve('./src'), /\/ui\/src\//],
        use: [
          {
            loader: 'vue-loader',
            options: {
              transformAssetUrls: {
                icon: ['data'], // The globally registered tag name, the default is icon
              },
            },
          },
          conditionalCompiler(),
        ],
      },
      {
        test: /\.tsx?$/,
        use: [
          // 'cache-loader',
          // 'thread-loader',
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              appendTsSuffixTo: [/\.vue$/], // 为script有lang='ts'标识的脚本文件添加ts后缀
              happyPackMode: true,
            },
          },
          conditionalCompiler(),
        ],
        exclude: [/node_modules/, /\.worker\.ts$/],
      },
      {
        test: /\.(postc)ss$/i,
        include: [resolve('./src'), /\/ui\/src\//],
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          'css-loader',
          'postcss-loader',
          // 'sass-loader',
          conditionalCompiler(),
        ],
        exclude: [/node_modules/],
      },
      {
        test: /\.(sa|sc|c)ss$/i,
        include: [resolve('./src'), /\/ui\/src\//],
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          'css-loader',
          'postcss-loader',
          'sass-loader',
          conditionalCompiler(),
        ],
        exclude: [/node_modules/],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        // generator: {
        //   filename: 'assets/img/[hash][ext][query]',
        // },
        exclude: [/assets\/svg-icon/],
      },
      {
        test: /\.svg$/,
        include: [resolve(config().svgIconDir || './src/assets/svg-icon/')],
        use: [
          {
            loader: '@yzfe/svgicon-loader',
            options: {
              svgFilePath: [
                resolve(config().svgIconDir || './src/assets/svg-icon/'),
              ],
              svgoConfig: null, // Custom svgo configuration
            },
          },
        ],
      },

      {
        test: /\.worker\.ts$/,
        use: [
          {
            loader: 'worker-loader',
            options: {
              inline: 'fallback',
            },
          },
          'ts-loader',
          conditionalCompiler({
            notInWorker: false,
          }),
        ],
      },

      // end rules
    ],
  },

  // 插件选项
  plugins: [
    // 定义环境变量
    new webpack.DefinePlugin({
      'process.env': jsonToStr(require(resolve(profile_file_path))),
      __VUE_PROD_DEVTOOLS__: true,
      __VUE_OPTIONS_API__: true,
    }),

    new RemoveEmptyScriptsPlugin(),
    new WebpackConfigDumpPlugin(),

    ...(config().template
      ? Object.entries(getPageEntry()).map(function ([entry, value]) {
        const isObj = isObject(value)
        return new HtmlWebpackPlugin({
          template: resolve((isObj && value.template) || config().template),
          title: (isObj && value.title) || config().title,
          env_cdn_prefix: process.env.VUE_APP_CDN_PREFIX,
          filename: entry + '.html',
          chunks: [entry],
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeScriptTypeAttributes: true,
          },
        })
      })
      : []),

    // Ref: https://www.npmjs.com/package/webpack-assets-manifest
    new WebpackAssetsManifest({
      publicPath: true,
      entrypoints: true,
      output: 'assets-manifest.json',
    }),

    new VueLoaderPlugin(),

    // 清除上次构建的文件，清除目录是基于output出口目录
    ...(isProd ? [new CleanWebpackPlugin()] : []),

    new MiniCssExtractPlugin({
      filename: isProd
        ? assetsDir('css') +
        '[name]' +
        (config().disableHash ? '' : '.[chunkhash:8]') +
        '.css'
        : 'assets/[name].css', // 相对于 output.path 路径
    }),

    // 复制public文件
    ...(isProd && config().publicDir
      ? [
        new CopyWebpackPlugin({
          patterns: [
            {
              from: resolve(config().publicDir),
              to: resolve(config().outputDir || './dist'),
            },
          ],
        }),
      ]
      : []),

    // rust WASM
    ...(config().wasmNativeDir
      ? [
        new WasmPackPlugin({
          crateDirectory: resolve(config().wasmNativeDir),
        }),
      ]
      : []),

    // new ProgressBarPlugin(),
    // new FriendlyErrorsWebpackPlugin(),

    // new BundleAnalyzerPlugin(), // profile

    // end plugins
  ],

  ...(config().wasmNativeDir
    ? {
      experiments: {
        asyncWebAssembly: true,
        // importAsync: true,
      },
    }
    : {}),
}

/**
 * === KENG ===
 * 1. MiniCssExtractPlugin public path not working
 * https://stackoverflow.com/questions/51055490/minicssextractplugin-public-path-not-working
 *
 */
