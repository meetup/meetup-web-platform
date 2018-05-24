module.exports = {
	plugins: ['stylelint-scss'],
	rules: {
		'scss/at-else-closing-brace-newline-after': 'always-last-in-chain',
		'scss/at-else-if-parentheses-space-before': 'always',
		'scss/at-extend-no-missing-placeholder': true,
		'scss/at-function-parentheses-space-before': 'never',
		'scss/at-if-closing-brace-newline-after': 'always-last-in-chain',
		'scss/at-import-no-partial-leading-underscore': true,
		'scss/at-mixin-argumentless-call-parentheses': 'always',
		'scss/at-mixin-parentheses-space-before': 'never',
		'scss/at-rule-no-unknown': true,
		'scss/dollar-variable-colon-space-after': 'always',
		'scss/dollar-variable-colon-space-before': 'never',
		'scss/dollar-variable-no-missing-interpolation': true,
		'scss/declaration-nested-properties': 'never',
		'scss/selector-no-redundant-nesting-selector': true,
		'scss/no-duplicate-dollar-variables': true,

		// the following rules are intentionally disabled
		'scss/at-else-closing-brace-space-after': null,
		'scss/at-else-empty-line-before': null,
		'scss/at-function-named-arguments': null,
		'scss/at-function-pattern': null,
		'scss/at-if-closing-brace-space-after': null,
		'scss/at-import-partial-extension-blacklist': null,
		'scss/at-import-partial-extension-whitelist': null,
		'scss/at-mixin-named-arguments': null,
		'scss/at-mixin-pattern': null,
		'scss/dollar-variable-colon-newline-after': null,
		'scss/dollar-variable-default': null,
		'scss/dollar-variable-empty-line-before': null,
		'scss/dollar-variable-pattern': null,
		'scss/percent-placeholder-pattern': null,
		'scss/double-slash-comment-empty-line-before': null,
		'scss/double-slash-comment-inline': null,
		'scss/double-slash-comment-whitespace-inside': null,
		'scss/declaration-nested-properties-no-divided-groups': null,
		'scss/media-feature-value-dollar-variable': null,
		'scss/operator-no-newline-after': true,
		'scss/operator-no-newline-before': true,
		'scss/operator-no-unspaced': true,
		'scss/partial-no-import': null,
	},
};
