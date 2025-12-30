# BINUS Logbook Bot 🤖

An automated bot that streamlines the process of submitting monthly student internship activity data to the BINUS University LMS. This bot **scrapes activity data directly from the "One Kalbe Intern Hub" Glide app** and automatically fills out the logbook entries, saving you hours of manual data entry.

### ✨ Key Features

- 📱 **Glide Integration**: Automatically scrapes activity logs (Activity & Description) from the Glide app.
- 🚀 **Automated Data Entry**: Fills out Binus logbook entries automatically using the scraped data.
- 🗓️ **Smart Date Matching**: Matches activities by date, handling different formats (e.g., "Thu, 02 Oct 2025" vs "02 October 2025").
- 🔄 **Pagination Support**: Automatically navigates through multiple pages of activities in Glide.
- ⚙️ **Flexible Configuration**: Customize month, semester, and clock times via environment variables.
- 🔒 **Secure**: Your credentials are stored locally and never shared.
- 🛡️ **Error Handling**: Robust error handling with detailed logging.

## 🚀 Quick Start

### Prerequisites

Before you begin, make sure you have:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **BINUS University credentials** (email and password)
- **Glide App Access** (email used for "One Kalbe Intern Hub")

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
cp env.example .env
# Or create a new .env file manually
```

Add your credentials and configuration to the `.env` file:

```env
# Login credentials
EMAIL=your.email@binus.ac.id
PASSWORD=your_password

# Clock in and out times (12-hour format: HH:MM am or pm)
CLOCK_IN_TIME="08:00 am"
CLOCK_OUT_TIME="05:00 pm"

# Logbook month (use month abbreviation)
# EVEN semester months: FEB, MAR, APR, MAY, JUN, JUL, AUG
# ODD semester months: SEP, OCT, NOV, DEC, JAN, FEB
LOGBOOK_MONTH=SEP

# Internship semester (EVEN or ODD)
# EVEN: 2420, ODD: 2510
INTERNSHIP_SEMESTER=ODD
```

> ⚠️ **Security Note**: Your credentials are stored locally on your machine and are never shared or uploaded anywhere.

#### 4. Run the Bot

Start the bot by running:

```bash
npm start
```

### 🔄 The Workflow

1.  **Glide Scraping Phase**:
    *   The bot opens the Glide app.
    *   It enters your email and clicks "Continue".
    *   **ACTION REQUIRED**: You will receive an OTP via email. **Enter this OTP in the terminal** when prompted.
    *   The bot navigates to the "Attendance" section.
    *   It finds the row for the configured `LOGBOOK_MONTH` and year.
    *   It scrapes all activity logs, handling pagination if necessary.

2.  **Binus Automation Phase**:
    *   The bot logs into your BINUS LMS account.
    *   It navigates to the activity logbook for the specified semester and month.
    *   It iterates through each day in the logbook.
    *   It matches the date with the scraped Glide data.
    *   If a match is found, it fills the **Activity** and **Description** fields with the data from Glide.
    *   It handles "OFF" days automatically if marked in the Glide data.
    *   It submits the entry.

## 📁 Project Structure

```
logbook_bot/
├── src/
│   ├── core/           # Core bot functionality
│   │   ├── bot.ts      # Binus automation logic
│   │   ├── glide.ts    # Glide scraping logic
│   │   └── login.ts    # Binus login automation
│   ├── constant/       # Configuration files
│   │   ├── locator.ts  # Web element selectors
│   │   └── url.ts      # URL constants
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── main.ts         # Application entry point
├── package.json        # Project dependencies
└── README.md           # This file
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Example | Options |
|----------|-------------|---------|---------|
| `EMAIL` | Your BINUS/Glide email address | `john.doe@binus.ac.id` | - |
| `PASSWORD` | Your BINUS password | `your_password` | - |
| `CLOCK_IN_TIME` | Clock-in time | `"08:00 am"` | Any valid time |
| `CLOCK_OUT_TIME` | Clock-out time | `"05:00 pm"` | Any valid time |
| `LOGBOOK_MONTH` | Month for logbook entries | `SEP` | SEP, OCT, NOV, etc. |
| `INTERNSHIP_SEMESTER` | Semester type | `ODD` | EVEN, ODD |

## 🛠️ Troubleshooting

### Common Issues

**Q: The bot waits for OTP but I didn't receive it.**
- Check your spam folder.
- Ensure the email in `.env` matches your Glide account email.

**Q: The bot fails to find the month in Glide.**
- Ensure `LOGBOOK_MONTH` is set correctly (e.g., `SEP` for September).
- The bot looks for the month name (e.g., "September") in the Glide list.

**Q: Dates are not matching.**
- The bot expects Binus dates like `Thu, 02 Oct 2025` and Glide dates like `02 October 2025`.
- If formats change, the date parsing logic in `src/core/bot.ts` might need adjustment.

**Q: "OFF" days are not handled.**
- Ensure the activity log in Glide contains the word "OFF" (case-insensitive) in the description or title.

## 🔒 Security & Privacy

- ✅ **Local Storage**: All data stays on your computer.
- ✅ **No Data Sharing**: Your credentials are never transmitted to external servers.
- ✅ **Secure Login**: Uses standard automation protocols.

## 📝 License

This project is licensed under the Freeware License.

## ⚠️ Disclaimer

This bot is for educational and productivity purposes. Use it responsibly and in accordance with your university's policies.
