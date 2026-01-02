/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as oftApi from '../../transport/oftApi';
import * as onchain from '../../transport/onchain';
import * as metadataApi from '../../transport/metadataApi';
import { ENDPOINT_IDS, CHAIN_OPTIONS, DEFAULT_GAS_LIMITS } from '../../constants';
import { parseTokenAmount, formatTokenAmount } from '../../utils';

export const feeEstimationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['feeEstimation'],
			},
		},
		options: [
			{
				name: 'Quote Send Fee',
				value: 'quoteSendFee',
				description: 'Estimate lzSend cost',
				action: 'Quote send fee',
			},
			{
				name: 'Quote OFT Fee',
				value: 'quoteOftFee',
				description: 'Estimate OFT transfer cost',
				action: 'Quote OFT fee',
			},
			{
				name: 'Get Native Fee',
				value: 'getNativeFee',
				description: 'Get fee in native token',
				action: 'Get native fee',
			},
			{
				name: 'Get Fee Breakdown',
				value: 'getFeeBreakdown',
				description: 'Get detailed fee components',
				action: 'Get fee breakdown',
			},
			{
				name: 'Get Gas Prices',
				value: 'getGasPrices',
				description: 'Get current gas prices by chain',
				action: 'Get gas prices',
			},
		],
		default: 'quoteSendFee',
	},
];

export const feeEstimationFields: INodeProperties[] = [
	// Common fields
	{
		displayName: 'Source Chain',
		name: 'srcChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['feeEstimation'],
				operation: ['quoteSendFee', 'quoteOftFee', 'getNativeFee', 'getFeeBreakdown'],
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
				resource: ['feeEstimation'],
				operation: ['quoteSendFee', 'quoteOftFee', 'getNativeFee', 'getFeeBreakdown'],
			},
		},
		description: 'The destination chain',
	},

	// Quote OFT Fee specific
	{
		displayName: 'OFT Address',
		name: 'oftAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['feeEstimation'],
				operation: ['quoteOftFee'],
			},
		},
		description: 'The OFT contract address',
	},
	{
		displayName: 'Recipient Address',
		name: 'recipientAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['feeEstimation'],
				operation: ['quoteOftFee'],
			},
		},
		description: 'The recipient address',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		default: '1',
		displayOptions: {
			show: {
				resource: ['feeEstimation'],
				operation: ['quoteOftFee'],
			},
		},
		description: 'The amount to transfer',
	},
	{
		displayName: 'Token Decimals',
		name: 'decimals',
		type: 'number',
		default: 18,
		displayOptions: {
			show: {
				resource: ['feeEstimation'],
				operation: ['quoteOftFee'],
			},
		},
		description: 'Token decimals',
	},

	// Quote Send Fee specific
	{
		displayName: 'Payload Size (bytes)',
		name: 'payloadSize',
		type: 'number',
		default: 100,
		displayOptions: {
			show: {
				resource: ['feeEstimation'],
				operation: ['quoteSendFee', 'getNativeFee', 'getFeeBreakdown'],
			},
		},
		description: 'Estimated payload size in bytes',
	},
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'number',
		default: 200000,
		displayOptions: {
			show: {
				resource: ['feeEstimation'],
				operation: ['quoteSendFee', 'getNativeFee', 'getFeeBreakdown'],
			},
		},
		description: 'Gas limit for destination execution',
	},

	// Get Gas Prices specific
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['feeEstimation'],
				operation: ['getGasPrices'],
			},
		},
		description: 'The chain to get gas prices for',
	},
];

