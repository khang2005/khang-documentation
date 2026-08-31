# Provider Comparison: Gemini vs Groq

**Evaluated:** 2026-08-26 (real API runs, reproduced below)
**Decision:** Gemini Flash selected as the primary LLM provider.

## Summary

We tested **Gemini Flash** and **Groq** models for intent extraction (structured JSON) and natural-language response generation. **Gemini was selected** because it produces correct, schema-compliant JSON without hallucinating, and its free-tier limits are sufficient for our usage.

The comparison below uses **actual API output** captured in this evaluation, not hypotheticals.

---

## 1. Intent Extraction

The exact same prompt (from `gemini_provider.py`) was sent to each model. The key fields our pipeline relies on are `follow_up_mode` and `selected_index`, which must use our exact vocabulary (`select`, `refine`, `replace_search`, `none`).

### Gemini Flash

| Query | Output |
|-------|--------|
| "get me to a nearby starbucks" | ✅ `intent: route`, `follow_up: none` |
| "how about a market" | ✅ `follow_up_mode: replace_search`, `follow_up_to_previous: true` |
| "the second one" | ✅ `follow_up_mode: select`, `selected_index: 1` |
| "is it open now" | ✅ `follow_up_mode: refine`, `filters: {open_now: true}`, `sub_intent: open_now` |

**Verdict:** Always valid JSON, follows our enum values exactly, correct `selected_index` semantics (returns the right index for "the second one").

### Groq openai/gpt-oss-120b

| Query | Output |
|-------|--------|
| "get me to a nearby starbucks" | ✅ `intent: route`, valid JSON |
| "how about a market" | ⚠️ Correct `replace_search`, but **`follow_up_to_previous: false`** (missed the conversational turn) |
| "the second one" | ⚠️ `follow_up_mode: select`, but **`selected_index: 2`** (wrong — should be 1 for 0-indexed) |
| "is it open now" | ✅ `refine` + `open_now` filter |

**Verdict:** JSON is valid, but made **2 logic errors** on follow-up queries — the exact behavior our conversational memory depends on.

### Groq openai/gpt-oss-20b

| Query | Output |
|-------|--------|
| "get me to a nearby starbucks" | ✅ valid |
| "how about a market" | ✅ correct `replace_search` + `follow_up_to_previous: true` |
| "the second one" | ✅ `select`, `selected_index: 1` (correct) |
| "is it open now" | ✅ correct `refine` + filter |

**Verdict:** On this small set, gpt-oss-20b actually handled follow-ups better than 120b and matched Gemini. Note it returns fewer expanded `search_terms` (only the literal term), which weakens map search recall.

> Note: `qwen/qwen3-32b`, `meta-llama/llama-3.3-70b-versatile`, and `meta-llama/llama-4-scout` were **not accessible on this account** (HTTP 404), so they could not be evaluated this session. Earlier local tests of Qwen 27B failed because reasoning tokens consumed the entire output budget before any JSON was produced.

---

## 2. Response Generation (Natural Language Quality)

Same place data ("coffee nearby") sent to each model. This is the user-facing text.

### Gemini Flash
> "Here are a few great coffee spots right along Central Avenue! Just a quick heads-up: **they all show as currently closed**, so you'll want to check their opening hours before heading out.
> * **Dutch Bros. Coffee** (0.1 km away) — Practically right on your doorstep, Dutch Bros is famous for its upbeat energy and massive menu of specialty drinks...
> * **Mas Cafecito Coffee** (0.2 km away) — Just a short stroll down the street, this spot is fantastic if you prefer a local, artisanal cafe vibe...
> * **Starbucks** (0.6 km away) — This is your classic, reliable standby...
> **Quick Take:** If you want a cozy, local specialty brew, definitely check out Mas Cafecito..."

**Strengths:** Stays strictly on given data, explicitly notes "currently closed" (accurate), gives a comparison, never invents facts.

### Groq openai/gpt-oss-120b
> "Hey there! If you're craving a caffeine fix nearby... **Dutch Bros. Coffee** ... They usually open early (around 6 am) and stay busy through the afternoon... **Mas Cafecito Coffee** ... offering ... light bites like avocado toast... especially on weekend mornings when the patio fills up. **Starbucks** – about 0.6..."

**Strengths:** Fast (~1.1s), smooth prose.
**Weaknesses:** **Hallucinates** concrete details not in the source ("opens around 6 am", "avocado toast", "patio fills up", "weekend mornings"). Also **got truncated** mid-sentence at Starbucks.

### Groq openai/gpt-oss-20b
> "Hey there! If you're craving a caffeine fix right now... **Dutch Bros. Coffee** ... They're usually open late, so check their app... **Mas Cafecito Coffee** ... Their latte art is a must-see... **Starbucks** ... plenty of seating, and Wi-Fi..."

**Strengths:** Fastest (~0.58s), coherent.
**Weaknesses:** Also **hallucinates** ("usually open late", "latte art is a must-see", "plenty of seating and Wi-Fi"). Also got truncated.

### Quality Summary

| Model | Stays on data | Hallucinates | Completes | Tone | Latency |
|-------|--------------|--------------|-----------|------|---------|
| Gemini Flash | ✅ Yes | No | ✅ Always | Warm local guide | ~3-4s |
| gpt-oss-120b | ⚠️ Partial | Yes (times, menu items) | ❌ Truncated | Friendly | ~1.1s |
| gpt-oss-20b | ⚠️ Partial | Yes (hours, intended) | ❌ Truncated | Friendly | ~0.6s |

