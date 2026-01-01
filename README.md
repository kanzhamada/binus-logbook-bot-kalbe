# BINUS Logbook Bot 🤖

An automated bot that streamlines the process of submitting monthly student internship activity data to the BINUS University LMS. This bot **scrapes activity data directly from the "One Kalbe Intern Hub" Glide app** and can either automatically fill out the logbook entries or generate a monthly report using Gemini AI.

### ✨ Key Features

- 📱 **Glide Integration**: Automatically scrapes activity logs (Activity & Description) from the Glide app.
- 🚀 **Automated Data Entry**: Fills out Binus logbook entries automatically using the scraped data.
- 🤖 **AI-Powered Reports**: Generates professional monthly reports (.docx ready Markdown) using **Google Gemini AI**.
- 🗓️ **Multi-Month Support**: Process multiple months in a single run with a single login.
- 🔄 **Smart Navigation**: Optimized navigation logic to handle timeouts and avoid redundant page loads.
- ⚙️ **Interactive CLI**: Easy-to-use terminal interface for selecting semesters, actions, and months.
- 🔒 **Secure**: Your credentials are stored locally and never shared.

## 🚀 Quick Start

### Prerequisites

Before you begin, make sure you have:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **BINUS University credentials** (email and password)
- **Glide App Access** (email used for "One Kalbe Intern Hub")
- **Gemini API Key** (optional, for report generation) - [Get it here](https://aistudio.google.com/app/apikey)
- **Reference PDF** (required for report generation) - A previous report or template placed in `monthly-report-example/` folder.

### Step-by-Step Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd binus-logbook-bot-kalbe
```

#### 2. Install Dependencies

Open your terminal/command prompt in the project folder and run:

```bash
npm install
```

Wait until complete, then run:

```bash
npx playwright install
```

#### 3. Configure Your Credentials

Create a `.env` file in the project root directory:

```bash
# Copy the example file (if available)
cp .env.example .env
# Or create a new .env file manually
```

Add your credentials and configuration to the `.env` file:

```env
# Login credentials
EMAIL=your.email@binus.ac.id
PASSWORD=your_password

# Gemini API Key (Required for Report Generation)
GEMINI_API_KEY=your_gemini_api_key

# Clock in and out times (12-hour format: HH:MM am or pm)
CLOCK_IN_TIME="08:00 am"
CLOCK_OUT_TIME="05:00 pm"

# Defaults (can be overridden by CLI)
LOGBOOK_MONTH=SEP
INTERNSHIP_SEMESTER=ODD
```

> ⚠️ **Security Note**: Your credentials are stored locally on your machine and are never shared or uploaded anywhere.

#### 4. Run the Bot

Start the bot by running:

```bash
npm start
```

### 🔄 Usage & Workflow

The bot now features an interactive Command Line Interface (CLI):

1.  **Select Semester**: Choose between `ODD` (Ganjil) or `EVEN` (Genap).
2.  **Select Action**:
    *   `1. Transfer Attendance to Binus Enrichment Apps`: Scrapes Glide and fills the Binus logbook.
    *   `2. Generate Monthly Report (.md)`: Scrapes Glide and generates a report using Gemini.
3.  **Select Months**: Choose one or multiple months to process.

#### Action 1: Transfer Attendance
1.  **Glide Scraping**:
    *   Logs into Glide (requires OTP input once).
    *   Scrapes activity logs for all selected months.
2.  **Binus Automation**:
    *   Logs into BINUS LMS.
    *   Navigates to the Logbook page.
    *   Iterates through each selected month and day.
    *   Matches dates and fills **Activity** and **Description** fields.
    *   Handles "OFF" days automatically.

#### Action 2: Generate Monthly Report
1.  **Prepare Reference PDF**:
    *   **IMPORTANT**: Place a reference PDF file (e.g., a previous report or a template) inside the `monthly-report-example/` folder.
    *   The bot uses this PDF to understand the context, style, and specific details (like Student Position) for the report.
2.  **Glide Scraping**:
    *   Logs into Glide (requires OTP input once).
    *   Scrapes activity logs for all selected months.
3.  **Report Generation**:
    *   Uploads the reference PDF to Gemini for context.
    *   Sends the scraped data to the Gemini API (`gemini-3-flash-preview`).
    *   Generates a structured report (Introduction, Activities, Technical Competencies, EES, Conclusion).
    *   Saves the report as a Markdown file in the `monthly-report-generated/` directory.

## 📁 Project Structure

```
logbook_bot/
├── src/
│   ├── core/           # Core bot functionality
│   │   ├── bot.ts      # Binus automation logic
│   │   ├── glide.ts    # Glide scraping logic
│   │   ├── gemini.ts   # Gemini AI integration
│   │   └── login.ts    # Binus login automation
│   ├── constant/       # Configuration files
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── main.ts         # Application entry point
├── monthly-report-example/   # Place your reference PDF here
├── monthly-report-generated/ # Output folder for reports
├── package.json        # Project dependencies
└── README.md           # This file
```

## 🔧 Configuration Options

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL` | Your BINUS/Glide email address | `john.doe@binus.ac.id` |
| `PASSWORD` | Your BINUS password | `your_password` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `CLOCK_IN_TIME` | Clock-in time | `"08:00 am"` |
| `CLOCK_OUT_TIME` | Clock-out time | `"05:00 pm"` |

## 🛠️ Troubleshooting

### Common Issues

**Q: The bot waits for OTP but I didn't receive it.**
- Check your spam folder.
- Ensure the email in `.env` matches your Glide account email.

**Q: Navigation Timeout in Binus.**
- The bot now uses optimized navigation. If it still fails, check your internet connection or increase the timeout in `src/constant/locator.ts`.

**Q: Gemini Report Generation Fails.**
- Ensure your `GEMINI_API_KEY` is valid.
- **Check for PDF**: Ensure you have placed a valid `.pdf` file in the `monthly-report-example/` directory. The bot needs this file to proceed.
- Check if the model `gemini-3-flash-preview` is available in your region.

## 🔒 Security & Privacy

- ✅ **Local Storage**: All data stays on your computer.
- ✅ **No Data Sharing**: Your credentials are never transmitted to external servers.
- ✅ **Secure Login**: Uses standard automation protocols.

## 📝 License

This project is licensed under the Freeware License.

## ⚠️ Disclaimer

This bot is for educational and productivity purposes. Use it responsibly and in accordance with your university's policies.
