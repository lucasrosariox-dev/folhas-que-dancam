// ============================================================
// PLANTAS — as geometrias de cada planta
// ============================================================
// Cada função devolve UMA geometria única, feita a partir
// de várias formas fundidas com mergeGeometries.
//
// Por que uma geometria só? Porque o InstancedMesh (que
// desenha milhares de plantas de uma vez) só aceita uma
// geometria por vez. Então juntamos todas as partes
// (tronco + copa + galhos) em uma única malha.
//
// Este arquivo NÃO decide onde plantar. Só cria a forma.
// ============================================================

import * as THREE from 'three';
import { mergeGeometries } from '../libs/BufferGeometryUtils.js';

// ============================================================
// ÁRVORES
// ============================================================

// --- ÁRVORE ALTA (guapuruvu) ---
// Tronco fino e muito alto, copa achatada no topo.
export function geometriaArvoreAlta() {
  const partes = [];

  const tronco = new THREE.CylinderGeometry(0.15, 0.28, 7, 6);
  tronco.translate(0, 3.5, 0);
  partes.push(tronco);

  const copa1 = new THREE.SphereGeometry(2.0, 7, 5);
  copa1.scale(1, 0.4, 1);
  copa1.translate(0, 7.5, 0);
  partes.push(copa1);

  const copa2 = new THREE.SphereGeometry(1.5, 7, 5);
  copa2.scale(1, 0.4, 1);
  copa2.translate(0, 8.5, 0);
  partes.push(copa2);

  return mergeGeometries(partes);
}

// --- ÁRVORE FRONDOSA ---
// Tronco médio, copa densa de várias esferas.
export function geometriaArvoreFrondosa() {
  const partes = [];

  const tronco = new THREE.CylinderGeometry(0.25, 0.4, 4, 7);
  tronco.translate(0, 2, 0);
  partes.push(tronco);

  for (let i = 0; i < 4; i++) {
    const esfera = new THREE.SphereGeometry(1.1, 6, 5);
    esfera.translate(
      (Math.random() - 0.5) * 1.4,
      4 + Math.random() * 1.2,
      (Math.random() - 0.5) * 1.4
    );
    partes.push(esfera);
  }

  return mergeGeometries(partes);
}

// --- ÁRVORE RETORCIDA ---
// Tronco fino, copa achatada e inclinada.
export function geometriaArvoreRetorcida() {
  const partes = [];

  const tronco = new THREE.CylinderGeometry(0.15, 0.25, 3.5, 5);
  tronco.translate(0, 1.75, 0);
  partes.push(tronco);

  const copa = new THREE.SphereGeometry(1.3, 6, 5);
  copa.scale(1, 0.7, 1);
  copa.translate(0, 4, 0);
  partes.push(copa);

  const g = mergeGeometries(partes);
  g.rotateZ((Math.random() - 0.5) * 0.25);
  return g;
}

// --- ÁRVORE FLORIDA (ipê) ---
// Pequena, copa amarela.
export function geometriaArvoreFlorida() {
  const partes = [];

  const tronco = new THREE.CylinderGeometry(0.12, 0.2, 2.5, 6);
  tronco.translate(0, 1.25, 0);
  partes.push(tronco);

  for (let i = 0; i < 4; i++) {
    const esfera = new THREE.SphereGeometry(0.8, 6, 5);
    esfera.translate(
      (Math.random() - 0.5) * 1.2,
      2.6 + Math.random() * 0.8,
      (Math.random() - 0.5) * 1.2
    );
    partes.push(esfera);
  }

  return mergeGeometries(partes);
}

// --- ÁRVORE GIGANTE (jequitibá) ---
// Tronco grosso, copa enorme.
export function geometriaArvoreGigante() {
  const partes = [];

  const tronco = new THREE.CylinderGeometry(0.7, 1.2, 12, 9);
  tronco.translate(0, 6, 0);
  partes.push(tronco);

  for (let i = 0; i < 5; i++) {
    const copa = new THREE.SphereGeometry(2, 7, 6);
    copa.translate(
      (Math.random() - 0.5) * 3.5,
      12 + Math.random() * 2.5,
      (Math.random() - 0.5) * 3.5
    );
    partes.push(copa);
  }

  return mergeGeometries(partes);
}

// ============================================================
// SUB-BOSQUE
// ============================================================

