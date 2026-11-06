# Geliştirme Planı (Development Plan)

## 1. Tek Pakette Uygulayacağımız Tam Çözüm Planı

1. **macOS Spotlight Üst-Orta Yüzen Arama Paleti (`top: 10vh`, `640px` Genişlik):** ✅ TAMAMLANDI (`e5a564c`)
   - **Character Profile:** `Race`, `Character Templates`, `Alignment` ve `Deity / Faith` seçicileri dar sütun içinde açılmak yerine ekranın üst-ortasında ferah macOS Spotlight paleti olarak açıldı.
   - **Domain Editor (İşaretlediğin 3 Alan):** `Granted Bonus Feat`, `Active SLA / Power` ve `1–9. Seviye Domain Spells` kutularına tıklandığında da aynı üst-orta macOS Spotlight paleti açılıyor.
2. **0ms Anında Modal Açılışı + Canlı `"⚡ Rule Master AI fetching data..."` Bildirimi:** ✅ TAMAMLANDI (`e5a564c`)
3. **Genel Performans & Dil Temizliği:** ✅ TAMAMLANDI (`e5a564c`)

---

## 2. Diğer Sayfalardaki ve Sekmelerdeki Spotlight Aramalarının Düzeltilmesi

- **2.1 All Spotlights unified at Top-Center (`top: 10vh`, `640px` wide):** Tüm Spotlight arama paletleri üst-ortada (`top: 10vh`, `640px` genişlik) birleştirildi.
- **2.2 Combat Weapon Spotlight searches strictly inside `character.inventory` weapons/shields:** Savaş silahı ve kalkan seçimleri yalnızca karakterin envanterindeki (`character.inventory` / `gearPool`) silah ve kalkanlar arasında arama yapacak şekilde sınırlandırıldı.
- **2.3 Fixed Constants (`Alignment` 3×3 matrix & `Size` 9-step scale) open at Top-Center with 1-click selection and no search bar:** Sabit sabitler (`Alignment` 3x3 matrisi ve `Size` 9 kademeli ölçek) arama çubuğu olmadan, tek tıkla seçim özellikli üst-orta Spotlight paletinde açılıyor.
- **2.4 Buff/Condition Spotlight & Companion Selector upgraded to Top-Center macOS Spotlight:** Buff/Condition Spotlight ve Companion/Familiar/Mount seçicileri üst-orta macOS Spotlight mimarisine yükseltildi.
- **2.5 System-wide unified `"🔮 Rule Master AI"` brand standard:** Sistem genelinde `"Rule Master (AI)"` kalıntıları temizlenerek tek tip `"🔮 Rule Master AI"` marka standardı sağlandı.
