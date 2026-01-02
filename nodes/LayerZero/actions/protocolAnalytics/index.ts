/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as scanApi from '../../transport/scanApi';
import * as metadataApi from '../../transport/metadataApi';
import { ENDPOINT_IDS, CHAIN_OPTIONS } from '../../constants';

export const protocolAnalyticsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['protocolAnalytics'],
			},
		},
		options: [
			{
				name: 'Get Protocol Stats',
				value: 'getProtocolStats',
				description: 'Get overall protocol metrics',
				action: 'Get protocol stats',
			},
			{
				name: 'Get Message Volume',
				value: 'getMessageVolume',
				description: 'Get transaction volume',
				action: 'Get message volume',
			},
			{
				name: 'Get Volume by Chain',
				value: 'getVolumeByChain',
				description: 'Get per-chain volume',
				action: 'Get volume by chain',
			},
			{
				name: 'Get Top OApps',
				value: 'getTopOApps',
				description: 'Get most active applications',
				action: 'Get top OApps',
			},
			{
				name: 'Get DVN Analytics',
				value: 'getDvnAnalytics',
				description: 'Get verification statistics',
				action: 'Get DVN analytics',
			},
			{
				name: 'Get Historical Data',
				value: 'getHistoricalData',
				description: 'Get time-series data',
				action: 'Get historical data',
			},
			{
				name: 'Get Chain Activity',
				value: 'getChainActivity',
				description: 'Get chain-specific activity',
				action: 'Get chain activity',
			},
		],
		default: 'getProtocolStats',
	},
];

export const protocolAnalyticsFields: INodeProperties[] = [
	// Time range
	{
		displayName: 'Time Range',
		name: 'timeRange',
		type: 'options',
		options: [
			{ name: '24 Hours', value: '24h' },
			{ name: '7 Days', value: '7d' },
			{ name: '30 Days', value: '30d' },
			{ name: '90 Days', value: '90d' },
			{ name: 'All Time', value: 'all' },
		],
		default: '7d',
		displayOptions: {
			show: {
				resource: ['protocolAnalytics'],
				operation: ['getProtocolStats', 'getMessageVolume', 'getVolumeByChain', 'getTopOApps', 'getDvnAnalytics', 'getHistoricalData', 'getChainActivity'],
			},
		},
		description: 'Time range for analytics',
	},

	// Chain filter
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: [{ name: 'All Chains', value: '' }, ...CHAIN_OPTIONS],
		default: '',
		displayOptions: {
			show: {
				resource: ['protocolAnalytics'],
				operation: ['getVolumeByChain', 'getChainActivity'],
			},
		},
		description: 'Filter by specific chain',
	},

	// Limit for top results
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 10,
		displayOptions: {
			show: {
				resource: ['protocolAnalytics'],
				operation: ['getTopOApps', 'getHistoricalData'],
			},
		},
		description: 'Number of results to return',
	},

	// Interval for historical data
	{
		displayName: 'Interval',
		name: 'interval',
		type: 'options',
		options: [
			{ name: 'Hourly', value: 'hourly' },
			{ name: 'Daily', value: 'daily' },
			{ name: 'Weekly', value: 'weekly' },
			{ name: 'Monthly', value: 'monthly' },
		],
		default: 'daily',
		displayOptions: {
			show: {
				resource: ['protocolAnalytics'],
				operation: ['getHistoricalData'],
			},
		},
		description: 'Data interval',
	},

	// Metric type
	{
		displayName: 'Metric',
		name: 'metric',
		type: 'options',
		options: [
			{ name: 'Messages', value: 'messages' },
			{ name: 'Volume (USD)', value: 'volume' },
			{ name: 'Unique Users', value: 'users' },
			{ name: 'Fees', value: 'fees' },
		],
		default: 'messages',
		displayOptions: {
			show: {
				resource: ['protocolAnalytics'],
				operation: ['getHistoricalData'],
			},
		},
		description: 'Metric to retrieve',
	},
];

