## [26.1]

-   **Improved** add github action

photo-uploader.
## [26.0]

-   **Removed** `PHOTO_SCALAR_SALT` no longer required for the new photo-uploader.

## [25.2]

-   **Improved** upgraded node to v10.22.1

## [25.1]

-   **Improved** add `SameSite` policy to click-track cookie

## [25.0]

-   **Removed** Retire `mwp-csp-plugin`. All common security headers have been consolidated in Fastly.

## [24.0]

-   **Removed** Retire newrelic integration

## [23.0]

-   **Removed** Retire signalsciences integration

## [22.4]

-   **New feature** `state.config.geo`, which contains geolocation info provided
    in `requestUtils.getRemoteGeoLocation`. Also added ability to read two new
    geolocation headers, if they exist in the request:

    -   `x-geo-city` - plain city name string, e.g. provided by
        [`client.geo.city`](https://docs.fastly.com/vcl/variables/client-geo-city/)
        in Fastly
    -   `x-geo-latlon` - comma-separated lat/lon

    These headers will be custom-set in our www Fastly config

    `state.config.geo` is currenty a `GeoLocation` object, with a flow type
    [defined in flow-typed/platform/js](https://github.com/meetup/meetup-web-platform/blob/167933580_geo-state/flow-typed/platform.js#L149-L154)

## [22.3]

-   **New feature** `mwp-config` now exports a `packages.mupwebPackages` path Regex pointing
    to the `/packages/<package-name>/lib` directory in monorepo consumers (e.g. mup-web)

## [22.2]

-   **New feature** The Google Tag Manager util now targets specific GTM Environments
    based on the running environment (eg: prod, dev). Environments can also be
    manually chosen by passing parameters to the GTM util.

## [22.1]

-   **New feature** `mwp-config` now exports a `paths.localPackages` path pointing
    to the `/packages` directory in monorepo consumers (e.g. mup-web)

## [22.0]

-   **Breaking change** `mwp-config` now specifies babel-loader rules for Babel 7
    instead of Babel 6. Downstream consumers should work with the Web Platform
    team to make the update

## [21.3]

-   **Refactor** Upgraded MWP build to Babel7 and corresponding plugins. All
    built packages are now the same size or slightly smaller, but there is some
    risk that the assets will no longer work in some older browsers, so
    consumer beware - you should upgrade MWP packages independently of other
    code changes so that it is easier to isolate problems and revert.

## [21.2]

-   **New Feature** `AppContext` context provider for server-side request data.
    This feature supersedes accessing `state.config` through Redux in favor
    of a more conventional React context implementation. Check out
    [the docs](https://github.com/meetup/meetup-web-platform/blob/main/packages/mwp-app-render/README.md#server-config-values-appcontext)
    for more info.

    `withIntl` has been refactored to use this interface instead of `react-redux`
    `connect` in order to avoid issues with the pure rendering constraints of
    `connect`

## [21.1]

-   **New Feature** the query `endpoint` property can now be a fully-qualified URL
    in order to call APIs on domains other than https://api.meetup.com

## [21.0]

-   **BREAKING CHANGE** - `mwp-toaster`: `<ToastContainer>` now takes an object with system messages mappings instead
    of a message key and an array of messages.

## [20.1]

-   **New Feature** activity tracking support for `standardized_url` and
    `standardized_referer` (new fields in Activity v9).
    -   API proxy endpoint (`mwp-api-proxy-plugin`) reads from url-encoded `x-meetup-activity` header
    -   API proxy method (`mwp-api-proxy-plugin`) takes `activityInfo` argument to inject fields into
        activity records
    -   `mwp-store` browser `fetchQueries` sends `x-meetup-activity` header
    -   `mwp-store` server `fetchQueries` passes `activityInfo` to
    -   `mwp-api-store` supplies `activityInfo` argument to `fetchQueries`

## [20.0]

-   **BREAKING CHANGE** - `makeRenderer$` interface into server renderer removed -
    must use object-based `makeRenderer`
-   **Refactor** `mwp-api-proxy-plugin` now provides `request.apiProxy` interface,
    which uses native Promises instead of Observables.

    `rxjs` is no longer a peer dependency of any MWP packages.

## [19.0]

-   **Removed** `state.app` reducers. Consumers must convert to using `state.api`.

## [18.2]

-   **Refactor** `mwp-app-route-plugin` defines a `LaunchDarklyUser` type for a LaunchDarkly user object
    based on the official [documentation](https://docs.launchdarkly.com/docs/node-sdk-reference#section-users)
-   **Refactor** `mwp-core` uses a `LaunchDarklyUser` object to call `getFlags` method of `mwp-app-route-plugin`.
-   **New Feature** `mwp-core` adds a request country and region provided by Fastly to LaunchDarkly user
    custom attributes.

## [18.1]

-   Adds new rasp plugin which monitors and prevents traffic from bad actors.
    This RASP integration uses Signal Sciences.
    @see https://docs.signalsciences.net/install-guides/nodejs-module/#usage-for-nodejs-hapi

## [18.0]

-   **BREAKING CHANGE** Upgraded to ux-capture 3.0.0.
-   **Renamed**: `UXCaptureConfig` is `UXCaptureCreate`
-   **Renamed**: `UXCaptureExpect` is `UXCaptureStartView`

## [17.4]

-   **Refactor** `mwp-tracking-plugin` now explicitly handles each type of request
    that results in an activity record to ensure that the expected `url` and
    `referrer` values are populated

## [17.3]

-   **New feature** added support for `put` request

## [17.2]

-   **Refactor** click tracking provided by `mwp-tracking-plugin` now keeps click
    state in a cookie rather than Redux state.

## [17.1]

-   **NEW FEATURE** Create 'mwp-csp-plugin' which adds some useful security headers

## [17.0]

-   **BREAKING CHANGE** Upgrade to hapi v17, which requires updating of
    much of the platform code. Consumer apps that leverage the hapi server

## [16.6]

-   Logging change - no more stdout debug logging for tracking calls, no logging
    of successful api.meetup.com calls in prod.

## [16.5]

-   **NEW FEATURE** the API proxy path prefix can now be specified using an app's
    `package.json` file by specifying `config.apiProxyPath` with a leading slash,
    e.g. `/mu_api`, or by an env variable `API_PROXY_PATH`.

## [16.4]

-   **NEW FEATURE** A selector for pulling Feature Flags from redux state
-   `mwp-store/lib/selectors` `getFeatureFlags`
-   This selector will pull all feature flags from `state->flags`

## [16.3]

-   **NEW FEATURE** query functions attached to routes will now get called with a
    second argument, `state`, which is the application's current Redux state. This
    can be used , for example, to inspect feature flags to determine what API
    request to make

## [16.2]

-   **NEW FEATURE** `mwp-app-render/lib/components/StateBroadcast` component that
    can be inserted anywhere in an application in order to enable a `window.getAppState()`
    function that returns the current Redux state tree as a single object.

## [16.1]

-   **NEW FEATURE** the prod REST API can now be used directly in the dev environment.
    To enable, simply add `{ "api": { "host": "api.meetup.com" } }` to a
    `config.development.json` file in the root of your application. _Note_: there
    is no visible difference between using the prod REST API and the dev REST API.
    Try not to chnage any data that doesn't belong to you.

## [16.0]

-   **BREAKING CHANGE** webpack build configurations have been moved to
    mwp-cli and are no longer a part of `mwp-config`. Make sure to upgrade
    to mwp-cli >= `7.1.429`.

## [15.1]

-   **NEW FEATURE** `api.track` action creator for async activity tracking requests
    from consumer apps. Pass along `viewName` and (optionally) `subViewName` in
    `query.params` in order to tag the record with those fields.

## [15.0]

-   **BREAKING CHANGE** routing definitions no longer support `getIndexRoute` and
    `getNestedRoutes`. Instead, async loading should happen at the component level
    -   use `getComponent` instead of `component`.

## [14.1]

-   **NEW FEATURE** support for `query.list` param to aggregate list endpoint
    responses

## [14.0]

-   **BREAKING CHANGE** dropping support for React 15. Peer dependencies
    will require React 16.3 or higher.
-   Upgrade meetup-web-component dependencies to latest (4.8.2111), and
    require meetup-web-component@^4.8.0 for peer dependencies.

## [13.1]

-   **New feature** `state.flags` containing all LaunchDarkly feature flags

## [13.0]

-   **BREAKING CHANGE** `publicPath` now set as a config var that is shared by server
    and browser build config - `APP_RUNTIME.assetPublicPath` is no longer populated
    by server, and consumer apps no longer need to set a 'dynamic' `__webpack_public_path__`
    value in either the server or browser entry point script
-   `asssetPublicPath` no longer needs to be passed to `server-render/makeRenderer`

# [12.4]

-   **Bugfix** the Redux cache middleware will now key the cache with the logged-in
    member's ID in order to avoid incorrectly returning cached results corresponding
    to other members or logged-out responses.

## [12.3]

-   **New feature** `SEOHead` a component for rendering SEO content in the document
    head. Also adds related utils under `src/util/seo`. [WP-532](https://meetup.atlassian.net/browse/WP-532)

## [12.2]

-   **Simplified** `makeServerRenderer$` no longer requires a `baseUrl` param - it
    will be determined from the request directly

## [12.1]

-   **Refactor** `mwp-i18n/lib/withIntl` now expects a map of
    `{ [localeCode]: messages }` in its `messages` arg. `mwp-cli` has been updated
    to provide this TRN source structure automatically.

## [12.0]

-   **Moved** `mwp-core/lib/localizationUtils` is now part of `mwp-i18n`, renamed
    to `loadLocaleData`
-   **New package** `mwp-i18n`, which currently contains the `withIntl` HOC and
    `loadLocaleData`

## [11.1]

-   **New package** `mwp-config` - a dedicated 'config' package that can be freely
    imported to other MWP packages and consumers.

## [11.0]

-   **Removed** `api.requestAll` action creator is now a private function.
    Consumers _must_ use the method-specific API request action creators, which
    now accept arrays of queries in addition to single query
-   **Removed** The `meta.promise` property of API actions has been removed - use
    the `meta.request` Promise instead, which will return an array of responses.
    E.g. instead of `api.post(...).meta.promise.then(response => ...)`, use
    `api.post(...).meta.request.then(([response]) => ...)`
-   **Removed** `api.requestAll` is no longer exported - use the method-specific
    action creators with the following enhancement:
-   **New feature** `api.get/post/patch/del` can now be called with an array of
    queries in order to make a batched API request

## [10.2]

-   **Removed** Oauth authentication for no-cookie requests. This means we no
    longer need `MUPWEB_OAUTH_TOKEN` and `MUPWEB_OAUTH_SECRET` env vars. Consumer
    applications should not need to change any of their code, but deployments
    can be cleaned up

## [10.1]

-   `mwp-api-state` refactored to remove redux-observable + rxjs dependencies -
    those are no longer peerDependencies. `redux-observable` is not currently used
    by any other MWP package and can be removed from consumer apps

## [10.0]

-   Removed polyfill for `Intl.NumberFormat` and `Intl.DateTimeFormat` - consumers
    should instead use the `full-icu` package and follow its instructions to
    ensure that Node will load all required locale data when it starts.

## [9.1]

-   Support for reading `MEETUP_VARIANT_...` cookies into `state.config.variants`

## [9.0]

### BREAKING CHANGES

-   **Removed** Queries specifying REST API endpoints that do not support
    logged-out members will no longer produce responses. Specifically,
    `members/self` will not be called, meaning that `state.api.self` can not be
    assumed to have a value throughout the application - a selector function
    should be used to provide a reasonable default value in your components.

## [8.1]

-   `mwp-log` now contains nicely-formatted logs

## [8.0]

-   **All 'internal' packages now published independently**:
    -   `mwp-api-proxy-plugin`
    -   `mwp-api-state`
    -   `mwp-app-render`
    -   `mwp-app-route-plugin`
    -   `mwp-app-server`
    -   `mwp-auth-plugin`
    -   `mwp-core`
    -   `mwp-language-plugin`
    -   `mwp-router`
    -   `mwp-store`
    -   `mwp-sw-plugin`
    -   `mwp-tracking-plugin`
    -   `mwp-test-utils`

## [7.1]

-   **Feature**: Pass in an array of string `cssLinks` to `makeServerRenderer$` in
    order to add static CSS `<link>` tags to the document `<head>`. These tags
    will not be affected by `<link>`s defined within `<Helmet>` tags of the
    application, and therefore will not be subject to being clobbered by
    client-side rendering that will cause a FOUC (as described in
    [this react-helmet issue](https://github.com/nfl/react-helmet/issues/98)).

    **Important**: The consumer application must ensure that the CSS _files_ are
    bundled with the browser application script as well, even though the links
    themselves are not required by the browser app renderer.

## [7.0]

### BREAKING CHANGES

-   **Moved** `src/server` is now `src/app-server`

## [6.0]

### BREAKING CHANGES

-   **Moved** `src/components/Redirect` --> `require('src/router').Redirect`
-   **Moved** `src/components/Forbidden` --> `require('src/router').Forbidden`
-   **Moved** `src/actions/apiActionCreators`: The action `type` constants and
    action creators are exported from `require('src/api-state')`:

    -   `API_REQ` - `API_RESP_SUCCESS` - `API_RESP_COMPLETE` - `API_RESP_ERROR` - `API_RESP_FAIL` - `requestAll` - `get` - `post` - `patch` - `del`

-   **Moved** `src/actions/syncActionCreators`: The action `type` constants and
    location change action creators are exported from `require('src/router')`.
    Deprecated `apiError`, `apiSuccess`, `apiRequest` action creators can be
    imported directly from `src/api-state/sync/syncActionCreators`, but should be
    marked as 'deprecated' and converted to the `api-state` action creators above.

    -   `SERVER_RENDER`
    -   `LOCATION_CHANGE`
    -   `locationChange`

-   **Moved + renamed** `src/middleware/platform:getEpicMiddleware` has moved to
    `require('src/api-state').getApiMiddleware`

-   **Moved + renamed** Parts of `src/reducers/platform` have moved to
    `src/store/reducer`. `makeRootReducer` is now the default export of the
    module. The `api` and `app` (deprecated) reducers are now in `src/api-state`,
    along with `DEFAULT_API_STATE`.

-   **Moved** some `src/components` moved to `src/render/components`:

    -   `PlatformApp` - should not be used - choose `BrowserApp` or `ServerApp`
    -   `PageWrap`
    -   `BrowserApp`
    -   `ServerApp`

-   **Moved** `state.config.localeCode` is now `state.config.requestLanguage` to
    better describe where the locale code comes from - make sure you update to the
    latest meetup-web-mocks in order to get a valid `MOCK_APP_STATE`

## [5.1]

-   **Change** (could be considered breaking, but it's specifically for a
    requested update to GroupCard in mup-web): `group.duotoneUrl` is now an object
    with `small` and `large` properties - `small` has a resolution of 300x400, and
    `large` has a resolution of 1100x800.

## [5.0]

### BREAKING CHANGE

-   **Fixed** the `platform_agent` in tracking logs is now determined from
    `package.json`, which should have a `config.agent` string of `MUP_WEB` or
    `PRO_WEB`.

## [4.0]

### BREAKING CHANGES

-   **Removed** Support for `?logout` query parameter, and platform-based
    Login/Logout components. Platform consumers should use the `<Redirect>`
    component to redirect login and logout requests to Meetup classic until
    login and logout can be handled fully by the platform in a future update.

## [3.3]

-   **New feature** API request actions now contain a reference to a Promise that
    will resolve when the API request returns. [WP-334](https://meetup.atlassian.net/browse/WP-334)
-   **New feature** Supply `initialNow` to `state.config` to sync server and
    browser time reference.
-   **New feature** 301/302 Redirects now supported for internal and external
    routes. [WP-331](https://meetup.atlassian.net/browse/WP-331)
-   **New feature** Query creator functions assigned to routes will now receive
    all React Router `match` properties in their argument. [WP-352](https://meetup.atlassian.net/browse/WP-352)

## [3.2]

-   **Deprecated** `~/.mupweb.config` has been deprecated - node convict now
    manages environment configurations in `util/src/config.js`. To override any
    of the default values in development, create a `config.development.json` file
    with the name of the configuration and new value. This file is automatically
    gitignored. See `config.test.json` for an example configuration.

# [3.1]

-   **New feature** Google App Engine PubSub tracking logs. To enable, consumer
    apps must ensure that the `GAE_INSTANCE` environment variable is set in the
    app container - GAE provides it automatically to the GAE runtime. Docs:
    https://cloud.google.com/appengine/docs/flexible/nodejs/runtime#environment_variables

## [3.0]

-   **Refactor** default locale is determined by first locale in list,
    as specified in consuming repo's /src/util/locales.js

## [2.5]

-   **New feature** support for asyncronous routes (PR #266).
    [Docs](docs/Routing.md#load-asynchronous). Note the new `resolveAppProps`
    helper that allows the browser script to delay rendering until async routes
    are resolved - [rendering docs here](docs/Rendering#browser-rendering).

## [2.4]

-   **Deprecated** `renderers/browser-render.jsx` has been deprecated - consumer
    applications should use vanilla React render methods to render a `<BrowserApp />`, which is the new entry point for a platform-based applications, at
    `src/components/BrowserApp.jsx`. The browser entry point should contain the
    following code:

    ```jsx
    import ReactDOM from 'react-dom';
    import {
      getInitialState,
      getBrowserCreateStore
    } from '../util/createStoreBrowser';

    const routes = ...;
    const reducer = ...;
    const middleware = ... || [];
    const basename = ... || '';

    const createStore = getBrowserCreateStore(routes, middleware, basename);
    const store = createStore(reducer, getInitialState(window.APP_RUNTIME));
    ReactDOM.render(
      <BrowserApp routes={routes} store={store} basename={basename} />,
      document.getElementById('outlet')  // this is a hard-coded id
    );
    ```

## [2.3]

-   **Replaced** `state.api.isFetching` has been replaced with
    `state.api.inFlight`, which is an array of `ref`s corresponding to query
    requests that have not yet returned. Use `state.api.inFlight.includes(fooRef)`
    to determine whether a particular query has returned.

## [2.2]

-   **Deprecated** all of the Sync action creators (e.g. `syncActionCreators.apiRequest`)
    have been deprecated. You should instead use the new `apiActionCreators` to
    manually trigger API requests - see the [Queries docs](./docs/Queries.md#usage)
    for more info. The Sync action creators will be removed in version 3.

    There are four things that consumer apps need to update:

    1.  `syncActionCreators.apiRequest` query dispatches must be converted to
        `apiActionCreators.requestAll` (or the method-specific equivalents
        [described in the Queries
        docs](https://github.com/meetup/meetup-web-platform/blob/30a220c9a5cb3b9339c4fbccd6e9ff1efbf5a49a/docs/Queries.md#action-creation)).

    2.  All reads from `state.app` should be converted to `state.api` - the child
        properties will be the same `ref`s used in `state.app`, except for
        `state.app.error` which is now `state.api.fail`.

    3.  Any reducers listening for `API_SUCCESS` (which has a `payload` containing
        an object with a `queries` array and corresponding `responses` array) must
        be refactored to listen for `API_RESP_SUCCESS` and `API_RESP_ERROR`
        actions, which will each contain a `{ query, response }` object
        corresponding to a single query and its response.

        The shape of each `response` object has also changed - instead of a single
        root-level key corresponding to the original query's `ref`, the response
        is now a flat object with a `ref` property.

        Instead of parsing the `API_SUCCESS` payload for errors, reducers will now
        be able to specifically identify responses that correspond to
        failed/invalid responses from the REST API by listening for
        `API_RESP_ERROR` - `API_RESP_SUCCESS` will always correspond to a valid
        REST API response.

    4.  Any reducers listening for `API_ERROR` must be refactored to listen for
        `API_RESP_FAIL`. Both actions have the same `Error` object payload
        corresponding to a general API request failure, unrelated to a specific
        query.

    These changes must by made simultaneously, and this list assumes that the
    refactor described in the `v2.1` changelog has been completed first.

## [2.1]

-   **Deprecated** POSTing and DELETEing through custom `POST_...` or `DELETE_...`
    actions has been deprecated - a warning will be printed in the server logs.
    Use the `meta.method` field in your Query objects to determine the request
    method, and use `componentWillReceiveProps` to process the API result [as
    described in the
    docs](https://github.com/meetup/meetup-web-platform/blob/main/docs/Queries.md#recipes)

## [2.0]

-   **Refactor** Upgrade to React Router v4. Routes definitions change - the root
    level routes definition is now an array, and each route must have the following
    shape:

    ```ts
    {
      path: string,  // must have leading '/', except for the root '' path
      component: React.Component,
      query?: function,
      routes?: array,  // child routes, with `path` props that append to the parent
      exact?: boolean,  // forces the component to only render when url is exact
        match
    }
    ```

    Note that async routes are no longer supported - they will return in a new form
    in a future update

## [1.0]

-   **Require Node v7** for require('url').URL
-   **Require window.URL** polyfill for browsers without native support

## [0.11]

-   **Removed** `apiConfigCreators` no longer exists - use the query object
    directly to define the `endpoint`

## [0.10]

-   **New env variable** - `COOKIE_ENCRYPT_SECRET` must be in your env vars. It
    must be a 32+ character random string.
-   **Refactored** - auth cookies are now encrypted, so existing cookies must be
    cleared in the browser.

## [0.9]

-   **Removed** - Many of the shared methods in `src/util/testUtils`
    now are in the `meetup-web-mocks` repo
-   **Change** - Use the `meetup-web-mocks` repo for testUtil methods,
    e.g.,

```js
import { createFakeStore } from 'meetup-web-mocks/lib/testUtils';
```

## [0.8]

-   **Change** - `API_SUCCESS` now returns a `meta` prop that contains the `csrf`
    token returned by the server that will be used to validate all POSTs. Your
    Redux reducer must include a `config` reducer that will assign `config.csrf`
    on `API_SUCCESS`, e.g.

```js
function config(state = {}, action) {
	let csrf;
	switch (action.type) {
		case 'API_SUCCESS':
			csrf = action.meta.csrf;
			return { ...state, csrf };
		//...
	}
}
```

## [0.7]

-   **Removed/Refactor** - there are no more `LOGOUT_X` actions. Logout is instead
    a navigation action to any URL with `?logout` in the URL.

## [0.6]

-   **Removed** - `CONFIGURE_AUTH` action will no longer contain a key named
    `anonymous`. The app can determine whether the current user is logged in from
    the `app.self` value, which should be a memeber object with a `status`
    indicating whether the user is logged in.
-   **Deprecated** - the `ANONYMOUS_ACCESS_URL` and `ANONYMOUS_AUTH_URL` env
    variable names have been changed to `OAUTH_ACCESS_URL` and `OAUTH_AUTH_URL`,
    respectively. The only names will still be read, but will be removed entirely
    in a future version.

## [0.5]

-   **Refactor** - all modules are now transpiled to CommonJS ES5 modules in
    `lib/`, so your import paths should change:

```js
// v0.4
import <module> from 'meetup-web-platform/<moduleName>';

// v0.5
import <module> from 'meetup-web-platform/lib/<moduleName>';
```

If you want to use the ES6 source files directly, import them with
`'meetup-web-platform/src/<moduleName>';`

## [0.4]

-   **Renamed** - `getEpicMiddleware` is now `getPlatformMiddleware` since all
    platform middleware functionality is provided as a single redux-observable
    epic-based middleware combining multiple epics
-   **Removed** `PostMiddleware` - the equivalent functionality is now provided
    as an epic in `PostEpic`, which is part of `getPlatformMiddleware`

## [0.3]

-   **Added** `getEpicMiddleware`
-   **Removed/Added** `SyncMiddleware`, `CacheMiddleware`, `AuthMiddleware` are now
    part of [`EpicMiddleware`](middleware/epic.js) - `getEpicMiddleware(routes)` will add functionality equivalent to the
    previous middleware. If you are using `createStore` from the platform library,
    you can ignore this update, as the middleware loading is done for you.

## [v0.2]

-   **Refactor** [`server-render:makeRenderer`](renderers/server-render.jsx#L123)
    now takes `clientFilename` and `assetPublicPath` as separate arguments
    `clientFilename` is typically provided by the webpack build stats of the
    client build process. `assetPublicPath` is usually constructed from env vars
    in your server entry point.
-   In order to correctly apply the `assetPublicPath` to your server and client
    builds, you must set `__webpack_public_path__` _before_ importing your
    application code, e.g.

        ```js
        // your client entry point
        __webpack_public_path__ = window.APP_RUNTIME.assetPublicPath;
        const routes = require('./routes').default;
        const reducer = require('./features/shared/reducer').default;
        const render = makeRenderer(routes, reducer);

        // your server entry point
        const clientFilename = WEBPACK_CLIENT_FILENAME;
        const assetPublicPath = ${process.env.ASSET_SERVER_HOST}:${process.env.ASSET_SERVER_PORT}/`;
        __webpack_public_path__ = assetPublicPath;  // eslint-disable-line no-undef
        const routes = require('./routes').default;
        const reducer = require('./features/shared/reducer').default;
        const renderRequest$ = makeRenderer(routes, reducer, clientFilename, assetPublicPath);
        ```
