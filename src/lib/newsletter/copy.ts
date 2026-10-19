/**
 * Every word the newsletter system sends or shows outside the site pages,
 * in EN / FR / AR (Algerian Darija, like the rest of the Arabic site).
 * Pure data: safe to import from client components.
 */
import type { EmailLang } from './template';

interface EmailCopy {
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  cta?: string;
  note?: string;
}

interface LangCopy {
  signOff: string;
  footer: { reason: string; unsubscribe: string; manage: string };
  confirm: EmailCopy;
  welcome: [EmailCopy, EmailCopy, EmailCopy];
  leadMagnet: (title: string, url: string) => string;
  winback: EmailCopy;
  manage: EmailCopy;
  digest: { subject: (title: string) => string; heading: string; intro: string; read: string };
  pages: {
    unsubConfirmTitle: string;
    unsubConfirmBody: (email: string) => string;
    unsubButton: string;
    unsubDoneTitle: string;
    unsubDoneBody: string;
    unsubAlreadyTitle: string;
    unsubAlreadyBody: string;
    invalidTitle: string;
    invalidBody: string;
    keepTitle: string;
    keepBody: string;
    back: string;
    manageLink: string;
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const COPY: Record<EmailLang, LangCopy> = {
  en: {
    signOff: 'Riyad',
    footer: {
      reason: "You're receiving this because you subscribed at ketami.net.",
      unsubscribe: 'Unsubscribe',
      manage: 'Manage preferences',
    },
    confirm: {
      subject: 'Confirm your subscription',
      preheader: "One click and you're in.",
      heading: 'One click to confirm',
      body: '<p>Thanks for signing up to my newsletter at ketami.net. Confirm your email address so I can start sending you the weekly issue.</p>',
      cta: 'Confirm my subscription',
      note: "<p>If you didn't sign up, ignore this email and nothing will happen.</p>",
    },
    welcome: [
      {
        subject: "Welcome. Here's what to expect",
        preheader: 'One email a week: AI tools, tactics, and building from Algeria.',
        heading: "You're in. Welcome.",
        body: "<p>I'm Riyad. I test AI tools, build digital projects, and share what actually works for entrepreneurs in Algeria and the MENA region.</p><p>Once a week you'll get one email: the AI tools earning their keep, the tactics that work, and lessons from building from Algeria. No filler.</p>{leadMagnet}<p>One favour: hit reply and tell me what you're building right now. I read every answer, and replies help these emails reach your inbox.</p>",
      },
      {
        subject: 'Where to start',
        preheader: 'My most useful posts and videos, and the business community I co-founded.',
        heading: 'Three good places to start',
        body: '<ul><li><a href="{blogUrl}">The blog</a>: guides on AI tools and digital projects, in English, French and Arabic.</li><li><a href="{videosUrl}">My videos</a>: short, practical AI tutorials in Darija.</li><li><a href="{abbUrl}">Algeria Business Bay</a>: the private community for doing business in Algeria that I co-founded with Larbi.</li></ul><p>Next week you\'ll get the regular issue.</p>',
      },
      {
        subject: 'Quick question',
        preheader: "What's your biggest blocker with AI right now?",
        heading: 'One question for you',
        body: "<p>What's the one thing slowing you down with AI right now? A tool you can't figure out, a workflow you want to automate, or something else?</p><p>Reply with one line. Your answers shape what I write about next.</p><p>You can change your newsletter language or unsubscribe any time with the links below.</p>",
      },
    ],
    leadMagnet: (title, url) => `<p>As promised, here is your free resource: <a href="${esc(url)}">${esc(title)}</a>.</p>`,
    winback: {
      subject: 'Do you still want these emails?',
      preheader: 'One click keeps you on the list.',
      heading: 'Still with me?',
      body: "<p>You haven't clicked a link in my emails for a while. That's fine: I only want to send emails people want.</p><p>To keep getting the newsletter, click below. If not, you don't need to do anything: I'll take you off the list in two weeks.</p>",
      cta: 'Keep me subscribed',
    },
    manage: {
      subject: 'Manage your newsletter settings',
      preheader: 'Your personal link to change language or unsubscribe.',
      heading: 'Your newsletter settings',
      body: '<p>Use the button below to change your newsletter language or unsubscribe. The link only works for this email address.</p>',
      cta: 'Open my settings',
    },
    digest: {
      subject: (t) => `This week: ${t}`,
      heading: 'New this week',
      intro: "<p>Here's what I published this week.</p>",
      read: 'Read',
    },
    pages: {
      unsubConfirmTitle: 'Unsubscribe?',
      unsubConfirmBody: (e) => `Stop sending the newsletter to <strong>${e}</strong>?`,
      unsubButton: 'Unsubscribe',
      unsubDoneTitle: "You're unsubscribed",
      unsubDoneBody: "You won't receive the newsletter anymore. Changed your mind? You can subscribe again any time on ketami.net.",
      unsubAlreadyTitle: 'Already unsubscribed',
      unsubAlreadyBody: 'This address no longer receives the newsletter.',
      invalidTitle: 'Invalid link',
      invalidBody: 'This link is not valid. Please use the link from the email you received.',
      keepTitle: "You're staying",
      keepBody: 'Thanks. You stay on the list and the next issue will reach you as usual.',
      back: 'Back to ketami.net',
      manageLink: 'Manage preferences',
    },
  },
  fr: {
    signOff: 'Riyad',
    footer: {
      reason: 'Vous recevez cet email car vous êtes inscrit sur ketami.net.',
      unsubscribe: 'Se désinscrire',
      manage: 'Gérer mes préférences',
    },
    confirm: {
      subject: 'Confirmez votre inscription',
      preheader: "Un clic et c'est fait.",
      heading: 'Un clic pour confirmer',
      body: '<p>Merci pour votre inscription à ma newsletter sur ketami.net. Confirmez votre adresse email pour recevoir le numéro de chaque semaine.</p>',
      cta: 'Confirmer mon inscription',
      note: "<p>Si vous ne vous êtes pas inscrit, ignorez cet email : il ne se passera rien.</p>",
    },
    welcome: [
      {
        subject: 'Bienvenue. Voici ce qui vous attend',
        preheader: "Un email par semaine : outils IA, tactiques, et construire depuis l'Algérie.",
        heading: "C'est fait. Bienvenue.",
        body: "<p>Je suis Riyad. Je teste les outils d'IA, je construis des projets digitaux et je partage ce qui marche vraiment pour les entrepreneurs en Algérie et dans la région MENA.</p><p>Une fois par semaine, vous recevrez un email : les outils IA qui méritent leur abonnement, les tactiques qui marchent, et les leçons de ceux qui construisent depuis l'Algérie. Sans remplissage.</p>{leadMagnet}<p>Un petit service : répondez à cet email et dites-moi ce que vous construisez en ce moment. Je lis toutes les réponses, et elles aident mes emails à arriver dans votre boîte de réception.</p>",
      },
      {
        subject: 'Par où commencer',
        preheader: "Mes contenus les plus utiles et la communauté business que j'ai cofondée.",
        heading: 'Trois bons points de départ',
        body: '<ul><li><a href="{blogUrl}">Le blog</a> : des guides sur les outils IA et les projets digitaux, en français, en anglais et en arabe.</li><li><a href="{videosUrl}">Mes vidéos</a> : des tutoriels IA courts et pratiques, en darija.</li><li><a href="{abbUrl}">Algeria Business Bay</a> : la communauté privée pour faire du business en Algérie, que j\'ai cofondée avec Larbi.</li></ul><p>La semaine prochaine, vous recevrez le numéro habituel.</p>',
      },
      {
        subject: 'Une question rapide',
        preheader: "Qu'est-ce qui vous bloque le plus avec l'IA en ce moment ?",
        heading: 'Une question pour vous',
        body: "<p>Qu'est-ce qui vous ralentit le plus avec l'IA en ce moment ? Un outil que vous n'arrivez pas à maîtriser, un processus à automatiser, autre chose ?</p><p>Répondez en une ligne. Vos réponses orientent mes prochains sujets.</p><p>Vous pouvez changer la langue de la newsletter ou vous désinscrire à tout moment avec les liens ci-dessous.</p>",
      },
    ],
    leadMagnet: (title, url) => `<p>Comme promis, voici votre ressource gratuite : <a href="${esc(url)}">${esc(title)}</a>.</p>`,
    winback: {
      subject: 'Voulez-vous toujours recevoir ces emails ?',
      preheader: 'Un clic pour rester inscrit.',
      heading: 'Toujours là ?',
      body: "<p>Vous n'avez cliqué sur aucun lien de mes emails depuis un moment. Pas de souci : je veux envoyer seulement des emails attendus.</p><p>Pour continuer à recevoir la newsletter, cliquez ci-dessous. Sinon, vous n'avez rien à faire : je vous retirerai de la liste dans deux semaines.</p>",
      cta: 'Je reste inscrit',
    },
    manage: {
      subject: 'Gérer votre newsletter',
      preheader: 'Votre lien personnel pour changer de langue ou vous désinscrire.',
      heading: 'Vos réglages newsletter',
      body: '<p>Utilisez le bouton ci-dessous pour changer la langue de la newsletter ou vous désinscrire. Ce lien ne fonctionne que pour cette adresse email.</p>',
      cta: 'Ouvrir mes réglages',
    },
    digest: {
      subject: (t) => `Cette semaine : ${t}`,
      heading: 'Cette semaine',
      intro: "<p>Voici ce que j'ai publié cette semaine.</p>",
      read: 'Lire',
    },
    pages: {
      unsubConfirmTitle: 'Se désinscrire ?',
      unsubConfirmBody: (e) => `Ne plus envoyer la newsletter à <strong>${e}</strong> ?`,
      unsubButton: 'Se désinscrire',
      unsubDoneTitle: 'Vous êtes désinscrit',
      unsubDoneBody: "Vous ne recevrez plus la newsletter. Vous avez changé d'avis ? Vous pouvez vous réinscrire à tout moment sur ketami.net.",
      unsubAlreadyTitle: 'Déjà désinscrit',
      unsubAlreadyBody: 'Cette adresse ne reçoit plus la newsletter.',
      invalidTitle: 'Lien invalide',
      invalidBody: "Ce lien n'est pas valide. Utilisez le lien de l'email que vous avez reçu.",
      keepTitle: 'Vous restez inscrit',
      keepBody: 'Merci. Vous restez sur la liste et le prochain numéro vous arrivera comme d\'habitude.',
      back: 'Retour à ketami.net',
      manageLink: 'Gérer mes préférences',
    },
  },
  ar: {
    signOff: 'رياض',
    footer: {
      reason: 'وصلك هاذ الإيمايل خاطر اشتركت في ketami.net.',
      unsubscribe: 'حبس الاشتراك',
      manage: 'الإعدادات',
    },
    confirm: {
      subject: 'أكّد الاشتراك تاعك',
      preheader: 'كليك واحد وراك معانا.',
      heading: 'كليك واحد باش تأكّد',
      body: '<p>يعطيك الصحة على الاشتراك في النيوزلتر تاعي في ketami.net. أكّد الإيمايل تاعك باش نبدا نبعثلك العدد تاع كل سمانة.</p>',
      cta: 'أكّد الاشتراك',
      note: '<p>إذا ما اشتركتش، ما تديرش والو وما يصرا والو.</p>',
    },
    welcome: [
      {
        subject: 'مرحبا بيك. هاذا واش تستنى',
        preheader: 'إيمايل واحد في السمانة: أدوات الـAI، تكتيكات، والبني من الجزائر.',
        heading: 'صايي، راك معانا. مرحبا بيك.',
        body: '<p>أنا رياض. نجرّب أدوات الـAI، نبني مشاريع ديجيتال، ونشارك واش يخدم بصح للمقاولين في الجزائر والمنطقة.</p><p>مرة في السمانة توصلك إيمايل وحدة: الأدوات اللي تستاهل الاشتراك، التكتيكات اللي تخدم، والدروس تاع اللي يبني من الجزائر. بلا حشو.</p>{leadMagnet}<p>طلب صغير: ردّ على هاذ الإيمايل وقولّي واش راك تبني ضرك. نقرا كل الردود، وهاذا يعاون الإيمايلات تاعي يوصلو للـinbox تاعك.</p>',
      },
      {
        subject: 'منين تبدا',
        preheader: 'أحسن المحتوى تاعي والكوميونيتي اللي أسّستها.',
        heading: 'ثلاث بلايص مليحة باش تبدا',
        body: '<ul><li><a href="{blogUrl}">البلوغ</a>: قايدات على أدوات الـAI والمشاريع الديجيتال، بالعربية والفرنسية والإنجليزية.</li><li><a href="{videosUrl}">الفيديوهات تاعي</a>: تيتوريالز قصيرة وعملية على الـAI بالدارجة.</li><li><a href="{abbUrl}">Algeria Business Bay</a>: الكوميونيتي الخاصة باش تدير البزنس في الجزائر، أسّستها مع العربي.</li></ul><p>السمانة الجاية توصلك النيوزلتر العادية.</p>',
      },
      {
        subject: 'سؤال صغير',
        preheader: 'واش أكثر حاجة راهي تعطّلك مع الـAI ضرك؟',
        heading: 'سؤال ليك',
        body: '<p>واش هي أكثر حاجة راهي تعطّلك مع الـAI ضرك؟ أداة ما فهمتهاش، خدمة تحب تأوتوماتيزيها، ولا حاجة أخرى؟</p><p>ردّ بسطر واحد. الردود تاعكم هي اللي تختار المواضيع الجاية.</p><p>تقدر تبدّل لغة النيوزلتر ولا تحبس الاشتراك وقتما حبيت من الروابط اللي لتحت.</p>',
      },
    ],
    leadMagnet: (title, url) => `<p>كيما وعدتك، هاذي الهدية تاعك: <a href="${esc(url)}">${esc(title)}</a>.</p>`,
    winback: {
      subject: 'مازال تحب توصلك هاذ الإيمايلات؟',
      preheader: 'كليك واحد وتبقى في الليستة.',
      heading: 'مازال معايا؟',
      body: '<p>عندك مدة ما كليكيت على حتى رابط في الإيمايلات تاعي. ماشي مشكل: نحب نبعث غير للناس اللي حابين.</p><p>إذا تحب تبقى توصلك النيوزلتر، كليكي لتحت. إذا لا، ما تديرش والو: نحيّك من الليستة بعد سمانتين.</p>',
      cta: 'نبقى مشترك',
    },
    manage: {
      subject: 'إعدادات النيوزلتر تاعك',
      preheader: 'الرابط الشخصي تاعك باش تبدّل اللغة ولا تحبس الاشتراك.',
      heading: 'إعدادات النيوزلتر',
      body: '<p>استعمل الزر اللي لتحت باش تبدّل لغة النيوزلتر ولا تحبس الاشتراك. هاذ الرابط يخدم غير لهاذ الإيمايل.</p>',
      cta: 'افتح الإعدادات',
    },
    digest: {
      subject: (t) => `هاذ السمانة: ${t}`,
      heading: 'الجديد هاذ السمانة',
      intro: '<p>هاذا واش نشرت هاذ السمانة.</p>',
      read: 'اقرا',
    },
    pages: {
      unsubConfirmTitle: 'تحبس الاشتراك؟',
      unsubConfirmBody: (e) => `نحبسو النيوزلتر على <strong dir="ltr">${e}</strong>؟`,
      unsubButton: 'حبس الاشتراك',
      unsubDoneTitle: 'تحبس الاشتراك',
      unsubDoneBody: 'ما عادش توصلك النيوزلتر. بدّلت رايك؟ تقدر تشترك من جديد وقتما حبيت في ketami.net.',
      unsubAlreadyTitle: 'الاشتراك محبوس من قبل',
      unsubAlreadyBody: 'هاذ الإيمايل ما عادش توصلو النيوزلتر.',
      invalidTitle: 'رابط ماشي صحيح',
      invalidBody: 'هاذ الرابط ماشي صحيح. استعمل الرابط اللي في الإيمايل اللي وصلك.',
      keepTitle: 'راك باقي معانا',
      keepBody: 'يعطيك الصحة. راك باقي في الليستة والعدد الجاي يوصلك كيما العادة.',
      back: 'رجوع لـketami.net',
      manageLink: 'الإعدادات',
    },
  },
};

export function copyFor(lang: string | undefined | null): LangCopy {
  return COPY[(lang === 'fr' || lang === 'ar' ? lang : 'en') as EmailLang];
}
