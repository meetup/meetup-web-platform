import { mockConfig } from '../mocks';
import start from '../../src/server';
import * as appRouteHandler from '../../src/plugins/app-route/handler';

jest.mock('../../src/plugins/tracking/util/avro'); // will spy on calls to this

describe('General server startup tests', () => {
	it('starts the server', () => {
		const fooRoute = {
			method: 'get',
			path: '/foo',
			handler: (request, reply) => reply('okay'),
		};
		const routes = [fooRoute];
		// spyOn(config, 'default').and.returnValue(Promise.resolve({}));
		return start({}, { routes }, mockConfig).then(returnedServer =>
			returnedServer.stop()
		);
	});
	it('calls the handler for an unauthenticated route', () => {
		const expectedResponse = 'okay';
		const fooRoute = {
			method: 'get',
			path: '/foo',
			config: {
				auth: false,
			},
			handler: (request, reply) => reply(expectedResponse),
		};
		const routes = [fooRoute];
		// spyOn(config, 'default').and.returnValue(Promise.resolve({}));
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
			handler: (request, reply) => reply(expectedResponse),
		};
		const routes = [fooRoute];
		// spyOn(config, 'default').and.returnValue(Promise.resolve({}));
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
			handler: (request, reply) => reply('okay'),
		};
		spyOn(spyable, 'handler').and.callThrough();
		spyOn(appRouteHandler, 'default').and.callFake(() => spyable.handler);
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
		const cookie = `click-track=${encodeURIComponent(
			JSON.stringify(clickData)
		)}`;
		const fooRoute = {
			method: 'get',
			path: '/ny-tech',
			handler: (request, reply) => reply('okay'),
		};
		const routes = [fooRoute];
		// spyOn(config, 'default').and.returnValue(Promise.resolve({}));
		return start({}, { routes }, mockConfig).then(server => {
			const avro = require('../../src/plugins/tracking/util/avro');
			avro.loggers.click.mockReturnValue('mocked clicktracking log');
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
					expect(avro.loggers.click).toHaveBeenCalledTimes(
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
