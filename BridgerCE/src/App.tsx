
import { authenticateUser } from "./oauth";
import googleLogo from "./assets/googlelogo.png";

function App() {
  const handleAuthClick = () => {
    console.log("Button clicked!");
    console.log("Chrome object available:", typeof chrome !== 'undefined');
    console.log("Chrome identity available:", typeof chrome !== 'undefined' && !!chrome.identity);
    
    try {
      authenticateUser();
    } catch (error) {
      console.error("Error in authentication:", error);
      alert("An error occurred during authentication. Please check the console for details.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={handleAuthClick} style={{ padding: 10, backgroundColor: "#f2f2f2", color: "black", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", borderRadius: "40px", fontSize: "12px" }}>
        <img style={{width: 20, height: 20}} src={googleLogo} alt="google" />
        Sign in with Google
      </button>
    </div>
  );
}

export default App;
