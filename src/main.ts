import LoginBot from './core/login.js';
import ActivityBot from './core/bot.js';
import { GlideBot } from './core/glide.js';
import { BotConfig, Semester, Action } from './types/bot.js';
import { getMonthName, getSemesterCode } from './utils/mapping.js';
import { GeminiBot } from './core/gemini.js';
import { saveReport } from './utils/file.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import inquirer from 'inquirer';

// Load environment variables
dotenv.config({ 
  path: '.env',
  encoding: 'utf8'
});

const ODD_MONTHS = ['SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB'];
const EVEN_MONTHS = ['FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG'];

async function main() {
  const email = process.env.EMAIL;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!email) {
    console.error('❌ Email not found in environment variables');
    process.exit(1);
  }

  // CLI Prompts
  const { semester } = await inquirer.prompt<{ semester: Semester }>([
    {
      type: 'list',
      name: 'semester',
      message: 'Pilih Semester [ODD/EVEN]:',
      choices: [
        { name: 'ODD (Ganjil)', value: 'ODD' },
        { name: 'EVEN (Genap)', value: 'EVEN' }
      ]
    }
  ]);

  const { action } = await inquirer.prompt<{ action: Action }>([
    {
      type: 'list',
      name: 'action',
      message: 'Pilih Aksi [TRANSFER/GENERATE_REPORT]:',
      choices: [
        { name: '1. Transfer Attendance to Binus Enrichment Apps', value: 'TRANSFER' },
        { name: '2. Generate Monthly Report (.docx)', value: 'GENERATE_REPORT' }
      ]
    }
  ]);

  const monthChoices = semester === 'ODD' ? ODD_MONTHS : EVEN_MONTHS;
  
  const { selectedMonths } = await inquirer.prompt<{ selectedMonths: string[] }>([
    {
      type: 'checkbox',
      name: 'selectedMonths',
      message: 'Pilih Bulan:',
      choices: monthChoices,
      validate: (answer) => {
        if (answer.length < 1) {
          return 'You must choose at least one month.';
        }
        return true;
      }
    }
  ]);

  // Initialize Bots
  let loginBot: LoginBot | null = null;
  let geminiBot: GeminiBot | null = null;
  let glideBot: GlideBot | null = null;
  let activityBot: ActivityBot | null = null;

  if (action === 'TRANSFER') {
    loginBot = new LoginBot();
    console.log('🚀 Starting Binus logbook automation...');
    const success = await loginBot.login();
    if (!success) {
      console.log('❌ Login failed');
      process.exit(1);
    }
  } else if (action === 'GENERATE_REPORT') {
    if (!geminiApiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      process.exit(1);
    }
    geminiBot = new GeminiBot(geminiApiKey);
  }

  // Initialize GlideBot and Login ONCE if we have months to process
  if (selectedMonths.length > 0) {
    console.log('🚀 Starting Glide scraping...');
    glideBot = new GlideBot(email);
    try {
      await glideBot.login();
    } catch (error) {
      console.error('❌ Glide login failed:', error);
      process.exit(1);
    }
  }

  // Process each selected month
  for (const monthCode of selectedMonths) {
    const monthName = getMonthName(monthCode);
    console.log(`\n📅 Processing Month: ${monthName} (${monthCode})...`);

    // Phase 0: Scrape data from Glide
    let scrapedData: any[] = [];

    if (glideBot) {
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const isSepToDec = now.getMonth() >= 8;
        const year = (semester === 'ODD' && !isSepToDec && !['JAN', 'FEB'].includes(monthCode))
          ? (currentYear - 1).toString()
          : currentYear.toString();
        scrapedData = await glideBot.scrapeData(monthName, year);
        console.log(`✅ Scraped ${scrapedData.length} activities from Glide for ${monthName}`);
      } catch (error) {
        console.error(`❌ Glide scraping failed for ${monthName}:`, error);
        continue; // Skip to next month if scraping fails
      }
    }

    if (scrapedData.length === 0) {
      console.log(`⚠️ No data scraped for ${monthName}. Skipping...`);
      continue;
    }

    if (action === 'TRANSFER' && loginBot) {
      try {
        // Initialize ActivityBot only once or reuse it
        if (!activityBot) {
           const botConfig: BotConfig = {
            clockInTime: process.env.CLOCK_IN_TIME || '08:00',
            clockOutTime: process.env.CLOCK_OUT_TIME || '17:00',
            excelFilePath: process.env.EXCEL_FILE_PATH || path.join(process.cwd(), 'src', 'data', 'monthly_activity.xlsx'),
            logbookMonth: monthName, // Initial month, will be updated
            internshipSemester: getSemesterCode(semester)
          };
          activityBot = new ActivityBot(loginBot.getPage()!, botConfig);
          
          // Initial navigation (Steps 1-6)
          console.log('🚀 Navigating to Logbook (Initial)...');
          await activityBot.initialNavigateToLogbook();
        }

        // Update config for current month (if needed by other methods, though switchMonth takes arg)
        // We might need to update the internal config of activityBot if it uses it elsewhere
        // But switchMonth takes the month name.
        
        // Switch to the correct month tab (Step 7)
        console.log(`🔄 Switching to month tab: ${monthName}...`);
        await activityBot.switchMonth(monthName);
        
        activityBot.setActivityData(scrapedData);

        // Phase 3: Fill all activities
        await activityBot.fillAllActivities();
        
        const state = activityBot.getState();
        const errors = activityBot.getErrors();
        
        console.log(`✅ Successfully processed: ${state.processedDates.length} dates for ${monthName}`);
        
        if (errors.length > 0) {
          console.log(`⚠️ Errors for ${monthName}: ${errors.length}`);
          errors.forEach(error => console.log(`   - ${error}`));
        }
      } catch (error) {
        console.error(`❌ Activity bot failed for ${monthName}:`, error);
      }
    } else if (action === 'GENERATE_REPORT' && geminiBot) {
      try {
        console.log(`🤖 Generating report for ${monthName} with Gemini...`);
        const reportContent = await geminiBot.generateMonthlyReport(scrapedData, monthName);
        const savedPath = saveReport(reportContent, monthName);
        console.log(`✅ Report saved to: ${savedPath}`);
      } catch (error) {
        console.error(`❌ Failed to generate report for ${monthName}:`, error);
      }
    }
  }

  if (loginBot) {
    await loginBot.close();
  }
  
  if (glideBot) {
    await glideBot.close();
  }

  console.log('\n🎉 All tasks completed!');
}

// Run the main function
main().catch(console.error);
