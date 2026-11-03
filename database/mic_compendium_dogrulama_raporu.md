# Magic Item Compendium JSON — Doğrulama Raporu

**İncelenen dosya:** `C:\Users\tarum\Documents\antigravity\joyful-fermi\database\mic_compendium.json`  
**Yetkili kaynak:** `Magic Item Compendium.pdf` (297 sayfa, resmî PDF)  
**Kayıt sayısı:** 953  
**Tarih:** 3 Kasım 2026

## 1. Yöntem ve kapsam

- PDF metni PyMuPDF ile çıkarıldı; 957 yapılandırılmış başlık ayrıştırıldı.
- JSON'daki 953 kaydın tamamı otomatik olarak PDF girdileriyle eşleştirildi.
- 952 kayıt otomatik eşleşti. `Metamagic Rod, Sculpting` OCR başlığı bozuk olduğu için otomatik eşleşmedi; alanları PDF'ten elle doğrulandı ve **doğru** olduğu görüldü.
- Fiyat, caster level, aura, activation, body slot, weight, prerequisites, cost to create ve açıklama metni karşılaştırıldı.
- Düşük benzerlik veren kayıtlar PDF'ten elle kontrol edildi. Bu rapordaki maddeler **elle doğrulanmış** hatalardır; otomatik skordaki diğer düşük benzerliklerin bir kısmı OCR/ayrıştırma gürültüsüdür.

## 2. Genel sonuç

JSON kullanılabilir bir iskelet sunuyor, ancak **olduğu gibi güvenilir bir kural kaynağı değil**. Sorunların büyük kısmı, PDF'in iki sütunlu OCR metninden kaynaklanan sütun karışmasıdır: bir eşyanın alanına komşu eşyanın açıklaması, tablo satırı veya maliyet bilgisi girmiş.

Öne çıkan bulgular:

| Bulgu | Adet |
|---|---:|
| Ağırlık hatası | 34 |
| Fiyat metnine açıklama/tablo sızması | 18 |
| Yanlış/eksik prerequisite | 17 |
| Yanlış cost to create | 12 |
| Aura / caster level hatası | 10 |
| Ciddi açıklama bozulması | 13+ |
| İsimde Türkçe `İ` karakteri | 17 |

> Not: JSON dosyası bu incelemede **değiştirilmedi**.

## 3. Kritik alan hataları

### 3.1. Caster level, aura ve fiyat

| Eşya | Alan | JSON'daki değer | PDF'teki doğru değer |
|---|---|---|---|
| Eternal Wand | Fiyat | 1.500 / 3.000 / 6.000 gp | 460 / 820 / 4.420 / 10.900 gp (0–3. seviye) |
| Eternal Wand | Caster Level | 0 | `See table` (1, 1, 3, 5) |
| Githborn Talisman | Caster Level | 12 | 7 |
| Amulet of Catapsi | Aura | Moderate (DC 19) abjuration | Moderate (DC 19) **enchantment** |
| Dragondoom Scepter | Aura | Moderate (DC 20) | Moderate (DC 20) **evocation** |
| Sweeping | Aura | Faint (DC 17) | Faint (DC 17) **transmutation** |
| Censer of the Last Breath [Relic] | Aura | Moderate (DC 19) abjuration, Strong (DC 22) conjuration | Yalnızca **Strong (DC 22) conjuration** |
| Runestaff of the Assassin | Aura | Strong (DC 21) enchantment + illusion + açıklama metni | Strong (DC 21) **illusion** |
| Runestaff of the Assassin | Activation | `As spell used As spell used` | `As spell used` |
| Runestaff of Passage | Aura | Strong (DC 21) conjuration + necromancy + açıklama metni | Strong (DC 24) **necromancy** |

### 3.2. Cost to create

