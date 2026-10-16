/**
 * D&D 3.5e Rule Library & AI Rule Importer Engine
 * 
 * Features:
 * 1. Rule_Library Sheet Builder (Prioritized Sources, Splatbook Catalog, Schema Ref)
 * 2. Per-User Secure API Key Management (UserProperties + Session Cache)
 * 3. AI Rule Importer HTML Sidebar with Dark Fantasy UI
 * 4. Gemini Flash API Cascade Search (Core SRD -> Foundry JSON -> Splatbooks)
 * 5. Automated 29-Column Master_DB Append Engine with Parent-Child Styling
 */

// ----------------------------------------------------
// 1. RULE_LIBRARY SHEET BUILDER
// ----------------------------------------------------
function createRuleLibrarySheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Rule_Library";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
  sheet.clearConditionalFormatRules();
  sheet.clear();
  sheet.setTabColor("#7c3aed"); // Royal Purple tab color

  // Ensure 10 columns (A through J)
  var curCols = sheet.getMaxColumns();
  if (curCols < 10) {
    sheet.insertColumnsAfter(curCols, 10 - curCols);
  } else if (curCols > 10) {
    sheet.deleteColumns(11, curCols - 10);
  }

  sheet.setFrozenRows(4);

  // Column widths
  sheet.setColumnWidth(1, 40);   // Margin / Icon
  sheet.setColumnWidth(2, 90);   // Priority / Code
  sheet.setColumnWidth(3, 200);  // Name / Title
  sheet.setColumnWidth(4, 250);  // Scope / Contents
  sheet.setColumnWidth(5, 280);  // URL / Link
  sheet.setColumnWidth(6, 120);  // Format / Category
  sheet.setColumnWidth(7, 100);  // Status / Edition
  sheet.setColumnWidth(8, 220);  // Notes / Mechanics
  sheet.setColumnWidth(9, 40);   // Spacing
  sheet.setColumnWidth(10, 40);  // Spacing

  // --- Title Banner (Rows 1-2) ---
  sheet.getRange("A1:H1").merge().setBackground("#1e1b4b").setFontColor("#f8fafc")
    .setFontSize(14).setFontWeight("bold").setVerticalAlignment("middle")
    .setValue("  📚 D&D 3.5e RULE LIBRARY & AI SOURCE DIRECTORY");
  
  sheet.getRange("A2:H2").merge().setBackground("#0f172a").setFontColor("#cbd5e1")
    .setFontSize(9).setFontStyle("italic").setVerticalAlignment("middle")
    .setValue("  Kademeli Kural Kaynakları (Core SRD ➔ Foundry VTT ➔ Splatbooks) • Kural Kitapları & PDF Arşivi • AI Rule Importer Referansı");

  // --- AI Model Config Bar (Row 3) ---
  sheet.getRange("A3:B3").merge().setBackground("#1e1b4b").setFontColor("#e0e7ff")
    .setFontSize(9).setFontWeight("bold").setHorizontalAlignment("right").setVerticalAlignment("middle")
    .setValue("🤖 AI MODEL SEÇİMİ: ");

  var modelRule = SpreadsheetApp.newDataValidation().requireValueInList([
    "AUTO (Otomatik En Hızlı Model)", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-flash-latest"
  ], false).build();
  sheet.getRange("C3:D3").merge().setBackground("#0f172a").setFontColor("#38bdf8")
    .setFontSize(10).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle")
    .setValue("AUTO (Otomatik En Hızlı Model)").setDataValidation(modelRule);
  sheet.getRange("C3:D3").setBorder(true, true, true, true, false, false, "#38bdf8", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  sheet.getRange("E3:H3").merge().setBackground("#1e1b4b").setFontColor("#94a3b8")
    .setFontSize(8).setFontStyle("italic").setVerticalAlignment("middle")
    .setValue(" 💡 İleride yeni bir model çıktığında buraya yazabilirsiniz. AUTO modunda sistem en güncelini otomatik seçer.");

  sheet.setRowHeight(1, 32);
  sheet.setRowHeight(2, 22);
  sheet.setRowHeight(3, 26);
  sheet.setRowHeight(4, 26);

  // --- Section 1: Prioritized Sources (Rows 4-8) ---
  sheet.getRange("A4:H4").merge().setBackground("#312e81").setFontColor("#e0e7ff")
    .setFontSize(10).setFontWeight("bold").setVerticalAlignment("middle")
    .setValue("  ⚡ 1. KADEMELİ ARAMA KAYNAKLARI (PRIORITIZED KNOWLEDGE BASES)");

  var srcHeaders = ["#", "Öncelik", "Kaynak Adı", "Kapsam & İçerik", "Resmi Web / Repo Linki", "Veri Formatı", "Durum", "AI Kullanım Rolü"];
  sheet.getRange(5, 1, 1, srcHeaders.length).setValues([srcHeaders]);
  sheet.getRange("A5:H5").setBackground("#4338ca").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  var sourcesData = [
    ["1", "1 (En Yüksek)", "Core 3.5e SRD (d20srd & dndsrd)", "PHB, DMG, MM Core Kuralları, Featler, Büyüler, Büyülü Eşyalar", "https://www.d20srd.org/index.html", "Temiz HTML", "Aktif", "İlk taranacak saf temel kural kaynağı (Yedek Ayna: http://dndsrd.net)"],
    ["2", "2 (İkincil)", "Foundry VTT D35E Packs (Rughalt)", "Yapılandırılmış JSON: Eşyalar, büyüler, hünerler, hasar ve save mekanikleri", "https://github.com/Rughalt/D35E/tree/master/packs", "Yapılandırılmış JSON", "Aktif", "Mekanik ayrıştırma (dice, DC, duration) için makinece okunabilir veri"],
    ["3", "3 (Genişletilmiş)", "Extended Splatbooks Index (dndtools)", "Complete serisi, MIC, Spell Compendium, Frostburn, Sandstorm vb.", "https://srd.dndtools.org", "Geniş HTML İndeksi", "Aktif", "Core kaynakta bulunamayan ek kitap içerikleri için tam kütüphane"]
  ];
  sheet.getRange(6, 1, sourcesData.length, 8).setValues(sourcesData);
  sheet.getRange("A6:A8").setHorizontalAlignment("center");
  sheet.getRange("B6:B8").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("F6:G8").setHorizontalAlignment("center");
  sheet.getRange("A6:H8").setVerticalAlignment("middle");
  sheet.getRange("B6").setFontColor("#15803d");
  sheet.getRange("B7").setFontColor("#0369a1");
  sheet.getRange("B8").setFontColor("#a21caf");

  // --- Section 2: Campaign Books & PDF Archive (Rows 10-21) ---
  sheet.getRange("A10:H10").merge().setBackground("#1e293b").setFontColor("#f1f5f9")
    .setFontSize(10).setFontWeight("bold").setVerticalAlignment("middle")
    .setValue("  📖 2. KAMPANYA KİTAPLARI & PDF ARŞİV KATALOĞU (İlgili Kitap Linklerinizi Buraya Ekleyin)");

  var bookHeaders = ["#", "Kısaltma", "Kitap Adı (Book Title)", "Ana Kapsam / İçerik", "Google Drive / Web PDF Linkiniz", "Kategori", "Yayımcı", "Önemli Kural / Notlar"];
  sheet.getRange(11, 1, 1, bookHeaders.length).setValues([bookHeaders]);
  sheet.getRange("A11:H11").setBackground("#334155").setFontColor("#ffffff").setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");

  var booksData = [
    ["1", "PHB", "Player's Handbook 3.5", "Temel sınıflar, ırklar, temel hünerler ve büyüler", "", "Core", "WotC", "Karakter yapım temeli"],
    ["2", "DMG", "Dungeon Master's Guide 3.5", "Büyülü eşyalar, prestij sınıfları, hazine tabloları", "", "Core", "WotC", "Eşya fiyatlandırma ve özellikler"],
    ["3", "MM", "Monster Manual 3.5", "Yaratıklar, ırksal özellikler ve şablonlar (templates)", "", "Core", "WotC", "Irk ve dönüşüm kuralları"],
    ["4", "MIC", "Magic Item Compendium", "Binlerce büyülü eşya, eşya kristalleri, vücut yuvaları", "", "Equipment", "WotC", "Tüm donanım ve eşya sinerjisi"],
    ["5", "SpC", "Spell Compendium", "Tüm 3.5e büyü kitaplarının birleştirilmiş ana arşivi", "", "Spells", "WotC", "Genişletilmiş büyü kütüphanesi"],
    ["6", "CW", "Complete Warrior", "Savaşçı sınıfları, dövüş hünerleri, prestij sınıfları", "", "Splatbook", "WotC", "Martial kombinasyonlar"],
    ["7", "CD", "Complete Divine", "İlahi sınıflar, domainler, ilahi hünerler (Divine feats)", "", "Splatbook", "WotC", "Cleric/Paladin mekanikleri"],
    ["8", "CA", "Complete Arcane", "Warlock, Warmage, metamagic hünerleri, büyü mekanikleri", "", "Splatbook", "WotC", "Büyücü mekanikleri"],
    ["9", "CAd", "Complete Adventurer", "Rogue/Bard yetenekleri, Skill Tricks, gizlilik hünerleri", "", "Splatbook", "WotC", "Skill ve keşif kuralları"],
    ["10", "ToB", "Tome of Battle (Book of 9 Swords)", "Savaş manevraları, duruşlar (stances), Martial Adept", "", "Combat", "WotC", "Gelişmiş dövüş manevraları"]
  ];
  sheet.getRange(12, 1, booksData.length, 8).setValues(booksData);
  sheet.getRange("A12:A21").setHorizontalAlignment("center");
  sheet.getRange("B12:B21").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("F12:G21").setHorizontalAlignment("center");
  sheet.getRange("A12:H21").setVerticalAlignment("middle");
  sheet.getRange("E12:E21").setBackground("#f8fafc").setFontStyle("italic");

  // --- Section 3: AI Importer & Schema Reference (Rows 23-28) ---
  sheet.getRange("A23:H23").merge().setBackground("#14532d").setFontColor("#dcfce7")
    .setFontSize(10).setFontWeight("bold").setVerticalAlignment("middle")
    .setValue("  🤖 3. AI RULE IMPORTER NASIL ÇALIŞIR? (KULLANIM REHBERİ)");

  var guideText = 
    "1. Model & Ayarlar: Row 3'teki 'AI Model Seçimi' kutusundan istediğiniz Gemini modelini seçebilir veya AUTO bırakabilirsiniz.\n" +
    "2. API Güvenliği: '🎲 D&D System' ➔ '🔑 Set My Gemini API Key' menüsünden kendi Google AI Studio API anahtarınızı girin.\n" +
    "   Bu anahtar tarayıcınızın oturumunda (UserProperties/Cache) saklanır; tablodaki diğer oyuncular anahtarınızı ASLA göremez!\n" +
    "3. Kural İçe Aktarma: '🎲 D&D System' ➔ '🤖 Open AI Rule Importer' panelini açın.\n" +
    "4. Kural Sorgulama: Eklemek istediğiniz eşya, feat veya büyü adını yazın (Örn: 'Shock Trooper', 'Flametongue', 'Boots of Speed').\n" +
    "5. Otomatik Ayrıştırma: Gemini yapay zekası yukarıdaki 3 kaynağı öncelik sırasına göre tarar ve 29 sütunluk tam satırı üretir.\n" +
    "6. Çoklu Güçler (Parent-Child): Eğer nesnenin hem pasif hem aktif güçleri varsa (örn. Flametongue), Parent ve '↳' Child satırları otomatik oluşturulur.\n" +
    "7. Tek Tıkla Ekleme: '📥 Master_DB'ye Ekle' butonuna basıldığında satırlar Master_DB'nin en altına tüm formatıyla anında eklenir.";

  sheet.getRange("A24:H28").merge().setBackground("#f0fdf4").setFontColor("#166534")
    .setFontSize(9).setVerticalAlignment("top").setValue(guideText);

  // Border styling
  sheet.getRange("A5:H8").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A11:H21").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("A23:H28").setBorder(true, true, true, true, true, true, "#86efac", SpreadsheetApp.BorderStyle.SOLID);

  SpreadsheetApp.getActiveSpreadsheet().toast("Rule_Library sayfası başarıyla oluşturuldu!", "📚 Tamamlandı", 5);
}

