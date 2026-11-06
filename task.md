# Geliştirme Planı (Development Plan)

## 1. Tek Pakette Uygulayacağımız Tam Çözüm Planı

1. **macOS Spotlight Üst-Orta Yüzen Arama Paleti (`top: 10vh`, `640px` Genişlik):**
   - **Character Profile:** `Race`, `Character Templates`, `Alignment` ve `Deity / Faith` seçicileri dar sütun içinde açılmak yerine ekranın üst-ortasında ferah macOS Spotlight paleti olarak açılacak.
   - **Domain Editor (İşaretlediğin 3 Alan):** `Granted Bonus Feat`, `Active SLA / Power` ve `1–9. Seviye Domain Spells` kutularına tıkladığında da aynı üst-orta macOS Spotlight paleti açılacak:
     - İçinde `srd_feats.json` (452 feat), `srd_spells.json` (1.139 büyü — seçilen kutunun seviyesine öncelik vererek) ve standart SLA'lar `<2ms` hızında (`slice(0, 30)`) listelenecek.
     - Veritabanında olanlar **`✓ In DB`**, olmayanlar **`➕ Not in DB — Fetch & Add to Master DB via AI`** rozetiyle görünecek ve tek tıkla Master DB'ye eklenebilecek.
2. **0ms Anında Modal Açılışı + Canlı `"⚡ Rule Master AI fetching data..."` Bildirimi:**
   - 1.591 elemanlı yavaş `<datalist>` kaldırılacak; Deity ve Domain modalları tıkladığın anda **0ms** içinde açılacak ve AI veriyi çekerken modalın üstünde canlı durum çubuğu dönecek.
3. **Genel Performans & Dil Temizliği:**
   - Spell Picker (`char_spells.js`) ve Feat Picker (`char_progression.js`) pencerelerine de dilimleme (`slice`) eklenerek binlerce kartın tek seferde DOM'u dondurması engellenecek.
   - İlk ekran görüntüsünde Human kartında kalan Türkçe `IRKSAL STATLAR:` etiketi `RACIAL ABILITY ADJUSTMENTS:` olarak düzeltilecek.
