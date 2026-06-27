const fs = require('fs');
const path = require('path');

fs.rmSync(path.resolve(__dirname, '..', 'build'), {
  recursive: true,
  force: true,
});
