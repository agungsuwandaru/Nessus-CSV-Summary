/**
 * Otomation VAPT - VA Infra
 * Script untuk mengumpulkan finding vulnerability assessment dari berbagai source sheet.
 */

function collectVAInfraFindings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // Asumsi script dijalankan saat berada di "Control Sheet" / Sheet utama
  const controlSheet = ss.getActiveSheet(); 
  const targetTabName = "General VA Infra - Check Finding";
  
  // 1. Siapkan Target Sheet
  let targetSheet = ss.getSheetByName(targetTabName);
  if (!targetSheet) {
    targetSheet = ss.insertSheet(targetTabName);
  } else {
    // Jika sheet sudah ada, HAPUS SEMUA ISINYA terlebih dahulu
    targetSheet.clear(); 
  }

  // Set Header di baris 1
  targetSheet.getRange("A1:C1").setValues([["IP", "Risk", "Finding Name"]]);
  targetSheet.getRange("A1:C1").setFontWeight("bold").setBackground("#f3f3f3");

  // 2. Ambil data dari Control Sheet
  const controlData = controlSheet.getDataRange().getValues();
  if (controlData.length < 2) {
    ui.alert("⚠️ Data control sheet kosong.");
    return;
  }
  
  const headers = controlData[0];
  
  // Cari index dinamis berdasarkan nama kolom
  const idxUpdate = headers.findIndex(h => h.toString().trim() === "Update");
  const idxRun = headers.findIndex(h => h.toString().trim() === "Run");
  const idxSourceSheet = headers.findIndex(h => h.toString().trim() === "Source Sheet");
  const idxSourceTab = headers.findIndex(h => h.toString().trim() === "Source Tab");

  if (idxUpdate === -1 || idxRun === -1 || idxSourceSheet === -1 || idxSourceTab === -1) {
    ui.alert("❌ Error: Kolom 'Update', 'Run', 'Source Sheet', atau 'Source Tab' tidak ditemukan. Pastikan nama header sesuai.");
    return;
  }

  let allFindings = [];
  let processedRows = [];

  // 3. Looping Baris Control Sheet
  for (let i = 1; i < controlData.length; i++) {
    let row = controlData[i];
    let updateVal = row[idxUpdate];
    let runVal = row[idxRun]; // Checkbox TRUE/FALSE

    if (updateVal === "Check Finding - General VA Infra" && runVal === true) {
      let sourceUrlOrId = row[idxSourceSheet];
      let sourceTab = row[idxSourceTab];
      
      if (!sourceUrlOrId || !sourceTab) continue;

      try {
        // Buka Source Spreadsheet (mendukung URL lengkap atau hanya ID)
        let sourceSs;
        if (sourceUrlOrId.toString().includes("http")) {
          sourceSs = SpreadsheetApp.openByUrl(sourceUrlOrId);
        } else {
          sourceSs = SpreadsheetApp.openById(sourceUrlOrId);
        }

        let sourceSheetObj = sourceSs.getSheetByName(sourceTab);
        if (!sourceSheetObj) {
          Logger.log(`Tab ${sourceTab} tidak ditemukan di source.`);
          continue;
        }

        let sourceData = sourceSheetObj.getDataRange().getValues();
        if (sourceData.length < 2) continue; // Skip jika sheet kosong/hanya header

        let sourceHeaders = sourceData[0];

        // Cari index kolom di Source Sheet (Regex agar lebih fleksibel mencari header)
        let colScope = sourceHeaders.findIndex(h => h.toString().toLowerCase().match(/scope|ip|host|target/));
        let colRisk = sourceHeaders.findIndex(h => h.toString().toLowerCase().match(/risk|severity|level/));
        let colFinding = sourceHeaders.findIndex(h => h.toString().toLowerCase().match(/finding|vulnerability|name|title|plugin name/));

        if (colScope === -1 || colRisk === -1 || colFinding === -1) {
          Logger.log(`Header standar VA tidak lengkap di source: ${sourceTab}`);
          continue; 
        }

        // Kumpulkan finding dari source sheet ini
        for (let j = 1; j < sourceData.length; j++) {
          let scopeData = sourceData[j][colScope] ? sourceData[j][colScope].toString().trim() : "";
          let riskData = sourceData[j][colRisk] ? sourceData[j][colRisk].toString().trim() : "";
          let findingData = sourceData[j][colFinding] ? sourceData[j][colFinding].toString().trim() : "";

          // Validasi: Baris yang kosong tidak akan dimasukkan
          if (scopeData !== "" && findingData !== "") {
            allFindings.push([scopeData, riskData, findingData]);
          }
        }
        
        // Simpan index baris untuk di-uncheck nanti
        processedRows.push(i + 1); 

      } catch (e) {
        Logger.log(`Error saat memproses baris ke-${i+1}: ${e.message}`);
      }
    }
  }

  // 4. Output Data ke Target Tab (Mulai dari baris ke-2)
  if (allFindings.length > 0) {
    // Masukkan data hasil ke baris 2 (di bawah header)
    targetSheet.getRange(2, 1, allFindings.length, 3).setValues(allFindings);
    
    // (Opsional) Uncheck kolom "Run" agar tidak berjalan dua kali di run berikutnya
    processedRows.forEach(rowIdx => {
      controlSheet.getRange(rowIdx, idxRun + 1).setValue(false);
    });

    ui.alert(`✅ Sukses! Berhasil mengganti data dan mengumpulkan ${allFindings.length} finding ke tab "${targetTabName}".`);
  } else {
    ui.alert("ℹ️ Tidak ada data baru yang diproses. Pastikan kolom 'Run' dicentang (TRUE) dan format source benar.");
  }
}