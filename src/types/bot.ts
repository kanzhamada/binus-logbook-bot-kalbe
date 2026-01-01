export interface ActivityData {
  activity: string;
  description: string;
  date?: string; // Format: "DD Month YYYY" or similar
}

export interface ExcelData {
  [key: string]: ActivityData;
}

export interface BotConfig {
  clockInTime: string;
  clockOutTime: string;
  excelFilePath: string;
  logbookMonth: string;
  internshipSemester: string;
}

export interface BotState {
  currentRow: number;
  totalRows: number;
  processedDates: string[];
  errors: string[];
}

export type Semester = 'ODD' | 'EVEN';
export type Action = 'TRANSFER' | 'GENERATE_REPORT';

