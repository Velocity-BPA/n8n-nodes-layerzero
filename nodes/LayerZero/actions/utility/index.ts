/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as metadataApi from '../../transport/metadataApi';
import * as scanApi from '../../transport/scanApi';
import { ENDPOINT_IDS, CHAIN_OPTIONS } from '../../constants';
import { isValidEvmAddress, isValidSolanaAddress, retry } from '../../utils';

export const utilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Get API Status',
				value: 'getApiStatus',
				description: 'Check health status of LayerZero APIs',
				action: 'Get API status',
			},
			{
				name: 'Get Supported Chains',
				value: 'getSupportedChains',
				description: 'Get full list of supported chains',
				action: 'Get supported chains',
			},
			{
				name: 'Convert EID to Chain',
				value: 'eidToChain',
				description: 'Convert endpoint ID to chain name',
				action: 'Convert EID to chain',
			},
			{
				name: 'Convert Chain to EID',
				value: 'chainToEid',
				description: 'Convert chain name to endpoint ID',
				action: 'Convert chain to EID',
			},
			{
				name: 'Validate Address',
				value: 'validateAddress',
				description: 'Validate address format for a chain',
				action: 'Validate address',
			},
			{
				name: 'Get Protocol Version',
				value: 'getProtocolVersion',
				description: 'Get LayerZero protocol version info',
				action: 'Get protocol version',
			},
		],
		default: 'getApiStatus',
	},
];

export const utilityFields: INodeProperties[] = [
	// EID for conversion
	{
		displayName: 'Endpoint ID (EID)',
		name: 'eid',
		type: 'number',
		required: true,
		default: 30101,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['eidToChain'],
			},
		},
		description: 'The endpoint ID to convert to chain name',
	},

	// Chain for conversion
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['chainToEid'],
			},
		},
		description: 'The chain name to convert to EID',
	},

	// Address validation
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateAddress'],
			},
		},
		description: 'The address to validate',
		placeholder: '0x...',
	},
	{
		displayName: 'Chain Type',
		name: 'chainType',
		type: 'options',
		options: [
			{ name: 'EVM (Ethereum, Arbitrum, etc.)', value: 'evm' },
			{ name: 'Solana', value: 'solana' },
			{ name: 'Aptos', value: 'aptos' },
		],
		required: true,
		default: 'evm',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateAddress'],
			},
		},
		description: 'The type of chain for address validation',
	},

	// Network filter for getSupportedChains
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		options: [
			{ name: 'All', value: '' },
			{ name: 'Mainnet', value: 'mainnet' },
			{ name: 'Testnet', value: 'testnet' },
		],
		default: '',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getSupportedChains'],
			},
		},
		description: 'Filter by network type',
	},
];

// Reverse lookup for EID to chain
const EID_TO_CHAIN: { [eid: number]: string } = {};
for (const [chain, eid] of Object.entries(ENDPOINT_IDS)) {
	EID_TO_CHAIN[eid] = chain;
}

