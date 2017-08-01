import JSCookie from 'js-cookie';

export const COOKIE_NAME = 'click-track'; // must remain in sync with Meetup Classic implementation

const BrowserCookies = JSCookie.withConverter({
	read: (value, name) => value,
	write: (value, name) =>
		encodeURIComponent(value).replace(
			/[!'()*]/g,
			c => `%${c.charCodeAt(0).toString(16)}`
		),
});

export const setClickCookie = clickTracking => {
	const domain = window.location.host.replace(/[^.]+/, ''); // strip leading subdomain, e.g. www or beta2
	const cookieVal = JSON.stringify(clickTracking);
	BrowserCookies.set(COOKIE_NAME, cookieVal, { domain });
};

export const CLICK_TRACK_ACTION = 'CLICK_TRACK';
export const CLICK_TRACK_CLEAR_ACTION = 'CLICK_TRACK_CLEAR';

export const actions = {
	click: clickData => ({
		type: CLICK_TRACK_ACTION,
		payload: clickData,
	}),
	clear: () => ({ type: CLICK_TRACK_CLEAR_ACTION }),
};

export const DEFAULT_CLICK_TRACK = { history: [] };
/**
 * @param {Object} data extensible object to store click data {
 *   history: array
 * }
 * @param {Object} action the dispatched action
 * @return {Object} new state
 */
export function reducer(state = DEFAULT_CLICK_TRACK, action) {
	if (action.type === CLICK_TRACK_ACTION) {
		const history = [...state.history, action.payload];
		return {
			...state,
			history,
		};
	}
	if (action.type === CLICK_TRACK_CLEAR_ACTION) {
		return DEFAULT_CLICK_TRACK;
	}
	return state;
}
