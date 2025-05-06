/**
 * Tests for the ExporterManager
 */
import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock dependencies
jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Import fs after mocking
import fs from 'fs';

// Create mock exporters for testing
class MockExporter1 {
  constructor() {
    this.name = 'mock1';
    this.description = 'Mock Exporter 1';
    this.supportedFormats = ['mock1'];
  }
}

class MockExporter2 {
  constructor() {
    this.name = 'mock2';
    this.description = 'Mock Exporter 2';
    this.supportedFormats = ['mock2'];
  }
}

// Import the module under test
import { ExporterManager, exporterManager } from '../../src/core/plugins/ExporterManager.ts';

describe('ExporterManager', () => {
  let manager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    manager = new ExporterManager();
  });
  
  describe('registerExporter', () => {
    test('should register a new exporter', () => {
      const factory = () => new MockExporter1();
      manager.registerExporter('mock1', factory);
      
      expect(manager.hasExporter('mock1')).toBe(true);
    });
    
    test('should overwrite existing exporter with same name', () => {
      // Spy on console.warn
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const factory1 = () => new MockExporter1();
      const factory2 = () => new MockExporter2();
      
      manager.registerExporter('same-name', factory1);
      manager.registerExporter('same-name', factory2);
      
      // Get the exporter instance
      const exporter = manager.getExporter('same-name');
      
      // It should be the second one
      expect(exporter.description).toBe('Mock Exporter 2');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Warnung'));
      
      // Restore console.warn
      warnSpy.mockRestore();
    });
  });
  
  describe('hasExporter', () => {
    test('should return true for registered exporters', () => {
      manager.registerExporter('mock1', () => new MockExporter1());
      
      expect(manager.hasExporter('mock1')).toBe(true);
      expect(manager.hasExporter('non-existent')).toBe(false);
    });
  });
  
  describe('getExporter', () => {
    test('should return exporter instance for registered exporter', () => {
      manager.registerExporter('mock1', () => new MockExporter1());
      
      const exporter = manager.getExporter('mock1');
      
      expect(exporter).toBeInstanceOf(MockExporter1);
      expect(exporter.name).toBe('mock1');
    });
    
    test('should return undefined for non-existent exporter', () => {
      const exporter = manager.getExporter('non-existent');
      
      expect(exporter).toBeUndefined();
    });
    
    test('should cache instances', () => {
      const factorySpy = jest.fn(() => new MockExporter1());
      
      manager.registerExporter('mock1', factorySpy);
      
      // First call should invoke the factory
      const exporter1 = manager.getExporter('mock1');
      expect(factorySpy).toHaveBeenCalledTimes(1);
      
      // Second call should use cached instance
      const exporter2 = manager.getExporter('mock1');
      expect(factorySpy).toHaveBeenCalledTimes(1);
      
      // Both should be the same instance
      expect(exporter1).toBe(exporter2);
    });
    
    test('should create new instance after registration change', () => {
      manager.registerExporter('mock1', () => new MockExporter1());
      
      // Get first instance
      const exporter1 = manager.getExporter('mock1');
      expect(exporter1).toBeInstanceOf(MockExporter1);
      
      // Register new factory for same name
      manager.registerExporter('mock1', () => new MockExporter2());
      
      // Get new instance
      const exporter2 = manager.getExporter('mock1');
      expect(exporter2).toBeInstanceOf(MockExporter2);
      expect(exporter2.description).toBe('Mock Exporter 2');
    });
  });
  
  describe('getAvailableExporters', () => {
    test('should return list of registered exporter names', () => {
      manager.registerExporter('mock1', () => new MockExporter1());
      manager.registerExporter('mock2', () => new MockExporter2());
      
      const exporters = manager.getAvailableExporters();
      
      expect(exporters).toEqual(['mock1', 'mock2']);
    });
    
    test('should return empty array when no exporters are registered', () => {
      const exporters = manager.getAvailableExporters();
      
      expect(exporters).toEqual([]);
    });
  });
  
  describe('singleton exporterManager', () => {
    test('should be an instance of ExporterManager', () => {
      expect(exporterManager).toBeInstanceOf(ExporterManager);
    });
  });
}); 