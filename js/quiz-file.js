import { generateId, shuffle } from './utils.js';

export const QUIZ_VERSION = 1;

export function createEmptyQuiz() {
  return {
    version: QUIZ_VERSION,
    title: '',
    description: '',
    questions: []
  };
}

export function createEmptyQuestion() {
  return {
    id: generateId(),
    text: '',
    image: null,
    imageType: null, // 'url' | 'base64' | null
    answers: [
      { id: generateId(), text: '', correct: false },
      { id: generateId(), text: '', correct: false },
      { id: generateId(), text: '', correct: false },
      { id: generateId(), text: '', correct: false }
    ],
    answersToShow: 4
  };
}

export function createEmptyAnswer() {
  return { id: generateId(), text: '', correct: false };
}

export function parseQuizFile(jsonContent) {
  try {
    const quiz = JSON.parse(jsonContent);
    return validateQuiz(quiz);
  } catch (e) {
    throw new Error('Fichier invalide : impossible de lire le quiz.');
  }
}

function validateQuiz(quiz) {
  if (!quiz || typeof quiz !== 'object') {
    throw new Error('Format de quiz invalide.');
  }
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error('Le quiz doit contenir au moins une question.');
  }
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    if (!q.text || !q.text.trim()) {
      throw new Error(`La question ${i + 1} n'a pas de texte.`);
    }
    if (!Array.isArray(q.answers) || q.answers.length < 2) {
      throw new Error(`La question ${i + 1} doit avoir au moins 2 réponses.`);
    }
    const hasCorrect = q.answers.some(a => a.correct);
    if (!hasCorrect) {
      throw new Error(`La question ${i + 1} doit avoir au moins une réponse correcte.`);
    }
    const validAnswers = q.answers.filter(a => a.text && a.text.trim());
    if (validAnswers.length < 2) {
      throw new Error(`La question ${i + 1} doit avoir au moins 2 réponses avec du texte.`);
    }
    if (!q.id) q.id = generateId();
    q.answers.forEach(a => { if (!a.id) a.id = generateId(); });
    if (!q.answersToShow || q.answersToShow < 2) q.answersToShow = validAnswers.length;
    if (q.answersToShow > validAnswers.length) q.answersToShow = validAnswers.length;
  }
  quiz.version = quiz.version || QUIZ_VERSION;
  return quiz;
}

export function exportQuizFile(quiz) {
  const sanitized = {
    version: quiz.version || QUIZ_VERSION,
    title: quiz.title || 'Quiz sans titre',
    description: quiz.description || '',
    questions: quiz.questions.map(q => ({
      id: q.id,
      text: q.text,
      image: q.image || null,
      imageType: q.image && q.image.startsWith('data:') ? 'base64' : (q.image ? 'url' : null),
      answers: q.answers.map(a => ({
        id: a.id,
        text: a.text,
        correct: a.correct
      })),
      answersToShow: q.answersToShow
    }))
  };
  return JSON.stringify(sanitized, null, 2);
}

export function pickAnswersForQuestion(question) {
  const valid = question.answers.filter(a => a.text && a.text.trim());
  const correct = valid.filter(a => a.correct);
  const incorrect = valid.filter(a => !a.correct);

  const toShow = Math.min(question.answersToShow, valid.length);
  const minCorrect = Math.min(correct.length, 1);

  let picked = [];
  const shuffledCorrect = shuffle(correct);
  picked.push(...shuffledCorrect.slice(0, minCorrect));

  const remaining = toShow - picked.length;
  if (remaining > 0) {
    const shuffledIncorrect = shuffle(incorrect);
    picked.push(...shuffledIncorrect.slice(0, remaining));
  }

  if (picked.length < toShow) {
    const remainingValid = valid.filter(a => !picked.find(p => p.id === a.id));
    const extra = shuffle(remainingValid).slice(0, toShow - picked.length);
    picked.push(...extra);
  }

  return shuffle(picked).map(a => ({
    id: a.id,
    text: a.text
  }));
}

export function getCorrectAnswerId(question) {
  const correct = question.answers.filter(a => a.correct && a.text && a.text.trim());
  if (correct.length === 1) return correct[0].id;
  return correct.map(a => a.id);
}

export function isAnswerCorrect(question, answerId) {
  const correctId = getCorrectAnswerId(question);
  if (Array.isArray(correctId)) return correctId.includes(answerId);
  return correctId === answerId;
}
