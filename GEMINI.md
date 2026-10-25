# Joyful-Fermi Project Guidelines & Rules

## 1. Token Optimization & Subagent Model Delegation
To maximize token efficiency and minimize API costs across all conversations in this workspace:
- **Simple & Routine Tasks (`flash_lite`)**:
  - Always delegate simple, data-heavy, or repetitive tasks to `flash_lite` subagents (using `invoke_subagent` with `Model: "flash_lite"`).
  - Scope for `flash_lite`:
    - Converting spells, feats, skills, and item descriptions into target JSON schemas (`master_db.json`, `character_data.json`).
    - Bulk data formatting, table parsing, and JSON structural validation.
    - Simple syntax checks, static regex/string transformations, and localized documentation updates.
    - Quick reference extraction from d20 3.5e SRD.
- **Main Agent Scope**:
  - Architecture and core engine calculations (`rule_master.js`, `rule_engine.js`, BAB, Save, Caster Level, DM Boons).
  - UI/UX implementation and DOM state management in `index.html`.
  - Integration, review of subagent outputs, and project orchestration.

## 2. D&D 3.5e SRD Knowledge Retrieval
- Do **NOT** scrape or fetch full HTML pages from `d20srd.org` via network/browsing tools unless specifically requested by the user.
- D&D 3.5e SRD rules, spell descriptions, class tables, and formulas are fully present in parametric memory. Query and extract directly from parametric memory to achieve near-zero token consumption.
- Prioritize deterministic local JSON lookups (`master_db.json`, `bundled_data.js`) first before generating or querying.

## 3. Zar Sembolü ve İkon Kullanım Kuralı (STRICT: NO 🎲 EMOJI)
- Projenin **hiçbir yerinde** (kod, UI butonları, loglar, toast bildirimleri, tablolar, dokümantasyon, açıklama metinleri dahil) standart 6 yüzlü tavla zarı emojisi olan **`🎲` (U+1F3B2 / `\uD83C\uDFB2`) KESİNLİKLE KULLANILMAYACAKTIR**.
- Bunun yerine:
  - **Masaüstü RPG Zarları İçin:** Özel çokyüzlü vektör SVG ikonları kullanılmalıdır: `getDiceIconSvg(dieType, classes)` veya `getFormulaDiceIconSvg(formula, classes)` (d20, d12, d10, d8, d6, d4, d100).
  - **Tematik Aksiyon Sembolleri İçin:**
    - Saldırı / Silah / Fiziksel Hasar: `⚔️`
    - Büyü / İlahi / Arcane Etki: `🔮` / `✨`
    - Genel Zar / Anlık Aksiyon / Doğal 20: `⚡`
    - Zar Yuvarlanma Süreci / Bekleme: `'...'` veya `⚡`
    - Kan Fedası: `🩸`
    - Şifa / Can: `💚`
    - Geçici Can: `🛡️`

## 4. Kullanıcı Sorularında Geliştirme Yapmama ve Eleştirel Yaklaşım (STRICT)
- Kullanıcı bir konu hakkında soru sorduğunda, fikir danıştığında veya ("ihtiyaç var mı?", "mantıklı mı?", "sence nasıl olmalı?" gibi) sorgulayıcı yaklaşımlarda bulunduğunda:
  - **Kesinlikle doğrudan kod geliştirmesi / dosya değişikliği YAPILMAYACAKTIR.**
  - Kullanıcı açıkça *"uygula"*, *"kodu değiştir"*, *"geliştir"*, *"ekle/kaldır"* gibi net bir eylem talimatı vermediği sürece sadece analiz ve değerlendirme sunulacaktır.
  - Verilen yanıtlar yüzeysel veya körü körüne onaylayıcı olmamalı; konuya **eleştirel ve sorgulayıcı bir yaklaşımla** (artıları, eksileri, UX/UI ergonomisi, D&D 3.5e RAW kural mekanikleri, performans ve alternatif çözüm yolları ile) derinlemesine bakılarak objektif argümanlarla cevap verilmelidir.

