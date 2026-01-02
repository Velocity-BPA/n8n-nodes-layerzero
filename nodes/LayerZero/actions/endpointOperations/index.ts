/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as metadataApi from '../../transport/metadataApi';
import { ENDPOINT_IDS, CHAIN_OPTIONS } from '../../constants';

export const endpointOperationsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['endpointOperations'],
			},
		},
		options: [
			{
				name: 'Get Endpoints',
				value: 'getEndpoints',
				description: 'List all LayerZero endpoints',
				action: 'Get endpoints',
			},
			{
				name: 'Get Endpoint by Chain',
				value: 'getEndpointByChain',
				description: 'Get endpoint for a specific chain',
				action: 'Get endpoint by chain',
			},
			{
				name: 'Get Endpoint ID (EID)',
				value: 'getEid',
				description: "Get chain's endpoint identifier",
				action: 'Get endpoint ID',
			},
			{
				name: 'Check Pathway Support',
				value: 'checkPathwaySupport',
				description: 'Verify chain-to-chain support',
				action: 'Check pathway support',
			},
			{
				name: 'Get Default Config',
				value: 'getDefaultConfig',
				description: 'Get default DVN/Executor config',
				action: 'Get default config',
			},
			{
				name: 'Get Message Libraries',
				value: 'getMessageLibraries',
				description: 'Get available message libraries',
				action: 'Get message libraries',
			},
		],
		default: 'getEndpoints',
	},
];

export const endpointOperationsFields: INodeProperties[] = [
	// Network filter for getEndpoints
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
				resource: ['endpointOperations'],
				operation: ['getEndpoints'],
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
				resource: ['endpointOperations'],
				operation: ['getEndpointByChain', 'getEid', 'getMessageLibraries'],
			},
		},
		description: 'The chain to query',
	},

	// Pathway check fields
	{
		displayName: 'Source Chain',
		name: 'srcChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['endpointOperations'],
				operation: ['checkPathwaySupport', 'getDefaultConfig'],
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
				resource: ['endpointOperations'],
				operation: ['checkPathwaySupport', 'getDefaultConfig'],
			},
		},
		description: 'The destination chain',
	},
];

export async function executeEndpointOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'getEndpoints') {
			const network = this.getNodeParameter('network', itemIndex) as string;
			const endpoints = await metadataApi.getEndpoints.call(
				this,
				network as 'mainnet' | 'testnet' | undefined,
			);

			for (const endpoint of endpoints) {
				returnData.push({ json: endpoint });
			}
		}

		else if (operation === 'getEndpointByChain') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			const chainInfo = await metadataApi.getChainByEid.call(this, eid);
			const contracts = await metadataApi.getContractAddresses.call(this, eid);

			returnData.push({
				json: {
					chain,
					eid,
					...chainInfo,
					contracts,
				},
			});
		}

		else if (operation === 'getEid') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			returnData.push({
				json: {
					chain,
					eid,
					hexEid: '0x' + eid.toString(16).padStart(8, '0'),
				},
			});
		}

		else if (operation === 'checkPathwaySupport') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];

			const pathway = await metadataApi.checkPathwaySupport.call(this, srcEid, dstEid);

			returnData.push({
				json: {
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					...pathway,
				},
			});
		}

		else if (operation === 'getDefaultConfig') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];

			const config = await metadataApi.getDefaultConfig.call(this, srcEid, dstEid);

			returnData.push({
				json: {
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					...config,
				},
			});
		}

		else if (operation === 'getMessageLibraries') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			const libraries = await metadataApi.getMessageLibraries.call(this, eid);

			for (const library of libraries) {
				returnData.push({ json: { chain, eid, ...library } });
			}
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
