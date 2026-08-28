const fs = require('fs');
const path = require('path');

const cmakeFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-screens',
  'android',
  'CMakeLists.txt',
);
const target = '    fbjni::fbjni\n    android';
const replacement = '    fbjni::fbjni\n    c++_shared\n    android';

if (!fs.existsSync(cmakeFile)) {
  process.exit(0);
}

const contents = fs.readFileSync(cmakeFile, 'utf8');
if (contents.includes('    c++_shared\n')) {
  process.exit(0);
}
if (!contents.includes(target)) {
  throw new Error('Unable to apply the react-native-screens C++ runtime linker fix.');
}

fs.writeFileSync(cmakeFile, contents.replace(target, replacement));
