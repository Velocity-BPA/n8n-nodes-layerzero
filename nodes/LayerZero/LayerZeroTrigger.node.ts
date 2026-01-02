/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IPollFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { CHAIN_OPTIONS, MESSAGE_STATUSES, LICENSING_NOTICE } from './constants';
import * as scanApi from './transport/scanApi';

export class LayerZeroTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LayerZero Trigger',
		name: 'layerZeroTrigger',
		icon: 'file:layerzero.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger on LayerZero cross-chain message events',
		defaults: {
			name: 'LayerZero Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'layerZeroApi',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				required: true,
				default: 'messageDelivered',
				options: [
					{
						name: 'Message Delivered',
						value: 'messageDelivered',
						description: 'Trigger when a message is delivered',
					},
					{
						name: 'Message Sent',
						value: 'messageSent',
						description: 'Trigger when a message is sent',
					},
					{
						name: 'Message Failed',
						value: 'messageFailed',
						description: 'Trigger when a message fails',
					},
					{
						name: 'Message Inflight',
						value: 'messageInflight',
						description: 'Trigger when a message is inflight (pending)',
					},
					{
						name: 'Large Transfer Detected',
						value: 'largeTransfer',
						description: 'Trigger on transfers above threshold',
					},
					{
						name: 'New OApp Message',
						value: 'oappMessage',
						description: 'Trigger on messages from specific OApp',
					},
					{
						name: 'Wallet Activity',
						value: 'walletActivity',
						description: 'Trigger on messages from specific wallet',
					},
				],
			},
			// Filter options
			{
				displayName: 'Source Chain',
				name: 'srcChain',
				type: 'options',
				options: [{ name: 'Any', value: '' }, ...CHAIN_OPTIONS],
				default: '',
				description: 'Filter by source chain',
			},
			{
				displayName: 'Destination Chain',
				name: 'dstChain',
				type: 'options',
				options: [{ name: 'Any', value: '' }, ...CHAIN_OPTIONS],
				default: '',
				description: 'Filter by destination chain',
			},
			{
				displayName: 'OApp Address',
				name: 'oappAddress',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						event: ['oappMessage'],
					},
				},
				description: 'The OApp contract address to monitor',
				placeholder: '0x...',
			},
			{
				displayName: 'Wallet Address',
				name: 'walletAddress',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						event: ['walletActivity'],
					},
				},
				description: 'The wallet address to monitor',
				placeholder: '0x...',
			},
			{
				displayName: 'Transfer Threshold (USD)',
				name: 'transferThreshold',
				type: 'number',
				default: 100000,
				displayOptions: {
					show: {
						event: ['largeTransfer'],
					},
				},
				description: 'Minimum transfer value in USD to trigger',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Max Results Per Poll',
						name: 'maxResults',
						type: 'number',
						default: 10,
						description: 'Maximum number of results to return per poll',
					},
					{
						displayName: 'Include Message Payload',
						name: 'includePayload',
						type: 'boolean',
						default: false,
						description: 'Whether to include the full message payload',
					},
				],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		// Log licensing notice
		this.logger.warn(LICENSING_NOTICE);

		const event = this.getNodeParameter('event') as string;
		const srcChain = this.getNodeParameter('srcChain') as string;
		const dstChain = this.getNodeParameter('dstChain') as string;
		const options = this.getNodeParameter('options', {}) as {
			maxResults?: number;
			includePayload?: boolean;
		};

		const maxResults = options.maxResults || 10;

		// Get stored data for comparison
		const webhookData = this.getWorkflowStaticData('node');
		const lastProcessedId = (webhookData.lastProcessedId as string) || '';
		const lastPollTime = (webhookData.lastPollTime as number) || 0;

		const returnData: INodeExecutionData[] = [];

		try {
			let messages: Array<{
				guid?: string;
				srcTxHash?: string;
				status?: string;
				srcChainId?: number;
				dstChainId?: number;
				sender?: string;
				srcUaAddress?: string;
				created?: string;
				nativeFee?: string;
				[key: string]: unknown;
			}> = [];

			// Determine status filter based on event
			let statusFilter: string | undefined;
			switch (event) {
				case 'messageDelivered':
					statusFilter = MESSAGE_STATUSES.DELIVERED;
					break;
				case 'messageFailed':
					statusFilter = MESSAGE_STATUSES.FAILED;
					break;
				case 'messageInflight':
					statusFilter = MESSAGE_STATUSES.INFLIGHT;
					break;
				case 'messageSent':
				case 'largeTransfer':
				case 'oappMessage':
				case 'walletActivity':
					statusFilter = undefined; // All statuses
					break;
			}

			// Build filters
			const filters: {
				srcChain?: string;
				dstChain?: string;
				status?: string;
				sender?: string;
				srcUaAddress?: string;
			} = {};

			if (srcChain) filters.srcChain = srcChain;
			if (dstChain) filters.dstChain = dstChain;
			if (statusFilter) filters.status = statusFilter;

			// Handle specific event types
			if (event === 'oappMessage') {
				const oappAddress = this.getNodeParameter('oappAddress') as string;
				if (oappAddress) {
					filters.srcUaAddress = oappAddress;
				}
			}

			if (event === 'walletActivity') {
				const walletAddress = this.getNodeParameter('walletAddress') as string;
				if (walletAddress) {
					filters.sender = walletAddress;
				}
			}

			// Fetch messages - getMessages returns { messages, total }
			const result = await scanApi.getMessages.call(
				this as unknown as import('n8n-workflow').IExecuteFunctions,
				{
					...filters,
					limit: maxResults,
				} as scanApi.IMessageQueryParams,
			);
			messages = result.messages.map((msg) => ({
				...msg,
				guid: msg.guid,
				srcTxHash: msg.srcTxHash,
				status: msg.status,
				srcChainId: msg.srcEid,
				dstChainId: msg.dstEid,
				sender: msg.srcAddress,
				srcUaAddress: msg.srcAddress,
				created: msg.srcTimestamp ? new Date(msg.srcTimestamp * 1000).toISOString() : undefined,
				nativeFee: msg.fee?.nativeFee,
			}));

			// Filter by large transfer threshold if needed
			if (event === 'largeTransfer') {
				const threshold = this.getNodeParameter('transferThreshold') as number;
				messages = messages.filter((msg) => {
					// Estimate USD value from native fee (simplified)
					const nativeFee = parseFloat(msg.nativeFee || '0');
					// This is a simplified calculation - in production you'd use price feeds
					return nativeFee >= threshold;
				});
			}

			// Filter out already processed messages
			const newMessages = messages.filter((msg) => {
				const msgId = msg.guid || msg.srcTxHash || '';
				const msgTime = new Date(msg.created || 0).getTime();
				return msgId !== lastProcessedId && msgTime > lastPollTime;
			});

			if (newMessages.length > 0) {
				// Update last processed ID and time
				const latestMessage = newMessages[0];
				webhookData.lastProcessedId = latestMessage.guid || latestMessage.srcTxHash || '';
				webhookData.lastPollTime = Date.now();

				for (const message of newMessages) {
					// Remove payload if not requested
					if (!options.includePayload && message.payload) {
						delete message.payload;
					}

					returnData.push({
						json: {
							event,
							timestamp: new Date().toISOString(),
							...message,
						},
					});
				}
			}
		} catch (error) {
			// Log error but don't fail the trigger
			this.logger.error(`LayerZero Trigger error: ${(error as Error).message}`);

			// Return error information if we have no results
			if (returnData.length === 0) {
				return null;
			}
		}

		if (returnData.length === 0) {
			return null;
		}

		return [returnData];
	}
}