// ----------------------------------------------------
// 2. USER-ISOLATED API KEY SECURITY ENGINE
// ----------------------------------------------------
function getMyGeminiApiKey() {
  // 1. Check User Cache (fastest session memory)
  var userCache = CacheService.getUserCache();
  var cachedKey = userCache.get("GEMINI_API_KEY");
  if (cachedKey) return cachedKey;

  // 2. Check User Properties (isolated per Google account)
  var userProps = PropertiesService.getUserProperties();
  var propKey = userProps.getProperty("GEMINI_API_KEY");
  if (propKey) {
    userCache.put("GEMINI_API_KEY", propKey, 21600); // 6 hours cache
    return propKey;
  }

  return "";
}

function setMyGeminiApiKey(key) {
  var cleanKey = String(key || "").trim();
  if (!cleanKey) {
    clearMyGeminiApiKey();
    return false;
  }
  PropertiesService.getUserProperties().setProperty("GEMINI_API_KEY", cleanKey);
  CacheService.getUserCache().put("GEMINI_API_KEY", cleanKey, 21600);
  if (typeof updateGuideChecklist === "function") updateGuideChecklist();
  return true;
}

function clearMyGeminiApiKey() {
  PropertiesService.getUserProperties().deleteProperty("GEMINI_API_KEY");
  CacheService.getUserCache().remove("GEMINI_API_KEY");
  if (typeof updateGuideChecklist === "function") updateGuideChecklist();
  SpreadsheetApp.getActiveSpreadsheet().toast("Kişisel API anahtarınız oturumunuzdan silindi.", "🗑️ Temizlendi", 4);
}

