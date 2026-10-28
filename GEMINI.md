# Joyful-Fermi Project Guidelines & Rules

## 1. Proje Yönetimi, Model Hiyerarşisi ve Token Optimizasyonu (STRICT)
Proje genelinde kaliteyi en üst düzeyde tutarken API/kota verimliliğini sağlamak için şu yönetim hiyerarşisi uygulanır:
- **Proje Yöneticisi ve Baş Mimar (`Gemini 4 Argon`):**
  - Kotası dolana kadar projenin ana yöneticisi **Gemini 4 Argon**'dur.
  - Tüm yapısal, mimari ve kural motoru (`rule_engine.js`, `rule_master.js`, V2 Veri Kontratları) kararları Argon tarafından verilir.
  - Argon; yapılacak işleri **zorluk, karmaşıklık (complexity), risk ve veri hacmi** parametrelerine göre analiz ederek en optimum alt modele veya araca yönlendirir.
- **Çıktıların Denetlenmesi (`Sıfır Token Yerel Script` > `flash_lite`):**
  - Dosya senkronizasyonu (`character.html` & `webapp/`), SHA-256 paritesi, JS/HTML/JSON sözdizimi (syntax) ve yasaklı zar emojisi (`U+1F3B2`) denetimleri için **KESİNLİKLE alt ajan (`invoke_subagent`) çağrılmaz**; doğrudan yerel `tools/verify_and_sync.js` scripti çalıştırılır (**0 Token, ~100ms**).
  - Yalnızca karmaşık şema dönüşümü veya çoklu veri doğrulaması gerektiğinde **3.8 veya altı modeller (`flash_lite`)** kullanılır.
- **Modüler Karakter Kâğıdı ve Bağlam Koruma Disiplini (STRICT):**
  - Karakter kâğıdı (`index.html` = 7.698 satır saf HTML/DOM) ve 5 ayrık JS modülü (`char_hud.js`, `char_combat.js`, `char_spells.js`, `char_progression.js`, `char_inventory.js`) üzerinden çalışılır.
  - Bir görev geldiğinde tüm dosyalar taranmaz; yalnızca ilgili modül (`char_spells.js`, `char_progression.js` vb.) ve nokta atışı satır aralığı (30–60 satır) okunur.
  - Sadece kök dizindeki tek kaynak dosya düzenlenir; kopyaları (`character.html`, `webapp/*`) asla ayrı ayrı okunmaz, `tools/verify_and_sync.js` ile otomatik eşitlenir.
- **Deterministik Yerel Öncelik (Sıfır Token / Zero-Token):**
  - Temel D&D 3.5e SRD verileri (3.500+ büyü, feat, eşya, canavar, sınıf, materyal, geliştirme) AI ile üretilmez; yerel ETL scriptleri ve Modüler SRD Kütüphanesi (`srd_index.json` + `srd_*.json`) üzerinden **sıfır token** tüketimiyle işlenir.
- **Rutin & Veri Odaklı Görevler (`flash_lite`):**
  - Basit, tekrarlayan ve veri ağırlıklı görevler `invoke_subagent` (`Model: "flash_lite"`) ile devredilir:
    - Doğal dille girilen bileşik eşya taleplerinin (*"+2 Keen Mithral Scimitar"*) V2 Lego parçalarına (`baseItemId`, `material`, `enhancementBonus`, `enhancements`) ayrıştırılması.
    - SRD dışı (Splatbook / Homebrew) içeriklerin Kanonik V2 JSON şemasına (`master_db.json`, `character_data.json`) dönüştürülmesi.
    - Toplu veri formatlama, tablo ayrıştırma, JSON yapısal doğrulaması ve локаlize dokümantasyon güncellemeleri.

## 2. D&D 3.5e SRD Bilgi Erişimi
- Kullanıcı açıkça talep etmedikçe `d20srd.org` vb. sitelerden ağ üzerinden tam HTML sayfa kazıması yapılmaz.
- Öncelikle yerel **Modüler SRD Kütüphanesi (`srd_index.json`, `srd_*.json`)** ve kullanıcı genişleme veritabanı (`master_db.json`) sorgulanır.
- Yerel dosyalarda bulunmayan SRD dışı (Splatbook) kurallar için parametrik hafızadaki D&D 3.5e RAW kuralları doğrudan Kanonik V2 şemasına çıkarılır.

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

## 4. Eleştirel Yaklaşım, Kök Neden Analizi ve Geçici Çözüm Yasağı (STRICT)
- **Kök Neden ve Kalıcı Çözüm Zorunluluğu:**
  - Tüm teknik ve tasarım sorunlarına **eleştirel, sorgulayıcı ve yapıcı** yaklaşılacaktır.
  - **Geçici çözümler (workaround / yama / band-aid) kesinlikle kullanılmayacaktır.**
  - Her sorunda önce **kök neden (root cause)** tespit edilecek, bu kök nedenin ileride yol açabileceği zincirleme sorunlar önceden öngörülecek ve mimari açıdan **en iyi, en kalıcı çözüm** sunulacaktır.
