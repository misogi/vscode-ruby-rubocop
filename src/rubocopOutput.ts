// output of rubocop JSON format
interface RubocopSummary {
    offence_count: number;
    target_file_count: number;
    inspected_file_count: number;
}

interface RubocopLocation {
    line: number;
    column: number;
    length: number;
}

export interface RubocopOffense {
    severity: string;
    message: string;
    cop_name: string;
    corrected: boolean;
    location: RubocopLocation;
}

export interface RubocopFile {
    path: string;
    offenses: Array<RubocopOffense>;
}

interface RubocopMetadata {
    rubocop_version: string;
    rubocop_engine: string;
    ruby_version: string;
    ruby_patchlevel: string;
    ruby_platform: string;
}

export interface RubocopOutput {
    metadata: RubocopMetadata;
    files: Array<RubocopFile>;
    summary: RubocopSummary;
}
