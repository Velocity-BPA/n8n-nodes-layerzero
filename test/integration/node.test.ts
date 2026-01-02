/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { LayerZero } from '../../nodes/LayerZero/LayerZero.node';
import { LayerZeroTrigger } from '../../nodes/LayerZero/LayerZeroTrigger.node';

describe('LayerZero Node', () => {
	let node: LayerZero;

	beforeEach(() => {
		node = new LayerZero();
	});

	describe('Node Description', () => {
		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('LayerZero');
		});

		it('should have correct name', () => {
			expect(node.description.name).toBe('layerZero');
		});

		it('should have description', () => {
			expect(node.description.description).toBeDefined();
			expect(node.description.description.length).toBeGreaterThan(0);
		});

		it('should require credentials', () => {
			expect(node.description.credentials).toBeDefined();
			expect(node.description.credentials).toHaveLength(1);
			expect(node.description.credentials![0].name).toBe('layerZeroApi');
		});

		it('should have main input and output', () => {
			expect(node.description.inputs).toContain('main');
			expect(node.description.outputs).toContain('main');
		});
	});

	describe('Resources', () => {
		it('should have resource property', () => {
			const resourceProperty = node.description.properties.find(
				(p) => p.name === 'resource'
			);
			expect(resourceProperty).toBeDefined();
			expect(resourceProperty?.type).toBe('options');
		});

		it('should have all 16 resources', () => {
			const resourceProperty = node.description.properties.find(
				(p) => p.name === 'resource'
			);
			const options = resourceProperty?.options as Array<{ value: string }>;
			expect(options).toBeDefined();
			
			const expectedResources = [
				'messageTracking',
				'oftTransfers',
				'onftOperations',
				'endpointOperations',
				'dvn',
				'executor',
				'feeEstimation',
				'oappConfiguration',
				'messageOptions',
				'zroToken',
				'protocolAnalytics',
				'endpointMetadata',
				'composeMessages',
				'pathwayConfiguration',
				'transactionBuilding',
				'utility',
			];

			for (const resource of expectedResources) {
				const found = options?.find((o) => o.value === resource);
				expect(found).toBeDefined();
			}
		});
	});

	describe('Operations', () => {
		it('should have operation properties for each resource', () => {
			const operationProperties = node.description.properties.filter(
				(p) => p.name === 'operation'
			);
			expect(operationProperties.length).toBeGreaterThan(0);
		});

		it('should have displayOptions on operation properties', () => {
			const operationProperties = node.description.properties.filter(
				(p) => p.name === 'operation'
			);
			for (const op of operationProperties) {
				expect(op.displayOptions).toBeDefined();
				expect(op.displayOptions?.show).toBeDefined();
				expect(op.displayOptions?.show?.resource).toBeDefined();
			}
		});
	});
});

describe('LayerZero Trigger Node', () => {
	let trigger: LayerZeroTrigger;

	beforeEach(() => {
		trigger = new LayerZeroTrigger();
	});

	describe('Node Description', () => {
		it('should have correct display name', () => {
			expect(trigger.description.displayName).toBe('LayerZero Trigger');
		});

		it('should have correct name', () => {
			expect(trigger.description.name).toBe('layerZeroTrigger');
		});

		it('should be a polling trigger', () => {
			expect(trigger.description.polling).toBe(true);
		});

		it('should have no inputs', () => {
			expect(trigger.description.inputs).toEqual([]);
		});

		it('should have main output', () => {
			expect(trigger.description.outputs).toContain('main');
		});

		it('should be in trigger group', () => {
			expect(trigger.description.group).toContain('trigger');
		});
	});

	describe('Events', () => {
		it('should have event property', () => {
			const eventProperty = trigger.description.properties.find(
				(p) => p.name === 'event'
			);
			expect(eventProperty).toBeDefined();
			expect(eventProperty?.type).toBe('options');
		});

		it('should have all expected events', () => {
			const eventProperty = trigger.description.properties.find(
				(p) => p.name === 'event'
			);
			const options = eventProperty?.options as Array<{ value: string }>;
			
			const expectedEvents = [
				'messageDelivered',
				'messageSent',
				'messageFailed',
				'messageInflight',
				'largeTransfer',
				'oappMessage',
				'walletActivity',
			];

			for (const event of expectedEvents) {
				const found = options?.find((o) => o.value === event);
				expect(found).toBeDefined();
			}
		});
	});

	describe('Filters', () => {
		it('should have source chain filter', () => {
			const srcChain = trigger.description.properties.find(
				(p) => p.name === 'srcChain'
			);
			expect(srcChain).toBeDefined();
			expect(srcChain?.type).toBe('options');
		});

		it('should have destination chain filter', () => {
			const dstChain = trigger.description.properties.find(
				(p) => p.name === 'dstChain'
			);
			expect(dstChain).toBeDefined();
			expect(dstChain?.type).toBe('options');
		});
	});
});

describe('Credential Integration', () => {
	it('should have LayerZeroApi credential type', () => {
		const node = new LayerZero();
		const credentials = node.description.credentials;
		expect(credentials).toBeDefined();
		expect(credentials![0].name).toBe('layerZeroApi');
		expect(credentials![0].required).toBe(true);
	});

	it('should have same credential for trigger', () => {
		const trigger = new LayerZeroTrigger();
		const credentials = trigger.description.credentials;
		expect(credentials).toBeDefined();
		expect(credentials![0].name).toBe('layerZeroApi');
	});
});
