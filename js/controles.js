// ============================================================
// CONTROLES — teclado, mouse, toque e câmera
// ============================================================
// Este arquivo cuida de:
//   1. Ler o teclado (computador).
//   2. Ler o mouse (computador): girar a câmera.
//   3. Ler o toque (celular): andar, girar a câmera, planar.
//   4. Calcular a posição da câmera a cada quadro.
//
// A lógica de toque só é ativada se o navegador detectar que
// o dispositivo suporta toque.
// ============================================================

import * as THREE from 'three';

// ============================================================
// DETECÇÃO DE TOQUE
// ============================================================

const temToque = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
console.log('Dispositivo com toque?', temToque);

// ============================================================
// ESTADO INTERNO
// ============================================================

const estado = {
  // Teclado
  teclas: {},

  // Mouse (computador)
  mousePressionado: false,
  mouseXAnterior: 0,
  mouseYAnterior: 0,

  // Toque (celular)
  toqueAtivo: false,
  toqueId: null,
  toqueXInicial: 0,
  toqueYInicial: 0,
  toqueXAtual: 0,
  toqueYAtual: 0,
  modoToque: 'parado',    // 'parado', 'andando', 'olhando'

  // Planar (duplo toque)
  planarAtivo: false,
  ultimoToqueTempo: 0,

  // Câmera
  tempoSemMexerMouse: 0,
  yawCamera: 0,
  pitchCamera: -0.2,
  distanciaCamera: 9,
  alturaCamera: 3.2
};

// Distância em pixels a partir da qual o toque vira "olhar"
const LIMITE_OLHAR = 15;

// Tempo máximo entre dois toques para serem considerados "duplo toque"
const TEMPO_DUPLO_TOQUE = 300;

// ============================================================
// CONFIGURAÇÃO
// ============================================================

export function configurarControles(canvas) {
  // ---------- TECLADO ----------
  window.addEventListener('keydown', (e) => {
    estado.teclas[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    estado.teclas[e.code] = false;
  });

  // ---------- MOUSE ----------
  canvas.addEventListener('mousedown', (e) => {
    estado.mousePressionado = true;
    estado.mouseXAnterior = e.clientX;
    estado.mouseYAnterior = e.clientY;
  });
  window.addEventListener('mouseup', () => {
    estado.mousePressionado = false;
  });
  window.addEventListener('mousemove', (e) => {
    if (!estado.mousePressionado) return;

    const dx = e.clientX - estado.mouseXAnterior;
    const dy = e.clientY - estado.mouseYAnterior;
    estado.mouseXAnterior = e.clientX;
    estado.mouseYAnterior = e.clientY;

    estado.yawCamera -= dx * 0.005;
    estado.pitchCamera -= dy * 0.005;
    estado.pitchCamera = Math.max(-1.1, Math.min(0.35, estado.pitchCamera));
    estado.tempoSemMexerMouse = 0;
  });

  // ---------- TOQUE ----------
  if (temToque) {
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];

      // Detecta toque duplo
      const agora = performance.now();
      const intervalo = agora - estado.ultimoToqueTempo;
      estado.ultimoToqueTempo = agora;

      if (intervalo < TEMPO_DUPLO_TOQUE) {
        // É um duplo toque: entra em modo planar
        estado.planarAtivo = true;
        return;   // não usa esse toque para andar
      }

      // Toque simples: modo andar
      estado.toqueAtivo = true;
      estado.toqueId = t.identifier;
      estado.toqueXInicial = t.clientX;
      estado.toqueYInicial = t.clientY;
      estado.toqueXAtual = t.clientX;
      estado.toqueYAtual = t.clientY;
      estado.modoToque = 'andando';
      estado.mouseXAnterior = t.clientX;
      estado.mouseYAnterior = t.clientY;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== estado.toqueId) continue;

        estado.toqueXAtual = t.clientX;
        estado.toqueYAtual = t.clientY;

        const dx = estado.toqueXAtual - estado.toqueXInicial;
        const dy = estado.toqueYAtual - estado.toqueYInicial;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > LIMITE_OLHAR) {
          // Modo olhar: gira a câmera
          estado.modoToque = 'olhando';

          const dxMov = t.clientX - estado.mouseXAnterior;
          const dyMov = t.clientY - estado.mouseYAnterior;
          estado.mouseXAnterior = t.clientX;
          estado.mouseYAnterior = t.clientY;

          estado.yawCamera -= dxMov * 0.008;
          estado.pitchCamera -= dyMov * 0.008;
          estado.pitchCamera = Math.max(-1.1, Math.min(0.35, estado.pitchCamera));
          estado.tempoSemMexerMouse = 0;
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== estado.toqueId) continue;
        estado.toqueAtivo = false;
        estado.toqueId = null;
        estado.modoToque = 'parado';
      }
      estado.planarAtivo = false;
    }, { passive: false });

    canvas.addEventListener('touchcancel', () => {
      estado.toqueAtivo = false;
      estado.toqueId = null;
      estado.modoToque = 'parado';
      estado.planarAtivo = false;
    });
  }
}

