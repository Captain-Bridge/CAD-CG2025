const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = env => {
  const devFlag = !!(env && env.dev);
  return {
    mode: 'development',
    cache: {
      type: 'filesystem'
    },
    devServer: {
      static: path.resolve(__dirname, './webapp/nodeApp/static'), //devserver根目录
      host: 'localhost', //服务器的ip地址
      liveReload: true, //自动刷新
      hot: false,
      port: 8085,  //端口
      open: true,  //自动打开页面
      historyApiFallback: true,
      proxy: {
        '/dev': {
          target: 'http://localhost:9000',
          changeOrigin: true,
          pathRewrite: {
            '^/dev': ''
          }
        },
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      },
    },
    entry: {
      crowncadplugin: './webapp/src/App.js',
    },

    output: {
      path: path.resolve(__dirname, './webapp/nodeApp/static'),
      filename: 'js/[name].bundle.[contenthash].js',
      chunkFilename: 'js/chunk~[name].[contenthash].js',
      publicPath: '/'
    },

    devtool: 'eval-source-map',

    module: {
      rules: [
        {
          loader: 'babel-loader',
          test: /\.js$/,
          include: [
            path.resolve(__dirname, './webapp/'),
          ],
          exclude: [
            path.resolve(__dirname, './webapp/nodeApp'),
          ],
          options: {
            presets: ['@babel/env', '@vue/babel-preset-jsx'],
            plugins: [
              ['@babel/syntax-dynamic-import'],
              ['@babel/plugin-proposal-decorators', {"legacy": true}],
            ]
          }
        },
        {
          test: /\.less$/,
          use: [
            'vue-style-loader',
            'css-loader',
            'postcss-loader',
            'less-loader'
          ]
        },
        {
          loader: 'vue-loader',
          test: /\.vue/,
          options: {
            prettify: false
          }
        },
        {
          test: /\.css$/,
          use: [
            'vue-style-loader',
            'css-loader',
            'postcss-loader',
          ]
        },
      ]
    },

    plugins: [
      new VueLoaderPlugin(),
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: ['./js', 'index.html'],
        dry: devFlag
      }),
      new webpack.DefinePlugin({
        'DEVENV': JSON.stringify(devFlag),
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: false
      }),
      new HtmlWebpackPlugin({
        template: './webapp/index.html'
      })
    ],
    optimization: {
      splitChunks: {
        minSize: 500000
      }
    }

  };
};