# NCERT Class X curriculum — Stage B ingestion report

Real output of the existing Stage B pipeline (`NativePdfProvider.extract` -> `evaluateDocumentPageQuality` -> `proposeStructureSync`, the same deterministic, rule-based provider the `/faculty/learning-spaces` authoring workspace already uses) run against all 31 supplied PDFs. No OCR was invoked; no model call was made. This is a structure *proposal* only — per `learning-governance.ts`, it is never published curriculum on its own. The canonical curriculum content actually shown to students (`lib/mock-data/ncert-class-10-seed.ts`) is original Syrka-authored material reviewed against these proposals and the real chapter text, not the raw proposal output below.

Only counts, quality states, and short section-heading excerpts are recorded here — never full page text — per the copyright boundary in the brief.

| File | Pages | Extraction outcome | Page quality (state: count) | OCR-required pages | Headings proposed |
| ---- | ----- | ------------------- | ---------------------------- | ------------------- | ------------------- |
| `jeff1dd/jeff101.pdf` | 15 | OK | review_recommended: 15 | 0 | BEFORE YOU READ; Activity; Reprint 2026-27 |
| `jeff1dd/jeff102.pdf` | 16 | OK | review_recommended: 16 | 0 | BEFORE YOU READ; Mandela had to spend thirty years in pri; Mandela speaks about a historic occasion |
| `jeff1dd/jeff103.pdf` | 16 | OK | review_recommended: 16 | 0 | BEFORE YOU READ; Since the earliest times, humans have dr; I |
| `jeff1dd/jeff104.pdf` | 15 | OK | review_recommended: 15 | 0 | BEFORE YOU READ; Anneliese Marie ‘Anne’ Frank (12; June 1929 – February/March |
| `jeff1dd/jeff105.pdf` | 17 | OK | review_recommended: 17 | 0 | BEFORE YOU READ; Activity; Discuss in class |
| `jeff1dd/jeff106.pdf` | 14 | OK | review_recommended: 14 | 0 | BEFORE YOU READ; Activity; Reprint 2026-27 |
| `jeff1dd/jeff107.pdf` | 17 | OK | review_recommended: 17 | 0 | BEFORE YOU READ; Activity; Reprint 2026-27 |
| `jeff1dd/jeff108.pdf` | 9 | OK | review_recommended: 9 | 0 | BEFORE YOU READ; Activity; India. At twelve, he was sent away for s |
| `jeff1dd/jeff109.pdf` | 21 | OK | review_recommended: 21 | 0 | BEFORE YOU READ; Activity; A Russian Wedding |
| `jeff1dd/jeff1ps.pdf` | 12 | 2 of 12 page(s) could not be read as text and are marked as requiring OCR or manual correction. The rest of the document remains inspectable. | ocr_required: 2, review_recommended: 10 | 2 | First Edition; February 2007 Magha 1928; Reprinted |
| `jess1dd/jess1dd/jess101.pdf` | 12 | OK | review_recommended: 12 | 0 | Everything available in our environment; The process of transformation of things; Do you think that resources are free |
| `jess1dd/jess1dd/jess102.pdf` | 6 | OK | review_recommended: 6 | 0 | We share this planet with millions of ot; Flora and Fauna in India; If you look around, you will be able to  |
| `jess1dd/jess1dd/jess103.pdf` | 11 | OK | review_recommended: 11 | 0 | You already know that three-fourth of th; You might wonder that if three-fourth of; WATER SCARCITY AND THE NEED FOR WATER |
| `jess1dd/jess1dd/jess104.pdf` | 12 | OK | review_recommended: 12 | 0 | Two-thirds of its population is engaged ; Can you name some industries based on; TYPES OF FARMING |
| `jess1dd/jess1dd/jess105.pdf` | 16 | OK | review_recommended: 16 | 0 | We use different things in our daily lif; You have studied that the earth’s crust ; Minerals are an indispensable part of ou |
| `jess1dd/jess1dd/jess106.pdf` | 13 | OK | review_recommended: 13 | 0 | 58 CONTEMPORARY INDIA – II; Production of goods in large quantities ; Do you also know that some types of clot |
| `jess1dd/jess1dd/jess107.pdf` | 13 | OK | review_recommended: 13 | 0 | We use different materials and services ; These are known to be traders who make t; Movement of these goods and services can |
| `jess1dd/jess1dd/jess1a1.pdf` | 5 | OK | review_recommended: 5 | 0 | Appendix-I	Appendix-I	Appendix-I	Appendi; Websites you can see; Bombay Natural History Society: http://w |
| `jess1dd/jess1dd/jess1ps.pdf` | 12 | 2 of 12 page(s) could not be read as text and are marked as requiring OCR or manual correction. The rest of the document remains inspectable. | ocr_required: 2, review_recommended: 10 | 2 | India; Contemporary; II |
| `jess2dd/jess201.pdf` | 16 | OK | review_recommended: 16 | 0 | NOTES FOR TEACHERSNOTES FOR THE TEACHER; CHAPTER I : DEVELOPMENT; Development has many aspects. The |
| `jess2dd/jess202.pdf` | 20 | OK | review_recommended: 20 | 0 | NOTES FOR THE TEACHER; CHAPTER 2: SECTORS OF THE INDIAN ECONOMY; An economy is best understood when we |
| `jess2dd/jess203.pdf` | 16 | OK | review_recommended: 16 | 0 | NOTES FOR THE TEACHER; CHAPTER 3 : MONEY AND CREDIT; Money is a fascinating subject and full  |
| `jess2dd/jess204.pdf` | 20 | OK | review_recommended: 20 | 0 | Most regions of the world are getting in; You can also creatively use comprehensio; Integration of production and integratio |
| `jess2dd/jess205.pdf` | 19 | OK | review_recommended: 19 | 0 | NOTES FOR THE TEACHER; This chapter proposes to discuss the iss; Hence, there is a need to sensitise lear |
| `jess2dd/jess2ps.pdf` | 13 | 1 of 13 page(s) could not be read as text and are marked as requiring OCR or manual correction. The rest of the document remains inspectable. | ocr_required: 1, review_recommended: 12 | 1 | UNDERST	UNDERST	UNDERST	UNDERST	UNDERSTA; ECONOMIC	ECONOMIC	ECONOMIC	ECONOMIC	ECON; DEVELOPMENT	DEVELOPMENT	DEVELOPMENT	DEVE |
| `jess4dd/jess401.pdf` | 12 | OK | review_recommended: 12 | 0 | 1; Chapter I; Power-sharing |
| `jess4dd/jess402.pdf` | 16 | OK | review_recommended: 16 | 0 | F e d e r a l i s m; 13; Chapter 2 |
| `jess4dd/jess403.pdf` | 17 | OK | review_recommended: 17 | 0 | 29; Chapter 3; Religion and |
| `jess4dd/jess404.pdf` | 17 | OK | review_recommended: 17 | 0 | 46; Chapter 4; Overview |
| `jess4dd/jess405.pdf` | 12 | OK | review_recommended: 12 | 0 | 63; Chapter 5; Outcomes of |
| `jess4dd/jess4ps.pdf` | 14 | 2 of 14 page(s) could not be read as text and are marked as requiring OCR or manual correction. The rest of the document remains inspectable. | ocr_required: 2, review_recommended: 12 | 2 | Social Science; Textbook in Political Science for Class ; D emocratic 	P olitics -ii |

**Total OCR-required pages across all 31 files: 7** — all within the four front-matter/prelims PDFs (cover/edition pages). Zero OCR-required pages in any of the 26 real chapter PDFs; every chapter extracted with fully readable native text.

The deterministic structure-proposal provider was built and tuned against a Chemistry chapter and, run unmodified against dense Social-Science/English prose, over-segments short lines into many low-confidence "section" proposals (visible in the raw counts, not reproduced in full here) — expected behaviour for a rule-based provider whose output "is not published curriculum" and "awaits teacher review" (`learning-ingestion.ts`). This is why the actual Learning Space content below was authored and reviewed directly against the source rather than accepting the raw proposal verbatim.