| Eşya | JSON | PDF |
|---|---|---|
| Bag of Flames | 7.500 gp, 600 XP, 15 gün | **1.750 gp, 140 XP, 4 gün** |
| Camouflage Paint | 4.000 gp (+100 gp mandolin), 320 XP, 8 gün | **750 gp, 60 XP, 2 gün** |
| Dragondodger | 750 gp, 60 XP, 2 gün | **Varies.** |
| Gauntlets of Mindfire | 2.000 gp, 160 XP, 4 gün | **5.500 gp, 440 XP, 11 gün** |
| Githborn Talisman | 4.000 gp, 320 XP, 8 gün | **900 gp, 72 XP, 2 gün** |
| Mind Blade Gauntlet, Lesser | 4.000 gp, 320 XP, 8 gün | **5.000 gp, 400 XP, 10 gün** |
| Rings of Force Armor | 10.500 gp, 840 XP, 21 gün | **15.000 gp, 1.200 XP, 30 gün** |
| Runestaff of the Artisan | 13.000 gp, 1.040 XP, 26 gün | **11.500 gp, 920 XP, 23 gün** |
| Third Eye Concentrate | 1.250 gp, 100 XP, 3 gün | **5.000 gp, 400 XP, 10 gün** |
| Third Eye Expose | 500 gp, 40 XP, 1 gün | **1.250 gp, 100 XP, 3 gün** |
| Third Eye Improvisation | 60.000 gp, 4.800 XP | **500 gp, 40 XP, 1 gün** |
| Shirt of the Moon | 7.500 gp, 600 XP (gün yok) | **7.500 gp, 600 XP, 15 gün** |

### 3.3. Yanlış veya bozulmuş prerequisite'ler

| Eşya | JSON | PDF |
|---|---|---|
| Bag of Flames | `Craft Wondrous Item, calm emotions.` | `Craft Wondrous Item, produce flame, protection from energy, summon nature's ally II.` |
| Camouflage Paint | `Craft Wondrous Item, cure serious wounds, dispel magic, summon monster III, bard.` | `Craft Wondrous Item, disguise self.` |
| Ectoplasmic Feedback | `Craft Magic Arms and Armor, cat's grace.` | `Craft Magic Arms and Armor, ectoplasmic feedback (SC 78).` |
| Gauntlets of Mindfire | `Craft Wondrous Item, Sanctify Relic, righteous might.` | `Craft Wondrous Item, mind poison (SC 141) or mindfire (CP 93).` |
| Githborn Talisman | Bozuk metin: `righdamage rolls against aberrations...` | `Craft Wondrous Item, owl's wisdom, true strike.` |
| Gloves of Agile Striking | Warlock invocation metni | `Craft Wondrous Item, divine agility (SC 69).` |
| Glyph Seal | `greater magic weapon, spiritual weapon` | `Craft Wondrous Item, glyph of warding.` |
| Hair Shirt of Suffering | `barkskin, entangle, goodberry, plant growth, speak with plants, tree shape` | `Craft Wondrous Item, barkskin, cure serious wounds.` |
| Mind Blade Gauntlet, Lesser | `Craft Wondrous Item, Armor, mind blade. magic jar.` | `Craft Magic Arms and Armor, mind blade.` |
| Mindvault | `Craft Wondrous Item, sound burst, bard.` | `Craft Wondrous Item, magic jar.` |
| Orb of Mental Renewal | `daze monster or brain lock (EPH 81)` | `Craft Wondrous Item, lesser restoration.` |
| Rings of Force Armor | `Craft Wondrous Item, magic weapon, wall of force...` | `Forge Ring, mage armor, magic weapon, wall of force.` |
| Runestaff of Passage | `darkness, darkvison, low-light vision (SC 134), summon monster VI` | `Craft Staff, astral projection, dimension door, greater teleport, passwall, phase door.` |
| Scepter of the Netherworld | Tablo metni karışmış | `Craft Rod, turn or rebuke undead.` |
| Shirt of the Inevitable | `Craft Wondrous Item, no activation. righteous might...` | `Craft Wondrous Item, righteous might.` |
| Third Eye Concentrate | `Concentration 10 ranks. Sense Motive 5 ranks.` | Yalnızca `Craft Wondrous Item, Concentration 10 ranks.` |
| Third Eye Expose | `Craft Wondrous Item, guidance.` | `Craft Wondrous Item, Sense Motive 5 ranks.` |

