# Görev: P4 Class Verisini Bağımsız Kontrol Et (SRD Import P4)

Bu belge, Joyful-Fermi projesinde çalışacak **kontrol ajanı** için hazırlandı. Ana oturum P4'te (base ve prestige class iskeletleri) 267 prestige class'ın sayısal alanlarını kitaplardan okuyup veri dosyalarına işledi. Senin işin bu işi **bağımsız** doğrulamak: kitaplara tekrar bakıp değerleri karşılaştır, uygulamada class seçicilerinin çalıştığını gör ve bulduklarını raporla. Veriyi **düzeltme**; yalnızca raporla.

## 1. Neyi kontrol edeceksin

| Dosya | İçerik |
| :--- | :--- |
| `database/srd_classes_splat.json` | 400 class (3.5 WotC; lazy chunk) |
| `database/srd_classes_legacy.json` | 75 class (3.0 ve lisanslı kitaplar; opt-in chunk) |
| `tools/srd_import/p4_book_verified.json` | Kitaptan okunan 243 prestige class (ham kayıt; `cite` alanı tablo adını verir) |
| `tools/srd_import/p4_conflicts_resolved.json` | Workbook / indeks çelişkisi kitaptan çözülen 24 class |
| `tools/srd_import/p4_classes.py`, `p4_assemble.py` | Verileri üreten betikler |

Kitapla karşılaştırılacak alanlar (class kaydında): `hd`, `skillPointsPerLevel`, `babProgression` (high/medium/low), `savingThrows` (yalnızca 1. seviyede +2 olan save "high"), `maxLevel`, `source` içindeki sayfa (`Kitap p.N`).