export async function executeUtility(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'getApiStatus') {
			// Check all API endpoints
			const apiStatuses: Record<string, { status: string; latency?: number }> = {};

			// Check Scan API
			const scanStart = Date.now();
			try {
				await retry(async () => scanApi.getLatestMessages.call(this, 1), 1, 3000);
				apiStatuses.scanApi = {
					status: 'healthy',
					latency: Date.now() - scanStart,
				};
			} catch {
				apiStatuses.scanApi = { status: 'unhealthy' };
			}

			// Check Metadata API
			const metaStart = Date.now();
			try {
				await retry(async () => metadataApi.getAllChains.call(this), 1, 3000);
				apiStatuses.metadataApi = {
					status: 'healthy',
					latency: Date.now() - metaStart,
				};
			} catch {
				apiStatuses.metadataApi = { status: 'unhealthy' };
			}

			returnData.push({
				json: {
					timestamp: new Date().toISOString(),
					apis: apiStatuses,
					overallStatus: Object.values(apiStatuses).every((s) => s.status === 'healthy')
						? 'healthy'
						: 'degraded',
				},
			});
		}

		else if (operation === 'getSupportedChains') {
			const network = this.getNodeParameter('network', itemIndex) as string;

			// Get chains from metadata API
			const chains = await metadataApi.getAllChains.call(this);

			// Also add local EID mappings
			const allChains = chains.map((chain: { eid: number; chainName: string; network?: string }) => ({
				...chain,
				localEid: ENDPOINT_IDS[chain.chainName] || chain.eid,
			}));

			// Filter by network if specified
			const filtered = network
				? allChains.filter((c: { network?: string }) => c.network === network)
				: allChains;

			for (const chain of filtered) {
				returnData.push({ json: chain });
			}
		}

		else if (operation === 'eidToChain') {
			const eid = this.getNodeParameter('eid', itemIndex) as number;
			const chainName = EID_TO_CHAIN[eid];

			if (chainName) {
				// Get additional info from metadata API
				let chainInfo = {};
				try {
					chainInfo = await metadataApi.getChainByEid.call(this, eid);
				} catch {
					// Metadata might not be available for all chains
				}

				returnData.push({
					json: {
						eid,
						chainName,
						hexEid: '0x' + eid.toString(16).padStart(8, '0'),
						...chainInfo,
					},
				});
			} else {
				returnData.push({
					json: {
						eid,
						chainName: null,
						error: `Unknown endpoint ID: ${eid}`,
					},
				});
			}
		}

		else if (operation === 'chainToEid') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			if (eid !== undefined) {
				returnData.push({
					json: {
						chainName: chain,
						eid,
						hexEid: '0x' + eid.toString(16).padStart(8, '0'),
					},
				});
			} else {
				returnData.push({
					json: {
						chainName: chain,
						eid: null,
						error: `Unknown chain: ${chain}`,
					},
				});
			}
		}

		else if (operation === 'validateAddress') {
			const address = this.getNodeParameter('address', itemIndex) as string;
			const chainType = this.getNodeParameter('chainType', itemIndex) as string;

			let isValid = false;
			let format = '';
			let normalized = address;

			if (chainType === 'evm') {
				isValid = isValidEvmAddress(address);
				format = 'Ethereum/EVM (0x + 40 hex chars)';
				if (isValid) {
					normalized = address.toLowerCase();
				}
			} else if (chainType === 'solana') {
				isValid = isValidSolanaAddress(address);
				format = 'Solana (Base58, 32-44 chars)';
			} else if (chainType === 'aptos') {
				// Aptos uses 0x + 64 hex chars
				const aptosRegex = /^0x[a-fA-F0-9]{64}$/;
				isValid = aptosRegex.test(address);
				format = 'Aptos (0x + 64 hex chars)';
			}

			returnData.push({
				json: {
					address,
					chainType,
					isValid,
					format,
					normalized: isValid ? normalized : null,
				},
			});
		}

		else if (operation === 'getProtocolVersion') {
			// Get protocol version info
			const chains = await metadataApi.getAllChains.call(this);

			// Count V1 vs V2 deployments
			let v1Count = 0;
			let v2Count = 0;
			for (const chain of chains) {
				if ((chain as { version?: string }).version === 'v1') {
					v1Count++;
				} else {
					v2Count++;
				}
			}

			returnData.push({
				json: {
					currentVersion: 'V2',
					legacyVersion: 'V1',
					v2Deployments: v2Count,
					v1Deployments: v1Count,
					totalChains: chains.length,
					features: {
						horizontalComposability: true,
						executorSeparation: true,
						modularSecurity: true,
						messageLibraries: true,
						nativeDrop: true,
						composeMessages: true,
					},
					documentation: 'https://docs.layerzero.network/',
					github: 'https://github.com/LayerZero-Labs',
				},
			});
		}
	} catch (error) {
		if (this.continueOnFail()) {
			returnData.push({ json: { error: (error as Error).message } });
		} else {
			throw error;
		}
	}

	return returnData;
}
