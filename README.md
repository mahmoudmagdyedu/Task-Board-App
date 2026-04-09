# 📋 TaskFlow — Interactive Kanban Task Board

A modern, interactive Kanban-style task board built with **TypeScript**, **HTML5**, and **Tailwind CSS**. Manage your tasks visually with drag-and-drop functionality, form validation, and persistent local storage.

> 🟢 **Stage 2 Project** — Part of my progressive Full Stack Developer portfolio journey, focusing on TypeScript fundamentals.

## 🌐 Live Demo

**[👉 View Live on GitHub Pages](https://mahmoudmagdyedu.github.io/Task-Board-App/)**

## ✨ Features

- **Kanban Board** — Three columns: To Do, In Progress, Done
- **Drag & Drop** — Move tasks between columns with native HTML5 drag-and-drop API
- **Add / Edit / Delete Tasks** — Full CRUD with modal form
- **Form Validation** — TypeScript-powered real-time validation with error messages
- **Priority Levels** — Low, Medium, High with color-coded badges
- **Local Storage** — Tasks persist across browser sessions
- **Task Counter** — Real-time count per column
- **Responsive Design** — Mobile-first layout with Tailwind CSS
- **Smooth Animations** — CSS transitions for a polished UX
- **Type-Safe Code** — Full TypeScript with interfaces, enums, and strict typing

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **TypeScript** | Type-safe application logic, interfaces, enums |
| **HTML5** | Semantic markup, drag-and-drop API |
| **Tailwind CSS** | Utility-first responsive styling |
| **LocalStorage API** | Client-side data persistence |

## 📂 Project Structure

```
Task-Board-App/
├── .github/workflows/deploy-pages.yml
├── src/app.ts
├── dist/app.js
├── index.html
├── tsconfig.json
├── package.json
└── README.md
```

## 🚀 Getting Started

### Option 1: Direct Browser (No Build)
```bash
git clone https://github.com/mahmoudmagdyedu/Task-Board-App.git
cd Task-Board-App
open index.html
```

### Option 2: With TypeScript Compilation
```bash
npm install
npm run build
npm run watch
```

## 🗺️ Roadmap

- [x] Core Kanban board layout
- [x] Drag-and-drop functionality
- [x] Task CRUD operations
- [x] Form validation
- [x] Local storage persistence
- [x] Priority levels
- [ ] Due dates with calendar picker
- [ ] Search & filter tasks
- [ ] Dark mode toggle
- [ ] Export/Import tasks (JSON)

## 👨‍💻 Author

**Mahmoud Magdy** — Full Stack Developer
[Portfolio](https://mahmoudmagdyedu.github.io/My-Portfolio/) · [GitHub](https://github.com/mahmoudmagdyedu)

## 📄 License

MIT License
