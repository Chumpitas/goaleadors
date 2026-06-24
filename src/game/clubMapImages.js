// Higgsfield-generirane isometrijske slike građevina i pozadine (9:16).
// CDN URL-ovi se referenciraju direktno (browser ih učitava; server proxy blokira download).
const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_2zCFsJmlhH6t01iCupOrbjaSRvW';

export const MAP_BG = `${CDN}/hf_20260624_194943_bac11ba2-94bf-47d9-b941-6ce7942aaa91.png`;

export const BUILDING_IMAGES = Object.freeze({
  stadium:  `${CDN}/hf_20260624_194959_9082d589-79cd-461d-b2ba-37a33245b45a.png`,
  match:    `${CDN}/hf_20260624_195057_b1214d7b-95d5-42c3-a8c0-bc9ee234a021.png`, // teren
  myteam:   `${CDN}/hf_20260624_195052_d2a88c26-65fb-4e06-9b90-7d67a6876e11.png`, // svlačionica
  market:   `${CDN}/hf_20260624_195043_913fcb93-20bb-44ea-b513-aba697cb80a2.png`,
  train:    `${CDN}/hf_20260624_195038_819a50de-edf5-4728-aecb-73dcb33f82b1.png`,
  sponsors: `${CDN}/hf_20260624_195031_7be4cb78-7aa3-46e1-a89a-d5e96ae4534b.png`,
  scout:    `${CDN}/hf_20260624_195024_4127124a-2825-4928-a238-72173640b849.png`,
  medical:  `${CDN}/hf_20260624_195019_ad8bb910-e9fd-4c36-9ae5-abd6ccc4d532.png`,
  academy:  `${CDN}/hf_20260624_195225_ed69bea7-a453-407a-8ddd-b98ea5969918.png`,
});
