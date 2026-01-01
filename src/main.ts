import LoginBot from './core/login.js';
import ActivityBot from './core/bot.js';
import { GlideBot } from './core/glide.js';
import { BotConfig, Semester, Action } from './types/bot.js';
import { getMonthName, getSemesterCode } from './utils/mapping.js';
import { GeminiBot } from './core/gemini.js';
import { saveReport } from './utils/file.js';
import * as dotenv from 'dotenv';
import inquirer from 'inquirer';
import { SingleBar, Presets } from 'cli-progress';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ 
  path: '.env',
  encoding: 'utf8'
});

const ODD_MONTHS = ['SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB'];
const EVEN_MONTHS = ['FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG'];

async function main() {
  console.clear();
  console.log(chalk.cyan.bold('==========================================='));
  console.log(chalk.cyan.bold('   BINUS LOGBOOK AUTOMATION BOT v1.0.0   '));
  console.log(chalk.cyan.bold('==========================================='));
  console.log('');

  const email = process.env.EMAIL;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!email) {
    console.error(chalk.red('❌ Email not found in environment variables'));
    process.exit(1);
  }

  // CLI Prompts with number inputs for efficiency
  const { semesterNum } = await inquirer.prompt<{ semesterNum: string }>([
    {
      type: 'input',
      name: 'semesterNum',
      message: chalk.yellow('Enter \n1 for ODD (Ganjil), \n2 for EVEN (Genap):'),
      validate: (value) => ['1', '2'].includes(value) ? true : 'Please enter 1 or 2.'
    }
  ]);
  const semester: Semester = semesterNum === '1' ? 'ODD' : 'EVEN';

  const { actionNum } = await inquirer.prompt<{ actionNum: string }>([
    {
      type: 'input',
      name: 'actionNum',
      message: chalk.yellow('Enter \n1 for Transfer Attendance, \n2 for Generate Report:'),
      validate: (value) => ['1', '2'].includes(value) ? true : 'Please enter 1 or 2.'
    }
  ]);
  const action: Action = actionNum === '1' ? 'TRANSFER' : 'GENERATE_REPORT';

  let model = 'gemini-3-flash-preview'; // Default
  if (action === 'GENERATE_REPORT') {
    if (!geminiApiKey) {
      console.error(chalk.red('❌ GEMINI_API_KEY not found in environment variables'));
      process.exit(1);
    }
    const models = ['gemini-3-flash-preview', 'gemini-2.5-flash'];
    const { modelNum } = await inquirer.prompt<{ modelNum: string }>([
      {
        type: 'input',
        name: 'modelNum',
        message: chalk.yellow('Select Gemini model:\n1. gemini-3-flash-preview\n2. gemini-2.5-flash\nEnter number:'),
        validate: (value) => ['1', '2'].includes(value) ? true : 'Please enter 1-2.'
      }
    ]);
    model = models[parseInt(modelNum) - 1];
  }

  const monthChoices = semester === 'ODD' ? ODD_MONTHS : EVEN_MONTHS;
  
  const { selectedMonths } = await inquirer.prompt<{ selectedMonths: string[] }>([
    {
      type: 'checkbox',
      name: 'selectedMonths',
      message: chalk.yellow('Select Months:'),
      choices: monthChoices,
      validate: (answer) => answer.length > 0 ? true : 'Select at least one month.'
    }
  ]);

  console.log('');
  console.log(chalk.blue('ℹ️  Initializing bots...'));

  // Initialize Bots
  let loginBot: LoginBot | null = null;
  let geminiBot: GeminiBot | null = null;
  let glideBot: GlideBot | null = null;
  let activityBot: ActivityBot | null = null;

  if (action === 'TRANSFER') {
    loginBot = new LoginBot();
    console.log(chalk.blue('ℹ️  Starting Binus logbook login...'));
    const success = await loginBot.login();
    if (!success) {
      console.log(chalk.red('❌ Login failed'));
      process.exit(1);
    }
  } else if (action === 'GENERATE_REPORT') {
    geminiBot = new GeminiBot(geminiApiKey!, model);
  }

  // Initialize GlideBot and Login ONCE if we have months to process
  if (selectedMonths.length > 0) {
    console.log(chalk.blue('ℹ️  Starting Glide scraping...'));
    glideBot = new GlideBot(email);
    try {
      await glideBot.login();
    } catch (error) {
      console.error(chalk.red('❌ Glide login failed:'), error);
      process.exit(1);
    }
  }

  console.log('');
  // Progress bar for processing months
  const progressBar = new SingleBar({
    format: chalk.cyan('{bar}') + ' | {percentage}% | {value}/{total} | {action}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  }, Presets.shades_classic);

  progressBar.start(selectedMonths.length, 0, { action: 'Initializing' });

  let totalAssigned = 0;
  let totalMissing = 0;

  // Process each selected month
  for (let i = 0; i < selectedMonths.length; i++) {
    const monthCode = selectedMonths[i];
    const monthName = getMonthName(monthCode);
    progressBar.update(i, { action: `Processing ${monthName}` });
    
    // Phase 0: Scrape data from Glide
    let scrapedData: any[] = [];

    if (glideBot) {
      try {
        // Temporarily stop progress bar to show important logs if needed, 
        // or rely on GlideBot to be quiet. 
        // For now, we assume GlideBot is quieter or we accept some interference, 
        // but we'll try to keep it minimal.
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const isSepToDec = now.getMonth() >= 8;
        const year = (semester === 'ODD' && !isSepToDec && !['JAN', 'FEB'].includes(monthCode))
          ? (currentYear - 1).toString()
          : currentYear.toString();
        
        scrapedData = await glideBot.scrapeData(monthName, year);
        // We won't log success here to avoid clutter, the progress bar is enough context
      } catch (error) {
        // Log error clearly
        progressBar.stop();
        console.error(chalk.red(`\n❌ Glide scraping failed for ${monthName}:`), error);
        progressBar.start(selectedMonths.length, i, { action: `Retrying/Skipping ${monthName}` });
        continue; 
      }
    }

    if (scrapedData.length === 0) {
      // Log warning but continue
      // progressBar.stop();
      // console.log(chalk.yellow(`\n⚠️  No data scraped for ${monthName}. Skipping...`));
      // progressBar.start(selectedMonths.length, i, { action: `Skipping ${monthName}` });
      continue;
    }

    if (action === 'TRANSFER' && loginBot) {
      try {
        // Initialize ActivityBot only once or reuse it
        if (!activityBot) {
          const botConfig: BotConfig = {
            clockInTime: process.env.CLOCK_IN_TIME || '08:00 am',
            clockOutTime: process.env.CLOCK_OUT_TIME || '05:00 pm',
            logbookMonth: monthName, 
            internshipSemester: getSemesterCode(semester)
          };
          activityBot = new ActivityBot(loginBot.getPage()!, botConfig);
          
          await activityBot.initialNavigateToLogbook();
        }

        await activityBot.switchMonth(monthName);
        activityBot.setActivityData(scrapedData);
        
        await activityBot.fillAllActivities((date) => {
          progressBar.update(i, { action: `Filling ${monthName}: ${date}` });
        });
        
        const errors = activityBot.getErrors();
        const state = activityBot.getState();
        
        totalAssigned += state.processedDates.length;
        totalMissing += errors.length;
        
        // Log success summary
        if (state.processedDates.length > 0) {
          console.log(chalk.green(`\n✅ Successfully assigned ${state.processedDates.length} activities for ${monthName}`));
        }
        
        if (errors.length > 0) {
             console.log(chalk.red(`\n❌ Missing ${errors.length} entries for ${monthName}`));
        }

      } catch (error) {
        progressBar.stop();
        console.error(chalk.red(`\n❌ Activity bot failed for ${monthName}:`), error);
        progressBar.start(selectedMonths.length, i, { action: `Failed ${monthName}` });
      }
    } else if (action === 'GENERATE_REPORT' && geminiBot) {
      try {
        progressBar.update(i, { action: `Generating Report for ${monthName}` });
        const reportContent = await geminiBot.generateMonthlyReport(scrapedData, monthName);
        saveReport(reportContent, monthName);
        // console.log(`Report saved to: ${savedPath}`);
      } catch (error) {
        progressBar.stop();
        console.error(chalk.red(`\n❌ Failed to generate report for ${monthName}:`), error);
        progressBar.start(selectedMonths.length, i, { action: `Failed ${monthName}` });
      }
    }
    
    progressBar.increment();
  }

  progressBar.update(selectedMonths.length, { action: 'Completed' });
  progressBar.stop();

  if (loginBot) {
    await loginBot.close();
  }
  
  if (glideBot) {
    await glideBot.close();
  }

  if (action === 'TRANSFER') {
    console.log(chalk.cyan.bold('\n\n\n\n==========================================='));
    console.log(chalk.cyan.bold('             FINAL SUMMARY               '));
    console.log(chalk.cyan.bold('==========================================='));
    console.log(chalk.green(`✅ Total Successfully Assigned: ${totalAssigned}`));
    if (totalMissing > 0) {
      console.log(chalk.red(`❌ Total Missing/Failed: ${totalMissing}`));
    }
    console.log(chalk.cyan.bold('==========================================='));
  }

  console.log(chalk.green.bold('\n✅ All tasks completed successfully!'));
}

// Run the main function
main().catch(console.error);
