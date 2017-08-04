import {
	ROOT_INDEX_CONTENT,
	FOO_INDEX_CONTENT,
	EXTERNAL_REDIRECT_URL,
	INTERNAL_REDIRECT_PATH,
} from '../mockApp';
import { getMockRenderRequestMap } from '../mocks';
import start from '../../src/server';
import { fooPathContent } from '../MockContainer';

// mock request just to ensure no external calls are made
// ** Use getMockFetch to mock an API endpoint response **
jest.mock('request', () =>
	jest.fn((requestOpts, cb) =>
		setTimeout(() => {
			cb(
				null,
				{
					headers: {},
					statusCode: 200,
					elapsedTime: 2,
					request: {
						uri: {
							query: 'foo=bar',
							pathname: '/foo',
						},
						method: 'get',
					},
				},
				JSON.stringify({ foo: 'value from api proxy' })
			);
		}, 2)
	)
);
const fakeApiProxyResponse = 'value from api proxy';

describe('Full dummy app render', () => {
	it('renders the expected app content for nested path of mock app route config', () => {
		return start(getMockRenderRequestMap(), {}).then(server => {
			const request = {
				method: 'get',
				url: '/foo/bar?heyhey=true',
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response => {
					expect(response.payload).toContain(fooPathContent);
					expect(response.payload).not.toContain(ROOT_INDEX_CONTENT);
					expect(response.payload).toContain(fakeApiProxyResponse);
					expect(
						response.headers['set-cookie'].find(h =>
							h.startsWith('x-csrf-jwt-header')
						)
					).not.toBeUndefined();
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		});
	});
	it('renders the expected root index route app content at `/`', () => {
		return start(getMockRenderRequestMap(), {}).then(server => {
			const request = {
				method: 'get',
				url: '/',
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response => {
					expect(response.payload).not.toContain(fooPathContent);
					expect(response.payload).toContain(ROOT_INDEX_CONTENT);
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		});
	});
	it('renders the expected child index route app content at `/foo`', () => {
		return start(getMockRenderRequestMap(), {}).then(server => {
			const request = {
				method: 'get',
				url: '/foo',
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response => {
					expect(response.payload).not.toContain(fooPathContent);
					expect(response.payload).toContain(FOO_INDEX_CONTENT);
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		});
	});
	it('calls request with url-encoded params', () => {
		return start(getMockRenderRequestMap(), {}).then(server => {
			const urlname = '驚くばかり';
			const encodedUrlname = encodeURI(urlname);
			const url = `/${urlname}`;
			const request = {
				method: 'get',
				url,
				credentials: 'whatever',
			};

			return server
				.inject(request)
				.then(response => {
					// request will be called twice - once for self, once for param1 route
					const { calls } = require('request').mock;
					expect(calls).toContainEqual(
						expect.arrayContaining([
							expect.objectContaining({
								url: expect.stringContaining(encodedUrlname),
							}),
						])
					);
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		});
	});
	it('redirects to internal route for <Redirect to={internalPath} />', () =>
		start(getMockRenderRequestMap(), {}).then(server => {
			const request = {
				method: 'get',
				url: '/redirect/internal',
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response => {
					expect(response.statusCode).toBe(302);
					expect(response.headers.location).toBe(INTERNAL_REDIRECT_PATH);
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		}));
	it('redirects to external route for <Redirect to={URL object} />', () =>
		start(getMockRenderRequestMap(), {}).then(server => {
			const request = {
				method: 'get',
				url: '/redirect/external',
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response => {
					expect(response.statusCode).toBe(302);
					expect(response.headers.location).toBe(EXTERNAL_REDIRECT_URL);
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		}));
	it('redirects permanently (301) to internal route for <Redirect to={internalPath} permanent />', () =>
		start(getMockRenderRequestMap(), {}).then(server => {
			const request = {
				method: 'get',
				url: '/redirect/internal/permanent',
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response => {
					expect(response.statusCode).toBe(301);
					expect(response.headers.location).toBe(INTERNAL_REDIRECT_PATH);
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		}));
	it('redirects permanently (301) to external route for <Redirect to={URL object} permanent />', () =>
		start(getMockRenderRequestMap(), {}).then(server => {
			const request = {
				method: 'get',
				url: '/redirect/external/permanent',
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response => {
					expect(response.statusCode).toBe(301);
					expect(response.headers.location).toBe(EXTERNAL_REDIRECT_URL);
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		}));
	it('returns 500 error for React rendering errors - developer error', () =>
		start(getMockRenderRequestMap(), {}).then(server => {
			const request = {
				method: 'get',
				url: '/badImplementation',
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response => expect(response.statusCode).toBe(500))
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		}));
});
