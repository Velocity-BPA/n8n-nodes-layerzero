module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2021,
		sourceType: 'module',
		project: './tsconfig.json',
	},
	env: {
		node: true,
		es2021: true,
		jest: true,
	},
	plugins: ['@typescript-eslint', 'n8n-nodes-base'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:n8n-nodes-base/community',
		'prettier',
	],
	ignorePatterns: ['dist/**', 'node_modules/**', '*.js'],
	rules: {
		// TypeScript specific rules
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/no-unused-vars': [
			'warn',
			{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
		],
		'@typescript-eslint/no-non-null-assertion': 'warn',

		// General rules
		'no-console': 'warn',
		'prefer-const': 'error',
		'no-var': 'error',

		// n8n specific rules
		'n8n-nodes-base/node-class-description-credentials-name-unsuffixed': 'off',
		'n8n-nodes-base/node-class-description-display-name-unsuffixed-trigger-node': 'off',
		'n8n-nodes-base/node-param-description-missing-from-dynamic-options': 'off',
		'n8n-nodes-base/node-param-options-type-unsorted-items': 'off',
	},
	overrides: [
		{
			files: ['**/*.test.ts', '**/*.spec.ts'],
			env: {
				jest: true,
			},
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
			},
		},
	],
};
