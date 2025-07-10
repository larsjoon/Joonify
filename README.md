# Joonify - The Soul of Intelligent Software

![Joonify Screenshot](https://placehold.co/1200x600/0a191f/e5e7eb?text=Joonify%20Landing%20Page)

This repository contains the source code for the Joonify landing page, a visually engaging and responsive single-page website. The project was originally built with React and has been translated into pure HTML, CSS, and JavaScript, maintaining its modern aesthetic and interactive features.

The design philosophy is centered around a "golden ratio" layout, a generative particle animation background, and subtle animations to create a professional and polished user experience.

---

## ✨ Features

-   **Generative Particle Animation:** A dynamic, lightweight background animation created with JavaScript's Canvas API.
-   **Golden Ratio Layout:** The main content is structured using the golden ratio (approximately 1.618:1) for a visually balanced and aesthetically pleasing design on larger screens.
-   **Responsive Design:** Fully responsive layout that adapts seamlessly to desktops, tablets, and mobile devices.
-   **Fade-in Animations:** Smooth, staggered fade-in and slide-up animations for content elements on page load.
-   **Minimalist Tech Stack:** Built with vanilla HTML, CSS, and JavaScript, making it lightweight, fast, and easy to deploy.
-   **Lucide Icons:** Clean and modern SVG icons for social media links.

---

## 🛠️ Tech Stack

-   **HTML5:** For the core structure and content of the webpage.
-   **CSS3:** For all styling, including layout (Flexbox), animations, and responsive design (Media Queries).
-   **JavaScript (ES6+):** For the particle animation logic and triggering CSS animations.
-   **Lucide Icons:** An open-source icon library used for the footer icons.

---

## 📂 File Structure

The project is organized into three main files, promoting a clear separation of concerns:


.

├── 📄 index.html      # The main HTML file with the page structure.

├── 🎨 style.css       # All CSS rules for styling and responsiveness.

└── ⚙️ script.js       # JavaScript for the canvas animation and interactions.


---

## 🚀 How to Use

To get a local copy up and running, simply follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/joonify-landing-page.git](https://github.com/your-username/joonify-landing-page.git)
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd joonify-landing-page
    ```

3.  **Open `index.html` in your browser:**
    You can do this by double-clicking the `index.html` file or by using a live server extension in your code editor (like "Live Server" for VS Code) to automatically reload the page on changes.

---

## 🎨 Customization

It's easy to customize the content and appearance of the page.

### Content:

-   **Text:** Open `index.html` and edit the text within the `<h1>`, `<p>`, and `<h2>` tags.
-   **Contact Information:** Update the `mailto:` links and the KVK number in the footer section of `index.html`.
-   **Social Links:** Change the `href="#"` attributes in the footer's `<a>` tags to your social media profile URLs.

### Styling:

-   **Colors:** Key color variables are defined at the top of `style.css`. You can change the background, text, and highlight colors there.
-   **Fonts:** The default system font stack is used. You can change this by modifying the `font-family` property in the `body` selector in `style.css`.
-   **Particle Animation:** Adjust the particle `speed`, `size`, `color`, or connection `distance` in the `script.js` file.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by Joonify
</p>
