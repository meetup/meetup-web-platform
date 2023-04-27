import url from 'url';
import { mockQuery } from 'meetup-web-mocks/lib/app';
import { MOCK_GROUP } from 'meetup-web-mocks/lib/api';
import * as clickState from 'mwp-tracking-plugin/lib/util/clickState';

import fetchQueries from './fetchQueries';

const { URLSearchParams } = url;
clickState.setClickCookie = jest.fn();

global.FormData = function() {};
global.URLSearchParams = URLSearchParams;
global.window = { location: { search: '' } };

jest.mock('js-cookie', () => {
	const get = jest.fn(name => `${name} value`);
	const set = jest.fn((name, value) => `${name} set to ${value}`);
	return {
		get,
		set,
		withConverter: jest.fn(() => ({
			get,
			set,
		})),
	};
});

xdescribe('fetchQueries', () => {
	const API_URL = new URL('http://api.example.com/');
	const csrfJwt = 'x-mwp-csrf_dev-header value';
	const getQueries = [mockQuery({ params: {} })];
	const POSTQueries = [{ ...mockQuery({ params: {} }), meta: { method: 'POST' } }];
	const meta = { foo: 'bar', clickTracking: { history: [] } };
	const responses = [MOCK_GROUP];
	const fakeRes = {
		json: () => Promise.resolve({ responses }),
		headers: {
			get: key =>
				({
					'x-mwp-csrf_dev-header': csrfJwt,
				}[key]),
		},
	};
	const fakeSuccess = () => Promise.resolve(fakeRes);
	const fakeSuccessError = () =>
		Promise.resolve({
			json: () =>
				Promise.resolve({ error: 'you lose', message: 'fakeSuccessError' }),
			headers: {
				get: key =>
					({
						'x-mwp-csrf_dev-': csrfJwt,
					}[key]),
			},
		});

	it('returns an object with successes and errors arrays', () => {
		jest.spyOn(global, 'fetch').mockResolvedValue(fakeSuccess());

		return fetchQueries(API_URL.toString())(getQueries).then(response => {
			expect(response.successes).toEqual([
				{ query: getQueries[0], response: responses[0] },
			]);
			expect(response.errors).toEqual([]);
		});
	});
	it('returns a promise that will reject when response contains error prop', () => {
		jest.spyOn(global, 'fetch').and.callFake(fakeSuccessError);

		return fetchQueries(API_URL.toString())(getQueries).then(
			response => expect(true).toBe(false),
			err => expect(err).not.toBeNull()
		);
	});
	it('calls fetch with method supplied by query', () => {
		jest.spyOn(global, 'fetch').mockResolvedValue(fakeRes);
		const query = mockQuery({ params: {} });
		const queries = [query];

		const methodTest = method => () => {
			query.meta = { method };
			return fetchQueries(API_URL.toString())(queries).then(response => {
				const [, config] = global.fetch.calls.mostRecent().args;
				expect(config.method).toEqual(method);
			});
		};
		return methodTest('POST')()
			.then(methodTest('PATCH'))
			.then(methodTest('PUT'))
			.then(methodTest('DELETE'));
	});
	describe('GET', () => {
		it('GET calls fetch with API url and queries, metadata', () => {
			jest.spyOn(global, 'fetch').mockResolvedValue(fakeRes);

			return fetchQueries(API_URL.toString())(getQueries, {
				...meta,
			}).then(() => {
				const calledWith = global.fetch.calls.mostRecent().args;
				const url = new URL(calledWith[0]);
				expect(url.origin).toBe(API_URL.origin);
				expect(url.searchParams.has('queries')).toBe(true);
				expect(url.searchParams.has('metadata')).toBe(true);
				expect(calledWith[1].method).toEqual('GET');
			});
		});

		it('passes along __set_geoip querystring param', () => {
			jest.spyOn(global, 'fetch').mockResolvedValue(fakeRes);
			const _window = global.window;
			global.window = { location: { search: '?__set_geoip=1234' } };

			return fetchQueries(API_URL.toString())(getQueries, {
				...meta,
			}).then(() => {
				const calledWith = global.fetch.calls.mostRecent().args;
				const url = new URL(calledWith[0]);
				expect(url.searchParams.has('__set_geoip')).toBe(true);
				global.window = _window;
			});
		});

		it('GET without meta calls fetch without metadata querystring params', () => {
			jest.spyOn(global, 'fetch').mockResolvedValue(fakeRes);

			return fetchQueries(API_URL.toString())(getQueries).then(() => {
				const calledWith = global.fetch.calls.mostRecent().args;
				const url = new URL(calledWith[0]);
				expect(url.origin).toBe(API_URL.origin);
				expect(url.searchParams.has('queries')).toBe(true);
				expect(url.searchParams.has('metadata')).toBe(false);
				expect(calledWith[1].method).toEqual('GET');
			});
		});
	});
	describe('POST', () => {
		it('POST calls fetch with API url; csrf header; queries and metadata body params', () => {
			jest.spyOn(global, 'fetch').mockResolvedValue(fakeRes);

			return fetchQueries(API_URL.toString())(POSTQueries, meta).then(() => {
				const calledWith = global.fetch.calls.mostRecent().args;
				const url = new URL(calledWith[0]);
				const options = calledWith[1];
				expect(url.toString()).toBe(API_URL.toString());
				expect(options.method).toEqual('POST');
				// build a dummy url to hold the url-encoded body as searchstring
				const dummyUrl = new URL(`http://example.com?${options.body}`);
				expect(dummyUrl.searchParams.has('queries')).toBe(true);
				expect(dummyUrl.searchParams.has('metadata')).toBe(true);
				expect(options.headers['x-mwp-csrf_dev']).toEqual(csrfJwt);
			});
		});
		it('POST without meta calls fetch without metadata body params', () => {
			jest.spyOn(global, 'fetch').mockResolvedValue(fakeRes);

			return fetchQueries(API_URL.toString())(POSTQueries).then(() => {
				const calledWith = global.fetch.calls.mostRecent().args;
				const url = new URL(calledWith[0]);
				const options = calledWith[1];
				expect(url.toString()).toBe(API_URL.toString());
				expect(options.method).toEqual('POST');
				const dummyUrl = new URL(`http://example.com?${options.body}`);
				expect(dummyUrl.searchParams.has('queries')).toBe(true);
				expect(dummyUrl.searchParams.has('metadata')).toBe(false);
				expect(options.headers['x-mwp-csrf_dev']).toEqual(csrfJwt);
			});
		});
	});
	describe('form data', () => {
		it('sends form data as multipart/form-data', () => {
			global.FormData = class FormData {
				append() {}
				has() {
					return true;
				}
			};
			FormData.prototype.append = jest.fn();
			const formQueries = [
				{
					...mockQuery({ params: new FormData() }),
					meta: { method: 'POST' },
				},
			];
			jest.spyOn(global, 'fetch').mockResolvedValue(fakeRes);

			return fetchQueries(API_URL.toString())(formQueries).then(() => {
				const calledWith = global.fetch.calls.mostRecent().args;
				const url = new URL(calledWith[0]);
				const options = calledWith[1];
				expect(options.method).toEqual('POST');
				expect(url.searchParams.has('queries')).toBe(true);
				expect(url.searchParams.has('metadata')).toBe(false);
				expect(options.headers['x-mwp-csrf_dev']).toEqual(csrfJwt);
			});
		});
	});
});
