# Görev: 389 Prestige Class'ın İskeletini Kitaplardan Doğrula (SRD Import P4)

Bu belge, Joyful-Fermi projesinde çalışacak ajan için hazırlandı. Ana oturum P4'ü (base ve prestige class iskeletleri) yürütüyor. Bu iş ondan ayrılmış, yalnızca veri doğrulayan bir parçadır.

## 1. Amaç

Builder workbook'ta bulunan, ama ikinci kaynakta (crystalkeep 3.5 Prestige Class index) hiç geçmeyen **389 prestige class** var. Bunların sayısal iskeleti şu an tek kaynaklı ve **max seviyeleri bilinmiyor**. Görevin, her birini kullanıcının kitaplarından kontrol edip sonucu tek bir JSON dosyasına yazmak.

Her class için kitaptaki class tablosundan şunları oku:

| Alan | Kitaptaki yeri |
| :--- | :--- |
| `hd` | "Hit Die: dX" |
| `skillPts` | "Skill Points at Each Level: N + Int modifier" |
| `bab` | Base Attack Bonus sütunu: `high` (+1/seviye), `medium` (3/4), `low` (1/2) |
| `goodSaves` | 1. seviyede +2 olan save'ler (`fort`, `ref`, `will`) |
| `maxLevel` | Tablonun son satırı (3, 5, 10; bazen 7, 12, 13 gibi değerler de doğru olabilir) |
| `page` | Class'ın başladığı basılı sayfa (PDF sayfa numarası değil) |

**İkinci (isteğe bağlı) görev:** `p4_conflicts.json`'daki 29 çelişkiyi de aynı yöntemle çöz. Bunlarda workbook ile indeks HD, skill, BAB veya save'lerde ayrışıyor. Şimdiye kadar kitapla kontrol edilen 11 çelişkinin hepsinde workbook doğru çıktı, indeks yanlıştı. Yine de her birini kitaptan oku; varsayım yapma.

## 2. Girdiler

