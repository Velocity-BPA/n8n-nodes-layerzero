/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { CHAIN_OPTIONS, LICENSING_NOTICE } from './constants';

// Import operations and fields from all resources
import {
	messageTrackingOperations,
	messageTrackingFields,
	executeMessageTracking,
} from './actions/messageTracking';

import {
	oftTransfersOperations,
	oftTransfersFields,
	executeOftTransfers,
} from './actions/oftTransfers';

import {
	onftOperationsOperations,
	onftOperationsFields,
	executeOnftOperations,
} from './actions/onftOperations';

import {
	endpointOperationsOperations,
	endpointOperationsFields,
	executeEndpointOperations,
} from './actions/endpointOperations';

import {
	dvnOperations,
	dvnFields,
	executeDvn,
} from './actions/dvn';

import {
	executorOperations,
	executorFields,
	executeExecutor,
} from './actions/executor';

import {
	feeEstimationOperations,
	feeEstimationFields,
	executeFeeEstimation,
} from './actions/feeEstimation';

import {
	oappConfigurationOperations,
	oappConfigurationFields,
	executeOAppConfiguration,
} from './actions/oappConfiguration';

import {
	messageOptionsOperations,
	messageOptionsFields,
	executeMessageOptions,
} from './actions/messageOptions';

import {
	zroTokenOperations,
	zroTokenFields,
	executeZroToken,
} from './actions/zroToken';

import {
	protocolAnalyticsOperations,
	protocolAnalyticsFields,
	executeProtocolAnalytics,
} from './actions/protocolAnalytics';

import {
	endpointMetadataOperations,
	endpointMetadataFields,
	executeEndpointMetadata,
} from './actions/endpointMetadata';

import {
	composeMessagesOperations,
	composeMessagesFields,
	executeComposeMessages,
} from './actions/composeMessages';

import {
	pathwayConfigurationOperations,
	pathwayConfigurationFields,
	executePathwayConfiguration,
} from './actions/pathwayConfiguration';

import {
	transactionBuildingOperations,
	transactionBuildingFields,
	executeTransactionBuilding,
} from './actions/transactionBuilding';

import {
	utilityOperations,
	utilityFields,
	executeUtility,
} from './actions/utility';

export class LayerZero implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LayerZero',
		name: 'layerZero',
		icon: 'file:layerzero.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with LayerZero omnichain interoperability protocol',
		defaults: {
			name: 'LayerZero',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'layerZeroApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Message Tracking',
						value: 'messageTracking',
						description: 'Track cross-chain messages via Scan API',
					},
					{
						name: 'OFT Transfers',
						value: 'oftTransfers',
						description: 'Omnichain Fungible Token operations',
					},
					{
						name: 'ONFT Operations',
						value: 'onftOperations',
						description: 'Omnichain NFT operations',
					},
					{
						name: 'Endpoint Operations',
						value: 'endpointOperations',
						description: 'LayerZero endpoint management',
					},
					{
						name: 'DVN',
						value: 'dvn',
						description: 'Decentralized Verifier Network operations',
					},
					{
						name: 'Executor',
						value: 'executor',
						description: 'Executor configuration and fees',
					},
					{
						name: 'Fee Estimation',
						value: 'feeEstimation',
						description: 'Estimate cross-chain messaging fees',
					},
					{
						name: 'OApp Configuration',
						value: 'oappConfiguration',
						description: 'Omnichain Application configuration',
					},
					{
						name: 'Message Options',
						value: 'messageOptions',
						description: 'Build message options for lzSend',
					},
					{
						name: 'ZRO Token',
						value: 'zroToken',
						description: 'ZRO governance token operations',
					},
					{
						name: 'Protocol Analytics',
						value: 'protocolAnalytics',
						description: 'Protocol statistics and analytics',
					},
					{
						name: 'Endpoint Metadata',
						value: 'endpointMetadata',
						description: 'Chain and endpoint metadata',
					},
					{
						name: 'Compose Messages',
						value: 'composeMessages',
						description: 'Multi-step composed message operations',
					},
					{
						name: 'Pathway Configuration',
						value: 'pathwayConfiguration',
						description: 'Chain pathway configuration',
					},
					{
						name: 'Transaction Building',
						value: 'transactionBuilding',
						description: 'Build and simulate transactions',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Utility functions and API status',
					},
				],
				default: 'messageTracking',
			},
			// Include all operation and field definitions
			...messageTrackingOperations,
			...messageTrackingFields,
			...oftTransfersOperations,
			...oftTransfersFields,
			...onftOperationsOperations,
			...onftOperationsFields,
			...endpointOperationsOperations,
			...endpointOperationsFields,
			...dvnOperations,
			...dvnFields,
			...executorOperations,
			...executorFields,
			...feeEstimationOperations,
			...feeEstimationFields,
			...oappConfigurationOperations,
			...oappConfigurationFields,
			...messageOptionsOperations,
			...messageOptionsFields,
			...zroTokenOperations,
			...zroTokenFields,
			...protocolAnalyticsOperations,
			...protocolAnalyticsFields,
			...endpointMetadataOperations,
			...endpointMetadataFields,
			...composeMessagesOperations,
			...composeMessagesFields,
			...pathwayConfigurationOperations,
			...pathwayConfigurationFields,
			...transactionBuildingOperations,
			...transactionBuildingFields,
			...utilityOperations,
			...utilityFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Log licensing notice once per execution
		this.logger.warn(LICENSING_NOTICE);

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: INodeExecutionData[] = [];

				switch (resource) {
					case 'messageTracking':
						result = await executeMessageTracking.call(this, operation, i);
						break;
					case 'oftTransfers':
						result = await executeOftTransfers.call(this, operation, i);
						break;
					case 'onftOperations':
						result = await executeOnftOperations.call(this, operation, i);
						break;
					case 'endpointOperations':
						result = await executeEndpointOperations.call(this, operation, i);
						break;
					case 'dvn':
						result = await executeDvn.call(this, operation, i);
						break;
					case 'executor':
						result = await executeExecutor.call(this, operation, i);
						break;
					case 'feeEstimation':
						result = await executeFeeEstimation.call(this, operation, i);
						break;
					case 'oappConfiguration':
						result = await executeOAppConfiguration.call(this, operation, i);
						break;
					case 'messageOptions':
						result = await executeMessageOptions.call(this, operation, i);
						break;
					case 'zroToken':
						result = await executeZroToken.call(this, operation, i);
						break;
					case 'protocolAnalytics':
						result = await executeProtocolAnalytics.call(this, operation, i);
						break;
					case 'endpointMetadata':
						result = await executeEndpointMetadata.call(this, operation, i);
						break;
					case 'composeMessages':
						result = await executeComposeMessages.call(this, operation, i);
						break;
					case 'pathwayConfiguration':
						result = await executePathwayConfiguration.call(this, operation, i);
						break;
					case 'transactionBuilding':
						result = await executeTransactionBuilding.call(this, operation, i);
						break;
					case 'utility':
						result = await executeUtility.call(this, operation, i);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
							resource,
							operation,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
