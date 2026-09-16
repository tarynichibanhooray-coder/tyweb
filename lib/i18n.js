// Minimal UI-string localization — not full content translation, just the
// button/label chrome around the shared sentence display. Detects the
// browser's own language setting; falls back to the ICU locale Intl always
// resolves to (derived from OS/region settings) if navigator.language is
// somehow unavailable, then to English if the detected language isn't one
// we have strings for.
const STRINGS = {
  en: {
    writeTrigger: '+ Write your own message for everyone to see',
    placeholder: (max) => `Enter a sentence (max ${max} characters)`,
    submit: 'Submit',
    share: 'Share',
    copiedLink: 'Copied link',
    emptyState: 'No sentences yet — submit one!',
    errorEmpty: 'Error: message is empty',
    errorTooLong: 'Error: message is too long',
    errorServer: 'Error: something went wrong',
    errorNetwork: 'Error: network problem',
  },
  es: {
    writeTrigger: '+ Escribe tu propio mensaje para que todos lo vean',
    placeholder: (max) => `Escribe una frase (máx. ${max} caracteres)`,
    submit: 'Enviar',
    share: 'Compartir',
    copiedLink: 'Enlace copiado',
    emptyState: 'Aún no hay frases — ¡envía una!',
    errorEmpty: 'Error: el mensaje está vacío',
    errorTooLong: 'Error: el mensaje es demasiado largo',
    errorServer: 'Error: algo salió mal',
    errorNetwork: 'Error: problema de red',
  },
  fr: {
    writeTrigger: '+ Écrivez votre propre message pour que tout le monde le voie',
    placeholder: (max) => `Entrez une phrase (${max} caractères max)`,
    submit: 'Envoyer',
    share: 'Partager',
    copiedLink: 'Lien copié',
    emptyState: "Pas encore de phrases — proposez-en une !",
    errorEmpty: 'Erreur : le message est vide',
    errorTooLong: 'Erreur : le message est trop long',
    errorServer: "Erreur : une erreur s'est produite",
    errorNetwork: 'Erreur : problème réseau',
  },
  de: {
    writeTrigger: '+ Schreibe deine eigene Nachricht für alle sichtbar',
    placeholder: (max) => `Satz eingeben (max. ${max} Zeichen)`,
    submit: 'Absenden',
    share: 'Teilen',
    copiedLink: 'Link kopiert',
    emptyState: 'Noch keine Sätze — schreib den ersten!',
    errorEmpty: 'Fehler: Nachricht ist leer',
    errorTooLong: 'Fehler: Nachricht ist zu lang',
    errorServer: 'Fehler: etwas ist schiefgelaufen',
    errorNetwork: 'Fehler: Netzwerkproblem',
  },
  it: {
    writeTrigger: '+ Scrivi il tuo messaggio, visibile a tutti',
    placeholder: (max) => `Inserisci una frase (max ${max} caratteri)`,
    submit: 'Invia',
    share: 'Condividi',
    copiedLink: 'Link copiato',
    emptyState: 'Nessuna frase ancora — invia la prima!',
    errorEmpty: 'Errore: il messaggio è vuoto',
    errorTooLong: 'Errore: il messaggio è troppo lungo',
    errorServer: 'Errore: qualcosa è andato storto',
    errorNetwork: 'Errore: problema di rete',
  },
  pt: {
    writeTrigger: '+ Escreva sua própria mensagem para todos verem',
    placeholder: (max) => `Digite uma frase (máx. ${max} caracteres)`,
    submit: 'Enviar',
    share: 'Compartilhar',
    copiedLink: 'Link copiado',
    emptyState: 'Ainda não há frases — envie a primeira!',
    errorEmpty: 'Erro: a mensagem está vazia',
    errorTooLong: 'Erro: a mensagem é muito longa',
    errorServer: 'Erro: algo deu errado',
    errorNetwork: 'Erro: problema de rede',
  },
  ja: {
    writeTrigger: '+ みんなに見えるメッセージを書く',
    placeholder: (max) => `文章を入力（最大${max}文字）`,
    submit: '送信',
    share: '共有',
    copiedLink: 'リンクをコピーしました',
    emptyState: 'まだ文章がありません — 最初の投稿を！',
    errorEmpty: 'エラー：メッセージが空です',
    errorTooLong: 'エラー：メッセージが長すぎます',
    errorServer: 'エラー：問題が発生しました',
    errorNetwork: 'エラー：ネットワークの問題',
  },
  zh: {
    writeTrigger: '+ 写下你自己的留言，让大家都能看到',
    placeholder: (max) => `输入一句话（最多${max}个字符）`,
    submit: '提交',
    share: '分享',
    copiedLink: '链接已复制',
    emptyState: '暂无留言 — 快来发布第一条吧！',
    errorEmpty: '错误：内容为空',
    errorTooLong: '错误：内容过长',
    errorServer: '错误：出了点问题',
    errorNetwork: '错误：网络问题',
  },
  ko: {
    writeTrigger: '+ 모두가 볼 수 있는 나만의 메시지 작성하기',
    placeholder: (max) => `문장을 입력하세요 (최대 ${max}자)`,
    submit: '제출',
    share: '공유',
    copiedLink: '링크가 복사되었습니다',
    emptyState: '아직 문장이 없어요 — 첫 문장을 남겨보세요!',
    errorEmpty: '오류: 메시지가 비어 있습니다',
    errorTooLong: '오류: 메시지가 너무 깁니다',
    errorServer: '오류: 문제가 발생했습니다',
    errorNetwork: '오류: 네트워크 문제',
  },
  ru: {
    writeTrigger: '+ Напишите своё сообщение — его увидят все',
    placeholder: (max) => `Введите фразу (макс. ${max} символов)`,
    submit: 'Отправить',
    share: 'Поделиться',
    copiedLink: 'Ссылка скопирована',
    emptyState: 'Пока нет фраз — отправьте первую!',
    errorEmpty: 'Ошибка: сообщение пустое',
    errorTooLong: 'Ошибка: сообщение слишком длинное',
    errorServer: 'Ошибка: что-то пошло не так',
    errorNetwork: 'Ошибка: проблема сети',
  },
  ar: {
    writeTrigger: '+ اكتب رسالتك الخاصة ليراها الجميع',
    placeholder: (max) => `أدخل جملة (بحد أقصى ${max} حرفًا)`,
    submit: 'إرسال',
    share: 'مشاركة',
    copiedLink: 'تم نسخ الرابط',
    emptyState: 'لا توجد جمل بعد — أرسل أول جملة!',
    errorEmpty: 'خطأ: الرسالة فارغة',
    errorTooLong: 'خطأ: الرسالة طويلة جدًا',
    errorServer: 'خطأ: حدث خطأ ما',
    errorNetwork: 'خطأ: مشكلة في الشبكة',
  },
  hi: {
    writeTrigger: '+ अपना खुद का संदेश लिखें, सबके लिए',
    placeholder: (max) => `एक वाक्य लिखें (अधिकतम ${max} अक्षर)`,
    submit: 'सबमिट करें',
    share: 'शेयर करें',
    copiedLink: 'लिंक कॉपी हो गया',
    emptyState: 'अभी कोई वाक्य नहीं — पहला आप लिखें!',
    errorEmpty: 'त्रुटि: संदेश खाली है',
    errorTooLong: 'त्रुटि: संदेश बहुत लंबा है',
    errorServer: 'त्रुटि: कुछ गलत हो गया',
    errorNetwork: 'त्रुटि: नेटवर्क समस्या',
  },
};

export function detectLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  const fromNavigator = (navigator.languages && navigator.languages[0]) || navigator.language;
  let raw = fromNavigator;
  if (!raw) {
    try {
      raw = Intl.DateTimeFormat().resolvedOptions().locale;
    } catch (err) {
      raw = 'en';
    }
  }
  const code = (raw || 'en').split('-')[0].toLowerCase();
  return STRINGS[code] ? code : 'en';
}

export function getStrings(lang) {
  return STRINGS[lang] || STRINGS.en;
}
