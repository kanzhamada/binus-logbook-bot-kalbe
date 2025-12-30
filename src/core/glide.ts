import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as readline from 'readline';
import { ActivityData } from '../types/bot.js';

export class GlideBot {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private email: string;

  constructor(email: string) {
    this.email = email;
  }

  private async initializeBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false,
      channel: 'chrome'
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    this.page = await this.context.newPage();
  }

  private async askForOTP(): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('🔑 Please enter the OTP sent to your email: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  public async login(): Promise<void> {
    await this.initializeBrowser();
    if (!this.page) throw new Error('Browser not initialized');

    console.log('🌐 Navigating to Glide app...');
    await this.page.goto('https://onekalbeinternhub.glide.page/');

    // Wait for email input
    console.log('📧 Entering email...');
    const emailInputSelector = 'input[type="email"]';
    await this.page.waitForSelector(emailInputSelector);
    await this.page.fill(emailInputSelector, this.email);

    // Click Continue
    const continueButtonSelector = 'button:has-text("Continue")';
    await this.page.click(continueButtonSelector);

    // Wait for OTP input to appear (indicates email was accepted)
    console.log('⏳ Waiting for OTP input...');
    await this.page.waitForSelector('input[type="tel"]', { timeout: 30000 });

    // Ask user for OTP
    const otp = await this.askForOTP();

    // Enter OTP
    console.log('🔐 Entering OTP...');
    await this.page.fill('input[type="tel"]', otp);

    // Click Sign In
    const signInButtonSelector = 'button:has-text("Sign In")';
    await this.page.click(signInButtonSelector);

    // Wait for login to complete
    await this.page.waitForTimeout(5000);
    console.log('✅ Glide login completed');
  }

  public async scrapeData(month: string, year: string): Promise<ActivityData[]> {
    if (!this.page) throw new Error('Page not initialized');

    console.log('📂 Navigating to Attendance...');
    const attendanceButtonSelector = 'button:has-text("Attendance")';
    try {
        await this.page.waitForSelector(attendanceButtonSelector, { timeout: 10000 });
        await this.page.click(attendanceButtonSelector);
    } catch (e) {
        console.log('⚠️ Could not find "Attendance" button, checking if already on page or using alternative selector');
    }
    
    await this.page.waitForTimeout(3000);

    console.log(`🔍 Filtering for ${month} ${year}...`);
    
    // Wait for the months table to load
    await this.page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Find the row for the specified month and year
    const rows = await this.page.$$('table tbody tr');
    let monthRowClicked = false;
    
    for (const row of rows) {
        const cells = await row.$$('td');
        if (cells.length >= 2) {
            const monthText = await cells[0].innerText();
            const yearText = await cells[1].innerText();
            
            // Normalize month check (e.g. "OCT" matches "October")
            // We check if the cell text starts with the config month (e.g. "October" starts with "OCT")
            // OR if the config month is contained in the cell text
            const mText = monthText.toUpperCase();
            const mConfig = month.toUpperCase();
            
            if ((mText.includes(mConfig) || mConfig.includes(mText)) && yearText.includes(year)) {
                console.log(`✅ Found month row: ${monthText} ${yearText}, clicking to view details...`);
                await row.click();
                monthRowClicked = true;
                break;
            }
        }
    }
    
    if (!monthRowClicked) {
        console.log(`⚠️ Could not find row for ${month} ${year}. Available rows:`);
        for (const row of rows) {
             const cells = await row.$$('td');
             if (cells.length >= 2) {
                 console.log(`- ${await cells[0].innerText()} ${await cells[1].innerText()}`);
             }
        }
        return [];
    }
    
    // Wait for the detail view to load (activities list)
    console.log('⏳ Waiting for activity list to load...');
    await this.page.waitForTimeout(3000); // Give it time to transition
    
    // Check if we are in the detail view. 
    // We expect a table of activities.
    try {
        await this.page.waitForSelector('table tbody tr', { timeout: 10000 });
    } catch (e) {
        console.log('⚠️ Timeout waiting for activity table. The detail view might use a different structure.');
    }

    console.log('📥 Scraping activity logs from detail view...');
    const activities: ActivityData[] = [];
    
    let hasNextPage = true;
    let pageNum = 1;

    while (hasNextPage) {
        console.log(`📄 Scraping page ${pageNum}...`);
        
        // Wait for table rows to be stable
        await this.page.waitForTimeout(2000);
        
        const activityRows = await this.page.$$('table tbody tr');
        console.log(`Found ${activityRows.length} rows on page ${pageNum}.`);

        for (const row of activityRows) {
            const cells = await row.$$('td');
            const cellTexts = await Promise.all(cells.map(c => c.innerText()));
            
            // Expected format: ["ATTENDANCE DATE","STUDENT NAME","WFO/WFH","ACTIVITY LOG","STATUS",""]
            // Index 0: Date
            // Index 3: Activity Log
            
            if (cellTexts.length >= 4) {
                const dateText = cellTexts[0];
                const activityLog = cellTexts[3];
                
                // Skip header row
                if (dateText === "ATTENDANCE DATE") continue;
                
                if (dateText && activityLog) {
                    activities.push({
                        date: dateText,
                        activity: activityLog, // User requested same value for both
                        description: activityLog
                    });
                }
            }
        }
        
        // Check for pagination
        // Selector: button[aria-label="Next"]
        const nextButtonSelector = 'button[aria-label="Next"]';
        const nextButton = await this.page.$(nextButtonSelector);
        
        if (nextButton) {
            const isDisabled = await nextButton.isDisabled();
            if (!isDisabled) {
                console.log('➡️ Clicking Next page...');
                await nextButton.click();
                pageNum++;
                await this.page.waitForTimeout(3000); // Wait for page load
            } else {
                console.log('⏹️ Next button is disabled. Reached end of list.');
                hasNextPage = false;
            }
        } else {
            console.log('⏹️ No pagination found. Reached end of list.');
            hasNextPage = false;
        }
    }
    
    console.log(`✅ Scraped ${activities.length} activities.`);
    return activities;
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
