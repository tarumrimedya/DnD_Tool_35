# Sheet V3: Temiz ve Stabil Karakter Sayfası Planı

Branch: `redesign/page-from-scratch` (taban: `feat/v25-lego-engine-spotlight-terminal` @ `ba0a63b`)

## Kararlar

| Konu | Karar |
| :--- | :--- |
| Taban | V2.5 branch (Lego Engine + Spotlight + P11 dahil) |
| Yaklaşım | Paralel yeni sayfa. `index.html` eşitlik sağlanana kadar çalışmaya devam eder |
| Teknoloji | Build'siz native ES modülleri + JSDoc + `tsc --checkJs` |
| İlk dilim | `📜 Character & Logs` |
| İzolasyon | Aynı repo, ayrı branch, ayrı klasör (`sheet/`), V3'e ait motor kopyası (`sheet/engine/`). Ortak olan tek şey veri sözleşmesi. `verify_and_sync` iki yönlü kuralı denetler: eski dosyalar `sheet/`'e referans veremez, `sheet.html` kök motoru yükleyemez |
| Homebrew yeri | Karaktere özel kütüphane (`character.customDb`, ADR-011 korunur). Ortak/kampanya kütüphanesi yok; karakter kendi homebrew'unu taşır, Hub'a ve başka cihaza taşındığında eksiksiz gider |
| Öncelik | Önce backend (veri katmanı). Ardından Master DB / Forge / Rule Master, `kind` tabanlı tek bir Entry Editor olarak yeniden tasarlanır |

## 1. Korunacak öz

Aşağıdakilere dokunulmaz, yeni sayfa bunları **kullanır**:

- **Veri sözleşmesi:** `character_data.json` V2 formatı (`schemaVersion: 2`), `customDb` (ADR-011), localStorage anahtarları (`dnd35_character`, `dnd35_active_character_id`, `dnd35_hub_db`), Supabase `full_data`. Hub ve eski sayfa aynı karakteri sorunsuz okumaya devam eder.
- **Motor:** `rule_engine.js` ve `srd_compendium.js` (`SrdCompendium`, `ItemAssembler`, `SchemaMigrator`) V3'e **kopyalandı** (`sheet/engine/`, bkz. `sheet/engine/FORK.md`). V3 kendi kopyasını yeniden yazar; eski sayfa, Hub ve diğer oturumlar kök dosyaları kullanmaya devam eder. Kopyalar klasik `<script>` olarak yüklenir, yeni modüller yalnızca `engine-adapter.js` üzerinden çağırır. `rule_master.js` (AI, Forge) Master DB/Forge yeniden tasarımında aynı şekilde kopyalanacak.
- **Deneyim:** Sayfa temalı renkler, 4 kademeli buton standardı, Spotlight paleti, `dice3d` 3D zar, SVG zar ikonları (U+1F3B2 yasak), D&D 3.5e RAW İngilizce UI metinleri.
- **Görsel kimlik:** Koyu slate/indigo kartlar ve mevcut renk paleti. Yeni sayfa **aynı görünür**, temizlenen şey alttaki yapıdır.

## 2. Bugünkü yamaların kök nedenleri

| Belirti (bugün) | Kök neden | V3 çözümü |
| :--- | :--- | :--- |
| `safeIdAttr` kaçışı, `String(p.id) === String(id)` | JS kodu HTML metnine gömülü (`onclick="fn(${id})"`) | Event delegation: `data-action` + `data-id`, tek dinleyici |
| Feat/ability'nin Gear Pool'a düşmesi, yüklemede temizlik | Yazma sırasında tür kontrolü yok | Tek yazma kapısı: `addEntry()` `kind`'a göre yönlendirir, yanlışı reddeder |
| İsimden regex ile sınıflandırma (`/shield/`, `cone of`) | Kayıtta güvenilir bir tür alanı yok | Zorunlu `kind` alanı, isim hiçbir zaman sınıflandırmada kullanılmaz |
| Yüklemede sessiz silme (`customDb`, synergy) | Migration'lar yıkıcı ve sürümsüz | Sürümlü migration, silme yerine **karantina** listesi |
| Aynı tekilleştirme 2 yerde | Türetilmiş değerlerin sahibi yok | `deriveSheet()` tek yerde hesaplar, sekmeler sadece okur |
| `renderAll()` + dirty-tab motoru | State değişimi izlenmiyor | Küçük reaktif store (subscribe/selector) |
| ~300 karakterlik tekrar eden class dizileri | Bileşen yok | `ui/` bileşenleri + CSS token'ları |