| Dosya | İçerik |
| :--- | :--- |
| `C:\Users\tarum\Documents\antigravity\srd_import_inputs\p4_report.json` | `skipped["prestige without index entry"]`: 389 class, `"Ad (Kitap)"` biçiminde |
| `...\srd_import_inputs\hf_extracted.json` | Workbook çıktısı. `classes[]`: `name, section, hd, skillPts, bab, fort, ref, will, src, prereq, classSkills` |
| `...\srd_import_inputs\p4_conflicts.json` | 29 çelişki: workbook değerleri ve indeks değerleri yan yana |
| `...\srd_import_inputs\clsidx.json` | Ayrıştırılmış crystalkeep indeksi (karşılaştırma için) |
| `G:\Drive'ım\FRP\D&D\Kitap\` | Kullanıcının kitap PDF'leri |

Kitap okuma araçları depoda:
- `tools/srd_import/pdfq.py` — metin katmanı olan PDF'lerde arama (`search <pdf> <regex> [bağlam] [adet]`), sayfa yazdırma (`pages <pdf> <ilk> <son>`) ve bilgi (`info <pdf>`; örnek sayfaların karakter sayısı 0 ise PDF taranmış görüntüdür).
- `tools/srd_import/pdfimg.py` — taranmış sayfaları PNG'ye çevirir: `pdfimg.py <pdf> <çıktı klasörü> <sayfa> [--zoom=0.75] [--clip=x0,y0,x1,y1]`. Tabloyu görüntüden oku; küçük yazı için `--clip` ile yakınlaştır.

İpuçları:
- Workbook'taki `section` alanı kitap adını verir ("Prestige Classes Complete Warrior" gibi).
- Basılı sayfa ile PDF sayfası arasında kitaba göre sabit bir kayma vardır; kitabın içindekiler sayfasından class sayfasını bul, sonra kaymayı bir kez ölçüp kullan.
- Bazı kitaplarda tablo başlığı "Table 2–10: The Evangelist" biçimindedir; metin katmanı varsa önce bunu ara.

## 3. Çıktı

Tek dosya: `tools/srd_import/p4_book_verified.json` — bir dizi; her class için bir kayıt:

```json
{
  "name": "Evangelist",
  "book": "Complete Divine",
  "page": 39,
  "hd": 6, "skillPts": 6, "bab": "medium", "goodSaves": ["will"], "maxLevel": 5,
  "status": "verified",
  "cite": "Complete Divine Table 2-10 (d6, 6 + Int, BAB +0/+1/+2/+3/+3, good Will, 5 levels)",
  "workbookAgrees": true,
  "note": ""
}
```

`status` değerleri:
- `verified` — tablo kitaptan okundu, tüm alanlar dolu.
- `book-missing` — kitap `Kitap` klasöründe yok (örneğin *Underdark*, *Magic of Eberron*, *Miniatures Handbook*). Sayısal alanları `null` bırak.
- `not-found` — kitap var ama class bulunamadı (farklı ad, ek kitap vb.). `note` alanına ne denediğini yaz.
- `unreadable` — sayfa okunamayacak kadar bozuk.

`workbookAgrees`: kitaptaki HD, skill, BAB ve save'ler workbook ile aynıysa `true`. Değilse `false` ve `note` alanına farkı yaz.

İş bitince kısa bir özet ver: kaç `verified`, kaç `book-missing`, kaç `not-found`, kaçında workbook yanlış çıktı.

## 4. Kurallar

- **Yalnızca bu dosyayı oluştur.** `database/`, `webapp/`, `character.html`, uygulama kodu (`*.js`, `index.html`) ve `tools/srd_import/` altındaki mevcut betikler değişmeyecek. Veriyi ana oturum `p4_classes.py` üzerinden ekleyecek.
- **Uydurma veri yok.** Kitapta okumadığın bir değeri yazma; emin değilsen `status` ile işaretle.
- **Telif:** Kitap metnini kopyalama. `cite` ve `note` alanlarına yalnızca tablo adı, sayfa ve sayısal değerler yaz.
- **Dragon Magazine** ve **Wizards online** içeriği kapsam dışı (zaten listede değiller).
- **Kurulum gerekirse Docker kullan.** Bilgisayara doğrudan program kurma. Gerekli bir araç (Node, OCR motoru vb.) varsa Docker konteyneri içinde çalıştır. Node için:
  `docker run --rm -v "C:\Users\tarum\Documents\antigravity\joyful-fermi:/app" -w /app node:lts-slim node <betik>`
  Python 3.12 ve PyMuPDF bilgisayarda zaten kurulu (`py -I ...`); bunlar için ek kurulum gerekmez.
- **Git:** Yalnızca `feat/srd-import-p4-classes` branch'inde ya da ondan açılmış bir branch'te çalış. Commit yalnızca kullanıcı isterse; `main`'e asla dokunma ve push yapma.
- Kullanıcıya Türkçe yaz.

## 5. Tamamlanma Ölçütü

- 389 class'ın her biri `p4_book_verified.json`'da tam olarak bir kez var.
- (İsteğe bağlı) 29 çelişkinin her biri de aynı dosyada var ve `note` alanında çelişki çözümü yazıyor.
- Her `verified` kaydında `hd`, `skillPts`, `bab`, `goodSaves`, `maxLevel`, `page` ve `cite` dolu.
- `py -I -c "import json; json.load(open('tools/srd_import/p4_book_verified.json', encoding='utf-8'))"` hatasız çalışıyor.

## Ek: 389 Class (Kitaba Göre)

- **Oriental Adventures** (22): Akodo Champion, Battle Maiden, Bayushi Deceiver, Blade Dancer, Daidoji Bodyguard, Eunuch Warlock, Henshin Mystic, Hida Defender, Iaijutsu Master, Kishi Charger, Mantis Mercenary, Mirumoto Niten Master, Moto Avenger, Ninja Spy, Shadow Scout, Shapeshifter, Shiba Protector, Shintao Monk, Singh Rager, Weapon Master (Kensei), Witch Hunter, Yakuza
- **Faiths and Pantheons** (18): Arachne, Auspician, Doomguide, Dreadmaster, Elemental Archon, Forest Master, Goldeye, Heartwarder, Horned Harbinger, Nightcloak, Ocular Adept, Silverstar, Strifeleader, Sword Dancer, Techsmith, Waveservant, Wearer of Purple, Windwalker
- **Draconomicon** (18): Bloodscaled Fury, Disciple of Ashardalon, Dispassionate Watcher of Chronepsis, Dracolyte, Dragon Ascendant, Dragonkith, Dragonrider, Dragonslayer, Dragonsong Lyrist, Dragonstalker, Elemental Master, Hidecarved Dragon, Hoardstealer, Initiate of the Draconic Mysteries, Platinum Knight, Sacred Warder of Bahamut, Talon of Tiamat, Unholy Ravager of Tiamat
- **Book of Vile Darkness** (17): Cancer Mage, Demonologist, Diabolist, Disciple of Asmodeus, Disciple of Baalzebul, Disciple of Dispater, Disciple of Mammon, Disciple of Mephistopheles, Lifedrinker, Mortal Hunter, Soul Eater, Thrall Of Demogorgon, Thrall Of Graz'zt, Thrall Of Juiblex, Thrall of Orcus, Vermin Lord, Warrior Of Darkness
- **Complete Scoundrel** (13): Avenging Executioner, Battle Trickster, Cloaked Dancer, Combat Trapsmith, Fortune's Friend, Gray Guard, Magical Trickster, Malconvoker, Master of Masks, Mountebank, Psibond Agent, Spellwarp Sniper, Uncanny Trickster
- **Dragonlance Campaign Setting** (12): Dragon Rider, Inquisitor, Knight of the Crown, Knight of the Lily, Knight of the Rose, Knight of the Skull, Knight of the Sword, Knight of the Thorn, Legendary Tactician, Righteous Zealot, Steel Legionnaire, Wizard of High Sorcery
- **Heroes of Light** (12): Anchorite Inquisitor, Anchorite Wanderer, Black Powder Avenger, Blessed Defender, Blessed Paladin, Detective, Dilettante, Knight Errant, Metaphysician, Scholar, True Innocent, White Arcanist
- **Champions of Darkness** (12): Charlatan, Dreamcaster, Highway Rider, Manipulator, Master of Curses, Moonbane, Night Lord, Propagandist, Scourge, Solitary Outcast, The Mesmerist, Worldbreaker
- **Complete Champion** (11): Fist of the Forest, Forest Reeve, Holt Warden, Mythic Exemplar, Ordained Champion, Paragnostic Apostle, Paragnostic Initiate, Sanctified One, Shadowspy, Shadowstriker, Squire of Legend
- **Magic of Incarnum** (11): Incandescent Champion, Incarnum Blade, Ironsoul Forgemaster, Necrocarnate, Sapphire Hierarch, Soul Manifester, Soulcaster, Spinemeld Warrior, Totem Rager, Umbral Disciple, Witchborn Binder
- **Age of Mortals** (11): Academy Sorcerer, Citadel Mystic, Kender Nightstalker, Legion Mystic, Legion Scout, Legion Sorcerer, Master Ambassador, Nomad Shaman, Rogue Knight, Solamnic Auxiliary Mage, Spellfilch
- **Libris Mortis** (11): Death's Chosen, Dirgesinger, Ephemeral Exemplar, Lurking Terror, Master Vampire, Master of Radiance, Master of Shrouds, Pale Master, Sacred Purifier, Tomb Warden, True Necromancer
- **Complete Mage** (10): Eldritch Disciple, Eldritch Theurge, Enlightened Spirit, Holy Scourge, Lyric Thaumaturge, Master Specialist, Nightmare Spinner, Ultimate Magus, Unseen Seer, Wild Soul
- **Frostburn** (10): Cloud Anchorite, Cryokineticist, Disciple of Thyrm, Frost Mage, Frostrager, Knight of the Iron Glacier, Primeval, Rimefire Witch, Stormsinger, Winterhaunt of Iborghu
- **Magic of Faerun** (10): Gnome Artificer, Guild Wizard of Waterdeep, Harper Mage, Harper Priest, Mage-Killer, Master Alchemist, Mystic Wanderer, Spelldancer, Spellfire Channeler, War Wizard of Cormyr
- **Van Richten's Arsenal Vol. 1** (10): Alchemical Philosopher, Anchorite of the Mists, Crypt Raider, Dirgist, Guardian Seeker, Hallowed Witch, Knight of the Shadows, Pistoleer, Stygian Attendant, The Avenger
- **Planar Handbook** (9): Ardent Dilettante, Astral Dancer, Chaotician, Cipher Adept, Defiant, DoomLord, Elemental Warrior, Fatemaker, Visionary Seeker
- **Complete Psionic** (8): Anarchic Initiate, Ebon Saint, Ectopic Adept, Flayerspawn Psychic, Illumine Soul, Soulbow, Storm Disciple, Zerth Cenobite
- **Races of Faerun** (8): Battlerager, Breachgnome, Elven High Mage, Great Rift Skyguard, Orc Warlord, Spellsinger, Warrior Skald, Warsling Sniper
- **Stormwrack** (7): Knight of the Pearl, Legendary Captain, Leviathan Hunter, Scarlet Corsair, Sea Witch, Stormcaster, Wavekeeper
- **Miniatures Handbook** (7): Bonded Summoner, Dragon Samurai, Havoc Mage, Skullclan Hunter, Tactical Soldier, War Hulk, Warchief
- **Dragon Magic** (7): Diamond Dragon, Dragon Descendant, Dragon Lord, Hand of the Winged Masters, Pact-bound Adept, Swift Wing, Wyrm Wizard
- **Races of Stone** (6): Dawncaller, Goliath Liberator, Iron Mind, Peregrine Runner, Stoneblessed, Stonespeaker Guardian
- **Sandstorm** (6): Ashworm Dragoon, Lord of Tides, Sand Shaper, Scion of Tem-Et-Nu, Scorpion Heritor, Walker in the Waste
- **Heroes of Horror** (6): Corrupt Avenger, Death Delver, Dread Witch, Fiend-Blooded, Purifier of the Hallowed Doctrine, Tainted Scholar
- **Tome of Battle** (6): Bloodclaw Master, Deepstone Sentinel, Eternal Blade, Master Of Nine, Ruby Knight Vindicator, Shadow Sun Ninja
- **Champions of Ruin** (6): Black Blood Cultist, Justice of Weald and Woe, Night Mask Deathbringer, Shade Hunter, Thayan Gladiator, Vengeance Knight
- **Silver Marches** (6): Giant-Killer, Hordebreaker, Knight-Errant of Silverymoon, Orc Scout, Peerless Archer, Wild Scout
- **Explorer's Handbook** (6): Cataclysm Mage, Landforged Walker, Primal Scholar, Scorpion Wraith, Thunder Guide, Windwright Captain
- **Magic of Eberron** (6): Dragon Prophet, Elemental Scion of Zilargo, Impure Prince, Quori Mindhunter, Renegade Mastermaker, Vigilant Sentinel of Aerenal
- **Lords of Madness** (6): Abolisher, Darkrunner, Fleshwarper, Keeper of the Cerulean Sign, Sanctified Mind, Topaz Guardian
- **Ravenloft Player's Handbook** (6): Beast-Hunter, Demon-Hunter, Ghost-Hunter, Monster Hunter, Vampire-Hunter, Witch-Hunter
- **Races of the Dragon** (5): Disciple of the Eye, Dracolexi, Dragon Devotee, Dragonheart Mage, Singer of Concordance
- **Tome of Magic** (5): Anima Mage, Knight of the Sacred Seal, Scion of Dantalion, Tenebrous Apostate, Witch Slayer
- **Five Nations** (5): Bone Knight, Cyran Avenger, Dark Lantern, Knight Phantom, Silver Pyromancer
- **Heroes of Battle** (4): Combat Medic, Dread Commando, Legendary Leader, War Weaver
- **Expanded Psionics Handbook** (4): Elocater, Fist of Zuoken, Illithid Slayer, Thrallheard
- **Underdark** (4): Arachnomancer, Illithid Body Tamer, Inquisitor of the Drowning Goddess, Sea Mother Whip
- **Champions of Valor** (4): Knight of the Flying Hunt, Knight of the Weave, Moonsea Skysentinal, Triadic Knight
- **Bestiary of Krynn** (4): Ambient Tempest, Branch of Zivilyn, Child of Chemosh, Scourge of Chaos
- **Fiendish Codex II** (4): Hellbreaker, Hellfire Warlock, Hellreaver, Soulguard
- **Manual of the Planes** (4): Divine Agent, Gatecrasher, Planar Champion, Planeshifter
- **Cityscape** (3): Crimson Scourge, Ebonmar Infiltrator, Urban Savant
- **Fiend Folio** (3): Fiend of Blasphemy, Fiend of Corruption, Fiend of Possession
- **Complete Warrior** (2): Hulking Hurler, Justiciar
- **Complete Divine** (2): Dweomerkeeper, Shining Blade of Heironeous
- **Complete Adventurer** (2): Fochulcan Lyrist, Shadowmind
- **Races of Destiny** (2): Loredelver, Shadow Sentinel
- **Races of the Wild** (2): Skypledged, Stormtalon
- **Dungeonscape** (2): Beast Heart Adept, Trapsmith
- **Player's Guide to Faerun** (2): Black Blood Hunter, Hathran
- **Races of Eberron** (2): Atavist, Quori Nightmare
- **Player's Guide to Eberron** (2): High Elemental Binder, Revenant Blade
- **Secrets of Sarlona** (2): Fist of Dal Quor, Haztaratain
- **Player's Companion** (2): Guerilla, Swift
- **Sword and Fist** (2): Devoted Defender, Lasher
- **Eberron Campaign Setting** (1): Eldeen Ranger
- **Book of Exalted Deeds** (1): Risen Martyr