## 4. Ağırlık hataları

PDF'te `1/2 lb.` olan ağırlıklar JSON'a `2` olarak girilmiş. Bu tek başına 32 kaydı etkiliyor. `1/4 lb.` olan `Empowered Spellshard` ise `4` olmuş. Ayrıca `Shirt of the Moon` JSON'da `0`, PDF'te `1 lb.`.

`1/2 lb.` yerine `2` yazılan kayıtlar:

- Blindhelm
- Bracers of Arcane Freedom
- Bracers of Opportunity
- Camouflage Paint
- Cannith Goggles
- Chime of Harmonic Agony
- Crystal Anchor of Alertness
- Crystal Mask of Detection
- Crystal Mask of Discernment
- Crystal Mask of Dread
- Crystal Mask of Insight
- Crystal Mask of Knowledge
- Crystal Mask of Languages
- Crystal Mask of Mindarmor
- Crystal Mask of Psionic Craft
- Crystal Mask of Visual Insight
- Daern's Instant Tent
- Exploding Spike
- Gauntlets of Eldritch Energy
- Gauntlets of Extended Range
- Gauntlets of Mindfire
- Gauntlets of the Blazing Arc
- Gloves of Flame
- Hammersphere
- Meteoric Knife
- Mirror of Suggestion
- Mirror of Time Hop
- Retributive Amulet
- Salve of Minor Spell Resistance
- Sandals of Sprinting
- Sleeping Spike
- Stunning Spike

Ek olarak:

- `Empowered Spellshard`: JSON `4`, PDF `1/4 lb.`
- `Shirt of the Moon`: JSON `0`, PDF `1 lb.`

## 5. Açıklaması bozulmuş kayıtlar

Aşağıdaki kayıtlarda açıklama metni, komşu eşyanın metni veya sayfa/tablo verisiyle karışmıştır. Bu kayıtlar yalnızca biçimsel değil, kural açısından da güvenilmezdir.

| Eşya | Sorun |
|---|---|
| Githborn Talisman | Açıklamaya *Gloves of the Balanced Hand* metni karışmış. |
| Runestaff of Passage | *Runestaff of Night* metni karışmış; büyü listesi ve prerequisite de yanlış. |
| Runestaff of the Artisan | *Runestaff of Cacophony* metni karışmış; cost to create bozulmuş. |
| Third Eye Expose | Yanlış eşyanın açıklaması ve `141` sayfa numarası girmiş. |
| Third Eye Concentrate | *Third Eye Expose* metni karışmış; `Sense Motive 5 ranks` buradan geliyor. |
| Third Eye Improvisation | Fiyat satırına `dominate monster or psionic dominate` sızmış; cost to create bozuk. |
| Shirt of the Inevitable | *Shirt of the Leech* metni karışmış; prerequisite ve cost to create kirlenmiş. |
| Scepter of the Netherworld | Tablo satırları ve *Scrolls of Uncertain Provenance* metni karışmış. |
| Mind Blade Gauntlet, Lesser | *Mindvault* metni araya girmiş. |
| Beetle Elixir | Açıklama/alan karışması tespit edildi. |
| Anchoring | Açıklama/alan karışması tespit edildi. |
| Soulbound, Greater [Synergy] | Açıklama/alan karışması tespit edildi. |
| Watch Lamp | Açıklama `147` sayfa numarasıyla başlıyor. |
| Aberrant Sphere | Cost to create `149` sayfa numarasıyla bitiyor. |

## 6. `priceText` alanına sızan metinler

Bu kayıtlarda fiyat alanının sonuna açıklama veya tablo metni eklenmiş:

