// @flow weak
/**
 * The root level reducer for the app.
 * @module reducer
 **/

import { combineReducers } from 'redux';
import { api, app, API_RESP_COMPLETE } from '../api-state'; // mwp-api-state
import { routing } from '../router'; // mwp-router
import { reducer as clickTracking } from '../plugins/tracking/util/clickState'; // mwp-tracking/util/clickState

export function config(state = {}, action) {
	if (action.type === 'CONFIGURE') {
		return { ...state, ...action.payload };
	}
	return state;
}

/**
 * This reducer manages a list of boolean flags that indicate the 'ready to
 * render' state of the application. It is used exclusively by the server,
 * which triggers actions when initializing a response that should eventually
 * make all flags 'true'
 *
 * The server can then read these flags from state and render when ready
 */
export function preRenderChecklist([apiDataLoaded] = [false], action) {
	return [apiDataLoaded || action.type === API_RESP_COMPLETE];
}

const platformReducers = {
	api,
	app,
	clickTracking,
	config,
	preRenderChecklist,
	routing,
};

/**
 * A function that builds a reducer combining platform-standard reducers and
 * app-specific reducers
 */
export default function makeRootReducer(appReducers = {}) {
	Object.keys(appReducers).forEach(reducer => {
		if (reducer in platformReducers) {
			throw new Error(`'${reducer}' is a reserved platform reducer name`);
		}
	});
	return combineReducers({
		...platformReducers,
		...appReducers,
	});
}
