/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as metadataApi from '../../transport/metadataApi';
import * as onchain from '../../transport/onchain';
import { ENDPOINT_IDS, CHAIN_OPTIONS, EXECUTOR_PROVIDERS, DEFAULT_GAS_LIMITS } from '../../constants';

export const executorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['executor'],
			},
		},
		options: [
			{
				name: 'Get Executors',
				value: 'getExecutors',
				description: 'List all available executors',
				action: 'Get executors',
			},
			{
				name: 'Get Executor by Chain',
				value: 'getExecutorByChain',
				description: 'Get executors on a specific chain',
				action: 'Get executor by chain',
			},
			{
				name: 'Get Executor Fees',
				value: 'getExecutorFees',
				description: 'Get execution fee structure',
				action: 'Get executor fees',
			},
			{
				name: 'Get Native Drop Config',
				value: 'getNativeDropConfig',
				description: 'Get gas airdrop settings',
				action: 'Get native drop config',
			},
			{
				name: 'Estimate Execution Gas',
				value: 'estimateExecutionGas',
				description: 'Estimate gas for execution',
				action: 'Estimate execution gas',
			},
		],
		default: 'getExecutors',
	},
];

export const executorFields: INodeProperties[] = [
	// Get Executor by Chain
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['executor'],
				operation: ['getExecutorByChain', 'getExecutorFees', 'getNativeDropConfig', 'estimateExecutionGas'],
			},
		},
		description: 'The chain to query',
	},

	// Get Executor Fees / Estimate Gas
	{
		displayName: 'Destination Chain',
		name: 'dstChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'arbitrum',
		displayOptions: {
			show: {
				resource: ['executor'],
				operation: ['getExecutorFees', 'estimateExecutionGas'],
			},
		},
		description: 'The destination chain',
	},

	// Estimate Execution Gas
	{
		displayName: 'Payload Size (bytes)',
		name: 'payloadSize',
		type: 'number',
		default: 100,
		displayOptions: {
			show: {
				resource: ['executor'],
				operation: ['estimateExecutionGas'],
			},
		},
		description: 'The size of the message payload in bytes',
	},
	{
		displayName: 'Extra Gas',
		name: 'extraGas',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				resource: ['executor'],
				operation: ['estimateExecutionGas'],
			},
		},
		description: 'Additional gas to add to the estimate',
	},
];

export async function executeExecutor(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'getExecutors') {
			const executors = await metadataApi.getExecutorProviders.call(this);

			for (const executor of executors) {
				returnData.push({ json: executor });
			}

			// If API returns empty, provide default list
			if (returnData.length === 0) {
				for (const [key, name] of Object.entries(EXECUTOR_PROVIDERS)) {
					returnData.push({
						json: {
							id: key,
							name,
							description: `${name} - Message Executor`,
						},
					});
				}
			}
		}

		else if (operation === 'getExecutorByChain') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			const executors = await metadataApi.getExecutorsByChain.call(this, eid);
			const contracts = await metadataApi.getContractAddresses.call(this, eid);

			for (const executor of executors) {
				returnData.push({ json: { chain, eid, ...executor } });
			}

			// Add contract info if no executors returned
			if (returnData.length === 0) {
				returnData.push({
					json: {
						chain,
						eid,
						executors: contracts.executor,
					},
				});
			}
		}

		else if (operation === 'getExecutorFees') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;

			const srcEid = ENDPOINT_IDS[chain];
			const dstEid = ENDPOINT_IDS[dstChain];

			const config = await metadataApi.getDefaultConfig.call(this, srcEid, dstEid);
			const gasPrice = await onchain.getGasPrice.call(this, dstChain);

			returnData.push({
				json: {
					srcChain: chain,
					dstChain,
					srcEid,
					dstEid,
					executor: config.executor,
					gasPrice,
					defaultGasLimit: DEFAULT_GAS_LIMITS[dstChain] || DEFAULT_GAS_LIMITS.default,
					confirmations: config.confirmations,
				},
			});
		}

		else if (operation === 'getNativeDropConfig') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			const chainInfo = await metadataApi.getChainByEid.call(this, eid);

			returnData.push({
				json: {
					chain,
					eid,
					nativeCurrency: chainInfo?.nativeCurrency || {
						name: 'Ether',
						symbol: 'ETH',
						decimals: 18,
					},
					maxNativeDrop: '0.1', // Common limit
					note: 'Native drop allows sending destination gas tokens to recipients',
				},
			});
		}

		else if (operation === 'estimateExecutionGas') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const payloadSize = this.getNodeParameter('payloadSize', itemIndex) as number;
			const extraGas = this.getNodeParameter('extraGas', itemIndex) as number;

			const dstEid = ENDPOINT_IDS[dstChain];
			const baseGas = DEFAULT_GAS_LIMITS[dstChain] || DEFAULT_GAS_LIMITS.default;

			// Estimate based on payload size (rough calculation)
			const payloadGas = payloadSize * 16; // ~16 gas per byte for calldata
			const totalGas = baseGas + payloadGas + extraGas;

			const gasPrice = await onchain.getGasPrice.call(this, dstChain);

			returnData.push({
				json: {
					srcChain: chain,
					dstChain,
					dstEid,
					payloadSize,
					extraGas,
					baseGas,
					payloadGas,
					totalGas,
					gasPrice,
					estimatedCost: {
						wei: (BigInt(totalGas) * BigInt(gasPrice.gasPrice)).toString(),
						gwei: ((BigInt(totalGas) * BigInt(gasPrice.gasPrice)) / BigInt(1e9)).toString(),
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
