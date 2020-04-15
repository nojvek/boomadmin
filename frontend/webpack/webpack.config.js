/* eslint-env node */
const path = require(`path`);
const webpack = require(`webpack`);
const TerserPlugin = require(`terser-webpack-plugin`);
const MiniCssExtractPlugin = require(`mini-css-extract-plugin`);
const {BundleAnalyzerPlugin} = require(`webpack-bundle-analyzer`);
const OptimizeCssAssetsWebpackPlugin = require(`optimize-css-assets-webpack-plugin`);
const CopyWebpackPlugin = require(`copy-webpack-plugin`);

const toBool = (str) => Boolean(str && (str.toLowerCase() === `true` || str === `1`));
const isDevServer = process.argv.some((s) => s.includes(`webpack-dev-server`));

let {
  ANALYZE, // show bundle size stats,
  HOT, // enable hot reloading
  NODE_ENV = `development`,
  PROGRESS, // webpack progress info
  SOURCE_MAP, // type of webpack sourcemap https://webpack.js.org/configuration/devtool/
  WATCH, // watch and rebuild
  WRITE_TO_DISK, // yarn-dev-server also writes files to disk like yarn-build
} = process.env;

ANALYZE = toBool(ANALYZE);
HOT = toBool(HOT);
PROGRESS = toBool(PROGRESS);
WRITE_TO_DISK = toBool(WRITE_TO_DISK);
WATCH = toBool(WATCH);

const isProduction = NODE_ENV === `production`;
const isDev = NODE_ENV === `development`;
const rootDir = path.resolve(__dirname, `..`, `..`);
const distDir = path.resolve(rootDir, `dist`);
const frontendDir = path.join(rootDir, `frontend`);
const commonDir = path.join(rootDir, `common`);

// only allow webpack to compile common and front-end, we shouldn't depend on server
const includeDirs = [commonDir, frontendDir];

const cssLoaders = ({isInline = false, asModule = false} = {}) => {
  return [
    // .styl?inline imported files don't need to be extracted to .css
    isInline
      ? null
      : {
          loader: MiniCssExtractPlugin.loader,
          options: {hmr: HOT},
        },
    {
      loader: `css-loader`,
      options: {
        modules: asModule // this enables css-modules
          ? {localIdentName: `[local]_[hash:base64:4]`}
          : false,
        sourceMap: isProduction,
      },
    },
  ].filter(Boolean);
};

const sassLoader = () => ({
  loader: `sass-loader`,
  // use dart-sass because it supports proper @use syntax
  // see https://sass-lang.com/documentation/at-rules/use
  options: {
    implementation: require(`sass`),
  },
});

const tsLoader = () => ({
  loader: `ts-loader`,
  options: {
    happyPackMode: true,
    compilerOptions: {isolatedModules: true},
  },
});

const rules = [
  // we must ignore *.d.ts imports, else ts-loader will throw "Error: TypeScript emitted no output"
  {
    test: /\.d\.ts$/,
    use: {
      loader: `null-loader`,
    },
  },
  // TODO: needs some work
  // {
  //   test: /\.jss\.ts$/,
  //   include: includeDirs,
  //   use: [
  //     ...cssLoaders(),
  //     {
  //       loader: path.resolve(__dirname, `NodeEvalLoader.js`),
  //       options: {
  //         nodeArgs: [`-r`, `ts-node/register/transpile-only`],
  //       },
  //     },
  //   ],
  // },
  {
    test: /\.tsx?$/,
    include: includeDirs,
    exclude: /(\.(d)\.ts$)/,
    use: [tsLoader()],
  },

  // Styles
  {
    test: /\.css$/,
    include: includeDirs,
    use: cssLoaders(),
  },
  {
    test: /\.s[ac]ss$/,
    include: includeDirs,
    use: [...cssLoaders(), sassLoader()],
  },
  {
    test: /\.(png|jpg|gif|svg)$/,
    include: includeDirs,
    use: [
      {
        loader: `url-loader`,
        options: {
          limit: 50000,
          esModule: false,
        },
      },
    ],
  },
  {
    test: /\.svg$/,
    include: `${rootDir}/node_modules/@fortawesome/fontawesome-pro/svgs`,
    use: [
      {
        loader: `raw-loader`,
        options: {
          esModule: false,
        },
      },
    ],
  },
];

const stats = {
  assets: false,
  children: false,
  chunks: false,
  entrypoints: false,
  modules: false,
  timings: true,
};

const webpackConfig = {
  context: frontendDir,
  devtool: SOURCE_MAP || (isProduction ? `source-map` : false),
  devServer: {
    compress: true,
    headers: {'Access-Control-Allow-Origin': `*`},
    host: `0.0.0.0`,
    hot: HOT,
    inline: false,
    port: 8080,
    proxy: {
      '/api': {
        target: `http://localhost:9000`,
        secure: false,
      },
    },
    stats,
    writeToDisk: WRITE_TO_DISK,
  },
  entry: {
    app: `./app/app`,
  },
  mode: isProduction ? `production` : `development`,
  module: {rules},
  node: {
    __dirname: true,
    __filename: true,
  },
  optimization: {
    chunkIds: `named`,
    moduleIds: isProduction ? `hashed` : `named`,
    minimize: isProduction,
    minimizer: [
      new OptimizeCssAssetsWebpackPlugin(),
      new TerserPlugin({
        extractComments: false,
        parallel: true,
        terserOptions: {
          // see options descriptions at https://github.com/terser/terser#compress-options
          // full options list https://github.com/terser/terser/blob/master/lib/compress/index.js
          compress: true,
          mangle: true,
          output: {
            comments: false,
            semicolons: false, // use newlines when possible, so devtools don't hang
          },
        },
      }),
    ],
  },
  output: {
    filename: `[name].js`,
    path: distDir,
  },
  performance: {
    hints: false,
  },
  plugins: [
    ANALYZE ? new BundleAnalyzerPlugin({analyzerMode: `static`, openAnalyzer: false}) : null,
    HOT ? new webpack.HotModuleReplacementPlugin() : null,
    PROGRESS
      ? new webpack.ProgressPlugin({
          activeModules: false,
          entries: true,
          modules: true,
          profile: false,
        })
      : null,
    new webpack.DefinePlugin({
      IS_DEV: JSON.stringify(isDev),
    }),
    new MiniCssExtractPlugin({filename: `[name].css`}),
    new CopyWebpackPlugin([{from: path.join(frontendDir, `images`), to: `images`}]),
    new CopyWebpackPlugin([{from: path.join(frontendDir, `index.html`), to: distDir}]),
  ].filter(Boolean),
  resolve: {
    alias: {
      common: commonDir,
    },
    extensions: [`.js`, `.ts`, `.tsx`],
  },
  stats,
  watch: WATCH,
};

// add hot reloading related entries
if (HOT && isDevServer) {
  webpackConfig.entry.app = [
    `webpack/hot/dev-server`,
    `webpack-dev-server/client`,
    `webpack-dev-server-status-bar`,
    webpackConfig.entry.app,
  ];
}

module.exports = webpackConfig;
