/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as onchain from '../../transport/onchain';
import * as oftApi from '../../transport/oftApi';
import { buildMessageOptions, parseTokenAmount, formatTokenAmount } from '../../utils';
import { ENDPOINT_IDS, CHAIN_OPTIONS, DEFAULT_GAS_LIMITS } from '../../constants';

export const transactionBuildingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['transactionBuilding'],
			},
		},
		options: [
			{
				name: 'Build lzSend Transaction',
				value: 'buildLzSend',
				description: 'Build a generic cross-chain message transaction',
				action: 'Build lzSend transaction',
			},
			{
				name: 'Build OFT Send Transaction',
				value: 'buildOftSend',
				description: 'Build an OFT token transfer transaction',
				action: 'Build OFT send transaction',
			},
			{
				name: 'Build ONFT Send Transaction',
				value: 'buildOnftSend',
				description: 'Build an ONFT transfer transaction',
				action: 'Build ONFT send transaction',
			},
			{
				name: 'Build Config Transaction',
				value: 'buildConfigTx',
				description: 'Build a configuration update transaction',
				action: 'Build config transaction',
			},
			{
				name: 'Estimate Transaction Gas',
				value: 'estimateGas',
				description: 'Estimate gas for a transaction',
				action: 'Estimate transaction gas',
			},
			{
				name: 'Simulate Transaction',
				value: 'simulateTx',
				description: 'Dry-run a transaction',
				action: 'Simulate transaction',
			},
		],
		default: 'buildLzSend',
	},
];

export const transactionBuildingFields: INodeProperties[] = [
	// OApp/Contract address
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['transactionBuilding'],
				operation: ['buildLzSend', 'buildOftSend', 'buildOnftSend', 'buildConfigTx', 'estimateGas', 'simulateTx'],
			},
		},
		description: 'The contract address',
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
				resource: ['transactionBuilding'],
				operation: ['buildLzSend', 'buildOftSend', 'buildOnftSend', 'buildConfigTx', 'estimateGas', 'simulateTx'],
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
				resource: ['transactionBuilding'],
				operation: ['buildLzSend', 'buildOftSend', 'buildOnftSend'],
			},
		},
		description: 'The destination chain',
	},

	// Receiver address
	{
		displayName: 'Receiver Address',
		name: 'receiverAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['transactionBuilding'],
				operation: ['buildLzSend', 'buildOftSend', 'buildOnftSend'],
			},
		},
		description: 'The receiver address on destination chain',
		placeholder: '0x...',
	},

	// Payload for lzSend
	{
		displayName: 'Payload',
		name: 'payload',
		type: 'string',
		default: '0x',
		displayOptions: {
			show: {
				resource: ['transactionBuilding'],
				operation: ['buildLzSend'],
			},
		},
		description: 'The message payload (hex encoded)',
		placeholder: '0x...',
	},

	// Amount for OFT
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['transactionBuilding'],
				operation: ['buildOftSend'],
			},
		},
		description: 'Amount to transfer (in token units)',
		placeholder: '100',
	},

	// Token ID for ONFT
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['transactionBuilding'],
				operation: ['buildOnftSend'],
			},
		},
		description: 'The NFT token ID to transfer',
		placeholder: '1',
	},

	// Gas limit
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'number',
		default: 200000,
		displayOptions: {
			show: {
				resource: ['transactionBuilding'],
				operation: ['buildLzSend', 'buildOftSend', 'buildOnftSend', 'estimateGas'],
			},
		},
		description: 'Gas limit for destination execution',
	},

	// Config type
	{
		displayName: 'Config Type',
		name: 'configType',
		type: 'options',
		options: [
			{ name: 'Set Peer', value: 'setPeer' },
			{ name: 'Set DVN Config', value: 'setDvnConfig' },
			{ name: 'Set Executor Config', value: 'setExecutorConfig' },
			{ name: 'Set Send Library', value: 'setSendLibrary' },
			{ name: 'Set Receive Library', value: 'setReceiveLibrary' },
		],
		default: 'setPeer',
		displayOptions: {
			show: {
				resource: ['transactionBuilding'],
				operation: ['buildConfigTx'],
			},
		},
		description: 'Type of configuration to update',
	},

	// Config value
	{
		displayName: 'Config Value',
		name: 'configValue',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['transactionBuilding'],
				operation: ['buildConfigTx'],
			},
		},
		description: 'Configuration value (address or hex data)',
		placeholder: '0x...',
	},

	// Transaction data for simulation
	{
		displayName: 'Transaction Data',
		name: 'txData',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['transactionBuilding'],
				operation: ['simulateTx'],
			},
		},
		description: 'Encoded transaction data',
		placeholder: '0x...',
	},

	// Value
	{
		displayName: 'Value (Wei)',
		name: 'value',
		type: 'string',
		default: '0',
		displayOptions: {
			show: {
				resource: ['transactionBuilding'],
				operation: ['estimateGas', 'simulateTx'],
			},
		},
		description: 'Native value to send (in wei)',
	},
];

