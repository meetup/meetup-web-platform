import {
	createServerStore,
} from './createStore';

const MOCK_ROUTES = {};
const IDENTITY_REDUCER = state => state;
describe('createServerStore', () => {
	const mockRequest = {};
	it('creates a store with store functions', () => {
		const basicStore = createServerStore(mockRequest, MOCK_ROUTES, IDENTITY_REDUCER);
		expect(basicStore.getState).toEqual(jasmine.any(Function));
		expect(basicStore.dispatch).toEqual(jasmine.any(Function));
	});
	it('creates a store with supplied initialState', (done) => {
		const initialState = { foo: 'bar' };
		const basicStore = createServerStore(mockRequest, MOCK_ROUTES, IDENTITY_REDUCER, initialState);
		basicStore.subscribe(() => {
			const noRouterState = basicStore.getState();
			delete noRouterState.router;
			expect(basicStore.getState()).toEqual(initialState);
			done();
		});
		basicStore.dispatch({ type: 'dummy' });
	});
	it('applies custom middleware', () => {
		// To determine whether custom middleware is being applied, this test
		// simply spies on the middleware function to see if it's called during
		// store creation

		const spyable = {
			middleware: store => next => action => next(action)
		};
		spyOn(spyable, 'middleware').and.callThrough();
		createServerStore(
			mockRequest,
			MOCK_ROUTES,
			IDENTITY_REDUCER,
			null,  // initialState doesn't matter
			[spyable.middleware]
		);
		expect(spyable.middleware).toHaveBeenCalled();
	});

});
