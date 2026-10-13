// ============================================================
// FOLHAS QUE DANÇAM — game.js
// ============================================================
// Cérebro do jogo. Monta cena, roda loop, consome a fila.
// A complexidade está distribuída em módulos (js/).
// ============================================================

import * as THREE from 'three';

import {
  TAMANHO_MUNDO, METADE_MUNDO, TAMANHO_CHAO,
  VELOCIDADE_AVATAR, VELOCIDADE_GIRO,
  ALTURA_VOO_PADRAO, ALTURA_VOO_MAXIMA,
  VELOCIDADE_SUBIDA, VELOCIDADE_DESCIDA, GRAVIDADE,
  REGIAO_MATA, NASCENTE, RIO, MAR, PRAIA
} from './js/config.js';

import {
  alturaDoTerreno,
  centroRioX, larguraRio, distanciaAoRio, distanciaAteAMargemDoRio,
  pesoDaMata, pesoTransicao, pesoDoMar, pesoDaPraia, pesoDaSerra,
  subRegiaoEm, distanciaToroidal
} from './js/mundo.js';

import {
  criarGeometriaRio, criarGeometriaBacia, alturaBacia,
  criarGeometriaMar, posicaoZMar
} from './js/agua.js';

import { criarAvatar, animarBalanco } from './js/avatar.js';

import {
  configurarControles, teclasDeAcao,
  atualizarCamera, configurarRedimensionamento
} from './js/controles.js';

import { povoarMundo, estado as estadoPovoamento } from './js/povoamento.js';

import { geometriaPassaro } from './js/plantas.js';

import { criarPassaros, atualizarPassaros } from './js/passaros.js';

// ============================================================
// CENA, CÂMERA, RENDERIZADOR
// ============================================================

const cena = new THREE.Scene();
cena.background = new THREE.Color(0x8aa07a);
cena.fog = new THREE.Fog(0x8aa07a, 60, 260);

const camera = new THREE.PerspectiveCamera(
  62,
  window.innerWidth / window.innerHeight,
  0.1,
  3000
);

const renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.shadowMap.enabled = false;
document.getElementById('jogo').appendChild(renderizador.domElement);

// ============================================================
// LUZES
// ============================================================

const luzAmbiente = new THREE.AmbientLight(0xa8c49a, 0.85);
cena.add(luzAmbiente);

const luzSol = new THREE.DirectionalLight(0xfff0cc, 1.4);
luzSol.position.set(60, 90, 40);
luzSol.castShadow = false;
cena.add(luzSol);

const luzPreenchimento = new THREE.DirectionalLight(0x6a8a5a, 0.35);
luzPreenchimento.position.set(-40, 30, -50);
cena.add(luzPreenchimento);

// ============================================================
// CHÃO
// ============================================================

const SEGMENTOS_CHAO = 400;
const geometriaChao = new THREE.PlaneGeometry(
  TAMANHO_CHAO, TAMANHO_CHAO,
  SEGMENTOS_CHAO, SEGMENTOS_CHAO
);
geometriaChao.rotateX(-Math.PI / 2);

const posicoesChao = geometriaChao.attributes.position;
const coresChao = new Float32Array(posicoesChao.count * 3);

const corChaoClaro     = new THREE.Color(0x4a5c3a);
const corChaoMata      = new THREE.Color(0x1e2e1c);
const corChaoClareira  = new THREE.Color(0x6a7a3a);
const corChaoSamambaia = new THREE.Color(0x16281a);
const corChaoGigantes  = new THREE.Color(0x2a2418);
const corChaoTransicao = new THREE.Color(0x3a4a2e);
const corLeitoRio      = new THREE.Color(0x3a3528);
const corAreia         = new THREE.Color(0xc8b888);
const corAreiaMolhada  = new THREE.Color(0xa89878);
const corFundoMar      = new THREE.Color(0x2a4a5a);
const corSerraPedra    = new THREE.Color(0x5a5a4a);

const TOTAL_VERTICES = posicoesChao.count;
const VERTICES_POR_TAREFA = Math.ceil(TOTAL_VERTICES / 40);
let proximoVertice = 0;

