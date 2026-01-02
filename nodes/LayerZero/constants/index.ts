/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * LayerZero API Base URLs
 */
export const API_URLS = {
	SCAN_MAINNET: 'https://scan.layerzero-api.com/v1',
	SCAN_TESTNET: 'https://scan-testnet.layerzero-api.com/v1',
	OFT_API: 'https://oft.layerzero-api.com/v1',
	METADATA_API: 'https://metadata.layerzero-api.com/v1',
} as const;

/**
 * LayerZero V2 Endpoint IDs (EIDs)
 * These are the official endpoint identifiers for LayerZero V2
 */
export const ENDPOINT_IDS: Record<string, number> = {
	// Mainnet EVM
	ethereum: 30101,
	arbitrum: 30110,
	optimism: 30111,
	polygon: 30109,
	base: 30184,
	avalanche: 30106,
	bsc: 30102,
	fantom: 30112,
	linea: 30183,
	scroll: 30214,
	zksync: 30165,
	'polygon-zkevm': 30158,
	mantle: 30181,
	blast: 30243,
	metis: 30151,
	celo: 30125,
	gnosis: 30145,
	moonbeam: 30126,
	moonriver: 30127,
	harmony: 30116,
	kava: 30177,
	klaytn: 30150,
	coreDao: 30153,
	fuse: 30138,
	aurora: 30211,
	okx: 30155,
	opbnb: 30202,
	mode: 30260,
	sei: 30280,
	taiko: 30290,
	fraxtal: 30255,
	merlin: 30275,
	xlayer: 30294,
	
	// Non-EVM
	solana: 30168,
	aptos: 30108,
	tron: 30420,
	
	// Testnet EVM
	'ethereum-sepolia': 40161,
	'arbitrum-sepolia': 40231,
	'optimism-sepolia': 40232,
	'polygon-amoy': 40267,
	'base-sepolia': 40245,
	'avalanche-fuji': 40106,
	'bsc-testnet': 40102,
	'fantom-testnet': 40112,
	'linea-sepolia': 40287,
	'scroll-sepolia': 40270,
	'zksync-sepolia': 40305,
	
	// Testnet Non-EVM
	'solana-testnet': 40168,
	'aptos-testnet': 40108,
} as const;

/**
 * Chain name to display name mapping
 */
export const CHAIN_DISPLAY_NAMES: Record<string, string> = {
	ethereum: 'Ethereum',
	arbitrum: 'Arbitrum',
	optimism: 'Optimism',
	polygon: 'Polygon',
	base: 'Base',
	avalanche: 'Avalanche',
	bsc: 'BNB Chain',
	fantom: 'Fantom',
	linea: 'Linea',
	scroll: 'Scroll',
	zksync: 'zkSync Era',
	'polygon-zkevm': 'Polygon zkEVM',
	mantle: 'Mantle',
	blast: 'Blast',
	metis: 'Metis',
	celo: 'Celo',
	gnosis: 'Gnosis',
	moonbeam: 'Moonbeam',
	moonriver: 'Moonriver',
	harmony: 'Harmony',
	kava: 'Kava',
	klaytn: 'Klaytn',
	coreDao: 'Core DAO',
	fuse: 'Fuse',
	aurora: 'Aurora',
	okx: 'OKX Chain',
	opbnb: 'opBNB',
	mode: 'Mode',
	sei: 'Sei',
	taiko: 'Taiko',
	fraxtal: 'Fraxtal',
	merlin: 'Merlin',
	xlayer: 'X Layer',
	solana: 'Solana',
	aptos: 'Aptos',
	tron: 'Tron',
} as const;

/**
 * Message status values
 */
export const MESSAGE_STATUS = {
	INFLIGHT: 'INFLIGHT',
	DELIVERED: 'DELIVERED',
	FAILED: 'FAILED',
	BLOCKED: 'BLOCKED',
	STORED: 'STORED',
} as const;

/**
 * Default DVN providers
 */