## 3. Dosya yapısı

```
sheet.html                  # yeni giriş noktası (eski index.html dokunulmadan kalır)
sheet/
  main.js                   # açılış: legacy motorları bekle, store'u yükle, route
  core/
    store.js                # tek state, dispatch, subscribe, undo
    actions.js              # tüm mutasyonlar burada (addEntry, setAbility, ...)
    entry-kind.js           # kind tespiti ve doğrulama (tek otorite)
    migrations.js           # sürümlü, yıkıcı olmayan migration + karantina
    persistence.js          # localStorage/Supabase adaptörü, yazma kilidi
    derive.js               # deriveSheet(character) -> değerler + kaynak dökümü
    engine-adapter.js       # RuleEngine / SrdCompendium global'lerini saran ince katman
  engine/                   # V3'e ait motor kopyası (klasik script), bkz. FORK.md
    rule_engine.js
    srd_compendium.js
  ui/
    tokens.css              # renkler, aralıklar, sayfa temaları (data-theme)
    components.js           # Button(tier), Badge, Card, Tabs, StatTile, Modal
    delegate.js             # data-action olay dağıtıcısı
  views/
    character/              # ilk dilim
      profile.js
      abilities.js
      skills.js
      feats-abilities.js
      progression.js
tools/test_sheet_v3.mjs      # store/actions/derive/migration testleri (Node, build'siz)
```

## 4. Veri bütünlüğü katmanı (ilk iş)

1. **`kind` alanı:** `'gear' | 'consumable' | 'feat' | 'flaw' | 'spell' | 'maneuver' | 'stance' | 'ability' | 'boon' | 'synergy' | 'template'`.
   - Eski kayıtlarda `kind` yoksa `entry-kind.js` bir kez çıkarım yapar: önce `category`/`type`/id öneki, en son fiziksel ekonomi alanları. İsim regex'i yok.
   - Çıkarılamayan kayıt değiştirilmez, karantinaya alınır.
2. **Tek yazma kapısı:** `actions.addEntry(entry)` kaydı doğru diziye (`gearPool`, `feats`, `specialAbilities`, `spells`…) koyar. Başka hiçbir kod bu dizilere doğrudan `push` yapmaz.
3. **Migration:** `character.v3Migrations = ['2026-11-kind-tagging', ...]`. Her migration bir kez çalışır, saf fonksiyondur, test edilir ve hiçbir kaydı silmez.
4. **Karantina:** `character.quarantine: [{ entry, reason, from }]`. UI'da "Needs Review" rozetiyle gösterilir, kullanıcı tek tıkla taşır veya siler.

## 5. Kayıt güvenliği (iki sayfa aynı anda)

- **Faz A (salt okunur):** V3 sayfası karakteri okur ama hiç yazmaz. Eski sayfayla birlikte açık kalması risksizdir.
- **Faz B (yazma), 2026-11-08'de uygulandı. Ayrıntılar: V3_DATA_SCHEMA.md bölüm 7.**
  - Tek yazıcı kilidi olarak Web Locks (`dnd35-writer:<id>`) kullanıldı. Klasik sekme kilidi bilmez, çünkü kök dosyalara dokunmak `main` onayı ister. Onun yazdıkları içerik karşılaştırmasıyla yakalanır ve V3 üzerine yazmaz.
  - Yazmadan önce `lastModified` yerine saklanan içeriğin kendisi karşılaştırılır. Değiştiyse yazılmaz, "Reload" istenir. Birleştirme arayüzü yok.
  - Kayıt `dnd35_character` ve Hub `fullData`'ya klasik biçimde gider. Supabase'e klasik sayfa yükler.

## 6. Arayüz kuralları

