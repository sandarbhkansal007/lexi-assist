# LexiAssist: The AI-Powered Legal Assistant

LexiAssist is a full-stack web application designed to be an AI-powered digital paralegal for lawyers. It automates legal research, case management, and document organization to streamline a lawyer's workflow.

## Live Demo

You can access the live, deployed application here:

[**https://lexiassist-zeta.vercel.app/**](https://lexiassist-zeta.vercel.app/)

## Screenshot
<img width="1919" height="1034" alt="image" src="https://github.com/user-attachments/assets/62a6250c-b3a6-4ae7-90c9-18bfd7fabfda" />
<img width="1919" height="1031" alt="image" src="https://github.com/user-attachments/assets/b784da58-9b68-454d-8b22-5be6c4919a53" />
<img width="1919" height="1026" alt="image" src="https://github.com/user-attachments/assets/12fdcc41-8c35-4b07-a47b-378749c5aa32" />

## Key Features

* **Client & Case Management:** Full CRUD (Create, Read, Update, Delete) functionality for all clients and their associated legal cases.
* **Smart Case Finder:** Integrates with the Google Gemini API (with search grounding) to find real-world, similar case precedents from the internet.
* **AI Case Summarizer:** Uses the Gemini API to instantly generate concise summaries of complex case descriptions.
* **Document Management:** Upload and manage case-specific documents (e.g., evidence, filings) for each case.
* **Hearing & Calendar Tracking:** Schedule, view, and manage all upcoming court hearings and deadlines.
* **Analytics Dashboard:** A high-level dashboard showing key metrics like total cases, win rate, and case distribution.
* **Secure Authentication:** JWT-based authentication for user login and registration.

## Tech Stack

* **Frontend:** React, Vite, Tailwind CSS
* **Backend:** Node.js, Express
* **Database:** MongoDB (with Mongoose)
* **Authentication:** JSON Web Tokens (JWT)
* **File Handling:** Multer
* **AI & Search:** Google Gemini API (with Google Search Grounding)
* **Deployment:**
    * **Frontend:** Vercel
    * **Backend:** Render
    * **Database:** MongoDB Atlas

## Getting Started (Local Installation)

To run this project on your local machine, follow these steps:

### Prerequisites

* Node.js (v18+)
* Git
* A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or a local MongoDB instance)
* A [Google Gemini API Key](https://ai.google.dev/pricing)

---

### 1. Clone the Repository

```bash
git clone [https://github.com/Ayushk00/LexiAssist]
cd LexiAssist
````

### 2\. Set Up the Backend

1.  Navigate to the backend directory:
    ```bash
    cd Backend
    ```
2.  Install all required npm packages:
    ```bash
    npm install
    npm install node-fetch@2
    ```
3.  Create a `.env` file in the `/backend` folder and add your secret keys. (See **Environment Variables** section below).
4.  Start the backend server:
    ```bash
    npm start
    ```
    Your backend will be running at `http://localhost:5000`.

### 3\. Set Up the Frontend

1.  Open a **new terminal** and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install all required npm packages:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `/frontend` folder. (See **Environment Variables** section below).
4.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    Your frontend will be running at `http://localhost:5173` (or similar) and will be connected to your local backend.

## Environment Variables

To run this project, you will need to create `.env` files in *both* the `frontend` and `backend` directories.

#### `backend/.env`

```
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
```

#### `frontend/.env`

```
VITE_API_URL=http://localhost:5000
```

## Deployment Architecture

This project is deployed as a full-stack application using a "split" architecture:

  * **Database:** MongoDB Atlas hosts the cloud database.
  * **Backend API:** The Node.js/Express app is deployed on **Render**.
  * **Frontend App:** The React app is deployed on **Vercel**, which connects to the Render API.

## License

This project is licensed under the MIT License.

```
```
