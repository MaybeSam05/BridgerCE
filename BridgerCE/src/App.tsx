import { authenticateUser, getStoredUserData, clearStoredUserData } from "./oauth";
import googleLogo from "./assets/googlelogo.png";
import textNoBG from "./assets/textNoBG.png";
import { useState, useEffect } from "react";

function App() {
  const [userData, setUserData] = useState<any>(null);

  // Load stored user data when component mounts
  useEffect(() => {
    getStoredUserData()
      .then((data) => {
        if (data) {
          setUserData(data);
          console.log("Loaded stored user data:", data);
        }
      })
      .catch((error) => {
        console.error("Error loading stored data:", error);
      });
  }, []);

  const handleAuthClick = () => {
    console.log("Button clicked!");
    console.log("Chrome object available:", typeof chrome !== 'undefined');
    console.log("Chrome identity available:", typeof chrome !== 'undefined' && !!chrome.identity);
    
    try {
      authenticateUser();
      // Refresh user data after authentication
      setTimeout(() => {
        getStoredUserData()
          .then((data) => {
            if (data) {
              setUserData(data);
            }
          })
          .catch((error) => {
            console.error("Error loading stored data:", error);
          });
      }, 1000); // Wait a bit for storage to be updated
    } catch (error) {
      console.error("Error in authentication:", error);
      alert("An error occurred during authentication. Please check the console for details.");
    }
  };

  const handleLogout = () => {
    clearStoredUserData()
      .then(() => {
        setUserData(null);
        console.log("User logged out");
      })
      .catch((error) => {
        console.error("Error clearing data:", error);
      });
  };

  return (
    <div style={{ minHeight: "300px", minWidth: "320px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "none", padding: 0 }}>
      {!userData ? (
        <>
          {/* Logo at the top */}
          <div style={{ marginBottom: "24px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img 
              src={textNoBG} 
              alt="Bridger Logo" 
              style={{ width: "120px", height: "auto", marginBottom: "8px" }} 
            />
            <p style={{ fontSize: "14px", color: "#666", margin: 0, fontStyle: "italic" }}>
              LinkedIn Automation Tool
            </p>
          </div>
          {/* Sign in button (user's custom style) */}
          <button
            onClick={handleAuthClick}
            style={{
              padding: 10,
              backgroundColor: "#f2f2f2",
              color: "black",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "40px",
              fontSize: "12px",
              border: "none",
              margin: 0
            }}
          >
            <img style={{ width: 20, height: 20 }} src={googleLogo} alt="google" />
            Sign in with Google
          </button>
        </>
      ) : (
        <div style={{ textAlign: "center", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Logo at the top */}
          <div style={{ marginBottom: "20px" }}>
            <img 
              src={textNoBG} 
              alt="Bridger Logo" 
              style={{ width: "100px", height: "auto", marginBottom: "8px" }} 
            />
          </div>
          <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Welcome, {userData.name}!</h3>
          <p style={{ margin: "5px 0", color: "#666" }}>Email: {userData.email}</p>
          <p style={{ fontSize: "10px", color: "#999", margin: "5px 0" }}>
            Last updated: {new Date(userData.lastUpdated).toLocaleString()}
          </p>
          <button
            onClick={handleLogout}
            style={{
              marginTop: "15px",
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
