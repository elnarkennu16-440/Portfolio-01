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
  status?: "placeholder" | "final";
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
    // Honest list: support 1 to 4 projects. Edit these when you have real project links!
    projects: [
      {
        id: "project-01",
        number: "01",
        title: "MIRAMS — Manufacturing Internal Request & Asset Management",
        role: "Full-Stack Developer & QA",
        year: "2026",
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
        status: "final" as const,
      },
      {
        id: "project-02",
        number: "02",
        title: "NCAMIS — Senior High School Management Information System",
        role: "QA Tester & Web Developer",
        year: "2025",
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
        status: "final" as const,
      },
      {
        id: "project-03",
        number: "03",
        title: "NobleClassics — Full-Featured E-Commerce Bookstore",
        role: "Full-Stack Developer",
        year: "2024",
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
        status: "final" as const,
      },
    ] as ProjectItem[],
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
              "Crafting responsive, accessible layouts with modern semantic markup and CSS architecture.",
            level: "Using",
          },
          {
            name: "JavaScript (ES6+)",
            description:
              "Developing dynamic client-side logic, event-driven workflows, and asynchronous API integrations.",
            level: "Using",
          },
          {
            name: "React & Tailwind CSS",
            description:
              "Building modular, component-driven UI architectures with scalable utility styling and state management.",
            level: "Using",
          },
          {
            name: "TypeScript",
            description:
              "Enforcing static typing, strict interface contracts, and maintainable enterprise-level code.",
            level: "Learning",
          },
          {
            name: "Python",
            description:
              "Scripting algorithmic logic, lightweight utility backends, and data processing automation.",
            level: "Learning",
          },
        ],
      },
      {
        category: "QA & Testing",
        items: [
          {
            name: "Functional & Regression Testing",
            description:
              "Executing comprehensive manual test suites to validate functional requirements and product stability.",
            level: "Using",
          },
          {
            name: "Test Case Architecture",
            description:
              "Designing detailed test scenarios, boundary conditions, and acceptance criteria matrices.",
            level: "Using",
          },
          {
            name: "Defect Lifecycle & Triage",
            description:
              "Documenting detailed reproduction steps, network telemetry, and severity-ranked bug reports.",
            level: "Using",
          },
          {
            name: "Playwright",
            description:
              "Implementing automated end-to-end regression suites and cross-browser interaction testing.",
            level: "Learning",
          },
          {
            name: "API & Contract Testing",
            description:
              "Validating endpoint schemas, HTTP status response integrity, and backend payload contracts.",
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
              "Managing collaborative trunk-based workflows, feature branches, and pull request code reviews.",
            level: "Using",
          },
          {
            name: "VS Code & Cursor",
            description:
              "Optimized workspace configuration for rapid full-stack debugging, linting, and development flow.",
            level: "Using",
          },
          {
            name: "Chrome DevTools",
            description:
              "Inspecting DOM hierarchies, profiling network traffic, and debugging runtime console issues.",
            level: "Using",
          },
          {
            name: "Postman",
            description:
              "Constructing, testing, and debugging RESTful API endpoints and authentication headers.",
            level: "Using",
          },
          {
            name: "Vite & Modern Tooling",
            description:
              "Configuring lightning-fast build pipelines, hot module replacement, and modern asset bundling.",
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
