const qrcode = require('qrcode-terminal');

const url = 'exp://192.168.1.3:8081';
console.log('\n📱 SCAN THIS QR CODE:\n');
qrcode.generate(url, { small: true });
console.log('\n📱 Or use this URL manually:');
console.log(url);
console.log('');
