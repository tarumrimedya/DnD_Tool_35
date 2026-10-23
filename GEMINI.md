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


