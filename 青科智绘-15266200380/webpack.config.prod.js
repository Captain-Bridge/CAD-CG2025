const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = env => {
  return {
    mode: 'production',
    devtool: false,
    entry: {
      crowncadplugin: './webapp/src/App.js',
    },
    cache: {
      type: 'filesystem'
    },

    output: {
      path: path.resolve(__dirname, './webapp/nodeApp/static'),
      filename: 'js/[name].bundle.[contenthash].js',
      chunkFilename: 'js/chunk~[name].[contenthash].js',
      publicPath: '/'
    },

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
      }),
      new webpack.DefinePlugin({
        'DEVENV': false,
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
        chunks: 'all',
        minSize: 200000,
        maxSize: 1000000,
      },
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            sourceMap: false,
            compress: true,
            mangle: true,
          }
        })
      ],
    }

  };
};