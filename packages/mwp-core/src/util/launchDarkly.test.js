import { getLaunchDarklyUser } from './launchDarkly';

describe('getLaunchDarklyUser', () => {
	const REQUEST_MOCK = {
		info: {},
		headers: {},
		query: {},
	};

	it('creates an anonymous user for an empty member object', () => {
		const user = getLaunchDarklyUser({}, REQUEST_MOCK);

		expect(user).toEqual({
			key: '0',
			anonymous: true,
			custom: {},
		});
	});

	it('creates an anonymous user for an anonymous member', () => {
		const member = {
			id: 0,
		};

		const user = getLaunchDarklyUser(member, REQUEST_MOCK);

		expect(user).toEqual({
			key: '0',
			anonymous: true,
			custom: {},
		});
	});

	it('populates a user with member details', () => {
		const member = {
			id: 12345,
			name: 'Test User',
			email: 'test@test.test',
			country: 'US',
		};

		const user = getLaunchDarklyUser(member, REQUEST_MOCK);

		expect(user).toEqual({
			key: '12345',
			name: 'Test User',
			email: 'test@test.test',
			country: 'US',
			anonymous: false,
			custom: {},
		});
	});

	it('sets an IP address if it was resolved from a request', () => {
		const request = {
			...REQUEST_MOCK,
			query: {
				__set_geoip: '89.22.50.79',
			},
		};

		const user = getLaunchDarklyUser({}, request);

		expect(user.ip).toBe('89.22.50.79');
	});

	describe('Custom attributes', () => {
		it('does not populate custom attributes if neither country nor region were resolved from a request', () => {
			const user = getLaunchDarklyUser({}, REQUEST_MOCK);

			expect(user.custom).toEqual({});
		});

		it('sets RequestCountry custom attribute to an uppercased request country', () => {
			const request = {
				...REQUEST_MOCK,
				headers: {
					'x-region': 'us/',
				},
			};

			const user = getLaunchDarklyUser({}, request);

			expect(user.custom).toEqual({
				RequestCountry: 'US',
			});
		});

		it('sets RequestRegion custom attribute to an uppercased request region', () => {
			const request = {
				...REQUEST_MOCK,
				headers: {
					'x-region': 'us/ut',
				},
			};

			const user = getLaunchDarklyUser({}, request);

			expect(user.custom).toEqual({
				RequestCountry: 'US',
				RequestRegion: 'UT',
			});
		});
	});
});
