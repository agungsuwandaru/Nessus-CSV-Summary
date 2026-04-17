/**
 * OTOMATION VAPT - VA INFRA (DYNAMIC WHITELIST + FULL UI RESTORED)
 * Update: Restored HTML Modal loading indicator (green text).
 */

const GEMINI_API_KEY = "MASUKKAN_API_KEY_GEMINI_DISINI"; 

function runVaptInfraAutomation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportListSheet = ss.getSheetByName("Report List");
  if (!reportListSheet) return SpreadsheetApp.getUi().alert('Tab "Report List" tidak ditemukan!');
  
  const reportData = reportListSheet.getDataRange().getValues();
  const reportHeaders = reportData[0];
  const colRun = reportHeaders.indexOf("Run");
  const colUpdate = reportHeaders.indexOf("Update");
  const colSourceSheet = reportHeaders.indexOf("Source Sheet");
  const colSourceTab = reportHeaders.indexOf("Source Tab");
  const colTargetSheet = reportHeaders.indexOf("Target Sheet");
  const colTargetTab = reportHeaders.indexOf("Tab Target"); 
  
  if (colRun === -1 || colTargetTab === -1) return;

  // --- AMBIL DATA DARI PENGELOMPOKAN FINDING ---
  const groupDict = {};
  const groupSheet = ss.getSheetByName("Pengelompokan Finding"); 
  if (groupSheet) {
    const gd = groupSheet.getDataRange().getValues();
    for (let i = 1; i < gd.length; i++) {
      if (gd[i][0]) groupDict[gd[i][0].toString().trim()] = gd[i][1].toString().trim();
    }
  }

  // --- AMBIL DATA DARI SMART AGGREGATOR ---
  const smartRules = [];
  const smartAggregatorSheet = ss.getSheetByName("Smart Aggregator");
  if (smartAggregatorSheet) {
    const sd = smartAggregatorSheet.getDataRange().getValues();
    const sHeaders = sd[0];
    const colKeyword = sHeaders.indexOf("Key Word");
    const colRule = sHeaders.indexOf("Rule");
    const colTargetName = sHeaders.indexOf("Target Name");
    
    if (colKeyword !== -1 && colRule !== -1 && colTargetName !== -1) {
      for (let i = 1; i < sd.length; i++) {
        if (sd[i][colKeyword]) {
          smartRules.push({
            keyword: sd[i][colKeyword].toString().trim(),
            rule: sd[i][colRule].toString().trim(),
            targetName: sd[i][colTargetName].toString().trim()
          });
        }
      }
    }
  }

  // --- AMBIL DATA DARI SMART AGGREGATOR - WHITELIST ---
  const whitelistRules = {};
  const whitelistSheet = ss.getSheetByName("Smart Aggregator - Whitelist"); 
  if (whitelistSheet) {
    const wd = whitelistSheet.getDataRange().getValues();
    const wHeaders = wd[0];
    const colKw = wHeaders.indexOf("Key Word");
    const colRule = wHeaders.indexOf("Rule");
    const colCol = wHeaders.indexOf("Column");

    if (colKw !== -1 || colRule !== -1 || colCol !== -1) {
      for (let i = 1; i < wd.length; i++) {
        let kw = wd[i][colKw] ? wd[i][colKw].toString().trim() : "";
        let r = wd[i][colRule] ? wd[i][colRule].toString().trim() : "";
        let c = wd[i][colCol] ? wd[i][colCol].toString().trim() : "";
        if (kw && c) {
          if (!whitelistRules[c]) whitelistRules[c] = [];
          whitelistRules[c].push({ keyword: kw, rule: r });
        }
      }
    }
  } else {
    Logger.log('Peringatan: Tab "Smart Aggregator - Whitelist" tidak ditemukan.');
  }

  // --- PENGELOMPOKAN TUGAS BERDASARKAN TARGET ---
  const tasksByTarget = {};
  const runRowsIndices = [];

  for (let i = 1; i < reportData.length; i++) {
    const row = reportData[i];
    if ((row[colRun] === true || row[colRun] === "TRUE") && row[colUpdate] === "Summarize - General VA Infra") {
      const targetId = getSpreadsheetIdFromUrl_(row[colTargetSheet]);
      const targetTab = row[colTargetTab];
      const targetKey = targetId + "|||" + targetTab;

      if (!tasksByTarget[targetKey]) tasksByTarget[targetKey] = [];
      tasksByTarget[targetKey].push({
        rowIndex: i + 1,
        sourceSheet: row[colSourceSheet],
        sourceTab: row[colSourceTab],
        targetId: targetId,
        targetTab: targetTab
      });
      runRowsIndices.push(i + 1);
    }
  }

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const missingSoftware = new Set();
  const editedTargets = [];

  for (const targetKey in tasksByTarget) {
    const tasks = tasksByTarget[targetKey];
    const targetId = tasks[0].targetId;
    const targetTabName = tasks[0].targetTab;
    
    let consolidatedFindings = {}; 

    tasks.forEach(task => {
      try {
        const sourceSs = SpreadsheetApp.openById(getSpreadsheetIdFromUrl_(task.sourceSheet));
        const sourceSheetTab = sourceSs.getSheetByName(task.sourceTab);
        const shortFileName = sourceSs.getName().split(/[\s_]/)[0].toUpperCase();
        const sourceValues = sourceSheetTab.getDataRange().getValues();
        
        processSourceData_(sourceValues, groupDict, shortFileName, missingSoftware, consolidatedFindings, smartRules, whitelistRules);
      } catch (e) { Logger.log("Error Source: " + e.message); }
    });

    try {
      const targetSs = SpreadsheetApp.openById(targetId);
      let targetSheetTab = targetSs.getSheetByName(targetTabName);
      
      if (!targetSheetTab) {
        const templateSheet = ss.getSheetByName("General VA Infra - Template");
        targetSheetTab = templateSheet.copyTo(targetSs);
        targetSheetTab.setName(targetTabName);
        if (targetSheetTab.getMaxRows() > 1) {
          targetSheetTab.getRange(2, 1, targetSheetTab.getMaxRows() - 1, targetSheetTab.getMaxColumns()).clearContent();
        }
      }

      const targetValues = targetSheetTab.getDataRange().getValues();
      const existingDataMap = {};
      if (targetValues.length > 1) {
        for (let r = 1; r < targetValues.length; r++) {
          const tr = targetValues[r];
          if (tr[1] && tr[4]) existingDataMap[tr[1].toString().trim() + "|||" + tr[4].toString().trim()] = { rowIndex: r + 1, rowData: tr };
        }
      }

      const rowsToUpdate = []; 
      const rowsToAppend = [];
      for (const key in consolidatedFindings) {
        const nf = consolidatedFindings[key];
        const rowDataToSave = ["", nf.scope, "Open", nf.riskStr, nf.finding, today, today, nf.desc, nf.rec, nf.pluginStr, nf.portStr, nf.cveStr, nf.maxCvss];
        
        if (existingDataMap[key]) {
          rowDataToSave[5] = existingDataMap[key].rowData[5] ? existingDataMap[key].rowData[5] : today; 
          rowsToUpdate.push({ rowIndex: existingDataMap[key].rowIndex, values: rowDataToSave });
          delete existingDataMap[key]; 
        } else {
          rowsToAppend.push(rowDataToSave);
        }
      }

      for (const key in existingDataMap) {
        const ex = existingDataMap[key].rowData;
        if (ex[2] !== "Closed") { ex[2] = "Closed"; rowsToUpdate.push({ rowIndex: existingDataMap[key].rowIndex, values: ex }); }
      }

      rowsToUpdate.forEach(item => targetSheetTab.getRange(item.rowIndex, 1, 1, item.values.length).setValues([item.values]));
      if (rowsToAppend.length > 0) targetSheetTab.getRange(targetSheetTab.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
      
      const finalLastRow = targetSheetTab.getLastRow();
      if (finalLastRow > 1) {
        const noArr = Array.from({length: finalLastRow - 1}, (_, i) => [i + 1]);
        targetSheetTab.getRange(2, 1, noArr.length, 1).setValues(noArr);

        if (finalLastRow > 2) {
          const tmpl = targetSheetTab.getRange(2, 1, 1, 13);
          const trgt = targetSheetTab.getRange(3, 1, finalLastRow - 2, 13);
          tmpl.copyTo(trgt, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
          tmpl.copyTo(trgt, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
          tmpl.copyTo(trgt, SpreadsheetApp.CopyPasteType.PASTE_CONDITIONAL_FORMATTING, false);
        }
        targetSheetTab.getRange(2, 1, finalLastRow - 1, 13).setWrap(true);
        SpreadsheetApp.flush(); 
        targetSheetTab.setRowHeights(2, targetSheetTab.getMaxRows() - 1, 120);
      }
      
      const maxRows = targetSheetTab.getMaxRows();
      if (maxRows > finalLastRow) {
         targetSheetTab.deleteRows(finalLastRow + 1, maxRows - finalLastRow);
      }
      const maxCols = targetSheetTab.getMaxColumns();
      const usedCols = 13; 
      if (maxCols > usedCols) {
         targetSheetTab.deleteColumns(usedCols + 1, maxCols - usedCols);
      }
      
      editedTargets.push({ id: targetId, tab: targetTabName });
    } catch (e) { Logger.log("Error Target: " + e.message); }
  }

  runRowsIndices.forEach(idx => reportListSheet.getRange(idx, colRun + 1).setValue(false));

  let missingArr = Array.from(missingSoftware);
  if (missingArr.length > 0) {
    showBulkHTMLModal_(missingArr, editedTargets);
  } else {
    SpreadsheetApp.getUi().alert("Proses Selesai!");
  }
}

function applyWhitelist_(text, rules) {
  if (!text) return [];
  let cleaned = text.replace(/scan would normally rely on checking[\s\S]*?\/etc\/yum\.repos\.d\/\./gi, "")
                    .replace(/package versions of the affected packages from this advisory[\s\S]*?(?=\r?\n\r?\n|$)/gi, "")
                    .trim();
  
  if (!rules || rules.length === 0) {
     return cleaned ? [cleaned] : []; 
  }
  
  return cleaned.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => {
       if (l === "") return false;
       for (let r of rules) {
          if (r.rule.toLowerCase() === "first word") {
             if (l.toLowerCase().startsWith(r.keyword.toLowerCase())) return true;
          }
       }
       return false;
    })
    .filter((v, i, a) => a.indexOf(v) === i); 
}

function processSourceData_(sourceValues, groupDict, shortFileName, missingSoftware, groupedObj, smartRules, whitelistRules) {
  const headers = sourceValues[0];
  const idx = {
    host: getIdx_(headers, "Host"), name: getIdx_(headers, "Name", "Vulnerability"),
    riskCol: getIdx_(headers, "Risk", "Severity"), 
    cvssTemp: getIdx_(headers, "CVSS v3.0 Temporal Score"),
    cvssBase: getIdx_(headers, "CVSS v3.0 Base Score"), 
    cvssBase2: getIdx_(headers, "CVSS v2.0 Base Score"), 
    desc: getIdx_(headers, "Description"),
    sol: getIdx_(headers, "Solution", "Recommendation"), plugin: getIdx_(headers, "Plugin Output"),
    port: getIdx_(headers, "Port"), cve: getIdx_(headers, "CVE")
  };
  
  const geminiCache = {}; 
  
  for (let i = 1; i < sourceValues.length; i++) {
    const row = sourceValues[i];
    let rawName = idx.name !== -1 ? row[idx.name].toString().trim() : "";
    if (!rawName) continue;
    let rawRisk = idx.riskCol !== -1 ? row[idx.riskCol].toString().trim().toLowerCase() : "";
    if (rawRisk === "none" || rawRisk === "info") continue; 
    let cvss = !isNaN(parseFloat(row[idx.cvssTemp])) ? parseFloat(row[idx.cvssTemp]) : (!isNaN(parseFloat(row[idx.cvssBase])) ? parseFloat(row[idx.cvssBase]) : (!isNaN(parseFloat(row[idx.cvssBase2])) ? parseFloat(row[idx.cvssBase2]) : 0));
    if (rawRisk === "" && cvss < 0.1) continue; 
    
    let riskStr = "Low";
    if (cvss >= 9.0 || rawRisk === "critical") riskStr = "Critical";
    else if (cvss >= 7.0 || rawRisk === "high") riskStr = "High";
    else if (cvss >= 4.0 || rawRisk === "medium") riskStr = "Medium";
    else if (cvss >= 0.1 || rawRisk === "low") riskStr = "Low";

    let finalName = groupDict[rawName] || smartAgregateFindingName_(rawName, smartRules);
    let scopeStr = (idx.host !== -1 ? row[idx.host].toString().trim() : "") + " " + shortFileName;
    let port = (idx.port !== -1 && row[idx.port].toString() !== "0") ? row[idx.port].toString().trim() : "";
    let cveList = idx.cve !== -1 ? row[idx.cve].toString().split(/[\n,]+/).map(c => c.trim()).filter(c => c !== "") : [];
    
    let pluginRaw = idx.plugin !== -1 ? row[idx.plugin].toString() : "";
    let descRawText = idx.desc !== -1 ? row[idx.desc].toString() : "";
    let solRawText = idx.sol !== -1 ? row[idx.sol].toString() : "";
    
    let pluginPairs = applyWhitelist_(pluginRaw, whitelistRules["Plugin Output"]);
    let descFiltered = applyWhitelist_(descRawText, whitelistRules["Description"]);
    let recFiltered = applyWhitelist_(solRawText, whitelistRules["Recommendation"]);
    
    let pluginCleaned = applyWhitelist_(pluginRaw, null);
    let installedVersion = extractVersion_(pluginRaw);

    const key = scopeStr + "|||" + finalName;
    if (!groupedObj[key]) {
      groupedObj[key] = { 
          scope: scopeStr, finding: finalName, maxCvss: cvss, riskStr: riskStr, 
          ports: port ? [port] : [], cves: cveList, versions: installedVersion ? [installedVersion] : [], 
          pluginPairs: pluginPairs, descFiltered: descFiltered, recFiltered: recFiltered,
          pluginBlocks: pluginCleaned.length > 0 ? [pluginCleaned[0]] : [], 
          descRaw: descRawText, solRaw: solRawText, rawNames: [rawName] 
      };
    } else {
      const g = groupedObj[key];
      if (cvss > g.maxCvss) { g.maxCvss = cvss; g.riskStr = riskStr; }
      if (port && !g.ports.includes(port)) g.ports.push(port);
      cveList.forEach(c => { if (!g.cves.includes(c)) g.cves.push(c); });
      if (installedVersion && !g.versions.includes(installedVersion)) g.versions.push(installedVersion);
      
      pluginPairs.forEach(pair => { if (!g.pluginPairs.includes(pair)) g.pluginPairs.push(pair); });
      descFiltered.forEach(l => { if (!g.descFiltered.includes(l)) g.descFiltered.push(l); });
      recFiltered.forEach(l => { if (!g.recFiltered.includes(l)) g.recFiltered.push(l); });
      
      if (pluginCleaned.length > 0 && !g.pluginBlocks.includes(pluginCleaned[0])) g.pluginBlocks.push(pluginCleaned[0]);
      if (!g.rawNames.includes(rawName)) g.rawNames.push(rawName);
    }
  }

  for (const key in groupedObj) {
     const g = groupedObj[key];
     g.portStr = g.ports.join(", ");
     g.cveStr = [...new Set(g.cves)].join(", ");
     let hasCve = g.cves.length > 0;
     let isMultiple = hasCve && (g.finding.toLowerCase().includes("multiple") || g.rawNames.length > 1 || g.finding !== g.rawNames[0]);
     if (!hasCve) { isMultiple = false; if (g.finding.toLowerCase().includes("multiple")) g.finding = g.rawNames[0]; }
     
     if (isMultiple) {
        let osTarget = g.finding.split(" Multiple")[0].trim();
        let versionDesc = g.versions.length === 1 ? ` (Installed version: ${g.versions[0]})` : "";
        let suffix = g.versions.length === 1 ? "" : " Please check installed version via plugin output.";

        let pluginJoiner = (whitelistRules["Plugin Output"] && whitelistRules["Plugin Output"].length > 0) ? "\n\n" : "\n\n---\n\n";
        g.pluginStr = g.pluginPairs.length > 0 ? g.pluginPairs.join(pluginJoiner) : "-";

        if (whitelistRules["Description"] && whitelistRules["Description"].length > 0) {
            g.desc = g.descFiltered.length > 0 ? g.descFiltered.join("\n\n") : "-";
        } else {
            g.desc = `The remote system is affected by multiple vulnerabilities related to ${osTarget}${versionDesc}.${suffix}`;
        }

        if (whitelistRules["Recommendation"] && whitelistRules["Recommendation"].length > 0) {
            g.rec = g.recFiltered.length > 0 ? g.recFiltered.join("\n\n") : "-";
        } else {
            let targetData = null;
            if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== "" && !GEMINI_API_KEY.includes("MASUKKAN")) {
                targetData = fetchGeminiData_(osTarget, geminiCache);
            }
            if (!targetData) {
                targetData = { version: "[VERSION_" + osTarget + "]", url: "[URL_" + osTarget + "]" };
                missingSoftware.add(osTarget);
            }
            g.rec = `Upgrade ${osTarget} to the Latest Stable Version (${targetData.version})${g.versions.length > 1 ? ' for all installed versions' : ''}.\n\nReference:\n${targetData.url}`;
        }
     } else {
        g.desc = cleanWordWrap_(g.descRaw.toString()); 
        g.rec = cleanWordWrap_(g.solRaw.toString());
        g.pluginStr = g.pluginBlocks.length > 0 ? g.pluginBlocks.join("\n\n---\n\n") : "-";
     }
  }
}