function clearResetAllApiKeyAndPermissions() {
  var ui = SpreadsheetApp.getUi();
  
  // 1. Wipe UserProperties and UserCache
  PropertiesService.getUserProperties().deleteProperty("GEMINI_API_KEY");
  PropertiesService.getUserProperties().deleteProperty("AI_NETWORK_AUTHORIZED");
  CacheService.getUserCache().remove("GEMINI_API_KEY");
  
  // 2. Uncheck checklist marks in Master_DB_Guide
  if (typeof updateGuideChecklist === "function") updateGuideChecklist();
  
  var msg = 
    "✅ Kişisel API Anahtarınız ve Yerel İzin Durumunuz Sıfırlandı!\n\n" +
    "• Kişisel Gemini API anahtarınız oturumunuzdan silindi.\n" +
    "• Master_DB_Guide kontrol listesindeki onay tikleri kaldırıldı.\n\n" +
    "📌 Google OAuth İznini Tamamen Kaldırmak İçin:\n" +
    "Google Hesabınız düzeyindeki genel OAuth iznini de tamamen kaldırmak isterseniz:\n" +
    "👉 https://myaccount.google.com/connections\n" +
    "adresine giderek 'Kaydedilen Makrolar' izinlerini silebilirsiniz.";

  ui.alert("🗑️ Sıfırlama Tamamlandı", msg, ui.ButtonSet.OK);
  SpreadsheetApp.getActiveSpreadsheet().toast("API Anahtarı ve izin durumları sıfırlandı, tikler kaldırıldı.", "🗑️ Sıfırlandı", 5);
}

function testOrAuthorizeExternalAccess() {
  // Direct call without try-catch so Google's runtime prompts for OAuth permission dialog!
  UrlFetchApp.fetch("https://generativelanguage.googleapis.com", { muteHttpExceptions: true });
  PropertiesService.getUserProperties().setProperty("AI_NETWORK_AUTHORIZED", "TRUE");
  if (typeof updateGuideChecklist === "function") updateGuideChecklist();
  var ui = SpreadsheetApp.getUi();
  ui.alert("✅ İnternet / AI İzni Aktif", "Google Apps Script dış web bağlantısı (UrlFetchApp) başarıyla yetkilendirildi!\nMaster_DB_Guide sayfasındaki 1. onay kutusu otomatik olarak işaretlendi.", ui.ButtonSet.OK);
}

function promptSetMyGeminiApiKey() {
  UrlFetchApp.fetch("https://generativelanguage.googleapis.com", { muteHttpExceptions: true });

  var ui = SpreadsheetApp.getUi();
  var currentKey = getMyGeminiApiKey();
  var masked = currentKey ? currentKey.substring(0, 6) + "..." + currentKey.substring(Math.max(0, currentKey.length - 4)) : "Tanımlı Değil";

  var response = ui.prompt(
    "🔑 Kişisel Gemini API Anahtarınızı Girin",
    "Mevcut Durum: " + masked + "\n\n" +
    "Ücretsiz Google AI Studio API anahtarınızı yapıştırın:\n" +
    "(Bu anahtar sadece sizin hesabınızda geçerlidir; diğer oyuncular göremez ve kullanamaz)\n" +
    "Anahtar almak için: https://aistudio.google.com/app/apikey",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    var inputKey = response.getResponseText().trim();
    if (inputKey) {
      setMyGeminiApiKey(inputKey);
      if (typeof updateGuideChecklist === "function") updateGuideChecklist();
      ui.alert("✅ Başarılı", "Gemini API anahtarınız kişisel oturumunuza güvenle kaydedildi!\nMaster_DB_Guide sayfasındaki 2. onay kutusu otomatik olarak işaretlendi.", ui.ButtonSet.OK);
    } else {
      ui.alert("⚠️ Uyarı", "Boş anahtar girildi, değişiklik yapılmadı.", ui.ButtonSet.OK);
    }
  }
}

