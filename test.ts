declare global {
	interface ErrorConstructor {
		new(message: string, options: { cause?: Error }): Error;
		new(message: string, fileName: string, lineNumber?: number): Error;
		(message: string, options: { cause?: Error }): Error;
		(message: string, fileName: string, lineNumber?: number): Error;
	}
}

import numbernize from './index.js';
console.log('Initializing...');
const start = performance.now();
numbernize.init(114514);
const end = performance.now();
console.log(`Initialized in ${end - start} ms.`);
for (let i = -10; i < 114514 * 20 + 10; i++) {
	const x = i / 10;
	const expr = numbernize(x);
	try {
		const y = new Function(`return ${expr};`)();
		if (0.01 < Math.abs(x - y)) {
			throw new Error(`${x} != ${y}: ${expr}`);
		}
	} catch (e) {
		if (e instanceof SyntaxError) {
			throw new Error(`${x}: ${expr}`, { cause: e });
		}
		throw e;
	}
}
console.log('Ok.');
