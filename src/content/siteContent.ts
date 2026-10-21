/**
 * Single source of truth for all content, navigation links, and metadata.
 * Each content block has an optional status: "placeholder" | "final".
 * Visible "[PLACEHOLDER]" strings are removed from the UI.
 * In development, add ?debug=content to the URL to highlight blocks still marked "placeholder".
 */

export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export interface CapabilityItem {
  name: string;
  description: string;
  level: "Using" | "Learning";
}

export interface CapabilityGroup {
  category: string;
  items: CapabilityItem[];
}

export interface ProjectItem {
  id: string;
  number: string;
  title: string;
  role: string;
  year: string;
  description: string;
  tags: string[];
  liveUrl?: string;
  repoUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  iconUrl?: string;
  status?: "placeholder" | "final";
  duration?: string;
  projectType?: string;
  overview?: string;
  keyFeatures?: string[];
  modalStatus?: string;
}

export interface OtherProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  link?: string;
  year?: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  summary: string;
  details: string;
}

export interface LookGridConfig {
  cols: number;
  rows: number;
  basePath: string;
  fallbackUrl: string;
  frames: string[];
}

export const siteContent = {
  meta: {
    name: "Kennu Elnar",
    title: "Kennu Elnar — Junior QA Tester & Web Developer",
    role: "Junior QA Tester & Web Developer",
    // TODO: Add your city if you want it displayed, otherwise leave empty
    location: "",
    // TODO: Add your public email if you want it displayed, otherwise leave empty
    email: "elnarkennu16@gmail.com",
    phone: "+63 09453870032",
    githubUrl: "https://github.com/elnarkennu16-440",
    linkedinUrl: "",
    resumeUrl: "/resume/Elnar_Kennu_Resume.docx",
    resumeDocxUrl: "/resume/Elnar_Kennu_Resume.docx",
    resumePdfUrl: "/resume/Kennu-Elnar-Resume.pdf",
    portraitUrl: "/images/profile/kennu-portrait.jpg",
    cutoutUrl: "/images/profile/kennu-cutout.png",
    status: "final" as const,
  },

  lookGrid: {
    cols: 3,
    rows: 3,
    basePath: "/images/profile/look/",
    fallbackUrl: "/images/profile/kennu-cutout.png",
    frames: [
      "looking-up-left.png", // row 0, col 0 (top-left)
      "Looking-up.png", // row 0, col 1 (top-center)
      "looking-up-right.png", // row 0, col 2 (top-right)
      "looking-left.png", // row 1, col 0 (middle-left)
      "looking-center.png", // row 1, col 1 (middle-center: look-c)
      "looking-right.png", // row 1, col 2 (middle-right)
      "looking-down-left.png", // row 2, col 0 (bottom-left)
      "looking-down.png", // row 2, col 1 (bottom-center)
      "looking-down-right.png", // row 2, col 2 (bottom-right)
    ],
  } as LookGridConfig,

  navigation: [
    { id: "about", label: "About", href: "#about" },
    { id: "works", label: "Works", href: "#works" },
    { id: "capabilities", label: "Capabilities", href: "#capabilities" },
    { id: "process", label: "Process", href: "#process" },
  ] as NavItem[],

  hero: {
    eyebrow: "2026",
    headlinePart1: "KENNU",
    headlinePart2: "ELNAR",
    roleTagline:
      "Focusing on software quality, user flows, and dependable web applications.",
    manifesto: "",
    ctaWorks: "View works",
    ctaResume: "Download CV",
    portraitLabel: "Portrait",
    faintWatermark: "QUALITY",
    status: "placeholder" as const, // TODO: Review and customize manifesto
  },

  about: {
    sectionNumber: "",
    sectionTitle: "ABOUT",
    faintWatermark: "ABOUT",
    lead: "A Personal Workspace. Notes, Builds, and Progress",
    paragraphs: [
      "I’m Kennu. I maintain this platform as an open repository to document my background, practical work, and technical development. Instead of leaving projects confined to private directories, this space serves as an accessible record of my hands-on exploration and steady learning curve.",
      "I place high value on structural clarity and consistent routines. Much of my time involves refining interface behavior, addressing edge cases deliberately, and building applications with longevity and clean organization in mind.",
    ],
    principles: [
      {
        term: "Functional & Exploratory Testing",
        description:
          "Testing web applications through real user scenarios to spot functional edge cases and layout flaws.",
      },
      {
        term: "Web & DOM Inspection",
        description:
          "Using browser tools to examine page elements, observe console outputs, and verify UI behavior.",
      },
      {
        term: "Structured Defect Reporting",
        description:
          "Writing clean bug tickets with exact steps, expected behavior, and environment logs for quick developer fixes.",
      },
    ],
    status: "final" as const,
  },

  works: {
    sectionNumber: "",
    sectionTitle: "WORKS",
    faintWatermark: "WORKS",
    intro: "Recent web projects and testing work.",
    // The first 4 projects are always shown. Any project after the 4th (05, 06, ...)
    // is hidden behind the floating "Show more" button in the Works section.
    // Projects 05 and 06 are SAMPLE placeholders (status: "placeholder") — replace them
    // with your real projects whenever you are ready.
    projects: [
      {
        id: "project-01",
        number: "01",
        title: "MIRAMS — Manufacturing Internal Request & Asset Management",
        tags: [
          "React",
          "TypeScript",
          "Laravel 11",
          "MySQL / PostgreSQL",
          "Spatie RBAC",
          "Tailwind CSS",
        ],
        description:
          "Full-stack, role-aware enterprise web application built for electronics manufacturing environments. Integrates hardware lifecycle tracking, IT helpdesk ticketing, equipment maintenance schedules, and department supply requisitions across 8 operational tiers with Spatie RBAC.",
        repoUrl: "https://github.com/elnarkennu16-440/MIRAMS-ENTERPRISE-SYSTEM",
        imageUrl: "/images/projects/MIRAMS-Project.png",
        imageAlt:
          "MIRAMS Manufacturing Internal Request & Asset Management System interface preview",
        iconUrl: "/images/projects/icons/Mirams-Icon-Logo.png",
        status: "final" as const,
        modalStatus: "In Progress",
        duration: "Sep 2025 – Present",
        projectType: "Enterprise Web Application",
        overview:
          "Full-stack, role-aware enterprise web application built for high-throughput electronics manufacturing environments. Integrates hardware lifecycle tracking, IT helpdesk ticketing, equipment preventive maintenance schedules, and departmental supply requisitions across 8 operational tiers with granular Spatie RBAC security.",
        keyFeatures: [
          "Hardware lifecycle tracking and multi-tier IT asset management with audit trails",
          "Role-based access control (RBAC) securely spanning 8 operational tiers",
          "Automated helpdesk ticketing workflows and maintenance dispatch scheduling",
          "Department supply requisition approvals with real-time stock deductions",
        ],
      },
      {
        id: "project-02",
        number: "02",
        title: "NCAMIS — Senior High School Management Information System",
        tags: [
          "PHP",
          "JavaScript",
          "Information Systems",
          "RBAC",
          "Manual Testing",
        ],
        description:
          "Comprehensive web platform streamlining academic and administrative operations for Northills College of Asia. Centralizes student records, faculty data, and admissions workflows with dedicated role-based portals for administrators, faculty, students, and parents.",
        repoUrl: "https://github.com/elnarkennu16-440/NCAMIS-SHS",
        imageUrl: "/images/projects/NCAMIS-Project.png",
        imageAlt:
          "NCAMIS Northills College of Asia Management Information System portal preview",
        iconUrl: "/images/projects/icons/Ncamis-Icon-Logo.png",
        status: "final" as const,
        modalStatus: "Completed",
        duration: "2024 – 2025",
        projectType: "Academic Information System",
        overview:
          "Comprehensive web platform streamlining academic and administrative operations for Northills College of Asia. Centralizes student records, faculty grading schedules, and admissions workflows with dedicated role-based portals for school administrators, faculty instructors, students, and parents.",
        keyFeatures: [
          "Centralized student academic records, digital grading sheets, and enrollment pipelines",
          "Distinct role portals for school administrators, faculty instructors, and students",
          "Admissions processing pipeline with automated prerequisite document verification",
          "Parent portal for real-time grade notifications and student attendance visibility",
        ],
      },
      {
        id: "project-03",
        number: "03",
        title: "NobleClassics — Full-Featured E-Commerce Bookstore",
        tags: [
          "PHP",
          "MySQL",
          "JavaScript",
          "CSS3",
          "Cart & Checkout",
          "Admin Panel",
        ],
        description:
          "Curated literary e-commerce platform featuring dynamic shopping cart calculation, multi-step checkout, and order status tracking, backed by an administrative dashboard for catalog management, stock control, customer inquiries, and user credentials.",
        repoUrl: "https://github.com/elnarkennu16-440/E-COMMERCE-NOBLECLASSICS",
        imageUrl: "/images/projects/NobleClassics-Project.png",
        imageAlt:
          "NobleClassics E-Commerce Bookstore Platform storefront preview",
        iconUrl: "/images/projects/icons/Nobleclassics.Icon-Logo.png",
        status: "final" as const,
        modalStatus: "Completed",
        duration: "2024",
        projectType: "E-Commerce Bookstore",
        overview:
          "Curated literary e-commerce platform featuring dynamic shopping cart calculation, multi-step checkout, and order status tracking, backed by an administrative dashboard for catalog management, stock control, customer inquiries, and secure user credentials.",
        keyFeatures: [
          "Dynamic real-time cart computation, discount vouchers, and multi-step checkout",
          "Admin control panel for live book catalog updates, stock tiers, and order status",
          "Customer authentication, profile order history, and inquiry messaging",
          "Clean responsive reader-friendly aesthetic tailored for bibliophiles",
        ],
      },
      {
        id: "project-04",
        number: "04",
        title: "ReadCap.AI — Distillation & Focused Reading Workspace",
        tags: [
          "React",
          "TypeScript",
          "Tailwind CSS",
          "Gemini API",
          "AI Workspace",
          "Markdown",
        ],
        description:
          "AI-powered distraction-free reading room and thought workspace. Allows readers to untangle raw thoughts, capture signals from long-form writing, and converse with localized private sessions through clean conversational threads.",
        repoUrl: "https://github.com/elnarkennu16-440/ReadCap-AI",
        imageUrl: "/images/projects/READCAPAI-Project.png",
        imageAlt:
          "ReadCap AI focused reading room and conversational synthesis interface preview",
        iconUrl: "/images/projects/icons/Readcapai-Icon-Logo.png",
        status: "final" as const,
        modalStatus: "Active Development",
        duration: "Jan 2026 – Present",
        projectType: "AI Reading & Workspace Tool",
        overview:
          "AI-powered distraction-free reading room and thought workspace. Allows readers to untangle raw thoughts, capture signals from long-form writing, and converse with localized private sessions through clean conversational threads.",
        keyFeatures: [
          "Focused distraction-free markdown reader with typography tuning",
          "Gemini API integration for summarizing, questioning, and extracting key points",
          "Local private thread history stored securely in the browser",
          "Signal-to-noise extractor for long-form whitepapers and technical essays",
        ],
      },
      // ── Hidden behind "Show more" (SAMPLE projects — replace with real ones later) ──
      {
        id: "project-05",
        number: "05",
        title: "AbisoMed — Clinic Appointment & Live Queue Tracker",
        tags: [
          "React",
          "TypeScript",
          "Node.js",
          "MySQL",
          "Tailwind CSS",
          "Real-time Queue",
        ],
        description:
          "Walk-in and online appointment system for small clinics with real-time queue numbers, SMS-ready patient alerts, and a staff dashboard that estimates waiting time so patients stop waiting in crowded lobbies.",
        // TODO: add repoUrl / liveUrl when this becomes a real project (buttons stay hidden until then)
        iconUrl: "/images/projects/icons/Abisomed-Icon-Logo.png",
        imageUrl: "/images/projects/QueueLess-Project.svg",
        imageAlt:
          "QueueLess dashboard showing the live patient queue and the number now being served",
        status: "placeholder" as const,
        modalStatus: "In Progress",
        duration: "2025",
        projectType: "Healthcare & Queue System",
        overview:
          "Walk-in and online appointment system for community clinics with real-time queue tracking, SMS-ready patient alerts, and a triage dashboard that estimates waiting time so patients stop waiting in crowded lobbies.",
        keyFeatures: [
          "Live waiting room display board updating patient queue numbers in real time",
          "Staff triage dashboard for managing doctors' schedules and consulting rooms",
          "Automated SMS notification alerts when patient's turn is approaching",
          "Daily patient throughput metrics and appointment scheduling calendar",
        ],
      },
      {
        id: "project-06",
        number: "06",
        title: "AsensoPOS — Market Inventory & Debt Ledger",
        tags: [
          "React",
          "TypeScript",
          "Node.js",
          "MySQL",
          "Inventory",
          "Offline-first",
        ],
        description:
          "Offline-friendly point-of-sale and inventory tool for neighborhood stores: low-stock alerts, daily sales summaries, and a customer credit (utang) ledger with payment reminders and printable statements.",
        // TODO: add repoUrl / liveUrl when this becomes a real project (buttons stay hidden until then)
        iconUrl: "/images/projects/icons/Asensopos-Icon-Logo.png",
        imageUrl: "/images/projects/TindaTrack-Project.svg",
        imageAlt:
          "TindaTrack dashboard with weekly sales, stock levels and the customer credit ledger",
        status: "placeholder" as const,
        modalStatus: "Prototype",
        duration: "2025",
        projectType: "Point-of-Sale & Inventory",
        overview:
          "Offline-friendly point-of-sale and inventory tool designed for neighborhood micro-retailers: low-stock alerts, daily sales summaries, and a customer credit (utang) ledger with payment reminders and printable statements.",
        keyFeatures: [
          "Fast barcode or tap-to-add checkout workflow optimized for touch screens",
          "Customer credit (utang) ledger with payment tracking and balance summaries",
          "Low-stock notifications and vendor restocking order suggestions",
          "Offline-first IndexedDB data persistence with automatic background sync",
        ],
      },
    ] as ProjectItem[],
    otherProjects: [
      {
        id: "other-01",
        title: "DroidCaffeine",
        category: "MOBILE APPLICATION",
        description:
          "A college cafe ordering and point-of-sale application built in Visual Studio using C# and .NET with interactive food item menus, order queue calculations, and local receipt logging.",
        link: "https://github.com/elnarkennu16-440/DroidCafe",
        year: "2024",
      },
      {
        id: "other-02",
        title: "HatidIsked",
        category: "WEB APPLICATION",
        description:
          "A college campus distribution and queue coordinator built with localized timeslot allocations, real-time release status updates, and automated pickup schedule tracking.",
        link: "https://github.com/elnarkennu16-440",
        year: "2024",
      },
      {
        id: "other-03",
        title: "Plummatry",
        category: "WEB APPLICATION",
        description:
          "A robust web application built to accelerate API testing and file manipulation workflows. By eliminating tedious manual scripting, it offers a secure, intuitive interface to validate endpoints, transforms file schemas, and monitors data payloads in real time.",
        link: "https://github.com/elnarkennu16-440",
        year: "2023",
      },
    ] as OtherProjectItem[],
    status: "final" as const,
  },

  capabilities: {
    sectionNumber: "",
    sectionTitle: "CAPABILITIES",
    faintWatermark: "SKILLS",
    intro:
      "The tools and technologies I use every day, plus what I am currently learning.",
    groups: [
      {
        category: "Front-end",
        items: [
          {
            name: "Modern HTML5 & CSS3",
            description:
              "Building responsive, accessible layouts with clean semantic markup and modern CSS styling.",
            level: "Using",
          },
          {
            name: "JavaScript (ES6+)",
            description:
              "Writing client-side logic, handling user events, and consuming REST APIs in web applications.",
            level: "Using",
          },
          {
            name: "React & Tailwind CSS",
            description:
              "Building component-based user interfaces with utility-first styling and reusable layouts.",
            level: "Using",
          },
          {
            name: "TypeScript",
            description:
              "Learning static typing, interfaces, and type safety for modern JavaScript and React projects.",
            level: "Learning",
          },
          {
            name: "Vue.js",
            description:
              "Exploring progressive UI development, reactivity fundamentals, and component-based layouts.",
            level: "Learning",
          },
        ],
      },
      {
        category: "QA & Testing",
        items: [
          {
            name: "Manual Testing",
            description:
              "Executing manual test cases to verify core features, validate user flows, and catch regressions.",
            level: "Using",
          },
          {
            name: "Test Case Design",
            description:
              "Writing detailed test scenarios, boundary conditions, expected outcomes, and acceptance criteria.",
            level: "Using",
          },
          {
            name: "Bug Reporting & Triage",
            description:
              "Documenting clear reproduction steps, expected vs. actual results, and severity-ranked defect logs.",
            level: "Using",
          },
          {
            name: "Playwright",
            description:
              "Learning to write basic automated test scripts for web UI flows, locators, and user interactions.",
            level: "Learning",
          },
          {
            name: "API Testing",
            description:
              "Testing REST endpoints for correct HTTP status codes, request/response formats, and error handling.",
            level: "Learning",
          },
        ],
      },
      {
        category: "Tools",
        items: [
          {
            name: "Git & GitHub",
            description:
              "Using Git and GitHub for daily version control, feature branching, commits, and pull requests.",
            level: "Using",
          },
          {
            name: "VS Code & Cursor",
            description:
              "Everyday code editing, basic debugging, linting, and working with helpful development tools.",
            level: "Using",
          },
          {
            name: "Chrome DevTools",
            description:
              "Inspecting DOM elements, checking console logs, and monitoring network requests in the browser.",
            level: "Using",
          },
          {
            name: "Node.js",
            description:
              "Running local development servers, installing project dependencies, and managing npm packages.",
            level: "Using",
          },
          {
            name: "Vite & Modern Tooling",
            description:
              "Learning modern frontend build tools, fast local dev servers, and clean project bundling.",
            level: "Learning",
          },
        ],
      },
    ] as CapabilityGroup[],
    status: "final" as const,
  },

  process: {
    sectionNumber: "",
    sectionTitle: "PROCESS",
    faintWatermark: "STEPS",
    intro: "How I approach testing and building web features.",
    steps: [
      {
        number: "01",
        title: "Understand",
        summary: "Read requirements and clarify what the user expects.",
        details:
          "Review user stories, define what success looks like, and think about potential failure points before starting.",
      },
      {
        number: "02",
        title: "Plan",
        summary: "Write down test cases or structure the components.",
        details:
          "Create checklists covering normal paths, edge cases, and form validation scenarios.",
      },
      {
        number: "03",
        title: "Test & Build",
        summary: "Execute tests step by step and inspect the layout.",
        details:
          "Check layout responsiveness on different screen widths and verify form inputs with invalid data.",
      },
      {
        number: "04",
        title: "Report",
        summary: "Document any bugs with clear reproduction steps.",
        details:
          "Write concise bug reports so problems can be easily understood and fixed by the team.",
      },
    ] as ProcessStep[],
    status: "final" as const,
  },

  contact: {
    title: "Message me",
    subtitle:
      "Inquiries regarding junior QA roles, front-end opportunities, or projects.",
    endpointConfigNote:
      "When no API endpoint is configured, this form prepares an email draft directly to elnarkennu16@gmail.com.",
    ctaSubmit: "Send message",
    closeLabel: "Close dialog",
    status: "final" as const,
  },

  footer: {
    copyright: "© 2026 Kennu Elnar",
    tagline: "Junior QA Tester & Web Developer",
    backToTop: "Back to top ↑",
    status: "final" as const,
  },
};
