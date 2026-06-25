// Demo cards used by the Phase-1 UI. Not canonical game data.
import { createCard } from './cards.js';

export const SAMPLE_CARDS = [
  Object.assign(createCard({
    name: 'Carlos Eduardo Ferreira',
    position: 'ATT',
    rarity: 'rare',
    nationality: 'Brazil',
    editionId: 'foundations',
    attributes: { shooting: 60, passing: 62, tackling: 64, pace: 47 },
    abilities: ['veteran_presence'],
  }), { image: 'https://d8j0ntlcm91z4.cloudfront.net/user_2zCFsJmlhH6t01iCupOrbjaSRvW/hf_20260625_010348_3f3e9c6e-ae64-43a9-ad3e-ac9970038edd.png' }),
  createCard({
    name: 'Marko Vidić',
    position: 'ATT',
    rarity: 'legendary',
    nationality: 'Srbija',
    editionId: 'foundations',
    attributes: { shooting: 92, passing: 74, tackling: 35, pace: 88 },
    abilities: ['target_man', 'anti_captain'],
  }),
  createCard({
    name: 'Luka Pavić',
    position: 'MID',
    rarity: 'epic',
    nationality: 'Hrvatska',
    editionId: 'foundations',
    attributes: { shooting: 70, passing: 90, tackling: 68, pace: 75 },
    abilities: ['playmaker', 'long_shot'],
  }),
  createCard({
    name: 'Stefan Kovač',
    position: 'DEF',
    rarity: 'rare',
    nationality: 'Srbija',
    editionId: 'foundations',
    attributes: { shooting: 40, passing: 66, tackling: 85, pace: 72 },
    abilities: ['iron_wall'],
  }),
  createCard({
    name: 'Ivan Jurić',
    position: 'GK',
    rarity: 'common',
    nationality: 'Bosna',
    editionId: 'foundations',
    attributes: { reflexes: 78, positioning: 74, passing: 55, pace: 60 },
  }),
];
