# D&D 3.5e KLASİK A4 BASKI / PDF ŞABLONU DEVİR TESLİM DOKÜMANI (HANDOVER SPECIFICATION)

**Tarih:** 2026-10-25  
**Görev Türü:** Yeni Özellik / Yazdırma Modülü (Print Engine)  
**Hedef:** Mevcut dijital karakter verilerini fiziksel masada oynamaya uygun, mürekkep dostu, kurşun kalemle takibe elverişli klasik D&D 3.5e A4 kâğıdı / PDF formatına dönüştürmek.

---

## 1. MİMARİ KARAR VE YAKLAŞIM

### Neden CSS Paged Media + Standart A4 HTML Şablonu?
1. **A4 vs. Letter Standardı:** Resmi WotC PDF formları Amerikan `Letter` boyutundadır. Türkiye ve Avrupa'da A4 yazıcıya basıldığında kenar boşlukları bozulur veya metinler küçülür. `@page { size: A4; margin: 8mm; }` kuralı ile milimetrik A4 (`210mm x 297mm`) uyumu sağlanır.
2. **Vektörel Netlik & Yazıcı DPI:** Tarayıcının yerel `window.print()` motoru, harici canvas veya raster PDF dönüştürücülerine göre jilet gibi net vektörel yazı ve çizgi çıktısı üretir.
3. **Mürekkep Dostu (Printer-Friendly):** Mevcut koyu tema (dark mode) baskıda mürekkep israfına yol açar. Bu şablon tamamen saf beyaz arka plan, siyah ince kenarlıklar ve klasik D&D tipografisi kullanır.
4. **Taşma Kontrolü (No-Overflow):** Katı PDF formlarındaki karakter limiti kısıtlaması yerine; font boyutları ve satır aralıkları A4 sayfasına sığacak şekilde optimize edilir.

---

## 2. FİZİKSEL MASAÜSTÜ ERGONOMİSİ (PENCIL-FRIENDLY)

Masada oynayan oyuncu dijital ekrandan farklı olarak kağıt üzerinde kurşun kalem ve silgi kullanır:
* **Maksimum Can vs. Mevcut Can:** `Max HP` sistemden dolu gelir; ancak `Mevcut HP`, `Geçici HP` ve `Nonlethal Hasar` alanları masada elle doldurulmak ve silinmek üzere **büyük boş kutucuklar** olarak basılmalıdır.
* **Büyü Slot Takip Kutuları:** Büyücü karakterler için her büyü seviyesinin yanında harcanan büyüleri işaretlemek üzere `[ ] [ ] [ ]` şeklinde kurşun kalemle karalanabilir onay kutucukları yer almalıdır.
* **Durum / Not Çizgileri:** Kâğıdın altında masada anlık notlar almak için boş çizgili not alanı bulunmalıdır.

---

## 3. SAYFA DÜZENİ VE MİZANPAJ (PAGE LAYOUT)

Kâğıt 2 ana sayfa (Büyücüler için 3 sayfa) olarak kurgulanacaktır:

### SAYFA 1: Core Combat & Temel Değerler
1. **Karakter Künyesi:** İsim, Oyuncu, Sınıf & Seviye, Irk, Boyut, Yaş, Cinsiyet, Alignment, Tanrı.
2. **Ability Scores (6 Temel Nitelik):** STR, DEX, CON, INT, WIS, CHA (Score + Modifier + Temp Score/Mod boşluğu).
3. **HP & Savunma:**
   - HP Kutusu (Max HP, Current HP [boş], Subdual/Nonlethal [boş]).
   - AC Bloğu (Total, Touch, Flat-Footed; Armor, Shield, Dex, Size, Natural, Deflection, Misc breakdown).
   - Hasar Azaltma (DR) ve Büyü Direnci (SR) kutucukları.
4. **Kurtarma Atışları (Saves):** Fortitude, Reflex, Will (Base + Ability Mod + Magic + Misc = Total).
5. **Savaş İstatistikleri:** İnisiyatif (Dex + Misc), Hız (Base, Armor), Base Attack Bonus (BAB), Grapple Modifiers.
6. **Saldırılar & Silahlar (Attack Block - En az 4 silah satırı):**
   - Weapon, Attack Bonus, Damage, Critical, Range, Type, Notes / Ammunition tracker `[ ][ ][ ][ ]`.
7. **Zırh ve Koruyucu Eşyalar:** Armor/Protective Item, Type, AC Bonus, Max Dex, Check Penalty, Spell Failure, Weight.

### SAYFA 2: Beceriler (Skills), Feat'ler ve Özel Yetenekler
1. **Beceriler Tablosu (Skills):**
   - Resmi D&D 3.5e alfabetik sıralı tam liste (Appraise'den Wilderness Lore / Survival'a kadar).
   - Sütunlar: Skill Name, Key Ability, Skill Modifier (Total), Ability Mod, Ranks, Misc Mod.
   - Cross-class ve Armor Check Penalty simgeleri.
2. **Feat Listesi:**
   - Adı ve masada anında bakılabilecek 1-2 cümlelik pratik kural/etki özeti (Benefit).
3. **Special Abilities & Racial Traits:**
   - Sınıf yetenekleri (Evasion, Sneak Attack, Turn Undead vb.) ve ırk özellikleri (Darkvision vb.) kategorize edilmiş liste.
4. **Diller (Languages):** Bilinen diller kutusu.

