// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import Booking from "./pages/Booking";

// export default function App() {
//   const token = localStorage.getItem("token");

//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Navigate to="/login" />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<Signup />} />

//         <Route
//           path="/booking"
//           element={token ? <Booking /> : <Navigate to="/login" replace />}
//         />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// // // App.jsx
// // import React from 'react';
// // import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// // import Login from './pages/Login';
// // import Signup from './pages/Signup';
// // import Booking from './pages/Booking';
// // import VerifyEmail from './pages/VerifyEmail';

// // function App() {
// //   return (
// //     <Router>
// //       <Routes>
// //         <Route path="/" element={<Navigate to="/login" />} />
// //         <Route path="/login" element={<Login />} />
// //         <Route path="/signup" element={<Signup />} />
// //         <Route path="/booking" element={<Booking />} />
// //         <Route path="/verify-email/:token" element={<VerifyEmail />} />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // export default App;

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Booking from "./pages/Booking";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected route */}
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
