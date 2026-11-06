# Geliştirme Planı (Development Plan)

## 1. Tek Pakette Uygulayacağımız Tam Çözüm Planı

1. **macOS Spotlight Üst-Orta Yüzen Arama Paleti (`top: 10vh`, `640px` Genişlik):** ✅ TAMAMLANDI (`e5a564c`)
   - **Character Profile:** `Race`, `Character Templates`, `Alignment` ve `Deity / Faith` seçicileri dar sütun içinde açılmak yerine ekranın üst-ortasında ferah macOS Spotlight paleti olarak açıldı.
   - **Domain Editor (İşaretlediğin 3 Alan):** `Granted Bonus Feat`, `Active SLA / Power` ve `1–9. Seviye Domain Spells` kutularına tıklandığında da aynı üst-orta macOS Spotlight paleti açılıyor:
     - İçinde `srd_feats.json` (452 feat), `srd_spells.json` (1.139 büyü — seçilen kutunun seviyesine öncelik vererek) ve standart SLA'lar `<2ms` hızında (`slice(0, 30)`) listeleniyor.
     - Veritabanında olanlar **`✓ In DB`**, olmayanlar **`➕ Not in DB — Fetch & Add to Master DB via AI`** rozetiyle görünüyor ve tek tıkla Master DB'ye eklenebiliyor.
2. **0ms Anında Modal Açılışı + Canlı `"⚡ Rule Master AI fetching data..."` Bildirimi:** ✅ TAMAMLANDI (`e5a564c`)
   - 1.591 elemanlı yavaş `<datalist>` kaldırıldı; Deity ve Domain modalları tıklandığı anda **0ms** içinde açılıyor ve AI veriyi çekerken modalın üstünde canlı durum çubuğu dönüyor.
3. **Genel Performans & Dil Temizliği:** ✅ TAMAMLANDI (`e5a564c`)
   - Spell Picker (`char_spells.js`) ve Feat Picker (`char_progression.js`) pencerelerine de dilimleme (`slice`) eklenerek binlerce kartın tek seferde DOM'u dondurması engellendi.
   - İlk ekran görüntüsünde Human kartında kalan Türkçe `IRKSAL STATLAR:` etiketi `RACIAL ABILITY ADJUSTMENTS:` olarak düzeltildi.

---

## 2. Diğer Sayfalardaki ve Sekmelerdeki Spotlight Aramalarının Düzeltilmesi

- **2.1 Combat Weapon Spotlight:** Envanter ve kuşatılmış silah/zırh seçimlerinde macOS Spotlight arama paleti entegrasyonu.
- **2.2 Buff & Condition Spotlight:** Anlık durum, buff ve debuff ekleme ekranlarında hızlı arama paleti.
- **2.3 Companion / Familiar / Mount Spotlight:** Hayvan dostlar, yoldaşlar ve binek ekleme modüllerinde Spotlight arama arayüzü.
- **2.4 Progression & Spells Pickers:** Sınıf yetenekleri, yetenek ağacı ve büyü hazırlama ekranlarında tam kapsamlı Spotlight optimizasyonu.
