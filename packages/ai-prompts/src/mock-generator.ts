import { PreparedAiInput } from './generate.js';

export function generateMockAiResponse(input: PreparedAiInput) {
  const isUz = input.language === 'uz';
  const isEn = input.language === 'en';

  const topSkills = input.skills.hard.slice(0, 4).join(', ');

  // 1. Summary
  let summary = '';
  if (isEn) {
    summary = `${input.targetPosition} focused on ${topSkills || 'modern software engineering'}. Experienced in designing and delivering production systems, coordinating across engineering and product groups, and driving measurable technical improvements with clean maintainable architecture.`;
  } else if (isUz) {
    summary = `${input.targetPosition}. ${topSkills ? topSkills + ' texnologiyalari bo‘yicha amaliy tajribaga ega.' : ''} Tizim arxitekturasini loyihalash, texnik yechimlarni ishga tushirish va jamoa bilan aniq natijalarga ishlash ko‘nikmalarini qo‘llaydi.`;
  } else {
    summary = `${input.targetPosition}. Практический опыт проектирования и запуска решений с использованием ${topSkills || 'профильного стека'}. Специализируется на инженерном качестве кода, предсказуемых релизах и техническом взаимодействии внутри продуктовых команд.`;
  }

  // 2. Experience bullets
  const experience = input.experience.map(exp => {
    const bullets: string[] = [];
    const raw = exp.raw;
    const numbers = raw.match(/\b\d+([.,]\d+)?\b/g) || [];

    if (isEn) {
      if (numbers.length > 0) {
        bullets.push(`Developed and shipped core modules for ${exp.company}, improving target metrics by ${numbers[0]}x.`);
      } else {
        bullets.push(`Architected and delivered primary product features at ${exp.company}.`);
      }
      bullets.push(`Automated build and validation workflows to keep releases predictable.`);
      bullets.push(`Partnered with product managers to define technical specifications and delivery milestones.`);
    } else if (isUz) {
      if (numbers.length > 0) {
        bullets.push(`${exp.company} loyihasida asosiy modullarni yaratib, ko‘rsatkichlarni ${numbers[0]} barobarga yaxshiladi.`);
      } else {
        bullets.push(`${exp.company} tizimida asosiy funksionallikni loyihaladi va ishga tushirdi.`);
      }
      bullets.push(`Ishlab chiqish jarayonlarini avtomatlashtirdi va kod barqarorligini oshirdi.`);
      bullets.push(`Mahsulot jamoasi bilan texnik talablarni shakllantirdi.`);
    } else {
      if (numbers.length > 0) {
        bullets.push(`Спроектировал и запустил ключевые модули в ${exp.company}, улучшив показатели в ${numbers[0]} раза.`);
      } else {
        bullets.push(`Спроектировал и внедрил основные функциональные компоненты в ${exp.company}.`);
      }
      bullets.push(`Автоматизировал сценарии сборки и проверки кода для стабилизации релизов.`);
      bullets.push(`Согласовывал технические спецификации и этапы поставки с командой продукта.`);
    }

    return {
      ref: exp.ref,
      bullets,
      highlights: [0],
    };
  });

  // 3. Projects bullets
  const projects = input.projects.map(proj => {
    const bullets: string[] = [];
    if (isEn) {
      bullets.push(`Designed and launched ${proj.name} utilizing modern technical stack.`);
      bullets.push(`Configured responsive layout, fast loading times, and clear user workflow.`);
    } else if (isUz) {
      bullets.push(`${proj.name} loyihasini zamonaviy texnologiyalar asosida noldan ishlab chiqdi.`);
      bullets.push(`Foydalanuvchi interfeysi va tizim tezligini muvofiqlashtirdi.`);
    } else {
      bullets.push(`Разработал и опубликовал проект «${proj.name}» на современном стеке.`);
      bullets.push(`Настроил адаптивную вёрстку, оптимизировал скорость работы и протестировал сценарии.`);
    }

    return {
      ref: proj.ref,
      bullets,
      highlights: [0],
    };
  });

  // 4. Strengths
  const strengths = [];
  if (isEn) {
    strengths.push({
      title: 'Technical Execution',
      evidence: `Hands-on engineering experience with ${topSkills || 'core tools'}.`,
    });
    strengths.push({
      title: 'Production Delivery',
      evidence: 'Consistent delivery of working components from specification to release.',
    });
    strengths.push({
      title: 'Architectural Clarity',
      evidence: 'Structured approach to modular codebases and maintainable interfaces.',
    });
  } else if (isUz) {
    strengths.push({
      title: 'Texnik tajriba',
      evidence: `${topSkills || 'Asosiy vositalar'} bo‘yicha mustahkam amaliy tajriba.`,
    });
    strengths.push({
      title: 'Natija va sifat',
      evidence: 'Vazifalarni belgilangan muddatda va aniq spetsifikatsiya asosida bajarish.',
    });
    strengths.push({
      title: 'Tizimli yondashuv',
      evidence: 'Yangi texnologiyalar va jamoa standartlarini tez o‘zlashtirish.',
    });
  } else {
    strengths.push({
      title: 'Техническая экспертиза',
      evidence: `Подтверждённая практика работы со стеком: ${topSkills || 'профильные технологии'}.`,
    });
    strengths.push({
      title: 'Доведение до релиза',
      evidence: 'Опыт перевода задач от технического задания до стабильной работы в продакшене.',
    });
    strengths.push({
      title: 'Инженерная дисциплина',
      evidence: 'Системный подход к архитектуре модулей, тестированию и стандартам кода.',
    });
  }

  // 5. Weaknesses / Blind Spots transformed into Interview Prep Questions (FR-10, DESIGN §6)
  const weaknesses: Array<{
    id: string;
    area: string;
    question: string;
    strategy: string;
    resolved: boolean;
  }> = [];

  const expWithoutNumbers = input.experience.filter(e => !/\d/.test(e.raw));
  if (expWithoutNumbers.length > 0) {
    const companyName = expWithoutNumbers[0].company;
    if (isEn) {
      weaknesses.push({
        id: 'w-metrics',
        area: `Missing metrics (${companyName})`,
        question: `What measurable impact did your work at ${companyName} have on speed, cost, or user retention?`,
        strategy: 'Prepare 1–2 concrete numbers: response latency reduction, number of users served, or release frequency.',
        resolved: false,
      });
    } else if (isUz) {
      weaknesses.push({
        id: 'w-metrics',
        area: `Raqamli ko‘rsatkichlar yetishmaydi (${companyName})`,
        question: `${companyName} kompaniyasidagi ishingiz tizim tezligi yoki biznes ko‘rsatkichlariga qanday aniq ta'sir ko‘rsatdi?`,
        strategy: 'Suhbatdan oldin 1–2 ta raqam tayyorlang: yuklanish vaqtining qisqarishi, foydalanuvchilar soni yoki xatolar kamayishi.',
        resolved: false,
      });
    } else {
      weaknesses.push({
        id: 'w-metrics',
        area: `Отсутствуют метрики (${companyName})`,
        question: `«Каким был измеримый бизнес-эффект от ваших решений в ${companyName}?»`,
        strategy: 'Вспомните конкретные числа: ускорение загрузки, сокращение багов, количество пользователей или сэкономленные часы команды, и добавьте их в пункт опыта.',
        resolved: false,
      });
    }
  }

  if (input.noExperience || input.experience.length === 0) {
    if (isEn) {
      weaknesses.push({
        id: 'w-commercial',
        area: 'Limited commercial experience',
        question: 'How have you handled code reviews, production incidents, or team deadlines without formal commercial roles?',
        strategy: 'Walk through your personal or academic projects step-by-step, focusing on architecture trade-offs and testing.',
        resolved: false,
      });
    } else if (isUz) {
      weaknesses.push({
        id: 'w-commercial',
        area: 'Tijorat tajribasi cheklangan',
        question: 'Haqiqiy ishlab chiqarish jarayonidagi xatolar va jamoaviy kod tekshiruvlari bilan qanday ishlagansiz?',
        strategy: 'O‘quv yoki shaxsiy loyihalaringizdagi texnik qarorlarni va testlash usullarini batafsil tushuntirib bering.',
        resolved: false,
      });
    } else {
      weaknesses.push({
        id: 'w-commercial',
        area: 'Недостаток коммерческого стажа',
        question: '«Как вы выстраивали работу с дедлайнами, код-ревью и тестированием без опыта в штате?»',
        strategy: 'Разберите на примерах учебных или pet-проектов: покажите репозиторий, тесты, деплой и объясните выбор архитектуры.',
        resolved: false,
      });
    }
  }

  if (input.skills.hard.length < 5) {
    if (isEn) {
      weaknesses.push({
        id: 'w-stack',
        area: 'Narrow toolset listed',
        question: `Which testing frameworks, CI/CD pipelines, or databases do you rely on alongside ${topSkills || 'your main stack'}?`,
        strategy: 'List supporting infrastructure, testing, and version control tools in the Skills section.',
        resolved: false,
      });
    } else if (isUz) {
      weaknesses.push({
        id: 'w-stack',
        area: 'Texnologiyalar ro‘yxati qisqa',
        question: `${topSkills || 'Asosiy stek'} bilan birga qaysi testlash vositalari, ma'lumotlar bazalari yoki CI/CD tizimlaridan foydalangansiz?`,
        strategy: 'Ko‘nikmalar bo‘limiga yordamchi vositalar, Git, testlash va ma\'lumotlar bazalarini qo‘shing.',
        resolved: false,
      });
    } else {
      weaknesses.push({
        id: 'w-stack',
        area: 'Узкий перечень смежных инструментов',
        question: `«С какими системами тестирования, базами данных и CI/CD вы работали помимо ${topSkills || 'основного стека'}?»`,
        strategy: 'Дополните раздел навыков инфраструктурными инструментами (Docker, Git, тесты, БД), которые вы применяли на практике.',
        resolved: false,
      });
    }
  }

  if (weaknesses.length < 2) {
    if (isEn) {
      weaknesses.push({
        id: 'w-arch',
        area: 'Depth of technical ownership',
        question: `What was the hardest architectural bottleneck you resolved as ${input.targetPosition}, and what would you do differently today?`,
        strategy: 'Prepare a 2-minute STAR story explaining the trade-offs you evaluated and the final engineering decision.',
        resolved: false,
      });
    } else if (isUz) {
      weaknesses.push({
        id: 'w-arch',
        area: 'Texnik qarorlar mas’uliyati',
        question: `${input.targetPosition} sifatida duch kelgan eng murakkab texnik muammo nima edi va uni qanday hal qildingiz?`,
        strategy: 'STAR usulida 2 daqiqalik aniq hikoya tayyorlang: muammo, muqobil variantlar va yakuniy qaror.',
        resolved: false,
      });
    } else {
      weaknesses.push({
        id: 'w-arch',
        area: 'Глубина технических решений',
        question: `«С каким самым сложным техническим ограничением вы столкнулись на позиции ${input.targetPosition} и какие альтернативы рассматривали?»`,
        strategy: 'Подготовьте короткий разбор 1 кейса по схеме: контекст задачи → выбор компромисса → итоговый результат.',
        resolved: false,
      });
    }
  }

  // Calculate completeness score
  let score = 55;
  if (input.experience.length > 0 || input.projects.length > 0) score += 18;
  if (input.education.length > 0) score += 10;
  if (input.skills.hard.length >= 4) score += 10;
  if (expWithoutNumbers.length === 0 && input.experience.length > 0) score += 7;
  const completenessScore = Math.min(98, score);

  return {
    summary,
    experience,
    projects,
    strengths,
    weaknesses,
    completenessScore,
  };
}

