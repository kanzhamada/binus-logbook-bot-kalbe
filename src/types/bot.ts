// Updated flow: Removed excelFilePath as data is now scraped from Glide, not loaded from Excel.

export interface ActivityData {
  activity: string;
  description: string;
  date?: string; // Format: "DD Month YYYY"
}

export interface BotConfig {
  clockInTime: string;
  clockOutTime: string;
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
