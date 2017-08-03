import linkify from './linkify';

describe('linkify', () => {
	const httpBase = 'http://www.meetup.com',
		expectedLink =
			'<a class="link" href="http://www.meetup.com" title="http://www.meetup.com" target="" >http://www.meetup.com</a>';

	it('should turn a link text with http into a HTML anchor with http', () => {
		expect(linkify(httpBase)).toBe(expectedLink);
	});
	it('should turn a link text with https into a HTML anchor with https', () => {
		const secureBase = 'https://secure.meetup.com';
		const expectedSecureLink =
			'<a class="link" href="https://secure.meetup.com" title="https://secure.meetup.com" target="" >https://secure.meetup.com</a>';
		expect(linkify(secureBase)).toBe(expectedSecureLink);
	});
	it('should turn a link text with a target into an HTML anchor with a target', () => {
		const targetLink =
			'<a class="link" href="http://www.meetup.com" title="http://www.meetup.com" target="foo" >http://www.meetup.com</a>';
		expect(linkify(httpBase, { target: 'foo' })).toBe(targetLink);
	});
	it('should turn a link text with a `_blank` target into an HTML anchor with `rel="noopener noreferrer"`', () => {
		expect(linkify(httpBase, { target: '_blank' })).toContain(
			'rel="noopener noreferrer"'
		);
	});
	it('should turn a link text without a `_blank` target into an HTML anchor without `rel="noopener noreferrer"`', () => {
		expect(linkify(httpBase)).not.toContain('rel="noopener noreferrer"');
	});
	it('should not turn a text without a link into text with an HTML anchor', () => {
		const noLinkText = 'This is not a link.';
		expect(linkify(noLinkText)).toBe(noLinkText);
		expect(linkify(noLinkText)).not.toContain('</a>');
	});
	it('should turn a text with a link into text with an HTML anchor', () => {
		const paragraphTextBase = `Did you know ${httpBase} is a cool site?`;
		const expectedParagraphLink = `Did you know ${expectedLink} is a cool site?`;
		expect(linkify(paragraphTextBase)).toBe(expectedParagraphLink);
	});
	it('should prefix a plain link with a protocol', () => {
		const plainBase = 'www.meetup.com';
		const expectedLink =
			'<a class="link" href="http://www.meetup.com" title="www.meetup.com" target="" >www.meetup.com</a>';
		expect(linkify(plainBase)).toBe(expectedLink);
	});
});
