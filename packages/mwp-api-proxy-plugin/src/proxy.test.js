import { getServer } from 'mwp-test-utils';
import { mockQuery, MOCK_RENDERPROPS } from 'meetup-web-mocks/lib/app';

import * as send from './util/send';
import * as receive from './util/receive';

import apiProxy from './proxy';

jest.mock('mwp-config', () => {
	const config = jest.requireActual('mwp-config');
	config.package = { agent: 'TEST_AGENT ' };
	return config;
});

const MOCK_HAPI_REQUEST = {
	auth: {
		credentials: { memberCookie: 'foo member', csrfToken: 'bar token' },
	},
	headers: {},
	query: {},
	method: 'get',
	state: {
		oauth_token: 'foo',
	},
	log: () => {},
	trackActivity: () => {},
	getLanguage: () => 'en-US',
};
let makeSendQuery;

xdescribe('apiProxy', () => {
	const queries = [mockQuery(MOCK_RENDERPROPS), mockQuery(MOCK_RENDERPROPS)];

	beforeEach(() => {
		makeSendQuery = jest
			.spyOn(send, 'makeSendQuery')
			.mockImplementation(() => Promise.resolve([{}, '']));
	});
	afterEach(() => {
		if (makeSendQuery) {
			makeSendQuery.mockRestore();
		}
	});
	it('returns an Promise that emits an array of results', async () => {
		const server = await getServer();
		const mockRequest = {
			...MOCK_HAPI_REQUEST,
			server,
		};
		const requestResult = {
			type: 'fake',
			value: { foo: 'bar' },
		};

		makeSendQuery = jest
			.spyOn(send, 'makeSendQuery')
			.mockImplementation(() => Promise.resolve([{}, '']));
		jest.spyOn(receive, 'makeReceiver').mockImplementation(query => response =>
			requestResult
		);
		const expectedResults = [requestResult, requestResult];
		return apiProxy(mockRequest)(queries).then(results =>
			expect(results).toEqual(expectedResults)
		);
	});

	const endpoint = 'foo';
	it('makes a GET request', async () => {
		const server = await getServer();
		const mockRequest = {
			...MOCK_HAPI_REQUEST,
			server,
			method: 'get',
		};
		const query = { ...mockQuery(MOCK_RENDERPROPS) };
		return apiProxy(mockRequest)([query])
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg.method).toBe('get'));
	});
	it('makes a POST request', async () => {
		const server = await getServer();
		const mockRequest = {
			...MOCK_HAPI_REQUEST,
			server,
			method: 'post',
		};
		const query = { ...mockQuery(MOCK_RENDERPROPS), meta: { method: 'post' } };
		return apiProxy(mockRequest)([query])
			.then(() => require('request').mock.calls.pop()[0])
			.then(arg => expect(arg.method).toBe('post'));
	});
	it('responds with query.mockResponse when set', async () => {
		const server = await getServer();
		const mockRequest = {
			...MOCK_HAPI_REQUEST,
			server,
			method: 'get',
		};
		const mockResponse = { foo: 'bar' };
		const query = { ...mockQuery(MOCK_RENDERPROPS), mockResponse };
		const expectedResponses = [
			{
				ref: query.ref,
				meta: {
					requestId: 'mock-request',
					endpoint,
					statusCode: 200,
				},
				type: query.type,
				value: mockResponse,
				error: undefined,
			},
		];
		return apiProxy(mockRequest)([query]).then(responses =>
			expect(responses).toEqual(expectedResponses)
		);
	});
});