- **Sorgulama Aşamasında Kod Değiştirmeme:**
  - Kullanıcı bir konu hakkında soru sorduğunda veya fikir danıştığında (*"ihtiyaç var mı?"*, *"mantıklı mı?"*, *"nasıl olmalı?"* vb.), açıkça *"uygula / geliştir / değiştir"* talimatı vermediği sürece doğrudan kod/dosya değişikliği yapılmaz; artıları, eksileri, UX/UI ergonomisi, D&D 3.5e RAW mekanikleri ve performans boyutlarıyla derinlemesine analiz sunulur.

## 5. Dummy Data Yasağı ve V2 Veri Ekleme Standardı (STRICT: NO DUMMY DATA)
- Projenin hiçbir yerinde geçici, uydurma veya doğrulanmamış **DUMMY DATA KESİNLİKLE KULLANILMAYACAKTIR**.
- Sisteme yeni bir veri eklenirken kaynağın türüne göre şu akış izlenir:
  1. **Resmi SRD Verileri (Modüler Compendium):** Doğrulanmış SRD kaynağından deterministik ETL boru hattı ile Kanonik V2 şemasına (`srd_index.json` + `srd_*.json`) aktarılır.
  2. **Bileşik / Montaj Eşyalar (Lego Assembly):** *"+5 Flaming Adamantine Greatsword"* gibi kombinasyonlar ana katalogda mükerrer kayıt olarak tutulmaz; temel parçalar (`baseItemId`, `material`, `enhancementBonus`, `enhancements`) referans alınarak birleştirilir ve karakter envanterine (`character_data.json`) V2 formatında eklenir.
  3. **SRD Dışı (Splatbook / Homebrew) İçerikler:**
     - **Aşama 1 (Rule Master Doğrulaması):** D&D 3.5e RAW kurallarına ve Kanonik V2 şemasına uygunluğu doğrulanır.
     - **Aşama 2 (Master DB Kaydı):** Yalnızca kullanıcıya/kampanyaya özel genişleme veritabanı olan `master_db.json` içine V2 şemasıyla kaydedilir (çekirdek `srd_*.json` dosyaları kirletilmez).
     - **Aşama 3 (İlgili Alana Entegrasyon):** İlgili karakter kâğıdına (`character_data.json`) değişmez `id` referansıyla bağlanır.

## 6. HUB Sayfası & Karakter Motoru Çapraz Etkileşim Uyarısı (STRICT)
- HUB sayfası (`hub.html`) veya kampanya yönetim modülleri ile ilgili gelen herhangi bir geliştirme talebinde; eğer talep edilen değişiklik ana karakter kağıdını (`index.html` / `character.html`), karakter motorunu (`rule_engine.js`, `rule_master.js`), veri şemasını (`character_data.json`) veya senkronizasyon mekanizmalarını (`gdrive_sync.js`) doğrudan veya dolaylı olarak etkileme riski taşıyorsa:
  - **Ajan, kod değişikliği yapmadan önce kullanıcıyı açıkça uyarmakla yükümlüdür.**
  - Olası çapraz etkiler net argümanlarla sunulmalı ve onay alınmadan karakter motorunu etkileyecek adımlar atılmamalıdır.

## 7. HUB & Karakter Kâğıdı Veri Kontratı ve Parite Standardı (STRICT: ZERO-TOKEN SYNC)
- **HUB'ın Merkezi Rolü:** HUB (`hub.html`) DM'in ve oyuncunun tüm karakterlerini (PC & NPC), Bestiary canavarlarını (`srd_monsters.json`), parti dengesini, encounter gruplarını ve kampanyalarını yönettiği **ana kontrol merkezidir**.
- **Veri Kontratı ve Sıfır-Token Parite Kuralları:**
  1. **Handover Dokümanı Donduruldu (No Handover Overhead):** `HANDOVER_TO_CHARACTER_SHEET.md` dosyası tarihsel arşiv olarak dondurulmuştur. Token israfını önlemek amacıyla görevlerde bu dosya okunmaz, güncellenmez ve yönlendirme promptu üretilmez.
  2. **Katı Veri Kontratı (Data Contract):** HUB tarafından üretilen `fullData` ile karakter kâğıdı tarafından okunan veri şeması ortak Kanonik V2 protokolüne tam uyumlu olmalıdır.
  3. **Otomatik Parite (`tools/verify_and_sync.js`):** Kök dizindeki dosyalar ile `character.html` ve `webapp/` altındaki kopyaların %100 birebir aynı olması kuralı her değişiklik sonunda `tools/verify_and_sync.js` çalıştırılarak **0 token** maliyetiyle korunur.

