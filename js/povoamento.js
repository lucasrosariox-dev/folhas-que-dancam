// ============================================================
// POVOAMENTO — onde cada planta vai
// ============================================================

import * as THREE from 'three';

import {
  TAMANHO_MUNDO, METADE_MUNDO,
  REGIAO_MATA, NASCENTE, RIO, MAR, PRAIA, SERRA_SUL,
  CORES, RAIO
} from './config.js';

import {
  alturaDoTerreno, distanciaToroidal, subRegiaoEm,
  pesoDaMata, pesoTransicao, pesoDaSerra,
  posicaoPermitidaParaPlantaComRaio
} from './mundo.js';

import {
  geometriaArvoreAlta, geometriaArvoreFrondosa,
  geometriaArvoreRetorcida, geometriaArvoreFlorida,
  geometriaArvoreGigante,
  geometriaArbusto, geometriaGrama, geometriaFlor,
  geometriaSamambaia, geometriaPedra, geometriaRestinga
} from './plantas.js';

// ============================================================
// ESTADO COMPARTILHADO
// ============================================================

export const estado = {
  balancantes: [],
  listasParaColisao: {
    altaFora: [], frondosaFora: [], retorcidaFora: [], giganteFora: [],
    frondosaMata: [], altaMata: [], giganteMata: [],
    frondosaSamambaia: [], giganteBosque: [], frondosaTransicao: [],
    serraRetorcida: [], serraAlta: []
  }
};

const coresCopa     = CORES.copa;
const coresTronco   = CORES.tronco;
const coresIpe      = CORES.ipe;
const coresFlor     = CORES.flor;
const coresPedra    = CORES.pedra;
const coresRestinga = CORES.restinga;

// ============================================================
// AUXILIARES
// ============================================================

