/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IHookFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { API_URLS } from '../constants';

export interface IScanApiCredentials {
	environment: 'mainnet' | 'testnet';
	scanApiKey?: string;
}

export interface IMessageQueryParams {
	srcEid?: number;
	dstEid?: number;
	srcAddress?: string;
	dstAddress?: string;
	status?: string;
	limit?: number;
	offset?: number;
	fromTimestamp?: string;
	toTimestamp?: string;
}

export interface ILayerZeroMessage {
	guid: string;
	srcTxHash: string;
	dstTxHash?: string;
	srcEid: number;
	dstEid: number;
	srcAddress: string;
	dstAddress: string;
	status: string;
	nonce: number;
	payloadHash: string;
	srcTimestamp: number;
	dstTimestamp?: number;
	srcBlockNumber: number;
	dstBlockNumber?: number;
	fee?: {
		nativeFee: string;
		lzTokenFee: string;
	};
}

/**
 * Get the base URL for the Scan API based on environment
 */
function getScanApiBaseUrl(environment: 'mainnet' | 'testnet'): string {
	return environment === 'mainnet' ? API_URLS.SCAN_MAINNET : API_URLS.SCAN_TESTNET;
}

/**
 * Make a request to the LayerZero Scan API
 */
export async function scanApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: 'GET' | 'POST',
	endpoint: string,
	body?: object,
	qs?: object,
): Promise<any> {
	const credentials = await this.getCredentials('layerZeroApi') as IScanApiCredentials;
	const baseUrl = getScanApiBaseUrl(credentials.environment);

	const options: any = {
		method,
		uri: `${baseUrl}${endpoint}`,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (credentials.scanApiKey) {
		options.headers['x-api-key'] = credentials.scanApiKey;
	}

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (qs && Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	try {
		return await this.helpers.request(options);
	} catch (error: unknown) {
		const errorObj = error instanceof Error 
			? { message: error.message, name: error.name } 
			: { message: String(error) };
		throw new NodeApiError(this.getNode(), errorObj as any);
	}
}

/**
 * Get message by source transaction hash
 */
export async function getMessageByHash(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	txHash: string,
): Promise<ILayerZeroMessage | null> {
	const response = await scanApiRequest.call(this, 'GET', `/messages/tx/${txHash}`);
	return response?.data || null;
}

/**
 * Get message by GUID
 */
export async function getMessageByGuid(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	guid: string,
): Promise<ILayerZeroMessage | null> {
	const response = await scanApiRequest.call(this, 'GET', `/messages/${guid}`);
	return response?.data || null;
}

/**
 * Get messages with optional filters
 */
export async function getMessages(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	params: IMessageQueryParams = {},
): Promise<{ messages: ILayerZeroMessage[]; total: number }> {
	const qs: any = {};

	if (params.srcEid) qs.srcEid = params.srcEid;
	if (params.dstEid) qs.dstEid = params.dstEid;
	if (params.srcAddress) qs.srcAddress = params.srcAddress;
	if (params.dstAddress) qs.dstAddress = params.dstAddress;
	if (params.status) qs.status = params.status;
	if (params.limit) qs.limit = params.limit;
	if (params.offset) qs.offset = params.offset;
	if (params.fromTimestamp) qs.fromTimestamp = params.fromTimestamp;
	if (params.toTimestamp) qs.toTimestamp = params.toTimestamp;

	const response = await scanApiRequest.call(this, 'GET', '/messages', undefined, qs);
	return {
		messages: response?.data || [],
		total: response?.total || 0,
	};
}

/**
 * Get messages by OApp address
 */
export async function getMessagesByOApp(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	oappAddress: string,
	params: IMessageQueryParams = {},
): Promise<{ messages: ILayerZeroMessage[]; total: number }> {
	const qs: any = {
		oappAddress,
		...params,
	};

	const response = await scanApiRequest.call(this, 'GET', '/messages', undefined, qs);
	return {
		messages: response?.data || [],
		total: response?.total || 0,
	};
}

/**
 * Get messages by wallet address
 */
export async function getMessagesByWallet(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	walletAddress: string,
	params: IMessageQueryParams = {},
): Promise<{ messages: ILayerZeroMessage[]; total: number }> {
	const qs: any = {
		sender: walletAddress,
		...params,
	};

	const response = await scanApiRequest.call(this, 'GET', '/messages', undefined, qs);
	return {
		messages: response?.data || [],
		total: response?.total || 0,
	};
}

/**
 * Get message count with filters
 */
export async function getMessageCount(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	params: IMessageQueryParams = {},
): Promise<number> {
	const response = await getMessages.call(this, { ...params, limit: 1 });
	return response.total;
}

/**
 * Search messages with advanced filters
 */
export async function searchMessages(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	query: string,
	params: IMessageQueryParams = {},
): Promise<{ messages: ILayerZeroMessage[]; total: number }> {
	const qs: any = {
		q: query,
		...params,
	};

	const response = await scanApiRequest.call(this, 'GET', '/messages/search', undefined, qs);
	return {
		messages: response?.data || [],
		total: response?.total || 0,
	};
}

/**
 * Get latest messages
 */
export async function getLatestMessages(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	limit: number = 10,
): Promise<ILayerZeroMessage[]> {
	const response = await getMessages.call(this, { limit });
	return response.messages;
}

/**
 * Get messages by endpoint
 */
export async function getMessagesByEndpoint(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	eid: number,
	direction: 'src' | 'dst' = 'src',
	params: IMessageQueryParams = {},
): Promise<{ messages: ILayerZeroMessage[]; total: number }> {
	const qs: any = {
		...params,
	};

	if (direction === 'src') {
		qs.srcEid = eid;
	} else {
		qs.dstEid = eid;
	}

	const response = await scanApiRequest.call(this, 'GET', '/messages', undefined, qs);
	return {
		messages: response?.data || [],
		total: response?.total || 0,
	};
}