function diagnoseGeminiApiKey() {
  var ui = SpreadsheetApp.getUi();
  var apiKey = getMyGeminiApiKey();
  if (!apiKey) {
    ui.alert("⚠️ API Anahtarı Bulunamadı", "Lütfen önce '🔑 Set My Gemini API Key' menüsünden anahtarınızı kaydedin.", ui.ButtonSet.OK);
    return;
  }

  // 1. Fetch live models from Google AI Studio
  var listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + encodeURIComponent(apiKey);
  var availableModels = [];
  var listStatus = 0;
  var listError = "";
  try {
    var resp = UrlFetchApp.fetch(listUrl, { muteHttpExceptions: true });
    listStatus = resp.getResponseCode();
    var listBody = resp.getContentText();
    if (listStatus === 200) {
      var data = JSON.parse(listBody);
      // Universal Future-Proof Filter:
      // - Must support generateContent
      // - Exclude non-text/specialized: tts, image, audio, embedding, aqa, imagen
      // - Exclude heavy/overloaded models: NO Pro models, NO Gemma
      var raw = (data.models || [])
        .filter(function(m) {
          if (!m.supportedGenerationMethods || m.supportedGenerationMethods.indexOf("generateContent") === -1) return false;
          var n = m.name.toLowerCase();
          if (n.indexOf("-tts") !== -1 || n.indexOf("-image") !== -1 || n.indexOf("-audio") !== -1 || n.indexOf("embedding") !== -1 || n.indexOf("aqa") !== -1) return false;
          if (n.indexOf("pro") !== -1 || n.indexOf("gemma") !== -1) return false;
          if (n.indexOf("flash") === -1) return false;
          return true;
        })
        .map(function(m) {
          return m.name.replace(/^models\//, "");
        });

      // Priority ranking:
      // 1. Lite Flash models first (least busy, zero-lag, instant response)
      // 2. Standard Flash models
      var liteModels = [];
      var regularFlash = [];

      for (var i = 0; i < raw.length; i++) {
        var name = raw[i];
        if (name.indexOf("flash-lite") !== -1) {
          if (name.indexOf("latest") !== -1) {
            liteModels.unshift(name); // highest priority
          } else {
            liteModels.push(name);
          }
        } else if (name.indexOf("flash") !== -1) {
          regularFlash.push(name);
        }
      }

      availableModels = liteModels.concat(regularFlash);

    } else {
      var errObj = {};
      try { errObj = JSON.parse(listBody); } catch(e){}
      listError = (errObj.error && errObj.error.message) ? errObj.error.message : ("HTTP " + listStatus);
    }
  } catch (e) {
    listError = e.message;
  }

  if (availableModels.length === 0) {
    ui.alert("⚠️ Model Bulunamadı", "Google API'den geçerli model listesi alınamadı:\n" + listError, ui.ButtonSet.OK);
    return;
  }

  // 2. Auto-Update Rule_Library C3 dropdown with live available models!
  var updatedRuleLib = false;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ruleLib = ss.getSheetByName("Rule_Library");
    if (ruleLib) {
      var dropdownList = ["AUTO (Otomatik En Hızlı Model)"].concat(availableModels);
      var modelRule = SpreadsheetApp.newDataValidation().requireValueInList(dropdownList, false).build();
      ruleLib.getRange("C3:D3").setDataValidation(modelRule);
      
      var currentVal = String(ruleLib.getRange("C3").getValue() || "").trim();
      if (!currentVal || dropdownList.indexOf(currentVal) === -1) {
        ruleLib.getRange("C3:D3").setValue("AUTO (Otomatik En Hızlı Model)");
      }
      updatedRuleLib = true;
    }
  } catch (eLib) {}

  // 3. Test ping on the top model (gemini-flash-lite-latest or top available)
  var testModel = availableModels[0] || "gemini-flash-lite-latest";
  var testUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + testModel + ":generateContent?key=" + encodeURIComponent(apiKey);
  var testPayload = {
    contents: [{ parts: [{ text: "ping" }] }]
  };
  var testMsg = "";
  var startTime = new Date().getTime();
  try {
    var testResp = UrlFetchApp.fetch(testUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(testPayload),
      muteHttpExceptions: true
    });
    var elapsed = new Date().getTime() - startTime;
    var testStatus = testResp.getResponseCode();
    var testBody = testResp.getContentText();
    if (testStatus === 200) {
      var tData = JSON.parse(testBody);
      var reply = tData.candidates[0].content.parts[0].text;
      var ver = tData.modelVersion || testModel;
      testMsg = "✅ BAŞARILI! (" + elapsed + " ms)\nModel Sürümü: " + ver + "\nTest Yanıtı: \"" + reply.trim() + "\"";
    } else {
      var tErrObj = {};
      try { tErrObj = JSON.parse(testBody); } catch(e){}
      testMsg = "❌ HTTP " + testStatus + ": " + ((tErrObj.error && tErrObj.error.message) ? tErrObj.error.message : testBody);
    }
  } catch (e2) {
    testMsg = "❌ Ağ Hatası: " + e2.message;
  }

  var report = 
    "=== 🩺 GEMINI API VE MODEL TANI RAPORU ===\n\n" +
    "🔑 API Anahtarınız: " + apiKey.substring(0, 6) + "..." + apiKey.substring(Math.max(0, apiKey.length - 4)) + " (Doğrulandı ✅)\n\n" +
    "⚡ En Hızlı Model Testi ('" + testModel + "'):\n" + testMsg + "\n\n" +
    "📋 Hesabınızda Tespit Edilen Kullanılabilir Modeller (Öncelik Sırasıyla):\n" +
    availableModels.map(function(m, idx) { return (idx + 1) + ". " + m; }).join("\n") + "\n\n" +
    (updatedRuleLib ? "✨ Rule_Library C3 açılır menüsü bu güncel modellerle OTOMATİK güncellendi!" : "");

  ui.alert("🩺 Tanı ve Otomatik Senkronizasyon Tamamlandı", report, ui.ButtonSet.OK);
}

function getApiKeyStatusForSidebar() {
  var key = getMyGeminiApiKey();
  if (!key) {
    return { hasKey: false, maskedKey: "" };
  }
  var masked = key.substring(0, 6) + "..." + key.substring(Math.max(0, key.length - 4));
  return { hasKey: true, maskedKey: masked };
}

