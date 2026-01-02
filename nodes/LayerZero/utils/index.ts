/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';

/**
 * Option types for LayerZero V2 message options
 */
export const OPTION_TYPES = {
	TYPE_1: 1, // Legacy V1 compatible
	TYPE_2: 2, // V2 default
	TYPE_3: 3, // Extended options
} as const;

/**
 * Worker IDs for options
 */
export const WORKER_IDS = {
	EXECUTOR: 1,
	DVN: 2,
} as const;

/**
 * Build executor options
 */
export function buildExecutorOptions(
	gasLimit: number,
	nativeDropAmount: bigint = 0n,
	nativeDropAddress: string = ethers.ZeroAddress,
): string {
	const options = ethers.AbiCoder.defaultAbiCoder().encode(
		['uint128', 'uint128', 'address'],
		[gasLimit, nativeDropAmount, nativeDropAddress],
	);

	// Option header: type (1 byte) + worker id (1 byte) + data length (2 bytes)
	const header = ethers.solidityPacked(
		['uint8', 'uint8', 'uint16'],
		[OPTION_TYPES.TYPE_3, WORKER_IDS.EXECUTOR, options.length - 2],
	);

	return ethers.concat([header, options]);
}

/**
 * Build native drop option for gas airdrop on destination
 */
export function buildNativeDropOption(
	amount: bigint,
	receiver: string,
): string {
	const data = ethers.AbiCoder.defaultAbiCoder().encode(
		['uint128', 'address'],
		[amount, receiver],
	);

	const header = ethers.solidityPacked(
		['uint8', 'uint8', 'uint16'],
		[OPTION_TYPES.TYPE_3, WORKER_IDS.EXECUTOR, data.length - 2],
	);

	return ethers.concat([header, data]);
}

/**
 * Build compose message option
 */
export function buildComposeOption(
	index: number,
	gasLimit: number,
	value: bigint = 0n,
): string {
	const data = ethers.AbiCoder.defaultAbiCoder().encode(
		['uint16', 'uint128', 'uint128'],
		[index, gasLimit, value],
	);

	const header = ethers.solidityPacked(
		['uint8', 'uint8', 'uint16'],
		[OPTION_TYPES.TYPE_3, WORKER_IDS.EXECUTOR, data.length - 2],
	);

	return ethers.concat([header, data]);
}

/**
 * Build V2 options with gas limit
 */
export function buildV2Options(gasLimit: number): string {
	return ethers.solidityPacked(
		['uint16', 'uint256'],
		[OPTION_TYPES.TYPE_2, gasLimit],
	);
}

/**
 * Combine multiple options
 */
export function combineOptions(options: string[]): string {
	return ethers.concat(options);
}

/**
 * Decode options
 */
export function decodeOptions(options: string): {
	type: number;
	workerId: number;
	data: string;
}[] {
	const result: { type: number; workerId: number; data: string }[] = [];
	let offset = 0;
	const bytes = ethers.getBytes(options);

	while (offset < bytes.length) {
		const type = bytes[offset];
		const workerId = bytes[offset + 1];
		const length = (bytes[offset + 2] << 8) + bytes[offset + 3];

		const data = ethers.hexlify(bytes.slice(offset + 4, offset + 4 + length));

		result.push({ type, workerId, data });
		offset += 4 + length;
	}

	return result;
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: bigint | string, decimals: number): string {
	return ethers.formatUnits(amount, decimals);
}

/**
 * Parse token amount from user input
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
	return ethers.parseUnits(amount, decimals);
}

/**
 * Format address for display (truncated)
 */
export function formatAddress(address: string, chars: number = 6): string {
	if (address.length <= chars * 2 + 2) return address;
	return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Validate hex string
 */
export function isValidHex(value: string): boolean {
	return /^0x[0-9a-fA-F]*$/.test(value);
}

/**
 * Convert to checksum address
 */
export function toChecksumAddress(address: string): string {
	try {
		return ethers.getAddress(address);
	} catch {
		return address;
	}
}

/**
 * Calculate slippage amount
 */
export function calculateSlippage(amount: bigint, slippageBps: number): bigint {
	return amount - (amount * BigInt(slippageBps)) / 10000n;
}

/**
 * Convert wei to ether
 */
export function weiToEther(wei: bigint | string): string {
	return ethers.formatEther(wei);
}

/**
 * Convert ether to wei
 */
export function etherToWei(ether: string): bigint {
	return ethers.parseEther(ether);
}

/**
 * Generate unique ID
 */
export function generateUniqueId(): string {
	return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 1000,
): Promise<T> {
	let lastError: Error | undefined;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;
			if (i < maxRetries - 1) {
				await sleep(baseDelay * Math.pow(2, i));
			}
		}
	}

	throw lastError;
}

