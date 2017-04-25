import JSCookie from 'js-cookie';
import {
	mockQuery,
} from 'meetup-web-mocks/lib/app';
import {
	MOCK_GROUP,
} from 'meetup-web-mocks/lib/api';
import * as fetchUtils from './fetchUtils';

global.FormData = function() {};

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

describe('fetchQueries', () => {
	const API_URL = new URL('http://api.example.com/');
	const csrfJwt = `${fetchUtils.CSRF_HEADER_COOKIE} value`;
	const getQueries = [mockQuery({ params: {} })];
	const POSTQueries = [{ ...mockQuery({ params: {} }), meta: { method: 'POST' }}];
	const meta = { foo: 'bar', clickTracking: { history: [] } };
	const responses = [MOCK_GROUP];
	const fakeSuccess = () =>
		Promise.resolve({
			json: () => Promise.resolve(responses),
			headers: {
				get: key => ({
					'x-csrf-jwt': csrfJwt,
				}[key]),
			},
		});
	const fakeSuccessError = () =>
		Promise.resolve({
			json: () => Promise.resolve({ error: 'you lose', message: 'fakeSuccessError'}),
			headers: {
				get: key => ({
					'x-csrf-jwt': csrfJwt,
				}[key]),
			},
		});


	it('returns an object with queries and responses arrays', () => {
		spyOn(global, 'fetch').and.callFake(fakeSuccess);

		return fetchUtils.fetchQueries(API_URL.toString())(getQueries)
			.then(response => {
				expect(response.queries).toEqual(jasmine.any(Array));
				expect(response.responses).toEqual(jasmine.any(Array));
			});
	});
	it('returns a promise that will reject when response contains error prop', () => {
		spyOn(global, 'fetch').and.callFake(fakeSuccessError);

		return fetchUtils.fetchQueries(API_URL.toString())(getQueries)
			.then(
				response => expect(true).toBe(false),
				err => expect(err).toEqual(jasmine.any(Error))
			);
	});
	it('calls fetch with method supplied by query', () => {
		spyOn(global, 'fetch').and.callFake(fakeSuccess);
		const query = mockQuery({ params: {} });
		const queries = [query];

		const methodTest = method => () => {
			query.meta = { method };
			return fetchUtils.fetchQueries(API_URL.toString())(queries)
				.then(response => {
					const [, config] = global.fetch.calls.mostRecent().args;
					expect(config.method).toEqual(method);
				});
		};
		return methodTest('POST')()
			.then(methodTest('PATCH'))
			.then(methodTest('DELETE'));
	});
	describe('GET', () => {
		it('GET calls fetch with API url and queries, metadata, logout querystring params', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils
				.fetchQueries(API_URL.toString())(getQueries, { ...meta, logout: true })
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					expect(url.origin).toBe(API_URL.origin);
					expect(url.searchParams.has('queries')).toBe(true);
					expect(url.searchParams.has('metadata')).toBe(true);
					expect(url.searchParams.has('logout')).toBe(true);
					expect(calledWith[1].method).toEqual('GET');
				});
		});

		it('GET calls js-cookie "set" with click-track', () => {
			const clickTracking = {
				history: [{ bar: 'foo' }],
			};
			spyOn(global, 'fetch').and.callFake(fakeSuccess);
			JSCookie.set.mockClear();

			return fetchUtils
				.fetchQueries(API_URL.toString())(getQueries, { ...meta, clickTracking, logout: true })
				.then(() => {
					const calledWith = JSCookie.set.mock.calls[0];
					expect(calledWith[0])
						.toEqual('click-track');
				});
		});

		it('GET without meta calls fetch without metadata querystring params', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils
				.fetchQueries(API_URL.toString())(getQueries)
				.then(() => {
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
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils
				.fetchQueries(API_URL.toString())(POSTQueries, meta)
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					const options = calledWith[1];
					expect(url.toString()).toBe(API_URL.toString());
					expect(options.method).toEqual('POST');
					// build a dummy url to hold the url-encoded body as searchstring
					const dummyUrl = new URL(`http://example.com?${options.body}`);
					expect(dummyUrl.searchParams.has('queries')).toBe(true);
					expect(dummyUrl.searchParams.has('metadata')).toBe(true);
					expect(options.headers['x-csrf-jwt']).toEqual(csrfJwt);
				});
		});
		it('POST without meta calls fetch without metadata body params', () => {
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(API_URL.toString())(POSTQueries)
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					const options = calledWith[1];
					expect(url.toString()).toBe(API_URL.toString());
					expect(options.method).toEqual('POST');
					const dummyUrl = new URL(`http://example.com?${options.body}`);
					expect(dummyUrl.searchParams.has('queries')).toBe(true);
					expect(dummyUrl.searchParams.has('metadata')).toBe(false);
					expect(options.headers['x-csrf-jwt']).toEqual(csrfJwt);
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
			const formQueries = [{ ...mockQuery({ params: new FormData() }), meta: { method: 'POST' }}];
			spyOn(global, 'fetch').and.callFake(fakeSuccess);

			return fetchUtils.fetchQueries(API_URL.toString())(formQueries)
				.then(() => {
					const calledWith = global.fetch.calls.mostRecent().args;
					const url = new URL(calledWith[0]);
					const options = calledWith[1];
					expect(options.method).toEqual('POST');
					expect(url.searchParams.has('queries')).toBe(true);
					expect(url.searchParams.has('metadata')).toBe(false);
					expect(options.headers['x-csrf-jwt']).toEqual(csrfJwt);
				});
		});

	});
});

describe('tryJSON', () => {
	const reqUrl = 'http://example.com';
	const goodResponse = { foo: 'bar' };
	const goodFetchResponse = {
		text: () => Promise.resolve(JSON.stringify(goodResponse)),
	};
	const errorResponse = {
		status: 400,
		statusText: '400 Bad Request',
		text: () => Promise.resolve('There was a problem'),
	};
	const badJSON = 'totally not JSON';
	const badJSONResponse = {
		text: () => Promise.resolve(badJSON),
	};
	it('returns a Promise that resolves to the parsed fetch response JSON', () => {
		const theFetch = fetchUtils.tryJSON(reqUrl)(goodFetchResponse);
		expect(theFetch).toEqual(jasmine.any(Promise));

		return theFetch.then(response => expect(response).toEqual(goodResponse));
	});
	it('returns a rejected Promise with Error when response has 400+ status', () => {
		const theFetch = fetchUtils.tryJSON(reqUrl)(errorResponse);
		expect(theFetch).toEqual(jasmine.any(Promise));
		return theFetch.then(
			response => expect(true).toBe(false),  // should not run - promise should be rejected
			err => expect(err).toEqual(jasmine.any(Error))
		);
	});
	it('returns a rejected Promise with Error when response fails JSON parsing', () => {
		const theFetch = fetchUtils.tryJSON(reqUrl)(badJSONResponse);
		expect(theFetch).toEqual(jasmine.any(Promise));
		return theFetch.then(
			response => expect(true).toBe(false),  // should not run - promise should be rejected
			err => expect(err).toEqual(jasmine.any(Error))
		);
	});
});

