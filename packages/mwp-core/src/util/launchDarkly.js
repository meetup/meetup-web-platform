// @flow

import { getRemoteIp, getRemoteGeoLocation } from './requestUtils';

/**
 * Populates a LaunchDarklyUser object with member and request properties.
 *
 * @param member  a member state object
 * @param request a request object
 */
export const getLaunchDarklyUser = (
	member: Object,
	request: HapiRequest
): LaunchDarklyUser => {
	const { id, name, email, country } = member;

	const ip = getRemoteIp(request);
	const key = (id && id.toString()) || '0';
	const anonymous = key === '0';
	const custom = getCustomAttributes(request);

	const user: LaunchDarklyUser = {
		key,
		anonymous,
		custom,
	};

	if (ip) {
		user.ip = ip;
	}
	if (name) {
		user.name = name;
	}
	if (email) {
		user.email = email;
	}
	if (country) {
		user.country = country;
	}

	return user;
};

// Builds LaunchDarklyUser custom attributes. Custom attributes can contain arbitrary values
// and can be used for targeting. Read more at https://docs.launchdarkly.com/docs/node-sdk-reference#section-users.
const getCustomAttributes = (
	request: HapiRequest
): LaunchDarklyUser$CustomAttributes => {
	const geoLocation = getRemoteGeoLocation(request);

	const custom: LaunchDarklyUser$CustomAttributes = {};

	if (geoLocation.country) {
		custom.RequestCountry = geoLocation.country.toUpperCase();
	}
	if (geoLocation.region) {
		custom.RequestRegion = geoLocation.region.toUpperCase();
	}

	return custom;
};
