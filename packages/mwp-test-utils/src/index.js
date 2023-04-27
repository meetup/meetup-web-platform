import Hapi from 'hapi';
import Cookie from 'tough-cookie';

import { properties as serverConfig } from 'mwp-config/server';

export const MOCK_LOGGER = {
	debug: jest.fn(console.log),
	info: jest.fn(console.log),
	warn: jest.fn(console.log),
	error: jest.fn(console.log),
};

export const createFakeStore = fakeData => ({
	getState() {
		return fakeData;
	},
	dispatch() {},
	subscribe() {},
});

export const middlewareDispatcher = middleware => (storeData, action) => {
	let dispatched = null;
	const dispatch = middleware(createFakeStore(storeData))(
		actionAttempt => (dispatched = actionAttempt)
	);
	dispatch(action);
	return dispatched;
};

export const parseCookieHeader = cookieHeader => {
	const cookies =
		cookieHeader instanceof Array
			? cookieHeader.map(Cookie.parse)
			: [Cookie.parse(cookieHeader)];

	return cookies.reduce(
		(acc, cookie) => ({ ...acc, [cookie.key]: cookie.value }),
		{}
	);
};

export async function getServer() {
	const config = { ...serverConfig, supportedLangs: ['en-US'] };

	const server = Hapi.server({
		port: 0,
		app: config,
		debug: {
			request: ['error'],
		},
	});

	server.app = {
		logger: MOCK_LOGGER,
	};

	await server.decorate('request', 'trackActivity', () => ({}));
	await server.decorate('request', 'getLangPrefixPath', () => '/');
	await server.decorate('request', 'getLanguage', () => 'en-US');

	server.logger = () => MOCK_LOGGER;

	await server.ext('onPreHandler', (request, h) => {
		request.plugins.tracking = {};
		return h.continue;
	});

	return server;
}

const IDENTITY_REDUCER = state => state;
export function testCreateStore(createStoreFn) {
	it('creates a store with store functions', () => {
		const basicStore = createStoreFn(IDENTITY_REDUCER);
		expect(basicStore.getState).not.toBeNull();
		expect(basicStore.dispatch).not.toBeNull();
	});
	it('creates a store with supplied initialState', done => {
		const initialState = { foo: 'bar' };
		const basicStore = createStoreFn(IDENTITY_REDUCER, initialState);
		basicStore.subscribe(() => {
			expect(basicStore.getState()).toEqual(initialState);
			done();
		});
		basicStore.dispatch({ type: 'dummy' });
	});
}
