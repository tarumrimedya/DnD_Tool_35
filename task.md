# D&D 3.5e Prototip & Geliştirme İş Planı (Work Plan & Roadmap)

> **Proje Stratejisi & Prensibi:**
> Google E-Tablo projemiz ana **PROTOTİP** platformumuzdur. Tüm kural motoru, D&D 3.5e RAW hesaplamaları, sayfa ilişkileri, formüller ve veri mantığı burada inşa edilip test edilecektir. Arayüz süslemelerinden ziyade temel mekanik ve işleyiş doğruluğuna odaklanılmaktadır.
> Prototip aşamaları eksiksiz tamamlandıktan sonra tüm sistem standalone Web platformuna aktarılacaktır.

---

## 🏗️ PROTOTİP AŞAMALARI (Google Sheets Üzerinde Mantık & İşleyiş)

### Phase 1: Veri Mimarisi & Sayfalar Arası İlişki Haritası (`Master_DB`) ✅
- [x] 31 Sütunlu Master Veritabanı şeması ve Combat Taxonomy (Silah, Zırh, Eşya, Feat, Manevra, Büyü, Irk).
- [x] Key-Value JSON tabanlı satır normalizasyonu ve kaymaları önleme.
- [x] Temel D&D 3.5e ırkları ve yetenek tohumları.

