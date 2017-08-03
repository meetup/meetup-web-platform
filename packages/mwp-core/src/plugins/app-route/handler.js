// @flow
import url from 'url';

/*
 * This is the Hapi route handler that will be applied to the React application
 * route (usually a wildcard handling all paths).
 *
 * It is primarily responsible for two things:
 * 1. Ensure that the current URL pathname matches the language specified by the
 *    request - redirect if not
 * 2. Render the application in the requested language
 *
 * It also calls the tracking plugin in order to handle session tracking.
 */
export default (languageRenderers: { [string]: LanguageRenderer$ }) => (
	request: HapiRequest,
	reply: HapiReply
) => {
	const pathname = request.getLangPrefixPath();
	if (pathname !== request.url.pathname) {
		return reply.redirect(url.format({ ...request.url, pathname }));
	}
	const requestLanguage = request.getLanguage();
	const renderRequest = languageRenderers[requestLanguage];

	renderRequest(request).subscribe(
		(renderResult: RenderResult) => {
			if (renderResult.redirect) {
				return reply
					.redirect(renderResult.redirect.url)
					.permanent(Boolean(renderResult.redirect.permanent));
			}
			request.trackSession();
			return reply(renderResult.result).code(renderResult.statusCode);
		},
		err => reply(err) // 500 error - will only be thrown on bad implementation
	);
};
