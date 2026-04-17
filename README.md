Sample file with the script:
https://docs.google.com/spreadsheets/d/1fyvd5J1LbL5j-WClyY-YE03AgyC9K4vfRgarQ9Cwl7Q/edit?gid=671858142#gid=671858142

# ⚡ Automation VAPT - VA Infra Findings Collector

This repository contains a Google Apps Script (GAS) designed to automate the recapitulation of Vulnerability Assessment (VA) Infrastructure findings. The script extracts raw scan data from various client *Source Sheets* into a single, centralized *Target Sheet*.

## 🚀 Key Features

* **Custom Menu Integration:** Adds a custom `⚡ VAPT TOOLS` menu directly in the Google Sheets UI for easy script execution.
* **Auto-Reset & Format:** Automatically clears old data in the *Target Sheet* and generates a new, clean header every time it runs.
* **Smart Column Mapping (Regex):** Dynamically locates the `IP`, `Risk`, and `Finding Name` columns in the *Source Sheet* without relying on strict column orders.
* **Smart Filtering:** Automatically skips empty rows that do not contain valid *IP* or *Finding* data.
* **Auto-Uncheck:** Prevents data duplication by automatically unchecking the task row once the data has been successfully extracted.

## 📋 Data Structure Prerequisites

For the script to run smoothly, ensure your Google Sheets follow this structure:

### 1. Control Sheet (Main Sheet)
Must have columns with the exact following headers:
* `Update`: Contains the task identifier (e.g., `Check Finding - General VA Infra`).
* `Run`: Contains a checkbox (`TRUE`/`FALSE`).
* `Source Sheet`: Contains the full Google Sheets URL or the Spreadsheet ID.
* `Source Tab`: Contains the specific tab name within the source file.

### 2. Source Sheet (Raw Scan Results)
The script uses Regex to map columns. Therefore, the headers in the first row of the source file must contain the following keywords (case-insensitive):
* **Scope/IP Column:** `scope`, `ip`, `host`, or `target`
* **Risk Column:** `risk`, `severity`, or `level`
* **Finding Column:** `finding`, `vulnerability`, `name`, `title`, or `plugin name`

## 🛠️ Installation Steps

1. Open the Google Sheets file you want to use as your *Control Center*.
2. From the top menu, click **Extensions > Apps Script**.
3. Delete the default `function myFunction() { ... }` code in the editor.
4. Create two script files (`.gs`) with the following logic:
   * **`menu.gs`**: Contains the `onOpen()` function to display the custom menu.
   * **`RunVaInfraCheckFinding.gs`**: Contains the main `collectVAInfraFindings()` function for the data extraction logic.
5. Copy and paste the code from this repository into their respective files.
6. Save the project by clicking the **Save** icon (💾).
7. Go back to your Google Sheets and refresh the page (F5).
8. The `⚡ VAPT TOOLS` menu will appear next to the *Help* menu.

## 💡 Usage Guide

1. Open the *Control Sheet* tab.
2. Fill in your task details. Ensure the **Update** column is exactly `Check Finding - General VA Infra`.
3. Check the box in the **Run** column for the files you want to process.
4. Click the **⚡ VAPT TOOLS > Conversion Report - VA Infra** menu in Google Sheets.
5. Upon the first run, Google will prompt for authorization. Click **Continue > Choose your Google Account > Advanced > Go to Script**.
6. Wait a few seconds until the success pop-up appears.
7. The consolidated results can be viewed in the **General VA Infra - Check Finding** tab.

## ⚠️ Troubleshooting

* **Menu does not appear:** Ensure there is only **one** `onOpen()` function across your entire Apps Script project. Multiple `onOpen()` functions will conflict and cause the menu to fail.
* **Data not imported:** Double-check the headers in your source file. Make sure they contain the recognizable Regex keywords mentioned above.
* **Permission Error:** Ensure the Google account running the script has at least *Viewer* access to the inputted *Source Sheet* URL.

---
*Developed for Internal VAPT Automation.*