function processarPedacoChao() {
  const fim = Math.min(proximoVertice + VERTICES_POR_TAREFA, TOTAL_VERTICES);
  for (let i = proximoVertice; i < fim; i++) {
    const x = posicoesChao.getX(i);
    const z = posicoesChao.getZ(i);
    posicoesChao.setY(i, alturaDoTerreno(x, z));

    let cor = corChaoClaro.clone();
    const pesoMata = pesoDaMata(x, z);
    cor.lerp(corChaoMata, pesoMata);
    const pesoTrans = pesoTransicao(x, z);
    cor.lerp(corChaoTransicao, pesoTrans * 0.8);

    const sr = subRegiaoEm(x, z);
    if (sr === 'clareira') cor.lerp(corChaoClareira, 0.85);
    else if (sr === 'samambaias') cor.lerp(corChaoSamambaia, 0.85);
    else if (sr === 'gigantes') cor.lerp(corChaoGigantes, 0.85);

    if (z >= NASCENTE.z && z <= RIO.zFoz) {
      const dist = distanciaAoRio(x, z);
      const largura = larguraRio(z);
      if (dist < largura / 2) cor.lerp(corLeitoRio, 0.9);
    }

    const distNascente = Math.sqrt((x - NASCENTE.x) ** 2 + (z - NASCENTE.z) ** 2);
    if (distNascente < NASCENTE.raioBacia + 2) cor.lerp(corLeitoRio, 0.9);

    const pesoP = pesoDaPraia(z);
    if (pesoP > 0) {
      const distMar = Math.abs(z - MAR.zInicio);
      if (distMar < 30) cor.lerp(corAreiaMolhada, pesoP);
      else cor.lerp(corAreia, pesoP);
    }

    const pM = pesoDoMar(z);
    if (pM > 0.5) cor.lerp(corFundoMar, (pM - 0.5) * 2 * 0.95);

    // Serra ao sul: tom mais frio e rochoso
    const pesoSerraChao = pesoDaSerra(x, z);
    if (pesoSerraChao > 0) {
      cor.lerp(corSerraPedra, pesoSerraChao * 0.8);
    }

    coresChao[i * 3]     = cor.r;
    coresChao[i * 3 + 1] = cor.g;
    coresChao[i * 3 + 2] = cor.b;
  }
  proximoVertice = fim;

  if (proximoVertice >= TOTAL_VERTICES) {
    geometriaChao.setAttribute('color', new THREE.BufferAttribute(coresChao, 3));
    geometriaChao.computeVertexNormals();

    const chao = new THREE.Mesh(
      geometriaChao,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1.0 })
    );
    chao.receiveShadow = false;
    cena.add(chao);
  }
}

// ============================================================
// AVATAR
// ============================================================

const avatarObjeto = criarAvatar();
const avatar = avatarObjeto.grupo;
const folhaInterna = avatarObjeto.folhaInterna;

avatar.position.set(100, ALTURA_VOO_PADRAO, 100);
cena.add(avatar);

let alturaVoo = ALTURA_VOO_PADRAO;

// ============================================================
// ÁGUA
// ============================================================

const geometriaRio = criarGeometriaRio();
const materialRio = new THREE.MeshStandardMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  roughness: 0.2,
  metalness: 0.5,
  side: THREE.DoubleSide
});
cena.add(new THREE.Mesh(geometriaRio, materialRio));

const geometriaBacia = criarGeometriaBacia();
const materialBacia = new THREE.MeshStandardMaterial({
  color: 0x5a9aa8,
  transparent: true,
  opacity: 0.85,
  roughness: 0.15,
  metalness: 0.5,
  side: THREE.DoubleSide
});
const meshBacia = new THREE.Mesh(geometriaBacia, materialBacia);
meshBacia.position.set(NASCENTE.x, alturaBacia(), NASCENTE.z);
cena.add(meshBacia);

