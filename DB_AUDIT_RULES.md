# Veri Tabanı Doğruluk Kontrolü Kuralları

Bu belge, aktif veri tabanlarının D&D 3.5e kurallarına uygunluğunu kontrol etme görevinin kurallarını tanımlar. Görev yalnızca raporlama amaçlıdır.

## 1. Kapsam

1. Aşağıdaki 10 aktif veri tabanı kontrol edilir. `srd_index.json` yalnızca kayıt tutarlılığı için incelenir.
2. Sadakat ölçütü D&D 3.5e kurallarıdır.
3. **Hiçbir değişiklik yapılmaz.** `database/`, `srd_index.json` ve `webapp/` dosyalarına dokunulmaz. Dosya yazan `tools/verify_and_sync.js` bu görevde çalıştırılmaz.
4. Bilinçli proje kararları hata sayılmaz: `id` biçimleri, V2 şema alanları, ev kuralları ve yalnızca ifade farkı olan açıklamalar.

| # | Dosya | Kayıt | İçerik |
|---|---|---:|---|
| 1 | `srd_equipment.json` | 1.021 | Silah, zırh, büyülü eşya, teçhizat, efsun, materyal |
| 2 | `mic_compendium.json` | 953 | Magic Item Compendium eşyaları |
| 3 | `srd_spells.json` | 1.114 | 674 Spell, 440 Power |
| 4 | `srd_monsters.json` | 645 | Monster |
| 5 | `srd_feats.json` | 452 | 420 Feat, 32 SpecialAbility |
| 6 | `srd_classes_races.json` | 239 | Class, ClassAbility, Race, RacialTrait |
| 7 | `srd_maneuvers.json` | 208 | 162 Maneuver, 46 Stance |
| 8 | `srd_combat_rules.json` | 96 | Condition, Buff, DamageType |
| 9 | `srd_domains.json` | 36 | Domain |
| 10 | `srd_companions.json` | 45 satır | Yoldaş ilerleme tabloları ve izinli hayvan listeleri |

Kayıt sayıları 2026-11-04 tarihli taramadan alınmıştır. Görev başlarken yeniden doğrulanır.

## 2. Kaynaklar

5. Yalnızca şu kaynaklar kullanılır:
   - https://www.d20srd.org/index.htm
   - https://srd.dndtools.org/
   - `Rule Books/` klasöründeki kitaplar

   Git, Reddit, wiki ve forum verileri dikkate alınmaz.
6. Öncelik sırası:
   - SRD içeriğinde d20srd.org esas alınır.
   - SRD dışı içerikte ilgili kitap esas alınır. Kitap yoksa srd.dndtools.org kullanılır.
7. Kaynaklar çelişirse otomatik çözülmez. Değerler raporda yan yana gösterilir.
8. 3.0 kaynakları 3.5e kanıtı sayılmaz.
9. Kaynakta bulunamayan kayıt hata sayılmaz, "Doğrulanamadı" listesine girer.

### Yerel kitaplar

| Kitap | Kullanım alanı |
|---|---|
| `Players Handbook.pdf` | Sınıf, ırk, feat, büyü, ekipman |
| `Dungeon Masters Guide v3.5.pdf` | Büyülü eşya, zehir, prestige class |
| `Magic Item Compendium.pdf` | `mic_compendium.json` |
| `Spell_Compendium.pdf` | Splatbook büyüleri |
| `Players Handbook II 3.5.pdf` | Ek içerik |
| `DungeonMastersGuideII.pdf` | Ek içerik |
| `Player's Guide To Faerun.pdf` | Ek içerik |
| `Unearthed Arcana.pdf` | İsteğe bağlı kurallar |
| `Tome of Battle - Book of Nine Swords.pdf` | `srd_maneuvers.json` |
| `Tome and Blood.pdf` | 3.0 kitabı olduğu düşünülüyor; pilotta doğrulanana kadar 3.5e kanıtı sayılmaz |

Eksik kitap:

- **Monster Manual:** `srd_monsters.json` yalnızca sitelerle kontrol edilir.

## 3. Kontrol Yöntemi

10. Yalnızca metin değil, motorun kullandığı `modifiers`, `damageParts` ve `ruleFlags` alanları da kontrol edilir.
11. Tür bazlı ana alanlar:

| Tür | Alanlar |
|---|---|
| Silah | Hasar, kritik, ağırlık, fiyat |
| Zırh | AC, Max Dex, Armor Check Penalty, Arcane Spell Failure |
| Büyü | Seviye, okul, süre, menzil, kurtarma, SR |
| Feat | Önkoşullar |
| Sınıf | Base Attack Bonus, kurtarmalar, Hit Die, beceri puanı |
| Canavar | Hit Dice, AC, saldırılar, özel yetenekler |

12. Çalışma sırası:
    1. **Çevrimdışı iç tutarlılık:** Tüm kayıtlarda mükerrerler, kırık `id` referansları, boş zorunlu alanlar ve şema hataları aranır.
    2. **Pilot:** Her veri tabanından örnek alınır, kaynak kapsamı ve hata oranı ölçülür. `Players Handbook.pdf` ve `Tome and Blood.pdf` sürümleri ile PDF'lerin metninin okunup okunmadığı burada kontrol edilir.
    3. **Tam kontrol:** Motoru en çok etkileyen dosyalardan başlanır: sınıflar, feat'ler, silah ve zırhlar, büyüler.
13. Site istekleri yavaş gönderilir ve her sayfa bir kez çekilir.

## 4. Raporlama

14. Her bulguda şu alanlar bulunur:
    - Kayıt `id`'si
    - Dosya
    - Alan
    - Veri tabanındaki değer
    - Kaynaktaki değer
    - Kaynak kanıtı (URL veya kitap ve sayfa no)
    - Önem derecesi
    - Önerilen düzeltme
15. Kanıtı olmayan bulgu rapora girmez. Ezberden kural düzeltmesi yapılmaz.
16. Önem dereceleri:

| Derece | Anlamı |
|---|---|
| Kritik | Hesabı veya kuralı bozan hata |
| Orta | Hesabı etkilemeyen eksik veya yanlış bilgi |
| Düşük | Yazım veya biçim farkı |

17. Rapor repo dışında ayrı bir dosyaya yazılır. Kaynak metinler uzun uzun kopyalanmaz.
