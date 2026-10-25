# 📜 D&D 3.5e SRD Core Katalog Denetim & Doğrulama Rehberi
> **Hedef Dosya:** `srd_core_catalog.json`  
> **Dosya Amacı:** D&D 3.5e RAW (Rules As Written) temel silah, zırh, kalkan ve savaş feat'lerinin statik ve hatasız "Ghost Core" veri tabanı.  
> **Denetçi Rolü:** D&D 3.5e Baş Kural Hakemi (Rules Lawyer) & JSON Veri Mimarı.

---

## 🤖 Denetçi Yapay Zekaya (AI) Yönlendirme Talimatı
Aşağıdaki metni ve `srd_core_catalog.json` dosyasını kontrol yapacak yapay zekaya doğrudan yapıştırabilirsiniz:

```text
Sen dünyaca ünlü bir D&D 3.5e RAW (Rules As Written) Baş Kural Hakemi ve Kıdemli Veri Mimarı rolündesin.
Görevin, ekte/aşağıda sunulan `srd_core_catalog.json` dosyasını resmi Wizards of the Coast D&D 3.5e Player's Handbook (PHB v.3.5) ve d20 SRD kurallarına göre satır satır denetlemektir.

Lütfen aşağıdaki denetim kriterlerini tavizsiz uygulayarak bulgularını BELİRTİLEN STANDART FORMATTA raporla.
```

---

## 🔍 Denetim Kontrol Noktaları (Audit Checkpoints)

### 1. D&D 3.5e RAW Kural Uyumu
- **Silahlar (Weapons):**
  - Hasar zarları (`dice`), kritik aralıkları (`critMin`), kritik çarpanları (`critMult`) ve hasar türleri (`dmgType`) PHB Tablo 7-5 ile tam uyuşuyor mu?
  - Finesse silahlar (`isLight: true` veya `tags: ["finessable"]`, Rapier, Spiked Chain, Whip vb.) doğru etiketlenmiş mi?
  - Menzil kademeleri (`range`), mühimmat türleri (`ammoType`: arrow, bolt, bullet, sling, needle) ve fırlatılabilir silahlar (`thrown`) doğru mu?
  - Ağırlıklar (`weight` lb) ve fiyatlar (`cost` gp) resmi SRD ile örtüşüyor mu?
- **Zırhlar (Armor) & Kalkanlar (Shields):**
  - Zırh sınıfı bonusları (`acBonus`), Maksimum Dex (`maxDex`), Zırh Kontrol Cezası (`checkPenalty` - ACP), Büyü Başarısızlığı (`spellFailure` - ASF) ve Hız değerleri (`speed30`, `speed20`) PHB Tablo 7-6 ile birebir uyuşuyor mu?
  - Kalkan vurma (shield bash) zarları ve Tower Shield kısıtlamaları (atak cezası -2, siper kuralı) doğru işlenmiş mi?
- **Dövüş Feat'leri (Combat Feats):**
  - Ön koşullar (`prereq`: Str 13, Dex 15, BAB +1 vb.) ve kurallar PHB Bölüm 5'e uygun mu?
  - Aksiyon türleri (`actionType`: Passive, Standard, Full-Round, Free, Immediate) RAW kurallarına sadık mı?

### 2. Çoklu Mod & Çift Başlı Silahlar (Parent - Child Hiyerarşisi)
Aşağıdaki silahların ana ve alt modlarının parent-child ilişkisini kontrol et:
- `Quarterstaff` $\rightarrow$ `↳ Quarterstaff (Off-Hand Head)`
- `Lance` $\rightarrow$ `↳ Lance (Mounted One-Handed)`
- `Bastard Sword (One-Handed Exotic)` $\rightarrow$ `↳ Bastard Sword (Two-Handed Martial)`
- `Dwarven Waraxe (One-Handed Exotic)` $\rightarrow$ `↳ Dwarven Waraxe (Two-Handed Martial)`
- `Orc Double Axe` $\rightarrow$ `↳ Orc Double Axe (Off-Hand Head)`
- `Dire Flail` $\rightarrow$ `↳ Dire Flail (Off-Hand Head)`
- `Gnome Hooked Hammer` $\rightarrow$ `↳ Gnome Hooked Hammer (Pick Off-Hand)`
- `Two-Bladed Sword` $\rightarrow$ `↳ Two-Bladed Sword (Off-Hand Head)`
- `Dwarven Urgrosh` $\rightarrow$ `↳ Dwarven Urgrosh (Spear Off-Hand)`
*Kriter:* İkincil başların/modların `name` alanı `↳ ` (U+21B3) simgesiyle başlamalı, `parent` alanı ana silahın adı olmalı ve `slot: "Off-Hand"`, `isLight: true` olmalıdır.

