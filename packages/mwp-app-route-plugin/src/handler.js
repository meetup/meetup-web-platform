// @flow

/*
 * This is the Hapi route handler that will be applied to the React application
 * route (usually a wildcard handling all paths).
 *
 * It is primarily responsible for:
 *
 * 1. Ensuring that the current URL pathname matches the language specified by
 *    the request - redirect if not
 * 2. Render the application in the requested language
 * 3. Set 'Vary' header in order to cache based on device type in header.
 *    If 'X-UA-Device' is present, after caching, Fastly rewrites
 *    the Vary header to 'User-Agent', in order for the google bots
 *    to crawl mobile and desktop versions of the site
 */
export default (languageRenderers: { [string]: LanguageRenderer }): HapiHandler => (
	request: HapiRequest,
	h: HapiResponseToolkit
) => {
	const pathname = request.getLangPrefixPath();
	if (pathname !== request.url.pathname) {
		// redirect to a host relative path, keeping query params intact
		return h.redirect(`${pathname}${request.url.search}`);
	}
	const requestLanguage = request.getLanguage();
	const renderRequest = languageRenderers[requestLanguage];

	return renderRequest(request, h).then(
		(renderResult: RenderResult) => {
			if (renderResult.redirect) {
				return h
					.redirect(renderResult.redirect.url)
					.permanent(Boolean(renderResult.redirect.permanent));
			}
			return h
				.response(renderResult.result)
				.code(renderResult.statusCode)
				.header('vary', 'X-UA-Device'); // set by fastly
		},
		err => err // 500 error - will only be thrown on bad implementation
	);
};
