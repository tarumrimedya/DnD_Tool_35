# Joyful-Fermi Project Guidelines & Rules

## 1. Token Optimization & Subagent Model Delegation
To maximize token efficiency and minimize API costs across all conversations in this workspace:
- **Simple & Routine Tasks (`flash_lite`)**:
  - Always delegate simple, data-heavy, or repetitive tasks to `flash_lite` subagents (using `invoke_subagent` with `Model: "flash_lite"`).
  - Scope for `flash_lite`:
    - Converting spells, feats, skills, and item descriptions into target JSON schemas (`master_db.json`, `character_data.json`).
    - Bulk data formatting, table parsing, and JSON structural validation.
    - Simple syntax checks, static regex/string transformations, and localized documentation updates.
    - Quick reference extraction from d20 3.5e SRD.
- **Main Agent Scope**:
  - Architecture and core engine calculations (`rule_master.js`, `rule_engine.js`, BAB, Save, Caster Level, DM Boons).
  - UI/UX implementation and DOM state management in `index.html`.
  - Integration, review of subagent outputs, and project orchestration.

## 2. D&D 3.5e SRD Knowledge Retrieval
- Do **NOT** scrape or fetch full HTML pages from `d20srd.org` via network/browsing tools unless specifically requested by the user.
- D&D 3.5e SRD rules, spell descriptions, class tables, and formulas are fully present in parametric memory. Query and extract directly from parametric memory to achieve near-zero token consumption.
- Prioritize deterministic local JSON lookups (`master_db.json`, `bundled_data.js`) first before generating or querying.

## 3. Zar Sembolü ve İkon Kullanım Kuralı (STRICT: NO 🎲 EMOJI)
- Projenin **hiçbir yerinde** (kod, UI butonları, loglar, toast bildirimleri, tablolar, dokümantasyon, açıklama metinleri dahil) standart 6 yüzlü tavla zarı emojisi olan **`🎲` (U+1F3B2 / `\uD83C\uDFB2`) KESİNLİKLE KULLANILMAYACAKTIR**.
- Bunun yerine:
  - **Masaüstü RPG Zarları İçin:** Özel çokyüzlü vektör SVG ikonları kullanılmalıdır: `getDiceIconSvg(dieType, classes)` veya `getFormulaDiceIconSvg(formula, classes)` (d20, d12, d10, d8, d6, d4, d100).
  - **Tematik Aksiyon Sembolleri İçin:**
    - Saldırı / Silah / Fiziksel Hasar: `⚔️`
    - Büyü / İlahi / Arcane Etki: `🔮` / `✨`
    - Genel Zar / Anlık Aksiyon / Doğal 20: `⚡`
    - Zar Yuvarlanma Süreci / Bekleme: `'...'` veya `⚡`
    - Kan Fedası: `🩸`
    - Şifa / Can: `💚`
    - Geçici Can: `🛡️`

## 4. Kullanıcı Sorularında Geliştirme Yapmama ve Eleştirel Yaklaşım (STRICT)
- Kullanıcı bir konu hakkında soru sorduğunda, fikir danıştığında veya ("ihtiyaç var mı?", "mantıklı mı?", "sence nasıl olmalı?" gibi) sorgulayıcı yaklaşımlarda bulunduğunda:
  - **Kesinlikle doğrudan kod geliştirmesi / dosya değişikliği YAPILMAYACAKTIR.**
  - Kullanıcı açıkça *"uygula"*, *"kodu değiştir"*, *"geliştir"*, *"ekle/kaldır"* gibi net bir eylem talimatı vermediği sürece sadece analiz ve değerlendirme sunulacaktır.
  - Verilen yanıtlar yüzeysel veya körü körüne onaylayıcı olmamalı; konuya **eleştirel ve sorgulayıcı bir yaklaşımla** (artıları, eksileri, UX/UI ergonomisi, D&D 3.5e RAW kural mekanikleri, performans ve alternatif çözüm yolları ile) derinlemesine bakılarak objektif argümanlarla cevap verilmelidir.
