const path = require('path');

module.exports = {
  context: path.resolve(__dirname, 'lib'),
  entry: {
    main: './main.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public/js'),
  },
};
