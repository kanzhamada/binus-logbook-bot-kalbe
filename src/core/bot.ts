import { Page } from 'playwright';
import { BOT_LOCATORS } from '../constant/locator.js';
import { ActivityData, BotConfig, BotState } from '../types/bot.js';
import XLSX from 'xlsx';

class ActivityBot {
  private page: Page;
  private config: BotConfig;
  private state: BotState;
  private excelData: ActivityData[] = [];

  constructor(page: Page, config: BotConfig) {
    this.page = page;
    this.config = config;
    this.state = {
      currentRow: 0,
      totalRows: 0,
      processedDates: [],
      errors: []
    };
  }

  /**
   * Load Excel data from file
   */
  private async loadExcelData(): Promise<void> {
    try {
      const workbook = XLSX.readFile(this.config.excelFilePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with specific column mapping
      // Activity is in column B (index 1), Description is in column C (index 2)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: ['', 'activity', 'description'], // Empty string for column A, then activity and description
        range: 1 // Skip header row (row 1), start from row 2
      });
      
      // Filter out any empty rows and ensure we have valid data
      this.excelData = jsonData
        .filter((row: any) => row.activity && row.description) // Only include rows with both activity and description
        .map((row: any) => ({
          activity: row.activity?.toString().trim() || '',
          description: row.description?.toString().trim() || ''
        })) as ActivityData[];
      
      this.state.totalRows = this.excelData.length;
      
      console.log(`📊 Loaded ${this.excelData.length} activities from Excel`);
    } catch (error) {
      console.error('❌ Failed to load Excel data:', error);
      throw error;
    }
  }

  /**
   * Phase 1: Navigate to the activity page
   */
  public async navigateToActivityPage(): Promise<void> {
    try {
      // Step 1: Wait for dashboard to load
      await this.page.waitForLoadState('domcontentloaded'); // Faster than networkidle
      
      // Step 2: Click semester dropdown
      await this.page.waitForSelector(BOT_LOCATORS.SEMESTER_DROPDOWN, { timeout: 15000 });
      await this.page.click(BOT_LOCATORS.SEMESTER_DROPDOWN);
      await this.page.waitForTimeout(2000);
      
      // Step 3: Select semester based on configuration
      const semesterSelector = `div.menu.transition div.item[data-value="${this.config.internshipSemester}"]`;
      await this.page.waitForSelector(semesterSelector, { timeout: 5000 });
      await this.page.click(semesterSelector);
      await this.page.waitForTimeout(1000); // Short wait instead of full page load
      
      // Step 4: Click "Go to Activity Enrichment Apps" button
      await this.page.waitForSelector(BOT_LOCATORS.ACTIVITY_BUTTON, { timeout: 10000 });
      await this.page.click(BOT_LOCATORS.ACTIVITY_BUTTON);
      await this.page.waitForTimeout(2000); // Short wait instead of full page load
      
      // Step 5: Click account tile
      await this.page.waitForSelector(BOT_LOCATORS.ACCOUNT_TILE, { timeout: 10000 });
      await this.page.click(BOT_LOCATORS.ACCOUNT_TILE);
      await this.page.waitForTimeout(2000); // Short wait instead of full page load
      
      // Step 6: Click Logbook tab
      await this.page.waitForSelector(BOT_LOCATORS.LOGBOOK_TAB, { timeout: 10000 });
      await this.page.click(BOT_LOCATORS.LOGBOOK_TAB);
      await this.page.waitForTimeout(2000); // Short wait instead of full page load
      
      // Step 7: Click logbook month tab based on configuration
      const monthTabSelector = `a[onclick*="tabClick"][href="#"]:has-text("${this.config.logbookMonth}")`;
      await this.page.waitForSelector(monthTabSelector, { timeout: 10000 });
      await this.page.click(monthTabSelector);
      await this.page.waitForTimeout(2000); // Short wait instead of full page load
      
      console.log('✅ Navigation completed');
      
    } catch (error) {
      console.error('❌ Navigation failed:', error);
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
        // Wait for element to be visible and enabled (faster than full page load)
        await this.page.waitForSelector(selectors[i], { 
          timeout: 2000, // Reduced timeout for faster execution
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
      // Take screenshot for debugging
      await this.page.screenshot({ path: `debug-${elementName.toLowerCase().replace(' ', '-')}-failed.png` });
      throw new Error(`Could not find ${elementName} with any of the ${selectors.length} selectors`);
    }
  }

  /**
   * Fill activity form for a specific row
   */
  private async fillActivityForm(activityData: ActivityData): Promise<void> {
    try {
      if (!activityData) {
        throw new Error(`No activity data provided`);
      }
      
      // Fill clock in time - set value directly without triggering popup
      await this.page.evaluate(({ selector, value }) => {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element) {
          element.removeAttribute('readonly');
          element.value = value;
          // Trigger input event to ensure the value is properly set
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { selector: BOT_LOCATORS.CLOCK_IN_INPUT, value: this.config.clockInTime });
      
      // Fill clock out time - set value directly without triggering popup
      await this.page.evaluate(({ selector, value }) => {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element) {
          element.removeAttribute('readonly');
          element.value = value;
          // Trigger input event to ensure the value is properly set
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { selector: BOT_LOCATORS.CLOCK_OUT_INPUT, value: this.config.clockOutTime });
      
      // Fill activity title
      await this.page.fill(BOT_LOCATORS.ACTIVITY_INPUT, activityData.activity);
      
      // Fill description
      await this.page.fill(BOT_LOCATORS.DESCRIPTION_TEXTAREA, activityData.description);
      
      // Submit form with fallback locators
      await this.clickWithFallback(BOT_LOCATORS.SUBMIT_BUTTON_FALLBACKS, 'Submit button');
      await this.page.waitForTimeout(1500); // Reduced wait time for faster execution
      
      // Ensure modal is fully closed before proceeding (with shorter timeout)
      try {
        await this.page.waitForSelector('.fancybox-overlay', { state: 'hidden', timeout: 2000 });
      } catch (error) {
        // Modal might already be closed, continue
      }
      
    } catch (error) {
      console.error(`❌ Failed to fill form:`, error);
      throw error;
    }
  }

  /**
   * Handle OFF day entries (when activity or description contains "OFF")
   */
  private async handleOffDayEntry(): Promise<void> {
    try {
      // Click OFF button with fallback locators
      await this.clickWithFallback(BOT_LOCATORS.OFF_BUTTON_FALLBACKS, 'OFF button');
      await this.page.waitForTimeout(1000);
      
      // Submit form with fallback locators
      await this.clickWithFallback(BOT_LOCATORS.SUBMIT_BUTTON_FALLBACKS, 'Submit button');
      await this.page.waitForTimeout(1500); // Reduced wait time for faster execution
      
      // Ensure modal is fully closed before proceeding (with shorter timeout)
      try {
        await this.page.waitForSelector('.fancybox-overlay', { state: 'hidden', timeout: 2000 });
      } catch (error) {
        // Modal might already be closed, continue
      }
      
    } catch (error) {
      console.error('❌ Failed to handle OFF day entry:', error);
      throw error;
    }
  }

  /**
   * Set activity data directly (e.g. from Glide scraping)
   */
  public setActivityData(data: ActivityData[]): void {
    this.excelData = data;
    this.state.totalRows = data.length;
    console.log(`📊 Set ${data.length} activities from external source`);
  }

  /**
   * Phase 2: Fill all activity entries
   */
  public async fillAllActivities(): Promise<void> {
    try {
      // Load Excel data only if no data has been set
      if (this.excelData.length === 0) {
        await this.loadExcelData();
      }
      
      // Wait for logbook table to load
      await this.page.waitForSelector(BOT_LOCATORS.LOG_BOOK_TABLE, { timeout: 15000 });
      
      // Get all table rows to ensure we process them in the correct order
      const tableRows = await this.page.locator('table#logBookTable tbody tr').all();
      
      this.state.totalRows = tableRows.length;
      
      console.log(`🔄 Processing ${tableRows.length} activities...`);
      
      // Process each row in order (top to bottom)
      for (let i = 0; i < tableRows.length; i++) {
        try {
          // Get the date for this row
          const dateCell = await tableRows[i].locator(BOT_LOCATORS.DATE_COLUMN).first();
          const dateText = await dateCell.textContent();
          
          if (!dateText) {
            continue;
          }
          
          const trimmedDateText = dateText.trim();
          console.log(`📅 Processing date: ${trimmedDateText}`);
          
          // Find matching activity data
          // Binus Date Format: "DD MMM YYYY" (e.g., "31 Oct 2025") or "DD Month YYYY"
          // Glide Date Format: "DD Month YYYY" (e.g., "31 October 2025")
          
          // We need a robust comparison. 
          // Let's try to parse both to Date objects or normalize strings.
          
          const matchingActivity = this.excelData.find(d => {
              if (!d.date) return false;
              
              // Simple string inclusion check as a fallback
              // e.g. "31 Oct 2025" vs "31 October 2025"
              // "31 October 2025".includes("31 Oct") -> true
              
              // Normalize both to lowercase
              const binusDate = trimmedDateText.toLowerCase().replace(',', ''); // Remove comma if present
              const glideDate = d.date.toLowerCase().replace(',', '');
              
              // Check if day and year match
              const binusParts = binusDate.split(' ').filter(p => p.trim() !== '');
              const glideParts = glideDate.split(' ').filter(p => p.trim() !== '');
              
              // Binus: "thu 02 oct 2025" -> ["thu", "02", "oct", "2025"]
              // Glide: "31 october 2025" -> ["31", "october", "2025"]
              
              let binusDay, binusMonth, binusYear;
              
              if (binusParts.length === 4) {
                  // Format: DayName DD MMM YYYY
                  binusDay = binusParts[1];
                  binusMonth = binusParts[2];
                  binusYear = binusParts[3];
              } else if (binusParts.length === 3) {
                  // Format: DD MMM YYYY (fallback)
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
                  // Check month (startsWith to handle "oct" vs "october")
                  return glideMonth.startsWith(binusMonth) || binusMonth.startsWith(glideMonth);
              }
              
              return false;
          });
          
          if (!matchingActivity) {
              console.log(`⚠️ No activity found for date ${trimmedDateText}, skipping...`);
              continue;
          }
          
          
          // Find the action button for this specific row (either ENTRY or Edit)
          let actionButton = null;
          try {
            // First try to find ENTRY button in this row
            actionButton = await tableRows[i].locator(BOT_LOCATORS.ENTRY_BUTTON).first();
            await actionButton.waitFor({ state: 'visible', timeout: 1000 });
          } catch (error) {
            try {
              // If ENTRY button not found, try Edit button in this row
              actionButton = await tableRows[i].locator(BOT_LOCATORS.EDIT_BUTTON).first();
              await actionButton.waitFor({ state: 'visible', timeout: 1000 });
            } catch (editError) {
              console.log(`⚠️ No actionable button for ${trimmedDateText}, skipping...`);
              continue;
            }
          }
          
          // Click the action button for this row
          await actionButton.click();
          await this.page.waitForTimeout(1500); // Reduced wait time for faster execution
          
          // Get activity data to check for OFF values
          const isOffDay = matchingActivity && (
            matchingActivity.activity?.toUpperCase().trim() === 'OFF' || 
            matchingActivity.description?.toUpperCase().trim() === 'OFF'
          );
          
          if (isOffDay) {
            await this.handleOffDayEntry();
          } else {
            // Use the matching activity data
            await this.fillActivityForm(matchingActivity);
          }
          
          this.state.processedDates.push(trimmedDateText);
          this.state.currentRow = i + 1;
          
        } catch (error) {
          console.error(`❌ Failed to process row ${i + 1}:`, error);
          this.state.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
          
          // Try to close any open modal
          try {
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(1000);
          } catch (closeError) {
            // Ignore close errors
          }
        }
      }
      
      console.log(`✅ Processed ${this.state.processedDates.length} activities`);
      
    } catch (error) {
      console.error('❌ Activity filling failed:', error);
      throw error;
    }
  }

  /**
   * Get current bot state
   */
  public getState(): BotState {
    return this.state;
  }

  /**
   * Get processed dates
   */
  public getProcessedDates(): string[] {
    return this.state.processedDates;
  }

  /**
   * Get errors
   */
  public getErrors(): string[] {
    return this.state.errors;
  }
}

export default ActivityBot;