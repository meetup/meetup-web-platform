import { makeCache, cacheWriter, cacheReader } from './util';

describe('cache utils', () => {
	it('creates a Promise-based cache', function() {
		const cache = makeCache();
		expect(cache.get).not.toBeNull();
		expect(cache.get()).not.toBeNull();
		expect(cache.set).not.toBeNull();
		expect(cache.set()).not.toBeNull();
		expect(cache.delete).not.toBeNull();
		expect(cache.delete()).not.toBeNull();
	});
	it('sets and gets from cache', function() {
		const cache = makeCache();
		return cache
			.set('foo', 'bar')
			.then(() => cache.get('foo'))
			.then(value => expect(value).toEqual('bar'))
			.then(() => cache.set('foo', 'baz'))
			.then(() => cache.get('foo'))
			.then(value => expect(value).toEqual('baz'));
	});
	it('deletes from cache', function() {
		const cache = makeCache();
		return cache
			.set('foo', 'bar')
			.then(() => cache.delete('foo'))
			.then(() => cache.get('foo'))
			.then(value => expect(value).toBeUndefined())
			.catch(err => expect(err).not.toBeNull());
	});

	it('cacheWriter writes to cache', function() {
		const cache = makeCache();
		const query = { foo: 'baz' };
		const response = 'bar';
		return cacheWriter(cache, 'memberId')(query, response)
			.then(() => cache.get(`memberId${JSON.stringify(query)}`))
			.then(cachedResponse => expect(cachedResponse).toEqual(response));
	});

	it('cacheWriter does not write non-GET queries to cache', function() {
		const cache = makeCache();
		const query = { foo: 'baz', meta: { method: 'post' } };
		const response = 'bar';
		return cacheWriter(cache)(query, response)
			.then(() => cache.get(JSON.stringify(query)))
			.then(cachedResponse => expect(cachedResponse).toEqual(undefined));
	});

	it('cacheWriter does not write `noCache` queries to cache', function() {
		const cache = makeCache();
		const query = { foo: 'baz', meta: { noCache: true } };
		const response = 'bar';
		return cacheWriter(cache)(query, response)
			.then(() => cache.get(JSON.stringify(query)))
			.then(cachedResponse => expect(cachedResponse).toEqual(undefined));
	});

	it('cacheReader reads from cache and returns result with query', function() {
		const cache = makeCache();
		const requestCache = cacheReader(cache);
		const query = { foo: 'baz' };
		const nonCachedQuery = { bing: 'bong' };
		const response = 'bar';
		return cacheWriter(cache)(query, response)
			.then(() => requestCache(query))
			.then(({ query: cachedQuery, response: cachedResponse }) => {
				// expecting two-element array response
				expect(cachedQuery).toEqual(query);
				expect(cachedResponse).toEqual(response);
			})
			.then(() => requestCache(nonCachedQuery)) // test with un-cached query
			.then(({ query: cachedQuery, response: cachedResponse }) => {
				expect(cachedQuery).toEqual(nonCachedQuery);
				expect(cachedResponse).toBeUndefined();
			});
	});
});
