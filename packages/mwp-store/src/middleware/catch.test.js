import catchMiddleware from './catch';

describe('catchMiddleware', () => {
	it('logs an error when the `next` function throws an error', () => {
		spyOn(console, 'error');

		const theError = new Error('bad news');
		const errorThrower = () => {
			throw theError;
		};
		const receivedError = catchMiddleware(console.error)()(errorThrower)({});
		expect(console.error).toHaveBeenCalled();
		expect(receivedError).toBe(theError);
	});
	it('does nothing when the store operates normally (no errors)', () => {
		spyOn(console, 'error');

		const action = { foo: 'bar' };
		const next = x => x;
		const receivedError = catchMiddleware(console.error)()(next)(action);
		expect(console.error).not.toHaveBeenCalled();
		expect(receivedError).toBe(next(action));
	});
});
