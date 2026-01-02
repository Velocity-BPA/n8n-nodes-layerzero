/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LayerZeroApi implements ICredentialType {
	name = 'layerZeroApi';
	displayName = 'LayerZero API';
	documentationUrl = 'https://docs.layerzero.network/';
	properties: INodeProperties[] = [
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Mainnet',
					value: 'mainnet',
				},
				{
					name: 'Testnet',
					value: 'testnet',
				},
			],
			default: 'mainnet',
			description: 'The LayerZero network environment to use',
		},
		{
			displayName: 'Scan API Key',
			name: 'scanApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'LayerZero Scan API key for message tracking',
		},
		{
			displayName: 'OFT API Key',
			name: 'oftApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'LayerZero OFT API key for token transfers',
		},
		{
			displayName: 'Wallet Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Wallet private key for on-chain operations (optional)',
		},
		{
			displayName: 'RPC Endpoints',
			name: 'rpcEndpoints',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			description: 'RPC endpoints for each blockchain',
			options: [
				{
					name: 'endpoints',
					displayName: 'Endpoints',
					values: [
						{
							displayName: 'Chain Name',
							name: 'chainName',
							type: 'options',
							options: [
								{ name: 'Ethereum', value: 'ethereum' },
								{ name: 'Arbitrum', value: 'arbitrum' },
								{ name: 'Optimism', value: 'optimism' },
								{ name: 'Polygon', value: 'polygon' },
								{ name: 'Base', value: 'base' },
								{ name: 'Avalanche', value: 'avalanche' },
								{ name: 'BNB Chain', value: 'bsc' },
								{ name: 'Fantom', value: 'fantom' },
								{ name: 'Linea', value: 'linea' },
								{ name: 'Scroll', value: 'scroll' },
								{ name: 'zkSync Era', value: 'zksync' },
								{ name: 'Polygon zkEVM', value: 'polygon-zkevm' },
								{ name: 'Mantle', value: 'mantle' },
								{ name: 'Blast', value: 'blast' },
								{ name: 'Solana', value: 'solana' },
								{ name: 'Aptos', value: 'aptos' },
								{ name: 'Sei', value: 'sei' },
								{ name: 'Tron', value: 'tron' },
								{ name: 'Custom', value: 'custom' },
							],
							default: 'ethereum',
							description: 'The blockchain network',
						},
						{
							displayName: 'Custom Chain Name',
							name: 'customChainName',
							type: 'string',
							default: '',
							displayOptions: {
								show: {
									chainName: ['custom'],
								},
							},
							description: 'Custom chain name identifier',
						},
						{
							displayName: 'RPC URL',
							name: 'rpcUrl',
							type: 'string',
							default: '',
							description: 'The RPC endpoint URL for this chain',
						},
					],
				},
			],
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.scanApiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.environment === "mainnet" ? "https://scan.layerzero-api.com/v1" : "https://scan-testnet.layerzero-api.com/v1"}}',
			url: '/messages',
			method: 'GET',
			qs: {
				limit: 1,
			},
		},
	};
}
