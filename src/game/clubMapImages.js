// Higgsfield-generirane isometrijske slike — full-bleed pozadina (3×3 grid) +
// transparentne LEVEL 1 građevine (skromne barake). CDN URL-ovi se referenciraju
// direktno (browser ih učitava; server proxy blokira download).
const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_2zCFsJmlhH6t01iCupOrbjaSRvW';

// Pozadina: full-bleed teren, veliko centralno polje + 8 manjih okolo.
export const MAP_BG = `${CDN}/hf_20260624_202603_b942a6f3-04e8-47a6-8be9-899c51842a7d.png`;

// Transparentne (background removed) LEVEL 1 verzije svih građevina.
export const BUILDING_IMAGES = Object.freeze({
  stadium:  `${CDN}/hf_20260624_212346_45079432-aa85-4dfd-b3f8-4d28eeb0b7cd.png`, // 2:3 (4:6) fit za 6×4 blok
  match:    `${CDN}/hf_20260624_202729_174da354-0a2f-4639-be23-9fe8eae1c36e.png`, // teren
  myteam:   `${CDN}/hf_20260624_202727_9ccc5d58-d06e-42c0-bd9a-d7bf623f5f11.png`, // svlačionica
  train:    `${CDN}/hf_20260624_202730_643565d7-b828-4902-8696-f6e9dbcf49dd.png`,
  academy:  `${CDN}/hf_20260624_202732_7c9b9d28-ca83-460c-aea9-733618ed38a2.png`,
  market:   `${CDN}/hf_20260624_202747_849a5eb9-698e-41b4-9218-c2f1a92cb632.png`,
  sponsors: `${CDN}/hf_20260624_202748_184646f9-52ef-4d41-98d8-a5f4ac9eeb62.png`,
  scout:    `${CDN}/hf_20260624_202753_05b1e6f1-c533-49c2-bcad-4a068b3c9f18.png`,
  medical:  `${CDN}/hf_20260624_202931_64f305ab-a3dc-476c-8a5d-9100a0576364.png`,
});
