export async function describe(message: string, fn: () => Promise<void>) {
	console.log(message);
	await fn();
}
export async function it(message: string, fn: () => Promise<void>) {
	try {
        await fn();
        console.log(`\r\x1b[32m✔ ${message}\x1b[0m`);
    } catch (error) {
        console.log(`\r\x1b[31m✖ ${message}\x1b[0m`);
		throw error;
    }
}
export function expect(value: any) {
	return {
		toBe: (expectedValue: any) => {
			if (value !== expectedValue) {
				throw new Error(`Expected ${value} to be ${expectedValue}`);
			}
		},
		toEqual: (expectedValue: any) => {
			if (JSON.stringify(value) !== JSON.stringify(expectedValue)) {
				throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expectedValue)}`);
			}
		},
		any: (type) => {
			if (type === value) {
				throw new Error(`Expected ${value} to be of type ${type}`);
			}
		}
	};
}

export async function beforeEach(fn: () => Promise<void>) {
	await fn();
}

export async function afterEach(fn: () => Promise<void>) {
	await fn();
}
