// @flow
import React from 'react';
import { CookieProvider } from './Cookie';
import jsCookie from 'js-cookie';
import type { CookieOptions } from 'js-cookie';

const set = (name, value, options) => {
	const { path, domain, isSecure, ttl, isHttpOnly } = options;
	if (isHttpOnly) {
		// httpOnly cookies are only for server - cannot be handled on client
		return;
	}

	// set up cookie attributes argument for js-cookie
	// https://github.com/js-cookie/js-cookie/blob/master/README.md#cookie-attributes
	const jsCookieOpts: CookieOptions = {
		path,
		domain,
		secure: isSecure,
	};
	if (ttl) {
		// js-cookie treats integer `expires` as whole-day values, so we will
		// convert the millisecond `ttl` value to `Date`, which is supported
		// for arbitrary times.
		options.expires = new Date(new Date().getTime() + ttl);
	}

	jsCookie.set(name, value, jsCookieOpts);
};
export default props => (
	<CookieProvider get={jsCookie.get} set={set}>
		{props.children}
	</CookieProvider>
);
