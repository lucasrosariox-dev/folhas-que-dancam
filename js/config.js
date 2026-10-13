// ============================================================
// CONFIG — constantes do mundo
// ============================================================

// ---------- MUNDO ----------
export const TAMANHO_MUNDO = 1200;
export const METADE_MUNDO = TAMANHO_MUNDO / 2;
export const TAMANHO_CHAO = 2400;

// ---------- AVATAR ----------
export const VELOCIDADE_AVATAR = 20;
export const VELOCIDADE_GIRO = 3.0;
export const ALTURA_VOO_PADRAO = 1.2;
export const ALTURA_VOO_MAXIMA = 8;
export const VELOCIDADE_SUBIDA = 6;
export const VELOCIDADE_DESCIDA = 4;
export const GRAVIDADE = 3;

// ---------- MATA ----------
export const REGIAO_MATA = { x: -300, z: -300, raio: 400 };

export const SUB_REGIOES = [
  { nome: 'clareira',   x: -300, z: -300, raio: 50 },
  { nome: 'samambaias', x: -180, z: -420, raio: 90 },
  { nome: 'gigantes',   x: -420, z: -180, raio: 90 }
];

// ---------- NASCENTE ----------
export const NASCENTE = {
  x: -350,
  z: -250,
  raioBacia: 6,
  alturaMorro: 3,
  margem: 14
};

// ---------- RIO ----------
export const RIO = {
  xBase: 200,
  zFoz: 700,
  amplitude: 80,
  larguraNascente: 4,
  larguraMedia: 35,
  larguraFoz: 250,
  profundidade: 3,
  margem: 12
};

// ---------- MAR ----------
export const MAR = {
  zInicio: 400,
  nivel: 0.5,
  zMaximo: 2200
};

// ---------- PRAIA ----------
export const PRAIA = {
  largura: 150,
  zInicioAreia: 250,
  nivel: 1.5
};

// ---------- SERRA AO SUL ----------
export const SERRA_SUL = {
  zInicioTransicao: -250,
  zInicioSerra: -400,
  zPico: -500,
  zFim: -650,
  alturaMaxima: 50,
  comprimentoOnda: 120,
  xCentro: 0,
  meiaLarguraX: 500
};

// ---------- RAIO DAS PLANTAS ----------
export const RAIO = {
  arvoreAlta: 2.0,
  arvoreFrondosa: 2.2,
  arvoreRetorcida: 1.8,
  arvoreFlorida: 1.5,
  arvoreGigante: 4.0,
  arbusto: 1.0,
  grama: 0.6,
  flor: 0.3,
  samambaia: 1.2,
  pedra: 1.5,
  restinga: 0.8
};

// ---------- CORES ----------
export const CORES = {
  tronco: [0x4a3520, 0x5c4326, 0x3d2c1a, 0x6b4a2b],
  copa:   [0x2d4a2a, 0x3d5c3a, 0x4a6b40, 0x2a3d28],
  ipe:    [0xf2c744, 0xe8b830, 0xffd95c],
  flor:   [0xe8b830, 0xc0392b, 0xd64535, 0xf2c744, 0xe0e0e0],
  pedra:  [0x6a6a6a, 0x7a7a7a, 0x5a5a5a, 0x8a8a8a, 0x4a4a4a],
  restinga: [0x3a5c35, 0x4a6b40, 0x2d4a2a, 0x5c7c4a]
};