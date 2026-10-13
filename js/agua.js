// ============================================================
// ÁGUA — geometrias do rio, da nascente e do mar
// ============================================================
// Cada função devolve uma BufferGeometry pronta, mas SEM
// material e SEM mesh. Quem monta o mesh é quem chama.
//
// Isso separa "a forma da água" (aqui) de "a aparência
// da água" (no game.js). Se você quiser mudar a cor da
// água, mexe no material em game.js. Se quiser mudar o
// caminho do rio, mexe aqui.
// ============================================================

import * as THREE from 'three';
import { NASCENTE, RIO, MAR } from './config.js';
import {
  centroRioX, larguraRio, nivelAguaRio, alturaBase
} from './mundo.js';

// ============================================================
// RIO
// ============================================================
// A geometria do rio é uma faixa contínua de triângulos que
// segue o caminho do rio. Para cada ponto ao longo do rio,
// criamos dois vértices (margem esquerda e direita) e
// ligamos com triângulos entre pontos consecutivos.
//
// O nível Y de cada vértice vem de nivelAguaRio(z), que
// desce suavemente da nascente até o nível do mar.

export function criarGeometriaRio() {
  const passos = 600;
  const vertices = [];
  const cores = [];
  const indices = [];

  const corRioClara  = new THREE.Color(0x5a9aa8);
  const corRioEscura = new THREE.Color(0x3a6a7a);
  const corMarClara  = new THREE.Color(0x3a6a8a);
  const corMarEscura = new THREE.Color(0x1a3a5a);

  // A extensão da foz: quanto o rio entra dentro do mar
  const zFozEstendida = RIO.zFoz + 200;

  const posicoes = [];
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    // O rio vai da nascente até a foz estendida
    const z = NASCENTE.z + t * (zFozEstendida - NASCENTE.z);

    let cx, largura, y;

    if (z <= RIO.zFoz) {
      // Fase normal: dentro do rio
      cx = centroRioX(z);
      largura = larguraRio(z);
      y = nivelAguaRio(z);
    } else {
      // Fase de dissolução: dentro do mar
      // A largura explode para a largura total do mar
      const t2 = (z - RIO.zFoz) / 200;
      cx = RIO.xBase;
      // largura final da foz + alargamento rápido
      const larguraFozFinal = RIO.larguraFoz + t2 * 400;
      largura = larguraFozFinal;
      y = MAR.nivel;
    }

    posicoes.push({ x: cx - largura / 2, y, z, lado: -1 });
    posicoes.push({ x: cx + largura / 2, y, z, lado: 1 });
  }

  for (let i = 0; i < posicoes.length; i++) {
    const p = posicoes[i];

    vertices.push(p.x, p.y, p.z);

    // Cor: normaliza para saber se estamos na fase normal ou de dissolução
    const tRio = (p.z - NASCENTE.z) / (zFozEstendida - NASCENTE.z);

    // Cor base do rio
    let cor = corRioClara.clone().lerp(
      corRioEscura,
      Math.random() * 0.5 + Math.abs(p.lado) * 0.2
    );

    // Se estamos depois da foz, misturamos com a cor do mar
    if (p.z > RIO.zFoz) {
      const t2 = Math.min(1, (p.z - RIO.zFoz) / 200);
      const corMarLocal = corMarEscura.clone().lerp(
        corMarClara,
        Math.random() * 0.4 + 0.3
      );
      cor.lerp(corMarLocal, t2);
    }

    cores.push(cor.r, cor.g, cor.b);
  }

  for (let i = 0; i < passos; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ============================================================
// BACIA DA NASCENTE
// ============================================================
// Um pequeno disco de água na bacia, ligeiramente acima
// do fundo. Fica no ponto da nascente.

export function criarGeometriaBacia() {
  const geo = new THREE.CircleGeometry(NASCENTE.raioBacia - 1, 24);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

// Retorna a posição Y em que a bacia deve ficar.
// (O mesh é posicionado no game.js.)
export function alturaBacia() {
  return alturaBase(NASCENTE.x, NASCENTE.z) + 1.2;
}

// ============================================================
// MAR
// ============================================================
// Um grande plano horizontal no nível do mar. A cor varia
// perto da foz do rio (onde a água do rio se mistura).

export function criarGeometriaMar() {
  const lado = 5000;
  const geo = new THREE.PlaneGeometry(lado, lado, 60, 60);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const cores = new Float32Array(pos.count * 3);

  const corMarClara = new THREE.Color(0x3a6a8a);
  const corMarEscura = new THREE.Color(0x1a3a5a);
  const corFoz = new THREE.Color(0x5a9aa8);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    let cor = corMarEscura.clone().lerp(
      corMarClara,
      Math.random() * 0.4 + 0.3
    );

    // Perto da foz, a cor se mistura com a do rio
    const distFoz = Math.abs(x - RIO.xBase);
    const zLocal = z + MAR.zInicio + 500;
    if (distFoz < 300 && zLocal < 400) {
      cor.lerp(corFoz, (1 - distFoz / 300) * 0.6);
    }

    cores[i * 3]     = cor.r;
    cores[i * 3 + 1] = cor.g;
    cores[i * 3 + 2] = cor.b;

    pos.setY(i, MAR.nivel);
  }

  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  geo.computeVertexNormals();
  return geo;
}

// Retorna a posição Z em que o mesh do mar deve ficar
// posicionado, para que sua borda sul coincida com o
// início da praia.
export function posicaoZMar() {
  return MAR.zInicio + 2500 - 200;
}