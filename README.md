# QuickQuill: Real-Time Editor with Git-like Version Control

## Overview
A powerful, real-time collaborative editor designed to streamline teamwork on documents and code. Built with Next.js and styled with Shadcn UI, it offers a seamless live editing experience coupled with robust Git-like version control and an integrated diff checker.

## Features
- **Real-time Collaboration**: Multiple users can edit the same document simultaneously, with changes reflected instantly for all collaborators (powered by Liveblocks)

![Home Page](/home-page.png)
![Document Page](/document-page.png)

- **Git-like Version Control**:
  - Commit History: Track all committed versions of your document
  - Version Snapshots: Easily revert to previous states or compare any two committed versions
- **Integrated Diff Checker**: Visually compare changes between versions using the Longest Common Subsequence (LCS) algorithm
- **Notion-like Slash Commands**: Intuitive `/commands` for quickly inserting elements and formatting text
- **Next.js Framework**: Server-side rendering (SSR) and static site generation (SSG) support
- **Shadcn UI**: Modern, accessible component library built on Radix UI and Tailwind CSS
- **Intuitive UI**: Clean, user-friendly interface for optimal editing experience

![Diff Checker](/diff-checker.png)
![Version Control](/version-control.png)

## Technologies Used
### Frontend:
- Next.js (React Framework)
- Shadcn UI (Component Library)
- Tailwind CSS (Utility-first CSS framework)
- TipTap (Extensible rich text editor)
  - Custom TipTap Extensions for slash commands
- Liveblocks (Real-time collaboration infrastructure)

### Backend:
- Convex (Full-stack platform)

### Version Control:
- Custom Git-like implementation storing document snapshots
- LCS algorithm for diff comparisons

## Usage
1. **Create/Open a Document**:
   - Navigate to the editor interface
   - Create new documents or open existing ones

2. **Collaborate in Real-time**:
   - Share document URL with collaborators
   - See instant updates from all users

3. **Use Slash Commands**:
   - Type `/` to access formatting options and content blocks

4. **Commit Changes**:
   - Click "Commit" button when satisfied with changes
   - Add descriptive commit message

5. **View Version History**:
   - Access "History" panel to see all committed versions

6. **Compare Versions**:
   - Select any two versions from history
   - View side-by-side or inline comparison with highlighted differences
   - Option to revert to selected versions
