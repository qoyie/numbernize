type If<Cond extends boolean, Then, Else> = Cond extends true ? Then : Cond extends false ? Else : Then | Else;
type N = number | bigint;
type NumberReturn<T extends N> = T extends number ? number : T extends bigint ? bigint : never;

declare const define: ReturnType<typeof eval>

const numbernize = (function newInstance() {
	const GCD = <T extends N>(a: T, b: T): NumberReturn<T> => {
		let m = a as number;
		let n = b as number;
		while (m) {
			[m, n] = [n % m, m];
		}
		return n as never;
	};

	const copySign = <T extends N>(num: T, sign: T) => (num < 0 === sign < 0 ? num : -num) as T;

	const createReal = (isBigint: true) => {
		const toNumber = (isBigint ? BigInt : Number) as If<typeof isBigint, BigIntConstructor, NumberConstructor>;

		type N = typeof toNumber extends NumberConstructor ? number : typeof toNumber extends BigIntConstructor ? bigint : number | bigint;

		const zero = toNumber(0);
		const one = toNumber(1);

		const r = (num: N, den: N = one) => {
			const gcd = copySign(GCD(num, den), den);
			return new R(num / gcd, den / gcd);
		};

		class R {
			static zero: R;
			static one: R;

			static fromInteger(n: number | bigint | string) {
				return new R(toNumber(n), one);
			}

			static fromNumber(x0: number) {
				const eps = 1.0e-15;
				let x = +x0;
				let a = Math.floor(x);
				let h = a;
				let h1 = 1;
				let h2: number;
				let k = 1;
				let k1 = 0;
				let k2: number;

				while (x - a > eps * k * k) {
					x = 1 / (x - a);
					a = Math.floor(x);
					h2 = h1;
					h1 = h;
					k2 = k1;
					k1 = k;
					h = h2 + a * h1;
					k = k2 + a * k1;
				}

				return new R(toNumber(h), toNumber(k));
			}

			constructor(
				readonly num: N,
				readonly den: N,
			) { }

			add(other: R) {
				return this.den === other.den ? r(this.num + other.num, this.den) : r(this.num * other.den + other.num * this.den, this.den * other.den);
			}

			sub(other: R) {
				return this.den === other.den ? r(this.num - other.num, this.den) : r(this.num * other.den - other.num * this.den, this.den * other.den);
			}

			mul(other: R) {
				return r(this.num * other.num, this.den * other.den);
			}

			div(other: R) {
				return r(this.num * other.den, this.den * other.num);
			}

			isInteger() {
				return this.den === one;
			}

			toString() {
				return this.den === one ? `${this.num}` : `${this.num}/${this.den}`;
			}
		}

		R.zero = r(zero);
		R.one = r(one);

		return R;
	};

	let R = createReal(true);
	type R = InstanceType<typeof R>;
	let otherR = createReal(false as true);
	let isBigint = true;
	const setBigInt = (useBigint: boolean, doInitialize = true) => {
		if (isBigint !== useBigint) {
			isBigint = useBigint;
			[R, otherR] = [otherR, R];
			if (doInitialize && useBigint && num) {
				init(num);
			}
		}
	};
	let num = '';
	let Nums: Record<string, FilledExpr> = {};
	let numsReversed: number[] = [];

	class Expr {
		static positive: Expr;
		static negative: Expr;
		static pp: Expr;
		static pn: Expr;
		static np: Expr;
		static nn: Expr;
		static singlePolynomials: Expr[];
		static doublePolynomials: Expr[];
		static doubleMonomials: Expr[];

		readonly size: number;

		constructor(
			readonly flags: readonly boolean[],
			readonly children: readonly (Expr | null)[] = flags.map(() => null),
		) {
			this.size = children.reduce((a, c) => a + (c?.size ?? 1), 0);
		}

		calc(numbers: readonly R[], start = 0, flag = true) {
			let result = flag ? R.zero : R.one;
			for (let i = 0, s = 0; i < this.flags.length; i++) {
				const c = this.children[i];
				const sFlag = this.flags[i];
				let n: R;
				if (c == null) {
					n = numbers[start + s];
					s++;
				} else {
					n = c.calc(numbers, start + s, !flag);
					s += c.size;
				}
				if (flag) {
					result = sFlag ? result.add(n) : result.sub(n);
				} else {
					result = sFlag ? result.mul(n) : result.div(n);
				}
			}
			return result;
		}

		*expand(flag = true): Generator<Expr> {
			let i = 0;
			yield new Expr([...this.flags, true], [...this.children, null]);
			yield new Expr([...this.flags, false], [...this.children, null]);
			for (const c of this.children) {
				for (const nc of c?.expand(!flag) ?? (flag ? Expr.doubleMonomials : Expr.doublePolynomials)) {
					const children = [...this.children];
					children[i] = nc;
					yield new Expr(this.flags, children);
				}
				i++;
			}
		}

		add(other: Expr) {
			return new Expr([...this.flags, ...other.flags], [...this.children, ...other.children]);
		}

		sub(other: Expr) {
			return new Expr([...this.flags, ...other.flagsInv()], [...this.children, ...other.children]);
		}

		mul(other: Expr) {
			const left = this.flags.length === 1;
			const right = other.flags.length === 1;
			return new Expr([(left ? this.flags[0] : true) === (right ? other.flags[0] : true)], [new Expr([
				...left ? this.children[0]?.flags ?? [true] : [true],
				...right ? other.children[0]?.flags ?? [true] : [true],
			], [
				...left ? this.children[0]?.children ?? [null] : [this],
				...right ? other.children[0]?.children ?? [null] : [other],
			])]);
		}

		div(other: Expr) {
			const left = this.flags.length === 1;
			const right = other.flags.length === 1;
			return new Expr([(left ? this.flags[0] : true) === (right ? other.flags[0] : true)], [new Expr([
				...left ? this.children[0]?.flags ?? [true] : [true],
				...right ? other.children[0]?.flagsInv() ?? [false] : [false],
			], [
				...left ? this.children[0]?.children ?? [null] : [this],
				...right ? other.children[0]?.children ?? [null] : [other],
			])]);
		}

		neg() {
			return new Expr(this.flagsInv(), this.children);
		}

		private flagsInv() {
			return this.flags.map(flag => !flag);
		}

		toString(numbers: readonly unknown[] = [], start = 0, flag = true, paren = false) {
			let result = paren ? '(' : '';
			for (let i = 0, s = 0; i < this.flags.length; i++) {
				if (flag) {
					result += this.flags[i] ? (i === 0 ? '' : '+') : '-';
				} else if (i !== 0) {
					result += this.flags[i] ? '*' : '/';
				}
				const c = this.children[i];
				if (c == null) {
					result += numbers[start + s]?.toString() ?? '_';
					s++;
				} else {
					result += c.toString(numbers, start + s, !flag, !flag);
					s += c.size;
				}
			}
			if (paren) {
				result += ')';
			}
			return result;
		}
	}

	Expr.positive = new Expr([true]);
	Expr.negative = new Expr([false]);
	Expr.pp = new Expr([true, true]);
	Expr.pn = new Expr([true, false]);
	Expr.np = new Expr([false, true]);
	Expr.nn = new Expr([false, false]);
	Expr.singlePolynomials = [Expr.positive, Expr.negative];
	Expr.doublePolynomials = [Expr.pp, Expr.pn, Expr.np, Expr.nn];
	Expr.doubleMonomials = [Expr.pp, Expr.pn];

	class FilledExpr {
		constructor(
			readonly expr: Expr,
			readonly numbers: readonly (bigint | number | string)[],
		) { }

		add(other: FilledExpr) {
			return new FilledExpr(this.expr.add(other.expr), [...this.numbers, ...other.numbers]);
		}

		sub(other: FilledExpr) {
			return new FilledExpr(this.expr.sub(other.expr), [...this.numbers, ...other.numbers]);
		}

		mul(other: FilledExpr) {
			return new FilledExpr(this.expr.mul(other.expr), [...this.numbers, ...other.numbers]);
		}

		div(other: FilledExpr) {
			return new FilledExpr(this.expr.div(other.expr), [...this.numbers, ...other.numbers]);
		}

		neg() {
			return new FilledExpr(this.expr.neg(), this.numbers);
		}

		calc() {
			return this.expr.calc(this.numbers.map(R.fromInteger));
		}

		toString() {
			return this.expr.toString(this.numbers);
		}
	}

	function* splits(str: string, depth = 1): Generator<string[]> {
		if (depth === 0) {
			yield [str];
		} else {
			for (let i = 1; i < str.length; i++) {
				const first = str.slice(0, i);
				for (const rest of splits(str.slice(i), depth - 1)) {
					yield [first, ...rest];
				}
			}
		}
	}

	function tryCall<T>(func: () => T, def: T): T;
	function tryCall<T>(func: () => T, def?: T): T | undefined;
	function tryCall<T>(func: () => T, def?: T): T | undefined {
		try {
			return func();
		} catch (e) {
			return def;
		}
	}

	function init(base: number | string, useBigint?: boolean) {
		if (typeof base !== 'string') {
			init(`${base}`, useBigint);
			return;
		}
		if (useBigint != null) {
			setBigInt(useBigint, num !== base);
		}
		if (num === base) {
			return;
		}
		const nums: Record<string, [FilledExpr, number]> = {};
		let exprs = Expr.singlePolynomials;
		for (let i = 0; i < base.length; i++) {
			for (const baseString of splits(base, i)) {
				for (const expr of exprs) {
					const base = baseString.map(R.fromInteger);
					const result = tryCall(() => expr.calc(base));
					if (!result || !result.isInteger() || result.num < 0) {
						continue;
					}
					const numString = result.num.toString();
					const filledExpr = new FilledExpr(expr, baseString);
					const exprString = filledExpr.toString();
					const score = exprString.length * 2 + +(expr.flags.length !== 1);
					if (!(numString in nums) || score < nums[numString][1]) {
						nums[numString] = [filledExpr, score];
					}
				}
			}
			exprs = exprs.flatMap(expr => [...expr.expand()]);
		}
		if (!(0 in nums)) {
			nums[0] = [new FilledExpr(Expr.pn, [base, base]), 0];
		}
		num = base;
		Nums = Object.freeze(Object.fromEntries(Object.entries(nums).map(([key, value]) => [key, value[0]])));
		numsReversed = Object.keys(nums).map(x => +x).filter(x => x > 0).reverse();
	}

	const getMinDiv = (num: number) => numsReversed.find(n => n <= num) as number
	const demolish = (num: number | ''): FilledExpr => {
		if (typeof num !== 'number') return '' as never;
		if (!Number.isFinite(num) || Number.isNaN(num)) return `这么恶臭的${num}有必要论证吗` as never;
		if (num < 0) return demolish(-num).neg();
		if (!Number.isInteger(num)) {
			const r = R.fromNumber(num);
			return demolish(Number(r.num)).div(demolish(Number(r.den)));
		}
		if (num in Nums) return Nums[num];
		const div = getMinDiv(num);
		const quot = Math.floor(num / div);
		const mod = num % div;
		let result = demolish(div);
		if (quot !== 1) {
			result = result.mul(demolish(quot));
		}
		if (mod !== 0) {
			result = result.add(demolish(mod));
		}
		return result;
	};
	const numbernize = (num: number | '', base?: number | string, useBigint?: boolean) => {
		if (base != null) {
			init(base, useBigint);
		}
		return demolish(num).toString();
	};
	numbernize.init = init;
	numbernize.setBigInt = setBigInt;
	numbernize.getNum = () => num;
	numbernize.getNums = () => Nums;
	numbernize.newInstance = newInstance;
	return numbernize;
})();

export default numbernize;
