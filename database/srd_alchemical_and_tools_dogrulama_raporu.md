# SRD Alchemical and Tools JSON — Doğrulama Raporu

**İncelenen dosya:** `C:\Users\tarum\Documents\antigravity\joyful-fermi\database\srd_alchemical_and_tools.json`  
**Yetkili kaynaklar:**
- `C:\Users\tarum\Documents\Opencode\dnd35\Database\kitaplar\Players Handbook.pdf` — Table 7–8: Goods and Services, s. 128–129; Item descriptions, s. 128–130
- d20srd.org Equipment / Homunculus / Shield Guardian sayfaları (resmi SRD'nin OGC kopyası; yerel PHB ile aynı değerler)

**Kayıt sayısı:** 77  
**Tarih:** 3 Kasım 2026  
**JSON bu incelemede değiştirilmedi.**

## 1. Sonuç özeti

| Kontrol | Sonuç |
|---|---|
| Toplam kayıt | 77 |
| Benzersiz `id` | Evet |
| `schemaVersion` | Tümü `2` |
| `slot` | Tümü `Slotless` (uygun) |
| Fiyat/ağırlık doğru | **74 / 77** |
| Yanlış fiyat/ağırlık | `Thieves’ Tools, Masterwork` |
| Geçersiz/uydurma kayıt | 2 adet `Laboratory` kaydı |
| Mekanik encoding | Yaygın biçimde bozuk |
| Açıklamalar | Çoğu placeholder / eksik / anlamsız |
| Eksik canonical kayıt | `Tool, masterwork` (50 gp, 1 lb.) |

Kısa hüküm: **Dosya fiyat/ağırlık çekirdeğinde büyük ölçüde doğru, ancak olduğu gibi güvenilir bir mekanik veri kaynağı değildir.** İki sahte "equipment" kaydı ve yanlış masterwork hırsız aletleri değerleri düzeltilmeden kullanılmamalı.

## 2. Kritik / düzeltilmesi gerekenler

### 2.1 `Laboratory (Homunculus)` ve `Laboratory (Shield Guardian)` — equipment değil

JSON'da:

| Kayıt | JSON | PHB / SRD |
|---|---|---|
| Laboratory (Homunculus) | 500 gp, 40 lb., Skill Tool & Kit, source PHB p.128 | **Table 7–8'de yok.** Sadece construct yaratılışı metninde 500 gp'lik "specially prepared laboratory or workroom" geçiyor |
| Laboratory (Shield Guardian) | 500 gp, 40 lb., Skill Tool & Kit, source PHB p.128 | **Table 7–8'de yok.** Aynı şekilde construct yaratılışı metninde geçiyor |

Sorunlar:

- Bunlar satılan/envantere alınan aletler değil; construct oluşturma gereksinimi.
- 500 gp, "laboratuvarı kurma" maliyeti; market price değildir.
- 40 lb. ağırlık uydurulmuş/ `Alchemist’s Lab` ile karıştırılmış görünüyor; kaynakta ağırlık yok.
- `Skill Tool & Kit` kategorisi ve `SRD / PHB p.128` source etiketi yanlış.
- Homunculus için malzeme 50 gp + 500 gp lab; Shield Guardian için malzeme 5,000 gp + 20,000 gp keyed amulet + 500 gp lab. Bunlar JSON'un "Tool" modeline girmez.

**Doğru işlem:** Bu iki kaydı JSON'dan çıkarın veya `type: "crafting-requirement"`, `cost: 500` (kurulum maliyeti), `weight: null`, `source: "SRD — Homunculus / Shield Guardian construction"` gibi ayrı bir modelde tutun. Equipment tablosunda satılamaz.

### 2.2 `Thieves’ Tools, Masterwork` — fiyat ve ağırlık yanlış

| Alan | JSON | PHB / SRD |
|---|---|---|
| Cost | **125 gp** | **100 gp** |
| Weight | **1 lb.** | **2 lb.** |
| Source | p.129 | p.129 (doğru) |

Bu kayıt doğrudan yanlış.

### 2.3 `Tool, masterwork` eksik

PHB/SRD Table 7–8'de:

`Tool, masterwork — 50 gp — 1 lb. — grants +2 circumstance bonus on a related skill check (if any).`

JSON'da genel/generic `Tool, masterwork` kaydı yok; sadece özel masterwork artisan/thieves/instrument varyantları var. Dosyanın kapsamı "alchemical and tools" olduğu için bu satır eksik sayılmalı.

## 3. Mekanik encoding ciddi biçimde bozuk

### 3.1 Base (non-masterwork) aletler `+2` veriyormuş gibi kodlanmış

SRD:

> Without them, you have to use improvised tools (–2 penalty on Craft checks), if you can do the job at all.

Base artisan tools / common instruments **+2 vermez**. JSON'da base kayıtların çoğunda yine de:

```json
{ "value": 2, "condition": "Masterwork Only" }
```

bulunuyor. Bu, "Masterwork Only" koşulu yüzünden pratikte uygulanmayabilir, ama veri modeli olarak yanlış; base aletin +2 modifieri yoktur. Aynı şey yaygın `Musical Instrument (…)` kayıtlarında da var.

**Doğrusu:** `modifiers: []` (veya sadece "tools required / improvised tools –2" gibi ayrı bir bayrak).

### 3.2 `Thieves’ Tools` modifiers çelişkili

JSON base kayıtta:

- `+0 … Masterwork Only` ×2
- `+2 … Masterwork Only` ×2

Base hırsız aletleri +2 **vermez**; masterwork olanlar +2 verir. Ayrıca "Masterwork Only" koşullu +2'nin base kayıtta bulunması veri kirliliği.

**Doğrusu:**
- Base `Thieves’ Tools`: no bonus (SRD sadece "gerekli araç; yoksa –2 circumstance penalty" der).
- `Thieves’ Tools, Masterwork`: +2 circumstance on Disable Device and Open Lock.

### 3.3 Modifier tipi tutarsız

| Tip | Adet |
|---|---:|
| `modifiers: {}` object | 49 |
| `modifiers: []` array | 28 |

Aynı schema içinde iki farklı gösterim kullanılıyor. Masterwork araçlarda array, Alchemist's Lab'da object kullanılmış. Tek biçime indirgenmeli.

### 3.4 Açıklama şablonları boş/bozuk

Çoğu kayıtta:

`<p>Grants +  bonus on .</p>`

içeriği var; değerler ve hedef boş. Bu, üretici şablonun alanları doldurmadan export edildiğini gösterir.

Etkilenen kayıt aileleri: base Artisan's Tools (13), Climber/Disguise/Healer, yaygın Musical Instruments (13), Alchemist's Lab.

### 3.5 Mekanik taşıyan ama `modifiers` boş kayıtlar

- `Scale (Merchant’s)` → açıklama +2 Appraise diyor, `modifiers: {}`
- `Magnifying Glass` → +2 Appraise (small/detailed), `modifiers: {}`

Bunlar ya modifier olarak kodlanmalı ya da en azından açıklamaları tam cümle olmalı.

## 4. Açıklamalar kural kaynağı değil

Çoğu alchemical/tool kaydında açıklama yalnızca:

`Alchemical Item from Core D&D 3.5e SRD (PHB Equipment).`

gibi bir yer tutucu. Efektler hiç yazılmıyor. Örnek eksik mekanikler:

| Eşya | Kitaptaki etki | JSON |
|---|---|---|
| Acid (Flask) | splash attack; direct hit 1d6 acid; 5-ft splash 1 damage | yok |
| Alchemist's Fire | direct 1d6 fire; next round 1d6; DC 15 Reflex to extinguish | yok |
| Antitoxin | +5 alchemical Fort vs poison, 1 hour | yok |
| Smokestick | 10-ft cube fog, ~fog cloud, 1 round | yok |
| Tanglefoot Bag | entangle; DC 15 Reflex; glue; DC 17 Str / 15 slashing damage; 2d4 rounds brittle | yok |
| Thunderstone | 10-ft radius, DC 15 Fort, deafen 1 hour | yok |
| Tindertwig | lighting fire faster; torch = standard action | yok |
| Sunrod | 30/60-ft illumination, 6 hours; gold tip burns out | kısmen (`Bright Illumination… duration 6 hr`) |

Yani kayıtlar **fiyat/ağırlık tablosu** olarak kullanılabilir; **kural motoru/açıklama** olarak kullanılamaz.

## 5. Kapsam / eksik kayıtlar

### 5.1 Named musical instruments — kaynak tablosu tek satır

PHB/SRD Table 7–8:

- `Musical instrument, common — 5 gp — 3 lb.`
- `Musical instrument, masterwork — 100 gp — 3 lb.`

JSON bunu 13 yaygın + 13 masterwork named instrument'e çevirmiş. Fiyat/ağırlık doğru; ancak:

- Bunlar Table 7–8'in birebir satırları değil, türetilmiş varyantlar.
- PHB metni özellikle **fife, recorder, lute, mandolin, shawm** örneklerini veriyor; JSON'da **fife yok**.
- Diğer isimler (bell, chime, drum, gong, fiddle, harp, flute, pan pipes, trumpet) geçerli enstrümanlardır ama "exhaustive canonical list" değil. Varyant oldukları belirtilmeli.

**Doğrusu:** Ya generic iki kaydı (`Musical Instrument, Common`, `Musical Instrument, Masterwork`) tutun; ya da named varyantları `variantOf: "musical-instrument-common"` gibi işaretleyin ve fife'ı ekleyin.

### 5.2 Export/SRD table ile uyumlu ama JSON'da olmayan satırlar

Eksik:

- `Tool, masterwork`
- Generic musical instrument satırları (yukarıda)
- (İsteğe bağlı) `Everburning torch` ve `Holy water` — bunlar alchemical craft **değildir**; dosya "alchemical" kapsamındaysa hariç tutmak doğru. Dahil edilecekse source/price/weight PHB'den gelir: 110 gp / 25 gp.

## 6. Doğru olanlar

Aşağıdakiler PHB/SRD ile birebir uyumlu:

- 8 alchemical item: fiyat ve ağırlık
  - Acid 10/1, Alchemist's Fire 20/1, Antitoxin 50/—, Smokestick 20/½, Sunrod 2/1, Tanglefoot 50/4, Thunderstone 30/1, Tindertwig 1/—
- `Alchemist’s Lab` 500/40
- Tüm Artisan's Tools varyantları: 5/5 ve 55/5
- Climber's Kit 80/5; Disguise 50/8; Healer's Kit 50/1
- Holly and Mistletoe —/—; Holy symbols 1/— ve 25/1
- Hourglass 25/1; Magnifying Glass 100/—; Scale 2/1; Spell Component Pouch 5/2; Spellbook 15/3
- Waterclock 1000/200
- Named instruments: common 5/3, masterwork 100/3
- Source sayfaları (p.128/p.129) laboratuvarlar ve masterwork tool eksikliği dışında doğru

## 7. Küçük/şema notları

- `id` benzersiz, `schemaVersion: 2` tutarlı.
- `slot: "Slotless"` tüm kayıtlarda uygun.
- `weight: 0` kitaptaki "—" için kabul edilebilir gösterim.
- `description` ve `shortDescription` aynı metni tekrar ediyor; `shortDescription` gerçek kısa özet değil.
- `tags` tutarlı ama `skill-tool-kit` tag'i musical instruments/alchemical için kullanılmıyor (doğru).
- `type: Consumable` alchemical itemler için makul; ancak Antitoxin/Tindertwig/Sunrod tek kullanımlık kabul edilebilir.
- `modifiers` boş string/placeholder yerine ya gerçek bonus ya da boş array/object olmalı.

## 8. Önerilen düzeltme sırası

1. `Laboratory (Homunculus)` ve `Laboratory (Shield Guardian)` kayıtlarını çıkar veya crafting-requirement modeline taşı.
2. `Thieves’ Tools, Masterwork` → **100 gp / 2 lb.**
3. `Tool, masterwork` (50/1) ve generic musical instrument satırlarını ekle veya named listi varyant olarak işaretle; **Fife** ekle.
4. Base aletlerden `Masterwork Only` / +2 modifier'larını sil.
5. `Thieves’ Tools` modifier çelişkisini çöz; base'de bonus yok, masterwork'te +2.
6. Alchemical item açıklamalarını gerçek mekaniklerle doldur (splash damage, saves, duration).
7. `modifiers` tipini tek şemaya indir (object veya array).
8. `Scale` ve `Magnifying Glass` için +2 Appraise modifier ekle.
9. Masterwork açıklama şablonlarını her item için spesifik yap; boş `Grants +  bonus on .` metinlerini kaldır.
10. Düzeltmeden sonra regression kontrolü: 77 (veya yeni sayı) kayıt, cost/weight/source/modifiers/description.

## 9. Genel hüküm

- **Fiyat/ağırlık çekirdeği:** büyük ölçüde doğru (74/77).
- **Kaynak güvenilirliği:** laboratuvar kayıtları ve source etiketi yüzünden bozuk.
- **Mekanik veri:** kullanılabilir değil; placeholder ve çelişkiler var.
- **Dosya, "SRD fiyat listesi" olarak kısmen kullanılabilir; "kural/mekanik referans" olarak kullanılamaz.**
- Düzeltmeler JSON üzerinde madde madde uygulanabilir; bu rapor JSON'u değiştirmez.
