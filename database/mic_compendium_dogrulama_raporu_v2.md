# Magic Item Compendium JSON — Doğrulama Raporu v2

**İncelenen dosya:** `C:\Users\tarum\Documents\antigravity\joyful-fermi\database\mic_compendium.json`  
**Yetkili kaynak:** `G:\Drive'ım\FRP\D&D\Kitap\Magic Item Compendium.pdf` (297 sayfa)  
**Kayıt sayısı:** 953  
**Tarih:** 3 Kasım 2026  
**Önceki rapor:** `mic_compendium_dogrulama_raporu.md` (güncelliğini yitirdi; v2 onun yerine geçer)

> JSON bu incelemede **değiştirilmedi**.

## 1. Sonuç özeti

Önceki raporda işaretlenen hataların büyük bölümü düzeltilmiş durumda. Buna rağmen dosya hâlâ “olduğu gibi” güvenilir bir kural kaynağı değildir. Kalan sorunlar iki gruba ayrılıyor:

| Grup | Adet | Durum |
|---|---:|---|
| Otomatik PDF eşleşmesi | 952 / 953 | `Metamagic Rod, Sculpting` PDF başlığı OCR’da bozuk; önceden elle doğrulandı |
| Birleşik activation kaybı | ~123 | PDF’deki `— and swift (command)` gibi değerler JSON’da `--` ya da eksik |
| Aura: eksik/yanlış school | 5 | Bazıları kısmi, biri (Third Eye Expose) tamamen yanlış |
| Aura: `no` yerine `no school` | 14 | Yazım/normalizasyon hatası |
| Body slot hatası/boşluğu | 8 | 3 yanlış, 5 eksik/belirsiz |
| Cost to create hataları | 6 kayıt | 2 adedi Eternal Wand’ın tablo katmanlarında |
| Eksik prerequisite | 4+ grup | Illusion Theft, Soulstone, Third Eye Dampening, Energy Assault varyantları |
| Tablo tabanlı kayıtlar | 3 | Tek bir `casterLevel`/`priceText` ile modellenemiyor |

## 2. Kritik kalan hatalar

### 2.1 Third Eye Expose — hâlâ yanlış

| Alan | JSON | PDF |
|---|---|---|
| Caster Level | `7` | **15th** |
| Aura | `Moderate; (DC 18) divination` | **Strong; (DC 22) transmutation** |

Fiyat, prerequisite, cost to create ve `Sense Motive 5 ranks` artık doğru. Ancak CL ve aura kitabın 15th / Strong transmutation değerleriyle çelişiyor; JSON açıklamasındaki kapanış stat bloğu da aynı yanlış değerleri tekrarlıyor.

### 2.2 Eternal Wand — tablo kısmen düzeltildi, tam doğru değil

Fiyat ve priceText artık doğru:

`460 gp (3rd) / 820 gp (4th) / 4,420 gp (9th) / 10,900 gp (13th)`

Kalan sorunlar:

| Alan | JSON | PDF |
|---|---|---|
| Cost to Create, 1st | `410 gp, 33 XP, 1 day` | **410 gp, 32 XP, 1 day** |
| Cost to Create, 2nd | `2,210 gp, 177 XP, 5 days` | **2,210 gp, 176 XP, 3 days** |
| Caster Level | Tek değer `1` | Tablo: **1 / 1 / 3 / 5** |

0-level ve 3rd seviye katmanları doğru. `cost: 820` yalnızca 1st seviye fiyatını temsil ediyor; tablo bazlı kayıt tek değerle düzgün modellenemiyor.

### 2.3 Hair Shirt of Suffering

| Alan | JSON | PDF |
|---|---|---|
| Cost to Create | `2,200 gp, 176 XP, 5 days` | **1,700 gp, 136 XP, 4 days** |

Prerequisite artık doğru (`barkskin, cure serious wounds`).

### 2.4 Gloves of Agile Striking

| Alan | JSON | PDF |
|---|---|---|
| Cost to Create | `1,100 gp, 88 XP, 3 days` | **1,100 gp, 84 XP, 3 days** |

### 2.5 Cost to create’te gün sayısı eksik

JSON değerleri gün sayısını içermiyor:

| Eşya | JSON | PDF |
|---|---|---|
| Ghoul Gauntlets | `5,000 gp, 400 XP,` | **…, 10 days.** |
| Lens of the Desert | `10,000 gp, 800 XP,` | **…, 20 days.** |
| Shirt of Ironskin | `7,500 gp, 600 XP,` | **…, 15 days.** |

### 2.6 Aura eksik/yanlış school

| Eşya | JSON | PDF |
|---|---|---|
| Blood Claw Choker | `Strong; (DC 21) necromancy` | **… necromancy and transmutation** |
| Mac-Fuirmidh Cithern | `Faint; (DC 16) conjuration,` | **… conjuration, enchantment** |
| Rod of Cats | `Faint; (DC 17) evocation` | **… evocation and transmutation** |
| Lightning Gauntlets | `Faint; (DC 16) evocation 113` | **`Faint; (DC 16) evocation`** (sayfa no. sızıntısı) |

