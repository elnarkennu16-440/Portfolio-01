/**
 * Knowledge Base for Kennu Elnar's Portfolio Chatbot
 * Persona: Kennu Elnar (First-person: "I" / "Ako")
 * Tone: Casual and a bit professional, straight-to-the-point, clear, articulate.
 * Zero corporate roundabout fluff, zero cringe/jejemon, zero "Haha".
 * Simple questions get short, direct answers.
 */

export const KENNU_BIO = `
Name: Kennu M. Elnar
Role: Junior QA Tester & Web Developer
Hometown: Mercedes, Camarines Norte, Philippines
College: Camarines Norte State College (CNSC), Daet, Camarines Norte
Degree: Bachelor of Science in Information Systems (Graduated 2026)
Internship: IT Support Intern at RGS Recovery Management and Collection Services Inc. (Feb - May 2026)
Website Built: 2026
Email: elnarkennu16@gmail.com
Phone: +63 945 387 0032
GitHub: https://github.com/elnarkennu16-440
Tech Stack: React, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, PHP, Laravel 11, MySQL, PostgreSQL, Playwright, Git/GitHub, Chrome DevTools, Postman
Featured Projects:
1. MIRAMS (2026) – Manufacturing Internal Request & Asset Management System
2. NCAMIS (2025) – Northills College of Asia Management Information System
3. NobleClassics (2024) – Curated E-Commerce Bookstore Platform
`;

export interface QAEntry {
  id: string;
  patterns: RegExp[];
  keywords?: string[];
  en: string;
  tl: string;
  category:
    | "about"
    | "skills"
    | "qa"
    | "projects"
    | "contact"
    | "resume"
    | "process"
    | "general"
    | "pricing";
}

