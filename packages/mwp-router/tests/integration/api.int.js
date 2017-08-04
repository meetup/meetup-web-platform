import querystring from 'querystring';
import Boom from 'boom';
import rison from 'rison';
import { getCsrfHeaders } from '../mocks';
import start from '../../src/server';
import * as apiProxyHandler from '../../src/plugins/api-proxy/handler';

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
		require('request').__setMockResponse(
			GET_RESPONSE,
			JSON.stringify(GET_BODY)
		);
		spyOn(apiProxyHandler, 'default').and.callFake((request, reply) => {
			reply('okay');
		});
		return start({}, {}).then(server => {
			const request = {
				method: 'get',
				url: `/mu_api?queries=${queries}`,
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(response => expect(apiProxyHandler.default).toHaveBeenCalled())
				.then(() => server.stop());
		});
	});
	it('returns a formatted array of responses from GET /mu_api', () => {
		require('request').__setMockResponse(
			GET_RESPONSE,
			JSON.stringify(GET_BODY)
		);
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
				credentials: 'whatever',
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
				'x-csrf-jwt': headerToken,
				'content-type': 'application/x-www-form-urlencoded',
				cookie: `x-csrf-jwt=${cookieToken}`,
			};
			const request = {
				method,
				url: `/mu_api${queries ? `?queries=${queries}` : ''}`,
				payload: queries ? undefined : querystring.stringify(mockPostPayload),
				credentials: 'whatever',
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
		spyOn(apiProxyHandler, 'default').and.callFake((request, reply) => {
			reply('okay');
		});
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
			Boom.create(400, 'INVALID_JWT').output.payload
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
		spyOn(apiProxyHandler, 'default').and.callFake((request, reply) => {
			reply('okay');
		});
		const test = response => expect(apiProxyHandler.default).toHaveBeenCalled();

		return start({}, {}).then(runMutationTest({ method: 'patch', test }));
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
		spyOn(apiProxyHandler, 'default').and.callFake((request, reply) => {
			reply('okay');
		});
		const test = response => expect(apiProxyHandler.default).toHaveBeenCalled();

		return start({}, {}).then(
			runMutationTest({ method: 'delete', test, queries })
		);
	});
});
