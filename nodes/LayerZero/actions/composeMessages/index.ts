/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as scanApi from '../../transport/scanApi';
import { buildComposeOption } from '../../utils';
import { ENDPOINT_IDS, CHAIN_OPTIONS } from '../../constants';

export const composeMessagesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['composeMessages'],
			},
		},
		options: [
			{
				name: 'Create Compose Message',
				value: 'createCompose',
				description: 'Create a multi-step compose message',
				action: 'Create compose message',
			},
			{
				name: 'Get Compose Status',
				value: 'getComposeStatus',
				description: 'Check compose execution status',
				action: 'Get compose status',
			},
			{
				name: 'Execute Compose',
				value: 'executeCompose',
				description: 'Execute a stored compose message',
				action: 'Execute compose',
			},
			{
				name: 'Get Compose Receipt',
				value: 'getComposeReceipt',
				description: 'Get compose execution result',
				action: 'Get compose receipt',
			},
		],
		default: 'createCompose',
	},
];

export const composeMessagesFields: INodeProperties[] = [
	// OApp address
	{
		displayName: 'OApp Address',
		name: 'oappAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['composeMessages'],
				operation: ['createCompose', 'executeCompose'],
			},
		},
		description: 'The OApp contract address',
		placeholder: '0x...',
	},

	// Source chain
	{
		displayName: 'Source Chain',
		name: 'srcChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['composeMessages'],
				operation: ['createCompose', 'executeCompose'],
			},
		},
		description: 'The source chain',
	},

	// Destination chain
	{
		displayName: 'Destination Chain',
		name: 'dstChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'arbitrum',
		displayOptions: {
			show: {
				resource: ['composeMessages'],
				operation: ['createCompose', 'executeCompose'],
			},
		},
		description: 'The destination chain',
	},

	// Compose message payload
	{
		displayName: 'Compose Payload',
		name: 'composePayload',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['composeMessages'],
				operation: ['createCompose'],
			},
		},
		description: 'The compose message payload (hex encoded)',
		placeholder: '0x...',
	},

	// Compose gas limit
	{
		displayName: 'Compose Gas Limit',
		name: 'composeGas',
		type: 'number',
		default: 200000,
		displayOptions: {
			show: {
				resource: ['composeMessages'],
				operation: ['createCompose', 'executeCompose'],
			},
		},
		description: 'Gas limit for compose execution',
	},

	// Compose value
	{
		displayName: 'Compose Value',
		name: 'composeValue',
		type: 'string',
		default: '0',
		displayOptions: {
			show: {
				resource: ['composeMessages'],
				operation: ['createCompose', 'executeCompose'],
			},
		},
		description: 'Native value for compose (in wei)',
	},

	// Message GUID for status/receipt
	{
		displayName: 'Message GUID',
		name: 'messageGuid',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['composeMessages'],
				operation: ['getComposeStatus', 'getComposeReceipt'],
			},
		},
		description: 'The LayerZero message GUID',
		placeholder: '0x...',
	},

	// Compose index for execution
	{
		displayName: 'Compose Index',
		name: 'composeIndex',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				resource: ['composeMessages'],
				operation: ['executeCompose', 'getComposeStatus', 'getComposeReceipt'],
			},
		},
		description: 'Index of the compose message',
	},
];

export async function executeComposeMessages(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'createCompose') {
			const oappAddress = this.getNodeParameter('oappAddress', itemIndex) as string;
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const composePayload = this.getNodeParameter('composePayload', itemIndex) as string;
			const composeGas = this.getNodeParameter('composeGas', itemIndex) as number;
			const composeValue = this.getNodeParameter('composeValue', itemIndex) as string;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];

			// Build compose option
			const composeOption = buildComposeOption(0, composeGas, BigInt(composeValue));

			returnData.push({
				json: {
					oappAddress,
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					composePayload,
					composeOption,
					composeGas,
					composeValue,
					status: 'prepared',
					message: 'Compose message prepared. Use transactionBuilding resource to execute.',
				},
			});
		} else if (operation === 'getComposeStatus') {
			const messageGuid = this.getNodeParameter('messageGuid', itemIndex) as string;
			const composeIndex = this.getNodeParameter('composeIndex', itemIndex) as number;

			// Get message status from scan API
			const credentials = await this.getCredentials('layerZeroApi');
			const message = await scanApi.getMessageByGuid.call(this, messageGuid);

			returnData.push({
				json: {
					messageGuid,
					composeIndex,
					messageStatus: message?.status || 'unknown',
					composeStatus: 'unknown',
					composePending: false,
					composeExecuted: false,
					message: 'Compose status requires on-chain query to EndpointV2',
				},
			});
		} else if (operation === 'executeCompose') {
			const oappAddress = this.getNodeParameter('oappAddress', itemIndex) as string;
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const composeGas = this.getNodeParameter('composeGas', itemIndex) as number;
			const composeValue = this.getNodeParameter('composeValue', itemIndex) as string;
			const composeIndex = this.getNodeParameter('composeIndex', itemIndex) as number;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];

			returnData.push({
				json: {
					oappAddress,
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					composeIndex,
					composeGas,
					composeValue,
					status: 'pending',
					message: 'Compose execution requires on-chain transaction to lzCompose',
				},
			});
		} else if (operation === 'getComposeReceipt') {
			const messageGuid = this.getNodeParameter('messageGuid', itemIndex) as string;
			const composeIndex = this.getNodeParameter('composeIndex', itemIndex) as number;

			returnData.push({
				json: {
					messageGuid,
					composeIndex,
					executed: false,
					success: null,
					gasUsed: null,
					returnData: null,
					transactionHash: null,
					message: 'Compose receipt requires on-chain event query',
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
