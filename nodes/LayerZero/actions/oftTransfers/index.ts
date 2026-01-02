/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as oftApi from '../../transport/oftApi';
import * as onchain from '../../transport/onchain';
import { ENDPOINT_IDS, CHAIN_OPTIONS } from '../../constants';
import { parseTokenAmount, formatTokenAmount } from '../../utils';

export const oftTransfersOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['oftTransfers'],
			},
		},
		options: [
			{
				name: 'Get OFT Routes',
				value: 'getOftRoutes',
				description: 'Get available OFT transfer routes',
				action: 'Get OFT routes',
			},
			{
				name: 'Get OFT Info',
				value: 'getOftInfo',
				description: 'Get OFT token details',
				action: 'Get OFT info',
			},
			{
				name: 'Get Transfer Quote',
				value: 'getTransferQuote',
				description: 'Get fee estimation for transfer',
				action: 'Get transfer quote',
			},
			{
				name: 'Build Transfer Transaction',
				value: 'buildTransferTransaction',
				description: 'Generate transfer calldata',
				action: 'Build transfer transaction',
			},
			{
				name: 'Execute OFT Transfer',
				value: 'executeOftTransfer',
				description: 'Send OFT tokens cross-chain',
				action: 'Execute OFT transfer',
			},
			{
				name: 'Get OFTs by Chain',
				value: 'getOftsByChain',
				description: 'List OFTs on a specific chain',
				action: 'Get OFTs by chain',
			},
			{
				name: 'Get Supported Chains',
				value: 'getSupportedChains',
				description: 'Get chains with OFT support',
				action: 'Get supported chains',
			},
			{
				name: 'Validate Transfer',
				value: 'validateTransfer',
				description: 'Pre-flight validation for transfer',
				action: 'Validate transfer',
			},
		],
		default: 'getOftRoutes',
	},
];

export const oftTransfersFields: INodeProperties[] = [
	// Get OFT Routes
	{
		displayName: 'Source Chain',
		name: 'srcChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['oftTransfers'],
				operation: ['getOftRoutes'],
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
				resource: ['oftTransfers'],
				operation: ['getOftRoutes'],
			},
		},
		description: 'Filter by destination chain (optional)',
	},

	// Get OFT Info
	{
		displayName: 'OFT Address',
		name: 'oftAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['oftTransfers'],
				operation: ['getOftInfo'],
			},
		},
		description: 'The OFT contract address',
	},
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['oftTransfers'],
				operation: ['getOftInfo', 'getOftsByChain'],
			},
		},
		description: 'The chain where the OFT is deployed',
	},

	// Get Transfer Quote / Build Transaction / Execute Transfer
	{
		displayName: 'Source Chain',
		name: 'srcChain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['oftTransfers'],
				operation: ['getTransferQuote', 'buildTransferTransaction', 'executeOftTransfer', 'validateTransfer'],
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
				resource: ['oftTransfers'],
				operation: ['getTransferQuote', 'buildTransferTransaction', 'executeOftTransfer', 'validateTransfer'],
			},
		},
		description: 'The destination chain for the transfer',
	},
	{
		displayName: 'OFT Address',
		name: 'oftAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['oftTransfers'],
				operation: ['getTransferQuote', 'buildTransferTransaction', 'executeOftTransfer', 'validateTransfer'],
			},
		},
		description: 'The OFT contract address on source chain',
	},
	{
		displayName: 'Recipient Address',
		name: 'recipientAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['oftTransfers'],
				operation: ['getTransferQuote', 'buildTransferTransaction', 'executeOftTransfer', 'validateTransfer'],
			},
		},
		description: 'The recipient address on destination chain',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['oftTransfers'],
				operation: ['getTransferQuote', 'buildTransferTransaction', 'executeOftTransfer', 'validateTransfer'],
			},
		},
		description: 'The amount to transfer (in token units, e.g., "1.5")',
	},
	{
		displayName: 'Token Decimals',
		name: 'decimals',
		type: 'number',
		default: 18,
		displayOptions: {
			show: {
				resource: ['oftTransfers'],
				operation: ['getTransferQuote', 'buildTransferTransaction', 'executeOftTransfer'],
			},
		},
		description: 'The token decimals for amount conversion',
	},

	// Build Transaction specific
	{
		displayName: 'Native Fee',
		name: 'nativeFee',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['oftTransfers'],
				operation: ['buildTransferTransaction'],
			},
		},
		description: 'The native fee from quote (in wei)',
	},

	// Transfer options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['oftTransfers'],
				operation: ['getTransferQuote', 'buildTransferTransaction', 'executeOftTransfer'],
			},
		},
		options: [
			{
				displayName: 'Min Amount',
				name: 'minAmount',
				type: 'string',
				default: '',
				description: 'Minimum amount to receive (slippage protection)',
			},
			{
				displayName: 'Extra Gas Limit',
				name: 'extraGasLimit',
				type: 'number',
				default: 200000,
				description: 'Extra gas for destination execution',
			},
			{
				displayName: 'Native Drop Amount',
				name: 'nativeDropAmount',
				type: 'string',
				default: '',
				description: 'Amount of native gas to airdrop on destination',
			},
			{
				displayName: 'Native Drop Recipient',
				name: 'nativeDropRecipient',
				type: 'string',
				default: '',
				description: 'Recipient of native gas airdrop (defaults to recipient)',
			},
		],
	},
];

