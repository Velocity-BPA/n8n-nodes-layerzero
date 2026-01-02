/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { 
	ENDPOINT_IDS, 
	MESSAGE_STATUSES, 
	DVN_PROVIDERS_LIST, 
	EXECUTOR_PROVIDERS_LIST,
	CHAIN_OPTIONS,
	LICENSING_NOTICE 
} from '../../nodes/LayerZero/constants';

import {
	isValidEvmAddress,
	isValidSolanaAddress,
	formatTokenAmount,
	parseTokenAmount,
	calculateSlippage,
	buildMessageOptions,
	buildV2Options,
} from '../../nodes/LayerZero/utils';

describe('LayerZero Constants', () => {
	describe('ENDPOINT_IDS', () => {
		it('should have ethereum endpoint ID', () => {
			expect(ENDPOINT_IDS.ethereum).toBe(30101);
		});

		it('should have arbitrum endpoint ID', () => {
			expect(ENDPOINT_IDS.arbitrum).toBe(30110);
		});

		it('should have all major chains', () => {
			const majorChains = ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc'];
			for (const chain of majorChains) {
				expect(ENDPOINT_IDS[chain]).toBeDefined();
				expect(typeof ENDPOINT_IDS[chain]).toBe('number');
			}
		});

		it('should have unique endpoint IDs', () => {
			const eids = Object.values(ENDPOINT_IDS);
			const uniqueEids = new Set(eids);
			expect(uniqueEids.size).toBe(eids.length);
		});
	});

	describe('MESSAGE_STATUSES', () => {
		it('should have all required statuses', () => {
			expect(MESSAGE_STATUSES.INFLIGHT).toBe('INFLIGHT');
			expect(MESSAGE_STATUSES.DELIVERED).toBe('DELIVERED');
			expect(MESSAGE_STATUSES.FAILED).toBe('FAILED');
			expect(MESSAGE_STATUSES.BLOCKED).toBe('BLOCKED');
			expect(MESSAGE_STATUSES.STORED).toBe('STORED');
		});
	});

	describe('DVN_PROVIDERS_LIST', () => {
		it('should include LayerZero Labs DVN', () => {
			expect(DVN_PROVIDERS_LIST).toContain('LayerZero Labs');
		});

		it('should have multiple DVN providers', () => {
			expect(DVN_PROVIDERS_LIST.length).toBeGreaterThan(1);
		});
	});

	describe('EXECUTOR_PROVIDERS_LIST', () => {
		it('should include LayerZero Labs executor', () => {
			expect(EXECUTOR_PROVIDERS_LIST).toContain('LayerZero Labs');
		});
	});

	describe('CHAIN_OPTIONS', () => {
		it('should be an array of options', () => {
			expect(Array.isArray(CHAIN_OPTIONS)).toBe(true);
			expect(CHAIN_OPTIONS.length).toBeGreaterThan(0);
		});

		it('should have name and value for each option', () => {
			for (const option of CHAIN_OPTIONS) {
				expect(option).toHaveProperty('name');
				expect(option).toHaveProperty('value');
			}
		});

		it('should include ethereum', () => {
			const ethereum = CHAIN_OPTIONS.find(c => c.value === 'ethereum');
			expect(ethereum).toBeDefined();
			expect(ethereum?.name).toBe('Ethereum');
		});
	});

	describe('LICENSING_NOTICE', () => {
		it('should contain Velocity BPA', () => {
			expect(LICENSING_NOTICE).toContain('Velocity BPA');
		});

		it('should contain BSL 1.1 reference', () => {
			expect(LICENSING_NOTICE).toContain('Business Source License 1.1');
		});

		it('should contain contact information', () => {
			expect(LICENSING_NOTICE).toContain('licensing@velobpa.com');
		});
	});
});

