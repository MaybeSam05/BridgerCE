export async function authenticateUser(): Promise<void> {
    console.log("authenticateUser function called");
    
    // Check if we're in a Chrome extension environment
    if (typeof chrome === 'undefined' || !chrome.identity) {
      console.error("Chrome extension APIs not available. This function only works in a Chrome extension.");
      alert("This function only works in a Chrome extension. Please load this as an extension in Chrome.");
      return;
    }
    
    console.log("Chrome extension APIs are available, proceeding with authentication...");

    chrome.identity.getAuthToken({ 
      interactive: true,
      scopes: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile", 
        "https://www.googleapis.com/auth/gmail.send"
      ]
    }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error("Auth Error:", chrome.runtime.lastError);
        return;
      }
  
      console.log("OAuth Token:", token);
  
      try {
        // Get user's profile info (name and email)
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
  
        if (!profileRes.ok) {
          const errorBody = await profileRes.text();
          throw new Error(`Profile request failed: ${profileRes.status} ${profileRes.statusText} - ${errorBody}`);
        }
  
        const profile = await profileRes.json();
        console.log("User Profile:", profile); // includes name and email
        
        // Extract the data you need
        const userEmail = profile.email;
        const userName = profile.name;
        
        console.log("User Email:", userEmail);
        console.log("User Name:", userName);
        
        // Save user data to Chrome storage
        const userData = {
          email: userEmail,
          name: userName,
          token: token,
          userTXT: null, // Placeholder for userTXT
          lastUpdated: new Date().toISOString()
        };
        
        chrome.storage.local.set({ userData }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error saving to storage:", chrome.runtime.lastError);
          } else {
            console.log("User data saved to Chrome storage successfully!");
          }
        });
        
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    });
  }

// Function to retrieve stored user data
export function getStoredUserData(): Promise<{
  email: string;
  name: string;
  token: string;
  userTXT?: string;
  lastUpdated: string;
} | null> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['userData'], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.userData || null);
      }
    });
  });
}

// Function to clear stored user data (for logout)
export function clearStoredUserData(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(['userData'], () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        console.log("User data cleared from storage");
        resolve();
      }
    });
  });
}
  