function smartAgregateFindingName_(rawName, smartRules) {
  let n = rawName.trim();
  if (smartRules && smartRules.length > 0) {
     for (let r of smartRules) {
        if (r.rule.toLowerCase() === "first word") {
           if (n.toLowerCase().startsWith(r.keyword.toLowerCase())) return r.targetName;
        }
     }
  }
  if (/^RHEL\s+\d+\s*:/i.test(n)) return n.match(/^(RHEL\s+\d+)/i)[1] + " Multiple Vulnerabilities";
  if (/Apache\s+Tomcat/i.test(n) && !/Default\s+Files/i.test(n)) return "Apache Tomcat Multiple Vulnerabilities";
  if (/KB\d{6,}|Security\s+Update\s+for\s+Windows/i.test(n)) {
      let m = n.match(/(Windows\s+(Server\s+)?\d{4}(?:\s+R2)?|Windows\s+\d+)/i);
      return m ? m[1] + " Multiple Vulnerabilities" : "Windows Security Updates Multiple Vulnerabilities";
  }
  return n;
}

function showBulkHTMLModal_(missingArr, editedTargets) {
    let instruction = "Isikan ini:\n";
    let counter = 1;
    for (let os of missingArr) {
        instruction += `${counter++}. versi latest stable version ${os}\n`;
        instruction += `${counter++}. reference rekomendasi ${os}\n`;
    }
    let html = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; padding: 10px; color: #333;">
        <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px; white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.5; border: 1px solid #ddd;">${instruction}</pre>
        <p style="font-weight: bold; margin-bottom: 5px;">Jawaban:</p>
        <textarea id="ans" style="width: 100%; height: 200px; box-sizing: border-box; padding: 10px; font-family: monospace; border: 1px solid #aaa; border-radius: 4px; resize: none;"></textarea>
        <br><br>
        <button type="button" onclick="submitData()" style="background: #0b5394; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%;">Simpan & Update ke Sheet</button>
        <p id="msg" style="color: #38761d; font-weight: bold; text-align: center; display: none; margin-top: 15px;">Memproses pembaruan data... (Jendela ini akan menutup otomatis)</p>
        <p id="err" style="color: red; font-weight: bold; text-align: center; display: none; margin-top: 15px;"></p>
    </div>
    <script>
        const missingArr = ${JSON.stringify(missingArr)};
        const editedTargets = ${JSON.stringify(editedTargets)};
        function submitData() {
            document.getElementById('msg').style.display = 'block';
            document.getElementById('err').style.display = 'none';
            let text = document.getElementById('ans').value;
            google.script.run
                .withSuccessHandler(function() { google.script.host.close(); })
                .withFailureHandler(function(error) { 
                    document.getElementById('msg').style.display = 'none';
                    document.getElementById('err').style.display = 'block';
                    document.getElementById('err').innerText = 'Error: ' + error.message;
                })
                .processBulkManualInput(text, missingArr, editedTargets); 
        }
    </script>`;
    let htmlOutput = HtmlService.createHtmlOutput(html).setWidth(500).setHeight(550);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Data Manual Diperlukan");
}

function processBulkManualInput(inputText, missingArr, editedTargets) {
    let answers = {};
    let lines = inputText.split(/\r?\n/);
    for (let line of lines) {
        let match = line.match(/^(\d+)\.\s*(.+)/);
        if (match) answers[parseInt(match[1], 10)] = match[2].trim();
    }
    let finalReplacements = {};
    let counter = 1;
    for (let os of missingArr) {
        finalReplacements["[VERSION_" + os + "]"] = answers[counter++] || "[Latest Version]";
        finalReplacements["[URL_" + os + "]"] = answers[counter++] || "https://www.cvedetails.com/";
    }
    for (let target of editedTargets) {
        try {
            let sheet = SpreadsheetApp.openById(target.id).getSheetByName(target.tab);
            if (sheet) {
                for (let key in finalReplacements) {
                    sheet.createTextFinder(key).replaceAllWith(finalReplacements[key]);
                }
            }
        } catch(e) {}
    }
    SpreadsheetApp.flush(); 
}

function fetchGeminiData_(productName, cache) {
  if (cache[productName]) return cache[productName];
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const prompt = `Provide ONLY JSON: {"latest_version": "x.x.x", "cve_url": "https://..."} for software "${productName}".`;
    const response = UrlFetchApp.fetch(url, { "method": "post", "contentType": "application/json", "payload": JSON.stringify({"contents": [{"parts": [{"text": prompt}]}]}), "muteHttpExceptions": true });
    if (response.getResponseCode() !== 200) return null;
    const resObj = JSON.parse(response.getContentText().replace(/```json|```/gi, "").trim());
    let data = resObj.candidates[0].content.parts[0].text;
    if (typeof data === 'string') data = JSON.parse(data.replace(/```json|```/gi, "").trim());
    cache[productName] = { version: data.latest_version || "[Latest Version]", url: data.cve_url || "https://www.cvedetails.com/" };
    return cache[productName];
  } catch (e) { return null; }
}

function cleanWordWrap_(text) {
  if (!text) return "";
  return text.replace(/scan would normally rely on checking[\s\S]*?\/etc\/yum\.repos\.d\/\./gi, "").replace(/package versions of the affected packages from this advisory[\s\S]*?(?=\r?\n\r?\n|$)/gi, "").split(/\r?\n\s*\r?\n/).map(p => p.split(/\r?\n/).map((l, i, a) => {
    let cur = l.trim();
    if (cur === "") return "";
    if (i < a.length - 1 && !/[:.]$/.test(cur) && !/^[-*•]/.test(a[i+1].trim()) && !/^[^:]+:/.test(a[i+1].trim())) return cur + " ";
    return cur + "\n";
  }).join("").replace(/\s+/g, " ").trim()).join("\n\n");
}

function extractVersion_(text) {
  const match = text.match(/(?:Installed version|version|Remote package installed)\s*:\s*([^\s\n]+)/i);
  return match ? match[1].replace(/[\.,;]+$/, '').trim() : ""; 
}

function getIdx_(arr, ...keywords) { return arr.findIndex(h => keywords.some(kw => h.toString().toLowerCase().includes(kw.toLowerCase()))); }
function getSpreadsheetIdFromUrl_(url) { return (url && url.match(/\/d\/([a-zA-Z0-9-_]+)/)) ? url.match(/\/d\/([a-zA-Z0-9-_]+)/)[1] : url; }