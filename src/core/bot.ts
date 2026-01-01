import { Page } from 'playwright';
import { BOT_LOCATORS } from '../constant/locator.js';
import { ActivityData, BotConfig, BotState } from '../types/bot.js';
import chalk from 'chalk';

// ActivityBot class for filling Binus logbook using scraped data from Glide
export default class ActivityBot {
  private page: Page;
  private config: BotConfig;
  private activityData: ActivityData[] = [];
  private state: BotState = {
    currentRow: 0,
    totalRows: 0,
    processedDates: [],
    errors: []
  };

  constructor(page: Page, config: BotConfig) {
    this.page = page;
    this.config = config;
  }

  /**
   * Navigate to Logbook page (Steps 1-6)
   */
  public async initialNavigateToLogbook(): Promise<void> {
    try {
      // Step 1: Wait for dashboard to load
      await this.page.waitForLoadState('domcontentloaded'); 
      
      // Step 2: Click semester dropdown
      await this.page.waitForSelector(BOT_LOCATORS.SEMESTER_DROPDOWN, { timeout: 10000 });
      await this.page.click(BOT_LOCATORS.SEMESTER_DROPDOWN);
      await this.page.waitForTimeout(1000);
      
      // Step 3: Select semester based on configuration
      const semesterSelector = `div.menu.transition div.item[data-value="${this.config.internshipSemester}"]`;
      await this.page.waitForSelector(semesterSelector, { timeout: 5000 });
      await this.page.click(semesterSelector);
      await this.page.waitForTimeout(500); 
      
      // Step 4: Click "Go to Activity Enrichment Apps" button
      await this.page.waitForSelector(BOT_LOCATORS.ACTIVITY_BUTTON, { timeout: 8000 });
      await this.page.click(BOT_LOCATORS.ACTIVITY_BUTTON);
      await this.page.waitForTimeout(1000); 
      
      // Step 5: Click account tile
      await this.page.waitForSelector(BOT_LOCATORS.ACCOUNT_TILE, { timeout: 8000 });
      await this.page.click(BOT_LOCATORS.ACCOUNT_TILE);
      await this.page.waitForTimeout(1000); 
      
      // Step 6: Click Logbook tab
      await this.page.waitForSelector(BOT_LOCATORS.LOGBOOK_TAB, { timeout: 8000 });
      await this.page.click(BOT_LOCATORS.LOGBOOK_TAB);
      await this.page.waitForTimeout(1000); 
      
    } catch (error) {
      console.error(chalk.red('Initial navigation failed:'), error);
      throw error;
    }
  }

  /**
   * Switch Month Tab (Step 7)
   */
  public async switchMonth(monthName?: string): Promise<void> {
    const targetMonth = monthName || this.config.logbookMonth;
    try {
      const monthTabSelector = `a[onclick*="tabClick"][href="#"]:has-text("${targetMonth}")`;
      await this.page.waitForSelector(monthTabSelector, { timeout: 8000 });
      await this.page.click(monthTabSelector);
      await this.page.waitForTimeout(1000); 
      // console.log(`Switched to month: ${targetMonth}`);
    } catch (error) {
      console.error(chalk.red(`Failed to switch to month ${targetMonth}:`), error);
      throw error;
    }
  }

  /**
   * Click element with fallback locators
   */
  private async clickWithFallback(selectors: string[], elementName: string): Promise<void> {
    let clicked = false;
    
    for (let i = 0; i < selectors.length; i++) {
      try {
        await this.page.waitForSelector(selectors[i], { 
          timeout: 1500, 
          state: 'visible' 
        });
        await this.page.click(selectors[i]);
        clicked = true;
        break;
      } catch (error) {
        // Try next selector
      }
    }
    
    if (!clicked) {
      // await this.page.screenshot({ path: `debug-${elementName.toLowerCase().replace(' ', '-')}-failed.png` });
      throw new Error(`Could not find ${elementName}`);
    }
  }

