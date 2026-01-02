/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as metadataApi from '../../transport/metadataApi';
import { ENDPOINT_IDS, CHAIN_OPTIONS } from '../../constants';

export const endpointMetadataOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['endpointMetadata'],
			},
		},
		options: [
			{
				name: 'Get All Chains',
				value: 'getAllChains',
				description: 'Get list of all supported chains',
				action: 'Get all chains',
			},
			{
				name: 'Get Chain Info',
				value: 'getChainInfo',
				description: 'Get chain configuration details',
				action: 'Get chain info',
			},
			{
				name: 'Get Contract Addresses',
				value: 'getContractAddresses',
				description: 'Get deployed contract addresses',
				action: 'Get contract addresses',
			},
			{
				name: 'Get Token List',
				value: 'getTokenList',
				description: 'Get known tokens on chain',
				action: 'Get token list',
			},
			{
				name: 'Get Explorer Links',
				value: 'getExplorerLinks',
				description: 'Get block explorer URLs',
				action: 'Get explorer links',
			},
			{
				name: 'Get RPC Endpoints',
				value: 'getRpcEndpoints',
				description: 'Get public RPC URLs',
				action: 'Get RPC endpoints',
			},
		],
		default: 'getAllChains',
	},
];

export const endpointMetadataFields: INodeProperties[] = [
	// Network filter
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		options: [
			{ name: 'All', value: '' },
			{ name: 'Mainnet', value: 'mainnet' },
			{ name: 'Testnet', value: 'testnet' },
		],
		default: 'mainnet',
		displayOptions: {
			show: {
				resource: ['endpointMetadata'],
				operation: ['getAllChains', 'getTokenList'],
			},
		},
		description: 'Filter by network type',
	},

	// Chain selection
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['endpointMetadata'],
				operation: ['getChainInfo', 'getContractAddresses', 'getTokenList', 'getExplorerLinks', 'getRpcEndpoints'],
			},
		},
		description: 'The chain to query',
	},

	// Token type filter
	{
		displayName: 'Token Type',
		name: 'tokenType',
		type: 'options',
		options: [
			{ name: 'All', value: '' },
			{ name: 'OFT', value: 'oft' },
			{ name: 'ONFT', value: 'onft' },
			{ name: 'Native', value: 'native' },
		],
		default: '',
		displayOptions: {
			show: {
				resource: ['endpointMetadata'],
				operation: ['getTokenList'],
			},
		},
		description: 'Filter by token type',
	},
];

// Block explorer URLs
const BLOCK_EXPLORERS: { [key: string]: { name: string; url: string; apiUrl?: string } } = {
	ethereum: { name: 'Etherscan', url: 'https://etherscan.io', apiUrl: 'https://api.etherscan.io' },
	arbitrum: { name: 'Arbiscan', url: 'https://arbiscan.io', apiUrl: 'https://api.arbiscan.io' },
	optimism: { name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' },
	polygon: { name: 'Polygonscan', url: 'https://polygonscan.com' },
	base: { name: 'Basescan', url: 'https://basescan.org' },
	avalanche: { name: 'Snowtrace', url: 'https://snowtrace.io' },
	bsc: { name: 'BscScan', url: 'https://bscscan.com' },
	fantom: { name: 'FTMScan', url: 'https://ftmscan.com' },
	linea: { name: 'Lineascan', url: 'https://lineascan.build' },
	scroll: { name: 'Scrollscan', url: 'https://scrollscan.com' },
	zksync: { name: 'zkSync Era Explorer', url: 'https://explorer.zksync.io' },
	mantle: { name: 'Mantle Explorer', url: 'https://explorer.mantle.xyz' },
	blast: { name: 'Blastscan', url: 'https://blastscan.io' },
};

// Public RPC endpoints
const PUBLIC_RPCS: { [key: string]: string[] } = {
	ethereum: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'],
	arbitrum: ['https://arb1.arbitrum.io/rpc', 'https://rpc.ankr.com/arbitrum'],
	optimism: ['https://mainnet.optimism.io', 'https://rpc.ankr.com/optimism'],
	polygon: ['https://polygon-rpc.com', 'https://rpc.ankr.com/polygon'],
	base: ['https://mainnet.base.org', 'https://rpc.ankr.com/base'],
	avalanche: ['https://api.avax.network/ext/bc/C/rpc', 'https://rpc.ankr.com/avalanche'],
	bsc: ['https://bsc-dataseed.binance.org', 'https://rpc.ankr.com/bsc'],
	fantom: ['https://rpc.ftm.tools', 'https://rpc.ankr.com/fantom'],
	linea: ['https://rpc.linea.build'],
	scroll: ['https://rpc.scroll.io'],
	zksync: ['https://mainnet.era.zksync.io'],
	mantle: ['https://rpc.mantle.xyz'],
	blast: ['https://rpc.blast.io'],
};

export async function executeEndpointMetadata(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'getAllChains') {
			const network = this.getNodeParameter('network', itemIndex) as string;
			const chains = await metadataApi.getAllChains.call(this, network as 'mainnet' | 'testnet' | undefined);

			for (const chain of chains) {
				returnData.push({ json: chain });
			}
		} else if (operation === 'getChainInfo') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];
			const chainInfo = await metadataApi.getChainByEid.call(this, eid);

			returnData.push({
				json: {
					chain,
					eid,
					...chainInfo,
					explorer: BLOCK_EXPLORERS[chain] || null,
					publicRpcs: PUBLIC_RPCS[chain] || [],
				},
			});
		} else if (operation === 'getContractAddresses') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];
			const contracts = await metadataApi.getContractAddresses.call(this, eid);

			returnData.push({
				json: {
					chain,
					eid,
					...contracts,
				},
			});
		} else if (operation === 'getTokenList') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const network = this.getNodeParameter('network', itemIndex) as string;
			const tokenType = this.getNodeParameter('tokenType', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			// Token list would typically come from metadata API
			returnData.push({
				json: {
					chain,
					eid,
					network: network || 'mainnet',
					tokenType: tokenType || 'all',
					tokens: [],
					message: 'Token list requires metadata API integration',
				},
			});
		} else if (operation === 'getExplorerLinks') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const explorer = BLOCK_EXPLORERS[chain];

			if (explorer) {
				returnData.push({
					json: {
						chain,
						...explorer,
						addressTemplate: `${explorer.url}/address/{address}`,
						txTemplate: `${explorer.url}/tx/{hash}`,
						blockTemplate: `${explorer.url}/block/{block}`,
						tokenTemplate: `${explorer.url}/token/{address}`,
					},
				});
			} else {
				returnData.push({
					json: {
						chain,
						message: `No explorer configured for ${chain}`,
					},
				});
			}
		} else if (operation === 'getRpcEndpoints') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const rpcs = PUBLIC_RPCS[chain] || [];

			returnData.push({
				json: {
					chain,
					publicRpcs: rpcs,
					recommendedRpc: rpcs[0] || null,
					note: 'Public RPCs may have rate limits. Use private RPC for production.',
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
