import React from 'react';
import ApolloClient, { InMemoryCache } from 'apollo-boost';
import fetch from 'isomorphic-fetch';
import { ApolloProvider } from 'react-apollo';
import { isServer } from '../util/isServer';

const client = new ApolloClient({
	ssrMode: isServer(),
	name: 'mup-web',
	cache: isServer()
		? new InMemoryCache()
		: new InMemoryCache().restore(window.__APOLLO_STATE__),
	uri: 'https://api.meetup.com/gql',
	credentials: 'include',
	fetch,
});

const Provider = ({ children }) => (
	<ApolloProvider client={client}>{children}</ApolloProvider>
);

export default Provider;
