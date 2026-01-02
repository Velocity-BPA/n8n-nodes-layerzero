/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import {
	buildMessageOptions,
	buildExecutorLzReceiveOption,
	buildNativeDropOption,
	buildComposeOption,
	encodeOptions,
} from '../../utils';

export const messageOptionsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['messageOptions'],
			},
		},
		options: [
			{
				name: 'Build Options',
				value: 'buildOptions',
				description: 'Generate message options',
				action: 'Build options',
			},
			{
				name: 'Add Executor Option',
				value: 'addExecutorOption',
				description: 'Add execution parameters',
				action: 'Add executor option',
			},
			{
				name: 'Add DVN Option',
				value: 'addDvnOption',
				description: 'Add DVN parameters',
				action: 'Add DVN option',
			},
			{
				name: 'Add Compose Option',
				value: 'addComposeOption',
				description: 'Add compose message',
				action: 'Add compose option',
			},
			{
				name: 'Add Native Drop',
				value: 'addNativeDrop',
				description: 'Add gas airdrop',
				action: 'Add native drop',
			},
			{
				name: 'Encode Options',
				value: 'encodeOptions',
				description: 'Encode options for lzSend',
				action: 'Encode options',
			},
		],
		default: 'buildOptions',
	},
];

export const messageOptionsFields: INodeProperties[] = [
	// Gas limit for executor
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'number',
		default: 200000,
		displayOptions: {
			show: {
				resource: ['messageOptions'],
				operation: ['buildOptions', 'addExecutorOption'],
			},
		},
		description: 'Gas limit for destination execution',
	},

	// Native value
	{
		displayName: 'Native Value',
		name: 'nativeValue',
		type: 'string',
		default: '0',
		displayOptions: {
			show: {
				resource: ['messageOptions'],
				operation: ['buildOptions', 'addExecutorOption'],
			},
		},
		description: 'Native token value to send (in wei)',
	},

	// Message type
	{
		displayName: 'Message Type',
		name: 'msgType',
		type: 'options',
		options: [
			{ name: 'Type 1 (Basic)', value: 1 },
			{ name: 'Type 2 (With Value)', value: 2 },
			{ name: 'Type 3 (With Options)', value: 3 },
		],
		default: 3,
		displayOptions: {
			show: {
				resource: ['messageOptions'],
				operation: ['buildOptions', 'encodeOptions'],
			},
		},
		description: 'LayerZero message type',
	},

	// DVN threshold
	{
		displayName: 'DVN Threshold',
		name: 'dvnThreshold',
		type: 'number',
		default: 1,
		displayOptions: {
			show: {
				resource: ['messageOptions'],
				operation: ['addDvnOption'],
			},
		},
		description: 'Number of DVN verifications required',
	},

	// DVN addresses (comma-separated)
	{
		displayName: 'DVN Addresses',
		name: 'dvnAddresses',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['messageOptions'],
				operation: ['addDvnOption'],
			},
		},
		description: 'Comma-separated list of DVN addresses',
		placeholder: '0x..., 0x...',
	},

	// Compose message
	{
		displayName: 'Compose Index',
		name: 'composeIndex',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				resource: ['messageOptions'],
				operation: ['addComposeOption'],
			},
		},
		description: 'Index for the compose message',
	},

	{
		displayName: 'Compose Gas',
		name: 'composeGas',
		type: 'number',
		default: 100000,
		displayOptions: {
			show: {
				resource: ['messageOptions'],
				operation: ['addComposeOption'],
			},
		},
		description: 'Gas limit for compose execution',
	},

	{
		displayName: 'Compose Value',
		name: 'composeValue',
		type: 'string',
		default: '0',
		displayOptions: {
			show: {
				resource: ['messageOptions'],
				operation: ['addComposeOption'],
			},
		},
		description: 'Native value for compose (in wei)',
	},

	// Native drop
	{
		displayName: 'Drop Amount',
		name: 'dropAmount',
		type: 'string',
		default: '0',
		displayOptions: {
			show: {
				resource: ['messageOptions'],
				operation: ['addNativeDrop'],
			},
		},
		description: 'Amount to airdrop (in wei)',
	},

	{
		displayName: 'Drop Receiver',
		name: 'dropReceiver',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['messageOptions'],
				operation: ['addNativeDrop'],
			},
		},
		description: 'Address to receive the native drop',
		placeholder: '0x...',
	},

	// Existing options for encoding
	{
		displayName: 'Existing Options',
		name: 'existingOptions',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['messageOptions'],
				operation: ['encodeOptions', 'addExecutorOption', 'addDvnOption', 'addComposeOption', 'addNativeDrop'],
			},
		},
		description: 'Existing options hex to extend (optional)',
	},
];