const geometriaMar = criarGeometriaMar();
const materialMar = new THREE.MeshStandardMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0.88,
  roughness: 0.15,
  metalness: 0.6,
  side: THREE.DoubleSide
});
const meshMar = new THREE.Mesh(geometriaMar, materialMar);
meshMar.position.z = posicaoZMar();
cena.add(meshMar);

// ============================================================
// BANDOS VOANDO
// ============================================================

const bandos = [];

function criarBando(quantidade) {
  const geo = geometriaPassaro();
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, flatShading: true });
  const mesh = new THREE.InstancedMesh(geo, mat, quantidade);
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  const bando = {
    mesh, quantidade,
    pos: new THREE.Vector3(
      (Math.random() - 0.5) * TAMANHO_MUNDO,
      25 + Math.random() * 20,
      (Math.random() - 0.5) * TAMANHO_MUNDO
    ),
    dir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
    vel: 6 + Math.random() * 4,
    tempo: Math.random() * 100,
    offsets: []
  };
  for (let i = 0; i < quantidade; i++) {
    bando.offsets.push({
      x: (Math.random() - 0.5) * 6,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 6,
      faseAsa: Math.random() * Math.PI * 2
    });
  }
  cena.add(mesh);
  bandos.push(bando);
}

// Muitos bandos voando pelo céu
for (let i = 0; i < 15; i++) {
  criarBando(8 + Math.floor(Math.random() * 6));
}

// ============================================================
// PERGAMINHOS
// ============================================================

function gerarPontos() {
  const pontos = [];
  let contador = 0;
  function adicionar(x, z) {
    if (z > MAR.zInicio - 30) return;
    contador++;
    pontos.push({ id: 'p' + contador.toString().padStart(3, '0'), x, z });
  }

  for (let i = 0; i < 50; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const r = 50 + Math.random() * 320;
    const x = REGIAO_MATA.x + Math.cos(angulo) * r;
    const z = REGIAO_MATA.z + Math.sin(angulo) * r;
    if (subRegiaoEm(x, z) === null) adicionar(x, z);
    else i--;
  }
  for (let i = 0; i < 8; i++) adicionar(-300 + (Math.random() - 0.5) * 80, -300 + (Math.random() - 0.5) * 80);
  for (let i = 0; i < 8; i++) adicionar(-180 + (Math.random() - 0.5) * 140, -420 + (Math.random() - 0.5) * 140);
  for (let i = 0; i < 8; i++) adicionar(-420 + (Math.random() - 0.5) * 140, -180 + (Math.random() - 0.5) * 140);

  for (let i = 0; i < 36; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const r = 360 + Math.random() * 50;
    adicionar(REGIAO_MATA.x + Math.cos(angulo) * r, REGIAO_MATA.z + Math.sin(angulo) * r);
  }

  for (let i = 0; i < 10; i++) {
    const t = 0.1 + Math.random() * 0.8;
    const z = NASCENTE.z + t * (RIO.zFoz - NASCENTE.z);
    const cx = centroRioX(z);
    const lado = Math.random() < 0.5 ? -1 : 1;
    const x = cx + lado * (larguraRio(z) / 2 + RIO.margem + 2 + Math.random() * 6);
    adicionar(x, z);
  }

  for (let i = 0; i < 8; i++) {
    const z = PRAIA.zInicioAreia + 20 + Math.random() * (PRAIA.largura - 30);
    const x = (Math.random() - 0.5) * TAMANHO_MUNDO * 0.8;
    adicionar(x, z);
  }

  for (let i = 0; i < 52; i++) {
    let x, z;
    do {
      x = (Math.random() - 0.5) * TAMANHO_MUNDO * 0.9;
      z = (Math.random() - 0.5) * TAMANHO_MUNDO * 0.9;
    } while (
      pesoDaMata(x, z) > 0.05 ||
      Math.sqrt(x*x + z*z) < 30 ||
      distanciaAteAMargemDoRio(x, z) < RIO.margem + 5 ||
      z > PRAIA.zInicioAreia - 20
    );
    adicionar(x, z);
  }

  return pontos;
}

const PONTOS = gerarPontos();
console.log('Pergaminhos:', PONTOS.length);

