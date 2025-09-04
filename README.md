# COOU Connect 🎓

A dynamic social networking platform designed exclusively for the students of Chukwuemeka Odumegwu Ojukwu University (COOU). This application serves as a central hub for students to connect, share updates, and interact in a familiar campus environment. Built with modern web technologies and powered by Firebase, it offers a seamless and real-time user experience.

## ✨ Features

-   **User Authentication**: Secure registration and login system for students.
-   **Real-time News Feed**: Create posts with text and images. View, like, and comment on posts from other students.
-   **Student Profiles**: View and edit personal profiles, including name, department, level, and profile picture.
-   **Friend System**: Find other students, send connection requests, and manage your friends list.
-   **Instant Messaging**: Engage in private, one-on-one chats with friends, complete with typing indicators and image sharing.
-   **Admin Dashboard**: A dedicated panel for administrators to manage the community, including verifying student profiles.
-   **User Discovery**: Easily search for other students by name or department to expand your network.
-   **Email Notifications**: Receive email alerts for new posts, likes, and comments to stay engaged.

## 🛠️ Technologies Used

| Technology | Description |
| :--- | :--- |
| **HTML5** | Core structure and content of the web pages. |
| **CSS3** | Custom styling for a modern and responsive user interface. |
| **JavaScript (ES6)** | Handles all client-side logic, interactivity, and API communication. |
| **Firebase** | Backend-as-a-Service for Auth, Firestore Database, and real-time data synchronization. |
| **Cloudinary** | Manages media uploads for profile pictures and post images. |
| **EmailJS** | Powers the client-side email notification system. |

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need a web browser and a local web server to handle module imports correctly. The [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code is a great option.

### Installation

1.  Clone the repository to your local machine:
    ```bash
    git clone https://github.com/Chukwudebere-ferd/COOU-CONNECT.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd COOU-CONNECT-MVP
    ```
3.  Launch the `index.html` file using a live server. If you're using the VS Code extension, you can simply right-click the `index.html` file and select "Open with Live Server".

### Configuration

The project uses Firebase, Cloudinary, and EmailJS. The configuration keys are currently hardcoded in the JavaScript files for demonstration purposes.

-   **Firebase**: The `firebaseConfig` object can be found in each `js/*.js` file.
-   **Cloudinary**: The `cloudName` and `uploadPreset` variables are located in `js/dashboard.js`.
-   **EmailJS**: The service and template IDs are in `js/dashboard.js`.

For a production environment, it is recommended to manage these keys using environment variables.

## Usage

Once the application is running, you can explore its features:

1.  **Register/Login**: Open the application and you'll be greeted with the authentication page (`index.html`). You can create a new account or sign in with existing credentials.
2.  **Dashboard**: After logging in, you are directed to the main dashboard (`dashboard.html`). Here you can:
    -   Create a new post with text and an optional image.
    -   Scroll through the feed to see posts from other users.
    -   Like and comment on any post.
3.  **Manage Your Profile**: Click your name in the top-right corner to open the profile panel. From here, you can view your details, edit your profile, upload a new photo, or sign out.
4.  **Find Students**: Navigate to the 'Users' tab to see a list of all students on the platform. You can search for specific users and send them a connection request.
5.  **Chat with Friends**: Go to the 'Chat' tab to see a list of your conversations. Click on a user to open the chat room (`chatRoom.html`) and start messaging in real-time.

## 👤 Author

**Chukwudebere Ferdinard**