Ayrıca 14 kayıtta `no` yerine kitabın kullandığı **`no school`** yazılmalı:

`Desperation Chain`, `Metamagic Rod, Chaining`, `Metamagic Rod, Sculpting`, `Metamagic Rod, Substitution`, `Psychic`, `Psychoactive Skin of the Hero`, `Ring of Arcane Might`, `Ring of Master Artifice`, `Ring of Master Artifice, Greater`, `Ring of Master Artifice, Lesser`, `Ring of Nine Lives`, `Third Eye Penetrate`, `Torc of Power Preservation`, `Vest of the Archmagi`.

### 2.7 Body slot

Yanlış:

| Eşya | JSON | PDF |
|---|---|---|
| Crown of Flames | `Shoulders` | **Head** |
| Phoenix Cloak | `None` / item level 18th | **Shoulders** |
| Cognizance Crystal | `-- (held)` | **—** (elde tutmak gerekmiyor, üzerinde taşımak yeterli) |

Eksik/belirsiz:

- `Mind Blade Gauntlet, Lesser`
- `Mind Blade Gauntlet, Greater`
- `Tentacle Rod, Greater`
- `Phoenix Cloak` (yukarıda)

PDF bu kayıtlarda Body Slot satırını ya doğru veriyor ya da hiç vermiyor; JSON’da `bodySlot: null` kalıyor.

`Rings of Force Armor`: JSON `Ring`; PDF **`Ring; see text`** (iki yüzük zorunluluğu). Semantik doğru, metin eksik.

## 3. Activation alanı: sistematik veri kaybı

Kitap, iki modlu eşyalarda şu biçimi kullanır:

`Activation: — and swift (command)`

Bunun anlamı: sürekli etkisi var **ve** ayrıca swift/command ile aktive edilen ikinci bir etkisi var. JSON çoğunlukla yalnızca `--` yazıyor; ikinci modun action type’ı kayboluyor.

- Yaklaşık **120** kayıtta PDF’deki birleşik activation hiç taşınmıyor.
- Açık iki kayıt kayıp:
  - `Shadow Maniple`: JSON `--`, PDF **`Swift (command)`**
  - `Third Eye Dominate`: JSON `--`, PDF **`Standard (mental)`**
- `Runestaff of Conjuration`: JSON `As spell used 10 days.`, PDF **`As spell used`** — fazladan metin.
- `Ring of Mystic Defiance`: JSON `Immediate (command)`, PDF **`Immediate (command) and —`** — eksik.
- `Arrow of Biting`: JSON boş, PDF **`— (ammunition)`**.

Bu, tek bir alan için en geniş hata sınıfı. Örnek düzeltilmesi gerekenler: `Acrobat Boots`, `Belt of Battle`, `Blood Claw Choker`, `Dragondoom Scepter`, `Gauntlets of Destruction`, `Rod of Cats`, `Vest of the Archmagi` vb.

> Not: `modes`, `ruleFlags` veya `charges` bu kaybı telafi etmiyor; activation bilgisi başka alanda saklanmıyor.

## 4. Prerequisite eksikleri

| Eşya/grup | JSON | PDF |
|---|---|---|
| Illusion Theft [Synergy] | Yalnız `Synergy Prerequisite: Illusion bane` | **Craft Magic Arms and Armor, true seeing, dispel magic.** + synergy prerequisite |
| Soulstone | `Craft Wondrous Item, essentia pool` | **Craft Wondrous Item, bind a soulmeld to a chakra, essentia pool.** |
| Third Eye Dampening | `Craft Wondrous Item,` | **Craft Wondrous Item, dispel magic or damp power (CP 82)** |
| Crystal of Energy Assault (11 varyant) | Tek enerji spell’i yazılmış | Kitap: **Melf’s acid arrow, ray of frost, lightning bolt veya fireball; ya da energy bolt (EPH 100)** — varyantlar için alternatifleri de içeriyor |
| Eternal Wand | “creator must be an arcane spellcaster…” ifadesi | PDF: **“the spell contained in the eternal wand”**; JSON’daki ek kısıt kitabın Prerequisites satırında yok |

## 5. Tablo tabanlı kayıtlar — tek değer modeli yetersiz

| Kayıt | Sorun |
|---|---|
| `Eternal Wand` | CL/price/cost-to-create tablosu var; JSON tek değer kullanıyor |
| `Cognizance Crystal` | `casterLevel: 0`; PDF tabloda **1st–17th** CL ve fiyat/cost kademeleri var |
| `Amber Amulet of Vermin` | `casterLevel: 0`; PDF’de vermin’e göre tablo |
| `Cloak of the Salamander, Greater` | `casterLevel: 0`; PDF yalnız “As a cloak of the salamander…” diyerek temel tabloya/statlara atıf yapıyor |

