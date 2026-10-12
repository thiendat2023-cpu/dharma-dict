export type ActiveTab = 'eng-to-vi' | 'vi-to-eng' | 'sentence-eng-to-vi' | 'compare-eng-pali';

export interface WordTableRow {
  caseOrPerson: string;
  singularForm: string;
  singularMeaning: string;
  pluralForm: string;
  pluralMeaning: string;
  isCurrentSingular?: boolean;
  isCurrentPlural?: boolean;
}

export interface WordTableData {
  title: string;
  paradigmType: string;
  rows: WordTableRow[];
}

export interface EngWordAnalysisResult {
  analyzedWord: string;
  rootAndType: {
    root: string;
    base: string;
    wordType: string;
    paliEquivalent?: string;
    genderOrClass?: string;
    etymologyNote?: string;
  };
  currentMorphology: {
    classification: string;
    englishTerm?: string;
    paliTerm?: string;
    number: string;
    summary: string;
    alternativeForms?: string[];
  };
  directMeaning: string;
  nuancesAndTraditions?: string;
  markdownTable?: string;
  tableData?: WordTableData;
  formattedMarkdown?: string;
}

export interface ViToEngAnalysisResult {
  vietnameseWord: string;
  analyzedWord: string;
  rootAndType: {
    root: string;
    base: string;
    wordType: string;
    paliEquivalent?: string;
    genderOrClass?: string;
    etymologyNote?: string;
  };
  currentMorphology: {
    classification: string;
    englishTerm?: string;
    paliTerm?: string;
    number: string;
    summary: string;
    alternativeForms?: string[];
  };
  directMeaning?: string;
  markdownTable?: string;
  tableData?: WordTableData;
  formattedMarkdown?: string;
}

export interface AnalyzedSentenceWord {
  word: string;
  vietnameseMeaning: string;
  abbreviation: string;
  detailedAnalysis: string;
}

export interface SentenceEngToViResult {
  originalSentence: string;
  words: AnalyzedSentenceWord[];
  smoothTranslation: string;
  rawOutput: string;
}

export interface ComparisonPoint {
  aspect: string;
  paliPerspective: string;
  englishPerspective: string;
  analysis: string;
}

export interface CompareEngPaliResult {
  englishTerm: string;
  paliTerm: string;
  sanskritTerm?: string;
  vietnameseTerm: string;
  paliEtymology: string;
  scholarlyTranslations?: string;
  semanticComparison: string;
  comparisonPoints?: ComparisonPoint[];
  classicalQuotes?: string;
  rawOutput: string;
}

export type HubResult =
  | { mode: 'eng-to-vi'; data: EngWordAnalysisResult }
  | { mode: 'vi-to-eng'; data: ViToEngAnalysisResult }
  | { mode: 'sentence-eng-to-vi'; data: SentenceEngToViResult }
  | { mode: 'compare-eng-pali'; data: CompareEngPaliResult };

export interface HistoryItem {
  id: string;
  mode: ActiveTab;
  query: string;
  summary: string;
  timestamp: number;
  bookmarked: boolean;
  result: HubResult;
}
