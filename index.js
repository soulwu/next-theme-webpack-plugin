const fs = require('fs');
const path = require('path');
const resolver = require('resolve');
const sass = require('node-sass');
let ConcatSource;
try {
  ConcatSource = require('webpack/lib/ConcatSource');
} catch (e) {
  ConcatSource = require('webpack-sources').ConcatSource;
}

function ThemePlugin(options) {
  const prependNormalizeCSS = typeof options.prependNormalizeCSS === 'boolean' ?
    options.prependNormalizeCSS : true;
  const theme = options.theme;
  const modifyVars = options.modifyVars;

  let modifyVarsScss = '';
  if (modifyVars) {
    if (typeof modifyVars === 'object') {
      modifyVarsScss = Object.keys(modifyVars).reduce((ret, name) => {
        return ret + `${name}: ${modifyVars[name]};\n`;
      }, '');
    } else if (typeof modifyVars === 'string') {
      modifyVarsScss = `@import "${modifyVars}";\n`;
    }
  }

  if (prependNormalizeCSS) {
    const libraryName = options.libraryName || '@alifd/next';
    let normalizeRelativePath = options.normalizeCSSRelativePath || 'reset.scss';
    normalizeRelativePath = path.join(libraryName, normalizeRelativePath);
    const normalizePath = resolveFilePath(normalizeRelativePath, options.resolve);
    const normalizeScss = fs.readFileSync(normalizePath, 'utf8');

    let variablesScss = '';
    if (theme) {
      const variablesRelativePath = path.join(theme, 'variables.scss');
      const variablesPath = resolveFilePath(variablesRelativePath, options.resolve);
      variablesScss = fs.readFileSync(variablesPath, 'utf8');
    }

    this.normalizeCss = compileScss(variablesScss + modifyVarsScss + normalizeScss, [path.dirname(normalizePath)]);
  }

  if (theme) {
    const iconRelativePath = path.join(theme, 'icons.scss');
    const iconPath = resolveFilePath(iconRelativePath, options.resolve);
    const iconScss = fs.readFileSync(iconPath, 'utf8');
    this.iconCss = compileScss('$css-prefix: "next-";\n' + modifyVarsScss + iconScss, [path.dirname(iconPath)]);
  }
}

ThemePlugin.prototype.concatSource = function (compiler, compilation, chunks, done) {
  chunks.forEach(chunk => {
    chunk.files.forEach(fileName => {
      if (matchCSS(fileName, compiler.options.entry, compilation.preparedChunks)) {
        if (this.normalizeCss && this.iconCss) {
          compilation.assets[fileName] = new ConcatSource(this.normalizeCss, compilation.assets[fileName], this.iconCss);
        } else if (this.normalizeCss) {
          compilation.assets[fileName] = new ConcatSource(this.normalizeCss, compilation.assets[fileName]);
        } else {
          compilation.assets[fileName] = new ConcatSource(compilation.assets[fileName], this.iconCss);
        }
      }
    });
  });
  done();
};

ThemePlugin.prototype.apply = function(compiler) {
  if (!this.normalizeCss && !this.iconCss) {
    return;
  }

  if (compiler.hooks) {
    const plugin = {
      name: 'NextThemePlugin'
    };
    compiler.hooks.compilation.tap(plugin, compilation => {
      compilation.hooks.optimizeChunkAssets.tapAsync(plugin, (chunks, done) => {
        this.concatSource(compiler, compilation, chunks, done);
      });
    });
  } else {
    compiler.plugin('compilation', compilation => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        this.concatSource(compiler, compilation, chunks, done);
      });
    });
  }
};

function resolveFilePath(relativePath, resolve) {
  let fullPath;

  if (resolve) {
    const resolves = Array.isArray(resolve) ? resolve : [resolve];
    for (let i = 0; i < resolves.length; i++) {
      try {
        fullPath = resolver.sync(relativePath, { basedir: resolves[i] });
        break;
      } catch (e) {
        // ignore
      }
    }
  }
  if (!fullPath) {
    try {
      fullPath = resolver.sync(relativePath, { basedir: process.cwd() });
    } catch (e) {
      console.log('\n[Error] Can not find the file: ' + relativePath);
      throw e;
    }
  }

  return fullPath;
}

function compileScss(scss, includePaths) {
  return sass.renderSync({ data: scss, includePaths: includePaths }).css.toString('utf-8')
    .replace(/content:\s*(?:'|")([\u0080-\uffff])(?:'|")/g, (str, $1) => {
      return 'content: "' + convertCharStr2CSS($1) + '"';
    })
    .replace(/^@charset "UTF-8";/, '');
}

function convertCharStr2CSS(ch) {
  let code = ch.charCodeAt(0).toString(16);
  while (code.length < 4) {
    code = '0' + code;
  }
  return '\\' + code;
}

function matchCSS(chunkName, entry, preparedChunks) {
  if (/\.css$/.test(chunkName)) {
    const assetsFromEntry = chunkName.replace(/\.\w+$/, '');
    const entriesAndPreparedChunkNames = normalizeEntry(entry, preparedChunks);
    return entriesAndPreparedChunkNames.indexOf(assetsFromEntry) > -1;
  }

  return false;
}

function normalizeEntry(entry, preparedChunks) {
  if (!preparedChunks) {
    return Object.keys(entry);
  }

  return preparedChunks.reduce((ret, module) => {
    if (module.name) {
      ret.push(module.name);
    }
    return ret;
  }, Object.keys(entry));
}

module.exports = ThemePlugin;