/**
 * Parse chain from EID or name
 */
export function normalizeChainIdentifier(input: string | number): { eid: number; name: string } | null {
	const { ENDPOINT_IDS, CHAIN_DISPLAY_NAMES } = require('../constants');

	if (typeof input === 'number') {
		const name = Object.entries(ENDPOINT_IDS).find(([_, eid]) => eid === input)?.[0];
		if (name) return { eid: input, name };
		return null;
	}

	const eid = ENDPOINT_IDS[input.toLowerCase()];
	if (eid) return { eid, name: input.toLowerCase() };

	// Try to find by display name
	const entry = Object.entries(CHAIN_DISPLAY_NAMES).find(
		([_, displayName]) => (displayName as string).toLowerCase() === input.toLowerCase(),
	);
	if (entry) {
		const chainName = entry[0];
		return { eid: ENDPOINT_IDS[chainName], name: chainName };
	}

	return null;
}

/**
 * Build transaction URL
 */
export function buildExplorerTxUrl(explorer: string, txHash: string): string {
	const base = explorer.endsWith('/') ? explorer.slice(0, -1) : explorer;
	return `${base}/tx/${txHash}`;
}

/**
 * Build address URL
 */
export function buildExplorerAddressUrl(explorer: string, address: string): string {
	const base = explorer.endsWith('/') ? explorer.slice(0, -1) : explorer;
	return `${base}/address/${address}`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: bigint, total: bigint): number {
	if (total === 0n) return 0;
	return Number((value * 10000n) / total) / 100;
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
	try {
		return JSON.parse(json);
	} catch {
		return defaultValue;
	}
}

/**
 * Truncate string
 */
export function truncateString(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return str.slice(0, maxLength - 3) + '...';
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if value is empty
 */
export function isEmpty(value: unknown): boolean {
	if (value === null || value === undefined) return true;
	if (typeof value === 'string') return value.trim() === '';
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === 'object') return Object.keys(value).length === 0;
	return false;
}

/**
 * Validate EVM address
 */
export function isValidEvmAddress(address: string): boolean {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate Solana address (Base58, 32-44 chars)
 */
export function isValidSolanaAddress(address: string): boolean {
	return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Alias for retryWithBackoff
 */
export const retry = retryWithBackoff;

/**
 * Build message options (unified builder)
 */
export interface MessageOptionsParams {
	optionType?: number;
	gasLimit: number;
	nativeDropAmount?: string;
	nativeDropReceiver?: string;
	msgType?: number;
	nativeValue?: string | bigint;
}

export function buildMessageOptions(params: MessageOptionsParams): string {
	const { optionType = OPTION_TYPES.TYPE_1, gasLimit, nativeDropAmount, nativeDropReceiver } = params;

	if (optionType === OPTION_TYPES.TYPE_1 || !nativeDropAmount || !nativeDropReceiver) {
		return buildV2Options(gasLimit);
	}

	const executorOpts = buildExecutorOptions(
		gasLimit,
		BigInt(nativeDropAmount),
		nativeDropReceiver,
	);

	return executorOpts;
}

/**
 * Build executor lzReceive option
 */
export function buildExecutorLzReceiveOption(gasLimit: number, value: bigint = 0n): string {
	const data = ethers.AbiCoder.defaultAbiCoder().encode(
		['uint128', 'uint128'],
		[gasLimit, value],
	);

	const header = ethers.solidityPacked(
		['uint8', 'uint8', 'uint16'],
		[OPTION_TYPES.TYPE_3, WORKER_IDS.EXECUTOR, data.length - 2],
	);

	return ethers.concat([header, data]);
}

/**
 * Encode options to hex string
 * Can accept either an array of options or individual parameters
 */
export function encodeOptions(gasLimitOrOptions: number | string[], msgType?: number): string {
	// If first argument is an array, combine them
	if (Array.isArray(gasLimitOrOptions)) {
		return ethers.concat(gasLimitOrOptions);
	}
	
	// Otherwise build options from parameters
	const gasLimit = gasLimitOrOptions;
	return buildV2Options(gasLimit);
}