### SAYFA 3: (Opsiyonel / Spellcaster & Geniş Envanter)
*Karakterin büyü yeteneği varsa veya envanteri 1. sayfadaki zırh/silah alanına sığmıyorsa üretilir:*
1. **Büyü Takip Tablosu (Spells by Level):**
   - Seviye 0'dan 9'a kadar: Büyü Seviyesi, Büyü Save DC'si, Günlük Slot Sayısı, Bonus Slotlar, Harcanan Slot Kutucukları `[ ] [ ] [ ]`.
2. **Hazırlanan / Bilinen Büyüler:**
   - Büyü adı, bileşenler (V, S, M), etki menzili, etki süresi, kısa açıklama.
3. **Envanter ve Ekipman Tablosu:**
   - Taşınan eşyalar, lokasyon, adet, ağırlık.
   - Taşıma Kapasitesi Çizelgesi: Light Load, Medium Load, Heavy Load, Lift Over Head, Push/Drag limitleri.
   - Para Kutusu: CP, SP, GP, PP ve Değerli Taşlar.

---

## 4. VERİ BAĞLANTISI (DATA CONTRACT & MAPPING)

Tüm veriler ana uygulamadaki `character_data` nesnesinden ve hesaplanmış motor çıktılarından okunacaktır:

| Kâğıttaki Alan | Veri Kaynağı (`character_data`) |
|---|---|
| İsim, Irk, Sınıf, Seviye | `name`, `race`, `classes`, `level` |
| Temel Nitelikler | `abilities.str`, `abilities.dex`, `abilities.con`, vb. |
| Can Değerleri | `hp.max`, `hp.baseMax`, `hp.current` |
| Zırh Sınıfı | `ac.total`, `ac.touch`, `ac.flatFooted` + alt bileşenler |
| Kurtarma Atışları | `saves.fort.total`, `saves.ref.total`, `saves.will.total` |
| Silahlar | `weapons[]` (name, bonus, dice, crit, range, damageType) |
| Zırh / Kalkan | `protectiveItems[]` veya `inventory[]` (type: Armor/Shield) |
| Beceriler | `skills[]` (name, keyAbility, rank, miscMod, total) |
| Feat'ler | `feats[]` (name, benefit) |
| Özel Yetenekler | `specialAbilities[]` (name, type, benefit) |
| Büyüler | `spellcasting` veya `spells[]` (known, prepared, perDay) |
| Taşıma & Para | `carryingCapacity`, `currency` (gp, sp, cp) |

---

## 5. KATI PROJE KURALLARI (RULES TO ENFORCE)

1. **Zar Simgesi Yasağı (STRICT: NO 🎲 EMOJI):**
   - Projenin hiçbir yerinde U+1F3B2 tavla zarı emojisi kullanılmayacaktır. Tablolarda zarlar sade metin olarak (örn: `1d8+3`, `20/x3`) veya SVG vektör ikonları ile gösterilecektir.
2. **Kopya Dosya Paritesi (Parity):**
   - `index.html` üzerinde yapılacak herhangi bir değişiklikte `webapp/index.html` dosyasının da %100 birebir güncellenmesi zorunludur.
3. **Mevcut UI'a Zarar Vermeme (Non-Destructive):**
   - Yazdırma modu; mevcut dark-mode çalışan masaüstü uygulamasını bozmamalı, ya ayrı bir yazdırma katmanı (`#print-view` + `@media print`) olarak ya da `window.open` ile açılan temiz bir A4 sayfası şeklinde izole edilmelidir.

---

## 6. DİĞER KONUŞMAYA DEVİR İÇİN HAZIR PROMPT

Aşağıdaki yönlendirme metnini yeni konuşma sekmesinde doğrudan ajana göndererek çalışmayı başlatabilirsiniz:

```markdown
Merhaba! Bu oturumda D&D 3.5e Karakter Kâğıdı projemize "Fiziksel Masaüstü için Klasik D&D 3.5e A4 Yazdırma / PDF Çıktısı" modülünü ekleyeceğiz.

Proje kök dizininde yer alan `HANDOVER_CLASSIC_A4_PRINT.md` ve `GEMINI.md` dosyalarını incele.

Özetle Yapılacaklar:
1. `index.html` (ve eşzamanlı `webapp/index.html`) sayfasına "🖨️ Klasik Kâğıt Yazdır (A4 PDF)" butonu eklemek.
2. Butona basıldığında veya yazdırma tetiklendiğinde `character_data` nesnesindeki verileri (statlar, AC breakdown, saves, BAB, silahlar, zırh, beceriler, feat'ler ve büyücü ise sayfa 3 büyü takip föyü) klasik WotC mizanpajına uygun, siyah-beyaz, mürekkep dostu ve kurşun kalemle takibe elverişli (boş HP/Nonlethal kutuları, [ ][ ][ ] büyü slot onay kutuları) A4 CSS şablonu halinde sunup tarayıcının yazdırma/PDF diyaloğunu (`window.print()`) çalıştırmak.
3. Katı kurallara dikkat et: Kesinlikle 🎲 tavla zarı emojisi kullanma; A4 kenar boşluklarını (`page-break-after: always`) tam 2 veya 3 sayfaya sığacak şekilde optimize et; `webapp/` altındaki kopyayı senkronize tut.

Bu doğrultuda kodu planlayıp entegre etmeye başlayabilirsin.
```