export function generateMockCoverLetter(
  input: PreparedAiInput,
  params: {
    fullName?: string;
    targetCompany?: string;
    targetVacancy?: string;
    recipientName?: string;
  }
): string {
  const isUz = input.language === 'uz';
  const isEn = input.language === 'en';
  const company = params.targetCompany?.trim() || (isEn ? 'your team' : isUz ? 'kompaniyangiz' : 'вашей компании');
  const vacancy = params.targetVacancy?.trim() || input.targetPosition || (isEn ? 'Specialist' : 'Специалист');
  const skillsStr = input.skills.hard.slice(0, 5).join(', ');
  const latestExp = input.experience[0];
  const candidateName = params.fullName?.trim() || (isEn ? 'Candidate' : isUz ? 'Nomzod' : 'Кандидат');

  if (isEn) {
    const greeting = params.recipientName?.trim() ? `Dear ${params.recipientName.trim()},` : 'Hello Hiring Team,';
    const expLine = latestExp
      ? `Most recently, as ${latestExp.role} at ${latestExp.company}, I worked on core production systems and technical delivery.`
      : `In my recent projects, I focused on building reliable applications and clean technical architecture.`;

    return `${greeting}

I am writing to express my interest in the ${vacancy} position at ${company}.

With practical hands-on background in ${skillsStr || 'modern engineering'}, I build maintainable solutions with clear architectural structure. ${expLine}

My attached CV outlines my projects, technical toolset, and education. I would welcome the chance to discuss how my engineering experience aligns with the current priorities of ${company}.

Sincerely,
${candidateName}`;
  }

  if (isUz) {
    const greeting = params.recipientName?.trim() ? `Hurmatli ${params.recipientName.trim()},` : 'Assalomu alaykum,';
    const expLine = latestExp
      ? `So‘nggi ish joyim — ${latestExp.company} kompaniyasida ${latestExp.role} lavozimida asosiy tizim modullarini yaratish va joriy etish bilan shug‘ullandim.`
      : `Loyihalarim davomida tizim barqarorligi va toza arxitektura ustida ishladim.`;

    return `${greeting}

${company} kompaniyasidagi ${vacancy} lavozimi uchun nomzodimni ko‘rib chiqishingizni so‘rayman.

${skillsStr ? `${skillsStr} texnologiyalari bo‘yicha amaliy tajribaga egaman.` : ''} ${expLine}

Ilova qilingan rezyumeda bajarilgan loyihalar va texnik ko‘nikmalarim batafsil keltirilgan. Suhbat davomida tajribam kompaniyangiz vazifalariga qanday hissa qo‘shishi mumkinligini muhokama qilishga tayyorman.

Hurmat bilan,
${candidateName}`;
  }

  const greeting = params.recipientName?.trim() ? `Уважаемый(ая) ${params.recipientName.trim()},` : 'Здравствуйте!';
  const expLine = latestExp
    ? `На последней позиции (${latestExp.role} в компании «${latestExp.company}») я занимался проектированием ключевых компонентов, стабилизацией релизов и взаимодействием с продуктовой командой.`
    : `В рамках практических проектов я сосредоточился на архитектуре приложений, тестировании и доведении решений до рабочего запуска.`;

  return `${greeting}

Направляю резюме на позицию «${vacancy}» в ${company}.

Мой практический профиль опирается на работу со стеком ${skillsStr || 'современной разработки'}. ${expLine}

Я ценю чёткие технические требования, предсказуемый код и готов детально разобрать прошлые кейсы на техническом интервью. Буду рад обсудить задачи вашей команды и возможный формат сотрудничества.

С уважением,
${candidateName}`;
}

