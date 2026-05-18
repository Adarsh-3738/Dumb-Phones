import http from 'http';
import fs from 'fs';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/admin/sales-report/pdf',
  method: 'GET',
};

const req = http.request(options, (res) => {
  const file = fs.createWriteStream('downloaded.pdf');
  res.pipe(file);
  file.on('finish', () => {
    console.log('PDF downloaded.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
