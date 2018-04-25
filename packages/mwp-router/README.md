# Router

The Meetup Web Platform router module provides React routing utilities. It is a
wrapper around [React Router v4](https://reacttraining.com/react-router/) that
enables async routing and some more flexible linking and response handling like
redirects and 404s.

Application routes must be provided in a static `routes` configuration object,
which allows the application to determine the API data requirements of a route
before it starts building the React virtual DOM on the server.

Async routes that allow code splitting are supported.


## Route definition

Consumer apps are defined by their base routes + base reducer. The base routes
connect URLs to data fetch requirements and the corresponding React container
components.

The platform rendering functions map the `routes` array onto a full React
component tree, using `route` definitions that conform to the [type defined in
`flow-typed/platform.js`](../flow-typed/platform.js).

```js
type PlatformRoute = {
  component: React$Element<any>,
  path?: string,
  indexRoute?: PlatformRoute,
  getIndexRoute?: () => Promise<PlatformRoute>,
  routes?: () => Promise<Array<PlatformRoute>>,
  getNestedRoutes:
  query?: QueryFunction? | Array<QueryFunction?>,
  exact?: boolean,
};
```

Route arrays will be rendered _exclusively_, in order, so overlapping routes
should put the most specific route at the top of the `routes` array. Within app
components, you may use the full range of features provided by the [React Router
v4 API](https://reacttraining.com/react-router/api). However, be aware that any
navigation-based data fetching must be defined in this top-level `routes`
configuration object passed to the app renderers.

### `component`

The React component that will be rendered when the route matches.

### `path`

The `path` for a route is defined _relative_ to whatever route it is nested
in. It should always start with a slash `/`. It should _never_ end with a slash.

**Note**: The standard implementation of React Router v4 does not directly
support relative `path` strings - we use the route configuration as a base for
calculating the full path that is passed to the underlying rendered `<Route>`
components.

### `exact`

Only render the current route when the URL matches exactly

### `query`

This is a function or array of functions that yield(s) a
[`Query` object](../docs/Queries.md) or `null`. All query functions will be executed
when the route matches, and all resulting non-null queries will be included in
the resulting API request.

### `indexRoute` (synchronous)

The `indexRoute` parameter is a pared-down `PlatformRoute` definition that
contains just the `component` that should be rendered when the location/url
matches the root `path` _exactly_.

### `routes` (synchronous)

An array of 'child routes' that will be rendered as children of any parent
routes. Child routes' `path` property will be concatenated with the parent
`route`.

### `getIndexRoute` (asynchronous)

A function that, when invoked, will return a Promise that resolves with a
`Route` object. This can be used for code splitting by using `import()` to
dynamically import a route to be used as the `exact` index root.

### `getNestedRoutes` (asynchronous)

A function that, when invoked, will return a Promise that resolves with a
`routes` array. This can be used for code splitting by using `import()` to
dynamically import a route subtree.

```js
{
  path: '/',
  component: RootContainer,
  getNestedRoutes: () => import('./childRoutes').then(r => r.default),
}
```

Be cautious with using async routes - they are very useful for splitting your
app bundle into smaller chunks, but they also force the application to make two
HTTP roundtrips when loading a new async chunk - one to get the route subtree,
and another to fetch the API data defined in that subtree. In general, it's a
good idea to use async routes near the root of your app so that it can be
broken into large chunks but define the branches with synchronous routes that
will be immediately parseable as the user navigates deeper into the application.

### 404 Not Found route

It's generally a good idea to include a catch-all, no-path route that provides
the 404 page for any invalid child route. It will still be rendered as a child
of the root route, so it can contain the data/context of that route. For
example, the 404 route at the group `/:urlname` level could include Group
information and links back to the group homepage or event list.

## Redirects

All redirects should be implemented with the platform's [`<Redirect />`
component](./Redirect.jsx), which functions almost identically
to
[React Router's `<Redirect>`](https://reacttraining.com/react-router/web/api/Redirect)
but includes support for redirecting to external URLs in addition to internal
routes. See the component's code docs for details on usage - you should never
have to use `window.location.assign`, `window.location.replace`, or an
equivalent programmatic navigation API - just render a
`<Redirect to={...next route/url...} />` and let the application handle the
logistics.

## Links

All links should be implemented with the platform's
[`<Link />` component](./Link), which functions almost identically to
[React Router's `<Link>`](https://reacttraining.com/react-router/web/api/Link)
but includes support for linking to external URLs in addition to internal routes.

## Components

### `AsyncRouter`

### `Link`

### `Redirect`

### `NotFound`

### `RouteLayout`

### `SyncContainer`

## Utilities

All public routing utilities are available from the `index` import of the `util`
directory, i.e.

```js
const routeUtils = require('./router/util');
```

### Route resolvers (`util/resolve.js`)

### Route Query handlers (`util/query.js`)