const pergaminhos = [];
const GEO_ROL = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
const GEO_FITA = new THREE.TorusGeometry(0.18, 0.025, 6, 12);
const MAT_ROL = new THREE.MeshStandardMaterial({ color: 0xe8dcb8, roughness: 0.9 });
const MAT_FITA = new THREE.MeshStandardMaterial({ color: 0x8a3a2a, roughness: 0.8 });

let pergaminhosCriados = 0;
const PERG_POR_LOTE = 15;

function criarLotePergaminhos() {
  const fim = Math.min(pergaminhosCriados + PERG_POR_LOTE, PONTOS.length);
  for (let i = pergaminhosCriados; i < fim; i++) {
    const ponto = PONTOS[i];
    const grupo = new THREE.Group();
    const yTerreno = alturaDoTerreno(ponto.x, ponto.z);

    const rolo = new THREE.Mesh(GEO_ROL, MAT_ROL);
    rolo.rotation.z = Math.PI / 2;
    grupo.add(rolo);

    const fita = new THREE.Mesh(GEO_FITA, MAT_FITA);
    fita.rotation.y = Math.PI / 2;
    grupo.add(fita);

    grupo.position.set(ponto.x, yTerreno + 1.5, ponto.z);
    grupo.castShadow = false;
    cena.add(grupo);

    pergaminhos.push({
      id: ponto.id, grupo,
      x: ponto.x, z: ponto.z,
      yBase: yTerreno + 1.5,
      podeAbrir: true
    });
  }
  pergaminhosCriados = fim;
  if (pergaminhosCriados < PONTOS.length) filaDeTarefas.push(criarLotePergaminhos);
}

// ============================================================
// FILA DE TAREFAS
// ============================================================

const filaDeTarefas = [];

for (let i = 0; i < 40; i++) {
  filaDeTarefas.push(processarPedacoChao);
}

povoarMundo(cena, filaDeTarefas);

filaDeTarefas.push(criarLotePergaminhos);

filaDeTarefas.push(() => {
  construirGridColisao();
});

// ============================================================
// GRID DE COLISÃO
// ============================================================

const TAMANHO_CELULA = 20;
const celulas = new Map();
const NUM_CELULAS = Math.floor(TAMANHO_MUNDO / TAMANHO_CELULA);

function chaveCelula(cx, cz) {
  const nx = ((cx % NUM_CELULAS) + NUM_CELULAS) % NUM_CELULAS;
  const nz = ((cz % NUM_CELULAS) + NUM_CELULAS) % NUM_CELULAS;
  return `${nx},${nz}`;
}

function registrarColisor(x, z, raio) {
  const cx = Math.floor(x / TAMANHO_CELULA);
  const cz = Math.floor(z / TAMANHO_CELULA);
  const chave = chaveCelula(cx, cz);
  if (!celulas.has(chave)) celulas.set(chave, []);
  celulas.get(chave).push({ x, z, raio });
}

function construirGridColisao() {
  const L = estadoPovoamento.listasParaColisao;
  function registrarLista(lista, raioBase) {
    for (const inst of lista) registrarColisor(inst.x, inst.z, raioBase * inst.escala);
  }
  registrarLista(L.altaFora, 0.35);
  registrarLista(L.frondosaFora, 0.45);
  registrarLista(L.retorcidaFora, 0.3);
  registrarLista(L.giganteFora, 1.0);
  registrarLista(L.frondosaMata, 0.45);
  registrarLista(L.altaMata, 0.35);
  registrarLista(L.giganteMata, 1.0);
  registrarLista(L.frondosaSamambaia, 0.45);
  registrarLista(L.giganteBosque, 1.0);
  registrarLista(L.frondosaTransicao, 0.45);
  registrarLista(L.serraRetorcida, 0.3);
  registrarLista(L.serraAlta, 0.35);
}