- Crystal Mask of Visual Insight
- Daern's Instant Tent
- Essentia Jewel
- Globe of Sunlight
- Gloves of Agile Striking
- Gloves of Eldritch Admixture
- Hand of the Oak Father
- Lens of the Desert
- Retributive Amulet
- Riding Boots
- Ring of Antivenom
- Ring of Arcane Might
- Ring of Entropic Deflection
- Rubicund Frenzy
- Runestaff of Power
- Sleeping Spike
- Third Eye Expose
- Third Eye Improvisation

## 7. İsimlerdeki `İ` sorunu

JSON'da 17 eşya adı, ASCII `I` yerine Türkçe büyük `İ` içeriyor. Bu, arama/eşleştirme ve dışa aktarma açısından sorun çıkarır:

- `Agility, İmproved [Synergy]`
- `Balance, İmproved [Synergy]`
- `Crystal of İllumination, Greater / Least / Lesser`
- `Energy İmmunity`
- `İgnan`
- `İlluminating`
- `İllusion Bane`
- `İllusion Theft [Synergy]`
- `İmpact`
- `İmpaling`
- `İmpedance`
- `İmplacable`
- `İncorporeal Binding [Synergy]`
- `İron Ward Diamond`
- `Stamina, İmproved [Synergy]`

Doğru yazım ASCII `I` iledir: `Improved`, `Illumination`, `Immunity`, `Ignan`, `Illuminating`, `Illusion`, `Impact`, `Impaling`, `Impedance`, `Implacable`, `Incorporeal`, `Iron`.

## 8. Slot adlandırması

JSON'da slot adları kitabın vücut bölgeleriyle birebir aynı değil:

| JSON | Kitap |
|---|---|
| `Neck` | `Throat` |
| `Wrists` | `Arms` |
| `Eyes` | `Face` |
| `Main Hand` / `Slotless` | `— (held)` |

Bu, rastgele bir hata değil; şema tercihi gibi görünüyor. Ancak kitabı birebir referans alan bir veri seti için tutarsızlık oluşturur. Özellikle `— (held)` ile `Slotless` ayrımı kaybolduğu için bazı eşyaların kullanım kuralı yanlış yorumlanabilir.

## 9. Özel durumlar

- **Metamagic Rod, Sculpting:** Otomatik eşleşmedi; bunun nedeni PDF başlığının OCR sırasında bozulması. JSON'daki fiyat, CL, aura, activation, weight, prerequisite ve cost to create değerleri PDF ile uyumlu.
- **Crystal of Illumination (Least/Lesser/Greater):** Fiyat, CL, aura, activation ve cost to create doğru. Tek sorun isimdeki `İ`.
- **Wrapped Tower:** JSON, kitabın ana metniyle uyumlu. Ancak PDF'in sonundaki resmî errata (sayfa 24), `each viewer in front of it` ifadesini `each viewer within 30 feet` olarak değiştiriyor; ayrıca etkinin mind-affecting olduğunu ve shield kullanıcısının bağışık olduğunu ekliyor. JSON errata öncesi metni taşıyor.

## 10. Öneri

1. JSON'u doğrudan düzeltmek yerine önce yeni bir sürüm dalı oluşturun.
2. `priceText`, `requirements`, `costToCreate`, `aura`, `activation` ve `description` alanlarını PDF'ten yeniden üretin; mevcut alanları yalnızca doğrulanmış değerlerle değiştirin.
3. `1/2` ve `1/4` ağırlıklarını sayısal ayrıştırmada `0.5` ve `0.25` olarak tutun.
4. Türkçe `İ` karakterlerini ASCII `I` ile değiştirin.
5. Slot adlarını kitap terimleriyle eşleyin veya şema içinde açık bir eşleme tablosu tutun.
6. `Eternal Wand` gibi tablo tabanlı eşyaları tek kayıt yerine varyantlı modelleyin.
7. `Wrapped Tower` için errata metnini uygulayın.

Bu rapordaki hataların düzeltilmesini isterseniz, JSON'un yeni bir kopyası üzerinde çalışıp değişiklikleri madde madde gösterebilirim.