export function generateMockRecommendationLetter(
  input: PreparedAiInput,
  params: {
    fullName?: string;
    recommenderName?: string;
    recommenderRole?: string;
    recommenderCompany?: string;
    relationship?: string;
  }
): string {
  const isUz = input.language === 'uz';
  const isEn = input.language === 'en';
  const candidateName = params.fullName?.trim() || (isEn ? 'the candidate' : isUz ? 'nomzod' : 'кандидат');
  const latestExp = input.experience[0];
  const recName = params.recommenderName?.trim() || (isEn ? 'Alexey Smirnov' : 'Алексей Смирнов');
  const recRole = params.recommenderRole?.trim() || (isEn ? 'Engineering Manager' : 'Технический руководитель');
  const recCompany = params.recommenderCompany?.trim() || latestExp?.company || (isEn ? 'Tech Studio' : 'ИТ-компания');
  const skillsStr = input.skills.hard.slice(0, 4).join(', ');

  if (isEn) {
    return `To Whom It May Concern,

I am pleased to provide this letter of recommendation for ${candidateName}, with whom I worked at ${recCompany}${latestExp ? ` during their tenure as ${latestExp.role}` : ''}.

Throughout our collaboration, ${candidateName} demonstrated strong engineering ownership and consistency in solving complex technical tasks${skillsStr ? ` using ${skillsStr}` : ''}. Their code reviews, system design input, and structured approach to delivery helped our team keep production releases dependable.

Beyond technical proficiency, ${candidateName} communicates clearly with both engineers and product stakeholders, takes feedback constructively, and meets commitments without micromanagement.

I confidently recommend ${candidateName} for the role of ${input.targetPosition} and would welcome any follow-up questions.

Sincerely,
${recName}
${recRole}, ${recCompany}`;
  }

  if (isUz) {
    return `Tegishli tashkilot va rahbariyat e’tiboriga,

Ushbu xat orqali ${recCompany} kompaniyasida${latestExp ? ` ${latestExp.role} lavozimida` : ''} birga ishlagan hamkasbimiz ${candidateName} faoliyatini tavsiya etaman.

Birgalikdagi ish faoliyati davomida ${candidateName}${skillsStr ? ` (${skillsStr})` : ''} yo‘nalishida murakkab texnik vazifalarni mustaqil hal qilish va tizimli yondashuvni namoyon etdi. Loyihalarni o‘z vaqtida va sifat standartlariga mos ravishda topshirishda jamoaga sezilarli yordam berdi.

Texnik bilimlaridan tashqari, jamoa ichida aniq muloqot o‘rnatishi, mas’uliyatni o‘z zimmasiga olishi va yangi talablarga tez moslashishi bilan ajralib turadi.

${candidateName} nomzodini ${input.targetPosition} lavozimi uchun ishonch bilan tavsiya qilaman.

Hurmat bilan,
${recName}
${recRole}, ${recCompany}`;
  }

  return `По месту требования

Настоящим письмом подтверждаю высокий уровень профессиональной подготовки специалиста ${candidateName}, с которым мы работали в компании «${recCompany}»${latestExp ? ` на позиции ${latestExp.role}` : ''}.

За время совместной работы ${candidateName} проявил себя как самостоятельный и системный инженер${skillsStr ? ` (стек: ${skillsStr})` : ''}. Он принимал взвешенные архитектурные решения, последовательно доводил задачи до продакшена и поддерживал высокий стандарт качества кода в команде.

Отдельно отмечу дисциплину в сроках, спокойную и конструктивную коммуникацию с продуктовыми и смежными командами, а также готовность брать ответственность за сложные участки системы.

С уверенностью рекомендую ${candidateName} на должность «${input.targetPosition}». Готов ответить на дополнительные вопросы по указанным контактам.

С уважением,
${recName}
${recRole}, «${recCompany}»`;
}
