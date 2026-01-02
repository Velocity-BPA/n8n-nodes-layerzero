/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IHookFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import { ENDPOINT_IDS, DEFAULT_GAS_LIMITS } from '../constants';

export interface IOnChainCredentials {
	privateKey?: string;
	mnemonic?: string;
	rpcEndpoints?: {
		endpoints: Array<{
			chainName: string;
			customChainName?: string;
			rpcUrl: string;
		}>;
	};
}

// LayerZero V2 Endpoint ABI (minimal)
const ENDPOINT_ABI = [
	'function quote(tuple(uint32 dstEid, bytes32 receiver, bytes message, bytes options, bool payInLzToken) _params, address _sender) view returns (tuple(uint256 nativeFee, uint256 lzTokenFee) fee)',
	'function send(tuple(uint32 dstEid, bytes32 receiver, bytes message, bytes options, bool payInLzToken) _params, tuple(uint256 nativeFee, uint256 lzTokenFee) _fee, address _refundAddress) payable returns (tuple(bytes32 guid, uint64 nonce, tuple(uint256 nativeFee, uint256 lzTokenFee) fee) receipt)',
	'function eid() view returns (uint32)',
	'function delegates(address _oapp) view returns (address)',
	'function getConfig(address _oapp, address _lib, uint32 _eid, uint32 _configType) view returns (bytes)',
	'function setSendLibrary(address _oapp, uint32 _eid, address _lib) external',
	'function setReceiveLibrary(address _oapp, uint32 _eid, address _lib, uint256 _gracePeriod) external',
	'function setConfig(address _oapp, address _lib, tuple(uint32 eid, uint32 configType, bytes config)[] _params) external',
];

// OFT ABI (minimal)
const OFT_ABI = [
	'function quoteSend(tuple(uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) _sendParam, bool _payInLzToken) view returns (tuple(uint256 nativeFee, uint256 lzTokenFee) fee)',
	'function send(tuple(uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) _sendParam, tuple(uint256 nativeFee, uint256 lzTokenFee) _fee, address _refundAddress) payable returns (tuple(bytes32 guid, uint64 nonce, tuple(uint256 nativeFee, uint256 lzTokenFee) fee) receipt)',
	'function endpoint() view returns (address)',
	'function peers(uint32 _eid) view returns (bytes32)',
	'function token() view returns (address)',
	'function sharedDecimals() view returns (uint8)',
	'function decimalConversionRate() view returns (uint256)',
	'function owner() view returns (address)',
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address account) view returns (uint256)',
];

// ERC20 ABI (minimal)
const ERC20_ABI = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address account) view returns (uint256)',
	'function allowance(address owner, address spender) view returns (uint256)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function transfer(address to, uint256 amount) returns (bool)',
];

/**
 * Get RPC URL for a chain
 */
function getRpcUrl(credentials: IOnChainCredentials, chainName: string): string | null {
	const endpoints = credentials.rpcEndpoints?.endpoints || [];
	const endpoint = endpoints.find((e) => {
		if (e.chainName === 'custom') {
			return e.customChainName === chainName;
		}
		return e.chainName === chainName;
	});
	return endpoint?.rpcUrl || null;
}

/**
 * Get provider for a chain
 */
