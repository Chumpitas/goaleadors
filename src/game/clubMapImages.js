// Higgsfield-generirane isometrijske slike — pozadina + transparentne građevine (9:16).
// CDN URL-ovi se referenciraju direktno (browser ih učitava; server proxy blokira download).
const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_2zCFsJmlhH6t01iCupOrbjaSRvW';

export const MAP_BG = `${CDN}/hf_20260624_202352_70e97920-6c52-419d-b16f-b1db46d8038e.png`;

// Transparentne (background removed) verzije svih građevina.
export const BUILDING_IMAGES = Object.freeze({
  stadium:  `${CDN}/hf_20260624_201743_82f31541-9bc6-43f5-a03e-a0f68ed421bd.png`,
  match:    `${CDN}/hf_20260624_201744_138da8ba-242b-410f-bf29-fd69aa0e2d9e.png`, // teren
  myteam:   `${CDN}/hf_20260624_201746_edbd7394-21da-4c7d-a3d3-d7bdc61aa798.png`, // svlačionica
  market:   `${CDN}/hf_20260624_201751_a98193f9-7b34-4e87-9fea-08cbff301293.png`,
  train:    `${CDN}/hf_20260624_201753_91e0e0bb-e364-4945-b0e6-9d196099d997.png`,
  sponsors: `${CDN}/hf_20260624_201754_7b82639f-7c06-46cd-aa41-904a488cf791.png`,
  scout:    `${CDN}/hf_20260624_201806_778d3f21-e65e-4380-8d32-981656e8d1eb.png`,
  medical:  `${CDN}/hf_20260624_201807_bddf8a20-db4c-49f2-aadb-4f0e01dc6469.png`,
  academy:  `${CDN}/hf_20260624_201808_899c962b-c0f5-4e43-9eca-0c3311430b65.png`,
});
