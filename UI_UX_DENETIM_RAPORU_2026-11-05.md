# Joyful-Fermi UI/UX ve Frontend Denetim Raporu

**Tarih:** 2026-11-05
**Kapsam:** Login, Hub ve Character sayfaları; hardcoded veri, veritabanı entegrasyonu, modüler yapı, performans ve menü kullanımı.
**Durum:** 3 öncelikli sorun branch'te düzeltildi. 3 öncelikli sorun açık: Known Spells listesi, bulut senkronunda veri kaybı ve `/api/storage` güvenliği.

> Düzeltmeler `fix/p0-ux-data-safety` branch'inde, `.claude/worktrees/p0` klasöründe ve **commit edilmedi**. `main` ve canlı site değişmedi.

## Özet

Kural motoru ve veri modeli sağlam; en zayıf katman arayüz. Sorun tasarım zevkinden çok, sayfanın büyük dosyalar ve global fonksiyonlarla büyümüş olması. Baştan yazım gerekmiyor; kademeli geçiş yeterli.

## Öncelikli bulgular (P0)

| Bulgu | Etki | Durum |
|---|---|---|
| Mobilde alt menüden sekme değişince içerik ekranın 1.240 px altında açılıyordu | Dokunuş hiçbir şey yapmamış gibi görünüyordu | Branch'te düzeltildi |
| Hub'dan içe aktarılan Master DB verisi, karakter sayfası açılınca siliniyordu | Kullanıcı verisi kayboluyordu | Branch'te düzeltildi |
| `customDb` kayıtları SRD aramasına ulaşmıyordu | Karaktere özel kayıtlar `search`, `getById` ve `getByName` ile bulunamıyordu | Branch'te düzeltildi |
| Known Spells listesi `cl is not defined` hatasıyla kırılıyor (`char_spells.js:4710`) | 11 bilinen büyülü test karakterinde liste yalnızca seviye başlığını gösterdi; hiçbir büyü satırı çıkmadı | **Açık**; `main` üzerinde de var |
| `/api/storage` POST yalnızca `character` ve `masterDb` alanlarını saklıyor | `hubDb`, `sharedLibrary`, `tombstones` ve `latestDmEvent` sunucu yolunda kayboluyor; ortak kütüphane cihazlar arasında taşınmıyor | **Açık** |
| `/api/storage` PIN yoksa istekleri doğrulanmış sayıyor, tüm origin'lere açık ve env anahtar adlarını döndürüyor | Gerçek handler'da doğrulandı. Production etkisi `APP_PIN` ayarına bağlı | **Açık**; `APP_PIN` kontrolü gerekiyor |
| Bulut durumu tek sabit anahtarda (`dnd35_universal_state_v1`) tutuluyor | Kullanıcıya göre ayrım yok; aynı dağıtımdaki istemciler aynı kaydı okuyup yazar | **Açık** |

### Branch'teki düzeltmeler

- **Mobil sekme:** 375×812 ekranda yedi sekmenin hepsi dokununca ekranın üstünden 8 px aşağıda açılıyor. 1280×720 masaüstünde sekme değişiminde sayfa kaydırılmıyor.
- **Ortak kütüphane:** `SharedLibraryStore` eklendi. Hub kayıtları `dnd35_hub_db.sharedLibrary` içinde tutuluyor.
- **Eski veri:** `dnd35_master_db` içeriği otomatik olarak kütüphaneye taşınıyor. Aynı isimli ama farklı içerikli kayıtlar ayrı `id` alıyor.
- **Kopya davranışı:** Karakterin kullandığı kütüphane öğesi `customDb`'ye kopyalanıyor; kütüphanedeki sonraki değişiklikler bu kopyayı etkilemiyor.
- **Temizlik:** Eski `dnd35_master_db` yazma yolları ile tanımsız `BUNDLED_MASTER_DB` ve `MASTER_DB_DATA` fallback'leri kaldırıldı.

### Bilinçli kapsam sınırları

- Kütüphane hesap düzeyinde. Kampanyadaki diğer oyuncularla paylaşım için yeni Supabase tablosu ve RLS kuralları gerekir.
- Hub'da kütüphane silme arayüzü olmadığı için tombstone eklenmedi. Silme eklenirse birlikte gelmeli.
- Her canavar dönüştürmesi saldırı, feat ve yeteneklerini kütüphaneye ekliyor. Kütüphane fazla büyürse bu veriler NPC'nin `customDb` alanına taşınmalı.

## Ek test sonuçları

### Bulut senkronu