function corAleatoria(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function posicaoAleatoriaNoDisco(cx, cz, raio) {
  const angulo = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * raio;
  return { x: cx + Math.cos(angulo) * r, z: cz + Math.sin(angulo) * r };
}

// ============================================================
// ADICIONAR COM DUPLICATA TOROIDAL
// ============================================================

function adicionarComDuplicata(lista, inst, raioPlanta) {
  if (!posicaoPermitidaParaPlantaComRaio(inst.x, inst.z, raioPlanta)) return;
  lista.push(inst);

  const pertoX = Math.abs(inst.x) > METADE_MUNDO - 40;
  const pertoZ = Math.abs(inst.z) > METADE_MUNDO - 40;

  function duplicar(dx, dz) {
    const c = { ...inst };
    c.x += dx;
    c.z += dz;
    if (c.z > MAR.zInicio - 10) return;
    if (!posicaoPermitidaParaPlantaComRaio(c.x, c.z, raioPlanta)) return;
    lista.push(c);
  }

  if (pertoX) duplicar(inst.x > 0 ? -TAMANHO_MUNDO : TAMANHO_MUNDO, 0);
  if (pertoZ) duplicar(0, inst.z > 0 ? -TAMANHO_MUNDO : TAMANHO_MUNDO);
  if (pertoX && pertoZ) duplicar(
    inst.x > 0 ? -TAMANHO_MUNDO : TAMANHO_MUNDO,
    inst.z > 0 ? -TAMANHO_MUNDO : TAMANHO_MUNDO
  );
}

// ============================================================
// MESHES
// ============================================================

function criarInstancedMesh(geometria, lista, material) {
  const mesh = new THREE.InstancedMesh(geometria, material, lista.length);
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  const matriz = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const escalaV = new THREE.Vector3();
  const posV = new THREE.Vector3();
  const eixoY = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < lista.length; i++) {
    const inst = lista[i];
    posV.set(inst.x, inst.y, inst.z);
    quaternion.setFromAxisAngle(eixoY, inst.rotY);
    escalaV.setScalar(inst.escala);
    matriz.compose(posV, quaternion, escalaV);
    mesh.setMatrixAt(i, matriz);
    if (inst.cor) mesh.setColorAt(i, inst.cor);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function criarMeshBalançante(geometria, lista, material, amplitude) {
  const mesh = criarInstancedMesh(geometria, lista, material);
  const fases = [];
  const amplitudes = [];
  for (let i = 0; i < lista.length; i++) {
    fases.push(Math.random() * Math.PI * 2);
    amplitudes.push(amplitude * (0.6 + Math.random() * 0.8));
  }
  estado.balancantes.push({ mesh, lista, fases, amplitudes });
  return mesh;
}

// ============================================================
// FUNÇÕES DE POSIÇÃO
// ============================================================

function posForaDaMata() {
  let x, z;
  do {
    x = (Math.random() - 0.5) * TAMANHO_MUNDO;
    z = (Math.random() - 0.5) * TAMANHO_MUNDO;
  } while (
    pesoDaMata(x, z) > 0.1 ||
    Math.sqrt(x*x + z*z) < 5 ||
    z > PRAIA.zInicioAreia - 10 ||
    pesoDaSerra(x, z) > 0.05
  );
  return { x, z };
}

function posNaMataComum() {
  let x, z;
  do {
    const p = posicaoAleatoriaNoDisco(REGIAO_MATA.x, REGIAO_MATA.z, REGIAO_MATA.raio);
    x = p.x; z = p.z;
  } while (subRegiaoEm(x, z) !== null);
  return { x, z };
}

function posNaClareira() {
  return posicaoAleatoriaNoDisco(-300, -300, 50);
}

function posNoBosqueSamambaias() {
  return posicaoAleatoriaNoDisco(-180, -420, 90);
}

function posNoBosqueGigantes() {
  return posicaoAleatoriaNoDisco(-420, -180, 90);
}

function posNaTransicao() {
  let x, z;
  do {
    x = (Math.random() - 0.5) * TAMANHO_MUNDO;
    z = (Math.random() - 0.5) * TAMANHO_MUNDO;
  } while (pesoTransicao(x, z) < 0.3 || z > PRAIA.zInicioAreia - 10);
  return { x, z };
}

function posNaMargemDoRio() {
  let x, z;
  do {
    z = NASCENTE.z + Math.random() * (RIO.zFoz - NASCENTE.z);
    const t = (z - NASCENTE.z) / (RIO.zFoz - NASCENTE.z);
    const xInterp = NASCENTE.x + (RIO.xBase - NASCENTE.x) * t;
    const fator = Math.sin(t * Math.PI);
    const cx = xInterp + Math.sin(t * Math.PI * 3) * RIO.amplitude * fator;

    let largura;
    if (t < 0.15) {
      largura = RIO.larguraNascente + (12 - RIO.larguraNascente) * (t / 0.15);
    } else if (t < 0.25) {
      largura = 12 + (RIO.larguraMedia - 12) * ((t - 0.15) / 0.1);
    } else if (t < 0.5) {
      largura = RIO.larguraMedia;
    } else {
      const u = (t - 0.5) / 0.5;
      largura = RIO.larguraMedia + (RIO.larguraFoz - RIO.larguraMedia) * u * u;
    }

    const lado = Math.random() < 0.5 ? -1 : 1;
    x = cx + lado * (largura / 2 + RIO.margem + 1 + Math.random() * 8);
  } while (Math.abs(x) > METADE_MUNDO - 5);
  return { x, z };
}

function posDentroDoRio() {
  let x, z;
  do {
    z = NASCENTE.z + Math.random() * (RIO.zFoz - NASCENTE.z);
    const t = (z - NASCENTE.z) / (RIO.zFoz - NASCENTE.z);
    const xInterp = NASCENTE.x + (RIO.xBase - NASCENTE.x) * t;
    const fator = Math.sin(t * Math.PI);
    const cx = xInterp + Math.sin(t * Math.PI * 3) * RIO.amplitude * fator;

    let largura;
    if (t < 0.15) {
      largura = RIO.larguraNascente + (12 - RIO.larguraNascente) * (t / 0.15);
    } else if (t < 0.25) {
      largura = 12 + (RIO.larguraMedia - 12) * ((t - 0.15) / 0.1);
    } else if (t < 0.5) {
      largura = RIO.larguraMedia;
    } else {
      const u = (t - 0.5) / 0.5;
      largura = RIO.larguraMedia + (RIO.larguraFoz - RIO.larguraMedia) * u * u;
    }

    x = cx + (Math.random() - 0.5) * largura * 0.9;
  } while (Math.abs(x) > METADE_MUNDO - 5);
  return { x, z };
}

function posNaRestinga() {
  const z = PRAIA.zInicioAreia + 10 + Math.random() * (PRAIA.largura - 20);
  const x = (Math.random() - 0.5) * TAMANHO_MUNDO * 0.9;
  return { x, z };
}

function posAoRedorDaNascente() {
  const angulo = Math.random() * Math.PI * 2;
  const r = NASCENTE.raioBacia + NASCENTE.margem + Math.random() * 8;
  return {
    x: NASCENTE.x + Math.cos(angulo) * r,
    z: NASCENTE.z + Math.sin(angulo) * r
  };
}

function posNaSerra() {
  let x, z;
  do {
    z = SERRA_SUL.zInicioSerra - Math.random() * (SERRA_SUL.zInicioSerra - SERRA_SUL.zFim);
    x = SERRA_SUL.xCentro + (Math.random() - 0.5) * SERRA_SUL.meiaLarguraX * 2;
  } while (pesoDaSerra(x, z) < 0.3);
  return { x, z };
}

// ============================================================
// AGENDAR LOTE
// ============================================================

let cenaAtual = null;

function agendarLote(fila, quantidadeTotal, funcaoPosicao,
                     escalaMin, escalaMax, cores,
                     geoFuncao, listaColisao, amplitude,
                     material, raioPlanta) {
  const POR_LOTE = 30;
  const lista = [];
  let criados = 0;
  let tentativas = 0;
  const maxTentativas = quantidadeTotal * 10;

  function proximoLote() {
    while (criados < quantidadeTotal && tentativas < maxTentativas) {
      const { x, z } = funcaoPosicao();
      tentativas++;
      if (!posicaoPermitidaParaPlantaComRaio(x, z, raioPlanta)) continue;

      const y = alturaDoTerreno(x, z);
      const escala = escalaMin + Math.random() * (escalaMax - escalaMin);
      const rotY = Math.random() * Math.PI * 2;
      const inst = { x, y, z, rotY, escala };
      if (cores) inst.cor = new THREE.Color(corAleatoria(cores));

      adicionarComDuplicata(lista, inst, raioPlanta);
      criados++;
    }

    if (criados < quantidadeTotal && tentativas < maxTentativas) {
      fila.push(proximoLote);
    } else {
      const geo = geoFuncao();
      const mesh = amplitude > 0
        ? criarMeshBalançante(geo, lista, material, amplitude)
        : criarInstancedMesh(geo, lista, material);
      cenaAtual.add(mesh);
      if (listaColisao) {
        for (const inst of lista) listaColisao.push(inst);
      }
    }
  }

  fila.push(proximoLote);
}

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

export function povoarMundo(cena, fila) {
  cenaAtual = cena;

  const materialArvores = new THREE.MeshStandardMaterial({
    color: 0xffffff, flatShading: true, roughness: 0.9
  });
  const materialSubBosque = new THREE.MeshStandardMaterial({
    color: 0xffffff, flatShading: true, roughness: 0.95
  });

  // Árvores fora da mata
  agendarLote(fila, 500, posForaDaMata, 0.8, 1.4, coresCopa,
    geometriaArvoreAlta, estado.listasParaColisao.altaFora, 0.03,
    materialArvores, RAIO.arvoreAlta);
  agendarLote(fila, 400, posForaDaMata, 0.8, 1.3, coresCopa,
    geometriaArvoreFrondosa, estado.listasParaColisao.frondosaFora, 0.03,
    materialArvores, RAIO.arvoreFrondosa);
  agendarLote(fila, 400, posForaDaMata, 0.8, 1.3, coresCopa,
    geometriaArvoreRetorcida, estado.listasParaColisao.retorcidaFora, 0.04,
    materialArvores, RAIO.arvoreRetorcida);
  agendarLote(fila, 200, posForaDaMata, 0.9, 1.4, coresIpe,
    geometriaArvoreFlorida, null, 0.03,
    materialArvores, RAIO.arvoreFlorida);
  agendarLote(fila, 40, posForaDaMata, 0.9, 1.2, coresTronco,
    geometriaArvoreGigante, estado.listasParaColisao.giganteFora, 0.015,
    materialArvores, RAIO.arvoreGigante);

  // Árvores dentro da mata
  agendarLote(fila, 600, posNaMataComum, 0.9, 1.5, coresCopa,
    geometriaArvoreFrondosa, estado.listasParaColisao.frondosaMata, 0.03,
    materialArvores, RAIO.arvoreFrondosa);
  agendarLote(fila, 300, posNaMataComum, 0.9, 1.4, coresCopa,
    geometriaArvoreAlta, estado.listasParaColisao.altaMata, 0.03,
    materialArvores, RAIO.arvoreAlta);
  agendarLote(fila, 60, posNaMataComum, 1.0, 1.3, coresTronco,
    geometriaArvoreGigante, estado.listasParaColisao.giganteMata, 0.015,
    materialArvores, RAIO.arvoreGigante);

  // Clareira
  agendarLote(fila, 400, posNaClareira, 0.8, 1.5, coresCopa,
    geometriaGrama, null, 0, materialSubBosque, RAIO.grama);
  agendarLote(fila, 300, posNaClareira, 0.9, 1.5, coresFlor,
    geometriaFlor, null, 0, materialSubBosque, RAIO.flor);
  agendarLote(fila, 20, posNaClareira, 0.6, 1.0, coresCopa,
    geometriaArbusto, null, 0.06, materialSubBosque, RAIO.arbusto);

  // Bosque de samambaias
  agendarLote(fila, 800, posNoBosqueSamambaias, 0.8, 1.4, coresCopa,
    geometriaSamambaia, null, 0.08, materialSubBosque, RAIO.samambaia);
  agendarLote(fila, 500, posNoBosqueSamambaias, 0.7, 1.3, coresCopa,
    geometriaGrama, null, 0, materialSubBosque, RAIO.grama);
  agendarLote(fila, 30, posNoBosqueSamambaias, 0.8, 1.2, coresCopa,
    geometriaArvoreFrondosa, estado.listasParaColisao.frondosaSamambaia, 0.03,
    materialArvores, RAIO.arvoreFrondosa);

  // Bosque de gigantes
  agendarLote(fila, 80, posNoBosqueGigantes, 1.0, 1.4, coresTronco,
    geometriaArvoreGigante, estado.listasParaColisao.giganteBosque, 0.015,
    materialArvores, RAIO.arvoreGigante);
  agendarLote(fila, 200, posNoBosqueGigantes, 0.6, 1.2, coresCopa,
    geometriaGrama, null, 0, materialSubBosque, RAIO.grama);
  agendarLote(fila, 40, posNoBosqueGigantes, 0.6, 1.2, coresCopa,
    geometriaArbusto, null, 0.06, materialSubBosque, RAIO.arbusto);

  // Zona de transição
  agendarLote(fila, 150, posNaTransicao, 0.7, 1.1, coresCopa,
    geometriaArvoreFrondosa, estado.listasParaColisao.frondosaTransicao, 0.03,
    materialArvores, RAIO.arvoreFrondosa);
  agendarLote(fila, 200, posNaTransicao, 0.7, 1.2, coresCopa,
    geometriaArbusto, null, 0.06, materialSubBosque, RAIO.arbusto);
  agendarLote(fila, 300, posNaTransicao, 0.8, 1.3, coresFlor,
    geometriaFlor, null, 0, materialSubBosque, RAIO.flor);

  // Sub-bosque geral
  agendarLote(fila, 400, posForaDaMata, 0.7, 1.4, coresCopa,
    geometriaArbusto, null, 0.06, materialSubBosque, RAIO.arbusto);
  agendarLote(fila, 3000, posForaDaMata, 0.7, 1.5, coresCopa,
    geometriaGrama, null, 0, materialSubBosque, RAIO.grama);
  agendarLote(fila, 1000, posForaDaMata, 0.8, 1.4, coresFlor,
    geometriaFlor, null, 0, materialSubBosque, RAIO.flor);

  // Margem do rio
  agendarLote(fila, 200, posNaMargemDoRio, 0.7, 1.2, coresCopa,
    geometriaArbusto, null, 0.06, materialSubBosque, RAIO.arbusto);
  agendarLote(fila, 150, posNaMargemDoRio, 0.8, 1.3, coresCopa,
    geometriaSamambaia, null, 0.08, materialSubBosque, RAIO.samambaia);
  agendarLote(fila, 500, posNaMargemDoRio, 0.7, 1.4, coresCopa,
    geometriaGrama, null, 0, materialSubBosque, RAIO.grama);
  agendarLote(fila, 80, posNaMargemDoRio, 0.8, 1.3, coresFlor,
    geometriaFlor, null, 0, materialSubBosque, RAIO.flor);

  // Pedras
  agendarLote(fila, 80, posNaMargemDoRio, 0.5, 1.5, coresPedra,
    geometriaPedra, null, 0, materialSubBosque, RAIO.pedra);
  agendarLote(fila, 120, posDentroDoRio, 0.4, 1.8, coresPedra,
    geometriaPedra, null, 0, materialSubBosque, 0);

  // Restinga
  agendarLote(fila, 200, posNaRestinga, 0.6, 1.2, coresRestinga,
    geometriaRestinga, null, 0.06, materialSubBosque, RAIO.restinga);
  agendarLote(fila, 150, posNaRestinga, 0.5, 1.0, coresRestinga,
    geometriaGrama, null, 0, materialSubBosque, RAIO.grama);
  agendarLote(fila, 80, posNaRestinga, 0.6, 1.3, coresCopa,
    geometriaArbusto, null, 0.06, materialSubBosque, RAIO.arbusto);
  agendarLote(fila, 60, posNaRestinga, 0.5, 1.0, coresPedra,
    geometriaPedra, null, 0, materialSubBosque, RAIO.pedra);

  // Vegetação ao redor da nascente
  agendarLote(fila, 30, posAoRedorDaNascente, 1.0, 1.6, coresCopa,
    geometriaSamambaia, null, 0.08, materialSubBosque, RAIO.samambaia);
  agendarLote(fila, 20, posAoRedorDaNascente, 0.8, 1.3, coresCopa,
    geometriaArbusto, null, 0.06, materialSubBosque, RAIO.arbusto);
  agendarLote(fila, 50, posAoRedorDaNascente, 0.7, 1.4, coresCopa,
    geometriaGrama, null, 0, materialSubBosque, RAIO.grama);
  agendarLote(fila, 20, posAoRedorDaNascente, 0.6, 1.4, coresPedra,
    geometriaPedra, null, 0, materialSubBosque, RAIO.pedra);

  // ---------- SERRA ----------
  agendarLote(fila, 200, posNaSerra, 0.9, 1.3, coresCopa,
    geometriaArvoreRetorcida, estado.listasParaColisao.serraRetorcida, 0.04,
    materialArvores, RAIO.arvoreRetorcida);
  agendarLote(fila, 100, posNaSerra, 0.9, 1.4, coresCopa,
    geometriaArvoreAlta, estado.listasParaColisao.serraAlta, 0.03,
    materialArvores, RAIO.arvoreAlta);
  agendarLote(fila, 300, posNaSerra, 0.6, 1.2, coresCopa,
    geometriaArbusto, null, 0.06, materialSubBosque, RAIO.arbusto);
  agendarLote(fila, 800, posNaSerra, 0.6, 1.4, coresCopa,
    geometriaGrama, null, 0, materialSubBosque, RAIO.grama);
  agendarLote(fila, 150, posNaSerra, 0.4, 1.6, coresPedra,
    geometriaPedra, null, 0, materialSubBosque, RAIO.pedra);
  agendarLote(fila, 80, posNaSerra, 0.8, 1.3, coresCopa,
    geometriaSamambaia, null, 0.08, materialSubBosque, RAIO.samambaia);
}