### Phase 2: Seviye İlerleme & Karakter Motoru (`lvl_up`) ✅
- [x] 30 Seviye ilerleme matrisi (HD, HP, BAB, Saves, Skill Points, Ability Boost).
- [x] Fractional BAB/Saves (Unearthed Arcana) seçeneği.
- [x] Dinamik Roster tablosu (Feats & Abilities, kategorik küçülen dropdown'lar).
- [x] AI Level-Up Copilot (Seviye atlama ve sınıf yeteneklerinin otomatik işlenmesi).
- [x] 3 Üst Özet Kartı (Primary Caster, Secondary Caster, Martial Adept) ve RAW Büyü/Manevra Matrisi.

### Phase 3: Envanter & Eşya Yönetimi (`inventory`) ✅
- [x] 14 Vücut Yuvası ve 75 satırlık dinamik envanter havuzu.
- [x] `Master_DB` üzerinden dinamik eşya bilgisi çekme (açıklama, ağırlık, değer).
- [x] D&D 3.5e RAW Stacking Motoru (Enhancement bonuslarının en yükseğini alma).
- [x] Taşıma kapasitesi, STR limitleri, zırh kontrol cezaları ve servet tablosu.
- [x] Adet (Qty) ve Savaşa Hazır Kemer (`⚔️ Belt / Ready`) bayrağı.

### Phase 4: Büyü ve Manevra Hazırlık Sistemi (`spells_maneuvers`) ✅
- [x] 0-9 Seviye Günlük Hazırlanan Büyüler (DC, okul, süre, menzil ve `Cast?` takibi).
- [x] Tome of Battle Kuşanılan Manevralar (`Expended?` ve `🔄 Recover All`).
- [x] Bilinen Büyüler ve Manevra Kütüphanesi.

### Phase 5: Taktik Savaş Kokpiti (`combat`) 🔄
- [x] 4 Bloklu Savaş Kokpiti: Vitals (HP, AC, Saveler), Offense, Defense, Utility.
- [x] 5 Silah yuvası, iteratif saldırılar (+16/+11/+6/+1), hasar ve kritik formülleri.
- [x] Taktik modlar: Power Attack (`C18`), Combat Expertise (`C29`), Flanking, Charge.
- [x] Kritik Onay (Critical Confirmation) isteğe bağlı açma/kapatma tiki.
- [x] Savaş sayfasından dummy verilerin temizlenmesi; feat/büyü/stance'e göre dinamik besleme.
- [x] Dodge feat'inin `🥋 REACTION COUNTERS` alanına deterministik yönlendirilmesi.
- [x] **Mükerrerlik Çözümü:** Kemere takılı (`Belt / Ready = TRUE`) iksirlerin sadece `🎒 BELT QUICK-BAR` altında listelenmesi; `🕊️ HEALING & MOBILITY` tablosuna mükerrer yazılmaması.
- [x] **🪄 Wand (Değnek) Şarj Takibi:** Adet yerine `Charges Left: 50 ➔ 49 ➔ ... ➔ 0` sayacı.
- [x] **🎯 Temas Saldırısı (Touch Attack) & Işın Kritikleri:** `1d20 + BAB + DEX` vs Touch AC; Ray büyüleri için Doğal 20 = x2 kritik hasar.
- [x] **🛡️ Arcane Spell Failure (ASF) & Homebrew Boon:** Varsayılan d100 ASF kontrolü + Karakter Boon / Ev kuralı açma-kapama tiki (`[x] Ignore ASF`).
- [x] **🧘 Stance (Duruş) Seçici & Dinamik Aura:** Seçilen stance'e göre anlık stat modifikasyonu (Punishing Stance +1d6 hasar, Leading the Charge hücum hasarı).
- [x] **⏳ Short Rest (Kısa Dinlenme / Karşılaşma Sıfırlama):** Tüm manevraları (ToB) ve encounter bazlı yetenekleri (Warlock / Martial Adept / Dragonfire Adept) tek tıkla tazeleme.
- [x] **🏹 Offense İçi Menzilli Taktik Modları:** Saldırı bloğunun içinde doğrudan `[x] <30 ft Point Blank Shot (+1/+1)`, `[x] Rapid Shot (-2 Atk, +1 Ok)` ve `[x] Shooting into Melee (-4)`.
- [x] **⚡ Fırsat Saldırısı (AoO) Sayacı & Zarı:** Canlı `AoO Kalan: [1+DEX]` sayacı.
- [ ] **Vancian (Wizard) vs Spontaneous (Sorcerer) Tüketim Motoru & Büyü Slot HUD'ı:**
  - Wizard: `spells_maneuvers` ezber satırının otomatik `Cast?` yapılması (kodlandı, test ediliyor).
  - Sorcerer: Seviye bazlı `Daily Spell Pool` havuzundan 1 slot eksiltilmesi.
- [ ] **⚡ Metamagic Slot Yükseltme:** Empower (+2 slot), Maximize (+3 slot) veya üst seviye slot harcama.
- [ ] **☀️/💀 Cleric Spontaneous Conversion:** Hazırlanan büyüyü tek tıkla seviyesine uygun *Cure* veya *Inflict / Wound* büyüsüne dönüştürme.
- [ ] **🤼 Özel Muharebe Manevraları Paneli:** Trip (Çelme), Disarm (Silahsızlandırma), Grapple (Güreş), Sunder (Parçalama) zarları ve dinamik BAB + STR + Boyut hesaplayıcı.
- [ ] **🗡️🗡️ Çift Silahla Dövüş (TWF Dual Attack):** Birincil (1.0x STR) ve İkincil el (0.5x STR) silahlarının eşzamanlı tam saldırı kombinasyonu.
- [ ] **🧠 Konsantrasyon & Beceri Kontrolleri:** `Main` sayfası tamamlandıktan sonra savaş kokpitine bağlanmak üzere beklemeye alındı (Phase 7 sonrasına rezerve).

### Phase 6: Güvenli Veri & Senkronizasyon Altyapısı ✅
- [x] 2 Aşamalı Güvenli Sıfırlama (`SIFIRLA` doğrulamalı).
- [x] JSON Dışa Aktarma (Export) ve İçe Aktarma (Import).
- [x] Katı izolasyon: Kod geliştirmeleri yalnızca `Code_Development.gs` üzerinde yürütülür; kullanıcı açık talimat vermedikçe `Code_Production.gs` ve `Code.gs` eşitlenmez.

### Phase 7: Ana Karakter Sayfası & Nihai Prototip Entegrasyonu (`Main`) ⏳
- [ ] `Main` sayfasındaki tüm hücrelerin `lvl_up`, `inventory`, `spells_maneuvers` ve `combat` sayfalarıyla tam formül bağı.
- [ ] Yetenek kontrolleri (Skills), genel istatistikler ve son kural tutarlılık kontrolleri.
- [ ] Tüm prototip mekaniklerinin uçtan uca doğrulanması.

---

## 🌐 NİHAİ ADIM: WEB'E AKTARIM (Final Step - Web Migration & Release)

### Phase 8: Prototip Mantığının Standalone Web Uygulamasına Aktarılması 🚀
*(Google Sheets prototipindeki tüm kural motoru, veri yapıları ve işleyiş tamamlandıktan sonra devreye girecektir)*

- [ ] **Mekanik & Mantık Aktarımı:** Google Sheets üzerinde test edilip olgunlaştırılan tüm formüllerin, RAW istifleme kurallarının, dinamik filtrelerin ve savaş algoritmalarının web uygulamasına (`webapp/`) birebir aktarılması.
- [ ] **Veri Entegrasyonu:** Karakter JSON şeması ve Master DB JSON yapısının tam uyumu; Sheets'ten dışa aktarılan JSON'ın webde sıfır kayıpla açılması ve işlenmesi.
- [ ] **Web UI/UX Geliştirmesi:** Mobil ve masaüstü için optimize edilmiş, esnek, modern karanlık arayüz geliştirmeleri (PWA desteği, dokunmatik kontroller, hızlı kısayollar).
- [ ] **Canlı Dağıtım / Google Drive Web App:** Kullanıcının ihtiyacına göre Google Drive / Google Apps Script Web App veya lokal offline web sayfası olarak nihai yayına alınması.
