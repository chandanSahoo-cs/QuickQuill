export const templates = [
  {
    id: "blank",
    label: "Blank document",
    imageUrl: "/blank-document.svg",
    initialContent: "<p></p>",
  },
  {
    id: "software-proposal",
    label: "Software Development proposal",
    imageUrl: "/software-proposal.svg",
    initialContent: `
      <h1>Software Development Proposal</h1>
      <p><strong>Client:</strong> [Client Name]</p>
      <p><strong>Prepared by:</strong> [Your Name]</p>
      <h2>Project Overview</h2>
      <p>Describe the software goals, features, and deliverables...</p>
      <h2>Timeline</h2>
      <ul><li>Phase 1 - Research</li><li>Phase 2 - Development</li><li>Phase 3 - Testing</li></ul>
      <h2>Budget</h2>
      <p>Estimated cost: $____</p>
    `,
  },
  {
    id: "project-proposal",
    label: "Project proposal",
    imageUrl: "/project-proposal.svg",
    initialContent: `
      <h1>Project Proposal</h1>
      <p><strong>Title:</strong> [Project Title]</p>
      <h2>Introduction</h2>
      <p>Provide an overview of the problem and proposed solution...</p>
      <h2>Objectives</h2>
      <ul><li>Objective 1</li><li>Objective 2</li></ul>
      <h2>Expected Outcome</h2>
      <p>Summarize the desired results and impact of the project.</p>
    `,
  },
  {
    id: "business-letter",
    label: "Buisness letter",
    imageUrl: "/business-letter.svg",
    initialContent: `
      <p>[Your Name]</p>
      <p>[Your Address]</p>
      <p>[Date]</p>
      <p>[Recipient Name]</p>
      <p>[Recipient Address]</p>
      <p>Dear [Recipient Name],</p>
      <p>I am writing to...</p>
      <p>Sincerely,<br/>[Your Name]</p>
    `,
  },
  {
    id: "resume",
    label: "Resume",
    imageUrl: "/resume.svg",
    initialContent: `
      <h1>[Your Name]</h1>
      <p><strong>Email:</strong> you@example.com | <strong>Phone:</strong> 123-456-7890</p>
      <h2>Professional Summary</h2>
      <p>A short summary of your experience and goals...</p>
      <h2>Experience</h2>
      <p><strong>Job Title</strong> - Company Name (Year - Year)</p>
      <ul><li>Responsibility 1</li><li>Responsibility 2</li></ul>
      <h2>Education</h2>
      <p>Degree - School Name (Year)</p>
    `,
  },
  {
    id: "cover-letter",
    label: "Cover letter",
    imageUrl: "/cover-letter.svg",
    initialContent: `
      <p>[Your Name]</p>
      <p>[Your Address]</p>
      <p>[Date]</p>
      <p>[Hiring Manager Name]</p>
      <p>[Company Name]</p>
      <p>Dear [Hiring Manager],</p>
      <p>I am excited to apply for the [Position Name] role at [Company Name].</p>
      <p>Thank you for your time and consideration.</p>
      <p>Sincerely,<br/>[Your Name]</p>
    `,
  },
  {
    id: "letter",
    label: "Letter",
    imageUrl: "/letter.svg",
    initialContent: `
      <p>[Your Address]</p>
      <p>[Date]</p>
      <p>Dear [Recipient],</p>
      <p>I hope this letter finds you well. I am writing to...</p>
      <p>Warm regards,<br/>[Your Name]</p>
    `,
  },
];