function resolverColisoes(posicao) {
  const cx = Math.floor(posicao.x / TAMANHO_CELULA);
  const cz = Math.floor(posicao.z / TAMANHO_CELULA);
  const raioFolha = 0.5;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const lista = celulas.get(chaveCelula(cx + dx, cz + dz));
      if (!lista) continue;
      for (const c of lista) {
        let dx2 = posicao.x - c.x;
        let dz2 = posicao.z - c.z;
        if (dx2 >  METADE_MUNDO) dx2 -= TAMANHO_MUNDO;
        if (dx2 < -METADE_MUNDO) dx2 += TAMANHO_MUNDO;
        if (dz2 >  METADE_MUNDO) dz2 -= TAMANHO_MUNDO;
        if (dz2 < -METADE_MUNDO) dz2 += TAMANHO_MUNDO;

        const dist = Math.sqrt(dx2 * dx2 + dz2 * dz2);
        const distMinima = c.raio + raioFolha;
        if (dist < distMinima && dist > 0.001) {
          const empurrao = (distMinima - dist) / dist;
          posicao.x += dx2 * empurrao;
          posicao.z += dz2 * empurrao;
        }
      }
    }
  }
}

// ============================================================
// PAINEL
// ============================================================

const painel = document.getElementById('painel');
const textoPainel = document.getElementById('texto-painel');
const botaoFechar = document.getElementById('botao-fechar');
const TEXTO_PROVISORIO = ("o texto aqui. ").repeat(60);
let painelAberto = false;
let pergaminhoAtual = null;

function abrirPainel(pergaminho) {
  painelAberto = true;
  pergaminhoAtual = pergaminho;
  textoPainel.textContent = TEXTO_PROVISORIO;
  painel.classList.remove('escondido');
}
function fecharPainel() {
  painelAberto = false;
  pergaminhoAtual = null;
  painel.classList.add('escondido');
}
botaoFechar.addEventListener('click', fecharPainel);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && painelAberto) fecharPainel();
});

// ============================================================
// CONTROLES
// ============================================================

configurarControles(renderizador.domElement);
configurarRedimensionamento(camera, renderizador);

// ============================================================
// LOOP
// ============================================================

const relogio = new THREE.Clock();
let tempoTotal = 0;

const corNeblinaFora  = new THREE.Color(0x8aa07a);
const corNeblinaMata  = new THREE.Color(0x2a4530);
const corNeblinaMar   = new THREE.Color(0x9ab8c8);
const corNeblinaSerra = new THREE.Color(0xb0c0d0);

const nearFora = 60,  farFora = 260;
const nearMata = 12,  farMata = 70;
const nearMar = 40,   farMar = 220;
const nearSerra = 25, farSerra = 140;

let corAtualNeblina = corNeblinaFora.clone();
let nearAtual = nearFora;
let farAtual = farFora;

function enrolarPosicao(pos, pMar) {
  // Wrap em X (leste-oeste) — continua funcionando
  if (pos.x >  METADE_MUNDO) pos.x -= TAMANHO_MUNDO;
  if (pos.x < -METADE_MUNDO) pos.x += TAMANHO_MUNDO;

  // Wrap em Z: só dentro do mar
  if (pMar >= 0.1) {
    const zMaxMar = MAR.zInicio + 1000;
    if (pos.z > zMaxMar) pos.z = MAR.zInicio + 100;
  }
  // Fora do mar, a folha não dá a volta em Z. Ela respeita
  // os limites naturais: a serra ao sul e o mar ao norte.
}

const DISTANCIA_ABRIR = 4;
const DISTANCIA_REABILITAR = 8;
const ORCAMENTO_TAREFAS_MS = 12;

const matrizVento = new THREE.Matrix4();
const quatVento = new THREE.Quaternion();
const escalaVento = new THREE.Vector3();
const posVento = new THREE.Vector3();
const eixoYVento = new THREE.Vector3(0, 1, 0);

