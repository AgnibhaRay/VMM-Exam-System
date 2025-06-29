# 🎯 VMM Security Exam System

A modern, professional web application built with Next.js for conducting security assessment examinations. This system provides a seamless experience for both administrators and candidates, featuring real-time exam taking, automatic grading, and downloadable certificates.

## ✨ Key Features

### 🔐 Security & Authentication
- Secure Firebase Authentication
- Role-based access control (Admin/Candidate)
- Protected routes and secure session management
- Tab switch detection for exam integrity

### 👨‍💼 Admin Features
- Create and manage examinations
- Set custom exam duration and passing criteria
- View candidate results and performance analytics
- Monitor ongoing examinations

### 👨‍🎓 Candidate Features
- User-friendly examination interface
- Real-time countdown timer
- Automatic submission on time completion
- Instant result generation
- Downloadable PDF certificates for successful completion

### 💻 Technical Features
- Built with Next.js 14 and TypeScript
- Real-time updates with Firebase
- Responsive design with Tailwind CSS
- Dark mode support
- Professional PDF certificate generation

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Firebase (Authentication, Firestore)
- **Styling**: Tailwind CSS, Mobile-First Design
- **PDF Generation**: html2canvas, jsPDF
- **Development Tools**: ESLint, PostCSS

## 🎮 Core Features

### For Candidates
- 📝 Take exams with a beautiful, distraction-free interface
- ⏱️ Real-time countdown timer
- 🚫 Anti-cheating measures with tab switch detection
- 📊 Instant results and performance analysis

### For Admins
- ✏️ Create and manage exams with ease
- 📋 Set custom passing criteria
- 👥 View candidate results and performance
- 📈 Track examination statistics

## 💻 Getting Started

```bash
# Clone the repository
git clone https://github.com/AgnibhaRay/VMM-Exam-System.git

# Navigate to the project directory
cd VMM-Exam-System

# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env.local
# Add your Firebase configuration to .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the magic! ✨

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🔐 Security Features

- Secure Firebase Authentication
- Protected API routes and endpoints
- Role-based access control
- Secure session management
- Anti-cheating measures
- Real-time monitoring

## 📱 Responsive Design

The application is fully responsive and optimized for:
- 📱 Mobile devices (< 640px)
- 💻 Tablets (641px - 1024px)
- 🖥️ Desktop (> 1024px)

## 🤝 Contributing

Got ideas to make this even better? We'd love to hear them! Feel free to:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This is an open-source project created for educational and demonstration purposes only. This application is not affiliated with or endorsed by Vishal Mega Mart. No copyright infringement intended.

## 🙏 Acknowledgments

- Built with ❤️ by [Agnibha Ray](https://github.com/AgnibhaRay)
- Powered by Next.js and Firebase
- Thanks to the open-source community

---

**Note**: This is an educational project and is not affiliated with or endorsed by Vishal Mega Mart. No copyright infringement intended.
