/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as onchain from '../../transport/onchain';
import { ENDPOINT_IDS, CHAIN_OPTIONS } from '../../constants';

export const zroTokenOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['zroToken'],
			},
		},
		options: [
			{
				name: 'Get ZRO Balance',
				value: 'getBalance',
				description: 'Get ZRO token balance',
				action: 'Get ZRO balance',
			},
			{
				name: 'Get ZRO Price',
				value: 'getPrice',
				description: 'Get current ZRO price',
				action: 'Get ZRO price',
			},
			{
				name: 'Get ZRO Stats',
				value: 'getStats',
				description: 'Get ZRO token statistics',
				action: 'Get ZRO stats',
			},
			{
				name: 'Transfer ZRO',
				value: 'transfer',
				description: 'Send ZRO tokens',
				action: 'Transfer ZRO',
			},
			{
				name: 'Approve ZRO',
				value: 'approve',
				description: 'Approve ZRO spending',
				action: 'Approve ZRO',
			},
			{
				name: 'Get Staking Info',
				value: 'getStakingInfo',
				description: 'Get ZRO staking metrics',
				action: 'Get staking info',
			},
		],
		default: 'getBalance',
	},
];

export const zroTokenFields: INodeProperties[] = [
	// Chain selection
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: CHAIN_OPTIONS,
		required: true,
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['zroToken'],
				operation: ['getBalance', 'transfer', 'approve', 'getStakingInfo'],
			},
		},
		description: 'The chain to interact with',
	},

	// Wallet address for balance check
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['zroToken'],
				operation: ['getBalance'],
			},
		},
		description: 'Address to check balance for',
		placeholder: '0x...',
	},

	// Transfer recipient
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['zroToken'],
				operation: ['transfer'],
			},
		},
		description: 'Recipient address',
		placeholder: '0x...',
	},

	// Transfer amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['zroToken'],
				operation: ['transfer', 'approve'],
			},
		},
		description: 'Amount of ZRO tokens (in token units)',
		placeholder: '100',
	},

	// Spender address for approval
	{
		displayName: 'Spender Address',
		name: 'spenderAddress',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['zroToken'],
				operation: ['approve'],
			},
		},
		description: 'Address to approve for spending',
		placeholder: '0x...',
	},

	// Currency for price
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'options',
		options: [
			{ name: 'USD', value: 'usd' },
			{ name: 'ETH', value: 'eth' },
			{ name: 'BTC', value: 'btc' },
		],
		default: 'usd',
		displayOptions: {
			show: {
				resource: ['zroToken'],
				operation: ['getPrice'],
			},
		},
		description: 'Currency for price quote',
	},
];

// ZRO Token contract addresses (placeholder - actual addresses would come from metadata API)
const ZRO_ADDRESSES: { [key: string]: string } = {
	ethereum: '0x6985884C4392D348587B19cb9eAAf157F13271cd',
	arbitrum: '0x6985884C4392D348587B19cb9eAAf157F13271cd',
	optimism: '0x6985884C4392D348587B19cb9eAAf157F13271cd',
	polygon: '0x6985884C4392D348587B19cb9eAAf157F13271cd',
	base: '0x6985884C4392D348587B19cb9eAAf157F13271cd',
};

// ERC20 ABI for ZRO token
const ERC20_ABI = [
	'function balanceOf(address account) view returns (uint256)',
	'function transfer(address to, uint256 amount) returns (bool)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function allowance(address owner, address spender) view returns (uint256)',
	'function totalSupply() view returns (uint256)',
	'function decimals() view returns (uint8)',
	'function symbol() view returns (string)',
];

export async function executeZroToken(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'getBalance') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const walletAddress = this.getNodeParameter('walletAddress', itemIndex) as string;
			const zroAddress = ZRO_ADDRESSES[chain];

			if (!zroAddress) {
				throw new Error(`ZRO token not available on ${chain}`);
			}

			// Get provider and query balance
			const provider = await onchain.getProvider.call(this, chain);
			const contract = new (await import('ethers')).Contract(zroAddress, ERC20_ABI, provider);

			const balance = await contract.balanceOf(walletAddress);
			const decimals = await contract.decimals();

			returnData.push({
				json: {
					chain,
					walletAddress,
					zroAddress,
					balanceRaw: balance.toString(),
					balance: (Number(balance) / Math.pow(10, decimals)).toString(),
					decimals,
				},
			});
		} else if (operation === 'getPrice') {
			const currency = this.getNodeParameter('currency', itemIndex) as string;

			// Note: In production, this would call a price API like CoinGecko
			returnData.push({
				json: {
					token: 'ZRO',
					currency: currency.toUpperCase(),
					price: 0,
					change24h: 0,
					marketCap: 0,
					volume24h: 0,
					message: 'Price data requires integration with price API (CoinGecko, etc.)',
				},
			});
		} else if (operation === 'getStats') {
			returnData.push({
				json: {
					token: 'ZRO',
					totalSupply: '1000000000',
					circulatingSupply: '110000000',
					holders: 0,
					transfers24h: 0,
					deployedChains: Object.keys(ZRO_ADDRESSES),
					message: 'Full stats require additional API integration',
				},
			});
		} else if (operation === 'transfer') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const toAddress = this.getNodeParameter('toAddress', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as string;
			const zroAddress = ZRO_ADDRESSES[chain];

			if (!zroAddress) {
				throw new Error(`ZRO token not available on ${chain}`);
			}

			// Get wallet and execute transfer
			const wallet = await onchain.getWallet.call(this, chain);
			const contract = new (await import('ethers')).Contract(zroAddress, ERC20_ABI, wallet);

			const decimals = await contract.decimals();
			const amountWei = BigInt(Math.floor(Number(amount) * Math.pow(10, decimals)));

			const tx = await contract.transfer(toAddress, amountWei);
			const receipt = await tx.wait();

			returnData.push({
				json: {
					chain,
					toAddress,
					amount,
					transactionHash: receipt.hash,
					blockNumber: receipt.blockNumber,
					gasUsed: receipt.gasUsed.toString(),
					status: receipt.status === 1 ? 'success' : 'failed',
				},
			});
		} else if (operation === 'approve') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const spenderAddress = this.getNodeParameter('spenderAddress', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as string;
			const zroAddress = ZRO_ADDRESSES[chain];

			if (!zroAddress) {
				throw new Error(`ZRO token not available on ${chain}`);
			}

			// Get wallet and execute approval
			const wallet = await onchain.getWallet.call(this, chain);
			const contract = new (await import('ethers')).Contract(zroAddress, ERC20_ABI, wallet);

			const decimals = await contract.decimals();
			const amountWei = BigInt(Math.floor(Number(amount) * Math.pow(10, decimals)));

			const tx = await contract.approve(spenderAddress, amountWei);
			const receipt = await tx.wait();

			returnData.push({
				json: {
					chain,
					spenderAddress,
					amount,
					transactionHash: receipt.hash,
					blockNumber: receipt.blockNumber,
					gasUsed: receipt.gasUsed.toString(),
					status: receipt.status === 1 ? 'success' : 'failed',
				},
			});
		} else if (operation === 'getStakingInfo') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;

			returnData.push({
				json: {
					chain,
					stakingAvailable: false,
					totalStaked: '0',
					stakingRewards: '0',
					apy: 0,
					message: 'Staking information requires protocol-specific integration',
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
