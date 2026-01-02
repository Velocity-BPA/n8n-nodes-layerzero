/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IHookFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { API_URLS } from '../constants';

export interface IChainInfo {
	eid: number;
	name: string;
	chainId: number;
	network: 'mainnet' | 'testnet';
	chainType: 'evm' | 'solana' | 'aptos' | 'tron';
	endpointAddress: string;
	sendLibrary?: string;
	receiveLibrary?: string;
	explorer: string;
	rpcUrls: string[];
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
}

export interface IContractAddresses {
	endpoint: string;
	sendLibrary: string;
	receiveLibrary: string;
	dvn: Record<string, string>;
	executor: Record<string, string>;
}

export interface IDvnInfo {
	name: string;
	address: string;
	eid: number;
	supportedChains: number[];
}

export interface IExecutorInfo {
	name: string;
	address: string;
	eid: number;
	supportedChains: number[];
}

/**
 * Make a request to the LayerZero Metadata API
 */
export async function metadataApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: 'GET' | 'POST',
	endpoint: string,
	body?: object,
	qs?: object,
): Promise<any> {
	const options: any = {
		method,
		uri: `${API_URLS.METADATA_API}${endpoint}`,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
	};

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
 * Get all supported chains
 */
export async function getAllChains(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	network?: 'mainnet' | 'testnet',
): Promise<IChainInfo[]> {
	const qs: any = {};
	if (network) qs.network = network;

	const response = await metadataApiRequest.call(this, 'GET', '/chains', undefined, qs);
	return response?.data || [];
}

/**
 * Get chain info by EID
 */
export async function getChainByEid(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	eid: number,
): Promise<IChainInfo | null> {
	const response = await metadataApiRequest.call(this, 'GET', `/chains/${eid}`);
	return response?.data || null;
}

/**
 * Get contract addresses for a chain
 */
export async function getContractAddresses(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	eid: number,
): Promise<IContractAddresses> {
	const response = await metadataApiRequest.call(this, 'GET', `/chains/${eid}/contracts`);
	return {
		endpoint: response?.endpoint || '',
		sendLibrary: response?.sendLibrary || '',
		receiveLibrary: response?.receiveLibrary || '',
		dvn: response?.dvn || {},
		executor: response?.executor || {},
	};
}

/**
 * Get all endpoints
 */
export async function getEndpoints(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	network?: 'mainnet' | 'testnet',
): Promise<Array<{ eid: number; address: string; chainName: string }>> {
	const qs: any = {};
	if (network) qs.network = network;

	const response = await metadataApiRequest.call(this, 'GET', '/endpoints', undefined, qs);
	return response?.data || [];
}

/**
 * Get DVN providers
 */
export async function getDvnProviders(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
): Promise<IDvnInfo[]> {
	const response = await metadataApiRequest.call(this, 'GET', '/dvns');
	return response?.data || [];
}

/**
 * Get DVN by chain
 */
export async function getDvnsByChain(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	eid: number,
): Promise<IDvnInfo[]> {
	const response = await metadataApiRequest.call(this, 'GET', `/chains/${eid}/dvns`);
	return response?.data || [];
}

/**
 * Get executor providers
 */
export async function getExecutorProviders(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
): Promise<IExecutorInfo[]> {
	const response = await metadataApiRequest.call(this, 'GET', '/executors');
	return response?.data || [];
}

/**
 * Get executors by chain
 */
export async function getExecutorsByChain(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	eid: number,
): Promise<IExecutorInfo[]> {
	const response = await metadataApiRequest.call(this, 'GET', `/chains/${eid}/executors`);
	return response?.data || [];
}

/**
 * Get message libraries
 */
export async function getMessageLibraries(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	eid: number,
): Promise<Array<{ version: string; sendLibrary: string; receiveLibrary: string }>> {
	const response = await metadataApiRequest.call(this, 'GET', `/chains/${eid}/libraries`);
	return response?.data || [];
}

/**
 * Get token list for a chain
 */
export async function getTokenList(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	eid: number,
): Promise<Array<{ address: string; symbol: string; name: string; decimals: number }>> {
	const response = await metadataApiRequest.call(this, 'GET', `/chains/${eid}/tokens`);
	return response?.data || [];
}

/**
 * Get explorer links
 */
export async function getExplorerLinks(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	eid: number,
): Promise<{ tx: string; address: string; block: string }> {
	const chainInfo = await getChainByEid.call(this, eid);
	const explorer = chainInfo?.explorer || '';

	return {
		tx: `${explorer}/tx/`,
		address: `${explorer}/address/`,
		block: `${explorer}/block/`,
	};
}

/**
 * Get public RPC endpoints
 */
export async function getPublicRpcEndpoints(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	eid: number,
): Promise<string[]> {
	const chainInfo = await getChainByEid.call(this, eid);
	return chainInfo?.rpcUrls || [];
}

/**
 * Check pathway support
 */
export async function checkPathwaySupport(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	srcEid: number,
	dstEid: number,
): Promise<{
	supported: boolean;
	sendLibrary: string;
	receiveLibrary: string;
	dvns: string[];
}> {
	const response = await metadataApiRequest.call(this, 'GET', `/pathways/${srcEid}/${dstEid}`);
	return {
		supported: response?.supported ?? false,
		sendLibrary: response?.sendLibrary || '',
		receiveLibrary: response?.receiveLibrary || '',
		dvns: response?.dvns || [],
	};
}

/**
 * Get default config for pathway
 */
export async function getDefaultConfig(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	srcEid: number,
	dstEid: number,
): Promise<{
	sendLibrary: string;
	receiveLibrary: string;
	requiredDvns: string[];
	optionalDvns: string[];
	executor: string;
	confirmations: number;
}> {
	const response = await metadataApiRequest.call(this, 'GET', `/pathways/${srcEid}/${dstEid}/config`);
	return {
		sendLibrary: response?.sendLibrary || '',
		receiveLibrary: response?.receiveLibrary || '',
		requiredDvns: response?.requiredDvns || [],
		optionalDvns: response?.optionalDvns || [],
		executor: response?.executor || '',
		confirmations: response?.confirmations || 0,
	};
}

/**
 * Get protocol version
 */
export async function getProtocolVersion(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
): Promise<{ version: string; contracts: string[] }> {
	const response = await metadataApiRequest.call(this, 'GET', '/version');
	return {
		version: response?.version || 'v2',
		contracts: response?.contracts || [],
	};
}

/**
 * Get API status
 */
export async function getApiStatus(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
): Promise<{ status: string; timestamp: number }> {
	const response = await metadataApiRequest.call(this, 'GET', '/health');
	return {
		status: response?.status || 'unknown',
		timestamp: response?.timestamp || Date.now(),
	};
}

/**
 * Get DVN info by name/address
 */
export async function getDvnInfo(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	dvnIdentifier: string,
	eid?: number,
): Promise<IDvnInfo | null> {
	// First try to get all DVNs and find by name or address
	const dvns = eid
		? await getDvnsByChain.call(this, eid)
		: await getDvnProviders.call(this);

	const found = dvns.find(
		(d) => d.name.toLowerCase() === dvnIdentifier.toLowerCase() ||
		d.address.toLowerCase() === dvnIdentifier.toLowerCase()
	);

	return found || null;
}

/**
 * Get Executor info by name/address
 */
export async function getExecutorInfo(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	executorIdentifier: string,
	eid?: number,
): Promise<IExecutorInfo | null> {
	// First try to get all executors and find by name or address
	const executors = eid
		? await getExecutorsByChain.call(this, eid)
		: await getExecutorProviders.call(this);

	const found = executors.find(
		(e) => e.name.toLowerCase() === executorIdentifier.toLowerCase() ||
		e.address.toLowerCase() === executorIdentifier.toLowerCase()
	);

	return found || null;
}
