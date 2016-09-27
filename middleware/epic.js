import { combineEpics, createEpicMiddleware } from 'redux-observable';

import getSyncEpic from '../epics/sync';
import authEpic from '../epics/auth';

/**
 * The middleware is exported as a getter because it needs the application's
 * routes in order to set up the nav-related epic(s) that are part of the
 * final middleware
 */
const getEpicMiddleware = routes => createEpicMiddleware(
	combineEpics(
		getSyncEpic(routes),
		authEpic
	)
);

export default getEpicMiddleware;