// --- ARBUSTO ---
// Três esferas verdes baixas.
export function geometriaArbusto() {
  const partes = [];
  for (let i = 0; i < 3; i++) {
    const esfera = new THREE.SphereGeometry(0.5 + Math.random() * 0.3, 6, 5);
    esfera.translate(
      (Math.random() - 0.5) * 0.8,
      0.4,
      (Math.random() - 0.5) * 0.8
    );
    partes.push(esfera);
  }
  return mergeGeometries(partes);
}

// --- GRAMA ---
// Cinco folhas em cone, levemente inclinadas.
export function geometriaGrama() {
  const partes = [];
  for (let i = 0; i < 5; i++) {
    const altura = 0.4 + Math.random() * 0.5;
    const folha = new THREE.ConeGeometry(0.05, altura, 3);
    folha.rotateZ((Math.random() - 0.5) * 0.5);
    folha.rotateX((Math.random() - 0.5) * 0.5);
    folha.translate(
      (Math.random() - 0.5) * 0.35,
      altura / 2,
      (Math.random() - 0.5) * 0.35
    );
    partes.push(folha);
  }
  return mergeGeometries(partes);
}

// --- FLOR ---
// Haste fina + pequena esfera como pétala.
export function geometriaFlor() {
  const partes = [];

  const haste = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4);
  haste.translate(0, 0.2, 0);
  partes.push(haste);

  const petala = new THREE.SphereGeometry(0.1, 6, 5);
  petala.translate(0, 0.42, 0);
  partes.push(petala);

  return mergeGeometries(partes);
}

// --- SAMAMBAIA ---
// Várias folhas longas e finas, arqueadas para fora.
export function geometriaSamambaia() {
  const partes = [];
  const quantidade = 8 + Math.floor(Math.random() * 5);

  for (let i = 0; i < quantidade; i++) {
    const altura = 1.2 + Math.random() * 0.8;
    const folha = new THREE.CylinderGeometry(0.03, 0.01, altura, 4);

    const angulo = (i / quantidade) * Math.PI * 2 + Math.random() * 0.3;
    const inclinacao = 0.5 + Math.random() * 0.5;

    folha.rotateZ(Math.cos(angulo) * inclinacao);
    folha.rotateX(-Math.sin(angulo) * inclinacao);
    folha.translate(
      Math.cos(angulo) * 0.15,
      altura / 2,
      Math.sin(angulo) * 0.15
    );
    partes.push(folha);
  }
  return mergeGeometries(partes);
}

// --- PEDRA ---
// Dodecaedro achatado.
export function geometriaPedra() {
  const g = new THREE.DodecahedronGeometry(1, 0);
  g.scale(1, 0.6, 1);
  return g;
}

// --- RESTINGA ---
// Vegetação de praia: folhas curtas + pequenas esferas.
export function geometriaRestinga() {
  const partes = [];

  // Folhas longas e baixas
  for (let i = 0; i < 6; i++) {
    const altura = 0.6 + Math.random() * 0.6;
    const folha = new THREE.ConeGeometry(0.08, altura, 3);
    const angulo = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
    folha.rotateZ(Math.cos(angulo) * 0.4);
    folha.rotateX(-Math.sin(angulo) * 0.4);
    folha.translate(
      Math.cos(angulo) * 0.2,
      altura / 2,
      Math.sin(angulo) * 0.2
    );
    partes.push(folha);
  }

  // Pequenas esferas
  for (let i = 0; i < 3; i++) {
    const esfera = new THREE.SphereGeometry(0.25 + Math.random() * 0.15, 5, 4);
    esfera.translate(
      (Math.random() - 0.5) * 0.5,
      0.3,
      (Math.random() - 0.5) * 0.5
    );
    partes.push(esfera);
  }

  return mergeGeometries(partes);
}

// ============================================================
// PÁSSARO
// ============================================================
// Corpo alongado + duas asas em V.

export function geometriaPassaro() {
  const partes = [];

  const corpo = new THREE.SphereGeometry(0.15, 6, 5);
  corpo.scale(1, 0.7, 2.2);
  partes.push(corpo);

  const asaEsq = new THREE.PlaneGeometry(1.0, 0.3);
  asaEsq.rotateX(Math.PI / 2);
  asaEsq.rotateZ(0.4);
  asaEsq.translate(-0.5, 0, 0);
  partes.push(asaEsq);

  const asaDir = new THREE.PlaneGeometry(1.0, 0.3);
  asaDir.rotateX(Math.PI / 2);
  asaDir.rotateZ(-0.4);
  asaDir.translate(0.5, 0, 0);
  partes.push(asaDir);

  return mergeGeometries(partes);
}