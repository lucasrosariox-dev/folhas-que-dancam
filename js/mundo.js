// ============================================================
// MUNDO — o terreno, o rio, o mar, a praia, a serra
// ============================================================

import {
  TAMANHO_MUNDO, METADE_MUNDO,
  REGIAO_MATA, SUB_REGIOES,
  NASCENTE, RIO, MAR, PRAIA, SERRA_SUL
} from './config.js';

// ============================================================
// 1. DISTÂNCIA TOROIDAL
// ============================================================

export function distanciaToroidal(ax, az, bx, bz) {
  let dx = Math.abs(ax - bx);
  let dz = Math.abs(az - bz);
  if (dx > METADE_MUNDO) dx = TAMANHO_MUNDO - dx;
  if (dz > METADE_MUNDO) dz = TAMANHO_MUNDO - dz;
  return Math.sqrt(dx * dx + dz * dz);
}

// ============================================================
// 2. FUNÇÕES DO RIO
// ============================================================

export function centroRioX(z) {
  if (z < NASCENTE.z) return NASCENTE.x;
  if (z > RIO.zFoz) return RIO.xBase;
  const t = (z - NASCENTE.z) / (RIO.zFoz - NASCENTE.z);
  const xInterp = NASCENTE.x + (RIO.xBase - NASCENTE.x) * t;
  const fator = Math.sin(t * Math.PI);
  return xInterp + Math.sin(t * Math.PI * 3) * RIO.amplitude * fator;
}

export function larguraRio(z) {
  if (z < NASCENTE.z) return 0;
  if (z > RIO.zFoz) return 0;
  const t = (z - NASCENTE.z) / (RIO.zFoz - NASCENTE.z);

  if (t < 0.15) {
    const u = t / 0.15;
    return RIO.larguraNascente + (12 - RIO.larguraNascente) * u;
  } else if (t < 0.25) {
    const u = (t - 0.15) / 0.1;
    return 12 + (RIO.larguraMedia - 12) * u;
  } else if (t < 0.5) {
    return RIO.larguraMedia;
  } else {
    const u = (t - 0.5) / 0.5;
    const u2 = u * u;
    return RIO.larguraMedia + (RIO.larguraFoz - RIO.larguraMedia) * u2;
  }
}

export function distanciaAoRio(x, z) {
  if (z < NASCENTE.z || z > RIO.zFoz) return 9999;
  return Math.abs(x - centroRioX(z));
}

export function distanciaAteAMargemDoRio(x, z) {
  const dist = distanciaAoRio(x, z);
  const largura = larguraRio(z);
  return dist - largura / 2;
}

export function nivelAguaRio(z) {
  if (z < NASCENTE.z) return alturaBase(NASCENTE.x, NASCENTE.z) + 1.0;

  const zFozEstendida = RIO.zFoz + 200;
  if (z > zFozEstendida) return MAR.nivel;
  if (z > RIO.zFoz) return MAR.nivel;

  const t = (z - NASCENTE.z) / (RIO.zFoz - NASCENTE.z);
  const nivelNascente = alturaBase(NASCENTE.x, NASCENTE.z) + 1.0;

  if (t < 0.8) {
    const u = t / 0.8;
    return nivelNascente + (3 - nivelNascente) * u;
  } else {
    const u = (t - 0.8) / 0.2;
    return 3 + (MAR.nivel - 3) * u;
  }
}

// ============================================================
// 3. PESOS (praia, mar, mata, transição)
// ============================================================

export function pesoDaPraia(z) {
  if (z < PRAIA.zInicioAreia) return 0;
  if (z > MAR.zInicio) return 0;
  const t = (z - PRAIA.zInicioAreia) / PRAIA.largura;
  return Math.min(1, t * 1.5);
}

export function pesoDoMar(z) {
  const inicio = MAR.zInicio - 60;
  if (z < inicio) return 0;
  if (z > MAR.zInicio + 60) return 1;
  const t = (z - inicio) / 120;
  return t * t * (3 - 2 * t);
}

export function pesoDaMata(x, z) {
  const dist = distanciaToroidal(x, z, REGIAO_MATA.x, REGIAO_MATA.z);
  const borda = REGIAO_MATA.raio;
  const transicao = 80;
  if (dist < borda - transicao) return 1;
  if (dist > borda) return 0;
  return 1 - (dist - (borda - transicao)) / transicao;
}

export function pesoTransicao(x, z) {
  const dist = distanciaToroidal(x, z, REGIAO_MATA.x, REGIAO_MATA.z);
  if (dist < 350 || dist > 420) return 0;
  return 1 - Math.abs(dist - 385) / 35;
}

// ============================================================
// 4. SERRA
// ============================================================

function perfilSerraZ(z) {
  if (z > SERRA_SUL.zInicioTransicao) return 0;
  if (z > SERRA_SUL.zInicioSerra) {
    const t = (SERRA_SUL.zInicioTransicao - z) /
              (SERRA_SUL.zInicioTransicao - SERRA_SUL.zInicioSerra);
    return t * t * (3 - 2 * t);
  }
  if (z > SERRA_SUL.zPico) {
    const t = (SERRA_SUL.zInicioSerra - z) /
              (SERRA_SUL.zInicioSerra - SERRA_SUL.zPico);
    return t * t * (3 - 2 * t);
  }
  return 1;
}

