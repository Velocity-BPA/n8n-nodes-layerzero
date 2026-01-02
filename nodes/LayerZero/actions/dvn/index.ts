/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as metadataApi from '../../transport/metadataApi';
import { ENDPOINT_IDS, CHAIN_OPTIONS, DVN_PROVIDERS } from '../../constants';

export const dvnOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['dvn'],
			},
		},
		options: [
			{
				name: 'Get DVN Providers',
				value: 'getDvnProviders',
				description: 'List all available DVN providers',
				action: 'Get DVN providers',
			},
			{
				name: 'Get DVN by Chain',
				value: 'getDvnByChain',
				description: 'Get DVNs deployed on a chain',
				action: 'Get DVN by chain',
			},
			{
				name: 'Get DVN Info',
				value: 'getDvnInfo',
				description: 'Get DVN details and address',
				action: 'Get DVN info',
			},
			{
				name: 'Check DVN Support',
				value: 'checkDvnSupport',
				description: 'Check DVN pathway availability',
				action: 'Check DVN support',
			},
			{
				name: 'Get Security Stack',
				value: 'getSecurityStack',
				description: "Get OApp's configured DVNs",
				action: 'Get security stack',
			},
		],
		default: 'getDvnProviders',
	},
];

export const dvnFields: INodeProperties[] = [
	// Get DVN by Chain
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['dvn'],
				operation: ['getDvnByChain', 'getDvnInfo'],
			},
		},
		description: 'The chain to query DVNs for',
	},

	// Get DVN Info
	{
		displayName: 'DVN Provider',
		name: 'dvnProvider',
		type: 'options',
		options: Object.entries(DVN_PROVIDERS).map(([key, value]) => ({
			name: value,
			value: key,
		})),
		default: 'LAYERZERO_LABS',
		displayOptions: {
			show: {
				resource: ['dvn'],
				operation: ['getDvnInfo'],
			},
		},
		description: 'The DVN provider to get info for',
	},

	// Check DVN Support
	{
		displayName: 'Source Chain',
		name: 'srcChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['dvn'],
				operation: ['checkDvnSupport'],
			},
		},
		description: 'The source chain',
	},
	{
		displayName: 'Destination Chain',
		name: 'dstChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'arbitrum',
		displayOptions: {
			show: {
				resource: ['dvn'],
				operation: ['checkDvnSupport'],
			},
		},
		description: 'The destination chain',
	},
	{
		displayName: 'DVN Provider',
		name: 'dvnProvider',
		type: 'options',
		options: Object.entries(DVN_PROVIDERS).map(([key, value]) => ({
			name: value,
			value: key,
		})),
		default: 'LAYERZERO_LABS',
		displayOptions: {
			show: {
				resource: ['dvn'],
				operation: ['checkDvnSupport'],
			},
		},
		description: 'The DVN provider to check',
	},

	// Get Security Stack
	{
		displayName: 'OApp Address',
		name: 'oappAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['dvn'],
				operation: ['getSecurityStack'],
			},
		},
		description: 'The OApp contract address',
	},
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['dvn'],
				operation: ['getSecurityStack'],
			},
		},
		description: 'The chain where the OApp is deployed',
	},
];

export async function executeDvn(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'getDvnProviders') {
			const providers = await metadataApi.getDvnProviders.call(this);

			for (const provider of providers) {
				returnData.push({ json: provider });
			}

			// If API returns empty, provide default list
			if (returnData.length === 0) {
				for (const [key, name] of Object.entries(DVN_PROVIDERS)) {
					returnData.push({
						json: {
							id: key,
							name,
							description: `${name} - Decentralized Verifier Network`,
						},
					});
				}
			}
		}

		else if (operation === 'getDvnByChain') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			const dvns = await metadataApi.getDvnsByChain.call(this, eid);

			for (const dvn of dvns) {
				returnData.push({ json: { chain, eid, ...dvn } });
			}
		}

		else if (operation === 'getDvnInfo') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const dvnProvider = this.getNodeParameter('dvnProvider', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			const contracts = await metadataApi.getContractAddresses.call(this, eid);
			const dvnAddress = contracts.dvn[dvnProvider] || contracts.dvn['default'];

			returnData.push({
				json: {
					chain,
					eid,
					provider: DVN_PROVIDERS[dvnProvider as keyof typeof DVN_PROVIDERS],
					address: dvnAddress,
					allDvns: contracts.dvn,
				},
			});
		}

		else if (operation === 'checkDvnSupport') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const dvnProvider = this.getNodeParameter('dvnProvider', itemIndex) as string;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];

			const config = await metadataApi.getDefaultConfig.call(this, srcEid, dstEid);

			const isSupported = config.requiredDvns.some(
				(dvn) => dvn.toLowerCase().includes(dvnProvider.toLowerCase()),
			);

			returnData.push({
				json: {
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					dvnProvider: DVN_PROVIDERS[dvnProvider as keyof typeof DVN_PROVIDERS],
					supported: isSupported || config.requiredDvns.length > 0,
					requiredDvns: config.requiredDvns,
					optionalDvns: config.optionalDvns,
				},
			});
		}

		else if (operation === 'getSecurityStack') {
			const oappAddress = this.getNodeParameter('oappAddress', itemIndex) as string;
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			// Get default config as a proxy for OApp security stack
			const chainInfo = await metadataApi.getChainByEid.call(this, eid);
			const contracts = await metadataApi.getContractAddresses.call(this, eid);

			returnData.push({
				json: {
					oappAddress,
					chain,
					eid,
					endpoint: chainInfo?.endpointAddress || contracts.endpoint,
					dvns: contracts.dvn,
					note: 'Query OApp contract directly for specific DVN configuration',
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