Bunlar için ideal model varyant/kademe tablosu veya en azından `casterLevel: null` + açıklayıcı `requirements`/`priceText` metni olur.

## 6. Küçük/format sorunları

- 6 kayıtta sayı var ama `gp` yok: `Cloak of the Salamander` (`6,000 (10th)`), `Crystal of Return, Lesser`, `Ring of Master Artifice`, `Ring of Master Artifice, Greater`, `Surge Crystal`, `Thorn Pouch`.
- 33 kayıtta kitaptaki `1/2 lb.` doğru okunup `0.5`’e çevrilmiş; karşılaştırma aracının uyarısı sayısal fark değil, biçim farkıdır.
- Tüm 953 açıklamada dosya sonunda `<b>Aura:</b> …` / `Prerequisites:` kapanış bloğu var. Alanlarla tekrarlı; yanlış alanları da açıklamada kopyalıyor. Örneğin Third Eye Expose’ta yanlış CL/aura açıklamada da tekrarlanıyor.
- Türkçe `İ` sorunu ve fiyat metnine açıklama/tablo sızması önceki sürüme göre düzelmiş.

## 7. Önceki rapora göre düzeltilenler

Aşağıdakiler güncel JSON’da doğrulandı:

- `Githborn Talisman` CL/fiyat/prerequisite/cost-to-create
- `Amulet of Catapsi` aura school
- `Dragondoom Scepter` aura
- `Sweeping` aura
- `Censer of the Last Breath [Relic]` aura
- `Bag of Flames` cost/prerequisite
- `Camouflage Paint` cost/prerequisite/ağırlık
- `Ectoplasmic Feedback` prerequisite
- `Gauntlets of Mindfire` cost/prerequisite
- `Gloves of Agile Striking` prerequisite
- `Glyph Seal` prerequisite
- `Hair Shirt of Suffering` prerequisite
- `Mind Blade Gauntlet, Lesser` prerequisite/cost
- `Mindvault` prerequisite
- `Orb of Mental Renewal` prerequisite
- `Rings of Force Armor` prerequisite/cost
- `Runestaff of the Assassin`, `Runestaff of Passage`, `Runestaff of the Artisan` aura/text/cost düzeltmeleri
- `Scepter of the Netherworld` aura/activation
- `Shirt of the Inevitable`, `Shirt of the Moon`, `Shirt of Ironskin` ilgili alanlar
- `Third Eye Concentrate`, `Third Eye Improvisation` ilgili alanlar
- `Weight` kesirleri (`0.5`, `0.25`)
- Türkçe `İ` içeren 17 ad temizlendi
- Fiyat metnine düşmüş açıklama/tablo fragmanları temizlendi
- Açıklama/prerequisite/cost-to-create içine karışmış sayfa numaraları ve komşu eşya metinleri büyük ölçüde temizlendi

## 8. Önerilen düzeltme sırası

1. **Third Eye Expose** CL/aura’yı `15` / `Strong; (DC 22) transmutation` yap.
2. **Eternal Wand** tablo kademelerini ayrı varyantlara ayır veya CL alanını table’a bağlı yap; 32 XP / 176 XP / 3 days değerlerini düzelt.
3. **Activation** alanını PDF’den yeniden üret; `— and swift (command)` gibi birleşik değerleri koru.
4. **No school** normalizasyonunu uygula; eksik school’ları tamamla; `Lightning Gauntlets`’teki `113`’ü sil.
5. **Body slot**: Crown of Flames → Head; Phoenix Cloak → Shoulders; Cognizance Crystal → `—`.
6. **Cost to create** eksik gün sayılarını ve XP/gp değerlerini düzelt.
7. **Prerequisite** eksiklerini tamamla; Energy Assault varyantlarında kitabın alternatif spell listesini kullan.
8. Tablo tabanlı kayıtları `null` + açıklama veya varyant modeliyle temsil et.
9. Açıklamalardaki kapanış stat bloğunu JSON alanlarından yeniden üret veya kaldır; böylece yanlış değerler iki yerde birden tekrarlanmaz.
10. Yeni sürünün tamamına regression test uygula: 953 kayıt, aura/CL/activation/price/cost/bodySlot/weight/prerequisite/cost-to-create.

## 9. Genel hüküm

Güncelleme ile veri kalitesi belirgin şekilde iyileşti; önceki rapordaki hataların büyük kısmı giderildi. Ancak güncel dosya, kural/mekanik kararlar için tek başına referans olarak kullanılmamalı. En kritik kalan sorunlar şunlar: Third Eye Expose, Eternal Wand tablosu, activation’ın sistematik kaybı ve birkaç prerequisite/body-slot hatası. Düzeltmeler JSON üzerinde madde madde uygulanabilir; bu rapor JSON’u değiştirmez.