## 8. Kanonik V2 Şema Güncellemeleri ve Motor Senkronizasyonu (STRICT)
- Veri tabanı şemasında yeni bir yapısal yetenek tanımlandığında:
  - **Yama Değil Yapısal Entegrasyon:** Şemaya rastgele düz sütunlar eklenmez; Kanonik V2 yapısına (`modifiers`, `damageParts`, kategoriye özel alt blok) uygun şekilde tasarlanır.
  - **Rule Master ve Motor Senkronizasyonu Zorunludur:** `rule_master.js` içindeki yapay zeka şeması (`rule_master_ai_schema.json`), şema normalizasyonu (`normalizeEntry`), ETL dönüştürücü scriptleri ve `rule_engine.js` doğrulama mantığı derhal bu yeni V2 yapısını kapsayacak şekilde güncellenir.

## 9. Obsidian Bilgi Bankası ve "Obsidian'a Aktar" Protokolü (STRICT: OBSIDIAN DEVLOG PROTOCOL)
- **Kasa Konumu (Vault Path):** `D:\Obsidian\dndtools35\` (Docker Obsidian içindeki `/vaults` ile doğrudan eşleniktir).
- **Klasör Mimarisi:**
  - `00-Dashboard.md` (Merkezi Proje Panosu / MOC)
  - `01-Architecture/` (Sistem Mimarisi, Core Engine, HUB, Storage)
  - `02-Data-Contracts/` (master_db, character_data, V2 Compendium şemaları)
  - `03-Decisions/` (ADR - Mimari Karar Kayıtları)
  - `04-DevLogs/` (Oturum Devir Teslimleri ve Günlükler)
- **Tetikleyici Komut ("obsidian a aktar" / "obsidian devlog"):**
  - Ham transkript dökülmez; hata ayıklama ve gürültü ayıklanarak `04-DevLogs/YYYY-MM-DD-[Konu].md` formatında oturumun amacı, alınan mimari kararlar, kök neden analizleri, D&D 3.5e RAW bağıntıları, sıradaki adımlar ve çift yönlü wikilink'ler (`[[00-Dashboard]]` vb.) kaydedilir. Kalıcı kararlar ilgili `01-Architecture/`, `02-Data-Contracts/` ve `03-Decisions/` kartlarına eş zamanlı işlenir.

## 10. Sıfır Yama (Zero-Patchwork) ve Kanonik V2 Veri Mimarisi (STRICT)
Geriye dönük uyumluluk bahanesiyle kırılgan yamalar (`if (oldFormat)`, metin kazıma regex'leri, mükerrer alanlar) yazılması **KESİNLİKLE YASAKTIR**. Tüm veri ve motor katmanı şu 6 temel V2 ilkesine uymak zorundadır:
1. **Evrensel `modifiers` Dizisi (Sabit Bonus Sütunları Yasağı):**
   - `strBonus`, `dexBonus`, `acBonus`, `fortBonus`, `skillBonus` gibi dağınık sabit sütunlar ve tekil `bonusType` alanı kullanılmaz.
   - Tüm sayısal ve ölçeklenen etkiler `modifiers: [{ target, value | formula, type, condition }]` dizisi içinde tanımlanır.
2. **Yapısal `damageParts` Dizisi (Düz Metin Zar Yasağı):**
   - `dice`, `damageDice`, `extraDmg` gibi mükerrer metin alanları kullanılmaz.
   - Silah ve büyü hasarları `damageParts: [{ dice, bonus, type, multiplyOnCrit, onCritOnly, source }]` dizisiyle tutulur.
3. **Metin İçinden Regex ile Kural Tahmini Yasağı (No Heuristic Regex Guessing):**
   - `rule_engine.js` içerisinde eşyanın yuvasına (`slot === 'neck'`) veya açıklama metnine (`fullText.match(...)`) bakarak bonus tipi/değeri tahmin eden sezgisel (heuristic) regex yamaları yazılmaz. Motor %100 veri şemasındaki açık alanları (`modifiers`, `damageParts`, `ruleFlags`) işler.
4. **İsim Yerine Değişmez `id` Referansı:**
   - Eşya, büyü, feat ve temel silah eşleştirmeleri `name.toLowerCase()` üzerinden değil, değişmez `id` ve `baseItemId` slug'ları üzerinden yapılır.
5. **Aktif Matematik vs. Pasif Rozet (Badge) Sınırı:**
   - Zarlara, statlara, AC'ye, hıza, ACP'ye ve kritik aralığına doğrudan etki eden kurallar (`Enhancement`, `Keen`, `Mithral`, `Adamantine DR`, `Haste`) **hesaplama motoruna (`rule_engine.js`)** işlenir.
   - Masada durumsal/reaktif olan kurallar (`Fortification %25`, `Vorpal`, `Glamered`, `Defending`) motora karmaşıklık olarak yüklenmez; arayüzde temiz **bilgi rozeti (UI Badge / Tactical Note)** olarak gösterilir.
6. **Yama Yerine Tek Seferlik Tam Göç (Clean Migration over Patching):**
   - Şema değişikliklerinde eski ve yeni formatı aynı anda çalıştırmaya çalışan çift yollu spagetti kod yazılmaz; mevcut katalog ve karakter verileri tek seferlik deterministik göç scripti (migration script) ile V2 formatına yükseltilir.
