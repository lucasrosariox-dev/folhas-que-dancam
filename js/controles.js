// ============================================================
// CONTROLES — teclado, mouse e câmera
// ============================================================
// Este arquivo cuida de três coisas:
//   1. Ler o teclado e guardar quais teclas estão pressionadas.
//   2. Ler o mouse e girar a câmera quando o botão está pressionado.
//   3. Calcular a posição da câmera a cada quadro, atrás da folha.
//
// NÃO decide o movimento do avatar. Só fornece as teclas
// pressionadas para quem decide (o game.js).
// ============================================================

import * as THREE from 'three';

// ============================================================
// ESTADO INTERNO
// ============================================================
// Guardamos o estado do mouse e da câmera aqui, para não
// poluir o game.js.

const estado = {
  teclas: {},              // quais teclas estão pressionadas
  mousePressionado: false,
  mouseXAnterior: 0,
  mouseYAnterior: 0,
  tempoSemMexerMouse: 0,
  yawCamera: 0,            // giro horizontal da câmera
  pitchCamera: -0.2,       // inclinação vertical
  distanciaCamera: 9,
  alturaCamera: 3.2
};

// ============================================================
// CONFIGURAÇÃO
// ============================================================
// Chama esta função UMA VEZ no início, passando o canvas
// onde os eventos vão ser capturados.

export function configurarControles(canvas) {
  // ---------- TECLADO ----------
  window.addEventListener('keydown', (e) => {
    estado.teclas[e.code] = true;

    // Impede que as setas e o espaço rolem a página
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

    // Zera o contador: o usuário está mexendo no mouse
    estado.tempoSemMexerMouse = 0;
  });
}

// ============================================================
// LEITURA DE TECLAS
// ============================================================
// Fornece as teclas de "ação", juntando teclas alternativas.
// Por exemplo, "andar para frente" é W ou seta para cima.

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
// ATUALIZAÇÃO DA CÂMERA
// ============================================================
// A cada quadro, chamamos esta função passando:
//   - a câmera (a THREE.Camera)
//   - a posição do avatar (um THREE.Vector3)
//   - a rotação Y do avatar (número)
//   - o delta de tempo (dt)
//
// A função faz a câmera seguir o avatar suavemente, sempre
// atrás dele, com o mouse podendo olhar ao redor.

export function atualizarCamera(camera, posicaoAvatar, rotacaoYAvatar, dt) {
  // Conta quanto tempo passou desde o último movimento do mouse
  estado.tempoSemMexerMouse += dt;

  // Se o avatar girou, a câmera também gira — mas com atraso
  // suave. O atraso dá uma sensação melhor do que seguir rígido.
  if (estado.tempoSemMexerMouse > 0.4) {
    let diferenca = rotacaoYAvatar - estado.yawCamera;

    // Normaliza para o intervalo [-π, π] (o caminho mais curto)
    while (diferenca > Math.PI) diferenca -= Math.PI * 2;
    while (diferenca < -Math.PI) diferenca += Math.PI * 2;

    estado.yawCamera += diferenca * 0.5 * dt;
  }

  // Calcula a posição da câmera em coordenadas esféricas
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
// Se a janela mudar de tamanho, atualiza a proporção da câmera.

export function configurarRedimensionamento(camera, renderizador) {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
  });
}