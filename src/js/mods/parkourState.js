import { normalize } from "./parkourDef.js";

const HOUR_MS = 60 * 60 * 1000;
// les seuils temporels et de réussite viennent désormais des règles portées
// par la définition de parcours passée au constructeur (voir
// parkourDef.DEFAULT_REGLES pour les valeurs par défaut) ; le barème de
// points reste fixe
const POINTS_PER_CORRECT = 20;
const MAX_TIME_BONUS = 50;

export const STATUS = {
  LOCKED_PREREQ: "LOCKED_PREREQ",
  LOCKED_TIMER: "LOCKED_TIMER",
  LOCKED_FAIL: "LOCKED_FAIL",
  AVAILABLE: "AVAILABLE",
  PASSED: "PASSED",
};

export default class ParkourState {
  constructor(parcoursDef, { storage = null, now = () => Date.now() } = {}) {
    this.parcoursDef = normalize(parcoursDef);
    this.regles = this.parcoursDef.regles;
    this.storage = storage;
    this.now = now;
    this.etapes = {};
    this._initEtapes();
    this.load();
  }

  /** Délai de déblocage de l'étape suivante, en millisecondes. */
  unlockDelayMs() {
    return this.regles.delaiDeblocageH * HOUR_MS;
  }

  /** Durée du verrou après trop d'échecs, en millisecondes. */
  failLockMs() {
    return this.regles.verrouEchecH * HOUR_MS;
  }

  /** Score maximal atteignable sur une étape de ce parcours. */
  maxScore() {
    return this.regles.nbQuestions * POINTS_PER_CORRECT + MAX_TIME_BONUS;
  }

  _initEtapes() {
    this.etapes = {};
    for (const etape of this.parcoursDef.etapes) {
      this.etapes[etape.id] = {
        passedAt: null,
        attemptsInWindow: 0,
        lockedUntil: null,
        bestScore: 0,
      };
    }
  }

  storageKey() {
    return "parkour-progress-" + this.parcoursDef.id;
  }

  getStatus(etapeId) {
    const record = this.etapes[etapeId];
    if (!record) throw new Error("étape inconnue: " + etapeId);
    const now = this.now();
    if (record.passedAt !== null) return STATUS.PASSED;
    if (record.lockedUntil !== null && now < record.lockedUntil) {
      return STATUS.LOCKED_FAIL;
    }
    const index = this.parcoursDef.etapes.findIndex((e) => e.id === etapeId);
    if (index === 0) return STATUS.AVAILABLE;
    const prevRecord = this.etapes[this.parcoursDef.etapes[index - 1].id];
    if (prevRecord.passedAt === null) return STATUS.LOCKED_PREREQ;
    if (now < prevRecord.passedAt + this.unlockDelayMs()) {
      return STATUS.LOCKED_TIMER;
    }
    return STATUS.AVAILABLE;
  }

  getThemeStars(themeId) {
    const etapesTheme = this.parcoursDef.etapes.filter((e) => e.theme === themeId);
    const passed = etapesTheme.filter(
      (e) => this.etapes[e.id].passedAt !== null,
    ).length;
    return { passed, total: etapesTheme.length };
  }

  computeScore(correctCount, tempsReel, tempsPrevu) {
    const base = correctCount * POINTS_PER_CORRECT;
    let bonus = 0;
    if (tempsPrevu > 0) {
      const ratio = tempsReel / tempsPrevu;
      if (ratio <= 0.5) bonus = MAX_TIME_BONUS;
      else if (ratio < 1) bonus = (MAX_TIME_BONUS * (1 - ratio)) / 0.5;
    }
    bonus = Math.round(bonus);
    return { base, bonus, total: base + bonus };
  }

  recordAttempt(etapeId, { correctCount, tempsReel, tempsPrevu }) {
    const record = this.etapes[etapeId];
    if (!record) throw new Error("étape inconnue: " + etapeId);
    const now = this.now();
    if (record.lockedUntil !== null) {
      if (now < record.lockedUntil) {
        throw new Error("étape verrouillée jusqu'à " + record.lockedUntil);
      }
      record.lockedUntil = null;
      record.attemptsInWindow = 0;
    }
    const { total } = this.computeScore(correctCount, tempsReel, tempsPrevu);
    record.bestScore = Math.max(record.bestScore, total);
    const passed = correctCount >= this.regles.seuilReussite;
    if (passed) {
      if (record.passedAt === null) record.passedAt = now;
      record.attemptsInWindow = 0;
    } else {
      record.attemptsInWindow += 1;
      if (record.attemptsInWindow >= this.regles.tentativesAvantVerrou) {
        record.lockedUntil = now + this.failLockMs();
      }
    }
    this.save();
    return { passed, score: total };
  }

  load() {
    if (!this.storage) return;
    const raw = this.storage.getItem(this.storageKey());
    if (!raw) return;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    for (const etape of this.parcoursDef.etapes) {
      if (parsed[etape.id]) {
        this.etapes[etape.id] = { ...this.etapes[etape.id], ...parsed[etape.id] };
      }
    }
  }

  save() {
    if (!this.storage) return;
    this.storage.setItem(this.storageKey(), JSON.stringify(this.etapes));
  }

  reset() {
    this._initEtapes();
    this.save();
  }

  exportCode() {
    const payload = { parcoursId: this.parcoursDef.id, etapes: this.etapes };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }

  importCode(code) {
    let payload;
    try {
      payload = JSON.parse(decodeURIComponent(escape(atob(code))));
    } catch {
      throw new Error("code de sauvegarde invalide");
    }
    if (!payload || payload.parcoursId !== this.parcoursDef.id) {
      throw new Error("ce code vient d'un autre parcours");
    }
    const requiredKeys = ["passedAt", "attemptsInWindow", "lockedUntil", "bestScore"];
    for (const etape of this.parcoursDef.etapes) {
      const incoming = payload.etapes && payload.etapes[etape.id];
      if (!incoming) continue;
      if (!requiredKeys.every((k) => k in incoming)) {
        throw new Error("code de sauvegarde invalide");
      }
      this.etapes[etape.id] = {
        passedAt: incoming.passedAt,
        attemptsInWindow: incoming.attemptsInWindow,
        lockedUntil: incoming.lockedUntil,
        bestScore: incoming.bestScore,
      };
    }
    this.save();
  }
}