function animar() {
  setTimeout(animar, 16);
  const dt = relogio.getDelta();
  tempoTotal += dt;

  // Fila de tarefas
  if (filaDeTarefas.length > 0) {
    const inicio = performance.now();
    while (filaDeTarefas.length > 0) {
      const tarefa = filaDeTarefas.shift();
      tarefa();
      if (performance.now() - inicio > ORCAMENTO_TAREFAS_MS) break;
    }
  }

  // Vento
  const forcaVento = 1 + Math.sin(tempoTotal * 0.3) * 0.5;
  for (const b of estadoPovoamento.balancantes) {
    for (let i = 0; i < b.lista.length; i++) {
      const inst = b.lista[i];
      const fase = b.fases[i];
      const amp = b.amplitudes[i] * forcaVento;
      const osc = Math.sin(tempoTotal * 1.2 + fase) * amp;
      posVento.set(inst.x, inst.y + Math.abs(osc) * 0.5, inst.z);
      quatVento.setFromAxisAngle(eixoYVento, inst.rotY);
      escalaVento.setScalar(inst.escala);
      matrizVento.compose(posVento, quatVento, escalaVento);
      b.mesh.setMatrixAt(i, matrizVento);
    }
    b.mesh.instanceMatrix.needsUpdate = true;
  }

  // Bandos
  for (const bando of bandos) {
    bando.tempo += dt;
    bando.pos.addScaledVector(bando.dir, bando.vel * dt);
    if (bando.pos.x >  METADE_MUNDO) bando.pos.x -= TAMANHO_MUNDO;
    if (bando.pos.x < -METADE_MUNDO) bando.pos.x += TAMANHO_MUNDO;
    if (bando.pos.z >  METADE_MUNDO) bando.pos.z -= TAMANHO_MUNDO;
    if (bando.pos.z < -METADE_MUNDO) bando.pos.z += TAMANHO_MUNDO;
    bando.pos.y = 25 + Math.sin(bando.tempo * 0.5) * 3;

    for (let i = 0; i < bando.quantidade; i++) {
      const off = bando.offsets[i];
      const px = bando.pos.x + off.x;
      const py = bando.pos.y + off.y + Math.sin(bando.tempo * 3 + off.faseAsa) * 0.2;
      const pz = bando.pos.z + off.z;
      const angulo = Math.atan2(bando.dir.x, bando.dir.z);
      posVento.set(px, py, pz);
      quatVento.setFromAxisAngle(eixoYVento, angulo);
      escalaVento.setScalar(1);
      matrizVento.compose(posVento, quatVento, escalaVento);
      bando.mesh.setMatrixAt(i, matrizVento);
    }
    bando.mesh.instanceMatrix.needsUpdate = true;
  }

  // Pássaros que pousam (se ainda estiver ativo)
  if (typeof passarosPousados !== 'undefined' && passarosPousados) {
    atualizarPassaros(passarosPousados, avatar.position, dt, tempoTotal);
  }

  // Pergaminhos
  for (const p of pergaminhos) {
    p.grupo.rotation.y += dt * 0.6;
    p.grupo.position.y = p.yBase + Math.sin(tempoTotal * 1.5 + p.x * 0.01) * 0.15;
  }

  if (!painelAberto) {
    for (const p of pergaminhos) {
      const dist = distanciaToroidal(avatar.position.x, avatar.position.z, p.x, p.z);
      if (dist < DISTANCIA_ABRIR && p.podeAbrir) {
        abrirPainel(p);
        p.podeAbrir = false;
        break;
      }
      if (dist > DISTANCIA_REABILITAR && !p.podeAbrir) {
        p.podeAbrir = true;
      }
    }
  } else {
    if (pergaminhoAtual) {
      const dist = distanciaToroidal(avatar.position.x, avatar.position.z, pergaminhoAtual.x, pergaminhoAtual.z);
      if (dist > DISTANCIA_REABILITAR) pergaminhoAtual.podeAbrir = true;
    }
  }

  // Movimento
  if (!painelAberto) {
    const t = teclasDeAcao();

    if (t.girarEsquerda) avatar.rotation.y += VELOCIDADE_GIRO * dt;
    if (t.girarDireita)  avatar.rotation.y -= VELOCIDADE_GIRO * dt;

    const direcao = new THREE.Vector3(0, 0, -1);
    direcao.applyQuaternion(avatar.quaternion);

    if (t.andarFrente) {
      avatar.position.x += direcao.x * VELOCIDADE_AVATAR * dt;
      avatar.position.z += direcao.z * VELOCIDADE_AVATAR * dt;
    }
    if (t.andarTras) {
      avatar.position.x -= direcao.x * VELOCIDADE_AVATAR * dt;
      avatar.position.z -= direcao.z * VELOCIDADE_AVATAR * dt;
    }

       resolverColisoes(avatar.position);

    // Limite sul: a serra é a borda do mundo
    const limiteSul = -650;
    if (avatar.position.z < limiteSul) avatar.position.z = limiteSul;

    const pMar = pesoDoMar(avatar.position.z);
    enrolarPosicao(avatar.position, pMar);

    if (t.planar) alturaVoo += VELOCIDADE_SUBIDA * dt;
    else if (t.descer) alturaVoo -= VELOCIDADE_DESCIDA * dt;
    else if (alturaVoo > ALTURA_VOO_PADRAO) alturaVoo -= GRAVIDADE * dt * 0.5;
    alturaVoo = Math.max(ALTURA_VOO_PADRAO, Math.min(ALTURA_VOO_MAXIMA, alturaVoo));
  }

  let alturaBaseAvatar;
  if (avatar.position.z > MAR.zInicio) {
    alturaBaseAvatar = MAR.nivel;
  } else {
    alturaBaseAvatar = alturaDoTerreno(avatar.position.x, avatar.position.z);
  }
  avatar.position.y = alturaBaseAvatar + alturaVoo;

  animarBalanco(folhaInterna, tempoTotal);

  // Neblina
  const pesoMata = pesoDaMata(avatar.position.x, avatar.position.z);
  const pMar = pesoDoMar(avatar.position.z);
  const pesoSerra = pesoDaSerra(avatar.position.x, avatar.position.z);

  const corAlvo = corNeblinaFora.clone()
    .lerp(corNeblinaMata, pesoMata)
    .lerp(corNeblinaMar, pMar)
    .lerp(corNeblinaSerra, pesoSerra);

  const nearAlvo = nearFora
    + (nearMata - nearFora) * pesoMata
    + (nearMar  - nearFora) * pMar
    + (nearSerra - nearFora) * pesoSerra;

  const farAlvo = farFora
    + (farMata  - farFora) * pesoMata
    + (farMar   - farFora) * pMar
    + (farSerra - farFora) * pesoSerra;

  const fator = Math.min(1, 0.8 * dt);
  corAtualNeblina.lerp(corAlvo, fator);
  nearAtual += (nearAlvo - nearAtual) * fator;
  farAtual  += (farAlvo  - farAtual)  * fator;
  cena.fog.color.copy(corAtualNeblina);
  cena.background.copy(corAtualNeblina);
  cena.fog.near = nearAtual;
  cena.fog.far  = farAtual;

  // Brilho da água conforme a mata
  materialRio.metalness = 0.5 * (1 - pesoMata * 0.95);
  materialRio.roughness = 0.2 + pesoMata * 0.7;
  materialBacia.metalness = 0.5 * (1 - pesoMata * 0.95);
  materialBacia.roughness = 0.15 + pesoMata * 0.75;

  luzSol.position.set(
    avatar.position.x + 60,
    avatar.position.y + 90,
    avatar.position.z + 40
  );
  luzSol.target.position.copy(avatar.position);
  luzSol.target.updateMatrixWorld();

  atualizarCamera(camera, avatar.position, avatar.rotation.y, dt);

  renderizador.render(cena, camera);
}

// ============================================================
// INÍCIO
// ============================================================

renderizador.render(cena, camera);
animar();

const telaEntrada = document.getElementById('entrada');

function iniciarJogo() {
  telaEntrada.classList.add('escondido');
  window.focus();
  renderizador.domElement.focus();
  telaEntrada.removeEventListener('click', iniciarJogo);
  telaEntrada.removeEventListener('touchstart', iniciarJogo);
}

telaEntrada.addEventListener('click', iniciarJogo);
telaEntrada.addEventListener('touchstart', iniciarJogo);