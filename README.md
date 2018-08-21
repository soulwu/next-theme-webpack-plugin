# @alifd/next-theme-webpack-plugin
A webpack plugin for adding normalize css and icon css of theme package.

[![npm package](https://img.shields.io/npm/v/@alifd/next-theme-webpack-plugin.svg?style=flat-square)](https://www.npmjs.org/package/@alifd/next-theme-webpack-plugin)

## Install

```
npm install babel-plugin-import --save-dev
npm install @alifd/next-theme-loader --save-dev
npm install @alifd/next-theme-webpack-plugin --save-dev
```

## Usage

### webpack 2+

``` js
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ThemePlugin = require('@alifd/next-theme-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.jsx'
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  devtool: 'inline-source-map',
  module: {
    rules: [{
      test: /\.jsx?$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            'env',
            'react',
            'stage-0'
          ],
          plugins: [
            'add-module-exports',
            'transform-decorators-legacy',
            ['babel-plugin-import', { style: true }]
          ]
        }
      },
      exclude: /node_modules/
    }, {
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        use: 'css-loader'
      })
    }, {
      test: /\.scss$/,
      use: ExtractTextPlugin.extract({
        use: [
          'css-loader',
          'fast-sass-loader',
          {
            loader: '@alifd/next-theme-loader',
            options: {
              theme: '@alifd/theme-package'
            }
          }
        ]
      })
    }]
  },
  plugins: [
    new ThemePlugin({ theme: '@alifd/theme-package' }),
    new ExtractTextPlugin('[name].css')
  ]
};
```

### webpack 1

webpack.config.js

``` js
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ThemePlugin = require('@alifd/next-theme-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.jsx'
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  devtool: 'inline-source-map',
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loader: 'babel',
      query: {
        presets: [
          'es2015',
          'react',
          'stage-0'
        ],
        plugins: [
          'add-module-exports',
          'transform-decorators-legacy',
          ['babel-plugin-import', { style: true }]
        ]
      },
      exclude: /node_modules/
    }, {
      test: /\.css$/,
      loaders: ExtractTextPlugin.extract('css')
    }, {
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract('css!fast-sass!@alifd/next-theme-loader?theme=@alifd/theme-package')
    }]
  },
  plugins: [
    new ThemePlugin({ theme: '@alifd/theme-package' }),
    new ExtractTextPlugin('[name].css')
  ]
};
```

## Options

* `prependNormalizeCSS`(Boolean): whether prepend next build-in normalize css to bundle css, default value is `true`
* `theme`(String): theme package
* `resolve`(String/Array): the path(node_modules parent folder) to find the theme package
* `libraryName`(String): the basic component library name, default value is `@alifd/next`
* `modifyVars`(String/Object): inject some variables to build normalize scss and icon scss, such as: `$css-prefix` or `$font-custom-path`, value may be the following two types
  * `{ '$css-prefix': '"my-"' }`
  * `path.join(__dirname, 'variable.scss')`, it should be an absolute path