function perfilSerraX(x) {
  const dist = Math.abs(x - SERRA_SUL.xCentro);
  if (dist < SERRA_SUL.meiaLarguraX * 0.6) return 1;
  if (dist > SERRA_SUL.meiaLarguraX) return 0;
  const t = (SERRA_SUL.meiaLarguraX - dist) / (SERRA_SUL.meiaLarguraX * 0.4);
  return t * t * (3 - 2 * t);
}

export function pesoDaSerra(x, z) {
  return perfilSerraZ(z) * perfilSerraX(x);
}

function cristasSerra(x) {
  const onda = Math.sin(x / SERRA_SUL.comprimentoOnda * Math.PI * 2);
  return 0.4 + (onda * 0.5 + 0.5) * 0.6;
}

function alturaSerraSul(x, z) {
  const perfilZ = perfilSerraZ(z);
  const perfilX = perfilSerraX(x);
  if (perfilZ === 0 || perfilX === 0) return 0;
  const crista = cristasSerra(x);
  return SERRA_SUL.alturaMaxima * perfilZ * perfilX * crista;
}

// ============================================================
// 5. ALTURAS
// ============================================================

function gradienteSulNorte(z) {
  const t = (z + METADE_MUNDO) / TAMANHO_MUNDO;
  return 8 - t * 10;
}

function alturaMorroNascente(x, z) {
  const dx = x - NASCENTE.x;
  const dz = z - NASCENTE.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > 40) return 0;
  const u = dist / 40;
  return NASCENTE.alturaMorro * (1 - u * u);
}

function profundidadeBacia(x, z) {
  const dx = x - NASCENTE.x;
  const dz = z - NASCENTE.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > NASCENTE.raioBacia + 4) return 0;
  if (dist < NASCENTE.raioBacia - 2) return 2.5;
  const u = (dist - (NASCENTE.raioBacia - 2)) / 6;
  return 2.5 * (1 - u);
}

export function alturaBase(x, z) {
  const f1 = (2 * Math.PI) / TAMANHO_MUNDO;
  const f3 = f1 * 3;
  const f5 = f1 * 5;
  const onda1 = Math.sin(x * f3) * Math.cos(z * f3) * 1.5;
  const onda2 = Math.sin(x * f5 + 1.3) * Math.cos(z * f5 + 0.7) * 0.6;
  const onda3 = Math.sin(x * f1 + 4.0) * Math.cos(z * f1 + 2.0) * 2.2;
  let base = onda1 + onda2 + onda3;

  base += gradienteSulNorte(z);
  base += alturaMorroNascente(x, z);
  base -= profundidadeBacia(x, z);
  base += alturaSerraSul(x, z);

  if (z >= NASCENTE.z && z <= RIO.zFoz) {
    const dist = distanciaAoRio(x, z);
    const largura = larguraRio(z);
    const meiaLargura = largura / 2;
    const borda = 6;
    const distNascente = Math.sqrt((x - NASCENTE.x) ** 2 + (z - NASCENTE.z) ** 2);
    if (distNascente > NASCENTE.raioBacia + 2) {
      if (dist < meiaLargura - borda) {
        return base - RIO.profundidade;
      } else if (dist < meiaLargura + borda) {
        const t = (dist - (meiaLargura - borda)) / (borda * 2);
        return base - RIO.profundidade * (1 - t);
      }
    }
  }

  return base;
}

export function alturaDoTerreno(x, z) {
  let base = alturaBase(x, z);

  if (z > PRAIA.zInicioAreia - 40) {
    const t = Math.max(0, Math.min(1, (z - (PRAIA.zInicioAreia - 40)) / 40));
    base = base * (1 - t) + PRAIA.nivel * t;
  }

  const pM = pesoDoMar(z);
  if (pM > 0) {
    base = base * (1 - pM) + (-4) * pM;
  }

  return base;
}

// ============================================================
// 6. REGRAS DE POSICIONAMENTO
// ============================================================

export function posicaoPermitidaParaPlantaComRaio(x, z, raioPlanta) {
  if (z > MAR.zInicio - 5) return false;

  const dNasc = Math.sqrt((x - NASCENTE.x) ** 2 + (z - NASCENTE.z) ** 2);
  if (dNasc < NASCENTE.raioBacia + NASCENTE.margem + raioPlanta) return false;

  if (z >= NASCENTE.z && z <= RIO.zFoz) {
    const margemNecessaria = RIO.margem + raioPlanta;
    if (distanciaAteAMargemDoRio(x, z) < margemNecessaria) return false;
  }

  return true;
}

// ============================================================
// 7. MATA E SUB-REGIÕES
// ============================================================

export function subRegiaoEm(x, z) {
  for (const sr of SUB_REGIOES) {
    if (distanciaToroidal(x, z, sr.x, sr.z) < sr.raio) return sr.nome;
  }
  return null;
}
