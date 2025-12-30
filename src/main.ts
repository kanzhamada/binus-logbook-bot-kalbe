import LoginBot from './core/login.js';
import ActivityBot from './core/bot.js';
import { GlideBot } from './core/glide.js';
import { BotConfig } from './types/bot.js';
import { getMonthName, getSemesterCode } from './utils/mapping.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ 
  path: '.env',
  encoding: 'utf8'
});

async function main() {
  const logbookMonthEnv = process.env.LOGBOOK_MONTH || 'SEP';
  const internshipSemesterEnv = process.env.INTERNSHIP_SEMESTER || 'ODD';
  const email = process.env.EMAIL;

  if (!email) {
    console.error('❌ Email not found in environment variables');
    process.exit(1);
  }

  // Phase 0: Scrape data from Glide
  console.log('🚀 Starting Glide scraping...');
  const glideBot = new GlideBot(email);
  let scrapedData: any[] = [];

  try {
    await glideBot.login();
    // Use the configured month for scraping
    // Note: GlideBot.scrapeData might need month name or number. 
    // getMonthName returns "September", "October" etc.
    // Let's assume Glide uses full month name.
    const monthName = getMonthName(logbookMonthEnv);
    const year = new Date().getFullYear().toString(); // Default to current year
    
    scrapedData = await glideBot.scrapeData(monthName, year);
    console.log(`✅ Scraped ${scrapedData.length} activities from Glide`);
  } catch (error) {
    console.error('❌ Glide scraping failed:', error);
    process.exit(1);
  } finally {
    await glideBot.close();
  }

  if (scrapedData.length === 0) {
    console.log('⚠️ No data scraped. Exiting...');
    process.exit(0);
  }

  // Phase 1: Login to Binus
  const loginBot = new LoginBot();
  
  try {
    console.log('🚀 Starting Binus logbook automation...');
    
    // Always perform fresh login
    const success = await loginBot.login();
    
    if (!success) {
      console.log('❌ Login failed');
      process.exit(1);
    }
    
    const botConfig: BotConfig = {
      clockInTime: process.env.CLOCK_IN_TIME || '08:00',
      clockOutTime: process.env.CLOCK_OUT_TIME || '17:00',
      excelFilePath: process.env.EXCEL_FILE_PATH || path.join(process.cwd(), 'src', 'data', 'monthly_activity.xlsx'),
      logbookMonth: getMonthName(logbookMonthEnv),
      internshipSemester: getSemesterCode(internshipSemesterEnv)
    };
    
    const activityBot = new ActivityBot(loginBot.getPage()!, botConfig);
    
    // Inject scraped data
    activityBot.setActivityData(scrapedData);
    
    try {
      // Phase 2: Navigate to activity page
      await activityBot.navigateToActivityPage();
      
      // Phase 3: Fill all activities
      await activityBot.fillAllActivities();
      
      // Display final results
      const state = activityBot.getState();
      const errors = activityBot.getErrors();
      
      console.log(`✅ Successfully processed: ${state.processedDates.length} dates`);
      
      if (errors.length > 0) {
        console.log(`⚠️ Errors: ${errors.length}`);
        errors.forEach(error => console.log(`   - ${error}`));
      }
      
      console.log('🎉 Bot execution completed successfully!');
      
    } catch (error) {
      console.error('❌ Activity bot failed:', error);
      
      // Display partial results
      const state = activityBot.getState();
      const errors = activityBot.getErrors();
      
      console.log(`✅ Successfully processed: ${state.processedDates.length} dates`);
      
      if (errors.length > 0) {
        console.log(`⚠️ Errors: ${errors.length}`);
        errors.forEach(error => console.log(`   - ${error}`));
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    // Always close the browser
    await loginBot.close();
  }
}

// Run the main function
main().catch(console.error);
