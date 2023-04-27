import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { shallow } from 'enzyme';
import { OPT_DEFAULT, SetCookie, GetCookie, CookieProvider } from './Cookie';

describe('CookieProvider', () => {
	test('renders CookieContext provider with get/set value and children', () => {
		const get = jest.fn();
		const set = jest.fn();
		expect(
			shallow(
				<CookieProvider get={get} set={set}>
					hi
				</CookieProvider>
			)
		).toMatchInlineSnapshot(`
		<ContextProvider
		  value={
		    {
		      "get": [MockFunction],
		      "set": [MockFunction],
		    }
		  }
		>
		  hi
		</ContextProvider>
	`);
	});
});
describe('SetCookie', () => {
	test('calls context `set` with name, value, options', () => {
		const get = jest.fn();
		const set = jest.fn();
		const [name, value, options] = ['foo', 'myvalue', { path: './foo' }];
		ReactDOMServer.renderToStaticMarkup(
			<CookieProvider get={get} set={set}>
				<SetCookie name={name} {...options}>
					{value}
				</SetCookie>
			</CookieProvider>
		);

		expect(get).not.toHaveBeenCalled();
		expect(set).toHaveBeenCalledWith(
			name,
			value,
			expect.objectContaining(options)
		);
	});
	test('uses default options when options not specified', () => {
		const get = jest.fn();
		const set = jest.fn();
		ReactDOMServer.renderToStaticMarkup(
			<CookieProvider get={get} set={set}>
				<SetCookie name="foo">my value</SetCookie>
			</CookieProvider>
		);

		const optionsArg = set.mock.calls[0][2];
		expect(optionsArg).toEqual(OPT_DEFAULT);
	});
});
describe('GetCookie', () => {
	test('calls children function with result of "get(name)"', () => {
		const cookies = { foo: 'bar', baz: 'qux' };
		const get = jest.fn(name => cookies[name]); // this could be anything
		const set = jest.fn();
		const children = jest.fn(value => value);
		const name = 'foo';
		const markup = ReactDOMServer.renderToStaticMarkup(
			<CookieProvider get={get} set={set}>
				<GetCookie name={name}>{children}</GetCookie>
			</CookieProvider>
		);
		expect(get).toHaveBeenCalledWith(name);
		expect(children).toHaveBeenCalledWith(get(name));
		expect(markup).toBe(children(get(name)));
	});
});
