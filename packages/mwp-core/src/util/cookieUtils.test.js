import { MEMBER_COOKIE, parseMemberCookie } from './cookieUtils';

describe('parseMemberCookie', () => {
	it('returns the parsed cookie', () => {
		const requestState = { [MEMBER_COOKIE]: 'foo=bar&baz=bing' };
		expect(parseMemberCookie(requestState)).toEqual({
			foo: 'bar',
			baz: 'bing',
			id: 0,
		});
	});
	it('returns an integer id', () => {
		const values = [
			'foo=bar&baz=bing', // no id
			'id=fabulous',
			'id=0',
			'id=1234',
			'',
		];
		values
			.map(v => ({ [MEMBER_COOKIE]: v }))
			.forEach(state =>
				expect(parseMemberCookie(state).id).toEqual(expect.any(Number))
			);
	});
	it('returns an integer id', () => {
		const ids = [1, 0, 'fabulous'];

		const resultIds = ids
			.map(id => ({ [MEMBER_COOKIE]: `id=${id}` }))
			.map(parseMemberCookie)
			.map(member => member.id);

		expect(resultIds).toEqual(ids.map(id => parseInt(id.toString(), 10) || 0));
	});
	it('returns {id:0} for no-cookie case', () => {
		expect(parseMemberCookie({})).toEqual({ id: 0 });
	});
});