export async function executeMessageOptions(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'buildOptions') {
			const gasLimit = this.getNodeParameter('gasLimit', itemIndex) as number;
			const nativeValue = this.getNodeParameter('nativeValue', itemIndex) as string;
			const msgType = this.getNodeParameter('msgType', itemIndex) as number;

			const options = buildMessageOptions({
				gasLimit,
				nativeValue: BigInt(nativeValue),
				msgType,
			});

			returnData.push({
				json: {
					options,
					gasLimit,
					nativeValue,
					msgType,
					description: 'Message options built successfully',
				},
			});
		} else if (operation === 'addExecutorOption') {
			const gasLimit = this.getNodeParameter('gasLimit', itemIndex) as number;
			const nativeValue = this.getNodeParameter('nativeValue', itemIndex) as string;
			const existingOptions = this.getNodeParameter('existingOptions', itemIndex) as string;

			const executorOption = buildExecutorLzReceiveOption(gasLimit, BigInt(nativeValue));

			returnData.push({
				json: {
					executorOption,
					gasLimit,
					nativeValue,
					existingOptions: existingOptions || null,
					description: 'Executor option added',
				},
			});
		} else if (operation === 'addDvnOption') {
			const dvnThreshold = this.getNodeParameter('dvnThreshold', itemIndex) as number;
			const dvnAddresses = this.getNodeParameter('dvnAddresses', itemIndex) as string;
			const existingOptions = this.getNodeParameter('existingOptions', itemIndex) as string;

			const dvnList = dvnAddresses.split(',').map((addr) => addr.trim()).filter(Boolean);

			returnData.push({
				json: {
					dvnThreshold,
					dvnAddresses: dvnList,
					existingOptions: existingOptions || null,
					description: 'DVN option configuration',
				},
			});
		} else if (operation === 'addComposeOption') {
			const composeIndex = this.getNodeParameter('composeIndex', itemIndex) as number;
			const composeGas = this.getNodeParameter('composeGas', itemIndex) as number;
			const composeValue = this.getNodeParameter('composeValue', itemIndex) as string;
			const existingOptions = this.getNodeParameter('existingOptions', itemIndex) as string;

			const composeOption = buildComposeOption(composeIndex, composeGas, BigInt(composeValue));

			returnData.push({
				json: {
					composeOption,
					composeIndex,
					composeGas,
					composeValue,
					existingOptions: existingOptions || null,
					description: 'Compose option added',
				},
			});
		} else if (operation === 'addNativeDrop') {
			const dropAmount = this.getNodeParameter('dropAmount', itemIndex) as string;
			const dropReceiver = this.getNodeParameter('dropReceiver', itemIndex) as string;
			const existingOptions = this.getNodeParameter('existingOptions', itemIndex) as string;

			const nativeDropOption = buildNativeDropOption(BigInt(dropAmount), dropReceiver);

			returnData.push({
				json: {
					nativeDropOption,
					dropAmount,
					dropReceiver,
					existingOptions: existingOptions || null,
					description: 'Native drop option added',
				},
			});
		} else if (operation === 'encodeOptions') {
			const gasLimit = this.getNodeParameter('gasLimit', itemIndex) as number;
			const msgType = this.getNodeParameter('msgType', itemIndex) as number;
			const existingOptions = this.getNodeParameter('existingOptions', itemIndex) as string;

			const encoded = encodeOptions(gasLimit, msgType);

			returnData.push({
				json: {
					encodedOptions: encoded,
					gasLimit,
					msgType,
					existingOptions: existingOptions || null,
					description: 'Options encoded for lzSend',
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