Gerçek `api/storage.js` handler'ı, sahte bir Upstash KV ve ayrı origin'lerdeki iki "cihaz" ile test edildi. Gerçek Upstash verisine dokunulmadı.

| Veri | Sunucu yolu (`/api/storage`) | Doğrudan Upstash yolu |
|---|---|---|
| Karakter ve `customDb` | Taşındı | Bu yolda ayrıca test edilmedi |
| Ortak kütüphane | **Taşınmadı** | Taşındı; ikinci cihazın eklemesiyle 2 kayıt korundu |
| KV'ye yazılan alanlar | `version`, `lastModified`, `character`, `masterDb` | Bunlara ek `hubDb`, `latestDmEvent`, `tombstones` |

- **Canlı senkron maliyeti:** Testte 8 saniyelik canlı yoklama her çekişte `renderAll` çalıştırdı. Hata izleri bunu tekrar tekrar gösterdi.

### Supabase hesabı

Gerçek hesapla giriş yapılmadı; bu bölüm kod incelemesine dayanıyor.

- `customDb`, `full_data` içinde karakterle birlikte Supabase'e gider.
- `supabase_auth.js` içinde `sharedLibrary` için hiçbir yol yok. `syncCloudUserHub` yalnızca karakter ve kampanyaları eşitliyor.
- **Sonuç:** Şu haliyle Supabase kullanıcısı için ortak kütüphane, doğrudan Upstash ayarı yoksa pratikte cihaza bağlı kalır.

### Dolu karakter

Yedekteki 16. seviye Sorcerer/Warblade karakteriyle yerelde test edildi (170 KB veri).

| Sekme | İlk açılış | DOM öğesi |
|---|---:|---:|
| Spells | 297 ms | 1.385 |
| Core | 278 ms | 1.691 |
| Inventory | 247 ms | 1.365 |
| Database | 118 ms | 1.488 |
| Defense | 74 ms | 400 |
| Dice | 66 ms | 293 |
| Combat | 35 ms | 656 |

- Sayfa DOM'u tüm sekmeler açıldıktan sonra 5.080'den 9.909 öğeye çıktı.
- Kural motoru yeniden hesabı 6 ms sürdü; motor darboğaz değil.
- Hub kartı dolu karakterle ve `customDb` ile 19 ms'de render oldu, hata vermedi.

### Level Up

16'dan 17'ye geçiş form alanları programla doldurularak çalıştırıldı ve geçti: seviye, HP (151 → 157) ve ilerleme kaydı doğru güncellendi, modal kapandı, veri yeniden yüklemeden sonra korundu. Tek sınıf yolu denendi; Prestige Class önkoşulları, planlı seviyeler ve feat seçimi test edilmedi.

### Modallar

36 açma fonksiyonu argümansız çağrıldı.

- **27 modal açıldı.** Hiçbirinde `role="dialog"` yok ve hiçbiri programla gönderilen `Escape` ile kapanmadı. Hepsinde kapatma veya iptal düğmesi bulundu.
- **7 fonksiyon** görünür modal açmadı; çoğu `toggle` paneli veya bağlam gerektiriyor. **2 fonksiyon** argüman istediği için hata verdi; bu test yöntemiyle ilgili, uygulama hatası sayılmadı.
- Modalların içeriğindeki form akışları tek tek denenmedi.

Mobilde (375×812) örneklenen 6 modal:

| Modal | Kontrol | 44 px altı | Not |
|---|---:|---:|---|
| Level Up | 138 | 138 | Kaydırılabilir |
| Settings | 27 | 25 | Kaydırılabilir |
| Add Buff | 14 | 12 | 2 öğe ekran dışına taşıyor |
| Compendium / Forge | 166 | 166 | Kaydırılabilir |
| Feat Picker | 419 | 418 | Kaydırılabilir |
| Spell / Maneuver Picker | 385 | 385 | Kaydırılabilir |

### Yeni öneriler

- **Known Spells:** `char_spells.js:4710` içindeki `cl`, kapsamda tanımlı değil. Muhtemel düzeltme aynı fonksiyondaki `spontCl` değerini kullanmak; hazırlıklı caster'larla da test edilmeli. Hata `a1288fd` (2026-11-04) ile gelmiş görünüyor.
- **Kütüphane senkronu:** Oturum açmış kullanıcılar için kütüphane Supabase'de `owner_user_id` ve RLS ile tutulmalı. Upstash yolu kalacaksa `hubDb`, `tombstones` ve `latestDmEvent` POST'ta korunmalı.
- **Bulut anahtarı:** Çok kullanıcılı kullanım için tek sabit KV anahtarı kaldırılmalı veya kullanıcıya göre ayrılmalı.
- **Canlı yoklama:** `renderAll` yalnızca `lastModified` değişince çalışmalı.
- **Ortak modal kabuğu:** `role="dialog"`, `aria-modal`, `Escape`, odak tuzağı ve kapanınca odağı geri verme tek yerde çözülmeli.
- **Uzun listeler:** Feat ve Spell picker listeleri sanallaştırılmalı veya sayfalanmalı.
- **Sekme maliyeti:** Spells, Core ve Inventory render'ı ölçülerek küçültülmeli; açılmış sekmelerin DOM'u bellekte büyümeye devam ediyor.