  /**
   * Fill activity form for a specific row using scraped data
   */
  private async fillActivityForm(activityData: ActivityData): Promise<void> {
    try {
      if (!activityData) {
        throw new Error(`No activity data provided`);
      }
      
      // Fill clock in time
      await this.page.evaluate(({ selector, value }) => {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element) {
          element.removeAttribute('readonly');
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { selector: BOT_LOCATORS.CLOCK_IN_INPUT, value: this.config.clockInTime });
      
      // Fill clock out time
      await this.page.evaluate(({ selector, value }) => {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element) {
          element.removeAttribute('readonly');
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { selector: BOT_LOCATORS.CLOCK_OUT_INPUT, value: this.config.clockOutTime });
      
      // Fill activity title
      await this.page.fill(BOT_LOCATORS.ACTIVITY_INPUT, activityData.activity);
      
      // Fill description
      await this.page.fill(BOT_LOCATORS.DESCRIPTION_TEXTAREA, activityData.description);
      
      // Submit form with fallback
      await this.clickWithFallback(BOT_LOCATORS.SUBMIT_BUTTON_FALLBACKS, 'Submit button');
      await this.page.waitForTimeout(1000); 
      
      try {
        await this.page.waitForSelector('.fancybox-overlay', { state: 'hidden', timeout: 1500 });
      } catch (error) {
        // Modal might already be closed
      }
      
    } catch (error) {
      // console.error(`Failed to fill form:`, error);
      throw error;
    }
  }

  /**
   * Handle OFF day entries
   */
  private async handleOffDayEntry(): Promise<void> {
    try {
      await this.clickWithFallback(BOT_LOCATORS.OFF_BUTTON_FALLBACKS, 'OFF button');
      await this.page.waitForTimeout(500);
      
      await this.clickWithFallback(BOT_LOCATORS.SUBMIT_BUTTON_FALLBACKS, 'Submit button');
      await this.page.waitForTimeout(1000); 
      
      try {
        await this.page.waitForSelector('.fancybox-overlay', { state: 'hidden', timeout: 1500 });
      } catch (error) {
        // Modal might already be closed
      }
      
    } catch (error) {
      // console.error('Failed to handle OFF day entry:', error);
      throw error;
    }
  }

  /**
   * Set activity data directly from Glide scraping
   */
  public setActivityData(data: ActivityData[]): void {
    this.activityData = data;
    this.state = {
      currentRow: 0,
      totalRows: data.length,
      processedDates: [],
      errors: []
    };
    // console.log(`Set ${data.length} activities from Glide scraping`);
  }

  /**
   * Fill all activity entries using scraped data
   */
  public async fillAllActivities(onProgress?: (date: string) => void): Promise<void> {
    try {
      await this.page.waitForSelector(BOT_LOCATORS.LOG_BOOK_TABLE, { timeout: 10000 });
      
      const tableRows = await this.page.locator('table#logBookTable tbody tr').all();
      
      this.state.totalRows = tableRows.length;
      
      // console.log(`Processing ${tableRows.length} activities...`);
      
      for (let i = 0; i < tableRows.length; i++) {
        try {
          const dateCell = await tableRows[i].locator(BOT_LOCATORS.DATE_COLUMN).first();
          const dateText = await dateCell.textContent();
          
          if (!dateText) {
            continue;
          }
          
          const trimmedDateText = dateText.trim();
          // console.log(`Processing date: ${trimmedDateText}`);
          
          const matchingActivity = this.activityData.find(d => {
            if (!d.date) return false;
            
            const binusDate = trimmedDateText.toLowerCase().replace(',', '');
            const glideDate = d.date.toLowerCase().replace(',', '');
            
            const binusParts = binusDate.split(' ').filter(p => p.trim() !== '');
            const glideParts = glideDate.split(' ').filter(p => p.trim() !== '');
            
            let binusDay, binusMonth, binusYear;
            if (binusParts.length === 4) {
              binusDay = binusParts[1];
              binusMonth = binusParts[2];
              binusYear = binusParts[3];
            } else if (binusParts.length === 3) {
              binusDay = binusParts[0];
              binusMonth = binusParts[1];
              binusYear = binusParts[2];
            } else {
              return false;
            }
            
            let glideDay, glideMonth, glideYear;
            if (glideParts.length === 3) {
              glideDay = glideParts[0];
              glideMonth = glideParts[1];
              glideYear = glideParts[2];
            } else {
              return false;
            }

            if (parseInt(binusDay) === parseInt(glideDay) && binusYear === glideYear) {
              return glideMonth.startsWith(binusMonth) || binusMonth.startsWith(glideMonth);
            }
            
            return false;
          });
          
          if (!matchingActivity) {
            // console.log(`No activity found for date ${trimmedDateText}, skipping...`);
            continue;
          }

          if (onProgress) {
            onProgress(trimmedDateText);
          }
          
          let actionButton = null;
          try {
            actionButton = await tableRows[i].locator(BOT_LOCATORS.ENTRY_BUTTON).first();
            await actionButton.waitFor({ state: 'visible', timeout: 500 });
          } catch (error) {
            try {
              actionButton = await tableRows[i].locator(BOT_LOCATORS.EDIT_BUTTON).first();
              await actionButton.waitFor({ state: 'visible', timeout: 500 });
            } catch (editError) {
              // console.log(`No actionable button for ${trimmedDateText}, skipping...`);
              this.state.errors.push(`No button for ${trimmedDateText}`);
              continue;
            }
          }
          
          await actionButton.click();
          await this.page.waitForTimeout(500); 
          
          const isOffDay = matchingActivity.activity.toUpperCase().includes('OFF') || matchingActivity.description.toUpperCase().includes('OFF');
          
          if (isOffDay) {
            // console.log(`Handling OFF day for ${trimmedDateText}`);
            await this.handleOffDayEntry();
          } else {
            // console.log(`Filling form for ${trimmedDateText}`);
            await this.fillActivityForm(matchingActivity);
          }
          
          this.state.processedDates.push(trimmedDateText);
          this.state.currentRow++;
          
        } catch (error) {
          // console.error(`Failed to process row ${i + 1}:`, error);
          this.state.errors.push(`Error in row ${i + 1}: ${(error as Error).message}`);
        }
      }
      
      // console.log('All activities processed');
      
    } catch (error) {
      console.error(chalk.red('Failed to fill activities:'), error);
      throw error;
    }
  }

  public getState(): BotState {
    return this.state;
  }

  public getErrors(): string[] {
    return this.state.errors;
  }
}