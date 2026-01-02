/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as scanApi from '../../transport/scanApi';
import { ENDPOINT_IDS, MESSAGE_STATUS, CHAIN_OPTIONS } from '../../constants';

export const messageTrackingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['messageTracking'],
			},
		},
		options: [
			{
				name: 'Get Message by Hash',
				value: 'getMessageByHash',
				description: 'Get message details by source transaction hash',
				action: 'Get message by hash',
			},
			{
				name: 'Get Message by GUID',
				value: 'getMessageByGuid',
				description: 'Get message details by global unique ID',
				action: 'Get message by GUID',
			},
			{
				name: 'Get Messages',
				value: 'getMessages',
				description: 'Get messages with optional filters',
				action: 'Get messages',
			},
			{
				name: 'Get Messages by OApp',
				value: 'getMessagesByOApp',
				description: 'Get messages for a specific OApp',
				action: 'Get messages by O app',
			},
			{
				name: 'Get Messages by Wallet',
				value: 'getMessagesByWallet',
				description: 'Get messages from a wallet address',
				action: 'Get messages by wallet',
			},
			{
				name: 'Get Messages by Endpoint',
				value: 'getMessagesByEndpoint',
				description: 'Get messages for a specific chain endpoint',
				action: 'Get messages by endpoint',
			},
			{
				name: 'Get Latest Messages',
				value: 'getLatestMessages',
				description: 'Get the most recent cross-chain messages',
				action: 'Get latest messages',
			},
			{
				name: 'Get Message Count',
				value: 'getMessageCount',
				description: 'Get total message count with filters',
				action: 'Get message count',
			},
			{
				name: 'Search Messages',
				value: 'searchMessages',
				description: 'Search messages with advanced filters',
				action: 'Search messages',
			},
		],
		default: 'getMessageByHash',
	},
];

export const messageTrackingFields: INodeProperties[] = [
	// Get Message by Hash
	{
		displayName: 'Transaction Hash',
		name: 'txHash',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['messageTracking'],
				operation: ['getMessageByHash'],
			},
		},
		description: 'The source transaction hash',
	},

	// Get Message by GUID
	{
		displayName: 'GUID',
		name: 'guid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['messageTracking'],
				operation: ['getMessageByGuid'],
			},
		},
		description: 'The global unique identifier for the message',
	},

	// Get Messages by OApp
	{
		displayName: 'OApp Address',
		name: 'oappAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['messageTracking'],
				operation: ['getMessagesByOApp'],
			},
		},
		description: 'The OApp contract address',
	},

	// Get Messages by Wallet
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['messageTracking'],
				operation: ['getMessagesByWallet'],
			},
		},
		description: 'The wallet address to query',
	},

	// Get Messages by Endpoint
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		required: true,
		options: CHAIN_OPTIONS,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['messageTracking'],
				operation: ['getMessagesByEndpoint'],
			},
		},
		description: 'The chain to query messages for',
	},
	{
		displayName: 'Direction',
		name: 'direction',
		type: 'options',
		options: [
			{ name: 'Source (Outgoing)', value: 'src' },
			{ name: 'Destination (Incoming)', value: 'dst' },
		],
		default: 'src',
		displayOptions: {
			show: {
				resource: ['messageTracking'],
				operation: ['getMessagesByEndpoint'],
			},
		},
		description: 'Whether to query outgoing or incoming messages',
	},

	// Search Messages
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['messageTracking'],
				operation: ['searchMessages'],
			},
		},
		description: 'Search query string',
	},

	// Common filter options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['messageTracking'],
				operation: ['getMessages', 'getMessagesByOApp', 'getMessagesByWallet', 'getMessagesByEndpoint', 'searchMessages', 'getMessageCount'],
			},
		},
		options: [
			{
				displayName: 'Source Chain',
				name: 'srcChain',
				type: 'options',
				options: CHAIN_OPTIONS,
				default: '',
				description: 'Filter by source chain',
			},
			{
				displayName: 'Destination Chain',
				name: 'dstChain',
				type: 'options',
				options: CHAIN_OPTIONS,
				default: '',
				description: 'Filter by destination chain',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Inflight', value: MESSAGE_STATUS.INFLIGHT },
					{ name: 'Delivered', value: MESSAGE_STATUS.DELIVERED },
					{ name: 'Failed', value: MESSAGE_STATUS.FAILED },
					{ name: 'Blocked', value: MESSAGE_STATUS.BLOCKED },
					{ name: 'Stored', value: MESSAGE_STATUS.STORED },
				],
				default: '',
				description: 'Filter by message status',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 10,
				description: 'Maximum number of messages to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				typeOptions: {
					minValue: 0,
				},
				default: 0,
				description: 'Number of messages to skip',
			},
			{
				displayName: 'From Timestamp',
				name: 'fromTimestamp',
				type: 'dateTime',
				default: '',
				description: 'Filter messages from this timestamp',
			},
			{
				displayName: 'To Timestamp',
				name: 'toTimestamp',
				type: 'dateTime',
				default: '',
				description: 'Filter messages until this timestamp',
			},
		],
	},

	// Get Latest Messages limit
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 10,
		displayOptions: {
			show: {
				resource: ['messageTracking'],
				operation: ['getLatestMessages'],
			},
		},
		description: 'Maximum number of messages to return',
	},
];

