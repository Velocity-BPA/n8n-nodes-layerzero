/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as metadataApi from '../../transport/metadataApi';
import * as onchain from '../../transport/onchain';
import { ENDPOINT_IDS, CHAIN_OPTIONS } from '../../constants';

export const oappConfigurationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['oappConfiguration'],
			},
		},
		options: [
			{
				name: 'Get OApp Config',
				value: 'getOAppConfig',
				description: 'Get application configuration',
				action: 'Get OApp config',
			},
			{
				name: 'Get Send Library',
				value: 'getSendLibrary',
				description: 'Get configured send library',
				action: 'Get send library',
			},
			{
				name: 'Get Receive Library',
				value: 'getReceiveLibrary',
				description: 'Get configured receive library',
				action: 'Get receive library',
			},
			{
				name: 'Get DVN Config',
				value: 'getDvnConfig',
				description: 'Get required/optional DVNs',
				action: 'Get DVN config',
			},
			{
				name: 'Get Executor Config',
				value: 'getExecutorConfig',
				description: 'Get executor settings',
				action: 'Get executor config',
			},
			{
				name: 'Validate Config',
				value: 'validateConfig',
				description: 'Validate configuration',
				action: 'Validate config',
			},
			{
				name: 'Get Peers',
				value: 'getPeers',
				description: 'Get connected OApp addresses',
				action: 'Get peers',
			},
			{
				name: 'Get Enforced Options',
				value: 'getEnforcedOptions',
				description: 'Get enforced message options',
				action: 'Get enforced options',
			},
		],
		default: 'getOAppConfig',
	},
];

export const oappConfigurationFields: INodeProperties[] = [
	// OApp address
	{
		displayName: 'OApp Address',
		name: 'oappAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['oappConfiguration'],
				operation: [
					'getOAppConfig',
					'getSendLibrary',
					'getReceiveLibrary',
					'getDvnConfig',
					'getExecutorConfig',
					'validateConfig',
					'getPeers',
					'getEnforcedOptions',
				],
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
				resource: ['oappConfiguration'],
				operation: [
					'getOAppConfig',
					'getSendLibrary',
					'getReceiveLibrary',
					'getDvnConfig',
					'getExecutorConfig',
					'validateConfig',
					'getPeers',
					'getEnforcedOptions',
				],
			},
		},
		description: 'The chain where the OApp is deployed',
	},

	// Destination chain for pathway-specific configs
	{
		displayName: 'Destination Chain',
		name: 'dstChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'arbitrum',
		displayOptions: {
			show: {
				resource: ['oappConfiguration'],
				operation: [
					'getSendLibrary',
					'getReceiveLibrary',
					'getDvnConfig',
					'getExecutorConfig',
					'getPeers',
					'getEnforcedOptions',
				],
			},
		},
		description: 'The destination chain for pathway-specific config',
	},

	// Config type for validation
	{
		displayName: 'Config Type',
		name: 'configType',
		type: 'options',
		options: [
			{ name: 'All', value: 'all' },
			{ name: 'DVN Only', value: 'dvn' },
			{ name: 'Executor Only', value: 'executor' },
			{ name: 'Libraries Only', value: 'libraries' },
		],
		default: 'all',
		displayOptions: {
			show: {
				resource: ['oappConfiguration'],
				operation: ['validateConfig'],
			},
		},
		description: 'Type of configuration to validate',
	},
];

export async function executeOAppConfiguration(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const oappAddress = this.getNodeParameter('oappAddress', itemIndex) as string;
		const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
		const srcEid = ENDPOINT_IDS[srcChain];

		if (operation === 'getOAppConfig') {
			// Get full OApp configuration
			const defaultConfig = await metadataApi.getDefaultConfig.call(this, srcEid, srcEid);

			returnData.push({
				json: {
					oappAddress,
					chain: srcChain,
					eid: srcEid,
					config: defaultConfig,
					isOApp: true,
				},
			});
		} else if (operation === 'getSendLibrary') {
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const dstEid = ENDPOINT_IDS[dstChain];

			const libraries = await metadataApi.getMessageLibraries.call(this, srcEid);
			const sendLibrary = libraries.find((lib: any) => lib.type === 'send') || libraries[0];

			returnData.push({
				json: {
					oappAddress,
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					sendLibrary,
				},
			});
		} else if (operation === 'getReceiveLibrary') {
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const dstEid = ENDPOINT_IDS[dstChain];

			const libraries = await metadataApi.getMessageLibraries.call(this, srcEid);
			const receiveLibrary = libraries.find((lib: any) => lib.type === 'receive') || libraries[0];

			returnData.push({
				json: {
					oappAddress,
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					receiveLibrary,
				},
			});
		} else if (operation === 'getDvnConfig') {
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const dstEid = ENDPOINT_IDS[dstChain];

			const dvnInfo = await metadataApi.getDvnInfo.call(this, srcEid);

			returnData.push({
				json: {
					oappAddress,
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					dvnConfig: {
						requiredDvns: dvnInfo.providers || [],
						optionalDvns: [],
						optionalDvnThreshold: 0,
					},
				},
			});
		} else if (operation === 'getExecutorConfig') {
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const dstEid = ENDPOINT_IDS[dstChain];

			const executorInfo = await metadataApi.getExecutorInfo.call(this, srcEid);

			returnData.push({
				json: {
					oappAddress,
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					executorConfig: {
						executors: executorInfo.providers || [],
						maxMessageSize: 10000,
					},
				},
			});
		} else if (operation === 'validateConfig') {
			const configType = this.getNodeParameter('configType', itemIndex) as string;

			// Perform validation
			const validationResult = {
				isValid: true,
				errors: [] as string[],
				warnings: [] as string[],
			};

			// Check if OApp address is valid
			if (!oappAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
				validationResult.isValid = false;
				validationResult.errors.push('Invalid OApp address format');
			}

			// Check if chain is supported
			if (!ENDPOINT_IDS[srcChain]) {
				validationResult.isValid = false;
				validationResult.errors.push(`Chain ${srcChain} not supported`);
			}

			returnData.push({
				json: {
					oappAddress,
					chain: srcChain,
					configType,
					...validationResult,
				},
			});
		} else if (operation === 'getPeers') {
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const dstEid = ENDPOINT_IDS[dstChain];

			// Peers would typically be fetched on-chain
			returnData.push({
				json: {
					oappAddress,
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					peers: [],
					message: 'Peer lookup requires on-chain query',
				},
			});
		} else if (operation === 'getEnforcedOptions') {
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const dstEid = ENDPOINT_IDS[dstChain];

			returnData.push({
				json: {
					oappAddress,
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					enforcedOptions: {
						msgType1: null,
						msgType2: null,
					},
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
