Sample file with the script:
https://docs.google.com/spreadsheets/d/1fyvd5J1LbL5j-WClyY-YE03AgyC9K4vfRgarQ9Cwl7Q/edit?gid=671858142#gid=671858142

---

# 🚀 VAPT Report Automation - Infrastructure VA (Google Apps Script)

This repository contains an advanced **Google Apps Script (GAS)** designed to automate the extraction, aggregation, cleaning, and reporting of Infrastructure Vulnerability Assessment (VA) results (such as raw Nessus scan data) into a standardized report format in Google Sheets.

This script features artificial intelligence integration (**Gemini AI**) for automated version research, a robust HTML Pop-Up Fallback system for manual bulk input, and a Dynamic Whitelisting system for precise data filtering.

## ✨ Key Features

* 🤖 **Gemini AI Integration:** Automatically calls the Gemini API to fetch the *Latest Stable Version* and *Reference / CVE* links specifically for aggregated *Multiple Vulnerabilities*.
* 🧠 **Smart Aggregator (Dynamic Aggregation):** Configurable rules directly within the Spreadsheet to group findings with various versions under a single umbrella (e.g., merging `Nginx 1.2` and `Nginx 1.4` into `Nginx Multiple Vulnerabilities`).
* 🛡️ **Dynamic Whitelisting:** Filters long text blocks in "Plugin Output", "Description", or "Recommendation" based on specific keywords (e.g., capturing only lines starting with the word "Path") without modifying the source code.
* 💻 **Hybrid HTML Modal (Bulk Input Fallback):** If the API Key is missing, empty, or fails (due to limits/errors), the script provides a safety net via an interactive HTML Pop-up interface for manual, bulk data input at the end of the process.
* 🧹 **Clean Report & Auto-Formatting:** Locks absolute row heights to exactly **120px** (bypassing Google Sheets' native *Wrap Text* auto-resize bugs), copies color/validation formats from a Template, and automatically deletes unused empty rows and columns.
* 🔄 **Smart Data Consolidation:** Merges findings from multiple different source files into the exact same target sheet seamlessly, performing deduplication on the fly.

---

## 📋 System Prerequisites

To run perfectly, your Google Spreadsheet **must** contain the following 5 sheets (tabs) with **exact** naming (pay attention to spaces and capitalization):

1.  `Report List` (As the Control Panel / Master Data)
2.  `General VA Infra - Template` (As the base report formatting template)
3.  `Pengelompokan Finding` (Dictionary for Exact Match finding renaming)
4.  `Smart Aggregator` (Rules for dynamic naming aggregation)
5.  `Smart Aggregator - Whitelist` (Rules for dynamic text extraction/filtering)

---

## 🏗️ Spreadsheet Structure

### 1. `Report List` Tab
The main control panel where you instruct the script to run.
* **Required Columns:** `Run`, `Update`, `Source Sheet` (URL/ID), `Source Tab`, `Target Sheet` (URL/ID), `Tab Target`.
* **How it works:** The script only processes rows where the `Run` column is checked (`TRUE`) and the `Update` column is exactly *"Summarize - General VA Infra"*. Once finished, the checkbox is automatically cleared.

### 2. `Smart Aggregator` Tab
Acts as a smart dictionary to combine multiple findings with different versions into a single *Multiple Vulnerabilities* finding.
* **Column Format:** `Key Word` | `Rule` | `Target Name`
* **Example:** Key Word: `Nginx`, Rule: `First Word`, Target Name: `Nginx Multiple Vulnerabilities`.

### 3. `Smart Aggregator - Whitelist` Tab
Filters the content of *Description*, *Recommendation*, and *Plugin Output* specifically for *Multiple Vulnerabilities* cases.
* **Column Format:** `Key Word` | `Rule` | `Column`
* **Example:** If Column is `Plugin Output`, Rule is `First Word`, and Key Word is `Path`, the script will only extract and summarize lines starting with the word "Path".

---

## ⚙️ Installation & Usage

1.  Open your Google Spreadsheet, and navigate to **Extensions > Apps Script**.
2.  Copy the entire code from the `Code.gs` file in this repository and paste it into your Apps Script editor.
3.  **[OPTIONAL]** Replace the value of the following constant with your Gemini API Key:
    ```javascript
    const GEMINI_API_KEY = "INSERT_GEMINI_API_KEY_HERE"; 
    ```
    *(If left blank or invalid, the script will automatically fallback to the manual HTML Pop-up mode).*
4.  Ensure the row height for row 2 in the `General VA Infra - Template` tab is strictly locked (Right-click row 2 -> *Resize row* -> *Specify row height: 120*).
5.  Save the project and run the `runVaptInfraAutomation()` function. Grant any required authorization permissions prompted by Google.

---

## 🔍 Workflow (Under the Hood)

1.  **Initialization & Grouping:** The script reads the `Report List` tab, filters rows with *Run=TRUE*, and groups them by identical *Target Sheet & Tab Target* to consolidate data neatly from different sources.
2.  **Extraction & Transformation:** Fetches raw data (Host, Risk, CVSS, Plugin Output, etc.) from the *Source Sheet*. Automatically strips default Nessus warning templates (e.g., "scan would normally rely on checking...").
3.  **Aggregation & Deduplication:** Applies renaming rules from the *Smart Aggregator* tab. Merges identical Hosts, Ports, CVEs, and Plugin Outputs into single entries based on the highest CVSS score.
4.  **AI Fetch / Modal Fallback:** For *Multiple Vulnerabilities*, the script makes an API call to Gemini. If it fails, a temporary placeholder `[VERSION_Software]` is inserted, and a Bulk HTML Modal Prompt is triggered at the very end of the execution for manual input.
5.  **Stateful Merge:** Checks the *Target Sheet*. New findings are set to "Open", while old findings no longer present in the latest scan are marked as "Closed".
6.  **Formatting & Cleanup:** Applies template formatting, enforces *Wrap Text*, locks row height exactly at `120px`, and finally deletes all remaining empty rows and columns to generate a pristine, professional report (*Clean Report* feature).

---
*Built to simplify and accelerate VAPT Infrastructure reporting with limitless automation.*

# ⚡ Automation - VA Infra Findings Collector (Google Apps Script)

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