Kitap PDF'leri: `G:\Drive'ım\FRP\D&D\Kitap\`. Okuma araçları: `tools/srd_import/pdfq.py` (metin katmanı olan PDF'lerde arama ve sayfa metni) ve `tools/srd_import/pdfimg.py` (taranmış sayfaları PNG'ye çevirir; tabloyu görüntüden oku, küçük yazı için `--clip` ile yakınlaştır). `pdfq.py info <pdf>` metin katmanı olup olmadığını söyler.

## 2. Adımlar

### Adım 1 — Kitap örneklemi (asıl iş)

Aşağıdaki 34 class'ı kitaptaki class tablosundan oku ve kayıttaki değerlerle karşılaştır. İlk 10 satır özel dikkat isteyen class'lar; kalan 24'ü rastgele seçildi (sabit tohum). Kitap tablosunda şunlara bak: "Hit Die", "Skill Points at Each Level", BAB sütunu, 1. seviyedeki Fort/Ref/Will, son seviye satırı.

| Class | Kaynak (kayıttaki) | HD | Skill | BAB | İyi save | Max seviye |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Ectopic Adept | Complete Psionic p.26 | d4 | 2 | low | Will | 5 |
| Hoardstealer | Draconomicon p.130 | d6 | 6 | medium | Ref | 10 |
| Divine Agent | Manual of the Planes p.24 | d8 | 4 | medium | Will | 10 |
| Maiden of Pain | Player's Guide to Faerun p.182 | d6 | 4 | medium | Ref | 10 |
| Disciple of Baalzebul | Book of Vile Darkness p.58 | d6 | 6 | medium | Ref, Will | 10 |
| Disciple of Mammon | Book of Vile Darkness p.60 | d6 | 4 | medium | Ref, Will | 10 |
| Risen Martyr | Book of Exalted Deeds p.68 | d12 | 2 | low | Will | 10 |
| Weapon Master (Kensei) | Oriental Adventures p.53 | d10 | 2 | high | Ref | 10 |
| Hulking Hurler | Complete Warrior p.40 | d10 | 2 | high | Ref | 3 |
| Stoneblessed | Races of Stone p.122 | d8 | 2 | medium | Fort | 3 |
| Master of Radiance | Libris Mortis p.44 | d8 | 4 | medium | Fort, Will | 5 |
| Shadowstriker | Complete Champion p.108 | d10 | 2 | high | Fort, Will | 3 |
| Dawncaller | Races of Stone p.103 | d8 | 6 | high | Ref | 10 |
| Uncanny Trickster | Complete Scoundrel p.67 | d6 | 8 | medium | Ref | 3 |
| Justiciar | Complete Warrior p.47 | d10 | 4 | high | Will | 10 |
| Mountebank | Complete Scoundrel p.57 | d6 | 4 | medium | Ref | 10 |
| Divine Disciple | Player's Guide to Faerun p.51 | d8 | 2 | medium | Fort, Will | 5 |
| Corrupt Avenger | Heroes of Horror p.88 | d12 | 2 | high | Fort | 10 |
| Chaotician | Planar Handbook p.61 | d10 | 4 | high | Ref | 5 |
| Ashworm Dragoon | Sandstorm p.66 | d10 | 2 | high | Fort | 10 |
| Keeper of the Cerulean Sign | Lords of Madness p.194 | d6 | 6 | low | Will | 10 |
| Sacred Warder of Bahamut | Draconomicon p.96 | d10 | 2 | high | Fort, Will | 12 |
| Orc Warlord | Races of Faerun p.184 | d12 | 2 | high | Fort, Will | 5 |
| Flayerspawn Psychic | Complete Psionic p.30 | d6 | 2 | low | Will | 10 |
| Breachgnome | Races of Faerun p.181 | d10 | 2 | high | Ref | 5 |
| Wolflord | Complete Adventurer p.22 | d10 | 4 | high | Fort, Ref | 10 |
| Bloodscaled Fury | Draconomicon p.86 | d12 | 2 | high | Fort | 12 |
| Dweomerkeeper | Complete Divine p.194 | d6 | 2 | low | Will | 10 |
| Primeval | Frostburn p.65 | d10 | 2 | high | Fort | 10 |
| Rimefire Witch | Frostburn p.67 | d6 | 2 | low | Fort, Will | 10 |
| Horselord | Complete Adventurer p.22 | d10 | 4 | high | Fort, Ref | 10 |
| Fiend-Blooded | Heroes of Horror p.102 | d4 | 2 | low | Will | 10 |
| Akodo Champion | Oriental Adventures p.220 | d10 | 4 | high | Fort, Will | 10 |
| Dragon Ascendant | Draconomicon p.90 | d12 | 6 | high | Fort, Ref, Will | 12 |

Özel dikkat gerektirenler (ilk 10 satır):
- **Ectopic Adept, Hoardstealer, Divine Agent, Maiden of Pain:** workbook'tan farklı çıktığı için kitap değeri kullanıldı. Kitabın gerçekten bu değeri verdiğini teyit et.
- **Disciple of Baalzebul ve Disciple of Mammon:** kitapta basılı BAB standart 3/4 ilerlemesinden bir fazla (Baalzebul 9.-10. seviyede +7/+8; Mammon her seviyede). Kayıtta `medium` yazıyor; kitap tablosuyla karşılaştır ve bunun basım farkı mı yoksa okuma hatası mı olduğuna karar ver.
- **Risen Martyr:** tabloda 0. seviye satırı var (Spiritual Body); değerler 1-10. seviyelere göre okundu.
- **Weapon Master (Kensei), Hulking Hurler, Stoneblessed:** sırasıyla farklı yazılışlı ad, 3 seviyelik class ve 3 seviyelik kısa class.

Taranmış kitaplar (metin katmanı yok): Book of Vile Darkness, Tome of Magic, Heroes of Battle, Expanded Psionics Handbook, Complete Warrior, Complete Adventurer, Complete Arcane, Races of Destiny, Races of the Wild, Player's Guide to Faerun, Book of Exalted Deeds, Races of Stone. Bunlarda tabloyu görüntüden oku.

Sayfa numarası: kayıttaki `p.N` class'ın başladığı **basılı** sayfadır; PDF sayfası ile arasında kitaba göre 0-2 kayma vardır. ±1 sapma kabul edilebilir; daha fazlasını raporla.

### Adım 2 — Tutarlılık kontrolleri (betikle, kitap gerekmez)

Aşağıdakileri `py -I -X utf8` ile kısa bir betik yazarak kontrol et (betiği depoya koyma; geçici klasörde tut):
1. Her class'ın `id` ve `name` değeri iki chunk boyunca benzersiz mi? `database/srd_classes_races.json` ve diğer chunk'larla çakışma var mı?
2. `hd` / `hitDie`, `bab` / `babProgression` (1 / 0.75 / 0.5), `fort/ref/will` (good/poor) / `savingThrows` (high/low), `skills` / `skillPointsPerLevel` birbiriyle tutarlı mı?
3. `maxLevel` makul mü (prestige 3-13, base 20, ırk paragon 3)?
4. `edition` doğru chunk'ta mı? `3.0` ve `3.5-licensed` yalnızca legacy chunk'ta, `3.5` yalnızca splat chunk'ta olmalı.
5. `verification` alanı: "verified" olanların `provenance.book` alanı dolu mu? 267 kitaptan-okunan kayıt ile 5 eski (Evangelist, Rainbow Servant, Void Disciple, Moonspeaker, Reforged) birlikte 272 "verified" prestige class olmalı.
6. `p4_book_verified.json` ve `p4_conflicts_resolved.json` içindeki her kaydın değerleri, class kaydındakiyle birebir aynı mı?
7. `classSkills` anahtarları geçerli beceri anahtarı mı (ör. `k_arcana`, `umd`)? Bilinmeyen anahtar var mı?

### Adım 3 — Uygulamada kontrol (opsiyonel ama istenir)

`SRD_IMPORT_P4_HANDOFF.md` adım 7'deki yöntemi izle: depoda `py -I -m http.server 8765 --bind 127.0.0.1`, sonra `http://127.0.0.1:8765/index.html`. Yerel mod kapalıysa tarayıcı konsolunda `localStorage.setItem('dnd35_local_mode','true')` yaz (yalnızca bu test origin'inde). Önbellek için betikleri `fetch(u,{cache:'reload'})` ile yenile. **Karakteri yedekle ve işin sonunda geri yükle; sunucuyu kapat.** Şunlara bak:
- Sayfa açılışında hiçbir class chunk'ı yüklenmiyor (`SrdCompendium.isChunkLoaded('srd_classes_splat.json')` false).
- Seviye atlama / sınıf değiştirme seçicisi açılınca splat chunk yükleniyor; liste 73 + 400 = 473 class gösteriyor ("3.0 & Licensed" kapalıyken).
- "3.0 & Licensed" açılınca legacy chunk geliyor (548 class); kapatınca 75 class gizleniyor (karakterin zaten seviyesi olan class hariç).
- Bir prestige class'ın şart kontrolü (ör. Blackguard: Hide 5 rank) beceri rank'ını doğru okuyor.

