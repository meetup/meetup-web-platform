import { mockConfig } from 'mwp-test-utils';
import start from 'mwp-app-server';
import * as appRouteHandler from 'mwp-app-route/lib/handler';

jest.mock('mwp-tracking-plugin/lib/util/avro'); // will spy on calls to this

describe('General server startup tests', () => {
	it('starts the server', () => {
		const fooRoute = {
			method: 'get',
			path: '/foo',
			handler: (request, h) => 'okay',
		};
		const routes = [fooRoute];
		// jest.spyOn(config, 'default').and.returnValue(Promise.resolve({}));
		return start({}, { routes }, mockConfig).then(returnedServer =>
			returnedServer.stop()
		);
	});
	it('calls the handler for an unauthenticated route', () => {
		const expectedResponse = 'okay';
		const fooRoute = {
			method: 'get',
			path: '/foo',
			options: {
				auth: false,
			},
			handler: (request, h) => expectedResponse,
		};
		const routes = [fooRoute];
		// jest.spyOn(config, 'default').and.returnValue(Promise.resolve({}));
		return start({}, { routes }, mockConfig).then(server => {
			const requestFooRoute = {
				method: 'get',
				url: '/foo',
			};
			return server
				.inject(requestFooRoute)
				.then(response => expect(response.payload).toEqual(expectedResponse))
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		});
	});
	it('calls the handler for an authenticated route', () => {
		const expectedResponse = 'okay';
		const fooRoute = {
			method: 'get',
			path: '/foo',
			handler: (request, h) => expectedResponse,
		};
		const routes = [fooRoute];
		// jest.spyOn(config, 'default').and.returnValue(Promise.resolve({}));
		return start({}, { routes }, mockConfig).then(server => {
			const authedRequestFooRoute = {
				method: 'get',
				url: '/foo',
				credentials: 'whatever',
			};
			return server
				.inject(authedRequestFooRoute)
				.then(response => expect(response.payload).toEqual(expectedResponse))
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		});
	});
	it('calls the handler for /{*wild}', () => {
		const spyable = {
			handler: (request, h) => 'okay',
		};
		jest.spyOn(spyable, 'handler').and.callThrough();
		jest.spyOn(appRouteHandler, 'default').and.callFake(() => spyable.handler);
		return start({}, {}, mockConfig).then(server => {
			const request = {
				method: 'get',
				url: '/ny-tech',
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response => expect(spyable.handler).toHaveBeenCalled())
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		});
	});
});

describe('Cookie setting', () => {
	const click = {
		lineage: 'div#foo',
		linkText: 'hello world',
		coords: [23, 45],
	};
	const clickData = {
		history: [click, { ...click }],
	};
	it('calls loggers.click for each click and un-sets the click-track cookie', () => {
		const cookie = `click-track=${encodeURIComponent(JSON.stringify(clickData))}`;
		const fooRoute = {
			method: 'get',
			path: '/ny-tech',
			handler: (request, h) => 'okay',
		};
		const routes = [fooRoute];
		// jest.spyOn(config, 'default').and.returnValue(Promise.resolve({}));
		return start({}, { routes }, mockConfig).then(server => {
			const avro = require('mwp-tracking-plugin/lib/util/avro');
			avro.loggers.awsclick.mockReturnValue('mocked clicktracking log');
			const request = {
				method: 'get',
				url: '/ny-tech',
				credentials: 'whatever',
				headers: { cookie },
			};
			return server
				.inject(request)
				.then(response => {
					const cookieUnsetString = 'click-track=;';
					expect(avro.loggers.awsclick).toHaveBeenCalledTimes(
						clickData.history.length
					);
					expect(response.headers['set-cookie']).toContainEqual(
						expect.stringContaining(cookieUnsetString)
					);
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		});
	});
});