describe('LayerZero Utils', () => {
	describe('isValidEvmAddress', () => {
		it('should validate correct EVM addresses', () => {
			expect(isValidEvmAddress('0x1234567890123456789012345678901234567890')).toBe(true);
			expect(isValidEvmAddress('0xabcdef1234567890abcdef1234567890abcdef12')).toBe(true);
		});

		it('should reject invalid EVM addresses', () => {
			expect(isValidEvmAddress('0x123')).toBe(false);
			expect(isValidEvmAddress('invalid')).toBe(false);
			expect(isValidEvmAddress('')).toBe(false);
			expect(isValidEvmAddress('1234567890123456789012345678901234567890')).toBe(false);
		});

		it('should handle mixed case addresses', () => {
			expect(isValidEvmAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(true);
		});
	});

	describe('isValidSolanaAddress', () => {
		it('should validate correct Solana addresses', () => {
			// Typical Solana address length is 32-44 chars
			expect(isValidSolanaAddress('So11111111111111111111111111111111111111112')).toBe(true);
		});

		it('should reject invalid Solana addresses', () => {
			expect(isValidSolanaAddress('')).toBe(false);
			expect(isValidSolanaAddress('short')).toBe(false);
			expect(isValidSolanaAddress('0x1234567890123456789012345678901234567890')).toBe(false);
		});
	});

	describe('formatTokenAmount', () => {
		it('should format token amounts correctly', () => {
			expect(formatTokenAmount(1000000000000000000n, 18)).toBe('1.0');
			expect(formatTokenAmount(1500000000000000000n, 18)).toBe('1.5');
			expect(formatTokenAmount(1000000n, 6)).toBe('1.0');
		});

		it('should handle zero', () => {
			expect(formatTokenAmount(0n, 18)).toBe('0.0');
		});

		it('should handle large numbers', () => {
			const result = formatTokenAmount(1000000000000000000000n, 18);
			expect(parseFloat(result)).toBe(1000);
		});
	});

	describe('parseTokenAmount', () => {
		it('should parse token amounts correctly', () => {
			expect(parseTokenAmount('1', 18)).toBe(1000000000000000000n);
			expect(parseTokenAmount('1.5', 18)).toBe(1500000000000000000n);
			expect(parseTokenAmount('1', 6)).toBe(1000000n);
		});

		it('should handle zero', () => {
			expect(parseTokenAmount('0', 18)).toBe(0n);
		});
	});

	describe('calculateSlippage', () => {
		it('should calculate slippage correctly', () => {
			expect(calculateSlippage(1000n, 50)).toBe(995n); // 0.5% slippage (50 bps)
			expect(calculateSlippage(1000n, 100)).toBe(990n); // 1% slippage (100 bps)
			expect(calculateSlippage(10000n, 10)).toBe(9990n); // 0.1% slippage (10 bps)
		});

		it('should handle zero slippage', () => {
			expect(calculateSlippage(1000n, 0)).toBe(1000n);
		});
	});

	describe('buildMessageOptions', () => {
		it('should build TYPE_1 options', () => {
			const options = buildMessageOptions({
				optionType: 1,
				gasLimit: 200000,
			});
			expect(options).toBeDefined();
			expect(typeof options).toBe('string');
			expect(options.startsWith('0x')).toBe(true);
		});

		it('should build TYPE_2 options with native drop', () => {
			const options = buildMessageOptions({
				optionType: 2,
				gasLimit: 200000,
				nativeDropAmount: '1000000000000000000',
				nativeDropReceiver: '0x1234567890123456789012345678901234567890',
			});
			expect(options).toBeDefined();
			expect(typeof options).toBe('string');
		});

		it('should default to TYPE_2 if no type specified', () => {
			const options = buildMessageOptions({ gasLimit: 200000 });
			expect(options).toBeDefined();
		});

		it('should return V2 options', () => {
			const options = buildV2Options(200000);
			expect(options).toBeDefined();
			expect(options.startsWith('0x')).toBe(true);
		});
	});
});
