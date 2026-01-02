/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as metadataApi from '../../transport/metadataApi';
import { ENDPOINT_IDS, CHAIN_OPTIONS } from '../../constants';

export const onftOperationsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['onftOperations'],
			},
		},
		options: [
			{
				name: 'Get ONFT Routes',
				value: 'getOnftRoutes',
				description: 'Get available ONFT transfer routes',
				action: 'Get ONFT routes',
			},
			{
				name: 'Get ONFT Info',
				value: 'getOnftInfo',
				description: 'Get ONFT collection details',
				action: 'Get ONFT info',
			},
			{
				name: 'Get Transfer Quote',
				value: 'getTransferQuote',
				description: 'Get fee estimation for ONFT transfer',
				action: 'Get transfer quote',
			},
			{
				name: 'Build ONFT Transfer',
				value: 'buildOnftTransfer',
				description: 'Generate ONFT transfer calldata',
				action: 'Build ONFT transfer',
			},
			{
				name: 'Get ONFT by Chain',
				value: 'getOnftByChain',
				description: 'Get ONFT collections on a chain',
				action: 'Get ONFT by chain',
			},
			{
				name: 'Get ONFT Metadata',
				value: 'getOnftMetadata',
				description: 'Get NFT metadata',
				action: 'Get ONFT metadata',
			},
		],
		default: 'getOnftRoutes',
	},
];

export const onftOperationsFields: INodeProperties[] = [
	// Get ONFT Routes
	{
		displayName: 'Source Chain',
		name: 'srcChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['onftOperations'],
				operation: ['getOnftRoutes'],
			},
		},
		description: 'Filter by source chain',
	},
	{
		displayName: 'Destination Chain',
		name: 'dstChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		default: '',
		displayOptions: {
			show: {
				resource: ['onftOperations'],
				operation: ['getOnftRoutes'],
			},
		},
		description: 'Filter by destination chain (optional)',
	},

	// Common ONFT fields
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['onftOperations'],
				operation: ['getOnftInfo', 'getOnftByChain', 'getOnftMetadata'],
			},
		},
		description: 'The chain where the ONFT is deployed',
	},
	{
		displayName: 'ONFT Address',
		name: 'onftAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['onftOperations'],
				operation: ['getOnftInfo', 'getOnftMetadata', 'getTransferQuote', 'buildOnftTransfer'],
			},
		},
		description: 'The ONFT contract address',
	},
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['onftOperations'],
				operation: ['getOnftMetadata', 'getTransferQuote', 'buildOnftTransfer'],
			},
		},
		description: 'The NFT token ID',
	},

	// Transfer fields
	{
		displayName: 'Source Chain',
		name: 'srcChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['onftOperations'],
				operation: ['getTransferQuote', 'buildOnftTransfer'],
			},
		},
		description: 'The source chain for the transfer',
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
				resource: ['onftOperations'],
				operation: ['getTransferQuote', 'buildOnftTransfer'],
			},
		},
		description: 'The destination chain for the transfer',
	},
	{
		displayName: 'Recipient Address',
		name: 'recipientAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['onftOperations'],
				operation: ['getTransferQuote', 'buildOnftTransfer'],
			},
		},
		description: 'The recipient address on destination chain',
	},
];

export async function executeOnftOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'getOnftRoutes') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;

			// Use metadata API to get pathway info
			const srcEid = srcChain ? ENDPOINT_IDS[srcChain] : 0;
			const dstEid = dstChain ? ENDPOINT_IDS[dstChain] : 0;

			if (srcEid && dstEid) {
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
			} else {
				// Return all supported chains if no specific pathway
				const chains = await metadataApi.getAllChains.call(this);
				for (const chain of chains) {
					returnData.push({ json: chain });
				}
			}
		}

		else if (operation === 'getOnftInfo') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const onftAddress = this.getNodeParameter('onftAddress', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			// Get contract addresses for chain
			const contracts = await metadataApi.getContractAddresses.call(this, eid);

			returnData.push({
				json: {
					chain,
					eid,
					onftAddress,
					endpoint: contracts.endpoint,
					sendLibrary: contracts.sendLibrary,
					receiveLibrary: contracts.receiveLibrary,
				},
			});
		}

		else if (operation === 'getTransferQuote') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const onftAddress = this.getNodeParameter('onftAddress', itemIndex) as string;
			const tokenId = this.getNodeParameter('tokenId', itemIndex) as string;
			const recipientAddress = this.getNodeParameter('recipientAddress', itemIndex) as string;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];

			// Get default config for fee estimation
			const config = await metadataApi.getDefaultConfig.call(this, srcEid, dstEid);

			returnData.push({
				json: {
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					onftAddress,
					tokenId,
					recipientAddress,
					estimatedGasLimit: '300000',
					dvns: config.requiredDvns,
					executor: config.executor,
					confirmations: config.confirmations,
				},
			});
		}

		else if (operation === 'buildOnftTransfer') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const onftAddress = this.getNodeParameter('onftAddress', itemIndex) as string;
			const tokenId = this.getNodeParameter('tokenId', itemIndex) as string;
			const recipientAddress = this.getNodeParameter('recipientAddress', itemIndex) as string;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];

			returnData.push({
				json: {
					to: onftAddress,
					srcEid,
					dstEid,
					tokenId,
					recipient: recipientAddress,
					method: 'send',
					note: 'Use quoteSend to get fees, then call send with the fee',
				},
			});
		}

		else if (operation === 'getOnftByChain') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			const chainInfo = await metadataApi.getChainByEid.call(this, eid);
			const tokens = await metadataApi.getTokenList.call(this, eid);

			returnData.push({
				json: {
					chain,
					eid,
					chainInfo,
					tokens: tokens.filter(t => t.symbol.includes('NFT') || t.name.includes('NFT')),
				},
			});
		}

		else if (operation === 'getOnftMetadata') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const onftAddress = this.getNodeParameter('onftAddress', itemIndex) as string;
			const tokenId = this.getNodeParameter('tokenId', itemIndex) as string;

			returnData.push({
				json: {
					chain,
					contractAddress: onftAddress,
					tokenId,
					note: 'Fetch metadata from tokenURI on-chain or from IPFS/HTTP gateway',
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
