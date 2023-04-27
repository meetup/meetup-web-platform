import querystring from 'querystring';
import Boom from 'boom';
import rison from 'rison';
import { getCsrfHeaders } from 'mwp-test-utils/lib/mocks';
import start from 'mwp-app-server';
import * as apiProxyHandler from 'mwp-api-proxy/lib/handler';

const mockQuery = { type: 'foo', params: {}, ref: 'foo', endpoint: 'foo' };
const queries = rison.encode_array([mockQuery]);
const GET_RESPONSE = {
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
};
const GET_BODY = { foo: 'get' };
const POST_RESPONSE = {
	...GET_RESPONSE,
	request: {
		uri: {
			pathname: '/foo',
		},
		method: 'post',
	},
};
const POST_BODY = { foo: 'post' };
const PATCH_RESPONSE = {
	...POST_RESPONSE,
	request: {
		...POST_RESPONSE.request,
		method: 'patch',
	},
};
const PATCH_BODY = { foo: 'patch' };
const PUT_RESPONSE = {
	...POST_RESPONSE,
	request: {
		...POST_RESPONSE.request,
		method: 'put',
	},
};
const PUT_BODY = { foo: 'put' };
const DELETE_RESPONSE = {
	...POST_RESPONSE,
	request: {
		...POST_RESPONSE.request,
		method: 'patch',
	},
};
const DELETE_BODY = { foo: 'patch' };

/*
 * BEGIN 'GET' TESTS
 */
describe('API proxy GET endpoint integration tests', () => {
	it('calls the GET handler for /mu_api', () => {
		require('request').__setMockResponse(GET_RESPONSE, JSON.stringify(GET_BODY));
		jest.spyOn(apiProxyHandler, 'default').and.callFake((request, h) => 'okay');
		return start({}, {}).then(server => {
			const request = {
				method: 'get',
				url: `/mu_api?queries=${queries}`,
				auth: {
					credentials: {
						user: 'whatever',
					},
					strategy: 'bypass',
				},
			};
			return server
				.inject(request)
				.then(response => expect(apiProxyHandler.default).toHaveBeenCalled())
				.then(() => server.stop());
		});
	});
	it('returns a formatted array of responses from GET /mu_api', () => {
		require('request').__setMockResponse(GET_RESPONSE, JSON.stringify(GET_BODY));
		const expectedResponse = {
			responses: [
				{
					ref: 'foo',
					type: 'foo',
					value: GET_BODY,
					meta: {
						endpoint: 'foo',
						statusCode: 200,
					},
				},
			],
		};
		return start({}, {}).then(server => {
			const request = {
				method: 'get',
				url: `/mu_api?queries=${queries}`,
				auth: {
					credentials: {
						user: 'whatever',
					},
					strategy: 'bypass',
				},
			};
			return server
				.inject(request)
				.then(response =>
					expect(JSON.parse(response.payload)).toEqual(expectedResponse)
				)
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		});
	});
});

/*
 * BEGIN 'POST' TESTS
 */
const mockPostPayload = {
	queries,
};

const runMutationTest = ({ csrfHeaders, method, test, queries }) => server => {
	csrfHeaders = csrfHeaders || getCsrfHeaders;
	return csrfHeaders()
		.then(([headerToken, cookieToken]) => {
			const headers = {
				'x-mwp-csrf': headerToken,
				'content-type': 'application/x-www-form-urlencoded',
				cookie: `x-mwp-csrf=${cookieToken}`,
			};
			const request = {
				method,
				url: `/mu_api${queries ? `?queries=${queries}` : ''}`,
				payload: queries ? undefined : querystring.stringify(mockPostPayload),
				auth: {
					credentials: {
						user: 'whatever',
					},
					strategy: 'bypass',
				},
				headers,
			};
			return server.inject(request);
		})
		.then(test)
		.then(() => server.stop())
		.catch(err => {
			server.stop();
			throw err;
		});
};

describe('API proxy POST endpoint integration tests', () => {
	it('calls the POST handler for /mu_api', () => {
		require('request').__setMockResponse(
			POST_RESPONSE,
			JSON.stringify(POST_BODY)
		);
		jest.spyOn(apiProxyHandler, 'default').and.callFake((request, h) => 'okay');
		const test = response => expect(apiProxyHandler.default).toHaveBeenCalled();

		return start({}, {}).then(runMutationTest({ method: 'post', test }));
	});
	it('returns a formatted array of responses from POST /mu_api', () => {
		require('request').__setMockResponse(
			POST_RESPONSE,
			JSON.stringify(POST_BODY)
		);
		const expectedResponse = {
			responses: [
				{
					ref: mockQuery.ref,
					type: mockQuery.type,
					value: POST_BODY, // from the mocked `request` module
					meta: {
						endpoint: 'foo',
						statusCode: 200,
					},
				},
			],
		};
		const test = response =>
			expect(JSON.parse(response.payload)).toEqual(expectedResponse);

		return start({}, {}).then(runMutationTest({ method: 'post', test }));
	});
	it('return a an object with an error key when CSRF is invalid', () => {
		require('request').__setMockResponse(
			POST_RESPONSE,
			JSON.stringify(POST_BODY)
		);
		const expectedPayload = JSON.stringify(
			new Boom('INVALID_JWT', {
				statusCode: 400,
			}).output.payload
		);
		const test = response => expect(response.payload).toEqual(expectedPayload);
		const csrfHeaders = () =>
			getCsrfHeaders().then(([cookieToken, headerToken]) => [cookieToken, '']);

		return start({}, {}).then(
			runMutationTest({ method: 'post', test, csrfHeaders })
		);
	});
});

/*
 * BEGIN PATCH TEST
 */
describe('API proxy PATCH endpoint integration tests', () => {
	it('calls the PATCH handler for /mu_api', () => {
		require('request').__setMockResponse(
			PATCH_RESPONSE,
			JSON.stringify(PATCH_BODY)
		);
		jest.spyOn(apiProxyHandler, 'default').and.callFake((request, h) => 'okay');
		const test = response => expect(apiProxyHandler.default).toHaveBeenCalled();

		return start({}, {}).then(runMutationTest({ method: 'patch', test }));
	});
});

/*
 * BEGIN PUT TEST
 */
describe('API proxy PUT endpoint integration tests', () => {
	it('calls the PUT handler for /mu_api', () => {
		require('request').__setMockResponse(PUT_RESPONSE, JSON.stringify(PUT_BODY));
		jest.spyOn(apiProxyHandler, 'default').and.callFake((request, h) => 'okay');
		const test = response => expect(apiProxyHandler.default).toHaveBeenCalled();

		return start({}, {}).then(runMutationTest({ method: 'put', test }));
	});
});

/*
 * BEGIN DELETE TEST
 */
describe('API proxy DELETE endpoint integration tests', () => {
	it('calls the DELETE handler for /mu_api', () => {
		require('request').__setMockResponse(
			DELETE_RESPONSE,
			JSON.stringify(DELETE_BODY)
		);
		jest.spyOn(apiProxyHandler, 'default').and.callFake((request, h) => 'okay');
		const test = response => expect(apiProxyHandler.default).toHaveBeenCalled();

		return start({}, {}).then(
			runMutationTest({ method: 'delete', test, queries })
		);
	});
});
