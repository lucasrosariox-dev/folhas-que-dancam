// ============================================================
// AVATAR — a folha
// ============================================================
// Cria a folha-avatar como um THREE.Group com três partes:
//   - a lâmina (esfera achatada)
//   - a nervura (cilindro fino no meio)
//   - o cabinho (cilindro curto na traseira)
//
// Dentro do grupo principal, há um grupo interno (folhaInterna)
// que recebe o balanço de "respiração" — sobe e desce
// levemente, sem mexer na posição real.
//
// Este arquivo NÃO controla o movimento. Quem move a folha
// é o game.js (ou o controles.js), passando a nova posição.
// Aqui só existe a forma e a animação dela.
// ============================================================

import * as THREE from 'three';

// ============================================================
// CRIAÇÃO
// ============================================================

// Cria a folha e devolve um objeto com tudo que é preciso
// para mexer nela depois:
//   - grupo: o grupo principal (posição e rotação no mundo)
//   - folhaInterna: o grupo interno (balanço)
//   - lamina: a malha da lâmina (para mexer se precisar)
export function criarAvatar() {
  const grupo = new THREE.Group();

  const folhaInterna = new THREE.Group();
  grupo.add(folhaInterna);

  // --- Lâmina ---
  // Uma esfera muito achatada no eixo Y, e esticada no eixo Z
  // para ficar com formato ovalado de folha.
  const lamina = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xd9c7a3, roughness: 0.9 })
  );
  lamina.scale.set(1, 0.08, 1.7);
  lamina.castShadow = false;
  folhaInterna.add(lamina);

  // --- Nervura ---
  // Um cilindro bem fino, deitado no eixo Z, logo acima
  // da lâmina.
  const nervura = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a7654 })
  );
  nervura.rotation.x = Math.PI / 2;
  nervura.position.y = 0.045;
  folhaInterna.add(nervura);

  // --- Cabinho ---
  // Um cilindro curto, na traseira da folha.
  const cabinho = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.04, 0.35, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a7654 })
  );
  cabinho.rotation.x = Math.PI / 2;
  cabinho.position.set(0, 0, 0.95);
  folhaInterna.add(cabinho);

  return { grupo, folhaInterna, lamina };
}

// ============================================================
// ANIMAÇÃO
// ============================================================
// Atualiza o balanço da folha (respiração).
// Recebe o grupo interno e o tempo total (em segundos).
// A folha sobe e desce levemente, e gira um pouquinho
// nos dois eixos. Isso dá a sensação de flutuar.

export function animarBalanco(folhaInterna, tempoTotal) {
  folhaInterna.position.y = Math.sin(tempoTotal * 1.2) * 0.12;
  folhaInterna.rotation.z = Math.sin(tempoTotal * 0.8) * 0.06;
  folhaInterna.rotation.x = Math.sin(tempoTotal * 1.5) * 0.04;
}