## 3. Kurallar

- **Kod ve veri değiştirme.** `database/`, `webapp/`, `character.html`, `*.js`, `index.html`, `tools/srd_import/` altındaki mevcut dosyalar ve iki doğrulanmış JSON olduğu gibi kalacak. Hata bulursan raporla; düzeltmeyi ana oturum yapacak.
- **Tek yeni dosya:** `SRD_IMPORT_P4_REVIEW_REPORT.md` (depo kökünde). Aşağıdaki biçimde yaz.
- **Uydurma yok.** Kitapta okuyamadığını "okunamadı" diye işaretle; tahmin yazma.
- **Telif:** Kitap metnini kopyalama. Raporda yalnızca tablo adı, sayfa ve sayısal değerler yer alsın.
- **Kurulum gerekirse Docker kullan** (bilgisayara doğrudan program kurma). Node için: `docker run --rm -v "C:\Users\tarum\Documents\antigravity\joyful-fermi:/app" -w /app node:lts-slim node <betik>`. Python 3.12 ve PyMuPDF kurulu (`py -I -X utf8 ...`). Taranmış sayfaları metne çevirmek istersen `jitesoft/tesseract-ocr` imajı yerelde var; aynı anda tek OCR işi çalıştır, ikisi birlikte aşırı yavaşlıyor.
- **Git:** `feat/srd-import-p4-classes` branch'inde çalış. Commit, push, merge ve `main`'e dokunma yok; yalnızca kullanıcı isterse.
- `node tools/verify_and_sync.js` dosya yazar ve senkronize eder; bu görevde **çalıştırma** (veriyi değiştirmediğin sürece gerekmiyor).
- Kullanıcıya Türkçe yaz; rapordaki class adları, tablo adları ve alan adları İngilizce kalsın.

## 4. Rapor biçimi (`SRD_IMPORT_P4_REVIEW_REPORT.md`)

1. **Özet:** kaç class kitapla karşılaştırıldı, kaçı uyuştu, kaçında fark var, kaçı okunamadı.
2. **Fark tablosu:** her fark için class, kitap, alan, kayıttaki değer, kitaptaki değer, tablo adı ve sayfa.
3. **Tutarlılık kontrolleri (Adım 2):** her madde için geçti/başarısız ve örnekler.
4. **Uygulama kontrolü (Adım 3):** yapıldıysa sonuçlar; yapılmadıysa nedeni.
5. **Öneri:** ana oturumun düzeltmesi gerekenler; gerekirse hangi kitapların daha geniş örneklenmesi gerektiği.

## 5. Bilinen sınırlar (hata sayma)

- 146 prestige class eklenmedi (kitapları klasörde yok) ve 5 çelişkili class (Marshal, Alchemist Savant, Cave Lord, Shadowcrafter, Yathchol Webrider) dışarıda; bunları kontrol etme.
- Class'ların `features` alanı bilerek boş (`contentLevel: "stub"`); level-by-level özellikler bu fazın kapsamı değil.
- 42 base class "unverified" (tek kaynak); bu görevde kitaptan doğrulamak zorunda değilsin, ama örneklemde denk gelirsen not düş.
- Aynı ada sahip iki class'ta (Samurai, Exemplar) 3.0/lisanslı olan ad sonuna kitap adı alır (ör. "Samurai (Oriental Adventures)"); bu bilerek yapıldı.