## 5. Dummy Data Yasağı ve Veri Ekleme Standardı (STRICT: NO DUMMY DATA)
- Projenin hiçbir yerinde (UI testleri, prototipler, mock bileşenler veya kod içi sabitler dahil) geçici, uydurma veya doğrulanmamış **DUMMY DATA KESİNLİKLE KULLANILMAYACAKTIR**.
- Sayfa, bileşen veya mekanik testleri için yeni bir veri eklenmesi gerektiğinde **üç aşamalı zorunlu standart akış** izlenecektir:
  1. **Aşama 1 (Rule Master Doğrulaması):** Eklenecek veri (büyü, eşya, manevra, feat vb.) öncelikle D&D 3.5e RAW kural motoru / Rule Master yapısından geçirilerek kurallara uygunluğu ve tam parametreleri doğrulanır.
  2. **Aşama 2 (Master DB Kaydı):** Doğrulanan veri, şemaya uygun şekilde `master_db.json` (ve `bundled_data.js`) veri tabanına resmi ve kalıcı bir kayıt olarak eklenir.
  3. **Aşama 3 (İlgili Alana Entegrasyon):** Yalnızca `master_db.json` içinde doğrulanmış ve kaydedilmiş olan veri, ilgili test alanına, karakter kâğıdına (`character_data.json`), envantere veya arayüz çekmecesine referans verilerek bağlanır.

## 6. HUB Sayfası & Karakter Motoru Çapraz Etkileşim Uyarısı (STRICT)
- HUB sayfası (`hub.html`) veya kampanya yönetim modülleri ile ilgili gelen herhangi bir geliştirme talebinde:
  - Eğer talep edilen değişiklik; ana karakter kağıdını (`index.html` / `character.html`), D&D 3.5e karakter motorunu (`rule_engine.js`, `rule_master.js`), karakter veri şemasını (`character_data.json`, `dnd35_character`), yerel depolama anahtarlarını veya senkronizasyon mekanizmalarını (`gdrive_sync.js`) doğrudan veya dolaylı olarak etkileme/bozma riski taşıyorsa:
  - **Ajan, kod değişikliği yapmadan önce kullanıcıyı açıkça uyarmakla yükümlüdür.**
  - Olası çapraz etkiler (veri kirlenmesi, şema uyumsuzluğu, routing/state çakışması, performans ve izolasyon riskleri) net argümanlarla kullanıcıya sunulmalı ve kullanıcının onayı/yönlendirmesi alınmadan karakter motorunu etkileyecek adımlar atılmamalıdır.

## 7. HUB & Karakter Kâğıdı Paralel Çalışma ve Devir Teslim Standardı (STRICT: HANDOVER PROTOCOL)
- **HUB'ın Merkezi Rolü:** HUB (`hub.html`) yalnızca Bestiary canavarları için değil; DM'in ve oyuncunun tüm karakterlerini (PC & NPC), parti dengesini, encounter/zindan gruplarını ve kampanyalarını yönettiği **ana kontrol merkezidir**.
- **Konuşmalar Arası Güvenli İzolasyon (Separation of Concerns):**
  - HUB geliştirmeleri (`hub.html`, `bundled_monsters.js`) ile Karakter Kâğıdı geliştirmeleri (`index.html`, `character.html`) farklı konuşma sekmelerinde yürütüldüğünde, monolitik dosyalarda kod üzerine yazılma (overwrite / regression) riski oluşmaması için:
    1. **Handover Dokümanı Zorunluluğu:** HUB oturumunda karakter sayfasını ilgilendiren, etkileyen veya veri şemasını değiştiren her geliştirme adımında kök dizindeki `HANDOVER_TO_CHARACTER_SHEET.md` dosyası güncellenecektir.
    2. **Hazır Yönlendirme Promptu:** Ajan, kullanıcıya diğer konuşmaya doğrudan yapıştırabileceği tek parçalık hazır bir yönlendirme promptu sunacaktır.
    3. **Katı Veri Kontratı (Data Contract):** HUB tarafından üretilen `fullData` ile karakter kâğıdı tarafından okunan veri şeması (`isNpc`, `feats`, `specialAbilities`, `spellcasting`, `combatPins`) ortak protokole tam uyumlu olacaktır.
    4. **Parite ve Eşitlik:** Kök dizindeki dosyalar ile `webapp/` altındaki kopyaların %100 birebir aynı olması kuralı tavizsiz korunacaktır.

