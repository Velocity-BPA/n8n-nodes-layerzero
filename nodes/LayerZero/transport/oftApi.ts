/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IHookFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { API_URLS } from '../constants';

export interface IOftApiCredentials {
	environment: 'mainnet' | 'testnet';
	oftApiKey?: string;
}

export interface IOftRoute {
	srcEid: number;
	dstEid: number;
	srcAddress: string;
	dstAddress: string;
	oftType: string;
	token: {
		symbol: string;
		name: string;
		decimals: number;
	};
}

export interface IOftInfo {
	address: string;
	eid: number;
	name: string;
	symbol: string;
	decimals: number;
	oftType: string;
	peers: Array<{
		eid: number;
		address: string;
	}>;
}

export interface ITransferQuote {
	nativeFee: string;
	lzTokenFee: string;
	gasLimit: string;
	amountReceivedMin: string;
	estimatedTime: number;
}

export interface ITransferParams {
	srcEid: number;
	dstEid: number;
	oftAddress: string;
	recipientAddress: string;
	amount: string;
	minAmount?: string;
	options?: string;
}

/**
 * Make a request to the LayerZero OFT API
 */
export async function oftApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: 'GET' | 'POST',
	endpoint: string,
	body?: object,
	qs?: object,
): Promise<any> {
	const credentials = await this.getCredentials('layerZeroApi') as IOftApiCredentials;

	const options: any = {
		method,
		uri: `${API_URLS.OFT_API}${endpoint}`,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (credentials.oftApiKey) {
		options.headers['x-api-key'] = credentials.oftApiKey;
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
 * Get available OFT routes
 */
export async function getOftRoutes(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	srcEid?: number,
	dstEid?: number,
): Promise<IOftRoute[]> {
	const qs: any = {};
	if (srcEid) qs.srcEid = srcEid;
	if (dstEid) qs.dstEid = dstEid;

	const response = await oftApiRequest.call(this, 'GET', '/routes', undefined, qs);
	return response?.data || [];
}

/**
 * Get OFT info by address
 */
export async function getOftInfo(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	oftAddress: string,
	eid: number,
): Promise<IOftInfo | null> {
	const response = await oftApiRequest.call(this, 'GET', `/oft/${eid}/${oftAddress}`);
	return response?.data || null;
}

/**
 * Get transfer quote
 */
export async function getTransferQuote(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	params: ITransferParams,
): Promise<ITransferQuote> {
	const response = await oftApiRequest.call(this, 'POST', '/quote', {
		srcEid: params.srcEid,
		dstEid: params.dstEid,
		oftAddress: params.oftAddress,
		recipient: params.recipientAddress,
		amount: params.amount,
		minAmount: params.minAmount || '0',
		options: params.options || '0x',
	});

	return {
		nativeFee: response?.nativeFee || '0',
		lzTokenFee: response?.lzTokenFee || '0',
		gasLimit: response?.gasLimit || '200000',
		amountReceivedMin: response?.amountReceivedMin || '0',
		estimatedTime: response?.estimatedTime || 60,
	};
}

/**
 * Build transfer transaction
 */
export async function buildTransferTransaction(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	params: ITransferParams,
	nativeFee: string,
): Promise<{
	to: string;
	data: string;
	value: string;
	gasLimit: string;
}> {
	const response = await oftApiRequest.call(this, 'POST', '/build-tx', {
		srcEid: params.srcEid,
		dstEid: params.dstEid,
		oftAddress: params.oftAddress,
		recipient: params.recipientAddress,
		amount: params.amount,
		minAmount: params.minAmount || '0',
		options: params.options || '0x',
		nativeFee,
	});

	return {
		to: response?.to || '',
		data: response?.data || '',
		value: response?.value || nativeFee,
		gasLimit: response?.gasLimit || '200000',
	};
}

/**
 * Get OFTs by chain
 */
export async function getOftsByChain(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	eid: number,
): Promise<IOftInfo[]> {
	const response = await oftApiRequest.call(this, 'GET', `/chain/${eid}/ofts`);
	return response?.data || [];
}

/**
 * Get supported chains for OFT
 */
export async function getSupportedChains(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
): Promise<Array<{ eid: number; name: string; chainId: number }>> {
	const response = await oftApiRequest.call(this, 'GET', '/chains');
	return response?.data || [];
}

/**
 * Validate transfer parameters
 */
export async function validateTransfer(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	params: ITransferParams,
): Promise<{
	valid: boolean;
	errors: string[];
	warnings: string[];
}> {
	const response = await oftApiRequest.call(this, 'POST', '/validate', {
		srcEid: params.srcEid,
		dstEid: params.dstEid,
		oftAddress: params.oftAddress,
		recipient: params.recipientAddress,
		amount: params.amount,
	});

	return {
		valid: response?.valid ?? false,
		errors: response?.errors || [],
		warnings: response?.warnings || [],
	};
}

/**
 * Get OFT token details
 */
export async function getOftTokenDetails(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	oftAddress: string,
	eid: number,
): Promise<{
	name: string;
	symbol: string;
	decimals: number;
	totalSupply: string;
}> {
	const response = await oftApiRequest.call(this, 'GET', `/oft/${eid}/${oftAddress}/token`);
	return {
		name: response?.name || '',
		symbol: response?.symbol || '',
		decimals: response?.decimals || 18,
		totalSupply: response?.totalSupply || '0',
	};
}

/**
 * Get peer OFTs
 */
export async function getOftPeers(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	oftAddress: string,
	eid: number,
): Promise<Array<{ eid: number; address: string; chainName: string }>> {
	const response = await oftApiRequest.call(this, 'GET', `/oft/${eid}/${oftAddress}/peers`);
	return response?.data || [];
}