export async function executeFeeEstimation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'quoteSendFee') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const payloadSize = this.getNodeParameter('payloadSize', itemIndex) as number;
			const gasLimit = this.getNodeParameter('gasLimit', itemIndex) as number;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];

			// Get config and gas prices for estimation
			const config = await metadataApi.getDefaultConfig.call(this, srcEid, dstEid);
			const dstGasPrice = await onchain.getGasPrice.call(this, dstChain);

			// Rough fee estimation based on gas and DVN costs
			const executionFee = BigInt(gasLimit) * BigInt(dstGasPrice.gasPrice);
			const dvnFee = BigInt(config.requiredDvns.length) * BigInt(1e14); // Rough estimate

			const totalFee = executionFee + dvnFee;

			returnData.push({
				json: {
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					payloadSize,
					gasLimit,
					estimatedFee: {
						nativeFee: totalFee.toString(),
						nativeFeeEth: formatTokenAmount(totalFee.toString(), 18),
						executionFee: executionFee.toString(),
						dvnFee: dvnFee.toString(),
					},
					config: {
						confirmations: config.confirmations,
						dvnCount: config.requiredDvns.length,
					},
				},
			});
		}

		else if (operation === 'quoteOftFee') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const oftAddress = this.getNodeParameter('oftAddress', itemIndex) as string;
			const recipientAddress = this.getNodeParameter('recipientAddress', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as string;
			const decimals = this.getNodeParameter('decimals', itemIndex) as number;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];
			const amountWei = parseTokenAmount(amount, decimals).toString();

			const quote = await oftApi.getTransferQuote.call(this, {
				srcEid,
				dstEid,
				oftAddress,
				recipientAddress,
				amount: amountWei,
			});

			returnData.push({
				json: {
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					oftAddress,
					amount,
					amountWei,
					quote: {
						...quote,
						nativeFeeEth: formatTokenAmount(quote.nativeFee, 18),
						lzTokenFeeFormatted: formatTokenAmount(quote.lzTokenFee, 18),
					},
				},
			});
		}

		else if (operation === 'getNativeFee') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const payloadSize = this.getNodeParameter('payloadSize', itemIndex) as number;
			const gasLimit = this.getNodeParameter('gasLimit', itemIndex) as number;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];

			const srcChainInfo = await metadataApi.getChainByEid.call(this, srcEid);
			const dstGasPrice = await onchain.getGasPrice.call(this, dstChain);

			const baseFee = BigInt(gasLimit) * BigInt(dstGasPrice.gasPrice);
			const bufferFee = baseFee / 10n; // 10% buffer
			const totalFee = baseFee + bufferFee;

			returnData.push({
				json: {
					srcChain,
					dstChain,
					nativeCurrency: srcChainInfo?.nativeCurrency?.symbol || 'ETH',
					nativeFee: totalFee.toString(),
					nativeFeeFormatted: formatTokenAmount(totalFee.toString(), 18),
					breakdown: {
						baseFee: baseFee.toString(),
						buffer: bufferFee.toString(),
					},
				},
			});
		}

		else if (operation === 'getFeeBreakdown') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const payloadSize = this.getNodeParameter('payloadSize', itemIndex) as number;
			const gasLimit = this.getNodeParameter('gasLimit', itemIndex) as number;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];

			const config = await metadataApi.getDefaultConfig.call(this, srcEid, dstEid);
			const dstGasPrice = await onchain.getGasPrice.call(this, dstChain);

			// Calculate individual components
			const executionGas = BigInt(gasLimit) * BigInt(dstGasPrice.gasPrice);
			const dvnVerificationFee = BigInt(config.requiredDvns.length) * BigInt(5e13);
			const treasuryFee = (executionGas + dvnVerificationFee) / 100n; // 1%

			const totalFee = executionGas + dvnVerificationFee + treasuryFee;

			returnData.push({
				json: {
					srcChain,
					dstChain,
					srcEid,
					dstEid,
					components: {
						executionFee: {
							wei: executionGas.toString(),
							eth: formatTokenAmount(executionGas.toString(), 18),
							description: 'Gas cost for destination execution',
						},
						dvnVerificationFee: {
							wei: dvnVerificationFee.toString(),
							eth: formatTokenAmount(dvnVerificationFee.toString(), 18),
							description: 'DVN verification fees',
							dvnCount: config.requiredDvns.length,
						},
						treasuryFee: {
							wei: treasuryFee.toString(),
							eth: formatTokenAmount(treasuryFee.toString(), 18),
							description: 'Protocol treasury fee',
						},
					},
					total: {
						wei: totalFee.toString(),
						eth: formatTokenAmount(totalFee.toString(), 18),
					},
				},
			});
		}

		else if (operation === 'getGasPrices') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;

			const gasPrice = await onchain.getGasPrice.call(this, chain);
			const chainInfo = await metadataApi.getChainByEid.call(this, ENDPOINT_IDS[chain]);

			returnData.push({
				json: {
					chain,
					eid: ENDPOINT_IDS[chain],
					nativeCurrency: chainInfo?.nativeCurrency?.symbol || 'ETH',
					gasPrice: {
						wei: gasPrice.gasPrice,
						gwei: (BigInt(gasPrice.gasPrice) / BigInt(1e9)).toString(),
					},
					maxFeePerGas: gasPrice.maxFeePerGas
						? {
								wei: gasPrice.maxFeePerGas,
								gwei: (BigInt(gasPrice.maxFeePerGas) / BigInt(1e9)).toString(),
						  }
						: undefined,
					maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas
						? {
								wei: gasPrice.maxPriorityFeePerGas,
								gwei: (BigInt(gasPrice.maxPriorityFeePerGas) / BigInt(1e9)).toString(),
						  }
						: undefined,
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
