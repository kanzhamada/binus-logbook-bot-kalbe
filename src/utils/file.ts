import * as fs from 'fs';
import * as path from 'path';

export function saveReport(content: string, monthName: string): string {
  const directory = path.join(process.cwd(), 'monthly-report-generated');
  
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const fileName = `Enrichment Monthly Report - ${monthName}.md`;
  const filePath = path.join(directory, fileName);

  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}
