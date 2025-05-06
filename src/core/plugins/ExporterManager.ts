/**
 * ExporterManager - Verwaltet alle Exporter-Plugins
 * 
 * Diese Klasse ist verantwortlich für das Laden, Registrieren und Verwalten aller
 * Exporter-Plugins im System.
 */

import fs from 'fs';
import path from 'path';
import { BaseExporter, ExporterFactory } from './BaseExporter.js';

export class ExporterManager {
  /**
   * Map aller registrierten Exporter (Name => Factory-Funktion)
   */
  private exporters: Map<string, ExporterFactory> = new Map();
  
  /**
   * Instanzen von Exportern, die bereits erstellt wurden (Name => Instanz)
   */
  private instances: Map<string, BaseExporter> = new Map();
  
  /**
   * Registriert einen neuen Exporter
   * 
   * @param name Name des Exporters
   * @param factory Factory-Funktion zur Erzeugung einer Exporter-Instanz
   */
  public registerExporter(name: string, factory: ExporterFactory): void {
    if (this.exporters.has(name)) {
      console.warn(`Warnung: Exporter mit dem Namen "${name}" wird überschrieben`);
    }
    
    this.exporters.set(name, factory);
    
    // Verwerfe bestehende Instanz, falls vorhanden
    if (this.instances.has(name)) {
      this.instances.delete(name);
    }
  }
  
  /**
   * Prüft, ob ein Exporter mit dem angegebenen Namen registriert ist
   * 
   * @param name Name des Exporters
   * @returns True, wenn der Exporter existiert
   */
  public hasExporter(name: string): boolean {
    return this.exporters.has(name);
  }
  
  /**
   * Gibt eine Instanz des angeforderten Exporters zurück
   * 
   * @param name Name des Exporters
   * @returns Exporter-Instanz oder undefined, wenn nicht gefunden
   */
  public getExporter(name: string): BaseExporter | undefined {
    // Wenn bereits eine Instanz existiert, gib diese zurück
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }
    
    // Wenn der Exporter nicht registriert ist, gib undefined zurück
    if (!this.exporters.has(name)) {
      return undefined;
    }
    
    // Erstelle eine neue Instanz
    const factory = this.exporters.get(name)!;
    const instance = factory();
    
    // Speichere die Instanz für zukünftige Anfragen
    this.instances.set(name, instance);
    
    return instance;
  }
  
  /**
   * Lädt alle verfügbaren Exporter aus dem angegebenen Verzeichnis
   * 
   * @param directory Verzeichnis, aus dem die Exporter geladen werden sollen
   */
  public async loadExportersFromDirectory(directory: string): Promise<void> {
    try {
      const files = fs.readdirSync(directory);
      
      for (const file of files) {
        // Ignoriere Dateien, die nicht mit "Exporter" enden oder keine .js-Dateien sind
        if (!file.endsWith('Exporter.js') || !file.endsWith('.js')) {
          continue;
        }
        
        const fullPath = path.join(directory, file);
        
        try {
          // Dynamischer Import des Exporters
          const exporterModule = await import(`file://${fullPath}`);
          
          if (!exporterModule.default) {
            console.warn(`Warnung: Modul ${file} hat keinen default export`);
            continue;
          }
          
          // Instanziiere den Exporter
          const exporter = new exporterModule.default();
          
          // Prüfe, ob es eine gültige BaseExporter-Instanz ist
          if (!(exporter instanceof BaseExporter)) {
            console.warn(`Warnung: ${file} exportiert keine BaseExporter-Instanz`);
            continue;
          }
          
          // Registriere den Exporter
          this.registerExporter(exporter.name, () => exporter);
          console.log(`Exporter "${exporter.name}" geladen`);
        } catch (err) {
          console.error(`Fehler beim Laden des Exporters ${file}:`, err);
        }
      }
    } catch (err) {
      console.error(`Fehler beim Lesen des Verzeichnisses ${directory}:`, err);
    }
  }
  
  /**
   * Gibt eine Liste aller verfügbaren Exporter zurück
   * 
   * @returns Liste der Namen aller registrierten Exporter
   */
  public getAvailableExporters(): string[] {
    return Array.from(this.exporters.keys());
  }
  
  /**
   * Lädt Exporter aus der Konfigurationsdatei
   * 
   * @param configPath Pfad zur Konfigurationsdatei
   */
  public async loadExportersFromConfig(configPath: string): Promise<void> {
    try {
      // Prüfe, ob die Konfigurationsdatei existiert
      if (!fs.existsSync(configPath)) {
        console.warn(`Konfigurationsdatei ${configPath} existiert nicht`);
        return;
      }
      
      // Lade die Konfiguration
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      if (!config.exporters || !Array.isArray(config.exporters)) {
        console.warn(`Konfigurationsdatei ${configPath} enthält keine gültigen Exporter`);
        return;
      }
      
      // Lade jeden Exporter
      for (const exporterConfig of config.exporters) {
        if (!exporterConfig.path || !exporterConfig.name) {
          console.warn('Ungültige Exporter-Konfiguration:', exporterConfig);
          continue;
        }
        
        try {
          const fullPath = path.resolve(process.cwd(), exporterConfig.path);
          const exporterModule = await import(`file://${fullPath}`);
          
          if (!exporterModule.default) {
            console.warn(`Warnung: Modul ${exporterConfig.path} hat keinen default export`);
            continue;
          }
          
          // Instanziiere den Exporter
          const exporter = new exporterModule.default();
          
          // Prüfe, ob es eine gültige BaseExporter-Instanz ist
          if (!(exporter instanceof BaseExporter)) {
            console.warn(`Warnung: ${exporterConfig.path} exportiert keine BaseExporter-Instanz`);
            continue;
          }
          
          // Registriere den Exporter unter dem angegebenen Namen
          this.registerExporter(exporterConfig.name, () => exporter);
          console.log(`Exporter "${exporterConfig.name}" geladen`);
        } catch (err) {
          console.error(`Fehler beim Laden des Exporters ${exporterConfig.path}:`, err);
        }
      }
    } catch (err) {
      console.error(`Fehler beim Laden der Exporter aus der Konfiguration:`, err);
    }
  }
}

// Singleton-Instanz
export const exporterManager = new ExporterManager(); 