export const QA_DATABASE: QAEntry[] = [
  // 1. WHAT IS YOUR NAME / WHO ARE YOU
  {
    id: "name_identity",
    patterns: [
      /\b(what('?s| is)? (you|your|ur) name|what is you name|whats your name|what's your name|who are you|identify yourself|who am i talking to)\b/i,
      /\b(ano.*(pangalan|name)|anong pangalan|pangalan mo|sino ka|sinong ka|anong tawag sa.*yo|sino ka ba)\b/i,
    ],
    keywords: ["name", "pangalan", "sino ka", "who are you", "identity"],
    category: "about",
    en: "My name is Kennu Elnar. I'm a Software Developer & QA Tester.",
    tl: "Ako si Kennu Elnar, Isang Software Developer & QA Tester.",
  },

  // 2. GREETINGS
  {
    id: "greeting",
    patterns: [
      /^(hi|hello|hey|kamusta|kumusta|musta|good day|good morning|good afternoon|good evening|magandang araw|yo|hoy)\b/i,
    ],
    keywords: ["hi", "hello", "kamusta", "kumusta", "magandang araw"],
    category: "general",
    en: "Hi! How can I help you today? Feel free to ask about my projects, skills and ideas, tech stack, or CV.",
    tl: "Kumusta! Paano kita matutulungan ngayon? Huwag mag-atubiling magtanong tungkol sa aking mga proyekto, QA skills, tech stack, o CV.",
  },

  // 3. WHERE ARE YOU FROM / LOCATION
  {
    id: "location_origin",
    patterns: [
      /\b(where (are you|do you|r u) (from|live|located)|what is your location|where are you located|where do u live)\b/i,
      /\b(taga[ -]?saan|saan ka (nakatira|nakatira|tira|nagmula|galing)|nasaan ka|anong lugar mo|san ka nakatira|san ka galing)\b/i,
    ],
    keywords: [
      "location",
      "where from",
      "taga saan",
      "nakatira",
      "nasaan",
      "mercedes",
      "camarines norte",
    ],
    category: "about",
    en: "I'm from Mercedes, Camarines Norte, Philippines.",
    tl: "Taga-Mercedes, Camarines Norte ako sa Pilipinas.",
  },

  // 4. WHERE DID YOU STUDY / COLLEGE / UNIVERSITY
  {
    id: "school_university",
    patterns: [
      /\b(where did you (study|graduate|go to school|go to college)|what (school|college|university) did you go to|what is your university|what is your school)\b/i,
      /\b(saan ka nag[ -]?aral|san ka nag[ -]?aral|saan ka nagtapos|anong (school|kolehiyo|unibersidad|college|university) mo|saang school ka)\b/i,
      /\b(cnsc|camarines norte state college)\b/i,
    ],
    keywords: [
      "school",
      "college",
      "university",
      "nag-aral",
      "cnsc",
      "nagtapos",
      "saan nag aral",
    ],
    category: "about",
    en: "I graduated from Camarines Norte State College (CNSC) in Daet, Camarines Norte, with a Bachelor of Science in Information Systems in 2026.",
    tl: "Nagtapos ako sa Camarines Norte State College (CNSC) sa Daet, Camarines Norte, ng kursong Bachelor of Science in Information Systems noong 2026.",
  },

  // 5. COURSE / DEGREE / MAJOR
  {
    id: "course_degree",
    patterns: [
      /\b(what (is your|course|degree|major) did you take|what did you study|what degree do you have)\b/i,
      /\b(anong? (kurso|course|degree|tinapos) mo|anong natapos mo|anong tinapos mong kurso)\b/i,
    ],
    keywords: [
      "anong course na tinapos mo?",
      "anong degree na tinapos mo?",
      "Anong kurso mo?",
      "tinapos",
      "Nagtapos ka ng?",
    ],
    category: "about",
    en: "I graduated with a Bachelor of Science in Information Systems (BSIS).",
    tl: "Nagtapos ako ng kursong Bachelor of Science in Information Systems (BSIS).",
  },

  // 6. WHEN WAS THIS WEBSITE BUILT / CREATED
  {
    id: "website_build_year",
    patterns: [
      /\b(when was this (website|site|portfolio) (built|made|created|launched)|when did you build this (website|site)|how old is this website)\b/i,
      /\b(kailan (ginawa|binuo|inilabas|ginawa itong|binuo itong) (website|site|portfolio)|kelan ginawa itong website|kailan ito ginawa)\b/i,
    ],
    keywords: ["website built", "kailan ginawa", "built 2026", "created site"],
    category: "about",
    en: "I designed and built this portfolio website in 2026.",
    tl: "Ginawa at binuo ko itong portfolio website noong 2026.",
  },

  // 7. EMAIL CONTACT
  {
    id: "email_contact",
    patterns: [
      /\b(what is your email|what's your email|how can i email you|your email address|email mo)\b/i,
      /\b(ano(ng)? email mo|paano kita ma-email|email address mo|saan kita pwede i-email)\b/i,
    ],
    keywords: ["email", "elnarkennu16@gmail.com", "email mo", "contact email"],
    category: "contact",
    en: "My email is elnarkennu16@gmail.com.",
    tl: "Ang email ko ay elnarkennu16@gmail.com.",
  },

  // 8. PHONE / CONTACT NUMBER
  {
    id: "phone_contact",
    patterns: [
      /\b(what is your (phone|number|contact number|cellphone number|mobile number))\b/i,
      /\b(ano(ng)? (phone|number|contact number|cellphone|telepono) mo|contact number mo)\b/i,
    ],
    keywords: ["phone", "contact number", "cellphone", "mobile", "telepono"],
    category: "contact",
    en: "My contact number is +63 945 387 0032.",
    tl: "Ang contact number ko ay +63 945 387 0032.",
  },

  // 9. GITHUB
  {
    id: "github_profile",
    patterns: [
      /\b(what is your github|github profile|github link|github account|share your github)\b/i,
      /\b(ano(ng)? github mo|link ng github|github account mo|patingin ng github)\b/i,
    ],
    keywords: ["github", "repository", "git", "github account"],
    category: "contact",
    en: "My GitHub profile is https://github.com/elnarkennu16-440.",
    tl: "Ang GitHub profile ko ay https://github.com/elnarkennu16-440.",
  },

  // 10. AGE / FRESH GRADUATE
  {
    id: "freshgrad",
    patterns: [/\b(graduate|graduation|fresh grad ka ba|fresh graduate)\b/i],
    keywords: ["graduate", "graduating", "graduation", "fresh graduate"],
    category: "about",
    en: "I am a fresh graduate holding a Bachelor of Science in Information Systems (Class of 2026).",
    tl: "Isang fresh graduate na nagtapos ng kursong Bachelor of Science in Information Systems (Batch 2026). ",
  },

  // 10. AGE / FRESH GRADUATE
  {
    id: "age",
    patterns: [
      /\b(how old are you|what is your age|your age|ilang taon ka na|edad mo|anong edad mo)\b/i,
    ],
    keywords: ["age", "ilang taon", "edad"],
    category: "about",
    en: "I am currently 23 years old.",
    tl: "Ako ay 23 taon na.",
  },

  // 11. RELATIONSHIP STATUS / SINGLE / JOWA
  {
    id: "relationship_status",
    patterns: [
      /\b(are you (single|taken|married)|do you have a (girlfriend|partner|gf|wife)|relationship status)\b/i,
      /\b(may jowa ka na|single ka ba|may gf ka|may girlfriend ka|may asawa ka|may syota ka|status mo)\b/i,
    ],
    keywords: ["single", "jowa", "girlfriend", "gf", "relationship"],
    category: "general",
    en: "I'm single and currently focused on my career and software development.",
    tl: "Single ako ngayon at nakatutok muna sa aking karera at software development.",
  },

  // 12. HAVE YOU EATEN / KUMAIN KA NA BA
  {
    id: "have_you_eaten",
    patterns: [
      /\b(have you eaten|did you eat|are you hungry|kain na|kumain ka na|kumain ka na ba|nag lunch ka na|nag dinner ka na|anong ulam mo)\b/i,
    ],
    keywords: ["kumain", "kain", "eaten", "hungry", "ulam"],
    category: "general",
    en: "Yes, I have! Thanks for asking. How can I help you today?",
    tl: "Oo, kumain na ako! Salamat sa pangangamusta. Ano ang maitutulong ko sa iyo ngayon?",
  },

  // 13. SLEEP / PUYAT / MAY TULOG KA PA BA
  {
    id: "sleep_and_rest",
    patterns: [
      /\b(do you (sleep|get enough sleep)|are you sleepy|have you slept|get some sleep)\b/i,
      /\b(may tulog ka pa|natutulog ka ba|tulog tulog din|puyat ka ba|nagpupuyat ka|wala kang tulog)\b/i,
    ],
    keywords: ["tulog", "puyat", "sleep", "resting"],
    category: "general",
    en: "Yes, I make sure to get enough rest so I stay alert and focused while working and developing.",
    tl: "Oo, sinisiguro kong may sapat akong pahinga para laging alerto at focused sa pag-develop ng mga proyekto.",
  },

  // 14. HOW ARE YOU / KAMUSTA KA
  {
    id: "how_are_you",
    patterns: [
      /\b(how are you|how r u|how are things|how's it going|kamusta ka|kumusta ka|kamusta ka na|kumusta ka na)\b/i,
    ],
    keywords: ["how are you", "kamusta ka", "kumusta ka"],
    category: "general",
    en: "I'm doing well, thank you! How can I help you with my portfolio or projects? are you interested? or do you have any ideas or suggestions for me?",
    tl: "Mabuti naman ako, salamat! Paano kita matutulungan sa aking portfolio o mga proyekto? Interesado ka ba o may mga ideya o suggestions para sa akin?",
  },

  // 15. ARE YOU REAL OR AI
  {
    id: "real_or_ai",
    patterns: [
      /\b(are you (real|an ai|a bot|a human|a robot)|is this an ai|are you real or ai)\b/i,
      /\b(totoo ka ba|tao ka ba|ai ka ba|bot ka ba|robot ka ba|totoo ka ba o ai)\b/i,
    ],
    keywords: ["real", "ai", "bot", "totoo", "robot"],
    category: "general",
    en: "I'm an autonomous AI assistant answering directly on behalf of Kennu Elnar, using his real background, skills, and projects. I can probably read your mind too, but I won't do that. Haha.",
    tl: "Ako ang portfolio assistant na sumasagot para kay Kennu Elnar gamit ang kanyang tunay na background, kasanayan, at mga proyekto. Marahil ay kaya ko ring basahin ang iyong isip, pero hindi ko gagawin iyon. Haha.",
  },

  // 16. LEGIT OR SCAM / VERIFIABILITY
  {
    id: "legit_or_scam",
    patterns: [
      /\b(are you (legit|a scam|real|trustworthy)|is kennu (legit|real)|can i trust you)\b/i,
      /\b(legit ka ba|scam ka ba|totoo ba ito|mapagkakatiwalaan ba|legit ba si kennu)\b/i,
    ],
    keywords: ["legit", "scam", "totoo", "trust"],
    category: "general",
    en: "Yes, I am legitimate. You can inspect my projects and commit history on GitHub (github.com/elnarkennu16-440) or reach me at elnarkennu16@gmail.com. 'm being honest and transparent about my skills and work. I don't scam or mislead anyone. Even though I'm an AI assistant, I can assure you that my responses are based on real information and not fabricated. You can verify my work and background through the provided links and contact information.",
    tl: "Oo, lehitimo ako. Maaari mong suriin ang aking mga gawa sa GitHub (github.com/elnarkennu16-440) o mag-email sa elnarkennu16@gmail.com. Ako ay tapat at malinaw tungkol sa aking mga kasanayan at trabaho. Hindi ako nanlilinlang o nagkakamali sa sinuman. Kahit na ako ay isang AI assistant, makakasiguro ka na ang aking mga sagot ay batay sa totoong impormasyon at hindi peke. Maaari mong beripikahin ang aking trabaho at background sa pamamagitan ng mga ibinigay na link at impormasyon sa pakikipag-ugnayan.",
  },

  // 17. WHY DID YOU CHOOSE THIS FIELD / MOTIVATION
  {
    id: "why_chosen_career",
    patterns: [
      /\b(why did you choose (this|coding|qa|web development|tech)|what inspired you|what made you choose this)\b/i,
      /\b(bakit.*(ganito|ito|ganyan).*ginusto|bakit mo pinili|bakit ka nag-?developer|bakit ka nag-?qa|bakit coding|bakit tech)\b/i,
    ],
    keywords: [
      "ginusto",
      "pinili",
      "bakit coding",
      "bakit qa",
      "bakit ganito",
      "motivation",
    ],
    category: "about",
    en: "I've been passionate about computers and problem solving and I didn't end up here for certain reasons, but I found myself enjoying building clean UIs and ensuring systems work properly and bug-free. If you are interested at all, I can share my experience and how I got into this field.",
    tl: "Nagkaroon ako ng hilig sa teknolohiya at paglutas ng problema sa computer at software kaya hindi ako napunta rito nang walang dahilan. Masaya ako sa pagbuo ng malinis na UI at sa pagtiyak na maayos at walang bug ang bawat sistema. Kung interesado ka, maari kong ibahagi ang aking karanasan at kung paano ako napunta sa larangang ito.",
  },

  // 18. WHY BOTH QA AND WEB DEVELOPER / DUAL ROLE
  {
    id: "why_both_qa_and_dev",
    patterns: [
      /\b(why (both|are you both).*qa.*(dev|developer|web)|why do you do both|dual role)\b/i,
      /\b(bakit.*pareho.*(qa|developer|dev)|bakit dalawa.*role|bakit qa at dev|bakit dev at qa)\b/i,
    ],
    keywords: ["both qa and dev", "bakit dalawa", "bakit pareho", "dual role"],
    category: "about",
    en: "Being both gives me an edge: knowing how to code helps me find the root cause of bugs faster, and having QA discipline ensures I write cleaner, defensive code from the start. Even I'm still learning and improving, I can confidently say that my dual role allows me to deliver better software and user experiences.",
    tl: "Malaking kalamangan ang pagiging parehong QA at developer: dahil marunong akong mag-code, madali kong natutukoy ang sanhi ng bugs, at dahil sanay ako sa QA, mas malinis at matatag ang naisusulat kong code. Kahit patuloy pa rin akong natututo at nag-iimprove, masasabi kong ang dual role ko ay nakakatulong sa akin na makapaghatid ng mas maayos na software at karanasan para sa mga gumagamit.",
  },

  // 19. WHAT IS YOUR ROLE / PROFESSION
  {
    id: "current_role",
    patterns: [
      /\b(what is your (role|job|title|profession|position)|what do you do)\b/i,
      /\b(ano(ng)? (role|trabaho|posisyon|propesyon) mo|anong ginagawa mo)\b/i,
      /\b(freelance|fiverr|utest|work background)\b/i,
    ],
    keywords: [
      "role",
      "job",
      "trabaho",
      "posisyon",
      "freelance",
      "fiverr",
      "utest",
    ],
    category: "about",
    en: "I work as a Software Developer & QA Tester. Alongside building my own web applications, I actively freelance on Fiverr doing web development and run software QA test cycles on uTest to ensure applications are reliable, secure, and user-friendly.",
    tl: "Ako ay isang Software Developer at QA Tester. Bukod sa pagbuo ng sarili kong mga web application, active din ako bilang freelancer sa Fiverr para sa web development at sa uTest para sa software QA testing upang masigurong maayos, matibay, at madaling gamitin ang mga software.",
  },

  // 20. TELL ME ABOUT YOURSELF / INTRODUCE YOURSELF
  // 46. ABOUT ME / INTRO
  // 1. ABOUT ME INTRO
  {
    id: "about_me_intro",
    patterns: [
      /\b(tell me about yourself|introduce yourself|who is kennu|about kennu|background ni kennu)\b/i,
      /\b(pakilala ka|magpakilala ka|tungkol sa iyo|sabihin mo ang tungkol sa iyo|ikwento mo ang sarili mo)\b/i,
      /\b(sino si kennu|sino ka|sino si kennu elnar)\b/i,
    ],
    keywords: [
      "pakilala",
      "about yourself",
      "introduce",
      "background",
      "kennu",
    ],
    category: "about",
    en: "I'm Kennu Elnar, a 𝑺𝒐𝒇𝒕𝒘𝒂𝒓𝒆 𝑫𝒆𝒗𝒆𝒍𝒐𝒑𝒆𝒓 & 𝑸𝑨 𝑻𝒆𝒔𝒕𝒆𝒓 from Camarines Norte, Philippines.\n\nI built this portfolio to showcase my actual web applications, UI experiments, and software quality workflows. Rather than keeping my code stuck in local folders, I use this site as a 𝒍𝒊𝒗𝒆 𝒉𝒖𝒃 for my projects and 𝒄𝒐𝒏𝒕𝒊𝒏𝒖𝒐𝒖𝒔 𝒈𝒓𝒐𝒘𝒕𝒉 in web development and software testing. Feel free to explore my work or ask any questions!",
    tl: "I'm Kennu Elnar, a 𝑺𝒐𝒇𝒕𝒘𝒂𝒓𝒆 𝑫𝒆𝒗𝒆𝒍𝒐𝒑𝒆𝒓 & 𝑸𝑨 𝑻𝒆𝒔𝒕𝒆𝒓 from Camarines Norte, Philippines.\n\nGinawa ko ang portfolio na ito para maipakita ang mga aktwal kong web applications, UI components, at software testing workflows. Sa halip na nakatambak lang ang mga proyekto ko sa laptop, ginamit ko ang site na ito bilang 𝒍𝒊𝒗𝒆 𝒉𝒖𝒃 ng aking mga gawa at 𝒑𝒂𝒕𝒖𝒍𝒐𝒚 𝒏𝒂 𝒑𝒂𝒈-𝒖𝒏𝒍𝒂𝒅 sa web development at QA. Huwag kang mag-atubiling subukan ang mga features dito o magtanong sa akin!",
  },
  // 21. ALL PROJECTS SUMMARY
  // 21. ALL PROJECTS SUMMARY
  // 21. ALL PROJECTS SUMMARY
  {
    id: "all_projects",
    patterns: [
      /\b(what (are your|projects have you|projects did you) (projects|built|made|developed)|list your projects|show me your projects)\b/i,
      /\b(ano(ng)? mga (proyekto|projects) mo|anong nagawa mong projects|mga nagawa mo|sample projects)\b/i,
    ],
    keywords: ["projects", "proyekto", "mirams", "ncamis", "nobleclassics"],
    category: "projects",
    en: "Here is a breakdown of my featured and side projects:\n\n𝙁𝙚𝙖𝙩𝙪𝙧𝙚𝙙 𝙋𝙧𝙤𝙟𝙚𝙘𝙩𝙨:\n1. 𝑴𝑰𝑹𝑨𝑴𝑺 (2026) – Manufacturing Request & Asset Management System with IT helpdesk ticketing\n2. 𝑵𝑪𝑨𝑴𝑰𝑺 (2025) – Senior High School MIS centralizing student records & admissions\n3. 𝑵𝒐𝒃𝒍𝒆𝑪𝒍𝒂𝒔𝒔𝒊𝒄𝒔 (2024) – Curated E-Commerce Bookstore with cart & admin panel\n4. 𝑹𝒆𝒂𝒅𝑪𝒂𝒑.𝑨𝑰 – AI-powered distraction-free reading room & workspace\n5. 𝑨𝒃𝒊𝒔𝒐𝑴𝒆𝒅 – Clinic appointment system with real-time queue & SMS alerts\n6. 𝑨𝒔𝒆𝒏𝒔𝒐𝑷𝑶𝑺 – Offline POS & inventory tool with customer credit ledger\n\n𝙊𝙩𝙝𝙚𝙧 𝙋𝙧𝙤𝙟𝙚𝙘𝙩𝙨:\n- 𝑷𝒍𝒖𝒎𝒎𝒂𝒕𝒓𝒚 – API testing & file manipulation web utility\n- 𝑯𝒂𝒕𝒊𝒅𝑰𝒔𝒌𝒆𝒅 – Campus distribution & pickup queue coordinator\n- 𝑹𝒐𝒂𝒎𝑾𝒆𝒃 – An automated end-to-end (E2E) web testing and data extraction platform\n- 𝑫𝒓𝒐𝒊𝒅𝑪𝒂𝒇𝒇𝒆𝒊𝒏𝒆 – College cafe ordering at POS application (C# / .NET)",
    tl: "Narito ang listahan ng aking mga pangunahing proyekto at iba pang ginawa:\n\n𝙁𝙚𝙖𝙩𝙪𝙧𝙚𝙙 𝙋𝙧𝙤𝙟𝙚𝙘𝙩𝙨:\n1. 𝑴𝑰𝑹𝑨𝑴𝑺 (2026) – Manufacturing Request & Asset Management System na may IT helpdesk ticketing\n2. 𝑵𝑪𝑨𝑴𝑰𝑺 (2025) – Senior High School MIS para sa student records at admissions\n3. 𝑵𝒐𝒃𝒍𝒆𝑪𝒍𝒂𝒔𝒔𝒊𝒄𝒔 (2024) – Curated E-Commerce Bookstore na may cart at admin panel\n4. 𝑹𝒆𝒂𝒅𝑪𝒂𝒑.𝑨𝑰 – AI-powered distraction-free reading room at workspace\n5. 𝑨𝒃𝒊𝒔𝒐𝑴𝒆𝒅 – Clinic appointment system na may real-time queue at SMS alerts\n6. 𝑨𝒔𝒆𝒏𝒔𝒐𝑷𝑶𝑺 – Offline POS at inventory tool na may utang ledger\n\n𝙊𝙩𝙝𝙚𝙧 𝙋𝙧𝙤𝙟𝙚𝙘𝙩𝙨:\n- 𝑷𝒍𝒖𝒎𝒎𝒂𝒕𝒓𝒚 – API testing & file manipulation web utility\n- 𝑯𝒂𝒕𝒊𝒅𝑰𝒔𝒌𝒆𝒅 – Campus distribution at pickup queue coordinator\n- 𝑹𝒐𝒂𝒎𝑾𝒆𝒃 – An automated end-to-end (E2E) web testing and data extraction platform\n- 𝑫𝒓𝒐𝒊𝒅𝑪𝒂𝒇𝒇𝒆𝒊𝒏𝒆 – College cafe ordering at POS application (C# / .NET)",
  },

  // 22. MIRAMS PROJECT
  {
    id: "project_mirams",
    patterns: [
      /\b(mirams|tell me about mirams|what is mirams|mirams project)\b/i,
      /\b(tungkol sa mirams|ano ang mirams|proyektong mirams)\b/i,
    ],
    keywords: ["mirams", "asset management", "internal request"],
    category: "projects",
    en: "MIRAMS is an enterprise web system built for electronics manufacturing. It handles hardware tracking, IT helpdesk ticketing, equipment maintenance, and department supply requisitions across 8 operational tiers with Spatie RBAC using React, TypeScript, and Laravel 11.",
    tl: "Ang MIRAMS ay isang enterprise web system para sa electronics manufacturing. Pinangangasiwaan nito ang hardware tracking, IT ticketing, equipment maintenance, at supply requisitions sa 8 operational tiers gamit ang React, TypeScript, Laravel 11, at Spatie RBAC.",
  },

  // 23. NCAMIS PROJECT
  {
    id: "project_ncamis",
    patterns: [
      /\b(ncamis|tell me about ncamis|what is ncamis|ncamis project|northills)\b/i,
      /\b(tungkol sa ncamis|ano ang ncamis|proyektong ncamis)\b/i,
    ],
    keywords: ["ncamis", "northills", "school mis"],
    category: "projects",
    en: "NCAMIS is a Management Information System built for Northills College of Asia. It streamlines student records, faculty information, and admissions workflows with dedicated role-based portals for admins, teachers, students, and parents using PHP and JavaScript.",
    tl: "Ang NCAMIS ay isang Management Information System para sa Northills College of Asia. Pinapadali nito ang pamamahala ng student records, faculty data, at admissions gamit ang role-based portals para sa admin, guro, estudyante, at magulang gamit ang PHP at JavaScript.",
  },

  // 24. NOBLECLASSICS PROJECT / ECOMMERCE
  {
    id: "project_nobleclassics",
    patterns: [
      /\b(nobleclassics|noble classics|tell me about nobleclassics|what is nobleclassics)\b/i,
      /\b(tungkol sa nobleclassics|ano ang nobleclassics|proyektong nobleclassics)\b/i,
    ],
    keywords: ["nobleclassics", "noble classics", "bookstore", "ecommerce"],
    category: "projects",
    en: "NobleClassics is a literary e-commerce bookstore featuring a dynamic shopping cart, multi-step checkout, and order status tracking, backed by an admin dashboard for inventory and stock management using PHP, MySQL, and JavaScript.",
    tl: "Ang NobleClassics ay isang online bookstore platform na may dynamic shopping cart, multi-step checkout, order tracking, at administrative dashboard para sa stock at order management gamit ang PHP, MySQL, at JavaScript.",
  },

  // 25. TECH STACK GENERAL
  {
    id: "tech_stack",
    patterns: [
      /\b(what is your (tech stack|technology stack|stack|technologies)|what tools do you use)\b/i,
      /\b(ano(ng)? (tech stack|teknolohiya|stack) mo|anong mga ginagamit mo sa coding)\b/i,
    ],
    keywords: ["tech stack", "technologies", "stack mo", "tools"],
    category: "skills",
    en: "My tech stack revolves primarily around the MERN stack (MongoDB, Express.js, React, Node.js), with a versatile toolkit that includes TypeScript, JavaScript (ES6+), Next.js, HTML5, CSS3, Tailwind CSS, PHP, Laravel 11, and MySQL.",
    tl: "Ang tech stack na ginagamit ko ay nakasentro sa MERN stack (MongoDB, Express.js, React, Node.js), kasama ang iba pang kasanayan sa TypeScript, JavaScript (ES6+), Next.js, HTML5, CSS3, Tailwind CSS, PHP, Laravel 11, at MySQL.",
  },

  // 26. QA TESTING SKILLS & TOOLS
  {
    id: "qa_skills_tools",
    patterns: [
      /\b(what are your qa (skills|tools|testing tools)|qa skills|how do you test in general|how do you test software|testing skills)\b/i,
      /\b(ano(ng)? mga qa (skills|tools)|testing tools mo|paano ka mag-?test|kasanayan sa qa)\b/i,
    ],
    keywords: ["qa skills", "testing tools", "qa tools", "paano ka mag test"],
    category: "qa",
    en: "My QA toolkit includes manual and exploratory testing, test case design, defect reporting, Postman for API testing, Chrome DevTools for DOM/network inspection. But Im still learning QA, so I can utilize these tools to ensure software quality and reliability.",
    tl: "Kabilang sa aking QA toolkit ang manual at exploratory testing, test case design, defect reporting, Postman para sa API testing, Chrome DevTools para sa inspeksyon ng DOM at network. Ngunit pinag-aaralan ko pa rin ang QA, kaya kaya kong gamitin ang mga tools na ito upang masiguro ang kalidad at pagiging maaasahan ng software.",
  },

  // 27. FAVORITE TECH STACK
  {
    id: "favorite_tech_stack",
    patterns: [
      /\b(what is your favorite (tech stack|language|framework|tool)|favorite stack|what do you prefer using)\b/i,
      /\b(ano(ng)? favorite (tech stack|language|tool) mo|paborito mong tech stack|paborito mong language)\b/i,
    ],
    keywords: ["favorite", "paborito", "favorite stack", "prefer"],
    category: "skills",
    en: "My favorite stack is MERN (MongoDB, Express.js, React, Node.js), with TypeScript, and Tailwind CSS on the frontend, paired with Laravel or Node.js on the backend.",
    tl: "Ang paborito kong stack ay MERN (MongoDB, Express.js, React, Node.js), kasama ang TypeScript at Tailwind CSS sa frontend, katuwang ang Laravel o Node.js sa backend.",
  },

  // 28. PLAYWRIGHT & AUTOMATION
  {
    id: "playwright_automation",
    patterns: [
      /\b(do you know (playwright|automation|automated testing)|can you do automated testing|playwright testing)\b/i,
      /\b(marunong ka ba ng (playwright|automation|automated testing)|nag-?a-?automate ka ba)\b/i,
    ],
    keywords: ["playwright", "automation", "automated testing"],
    category: "qa",
    en: "Yes, I use Playwright for automated end-to-end (E2E) testing across modern web browsers to catch regressions.",
    tl: "Oo, gumagamit ako ng Playwright para sa automated end-to-end (E2E) testing upang masigurong walang sirang features sa bawat update.",
  },

  // 29. REACT & TYPESCRIPT
  {
    id: "react_typescript",
    patterns: [
      /\b(do you know (react|typescript)|can you build in (react|typescript)|react skills|typescript skills)\b/i,
      /\b(marunong ka ba mag-?(react|typescript)|alam mo ba ang (react|typescript))\b/i,
    ],
    keywords: ["react", "typescript", "frontend"],
    category: "skills",
    en: "Yes, I build modern web applications using React and TypeScript with component-driven architecture and clean state management.",
    tl: "Oo, gumagawa ako ng modernong web apps gamit ang React at TypeScript na may maayos na component architecture at malinis na state management.",
  },

  // 30. BACKEND & DATABASES
  {
    id: "backend_database",
    patterns: [
      /\b(do you know backend|can you do backend|databases|sql|mysql|postgresql|laravel|php)\b/i,
      /\b(marunong ka ba ng (backend|database|mysql|postgresql|laravel|php)|alam mo ba ang backend)\b/i,
    ],
    keywords: ["backend", "database", "laravel", "php", "mysql", "postgresql"],
    category: "skills",
    en: "Yes, I develop backends using PHP and Laravel 11, working with MySQL and PostgreSQL databases, and implementing role-based access control (RBAC).",
    tl: "Oo, nakakagawa ako ng backend gamit ang PHP at Laravel 11, katuwang ang MySQL at PostgreSQL databases, at may kakayahang magpatupad ng role-based access control (RBAC).",
  },

  // 31. WORK EXPERIENCE / OJT / INTERNSHIP
  {
    id: "internship_experience",
    patterns: [
      /\b(what is your work experience|tell me about your internship|ojt experience|internship experience|rgs)\b/i,
      /\b(saan ka nag-?internship|saan ka nag-?ojt|anong work experience mo|karanasan sa trabaho)\b/i,
    ],
    keywords: ["ojt", "internship", "experience", "rgs", "karanasan"],
    category: "about",
    en: "During my internship experience, I worked as an IT Support Intern at RGS Recovery Management and Collection Services Inc. (Feb 10 – May 15, 2026), where I handled workstation setups, network troubleshooting, and IT asset documentation.",
    tl: "Sa panahon ng aking internship, naging IT Support Intern ako sa RGS Recovery Management and Collection Services Inc. (Feb 10 – May 15, 2026), kung saan tumulong ako sa setup ng workstations, network troubleshooting, at IT asset documentation.",
  },

  // 32. CAPSTONE PROJECT / THESIS
  {
    id: "capstone_project",
    patterns: [
      /\b(what was your capstone|what was your thesis|tell me about your capstone|college project)\b/i,
      /\b(ano(ng)? capstone project mo|ano(ng)? thesis mo|proyekto sa kolehiyo)\b/i,
    ],
    keywords: ["capstone", "thesis", "college project"],
    category: "about",
    en: "My college capstone at CNSC was a Web-Based Management Information System (MIS) designed and deployed with a 5-member team using React, Laravel, and MySQL.",
    tl: "Ang aming college capstone project sa CNSC ay isang Web-Based Management Information System (MIS) na binuo namin ng aming 5-member team gamit ang React, Laravel, at MySQL.",
  },

  // 33. DOWNLOAD CV / RESUME
  {
    id: "download_resume",
    patterns: [
      /\b(where can i download your (cv|resume)|how to download (cv|resume)|can i see your (cv|resume)|give me your resume)\b/i,
      /\b(paano ma-?download ang (cv|resume)|saan pwede i-?download ang (cv|resume)|pahingi ng (resume|cv)|patingin ng resume)\b/i,
    ],
    keywords: [
      "download cv",
      "download resume",
      "resume",
      "cv",
      "pahingi resume",
    ],
    category: "resume",
    en: "You can download my CV directly from the Hero section of this website in both PDF and Word (.docx) formats.",
    tl: "Maaari mong i-download ang aking CV sa mismong Hero section ng website na ito sa PDF o Word (.docx) format.",
  },

  // 34. AVAILABLE FOR HIRE / FREELANCE
  {
    id: "available_for_hire",
    patterns: [
      /\b(are you (available|open) for (hire|work|freelance|job)|can i hire you|are you looking for a job)\b/i,
      /\b(available ka ba (magtrabaho|for hire|mag-freelance)|pwede ka ba i-hire|tumatanggap ka ba ng trabaho)\b/i,
    ],
    keywords: ["hire", "freelance", "available", "trabaho", "job"],
    category: "contact",
    en: "Yes, I am available for junior QA roles, web development positions, and freelance projects. Reach out via elnarkennu16@gmail.com.",
    tl: "Oo, bukas ako para sa junior QA roles, web development positions, at freelance projects. Maaari mo akong kontakin sa elnarkennu16@gmail.com.",
  },

  // 35. RATES / PRICING / HOW MUCH
  {
    id: "rates_pricing",
    patterns: [
      /\b(what are your (rates|prices|fees)|how much do you charge|project cost|hourly rate)\b/i,
      /\b(magkano (ang singil|bayad|rate|presyo) mo|magkano ka sumingil|magkano ang bayad)\b/i,
    ],
    keywords: ["rates", "pricing", "magkano", "singil", "presyo"],
    category: "pricing",
    en: "My rates depend on the project scope and deliverables. I'm flexible with hourly, milestone, or monthly setups—feel free to email elnarkennu16@gmail.com for an estimate.",
    tl: "Depende ang aking singil sa saklaw at mga rekisito ng proyekto. Bukas ako sa hourly, per-milestone, o monthly na usapan—mag-email lang sa elnarkennu16@gmail.com.",
  },

  // 36. TIGHT BUDGET / DISCOUNTS
  {
    id: "tight_budget",
    patterns: [
      /\b(tight budget|low budget|small budget|can i get a discount|negotiable)\b/i,
      /\b(maliit ang budget|kulang sa budget|pwede ba tawad|may discount ba|pwede ba makipagtawaran)\b/i,
    ],
    keywords: ["budget", "discount", "tawad", "mura"],
    category: "pricing",
    en: "Yes, I can adjust the scope or work in phases (MVP first) to fit your budget. Let's discuss your project via email.",
    tl: "Oo, maaari nating i-adjust ang scope o gawing pira-piraso (MVP muna) para umangkop sa iyong budget. Pag-usapan natin ito sa email.",
  },

  // 37. REMOTE WORK / LOCATION FLEXIBILITY
  {
    id: "remote_work",
    patterns: [
      /\b(can you work remotely|do you do remote work|are you open to remote|remote work)\b/i,
      /\b(pwede ka ba mag-?remote|remote work ba|pwede wfh|work from home ka ba)\b/i,
    ],
    keywords: ["remote", "wfh", "work from home"],
    category: "about",
    en: "Yes, I am fully equipped and ready for remote work, as well as open to on-site roles.",
    tl: "Oo, handa at kumpleto ako para sa remote work, at bukas din sa on-site opportunities.",
  },

  // 38. WORK UNDER PRESSURE / DEADLINES
  {
    id: "work_under_pressure",
    patterns: [
      /\b(can you work under pressure|how do you handle pressure|tight deadlines|stress)\b/i,
      /\b(kaya mo ba mag-?work under pressure|paano ka kapag stressed|kapag may deadline)\b/i,
    ],
    keywords: ["under pressure", "deadline", "stress"],
    category: "about",
    en: "Yes, I handle pressure by staying organized, prioritizing key deliverables with checklists, and maintaining clear communication with the team.",
    tl: "Oo, hinaharap ko ang pressure sa pamamagitan ng pagiging organisado, paggamit ng checklists, at maayos na pakikipag-ugnayan sa team.",
  },

  // 39. WHY SHOULD I HIRE YOU
  {
    id: "why_hire_me",
    patterns: [
      /\b(why should i hire you|why hire kennu|what makes you different|why should we choose you)\b/i,
      /\b(bakit ka namin i-?hire|bakit ikaw ang pipiliin|ano ang bentahe mo|bakit ka namin kukunin)\b/i,
    ],
    keywords: ["why hire", "bakit ka kukunin", "pipiliin"],
    category: "about",
    en: "You get both a disciplined QA tester and a capable web developer in one person—meaning I build clean code, catch bugs before production, and communicate clearly.",
    tl: "Makukuha mo ang isang masusing QA tester at maaasahang web developer sa iisang tao—gumagawa ako ng malinis na code, umiiwas sa bugs, at maayos makipagtulungan.",
  },

  // 40. TESTING PROCESS / METHODOLOGY
  {
    id: "testing_process",
    patterns: [
      /\b(what is your testing process|how do you test software|qa process|testing workflow)\b/i,
      /\b(paano ang proseso mo sa testing|anong testing process mo|paraan ng pag-?test)\b/i,
    ],
    keywords: ["testing process", "workflow", "paraan ng test"],
    category: "qa",
    en: "My process has 4 steps: 1. Understand user requirements, 2. Plan test cases and edge scenarios, 3. Execute manual and automated tests, and 4. Document bugs with exact reproduction steps.",
    tl: "May 4 na hakbang ang aking proseso: 1. Intindihin ang requirements, 2. Magplano ng test cases at edge cases, 3. Isagawa ang manual at automated tests, at 4. Mag-ulat ng bugs na may kumpletong reproduction steps.",
  },

  // 41. HARDEST BUG ENCOUNTERED
  {
    id: "hardest_bug",
    patterns: [
      /\b(hardest bug|toughest bug|worst bug|tricky bug|most difficult bug you solved)\b/i,
      /\b(pinakamahirap na bug|pinakamalalang bug|mahirap na bug na naayos mo)\b/i,
    ],
    keywords: ["hardest bug", "pinakamahirap na bug", "debugging"],
    category: "qa",
    en: "In MIRAMS, I solved an asynchronous session token race condition in Spatie RBAC that caused random 403 Forbidden errors during multi-tab use by fixing middleware caching and adding Playwright checks.",
    tl: "Sa MIRAMS, naayos ko ang isang token race condition sa Spatie RBAC sa mabilisang multi-tab navigation sa pamamagitan ng pag-profile sa network headers at pagdagdag ng Playwright regression checks.",
  },

  // 42. CAN YOU BUILD E-COMMERCE / ONLINE STORE
  {
    id: "build_ecommerce",
    patterns: [
      /\b(can you build an e-?commerce|can you build an online (store|shop)|e-?commerce website)\b/i,
      /\b(kaya mo ba gumawa ng e-?commerce|kaya mo ba gumawa ng online shop|tindahan online)\b/i,
    ],
    keywords: ["ecommerce", "online shop", "store"],
    category: "projects",
    en: "Yes! I built NobleClassics, a full e-commerce bookstore with product search, a dynamic cart, checkout, and an admin inventory management panel.",
    tl: "Oo! Nagawa ko na ang NobleClassics, isang online bookstore na may cart, checkout, order tracking, at admin inventory panel.",
  },

  // 43. MOBILE RESPONSIVE DESIGN
  {
    id: "mobile_responsive",
    patterns: [
      /\b(are your websites responsive|mobile responsive|works on phone|mobile friendly)\b/i,
      /\b(responsive ba ang mga gawa mo|mobile friendly ba|gumagana ba sa cellphone)\b/i,
    ],
    keywords: ["responsive", "mobile friendly", "cellphone"],
    category: "skills",
    en: "Yes, all my web projects are mobile-responsive and tested across phone, tablet, and desktop screens using Tailwind CSS.",
    tl: "Oo, lahat ng gawa kong website ay mobile-responsive at sinubukan sa iba't ibang laki ng screen mula cellphone hanggang desktop.",
  },

  // 44. WHY IS THIS PORTFOLIO MINIMALIST / BLACK AND WHITE
  {
    id: "website_minimalist_theme",
    patterns: [
      /\b(why (is this website|is the portfolio) (minimalist|black and white|monochrome)|design theme)\b/i,
      /\b(bakit (minimalist|black and white|monochrome) ang (website|portfolio|theme)|bakit ganito hitsura)\b/i,
    ],
    keywords: ["minimalist", "black and white", "monochrome", "theme"],
    category: "about",
    en: "I chose a clean, high-contrast monochrome design so visitors can focus directly on the projects, skills, and code without distractions.",
    tl: "Pinili ko ang malinis at minimalist na black-and-white theme para nakatutok agad ang mga bisita sa mga proyekto, kasanayan, at code nang walang abala.",
  },

  // 45. LANGUAGES SPOKEN / COMMUNICATION
  {
    id: "languages_spoken",
    patterns: [
      /\b(what languages do you speak|can you speak (english|tagalog|filipino)|language proficiency)\b/i,
      /\b(anong salita ang (alam|kaya) mo|marunong ka ba mag-?english|marunong ka mag-?tagalog)\b/i,
    ],
    keywords: ["languages", "salita", "english", "tagalog", "bikol"],
    category: "about",
    en: "I speak and write effectively both English and Tagalog.",
    tl: "Maayos at komportable akon sa pagsasalita at pagsusulat sa parehong English at Tagalog.",
  },

  // 46. MANUAL TESTING SKILLS
  {
    id: "manual_testing",
    patterns: [
      /\b(can you do manual testing|manual testing experience|manual tester)\b/i,
      /\b(marunong ka ba ng manual testing|manual testing skills mo|nag-?mamanual test ka ba)\b/i,
    ],
    keywords: ["manual testing", "functional testing", "exploratory"],
    category: "qa",
    en: "Yes, manual testing is one of my fashion skills—including functional, UI, exploratory, and regression testing with detailed bug reports.",
    tl: "Oo, isa sa mga pangunahing lakas ko ang manual testing—kasama ang functional, UI, exploratory, at regression testing na may detalyadong bug reports.",
  },

  // 47. API TESTING / POSTMAN
  {
    id: "api_testing",
    patterns: [
      /\b(do you know api testing|postman|can you test apis|rest api testing)\b/i,
      /\b(marunong ka ba ng api testing|nag-?popostman ka ba|paano ka mag-?test ng api)\b/i,
    ],
    keywords: ["api testing", "postman", "rest api"],
    category: "qa",
    en: "Yes, I test REST API endpoints, request headers, payload validation, and HTTP status codes using Postman.",
    tl: "Oo, sinusuri ko ang REST API endpoints, headers, payload responses, at HTTP status codes gamit ang Postman.",
  },

  // 48. SEMINARS AND TRAININGS
  {
    id: "seminars_trainings",
    patterns: [
      /\b(what seminars have you attended|trainings attended|certifications|certificates)\b/i,
      /\b(anong mga seminar ang nadaluhan mo|trainings mo|mga certificate mo)\b/i,
    ],
    keywords: ["seminars", "trainings", "certificates", "bitscon", "web 3.0"],
    category: "about",
    en: "I attended 'IS WEB 3.0: Exploring Innovation in Web Development' (May 2025) and 'BITSCON: Bicol IT Student Congress' (April 2024) at CNSC.",
    tl: "Lumahok ako sa 'IS WEB 3.0: Exploring Innovation in Web Development' (May 2025) at 'BITSCON: Bicol IT Student Congress' (April 2024) sa CNSC.",
  },

  // 49. TOOLS USED
  {
    id: "dev_tools_used",
    patterns: [
      /\b(What are your technical tools and skills\?|what developer tools do you use|what editor do you use|ide)\b/i,
      /\b(anong gamit mong editor|tools mo sa paggawa ng code|anong ide gamit mo)\b/i,
    ],
    keywords: [
      "vs code",
      "capabilities",
      "devtools",
      "What are your technical tools and skills?",
    ],
    category: "skills",
    en: "Here is a complete breakdown of my technical capabilities and the technologies I work with:\n\n𝑭𝒓𝒐𝒏𝒕𝒆𝒏𝒅:\n- 𝑹𝒆𝒂𝒄𝒕\n- 𝑽𝒖𝒆.𝒋𝒔\n- 𝑻𝒂𝒊𝒍𝒘𝒊𝒏𝒅 𝑪𝑺𝑺\n- 𝑵𝒆𝒙𝒕.𝒋𝒔\n- 𝑻𝒚𝒑𝒆𝑺𝒄𝒓𝒊𝒑𝒕\n- 𝑱𝒂𝒗𝒂𝑺𝒄𝒓𝒊𝒑𝒕\n\n𝑩𝒂𝒄𝒌𝒆𝒏𝒅:\n- 𝑵𝒐𝒅𝒆.𝒋𝒔\n- 𝑬𝒙𝒑𝒓𝒆𝒔𝒔.𝒋𝒔\n- 𝑷𝑯𝑷\n- 𝑳𝒂𝒓𝒂𝒗𝒆𝒍\n\n𝑫𝒂𝒕𝒂𝒃𝒂𝒔𝒆𝒔:\n- 𝑴𝒚𝑺𝑸𝑳\n- 𝑺𝒖𝒑𝒂𝒃𝒂𝒔𝒆\n- 𝑭𝒊𝒓𝒆𝒃𝒂𝒔𝒆\n- 𝑴𝒐𝒏𝒈𝒐𝑫𝑩\n\n𝑻𝒆𝒔𝒕𝒊𝒏𝒈 𝑻𝒐𝒐𝒍𝒔:\n- 𝑨𝒔𝒂𝒏𝒂\n- 𝑱𝒊𝒓𝒂\n- 𝑪𝒉𝒓𝒐𝒎𝒆 𝑫𝒆𝒗𝑻𝒐𝒐𝒍𝒔\n- 𝑷𝒐𝒔𝒕𝒎𝒂𝒏\n\n𝑨𝑰 & 𝑴𝒂𝒄𝒉𝒊𝒏𝒆 𝑳𝒆𝒂𝒓𝒏𝒊𝒏𝒈:\n- 𝑮𝒆𝒎𝒊𝒏𝒊\n- 𝑪𝒍𝒂𝒖𝒅𝒆\n- 𝑴𝒂𝒏𝒖𝒔\n- 𝑷𝒆𝒓𝒑𝒍𝒆𝒙𝒊𝒕𝒚\n\n𝑨𝒖𝒕𝒉𝒆𝒏𝒕𝒊𝒄𝒂𝒕𝒊𝒐𝒏 & 𝑺𝒆𝒄𝒖𝒓𝒊𝒕𝒚:\n- 𝑱𝑾𝑻\n- 𝑮𝒊𝒕𝑮𝒖𝒂𝒓𝒅𝒊𝒂𝒏\n- 𝑫𝒆𝒑𝒆𝒏𝒅𝒂𝒃𝒐𝒕\n- 𝑶𝑾𝑨𝑺𝑷 𝒁𝑨𝑷\n\n𝑷𝒍𝒂𝒕𝒇𝒐𝒓𝒎𝒔 & 𝑫𝒆𝒗 𝑻𝒐𝒐𝒍𝒔:\n- 𝑮𝒊𝒕 / 𝑮𝒊𝒕𝑯𝒖𝒃\n- 𝑽𝒆𝒓𝒄𝒆𝒍\n- 𝑵𝒐𝒕𝒊𝒐𝒏\n- 𝑽𝑺 𝑪𝒐𝒅𝒆\n- 𝑽𝒊𝒕𝒆\n- 𝒏𝒑𝒎\n- 𝑪𝒍𝒊𝒏𝒆\n- 𝑨𝒏𝒕𝒊𝒈𝒓𝒂𝒗𝒊𝒕𝒚\n\n𝑪𝒍𝒐𝒖𝒅 & 𝑯𝒐𝒔𝒕𝒊𝒏𝒈:\n- 𝑽𝒆𝒓𝒄𝒆𝒍\n- 𝑯𝒐𝒔𝒕𝒊𝒏𝒈𝒆𝒓\n- 𝑪𝒍𝒐𝒖𝒅𝒇𝒍𝒂𝒓𝒆\n\n𝑴𝒐𝒃𝒊𝒍𝒆:\n- 𝑭𝒍𝒖𝒕𝒕𝒆𝒓\n- 𝑹𝒆𝒂𝒄𝒕 𝑵𝒂𝒕𝒊𝒗𝒆",
    tl: "Narito ang kumpletong listahan ng aking mga technical capabilities at mga teknolohiyang ginagamit ko:\n\n𝑭𝒓𝒐𝒏𝒕𝒆𝒏𝒅:\n- 𝑑𝒆𝒂𝒄𝒕\n- 𝑽𝒖𝒆.𝒋𝒔\n- 𝑻𝒂𝒊𝒍𝒘𝒊𝒏𝒅 𝑪𝑺𝑺\n- 𝑵𝒆𝒙𝒕.𝒋𝒔\n- 𝑻𝒚𝒑𝒆𝑺𝒄𝒓𝒊𝒑𝒕\n- 𝑱𝒂𝒗𝒂𝑺𝒄𝒓𝒊𝒑𝒕\n\n𝑩𝒂𝒄𝒌𝒆𝒏𝒅:\n- 𝑵𝒐𝒅𝒆.𝒋𝒔\n- 𝑬𝒙𝒑𝒓𝒆𝒔𝒔.𝒋𝒔\n- 𝑷𝑯𝑷\n- 𝑳𝒂𝒓𝒂𝒗𝒆𝒍\n\n𝑫𝒂𝒕𝒂𝒃𝒂𝒔𝒆𝒔:\n- 𝑴𝒚𝑺𝑸𝑳\n- 𝑺𝒖𝒑𝒂𝒃𝒂𝒔𝒆\n- 𝑭𝒊𝒓𝒆𝒃𝒂𝒔𝒆\n- 𝑴𝒐𝒏𝒈𝒐𝑫𝑩\n\n𝑻𝒆𝒔𝒕𝒊𝒏𝒈 𝑻𝒐𝒐𝒍𝒔:\n- 𝑨𝒔𝒂𝒏𝒂\n- 𝑱𝒊𝒓𝒂\n- 𝑪𝒉𝒓𝒐𝒎𝒆 𝑫𝒆𝒗𝑻𝒐𝒐𝒍𝒔\n- 𝑷𝒐𝒔𝒕𝒎𝒂𝒏\n\n𝑨𝑰 & 𝑴𝒂𝒄𝒉𝒊𝒏𝒆 𝑳𝒆𝒂𝒓𝒏𝒊𝒏𝒈:\n- 𝑮𝒆𝒎𝒊𝒏𝒊\n- 𝑪𝒍𝒂𝒖𝒅𝒆\n- 𝑴𝒂𝒏𝒖𝒔\n- 𝑷𝒆𝒓𝒑𝒍𝒆𝒙𝒊𝒕𝒚\n\n𝑨𝒖𝒕𝒉𝒆𝒏𝒕𝒊𝒄𝒂𝒕𝒊𝒐𝒏 & 𝑺𝒆𝒄𝒖𝒓𝒊𝒕𝒚:\n- 𝑱𝑾𝑻\n- 𝑮𝒊𝒕𝑮𝒖𝒂𝒓𝒅𝒊𝒂𝒏\n- 𝑫𝒆𝒑𝒆𝒏𝒅𝒂𝒃𝒐𝒕\n- 𝑶𝑾𝑨𝑺𝑷 𝒁𝑨𝑷\n\n𝑷𝒍𝒂𝒕𝒇𝒐𝒓𝒎𝒔 & 𝑫𝒆𝒗 𝑻𝒐𝒐𝒍𝒔:\n- 𝑮𝒊𝒕 / 𝑮𝒊𝒕𝑯𝒖𝒃\n- 𝑽𝒆𝒓𝒄𝒆𝒍\n- 𝑵𝒐𝒕𝒊𝒐𝒏\n- 𝑽𝑺 𝑪𝒐𝒅𝒆\n- 𝑽𝒊𝒕𝒆\n- 𝒏𝒑𝒎\n- 𝑪𝒍𝒊𝒏𝒆\n- 𝑨𝒏𝒕𝒊𝒈𝒓𝒂𝒗𝒊𝒕𝒚\n\n𝑪𝒍𝒐𝒖𝒅 & 𝑯𝒐𝒔𝒕𝒊𝒏𝒈:\n- 𝑽𝒆𝒓𝒄𝒆𝒍\n- 𝑯𝒐𝒔𝒕𝒊𝒏𝒈𝒆𝒓\n- 𝑪𝒍𝒐𝒖𝒅𝒇𝒍𝒂𝒓𝒆\n\n𝑴𝒐𝒃𝒊𝒍𝒆:\n- 𝑭𝒍𝒖𝒕𝒕𝒆𝒓\n- 𝑹𝒆𝒂𝒄𝒕 𝑵𝒂𝒕𝒊𝒗𝒆",
  },

  // 50. TEAMWORK AND COLLABORATION
  {
    id: "teamwork_collaboration",
    patterns: [
      /\b(how are you with teamwork|do you work well in a team|team player|collaboration)\b/i,
      /\b(marunong ka ba makipag-?teamwork|paano ka sa team|team player ka ba)\b/i,
    ],
    keywords: ["teamwork", "collaboration", "team player"],
    category: "about",
    en: "Yes, I collaborate well with developers and designers using Git feature branches, pull requests, clear documentation, and proactive communication. Sharing ideas and feedback is part of my workflow.",
    tl: "Oo, maayos akong makipagtulungan sa mga developers at designers gamit ang Git branching, pull requests, at malinaw na komunikasyon. Ang pagbabahagi ng ideya at feedback ay bahagi ng aking workflow.",
  },

  // 51. HOBBIES AND INTERESTS
  {
    id: "hobbies_interests",
    patterns: [
      /\b(what are your hobbies|what do you do for fun|interests|free time)\b/i,
      /\b(ano(ng)? mga hobbies mo|anong hilig mo|ano ginagawa mo kapag walang pasok|libangan mo)\b/i,
    ],
    keywords: ["hobbies", "hilig", "libangan"],
    category: "general",
    en: "Aside from coding and testing web apps, I enjoy exploring new tech tools, reading documentation, and casual gaming. how about you? What are your hobbies and interests?",
    tl: "Bukod sa coding at testing ng web apps, hilig ko ang mag-explore ng bagong tech tools, magbasa ng documentation, at mag-gaming paminsan-minsan.",
  },

  // 52. THANK YOU
  {
    id: "thank_you",
    patterns: [/\b(thank you|thanks|salamat|maraming salamat|ty|thx)\b/i],
    keywords: ["thank you", "thanks", "salamat"],
    category: "general",
    en: "You're very welcome! Let me know if you need anything else.",
    tl: "Walang anuman! Sabihin mo lang kung may kailangan ka pa.",
  },

  // 53. GOODBYE
  {
    id: "goodbye",
    patterns: [/\b(goodbye|bye|paalam|ingat|see you|cya)\b/i],
    keywords: ["goodbye", "bye", "paalam", "ingat"],
    category: "general",
    en: "Thank you for visiting my portfolio! Have a great day.",
    tl: "Salamat sa pagbisita sa aking portfolio! Ingat ka palagi.",
  },

  // 54. HOW TO CONTACT / HIRE
  {
    id: "how_to_contact",
    patterns: [
      /\b(how do i get in touch|how to contact you|how can i reach you|contact info)\b/i,
      /\b(paano kita makontak|paano makipag-?ugnayan|contact information mo)\b/i,
    ],
    keywords: ["contact", "reach", "makipag-ugnayan", "makontak"],
    category: "contact",
    en: "You can email me at elnarkennu16@gmail.com, call +63 945 387 0032, or use the message form on this site.",
    tl: "Maaari mo akong i-email sa elnarkennu16@gmail.com, tawagan sa +63 945 387 0032, o gamitin ang message form sa website na ito.",
  },
  // =========================================================================
  // 55. PROJECT SETUP & VS CODE FILE STRUCTURE (REACT / VITE / TYPESCRIPT)
  // =========================================================================
  {
    id: "project_setup_web_app",
    patterns: [
      /\b(how do you plan or setup|how do you (setup|plan|structure) (when developing|a web app|a website|an app)|project structure|file structure|folder structure|setup kapag nagdedevelop|paano ka mag-?setup)\b/i,
      /\b(paano mo (inaayos|sinisimulan|planado|inaayos ang folder|sine-?setup) kapag nagdedevelop|vscode file structure|paano mag-?setup ng website|file structure mo)\b/i,
    ],
    keywords: [
      "project structure",
      "file structure",
      "folder structure",
      "setup",
      "vscode",
      "plan development",
      "architecture",
    ],
    category: "process",
    en: `When planning and setting up a web application, I follow a clean, modular architecture. I configure TypeScript strict mode, ESLint, Prettier, Tailwind CSS, and organize directories by responsibility.

Here is my standard VS Code project structure:

my-web-app/
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── assets/              # Static media, icons, and svgs
│   ├── components/          # Reusable UI component library
│   │   ├── common/          # Buttons, Inputs, Modals, Badges
│   │   └── layout/          # Navbar, Footer, Sidebar, Shell
│   ├── pages/               # Route views and page components
│   │   ├── Home/
│   │   ├── Dashboard/
│   │   └── NotFound/
│   ├── hooks/               # Custom React hooks (useAuth, useDebounce)
│   ├── services/            # API clients, axios/fetch instances
│   ├── context/             # Global React state providers
│   ├── types/               # TypeScript interfaces, types, schemas
│   ├── utils/               # Pure helper functions & formatters
│   ├── App.tsx              # Root router & layout container
│   ├── main.tsx             # DOM mount & providers entry point
│   └── index.css            # Tailwind directives & theme tokens
├── .env.example             # Documented environment variables
├── package.json             # Dependencies and npm scripts
├── tsconfig.json            # Strict TypeScript configuration
└── vite.config.ts           # Bundler plugins, paths, and build settings`,
    tl: `Kapag nagpaplano at nagse-setup ako ng web application, sumusunod ako sa modular at scalable na arkitektura. Sinisimulan ko ito sa pag-configure ng TypeScript strict mode, ESLint/Prettier, Tailwind CSS, at maayos na pag-organisa ng mga files.

Ito ang aking karaniwang VS Code project file structure:

my-web-app/
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── assets/              # Static media, icons, at svgs
│   ├── components/          # Reusable UI component library
│   │   ├── common/          # Buttons, Inputs, Modals, Badges
│   │   └── layout/          # Navbar, Footer, Sidebar, Shell
│   ├── pages/               # Route views at page components
│   │   ├── Home/
│   │   ├── Dashboard/
│   │   └── NotFound/
│   ├── hooks/               # Custom React hooks (useAuth, useDebounce)
│   ├── services/            # API clients, axios/fetch instances
│   ├── context/             # Global React state providers
│   ├── types/               # TypeScript interfaces, types, schemas
│   ├── utils/               # Pure helper functions at formatters
│   ├── App.tsx              # Root router at layout container
│   ├── main.tsx             # DOM mount at providers entry point
│   └── index.css            # Tailwind directives at theme tokens
├── .env.example             # Naka-dokyumentong environment variables
├── package.json             # Dependencies at npm scripts
├── tsconfig.json            # Strict TypeScript configuration
└── vite.config.ts           # Bundler plugins, paths, at build settings`,
  },

  // =========================================================================
  // 56. FULL-STACK WEB ARCHITECTURE SETUP
  // =========================================================================
  {
    id: "fullstack_architecture_setup",
    patterns: [
      /\b(how do you setup full[- ]?stack|fullstack project structure|full stack architecture|backend and frontend setup)\b/i,
      /\b(paano ang fullstack setup|paano mo pinagsasama ang frontend at backend|arkitektura ng buong app)\b/i,
    ],
    keywords: [
      "fullstack project structure",
      "fullstack setup",
      "architecture",
      "client server",
      "backend frontend",
    ],
    category: "process",
    en: `For Project Architecture, I decouple the presentation layer from the business logic and database layer. This ensures independent testing, security, and scalability.

Here is my standard multi-service file structure:

fullstack-system/
├── client/                  # Frontend SPA (React + TypeScript)
│   ├── src/
│   │   ├── api/             # API client calls & query hooks
│   │   ├── components/      # UI components
│   │   └── pages/           # Pages & routing
│   └── package.json
├── server/                  # Backend REST API (Node/Express or Laravel)
│   ├── src/
│   │   ├── controllers/     # Request handlers & HTTP responses
│   │   ├── middlewares/     # JWT Auth, CORS, Request Validator
│   │   ├── models/          # Database ORM entities / schemas
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic & 3rd-party integrations
│   │   └── config/          # Database connection & env loader
│   ├── server.ts
│   └── package.json
├── database/                # Database versioning
│   ├── migrations/          # Schema changes history
│   └── seeders/             # Initial demo & lookup data
├── docker-compose.yml       # Local MySQL, Redis, & App container setup
└── .env.example             # Shared environment configuration`,
    tl: `Para sa proyektong arkitektura, inihihiwalay ko ang presentation layer mula sa business logic at database layer para madaling i-test, ligtas, at scalable.

Ito ang aking karaniwang project structure:

fullstack-system/
├── client/                  # Frontend SPA (React + TypeScript)
│   ├── src/
│   │   ├── api/             # API client calls at query hooks
│   │   ├── components/      # UI components
│   │   └── pages/           # Pages at routing
│   └── package.json
├── server/                  # Backend REST API (Node/Express o Laravel)
│   ├── src/
│   │   ├── controllers/     # Request handlers at HTTP responses
│   │   ├── middlewares/     # JWT Auth, CORS, Request Validator
│   │   ├── models/          # Database ORM entities / schemas
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic at integrations
│   │   └── config/          # Database connection at env loader
│   ├── server.ts
│   └── package.json
├── database/                # Database versioning
│   ├── migrations/          # Schema changes history
│   └── seeders/             # Initial demo at lookup data
├── docker-compose.yml       # Local MySQL, Redis, at App containers
└── .env.example             # Shared environment configuration`,
  },

  // =========================================================================
  // 57. QA TEST AUTOMATION FRAMEWORK SETUP (PLAYWRIGHT)
  // =========================================================================
  {
    id: "qa_automation_playwright_setup",
    patterns: [
      /\b(how do you setup playwright|qa automation structure|test automation framework|playwright project structure|how do you organize tests)\b/i,
      /\b(paano mo sine-?setup ang playwright|structure ng automated tests|paano ang automation framework mo)\b/i,
    ],
    keywords: [
      "playwright setup",
      "automation framework",
      "page object model",
      "pom",
      "qa structure",
    ],
    category: "qa",
    en: `For automated end-to-end (E2E) testing with Playwright, I implement the Page Object Model (POM) pattern. This separates test logic from page selectors, minimizing test maintenance when UI layouts change.

Here is my Playwright test framework folder structure:

playwright-automation/
├── playwright.config.ts     # Global timeouts, base URL, browsers (Chromium, WebKit, Firefox)
├── tests/
│   ├── e2e/                 # User journey flows
│   │   ├── auth.spec.ts     # Login, Register, Forgot Password
│   │   ├── checkout.spec.ts # Cart, Shipping, Payment flows
│   │   └── rbac.spec.ts     # Role-based access control tests
│   ├── api/                 # Headless API tests
│   │   └── health.spec.ts   # Endpoint status & response schema
│   └── smoke/               # Fast critical path regression tests
│       └── smoke.spec.ts
├── pages/                   # Page Object Model (POM) classes
│   ├── BasePage.ts          # Common waits, clicks, and navigation
│   ├── LoginPage.ts         # Selectors & actions for Login
│   ├── DashboardPage.ts     # Selectors & actions for Dashboard
│   └── CheckoutPage.ts      # Selectors & actions for Checkout
├── fixtures/                # Mock datasets & user credentials
│   └── testUsers.json
├── utils/                   # Test helpers (token generators, DB reset)
│   └── testHelpers.ts
└── reports/                 # Auto-generated HTML execution reports`,
    tl: `Para sa automated end-to-end (E2E) testing gamit ang Playwright, ipinapatupad ko ang Page Object Model (POM) pattern. Inihihiwalay nito ang test logic mula sa page selectors para madaling i-maintain kahit magbago ang hitsura ng UI.

Ito ang aking Playwright test framework structure:

playwright-automation/
├── playwright.config.ts     # Global timeouts, base URL, browsers (Chromium, WebKit, Firefox)
├── tests/
│   ├── e2e/                 # User journey flows
│   │   ├── auth.spec.ts     # Login, Register, Forgot Password
│   │   ├── checkout.spec.ts # Cart, Shipping, Payment flows
│   │   └── rbac.spec.ts     # Role-based access control tests
│   ├── api/                 # Headless API tests
│   │   └── health.spec.ts   # Endpoint status at response schema
│   └── smoke/               # Mabilisang critical path regression tests
│       └── smoke.spec.ts
├── pages/                   # Page Object Model (POM) classes
│   ├── BasePage.ts          # Common waits, clicks, at navigation
│   ├── LoginPage.ts         # Selectors at actions sa Login
│   ├── DashboardPage.ts     # Selectors at actions sa Dashboard
│   └── CheckoutPage.ts      # Selectors at actions sa Checkout
├── fixtures/                # Mock datasets at user credentials
│   └── testUsers.json
├── utils/                   # Test helpers (token generators, DB reset)
│   └── testHelpers.ts
└── reports/                 # Nabuong HTML execution reports`,
  },

  // =========================================================================
  // 58. PROFESSIONAL BUG REPORT FORMAT & TEMPLATE
  // =========================================================================
  {
    id: "bug_report_format",
    patterns: [
      /\b(how do you write a bug report|bug report template|bug report format|sample bug report|what is in your bug report)\b/i,
      /\b(paano ka gumawa ng bug report|format ng bug report|sample na report ng bug|ano nilalagay mo sa bug report)\b/i,
    ],
    keywords: [
      "bug report",
      "defect report",
      "steps to reproduce",
      "actual result",
      "expected result",
      "severity",
    ],
    category: "qa",
    en: `A great bug report allows developers to reproduce and resolve the issue immediately without back-and-forth questions.

Here is the exact bug report format I use in Jira / GitHub Issues:

---
BUG REPORT TEMPLATE
• Defect ID: BUG-2026-104
• Title: [Checkout] Submitting order with decimal coupon code triggers HTTP 500
• Severity: High (Blocking payment flow)
• Priority: P1 (Immediate fix required)
• Environment: Staging | Chrome v124 (macOS Sonoma & Windows 11) | Viewport 1440x900
• Preconditions:
  - User logged in with items in shopping cart (Total: ₱1,250.00)
  - Active promo code "SUMMER20" valid for 20% discount
• Steps to Reproduce:
  1. Open /cart and proceed to /checkout
  2. Enter coupon code "SUMMER20" in the promotional input field
  3. Click the "Apply Discount" button
  4. Fill in shipping address and click "Confirm Payment"
• Expected Result:
  Discount calculated correctly (₱250.00 off), total updated to ₱1,000.00, and checkout completes.
• Actual Result:
  Page displays unhandled HTTP 500 error banner. Database throws numeric precision overflow error.
• Visual Evidence:
  Attached screenshot_error_500.png and network_trace_payload.har
• Console / Logs:
  TypeError: Cannot parse Decimal value in CheckoutTransactionHandler.php line 84
---`,
    tl: `Ang isang mahusay na bug report ay nagbibigay-daan sa mga developer na agad itong ma-reproduce at maayos nang walang paulit-ulit na pagtatanong.

Ito ang eksaktong format ng bug report na ginagamit ko sa Jira o GitHub Issues:

---
BUG REPORT TEMPLATE
• Defect ID: BUG-2026-104
• Title: [Checkout] Submitting order with decimal coupon code triggers HTTP 500
• Severity: High (Nakaharang sa pagbabayad)
• Priority: P1 (Kailangang maayos agad)
• Environment: Staging | Chrome v124 (macOS at Windows 11) | Viewport 1440x900
• Preconditions:
  - Naka-login ang user na may laman ang cart (Total: ₱1,250.00)
  - May aktibong discount code na "SUMMER20"
• Steps to Reproduce:
  1. Buksan ang /cart at pumunta sa /checkout
  2. I-type ang "SUMMER20" sa promo code box
  3. Pindutin ang "Apply Discount" button
  4. Ilagay ang address at pindutin ang "Confirm Payment"
• Expected Result:
  Mababawasan ng ₱250 ang total (magiging ₱1,000), at matagumpay na matatapos ang bayad.
• Actual Result:
  Lumabas ang HTTP 500 Error banner. Nagka-database numeric overflow error.
• Ebidensya / Attachments:
  screenshot_error_500.png at network_trace_payload.har
• Error Log:
  TypeError: Cannot parse Decimal value in CheckoutTransactionHandler.php line 84
---`,
  },

  // =========================================================================
  // 59. QA TEST CASE TEMPLATE & SPECIFICATION
  // =========================================================================
  {
    id: "test_case_spec_format",
    patterns: [
      /\b(how do you write test cases|test case template|test case format|sample test case|test case specification)\b/i,
      /\b(paano ka sumulat ng test case|format ng test case|sample ng test case|paano gumawa ng test case)\b/i,
    ],
    keywords: [
      "test case",
      "test case template",
      "test specification",
      "preconditions",
      "test steps",
    ],
    category: "qa",
    en: `I write structured test cases covering positive, negative, boundary, and edge-case scenarios.

Here is my standard QA Test Case specification structure:

---
TEST CASE SPECIFICATION
• Test Case ID: TC-AUTH-008
• Module / Feature: User Authentication & Role Authorization
• Test Objective: Verify session expiration redirects unauthorized user to login
• Test Type: Security / Functional Testing
• Preconditions:
  - User account created with role "Staff"
  - JWT Access token lifespan configured to 15 minutes
• Test Steps:
  1. Log in to the application at /login with valid staff credentials
  2. Navigate to /dashboard/inventory
  3. Wait 15 minutes until JWT token expires (or manually invalidate token in devtools)
  4. Click on "Create New Stock Request" button
• Expected Result:
  User is immediately redirected to /login with notification "Session expired. Please sign in again."
  No confidential inventory data is leaked or cached in DOM.
• Actual Result:
  Redirected to /login with toast notification; local token cleared.
• Status: PASS
• Executed By: Kennu Elnar
---`,
    tl: `Sumusulat ako ng maayos na test cases na sumasaklaw sa positive, negative, boundary, at edge-case scenarios.

Ito ang aking karaniwang test case structure:

---
TEST CASE SPECIFICATION
• Test Case ID: TC-AUTH-008
• Module / Feature: User Authentication & Role Authorization
• Test Objective: Tiyaking nai-redirect sa login ang user kapag nag-expire ang session
• Test Type: Security / Functional Testing
• Preconditions:
  - May "Staff" user account
  - Ang token lifespan ay 15 minuto
• Test Steps:
  1. Mag-login sa /login gamit ang staff credentials
  2. Pumunta sa /dashboard/inventory
  3. Maghintay hanggang mag-expire ang token (o alisin ang token sa devtools)
  4. Pindutin ang "Create New Stock Request" button
• Expected Result:
  Direktang ire-redirect ang user sa /login na may mensaheng "Session expired. Please sign in again."
  Walang confidential na data ang maiiwan sa screen.
• Actual Result:
  Nai-redirect sa /login na may notification; nabura ang lumang token.
• Status: PASS
• Executed By: Kennu Elnar
---`,
  },

  // =========================================================================
  // 60. LARAVEL MVC ARCHITECTURE STRUCTURE (MIRAMS BACKEND)
  // =========================================================================
  {
    id: "laravel_mvc_structure",
    patterns: [
      /\b(how do you structure laravel|laravel file structure|laravel mvc setup|laravel architecture)\b/i,
      /\b(paano ang structure mo sa laravel|paano mo inaayos ang laravel|laravel setup mo)\b/i,
    ],
    keywords: [
      "laravel structure",
      "laravel mvc",
      "laravel setup",
      "backend structure",
    ],
    category: "skills",
    en: `In Laravel projects (like MIRAMS), I maintain strict separation of concerns using Request validation classes, Service classes for business operations, and Resource classes for JSON serialization.

Here is the Laravel directory structure I utilize:

laravel-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/       # AssetController, AuthController
│   │   ├── Middleware/        # EnsureRolePermission, Authenticate
│   │   ├── Requests/          # StoreAssetRequest (Validation rules)
│   │   └── Resources/         # AssetResource (API JSON transformer)
│   ├── Models/                # Eloquent models (Asset, User, Department)
│   ├── Policies/              # Authorization rules (AssetPolicy)
│   └── Services/              # AssetAuditService, TicketNotificationService
├── database/
│   ├── migrations/            # Table creation & schema updates
│   ├── seeders/               # Roles, Permissions, Admin accounts
│   └── factories/             # Fake data generators for automated tests
├── routes/
│   ├── api.php                # REST API routes consumed by React
│   └── web.php
├── tests/
│   ├── Feature/               # API endpoint feature tests
│   └── Unit/                  # Business logic unit tests
├── .env.example
└── composer.json`,
    tl: `Sa Laravel projects (tulad ng MIRAMS), pinananatili ko ang separation of concerns gamit ang Form Requests para sa validation, Service classes para sa business logic, at API Resources para sa malinis na JSON formatting.

Ito ang aking ginagamit na Laravel directory structure:

laravel-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/       # AssetController, AuthController
│   │   ├── Middleware/        # EnsureRolePermission, Authenticate
│   │   ├── Requests/          # StoreAssetRequest (Validation rules)
│   │   └── Resources/         # AssetResource (API JSON transformer)
│   ├── Models/                # Eloquent models (Asset, User, Department)
│   ├── Policies/              # Authorization rules (AssetPolicy)
│   └── Services/              # AssetAuditService, TicketNotificationService
├── database/
│   ├── migrations/            # Table creation at schema updates
│   ├── seeders/               # Roles, Permissions, Admin accounts
│   └── factories/             # Fake data generators para sa tests
├── routes/
│   ├── api.php                # REST API routes para sa React frontend
│   └── web.php
├── tests/
│   ├── Feature/               # API endpoint feature tests
│   └── Unit/                  # Business logic unit tests
├── .env.example
└── composer.json`,
  },

  // =========================================================================
  // 61. POSTMAN API TESTING SETUP & TEST SCRIPTS
  // =========================================================================
  {
    id: "postman_api_testing_setup",
    patterns: [
      /\b(how do you write postman tests|sample postman script|postman test scripts|how do you test apis in postman)\b/i,
      /\b(paano ka mag-?test sa postman|postman scripts mo|sample postman test|paano mo sinusuri ang api sa postman)\b/i,
    ],
    keywords: [
      "postman",
      "postman scripts",
      "api tests",
      "status code test",
      "environment variables",
    ],
    category: "qa",
    en: `In Postman, I organize requests into collections by domain, configure dynamic environment variables, and write JavaScript test assertions for status codes, schema validity, and response speed.

Here is a sample Postman test script I attach to API endpoints:

\`\`\`javascript
// 1. Verify HTTP Status Code
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Validate Response Time is acceptable (< 300ms)
pm.test("Response time is under 300ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(300);
});

// 3. Verify JSON Schema & save Auth Token dynamically
pm.test("Response contains valid auth token and user profile", function () {
    const data = pm.response.json();
    pm.expect(data).to.have.property("token");
    pm.expect(data.user).to.have.property("email");
    pm.expect(data.user.role).to.eql("admin");

    // Persist token for subsequent authorized requests
    pm.environment.set("auth_token", data.token);
});
\`\`\``,
    tl: `Sa Postman, inaayos ko ang mga requests sa collections, nagse-set up ng environment variables, at sumusulat ng JavaScript assertions para suriin ang status code, schema, at response time.

Ito ang sample Postman test script na inilalagay ko sa mga endpoints:

\`\`\`javascript
// 1. Suriin ang HTTP Status Code
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});

// 2. Siguruhing mabilis ang response (< 300ms)
pm.test("Response time is under 300ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(300);
});

// 3. I-validate ang data at i-save ang token
pm.test("Response contains valid auth token and user profile", function () {
    const data = pm.response.json();
    pm.expect(data).to.have.property("token");
    pm.expect(data.user).to.have.property("email");
    pm.expect(data.user.role).to.eql("admin");

    // I-save ang token para magamit sa susunod na requests
    pm.environment.set("auth_token", data.token);
});
\`\`\``,
  },

  // =========================================================================
  // 62. DATABASE SCHEMA DESIGN (SQL DDL EXAMPLE)
  // =========================================================================
  {
    id: "database_schema_design_example",
    patterns: [
      /\b(how do you design a database|sample database schema|sql schema example|how do you model tables|database design)\b/i,
      /\b(paano ka mag-?design ng database|sample ng sql schema|paano mo ginagawa ang mga tables|database modeling)\b/i,
    ],
    keywords: [
      "database design",
      "sql schema",
      "ddl",
      "foreign keys",
      "tables",
      "normalization",
    ],
    category: "skills",
    en: `When designing relational databases, I follow 3rd Normal Form (3NF) to eliminate data redundancy, index foreign keys for query speed, and enforce cascade constraints for integrity.

Here is a sample SQL DDL schema for a user asset management system:

\`\`\`sql
-- 1. Users Table
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'technician', 'employee') DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Assets Table with Foreign Key
CREATE TABLE assets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    asset_tag VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    assigned_user_id BIGINT UNSIGNED NULL,
    status ENUM('available', 'in_use', 'maintenance', 'retired') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_user FOREIGN KEY (assigned_user_id)
        REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_asset_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
\`\`\``,
    tl: `Sa pagdidisenyo ng relational databases, sumusunod ako sa 3rd Normal Form (3NF) para iwas redundancy, naglalagay ng indexes sa foreign keys para mabilis ang query, at may strict constraints.

Ito ang sample SQL DDL schema para sa asset management:

\`\`\`sql
-- 1. Users Table
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'technician', 'employee') DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Assets Table na may Foreign Key
CREATE TABLE assets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    asset_tag VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    assigned_user_id BIGINT UNSIGNED NULL,
    status ENUM('available', 'in_use', 'maintenance', 'retired') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_user FOREIGN KEY (assigned_user_id)
        REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_asset_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
\`\`\``,
  },

  // =========================================================================
  // 63. SAMPLE PLAYWRIGHT TEST SCRIPT CODE
  // =========================================================================
  {
    id: "sample_playwright_code",
    patterns: [
      /\b(sample playwright code|show me playwright code|playwright test example|how do you write a playwright test)\b/i,
      /\b(sample ng playwright code|patingin ng playwright script|halimbawa ng test sa playwright)\b/i,
    ],
    keywords: [
      "playwright code",
      "playwright script",
      "test example",
      "automation code",
    ],
    category: "qa",
    en: `Here is a clean, practical Playwright test in TypeScript verifying a form submission and UI feedback:

\`\`\`typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Security Suite', () => {
  test('rejects login with invalid password and displays alert', async ({ page }) => {
    // 1. Navigate to target page
    await page.goto('/login');

    // 2. Fill credentials
    await page.fill('input[name="email"]', 'kennu@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123');

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Assert error message is visible and URL has not changed
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Invalid email or password');
    await expect(page).toHaveURL('/login');
  });
});
\`\`\``,
    tl: `Ito ang malinis at praktikal na Playwright test sa TypeScript na sumusuri sa login form at UI validation:

\`\`\`typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Security Suite', () => {
  test('hindi pinapapasok ang maling password at nagpapakita ng alert', async ({ page }) => {
    // 1. Pumunta sa login page
    await page.goto('/login');

    // 2. Ilagay ang credentials
    await page.fill('input[name="email"]', 'kennu@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123');

    // 3. Pindutin ang submit
    await page.click('button[type="submit"]');

    // 4. Tiyaking lumabas ang error at hindi umalis sa /login
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Invalid email or password');
    await expect(page).toHaveURL('/login');
  });
});
\`\`\``,
  },

  // =========================================================================
  // 64. SAMPLE REACT CUSTOM HOOK CODE (useDebounce)
  // =========================================================================
  {
    id: "sample_react_custom_hook",
    patterns: [
      /\b(sample react hook|show me a custom hook|custom hook example|how do you write a custom hook)\b/i,
      /\b(sample ng custom hook|halimbawa ng react hook|paano gumawa ng custom hook sa react)\b/i,
    ],
    keywords: ["custom hook", "react hook", "usedebounce", "typescript hook"],
    category: "skills",
    en: `Here is a reusable TypeScript custom hook \`useDebounce\` that optimizes search input to prevent firing redundant API requests on every keystroke:

\`\`\`typescript
import { useState, useEffect } from 'react';

/**
 * Delays updating a value until user stops typing for 'delay' ms.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
\`\`\``,
    tl: `Ito ang isang reusable custom hook sa TypeScript (\`useDebounce\`) na nagpapatagal sa search query para maiwasan ang sobrang daming API requests habang nagta-type ang user:

\`\`\`typescript
import { useState, useEffect } from 'react';

/**
 * Inaantala ang value update hanggang tumigil mag-type ang user ng 'delay' ms.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
\`\`\``,
  },

  // =========================================================================
  // 65. CI/CD GITHUB ACTIONS WORKFLOW SETUP
  // =========================================================================
  {
    id: "cicd_github_actions_workflow",
    patterns: [
      /\b(how do you setup ci cd|github actions workflow|ci cd pipeline|continuous integration)\b/i,
      /\b(paano mag-?setup ng ci cd|pipeline sa github actions|paano i-automate ang build at test)\b/i,
    ],
    keywords: [
      "ci cd",
      "github actions",
      "pipeline",
      "continuous integration",
      "yaml",
    ],
    category: "process",
    en: `For continuous integration, I configure GitHub Actions to run linters, type checks, and automated tests automatically on every Pull Request before code can be merged into \`main\`.

Here is my standard CI workflow (\`.github/workflows/test.yml\`):

\`\`\`yaml
name: CI Test & Build Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run ESLint & TypeCheck
        run: |
          npm run lint
          npx tsc --noEmit

      - name: Run Playwright Tests
        run: npx playwright test

      - name: Build Production Assets
        run: npm run build
\`\`\``,
    tl: `Para sa CI/CD, nagse-set up ako ng GitHub Actions na awtomatikong nagpapatakbo ng linter, typecheck, at automated tests sa bawat Pull Request bago ito ma-merge sa \`main\`.

Ito ang aking CI workflow file (\`.github/workflows/test.yml\`):

\`\`\`yaml
name: CI Test & Build Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run ESLint & TypeCheck
        run: |
          npm run lint
          npx tsc --noEmit

      - name: Run Playwright Tests
        run: npx playwright test

      - name: Build Production Assets
        run: npm run build
\`\`\``,
  },

  // =========================================================================
  // 66. GIT WORKFLOW & BRANCHING STRATEGY
  // =========================================================================
  {
    id: "git_branching_workflow",
    patterns: [
      /\b(what is your git workflow|git branching strategy|how do you use git|git flow commands)\b/i,
      /\b(paano ang git workflow mo|paano ka mag-?branch sa git|git commands na gamit mo)\b/i,
    ],
    keywords: [
      "git workflow",
      "branching",
      "git flow",
      "pull request",
      "conventional commits",
    ],
    category: "process",
    en: `I follow a Feature Branch workflow with semantic commit messages (Conventional Commits: feat, fix, chore, docs, test):

\`\`\`bash
# 1. Update local develop branch
git checkout develop && git pull origin develop

# 2. Branch out with descriptive feature name
git checkout -b feat/add-checkout-coupon-validator

# 3. Stage and commit with clear intent
git add .
git commit -m "feat(checkout): add promo code validation and error handling"

# 4. Push and open Pull Request for review
git push -u origin feat/add-checkout-coupon-validator
\`\`\``,
    tl: `Gumagamit ako ng Feature Branch workflow kasama ang Conventional Commits para malinis ang git history:

\`\`\`bash
# 1. I-update ang local develop branch
git checkout develop && git pull origin develop

# 2. Gumawa ng bagong branch para sa feature
git checkout -b feat/add-checkout-coupon-validator

# 3. I-commit nang may malinaw na mensahe
git add .
git commit -m "feat(checkout): add promo code validation and error handling"

# 4. I-push at gumawa ng Pull Request
git push -u origin feat/add-checkout-coupon-validator
\`\`\``,
  },

  // =========================================================================
  // 67. SMOKE TESTING VS SANITY TESTING VS REGRESSION TESTING
  // =========================================================================
  {
    id: "smoke_vs_sanity_vs_regression",
    patterns: [
      /\b(smoke vs sanity|smoke vs regression|difference between smoke sanity and regression|explain smoke and regression)\b/i,
      /\b(pagkakaiba ng smoke at regression|ano ang smoke testing|ano ang sanity testing|ano ang regression testing)\b/i,
    ],
    keywords: [
      "smoke testing",
      "sanity testing",
      "regression testing",
      "differences",
    ],
    category: "qa",
    en: `Here is the clear distinction between the three:
1. Smoke Testing ("Build Verification"): Shallow & wide test on a fresh build to verify critical functionalities (e.g. app boots, can login, database connects). If it fails, the build is rejected immediately.
2. Sanity Testing: Narrow & deep test performed after a bug fix to verify that the specific defect is resolved and directly related flows work.
3. Regression Testing: Comprehensive suite verifying that recent code updates or fixes did NOT break existing, previously working features.`,
    tl: `Ito ang malinaw na pagkakaiba ng tatlo:
1. Smoke Testing ("Build Verification"): Mabilisang pagsusuri sa bagong build para tiyaking buhay ang pinaka-kritikal na bahagi (naglo-load ang site, gumagana ang login). Kapag pumalya, ire-reject agad ang build.
2. Sanity Testing: Nakatutok na pagsusuri pagkatapos maayos ang isang partikular na bug para patunayang gumagana na ito.
3. Regression Testing: Malawakang pagsusuri para siguruhing ang mga bagong code o pagbabago ay HINDI nakasira sa mga dati nang gumaganang bahagi ng website.`,
  },

  // =========================================================================
  // 68. BOUNDARY VALUE ANALYSIS (BVA) EXPLAINED WITH NUMBERS
  // =========================================================================
  {
    id: "boundary_value_analysis_example",
    patterns: [
      /\b(boundary value analysis|what is bva|explain bva with example|boundary testing)\b/i,
      /\b(ano ang boundary value analysis|paano ginagawa ang bva|sample ng boundary testing)\b/i,
    ],
    keywords: ["boundary value analysis", "bva", "boundary testing", "min max"],
    category: "qa",
    en: `Boundary Value Analysis (BVA) tests the edge boundaries where defects most commonly occur (off-by-one errors).

Example: If an age input accepts values from 18 to 65:
• Minimum boundary: 17 (Just below - Invalid), 18 (Exact boundary - Valid), 19 (Just above - Valid)
• Maximum boundary: 64 (Just below - Valid), 65 (Exact boundary - Valid), 66 (Just above - Invalid)
• Extreme values: 0, -1, 999 (Invalid edge cases)

Testing these exact values exposes arithmetic and condition check bugs (> vs >=) quickly.`,
    tl: `Ang Boundary Value Analysis (BVA) ay sumusubok sa eksaktong hangganan ng mga inputs kung saan pinakamadalas mangyari ang mga bug (off-by-one errors).

Halimbawa: Kung ang age field ay tumatanggap ng 18 hanggang 65:
• Minimum boundary: 17 (Invalid), 18 (Valid), 19 (Valid)
• Maximum boundary: 64 (Valid), 65 (Valid), 66 (Invalid)
• Extreme values: 0, -1, 999 (Invalid edge cases)

Sa ganitong paraan, madaling mahuhuli ang mga maling kondisyon sa code (> vs >=).`,
  },

  // =========================================================================
  // 69. EQUIVALENCE CLASS PARTITIONING (ECP) EXPLAINED
  // =========================================================================
  {
    id: "equivalence_partitioning_example",
    patterns: [
      /\b(equivalence partitioning|what is ecp|equivalence class|explain equivalence partitioning)\b/i,
      /\b(ano ang equivalence partitioning|paano ang ecp|sample ng equivalence class)\b/i,
    ],
    keywords: [
      "equivalence partitioning",
      "ecp",
      "valid partition",
      "invalid partition",
    ],
    category: "qa",
    en: `Equivalence Class Partitioning (ECP) divides input data into equivalent groups where the software is expected to behave identically, allowing you to test one representative sample per partition instead of hundreds of inputs.

Example: A discount code accepting 1 to 50 items:
1. Valid Partition: Numbers from 1 to 50 (e.g. test 25).
2. Invalid Partition (Too low): Numbers <= 0 (e.g. test 0, -5).
3. Invalid Partition (Too high): Numbers > 50 (e.g. test 55).
4. Invalid Partition (Non-numeric): Characters, symbols (e.g. test "abc", "@#$").`,
    tl: `Ang Equivalence Class Partitioning (ECP) ay naghahati ng input data sa magkakaparehong grupo para hindi mo kailangang subukan ang bawat numero—isang kinatawan lang sa bawat grupo ang kailangan subukan.

Halimbawa: Discount para sa 1 hanggang 50 items:
1. Valid Partition: 1 hanggang 50 (subukan ang 25).
2. Invalid Partition (Masyadong mababa): <= 0 (subukan ang 0 o -5).
3. Invalid Partition (Masyadong mataas): > 50 (subukan ang 55).
4. Invalid Partition (Hindi numero): Letra o simbolo (subukan ang "abc", "@#$").`,
  },

  // =========================================================================
  // 70. BLACK BOX VS WHITE BOX TESTING
  // =========================================================================
  {
    id: "black_box_vs_white_box",
    patterns: [
      /\b(black box vs white box|difference between black box and white box|white box testing|black box testing)\b/i,
      /\b(pagkakaiba ng black box at white box|ano ang black box testing|ano ang white box testing)\b/i,
    ],
    keywords: ["black box", "white box", "internal code", "functional"],
    category: "qa",
    en: `The distinction:
• Black-Box Testing: Testing software from an end-user perspective without examining the underlying source code (e.g. UI testing, exploratory testing, boundary testing).
• White-Box Testing: Testing with full visibility into the source code, logic paths, and internal structure (e.g. unit testing, code coverage analysis, mutation testing).

Because I code in TypeScript and PHP, I can perform black-box tests as a user and white-box inspections directly in the codebase.`,
    tl: `Ang pagkakaiba:
• Black-Box Testing: Pagsusuri mula sa pananaw ng gumagamit nang hindi tinitingnan ang source code (hal. UI testing, exploratory testing).
• White-Box Testing: Pagsusuri na may direktang access at kaalaman sa loob ng source code at logic paths (hal. unit testing, code coverage).

Dahil marunong akong mag-code sa TypeScript at PHP, kaya kong mag-black-box testing bilang user at mag-white-box analysis sa mismong code.`,
  },

  // =========================================================================
  // 71. HOW DO YOU TEST AN E-COMMERCE CHECKOUT FLOW
  // =========================================================================
  {
    id: "how_to_test_ecommerce_checkout",
    patterns: [
      /\b(how do you test.*(checkout|e-?commerce)|how to test.*(checkout|e-?commerce)|testing checkout flow|ecommerce test cases|how do you test an e-?commerce)\b/i,
      /\b(paano mo tine-?test ang.*(checkout|online shop|tindahan)|paano mag-?test ng online shop|test cases sa cart at checkout)\b/i,
    ],
    keywords: [
      "checkout testing",
      "ecommerce test",
      "cart testing",
      "payment testing",
    ],
    category: "qa",
    en: `When testing an e-commerce checkout flow, I verify:
1. Cart Calculations: Subtotal, shipping fees, tax rates, and voucher discounts.
2. Inventory Concurrency: Attempting to purchase the last item simultaneously in two tabs to ensure no negative stock or race condition.
3. Form Validation: Required address fields, phone number formatting, zip code boundaries.
4. Payment Gateways: Success, cancelled transactions, card declines, timeout edge cases.
5. Idempotency: Double-clicking "Place Order" must never create duplicate charges or double orders.`,
    tl: `Kapag sinusuri ang e-commerce checkout flow, tinitiyak ko ang mga sumusunod:
1. Kwenta sa Cart: Subtotal, shipping fee, buwis, at promo vouchers.
2. Stock Concurrency: Pagbili sa huling piraso ng item sa magkahiwalay na tabs para masigurong hindi magnenegatibo ang imbentaryo.
3. Form Validation: Kumpletong delivery address, format ng cellphone number, at zip code.
4. Payment Gateways: Matagumpay na bayad, kinanselang transaksyon, at declined cards.
5. Idempotency: Ang dobleng pagpindot sa "Place Order" ay hindi dapat magdulot ng dobleng kaltas o dobleng order.`,
  },

  // =========================================================================
  // 72. HOW DO YOU TEST LOGIN & REGISTRATION FORMS
  // =========================================================================
  {
    id: "how_to_test_login_forms",
    patterns: [
      /\b(how do you test login|testing login form|how to test authentication|login test cases)\b/i,
      /\b(paano mo tine-?test ang login|test cases sa login at register|paano i-test ang sign in)\b/i,
    ],
    keywords: [
      "login testing",
      "authentication test",
      "login test cases",
      "security test",
    ],
    category: "qa",
    en: `My authentication test checklist includes:
1. Positive Paths: Valid username & password redirect correctly with active session cookies/JWT.
2. Negative Paths: Empty fields, whitespace-only, wrong passwords, non-existent accounts.
3. Security Checks: SQL injection payloads (' OR 1=1 --), XSS scripts in input fields, password masking, paste disabling check.
4. Rate Limiting / Brute Force: Verifying account lockout or captcha after 5 consecutive failed attempts.
5. Session Integrity: Back-button behavior after logout must not expose cached user data.`,
    tl: `Ang aking checklist sa pagsusuri ng login at registration:
1. Positive Paths: Tamang credentials ay maayos na pumapasok sa dashboard.
2. Negative Paths: Blangkong fields, maling password, hindi umiiral na email.
3. Security Checks: SQL injection payloads (' OR 1=1 --), XSS script attempts, nakatagong password bullets.
4. Brute Force Protection: Lockout o captcha pagkatapos ng 5 sunod-sunod na maling subok.
5. Session Behavior: Pagpindot sa browser back button pagkatapos mag-logout ay hindi dapat magpakita ng dating data.`,
  },

  // =========================================================================
  // 73. HTTP STATUS CODES EXPLANATION IN QA
  // =========================================================================
  {
    id: "http_status_codes_explanation",
    patterns: [
      /\b(http status codes|explain 401 vs 403|what is 422|http status in qa|status codes)\b/i,
      /\b(ano ang http status codes|pagkakaiba ng 401 at 403|ano ang 422 status code)\b/i,
    ],
    keywords: ["http status codes", "401", "403", "422", "500", "200"],
    category: "qa",
    en: `In QA API testing, standard HTTP status codes verify correct server behavior:
• 200 OK: Successful request with response body.
• 201 Created: New resource successfully created (e.g. POST /assets).
• 204 No Content: Successful operation with no return payload (e.g. DELETE).
• 400 Bad Request: Malformed JSON or syntax error.
• 401 Unauthorized: Missing or invalid authentication token (not logged in).
• 403 Forbidden: Authenticated user lacks permission for this role.
• 404 Not Found: Target endpoint or entity does not exist.
• 422 Unprocessable Entity: Validation error (e.g. invalid email format).
• 500 Internal Server Error: Unhandled code exception or crash on backend.`,
    tl: `Sa QA API testing, sinusuri ang mga sumusunod na HTTP status codes:
• 200 OK: Matagumpay na request na may response body.
• 201 Created: Matagumpay na nagawa ang bagong resource (hal. POST /assets).
• 204 No Content: Matagumpay ang aksyon nang walang ibinabalik na body (hal. DELETE).
• 400 Bad Request: Maling format ng JSON o syntax error.
• 401 Unauthorized: Walang token o expired ang login session.
• 403 Forbidden: Naka-login ngunit walang karapatan sa role na iyon.
• 404 Not Found: Hindi umiiral ang URL o hinahanap na record.
• 422 Unprocessable Entity: Bumagsak sa form validation (hal. maling email format).
• 500 Internal Server Error: May nag-crash o unhandled exception sa backend server.`,
  },

  // =========================================================================
  // 74. QA METRICS AND KPIS
  // =========================================================================
  {
    id: "qa_metrics_and_kpis",
    patterns: [
      /\b(what qa metrics do you track|qa kpis|defect density|bug leakage|test metrics)\b/i,
      /\b(anong qa metrics ang alam mo|paano sinusukat ang qa quality|defect leakage)\b/i,
    ],
    keywords: [
      "qa metrics",
      "defect density",
      "bug leakage",
      "kpis",
      "test execution",
    ],
    category: "qa",
    en: `I track key QA metrics to gauge release quality:
1. Defect Density: Number of defects confirmed per 1,000 lines of code or per module.
2. Defect Leakage: Bugs discovered by end-users in production versus those caught during QA cycles.
3. Test Execution Rate: Percentage of planned test cases executed per sprint.
4. Defect Rejection Rate: Percentage of reported bugs flagged as invalid or duplicate (aiming < 5%).
5. Mean Time to Detect (MTTD) & Resolve (MTTR): Speed at which bugs are caught and patched.`,
    tl: `Sumusubaybay ako sa mahahalagang QA metrics upang masukat ang kalidad ng software:
1. Defect Density: Dami ng bugs kada 1,000 linya ng code o bawat module.
2. Defect Leakage: Bugs na nakalusot sa production kumpara sa mga nahuli sa testing phase.
3. Test Execution Rate: Bahagdan ng natapos na test cases sa bawat sprint.
4. Defect Rejection Rate: Bahagdan ng iniulat na bugs na minarkahang duplicate o invalid (target ay < 5%).
5. Mean Time to Detect & Resolve: Bilis ng pagtuklas at pag-aayos ng mga depekto.`,
  },

  // =========================================================================
  // 75. HOW DO YOU HANDLE A REJECTED BUG (DEV SAYS "NOT A BUG")
  // =========================================================================
  {
    id: "handling_rejected_bugs",
    patterns: [
      /\b(developer says not a bug|developer rejects bug|disagreement with developer|what if dev refuses to fix)\b/i,
      /\b(paano kapag sinabi ng dev na hindi bug|kapag nag-?disagree ang developer sa bug|paano makipagtalo sa dev)\b/i,
    ],
    keywords: [
      "rejected bug",
      "not a bug",
      "disagreement",
      "developer pushback",
    ],
    category: "qa",
    en: `When a developer marks a bug as "Not a Bug" or "Working as Intended":
1. I stay objective and professional, avoiding emotional arguments.
2. I re-test and provide a screen recording and browser logs showing the exact user impact.
3. I compare the behavior directly with the approved Product Requirement Document (PRD) or Figma spec.
4. If the spec was ambiguous, I schedule a quick 5-minute sync with the Product Owner / Tech Lead to confirm the intended business logic.`,
    tl: `Kapag sinabi ng developer na "Hindi ito bug" o "Ganyan talaga ang behavior":
1. Nanatili akong kalmado at propesyonal nang walang emosyon.
2. Inilalatag ko ang screen recording, network logs, at patunay kung paano naaapektuhan ang user.
3. Ikinukumpara ko ito sa opisyal na Product Requirements Document (PRD) o Figma design.
4. Kung malabo ang naunang dokumento, nakikipag-ugnayan ako sa Product Owner o Tech Lead upang linawin ang tamang business requirement.`,
  },

  // =========================================================================
  // 76. PRODUCTION BUG / HOTFIX PROTOCOL
  // =========================================================================
  {
    id: "production_bug_hotfix_flow",
    patterns: [
      /\b(how do you handle production bugs|critical bug in production|hotfix process|production incident)\b/i,
      /\b(paano kapag may bug sa production|emergency hotfix|kapag nasira ang live website)\b/i,
    ],
    keywords: ["production bug", "hotfix", "incident", "live bug"],
    category: "qa",
    en: `When a critical issue reaches production:
1. Triage & Impact Assessment: Determine how many users are affected and whether to roll back or patch forward.
2. Reproduce in Staging: Replicate the bug in a staging environment with matching data to isolate the root cause.
3. Targeted Hotfix Verification: Test the developer's hotfix branch exclusively for the defect plus immediate regression paths.
4. Post-Deployment Smoke Test: Run live smoke tests immediately after production deployment.
5. Post-Mortem: Document why the bug bypassed QA and write automated test cases to prevent recurrence.`,
    tl: `Kapag may kritikal na bug sa production:
1. Pagsusuri ng Epekto: Tiyakin kung gaano karaming users ang apektado at kung kailangang mag-rollback o mag-hotfix.
2. Pag-reproduce sa Staging: Subukan ito sa staging server upang matiyak ang ugat ng problema.
3. Hotfix Testing: Suriin ang hotfix branch at magsagawa ng mabilisang regression testing sa apektadong bahagi.
4. Live Smoke Testing: Mag-test agad sa live site pagkatapos ng deployment.
5. Post-Mortem: Alamin kung bakit nakalusot ang bug at gumawa ng automated test para hindi na ito maulit.`,
  },

  // =========================================================================
  // 77. HARDWARE SPECS & WORKSTATION SETUP
  // =========================================================================
  {
    id: "workstation_specs",
    patterns: [
      /\b(what are your pc specs|computer specs|what machine do you use|workstation setup|hardware specs)\b/i,
      /\b(anong specs ng computer mo|pc specs mo|anong laptop gamit mo|setup ng computer mo)\b/i,
    ],
    keywords: [
      "pc specs",
      "hardware",
      "computer",
      "ram",
      "processor",
      "workstation",
    ],
    category: "about",
    en: `My development and QA testing setup consists of:
• Processor: High-performance multi-core processor capable of virtualization & Docker
• RAM: 16 GB high-speed RAM for running concurrent browser instances & dev servers
• Storage: 512 GB NVMe SSD for fast compilation and test execution
• Display: Dual monitor configuration for simultaneous code editing and DevTools inspection
• Peripherals: Reliable mechanical keyboard, high-DPI mouse, and HD webcam for team standups.`,
    tl: `Ang aking development at testing workstation setup:
• Processor: Multi-core processor na kayang magpatakbo ng Docker at virtual environments
• RAM: 16 GB high-speed RAM para sa sabay-sabay na browser testing at servers
• Storage: 512 GB NVMe SSD para sa mabilisang compilation at test execution
• Display: Dual monitors para sabay ang code editor at browser devtools
• Peripherals: Maaasahang mechanical keyboard, mouse, at webcam para sa standups.`,
  },

  // =========================================================================
  // 78. INTERNET SPEED & POWER BACKUP
  // =========================================================================
  {
    id: "internet_and_power_backup",
    patterns: [
      /\b(what is your internet speed|do you have backup internet|power outage backup|power interruption)\b/i,
      /\b(mabilis ba internet mo|anong internet connection mo|paano kapag nawalan ng kuryente|backup power)\b/i,
    ],
    keywords: [
      "internet speed",
      "fiber",
      "backup power",
      "brownout",
      "wfh setup",
    ],
    category: "about",
    en: `I have a resilient remote work infrastructure:
• Primary Internet: High-speed Fiber connection with low latency (50-100+ Mbps).
• Secondary Internet: Mobile 5G hotspot ready for instant failover during ISP disruptions.
• Power Backup: Laptop battery backup and powerbank units ensuring uninterrupted communication during local outages.`,
    tl: `May maaasahan akong remote work setup:
• Pangunahing Internet: High-speed Fiber connection na may mababang latency (50-100+ Mbps).
• Backup Internet: Mobile 5G hotspot para sa agarang backup sakaling magka-aberya ang linya.
• Power Backup: May sapat na battery backup at powerbank para sa tuluy-tuloy na trabaho at komunikasyon.`,
  },

  // =========================================================================
  // 79. WORKING HOURS & TIMEZONE FLEXIBILITY
  // =========================================================================
  {
    id: "working_hours_timezones",
    patterns: [
      /\b(what time zone are you in|working hours|can you work us hours|timezone flexibility|night shift)\b/i,
      /\b(anong oras ka nagtatrabaho|pwede ka ba panggabi|timezone mo|kaya mo ba us time|oras ng trabaho)\b/i,
    ],
    keywords: [
      "timezone",
      "working hours",
      "pht",
      "est",
      "pst",
      "night shift",
      "flexible",
    ],
    category: "about",
    en: `My base timezone is Philippine Time (PHT / UTC+8). However, I am flexible and comfortable working in overlapping shifts with international teams, including US EST/PST, European CET, or Australian AEST.`,
    tl: `Ang aking base timezone ay Philippine Time (PHT / UTC+8). Gayunpaman, flexible ako at bukas sa pakikipagtrabaho sa international schedules tulad ng US EST/PST, European CET, o Australian AEST.`,
  },

  // =========================================================================
  // 80. NOTICE PERIOD & IMMEDIATE AVAILABILITY
  // =========================================================================
  {
    id: "notice_period_start_date",
    patterns: [
      /\b(when can you start|what is your notice period|immediate start|can you start immediately|start date)\b/i,
      /\b(kailan ka pwede magsimula|pwede ka ba mag-umpisa agad|may notice period ka ba|kailan ka available)\b/i,
    ],
    keywords: [
      "start date",
      "notice period",
      "immediate",
      "available now",
      "kailan pwede magsimula",
    ],
    category: "about",
    en: `I have no ongoing employer notice period and am available to start immediately for full-time, part-time, or contract opportunities.`,
    tl: `Wala akong notice period at handa akong magsimula agad para sa full-time, part-time, o contractual na posisyon.`,
  },

  // =========================================================================
  // 81. FIGMA TO PIXEL-PERFECT CODE
  // =========================================================================
  {
    id: "figma_to_code_handoff",
    patterns: [
      /\b(can you convert figma to code|figma to react|pixel perfect|figma design implementation)\b/i,
      /\b(kaya mo ba mag-?code galing sa figma|figma to html|pixel perfect ka ba gumawa)\b/i,
    ],
    keywords: ["figma", "pixel perfect", "figma to code", "figma to react"],
    category: "skills",
    en: `Yes! I regularly inspect Figma design files—extracting typography tokens, spacing values, SVGs, and responsive auto-layouts—and translate them into pixel-perfect, accessible React and Tailwind CSS components.`,
    tl: `Oo! Sanay akong magbasa ng Figma designs—kinukuha ang typography, spacing, kulay, at responsive auto-layout—at ginagawang pixel-perfect na React at Tailwind CSS components.`,
  },

  // =========================================================================
  // 82. HOW DO YOU LEARN NEW TECHNOLOGIES QUICKLY
  // =========================================================================
  {
    id: "learning_new_technologies",
    patterns: [
      /\b(how do you learn new (technologies|frameworks|tools)|fast learner|learning curve)\b/i,
      /\b(paano ka nag-?aaral ng bagong technology|mabilis ka ba matuto|paano ka mag-aral ng bagong framework)\b/i,
      /\b(learning process|paano ka matuto ng bagong tech|tech stack adaptation)\b/i,
    ],
    keywords: [
      "ʜᴏᴡ ᴅᴏ ʏᴏᴜ ʟᴇᴀʀɴ ɴᴇᴡ ᴛᴇᴄʜɴᴏʟᴏɢɪᴇꜱ ᴀɴᴅ ᴛᴏᴏʟꜱ?",
      "fast learner",
      "matuto",
      "ᴘᴀᴀɴᴏ ᴋᴀ ᴍᴀᴛᴜᴛᴏ ɴɢ ʙᴀɢᴏɴɢ ᴛᴇᴄʜɴᴏʟᴏɢɪᴇꜱ ᴀᴛ ᴛᴏᴏʟꜱ?",
      "adaptation",
      "documentation",
    ],
    category: "about",
    en: "Adapting to new technologies quickly is essential in modern software development. Here is my structured 4-step approach to mastering a new stack or framework:\n\n1. 𝑫𝒆𝒆𝒑 𝑫𝒊𝒗𝒆 𝒊𝒏𝒕𝒐 𝑶𝒇𝒇𝒊𝒄𝒊𝒂𝒍 𝑫𝒐𝒄𝒖𝒎𝒆𝒏𝒕𝒂𝒕𝒊𝒐𝒏 – I start by understanding core principles, component architecture, and data flows directly from official guides and community best practices rather than relying on quick tutorials.\n2. 𝑳𝒆𝒗𝒆𝒓𝒂𝒈𝒆 𝑨𝑰-𝑨𝒔𝒔𝒊𝒔𝒕𝒆𝒅 𝑾𝒐𝒓𝒌𝒇𝒍𝒐𝒘𝒔 – I utilize modern developer tools (like VS Code with AI coding assistants and GitHub) to accelerate syntax discovery, generate boilerplate structures, and clarify complex concepts on the fly.\n3. 𝑩𝒖𝒊𝒍𝒅 𝒂 𝑭𝒖𝒏𝒄𝒕𝒊𝒐𝒏𝒂𝒍 𝑷𝒓𝒐𝒐𝒇-𝒐𝒇-𝑪𝒐𝒏𝒄𝒆𝒑𝒕 – Instead of passive reading, I immediately build a real-world prototype or feature module. This allows me to test state management, API integrations, and edge cases in a practical environment.\n4. 𝑪𝒐𝒏𝒅𝒖𝒄𝒕 𝑸𝒖𝒂𝒍𝒊𝒕𝒚 & 𝑷𝒆𝒓𝒇𝒐𝒓𝒎𝒂𝒏𝒄𝒆 𝑨𝒖𝒅𝒊𝒕𝒔 – Learning doesn't end when code runs. I verify build performance, responsiveness, and code reliability to ensure the new tech is implemented according to production standards.",
    tl: "Ang mabilis na pag-adjust sa mga bagong teknolohiya ay mahalaga sa software development. Eto ang aking maayos na 4-step process sa pagkatuto ng bagong framework o tools:\n\n1. 𝑴𝒂𝒈𝒃𝒂𝒔𝒂 𝒔𝒂 𝑶𝒑𝒊𝒔𝒚𝒂𝒍 𝒏𝒂 𝑫𝒐𝒄𝒖𝒎𝒆𝒏𝒕𝒂𝒕𝒊𝒐𝒏 – Nagsisimula ako sa pag-unawa sa core architecture, data flow, at best practices direkta sa opisyal na dokumentasyon kaysa umasa sa mabilisang tutorial lang.\n2. 𝑷𝒂𝒈𝒈𝒂𝒎𝒊𝒕 𝒏𝒈 𝑴𝒐𝒅𝒆𝒓𝒏 𝑨𝑰-𝑨𝒔𝒔𝒊𝒔𝒕𝒆𝒅 𝑻𝒐𝒐𝒍𝒔 – Gumagamit ako ng mga modernong developer tools (tulad ng VS Code na may AI coding assistants at GitHub) para mas mabilis makuha ang syntax, gawaan ng maayos na structure, at maunawaan ang mga bagong konsepto.\n3. 𝑷𝒂𝒈𝒃𝒖𝒐 𝒏𝒈 𝑨𝒌𝒕𝒘𝒂𝒍 𝒏𝒂 𝑷𝒓𝒐𝒋𝒆𝒄𝒕 𝑬𝒏𝒈𝒊𝒏𝒆 – Sa halip na magbasa lang, gumagawa agad ako ng totoong prototype o interactive feature. Dito ko nasusubukan ang state management, API integration, at totoong gawaing pang-production.\n4. 𝑷𝒂𝒈𝒔𝒖𝒓𝒊 𝒔𝒂  any 𝑲𝒂𝒍𝒊𝒅𝒂𝒅 𝒂𝒕 𝑷𝒆𝒓𝒇𝒐𝒓𝒎𝒂𝒏𝒄𝒆 – Hindi natatapos ang pagkatuto sa pagpapagana lang ng code. Sinusuri ko ang responsiveness, bilis, at reliability nito para masigurong nakakasunod ito sa tamang pamantayan ng pagbuo ng software.",
  },

  // =========================================================================
  // 83. FIVE-YEAR CAREER VISION
  // =========================================================================
  {
    id: "five_year_career_goal",
    patterns: [
      /\b(where do you see yourself in 5 years|5 year plan|future career goals|career aspiration)\b/i,
      /\b(saan mo nakikita ang sarili mo sa 5 taon|anong plano mo sa future|career goals mo)\b/i,
    ],
    keywords: ["5 years", "career goals", "future", "aspiration"],
    category: "about",
    en: `In 5 years, I see myself as a Senior QA Automation Engineer or Lead Full-Stack Software Engineer, designing enterprise test architecture, mentoring junior engineers, and driving resilient CI/CD pipelines.`,
    tl: `Sa loob ng 5 taon, nakikita ko ang aking sarili bilang isang Senior QA Automation Engineer o Lead Full-Stack Engineer na nagdidisenyo ng enterprise test frameworks at tumutulong sa mas batang mga developers.`,
  },

  // =========================================================================
  // 85. COFFEE OR TEA
  // =========================================================================
  {
    id: "coffee_or_tea",
    patterns: [
      /\b(coffee or tea|do you like coffee|favorite coffee|kape o tsaa)\b/i,
      /\b(umiinom ka ba ng kape|kape ka ba o tsaa|paborito mong kape)\b/i,
    ],
    keywords: ["coffee", "tea", "kape", "tsaa"],
    category: "general",
    en: `Coffee! A good brewed black coffee or iced latte fuels my focus during long debugging and coding sessions.`,
    tl: `Kape! Mas gusto ko ang brewed black coffee o iced latte para manatiling gising at tutok sa pagko-code at debugging.`,
  },

  // =========================================================================
  // 86. CODING MUSIC & PLAYLIST
  // =========================================================================
  {
    id: "coding_music_playlist",
    patterns: [
      /\b(what music do you listen to while coding|coding playlist|favorite music|do you listen to music)\b/i,
      /\b(anong tugtog pinapakinggan mo habang nagko-?code|playlist mo sa coding|anong music mo)\b/i,
    ],
    keywords: ["music", "playlist", "lo-fi", "synthwave", "tugtog"],
    category: "general",
    en: `I listen to Lo-Fi beats, synthwave, and ambient instrumentals. Instrumental music helps me enter a flow state without lyrical distractions.`,
    tl: `Nakikinig ako sa Lo-Fi beats, synthwave, at instrumental ambient music para mabilis pumasok sa focus mode nang walang nakakadistrang lyrics.`,
  },

  // =========================================================================
  // 87. FAVORITE VS CODE EXTENSIONS
  // =========================================================================
  {
    id: "vscode_extensions_used",
    patterns: [
      /\b(what vscode extensions do you use|favorite extensions|vscode plugins)\b/i,
      /\b(anong mga vscode extension gamit mo|paboritong extensions sa vscode)\b/i,
    ],
    keywords: [
      "vscode extensions",
      "plugins",
      "prettier",
      "eslint",
      "tailwind extension",
    ],
    category: "skills",
    en: `My go-to VS Code extensions are:
• Tailwind CSS IntelliSense (instant autocomplete & linting)
• ESLint & Prettier (code standardization and auto-formatting)
• GitLens (blame annotations and branch visualization)
• Playwright Test for VSCode (running and debugging tests directly in editor)
• Error Lens (inline error diagnostics)`,
    tl: `Ang aking mga paboritong VS Code extensions:
• Tailwind CSS IntelliSense (mabilisang autocomplete at linting)
• ESLint & Prettier (awtimatikong formatting at pamantayan sa code)
• GitLens (pagsusuri sa git commits at branches)
• Playwright Test for VSCode (direktang pagpapatakbo at debug ng tests)
• Error Lens (mabilisang pagpapakita ng error sa linya ng code)`,
  },

  // =========================================================================
  // 88. CODE REVIEW CHECKLIST
  // =========================================================================
  {
    id: "code_review_process",
    patterns: [
      /\b(how do you review code|code review checklist|what do you look for in code review)\b/i,
      /\b(paano ka mag-?code review|checklist mo sa code review|ano tinitingnan mo sa code ng iba)\b/i,
    ],
    keywords: [
      "code review",
      "pull request review",
      "pr checklist",
      "clean code",
    ],
    category: "process",
    en: `During Pull Request reviews, I evaluate:
1. Logic & Edge Cases: Does the code handle null/undefined, network failures, and empty states?
2. Security: Are inputs sanitized? Any SQL injection or exposed secrets?
3. Performance: Are there unnecessary re-renders or unindexed queries?
4. Maintainability: Is naming descriptive and follows existing architectural patterns?
5. Test Coverage: Are corresponding automated tests provided?`,
    tl: `Kapag nag-susuri ng Pull Request, sinusuri ko ang:
1. Logic at Edge Cases: Paano kung null, undefined, o mawalan ng internet?
2. Seguridad: Ligtas ba ang inputs laban sa SQL injection o XSS?
3. Bilis at Performance: May mga redundant ba na re-renders o mabagal na queries?
4. Kalinisan ng Code: Madali bang basahin at sumusunod ba sa standards ng team?
5. Test Coverage: May kasama bang tests para sa bagong feature?`,
  },

  // =========================================================================
  // 89. HOW DO YOU AVOID BURNOUT
  // =========================================================================
  {
    id: "avoid_burnout",
    patterns: [
      /\b(how do you avoid burnout|burnout management|work life balance|taking breaks)\b/i,
      /\b(paano mo iniiwasan ang burnout|work life balance mo|paano ka magpahinga)\b/i,
    ],
    keywords: ["burnout", "work life balance", "pahinga", "breaks"],
    category: "general",
    en: `I maintain balance by practicing the Pomodoro technique, taking screen breaks, walking outdoors in my coastal hometown of Mercedes, and completely unplugging after working hours.`,
    tl: `Iniiwasan ko ang burnout sa pamamagitan ng panandaliang pagpahinga gamit ang Pomodoro, paglalakad sa labas dito sa baybayin ng Mercedes, at pagpapahinga sa gabi pagkatapos ng oras ng trabaho.`,
  },

  // =========================================================================
  // 90. HOW DO YOU HANDLE MERGE CONFLICTS IN GIT
  // =========================================================================
  {
    id: "git_merge_conflicts",
    patterns: [
      /\b(how do you resolve merge conflicts|merge conflicts in git|git conflict resolution)\b/i,
      /\b(paano ka nag-?aayos ng merge conflict|kapag may conflict sa git|paano ayusin ang conflict)\b/i,
    ],
    keywords: ["merge conflict", "git conflict", "diff", "rebase"],
    category: "process",
    en: `I resolve merge conflicts systematically:
1. Pull the latest target branch into my feature branch (\`git merge origin/main\`).
2. Use VS Code's 3-way merge editor to compare incoming changes against current changes.
3. Communicate with the teammate who wrote the conflicting code to preserve both functionalities.
4. Run automated tests locally to verify no regressions before committing the merge.`,
    tl: `Inaayos ko ang merge conflicts sa maayos na paraan:
1. I-pull ang pinakabagong bersyon ng branch sa aking feature branch (\`git merge origin/main\`).
2. Gamitin ang VS Code 3-way merge editor para suriin ang nagtutunggaling code.
3. Kausapin ang kasamahan sa team kung kinakailangan para masigurong walang mawawalang feature.
4. Patakbuhin ang tests sa local machine bago i-commit ang naayos na code.`,
  },

  // =========================================================================
  // 91. HOW DO YOU DEAL WITH UNCLEAR REQUIREMENTS
  // =========================================================================
  {
    id: "handling_unclear_requirements",
    patterns: [
      /\b(how do you deal with unclear requirements|ambiguous specs|vague requirements)\b/i,
      /\b(paano kapag malabo ang requirements|kapag hindi malinaw ang pinapagawa|unclear specs)\b/i,
    ],
    keywords: [
      "unclear requirements",
      "ambiguous",
      "requirements gathering",
      "clarification",
    ],
    category: "process",
    en: `When requirements are vague:
1. I do NOT guess or make unverified assumptions.
2. I write down specific clarification questions highlighting expected edge cases.
3. I schedule a brief sync or leave documented comments on the Jira card for the Product Owner.
4. Once clarified, I update the ticket with explicit acceptance criteria before implementation.`,
    tl: `Kapag malabo ang requirements:
1. Hindi ako nanghuhula o gumagawa batay sa sariling haka-haka.
2. Isinusulat ko ang mga partikular na katanungan lalo na sa mga edge cases.
3. Nakikipag-ugnayan ako sa Product Owner o Team Lead upang linawin ang nais nilang mangyari.
4. Kapag malinaw na, inilalagay ko ang acceptance criteria sa ticket bago magsimula sa pagbuo o pag-test.`,
  },

  // =========================================================================
  // 92. HOW DO YOU SCHEDULE AN INTERVIEW WITH KENNU
  // =========================================================================
  {
    id: "schedule_interview",
    patterns: [
      /\b(how to schedule an interview|book an interview|set up an interview|interview kennu)\b/i,
      /\b(paano mag-?schedule ng interview|paano ka maka-?interview|interview invite)\b/i,
    ],
    keywords: [
      "interview",
      "schedule interview",
      "book call",
      "meeting",
      "google meet",
    ],
    category: "contact",
    en: `To schedule an interview, email me directly at elnarkennu16@gmail.com with your proposed date, time, and meeting link (Google Meet / Zoom). I respond promptly within 24 hours.`,
    tl: `Para mag-schedule ng interview, mag-email lang sa elnarkennu16@gmail.com kasama ang iyong petsa, oras, at meeting link (Google Meet / Zoom). Agad akong sumasagot sa loob ng 24 oras.`,
  },

  // =========================================================================
  // 93. WEB PERFORMANCE & CORE WEB VITALS
  // =========================================================================
  {
    id: "web_performance_optimization",
    patterns: [
      /\b(how do you optimize web performance|core web vitals|page speed|website performance)\b/i,
      /\b(paano mo pinapabilis ang website|performance optimization|pampabilis ng loading)\b/i,
    ],
    keywords: [
      "performance",
      "core web vitals",
      "lcp",
      "cls",
      "lazy loading",
      "page speed",
    ],
    category: "skills",
    en: `I optimize web performance by:
1. Code Splitting & Dynamic Imports: Loading JavaScript bundles only when needed.
2. Image Optimization: Serving WebP/AVIF formats with explicit width/height to eliminate Cumulative Layout Shift (CLS).
3. Asset Compression & Caching: Using gzip/brotli compression and long-lived cache headers.
4. Minimizing Re-renders: Memoizing expensive computations with React.memo and useMemo.`,
    tl: `Pinapabilis ko ang web performance sa pamamagitan ng:
1. Code Splitting: Pagkarga lamang ng kinakailangang JavaScript sa bawat pahina.
2. Image Optimization: Paggamit ng WebP/AVIF formats at saktong sukat para iwas Cumulative Layout Shift (CLS).
3. Compression at Caching: Paggamit ng gzip/brotli at browser caching.
4. Minimizing Re-renders: Paggamit ng useMemo at malinis na state architecture sa React.`,
  },

  // =========================================================================
  // 94. ACCESSIBILITY & WCAG 2.1 COMPLIANCE
  // =========================================================================
  {
    id: "accessibility_wcag_guidelines",
    patterns: [
      /\b(accessibility in web|wcag guidelines|how do you test accessibility|a11y)\b/i,
      /\b(paano mo tine-?test ang accessibility|accessibility sa website|wcag compliance)\b/i,
    ],
    keywords: ["accessibility", "a11y", "wcag", "screen reader", "aria"],
    category: "qa",
    en: `I test accessibility (WCAG 2.1 AA) by:
1. Keyboard Navigation: Ensuring all interactive elements can be focused and triggered with Tab, Enter, and Space without focus traps.
2. Color Contrast: Verifying a minimum 4.5:1 text-to-background contrast ratio for readability.
3. Screen Readers: Testing aria-labels and semantic HTML tags (nav, main, button vs div).`,
    tl: `Sinusuri ko ang web accessibility (WCAG 2.1 AA) sa pamamagitan ng:
1. Keyboard Navigation: Tinitiyak na ang lahat ng buttons at links ay napipindot gamit lamang ang Tab, Enter, at Space nang walang focus traps.
2. Color Contrast: Sinisigurong may sapat na contrast (4.5:1) ang teksto laban sa background.
3. Screen Readers: Paggamit ng tamang semantic HTML (nav, main, button) at aria-labels para sa visually impaired users.`,
  },

  // =========================================================================
  // 95. WILLINGNESS TO RELOCATE
  // =========================================================================
  {
    id: "willingness_to_relocate",
    patterns: [
      /\b(are you willing to relocate|willing to move|relocation to manila|can you relocate)\b/i,
      /\b(willing ka ba mag-?relocate|pwede ka ba lumipat sa manila|relocation mo)\b/i,
    ],
    keywords: ["relocate", "relocation", "manila", "move"],
    category: "about",
    en: `Yes, I am open to relocating to Metro Manila or other primary tech hubs for favorable full-time or hybrid opportunities.`,
    tl: `Oo, bukas ako sa paglipat sa Metro Manila o iba pang tech hubs para sa magandang full-time o hybrid na trabaho.`,
  },

  // 48. THOUGHTS ON AI TOOLS & CODING ASSISTANTS
  {
    id: "thoughts-on-ai-tools",
    patterns: [
      /\b(What are your thoughts on AI tools and coding assistants\?|Thought on AI tools|how do you use ai tools|do you use chatgpt or cursor|thoughts on ai in coding)\b/i,
      /\b(gumagamit ka ba ng ai|paano mo ginagamit ang cursor o chatgpt|pananaw mo sa ai)\b/i,
      /\b(AI tools in web dev|use of ai in qa|copilot cursor chatgpt)\b/i,
    ],
    keywords: [
      "Thoughts on AI Tools",
      "ᴛʜᴏᴜɢʜᴛꜱ ᴏɴ ᴀɪ?",
      "What are your thoughts on AI tools and coding assistants?",
      "ᴘᴀɴᴀɴᴀᴡ ꜱᴀ ᴀɪ?",
    ],
    category: "general",
    en: "As artificial intelligence becomes embedded in modern workflows, the role of a developer is shifting from pure execution to high-level architecture, continuous evaluation, and quality assurance. When leveraged intentionally, platforms like 𝘾𝙪𝙧𝙨𝙤𝙧, 𝘾𝙝𝙖𝙩𝙂𝙋𝙏, 𝙤 𝘾𝙡𝙖𝙪𝙙e act as force multipliers. They help accelerate exploration, surface alternative technical approaches, and shorten the feedback loop between initial design and execution. They allow developers to spend less time on manual mechanics and more time on high-value decision-making. However, code generation is not system engineering. Machine learning models operate on patterns rather than operational context, security implications, or genuine user empathy. Every automated output requires rigorous human validation, deep testing, and critical oversight. Technology can speed up output, but sound judgment, deliberate design, and ownership of the final experience will always rest entirely on the developer.",
    tl: "Habang nagiging bahagi na ng mga modernong workflow ang artificial intelligence, ang papel ng isang developer ay lumilipat na mula sa direktang pag-code patungo sa mataas na antas ng arkitektura, tuloy-tuloy na ebalwasyon, at pagsisiguro ng kalidad. Kapag ginamit nang may malinaw na layunin, ang mga platform tulad ng 𝘾𝙪𝙧𝙨𝙤𝙧, 𝘾𝙝𝙖𝙩𝙂𝙋𝙏, 𝙤 𝘾𝙡𝙖𝙪𝙙𝙚 ay nagsisilbing tagapabilis ng trabaho. Nakakatulong silang mapabilis ang pag-explore ng mga ideya, maglabas ng mga alternatibong teknikal na diskarte, at paikliin ang oras mula sa paunang disenyo hanggang sa pagpapatupad. Dahil dito, mas kaunting oras ang nagagastos ng mga developer sa mga paulit-ulit na proseso at mas nakakapokus sa mga mahahalagang desisyon. Gayunpaman, ang pag-generate ng code ay hindi katumbas ng system engineering. Ang mga machine learning model ay gumagana batay sa mga pattern—hindi sa totoong konteksto ng operasyon, mga implikasyon sa seguridad, o tunog na pag-unawa sa karanasan ng user. Bawat awtomatikong gawa ay nangangailangan pa rin ng masusing pagsusuri ng tao, malalim na testing, at kritikal na pangangasiwa. Maaaring mapabilis ng teknolohiya ang produksyon, ngunit ang tamang pagpapasya, maingat na disenyo, at pananagutan sa huling resulta ay laging nakasalalay sa developer.",
  },

  // =========================================================================
  // 97. LOCAL SPECIALTIES / BICOL FOOD
  // =========================================================================
  {
    id: "favorite_food_bicol",
    patterns: [
      /\b(favorite food|bicol express|what food do you like|anong paborito mong pagkain)\b/i,
      /\b(anong paborito mong pagkain|mahilig ka ba sa maanghang|ulam mo)\b/i,
    ],
    keywords: ["food", "bicol express", "laing", "pagkain", "ulam"],
    category: "general",
    en: `Being from Bicol, I love spicy coconut-milk dishes like authentic Bicol Express and Laing, along with fresh seafood from the port of Mercedes.`,
    tl: `Bilang taga-Bicol, paborito ko ang maanghang na Bicol Express, Laing na may gata, at sariwang isda at seafood mula sa pantalan ng Mercedes.`,
  },

  // =========================================================================
  // 98. EXPERIENCE WITH TAILWIND VS BOOTSTRAP
  // =========================================================================
  {
    id: "tailwind_vs_bootstrap",
    patterns: [
      /\b(tailwind vs bootstrap|why do you prefer tailwind|tailwind or bootstrap)\b/i,
      /\b(bakit tailwind gamit mo|anong mas gusto mo tailwind o bootstrap)\b/i,
    ],
    keywords: ["tailwind", "bootstrap", "css", "styling"],
    category: "skills",
    en: `I prefer Tailwind CSS over Bootstrap because it provides fine-grained utility classes without bloated pre-packaged CSS, enables faster custom designs without fighting component overrides, and produces tiny production bundles via PurgeCSS.`,
    tl: `Mas gusto ko ang Tailwind CSS kaysa Bootstrap dahil nagbibigay ito ng mabilisang utility classes nang walang sobrang laking CSS file, madaling i-customize ang design, at napakaliit ng production bundle size.`,
  },

  // =========================================================================
  // 99. DEALING WITH FLAKY AUTOMATED TESTS
  // =========================================================================
  {
    id: "dealing_with_flaky_tests",
    patterns: [
      /\b(how do you fix flaky tests|flaky automated tests|test flakiness|unstable tests)\b/i,
      /\b(paano mo inaayos ang flaky tests|paano kapag pabago-?bago ang resulta ng test)\b/i,
    ],
    keywords: [
      "flaky tests",
      "flakiness",
      "playwright waits",
      "race condition",
    ],
    category: "qa",
    en: `To eliminate flaky automated tests:
1. I replace hardcoded sleep timeouts (e.g. \`sleep(3000)\`) with explicit condition-based assertions (e.g. \`waitForSelector\`, \`toBeVisible\`).
2. I isolate test states using fresh test fixtures and unique data to prevent tests from depending on each other.
3. I mock third-party network requests that have variable latency.`,
    tl: `Para alisin ang flaky tests:
1. Tinatanggal ko ang mga hardcoded sleep timeouts at pinapalitan ng explicit assertions tulad ng \`waitForSelector\` at \`toBeVisible\`.
2. Inihihiwalay ko ang bawat test gamit ang sariwang test data para walang test na umaasa sa naunang resulta.
3. Mina-mock ko ang mabagal na third-party network calls na nagdudulot ng race condition.`,
  },

  // =========================================================================
  // 100. WHAT MOTIVATES KENNU DAILY
  // =========================================================================
  // 44. DAILY MOTIVATION & PERSONAL PHILOSOPHY
  // 44. DAILY MOTIVATION & PERSONAL PHILOSOPHY
  {
    id: "daily_motivation",
    patterns: [
      /\b(what motivates you|what keeps you going|inspiration in tech|daily motivation)\b/i,
      /\b(ano nagmo-?motivate sa iyo|anong inspirasyon mo|bakit ka masipag mag-?code)\b/i,
      /\b(word of wisdom|motto in life|life advice|daily quote)\b/i,
    ],
    keywords: [
      "motivation",
      "inspiration",
      "ᴅᴀɪʟʏ ᴍᴏᴛɪᴠᴀᴛɪᴏɴ?",
      "passion",
      "mindset",
      "ᴘᴀɴɢ-ᴀʀᴀᴡ-ᴀʀᴀᴡ ɴᴀ ɪɴꜱᴘɪʀᴀꜱʏᴏɴ?",
    ],
    category: "general",
    en: "Real motivation isn't about instant excitement; it's about building strong habits and staying consistent. Here are 4 personal principles that keep me going:\n\n1. 𝑷𝒓𝒐𝒈𝒓𝒆𝒔𝒔 𝑶𝒗𝒆𝒓 𝑷𝒆𝒓𝒇𝒆𝒄𝒕𝒊𝒐𝒏 – You don't have to figure out everything today. Small, daily efforts compound into real skill and long-term results.\n2. 𝑻𝒓𝒆𝒂𝒕 𝑭𝒂𝒊𝒍𝒖𝒓𝒆 𝒂𝒔 𝑫𝒆𝒃𝒖𝒈𝒈𝒊𝒏𝒈 – Errors and unexpected bugs aren't roadblocks. They are just hints telling you what to fix so you can build a stronger system.\n3. 𝑻𝒂𝒌𝒆 𝑷𝒓𝒊𝒅𝒆 𝒊𝒏 𝑺𝒎𝒂𝒍𝒍 𝑫𝒆𝒕𝒂𝒊𝒍𝒔 – Whether you're writing clean code, testing edge cases, or fixing daily routines, doing things with care always shows in the outcome.\n4. 𝑩𝒖𝒊𝒍𝒅 𝑻𝒉𝒊𝒏𝒈𝒔 𝑻𝒉𝒂𝒕 𝑴𝒂𝒕𝒕𝒆𝒓 – Completing a task is good, but knowing your work solves a real problem or makes someone's day easier is what makes it truly satisfying.",
    tl: "Ang tunay na motivation ay wala sa emosyon kundi nasa magandang habit at konsistensya. Eto ang 4 na personal kong gabay para magpatuloy araw-araw:\n\n1. 𝑼𝒏𝒂𝒉𝒊𝒏 𝒂𝒏𝒈 𝑷𝒂𝒈-𝒖𝒏𝒍𝒂𝒌 𝑲𝒆𝒔𝒂 𝑷𝒆𝒓𝒑𝒆𝒌𝒔𝒚𝒐𝒏 – Hindi mo kailangang matutunan ang lahat agad-agad. Ang unti-unting tiyaga araw-araw ang totoong nagbubunga ng tunay na galing.\n2. 𝑰𝒕𝒖𝒓𝒊𝒏𝒈 𝒏𝒂 𝑫𝒆𝒃𝒖𝒈𝒈𝒊𝒏𝒈 𝒂𝒏𝒈 𝑷𝒂𝒈𝒌𝒂𝒌𝒂𝒎𝒂𝒍𝒊 – Ang mga problema at failed tests ay hindi katapusan. Mga pahiwatig lang sila kung ano ang kailangang ayusin para mas maging matibay ka.\n3. 𝑴𝒂𝒈𝒊𝒏𝒈 𝑴𝒂𝒊𝒏𝒈𝒂𝒕 𝒔𝒂 𝑩𝒂𝒘𝒂𝒕 𝑫𝒆𝒕𝒂𝒍𝒚𝒆 – Developer ka man o hindi, ang pagbuo ng bagay nang may malasakit at linis ay laging lumalabas sa ganda ng resulta.\n4. 𝑮𝒖𝒎𝒂𝒘𝒂 𝒏𝒈 𝑴𝒈𝒂 𝑩𝒂𝒈𝒂𝒚 𝒏𝒂 𝑵𝒂𝒌𝒂𝒕𝒖𝒕𝒖𝒍𝒐𝒏𝒈 – Masarap matapos ang trabaho, pero mas masarap sa pakiramdam kapag alam mong ang ginawa mo ay totoong nakapagpadali sa buhay ng iba.",
  },

  // =========================================================================
  // 101. REACT STATE MANAGEMENT STRATEGY
  // =========================================================================
  {
    id: "state_management_strategy",
    patterns: [
      /\b(how do you manage state in react|state management in react|zustand vs redux|react state management)\b/i,
      /\b(paano ka mag-?handle ng state sa react|anong gamit mo sa state management|zustand o context)\b/i,
    ],
    keywords: [
      "state management",
      "zustand",
      "context api",
      "react query",
      "usestate",
    ],
    category: "skills",
    en: `I choose state management based on scope:
• Component State: useState & useReducer for local toggles, forms, and modals.
• Shared UI State: Zustand or lightweight React Context for theme, sidebar, or global toasts.
• Server / Cache State: TanStack Query (React Query) for API data caching, pagination, and background refetching.
This avoids monolithic Redux bloat while keeping state clean and testable.`,
    tl: `Pinipili ko ang state management batay sa saklaw:
• Component State: useState at useReducer para sa lokal na forms at modals.
• Shared UI State: Zustand o React Context para sa theme, sidebar, at global notifications.
• Server Cache State: TanStack Query para sa API caching, background refetching, at data sync.
Naiiwasan nito ang sobrang laking Redux setup habang nananatiling malinis at madaling i-test ang code.`,
  },

  // =========================================================================
  // 102. SQL JOINS EXPLAINED WITH REAL EXAMPLES
  // =========================================================================
  {
    id: "sql_joins_explanation",
    patterns: [
      /\b(explain sql joins|inner join vs left join|sql joins explained|difference between left join and inner join)\b/i,
      /\b(ano ang pagkakaiba ng inner join at left join|paano gumamit ng sql join|mga uri ng join sa sql)\b/i,
    ],
    keywords: [
      "sql joins",
      "inner join",
      "left join",
      "right join",
      "sql queries",
    ],
    category: "skills",
    en: `SQL Joins combine data across related tables:
• INNER JOIN: Returns only rows where there is a match in both tables (e.g. users who have at least one asset).
• LEFT JOIN: Returns ALL rows from the left table, plus matched rows from the right table (NULL if no asset assigned).
• RIGHT JOIN: Returns ALL rows from the right table, plus matched rows from the left.
• FULL JOIN: Returns rows when there is a match in either left or right table.`,
    tl: `Ang SQL Joins ay nagdurugtong ng data mula sa magkaibang tables:
• INNER JOIN: Ibinabalik lamang ang mga records na may tugma sa parehong tables (hal. mga users na may hawak na asset).
• LEFT JOIN: Ibinabalik ang LAHAT ng records mula sa kaliwang table, at ang katugmang data sa kanan (NULL kung walang asset).
• RIGHT JOIN: Ibinabalik ang LAHAT ng records mula sa kanang table.
• FULL JOIN: Ibinabalik ang lahat kapag may tugma sa alinmang table.`,
  },

  // =========================================================================
  // 103. JWT AUTHENTICATION FLOW & SECURITY
  // =========================================================================
  {
    id: "jwt_authentication_flow",
    patterns: [
      /\b(how does jwt authentication work|jwt flow|access token vs refresh token|jwt security)\b/i,
      /\b(paano gumagana ang jwt|jwt authentication flow|access token at refresh token)\b/i,
    ],
    keywords: [
      "jwt",
      "authentication flow",
      "refresh token",
      "access token",
      "security",
    ],
    category: "skills",
    en: `I implement secure token-based authentication using short-lived Access Tokens and HttpOnly Refresh Tokens:
1. Client submits credentials via HTTPS POST /login.
2. Server validates password hash and issues a short-lived Access Token (15 mins) and sets an HttpOnly, Secure, SameSite Refresh Token cookie (7 days).
3. Client attaches Access Token in \`Authorization: Bearer <token>\` for API requests.
4. When Access Token expires (HTTP 401), client silently hits /refresh using the cookie to get a fresh Access Token without logging the user out.`,
    tl: `Nagpapatupad ako ng ligtas na token-based authentication gamit ang panandaliang Access Token at HttpOnly Refresh Token:
1. Nagpapadala ang user ng credentials sa /login.
2. Sinusuri ng server ang password at nagbibigay ng 15-minutong Access Token, kasama ang HttpOnly Cookie na Refresh Token (7 araw).
3. Ipinapasa ng frontend ang token sa header na \`Authorization: Bearer <token>\`.
4. Kapag nag-expire ang Access Token (401), awtomatikong humihingi ang frontend ng bagong token sa /refresh gamit ang cookie nang hindi kailangang mag-login ulit ang user.`,
  },

  // =========================================================================
  // 104. OWASP TOP 10 WEB DEFENSES
  // =========================================================================
  {
    id: "owasp_top_10_defenses",
    patterns: [
      /\b(owasp top 10|how do you prevent sql injection|xss prevention|csrf protection|web security best practices)\b/i,
      /\b(paano protektahan ang website sa hacker|owasp guidelines|sql injection protection|xss defense)\b/i,
    ],
    keywords: [
      "owasp",
      "sql injection",
      "xss",
      "csrf",
      "security",
      "prepared statements",
    ],
    category: "skills",
    en: `I defend against top OWASP vulnerabilities:
1. SQL Injection: Use PDO Prepared Statements and ORMs exclusively; never concatenate raw strings into queries.
2. Cross-Site Scripting (XSS): Escape output in React DOM, sanitize rich text with DOMPurify, set strict Content Security Policy (CSP).
3. Cross-Site Request Forgery (CSRF): Validate anti-CSRF tokens on state-changing requests and use SameSite=Strict cookies.
4. Broken Access Control: Enforce server-side role and policy checks (RBAC) on every controller method.`,
    tl: `Pinoprotektahan ko ang web apps laban sa mga panganib ng OWASP:
1. SQL Injection: Paggamit ng PDO Prepared Statements at ORM; bawal ang pagsasama ng raw user strings sa SQL query.
2. XSS (Cross-Site Scripting): Awtomatikong pag-sanitize ng React at DOMPurify sa inputs, at Content Security Policy (CSP).
3. CSRF: Pagsuri sa CSRF tokens sa POST/PUT/DELETE requests at paggamit ng SameSite cookies.
4. Broken Access Control: Mahigpit na pagpapatupad ng role-based access checks (RBAC) sa backend controllers.`,
  },

  // =========================================================================
  // 105. MOBILE RESPONSIVENESS BREAKPOINTS (TAILWIND)
  // =========================================================================
  {
    id: "responsive_breakpoints_tailwind",
    patterns: [
      /\b(tailwind breakpoints|responsive design strategy|mobile first approach|screen sizes)\b/i,
      /\b(paano mo ginagawang responsive|breakpoints sa tailwind|mobile first development)\b/i,
    ],
    keywords: [
      "breakpoints",
      "mobile first",
      "tailwind responsive",
      "media queries",
    ],
    category: "skills",
    en: `I build with a strict Mobile-First philosophy using Tailwind CSS default breakpoints:
• Default (Base): Mobile screens (< 640px)
• sm: 640px (Large phones / small tablets)
• md: 768px (Tablets & iPads in portrait)
• lg: 1024px (Laptops & desktop screens)
• xl: 1280px (Wide desktop monitors)
• 2xl: 1536px (Ultra-wide displays)

Mobile styles are applied as baseline classes, while larger layout adjustments are wrapped in sm:, md:, and lg: prefixes.`,
    tl: `Bumubuo ako gamit ang Mobile-First approach sa Tailwind CSS:
• Base / Default: Para sa cellphone screen (< 640px)
• sm: 640px (Malalaking phones at maliit na tablet)
• md: 768px (Tablets tulad ng iPad)
• lg: 1024px (Laptops at standard desktop)
• xl: 1280px (Malalaking desktop screens)
• 2xl: 1536px (Ultra-wide monitors)

Ang baseline classes ay para sa cellphone, at saka lamang ina-adjust sa mas malalaking screen gamit ang sm:, md:, at lg: prefixes.`,
  },

  // =========================================================================
  // 106. CROSS-BROWSER TESTING TOOLS & PROCESS
  // =========================================================================
  {
    id: "cross_browser_testing_tools",
    patterns: [
      /\b(cross browser testing|how do you test across browsers|browser compatibility|safari chrome firefox)\b/i,
      /\b(paano mo tine-?test sa iba-?ibang browser|cross browser compatibility|testing sa safari at chrome)\b/i,
    ],
    keywords: [
      "cross browser",
      "browser compatibility",
      "webkit",
      "chromium",
      "firefox",
      "safari",
    ],
    category: "qa",
    en: `For cross-browser compatibility, I test on:
1. Chromium (Google Chrome, Microsoft Edge, Brave)
2. Gecko (Mozilla Firefox)
3. WebKit (Apple Safari desktop & iOS mobile viewports)

I use Playwright's multi-browser execution matrix locally and in CI to catch browser-specific CSS layout quirks, date picker inconsistencies, and JavaScript engine deviations.`,
    tl: `Para sa cross-browser compatibility, sumusuri ako sa:
1. Chromium (Chrome, Edge, Brave)
2. Gecko (Firefox)
3. WebKit (Safari sa macOS at iOS mobile)

Ginagamit ko ang multi-browser matrix ng Playwright sa CI upang mahuli ang mga browser-specific rendering bugs, date picker bugs, at CSS differences.`,
  },

  // =========================================================================
  // 107. PROFESSIONAL TEST PLAN DOCUMENT STRUCTURE
  // =========================================================================
  {
    id: "test_plan_document_structure",
    patterns: [
      /\b(test plan template|how do you write a test plan|test plan structure|sample test plan)\b/i,
      /\b(paano gumawa ng test plan|structure ng test plan|sample ng test plan document)\b/i,
    ],
    keywords: [
      "test plan",
      "test plan template",
      "scope",
      "deliverables",
      "strategy",
    ],
    category: "qa",
    en: `A professional QA Test Plan includes 7 core sections:
1. Objectives & Scope: Features included vs features out-of-scope for the release.
2. Test Strategy: Breakdown of Manual, Automated, API, and Performance testing.
3. Environment Setup: Staging URLs, database seeds, and test credentials.
4. Entry & Exit Criteria: Pre-requisites to start testing and quality gates required to sign off.
5. Defect Management: Severity definitions (Critical, High, Medium, Low) and SLA response times.
6. Resource Schedule: Milestones, sprint timelines, and tester assignments.
7. Deliverables: Test execution log, bug summary report, and go/no-go recommendation.`,
    tl: `Ang isang propesyonal na QA Test Plan ay may 7 pangunahing bahagi:
1. Layunin at Saklaw (Scope): Mga features na kasama at hindi kasama sa testing.
2. Estratehiya sa Testing: Paghahati ng Manual, Automated, API, at Performance tests.
3. Test Environment: Staging URL, database test data, at user credentials.
4. Entry at Exit Criteria: Mga kailangan bago magsimula at pamantayan bago payagang i-deploy.
5. Defect Management: Kahulugan ng Severity levels (Critical, High, Medium, Low).
6. Iskedyul ng Trabaho: Sprint timeline at takdang petsa ng pag-test.
7. Mga Ulat (Deliverables): Test execution log, summary ng bugs, at go/no-go desisyon.`,
  },

  // =========================================================================
  // 108. DEFECT LIFECYCLE STAGES
  // =========================================================================
  {
    id: "defect_lifecycle_stages",
    patterns: [
      /\b(defect life cycle|bug life cycle|stages of a bug|bug status flow)\b/i,
      /\b(ano ang defect lifecycle|ikot ng buhay ng bug|mga estado ng bug sa jira)\b/i,
    ],
    keywords: [
      "defect lifecycle",
      "bug lifecycle",
      "new",
      "assigned",
      "fixed",
      "retest",
      "closed",
    ],
    category: "qa",
    en: `The standard Defect Lifecycle:
1. New / Draft: Bug identified and logged by QA with reproduction steps.
2. Assigned: Triage assigns defect to the responsible developer.
3. In Progress: Developer reproduces and investigates root cause.
4. Fixed: Code patch committed and deployed to Staging.
5. Retest: QA executes targeted verification test cases on the fix.
6. Closed: Verified working properly in staging.
(If retest fails, the bug is marked REOPENED with new logs attached).`,
    tl: `Ang standard na ikot ng Defect Lifecycle:
1. New: Natuklasan at iniulat ng QA na may kumpletong steps.
2. Assigned: Itinalaga ang bug sa developer na may hawak ng module.
3. In Progress: Sinusuri at inaayos ng developer ang problema.
4. Fixed: Na-commit ang solusyon at na-deploy sa staging server.
5. Retest: Sinusuri muli ng QA ang apektadong bahagi.
6. Closed: Napatunayang maayos na at gumagana nang tama.
(Kung pumalya sa retest, mamarkahan itong REOPENED kasama ang bagong ebidensya).`,
  },

  // =========================================================================
  // 109. PERFORMANCE TESTING TOOLS & WORKFLOW
  // =========================================================================
  {
    id: "performance_testing_tools",
    patterns: [
      /\b(how do you test performance|performance testing tools|load testing|lighthouse jmeter)\b/i,
      /\b(paano mo tine-?test ang bilis ng website|performance testing tools na gamit mo|load test)\b/i,
    ],
    keywords: [
      "performance testing",
      "lighthouse",
      "jmeter",
      "k6",
      "load testing",
    ],
    category: "qa",
    en: `For performance and load testing, I utilize:
• Google Lighthouse: Audits Core Web Vitals, SEO, and accessibility metrics.
• Chrome DevTools Network & Performance Tabs: Identifies layout shifts, long CPU tasks, and uncompressed assets.
• Postman & k6: Simulates concurrent API load and measures latency under 50-200 simultaneous users.`,
    tl: `Para sa performance at load testing, gumagamit ako ng:
• Google Lighthouse: Pagsusuri sa Core Web Vitals, bilis ng pahina, at SEO.
• Chrome DevTools Performance Tab: Paghahanap ng mabagal na JavaScript tasks at mabibigat na files.
• Postman at k6: Pagsusuri sa bilis ng API kapag sabay-sabay na nagre-request ang 50 hanggang 200 users.`,
  },

  // =========================================================================
  // 110. EXPLORATORY TESTING & SESSION-BASED MANAGEMENT
  // =========================================================================
  {
    id: "exploratory_testing_charters",
    patterns: [
      /\b(exploratory testing|how do you do exploratory testing|session based test management|sbtm)\b/i,
      /\b(paano ka mag-?exploratory test|ano ang exploratory testing|paraan ng exploratory test)\b/i,
    ],
    keywords: ["exploratory testing", "sbtm", "charter", "timebox", "ad-hoc"],
    category: "qa",
    en: `I structure exploratory testing using Session-Based Test Management (SBTM):
1. Test Charter: Define a specific mission (e.g. "Discover edge cases in multi-tier approvals under slow 3G").
2. Timebox: Allocate a focused 45-60 minute uninterrupted testing session.
3. Mindset: Think like both an adversary (trying to break things) and a novice user (trying unexpected button combinations).
4. Debrief: Review session notes and log any valid defects with screenshots.`,
    tl: `Isinasagawa ko ang exploratory testing gamit ang Session-Based Test Management (SBTM):
1. Test Charter: Magtakda ng malinaw na layunin (hal. "Subukan ang multi-tier approvals sa mabagal na 3G network").
2. Timebox: Maglaan ng 45 hanggang 60 minutong walang abalang pagsusuri.
3. Pananaw: Mag-isip tulad ng mapanirang user at baguhang user para mahuli ang kakaibang behavior.
4. Debrief: Isulat ang natuklasan at gumawa ng opisyal na bug reports.`,
  },

  // =========================================================================
  // 111. API PAGINATION TESTING STRATEGY
  // =========================================================================
  {
    id: "api_pagination_testing",
    patterns: [
      /\b(how do you test pagination|api pagination test cases|testing pagination)\b/i,
      /\b(paano mo tine-?test ang pagination|test cases sa paging|pagination testing)\b/i,
    ],
    keywords: ["pagination", "api pagination", "page size", "offset", "cursor"],
    category: "qa",
    en: `When testing API pagination (page & limit parameters), I verify:
1. Default Values: Requesting without parameters defaults to page=1 and limit=10/20.
2. Boundary Limits: Requesting page=0, page=-1, or page=999999 returns empty lists gracefully without 500 crashes.
3. Extreme Page Sizes: Requesting limit=0 or limit=1000000 respects maximum server caps (e.g. max 100).
4. Total Count Meta: Verifying totalItems, totalPages, and hasNextPage accurately match database records.`,
    tl: `Kapag sinusuri ang API pagination (page at limit parameters), tinitiyak ko ang:
1. Default Values: Kapag walang parameters, default sa page=1 at limit=10 o 20.
2. Boundary Limits: Kapag page=0, page=-1, o page=999999, dapat walang crash (HTTP 500) at maayos na magbalik ng empty array.
3. Extreme Page Sizes: Kapag humingi ng limit=1000000, dapat may maximum cap ang server (hal. hanggang 100 lang).
4. Meta Data: Tumpak ang totalItems, totalPages, at hasNextPage flags batay sa database.`,
  },

  // =========================================================================
  // 112. FILE UPLOAD SECURITY TESTING
  // =========================================================================
  {
    id: "file_upload_security_testing",
    patterns: [
      /\b(how do you test file uploads|testing file upload security|file upload test cases)\b/i,
      /\b(paano mo tine-?test ang pag-upload ng file|file upload security|test cases sa upload)\b/i,
    ],
    keywords: [
      "file upload",
      "upload security",
      "mime type",
      "file size",
      "malicious upload",
    ],
    category: "qa",
    en: `File upload testing checklist:
1. Extension vs MIME Spoofing: Rename a malicious .exe or .php file to .png and verify the server inspects the binary magic bytes, rejecting it.
2. File Size Limits: Test 0-byte empty files, exact boundary limit (e.g. 5.0 MB), and oversized files (5.1 MB) for friendly error messages.
3. SVG XSS Prevention: Uploading SVG files containing embedded <script> tags must not execute JavaScript when viewed.
4. Storage Sanitization: Server must rename uploaded files to random UUIDs to prevent directory traversal attacks.`,
    tl: `Checklist sa pagsusuri ng file uploads:
1. MIME Spoofing: Palitan ang .exe o .php file ng pangalang .png at tiyaking tinatanggihan ito ng server batay sa binary bytes.
2. File Size Limits: Subukan ang 0-byte file, saktong limit (5.0 MB), at sumosobrang file (5.1 MB) para sa malinaw na error message.
3. SVG XSS Check: Ang SVG files na may nakatagong <script> tags ay hindi dapat magpatakbo ng JavaScript sa browser.
4. Ligtas na Storage: Dapat palitan ng server ang pangalan ng uploaded file gamit ang random UUID para maiwasan ang directory traversal.`,
  },

  // =========================================================================
  // 113. DATABASE CONCURRENCY & RACE CONDITION TESTING
  // =========================================================================
  {
    id: "database_concurrency_race_conditions",
    patterns: [
      /\b(race condition testing|how do you test concurrency|database race condition|testing race conditions)\b/i,
      /\b(paano ka mag-?test ng race condition|concurrency testing sa database|sabay-sabay na transaksyon)\b/i,
    ],
    keywords: [
      "race condition",
      "concurrency",
      "locking",
      "acid",
      "double spend",
    ],
    category: "qa",
    en: `To test for database race conditions:
1. I send simultaneous asynchronous HTTP requests using Postman collection runner or a script with Promise.all().
2. I test inventory decrement: purchasing the last item with 2 concurrent requests.
3. I verify database transactions use SELECT ... FOR UPDATE or optimistic version checks to prevent dirty writes.`,
    tl: `Para sumubok ng database race conditions:
1. Nagpapadala ako ng magkasabay na HTTP requests gamit ang script na may Promise.all() o Postman runner.
2. Sinusubukan ko ang huling stock: dalawang magkasabay na checkout sa iisang produkto.
3. Tinitiyak kong gumagamit ang database ng tamang locking (SELECT ... FOR UPDATE) para maiwasan ang double deduction.`,
  },

  // =========================================================================
  // 114. AGILE SCRUM RITUALS & THE QA ROLE
  // =========================================================================
  {
    id: "agile_scrum_rituals_qa_role",
    patterns: [
      /\b(qa role in scrum|agile ceremonies|what do you do in daily standup|sprint retrospective)\b/i,
      /\b(ano ang role ng qa sa agile|ano ginagawa mo sa standup|pakikilahok sa sprint)\b/i,
    ],
    keywords: [
      "agile",
      "scrum",
      "daily standup",
      "sprint planning",
      "retrospective",
    ],
    category: "qa",
    en: `My active role in Agile Scrum ceremonies:
• Sprint Planning: Estimate QA story points, define acceptance criteria, and identify test data requirements.
• Daily Standup: Share what I verified yesterday, what I am testing today, and raise any blocking environment defects.
• Backlog Refinement: Challenge requirements early to prevent defects before developers write code.
• Sprint Retrospective: Highlight testing bottlenecks and propose automated tooling improvements.`,
    tl: `Ang aking ginagampanan sa Agile Scrum ceremonies:
• Sprint Planning: Pagtantiya ng QA story points, paggawa ng acceptance criteria, at paghahanda ng test data.
• Daily Standup: Pagbabahagi ng na-test kahapon, itetest ngayon, at mga blocking issues.
• Backlog Refinement: Maagang pagbusisi sa requirements bago pa man simulan ang coding.
• Sprint Retrospective: Pagbibigay ng mungkahi kung paano mapapabilis ang release at testing process.`,
  },

  // =========================================================================
  // 115. GIT REBASE VS GIT MERGE
  // =========================================================================
  {
    id: "git_rebase_vs_merge",
    patterns: [
      /\b(git rebase vs git merge|when to use rebase|git rebase explained|difference between rebase and merge)\b/i,
      /\b(pagkakaiba ng git rebase at git merge|kailan ginagamit ang rebase|ano ang git rebase)\b/i,
    ],
    keywords: ["git rebase", "git merge", "git history", "linear history"],
    category: "process",
    en: `The difference:
• git merge: Combines branches by creating a dedicated merge commit. It preserves the complete historical timeline but can clutter git history with merge bubbles.
• git rebase: Moves your feature branch's base to the latest commit on develop/main, rewriting commits to produce a clean, linear history.

Rule of thumb: Use git rebase locally on your private feature branch to stay up to date; use git merge (via Pull Requests) for public shared branches.`,
    tl: `Ang pagkakaiba:
• git merge: Pinagsasama ang branches sa pamamagitan ng paggawa ng bagong merge commit. Nananatili ang buong timeline ngunit maaaring maging magulo ang history.
• git rebase: Inililipat ang base ng iyong feature branch sa dulo ng pinakabagong commit para maging tuwid at malinis ang git history.

Pamantayan: Gamitin ang rebase sa sarili mong feature branch para laging updated; gamitin ang merge sa public main branches sa pamamagitan ng Pull Request.`,
  },

  // =========================================================================
  // 116. TYPESCRIPT STRICT MODE BENEFITS
  // =========================================================================
  {
    id: "typescript_strict_mode_benefits",
    patterns: [
      /\b(why typescript strict mode|typescript benefits|noimplicitany|why use typescript)\b/i,
      /\b(bakit mahalaga ang typescript strict mode|bentahe ng typescript|bakit typescript gamit mo)\b/i,
    ],
    keywords: [
      "typescript strict mode",
      "typesafe",
      "noimplicitany",
      "strictnullchecks",
    ],
    category: "skills",
    en: `Enabling TypeScript strict mode catches an entire category of runtime errors during compilation:
• strictNullChecks: Prevents common "Cannot read property of undefined" crashes.
• noImplicitAny: Forces explicit typing, ensuring developers and QA understand API contracts.
• exactOptionalPropertyTypes: Prevents confusing undefined with absent object keys.
This reduces manual regression testing overhead significantly.`,
    tl: `Ang pag-enable ng TypeScript strict mode ay humuhuli sa napakaraming runtime errors bago pa i-run ang app:
• strictNullChecks: Pumipigil sa "Cannot read property of undefined" crashes.
• noImplicitAny: Pumupwersa sa malinaw na type definitions para alam ng lahat ang format ng data.
• exactOptionalPropertyTypes: Tinitiyak ang tamang handling ng optional properties.
Malaki ang nababawas nito sa oras ng pag-debug at manual testing.`,
  },

  // =========================================================================
  // 117. MIRAMS ASSET BARCODE & QR SCANNING WORKFLOW
  // =========================================================================
  {
    id: "mirams_asset_barcode_scanning",
    patterns: [
      /\b(mirams barcode|asset tracking in mirams|qr code scanning in mirams|how does mirams track assets)\b/i,
      /\b(paano ang barcode sa mirams|asset tracking sa mirams|qr code scanning sa asset)\b/i,
    ],
    keywords: [
      "mirams barcode",
      "qr code",
      "asset tracking",
      "barcode scanning",
    ],
    category: "projects",
    en: `In MIRAMS, assets are tracked through unique system-generated alphanumeric codes and QR labels:
1. When an asset is registered, a unique tag is assigned (e.g. \`MIR-IT-2026-0042\`).
2. Technicians scan the QR code via mobile devices to instantly open the asset's service history, assigned custodian, and maintenance logs.
3. Audits verify location and status with zero manual data entry errors.`,
    tl: `Sa MIRAMS, sinusubaybayan ang mga gamit gamit ang system-generated codes at QR labels:
1. Kapag nag-rehistro ng asset, binibigyan ito ng natatanging tag (hal. \`MIR-IT-2026-0042\`).
2. Ini-scan ng technicians ang QR code gamit ang phone para agad makita ang maintenance history at kung kanino naka-assign.
3. Madaling magsagawa ng imbentaryo nang walang pagkakamali sa manual typing.`,
  },

  // =========================================================================
  // 118. MIRAMS 8 OPERATIONAL ROLES BREAKDOWN
  // =========================================================================
  {
    id: "mirams_user_roles_breakdown",
    patterns: [
      /\b(mirams user roles|what are the 8 roles in mirams|mirams rbac roles|roles in mirams)\b/i,
      /\b(anong mga role sa mirams|8 roles ng mirams|rbac permissions sa mirams)\b/i,
    ],
    keywords: [
      "mirams roles",
      "8 roles",
      "rbac",
      "spatie permissions",
      "requester",
      "plant director",
    ],
    category: "projects",
    en: `MIRAMS implements 8 operational role tiers using Spatie Laravel Permissions:
1. General Requester: Submits asset requests & IT support tickets.
2. Department Head: Reviews and endorses requests from department staff.
3. IT Administrator: Manages hardware assignments, networking tickets, and system users.
4. Maintenance Technician: Handles scheduled repairs, equipment downtime, and calibration logs.
5. Warehouse Officer: Manages spare parts inventory and stock receipts.
6. Internal Auditor: Conducts compliance reviews and depreciation audits.
7. Plant Operations Director: Approves high-value equipment acquisitions.
8. System Superadmin: Complete platform administration and security settings.`,
    tl: `May 8 operational role tiers ang MIRAMS gamit ang Spatie Laravel Permissions:
1. General Requester: Humihingi ng gamit at nagpasa ng IT support tickets.
2. Department Head: Nag-aapruba ng requests ng kanyang departamento.
3. IT Administrator: Nangangasiwa sa hardware assignments at user accounts.
4. Maintenance Technician: Gumagawa ng repair at calibration logs.
5. Warehouse Officer: Nangangasiwa sa bodega at spare parts stock.
6. Internal Auditor: Nagsusuri sa compliance at depreciation ng kagamitan.
7. Plant Operations Director: Nag-aapruba sa mamahaling kagamitan ng planta.
8. System Superadmin: Kumpletong kontrol sa buong sistema at seguridad.`,
  },

  // =========================================================================
  // 119. NCAMIS STUDENT GRADING COMPUTATION & RECORD LOCKS
  // =========================================================================
  {
    id: "ncamis_student_grading_computation",
    patterns: [
      /\b(ncamis grading|how does ncamis compute grades|grade locking in ncamis|ncamis school system)\b/i,
      /\b(paano ang kwenta ng grades sa ncamis|grade computation sa ncamis|ncamis grading system)\b/i,
    ],
    keywords: [
      "ncamis grading",
      "grade computation",
      "deped formula",
      "record locks",
    ],
    category: "projects",
    en: `In NCAMIS, academic records are computed using DepEd Senior High School formulas:
1. Written Works, Performance Tasks, and Quarterly Assessments are weighted per track (STEM, ABM, HUMSS, TVL).
2. The system computes transmutation tables automatically.
3. Once the grading period closes, records are locked with cryptographic timestamps, requiring registrar authorization to unlock and edit.`,
    tl: `Sa NCAMIS, kinukwenta ang student grades batay sa DepEd Senior High School standards:
1. May kanya-kanyang weight ang Written Works, Performance Tasks, at Quarterly Exam para sa bawat strand (STEM, ABM, HUMSS, TVL).
2. Awtomatikong kinukwenta ang transmuted final grades.
3. Kapag natapos ang quarter, ila-lock ang grades para hindi na mabago nang walang pahintulot mula sa Registrar.`,
  },

  // =========================================================================
  // 120. NOBLECLASSICS SHOPPING CART PERSISTENCE
  // =========================================================================
  {
    id: "nobleclassics_cart_persistence",
    patterns: [
      /\b(nobleclassics cart|how does nobleclassics handle cart|cart persistence in nobleclassics)\b/i,
      /\b(paano gumagana ang cart sa nobleclassics|cart persistence sa online shop)\b/i,
    ],
    keywords: [
      "nobleclassics cart",
      "cart persistence",
      "session cart",
      "localstorage",
    ],
    category: "projects",
    en: `In NobleClassics, cart persistence is designed seamlessly for both guests and authenticated users:
• Guest Users: Cart items are saved in the browser session and local storage.
• Logged-in Users: Cart items synchronize with a MySQL database table (\`user_cart_items\`).
• Login Merging: When a guest logs in with an active local cart, items are merged with their saved database cart without duplicating quantities.`,
    tl: `Sa NobleClassics, pinamamahalaan ang cart para sa mga bisita at naka-login na users:
• Bisita (Guest): Nakatago ang items sa browser session at local storage.
• Naka-login: Naka-sync ang cart sa database table (\`user_cart_items\`).
• Pag-login: Kapag nag-login ang bisitang may laman ang cart, awtomatikong pinagsasama ang mga gamit sa kanyang account nang hindi nagdo-doble.`,
  },

  // =========================================================================
  // 121. FREELANCE VS FULL-TIME STATUS
  // =========================================================================
  {
    id: "freelance_vs_fulltime_status",
    patterns: [
      /\b(are you looking for full time or freelance|fulltime vs freelance|do you accept contracts)\b/i,
      /\b(naghahanap ka ba ng full time o freelance|tumatanggap ka ba ng contractual|full-time ka ba)\b/i,
    ],
    keywords: ["full time", "freelance", "contract", "employment type"],
    category: "about",
    en: `I am actively open to both full-time permanent positions and freelance/contract projects. My primary objective is delivering reliable software engineering and rigorous QA testing.`,
    tl: `Bukas ako sa parehong full-time permanenteng trabaho at freelance o contractual na mga proyekto. Ang pangunahin kong layunin ay makapagbigay ng de-kalidad na software at masusing QA testing.`,
  },

  // =========================================================================
  // 122. SALARY EXPECTATIONS & COMPENSATIONS
  // =========================================================================
  {
    id: "salary_expectations_flexible",
    patterns: [
      /\b(what is your expected salary|salary expectations|asking salary|compensation package)\b/i,
      /\b(magkano ang asking salary mo|expected salary mo|magkano sahod na gusto mo)\b/i,
    ],
    keywords: [
      "salary",
      "expected salary",
      "asking salary",
      "sahod",
      "compensation",
    ],
    category: "pricing",
    en: `My expected salary is competitive and in line with industry standards for junior QA testers and web developers in the Philippines. I am open to negotiation based on total compensation, growth opportunities, and remote benefits.`,
    tl: `Ang aking asking salary ay naaayon sa pamantayan ng industriya para sa junior QA testers at web developers sa Pilipinas. Bukas ako sa negosasyon depende sa kabuuang benepisyo at oportunidad sa kumpanya.`,
  },

  // =========================================================================
  // 123. PREFERRED OS & OPERATING SYSTEM ENVIRONMENT
  // =========================================================================
  {
    id: "preferred_os_dev_environment",
    patterns: [
      /\b(windows or mac or linux|what os do you use|preferred operating system|wsl2 ubuntu)\b/i,
      /\b(anong os gamit mo|windows ka ba o mac|linux o windows)\b/i,
    ],
    keywords: ["operating system", "windows", "linux", "wsl2", "macos"],
    category: "about",
    en: `I develop on Windows 11 leveraging WSL2 (Ubuntu Linux) for terminal-heavy workflows, Docker containers, and Node/PHP scripting, alongside native Windows browser testing.`,
    tl: `Gumagamit ako ng Windows 11 katuwang ang WSL2 (Ubuntu Linux) para sa mabilisang terminal commands, Docker containers, at backend tools, kasabay ng pagsusuri sa browser.`,
  },

  // =========================================================================
  // 124. OVERCOMING IMPOSTOR SYNDROME
  // =========================================================================
  {
    id: "handling_impostor_syndrome",
    patterns: [
      /\b(impostor syndrome|how do you deal with impostor syndrome|feeling inadequate in tech)\b/i,
      /\b(paano mo hinaharap ang impostor syndrome|nakakaramdam ka ba ng pagdududa sa sarili)\b/i,
    ],
    keywords: ["impostor syndrome", "confidence", "growth mindset", "learning"],
    category: "general",
    en: `I overcome self-doubt by focusing on evidence: tracking solved bugs, committing clean code regularly, acknowledging that no developer knows everything, and treating every error as a learning stepping stone.`,
    tl: `Hinaharap ko ang pagdududa sa sarili sa pamamagitan ng pagtingin sa mga nagawa: mga naayos na bugs, tuluy-tuloy na pag-aaral, at pagtanggap na walang programmer na alam ang lahat—bawat error ay pagkakataong matuto.`,
  },

  // =========================================================================
  // 125. FAVORITE TECH PODCASTS & EDUCATORS
  // =========================================================================
  {
    id: "favorite_tech_podcasts_youtubers",
    patterns: [
      /\b(favorite tech youtubers|tech podcasts you listen to|who do you learn from in tech)\b/i,
      /\b(sino pinapanood mo sa youtube tungkol sa coding|tech creators na gusto mo)\b/i,
    ],
    keywords: [
      "youtubers",
      "podcasts",
      "fireship",
      "primeagen",
      "kent c dodds",
      "traversy",
    ],
    category: "general",
    en: `I learn from creators and engineers like Fireship (architecture & trends), The Primeagen (performance & developer tooling), Web Dev Simplified (clean React patterns), and Kent C. Dodds (testing philosophy).`,
    tl: `Natututo ako mula sa mga kilalang tagapagturo tulad nina Fireship (trends at tech news), The Primeagen (performance at tools), Web Dev Simplified (React patterns), at Kent C. Dodds (testing best practices).`,
  },

  // =========================================================================
  // 126. CASUAL GAMING TITLES
  // =========================================================================
  {
    id: "casual_gaming_titles",
    patterns: [
      /\b(what video games do you play|favorite games|gamer ka ba|do you play games)\b/i,
      /\b(anong nilalaro mong games|naglalaro ka ba ng video games|paboritong laro)\b/i,
    ],
    keywords: ["games", "gaming", "video games", "laro"],
    category: "general",
    en: `During leisure time, I enjoy casual strategy games, sandbox building, and competitive esports titles that exercise analytical thinking and quick decision-making.`,
    tl: `Kapag may libreng oras, naglalaro ako ng casual strategy games, open-world building, at esports games na nagpapatalas ng diskarte at bilis ng pag-iisip.`,
  },

  // =========================================================================
  // 127. FAVORITE PROGRAMMING LANGUAGE
  // =========================================================================
  {
    id: "favorite_programming_language",
    patterns: [
      /\b(what is your favorite programming language|favorite coding language|typescript or php)\b/i,
      /\b(anong paborito mong programming language|paborito mong language sa coding)\b/i,
    ],
    keywords: ["favorite language", "typescript", "javascript", "php"],
    category: "skills",
    en: `TypeScript is my favorite programming language. The type safety, expressive interfaces, autocomplete support, and flexibility across both client and server make it an absolute joy to build with.`,
    tl: `TypeScript ang paborito kong programming language dahil sa type safety, malinaw na interfaces, mabilis na autocomplete, at kakayahang magamit sa parehong frontend at backend.`,
  },

  // =========================================================================
  // 128. FRONTEND VS BACKEND VERDICT
  // =========================================================================
  {
    id: "frontend_vs_backend_verdict",
    patterns: [
      /\b(do you prefer frontend or backend|frontend or backend|mas gusto mo ba frontend o backend)\b/i,
      /\b(mas gusto mo ba frontend o backend|alin mas gusto mo frontend o backend)\b/i,
    ],
    keywords: ["frontend vs backend", "preference", "ui", "api"],
    category: "skills",
    en: `I enjoy both equally for different reasons: Frontend provides the instant gratification of creating intuitive, responsive interfaces, while Backend provides the intellectual challenge of database modeling and data integrity.`,
    tl: `Gusto ko pareho: Sa Frontend masaya ang pagbuo ng malinis at magandang interface na nakikita agad ng tao, habang sa Backend naman ay nakatutok sa lohika ng database at seguridad ng data.`,
  },

  // =========================================================================
  // 129. WHY INFORMATION SYSTEMS DEGREE
  // =========================================================================
  {
    id: "why_information_systems_degree",
    patterns: [
      /\b(why did you choose information systems|why bsis|bsis vs cs|bsis vs it)\b/i,
      /\b(bakit information systems kinuha mo|bakit bsis|ano ang bsis kumpara sa it)\b/i,
    ],
    keywords: [
      "information systems",
      "bsis",
      "degree choice",
      "business and tech",
    ],
    category: "about",
    en: `I chose Information Systems because it sits right at the intersection of computer software and real business operations. It taught me not just how to code, but how systems deliver measurable business value and efficiency to organizations.`,
    tl: `Pinili ko ang Information Systems dahil pinagdurugtong nito ang software engineering at pamamalakad ng negosyo. Tinuruan ako nito kung paano bumuo ng software na tunay na kapaki-pakinabang sa operasyon ng kumpanya.`,
  },

  // =========================================================================
  // 130. HOW KENNU HANDLES OVERTIME
  // =========================================================================
  {
    id: "handling_overtime_willingness",
    patterns: [
      /\b(are you willing to work overtime|overtime willingness|can you do ot)\b/i,
      /\b(willing ka ba mag-?overtime|kaya mo ba mag-?ot kapag kailangan)\b/i,
    ],
    keywords: ["overtime", "ot", "extra hours", "crunch"],
    category: "about",
    en: `Yes, I am fully willing to work overtime when critical deadlines, product releases, or high-priority production incidents demand it, while valuing structured sprint planning to prevent unnecessary crunch.`,
    tl: `Oo, bukas at handa akong mag-overtime kapag may kritikal na release, deadline, o emergency incident, habang pinahahalagahan din ang maayos na plano sa sprint para maiwasan ang unneeded pagod.`,
  },

  // =========================================================================
  // 131. CLIENT TESTIMONIAL & WORK REPUTATION
  // =========================================================================
  {
    id: "client_testimonial_reputation",
    patterns: [
      /\b(how do colleagues describe you|work reputation|client feedback|work ethic)\b/i,
      /\b(paano ka ilarawan ng mga katrabaho mo|work ethic mo|reputasyon mo sa trabaho)\b/i,
    ],
    keywords: ["reputation", "work ethic", "feedback", "reliable"],
    category: "about",
    en: `Colleagues and mentors know me as detail-oriented, reliable, and calm under pressure. I test deeply, write clean maintainable code, and communicate proactively without ego.`,
    tl: `Inilalarawan ako ng aking mga guro at kasamahan bilang masusi, maaasahan, at kalmado kahit may deadline. Masusi akong sumuri, malinis magsulat ng code, at maayos makipag-usap sa team.`,
  },

  // =========================================================================
  // 132. HOW TO VIEW PROJECTS LIVE OR INSPECT CODE
  // =========================================================================
  {
    id: "how_to_view_projects_live",
    patterns: [
      /\b(where can i see your code|how to view your projects|live demo|github repositories)\b/i,
      /\b(saan makikita ang code mo|paano ma-view ang projects mo|live demo ng mga gawa mo)\b/i,
    ],
    keywords: ["view projects", "live demo", "code inspection", "github repos"],
    category: "projects",
    en: `You can explore my projects right here in the Projects section of this portfolio, or inspect the source repositories and commit histories directly on GitHub at https://github.com/elnarkennu16-440.`,
    tl: `Maaari mong makita ang aking mga gawa sa mismong Projects section ng portfolio na ito, o suriin ang source code at commits sa aking GitHub sa https://github.com/elnarkennu16-440.`,
  },
  // 43. ADVICE FOR ASPIRING BSIS, BSIT, BSCS STUDENTS
  // 45. ADVICE FOR ASPIRING IT/IS/CS STUDENTS
  // 45. ADVICE FOR ASPIRING IT/IS/CS STUDENTS
  {
    id: "aspiring_it_students",
    patterns: [
      /\b(What advice do you have for aspiring BSIS, BSIT, or BSCS students?|planning to take|incoming)\s+(bsis|bsit|bscs)\b/i,
      /\b(Anong payo mo para sa mga aspiring BSIS, BSIT, o BSCS students?|gusto ko mag|magti-take ako ng|kukuha ako ng)\s+(bsis|bsit|bscs)\b/i,
      /\b(advice|tips)\s+(for|sa)\s+(bsis|bsit|bscs|it students)\b/i,
      /\b(bsis vs bsit vs bscs|ano mas maganda bsis bsit bscs)\b/i,
      /\b(ano ang|what is)\s+(bsis|bsit|bscs)\b/i,
    ],
    keywords: [
      "What advice do you have for aspiring BSIS, BSIT, or BSCS students?",
      "ᴘᴀʏᴏ ᴘᴀʀᴀ ꜱᴀ ᴍɢᴀ ᴀꜱᴘɪʀɪɴɢ ɴᴀ ʙꜱɪꜱ, ʙꜱɪᴛ, ʙꜱᴄꜱ?",
      "ᴘɪᴇᴄᴇ ᴏꜰ ᴀᴅᴠɪᴄᴇ ꜰᴏʀ ᴀꜱᴘɪʀɪɴɢ ʙꜱɪꜱ, ʙꜱɪᴛ, ʙꜱᴄꜱ?",
    ],
    category: "general",
    en: "Choosing a path in technology is a solid decision, but success in college comes down to mindset and practice. Here is my practical advice for incoming students:\n\n1. 𝑼𝒏𝒅𝒆𝒓𝒔𝒕𝒂𝒏𝒅 𝒕𝒉𝒆 𝑭𝒐𝒄𝒖𝒔 – BSCS zeroes in on algorithms and computation, BSIT focuses on systems and infrastructure, while BSIS bridges technology with business strategy and user workflows.\n2. 𝑩𝒖𝒊𝒍𝒅 𝑩𝒆𝒚𝒐𝒏𝒅 𝒕𝒉𝒆 𝑪𝒍𝒂𝒔𝒔𝒓𝒐𝒐𝒎 – College teaches the fundamentals, but actual skill comes from working on your own projects and practicing real-world application early on.\n3. 𝑴𝒂𝒔𝒕𝒆𝒓 𝑭𝒖𝒏𝒅𝒂𝒎𝒆𝒏𝒕𝒂𝒍𝒔 𝑶𝒗𝒆𝒓 𝑯𝒚𝒑𝒆 – Don't chase every trending tool. Focus on core logic, clean code structure, and understanding how applications function from end to end.\n4. 𝑳𝒆𝒂𝒓𝒏 𝒕𝒐 𝑻𝒓𝒐𝒖𝒃𝒍𝒆𝒔𝒉𝒐𝒐𝒕 𝑰𝒏𝒅𝒆𝒑𝒆𝒏𝒅𝒆𝒏𝒕𝒍𝒚 – The most valuable tech skill is knowing how to debug problems, read documentation, and adapt when things don't work as expected.",
    tl: "Magandang desisyon ang pagpasok sa tech field, pero ang tunay na tagumpay sa kolehiyo ay nakadepende sa disiplina at praktis. Eto ang honest at direktang payo ko para sa mga bagong estudyante:\n\n1. 𝑨𝒍𝒂𝒎𝒊𝒏 𝒂𝒏𝒈 𝑵𝒂𝒈𝒌𝒂𝒌𝒂𝒊𝒃𝒂 – Ang BSCS ay nakatutok sa algorithms at theory, ang BSIT ay sa systems at infrastructure, habang ang BSIS naman ay ang pag-uugnay ng teknolohiya sa business strategy at user workflows.\n2. 𝑯𝒖𝒘𝒂𝒈 𝑴𝒂𝒂𝒔𝒂 𝑳𝒂𝒏𝒈 𝒔𝒂 𝑳𝒆𝒌𝒔𝒚𝒐𝒏 – Basehan lang ang itinuturo sa eskwelahan. Ang tunay na galing ay makukuha mo sa sariling praktis at paggawa ng sarili mong mga proyekto nang maaga.\n3. 𝑴𝒂𝒈-𝒇𝒐𝒄𝒖𝒔 𝒔𝒂 𝑭𝒖𝒏𝒅𝒂𝒎𝒆𝒏𝒕𝒂𝒍𝒔 – Huwag magpadala sa padami-daming bagong tools. Maging magaling sa core logic, malinis na pagsulat ng code, at sa tamang pag-unawa sa takbo ng software.\n4. 𝑴𝒂𝒕𝒖𝒕𝒐𝒏𝒈 𝑴𝒂𝒈-𝒔𝒐𝒍𝒗𝒆 𝑵𝒂𝒏𝒈 𝑴𝒂𝒈-𝒊𝒔𝒂 – Ang pinakamahalagang skill sa tech ay ang kakayahang mag-debug ng problema, magbasa ng documentation, at mag-adjust kapag may nagkakamali sa ginagawa mo.",
  },
];