- Statik `tailwind_compiled.css` korunur. V3 bileşenleri yalnızca **mevcut derlenmiş class'ları** ve `tokens.css` değişkenlerini kullanır. Yeni arbitrary class yok (GEMINI §1.3).
- Satır içi `onclick` yok. Tüm etkileşimler `data-action` ile yapılır.
- Her bileşenin bir sabit boyut sözleşmesi vardır (Tier 1 `h-9`, Tier 2/3 `h-8`…). Kural bileşenin içinde yaşar.
- Modallar ortak `Modal` kabuğunu kullanır: `role="dialog"`, `aria-modal`, `Escape`, odak tuzağı.

## 7. İlk dilim: `📜 Character & Logs`

Mevcut sekmenin içeriği (`index.html` 1475–1743) ve eski fonksiyonları:

| Bölüm | Eski kaynak |
| :--- | :--- |
| Profile kartı (isim, ırk, template/ECL, sınıflar, HD, kimlik grid'i) | `char_hud.js` `openProfileEditModal`, profile render |
| Feats & Special Abilities vitrini | `char_progression.js:7526` `renderCoreFeatsAndSpecialAbilities` |
| Level Progression & Planning tablosu | `char_progression.js:7871` `renderLevelProgression`, `openLevelUpModal` |
| Skills tablosu (filtre, arama, puan bütçesi, 3D roll) | `char_inventory.js:149` `renderSkills` |
| Quest Logs & Mindmap | `hub_notes.js` (`HubNotes`). Olduğu gibi çağrılır |

Adımlar (her adım ayrı commit):

1. **İskelet:** `sheet.html`, store, persistence (salt okunur), engine adaptörü, tokens, delegate, Character sekmesi boş kabuğu.
2. **Profile kartı:** Eski sayfayla aynı görünüm, aynı veri.
3. **Ability scores + Skills (salt okunur):** Sayılar `deriveSheet()` → `RuleEngine` üzerinden gelir. Eşitlik testi: aynı karakter için eski sayfadaki skill toplamları = V3 değerleri.
4. **Feats & Special Abilities:** `kind` tabanlı liste. Karantinadaki kayıtlar görünür olur.
5. **Level Progression (salt okunur tablo).**
6. **Faz B:** Yazma kilidi, ardından düzenleme akışları (Profile edit, skill rank, feat ekleme, Level Up). Level Up wizard en sona kalır.

**Bitti tanımı:** Fixture karakterler (`character_data.json` + 3 örnek) için V3 Character sekmesi eski sekmeyle aynı sayıları gösteriyor, `test_sheet_v3.js` geçiyor, Hub'da açılan karakter bozulmuyor.

## 8. Sonraki dilimler

`🎒 Inventory` (yazma kapısının en çok fayda sağladığı yer) → `🔮 Spells & Maneuvers` → `🛡️ Defense` → `⚔️ Combat` (en büyüğü) → `🎲 Dice` → Settings/Master DB. Tüm sekmeler eşitliğe ulaşınca `/character` rewrite'ı `sheet.html`'e çevrilir. Bu adım `main` onayı gerektirir.

## 9. Doğrulama

- `tools/verify_and_sync.js` `CORE_FILES` listesine `sheet.html` ve `sheet/**` eklenir, böylece `webapp/` paritesi korunur.
- `tools/test_sheet_v3.mjs`: actions, `kind` çıkarımı, migration'lar (silme yok), derive eşitliği.
- CI: GitHub Actions'ta her PR'da `verify_and_sync` + tüm `tools/test_*.js` çalışır. Böylece yerelde Node olmasa da doğrulama yapılır.

## 10. Açık riskler

- `node` PATH'te yok. Şimdilik `C:\Users\tarum\AppData\Local\ms-playwright-go\1.57.0\node.exe` (v24) ile çalışıyor. Kalıcı çözüm için Node kurulmalı ya da CI eklenmeli.
- V2.5 tabanında P11'den kalan bir isim kırpma riski var: `rule_master.js:696` regex'i hâlâ `cone\s+of|line\s+of` ile kesiyor, bu da "Cone of Cold" gibi isimleri bozuyor. V3'ten bağımsız, ayrı bir düzeltme olarak ele alınmalı.
- Eski global fonksiyonlar (`window.*`) V3'te yalnızca `engine-adapter.js` üzerinden çağrılır. Hangilerinin DOM'a bağımlı olduğu 1. adımda tek tek ayıklanır.