## Performans (P1, açık)

| Alan | Ölçüm | Hedef |
|---|---|---|
| Hub ilk açılışı | 34 istek, yaklaşık 17 MB | Yalnızca gereken veri |
| SRD verisi | 11,9 MB; gzip ile yaklaşık 2,1 MB | Bestiary açılınca canavarlar, ihtiyaç olunca diğerleri |
| Canavar verisi | 3,7 MB; her Hub açılışında yükleniyor | Bestiary açılınca yüklenmeli |
| Karakter sayfası JS | 14 yerel dosya, 3,69 MB ham, yaklaşık 752 KB gzip | Bundle, minify ve sayfa bazlı bölme |
| Hub prefetch | Sürümler uyuşmadığı için dosyalar iki kez iniyordu | Otomatik sürümleme |
| Önbellek | `vercel.json` içinde cache başlığı yok | Hash'li dosya adı ve immutable cache |
| Çevrimdışı kullanım | Service worker ve manifest yok | Masada zayıf internet için PWA katmanı |

- Branch'te değişen `char_*` dosyalarının prefetch sürümleri eşitlendi. `char_combat.js` ve `char_modals.js` hâlâ farklı.
- **Sekme hızı:** Boş karakterde sekme geçişi 1–48 ms, dolu karakterde ilk açılış 35–297 ms sürüyor. Asıl sorun ilk yükleme ve yerleşim; dolu karakterde Spells, Core ve Inventory de izlenmeli.

## Arayüz ve kullanım (P1, açık)

| Alan | Ölçüm | Hedef |
|---|---|---|
| Masaüstü içerik başlangıcı | 720 px yüksekliğin 563. pikseli; ekranın %22'si içeriğe kalıyor | Kompakt, sabit HUD |
| Mobil içerik başlangıcı | 1.248 px, yaklaşık 1,5 ekran aşağıda | İlk ekranda HP, AC ve aktif sekme |
| Küçük metin | Masaüstünde görünür metinlerin %49'u 12 px altında (329/667) | Ana bilgi en az 12 px |
| Küçük kontroller | Mobilde kontrollerin %82'si 44 px altında (147/180) | Ana kontroller en az 44 px |
| Mobil alt menü | 7 öğe, 9 px yazı, 38 px yükseklik | En fazla 5 öğe |
| Mobil taşma | Core'da 61, Spells'te 13, Inventory ve DB'de 8'er öğe ekran dışına taşıyor | Görsel olarak kontrol edilmeli |

- **Geri bildirim:** `alert`, `confirm` ve `prompt` 209 satırda geçiyor. Bunlar ortak modal ve toast sistemine taşınmalı.
- **Erişilebilirlik:** `index.html` içinde 1 `aria-` kullanımı var; `role`, `alt` ve `tabindex` yok. İki sayfada 23 tıklanabilir `div` veya `span` var.
- **Adreslenebilirlik:** Sekme ve modal durumu URL'ye yansımalı, örneğin `/character/:id/combat`.

### Önerilen menü yapısı

| Mod | İçerik |
|---|---|
| **Play** | Combat, Spells, Defense, hızlı Gear |
| **Build** | Core, Skills, Level Up, Inventory yönetimi, Templates |
| **Library** | Compendium, Rule Master, The Forge; Hub ile ortak |
| **Global** | Dice, Notes, Sync, Search; her yerden açılan araçlar |

Mobil alt menü için öneri: Combat, Spells, Gear, Character, More.

## Hardcoded veri ve veritabanı (P1, açık)

**Kural:** Oyun içeriği olmayan sabitler kodda kalabilir (`STAT_KEYS`, `POINT_BUY_COST_TABLE`, tema listeleri). Kural içeriği taşıyan her şey veritabanına taşınmalı.