export async function executeProtocolAnalytics(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	try {
		const timeRange = this.getNodeParameter('timeRange', itemIndex) as string;

		if (operation === 'getProtocolStats') {
			// Get overall protocol statistics
			const allChains = await metadataApi.getAllChains.call(this);
			
			returnData.push({
				json: {
					timeRange,
					totalChains: allChains.length,
					totalMessages: 0,
					totalVolume: '0',
					totalFees: '0',
					uniqueUsers: 0,
					activeOApps: 0,
					activeDvns: 0,
					avgMessagesPerDay: 0,
					successRate: 0,
					message: 'Full analytics require Scan API aggregation endpoints',
				},
			});
		} else if (operation === 'getMessageVolume') {
			// Get message volume statistics
			returnData.push({
				json: {
					timeRange,
					totalMessages: 0,
					sentMessages: 0,
					deliveredMessages: 0,
					failedMessages: 0,
					inflightMessages: 0,
					avgMessagesPerHour: 0,
					peakMessagesPerHour: 0,
					message: 'Volume data requires Scan API aggregation',
				},
			});
		} else if (operation === 'getVolumeByChain') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;
			const allChains = await metadataApi.getAllChains.call(this);

			if (chain) {
				const eid = ENDPOINT_IDS[chain];
				const chainInfo = await metadataApi.getChainByEid.call(this, eid);

				returnData.push({
					json: {
						chain,
						eid,
						timeRange,
						...chainInfo,
						outboundMessages: 0,
						inboundMessages: 0,
						totalVolume: '0',
						topPathways: [],
					},
				});
			} else {
				// Return all chains
				for (const chainData of allChains.slice(0, 20)) {
					returnData.push({
						json: {
							timeRange,
							...chainData,
							outboundMessages: 0,
							inboundMessages: 0,
							totalVolume: '0',
						},
					});
				}
			}
		} else if (operation === 'getTopOApps') {
			const limit = this.getNodeParameter('limit', itemIndex) as number;

			returnData.push({
				json: {
					timeRange,
					limit,
					topOApps: [],
					message: 'Top OApps data requires Scan API aggregation',
				},
			});
		} else if (operation === 'getDvnAnalytics') {
			// Get DVN verification statistics
			returnData.push({
				json: {
					timeRange,
					totalVerifications: 0,
					successfulVerifications: 0,
					failedVerifications: 0,
					avgVerificationTime: 0,
					dvnPerformance: [],
					message: 'DVN analytics require specialized API endpoints',
				},
			});
		} else if (operation === 'getHistoricalData') {
			const limit = this.getNodeParameter('limit', itemIndex) as number;
			const interval = this.getNodeParameter('interval', itemIndex) as string;
			const metric = this.getNodeParameter('metric', itemIndex) as string;

			returnData.push({
				json: {
					timeRange,
					interval,
					metric,
					limit,
					dataPoints: [],
					message: 'Historical data requires time-series API integration',
				},
			});
		} else if (operation === 'getChainActivity') {
			const chain = this.getNodeParameter('chain', itemIndex) as string;

			if (chain) {
				const eid = ENDPOINT_IDS[chain];

				returnData.push({
					json: {
						chain,
						eid,
						timeRange,
						activity: {
							messagesIn: 0,
							messagesOut: 0,
							uniqueSenders: 0,
							uniqueReceivers: 0,
							topOApps: [],
							topPathways: [],
							avgMessageSize: 0,
							totalGasUsed: '0',
						},
					},
				});
			} else {
				// Get activity for top chains
				const topChains = ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base'];

				for (const chainName of topChains) {
					const eid = ENDPOINT_IDS[chainName];
					returnData.push({
						json: {
							chain: chainName,
							eid,
							timeRange,
							activity: {
								messagesIn: 0,
								messagesOut: 0,
								uniqueSenders: 0,
								uniqueReceivers: 0,
							},
						},
					});
				}
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
