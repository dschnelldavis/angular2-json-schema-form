// Modified from angular-quickstart-lib
// https://github.com/filipesilva/angular-quickstart-lib/blob/master/build.js

'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const camelCase = require('camelcase');
const ngc = require('@angular/compiler-cli/src/main').main;
const rollup = require('rollup');
const uglify = require('rollup-plugin-uglify');
const sourcemaps = require('rollup-plugin-sourcemaps');
const nodeResolve = require('rollup-plugin-node-resolve-angular');
const commonjs = require('rollup-plugin-commonjs');
const inlineResources = require('./inline-resources');
const libName = require('./package.json').name;
const rootFolder = path.join(__dirname);
const compilationFolder = path.join(rootFolder, 'out-ngc');
const srcFolder = path.join(rootFolder, 'src/lib');
const distFolder = path.join(rootFolder, 'dist');
const tempLibFolder = path.join(compilationFolder, 'lib');
const es5OutputFolder = path.join(compilationFolder, 'lib-es5');
const es2015OutputFolder = path.join(compilationFolder, 'lib-es2015');

return Promise.resolve()
  // Copy library to temporary folder and inline html/css.
  .then(() => _relativeCopy(`**/*`, srcFolder, tempLibFolder)
    .then(() => inlineResources(tempLibFolder))
    .then(() => console.log('Inlining succeeded.'))
  )
  // Compile to ES2015.
  .then(() => ngc(['--project', `${tempLibFolder}/tsconfig.json`]))
    .then(exitCode => exitCode === 0 ? Promise.resolve() : Promise.reject())
    .then(() => console.log('ES2015 compilation succeeded.'))
  // Compile to ES5.
  .then(() => ngc(['--project', `${tempLibFolder}/tsconfig.es5.json`]))
    .then(exitCode => exitCode === 0 ? Promise.resolve() : Promise.reject())
    .then(() => console.log('ES5 compilation succeeded.'))
  // Copy typings and metadata to `dist/` folder.
  .then(() => Promise.resolve()
    .then(() => _relativeCopy('**/*.d.ts', es2015OutputFolder, distFolder))
    .then(() => _relativeCopy('**/*.metadata.json', es2015OutputFolder, distFolder))
    .then(() => console.log('Typings and metadata copy succeeded.'))
  )
  // Bundle lib.
  .then(() => {
    // Base configuration
    const es5Entry = path.join(es5OutputFolder, `${libName}.js`);
    const es2015Entry = path.join(es2015OutputFolder, `${libName}.js`);
    const rollupBaseConfig = {
      external: [
        // List of dependencies
        // https://github.com/rollup/rollup/wiki/JavaScript-API#external
        '@angular/cdk',
        '@angular/common',
        '@angular/core',
        '@angular/flex-layout',
        '@angular/forms',
        '@angular/material',
        '@angular/platform-browser',
        'ajv',
        'hammerjs',
        'lodash',
        'rxjs'
      ],
      plugins: [
        sourcemaps(),
        nodeResolve(),
        commonjs({ namedExports: {
          // list of lodash functions used by your library
          'node_modules/lodash/index.js': [
            'cloneDeep', 'cloneDeepWith', 'filter', 'isEqual', 'map', 'uniqueId'
          ]
        } })
      ],
      onwarn: function (warning) {
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        console.warn( warning.message );
      },
      output: {
        name: camelCase(libName),
        // ATTENTION: Add all dependencies and peer dependencies of your library
        // to `globals` and `external`. This is required for UMD bundle users.
        globals: {
          // key   = The library name
          // value = The global variable name on the window object
          // https://rollupjs.org/guide/en#javascript-api
          '@angular/cdk': 'ng.cdk',
          '@angular/common': 'ng.common',
          '@angular/core': 'ng.core',
          '@angular/flex-layout': 'ng.flexLayout',
          '@angular/forms': 'ng.forms',
          '@angular/material': 'ng.material',
          '@angular/platform-browser': 'ng.platformBrowser',
          'ajv': 'Ajv',
          'hammerjs': 'hammerjs',
          'lodash': '_',
          'rxjs': 'rxjs'
        }
      }
    };

    // UMD bundle
    const umdConfig = Object.assign({}, rollupBaseConfig, {
      input: es5Entry,
      output: Object.assign({}, rollupBaseConfig.output, {
        file: path.join(distFolder, `bundles`, `${libName}.umd.js`),
        format: 'umd'
      })
    });

    // Minified UMD bundle
    const minifiedUmdConfig = Object.assign({}, rollupBaseConfig, {
      input: es5Entry,
      output: Object.assign({}, rollupBaseConfig.output, {
        file: path.join(distFolder, `bundles`, `${libName}.umd.min.js`),
        format: 'umd'
      }),
      plugins: rollupBaseConfig.plugins.concat([uglify({})])
    });

    // ESM+ES5 flat module bundle
    const fesm5config = Object.assign({}, rollupBaseConfig, {
      input: es5Entry,
      output: Object.assign({}, rollupBaseConfig.output, {
        file: path.join(distFolder, `${libName}.es5.js`),
        format: 'es',
        intro: `import * as Ajv from 'ajv';\nimport * as _ from 'lodash';`
      })
    });

    // ESM+ES2015 flat module bundle
    const fesm2015config = Object.assign({}, rollupBaseConfig, {
      input: es2015Entry,
      output: Object.assign({}, rollupBaseConfig.output, {
        file: path.join(distFolder, `${libName}.js`),
        format: 'es',
        intro: `import * as Ajv from 'ajv';`
      })
    });

    const allBundles = [umdConfig, minifiedUmdConfig, fesm5config, fesm2015config]
      .map(cfg => rollup.rollup(cfg).then(bundle => bundle.write(cfg.output)));

    return Promise.all(allBundles)
      .then(() => console.log('All bundles generated successfully.'))
  })
  // Copy package files
  .then(() => Promise.resolve()
    .then(() => _relativeCopy('LICENSE', rootFolder, distFolder))
    .then(() => console.log('LICENSE file copied.'))
    .then(() => _relativeCopy('README.md', rootFolder, distFolder))
    .then(() => console.log('README.md file copied.'))
    .then(() => _copyPackageJson(rootFolder, distFolder))
    .then(() => console.log('package.json file copied and updated.'))
  )
  .catch(e => {
    console.error('Build failed. See below for errors.\n');
    console.error(e);
    process.exit(1);
  });

// Copy files, maintaining relative paths.
function _relativeCopy(fileGlob, from, to) {
  return new Promise((resolve, reject) => {
    glob(fileGlob, { cwd: from, nodir: true }, (err, files) => {
      if (err) reject(err);
      files.forEach(file => {
        const origin = path.join(from, file);
        const destination = path.join(to, file);
        const data = fs.readFileSync(origin, 'utf-8');
        _recursiveMkDir(path.dirname(destination));
        fs.writeFileSync(destination, data);
        resolve();
      })
    })
  });
}

// Recursively create a dir.
function _recursiveMkDir(dir) {
  if (!fs.existsSync(dir)) {
    _recursiveMkDir(path.dirname(dir));
    fs.mkdirSync(dir);
  }
}

// Copy and update package.json file.
function _copyPackageJson(from, to) {
  return new Promise((resolve, reject) => {
    const origin = path.join(from, 'package.json');
    const destination = path.join(to, 'package.json');
    let data = JSON.parse(fs.readFileSync(origin, 'utf-8'));
    delete data.engines;
    delete data.scripts;
    delete data.devDependencies;
    fs.writeFileSync(destination, JSON.stringify(data, null, 2));
    resolve();
  });
}
