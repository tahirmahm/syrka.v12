# NCERT Class X curriculum — source inventory

Deterministic inventory of the four authorised NCERT Class X (2026-27 reprint) book archives supplied directly by the founder. Produced by hashing and native-extracting every supplied PDF with the project's existing Stage B pipeline (`lib/services/learning/document-intake.ts` + `pdf-provider.ts`). No PDF content, archive, or extracted textbook text is committed anywhere in this repository — only this metadata, hashes, and page counts. See `.gitignore` for the excluded paths and `docs/curriculum/ncert-class-10-ingestion.md` for the full per-file Stage B ingestion report.

**Total: 26 chapter/unit PDFs + 4 front-matter (prelims) PDFs + 1 appendix PDF = 31 supplied files, across 4 books.** This is not the full NCERT Class X curriculum — Mathematics, Science, History, the supplementary English reader, and additional language books have not been supplied and are not covered here.

## English — First Flight

Archive: `jeff1dd.zip` · Subject: English

| # | File | SHA-256 (first 16) | Pages | Chapter title | Classification |
| - | ---- | ------------------- | ----- | -------------- | --------------- |
| 1 | `jeff101.pdf` | `2554abf66b90cc88…` | 15 | A Letter to God | chapter |
| 2 | `jeff102.pdf` | `10f97cb3c26f8bd3…` | 16 | Nelson Mandela: Long Walk to Freedom | chapter |
| 3 | `jeff103.pdf` | `074ad18280788501…` | 16 | Two Stories about Flying | chapter |
| 4 | `jeff104.pdf` | `5cd74b1bdfb065d0…` | 15 | From the Diary of Anne Frank | chapter |
| 5 | `jeff105.pdf` | `16d0fd9ebf13d20b…` | 17 | Glimpses of India | chapter |
| 6 | `jeff106.pdf` | `44935ba5b7241559…` | 14 | Mijbil the Otter | chapter |
| 7 | `jeff107.pdf` | `960643fa97f13ce5…` | 17 | Madam Rides the Bus | chapter |
| 8 | `jeff108.pdf` | `0f27cf046f361234…` | 9 | The Sermon at Benares | chapter |
| 9 | `jeff109.pdf` | `e782b17e4a777d8d…` | 21 | The Proposal | chapter |
| — | `jeff1ps.pdf` | `665f92ea88ea7994…` | 12 | Prelims / edition & reprint history | front_matter |

## Geography — Contemporary India II

Archive: `jess1dd.zip` · Subject: Geography

| # | File | SHA-256 (first 16) | Pages | Chapter title | Classification |
| - | ---- | ------------------- | ----- | -------------- | --------------- |
| 1 | `jess101.pdf` | `e2d7e9e470c73663…` | 12 | Resources and Development | chapter |
| 2 | `jess102.pdf` | `bab59f420ede000b…` | 6 | Forest and Wildlife Resources | chapter |
| 3 | `jess103.pdf` | `87d91ba2705d8dab…` | 11 | Water Resources | chapter |
| 4 | `jess104.pdf` | `21d1701bba940254…` | 12 | Agriculture | chapter |
| 5 | `jess105.pdf` | `f402073762eb9dfd…` | 16 | Minerals and Energy Resources | chapter |
| 6 | `jess106.pdf` | `0817faa6575c3e10…` | 13 | Manufacturing Industries | chapter |
| 7 | `jess107.pdf` | `2628173d9d443003…` | 13 | Lifelines of National Economy | chapter |
| — | `jess1a1.pdf` | `b0bc78b44ad16256…` | 5 | Appendix I — external reference websites | appendix |
| — | `jess1ps.pdf` | `49863325d9e0be63…` | 12 | Prelims / edition & reprint history | front_matter |

## Economics — Understanding Economic Development

Archive: `jess2dd.zip` · Subject: Economics

| # | File | SHA-256 (first 16) | Pages | Chapter title | Classification |
| - | ---- | ------------------- | ----- | -------------- | --------------- |
| 1 | `jess201.pdf` | `1a6f8af67a416b98…` | 16 | Development | chapter |
| 2 | `jess202.pdf` | `255acd3c637a2392…` | 20 | Sectors of the Indian Economy | chapter |
| 3 | `jess203.pdf` | `ec5383e7501501c2…` | 16 | Money and Credit | chapter |
| 4 | `jess204.pdf` | `4e3441cb0d7789ae…` | 20 | Globalisation and the Indian Economy | chapter |
| 5 | `jess205.pdf` | `d1c546bbf35a4133…` | 19 | Consumer Rights | chapter |
| — | `jess2ps.pdf` | `c036d449f632975a…` | 13 | Prelims / edition & reprint history | front_matter |

## Political Science — Democratic Politics II

Archive: `jess4dd.zip` · Subject: Political Science

| # | File | SHA-256 (first 16) | Pages | Chapter title | Classification |
| - | ---- | ------------------- | ----- | -------------- | --------------- |
| 1 | `jess401.pdf` | `f196321f2b8b61df…` | 12 | Power-sharing | chapter |
| 2 | `jess402.pdf` | `b8e30317fdd6085e…` | 16 | Federalism | chapter |
| 3 | `jess403.pdf` | `29742b10357d4a07…` | 17 | Gender, Religion and Caste | chapter |
| 4 | `jess404.pdf` | `848863f8ebe983fe…` | 17 | Political Parties | chapter |
| 5 | `jess405.pdf` | `f9049b6789da5964…` | 12 | Outcomes of Democracy | chapter |
| — | `jess4ps.pdf` | `c4808f2cde549108…` | 14 | Prelims / edition & reprint history | front_matter |

**Chapter total across all four books: 26** (matches the 26 expected in the brief.)

## Verified differences from the brief's expected mapping

- The brief associated archive filename prefixes with subjects by NCERT catalogue-code convention (`jess1` → Political Science, `jess2` → Geography). The **actual extracted content is the reverse**: `jess1dd.zip` is the **Geography** book (Contemporary India II — confirmed by its own title page and the "CONTEMPORARY INDIA – II" running header on every content page) and `jess2dd.zip` is the **Economics** book (Understanding Economic Development — confirmed by its own title page). `jess4dd.zip` (Political Science, Democratic Politics II) and `jeff1dd.zip` (English, First Flight) matched the expected mapping directly.

- All 9 English chapter titles, all 7 Geography chapter titles, all 5 Economics chapter titles, and all 5 Political Science chapter titles matched the brief's expected list exactly once the book identities above were corrected — no chapter titles differ from the brief.

- Political Science chapter 4 ("Political Parties") is not explicitly titled in the extracted first-page text alone (it opens mid-overview referencing "this tour of democracy"); the title was confirmed from the running header on the chapter's second page.

