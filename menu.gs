/**
 * Fungsi khusus Google Sheets yang otomatis jalan saat file dibuka
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  // Membuat Menu Utama "⚡ VAPT TOOLS"
  ui.createMenu('⚡ VAPT TOOLS')
      .addItem('Conversion Report - VA Infra', "runVaptInfraAutomation")
      .addItem('Check Finding - VA Infra',"collectVAInfraFindings")
      // Jika nanti ada fungsi lain, tinggal tambah addItem lagi di bawahnya:
      // .addSeparator() // Garis pembatas
      // .addItem('Sync Data Vulnerability', 'namaFungsiLain')
      .addToUi();
}