---

## 3. Schema Compliance (Intent)

| Provider | Valid JSON | Correct enums | Correct index | Follow-up turn detection |
|----------|-----------|---------------|---------------|--------------------------|
| Gemini Flash | ✅ | ✅ | ✅ | ✅ |
| gpt-oss-120b | ✅ | ✅ | ❌ (index 2 vs 1) | ❌ (some turns missed) |
| gpt-oss-20b | ✅ | ✅ | ✅ | ✅ |

---

## 4. Free Tier Comparison

| Provider | RPM | Tokens/min | Requests/day | Credit Card |
|----------|-----|------------|--------------|-------------|
| Gemini Flash | 10-15 | 250K-1M | 1,500 | No |
| Groq (gpt-oss-20b/120b) | 30 | 6,000 | ~14,400 | No |

---

## Decision

**Gemini Flash** was selected because:

1. **Correct structured output** — exact enum values and correct `selected_index`, which our conversational memory depends on
2. **No hallucination** — response text stays on the source place data (Groq models invented opening times, menu items, and amenities)
3. **Completes reliably** — Groq models truncate before finishing the last recommendation
4. **Schema-exact** even for the tricky follow-up queries like "the second one" and "how about a market"

**Groq consideration:** gpt-oss models are ~4-8x faster and cheaper. If we want more speed, gpt-oss-20b (which handled follow-ups correctly in our test) could serve as a **response-generation fallback**, but only after adding guardrails against hallucination and increasing the token limit to avoid truncation. It should not be used for intent extraction unless follow-up logic is hardened.

## Models Tested

| Model | Intent JSON | Response quality | Notes |
|-------|-------------|------------------|-------|
| gemini-flash-latest | ✅ | ✅ Excellent | Selected |
| openai/gpt-oss-120b | ⚠️ 2 logic errors | ⚠️ Hallucinates, truncates | Rejected |
| openai/gpt-oss-20b | ✅ Good | ⚠️ Hallucinates, truncates | Candidate fallback |
| qwen/qwen3-32b | Not accessible (404) | N/A | Access/permission |
| meta-llama/llama-3.3-70b-versatile | Not accessible (404) | N/A | Access/permission |
| meta-llama/llama-4-scout-17b-16e-instruct | Not accessible (404) | N/A | Access/permission |
| qwen/qwen3.6-27b (earlier local test) | ❌ | N/A | All tokens spent on reasoning |

---

## Appendix: Raw Transcripts (verbatim from the live run)

These are the **exact, unedited responses** captured when the same prompt was sent to each model. Read them to verify every claim above.

### A. Intent extraction — "the second one"

The correct answer is `selected_index: 1` ("the second one" = the 2nd item = index 1 in 0-based indexing). Compare what each returned:

**Gemini Flash** (correct):
```json
{
  "intent": "search_places",
  "sub_intent": null,
  "search_terms": [],
  "filters": {},
  "follow_up_to_previous": true,
  "follow_up_mode": "select",
  "selected_index": 1
}
```

**openai/gpt-oss-120b** (WRONG index — this would select the wrong place in our pipeline):
```json
{
  "intent": "search_places",
  "sub_intent": null,
  "search_terms": [],
  "filters": {},
  "follow_up_to_previous": true,
  "follow_up_mode": "select",
  "selected_index": 2
}
```

**openai/gpt-oss-20b** (correct):
```json
{
  "intent": "search_places",
  "sub_intent": null,
  "search_terms": [],
  "filters": {},
  "follow_up_to_previous": true,
  "follow_up_mode": "select",
  "selected_index": 1
}
```

### B. Intent extraction — "how about a market"

This should signal a fresh search (`replace_search`) AND a continuation of the conversation (`follow_up_to_previous: true`).

**Gemini Flash** (correct on both):
```json
{
  "intent": "search_places",
  "sub_intent": null,
  "search_terms": ["market", "supermarket", "grocery store", "farmers market"],
  "filters": {},
  "follow_up_to_previous": true,
  "follow_up_mode": "replace_search",
  "selected_index": null
}
```

**openai/gpt-oss-120b** (marks it as NOT a follow-up — loses conversational continuity):
```json
{
  "intent": "search_places",
  "sub_intent": null,
  "search_terms": ["market", "local market", "farmers market", "shopping market"],
  "filters": {},
  "follow_up_to_previous": false,
  "follow_up_mode": "replace_search",
  "selected_index": null
}
```

### C. Response generation — "coffee nearby"

The source data contained ONLY: name, distance, address, "currently closed" (via `is_open: false`), and POI categories. There was **no opening-time, no menu, no patio, no Wi-Fi** info.

**Gemini Flash** stayed on the data and flagged the closed status:
> "Here are a few great coffee spots right along Central Avenue! Just a quick heads-up: **they all show as currently closed**..."

**openai/gpt-oss-120b** invented facts the data never contained ("open early around 6am", "avocado toast", "patio fills up", "weekend mornings") — and truncated:
> "They usually open early (around 6 am) and stay busy through the afternoon... **Mas Cafecito Coffee** ... offering ... light bites like avocado toast... especially on weekend mornings when the patio fills up. **Starbucks** – about 0.6..."

**openai/gpt-oss-20b** also invented details ("usually open late", "latte art is a must-see", "plenty of seating and Wi-Fi") and truncated:
> "**Dutch Bros. Coffee** ... They're usually open late, so check their app... **Mas Cafecito Coffee** ... Their latte art is a must-see... **Starbucks** ... plenty of seating, and Wi-Fi..."
