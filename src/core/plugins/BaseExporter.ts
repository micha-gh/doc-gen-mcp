/**
 * BaseExporter - Abstrakte Basisklasse für alle Exporter-Plugins
 * 
 * Diese Klasse definiert die Grundstruktur und Schnittstelle, die alle Exporter
 * implementieren müssen, um mit dem doc-gen-mcp System zu funktionieren.
 */

export interface ExportOptions {
  /**
   * Titel des Dokuments oder der Exportdatei
   */
  title?: string;
  
  /**
   * Optional: Pfad zur Konfigurationsdatei für den Exporter
   */
  configPath?: string;
  
  /**
   * Zusätzliche Label/Tags für das exportierte Dokument
   */
  labels?: string[];
  
  /**
   * Nach Kategorie gruppieren
   */
  byCategory?: boolean;
  
  /**
   * Validierung vor dem Export durchführen
   */
  validateBeforeExport?: boolean;
  
  /**
   * Zusätzliche exporterspezifische Optionen
   */
  [key: string]: any;
}

export interface ExportResult {
  /**
   * Gibt an, ob der Export erfolgreich war
   */
  success: boolean;
  
  /**
   * Fehlermeldung bei nicht erfolgreichem Export
   */
  error?: string;
  
  /**
   * Details zum Export (z.B. erstellte Seiten, Dateipfade, etc.)
   */
  details?: any;
}

/**
 * Der Inhalt, der exportiert werden soll
 */
export interface ExportContent {
  /**
   * Die zu exportierenden Einträge
   */
  entries?: Array<{
    category?: string;
    title: string;
    content: string;
    code?: Record<string, string>;
    [key: string]: any;
  }>;
  
  /**
   * Alternative Eingabeformate, die vom System konvertiert werden
   */
  rules?: any[];
  api?: any[];
  config?: any[];
  
  /**
   * Rohinhalt (z.B. für direkte Markdown-Exporte)
   */
  rawContent?: string;
}

/**
 * Abstrakte Basisklasse für alle Exporter
 */
export abstract class BaseExporter {
  /**
   * Eindeutiger Name des Exporters
   */
  public abstract readonly name: string;
  
  /**
   * Beschreibung des Exporters
   */
  public abstract readonly description: string;
  
  /**
   * Unterstützte Dateierweiterungen oder Zielformate
   */
  public abstract readonly supportedFormats: string[];
  
  /**
   * Pfad zur Standardkonfigurationsdatei
   */
  public abstract readonly defaultConfigPath: string;
  
  /**
   * Prüft, ob der Exporter für die aktuelle Umgebung konfiguriert ist
   * 
   * @returns True wenn der Exporter konfiguriert und einsatzbereit ist
   */
  public abstract isConfigured(): Promise<boolean>;
  
  /**
   * Führt den Export durch
   * 
   * @param content Der zu exportierende Inhalt
   * @param options Exportoptionen
   * @returns Ergebnis des Exports
   */
  public abstract export(content: ExportContent, options?: ExportOptions): Promise<ExportResult>;
  
  /**
   * Lädt die Konfiguration für den Exporter
   * 
   * @param configPath Optionaler Pfad zur Konfigurationsdatei
   * @returns Die geladene Konfiguration
   */
  public abstract loadConfig(configPath?: string): Promise<any>;
  
  /**
   * Validiert den Inhalt vor dem Export
   * 
   * @param content Der zu validierende Inhalt
   * @returns Validierungsergebnis
   */
  public abstract validateContent(content: ExportContent): Promise<{
    valid: boolean;
    issues?: Array<{message: string; severity: 'error' | 'warning' | 'info'}>;
  }>;
  
  /**
   * Gibt einen CLI-Befehl zurück, um diesen Exporter zu verwenden
   * 
   * @returns CLI Befehlsbeispiel
   */
  public getCliExample(): string {
    return `bin/gendoc.js --input ./src --export-format ${this.name}`;
  }
}

/**
 * Factory-Typ für die Erstellung von Exporter-Instanzen
 */
export type ExporterFactory = () => BaseExporter; 