export const DVN_PROVIDERS = {
	LAYERZERO_LABS: 'LayerZero Labs',
	GOOGLE_CLOUD: 'Google Cloud',
	POLYHEDRA: 'Polyhedra',
	ANIMOCA: 'Animoca Brands',
	HORIZEN: 'Horizen Labs',
	NETHERMIND: 'Nethermind',
	STARGATE: 'Stargate',
	HASH_KEY: 'HashKey',
} as const;

/**
 * Executor providers
 */
export const EXECUTOR_PROVIDERS = {
	LAYERZERO_LABS: 'LayerZero Labs',
	STARGATE: 'Stargate',
} as const;

/**
 * OFT Standard types
 */
export const OFT_TYPES = {
	OFT: 'OFT',
	OFT_ADAPTER: 'OFTAdapter',
	OFT_FEE: 'OFTFee',
} as const;

/**
 * ONFT Standard types
 */
export const ONFT_TYPES = {
	ONFT721: 'ONFT721',
	ONFT721_ADAPTER: 'ONFT721Adapter',
	ONFT1155: 'ONFT1155',
} as const;

/**
 * Chain options for dropdowns
 */
export const CHAIN_OPTIONS = Object.entries(CHAIN_DISPLAY_NAMES).map(([value, name]) => ({
	name,
	value,
}));

/**
 * Resource categories
 */
export const RESOURCES = {
	MESSAGE_TRACKING: 'messageTracking',
	OFT_TRANSFERS: 'oftTransfers',
	ONFT_OPERATIONS: 'onftOperations',
	ENDPOINT_OPERATIONS: 'endpointOperations',
	DVN: 'dvn',
	EXECUTOR: 'executor',
	FEE_ESTIMATION: 'feeEstimation',
	OAPP_CONFIGURATION: 'oappConfiguration',
	MESSAGE_OPTIONS: 'messageOptions',
	ZRO_TOKEN: 'zroToken',
	PROTOCOL_ANALYTICS: 'protocolAnalytics',
	ENDPOINT_METADATA: 'endpointMetadata',
	COMPOSE_MESSAGES: 'composeMessages',
	PATHWAY_CONFIGURATION: 'pathwayConfiguration',
	TRANSACTION_BUILDING: 'transactionBuilding',
	UTILITY: 'utility',
} as const;

/**
 * Default gas limits per chain type
 */
export const DEFAULT_GAS_LIMITS: Record<string, number> = {
	ethereum: 200000,
	arbitrum: 1000000,
	optimism: 200000,
	polygon: 200000,
	base: 200000,
	avalanche: 200000,
	bsc: 200000,
	fantom: 200000,
	linea: 200000,
	scroll: 200000,
	zksync: 1000000,
	default: 200000,
} as const;

/**
 * Default block confirmations per chain
 */
export const DEFAULT_BLOCK_CONFIRMATIONS: Record<string, number> = {
	ethereum: 15,
	arbitrum: 20,
	optimism: 20,
	polygon: 256,
	base: 20,
	avalanche: 20,
	bsc: 20,
	fantom: 20,
	linea: 20,
	scroll: 20,
	zksync: 20,
	solana: 32,
	aptos: 10,
	default: 15,
} as const;

/**
 * Message library versions
 */
export const MESSAGE_LIBRARY_VERSIONS = {
	V1: 'v1',
	V2: 'v2',
} as const;

/**
 * Alias for MESSAGE_STATUS (for compatibility)
 */
export const MESSAGE_STATUSES = MESSAGE_STATUS;

/**
 * DVN Providers as array (for iteration)
 */
export const DVN_PROVIDERS_LIST = Object.values(DVN_PROVIDERS);

/**
 * Executor Providers as array (for iteration)
 */
export const EXECUTOR_PROVIDERS_LIST = Object.values(EXECUTOR_PROVIDERS);

/**
 * Licensing notice for runtime logging
 */
export const LICENSING_NOTICE = `[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`;