// ============================================================
// LEITURA DE TECLAS
// ============================================================

export function teclasDeAcao() {
  return {
    girarEsquerda: estado.teclas['KeyA'] || estado.teclas['ArrowLeft'],
    girarDireita:  estado.teclas['KeyD'] || estado.teclas['ArrowRight'],
    andarFrente:   estado.teclas['KeyW'] || estado.teclas['ArrowUp'],
    andarTras:     estado.teclas['KeyS'] || estado.teclas['ArrowDown'],
    planar:        estado.teclas['Space'],
    descer:        estado.teclas['ShiftLeft'] || estado.teclas['ShiftRight']
  };
}

// ============================================================
// DIREÇÃO DO TOQUE
// ============================================================

export function direcaoDoToque() {
  if (!temToque || !estado.toqueAtivo || estado.modoToque !== 'andando') {
    return { ativo: false };
  }

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  let dx = (estado.toqueXInicial - cx) / (window.innerWidth / 2);
  let dy = (estado.toqueYInicial - cy) / (window.innerHeight / 2);

  const comprimento = Math.sqrt(dx * dx + dy * dy);
  if (comprimento > 1) {
    dx /= comprimento;
    dy /= comprimento;
  }

  return {
    ativo: true,
    screenX: dx,
    screenY: dy
  };
}

// ============================================================
// PLANAR
// ============================================================

export function estaPlanando() {
  return estado.planarAtivo === true;
}

// ============================================================
// ÂNGULO DA CÂMERA
// ============================================================

export function anguloDaCamera() {
  return estado.yawCamera;
}

// ============================================================
// ATUALIZAÇÃO DA CÂMERA
// ============================================================

export function atualizarCamera(camera, posicaoAvatar, rotacaoYAvatar, dt) {
  estado.tempoSemMexerMouse += dt;

  if (estado.tempoSemMexerMouse > 0.4) {
    let diferenca = rotacaoYAvatar - estado.yawCamera;
    while (diferenca > Math.PI) diferenca -= Math.PI * 2;
    while (diferenca < -Math.PI) diferenca += Math.PI * 2;
    estado.yawCamera += diferenca * 0.5 * dt;
  }

  const offsetX = Math.sin(estado.yawCamera) * Math.cos(estado.pitchCamera) * estado.distanciaCamera;
  const offsetZ = Math.cos(estado.yawCamera) * Math.cos(estado.pitchCamera) * estado.distanciaCamera;
  const offsetY = estado.alturaCamera - Math.sin(estado.pitchCamera) * estado.distanciaCamera;

  camera.position.set(
    posicaoAvatar.x + offsetX,
    posicaoAvatar.y + offsetY,
    posicaoAvatar.z + offsetZ
  );

  camera.lookAt(
    posicaoAvatar.x,
    posicaoAvatar.y + 0.5,
    posicaoAvatar.z
  );
}

// ============================================================
// AJUSTE DE TAMANHO
// ============================================================

export function configurarRedimensionamento(camera, renderizador) {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
  });
}