export async function getProvider(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
): Promise<ethers.JsonRpcProvider> {
	const credentials = await this.getCredentials('layerZeroApi') as IOnChainCredentials;
	const rpcUrl = getRpcUrl(credentials, chainName);

	if (!rpcUrl) {
		throw new NodeOperationError(this.getNode(), `No RPC endpoint configured for chain: ${chainName}`);
	}

	return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get wallet for signing transactions
 */
export async function getWallet(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
): Promise<ethers.Wallet | ethers.HDNodeWallet> {
	const credentials = await this.getCredentials('layerZeroApi') as IOnChainCredentials;
	const provider = await getProvider.call(this, chainName);

	if (credentials.privateKey) {
		return new ethers.Wallet(credentials.privateKey, provider);
	}

	if (credentials.mnemonic) {
		const wallet = ethers.Wallet.fromPhrase(credentials.mnemonic);
		return wallet.connect(provider);
	}

	throw new NodeOperationError(this.getNode(), 'No wallet credentials configured');
}

/**
 * Get endpoint contract
 */
export async function getEndpointContract(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
	endpointAddress: string,
): Promise<ethers.Contract> {
	const provider = await getProvider.call(this, chainName);
	return new ethers.Contract(endpointAddress, ENDPOINT_ABI, provider);
}

/**
 * Get OFT contract
 */
export async function getOftContract(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
	oftAddress: string,
	withSigner: boolean = false,
): Promise<ethers.Contract> {
	if (withSigner) {
		const wallet = await getWallet.call(this, chainName);
		return new ethers.Contract(oftAddress, OFT_ABI, wallet);
	}

	const provider = await getProvider.call(this, chainName);
	return new ethers.Contract(oftAddress, OFT_ABI, provider);
}

/**
 * Get ERC20 contract
 */
export async function getErc20Contract(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
	tokenAddress: string,
	withSigner: boolean = false,
): Promise<ethers.Contract> {
	if (withSigner) {
		const wallet = await getWallet.call(this, chainName);
		return new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
	}

	const provider = await getProvider.call(this, chainName);
	return new ethers.Contract(tokenAddress, ERC20_ABI, provider);
}

/**
 * Quote OFT send
 */
export async function quoteOftSend(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
	oftAddress: string,
	dstEid: number,
	to: string,
	amountLD: bigint,
	options: string = '0x',
	payInLzToken: boolean = false,
): Promise<{ nativeFee: bigint; lzTokenFee: bigint }> {
	const oft = await getOftContract.call(this, chainName, oftAddress);

	const sendParam = {
		dstEid,
		to: ethers.zeroPadValue(to, 32),
		amountLD,
		minAmountLD: amountLD,
		extraOptions: options,
		composeMsg: '0x',
		oftCmd: '0x',
	};

	const [nativeFee, lzTokenFee] = await oft.quoteSend(sendParam, payInLzToken);
	return { nativeFee, lzTokenFee };
}

/**
 * Execute OFT send
 */
export async function executeOftSend(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
	oftAddress: string,
	dstEid: number,
	to: string,
	amountLD: bigint,
	options: string = '0x',
	nativeFee: bigint,
	lzTokenFee: bigint = 0n,
): Promise<{ txHash: string; guid: string; nonce: number }> {
	const oft = await getOftContract.call(this, chainName, oftAddress, true);
	const wallet = await getWallet.call(this, chainName);

	const sendParam = {
		dstEid,
		to: ethers.zeroPadValue(to, 32),
		amountLD,
		minAmountLD: amountLD,
		extraOptions: options,
		composeMsg: '0x',
		oftCmd: '0x',
	};

	const fee = { nativeFee, lzTokenFee };
	const gasLimit = DEFAULT_GAS_LIMITS[chainName] || DEFAULT_GAS_LIMITS.default;

	const tx = await oft.send(sendParam, fee, wallet.address, {
		value: nativeFee,
		gasLimit,
	});

	const receipt = await tx.wait();

	// Parse the receipt event for GUID and nonce
	// This is a simplified version - actual implementation would parse events
	return {
		txHash: receipt.hash,
		guid: receipt.logs[0]?.topics[1] || '',
		nonce: 0,
	};
}

/**
 * Get OFT peer address
 */
export async function getOftPeer(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
	oftAddress: string,
	remoteEid: number,
): Promise<string> {
	const oft = await getOftContract.call(this, chainName, oftAddress);
	const peer = await oft.peers(remoteEid);
	return peer;
}

/**
 * Get OFT token info
 */
export async function getOftTokenInfo(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
	oftAddress: string,
): Promise<{
	name: string;
	symbol: string;
	decimals: number;
	totalSupply: string;
	sharedDecimals: number;
}> {
	const oft = await getOftContract.call(this, chainName, oftAddress);

	const [name, symbol, decimals, totalSupply, sharedDecimals] = await Promise.all([
		oft.name(),
		oft.symbol(),
		oft.decimals(),
		oft.totalSupply(),
		oft.sharedDecimals(),
	]);

	return {
		name,
		symbol,
		decimals: Number(decimals),
		totalSupply: totalSupply.toString(),
		sharedDecimals: Number(sharedDecimals),
	};
}

/**
 * Get token balance
 */
export async function getTokenBalance(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
	tokenAddress: string,
	walletAddress: string,
): Promise<string> {
	const token = await getErc20Contract.call(this, chainName, tokenAddress);
	const balance = await token.balanceOf(walletAddress);
	return balance.toString();
}

/**
 * Approve token spending
 */
export async function approveToken(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
	tokenAddress: string,
	spenderAddress: string,
	amount: bigint,
): Promise<string> {
	const token = await getErc20Contract.call(this, chainName, tokenAddress, true);
	const tx = await token.approve(spenderAddress, amount);
	const receipt = await tx.wait();
	return receipt.hash;
}

/**
 * Get gas price for a chain
 */
export async function getGasPrice(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
): Promise<{ gasPrice: string; maxFeePerGas?: string; maxPriorityFeePerGas?: string }> {
	const provider = await getProvider.call(this, chainName);
	const feeData = await provider.getFeeData();

	return {
		gasPrice: feeData.gasPrice?.toString() || '0',
		maxFeePerGas: feeData.maxFeePerGas?.toString(),
		maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
	};
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
	to: string,
	data: string,
	value: string = '0',
): Promise<string> {
	const provider = await getProvider.call(this, chainName);
	const gasEstimate = await provider.estimateGas({
		to,
		data,
		value: BigInt(value),
	});
	return gasEstimate.toString();
}

/**
 * Get chain ID
 */
export async function getChainId(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
): Promise<number> {
	const provider = await getProvider.call(this, chainName);
	const network = await provider.getNetwork();
	return Number(network.chainId);
}

/**
 * Get block number
 */
export async function getBlockNumber(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	chainName: string,
): Promise<number> {
	const provider = await getProvider.call(this, chainName);
	return await provider.getBlockNumber();
}

/**
 * Convert chain name to EID
 */
export function chainNameToEid(chainName: string): number {
	return ENDPOINT_IDS[chainName] || 0;
}

/**
 * Convert EID to chain name
 */
export function eidToChainName(eid: number): string | null {
	const entry = Object.entries(ENDPOINT_IDS).find(([_, id]) => id === eid);
	return entry ? entry[0] : null;
}

/**
 * Validate address format
 */
export function validateAddress(address: string): boolean {
	return ethers.isAddress(address);
}

/**
 * Convert address to bytes32 format
 */
export function addressToBytes32(address: string): string {
	return ethers.zeroPadValue(address, 32);
}

/**
 * Convert bytes32 to address
 */
export function bytes32ToAddress(bytes32: string): string {
	return ethers.getAddress('0x' + bytes32.slice(-40));
}