## 8. Master DB Şema Güncellemeleri ve Rule Master Senkronizasyonu (STRICT)
- `master_db.json` (veya `bundled_data.js`) veri tabanına yeni bir alan, özellik veya mekanik şeması (örneğin `sizeModifier`, `targetFilter`, `scaling`, `ruleFlags`, `combatModifiers` vb.) eklendiğinde veya mevcut bir şema alanı genişletildiğinde:
  - **Rule Master ve Şema Doğrulama Senkronizasyonu Zorunludur:** `rule_master.js` içindeki yapay zeka promptları (`fetchSingleAiRuleObjects`, `queryAiFreeTextRows`), şema normalizasyonu (`normalizeEntry`), form alanları ve veri doğrulama mantığı derhal bu yeni alanı kapsayacak şekilde güncellenmelidir.
  - **Sürekli Uyumluluk:** Gelecekte eklenecek yeni büyü, eşya, feat veya yeteneklerin Rule Master ve AI sorguları tarafından bu yeni alan kurallarına tam uyumlu olarak üretilmesi ve şemaya eksiksiz yazılması garanti altına alınacaktır.

## 9. Obsidian Bilgi Bankası ve "Obsidian'a Aktar" Protokolü (STRICT: OBSIDIAN DEVLOG PROTOCOL)
- **Kasa Konumu (Vault Path):** `D:\Obsidian\dndtools35\` (Docker Obsidian içindeki `/vaults` ile doğrudan eşleniktir).
- **Klasör Mimarisi:**
  - `00-Dashboard.md` (Merkezi Proje Panosu / MOC)
  - `01-Architecture/` (Sistem Mimarisi, Core Engine, HUB, Storage)
  - `02-Data-Contracts/` (master_db, character_data şemaları)
  - `03-Decisions/` (ADR - Mimari Karar Kayıtları)
  - `04-DevLogs/` (Oturum Devir Teslimleri ve Günlükler)
- **Tetikleyici Komut ("obsidian a aktar" / "obsidian devlog"):**
  - Kullanıcı herhangi bir konuşma sekmesinde *"obsidian a aktar"*, *"obsidian devlog"*, *"oturumu obsidian'a işle"* veya benzeri bir talepte bulunduğunda:
  - **Ham Transkript Dökülmeyecektir:** Hata ayıklama, geçici kod blokları ve gürültü ayıklanır.
  - **DevLog Kaydı:** `04-DevLogs/YYYY-MM-DD-[Konu].md` formatında yeni bir oturum kaydı oluşturulur:
    - Oturumun amacı ve bağlamı
    - Alınan mimari kararlar ve çözülen kritik sorunlar
    - İlgili D&D 3.5e RAW kural bağıntıları
    - Sıradaki adımlar ve teknik borçlar
    - Çift yönlü Obsidian wikilink'leri (`[[00-Dashboard]]`, `[[Core Engine (Rule Engine & Rule Master)]]`, `[[master_db Schema]]` vb.)
  - **Şema ve Karar Senkronizasyonu:** Eğer o oturumda kalıcı bir mimari karar (ADR) veya yeni bir veri şeması kuralı getirildiyse, ilgili `01-Architecture/`, `02-Data-Contracts/` veya `03-Decisions/` altındaki ana kartlar da eş zamanlı güncellenir.





