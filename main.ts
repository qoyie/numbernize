import readline from 'node:readline';
import numbernize from './index.js';
process.stdout.write('Initializing...\r');
const start = performance.now();
numbernize.init(process.argv[2]);
const end = performance.now();
console.log(`Initialized in ${end - start} ms.`);
process.stdout.write('> ');
readline.createInterface({ input: process.stdin }).on('line', line => {
	console.log(numbernize(+line));
	process.stdout.write('> ');
});