export async function executeTransactionBuilding(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const contractAddress = this.getNodeParameter('contractAddress', itemIndex) as string;
		const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
		const srcEid = ENDPOINT_IDS[srcChain];

		if (operation === 'buildLzSend') {
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const receiverAddress = this.getNodeParameter('receiverAddress', itemIndex) as string;
			const payload = this.getNodeParameter('payload', itemIndex) as string;
			const gasLimit = this.getNodeParameter('gasLimit', itemIndex) as number;
			const dstEid = ENDPOINT_IDS[dstChain];

			// Build message options
			const options = buildMessageOptions({ gasLimit, msgType: 3 });

			// Build lzSend calldata
			const sendParam = {
				dstEid,
				to: receiverAddress,
				payload: payload || '0x',
				options,
				extraOptions: '0x',
				composeMsg: '0x',
				oftCmd: '0x',
			};

			returnData.push({
				json: {
					contractAddress,
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					receiverAddress,
					payload,
					options,
					sendParam,
					calldata: null,
					message: 'Use ethers.js to encode lzSend calldata with sendParam',
				},
			});
		} else if (operation === 'buildOftSend') {
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const receiverAddress = this.getNodeParameter('receiverAddress', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as string;
			const gasLimit = this.getNodeParameter('gasLimit', itemIndex) as number;
			const dstEid = ENDPOINT_IDS[dstChain];

			// Build transfer transaction using OFT API
			const txData = await oftApi.buildTransferTransaction.call(this, {
				srcChain,
				dstChain,
				tokenAddress: contractAddress,
				senderAddress: '0x', // Will be set from credentials
				receiverAddress,
				amount,
			});

			const options = buildMessageOptions({ gasLimit, msgType: 3 });

			returnData.push({
				json: {
					contractAddress,
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					receiverAddress,
					amount,
					options,
					...txData,
				},
			});
		} else if (operation === 'buildOnftSend') {
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const receiverAddress = this.getNodeParameter('receiverAddress', itemIndex) as string;
			const tokenId = this.getNodeParameter('tokenId', itemIndex) as string;
			const gasLimit = this.getNodeParameter('gasLimit', itemIndex) as number;
			const dstEid = ENDPOINT_IDS[dstChain];

			const options = buildMessageOptions({ gasLimit, msgType: 3 });

			// ONFT send params
			const sendParam = {
				dstEid,
				to: receiverAddress,
				tokenId,
				options,
				extraOptions: '0x',
				composeMsg: '0x',
			};

			returnData.push({
				json: {
					contractAddress,
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					receiverAddress,
					tokenId,
					options,
					sendParam,
					message: 'Use ethers.js to encode ONFT send calldata',
				},
			});
		} else if (operation === 'buildConfigTx') {
			const configType = this.getNodeParameter('configType', itemIndex) as string;
			const configValue = this.getNodeParameter('configValue', itemIndex) as string;

			let functionName: string;
			let args: any[];

			switch (configType) {
				case 'setPeer':
					functionName = 'setPeer';
					args = [ENDPOINT_IDS[configValue] || parseInt(configValue), configValue];
					break;
				case 'setDvnConfig':
					functionName = 'setConfig';
					args = ['dvn', configValue];
					break;
				case 'setExecutorConfig':
					functionName = 'setConfig';
					args = ['executor', configValue];
					break;
				case 'setSendLibrary':
					functionName = 'setSendLibrary';
					args = [configValue];
					break;
				case 'setReceiveLibrary':
					functionName = 'setReceiveLibrary';
					args = [configValue];
					break;
				default:
					throw new Error(`Unknown config type: ${configType}`);
			}

			returnData.push({
				json: {
					contractAddress,
					srcChain,
					configType,
					configValue,
					functionName,
					args,
					message: 'Use ethers.js to encode and execute config transaction',
				},
			});
		} else if (operation === 'estimateGas') {
			const gasLimit = this.getNodeParameter('gasLimit', itemIndex) as number;
			const value = this.getNodeParameter('value', itemIndex) as string;

			// Get provider and estimate gas
			const provider = await onchain.getProvider.call(this, srcChain);
			const defaultGas = DEFAULT_GAS_LIMITS[srcChain] || 200000;

			// Get current gas price
			const feeData = await provider.getFeeData();

			returnData.push({
				json: {
					contractAddress,
					srcChain,
					estimatedGas: defaultGas,
					gasLimit: gasLimit || defaultGas,
					gasPrice: feeData.gasPrice?.toString() || '0',
					maxFeePerGas: feeData.maxFeePerGas?.toString() || null,
					maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || null,
					estimatedCostWei: (BigInt(defaultGas) * (feeData.gasPrice || BigInt(0))).toString(),
					value,
				},
			});
		} else if (operation === 'simulateTx') {
			const txData = this.getNodeParameter('txData', itemIndex) as string;
			const value = this.getNodeParameter('value', itemIndex) as string;

			// Get provider and simulate
			const provider = await onchain.getProvider.call(this, srcChain);

			try {
				const result = await provider.call({
					to: contractAddress,
					data: txData,
					value: BigInt(value),
				});

				returnData.push({
					json: {
						contractAddress,
						srcChain,
						txData,
						value,
						success: true,
						returnData: result,
						error: null,
					},
				});
			} catch (simError: any) {
				returnData.push({
					json: {
						contractAddress,
						srcChain,
						txData,
						value,
						success: false,
						returnData: null,
						error: simError.message || 'Simulation failed',
					},
				});
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