// ----------------------------------------------------
// 3. AI RULE IMPORTER SIDEBAR
// ----------------------------------------------------
function showAiRuleImporterSidebar() {
  var html = HtmlService.createHtmlOutput(getAiRuleImporterSidebarHtml())
      .setTitle('🤖 D&D 3.5e AI Rule Importer')
      .setWidth(360);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getAiRuleImporterSidebarHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 12px; font-size: 13px; }
    h3 { margin: 0 0 6px 0; color: #38bdf8; font-size: 15px; display: flex; align-items: center; gap: 6px; }
    .sub { font-size: 11px; color: #94a3b8; margin-bottom: 12px; }
    
    .status-card { border-radius: 6px; padding: 8px 10px; margin-bottom: 12px; font-size: 11px; line-height: 1.4; }
    .status-active { background: #064e3b; border: 1px solid #059669; color: #a7f3d0; }
    .status-missing { background: #450a0a; border: 1px solid #dc2626; color: #fecaca; }
    
    .input-group { margin-bottom: 10px; }
    label { display: block; font-size: 11px; font-weight: bold; color: #cbd5e1; margin-bottom: 4px; }
    input[type="text"], input[type="password"], select { width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #475569; border-radius: 4px; color: #ffffff; padding: 7px 8px; font-size: 12px; outline: none; transition: 0.15s; }
    input[type="text"]:focus, select:focus { border-color: #38bdf8; box-shadow: 0 0 0 1px #38bdf8; }
    
    .btn { display: block; width: 100%; box-sizing: border-box; background: #2563eb; color: #ffffff; border: none; border-radius: 4px; padding: 8px 10px; font-weight: bold; font-size: 12px; cursor: pointer; text-align: center; transition: 0.15s; }
    .btn:hover { background: #1d4ed8; }
    .btn:disabled { background: #334155; color: #64748b; cursor: not-allowed; }
    .btn-success { background: #16a34a; }
    .btn-success:hover { background: #15803d; }
    .btn-outline { background: transparent; border: 1px solid #64748b; color: #cbd5e1; padding: 4px 6px; font-size: 10px; border-radius: 3px; cursor: pointer; width: auto; display: inline-block; }
    .btn-outline:hover { background: #1e293b; border-color: #94a3b8; }
    
    .source-pills { display: flex; gap: 4px; margin-bottom: 12px; font-size: 10px; }
    .pill { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2px 7px; color: #94a3b8; }
    .pill.active { border-color: #38bdf8; color: #38bdf8; }
    
    #previewBox { margin-top: 14px; display: none; }
    .card { background: #131c2e; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px; margin-bottom: 8px; position: relative; }
    .card.child { border-left: 3px solid #c084fc; background: #1a1528; }
    .card-title { font-weight: bold; font-size: 13px; color: #f8fafc; margin-bottom: 3px; display: flex; justify-content: space-between; }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: #1e3a5f; color: #38bdf8; }
    .badge-child { background: #581c87; color: #e9d5ff; }
    .card-meta { font-size: 11px; color: #94a3b8; margin-bottom: 6px; }
    .card-desc { font-size: 11px; color: #cbd5e1; line-height: 1.35; background: #0f141f; padding: 6px; border-radius: 4px; margin-bottom: 6px; }
    .stat-row { display: flex; gap: 6px; flex-wrap: wrap; font-size: 10px; color: #a5f3fc; }
    .stat-tag { background: #083344; padding: 2px 5px; border-radius: 3px; border: 1px solid #155e75; }
    
    .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 6px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h3>🤖 AI Rule Importer</h3>
  <div class="sub">Kademeli D&D 3.5e Kaynak Tarayıcı ➔ Master_DB</div>

  <!-- API Key Status Widget -->
  <div id="apiKeyWidget" class="status-card status-missing">
    <div id="missingKeyBox">
      🔒 <strong>API Anahtarı Tanımlı Değil</strong><br>
      <div style="margin: 6px 0 4px 0;">Bu özellik kişiye özeldir. Ücretsiz Google AI Studio anahtarınızı girin:</div>
      <input type="password" id="inlineApiKey" placeholder="AIzaSy..." style="margin-bottom: 6px;" />
      <div style="display: flex; gap: 6px; align-items: center;">
        <button class="btn btn-outline" onclick="saveApiKeyFromSidebar()">💾 Kaydet</button>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" style="font-size: 10px;">🔗 Ücretsiz Al</a>
      </div>
    </div>
    <div id="activeKeyBox" style="display: none;">
      🟢 <strong>API Anahtarı Aktif:</strong> <span id="maskedKeyVal" style="font-family: monospace;"></span>
      <div style="margin-top: 4px;">
        <button class="btn-outline" onclick="clearApiKeyFromSidebar()">🗑️ Sıfırla / Sil</button>
      </div>
    </div>
  </div>

  <!-- Source Cascade Indicator -->
  <div class="source-pills">
    <span class="pill active" title="1. Öncelik: d20srd.org / dndsrd.net">1. Core SRD</span>
    <span class="pill active" title="2. Öncelik: Foundry VTT D35E JSON">2. Foundry JSON</span>
    <span class="pill active" title="3. Öncelik: srd.dndtools.org">3. Splatbooks</span>
  </div>

  <!-- Search Inputs -->
  <div class="input-group">
    <label for="queryInput">Hüner, Eşya veya Büyü Adı:</label>
    <input type="text" id="queryInput" placeholder="Örn: Boots of Speed, Flametongue, Shock Trooper..." onkeypress="handleKeyPress(event)" />
  </div>

  <div class="input-group">
    <label for="categorySelect">Kategori Filtresi (Opsiyonel):</label>
    <select id="categorySelect">
      <option value="Auto">✨ Otomatik Tespit (Tavsiye Edilen)</option>
      <option value="Feat">Feat (Hüner)</option>
      <option value="Weapon">Weapon (Silah)</option>
      <option value="Armor / Shield">Armor / Shield (Zırh / Kalkan)</option>
      <option value="Ring">Ring (Yüzük)</option>
      <option value="Wondrous Item">Wondrous Item (Büyülü Eşya)</option>
      <option value="Slotless Item">Slotless Item (Yuvasız Eşya)</option>
      <option value="Spell">Spell (Büyü)</option>
      <option value="Special Ability">Special Ability (Özel Yetenek)</option>
    </select>
  </div>

  <button id="btnFetch" class="btn" onclick="fetchRuleData()">
    🔍 Kuralı Kaynaklardan Getir (AI)
  </button>

  <!-- Preview & Append Section -->
  <div id="previewBox">
    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin: 12px 0 6px 0;">ÖNİZLEME & AYRIŞTIRILAN VERİ:</div>
    <div id="cardsContainer"></div>
    <button id="btnAppend" class="btn btn-success" onclick="appendRowsToMasterDb()" style="margin-top: 8px;">
      📥 Master_DB'ye Ekle (Otomatik Format)
    </button>
  </div>

  <script>
    var currentParsedRows = [];

    window.onload = function() {
      checkKeyStatus();
    };

    function checkKeyStatus() {
      google.script.run.withSuccessHandler(function(res) {
        if (res.hasKey) {
          document.getElementById('apiKeyWidget').className = 'status-card status-active';
          document.getElementById('missingKeyBox').style.display = 'none';
          document.getElementById('activeKeyBox').style.display = 'block';
          document.getElementById('maskedKeyVal').innerText = res.maskedKey;
          document.getElementById('btnFetch').disabled = false;
        } else {
          document.getElementById('apiKeyWidget').className = 'status-card status-missing';
          document.getElementById('missingKeyBox').style.display = 'block';
          document.getElementById('activeKeyBox').style.display = 'none';
          document.getElementById('btnFetch').disabled = true;
        }
      }).getApiKeyStatusForSidebar();
    }

    function saveApiKeyFromSidebar() {
      var key = document.getElementById('inlineApiKey').value.trim();
      if (!key) {
        alert('Lütfen geçerli bir API anahtarı yapıştırın.');
        return;
      }
      google.script.run.withSuccessHandler(function(success) {
        if (success) {
          document.getElementById('inlineApiKey').value = '';
          checkKeyStatus();
        }
      }).setMyGeminiApiKey(key);
    }

    function clearApiKeyFromSidebar() {
      if (confirm('API anahtarınızı silmek istediğinize emin misiniz?')) {
        google.script.run.withSuccessHandler(function() {
          checkKeyStatus();
        }).clearMyGeminiApiKey();
      }
    }

    function handleKeyPress(e) {
      if (e.key === 'Enter') {
        fetchRuleData();
      }
    }

    function fetchRuleData() {
      var query = document.getElementById('queryInput').value.trim();
      if (!query) {
        alert('Lütfen bir eşya, feat veya büyü adı yazın.');
        return;
      }
      var cat = document.getElementById('categorySelect').value;

      var btn = document.getElementById('btnFetch');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Kaynaklar taranıyor...';
      document.getElementById('previewBox').style.display = 'none';

      google.script.run.withSuccessHandler(function(response) {
        btn.disabled = false;
        btn.innerHTML = '🔍 Kuralı Kaynaklardan Getir (AI)';

        if (!response.success) {
          alert('Hata: ' + response.error);
          return;
        }

        currentParsedRows = response.rows;
        renderPreviewCards(currentParsedRows);
      }).withFailureHandler(function(err) {
        btn.disabled = false;
        btn.innerHTML = '🔍 Kuralı Kaynaklardan Getir (AI)';
        alert('Bağlantı Hatası: ' + err.message);
      }).queryGeminiForMasterDb(query, cat);
    }

    function renderPreviewCards(rows) {
      var container = document.getElementById('cardsContainer');
      container.innerHTML = '';

      if (!rows || rows.length === 0) {
        container.innerHTML = '<div style="color: #f87171;">Uygun kural kaydı bulunamadı.</div>';
        return;
      }

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var name = r[0] || 'İsimsiz';
        var cat = r[1] || '-';
        var slot = r[2] || '-';
        var parent = r[3] || '-';
        var source = r[4] || '-';
        var desc = r[5] || '';
        var bType = r[6] || '';
        var scope = r[7] || '';
        var onHit = r[24] || '';
        var action = r[25] || '';
        var duration = r[26] || '';
        var weight = r[27] ? r[27] + ' lbs' : '';
        var cost = r[28] ? r[28] + ' gp' : '';

        var isChild = (name.indexOf('↳') === 0 || parent !== '-');

        var card = document.createElement('div');
        card.className = 'card' + (isChild ? ' child' : '');

        var badgeClass = isChild ? 'badge badge-child' : 'badge';
        var badgeText = isChild ? '↳ Child (Miras)' : 'Parent (Ana)';

        var statsHtml = '';
        if (bType) statsHtml += '<span class="stat-tag">Bonus: ' + bType + '</span>';
        if (scope && scope !== 'None / General') statsHtml += '<span class="stat-tag">' + scope + '</span>';
        if (onHit) statsHtml += '<span class="stat-tag">⚔️ ' + onHit + '</span>';
        if (action && action !== '-') statsHtml += '<span class="stat-tag">⚡ ' + action + '</span>';
        if (duration && duration !== '-') statsHtml += '<span class="stat-tag">⏳ ' + duration + '</span>';
        if (weight) statsHtml += '<span class="stat-tag">⚖️ ' + weight + '</span>';
        if (cost) statsHtml += '<span class="stat-tag">🪙 ' + cost + '</span>';

        card.innerHTML = 
          '<div class="card-title">' +
            '<span>' + name + '</span>' +
            '<span class="' + badgeClass + '">' + badgeText + '</span>' +
          '</div>' +
          '<div class="card-meta">' + cat + ' • Slot: ' + slot + ' • ' + source + '</div>' +
          '<div class="card-desc">' + desc + '</div>' +
          '<div class="stat-row">' + statsHtml + '</div>';

        container.appendChild(card);
      }

      document.getElementById('previewBox').style.display = 'block';
    }

    function appendRowsToMasterDb() {
      if (!currentParsedRows || currentParsedRows.length === 0) return;
      var btn = document.getElementById('btnAppend');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Master_DB\\'ye ekleniyor...';

      google.script.run.withSuccessHandler(function(res) {
        btn.disabled = false;
        btn.innerHTML = '📥 Master_DB\\'ye Ekle (Otomatik Format)';
        if (res.success) {
          alert('✅ ' + res.count + ' satır başarıyla Master_DB\\'ye eklendi!');
          document.getElementById('previewBox').style.display = 'none';
          document.getElementById('queryInput').value = '';
        } else {
          alert('Hata: ' + res.error);
        }
      }).withFailureHandler(function(err) {
        btn.disabled = false;
        btn.innerHTML = '📥 Master_DB\\'ye Ekle (Otomatik Format)';
        alert('Hata: ' + err.message);
      }).appendMasterDbRows(currentParsedRows);
    }
  </script>
</body>
</html>`;
}

// ----------------------------------------------------
// 4. GEMINI API CASCADE SEARCH ENGINE
// ----------------------------------------------------
function getBestGeminiModelEndpoint(apiKey) {
  // 1. Check if user specified a manual model in Rule_Library sheet (Cell C3)
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ruleLib = ss.getSheetByName("Rule_Library");
    if (ruleLib) {
      var manualModel = String(ruleLib.getRange("C3").getValue() || "").trim();
      if (manualModel && manualModel.toUpperCase().indexOf("AUTO") === -1) {
        var cleanManual = manualModel.replace(/^models\//, "");
        // If user accidentally selected deprecated legacy models (2.0 or 1.5), auto-upgrade to 3.8
        if (cleanManual.indexOf("gemini-2.0") !== -1 || cleanManual.indexOf("gemini-1.5") !== -1) {
          return "gemini-3.8-flash";
        }
        return cleanManual;
      }
    }
  } catch (e) {}

  var candidateModels = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
    "gemini-flash-latest"
  ];

  try {
    var listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + encodeURIComponent(apiKey);
    var listResp = UrlFetchApp.fetch(listUrl, { muteHttpExceptions: true });
    if (listResp.getResponseCode() === 200) {
      var listData = JSON.parse(listResp.getContentText());
      var available = (listData.models || [])
        .filter(function(m) {
          return m.supportedGenerationMethods && m.supportedGenerationMethods.indexOf("generateContent") !== -1;
        })
        .map(function(m) {
          return m.name.replace(/^models\//, "");
        });

      for (var i = 0; i < candidateModels.length; i++) {
        if (available.indexOf(candidateModels[i]) !== -1) {
          return candidateModels[i];
        }
      }
      // If none of candidateModels match, prefer any model with "flash"
      for (var f = 0; f < available.length; f++) {
        if (available[f].indexOf("flash") !== -1) {
          return available[f];
        }
      }
      if (available.length > 0) {
        return available[0];
      }
    }
  } catch (e) {}

  return "gemini-flash-lite-latest";
}

function queryGeminiForMasterDb(query, categoryHint) {
  var apiKey = getMyGeminiApiKey();
  if (!apiKey) {
    return { success: false, error: "API anahtarı bulunamadı. Lütfen önce geçerli bir Gemini API anahtarı tanımlayın." };
  }

  var promptText = 
    "You are a master D&D 3.5e Rule Arbiter and Database Architect.\n" +
    "User query: '" + query + "' (Category Hint: '" + categoryHint + "').\n\n" +
    "PRIORITIZED KNOWLEDGE BASES (Cascading Search Order):\n" +
    "1. Priority 1 (Core SRD): https://www.d20srd.org & http://dndsrd.net (PHB, DMG, MM Core 3.5e rules)\n" +
    "2. Priority 2 (Foundry JSON): https://github.com/Rughalt/D35E/tree/master/packs (D&D 3.5e structured JSON packs)\n" +
    "3. Priority 3 (Extended Splatbooks): https://srd.dndtools.org (Complete series, MIC, Spell Compendium, Frostburn, etc.)\n\n" +
    "TASK:\n" +
    "Resolve the target D&D 3.5e game element into an array of rows adhering strictly to the Master_DB 29-column schema.\n" +
    "If the item has multiple distinct powers (e.g. passive weapon/item stats + on-hit damage + 1/day active spell power), produce 1 Parent row and 1 or more Child rows starting with '↳ ' and setting Col 4 (Parent Entry) to the exact parent entry name.\n\n" +
    "MASTER_DB 29-COLUMN SCHEMA (Every row MUST contain exactly 29 elements):\n" +
    "0: Entry Name (string, child begins with '↳ ')\n" +
    "1: Category ('Feat', 'Weapon', 'Armor / Shield', 'Ring', 'Wondrous Item', 'Slotless Item', 'Spell', 'Special Ability', 'Active Power', 'DM Grant', 'Flaw')\n" +
    "2: Slot ('Armor', 'Shield', 'Main Hand', 'Off Hand', 'Both Hands', 'Head', 'Eyes', 'Neck', 'Torso', 'Body', 'Waist', 'Shoulders', 'Arms', 'Hands', 'Ring', 'Feet', 'Slotless', 'None')\n" +
    "3: Parent Entry (string; '-' if none, or exact parent name if child)\n" +
    "4: Source (e.g. 'PHB p.98', 'MIC p.128', 'DMG p.224')\n" +
    "5: Description / Rules Mechanics (string, concise mechanics)\n" +
    "6: Bonus Type ('Alchemical', 'Armor', 'Circumstance', 'Competence', 'Deflection', 'Dodge', 'Enhancement', 'Inherent', 'Insight', 'Luck', 'Morale', 'Natural Armor', 'Resistance', 'Sacred', 'Shield', 'Size', 'Untyped', 'Spell-Like')\n" +
    "7: Applies To / Scope ('All Attacks', 'Melee Only', 'Ranged Only', 'Thrown Only', 'Slashing', 'Piercing', 'Bludgeoning', 'Spells', 'None / General')\n" +
    "8: Str (number or '')\n" +
    "9: Dex (number or '')\n" +
    "10: Con (number or '')\n" +
    "11: Int (number or '')\n" +
    "12: Wis (number or '')\n" +
    "13: Cha (number or '')\n" +
    "14: AC (number or '')\n" +
    "15: HP (number or '')\n" +
    "16: Att (number or '')\n" +
    "17: Dmg (number or '')\n" +
    "18: Fort (number or '')\n" +
    "19: Ref (number or '')\n" +
    "20: Will (number or '')\n" +
    "21: Skill (number or '')\n" +
    "22: Init (number or '')\n" +
    "23: Speed (number or '')\n" +
    "24: On-Hit Dmg / Dice Expression (string, e.g. '+1d6 Fire', '3d8 Acid', or '')\n" +
    "25: Action ('-', 'Passive', 'Free Action', 'Swift Action', 'Immediate Action', 'Move Action', 'Standard Action', 'Full-Round Action')\n" +
    "26: Duration / Uses (string, e.g. 'Passive', '1 round/lvl', '1 min/lvl', '1/day', 'At Will')\n" +
    "27: Weight (lbs) (number or '')\n" +
    "28: Cost (gp) (number or '')\n\n" +
    "OUTPUT REQUIREMENT:\n" +
    "Return JSON format matching this schema: { \"rows\": [ [col0, col1, ... col28], ... ] }";

  var payload = {
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.1
    }
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var chosenModel = getBestGeminiModelEndpoint(apiKey);
  var fallbackQueue = [chosenModel, "gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-lite-latest", "gemini-flash-latest"];
  var queue = [];
  for (var q = 0; q < fallbackQueue.length; q++) {
    if (fallbackQueue[q] && queue.indexOf(fallbackQueue[q]) === -1) {
      queue.push(fallbackQueue[q]);
    }
  }

  var successBody = null;
  var errorHistory = [];

  for (var m = 0; m < queue.length; m++) {
    var curModel = queue[m];
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + curModel + ":generateContent?key=" + encodeURIComponent(apiKey);
    try {
      var response = UrlFetchApp.fetch(url, options);
      var statusCode = response.getResponseCode();
      var responseBody = response.getContentText();

      if (statusCode === 200) {
        successBody = responseBody;
        break;
      } else {
        var errObj = {};
        try { errObj = JSON.parse(responseBody); } catch(e){}
        var errMsg = (errObj.error && errObj.error.message) ? errObj.error.message : ("HTTP " + statusCode);
        errorHistory.push(curModel + " ➔ " + errMsg);
      }
    } catch (netErr) {
      errorHistory.push(curModel + " ➔ " + netErr.message);
    }
  }

  if (!successBody) {
    return { success: false, error: "Modellere ulaşılamadı:\n" + errorHistory.join("\n") };
  }

  try {
    var resultJson = JSON.parse(successBody);
    var candidateText = resultJson.candidates[0].content.parts[0].text;
    candidateText = String(candidateText || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    var parsedData = JSON.parse(candidateText);

    var rows = parsedData.rows || parsedData;
    if (!Array.isArray(rows)) {
      return { success: false, error: "Model geçerli satır dizisi üretemedi." };
    }

    // Defensive padding to exactly 29 columns
    for (var i = 0; i < rows.length; i++) {
      while (rows[i].length < 29) {
        rows[i].push("");
      }
      if (rows[i].length > 29) {
        rows[i] = rows[i].slice(0, 29);
      }
    }

    return { success: true, rows: rows };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// 5. MASTER_DB APPEND ENGINE
// ----------------------------------------------------
function appendMasterDbRows(rows) {
  if (!rows || rows.length === 0) {
    return { success: false, error: "Eklenecek satır yok." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Master_DB");
  if (!sheet) {
    return { success: false, error: "Master_DB sayfası bulunamadı. Lütfen önce tabloyu oluşturun." };
  }

  // Find next empty row in Master_DB (checking Column A starting at row 6)
  var colAValues = sheet.getRange("A6:A" + Math.max(sheet.getMaxRows(), 300)).getValues();
  var targetRow = 6;
  for (var r = 0; r < colAValues.length; r++) {
    if (colAValues[r][0] !== "" && colAValues[r][0] !== null) {
      targetRow = 6 + r + 1;
    }
  }

  // Ensure sheet has enough rows
  var neededRows = targetRow + rows.length;
  if (sheet.getMaxRows() < neededRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), neededRows - sheet.getMaxRows() + 20);
  }

  var range = sheet.getRange(targetRow, 1, rows.length, 29);
  range.setValues(rows);

  // Apply visual styling and Parent-Child hierarchy formatting
  for (var i = 0; i < rows.length; i++) {
    var currentRow = targetRow + i;
    var entryName = String(rows[i][0] || "");
    var parentEntry = String(rows[i][3] || "");
    var isChild = (entryName.indexOf("↳") === 0 || (parentEntry !== "-" && parentEntry !== ""));

    var rowRange = sheet.getRange(currentRow, 1, 1, 29);
    sheet.setRowHeight(currentRow, 26);

    if (isChild) {
      // Child styling: Lavender row background, italic name, purple parent pill
      rowRange.setBackground("#faf5ff");
      sheet.getRange(currentRow, 1).setFontStyle("italic").setFontColor("#6b21a8").setFontWeight("bold");
      sheet.getRange(currentRow, 4).setBackground("#ede9fe").setFontColor("#5b21b6").setFontWeight("bold");
    } else {
      // Parent styling: Sky blue row background, bold navy name
      rowRange.setBackground("#f0f9ff");
      sheet.getRange(currentRow, 1).setFontStyle("normal").setFontColor("#0369a1").setFontWeight("bold");
      sheet.getRange(currentRow, 4).setFontStyle("normal").setFontColor("#334155").setFontWeight("normal");
    }

    // Number alignments
    sheet.getRange(currentRow, 9, 1, 16).setHorizontalAlignment("center"); // Stats through Speed
    sheet.getRange(currentRow, 2, 1, 3).setHorizontalAlignment("center");  // Category, Slot, Parent
    sheet.getRange(currentRow, 7, 1, 2).setHorizontalAlignment("center");  // Bonus Type, Scope
    sheet.getRange(currentRow, 26, 1, 4).setHorizontalAlignment("center"); // Action, Duration, Weight, Cost
  }

  // Set borders
  range.setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  ss.toast(rows.length + " kural kaydı başarıyla Master_DB'ye eklendi!", "✅ Tamamlandı", 5);
  return { success: true, count: rows.length };
}
