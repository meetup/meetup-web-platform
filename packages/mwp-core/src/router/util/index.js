// @flow
import type { RouterTo } from './types';
export * from './resolve';
export { decodeParams, getMatchedQueries } from './query';

export const testForExternal = (to: RouterTo): boolean => {
	if (to instanceof URL) {
		return true;
	}
	if (typeof to === 'string') {
		return to.startsWith('http');
	}
	return false; // not external - this must be a React Router 'location'
};
