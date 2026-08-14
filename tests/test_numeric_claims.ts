import { test } from 'node:test';
import * as assert from 'node:assert';
import { verifyNumericClaims } from './server';

test('Validates matching numbers correctly', () => {
    const numericData = {
        reservoirOutflow: 50000,
        stage: 527, danger_level: 530, warning_level: 528,
        rainfall_72h: 120, reservoirs_pct: 88,
        temp_max: 42.5, humidity: 30
    };
    
    const validText = "The reservoir outflow is 50000 cusecs and rainfall is 120 mm. Temperature is 42.5°C.";
    assert.strictEqual(verifyNumericClaims(validText, numericData), true);
});

test('Rejects hallucinated mismatched numbers', () => {
    const numericData = {
        reservoirOutflow: 50000,
        stage: 527, danger_level: 530, warning_level: 528,
        rainfall_72h: 120, reservoirs_pct: 88,
        temp_max: 42.5, humidity: 30
    };
    
    // 55555 is not in the data
    const invalidText = "The reservoir outflow is 55555 cusecs and rainfall is 120 mm.";
    assert.strictEqual(verifyNumericClaims(invalidText, numericData), false);
});

test('Allows typical constants and percentages', () => {
    const numericData = {
        rainfall_72h: 0.85
    };
    
    // 85 is allowed because it's 0.85 * 100
    // 24 is allowed because it's a common constant
    const allowedText = "Over 24 hours, rainfall was 85%.";
    assert.strictEqual(verifyNumericClaims(allowedText, numericData), true);
});
