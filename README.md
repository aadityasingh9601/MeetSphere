
# MeetSphere

MeetSphere is a real-time peer-to-peer (P2P) video calling application that allows users to connect with each other through video and audio. It includes features like real-time chat, screen sharing, and secure user authentication.

## Features

- **Real-Time Video and Audio:** High-quality, low-latency video and audio communication using WebRTC.
- **Secure User Authentication:** Secure user registration and login system with session management.
- **Peer-to-Peer Connection:** Direct P2P connection between users for enhanced privacy and performance.
- **Real-Time Chat:** A chat feature that allows users to send and receive messages during a video call.
- **Screen Sharing:** Users can share their screen with others in the call.
- **Meeting History:** Users can view a history of their past meetings.
- **Responsive Design:** The application is designed to be responsive and work on different screen sizes.

## Tech Stack

### Frontend

- **HTML5 & CSS3:** For the structure and styling of the application.
- **EJS:** A simple templating language that lets you generate HTML markup with plain JavaScript.
- **JavaScript:** For the client-side logic of the application.
- **Socket.IO Client:** For real-time, bidirectional event-based communication.

### Backend

- **Node.js & Express.js:** For building the backend server and REST APIs.
- **Socket.IO:** For enabling real-time communication between clients and the server.
- **MongoDB & Mongoose:** As the database for storing user data and meeting history.
- **bcrypt:** For hashing user passwords before storing them in the database.
- **express-session:** For managing user sessions.
- **connect-flash:** For displaying flash messages.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- **Node.js** and **npm** installed on your machine.
- **MongoDB** installed and running.

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/aadityasingh9601/MeetSphere.git
   ```
2. **Navigate to the backend directory and install the dependencies:**
    ```sh
    cd backend
    npm install
    ```
3. **Create a `.env` file in the `backend` directory and add the following environment variables:**
    ```
    MONGO_URL=your_mongodb_connection_string
    COOKIE_SECRET=your_cookie_secret
    ```
4. **Start the server:**
    ```sh
    npm run dev
    ```
The application should now be running on `http://localhost:3000`.

## Project Structure

```
MeetSphere/
├── backend/
│   ├── controllers/      # Contains the application's logic
│   ├── models/           # Contains the database models
│   ├── public/           # Contains the static assets (CSS, JS, images)
│   ├── routes/           # Contains the application's routes
│   ├── views/            # Contains the EJS templates
│   ├── .env.example      # Example environment file
│   ├── package.json      # Contains the project's dependencies
│   └── server.js         # The main server file
└── README.md             # This file
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

Project Link: [https://meetsphere.onrender.com/]