export async function executeOftTransfers(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'getOftRoutes') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;

			const srcEid = srcChain ? ENDPOINT_IDS[srcChain] : undefined;
			const dstEid = dstChain ? ENDPOINT_IDS[dstChain] : undefined;

			const routes = await oftApi.getOftRoutes.call(this, srcEid, dstEid);

			for (const route of routes) {
				returnData.push({ json: route });
			}
		}

		else if (operation === 'getOftInfo') {
			const oftAddress = this.getNodeParameter('oftAddress', itemIndex) as string;
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			const info = await oftApi.getOftInfo.call(this, oftAddress, eid);

			if (info) {
				returnData.push({ json: info });
			} else {
				returnData.push({ json: { message: 'OFT not found' } });
			}
		}

		else if (operation === 'getTransferQuote') {
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
					...quote,
					nativeFeeFormatted: formatTokenAmount(quote.nativeFee, 18),
					srcChain,
					dstChain,
					amount,
				},
			});
		}

		else if (operation === 'buildTransferTransaction') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const oftAddress = this.getNodeParameter('oftAddress', itemIndex) as string;
			const recipientAddress = this.getNodeParameter('recipientAddress', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as string;
			const decimals = this.getNodeParameter('decimals', itemIndex) as number;
			const nativeFee = this.getNodeParameter('nativeFee', itemIndex) as string;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];
			const amountWei = parseTokenAmount(amount, decimals).toString();

			const tx = await oftApi.buildTransferTransaction.call(this, {
				srcEid,
				dstEid,
				oftAddress,
				recipientAddress,
				amount: amountWei,
			}, nativeFee);

			returnData.push({ json: tx });
		}

		else if (operation === 'executeOftTransfer') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const oftAddress = this.getNodeParameter('oftAddress', itemIndex) as string;
			const recipientAddress = this.getNodeParameter('recipientAddress', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as string;
			const decimals = this.getNodeParameter('decimals', itemIndex) as number;

			const dstEid = ENDPOINT_IDS[dstChain];
			const amountLD = parseTokenAmount(amount, decimals);

			// First get a quote
			const quote = await onchain.quoteOftSend.call(
				this,
				srcChain,
				oftAddress,
				dstEid,
				recipientAddress,
				amountLD,
			);

			// Execute the transfer
			const result = await onchain.executeOftSend.call(
				this,
				srcChain,
				oftAddress,
				dstEid,
				recipientAddress,
				amountLD,
				'0x',
				quote.nativeFee,
				quote.lzTokenFee,
			);

			returnData.push({
				json: {
					...result,
					srcChain,
					dstChain,
					amount,
					nativeFee: quote.nativeFee.toString(),
				},
			});
		}

		else if (operation === 'getOftsByChain') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const eid = ENDPOINT_IDS[chain];

			const ofts = await oftApi.getOftsByChain.call(this, eid);

			for (const oft of ofts) {
				returnData.push({ json: oft });
			}
		}

		else if (operation === 'getSupportedChains') {
			const chains = await oftApi.getSupportedChains.call(this);

			for (const chain of chains) {
				returnData.push({ json: chain });
			}
		}

		else if (operation === 'validateTransfer') {
			const srcChain = this.getNodeParameter('srcChain', itemIndex) as string;
			const dstChain = this.getNodeParameter('dstChain', itemIndex) as string;
			const oftAddress = this.getNodeParameter('oftAddress', itemIndex) as string;
			const recipientAddress = this.getNodeParameter('recipientAddress', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as string;
			const decimals = this.getNodeParameter('decimals', itemIndex, 18) as number;

			const srcEid = ENDPOINT_IDS[srcChain];
			const dstEid = ENDPOINT_IDS[dstChain];
			const amountWei = parseTokenAmount(amount, decimals).toString();

			const validation = await oftApi.validateTransfer.call(this, {
				srcEid,
				dstEid,
				oftAddress,
				recipientAddress,
				amount: amountWei,
			});

			returnData.push({ json: validation });
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