export async function executeMessageTracking(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'getMessageByHash') {
			const txHash = this.getNodeParameter('txHash', itemIndex) as string;
			const message = await scanApi.getMessageByHash.call(this, txHash);

			if (message) {
				returnData.push({ json: message });
			} else {
				returnData.push({ json: { message: 'No message found for this transaction hash' } });
			}
		}

		else if (operation === 'getMessageByGuid') {
			const guid = this.getNodeParameter('guid', itemIndex) as string;
			const message = await scanApi.getMessageByGuid.call(this, guid);

			if (message) {
				returnData.push({ json: message });
			} else {
				returnData.push({ json: { message: 'No message found for this GUID' } });
			}
		}

		else if (operation === 'getMessages') {
			const options = this.getNodeParameter('options', itemIndex) as {
				srcChain?: string;
				dstChain?: string;
				status?: string;
				limit?: number;
				offset?: number;
				fromTimestamp?: string;
				toTimestamp?: string;
			};

			const params: scanApi.IMessageQueryParams = {
				limit: options.limit || 10,
				offset: options.offset || 0,
			};

			if (options.srcChain) params.srcEid = ENDPOINT_IDS[options.srcChain];
			if (options.dstChain) params.dstEid = ENDPOINT_IDS[options.dstChain];
			if (options.status) params.status = options.status;
			if (options.fromTimestamp) params.fromTimestamp = options.fromTimestamp;
			if (options.toTimestamp) params.toTimestamp = options.toTimestamp;

			const result = await scanApi.getMessages.call(this, params);

			for (const message of result.messages) {
				returnData.push({ json: message });
			}
		}

		else if (operation === 'getMessagesByOApp') {
			const oappAddress = this.getNodeParameter('oappAddress', itemIndex) as string;
			const options = this.getNodeParameter('options', itemIndex) as {
				srcChain?: string;
				dstChain?: string;
				status?: string;
				limit?: number;
				offset?: number;
			};

			const params: scanApi.IMessageQueryParams = {
				limit: options.limit || 10,
				offset: options.offset || 0,
			};

			if (options.srcChain) params.srcEid = ENDPOINT_IDS[options.srcChain];
			if (options.dstChain) params.dstEid = ENDPOINT_IDS[options.dstChain];
			if (options.status) params.status = options.status;

			const result = await scanApi.getMessagesByOApp.call(this, oappAddress, params);

			for (const message of result.messages) {
				returnData.push({ json: message });
			}
		}

		else if (operation === 'getMessagesByWallet') {
			const walletAddress = this.getNodeParameter('walletAddress', itemIndex) as string;
			const options = this.getNodeParameter('options', itemIndex) as {
				srcChain?: string;
				dstChain?: string;
				status?: string;
				limit?: number;
				offset?: number;
			};

			const params: scanApi.IMessageQueryParams = {
				limit: options.limit || 10,
				offset: options.offset || 0,
			};

			if (options.srcChain) params.srcEid = ENDPOINT_IDS[options.srcChain];
			if (options.dstChain) params.dstEid = ENDPOINT_IDS[options.dstChain];
			if (options.status) params.status = options.status;

			const result = await scanApi.getMessagesByWallet.call(this, walletAddress, params);

			for (const message of result.messages) {
				returnData.push({ json: message });
			}
		}

		else if (operation === 'getMessagesByEndpoint') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const direction = this.getNodeParameter('direction', itemIndex) as 'src' | 'dst';
			const options = this.getNodeParameter('options', itemIndex) as {
				status?: string;
				limit?: number;
				offset?: number;
			};

			const eid = ENDPOINT_IDS[chain];
			const params: scanApi.IMessageQueryParams = {
				limit: options.limit || 10,
				offset: options.offset || 0,
			};

			if (options.status) params.status = options.status;

			const result = await scanApi.getMessagesByEndpoint.call(this, eid, direction, params);

			for (const message of result.messages) {
				returnData.push({ json: message });
			}
		}

		else if (operation === 'getLatestMessages') {
			const limit = this.getNodeParameter('limit', itemIndex) as number;
			const messages = await scanApi.getLatestMessages.call(this, limit);

			for (const message of messages) {
				returnData.push({ json: message });
			}
		}

		else if (operation === 'getMessageCount') {
			const options = this.getNodeParameter('options', itemIndex) as {
				srcChain?: string;
				dstChain?: string;
				status?: string;
			};

			const params: scanApi.IMessageQueryParams = {};

			if (options.srcChain) params.srcEid = ENDPOINT_IDS[options.srcChain];
			if (options.dstChain) params.dstEid = ENDPOINT_IDS[options.dstChain];
			if (options.status) params.status = options.status;

			const count = await scanApi.getMessageCount.call(this, params);

			returnData.push({ json: { count } });
		}

		else if (operation === 'searchMessages') {
			const query = this.getNodeParameter('query', itemIndex) as string;
			const options = this.getNodeParameter('options', itemIndex) as {
				srcChain?: string;
				dstChain?: string;
				status?: string;
				limit?: number;
				offset?: number;
			};

			const params: scanApi.IMessageQueryParams = {
				limit: options.limit || 10,
				offset: options.offset || 0,
			};

			if (options.srcChain) params.srcEid = ENDPOINT_IDS[options.srcChain];
			if (options.dstChain) params.dstEid = ENDPOINT_IDS[options.dstChain];
			if (options.status) params.status = options.status;

			const result = await scanApi.searchMessages.call(this, query, params);

			for (const message of result.messages) {
				returnData.push({ json: message });
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