- **Domain verisi:** `srd_domains.json` tek başına tam kaynak değil. 36 kaydın 12'sinde `modifiers`, 18'inde `ruleFlags` var; `BUILTIN_DOMAINS` içindeki bayraklar her zaman birleştiriliyor.
- **Domain caster level kuralları:** `BUILTIN_DOMAIN_CL_MODS` kod içinde.
- **Buff verisi:** `BUILTIN_BUFFS` gerçek bir fallback, ama 107 kaydın 31'i `srd_spells.json` içinde yok. En az 42 kayıt veriyle tekrar ediyor.
- **UI modüllerindeki listeler:** `CANONICAL_DEBUFF_SPELLS` envanter modülünde, `BODY_SLOT_DEFS` büyü modülünde. Slot anahtarları aynı dosyada üç kez tekrar ediyor.
- **İsimle eşleştirme:** `name...toLowerCase()` deseni 565 satırda geçiyor. Hepsi hata değil, ama V2'nin `id` kuralına aykırı olanlar ayıklanmalı.
- **Dağınık depolama:** Altı dosyada 123 satır doğrudan `localStorage` kullanıyor.
- **Bağlı olmayan veri dosyaları:** Yedi dosyaya kod veya index'ten referans yok ve deploy edilmiyor. Epic olanlar Faz 9.F planında.
- **Faz 9.C:** Devlog tamamlandı diyor, ama `srd_alchemical_and_tools.json` kayıtları aktif ekipman dosyalarında büyük ölçüde bulunamadı. 77 kaydın 10'u kısmi isim eşleşmesi verdi; kontrol edilmeli.

## Modüler yapı (P2, açık)

- **Büyük dosyalar:** `char_combat.js` 13.615 satır; `hub.html` 6.226 satır ve büyük bölümü inline script.
- **Global bağımlılık:** 209 `window.x =` ataması, 384 `innerHTML` satırı ve 582 inline `onclick` var.
- **Tekrar:** `escapeHtml` üç ayrı yerde tanımlı.
- **Test kapsamı:** 5.787 satırlık kural motoru için 5 test var.
- **Korunması gereken:** `rule_engine.js` arayüzden temiz biçimde ayrı.

### Hedef katmanlar

```text
data/      SrdCompendium, CharacterStore, SyncAdapter
domain/    rule_engine (saf hesaplama)
features/  combat, spells, inventory, progression, library
ui/        modal, toast, tabs, card, tokens
pages/     hub, character, login (ince giriş dosyaları)
```

React'e geçiş önerilmiyor. Vanilla JS, ES module ve esbuild veya Vite bu proje için yeterli.

## Doğrulama durumu

| Kontrol | Sonuç |
|---|---|
| `tools/test_rule_engine.js` | 5/5 geçti |
| `tools/verify_and_sync.js` | Tüm kontroller geçti; 26 çekirdek dosya senkronlandı |
| Mobil sekme tarayıcı testleri | Geçti |
| Ortak kütüphane tarayıcı testleri | Geçti |
| `database/` farkı (branch) | 0 dosya |

Node, Docker içindeki `node:lts-slim` konteynerinde (v26.13.0) çalıştırıldı.

**Hâlâ test edilmeyenler:**

- Gerçek Upstash ve gerçek Supabase hesabı; bulut testi sahte KV ile, Supabase incelemesi kod üzerinden yapıldı.
- Modal içi form akışları ve gerçek tıklamalar; testler programla çalıştırıldı.
- Level Up'ta Prestige Class, planlı seviye ve feat seçimi yolları.
- Gerçek telefon ve yavaş ağ.

**Ölçüm sınırı:** Performans değerleri yerel sunucuda ve gzip olmadan alındı. Süreler gerçek ağ performansı değildir. Gzip değerleri dosyalar üzerinden hesaplandı.

**Uyarı:** `verify_and_sync.js` 257 Türkçe veya Mojibake satırı raporladı. Bu uyarı doğrulamayı durdurmadı; bu branch'in sayıyı değiştirip değiştirmediği karşılaştırılmadı.

## Önerilen sıra

1. Known Spells hatasını düzeltmek; bu hata `main` üzerinde de var.
2. `APP_PIN` durumunu kontrol edip `/api/storage` güvenliğini kapatmak.
3. Ortak kütüphane ve bulut modelini netleştirmek: Supabase tablosu, RLS ve kullanıcıya göre ayrım.
4. P0 branch'ini gerçek hesapla test edip canlıya hazırlamak.
5. Ortak modal kabuğunu kurmak ve canlı yoklamanın gereksiz render'ını kaldırmak.
6. Hub ilk yükünü azaltmak: SRD verisini gerektiğinde yüklemek ve otomatik sürümleme eklemek.
7. Mobil için kompakt, sabit HUD ve 5 öğeli alt menüye geçmek.
8. Domain ve buff verisini koddan veritabanına taşımak.
