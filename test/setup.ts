/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

// Global test setup
beforeAll(() => {
	// Set up any global test configuration
	process.env.NODE_ENV = 'test';
});

afterAll(() => {
	// Clean up after all tests
});

// Mock console.warn to suppress licensing notices during tests
const originalWarn = console.warn;
beforeEach(() => {
	console.warn = jest.fn();
});

afterEach(() => {
	console.warn = originalWarn;
});
