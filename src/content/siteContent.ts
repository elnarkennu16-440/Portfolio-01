/**
 * Single source of truth for all content, navigation links, and metadata.
 * Each content block has an optional status: "placeholder" | "final".
 * Visible "[PLACEHOLDER]" strings are removed from the UI.
 * In development, add ?debug=content to the URL to highlight blocks still marked "placeholder".
 */

export interface NavDropdownItem {
  id: string;
  label: string;
  subpage?: "experience" | "workflows" | "services";
  href?: string;
  description?: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  dropdown?: NavDropdownItem[];
}

export interface CapabilityItem {
  icon: string;
  name: string;
  description: string;
  level: "Using" | "Learning";
}

export interface CapabilityGroup {
  column: number;
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

export interface ExperienceItem {
  id: string;
  period: string;
  role: string;
  company: string;
  institution?: string;
  location?: string;
  type: string;
  badge: string;
  summary: string;
  narrative: string;
  responsibilities: string[];
  keyHighlights: string[];
  skills: string[];
}

export interface WorkflowPhase {
  step: string;
  title: string;
  subtitle: string;
  shortSummary: string;
  objective: string;
  architectureDetails: string[];
  deliverables: string[];
  techUsed: string[];
  metrics: string;
}

export interface ServiceItem {
  number: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  scope: string[];
  deliverables: string[];
  tools: string[];
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
    {
      id: "professional-overview",
      label: "Professional Overview",
      href: "#professional-overview",
      dropdown: [
        {
          id: "experience",
          label: "Experience",
          subpage: "experience",
          description: "Career history, internships & academic background",
        },
        {
          id: "workflows",
          label: "Workflows",
          subpage: "workflows",
          description: "End-to-end SDLC & systematic QA pipeline",
        },
        {
          id: "services",
          label: "Services",
          subpage: "services",
          description: "Technical offerings, deliverables & expertise",
        },
      ],
    },
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
        modalStatus: "Completed",
        duration: "2026",
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
        title:
          "NCAMIS — Northills College of Asia Management Information System for Senior High School",
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
        projectType: "Academic Project for Capstone 1 & 2",
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
        projectType: "Academic Project for System Analysis & Design 2",
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
        duration: "2026",
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
        duration: "2026",
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
        duration: "2026",
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
        title: "Plummatry",
        category: "WEB APPLICATION",
        description:
          "A robust web application built to accelerate API testing and file manipulation workflows. By eliminating tedious manual scripting, it offers a secure, intuitive interface to validate endpoints, transforms file schemas, and monitors data payloads in real time.",
        link: "https://github.com/elnarkennu16-440",
        year: "2026",
      },
      {
        id: "other-02",
        title: "HatidIsked",
        category: "MOBILE APPLICATION",
        description:
          "A college campus distribution and queue coordinator built with localized timeslot allocations, real-time release status updates, and automated pickup schedule tracking.",
        link: "https://github.com/elnarkennu16-440",
        year: "2025",
      },
      {
        id: "other-03",
        title: "RoamWeb",
        category: "WEB APPLICATION",
        description:
          "An automated end-to-end (E2E) web testing  and data extraction platform designed to eliminate repetitive manual validation workflows. Built using a modular architecture, the platform orchistrates background automated headless browsers to navitation complex web applications, validate interface structures, and continuously monitor API endpoints for data integrity.",
        link: "https://github.com/elnarkennu16-440",
        year: "2026",
      },
      {
        id: "other-04",
        title: "DroidCaffeine",
        category: "MOBILE APPLICATION",
        description:
          "A college cafe ordering and point-of-sale application built in Visual Studio using C# and .NET with interactive food item menus, order queue calculations, and local receipt logging.",
        link: "https://github.com/elnarkennu16-440/DroidCafe",
        year: "2023",
      },
    ] as OtherProjectItem[],
    status: "final" as const,
  },

  capabilities: {
    sectionNumber: "",
    sectionTitle: "CAPABILITIES",
    faintWatermark: "SKILLS",
    intro: "The tools and technologies I work with.",
    groups: [
      {
        category: "Frontend",
        column: 1,
        items: [
          { name: "React", icon: "react" },
          { name: "Vue.js", icon: "vue" },
          { name: "Tailwind CSS", icon: "tailwind" },
          { name: "Next.js", icon: "next" },
          { name: "TypeScript", icon: "typescript" },
          { name: "JavaScript", icon: "javascript" },
        ],
      },
      {
        category: "Backend",
        column: 1,
        items: [
          { name: "Node.js", icon: "node" },
          { name: "Express.js", icon: "express" },
          { name: "PHP", icon: "php" },
          { name: "Laravel", icon: "laravel" },
        ],
      },
      {
        category: "Databases",
        column: 1,
        items: [
          { name: "MySQL", icon: "mysql" },
          { name: "Supabase", icon: "supabase" },
          { name: "Firebase", icon: "firebase" },
          { name: "MongoDB", icon: "mongodb" },
        ],
      },
      {
        category: "Testing Tools",
        column: 2,
        items: [
          { name: "Asana", icon: "asana" },
          { name: "Jira", icon: "jira" },
          { name: "Chrome DevTools", icon: "devtools" },
          { name: "Postman", icon: "postman" },
        ],
      },
      {
        category: "Platforms & Dev Tools",
        column: 3,
        items: [
          { name: "Git / GitHub", icon: "github" },
          { name: "Vercel", icon: "vercel" },
          { name: "Notion", icon: "notion" },
          { name: "VS Code", icon: "vscode" },
          { name: "Vite", icon: "vite" },
          { name: "npm", icon: "npm" },
          { name: "Cline", icon: "cline" },
          { name: "Antigravity", icon: "antigravity" },
        ],
      },
      {
        category: "AI & Machine Learning",
        column: 2,
        items: [
          { name: "Gemini", icon: "gemini" },
          { name: "Claude", icon: "claude" },
          { name: "Manus", icon: "manus" },
          { name: "Perplexity", icon: "perplexity" },
        ],
      },
      {
        category: "Cloud & Hosting",
        column: 3,
        items: [
          { name: "Vercel", icon: "vercel" },
          { name: "Hostinger", icon: "hostinger" },
          { name: "Cloudflare", icon: "cloudflare" },
        ],
      },
      {
        category: "Mobile",
        column: 3,
        items: [
          { name: "Flutter", icon: "flutter" },
          { name: "React Native", icon: "reactnative" },
        ],
      },
      {
        category: "Authentication & Security",
        column: 2,
        items: [
          { name: "JWT", icon: "jwt" },
          { name: "GitGuardian", icon: "gitguardian" },
          { name: "Dependabot", icon: "dependabot" },
          { name: "OWASP ZAP", icon: "owasp zap" },
        ],
      },
    ] as CapabilityGroup[],
    status: "final" as const,
  },

  professionalOverview: {
    sectionNumber: "",
    sectionTitle: "PROFESSIONAL OVERVIEW",
    faintWatermark: "OVERVIEW",
    lead: "Practical Background, Focused Workflows, & Technical Milestones",
    intro:
      "An organized summary of my foundations in software development, quality assurance, and verfied project outcomes.",
    pillars: [
      {
        id: "experience",
        number: "01",
        title: "Experience",
        tagline: "Career History & Education",
        summary:
          "Documented trajectory across hands-on freelance client work, industry IT support internship, and accredited academic systems engineering.",
        cta: "Explore Experience",
      },
      {
        id: "workflows",
        number: "02",
        title: "Workflows",
        tagline: "Engineering Architecture & QA",
        summary:
          "A 4-phase systematic lifecycle: requirement analysis, component-driven prototyping, defect detection, and production hardening.",
        cta: "Inspect Workflows",
      },
      {
        id: "services",
        number: "03",
        title: "Services",
        tagline: "Technical Offerings & Delivery",
        summary:
          "Targeted technical offerings spanning frontend engineering, quality assurance test design, DOM inspection, and IT support.",
        cta: "View Services",
      },
    ],

    experiences: [
      {
        id: "exp-01",
        period: "JULY 2026 – PRESENT",
        role: "Freelance Software Developer",
        company: "Self-Employed - Fiverr and uTest",
        type: "Independent Contracting",
        badge: "Active",
        summary:
          "Architecting and delivering production-ready web applications, responsive user interfaces, and custom frontend systems for independent clients and local business ventures.",
        narrative:
          "Operating as an independent software engineer handling end-to-end client projects. I engage directly with clients from initial discovery to deployment, ensuring every interface is responsive, accessible, and grounded in clean component architecture without extraneous technical debt.",
        responsibilities: [
          "Translating client user stories and design specifications into modular React and TypeScript applications.",
          "Implementing modern layout architectures with responsive CSS, semantic HTML5, and strict WCAG AA contrast compliance.",
          "Conducting manual test passes across mobile, tablet, and desktop viewports to catch layout shifts and form submission errors.",
          "Integrating third-party APIs, managing client data flow, and configuring clean production deployments.",
        ],
        keyHighlights: [
          "Delivered custom responsive web applications with 100% on-time milestone completion.",
          "Refined cross-browser compatibility across Chrome, Safari, Firefox, and Edge engines.",
          "Authored maintainable, component-driven codebases with zero external library bloat.",
        ],
        skills: [
          "React",
          "TypeScript",
          "Tailwind CSS",
          "REST APIs",
          "Git & GitHub",
          "Responsive Layout",
          "Manual QA",
        ],
      },
      {
        id: "exp-02",
        period: "FEB 2026 – MAY 2026",
        role: "IT Support Intern",
        company: "RGS Recovery Management and Collection Services Inc.",
        type: "Enterprise Internship",
        badge: "Completed",
        summary:
          "Delivered technical support, hardware/software diagnostics, network maintenance, and system documentation in a high-volume enterprise recovery management environment.",
        narrative:
          "Served as an IT Support Intern providing frontline hardware, network, and application troubleshooting for internal staff. Assisted the IT department in maintaining high operational uptime, logging service tickets, managing workstation rollouts, and verifying routine database operations.",
        responsibilities: [
          "Diagnosed and resolved hardware issues, local network outages, printer setups, and desktop software errors for staff across departments.",
          "Documented troubleshooting procedures, step-by-step resolution guides, and hardware inventory logs to standardize internal ticketing.",
          "Assisted database administrators in running routine verification scripts, managing access permissions, and auditing backup schedules.",
          "Configured new employee workstations with company-approved operating systems, security patches, and localized network permissions.",
        ],
        keyHighlights: [
          "Maintained an average ticket resolution turnaround time under 30 minutes for urgent workstation issues.",
          "Streamlined the peripheral and workstation onboarding checklist for incoming operational teams.",
          "Praised by senior supervisors for methodical diagnostic reasoning and prompt user communication.",
        ],
        skills: [
          "Hardware Diagnostics",
          "Network Troubleshooting",
          "System Administration",
          "Database Support",
          "IT Asset Tracking",
          "Technical Documentation",
        ],
      },
      {
        id: "exp-03",
        period: "JUNE 2022 – JUNE 2026",
        role: "Bachelor of Science in Information Systems",
        company:
          "Camarines Norte State College (University of Camarines Norte)",
        institution:
          "Camarines Norte State College (University of Camarines Norte)",
        type: "Undergraduate Degree",
        badge: "Graduated",
        summary:
          "Comprehensive 4-year degree covering Systems Analysis and Design, Enterprise Architecture, Capstone Projects, Software Quality Assurance, and Computer Programming.",
        narrative:
          "Completed a four-year Bachelor of Science in Information Systems curriculum combining technical software development with strategic enterprise workflows. Served as project lead and QA tester on multiple academic web portals, database management projects, and capstone software initiatives.",
        responsibilities: [
          "Completed in-depth coursework in Systems Analysis & Design (SAD), Capstone Project 1 & 2, and Software Quality Assurance (SQA).",
          "Led capstone project development, serving as the frontend developer and lead tester for institutional information systems.",
          "Authored test matrices, entity-relationship diagrams (ERDs), data-flow diagrams (DFDs), and architectural documentation.",
          "Collaborated with student developer teams in building full-stack web and desktop prototypes using PHP, JavaScript, SQL, and C#.",
        ],
        keyHighlights: [
          "Successfully defended Capstone Thesis project on institutional management systems.",
          "Consistent academic standing in core technical programming and systems engineering courses.",
          "Active participant in collegiate programming seminars and information technology workshops.",
        ],
        skills: [
          "Systems Analysis",
          "Software QA",
          "Database Design",
          "SQL",
          "Enterprise Architecture",
          "UML & ERD",
          "Agile SDLC",
        ],
      },
    ] as ExperienceItem[],

    workflows: [
      {
        step: "01",
        title: "Requirement Analysis & Edge-Case Discovery",
        subtitle: "Scoping, Spec Audit & Invariant Matrix",
        shortSummary:
          "Deconstructing user stories into concrete acceptance criteria, boundary constraints, and visual invariants.",
        objective:
          "Eliminate ambiguity early before writing code by defining what success and failure look like across all user interaction paths.",
        architectureDetails: [
          "Audit user stories and break them down into discrete functional test cases.",
          "Identify boundary limits: empty states, character limits, invalid inputs, and network latency states.",
          "Establish accessibility baseline: keyboard focus navigation, screen reader labels, and WCAG AA contrast.",
          "Draft initial technical contract and determine dependencies with zero extraneous bloat.",
        ],
        deliverables: [
          "Requirements traceability checklist",
          "Boundary condition & edge-case matrix",
          "Accessibility & viewport verification roadmap",
        ],
        techUsed: [
          "Figma",
          "User Stories",
          "Markdown Specs",
          "Edge-Case Matrix",
        ],
        metrics: "100% Pre-development Acceptance Criteria Coverage",
      },
      {
        step: "02",
        title: "Architecture & Component-Driven Prototyping",
        subtitle: "Modular State, Token System & Zero-Pill Hierarchy",
        shortSummary:
          "Structuring reusable, component-driven interfaces with strict token discipline, responsive math, and clean state separation.",
        objective:
          "Build scalable frontend code with high cohesion, minimal coupling, and predictable data flow from parent to child components.",
        architectureDetails: [
          "Establish design tokens: CSS custom properties for spacing, typography, and grayscale surfaces.",
          "Enforce single-responsibility components with isolated CSS module boundaries.",
          "Implement defensive component states: loading skeleton, error fallback, and zero-data states.",
          "Ensure fluid responsiveness from 360px mobile viewports up to 1440px desktop baselines.",
        ],
        deliverables: [
          "Component library with isolated CSS modules",
          "Design token system (light & dark theme calibrated)",
          "Interactive prototype with working state handlers",
        ],
        techUsed: [
          "React",
          "TypeScript",
          "CSS Modules",
          "Vite",
          "Design Tokens",
        ],
        metrics: "0 External Component Libraries Needed",
      },
      {
        step: "03",
        title: "Systematic Verification & Manual QA",
        subtitle: "Exploratory Testing, Defect Triage & Edge Validation",
        shortSummary:
          "Executing rigorous manual test passes, validating user flows, inspecting DOM behavior, and logging structured bug reports.",
        objective:
          "Detect layout defects, broken handlers, and state regressions before deployment through methodical human testing.",
        architectureDetails: [
          "Execute positive and negative test cases against every interactive control and input field.",
          "Perform viewport stress testing across mobile, tablet, and desktop breakpoints.",
          "Inspect browser console and network panel to verify error handling and payload validity.",
          "Log structured defects with exact reproduction steps, expected vs. actual behavior, and severity ranking.",
        ],
        deliverables: [
          "Severity-ranked defect log with reproduction steps",
          "Cross-browser and cross-device verification matrix",
          "Pass/Fail acceptance test run report",
        ],
        techUsed: [
          "Chrome DevTools",
          "Playwright",
          "Test Matrices",
          "Defect Logs",
        ],
        metrics: "Zero Uncaught Functional Regressions",
      },
      {
        step: "04",
        title: "Production Hardening, CI/CD & Delivery",
        subtitle:
          "Performance Auditing, Bundle Optimization & Polished Release",
        shortSummary:
          "Optimizing bundle sizes, eliminating unused assets, verifying smooth transitions, and delivering clean code to the client.",
        objective:
          "Guarantee seamless production execution, fast load times, and effortless long-term maintainability for the project.",
        architectureDetails: [
          "Run production build compilation and strict TypeScript type-checking (`tsc --noEmit`).",
          "Audit Lighthouse scores for Performance, Accessibility, and Best Practices.",
          "Verify smooth compositor-only animations (`transform`, `opacity`) under 200ms.",
          "Deliver organized git repository with clean commit history, README setup guide, and documentation.",
        ],
        deliverables: [
          "Production-ready minified build bundle",
          "Lighthouse audit verification report",
          "Comprehensive client handover documentation",
        ],
        techUsed: [
          "Git & GitHub",
          "Vite Build",
          "Lighthouse",
          "TypeScript Linter",
        ],
        metrics: "Sub-Second Initial Load & Zero Build Errors",
      },
    ] as WorkflowPhase[],

    services: [
      {
        number: "01",
        title: "Front-End Web Development",
        category: "ENGINEERING",
        summary:
          "Custom, responsive web applications engineered with modern React, TypeScript, fluid CSS modules, and meticulous visual craft.",
        description:
          "I construct bespoke, component-driven user interfaces tailored to your project goals. Every screen is designed for speed, fluidity, and cross-browser durability with zero reliance on bloated templates.",
        scope: [
          "Single-Page Application (SPA) development with React & TypeScript",
          "Component architecture & design token integration",
          "Responsive layouts tailored from 360px mobile to 1440px desktop",
          "Theme switching (light & dark mode with WCAG AA compliance)",
          "REST API consumption & client-side state management",
        ],
        deliverables: [
          "Production-ready source code repository",
          "Responsive, accessible web application",
          "Component documentation & deployment guide",
        ],
        tools: [
          "React",
          "TypeScript",
          "Tailwind CSS",
          "CSS Modules",
          "Vite",
          "Git",
        ],
      },
      {
        number: "02",
        title: "Quality Assurance & Manual Testing",
        category: "TESTING",
        summary:
          "Systematic functional testing, test case design, exploratory defect detection, and actionable severity-ranked bug reporting.",
        description:
          "I stress-test web applications from a user and technical standpoint to uncover edge-case defects, UI misalignments, and state failure modes before real users encounter them.",
        scope: [
          "Comprehensive test case creation with acceptance criteria",
          "Manual regression passes & exploratory user flow verification",
          "Form validation, edge-case input, and boundary condition checks",
          "Cross-browser compatibility testing (Chrome, Safari, Firefox, Edge)",
          "Detailed defect logs with exact steps to reproduce and screenshots",
        ],
        deliverables: [
          "Structured test plan & execution matrices",
          "Defect reports ranked by severity and priority",
          "Pre-release quality sign-off summary",
        ],
        tools: [
          "Manual Testing",
          "Test Case Design",
          "Bug Triage",
          "Chrome DevTools",
          "Playwright",
        ],
      },
      {
        number: "03",
        title: "Web & DOM Inspection",
        category: "ANALYSIS",
        summary:
          "In-depth inspection of DOM elements, CSS layout debugging, console error resolution, and network payload verification.",
        description:
          "I dig into the underlying browser runtime to diagnose and resolve layout shifts, unhandled exceptions, slow network calls, and accessibility oversights.",
        scope: [
          "DOM tree inspection and CSS specificity conflict resolution",
          "Console warning & unhandled promise rejection triage",
          "Network waterfall inspection for slow or failing endpoints",
          "Accessibility audit (ARIA roles, keyboard traps, focus rings)",
          "Layout shift & responsiveness debugging across viewports",
        ],
        deliverables: [
          "Technical inspection report with root-cause analysis",
          "Targeted code patches & CSS fixes",
          "Accessibility & performance optimization recommendations",
        ],
        tools: [
          "Chrome DevTools",
          "DOM Inspector",
          "Network Profiler",
          "Console Debugging",
          "Lighthouse",
        ],
      },
      {
        number: "04",
        title: "Technical Support & IT Maintenance",
        category: "SUPPORT",
        summary:
          "Workstation setup, hardware diagnostics, local network troubleshooting, system documentation, and operational IT assistance.",
        description:
          "Drawing from hands-on enterprise IT support experience, I troubleshoot hardware setups, network configurations, operating systems, and routine database tasks for smooth daily operations.",
        scope: [
          "Desktop & peripheral hardware diagnostics and troubleshooting",
          "Local network setup, Wi-Fi configuration, and connectivity checks",
          "Operating system setup, software deployment, and patch updates",
          "Step-by-step IT troubleshooting guides and system manuals",
          "Database backup verification & routine administrative support",
        ],
        deliverables: [
          "Hardware/software diagnostic resolution logs",
          "Standard operating procedure (SOP) documentation",
          "Asset inventory & workstation configuration checklists",
        ],
        tools: [
          "Hardware Diagnostics",
          "Network Utilities",
          "Windows/Linux",
          "Database Tools",
          "Technical Documentation",
        ],
      },
    ] as ServiceItem[],

    status: "final" as const,
  },

  // Backward compatibility alias for legacy imports
  process: {
    sectionNumber: "",
    sectionTitle: "PROFESSIONAL OVERVIEW",
    faintWatermark: "OVERVIEW",
    intro:
      "Engineering Discipline, Practical Experience & Specialized Services",
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
      "Inquiries regarding Web development and QA opportunities, or projects.",
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
