/**
 * Knowledge Base for Kennu Elnar's Portfolio AI Assistant
 * Kennu Elnar — Junior QA Tester & Full-Stack Web Developer
 *
 * Aesthetic & Tone: Cold, minimalist, hyper-professional, analytical, articulate.
 * Zero colloquial filler, zero cringe/jejemon phrasing, zero "Haha", zero informal slang.
 * Advanced vocabulary in both English and Filipino/Tagalog.
 * Covers 65+ comprehensive knowledge nodes spanning 200+ inquiry variations.
 */

export const KENNU_BIO = `
Name: Kennu Elnar
Role: Junior QA Tester & Web Developer (Full-Stack Capable)
Email: elnarkennu16@gmail.com
Phone: +63 09453870032
GitHub: https://github.com/elnarkennu16-440
Location: Philippines (Remote Ready, GMT+8)

Core Philosophy:
Integrates rigorous software verification methodologies with clean, scalable front-end and back-end architectural principles. Prioritizes defect elimination, end-user reliability, and minimal design friction.

Technical Disciplines:
1. Front-End:
   - Modern HTML5, Semantic CSS3, JavaScript (ES6+), React, TypeScript, Tailwind CSS, Python
2. Quality Assurance & Testing:
   - Manual & Exploratory Testing, Test Case Specification, Defect Lifecycle Triage, Playwright E2E Automation, Postman API Testing, Chrome DevTools Network/DOM Profiling
3. Systems & Tooling:
   - Git & GitHub, VS Code, Cursor, Vite, Laravel 11, MySQL, PostgreSQL, Spatie RBAC

Development Projects:
1. MIRAMS (Manufacturing Internal Request & Asset Management System) [2026]
   - Stack: React, TypeScript, Laravel 11, PostgreSQL/MySQL, Spatie RBAC, Tailwind CSS
2. NCAMIS (Northills College of Asia Management Information System) [2025]
   - Stack: PHP, JavaScript, Relational Database, RBAC
3. NobleClassics (Curated Literary E-Commerce Platform) [2024]
   - Stack: PHP, MySQL, JavaScript, CSS3, Multi-tier Checkout, Admin Inventory Suite

Curriculum Vitae:
- Available for direct retrieval in DOCX and PDF formats within the Capabilities module.
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
  // 1. IDENTITY OF ASSISTANT / NAME
  {
    id: "bot_name_identity",
    patterns: [
      /\b(ano.*(pangalan|name)|anong pangalan|what is your name|whats your name|what's your name|who are you|sino ka|sinong ka|anong tawag sa.*yo|pangalan mo)\b/i,
      /\b(what should i call you|identify yourself|who am i speaking with|who is this assistant)\b/i,
    ],
    keywords: [
      "pangalan",
      "name",
      "sino ka",
      "who are you",
      "tawag",
      "identity",
      "assistant",
    ],
    category: "general",
    en: "I am the dedicated AI Knowledge Engine and virtual assistant for Kennu Elnar's professional portfolio. My directive is to provide articulate, factual, and detailed information regarding Kennu's technical proficiencies, quality assurance methodologies, software systems, and professional background.",
    tl: "Ako ang opisyal na AI Knowledge Engine at virtual assistant para sa propesyonal na portfolio ni Kennu Elnar. Ang aking tungkulin ay maghatid ng tumpak, komprehensibo, at propesyonal na impormasyon hinggil sa mga teknikal na kakayahan, mga metodolohiya sa quality assurance, mga natapos na software system, at propesyonal na kredensyal ni Kennu.",
  },

  // 2. GREETINGS & FORMAL SALUTATIONS
  {
    id: "greeting",
    patterns: [
      /^(hi|hello|hey|kamusta|kumusta|musta|good day|good morning|good afternoon|good evening|magandang araw|greetings)\b/i,
      /\b(how do you do|greetings to you)\b/i,
    ],
    keywords: [
      "hello",
      "kamusta",
      "kumusta",
      "hi",
      "greetings",
      "magandang araw",
    ],
    category: "general",
    en: "Greetings. I am at your disposal to discuss Kennu Elnar's qualifications in Quality Assurance testing and Full-Stack web development. You may query specific project architectures, test methodologies, technical toolchains, or employment availability in English or Filipino.",
    tl: "Pagbati. Nakahanda akong magbahagi ng detalyadong impormasyon ukol sa mga kwalipikasyon ni Kennu Elnar sa larangan ng Quality Assurance testing at Full-Stack web development. Maaari kang sumangguni hinggil sa arkitektura ng kanyang mga proyekto, metodolohiya sa pagsusuri, o estado ng kanyang kasanayan.",
  },

  // 3. WHO IS KENNU ELNAR / COMPREHENSIVE OVERVIEW
  {
    id: "who_is_kennu",
    patterns: [
      /\b(who is kennu|sino si kennu|pakilala mo si kennu|tungkol kay kennu|about kennu|introduce kennu|background ni kennu|profile ni kennu)\b/i,
      /\b(tell me about kennu|give me an overview of kennu|kennu elnar background)\b/i,
    ],
    keywords: [
      "sino si kennu",
      "who is kennu",
      "about kennu",
      "pakilala",
      "background",
      "profile",
    ],
    category: "about",
    en: "Kennu Elnar is an analytical Junior Quality Assurance and Web Developer based in the Philippines. His core competence lies at the intersection of modern front-end web (React, TypeScript, Tailwind CSS) and systematic software quality assurance (exploratory testing, structured defect documentation, and Playwright end-to-end automation). He is committed to software reliability, structural precision, and eliminating production regressions.",
    tl: "Si Kennu Elnar ay isang analitikal na Junior Quality Assurance at Web Developer mula sa Pilipinas. Ang kanyang pangunahing kadalubhasaan ay nakapokus sa integrasyon ng modernong front-end web development (React, TypeScript, Tailwind CSS) at sistematikong quality assurance (exploratory testing, structured defect documentation, at Playwright automated testing). Layunin niyang tiyakin ang integridad, tibay, at kawalan ng mga depekto sa bawat software na kanyang binubuo at sinusuri.",
  },

  // 4. WHY CHOSEN CAREER / MOTIVATION / "BAKIT KAYA GANITO ANG GINUSTO MO?"
  {
    id: "why_chosen_career",
    patterns: [
      /\b(bakit.*(ganito|ito|ganyan).*ginusto)\b/i,
      /\b(bakit.*(pinili|ginusto|nagustuhan|pumasok).*(coding|tech|qa|web dev|developer|programming|testing|larangan|career))\b/i,
      /\b(bakit ka nag-developer|bakit ka nag-qa|bakit coding|bakit web dev|bakit ito pinili)\b/i,
      /\b(why did you choose (this|coding|qa|web development|tech)|motivation behind this|what inspired you)\b/i,
    ],
    keywords: [
      "ginusto",
      "pinili",
      "bakit coding",
      "bakit qa",
      "bakit ganito",
      "motivation",
      "inspiration",
      "career choice",
    ],
    category: "about",
    en: "Kennu deliberately selected software development and quality assurance due to his deep fascination with architectural problem-solving and systemic integrity. Early in his technical journey, he recognized that writing functional code constitutes merely one dimension of development; ensuring fault tolerance, accessibility, and resilience under unpredictable edge cases is what defines truly enterprise-grade software. This conviction drives his dual dedication to both building interfaces and meticulously validating their robustness.",
    tl: "Pinili ni Kennu ang larangan ng software development at quality assurance dahil sa kanyang matinding interes sa arkitektural na paglutas ng mga suliranin at integridad ng mga digital na sistema. Sa simula pa lamang ng kanyang pagsasanay, napagtanto niya na ang pagsusulat ng functional code ay kalahati lamang ng inhinyeriya; ang pagtiyak sa katatagan ng software, pagiging maaasahan nito, at pag-iwas sa mga kritikal na depekto ang tunay na nagpapatunay ng kalidad. Ang pananaw na ito ang nagtulak sa kanya upang pagsamahin ang pagbuo ng modernong web apps at masusing pagsusuri.",
  },

  // 5. WHY BOTH QA AND WEB DEVELOPER? / DUAL ROLE ADVANTAGE
  {
    id: "why_both_qa_and_dev",
    patterns: [
      /\b(bakit.*pareho\w*|bakit.*dalawa|bakit.*qa.*(dev|web|developer)|bakit.*dev.*qa|bakit.*developer.*tester)\b/i,
      /\b(why.*both.*(qa|developer|tester)|why.*both.*roles|dual role|hybrid)\b/i,
    ],
    keywords: [
      "bakit dalawa",
      "bakit pareho",
      "qa at dev",
      "both qa and dev",
      "dual role",
    ],
    category: "about",
    en: "Operating simultaneously as a QA tester and a web developer provides an asymmetric advantage. Traditional developers often design with happy-path assumptions, whereas QA analysts anticipate boundary failure modes. Because Kennu possesses practical fluency in React, TypeScript, and Laravel, he diagnoses defect root causes at the architectural layer rather than merely observing surface symptoms. Conversely, his QA discipline ensures defensive coding standards from the initial commit.",
    tl: "Ang sabay na pagganap bilang QA tester at web developer ay nagdudulot ng natatanging kalamangan sa inhinyeriya ng software. Kalimitang nakatuon ang tradisyunal na developer sa inaasahang daloy (happy path), habang ang isang QA analyst ay sinasanay na suriin ang mga hangganan at potensyal na pagkabigo ng sistema. Dahil may malalim na kaalaman si Kennu sa React, TypeScript, at Laravel, natutukoy niya ang ugat ng depekto sa mismong arkitektura ng code, at sabay na nakakapag-code nang may mataas na depensa laban sa mga posibleng bug.",
  },

  // 6. LEGIT OR SCAM / VERIFIABILITY / TRUST
  {
    id: "legit_or_scam",
    patterns: [
      /\b(scam|legit|totoo ba|tunay ba|peke ba|fake ba|scam ba si kennu|legit ba si kennu|mapagkakatiwalaan ba|trustworthy)\b/i,
      /\b(is kennu legit|are you a scam|is this real or a scam|can i trust you|is this real|real person)\b/i,
    ],
    keywords: [
      "scam",
      "legit",
      "totoo",
      "tunay",
      "peke",
      "trustworthy",
      "beripikado",
    ],
    category: "general",
    en: "Kennu Elnar is an authentic, verified software professional based in the Philippines. His professional credentials, source code architectures, and continuous commit histories are publicly auditable via his official GitHub repository (github.com/elnarkennu16-440). Furthermore, direct professional communication channels, including verified telephone (+63 09453870032) and institutional email (elnarkennu16@gmail.com), remain fully operational for verification purposes.",
    tl: "Beripikado at lehitimo ang propesyonal na pagkakakilanlan ni Kennu Elnar. Siya ay isang tunay na Quality Assurance at Web Developer na nakabase sa Pilipinas. Ang kanyang mga teknikal na kasanayan, commit history, at arkitektura ng mga proyekto—kabilang ang MIRAMS, NCAMIS, at NobleClassics—ay bukas at maaaring suriin sa kanyang opisyal na GitHub repository (github.com/elnarkennu16-440). Bukas din ang kanyang opisyal na linya sa telepono (+63 09453870032) at email (elnarkennu16@gmail.com) para sa beripikasyon.",
  },

  // 7. RELATIONSHIP STATUS / JOWA / SINGLE
  {
    id: "relationship_status",
    patterns: [
      /\b(jowa|girlfriend|gf|syota|may asawa|single ka|may jowa ka na|taken ka na ba|crush|status mo|in a relationship)\b/i,
      /\b(do you have a girlfriend|are you single|are you taken|do you have a partner|relationship status)\b/i,
    ],
    keywords: [
      "jowa",
      "girlfriend",
      "gf",
      "single",
      "taken",
      "relationship",
      "asawa",
    ],
    category: "general",
    en: "Kennu maintains strict professional discretion regarding personal matters. His primary operational focus remains centered on technical mastery, defect prevention, and the execution of high-standard web deliverables. Inquiries concerning software architecture, testing cycles, or collaborative contracts are given priority.",
    tl: "Pinapanatili ni Kennu ang mataas na antas ng propesyonalismo hinggil sa mga personal na usapin. Ang kanyang pangunahing atensyon ay nakalaan nang buo sa teknikal na kahusayan, pagsugpo sa mga depekto sa software, at pagpapatupad ng de-kalidad na web solutions. Binibigyang-prayoridad sa sistemang ito ang mga katanungang may kinalaman sa inhinyeriya at propesyonal na pakikipagtulungan.",
  },

  // 8. HAVE YOU EATEN / SUSTENANCE / "KUMAIN KA NA BA?"
  {
    id: "have_you_eaten",
    patterns: [
      /\b(kumain ka na|kumain ka na ba|kain na|kain tayo|gutom ka ba|anong ulam mo|nag-lunch ka na|nag-dinner ka na|almusal)\b/i,
      /\b(have you eaten|did you eat|are you hungry|let's eat|what's your food)\b/i,
    ],
    keywords: [
      "kumain",
      "kain",
      "gutom",
      "ulam",
      "lunch",
      "dinner",
      "eaten",
      "hungry",
    ],
    category: "general",
    en: "As an autonomous virtual interface, I operate strictly on server computations and require no organic sustenance. Regarding Kennu Elnar, he maintains a structured personal routine to ensure cognitive endurance and analytical sharpness during complex software testing and development cycles.",
    tl: "Bilang isang awtonomong digital interface, ang aking operasyon ay pinatatakbo ng computational logic at hindi nangangailangan ng organikong nutrisyon. Sa panig naman ni Kennu Elnar, pinapanatili niya ang disiplinadong iskedyul upang mapanatili ang mataas na antas ng konsentrasyon at analytical precision sa kanyang pagsubok at pagbuo ng software.",
  },

  // 9. SLEEP & REST / PUYAT / "MAY TULOG KA PA BA?"
  {
    id: "sleep_and_rest",
    patterns: [
      /\b(may tulog ka pa|natutulog ka pa ba|natulog ka ba|tulog tulog din|puyat ka ba|nagpupuyat ka|wala kang tulog)\b/i,
      /\b(do you sleep|do you ever sleep|have you slept|get some sleep|are you sleepy)\b/i,
    ],
    keywords: ["tulog", "puyat", "sleep", "sleepy", "resting", "pahinga"],
    category: "general",
    en: "This automated system maintains continuous uptime to process portfolio inquiries. For Kennu, maintaining intellectual sharpness is critical for detecting subtle boundary defects in software; consequently, he adheres to a disciplined rest and recovery schedule, while retaining the capacity for extended sprints when critical deployment milestones require it.",
    tl: "Ang automated assistant na ito ay nananatiling aktibo 24/7 para sa mga bisita ng portfolio. Sa panig ni Kennu, kinikilala niya na ang kalinawan ng pag-iisip ay kritikal sa pagtukoy ng mga masalimuot na depekto sa software, kung kaya't pinangangalagaan niya ang tamang balanse ng pahinga at disiplina sa trabaho, habang handang maglaan ng ibayong oras sa panahon ng mga kritikal na deployment.",
  },

  // 10. RATES AND PRICING / HOW MUCH / SINGIL
  {
    id: "rates_and_pricing",
    patterns: [
      /\b(magkano.*(bayad|singil|rate|presyo|fee|charge|sweldo|sahod))\b/i,
      /\b(rates|pricing|how much do you charge|what is your rate|hourly rate|project cost|presyo mo|magkano ka)\b/i,
    ],
    keywords: [
      "magkano",
      "rate",
      "singil",
      "bayad",
      "presyo",
      "pricing",
      "cost",
      "hourly",
    ],
    category: "pricing",
    en: "Kennu's compensation models are determined by technical scope, duration, and contractual engagement type. For Quality Assurance services (exploratory testing, test plan creation, regression suites, Playwright automation) and Front-End Development (React, TypeScript), engagements are structured on an hourly rate, milestone-based deliverable, or dedicated monthly retainer. Prospective partners may request an official proposal via elnarkennu16@gmail.com.",
    tl: "Ang istruktura ng singil at kompensasyon ni Kennu ay nakadepende sa saklaw ng teknikal na rekisito, haba ng proyekto, at uri ng kontrata. Para sa Quality Assurance (exploratory testing, test case documentation, Playwright automation) at Front-End Development (React, TypeScript), maaaring magkasundo sa hourly rate, milestone-based deliverables, o buwanang retainer. Maaaring magsumite ng pormal na kahilingan para sa pagtaya ng gastos sa elnarkennu16@gmail.com.",
  },

  // 11. TIGHT BUDGET / DISCOUNTS / NEGOTIATIONS
  {
    id: "tight_budget",
    patterns: [
      /\b(tight.*budget|maliit.*budget|walang budget|kulang sa budget|pwede.*tawad|may discount|installment|mura lang|budget friendly)\b/i,
      /\b(tight budget|low budget|can i get a discount|negotiable|can we negotiate|student discount|small budget)\b/i,
    ],
    keywords: [
      "budget",
      "tight",
      "tawad",
      "discount",
      "maliit",
      "mura",
      "negotiable",
      "installment",
    ],
    category: "pricing",
    en: "Engagements can be tailored to align with specified budgetary parameters. Kennu accommodates phased modular delivery—prioritizing core Minimal Viable Product (MVP) features or high-impact QA audits within initial phases, thereby maintaining uncompromising technical standards while observing financial constraints.",
    tl: "Maaaring isaayos ang saklaw ng trabaho upang umangkop sa mga itinakdang limitasyon sa badyet. Bukas si Kennu sa modular o phased deployment—kung saan inuuna ang pinakamahahalagang core features (MVP) o primaryang QA audit sa unang yugto, upang mapanatili ang integridad ng software nang hindi lumalagpas sa itinakdang pondo.",
  },

  // 12. E-COMMERCE & RESPONSIVE MOBILE APPLICATIONS
  {
    id: "ecommerce_mobile_apps",
    patterns: [
      /\b(e-commerce|ecommerce|online shop|online store|tindahan|shopping cart)\b/i,
      /\b(mobile app|cellphone|responsive|responsive ba|gumawa ng e-commerce|kaya mo ba gumawa ng e-commerce)\b/i,
      /\b(can you build an e-commerce|can you make mobile apps|online shop website)\b/i,
    ],
    keywords: [
      "ecommerce",
      "e-commerce",
      "mobile",
      "online shop",
      "cart",
      "checkout",
      "store",
      "responsive",
    ],
    category: "projects",
    en: "Kennu has demonstrated capability in e-commerce architecture through 'NobleClassics', a comprehensive digital bookstore incorporating shopping cart state management, multi-step transaction pipelines, dynamic catalog filters, and administrative inventory controls. In terms of mobile responsiveness, all interfaces adhere to strict mobile-first viewport benchmarks via Tailwind CSS, ensuring visual stability and touch ergonomics across iOS, Android, and desktop devices.",
    tl: "Napatunayan ni Kennu ang kanyang kakayahan sa arkitektura ng e-commerce sa pamamagitan ng 'NobleClassics'—isang online platform na nagtatampok ng dynamic shopping cart, multi-step checkout workflow, pamamahala ng imbentaryo, at admin analytics. Lahat ng kanyang gawa ay sumusunod sa mahigpit na pamantayan ng mobile-first responsive design gamit ang Tailwind CSS upang tiyakin ang maayos na operasyon sa anumang mobile at desktop viewport.",
  },

  // 13. FAVORITE TECH STACK / LANGUAGES
  {
    id: "favorite_tech_stack",
    patterns: [
      /\b(favorite.*(tech|stack|language|framework|programming|tool)|paborito|anong pinakagusto mo|ano favorite mo)\b/i,
      /\b(what is your favorite language|favorite tech stack|what do you prefer using)\b/i,
    ],
    keywords: [
      "favorite",
      "paborito",
      "tech stack",
      "programming language",
      "preferred",
    ],
    category: "skills",
    en: "Kennu's primary technical preference centers on the React, TypeScript, and Tailwind CSS ecosystem on the client tier, complemented by Laravel (PHP) or Node.js on the server layer. TypeScript is valued specifically for its static type guarantees, which mitigate runtime defects prior to compilation. In Quality Assurance, his preferred toolchain comprises Playwright for headless browser automation, Postman for API contract verification, and Chrome DevTools for runtime profiling.",
    tl: "Ang pangunahing teknikal na pagpili ni Kennu ay nakasandig sa React, TypeScript, at Tailwind CSS sa client tier, katuwang ang Laravel (PHP) o Node.js sa backend. Pinahahalagahan niya ang TypeScript dahil sa kakayahan nitong sumala ng mga type errors bago pa man mag-execute ang aplikasyon. Sa larangan naman ng QA, pinipili niya ang Playwright para sa automated browser testing, Postman para sa API validation, at Chrome DevTools para sa malalimang inspeksyon ng DOM at network performance.",
  },

  // 14. HARDEST BUG ENCOUNTERED / TECHNICAL TRIAGE
  {
    id: "hardest_bug_encountered",
    patterns: [
      /\b(pinakamahirap na bug|pinakamalalang bug|hardest bug|toughest bug|worst bug|tricky bug|nakakabaliw na bug)\b/i,
      /\b(what is the hardest bug you solved|biggest bug you found|debugging experience)\b/i,
    ],
    keywords: [
      "pinakamahirap na bug",
      "hardest bug",
      "toughest bug",
      "tricky bug",
      "debugging",
    ],
    category: "qa",
    en: "During the of MIRAMS, Kennu encountered a race condition involving asynchronous session token invalidation within Spatie RBAC during rapid multi-tab navigation. Authorized personnel received intermittent HTTP 403 Forbidden responses. Kennu isolated the fault by profiling network payloads, inspecting stale middleware cache headers, and authoring an automated reproduction scenario in Playwright. He refactored the permission validation pipeline, proving that the most severe defects stem from state synchronization rather than trivial syntax errors.",
    tl: "Sa pagbuo ng enterprise system na MIRAMS, nasaksihan ni Kennu ang isang asynchronous race condition sa Spatie RBAC kung saan ang mabilisang paglipat ng mga tabs ay nagdudulot ng pasumpol-sumpong na HTTP 403 Forbidden sa mga awtorisadong gumagamit. Tinukoy niya ang depekto sa pamamagitan ng masusing network packet profiling sa DevTools at pagsulat ng automated script sa Playwright upang kopyahin ang bug. Inayos niya ang middleware cache synchronization, na nagpatunay na ang mga pinakamalulubhang depekto ay nagmumula sa estado at timing ng data.",
  },

  // 15. PORTFOLIO MINIMALIST THEME / AESTHETIC PHILOSOPHY
  {
    id: "website_design_theme",
    patterns: [
      /\b(bakit ganito.*(theme|design|itsura|kulay|style|hitsura)|minimalist|black and white|monochrome)\b/i,
      /\b(why is the design like this|why minimalist|why black and white|design philosophy of this site)\b/i,
    ],
    keywords: [
      "theme",
      "design",
      "minimalist",
      "black and white",
      "monochrome",
      "aesthetic",
      "itsura",
    ],
    category: "about",
    en: "This portfolio employs a high-contrast editorial aesthetic governed by typographic discipline and monochrome neutrality. The visual restraint eliminates superfluous ornamentation, ensuring that architectural data, test artifacts, and technical proficiencies remain the focal point. This clean execution directly reflects the professional ethos of Quality Assurance: clarity, precision, and structural rigor.",
    tl: "Ang portfoliong ito ay dinisenyo gamit ang high-contrast editorial aesthetic na nakabatay sa disiplina ng tipograpiya at monochrome neutrality. Ang pag-aalis ng mga hindi kinakailangang palamuti ay sinasadya upang mabigyang-diin ang teknikal na nilalaman, arkitektura ng mga sistema, at kasanayan sa pagsusuri. Ang malinis na biswal na anyo ay direktang sumasalamin sa disiplina ng Quality Assurance: kalinawan, katumpakan, at estruktural na kaayusan.",
  },

  // 16. LEARNING TRAJECTORY / SELF-TAUGHT OR FORMAL
  {
    id: "how_did_you_learn",
    patterns: [
      /\b(paano ka natuto|self-taught ka ba|paano ka nag-aral|saan ka natuto|how did you learn|self taught)\b/i,
      /\b(how did you learn to code|learning journey|how did you get into qa)\b/i,
    ],
    keywords: [
      "natuto",
      "self-taught",
      "learning",
      "aral",
      "how did you learn",
      "journey",
    ],
    category: "about",
    en: "Kennu's competence is forged through a dual trajectory: structured academic instruction in Information Systems combined with rigorous autodidactic software development. Beyond academic theory, his applied mastery in React, TypeScript, and Playwright automation was developed through real-world system architecture, continuous analysis of open-source standards, and hands-on defect triage in production-grade codebases.",
    tl: "Ang kahusayan ni Kennu ay nagmula sa pagsasama ng pormal na akademikong pundasyon sa Information Systems at disiplinadong sariling pagsasanay (autodidactic learning). Bukod sa teorya sa unibersidad, ang kanyang praktikal na kasanayan sa React, TypeScript, at Playwright automation ay nahasa sa pamamagitan ng aktwal na pagbuo ng mga kumplikadong sistema at malawakang pagsusuri ng mga depekto sa software.",
  },

  // 17. TEAM COLLABORATION & SOLO AUTONOMY
  {
    id: "teamwork_vs_solo",
    patterns: [
      /\b(solo ka ba|marunong ka ba sa team|team player|teamwork|kaya mo ba mag-work with a team|solo developer)\b/i,
      /\b(can you work in a team|teamwork skills|do you work alone or in a team|collaboration)\b/i,
    ],
    keywords: [
      "team",
      "solo",
      "teamwork",
      "team player",
      "collaboration",
      "samahan",
    ],
    category: "about",
    en: "Kennu operates effectively both as an autonomous individual contributor and as an integrated member of multidisciplinary agile teams. He is proficient in Git pull-request workflows, code review etiquette, precise acceptance criteria formulation, and constructive defect documentation that fosters seamless developer collaboration without friction.",
    tl: "Epektibong nakapagtatrabaho si Kennu bilang independiyenteng tagapagpatupad at bilang katuwang sa loob ng isang agile development team. Kabisado niya ang mga standard sa Git branching, peer code reviews, malinaw na dokumentasyon ng bug reports, at propesyonal na pakikipag-ugnayan sa mga kapwa developer, product manager, at UI/UX designers nang may respeto at linaw.",
  },

  // 18. IMMEDIATE AVAILABILITY / ONBOARDING
  {
    id: "availability_start_date",
    patterns: [
      /\b(kailan ka pwede magsimula|available ka ba agad|start date|kailan ka pwede mag-start|immediately available)\b/i,
      /\b(when can you start|are you available immediately|start immediately|earliest start date)\b/i,
    ],
    keywords: [
      "start date",
      "magsimula",
      "available agad",
      "immediately",
      "when can you start",
    ],
    category: "contact",
    en: "Kennu is available for immediate operational onboarding. His development workstation and continuous integration testing tools are fully provisioned, enabling rapid integration into ongoing sprint cycles for either Quality Assurance verification or front-end implementation. Formal onboarding inquiries should be directed to elnarkennu16@gmail.com.",
    tl: "Nakahanda si Kennu para sa agarang onboarding (immediate availability). Ang kanyang development workstation at mga kagamitan sa pagsusuri ay kumpleto at naka-setup na, na nagbibigay-daan sa mabilis na pagpasok sa mga umiiral na sprint cycle para sa QA verification o front-end development. Maaaring magpadala ng pormal na abiso sa elnarkennu16@gmail.com.",
  },

  // 19. HOBBIES & OFF-DUTY PURSUITS
  {
    id: "hobbies_free_time",
    patterns: [
      /\b(free time|hobbies|libangan|anong ginagawa mo kapag walang coding|weekend|ano pinagkakaabalahan|trip mo gawin)\b/i,
      /\b(what do you do in your free time|what are your hobbies|interests outside coding)\b/i,
    ],
    keywords: [
      "free time",
      "hobbies",
      "libangan",
      "weekend",
      "interes",
      "outside coding",
    ],
    category: "about",
    en: "Outside active hours, Kennu engages in analytical gaming, monitors advancements in software architectures, explores emerging UI paradigms, and maintains physical balance. Structured cognitive decompression ensures peak mental acuity during rigorous test cycles and code reviews.",
    tl: "Sa labas ng kanyang oras sa inhinyeriya, pinapanatili ni Kennu ang talas ng pag-iisip sa pamamagitan ng pagsubaybay sa mga pinakabagong pag-unlad sa teknolohiya, mga bagong arkitektura sa UI, at analytical gaming. Ang tamang balanse sa buhay ay nagtitiyak na nananatiling matalas ang kanyang paningin sa pagsusuri ng mga kumplikadong test cases.",
  },

  // 20. PERFORMANCE UNDER PRESSURE & DEADLINES
  {
    id: "pressure_and_deadlines",
    patterns: [
      /\b(pressure|tight deadline|under pressure|stress|nagpa-panic ka ba|kaya mo ba mag-handle ng pressure)\b/i,
      /\b(can you work under pressure|tight deadlines|how do you handle stress|fast-paced)\b/i,
    ],
    keywords: [
      "pressure",
      "deadline",
      "stress",
      "panic",
      "under pressure",
      "fast-paced",
    ],
    category: "about",
    en: "Kennu manages high-pressure scenarios through systematic triage and objective risk analysis. In critical deployment windows, emotional reaction is replaced with structured execution: identifying critical blockers, validating smoke test suites, and communicating transparent status metrics to project stakeholders.",
    tl: "Hinaharap ni Kennu ang mga sitwasyong may mataas na presyon sa pamamagitan ng sistematikong pagsala ng mga panganib at lohikal na pagpapasya. Sa mga kritikal na sandali bago ang release, pinaiiral niya ang obhetibong pamamaraan: pagtukoy sa mga pinakamalulubhang blocker, pagsasagawa ng mahahalagang smoke tests, at malinaw na pakikipag-ugnayan sa mga kinauukulan.",
  },

  // 21. WORKING HOURS / TIMEZONES / SHIFTS
  {
    id: "working_hours_shifts",
    patterns: [
      /\b(flexible ba ang oras|night shift|working hours|shifting|oras mo|timezone|kaya mo ba panggabi)\b/i,
      /\b(are your hours flexible|can you work night shifts|timezone flexibility|working schedule)\b/i,
    ],
    keywords: [
      "flexible",
      "oras",
      "night shift",
      "shifting",
      "timezone",
      "schedule",
      "panggabi",
    ],
    category: "contact",
    en: "Kennu's operational schedule accommodates global timezones. Located in the Philippines (GMT+8), he offers flexible scheduling arrangements, including overlap with North American, European, or Asia-Pacific business hours, as well as night-shift rotations depending on contractual mandates.",
    tl: "Ang oras ng pagtatrabaho ni Kennu ay umaangkop sa iba't ibang timezone sa buong mundo. Bagamat nakabase siya sa Pilipinas (GMT+8), handa siyang magtrabaho sa ilalim ng flexible hours, kabilang ang pakikipagsabayan sa mga kliyente sa Hilagang Amerika, Europa, o Asya-Pasipiko, maging sa night shift kung kinakailangan.",
  },

  // 22. COMPETITIVE EDGE / WHY HIRE KENNU
  {
    id: "why_choose_kennu_edge",
    patterns: [
      /\b(pinagkaiba mo sa iba|bakit ikaw|bakit ikaw ang dapat piliin|edge mo|advantage mo|bakit ka namin tatanggapin)\b/i,
      /\b(why should we hire you|what makes you unique|why choose you over others|your competitive advantage)\b/i,
    ],
    keywords: [
      "pinagkaiba",
      "bakit ikaw",
      "edge",
      "advantage",
      "unique",
      "why choose you",
    ],
    category: "about",
    en: "Kennu's distinct value proposition lies in his dual-competency profile. While pure developers may fail to predict edge-case anomalies and pure QA testers may struggle to comprehend framework internals, Kennu bridges both domains. He isolates software anomalies directly to their underlying code construct and develops web components with built-in defensive validation.",
    tl: "Ang natatanging kalamangan ni Kennu ay ang kanyang pinagsamang kakayahan sa development at quality assurance. Habang ang ibang developer ay posibleng hindi makakita ng mga boundary failure, at ang ilang testers ay limitado sa panlabas na UI, kayang tukuyin ni Kennu ang mismong dahilan ng sira sa loob ng code at magpatupad ng defensive programming bago pa man magkaroon ng problema.",
  },

  // 23. RESPONSE TIME & FASTEST CONTACT CHANNELS
  {
    id: "fastest_contact_reply",
    patterns: [
      /\b(mabilis ka ba mag-reply|saan ka pinakamabilis ma-contact|saan kita kakausapin|active ka ba|reply time)\b/i,
      /\b(how fast do you reply|fastest way to reach you|how to contact you quickly|response time)\b/i,
    ],
    keywords: [
      "mabilis mag-reply",
      "saan ma-contact",
      "response time",
      "fastest way",
      "reply time",
    ],
    category: "contact",
    en: "The expedited route for professional contact is direct email via elnarkennu16@gmail.com, which is monitored continuously during operational hours. For urgent business inquiries, telephonic contact or SMS via +63 09453870032 yields immediate verification.",
    tl: "Ang pinakamabilis na paraan ng pakikipag-ugnayan kay Kennu ay sa pamamagitan ng kanyang opisyal na email sa elnarkennu16@gmail.com, na regular na binabantayan. Para sa mga agarang tawag o beripikasyon, maaaring direktang tumawag o mag-text sa +63 09453870032.",
  },

  // 24. PROJECT NOMENCLATURE & BACKSTORY
  {
    id: "project_names_backstory",
    patterns: [
      /\b(saan nanggaling ang.*(mirams|ncamis|nobleclassics|pangalan))\b/i,
      /\b(meaning ng.*(mirams|ncamis|nobleclassics)|ano ibig sabihin ng mirams|ano meaning ng ncamis)\b/i,
      /\b(what does mirams stand for|what does ncamis mean|origins of project names)\b/i,
    ],
    keywords: [
      "meaning ng mirams",
      "ncamis meaning",
      "nobleclassics",
      "saan galing ang pangalan",
    ],
    category: "projects",
    en: "The project designations reflect their systemic objectives:\n• MIRAMS: Manufacturing Internal Request & Asset Management System—an enterprise management solution for industrial hardware tracking.\n• NCAMIS: Northills College of Asia Management Information System—an academic institutional database.\n• NobleClassics: Derived from timeless literary titles, embodying an elegant, frictionless digital bookstore.",
    tl: "Ang mga pangalan ng proyekto ay sumasalamin sa kanilang partikular na layunin:\n• MIRAMS: Acronym para sa 'Manufacturing Internal Request & Asset Management System'—dinisenyo para sa enterprise hardware lifecycle at IT helpdesk.\n• NCAMIS: 'Northills College of Asia Management Information System'—isang plataporma para sa academic records at enrollment.\n• NobleClassics: Hango sa mga walang-kupas na obrang pampanitikan, binuo bilang isang modernong e-commerce bookstore.",
  },

  // 25. GEOGRAPHIC LOCATION & REMOTE INFRASTRUCTURE
  {
    id: "exact_location_ph",
    patterns: [
      /\b(saan ka exact.*nakatira|taga-saan ka sa pilipinas|taga saan ka|anong probinsya|saan lugar mo)\b/i,
      /\b(where in the philippines are you|exact location|which city do you live in)\b/i,
    ],
    keywords: [
      "nakatira",
      "taga saan",
      "probinsya",
      "lugar",
      "location",
      "pilipinas",
    ],
    category: "about",
    en: "Kennu is situated in the Philippines and operates from a fully configured private workspace equipped with high-bandwidth fiber internet and redundant power contingency. His infrastructure is optimized for 100% remote asynchronous and synchronous global collaboration.",
    tl: "Si Kennu ay nakabase sa Pilipinas at nagpapatakbo ng kanyang mga gawain mula sa isang modernong workstation na may mabilis na fiber internet at backup power. Ang kanyang imprastraktura ay ganap na nakahanda para sa 100% remote na pakikipagtulungan sa mga kumpanya sa buong mundo.",
  },

  // 26. NON-DISCLOSURE AGREEMENTS (NDA) & CONFIDENTIALITY
  {
    id: "nda_confidentiality",
    patterns: [
      /\b(nda|non-disclosure|confidentiality|mag-sign ng nda|sikreto ng kumpanya|privacy)\b/i,
      /\b(can you sign an nda|non disclosure agreement|data privacy|confidential)\b/i,
    ],
    keywords: ["nda", "non-disclosure", "confidentiality", "privacy", "secret"],
    category: "contact",
    en: "Kennu strictly complies with industry confidentiality protocols and intellectual property safeguards. He executes standard Non-Disclosure Agreements (NDAs) prior to inspecting proprietary software repositories or internal business documentation.",
    tl: "Mahigpit na itinataguyod ni Kennu ang mga pamantayan sa data security at proteksyon ng intellectual property. Handa siyang lumagda sa mga pormal na Non-Disclosure Agreement (NDA) bago suriin ang anumang proprietary code o kompidensyal na dokumentasyon ng kliyente.",
  },

  // 27. SOURCE CODE REPOSITORIES & LIVE PROOFS
  {
    id: "github_demo_links",
    patterns: [
      /\b(live demo|github link|san makikita ang gawa|source code|makikita ang code|open source)\b/i,
      /\b(where can i see your code|github profile link|live demo link|repositories)\b/i,
    ],
    keywords: ["live demo", "github", "source code", "repositories", "links"],
    category: "projects",
    en: "Kennu's primary software systems and architectural commits are publicly inspectable via his GitHub profile (https://github.com/elnarkennu16-440):\n• MIRAMS: github.com/elnarkennu16-440/MIRAMS-ENTERPRISE-SYSTEM\n• NCAMIS: github.com/elnarkennu16-440/NCAMIS-SHS\n• NobleClassics: github.com/elnarkennu16-440/E-COMMERCE-NOBLECLASSICS",
    tl: "Ang lahat ng pangunahing proyekto at commit history ni Kennu ay bukas para sa pagsusuri sa kanyang opisyal na GitHub (https://github.com/elnarkennu16-440):\n• MIRAMS: github.com/elnarkennu16-440/MIRAMS-ENTERPRISE-SYSTEM\n• NCAMIS: github.com/elnarkennu16-440/NCAMIS-SHS\n• NobleClassics: github.com/elnarkennu16-440/E-COMMERCE-NOBLECLASSICS",
  },

  // 28. CAREER ASPIRATIONS & LONG-TERM OBJECTIVES
  {
    id: "career_goals_aspirations",
    patterns: [
      /\b(pangarap|future goals|aspirations|ambisyon|ano pangarap mo|5 years from now|long term goal)\b/i,
      /\b(what are your career goals|where do you see yourself|future aspirations|career dream)\b/i,
    ],
    keywords: [
      "pangarap",
      "future goals",
      "ambisyon",
      "aspirations",
      "long term",
    ],
    category: "about",
    en: "Kennu's long-term objective is progression toward Lead Quality and Enterprise Systems Architect roles. He aims to architect resilient, mission-critical digital infrastructures, institute high-velocity continuous automated QA pipelines, and mentor emerging technical talent.",
    tl: "Ang pangmatagalang layunin ni Kennu ay umangat patungo sa posisyon ng Lead Quality at Enterprise Systems Architect. Nais niyang magdisenyo ng mga matitibay na sistemang ginagamit sa malalaking industriya, magtayo ng automated CI/CD testing pipelines, at magbahagi ng kaalaman sa kapwa inhinyero.",
  },

  // 29. MANUAL TESTING VS AUTOMATION STRATEGY
  {
    id: "manual_vs_automation_qa",
    patterns: [
      /\b(manual test lang|puro automation ka ba|kaya mo ba manual testing|manual vs automation)\b/i,
      /\b(do you only do manual testing|do you only do automation|manual testing capabilities)\b/i,
    ],
    keywords: [
      "manual test",
      "automation",
      "exploratory",
      "playwright",
      "manual testing",
    ],
    category: "qa",
    en: "Kennu advocates for a balanced testing pyramid. Manual exploratory testing remains indispensable for identifying qualitative UX friction, edge-case logical anomalies, and visual regressions. Concurrently, automated suites via Playwright and Postman handle repetitive regression verification, optimizing both velocity and test depth.",
    tl: "Itinataguyod ni Kennu ang balanseng diskarte sa pagsubok ng software. Ang manual exploratory testing ay hindi mapapalitan pagdating sa pagsusuri ng visual UX issues at kakaibang gawi ng gumagamit. Kasabay nito, ginagamit niya ang Playwright at Postman upang i-automate ang mga regression test at matiyak ang mabilisang beripikasyon sa bawat update.",
  },

  // 30. CONSTRUCTIVE CRITICISM & CODE REVIEWS
  {
    id: "handling_feedback_rejection",
    patterns: [
      /\b(feedback|criticism|rejection|paano ka mag-handle ng feedback|napagsasabihan|growth mindset)\b/i,
      /\b(how do you handle feedback|constructive criticism|how do you deal with mistakes|growth mindset)\b/i,
    ],
    keywords: [
      "feedback",
      "criticism",
      "rejection",
      "growth mindset",
      "pagkakamali",
    ],
    category: "about",
    en: "Kennu approaches technical feedback with analytical objectivity and zero ego. In Quality Assurance, critique constitutes an essential instrument for software hardening. Peer reviews and architectural critiques are treated as actionable data points to refine implementation standards and permanently prevent recurrence.",
    tl: "Tinatanggap ni Kennu ang teknikal na puna at feedback nang may mataas na antas ng obhetibismo at walang personal na emosyon. Sa larangan ng QA, ang pagsusuri at puna ang pundasyon ng pagpapatibay ng software. Ang bawat mungkahi ay agad na sinusuri at ipinapatupad upang maiangat ang kalidad ng sistema.",
  },

  // 31. DETAILED SKILLS & TECH ARSENAL
  {
    id: "skills_and_stack",
    patterns: [
      /\b(skills|technologies|tech stack|what can you do|capabilities|programming languages|tools|ano ang kakayahan|mga skills|ano gamit mong tools)\b/i,
    ],
    keywords: [
      "skills",
      "kakayahan",
      "tech stack",
      "tools",
      "languages",
      "technologies",
    ],
    category: "skills",
    en: "Kennu's technical competencies include:\n\n• Web Languages & Frameworks: HTML5, CSS3, JavaScript (ES6+), React, TypeScript, Tailwind CSS, Python\n• Quality Assurance: Manual Exploratory Testing, Functional & Regression Testing, Defect Lifecycle Documentation, Playwright E2E Automation, Postman API Testing, Chrome DevTools\n• Infrastructure & Tooling: Git, GitHub, VS Code, Cursor, Vite, Laravel 11, Spatie RBAC, MySQL, PostgreSQL",
    tl: "Ang mga teknikal na kasanayan ni Kennu ay kinabibilangan ng:\n\n• Web Development: HTML5, CSS3, JavaScript (ES6+), React, TypeScript, Tailwind CSS, Python\n• Quality Assurance: Manual Exploratory Testing, Functional & Regression Testing, Defect Documentation, Playwright E2E Automation, Postman API Verification, Chrome DevTools\n• Tooling at Database: Git, GitHub, VS Code, Cursor, Vite, Laravel 11, Spatie RBAC, MySQL, PostgreSQL",
  },

  // 32. QA METHODOLOGY & DEFECT REPORTING STANDARDS
  {
    id: "qa_methodology",
    patterns: [
      /\b(qa|testing|test case|tester|quality assurance|bug report|defect|playwright|regression|exploratory|manual test|paano ka mag-test|paano mag-qa)\b/i,
    ],
    keywords: [
      "qa",
      "testing",
      "test case",
      "bug report",
      "defect",
      "playwright",
      "exploratory",
    ],
    category: "qa",
    en: "Kennu executes quality assurance through a disciplined tripartite framework:\n1. Exploratory Testing: Rigorous boundary value probing to uncover layout distortions and unhandled exceptions.\n2. Defect Specification: Logging actionable defect tickets containing exact reproduction sequences, environmental parameters, actual vs. expected results, and console network logs.\n3. Regression Automation: Crafting Playwright end-to-end test suites and validating RESTful endpoints via Postman.",
    tl: "Isinasagawa ni Kennu ang quality assurance gamit ang sistematikong balangkas:\n1. Exploratory Testing: Masusing pagsubok sa mga limitasyon ng system upang makita ang mga hindi inaasahang error.\n2. Defect Documentation: Pagsulat ng malinaw na bug reports na naglalaman ng eksaktong hakbang sa pag-reproduce, environment data, inaasahang resulta kumpara sa aktwal, at console network logs.\n3. Automation & Verification: Pagbuo ng Playwright regression scripts at pagsubok sa REST API endpoints gamit ang Postman.",
  },

  // 33. PROJECTS PORTFOLIO OVERVIEW
  {
    id: "projects_overview",
    patterns: [
      /\b(projects|works|portfolio|project|gawa mong system|mga gawa mo|systems|past work)\b/i,
    ],
    keywords: [
      "projects",
      "mga gawa",
      "portfolio",
      "systems",
      "past work",
      "proyekto",
    ],
    category: "projects",
    en: "Kennu has developed and tested three flagship systems:\n1. MIRAMS (2026): Enterprise Manufacturing Internal Request & Asset Management System with 8 distinct user tiers, IT ticketing, and Spatie RBAC (React, TypeScript, Laravel 11).\n2. NCAMIS (2025): College Management Information System managing grading structures and student records.\n3. NobleClassics (2024): Digital bookstore platform featuring shopping cart workflows, checkout processing, and inventory controls.",
    tl: "Tatlong pangunahing sistema ang binuo at sinuri ni Kennu:\n1. MIRAMS (2026): Isang enterprise platform para sa electronics manufacturing na nagtatampok ng 8 operational roles, IT helpdesk, at Spatie RBAC (React, TypeScript, Laravel 11).\n2. NCAMIS (2025): Management Information System para sa Northills College of Asia na namamahala sa enrollment at student records.\n3. NobleClassics (2024): E-commerce bookstore na nagtatampok ng dynamic cart, order processing, at inventory administration.",
  },

  // 34. MIRAMS SYSTEM ARCHITECTURE
  {
    id: "project_mirams",
    patterns: [
      /\b(mirams|manufacturing|asset management|laravell 11|spatie)\b/i,
    ],
    keywords: [
      "mirams",
      "manufacturing",
      "asset management",
      "spatie",
      "laravel 11",
    ],
    category: "projects",
    en: "MIRAMS (Manufacturing Internal Request & Asset Management System) is an enterprise application in 2026. It tracks industrial equipment lifecycles, maintenance requests, and inter-department requisitions across 8 operational roles enforced by Spatie RBAC. Tech stack: React, TypeScript, Laravel 11, PostgreSQL/MySQL. Repository: github.com/elnarkennu16-440/MIRAMS-ENTERPRISE-SYSTEM",
    tl: "Ang MIRAMS ay isang enterprise asset management system na binuo noong 2026. Pinangangasiwaan nito ang lifecycle ng kagamitan sa pagawaan, IT requests, at supply maintenance sa ilalim ng 8 operational roles na pinangangalagaan ng Spatie RBAC. Binuo gamit ang React, TypeScript, Laravel 11, at PostgreSQL/MySQL. Repository: github.com/elnarkennu16-440/MIRAMS-ENTERPRISE-SYSTEM",
  },

  // 35. NCAMIS SYSTEM SPECIFICS
  {
    id: "project_ncamis",
    patterns: [/\b(ncamis|school|northills|senior high|student)\b/i],
    keywords: [
      "ncamis",
      "school",
      "northills",
      "senior high",
      "student records",
    ],
    category: "projects",
    en: "NCAMIS is an institutional academic management system designed for Northills College of Asia (2025). It consolidates student admission files, instructor grading submissions, and institutional administrative pipelines within a secure database architecture. Repository: github.com/elnarkennu16-440/NCAMIS-SHS",
    tl: "Ang NCAMIS ay isang academic management information system na ginawa para sa Northills College of Asia (2025). Pinagsasama-sama nito ang mga talaan ng admission ng estudyante, grading portals ng guro, at administrative workflows sa isang secure na database. Repository: github.com/elnarkennu16-440/NCAMIS-SHS",
  },

  // 36. NOBLECLASSICS SPECIFICS
  {
    id: "project_nobleclassics",
    patterns: [/\b(nobleclassics|bookstore|ecommerce|e-commerce|books)\b/i],
    keywords: ["nobleclassics", "bookstore", "books", "ecommerce", "cart"],
    category: "projects",
    en: "NobleClassics is a literary digital commerce platform (2024) with PHP, MySQL, JavaScript, and CSS3. It features shopping cart logic, multi-stage checkout flows, order confirmation tracking, and comprehensive inventory management. Repository: github.com/elnarkennu16-440/E-COMMERCE-NOBLECLASSICS",
    tl: "Ang NobleClassics ay isang online literary bookstore (2024) na binuo gamit ang PHP, MySQL, JavaScript, at CSS3. Nagtatampok ito ng shopping cart logic, checkout validation, real-time inventory management, at sales administration. Repository: github.com/elnarkennu16-440/E-COMMERCE-NOBLECLASSICS",
  },

  // 37. CURRICULUM VITAE / RESUME RETRIEVAL
  {
    id: "resume_download",
    patterns: [
      /\b(resume|cv|curriculum vitae|download cv|download resume|biodata|resume file|saan madodownload ang resume|paano i-download ang cv)\b/i,
    ],
    keywords: [
      "resume",
      "cv",
      "download cv",
      "biodata",
      "curriculum vitae",
      "download resume",
    ],
    category: "resume",
    en: "Kennu's official Curriculum Vitae is available for immediate download directly from the Capabilities section of this portfolio in both DOCX and PDF formats. Alternatively, an official copy can be requested via elnarkennu16@gmail.com.",
    tl: "Ang opisyal na Curriculum Vitae ni Kennu ay maaaring direktang ma-download mula sa seksyon ng Capabilities ng portfoliong ito sa mga format na DOCX at PDF. Maaari ring humiling ng direktang kopya sa pamamagitan ng email sa elnarkennu16@gmail.com.",
  },

  // 38. CONTACT DETAILS & RECRUITMENT
  {
    id: "contact_info",
    patterns: [
      /\b(contact|email|phone|reach|hire|get in touch|message|usap|paano ka makokontak|numero|telepono|kontak|address)\b/i,
    ],
    keywords: [
      "contact",
      "email",
      "phone",
      "reach",
      "hire",
      "kontak",
      "makakausap",
    ],
    category: "contact",
    en: "Professional contact channels for Kennu Elnar:\n• Email: elnarkennu16@gmail.com\n• Telephone / SMS: +63 09453870032\n• GitHub: https://github.com/elnarkennu16-440\n• Navigation Contact Interface: Accessible via the header bar for direct dispatch.",
    tl: "Mga opisyal na linya ng komunikasyon para kay Kennu Elnar:\n• Email: elnarkennu16@gmail.com\n• Telepono / SMS: +63 09453870032\n• GitHub: https://github.com/elnarkennu16-440\n• Contact Interface: Maaaring gamitin ang Contact button sa itaas upang mag-iwan ng agarang mensahe.",
  },

  // 39. EMPLOYMENT AVAILABILITY & CONTRACT TYPES
  {
    id: "available_for_work",
    patterns: [
      /\b(available|open for work|hire you|internship|full time|part time|freelance|looking for a job|puwede ka bang kunin|tumatanggap ka ba ng trabaho)\b/i,
    ],
    keywords: [
      "available",
      "open for work",
      "hire",
      "freelance",
      "full time",
      "trabaho",
      "job",
    ],
    category: "contact",
    en: "Kennu is actively available for professional hiring. He accepts inquiries for full-time roles, contractual QA engagements, and specialized front-end web development projects. Formal employment discussions can be arranged via elnarkennu16@gmail.com.",
    tl: "Aktibong bukas si Kennu para sa mga propesyonal na alok sa trabaho. Tumatanggap siya ng full-time employment, contractual QA audits, at front-end development projects. Maaaring magsumite ng panukala o makipag-ugnayan sa elnarkennu16@gmail.com.",
  },

  // 40. ACADEMIC CREDENTIALS & IT DEGREE
  {
    id: "education",
    patterns: [
      /\b(education|degree|school|course|study|graduate|nag-aral|paaralan|kurso|kolehiyo)\b/i,
    ],
    keywords: [
      "education",
      "degree",
      "school",
      "kurso",
      "nag-aral",
      "kolehiyo",
      "course",
    ],
    category: "about",
    en: "Kennu holds formal educational training in Information Systems, focusing on software systems analysis, web development, and database architecture. Comprehensive institutional records are documented within his downloadable CV.",
    tl: "Nagtapos si Kennu ng pormal na pagsasanay sa Information Systems na nakatuon sa pagsusuri ng software systems, web development, at database administration. Ang buong talaan ng kanyang mga kredensyal ay nakalakip sa kanyang opisyal na CV sa Capabilities section.",
  },

  // 41. POSTMAN & REST API VERIFICATION
  {
    id: "api_testing_postman",
    patterns: [
      /\b(api testing|postman|rest api|endpoints|status code|json payload|api test)\b/i,
    ],
    keywords: ["api", "postman", "endpoints", "status code", "rest api"],
    category: "qa",
    en: "Kennu conducts API testing utilizing Postman to validate backend integrity prior to client-tier integration. His testing protocols encompass HTTP status code verification, schema validation, payload serialization, authentication header inspection, and boundary testing against invalid query parameters.",
    tl: "Isinasagawa ni Kennu ang API testing gamit ang Postman upang patunayan ang integridad ng server bago ito ikabit sa client interface. Kabilang sa kanyang sinusuri ang HTTP status codes, schema validation, token authentication, at pagsusuri ng tugon ng system laban sa maling data inputs.",
  },

  // 42. PLAYWRIGHT AUTOMATION SUITE
  {
    id: "playwright_automation",
    patterns: [
      /\b(playwright|selenium|cypress|e2e testing|end-to-end testing|automation suite|automated test)\b/i,
    ],
    keywords: [
      "playwright",
      "e2e",
      "automation",
      "end to end",
      "headless browser",
    ],
    category: "qa",
    en: "Kennu leverages Playwright for robust end-to-end browser automation. His test scripts automate critical user workflows, including authentication flows, form submissions, dynamic state changes, and multi-viewport regression checks, ensuring zero visual and operational drift across releases.",
    tl: "Gumagamit si Kennu ng Playwright para sa matatag na end-to-end browser automation. Ang kanyang mga script ay awtomatikong sumusubok sa mga kritikal na daloy tulad ng login authentication, form submissions, at pagbabago ng estado ng UI upang matiyak na walang sira sa bawat update ng software.",
  },

  // 43. CROSS-BROWSER AND DEVICE TESTING
  {
    id: "cross_browser_testing",
    patterns: [
      /\b(cross browser|cross-browser|chrome.*firefox|safari.*edge|compatibility|iba ibang browser)\b/i,
    ],
    keywords: ["cross browser", "chrome", "firefox", "safari", "compatibility"],
    category: "qa",
    en: "Cross-browser validation is systematically executed across Chromium (Chrome, Edge), WebKit (Safari), and Gecko (Firefox) rendering engines. Kennu verifies layout fidelity, JavaScript execution parity, CSS flex/grid rendering, and touch target accessibility across varied physical screen resolutions.",
    tl: "Sistematikong isinasagawa ang cross-browser testing sa Chrome, Edge, Safari, at Firefox. Sinusuri ni Kennu ang visual fidelity ng layout, tamang pagtakbo ng JavaScript, at accessibility sa iba't ibang screen resolutions at mga mobile device.",
  },

  // 44. SMOKE TESTING VS SANITY TESTING
  {
    id: "smoke_vs_sanity_testing",
    patterns: [
      /\b(smoke test.*sanity test|difference.*smoke.*sanity|smoke testing|sanity testing)\b/i,
    ],
    keywords: ["smoke test", "sanity test", "testing types", "pinagkaiba"],
    category: "qa",
    en: "Kennu distinguishes these methodologies with technical rigor:\n• Smoke Testing verifies foundational build stability across critical paths immediately following compilation.\n• Sanity Testing focuses narrowly on verifying that specific defect patches or incremental features function correctly without unintended side-effects.",
    tl: "Matalas na ipinagkakaiba ni Kennu ang dalawang prosesong ito:\n• Smoke Testing: Sinusuri ang pangunahing katatagan ng buong build agad pagkatapos ng deployment upang matiyak na operational ang core flows.\n• Sanity Testing: Nakatutok sa partikular na feature o bug fix upang patunayan na naayos ang depekto nang hindi sinisira ang ibang bahagi ng code.",
  },

  // 45. REGRESSION TESTING PROTOCOLS
  {
    id: "regression_testing",
    patterns: [
      /\b(regression testing|regression suite|paano sinisiguro walang bagong sira|regression test)\b/i,
    ],
    keywords: ["regression", "regression test", "regression suite"],
    category: "qa",
    en: "Regression testing is executed using prioritized test cases to confirm that recent code modifications have not compromised pre-existing functionality. Kennu maintains automated regression suites via Playwright for critical paths and supplements them with manual smoke sweeps across adjacent modules.",
    tl: "Isinasagawa ang regression testing gamit ang prioritized test matrix upang tiyakin na ang mga bagong code changes ay hindi nagdulot ng sira sa mga dati nang gumaganang feature. Gumagamit si Kennu ng automated Playwright test suites kasabay ng focused manual testing sa mga kaugnay na bahagi ng system.",
  },

  // 46. DEFECT SEVERITY VS PRIORITY
  {
    id: "defect_severity_vs_priority",
    patterns: [
      /\b(severity vs priority|severity.*priority|paano i-classify ang bugs|defect classification)\b/i,
    ],
    keywords: ["severity", "priority", "bug classification", "triage"],
    category: "qa",
    en: "Kennu strictly separates technical impact from business urgency:\n• Severity defines the technical impact of the defect on system operation (e.g., Fatal crash vs. cosmetic misalignment).\n• Priority dictates the scheduling urgency of the fix relative to business deliverables and user exposure.",
    tl: "Malinaw na pinaghihiwalay ni Kennu ang teknikal na epekto at pangangailangan sa negosyo:\n• Severity: Ang antas ng teknikal na pinsala ng depekto sa operasyon ng software (halimbawa: system crash laban sa maling kulay ng text).\n• Priority: Ang bilis o pagkakasunod-sunod kung kailan dapat kumpunihin ang bug batay sa iskedyul ng release at epekto sa gumagamit.",
  },

  // 47. SPATIE RBAC & ACCESS CONTROL
  {
    id: "spatie_rbac_security",
    patterns: [
      /\b(spatie|rbac|role based access control|permissions|roles and permissions|security)\b/i,
    ],
    keywords: ["spatie", "rbac", "permissions", "security", "access control"],
    category: "projects",
    en: "In MIRAMS, Kennu an 8-tier role matrix utilizing Spatie RBAC in Laravel 11. The architecture enforces authorization at both routing and middleware layers, preventing privilege escalation and securing enterprise endpoints through strict permission token validations.",
    tl: "Sa sistemang MIRAMS, nagpatupad si Kennu ng 8-tier role matrix gamit ang Spatie RBAC sa Laravel 11. Mahigpit na ipinapatupad ang authorization sa routing at middleware levels upang maiwasan ang unauthorized access at maprotektahan ang mga kumpidensyal na endpoint ng enterprise.",
  },

  // 48. LARAVEL 11 & BACKEND ARCHITECTURE
  {
    id: "laravel_php_backend",
    patterns: [
      /\b(laravel|laravel 11|php backend|eloquent orm|api controllers|blade)\b/i,
    ],
    keywords: ["laravel", "php", "eloquent", "backend", "laravel 11"],
    category: "skills",
    en: "Kennu utilizes Laravel 11 for backend services, leveraging Eloquent ORM for structured database abstractions, dedicated Request validation classes for defensive input handling, and modular controllers communicating cleanly with decoupled React front-ends.",
    tl: "Ginagamit ni Kennu ang Laravel 11 para sa backend services. Pinapakinabangan niya ang Eloquent ORM para sa structured database queries, Form Request classes para sa mahigpit na validation ng data bago pumasok sa database, at RESTful controllers para sa maayos na integrasyon sa React.",
  },

  // 49. REACT & TYPESCRIPT ECOSYSTEM
  {
    id: "react_typescript_frontend",
    patterns: [
      /\b(react.*typescript|typescript.*react|bakit typescript|benefits of typescript|react components)\b/i,
    ],
    keywords: [
      "react",
      "typescript",
      "frontend",
      "components",
      "static typing",
    ],
    category: "skills",
    en: "Kennu standardizes on React paired with TypeScript. Static typing eliminates entire classes of runtime errors, enforces strict component props contracts, and enables predictable state mutation within complex web interfaces.",
    tl: "Ipinapatupad ni Kennu ang React kasama ang TypeScript bilang pamantayan sa front-end. Ang static typing ay sumasala sa mga karaniwang runtime error, nagpapatupad ng mahigpit na kontrata sa component props, at nagtitiyak ng maayos at predictable na daloy ng data sa UI.",
  },

  // 50. DATABASE ARCHITECTURES (MYSQL & POSTGRESQL)
  {
    id: "database_sql",
    patterns: [
      /\b(mysql|postgresql|postgres|database schema|relational database|sql queries)\b/i,
    ],
    keywords: ["mysql", "postgresql", "database", "sql", "schema"],
    category: "skills",
    en: "Kennu designs relational schemas adhering to Third Normal Form (3NF) principles, implementing primary/foreign key indexing, foreign key constraints, and transactional consistency across PostgreSQL and MySQL database engines.",
    tl: "Nagdidisenyo si Kennu ng mga relational database schema na sumusunod sa mga pamantayan ng Third Normal Form (3NF). Tinitiyak niya ang integridad ng data sa pamamagitan ng foreign key constraints, wastong indexing, at transactional consistency sa PostgreSQL at MySQL.",
  },

  // 51. GIT & VERSION CONTROL WORKFLOWS
  {
    id: "ci_cd_docker_git",
    patterns: [
      /\b(git workflow|branching|pull request|github commits|merge conflicts|version control)\b/i,
    ],
    keywords: [
      "git",
      "github",
      "branching",
      "pull requests",
      "version control",
    ],
    category: "process",
    en: "Kennu enforces disciplined version control workflows: creating isolated feature branches, maintaining atomic semantic commit messages, executing pre-merge local test verifications, and conducting thorough code reviews to preserve trunk branch stability.",
    tl: "Mahigpit na ipinapatupad ni Kennu ang maayos na Git version control: paggawa ng hiwalay na feature branches, paglalagay ng malinaw at atomic commit messages, pagsasagawa ng lokal na pagsusuri bago mag-merge, at pag-iwas sa conflicts upang mapanatiling matatag ang main branch.",
  },

  // 52. ENGLISH PROFICIENCY & INTERNATIONAL COMMUNICATION
  {
    id: "communication_english",
    patterns: [
      /\b(english.*fluency|foreign clients|international communication|marunong ka ba mag-english|english skills)\b/i,
    ],
    keywords: ["english", "fluency", "international", "communication"],
    category: "about",
    en: "Kennu maintains high-standard professional English proficiency across verbal and written communication channels, facilitating seamless alignment with global teams, cross-border stakeholders, and international client organizations.",
    tl: "Mataas at matatas ang antas ng propesyonal na pakikipagtalastasan ni Kennu sa wikang Ingles sa pasulat at pasalita. Tinitiyak nito ang maayos na koordinasyon at pagkakaintindihan sa mga banyagang kliyente at pandaigdigang teams.",
  },

  // 53. TECHNICAL INTERVIEW & LIVE CODING READINESS
  {
    id: "technical_interview_exam",
    patterns: [
      /\b(technical interview|coding exam|live coding|technical exam|handa ka ba sa exam|interview exam)\b/i,
    ],
    keywords: ["technical interview", "coding exam", "live coding", "exam"],
    category: "contact",
    en: "Kennu is thoroughly prepared for technical assessments, take-home assignments, live pair-programming sessions, and test-case documentation examinations across both frontend development and QA disciplines.",
    tl: "Handang-handa si Kennu sumailalim sa mga teknikal na pagsusulit, live coding interviews, take-home development exams, at mga praktikal na pagsusuri sa pagsulat ng test cases at bug triage para sa QA at development.",
  },

  // 54. ATTENTION TO DETAIL & THOROUGHNESS
  {
    id: "attention_to_detail",
    patterns: [
      /\b(attention to detail|mabusisi|detail oriented|thoroughness|maselan sa gawa)\b/i,
    ],
    keywords: [
      "attention to detail",
      "mabusisi",
      "detail oriented",
      "thorough",
    ],
    category: "about",
    en: "Meticulous attention to detail constitutes Kennu's foundational professional trait. In QA, a single overlooked character in validation regex or a minor CSS clipping glitch can compromise production stability; thus, he reviews every component, network payload, and responsive breakpoint with exacting standards.",
    tl: "Ang pagiging masusi at mapanuri ang pangunahing katangian ni Kennu. Sa QA, ang kahit isang nakaligtaang detalye sa validation regex o maliit na error sa layout ay maaaring magdulot ng depekto sa buong system; kung kaya't sinusuri niya ang bawat linya ng code at responsive breakpoint nang may mataas na pamantayan.",
  },

  // 55. CUSTOM VS NO-CODE / WORDPRESS
  {
    id: "custom_code_vs_wordpress",
    patterns: [
      /\b(wordpress|wix|squarespace|no code|no-code|bakit custom code|custom)\b/i,
    ],
    keywords: ["wordpress", "wix", "no code", "custom code", "squarespace"],
    category: "about",
    en: "Kennu prioritizes bespoke code architecture (React, TypeScript, Laravel) over generic website builders because custom delivers superior performance metrics, zero bloat, complete architectural control, and fine-grained testability essential for enterprise scalability.",
    tl: "Pinipili ni Kennu ang pasadyang arkitektura ng code (React, TypeScript, Laravel) kaysa sa mga generic website builders tulad ng WordPress dahil ang custom code ay nagbibigay ng mataas na bilis, walang labis na bloat, ganap na kontrol sa seguridad, at madaling masubukan sa pamamagitan ng automated testing.",
  },

  // 56. WORKSTATION HARDWARE & DEV ENVIRONMENT
  {
    id: "workstation_setup",
    patterns: [
      /\b(workstation|setup|hardware specs|pc specs|laptop specs|gamit mong computer|dev environment)\b/i,
    ],
    keywords: ["workstation", "setup", "specs", "hardware", "computer"],
    category: "about",
    en: "Kennu operates on a high-throughput development setup equipped with multi-monitor workspaces, high-speed RAM for local virtualization and parallel container builds, and reliable dual-channel network redundancy to guarantee zero downtime during test runs.",
    tl: "Gumagamit si Kennu ng isang mataas na kalidad na workstation na may multi-monitor setup, sapat na RAM para sa sabay-sabay na virtualization at build pipelines, at maaasahang internet connection upang matiyak ang tuloy-tuloy na trabaho sa pagsusuri ng software.",
  },

  // 57. IDE & EDITORIAL TOOLING (VS CODE & CURSOR)
  {
    id: "ide_tools_cursor",
    patterns: [
      /\b(ide|code editor|vs code|cursor|anong editor gamit|text editor)\b/i,
    ],
    keywords: ["ide", "editor", "vs code", "cursor", "text editor"],
    category: "skills",
    en: "Kennu's primary integrated development environments are Visual Studio Code and Cursor, configured with strict ESLint rules, Prettier formatting hooks, and automated TypeScript compiler diagnostics for high productivity and continuous linting.",
    tl: "Ang mga pangunahing code editor ni Kennu ay Visual Studio Code at Cursor, na nilagyan ng mahihigpit na ESLint rules, automated formatting, at TypeScript type-checking upang mapanatili ang kalinisan at kaayusan ng code sa bawat linya.",
  },

  // 58. CRITICAL PRODUCTION INCIDENT RESPONSE
  {
    id: "critical_production_bug",
    patterns: [
      /\b(critical bug|production bug|incident response|hotfix|kapag may nasira sa live|system down)\b/i,
    ],
    keywords: [
      "critical bug",
      "production",
      "hotfix",
      "incident",
      "system down",
    ],
    category: "process",
    en: "Upon detection of a critical production anomaly, Kennu executes rapid incident triage: isolating logs via server telemetry, creating an exact local reproduction script in Playwright, issuing an emergency hotfix on a dedicated hotfix branch, and verifying integrity before deploying with minimal user impact.",
    tl: "Kapag nagkaroon ng kritikal na depekto sa live production, agad na kumikilos si Kennu: sinusuri ang server logs, ginagawa ang reproduction script sa Playwright, naglalabas ng hotfix mula sa hiwalay na branch, at nagsasagawa ng smoke testing bago ito i-release nang mabilis at ligtas.",
  },

  // 59. PERSPECTIVE ON ARTIFICIAL INTELLIGENCE TOOLS
  {
    id: "ai_tools_stance",
    patterns: [
      /\b(ai tools|chatgpt|copilot|pananaw sa ai|ai sa programming|artificial intelligence)\b/i,
    ],
    keywords: [
      "ai",
      "copilot",
      "chatgpt",
      "artificial intelligence",
      "automation",
    ],
    category: "about",
    en: "Kennu views artificial intelligence as an assistive force multiplier. While AI augments boilerplates and exploratory test generation, critical human validation, edge-case architectural judgment, and rigorous verification remain strictly essential for robust software.",
    tl: "Itinuturing ni Kennu ang artificial intelligence bilang isang katuwang na nagpapabilis ng routine tasks. Bagamat nakatutulong ang AI sa pagbuo ng boilerplate code, ang kritikal na pagpapasya sa arkitektura, lohika, at masusing beripikasyon ng mga edge cases ay nananatiling nakasalalay sa mapanuring mata ng tao.",
  },

  // 60. CREATION & ARCHITECTURE OF THIS CHATBOT
  {
    id: "who_made_this_chatbot",
    patterns: [
      /\b(sino gumawa.*chatbot|paano gumagana.*chatbot|who built this chatbot|architecture ng chatbot)\b/i,
    ],
    keywords: [
      "sino gumawa",
      "chatbot",
      "architecture",
      "who built",
      "assistant",
    ],
    category: "general",
    en: "This interactive knowledge assistant was directly by Kennu Elnar as a component of his web portfolio. It runs client-side with deterministic intent parsing, multilingual translation mappings, and immediate local inference for high-speed response delivery.",
    tl: "Ang interactive knowledge assistant na ito ay personal na binuo at dinisenyo ni Kennu Elnar bilang bahagi ng kanyang portfolio. Tumatakbo ito sa client-side gamit ang mabilis na intent parsing at bilingual translation mapping upang magbigay ng kagyat at tumpak na mga tugon.",
  },

  // 61. EXPRESSIONS OF GRATITUDE / COURTESY
  {
    id: "thank_you",
    patterns: [
      /\b(thank you|thanks|salamat|maraming salamat|ok thank you|ty|appreciate it|salamat po)\b/i,
    ],
    keywords: [
      "thank you",
      "thanks",
      "salamat",
      "appreciate",
      "maraming salamat",
    ],
    category: "general",
    en: "You are welcome. Should you require further data regarding Kennu Elnar's technical competencies or project architectures, I remain at your service. Direct inquiries can also be routed to elnarkennu16@gmail.com.",
    tl: "Walang anuman. Kung mayroon ka pang karagdagang katanungan hinggil sa mga kasanayan o proyekto ni Kennu Elnar, maaari kang magtanong anumang oras. Maaari ka ring direktang magpadala ng mensahe sa elnarkennu16@gmail.com.",
  },

  // 62. DEPARTURE & FAREWELL
  {
    id: "farewell",
    patterns: [
      /\b(goodbye|bye|paalam|sige alis na|see you|alis na ako|ingat)\b/i,
    ],
    keywords: ["goodbye", "bye", "paalam", "see you"],
    category: "general",
    en: "Acknowledged. Thank you for examining Kennu Elnar's portfolio. You may re-engage this interface at any time.",
    tl: "Nabatid. Maraming salamat sa pagbisita sa portfolio ni Kennu Elnar. Maaari kang magbalik at sumangguni muli anumang oras.",
  },
];