### 3. Deklaratif Kural Bayrakları (`ruleFlags`)
- `reach: true` (Longspear, Glaive, Guisarme, Lance, Ranseur, Spiked Chain, Whip)
- `trip: true` (Sickle, Flail, Guisarme, Halberd, Scythe, Kama, Spiked Chain, Dire Flail, Gnome Hooked Hammer, Bolas)
- `disarmBonus: 2` veya `4` (Flail, Ranseur, Nunchaku, Sai, Spiked Chain, Dire Flail)
- `brace: true` (Longspear, Spear, Trident, Halberd, Dwarven Urgrosh)
- `doubleWeapon: true` ve `doubleWeaponOffHand: true` bayrakları.

### 4. Katı Kodlama & Kalite Standartları
- **Sıfır Tavla Zarı Emojisi:** Dosyanın hiçbir yerinde standart 6 yüzlü zar emojisi (`🎲` / `U+1F3B2`) OLMAMALIDIR.
- **Sıfır Uydurma / Dummy Veri:** Bütün değerler resmi 3.5e SRD kaynaklı olmalıdır.
- **Karakter Kodlaması:** `↳` alt dal simgeleri saf UTF-8 olmalı, bozuk karakter (`â†³` vb.) barındırmamalıdır.

---

## 📋 İstenen Standart Rapor Formatı (Standard Output Template)

Denetçi yapay zekanın raporunu aşağıdaki şablona sadık kalarak sunması gerekmektedir:

```markdown
# 🛡️ D&D 3.5e RAW SRD Katalog Denetim Raporu

### 1. Yönetici Özeti (Executive Summary)
- **Denetlenen Toplam Öğe:** [Sayı] (Silah: [X], Zırh: [Y], Kalkan: [Z], Feat: [W])
- **RAW Uyumluluk Skoru:** [% 0 - 100]
- **Kritik Hata Sayısı:** [0 veya Sayı]
- **Şema & Bayrak Uyarısı:** [0 veya Sayı]
- **Nihai Karar:** [PASSED / ACTION_REQUIRED]

---

### 2. Tespit Edilen Kritik Hatalar (RAW Çelişkileri)
*(Eğer varsa; hatalı öğe adı, beklenen RAW değeri, dosyadaki değer ve referans PHB sayfası)*
- **Örnek:** `[Öğe Adı]` | Alan: `dice` | Dosyada: `1d6` | Olması Gereken: `1d8` (PHB p.116)
*(Hata yoksa: "Herhangi bir RAW çelişkisi tespit edilmemiştir.")*

---

### 3. Parent-Child & Çoklu Mod Analizi
- Hiyerarşik bağların (`parent`, `↳ ` simgesi, slot ve light bayrakları) doğrulanma durumu.

---

### 4. Deklaratif Bayraklar (`ruleFlags`) ve Ergonomi İncelemesi
- Reach, trip, disarm, brace gibi taktiksel mekaniklerin eksiksizliği.

---

### 5. Özel Kural ve Standart Denetimi
- [x / -] Tavla zarı emojisi (🎲 / U+1F3B2) bulunmama durumu.
- [x / -] Dummy / test kalıntısı veri bulunmama durumu.
- [x / -] UTF-8 karakter bütünlüğü.

---

### 6. İyileştirme Önerileri & Ek Notlar
*(Varsa veri tabanını daha da zenginleştirebilecek yapıcı tavsiyeler)*
```
